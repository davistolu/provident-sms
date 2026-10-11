from django.contrib import admin
from .models import AssessmentScheme, AssessmentComponent, GradingScale, GradeRule

class AssessmentComponentInline(admin.TabularInline):
    model = AssessmentComponent
    extra = 1

@admin.register(AssessmentScheme)
class AssessmentSchemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'max_total_score', 'is_default', 'school')
    list_filter = ('is_default', 'school')
    search_fields = ('name', 'school__name')
    inlines = [AssessmentComponentInline]

@admin.register(AssessmentComponent)
class AssessmentComponentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'scheme', 'max_score', 'order_index', 'school')
    list_filter = ('scheme', 'school')
    search_fields = ('name', 'code', 'school__name')
    ordering = ('scheme', 'order_index')

class GradeRuleInline(admin.TabularInline):
    model = GradeRule
    extra = 1

@admin.register(GradingScale)
class GradingScaleAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_default', 'school')
    list_filter = ('is_default', 'school')
    search_fields = ('name', 'school__name')
    inlines = [GradeRuleInline]

@admin.register(GradeRule)
class GradeRuleAdmin(admin.ModelAdmin):
    list_display = ('grade', 'grading_scale', 'min_score', 'max_score', 'grade_point', 'remark', 'order_index')
    list_filter = ('grading_scale', 'grade')
    ordering = ('grading_scale', '-min_score')
