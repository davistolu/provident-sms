from django.contrib import admin
from .models import (
    AcademicSession, AcademicTerm, ClassLevel,
    TeacherProfile, ClassArm, Subject, TeacherSubjectAssignment
)

class AcademicTermInline(admin.TabularInline):
    model = AcademicTerm
    extra = 1

@admin.register(AcademicSession)
class AcademicSessionAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'start_date', 'end_date', 'is_current', 'created_at')
    list_filter = ('is_current', 'school')
    search_fields = ('name', 'school__name')
    inlines = [AcademicTermInline]

@admin.register(AcademicTerm)
class AcademicTermAdmin(admin.ModelAdmin):
    list_display = ('name', 'term_type', 'session', 'school', 'start_date', 'end_date', 'is_current')
    list_filter = ('term_type', 'is_current', 'school')
    search_fields = ('name', 'session__name', 'school__name')

class ClassArmInline(admin.TabularInline):
    model = ClassArm
    extra = 1

@admin.register(ClassLevel)
class ClassLevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'code', 'order_index', 'school')
    list_filter = ('category', 'school')
    search_fields = ('name', 'code', 'school__name')
    ordering = ('order_index', 'name')
    inlines = [ClassArmInline]

@admin.register(ClassArm)
class ClassArmAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'class_level', 'name', 'class_teacher', 'school')
    list_filter = ('class_level__category', 'school')
    search_fields = ('name', 'class_level__name', 'school__name')
    raw_id_fields = ('class_teacher', 'class_level')

@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'staff_id', 'qualification', 'specialization', 'phone', 'gender', 'is_active', 'school')
    list_filter = ('gender', 'is_active', 'school')
    search_fields = ('staff_id', 'user__first_name', 'user__last_name', 'user__email', 'qualification', 'school__name')
    raw_id_fields = ('user',)

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'category', 'is_active', 'school')
    list_filter = ('category', 'is_active', 'school')
    search_fields = ('name', 'code', 'school__name')

@admin.register(TeacherSubjectAssignment)
class TeacherSubjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'class_arm', 'academic_session', 'school')
    list_filter = ('academic_session', 'school')
    search_fields = ('teacher__user__first_name', 'teacher__user__last_name', 'subject__name', 'class_arm__name')
    raw_id_fields = ('teacher', 'subject', 'class_arm', 'academic_session')
