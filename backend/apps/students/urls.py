from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.students.views import StudentViewSet, GuardianViewSet, StudentEnrollmentViewSet

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('guardians', GuardianViewSet, basename='guardian')
router.register('enrollments', StudentEnrollmentViewSet, basename='student-enrollment')

urlpatterns = [
    path('', include(router.urls)),
]
