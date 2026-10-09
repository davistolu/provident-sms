from rest_framework import viewsets, permissions
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolAdmin, IsSchoolMember
from apps.academics.models import (
    AcademicSession, AcademicTerm, ClassLevel, TeacherProfile, ClassArm,
    Subject, TeacherSubjectAssignment
)
from apps.academics.serializers import (
    AcademicSessionSerializer, AcademicTermSerializer, ClassLevelSerializer,
    TeacherProfileSerializer, ClassArmSerializer, SubjectSerializer,
    TeacherSubjectAssignmentSerializer
)

class AcademicSessionViewSet(TenantScopedModelViewSet):
    queryset = AcademicSession.objects.all().prefetch_related('terms')
    serializer_class = AcademicSessionSerializer
    permission_classes = [IsSchoolMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]

class AcademicTermViewSet(TenantScopedModelViewSet):
    queryset = AcademicTerm.objects.all().select_related('session')
    serializer_class = AcademicTermSerializer
    permission_classes = [IsSchoolMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]

class ClassLevelViewSet(TenantScopedModelViewSet):
    queryset = ClassLevel.objects.all().prefetch_related('arms')
    serializer_class = ClassLevelSerializer
    permission_classes = [IsSchoolMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]

class TeacherProfileViewSet(TenantScopedModelViewSet):
    queryset = TeacherProfile.objects.all().select_related('user')
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsSchoolAdmin]

class ClassArmViewSet(TenantScopedModelViewSet):
    queryset = ClassArm.objects.all().select_related('class_level', 'class_teacher__user')
    serializer_class = ClassArmSerializer
    permission_classes = [IsSchoolMember]

    def get_queryset(self):
        qs = super().get_queryset()
        level_id = self.request.query_params.get('class_level')
        if level_id:
            qs = qs.filter(class_level_id=level_id)
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]

class SubjectViewSet(TenantScopedModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsSchoolMember]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]

class TeacherSubjectAssignmentViewSet(TenantScopedModelViewSet):
    queryset = TeacherSubjectAssignment.objects.all().select_related(
        'teacher__user', 'subject', 'class_arm__class_level', 'academic_session'
    )
    serializer_class = TeacherSubjectAssignmentSerializer
    permission_classes = [IsSchoolMember]

    def get_queryset(self):
        qs = super().get_queryset()
        teacher_id = self.request.query_params.get('teacher')
        class_arm_id = self.request.query_params.get('class_arm')
        session_id = self.request.query_params.get('session')
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if class_arm_id:
            qs = qs.filter(class_arm_id=class_arm_id)
        if session_id:
            qs = qs.filter(academic_session_id=session_id)
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]
