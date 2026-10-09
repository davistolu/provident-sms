from django.db import models
from apps.common.models import TenantModel

class AssessmentSubmission(TenantModel):
    class StatusChoices(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted for Review'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Returned for Corrections'
        PUBLISHED = 'PUBLISHED', 'Published'

    class_arm = models.ForeignKey('academics.ClassArm', on_delete=models.CASCADE, related_name='assessment_submissions')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='assessment_submissions')
    academic_session = models.ForeignKey('academics.AcademicSession', on_delete=models.CASCADE, related_name='assessment_submissions')
    academic_term = models.ForeignKey('academics.AcademicTerm', on_delete=models.CASCADE, related_name='assessment_submissions')
    assessment_scheme = models.ForeignKey('assessments.AssessmentScheme', on_delete=models.SET_NULL, null=True, related_name='submissions')
    grading_scale = models.ForeignKey('assessments.GradingScale', on_delete=models.SET_NULL, null=True, related_name='submissions')
    submitted_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='submitted_assessments')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.DRAFT, db_index=True)
    feedback_notes = models.TextField(blank=True, default='')
    reviewed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_assessments')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('class_arm', 'subject', 'academic_session', 'academic_term')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.subject.name} - {self.class_arm.display_name} ({self.academic_term.name}) [{self.get_status_display()}]"

class StudentScore(TenantModel):
    submission = models.ForeignKey(AssessmentSubmission, on_delete=models.CASCADE, related_name='scores')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='scores')
    component_scores = models.JSONField(default=dict, help_text="e.g. {'CA1': 10, 'CA2': 10, 'EXAM': 65}")
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    grade = models.CharField(max_length=10, blank=True, default='')
    remark = models.CharField(max_length=50, blank=True, default='')
    teacher_comment = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        unique_together = ('submission', 'student')
        ordering = ['student__last_name', 'student__first_name']

    def __str__(self):
        return f"{self.student.full_name}: {self.total_score} ({self.grade})"

class StudentTermResult(TenantModel):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='term_results')
    class_arm = models.ForeignKey('academics.ClassArm', on_delete=models.CASCADE, related_name='term_results')
    academic_session = models.ForeignKey('academics.AcademicSession', on_delete=models.CASCADE, related_name='term_results')
    academic_term = models.ForeignKey('academics.AcademicTerm', on_delete=models.CASCADE, related_name='term_results')
    total_marks_obtained = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    total_marks_possible = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    position_in_class = models.PositiveIntegerField(null=True, blank=True)
    total_students_in_class = models.PositiveIntegerField(default=0)
    teacher_comment = models.TextField(blank=True, default='')
    principal_comment = models.TextField(blank=True, default='')
    attendance_present = models.PositiveIntegerField(default=0)
    attendance_total = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'academic_session', 'academic_term')
        ordering = ['class_arm', '-average_score']

    def __str__(self):
        return f"{self.student.full_name} - {self.academic_term.name} ({self.average_score}%)"
