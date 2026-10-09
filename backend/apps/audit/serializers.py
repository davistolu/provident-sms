from rest_framework import serializers
from apps.audit.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)
    actor_email = serializers.CharField(source='actor.email', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_name', 'actor_email', 'action', 'action_display',
            'entity_type', 'entity_id', 'details', 'ip_address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
