from rest_framework import viewsets, permissions
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolAdmin, IsSchoolMember
from apps.assessments.models import AssessmentScheme, AssessmentComponent, GradingScale, GradeRule
from apps.assessments.serializers import (
    AssessmentSchemeSerializer, AssessmentComponentSerializer,
    GradingScaleSerializer, GradeRuleSerializer
)

class AssessmentSchemeViewSet(TenantScopedModelViewSet):
    queryset = AssessmentScheme.objects.all().prefetch_related('components')
    serializer_class = AssessmentSchemeSerializer
    permission_classes = [IsSchoolMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]

class AssessmentComponentViewSet(TenantScopedModelViewSet):
    queryset = AssessmentComponent.objects.all()
    serializer_class = AssessmentComponentSerializer
    permission_classes = [IsSchoolAdmin]

class GradingScaleViewSet(TenantScopedModelViewSet):
    queryset = GradingScale.objects.all().prefetch_related('rules')
    serializer_class = GradingScaleSerializer
    permission_classes = [IsSchoolMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]

class GradeRuleViewSet(TenantScopedModelViewSet):
    queryset = GradeRule.objects.all()
    serializer_class = GradeRuleSerializer
    permission_classes = [IsSchoolAdmin]
