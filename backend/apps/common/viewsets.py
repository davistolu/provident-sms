from rest_framework import viewsets, exceptions
from apps.common.permissions import IsSchoolMember, IsSchoolAdmin

class TenantScopedModelViewSet(viewsets.ModelViewSet):
    """
    Base ModelViewSet ensuring complete tenant isolation.
    - Filters all queries by the request's resolved school.
    - Sets school instance on new records automatically.
    - Prevents cross-tenant leaks.
    """
    permission_classes = [IsSchoolMember]

    def get_school(self):
        # Refresh membership resolution if not populated by middleware (e.g. token auth)
        if not getattr(self.request, 'school', None) and self.request.user.is_authenticated:
            from apps.schools.models import SchoolMembership
            school_id = self.request.headers.get('X-School-ID')
            qs = SchoolMembership.objects.filter(user=self.request.user, is_active=True).select_related('school')
            membership = qs.filter(school_id=school_id).first() if school_id else qs.first()
            if membership:
                self.request.school_membership = membership
                self.request.school = membership.school

        school = getattr(self.request, 'school', None)
        if not school and not self.request.user.is_superuser:
            raise exceptions.PermissionDenied("No active school membership found for this user.")
        return school

    def get_queryset(self):
        school = self.get_school()
        qs = super().get_queryset()
        if hasattr(qs.model, 'school'):
            return qs.filter(school=school)
        return qs

    def _get_client_ip(self):
        x_forwarded = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return self.request.META.get('REMOTE_ADDR')

    def _log_audit(self, action, model_name, entity_id, details=None):
        if model_name == 'AuditLog':
            return
        try:
            school = self.get_school()
            if not school:
                return
            from apps.audit.models import AuditLog
            actor = self.request.user if getattr(self.request, 'user', None) and self.request.user.is_authenticated else None
            AuditLog.objects.create(
                school=school,
                actor=actor,
                action=action,
                entity_type=model_name,
                entity_id=str(entity_id),
                details=details or {},
                ip_address=self._get_client_ip()
            )
        except Exception:
            pass

    def perform_create(self, serializer):
        school = self.get_school()
        if hasattr(serializer.Meta.model, 'school'):
            instance = serializer.save(school=school)
        else:
            instance = serializer.save()

        model_name = getattr(serializer.Meta.model, '__name__', 'Entity')
        self._log_audit(
            action='CREATE',
            model_name=model_name,
            entity_id=getattr(instance, 'id', ''),
            details={'message': f'Created new {model_name} record'}
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        model_name = getattr(serializer.Meta.model, '__name__', 'Entity')
        self._log_audit(
            action='UPDATE',
            model_name=model_name,
            entity_id=getattr(instance, 'id', ''),
            details={'message': f'Updated {model_name} record'}
        )

    def perform_destroy(self, instance):
        model_name = instance.__class__.__name__
        entity_id = str(getattr(instance, 'id', ''))
        instance.delete()
        self._log_audit(
            action='DELETE',
            model_name=model_name,
            entity_id=entity_id,
            details={'message': f'Deleted {model_name} record (ID: {entity_id})'}
        )
