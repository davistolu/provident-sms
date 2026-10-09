from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolMember, IsSchoolAdmin
from apps.results.models import AssessmentSubmission, StudentScore, StudentTermResult
from apps.results.serializers import (
    AssessmentSubmissionSerializer, StudentScoreSerializer, StudentTermResultSerializer
)
from apps.results.services import ResultCalculationService
from apps.results.pdf_generator import ReportCardPDFGenerator
from apps.academics.models import ClassArm, Subject, AcademicSession, AcademicTerm
from apps.assessments.models import AssessmentScheme, GradingScale
from apps.students.models import StudentEnrollment, Student

class AssessmentSubmissionViewSet(TenantScopedModelViewSet):
    queryset = AssessmentSubmission.objects.all().select_related(
        'class_arm__class_level', 'subject', 'academic_session', 'academic_term',
        'assessment_scheme', 'grading_scale', 'submitted_by'
    ).prefetch_related('scores__student')
    serializer_class = AssessmentSubmissionSerializer
    permission_classes = [IsSchoolMember]

    def get_queryset(self):
        qs = super().get_queryset()
        class_arm_id = self.request.query_params.get('class_arm')
        subject_id = self.request.query_params.get('subject')
        term_id = self.request.query_params.get('term')
        session_id = self.request.query_params.get('session')
        status_filter = self.request.query_params.get('status')

        if class_arm_id:
            qs = qs.filter(class_arm_id=class_arm_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if term_id:
            qs = qs.filter(academic_term_id=term_id)
        if session_id:
            qs = qs.filter(academic_session_id=session_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=False, methods=['post'], url_path='open-scoresheet')
    def open_scoresheet(self, request):
        """
        Opens or initializes a score sheet for a class, subject, session, and term,
        ensuring all enrolled active students have score records.
        """
        school = self.get_school()
        class_arm_id = request.data.get('class_arm_id')
        subject_id = request.data.get('subject_id')
        session_id = request.data.get('academic_session_id')
        term_id = request.data.get('academic_term_id')

        if not all([class_arm_id, subject_id]):
            return Response({'error': 'class_arm_id and subject_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        active_session = AcademicSession.objects.filter(school=school, id=session_id).first() if session_id else AcademicSession.objects.filter(school=school, is_current=True).first()
        active_term = AcademicTerm.objects.filter(school=school, id=term_id).first() if term_id else AcademicTerm.objects.filter(school=school, is_current=True).first()
        scheme = AssessmentScheme.objects.filter(school=school, is_default=True).first() or AssessmentScheme.objects.filter(school=school).first()
        scale = GradingScale.objects.filter(school=school, is_default=True).first() or GradingScale.objects.filter(school=school).first()

        submission, created = AssessmentSubmission.objects.get_or_create(
            school=school,
            class_arm_id=class_arm_id,
            subject_id=subject_id,
            academic_session=active_session,
            academic_term=active_term,
            defaults={
                'assessment_scheme': scheme,
                'grading_scale': scale,
                'submitted_by': request.user,
                'status': AssessmentSubmission.StatusChoices.DRAFT,
            }
        )

        # Ensure all currently active enrolled students have records
        enrollments = StudentEnrollment.objects.filter(
            school=school,
            class_arm_id=class_arm_id,
            academic_session=active_session,
            status='ACTIVE'
        ).select_related('student')

        existing_score_students = set(submission.scores.values_list('student_id', flat=True))
        for enr in enrollments:
            if enr.student_id not in existing_score_students:
                calc = ResultCalculationService.calculate_score(submission, enr.student, {}, grading_scale=scale)
                StudentScore.objects.create(
                    school=school,
                    submission=submission,
                    student=enr.student,
                    component_scores=calc['component_scores'],
                    total_score=calc['total_score'],
                    grade=calc['grade'],
                    remark=calc['remark'],
                )

        submission.refresh_from_db()
        return Response(AssessmentSubmissionSerializer(submission).data)

    @action(detail=True, methods=['post'], url_path='save-scores')
    def save_scores(self, request, pk=None):
        """
        Saves spreadsheet scores, re-computing authoritative totals and grades on the backend.
        """
        submission = self.get_object()
        if submission.status in ['PUBLISHED'] and not request.user.is_staff:
            return Response({'error': 'Cannot edit published results directly.'}, status=status.HTTP_400_BAD_REQUEST)

        scores_payload = request.data.get('scores', [])
        action_type = request.data.get('action', 'save_draft')  # 'save_draft' or 'submit'

        with transaction.atomic():
            for row in scores_payload:
                student_id = row.get('student_id') or row.get('student')
                comp_scores = row.get('component_scores', {})
                teacher_comment = row.get('teacher_comment', '')

                student = Student.objects.filter(school=submission.school, id=student_id).first()
                if not student:
                    continue

                calc = ResultCalculationService.calculate_score(
                    submission, student, comp_scores, grading_scale=submission.grading_scale
                )

                StudentScore.objects.update_or_create(
                    school=submission.school,
                    submission=submission,
                    student=student,
                    defaults={
                        'component_scores': calc['component_scores'],
                        'total_score': calc['total_score'],
                        'grade': calc['grade'],
                        'remark': calc['remark'],
                        'teacher_comment': teacher_comment,
                    }
                )

            if action_type == 'submit':
                submission.status = AssessmentSubmission.StatusChoices.SUBMITTED
                submission.submitted_by = request.user
            submission.save()

        submission.refresh_from_db()
        return Response({
            'status': 'success',
            'submission': AssessmentSubmissionSerializer(submission).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsSchoolAdmin], url_path='review')
    def review(self, request, pk=None):
        """
        Admin reviews and approves or returns score submissions.
        """
        submission = self.get_object()
        decision = request.data.get('decision')  # 'APPROVE' or 'REJECT'
        feedback = request.data.get('feedback', '')

        if decision == 'APPROVE':
            submission.status = AssessmentSubmission.StatusChoices.APPROVED
            submission.reviewed_by = request.user
            submission.reviewed_at = timezone.now()
            submission.feedback_notes = feedback
            submission.save()
            return Response({'status': 'success', 'message': 'Submission approved successfully.'})
        elif decision == 'REJECT':
            submission.status = AssessmentSubmission.StatusChoices.REJECTED
            submission.reviewed_by = request.user
            submission.reviewed_at = timezone.now()
            submission.feedback_notes = feedback
            submission.save()
            return Response({'status': 'success', 'message': 'Submission returned for corrections.'})
        else:
            return Response({'error': 'Invalid decision. Must be APPROVE or REJECT.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsSchoolAdmin], url_path='publish-class-results')
    def publish_class_results(self, request):
        """
        Publishes all approved assessment results for a class in a term,
        computes class averages, and updates student rankings.
        """
        school = self.get_school()
        class_arm_id = request.data.get('class_arm_id')
        session_id = request.data.get('academic_session_id')
        term_id = request.data.get('academic_term_id')

        class_arm = ClassArm.objects.filter(school=school, id=class_arm_id).first()
        session = AcademicSession.objects.filter(school=school, id=session_id).first() if session_id else AcademicSession.objects.filter(school=school, is_current=True).first()
        term = AcademicTerm.objects.filter(school=school, id=term_id).first() if term_id else AcademicTerm.objects.filter(school=school, is_current=True).first()

        if not all([class_arm, session, term]):
            return Response({'error': 'class_arm_id, academic_session_id, and academic_term_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark all approved submissions as PUBLISHED
        AssessmentSubmission.objects.filter(
            school=school,
            class_arm=class_arm,
            academic_session=session,
            academic_term=term,
            status='APPROVED'
        ).update(status='PUBLISHED', published_at=timezone.now())

        # Authoritatively recompute averages and class positions
        term_results = ResultCalculationService.recompute_class_term_results(
            school=school,
            class_arm=class_arm,
            academic_session=session,
            academic_term=term
        )
        StudentTermResult.objects.filter(
            school=school,
            class_arm=class_arm,
            academic_session=session,
            academic_term=term
        ).update(is_published=True, published_at=timezone.now())

        return Response({
            'status': 'success',
            'message': f"Results published successfully for {class_arm.display_name}.",
            'results_count': len(term_results)
        })

class StudentTermResultViewSet(TenantScopedModelViewSet):
    queryset = StudentTermResult.objects.all().select_related(
        'student', 'class_arm__class_level', 'academic_session', 'academic_term'
    )
    serializer_class = StudentTermResultSerializer
    permission_classes = [IsSchoolMember]

    def get_queryset(self):
        qs = super().get_queryset()
        class_arm_id = self.request.query_params.get('class_arm')
        student_id = self.request.query_params.get('student')
        term_id = self.request.query_params.get('term')
        session_id = self.request.query_params.get('session')

        if class_arm_id:
            qs = qs.filter(class_arm_id=class_arm_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        if term_id:
            qs = qs.filter(academic_term_id=term_id)
        if session_id:
            qs = qs.filter(academic_session_id=session_id)
        return qs

    @action(detail=True, methods=['get'], url_path='report-card-pdf')
    def download_report_card(self, request, pk=None):
        """
        Generates and downloads a high-fidelity PDF report card.
        """
        term_result = self.get_object()
        # Find all student scores for this term
        submissions = AssessmentSubmission.objects.filter(
            school=term_result.school,
            class_arm=term_result.class_arm,
            academic_session=term_result.academic_session,
            academic_term=term_result.academic_term
        )
        scores = StudentScore.objects.filter(
            submission__in=submissions,
            student=term_result.student
        ).select_related('submission__subject')

        pdf_bytes = ReportCardPDFGenerator.generate_report_card(term_result, scores)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"Report_Card_{term_result.student.admission_number}_{term_result.academic_term.name}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
