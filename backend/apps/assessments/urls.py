from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.assessments.views import (
    AssessmentSchemeViewSet, AssessmentComponentViewSet,
    GradingScaleViewSet, GradeRuleViewSet
)

router = DefaultRouter()
router.register('schemes', AssessmentSchemeViewSet, basename='assessment-scheme')
router.register('components', AssessmentComponentViewSet, basename='assessment-component')
router.register('grading-scales', GradingScaleViewSet, basename='grading-scale')
router.register('grade-rules', GradeRuleViewSet, basename='grade-rule')

urlpatterns = [
    path('', include(router.urls)),
]
