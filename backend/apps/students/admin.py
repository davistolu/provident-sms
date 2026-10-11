from django.contrib import admin
from .models import Student, Guardian, StudentGuardian, StudentEnrollment

class StudentGuardianInline(admin.TabularInline):
    model = StudentGuardian
    extra = 1
    raw_id_fields = ('guardian',)

class StudentEnrollmentInline(admin.TabularInline):
    model = StudentEnrollment
    extra = 1
    raw_id_fields = ('class_arm', 'academic_session')

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('admission_number', 'last_name', 'first_name', 'gender', 'status', 'school', 'admission_date')
    list_filter = ('status', 'gender', 'school')
    search_fields = ('admission_number', 'first_name', 'last_name', 'school__name')
    readonly_fields = ('admission_number',)
    inlines = [StudentEnrollmentInline, StudentGuardianInline]

@admin.register(Guardian)
class GuardianAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'relationship', 'phone_primary', 'email', 'occupation', 'school')
    list_filter = ('relationship', 'school')
    search_fields = ('first_name', 'last_name', 'phone_primary', 'email', 'school__name')

@admin.register(StudentGuardian)
class StudentGuardianAdmin(admin.ModelAdmin):
    list_display = ('student', 'guardian', 'is_primary', 'is_emergency_contact', 'school')
    list_filter = ('is_primary', 'is_emergency_contact', 'school')
    raw_id_fields = ('student', 'guardian')

@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_arm', 'academic_session', 'status', 'roll_number', 'school')
    list_filter = ('status', 'academic_session', 'school')
    search_fields = ('student__admission_number', 'student__first_name', 'student__last_name', 'class_arm__name')
    raw_id_fields = ('student', 'class_arm', 'academic_session')
