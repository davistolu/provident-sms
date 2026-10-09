from django.db import models
from apps.common.models import TenantModel

class AcademicSession(TenantModel):
    name = models.CharField(max_length=50, help_text="e.g. 2024/2025")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = ('school', 'name')
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} ({self.school.name})"

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicSession.objects.filter(school=self.school, is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

class AcademicTerm(TenantModel):
    class TermChoices(models.TextChoices):
        FIRST_TERM = 'FIRST_TERM', 'First Term'
        SECOND_TERM = 'SECOND_TERM', 'Second Term'
        THIRD_TERM = 'THIRD_TERM', 'Third Term'

    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name='terms')
    term_type = models.CharField(max_length=30, choices=TermChoices.choices)
    name = models.CharField(max_length=50, help_text="e.g. First Term")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = ('session', 'term_type')
        ordering = ['start_date']

    def __str__(self):
        return f"{self.session.name} - {self.get_term_type_display()}"

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicTerm.objects.filter(school=self.school, is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

class ClassLevel(TenantModel):
    class CategoryChoices(models.TextChoices):
        NURSERY = 'NURSERY', 'Nursery / Pre-School'
        PRIMARY = 'PRIMARY', 'Primary School'
        JUNIOR_SECONDARY = 'JUNIOR_SECONDARY', 'Junior Secondary School'
        SENIOR_SECONDARY = 'SENIOR_SECONDARY', 'Senior Secondary School'

    name = models.CharField(max_length=100, help_text="e.g. Primary 1, JSS 1, SS 2")
    code = models.CharField(max_length=50, blank=True, default='')
    category = models.CharField(max_length=30, choices=CategoryChoices.choices, default=CategoryChoices.PRIMARY)
    order_index = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('school', 'name')
        ordering = ['order_index', 'name']

    def __str__(self):
        return self.name

class TeacherProfile(TenantModel):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='teacher_profiles')
    staff_id = models.CharField(max_length=50, help_text="Unique staff ID within school")
    qualification = models.CharField(max_length=150, blank=True, default='')
    specialization = models.CharField(max_length=150, blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    gender = models.CharField(max_length=20, choices=[('MALE', 'Male'), ('FEMALE', 'Female')], default='MALE')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('school', 'staff_id')
        ordering = ['user__first_name', 'user__last_name']

    def __str__(self):
        return f"{self.user.full_name} ({self.staff_id})"

class ClassArm(TenantModel):
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name='arms')
    name = models.CharField(max_length=50, blank=True, default='', help_text="e.g. Gold, Blue, A, or empty")
    class_teacher = models.ForeignKey(TeacherProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_classes')

    class Meta:
        unique_together = ('class_level', 'name')
        ordering = ['class_level__order_index', 'name']

    @property
    def display_name(self):
        if self.name:
            return f"{self.class_level.name} {self.name}".strip()
        return self.class_level.name

    def __str__(self):
        return self.display_name

class Subject(TenantModel):
    class CategoryChoices(models.TextChoices):
        GENERAL = 'GENERAL', 'General / Core'
        SCIENCES = 'SCIENCES', 'Sciences'
        ARTS_HUMANITIES = 'ARTS_HUMANITIES', 'Arts & Humanities'
        COMMERCIAL = 'COMMERCIAL', 'Commercial / Business'
        VOCATIONAL = 'VOCATIONAL', 'Vocational / Technical'
        LANGUAGES = 'LANGUAGES', 'Languages'

    name = models.CharField(max_length=150, help_text="e.g. Mathematics, English Language")
    code = models.CharField(max_length=30, blank=True, default='', help_text="e.g. MTH, ENG")
    category = models.CharField(max_length=30, choices=CategoryChoices.choices, default=CategoryChoices.GENERAL)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('school', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})" if self.code else self.name

class TeacherSubjectAssignment(TenantModel):
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='subject_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='teacher_assignments')
    class_arm = models.ForeignKey(ClassArm, on_delete=models.CASCADE, related_name='teacher_subject_assignments')
    academic_session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name='teacher_assignments')

    class Meta:
        unique_together = ('teacher', 'subject', 'class_arm', 'academic_session')
        ordering = ['class_arm__class_level__order_index', 'subject__name']

    def __str__(self):
        return f"{self.teacher.user.full_name} -> {self.subject.name} ({self.class_arm.display_name})"
