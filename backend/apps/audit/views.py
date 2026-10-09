from rest_framework import viewsets, permissions
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolAdmin
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer

class AuditLogViewSet(TenantScopedModelViewSet):
    queryset = AuditLog.objects.all().select_related('actor')
    serializer_class = AuditLogSerializer
    permission_classes = [IsSchoolAdmin]
    http_method_names = ['get', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        action_filter = self.request.query_params.get('action')
        entity_type = self.request.query_params.get('entity_type')
        if action_filter:
            qs = qs.filter(action=action_filter)
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        return qs
