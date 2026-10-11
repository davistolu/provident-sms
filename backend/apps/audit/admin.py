from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'entity_type', 'entity_id', 'actor', 'ip_address', 'school', 'created_at')
    list_filter = ('action', 'entity_type', 'school')
    search_fields = ('entity_id', 'entity_type', 'actor__email', 'actor__first_name', 'actor__last_name', 'ip_address')
    readonly_fields = ('actor', 'action', 'entity_type', 'entity_id', 'details', 'ip_address', 'school', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
