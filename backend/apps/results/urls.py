from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.results.views import AssessmentSubmissionViewSet, StudentTermResultViewSet

router = DefaultRouter()
router.register('submissions', AssessmentSubmissionViewSet, basename='assessment-submission')
router.register('term-results', StudentTermResultViewSet, basename='student-term-result')

urlpatterns = [
    path('', include(router.urls)),
]
