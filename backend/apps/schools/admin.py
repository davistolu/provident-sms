from django.contrib import admin
from .models import School, SchoolMembership, SchoolSettings

class SchoolSettingsInline(admin.StackedInline):
    model = SchoolSettings
    can_delete = False
    extra = 0

class SchoolMembershipInline(admin.TabularInline):
    model = SchoolMembership
    extra = 1
    raw_id_fields = ('user',)

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'slug', 'city', 'state', 'country', 'currency_symbol', 'is_active', 'created_at')
    list_filter = ('is_active', 'country', 'state')
    search_fields = ('name', 'code', 'slug', 'email', 'phone')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [SchoolSettingsInline, SchoolMembershipInline]

@admin.register(SchoolMembership)
class SchoolMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'school', 'role', 'is_active', 'is_default', 'created_at')
    list_filter = ('role', 'is_active', 'is_default', 'school')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'school__name', 'school__code')
    raw_id_fields = ('user', 'school')

@admin.register(SchoolSettings)
class SchoolSettingsAdmin(admin.ModelAdmin):
    list_display = ('school', 'admission_number_prefix', 'invoice_prefix', 'receipt_prefix', 'grading_system', 'enable_positions')
    search_fields = ('school__name', 'school__code')
    raw_id_fields = ('school',)
