from django.db import models
from apps.common.models import TenantModel

class Student(TenantModel):
    class GenderChoices(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'

    class StatusChoices(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        GRADUATED = 'GRADUATED', 'Graduated'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    admission_number = models.CharField(max_length=50, db_index=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GenderChoices.choices)
    blood_group = models.CharField(max_length=10, blank=True, default='')
    genotype = models.CharField(max_length=10, blank=True, default='')
    passport_photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)
    address = models.TextField(blank=True, default='')
    state_of_origin = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE, db_index=True)
    admission_date = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('school', 'admission_number')
        ordering = ['last_name', 'first_name']

    @property
    def full_name(self):
        if self.middle_name:
            return f"{self.last_name} {self.first_name} {self.middle_name}".strip()
        return f"{self.last_name} {self.first_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.admission_number})"

class Guardian(TenantModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=50, default='Parent')
    phone_primary = models.CharField(max_length=50)
    phone_secondary = models.CharField(max_length=50, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    occupation = models.CharField(max_length=100, blank=True, default='')
    address = models.TextField(blank=True, default='')

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.phone_primary})"

class StudentGuardian(TenantModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='guardian_relationships')
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='student_relationships')
    is_primary = models.BooleanField(default=True)
    is_emergency_contact = models.BooleanField(default=True)

    class Meta:
        unique_together = ('student', 'guardian')

class StudentEnrollment(TenantModel):
    class EnrollmentStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PROMOTED = 'PROMOTED', 'Promoted'
        REPEATED = 'REPEATED', 'Repeated'
        TRANSFERRED = 'TRANSFERRED', 'Transferred'
        GRADUATED = 'GRADUATED', 'Graduated'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    class_arm = models.ForeignKey('academics.ClassArm', on_delete=models.CASCADE, related_name='enrollments')
    academic_session = models.ForeignKey('academics.AcademicSession', on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=EnrollmentStatus.choices, default=EnrollmentStatus.ACTIVE)
    roll_number = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'academic_session')
        ordering = ['class_arm', 'student__last_name', 'student__first_name']

    def __str__(self):
        return f"{self.student.full_name} - {self.class_arm.display_name} ({self.academic_session.name})"
