from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolAdmin, IsSchoolMember, resolve_membership_for_request
from apps.schools.models import School, SchoolMembership, SchoolSettings
from apps.schools.serializers import SchoolSerializer, SchoolMembershipSerializer, SchoolSettingsSerializer

def get_school_context(request):
    school = getattr(request, 'school', None)
    if not school:
        membership = resolve_membership_for_request(request)
        if membership:
            school = membership.school
        elif request.user.is_authenticated and (request.user.is_superuser or request.user.is_staff):
            school_id = request.headers.get('X-School-ID')
            if school_id:
                school = School.objects.filter(id=school_id).first()
            if not school:
                school = School.objects.filter(is_active=True).first()
    return school

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.filter(is_active=True)
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return School.objects.all()
        return School.objects.filter(memberships__user=self.request.user, memberships__is_active=True)

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsSchoolAdmin], url_path='current')
    def current_school(self, request):
        school = get_school_context(request)
        if not school:
            return Response({'error': 'School not resolved'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'PATCH':
            serializer = SchoolSerializer(school, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        return Response(SchoolSerializer(school).data)

class SchoolMembershipViewSet(TenantScopedModelViewSet):
    queryset = SchoolMembership.objects.all().select_related('user')
    serializer_class = SchoolMembershipSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = self.get_school()
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        if search:
            qs = qs.filter(
                user__first_name__icontains=search
            ) | qs.filter(
                user__last_name__icontains=search
            ) | qs.filter(
                user__email__icontains=search
            )
        if role:
            qs = qs.filter(role=role)
        return qs

class SchoolSettingsViewSet(viewsets.ModelViewSet):
    queryset = SchoolSettings.objects.all()
    serializer_class = SchoolSettingsSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = get_school_context(self.request)
        if not school:
            return SchoolSettings.objects.none()
        return SchoolSettings.objects.filter(school=school)

    @action(detail=False, methods=['get', 'patch'], url_path='current')
    def current_settings(self, request):
        school = get_school_context(request)
        if not school:
            return Response({'error': 'School not resolved'}, status=status.HTTP_400_BAD_REQUEST)

        settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
        if request.method == 'PATCH':
            serializer = SchoolSettingsSerializer(settings_obj, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        return Response(SchoolSettingsSerializer(settings_obj).data)
