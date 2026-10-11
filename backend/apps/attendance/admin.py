from django.contrib import admin
from .models import AttendanceSession, AttendanceRecord

class AttendanceRecordInline(admin.TabularInline):
    model = AttendanceRecord
    extra = 0
    raw_id_fields = ('student',)

@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ('class_arm', 'date', 'academic_session', 'academic_term', 'status', 'marked_by', 'school')
    list_filter = ('status', 'academic_session', 'academic_term', 'school')
    search_fields = ('class_arm__name', 'class_arm__class_level__name', 'school__name')
    date_hierarchy = 'date'
    inlines = [AttendanceRecordInline]

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'attendance_session', 'status', 'remarks')
    list_filter = ('status', 'attendance_session__academic_term')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number')
    raw_id_fields = ('student', 'attendance_session')
