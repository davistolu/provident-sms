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

    def perform_create(self, serializer):
        school = self.get_school()
        if hasattr(serializer.Meta.model, 'school'):
            serializer.save(school=school)
        else:
            serializer.save()
