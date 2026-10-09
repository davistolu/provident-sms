import uuid
from django.db import models
from apps.common.models import BaseModel

class School(BaseModel):
    name = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    slug = models.SlugField(max_length=255, unique=True)
    motto = models.CharField(max_length=255, blank=True, default='')
    logo = models.ImageField(upload_to='school_logos/', blank=True, null=True)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, default='Nigeria')
    timezone = models.CharField(max_length=100, default='Africa/Lagos')
    currency = models.CharField(max_length=10, default='NGN')
    currency_symbol = models.CharField(max_length=10, default='₦')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class SchoolMembership(BaseModel):
    class RoleChoices(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Administrator'
        ADMIN = 'ADMIN', 'School Administrator'
        PRINCIPAL = 'PRINCIPAL', 'Principal / Head of School'
        TEACHER = 'TEACHER', 'Teacher'
        BURSAR = 'BURSAR', 'Bursar / Accountant'

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='memberships', db_index=True)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='school_memberships', db_index=True)
    role = models.CharField(max_length=30, choices=RoleChoices.choices, default=RoleChoices.TEACHER)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=True)

    class Meta:
        unique_together = ('school', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.school.name} ({self.role})"

class SchoolSettings(BaseModel):
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='settings')
    enable_positions = models.BooleanField(default=True, help_text="Compute and display student ranking/positions on results")
    grading_system = models.CharField(max_length=50, default='STANDARD')
    academic_calendar_type = models.CharField(max_length=50, default='THREE_TERM')
    receipt_prefix = models.CharField(max_length=20, default='REC')
    invoice_prefix = models.CharField(max_length=20, default='INV')
    admission_number_prefix = models.CharField(max_length=20, default='SMS')

    def __str__(self):
        return f"Settings for {self.school.name}"
