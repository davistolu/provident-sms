from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolMember, IsSchoolAdmin
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.attendance.serializers import AttendanceSessionSerializer, AttendanceRecordSerializer
from apps.students.models import StudentEnrollment
from apps.academics.models import ClassArm, AcademicSession, AcademicTerm

class AttendanceSessionViewSet(TenantScopedModelViewSet):
    queryset = AttendanceSession.objects.all().select_related(
        'class_arm__class_level', 'academic_session', 'academic_term', 'marked_by'
    ).prefetch_related('records__student')
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsSchoolMember]

    def get_queryset(self):
        qs = super().get_queryset()
        class_arm_id = self.request.query_params.get('class_arm')
        date_param = self.request.query_params.get('date')
        term_id = self.request.query_params.get('term')

        if class_arm_id:
            qs = qs.filter(class_arm_id=class_arm_id)
        if date_param:
            qs = qs.filter(date=date_param)
        if term_id:
            qs = qs.filter(academic_term_id=term_id)
        return qs

    @action(detail=False, methods=['post'], url_path='mark-roster')
    def mark_roster(self, request):
        """
        Retrieves or initializes an attendance session for a class on a date,
        returning all enrolled students with their current status.
        """
        school = self.get_school()
        class_arm_id = request.data.get('class_arm_id')
        date_str = request.data.get('date') or timezone.now().date().isoformat()
        session_id = request.data.get('academic_session_id')
        term_id = request.data.get('academic_term_id')

        if not class_arm_id:
            return Response({'error': 'class_arm_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        class_arm = ClassArm.objects.filter(school=school, id=class_arm_id).first()
        if not class_arm:
            return Response({'error': 'Class arm not found'}, status=status.HTTP_404_NOT_FOUND)

        active_session = AcademicSession.objects.filter(school=school, id=session_id).first() if session_id else AcademicSession.objects.filter(school=school, is_current=True).first()
        active_term = AcademicTerm.objects.filter(school=school, id=term_id).first() if term_id else AcademicTerm.objects.filter(school=school, is_current=True).first()

        if not active_session or not active_term:
            return Response({'error': 'No active academic session or term found.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create attendance session
        att_session, created = AttendanceSession.objects.get_or_create(
            school=school,
            class_arm=class_arm,
            date=date_str,
            defaults={
                'academic_session': active_session,
                'academic_term': active_term,
                'marked_by': request.user,
                'status': AttendanceSession.StatusChoices.DRAFT,
            }
        )

        # Get all enrolled active students
        enrollments = StudentEnrollment.objects.filter(
            school=school,
            class_arm=class_arm,
            status='ACTIVE'
        ).select_related('student')

        # Ensure records exist for all enrolled students
        existing_records = {r.student_id: r for r in att_session.records.all()}
        for enr in enrollments:
            if enr.student_id not in existing_records:
                AttendanceRecord.objects.create(
                    school=school,
                    attendance_session=att_session,
                    student=enr.student,
                    status=AttendanceRecord.StatusChoices.PRESENT
                )

        # Return session with records
        att_session.refresh_from_db()
        return Response(AttendanceSessionSerializer(att_session).data)

    @action(detail=False, methods=['post'], url_path='save-register')
    def save_register(self, request):
        """
        Atomically updates student attendance records and marks the session as SUBMITTED or DRAFT.
        """
        school = self.get_school()
        session_id = request.data.get('session_id')
        records_data = request.data.get('records', [])
        status_val = request.data.get('status', AttendanceSession.StatusChoices.SUBMITTED)

        att_session = AttendanceSession.objects.filter(school=school, id=session_id).first()
        if not att_session:
            return Response({'error': 'Attendance session not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            for rec in records_data:
                student_id = rec.get('student_id') or rec.get('student')
                status_code = rec.get('status', 'PRESENT')
                remarks = rec.get('remarks', '')

                AttendanceRecord.objects.filter(
                    school=school,
                    attendance_session=att_session,
                    student_id=student_id
                ).update(status=status_code, remarks=remarks)

            att_session.status = status_val
            att_session.marked_by = request.user
            att_session.save()

        att_session.refresh_from_db()
        return Response({
            'status': 'success',
            'session': AttendanceSessionSerializer(att_session).data
        })
