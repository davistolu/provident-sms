from django.db import models
from apps.common.models import TenantModel

class AuditLog(TenantModel):
    class ActionChoices(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        SUBMIT = 'SUBMIT', 'Submit'
        APPROVE = 'APPROVE', 'Approve'
        REJECT = 'REJECT', 'Reject'
        PUBLISH = 'PUBLISH', 'Publish'
        PAYMENT = 'PAYMENT', 'Payment Recorded'
        REVERSAL = 'REVERSAL', 'Reversal'

    actor = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    action = models.CharField(max_length=20, choices=ActionChoices.choices, db_index=True)
    entity_type = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=100)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        actor_name = self.actor.full_name if self.actor else "System"
        return f"[{self.get_action_display()}] {self.entity_type} ({self.entity_id}) by {actor_name}"
