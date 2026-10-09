from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.attendance.views import AttendanceSessionViewSet

router = DefaultRouter()
router.register('sessions', AttendanceSessionViewSet, basename='attendance-session')

urlpatterns = [
    path('', include(router.urls)),
]
