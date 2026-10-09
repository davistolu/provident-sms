from rest_framework import viewsets, permissions
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolAdmin, IsSchoolMember
from apps.schools.models import School, SchoolMembership, SchoolSettings
from apps.schools.serializers import SchoolSerializer, SchoolMembershipSerializer, SchoolSettingsSerializer

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.filter(is_active=True)
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return School.objects.all()
        return School.objects.filter(memberships__user=self.request.user, memberships__is_active=True)

class SchoolMembershipViewSet(TenantScopedModelViewSet):
    queryset = SchoolMembership.objects.all()
    serializer_class = SchoolMembershipSerializer
    permission_classes = [IsSchoolAdmin]

class SchoolSettingsViewSet(viewsets.ModelViewSet):
    queryset = SchoolSettings.objects.all()
    serializer_class = SchoolSettingsSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        return SchoolSettings.objects.filter(school=self.request.school)
