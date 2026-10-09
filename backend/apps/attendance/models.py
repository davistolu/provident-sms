from django.db import models
from apps.common.models import TenantModel

class AttendanceSession(TenantModel):
    class StatusChoices(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted'

    class_arm = models.ForeignKey('academics.ClassArm', on_delete=models.CASCADE, related_name='attendance_sessions')
    academic_session = models.ForeignKey('academics.AcademicSession', on_delete=models.CASCADE, related_name='attendance_sessions')
    academic_term = models.ForeignKey('academics.AcademicTerm', on_delete=models.CASCADE, related_name='attendance_sessions')
    date = models.DateField(db_index=True)
    marked_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.DRAFT)

    class Meta:
        unique_together = ('class_arm', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Attendance: {self.class_arm.display_name} on {self.date}"

class AttendanceRecord(TenantModel):
    class StatusChoices(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        LATE = 'LATE', 'Late'
        EXCUSED = 'EXCUSED', 'Excused'

    attendance_session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PRESENT)
    remarks = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        unique_together = ('attendance_session', 'student')
        ordering = ['student__last_name', 'student__first_name']

    def __str__(self):
        return f"{self.student.full_name}: {self.get_status_display()}"
