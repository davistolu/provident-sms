from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.schools.views import SchoolViewSet, SchoolMembershipViewSet, SchoolSettingsViewSet
from apps.schools.dashboard_views import AdminDashboardStatsView, TeacherDashboardStatsView

router = DefaultRouter()
router.register('schools', SchoolViewSet, basename='school')
router.register('memberships', SchoolMembershipViewSet, basename='school-membership')
router.register('settings', SchoolSettingsViewSet, basename='school-settings')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/admin/', AdminDashboardStatsView.as_view(), name='admin-dashboard-stats'),
    path('dashboard/teacher/', TeacherDashboardStatsView.as_view(), name='teacher-dashboard-stats'),
]
