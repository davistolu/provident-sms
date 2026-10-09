from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.results.models import AssessmentSubmission, StudentScore, StudentTermResult
from apps.assessments.models import AssessmentScheme, GradingScale, GradeRule
from apps.students.models import StudentEnrollment
from apps.attendance.models import AttendanceSession, AttendanceRecord

class ResultCalculationService:
    """
    Authoritative server-side calculation service for academic scores,
    grading assignments, class averages, and ranking positions.
    """

    @staticmethod
    def calculate_score(submission, student, component_scores, grading_scale=None):
        """
        Validates individual component scores against scheme limits,
        computes the authoritative total score, and assigns the grade/remark.
        """
        scheme = submission.assessment_scheme
        components = {c.code: float(c.max_score) for c in scheme.components.all()} if scheme else {}

        total = Decimal('0.00')
        sanitized_scores = {}

        for code, max_val in components.items():
            raw_val = component_scores.get(code, 0.0)
            try:
                val = float(raw_val) if raw_val not in (None, '') else 0.0
            except (ValueError, TypeError):
                val = 0.0
            # Cap within permitted bounds [0, max_val]
            val = max(0.0, min(val, max_val))
            sanitized_scores[code] = round(val, 2)
            total += Decimal(str(round(val, 2)))

        # Fallback if no components configured
        if not components:
            for k, v in component_scores.items():
                try:
                    val = float(v) if v not in (None, '') else 0.0
                except (ValueError, TypeError):
                    val = 0.0
                sanitized_scores[k] = round(val, 2)
                total += Decimal(str(round(val, 2)))

        # Determine Grade & Remark
        scale = grading_scale or submission.grading_scale
        grade_letter = 'F'
        remark_text = 'Fail'

        if scale:
            matching_rule = GradeRule.objects.filter(
                grading_scale=scale,
                min_score__lte=total,
                max_score__gte=total
            ).order_by('-min_score').first()

            if matching_rule:
                grade_letter = matching_rule.grade
                remark_text = matching_rule.remark
        else:
            # Standard default grading
            if total >= Decimal('70'):
                grade_letter = 'A'
                remark_text = 'Distinction'
            elif total >= Decimal('60'):
                grade_letter = 'B'
                remark_text = 'Very Good'
            elif total >= Decimal('50'):
                grade_letter = 'C'
                remark_text = 'Credit'
            elif total >= Decimal('45'):
                grade_letter = 'D'
                remark_text = 'Pass'
            elif total >= Decimal('40'):
                grade_letter = 'E'
                remark_text = 'Fair'
            else:
                grade_letter = 'F'
                remark_text = 'Fail'

        return {
            'component_scores': sanitized_scores,
            'total_score': total,
            'grade': grade_letter,
            'remark': remark_text,
        }

    @classmethod
    def recompute_class_term_results(cls, school, class_arm, academic_session, academic_term):
        """
        Recomputes total marks obtained, averages, attendance stats,
        and class rankings for all students enrolled in a class arm for the given term.
        """
        with transaction.atomic():
            enrollments = StudentEnrollment.objects.filter(
                school=school,
                class_arm=class_arm,
                academic_session=academic_session,
                status='ACTIVE'
            ).select_related('student')

            # Approved/Published submissions for this class in this term
            submissions = AssessmentSubmission.objects.filter(
                school=school,
                class_arm=class_arm,
                academic_session=academic_session,
                academic_term=academic_term,
                status__in=['APPROVED', 'PUBLISHED']
            ).prefetch_related('scores')

            # Attendance sessions for this class and term
            att_sessions = AttendanceSession.objects.filter(
                school=school,
                class_arm=class_arm,
                academic_session=academic_session,
                academic_term=academic_term
            )
            total_school_days = att_sessions.count()

            term_results = []
            for enr in enrollments:
                student = enr.student
                scores = StudentScore.objects.filter(
                    submission__in=submissions,
                    student=student
                )

                total_obtained = sum([s.total_score for s in scores]) or Decimal('0.00')
                subjects_count = scores.count()
                total_possible = Decimal(str(subjects_count * 100)) if subjects_count > 0 else Decimal('0.00')
                average = round(Decimal(str(total_obtained / Decimal(str(subjects_count)))), 2) if subjects_count > 0 else Decimal('0.00')

                # Attendance count
                present_days = AttendanceRecord.objects.filter(
                    attendance_session__in=att_sessions,
                    student=student,
                    status='PRESENT'
                ).count()

                result_record, _ = StudentTermResult.objects.get_or_create(
                    school=school,
                    student=student,
                    class_arm=class_arm,
                    academic_session=academic_session,
                    academic_term=academic_term,
                    defaults={
                        'total_marks_obtained': total_obtained,
                        'total_marks_possible': total_possible,
                        'average_score': average,
                        'total_students_in_class': enrollments.count(),
                        'attendance_present': present_days,
                        'attendance_total': total_school_days,
                    }
                )
                result_record.total_marks_obtained = total_obtained
                result_record.total_marks_possible = total_possible
                result_record.average_score = average
                result_record.total_students_in_class = enrollments.count()
                result_record.attendance_present = present_days
                result_record.attendance_total = total_school_days
                result_record.save()
                term_results.append(result_record)

            # Compute Positions / Rankings (Handling ties consistently: 1st, 2nd, 2nd, 4th)
            term_results.sort(key=lambda r: r.average_score, reverse=True)
            current_rank = 1
            for i, res in enumerate(term_results):
                if i > 0 and res.average_score < term_results[i - 1].average_score:
                    current_rank = i + 1
                res.position_in_class = current_rank
                res.save(update_fields=['position_in_class'])

        return term_results
