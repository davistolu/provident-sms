from rest_framework import serializers
from apps.assessments.models import AssessmentScheme, AssessmentComponent, GradingScale, GradeRule

class AssessmentComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentComponent
        fields = ['id', 'scheme', 'name', 'code', 'max_score', 'order_index']
        read_only_fields = ['id']

class AssessmentSchemeSerializer(serializers.ModelSerializer):
    components = AssessmentComponentSerializer(many=True, read_only=True)

    class Meta:
        model = AssessmentScheme
        fields = ['id', 'name', 'max_total_score', 'is_default', 'components', 'created_at']
        read_only_fields = ['id', 'created_at']

class GradeRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeRule
        fields = ['id', 'grading_scale', 'grade', 'min_score', 'max_score', 'grade_point', 'remark', 'order_index']
        read_only_fields = ['id']

class GradingScaleSerializer(serializers.ModelSerializer):
    rules = GradeRuleSerializer(many=True, read_only=True)

    class Meta:
        model = GradingScale
        fields = ['id', 'name', 'is_default', 'rules', 'created_at']
        read_only_fields = ['id', 'created_at']
