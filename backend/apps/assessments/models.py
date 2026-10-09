from django.db import models
from apps.common.models import TenantModel

class AssessmentScheme(TenantModel):
    name = models.CharField(max_length=150, help_text="e.g. Standard 30% CA + 70% Exam")
    max_total_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', 'name']

    def __str__(self):
        return f"{self.name} (Max: {self.max_total_score})"

    def save(self, *args, **kwargs):
        if self.is_default:
            AssessmentScheme.objects.filter(school=self.school, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

class AssessmentComponent(TenantModel):
    scheme = models.ForeignKey(AssessmentScheme, on_delete=models.CASCADE, related_name='components')
    name = models.CharField(max_length=100, help_text="e.g. First CA, Second CA, Terminal Exam")
    code = models.CharField(max_length=30, help_text="e.g. CA1, CA2, EXAM")
    max_score = models.DecimalField(max_digits=5, decimal_places=2, help_text="Maximum achievable score")
    order_index = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('scheme', 'code')
        ordering = ['order_index', 'name']

    def __str__(self):
        return f"{self.name} ({self.code}: {self.max_score} marks)"

class GradingScale(TenantModel):
    name = models.CharField(max_length=150, help_text="e.g. Standard WAEC / Secondary Grading")
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_default:
            GradingScale.objects.filter(school=self.school, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def get_grade_for_score(self, score):
        """Authoritative grade lookup based on score."""
        if score is None:
            return None
        rule = self.rules.filter(min_score__lte=score, max_score__gte=score).order_index_asc() if hasattr(self.rules, 'order_index_asc') else self.rules.filter(min_score__lte=score, max_score__gte=score).first()
        return rule

class GradeRule(TenantModel):
    grading_scale = models.ForeignKey(GradingScale, on_delete=models.CASCADE, related_name='rules')
    grade = models.CharField(max_length=10, help_text="e.g. A, B, C, D, E, F or A1, B2, C4")
    min_score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2)
    grade_point = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    remark = models.CharField(max_length=100, help_text="e.g. Distinction, Credit, Pass, Fail")
    order_index = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('grading_scale', 'grade')
        ordering = ['-min_score']

    def __str__(self):
        return f"{self.grade} ({self.min_score}-{self.max_score}): {self.remark}"
