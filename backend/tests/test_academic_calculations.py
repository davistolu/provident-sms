import pytest
import datetime
from decimal import Decimal
from apps.academics.models import AcademicSession, AcademicTerm, ClassLevel, ClassArm, Subject
from apps.assessments.models import AssessmentScheme, AssessmentComponent, GradingScale, GradeRule
from apps.students.models import Student, StudentEnrollment
from apps.results.models import AssessmentSubmission, StudentScore, StudentTermResult
from apps.results.services import ResultCalculationService

@pytest.mark.django_db
class TestAcademicCalculations:
    def test_score_calculation_and_grading(self, school_a, admin_a):
        scheme = AssessmentScheme.objects.create(school=school_a, name="30/70 Scheme", is_default=True)
        AssessmentComponent.objects.create(school=school_a, scheme=scheme, code="CA1", max_score=Decimal('15.00'))
        AssessmentComponent.objects.create(school=school_a, scheme=scheme, code="CA2", max_score=Decimal('15.00'))
        AssessmentComponent.objects.create(school=school_a, scheme=scheme, code="EXAM", max_score=Decimal('70.00'))

        scale = GradingScale.objects.create(school=school_a, name="Test Scale", is_default=True)
        GradeRule.objects.create(school=school_a, grading_scale=scale, grade="A", min_score=Decimal('70.00'), max_score=Decimal('100.00'), remark="Distinction")
        GradeRule.objects.create(school=school_a, grading_scale=scale, grade="B", min_score=Decimal('60.00'), max_score=Decimal('69.99'), remark="Credit")
        GradeRule.objects.create(school=school_a, grading_scale=scale, grade="F", min_score=Decimal('0.00'), max_score=Decimal('59.99'), remark="Fail")

        session = AcademicSession.objects.create(school=school_a, name="2024/2025", start_date=datetime.date(2024, 9, 1), end_date=datetime.date(2025, 7, 1))
        term = AcademicTerm.objects.create(school=school_a, session=session, term_type="FIRST_TERM", name="First Term", start_date=datetime.date(2024, 9, 1), end_date=datetime.date(2024, 12, 1))
        level = ClassLevel.objects.create(school=school_a, name="JSS 1")
        arm = ClassArm.objects.create(school=school_a, class_level=level, name="Gold")
        subject = Subject.objects.create(school=school_a, name="Mathematics")

        sub = AssessmentSubmission.objects.create(
            school=school_a, class_arm=arm, subject=subject,
            academic_session=session, academic_term=term,
            assessment_scheme=scheme, grading_scale=scale
        )

        student = Student.objects.create(school=school_a, admission_number="ADM-001", first_name="John", last_name="Doe")

        # Test score within bounds
        calc1 = ResultCalculationService.calculate_score(sub, student, {'CA1': 14.0, 'CA2': 13.0, 'EXAM': 60.0}, scale)
        assert calc1['total_score'] == Decimal('87.00')
        assert calc1['grade'] == 'A'
        assert calc1['remark'] == 'Distinction'

        # Test score capping if an input exceeds max component score
        calc2 = ResultCalculationService.calculate_score(sub, student, {'CA1': 99.0, 'CA2': 10.0, 'EXAM': 50.0}, scale)
        # CA1 capped at 15.0
        assert calc2['component_scores']['CA1'] == 15.0
        assert calc2['total_score'] == Decimal('75.00')
        assert calc2['grade'] == 'A'

    def test_class_positions_and_ranking_with_ties(self, school_a):
        session = AcademicSession.objects.create(school=school_a, name="2024/2025", start_date=datetime.date(2024, 9, 1), end_date=datetime.date(2025, 7, 1))
        term = AcademicTerm.objects.create(school=school_a, session=session, term_type="FIRST_TERM", name="First Term", start_date=datetime.date(2024, 9, 1), end_date=datetime.date(2024, 12, 1))
        level = ClassLevel.objects.create(school=school_a, name="JSS 1")
        arm = ClassArm.objects.create(school=school_a, class_level=level, name="Gold")
        subj = Subject.objects.create(school=school_a, name="Mathematics")

        scheme = AssessmentScheme.objects.create(school=school_a, name="Default")
        scale = GradingScale.objects.create(school=school_a, name="Default")

        sub = AssessmentSubmission.objects.create(
            school=school_a, class_arm=arm, subject=subj,
            academic_session=session, academic_term=term,
            assessment_scheme=scheme, grading_scale=scale,
            status='APPROVED'
        )

        s1 = Student.objects.create(school=school_a, admission_number="S1", first_name="Top", last_name="Student")
        s2 = Student.objects.create(school=school_a, admission_number="S2", first_name="Tie1", last_name="Student")
        s3 = Student.objects.create(school=school_a, admission_number="S3", first_name="Tie2", last_name="Student")
        s4 = Student.objects.create(school=school_a, admission_number="S4", first_name="Fourth", last_name="Student")

        for s in [s1, s2, s3, s4]:
            StudentEnrollment.objects.create(school=school_a, student=s, class_arm=arm, academic_session=session)

        StudentScore.objects.create(school=school_a, submission=sub, student=s1, total_score=Decimal('90.00'))
        StudentScore.objects.create(school=school_a, submission=sub, student=s2, total_score=Decimal('80.00'))
        StudentScore.objects.create(school=school_a, submission=sub, student=s3, total_score=Decimal('80.00'))
        StudentScore.objects.create(school=school_a, submission=sub, student=s4, total_score=Decimal('70.00'))

        results = ResultCalculationService.recompute_class_term_results(school_a, arm, session, term)

        r_map = {r.student_id: r for r in results}
        assert r_map[s1.id].position_in_class == 1
        assert r_map[s2.id].position_in_class == 2
        assert r_map[s3.id].position_in_class == 2
        assert r_map[s4.id].position_in_class == 4  # Standard competition ranking: 1, 2, 2, 4
