from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from django.db.models import Sum, Count, Q
from apps.common.permissions import IsSchoolMember, IsSchoolAdmin
from apps.students.models import Student, StudentEnrollment
from apps.academics.models import TeacherProfile, ClassArm, AcademicSession, AcademicTerm, TeacherSubjectAssignment
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.results.models import AssessmentSubmission
from apps.finance.models import StudentInvoice, Payment
from apps.audit.models import AuditLog

class AdminDashboardStatsView(APIView):
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        school = getattr(request, 'school', None)
        if not school:
            from apps.common.permissions import resolve_membership_for_request
            membership = resolve_membership_for_request(request)
            if membership:
                school = membership.school
            elif request.user.is_superuser or request.user.is_staff:
                from apps.schools.models import School
                school_id = request.headers.get('X-School-ID')
                if school_id:
                    school = School.objects.filter(id=school_id).first()
                if not school:
                    school = School.objects.filter(is_active=True).first()

        if not school:
            return Response({'error': 'School context not resolved'}, status=400)

        current_session = AcademicSession.objects.filter(school=school, is_current=True).first()
        current_term = AcademicTerm.objects.filter(school=school, is_current=True).first()

        total_students = Student.objects.filter(school=school, status='ACTIVE').count()
        active_teachers = TeacherProfile.objects.filter(school=school, is_active=True).count()
        total_classes = ClassArm.objects.filter(school=school).count()

        # Today Attendance
        today = timezone.now().date()
        today_sessions = AttendanceSession.objects.filter(school=school, date=today)
        total_marked = AttendanceRecord.objects.filter(attendance_session__in=today_sessions).count()
        present_count = AttendanceRecord.objects.filter(attendance_session__in=today_sessions, status='PRESENT').count()
        attendance_rate = round((present_count / total_marked * 100), 1) if total_marked > 0 else 0.0

        # Pending Results
        pending_reviews = AssessmentSubmission.objects.filter(
            school=school,
            status__in=['SUBMITTED', 'UNDER_REVIEW']
        ).count()
        published_results = AssessmentSubmission.objects.filter(
            school=school,
            status='PUBLISHED'
        ).count()

        # Financial Summary
        invoice_qs = StudentInvoice.objects.filter(school=school)
        if current_session:
            invoice_qs = invoice_qs.filter(academic_session=current_session)
        if current_term:
            invoice_qs = invoice_qs.filter(academic_term=current_term)

        total_invoiced = invoice_qs.aggregate(total=Sum('total_amount'))['total'] or 0.0
        total_collected = invoice_qs.aggregate(total=Sum('amount_paid'))['total'] or 0.0
        outstanding_balance = invoice_qs.aggregate(total=Sum('balance'))['total'] or 0.0

        # Section Distribution
        section_distribution = []
        for cat_code, cat_label in [('NURSERY', 'Nursery'), ('PRIMARY', 'Primary'), ('JUNIOR_SECONDARY', 'JSS'), ('SENIOR_SECONDARY', 'SSS')]:
            count = StudentEnrollment.objects.filter(
                school=school,
                class_arm__class_level__category=cat_code,
                status='ACTIVE'
            ).count()
            section_distribution.append({'name': cat_label, 'students': count})

        # Recent Audit logs
        recent_logs = AuditLog.objects.filter(school=school)[:8].values(
            'id', 'action', 'entity_type', 'entity_id', 'actor__first_name', 'actor__last_name', 'created_at'
        )

        return Response({
            'overview': {
                'total_students': total_students,
                'active_teachers': active_teachers,
                'total_classes': total_classes,
                'attendance_rate': attendance_rate,
                'pending_reviews': pending_reviews,
                'published_results': published_results,
                'total_invoiced': float(total_invoiced),
                'total_collected': float(total_collected),
                'outstanding_balance': float(outstanding_balance),
                'currency_symbol': school.currency_symbol,
            },
            'current_academic_context': {
                'session_name': current_session.name if current_session else 'Not Configured',
                'term_name': current_term.name if current_term else 'Not Configured',
            },
            'section_distribution': section_distribution,
            'recent_activity': list(recent_logs),
        })

class TeacherDashboardStatsView(APIView):
    permission_classes = [IsSchoolMember]

    def get(self, request):
        school = getattr(request, 'school', None)
        if not school:
            from apps.common.permissions import resolve_membership_for_request
            membership = resolve_membership_for_request(request)
            if membership:
                school = membership.school
            elif request.user.is_superuser or request.user.is_staff:
                from apps.schools.models import School
                school_id = request.headers.get('X-School-ID')
                if school_id:
                    school = School.objects.filter(id=school_id).first()
                if not school:
                    school = School.objects.filter(is_active=True).first()

        if not school:
            return Response({'error': 'School context not resolved'}, status=400)

        user = request.user
        teacher_profile = TeacherProfile.objects.filter(school=school, user=user).first()

        current_session = AcademicSession.objects.filter(school=school, is_current=True).first()
        current_term = AcademicTerm.objects.filter(school=school, is_current=True).first()

        if not teacher_profile:
            return Response({
                'is_teacher_profile': False,
                'message': 'No teacher profile found for current user in this school.',
                'assigned_classes': [],
                'assigned_subjects': [],
            })

        assignments = TeacherSubjectAssignment.objects.filter(
            school=school,
            teacher=teacher_profile
        ).select_related('class_arm', 'subject', 'class_arm__class_level')

        if current_session:
            assignments = assignments.filter(academic_session=current_session)

        # Assigned class arms
        class_arms_data = []
        seen_arms = set()
        for a in assignments:
            if a.class_arm_id not in seen_arms:
                seen_arms.add(a.class_arm_id)
                student_count = StudentEnrollment.objects.filter(class_arm=a.class_arm, status='ACTIVE').count()
                class_arms_data.append({
                    'id': str(a.class_arm.id),
                    'name': a.class_arm.display_name,
                    'student_count': student_count,
                })

        # Assigned subjects
        subjects_data = []
        for a in assignments:
            subjects_data.append({
                'assignment_id': str(a.id),
                'class_arm_id': str(a.class_arm.id),
                'class_arm_name': a.class_arm.display_name,
                'subject_id': str(a.subject.id),
                'subject_name': a.subject.name,
                'subject_code': a.subject.code,
            })

        # Today's attendance status
        today = timezone.now().date()
        marked_classes_today = AttendanceSession.objects.filter(
            school=school,
            marked_by=user,
            date=today
        ).values_list('class_arm_id', flat=True)

        # Submissions status
        my_submissions = AssessmentSubmission.objects.filter(
            school=school,
            submitted_by=user
        )
        drafts_count = my_submissions.filter(status='DRAFT').count()
        submitted_count = my_submissions.filter(status='SUBMITTED').count()
        approved_count = my_submissions.filter(status='APPROVED').count()

        return Response({
            'is_teacher_profile': True,
            'teacher': {
                'id': str(teacher_profile.id),
                'staff_id': teacher_profile.staff_id,
                'name': user.full_name,
            },
            'academic_context': {
                'session_name': current_session.name if current_session else 'Not Configured',
                'term_name': current_term.name if current_term else 'Not Configured',
            },
            'assigned_classes': class_arms_data,
            'assigned_subjects': subjects_data,
            'attendance_marked_class_ids': [str(c_id) for c_id in marked_classes_today],
            'submissions_summary': {
                'drafts': drafts_count,
                'submitted': submitted_count,
                'approved': approved_count,
            }
        })
