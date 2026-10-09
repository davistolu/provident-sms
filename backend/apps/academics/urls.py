from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.academics.views import (
    AcademicSessionViewSet, AcademicTermViewSet, ClassLevelViewSet,
    TeacherProfileViewSet, ClassArmViewSet, SubjectViewSet,
    TeacherSubjectAssignmentViewSet
)

router = DefaultRouter()
router.register('sessions', AcademicSessionViewSet, basename='academic-session')
router.register('terms', AcademicTermViewSet, basename='academic-term')
router.register('class-levels', ClassLevelViewSet, basename='class-level')
router.register('teachers', TeacherProfileViewSet, basename='teacher-profile')
router.register('class-arms', ClassArmViewSet, basename='class-arm')
router.register('subjects', SubjectViewSet, basename='subject')
router.register('assignments', TeacherSubjectAssignmentViewSet, basename='teacher-assignment')

urlpatterns = [
    path('', include(router.urls)),
]
