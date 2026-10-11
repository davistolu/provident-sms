from django.contrib import admin
from .models import AssessmentSubmission, StudentScore, StudentTermResult

class StudentScoreInline(admin.TabularInline):
    model = StudentScore
    extra = 0
    raw_id_fields = ('student',)

@admin.register(AssessmentSubmission)
class AssessmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('subject', 'class_arm', 'academic_session', 'academic_term', 'status', 'submitted_by', 'reviewed_by', 'school')
    list_filter = ('status', 'academic_session', 'academic_term', 'school')
    search_fields = ('subject__name', 'class_arm__name', 'class_arm__class_level__name', 'school__name')
    raw_id_fields = ('class_arm', 'subject', 'academic_session', 'academic_term', 'submitted_by', 'reviewed_by')
    inlines = [StudentScoreInline]

@admin.register(StudentScore)
class StudentScoreAdmin(admin.ModelAdmin):
    list_display = ('student', 'submission', 'total_score', 'grade', 'remark', 'school')
    list_filter = ('grade', 'school')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number', 'submission__subject__name')
    raw_id_fields = ('submission', 'student')

@admin.register(StudentTermResult)
class StudentTermResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_arm', 'academic_session', 'academic_term', 'average_score', 'position_in_class', 'is_published', 'school')
    list_filter = ('is_published', 'academic_session', 'academic_term', 'school')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number', 'class_arm__name')
    raw_id_fields = ('student', 'class_arm', 'academic_session', 'academic_term')
