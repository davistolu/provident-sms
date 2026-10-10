import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.schools.models import School, SchoolMembership, SchoolSettings
from apps.academics.models import (
    AcademicSession, AcademicTerm, ClassLevel, ClassArm, Subject,
    TeacherProfile, TeacherSubjectAssignment
)
from apps.students.models import Student, Guardian, StudentGuardian, StudentEnrollment
from apps.assessments.models import AssessmentScheme, AssessmentComponent, GradingScale, GradeRule
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.results.models import AssessmentSubmission, StudentScore
from apps.results.services import ResultCalculationService
from apps.finance.models import FeeCategory, FeeStructure, StudentInvoice, InvoiceItem, Payment

class Command(BaseCommand):
    help = 'Seeds realistic data for Providence Premier Academy'

    def handle(self, *args, **options):
        self.stdout.write("Seeding school database...")

        # 1. School
        school, _ = School.objects.get_or_create(
            code='PPIA-001',
            defaults={
                'name': 'Providence Premier International Academy',
                'slug': 'providence-premier-academy',
                'motto': 'Excellence in Knowledge, Integrity and Leadership',
                'email': 'info@providence.edu',
                'phone': '+234 803 123 4567',
                'address': '12 Victoria Island Boulevard',
                'city': 'Lagos',
                'state': 'Lagos State',
                'country': 'Nigeria',
                'currency': 'NGN',
                'currency_symbol': '₦',
                'timezone': 'Africa/Lagos',
                'is_active': True
            }
        )
        SchoolSettings.objects.get_or_create(
            school=school,
            defaults={'enable_positions': True, 'invoice_prefix': 'INV', 'receipt_prefix': 'REC'}
        )

        # 2. Users & Memberships
        admin_user, _ = User.objects.get_or_create(
            email='admin@providence.edu',
            defaults={'first_name': 'Eleanor', 'last_name': 'Vance', 'is_staff': True, 'is_superuser': True}
        )
        admin_user.set_password('Admin123!')
        admin_user.save()
        SchoolMembership.objects.get_or_create(
            school=school, user=admin_user,
            defaults={'role': SchoolMembership.RoleChoices.ADMIN, 'is_default': True}
        )

        t1_user, _ = User.objects.get_or_create(
            email='john.doe@providence.edu',
            defaults={'first_name': 'John', 'last_name': 'Doe'}
        )
        t1_user.set_password('Teacher123!')
        t1_user.save()
        SchoolMembership.objects.get_or_create(
            school=school, user=t1_user,
            defaults={'role': SchoolMembership.RoleChoices.TEACHER, 'is_default': True}
        )
        t1_profile, _ = TeacherProfile.objects.get_or_create(
            school=school, user=t1_user,
            defaults={'staff_id': 'TCH-2024-001', 'specialization': 'Mathematics & Sciences', 'qualification': 'B.Sc Ed. Mathematics', 'gender': 'MALE'}
        )

        t2_user, _ = User.objects.get_or_create(
            email='sarah.smith@providence.edu',
            defaults={'first_name': 'Sarah', 'last_name': 'Smith'}
        )
        t2_user.set_password('Teacher123!')
        t2_user.save()
        SchoolMembership.objects.get_or_create(
            school=school, user=t2_user,
            defaults={'role': SchoolMembership.RoleChoices.TEACHER, 'is_default': True}
        )
        t2_profile, _ = TeacherProfile.objects.get_or_create(
            school=school, user=t2_user,
            defaults={'staff_id': 'TCH-2024-002', 'specialization': 'English Language & Literature', 'qualification': 'B.A English', 'gender': 'FEMALE'}
        )

        # 3. Academic Sessions & Terms
        today = timezone.now().date()
        session, _ = AcademicSession.objects.get_or_create(
            school=school,
            name='2024/2025',
            defaults={'start_date': datetime.date(2024, 9, 9), 'end_date': datetime.date(2025, 7, 25), 'is_current': True}
        )
        term1, _ = AcademicTerm.objects.get_or_create(
            school=school, session=session, term_type=AcademicTerm.TermChoices.FIRST_TERM,
            defaults={'name': 'First Term', 'start_date': datetime.date(2024, 9, 9), 'end_date': datetime.date(2024, 12, 13), 'is_current': True}
        )
        AcademicTerm.objects.get_or_create(
            school=school, session=session, term_type=AcademicTerm.TermChoices.SECOND_TERM,
            defaults={'name': 'Second Term', 'start_date': datetime.date(2025, 1, 6), 'end_date': datetime.date(2025, 4, 11), 'is_current': False}
        )

        # 4. Class Levels & Arms
        levels_data = [
            ('Nursery 1', 'NUR-1', ClassLevel.CategoryChoices.NURSERY, 1),
            ('Nursery 2', 'NUR-2', ClassLevel.CategoryChoices.NURSERY, 2),
            ('Nursery 3', 'NUR-3', ClassLevel.CategoryChoices.NURSERY, 3),
            ('Primary 1', 'PRI-1', ClassLevel.CategoryChoices.PRIMARY, 4),
            ('Primary 2', 'PRI-2', ClassLevel.CategoryChoices.PRIMARY, 5),
            ('Primary 3', 'PRI-3', ClassLevel.CategoryChoices.PRIMARY, 6),
            ('Primary 4', 'PRI-4', ClassLevel.CategoryChoices.PRIMARY, 7),
            ('Primary 5', 'PRI-5', ClassLevel.CategoryChoices.PRIMARY, 8),
            ('Primary 6', 'PRI-6', ClassLevel.CategoryChoices.PRIMARY, 9),
            ('JSS 1', 'JSS-1', ClassLevel.CategoryChoices.JUNIOR_SECONDARY, 10),
            ('JSS 2', 'JSS-2', ClassLevel.CategoryChoices.JUNIOR_SECONDARY, 11),
            ('JSS 3', 'JSS-3', ClassLevel.CategoryChoices.JUNIOR_SECONDARY, 12),
            ('SS 1', 'SS-1', ClassLevel.CategoryChoices.SENIOR_SECONDARY, 13),
            ('SS 2', 'SS-2', ClassLevel.CategoryChoices.SENIOR_SECONDARY, 14),
            ('SS 3', 'SS-3', ClassLevel.CategoryChoices.SENIOR_SECONDARY, 15),
        ]
        created_levels = {}
        for name, code, cat, order in levels_data:
            lvl, _ = ClassLevel.objects.get_or_create(school=school, name=name, defaults={'code': code, 'category': cat, 'order_index': order})
            created_levels[name] = lvl

        jss1_gold, _ = ClassArm.objects.get_or_create(school=school, class_level=created_levels['JSS 1'], name='Gold', defaults={'class_teacher': t1_profile})
        jss1_silver, _ = ClassArm.objects.get_or_create(school=school, class_level=created_levels['JSS 1'], name='Silver', defaults={'class_teacher': t2_profile})
        jss2_ruby, _ = ClassArm.objects.get_or_create(school=school, class_level=created_levels['JSS 2'], name='Ruby')
        jss3_sapphire, _ = ClassArm.objects.get_or_create(school=school, class_level=created_levels['JSS 3'], name='Sapphire')
        pri3_emerald, _ = ClassArm.objects.get_or_create(school=school, class_level=created_levels['Primary 3'], name='Emerald')
        ss1_diamond, _ = ClassArm.objects.get_or_create(school=school, class_level=created_levels['SS 1'], name='Diamond')
        ss2_platinum, _ = ClassArm.objects.get_or_create(school=school, class_level=created_levels['SS 2'], name='Platinum')
        ss3_titanium, _ = ClassArm.objects.get_or_create(school=school, class_level=created_levels['SS 3'], name='Titanium')

        # 5. Subjects & Assignments
        subjects_data = [
            ('Mathematics', 'MTH', Subject.CategoryChoices.GENERAL),
            ('English Language', 'ENG', Subject.CategoryChoices.GENERAL),
            ('Basic Science', 'BSC', Subject.CategoryChoices.SCIENCES),
            ('Civic Education', 'CVE', Subject.CategoryChoices.ARTS_HUMANITIES),
            ('Agricultural Science', 'AGR', Subject.CategoryChoices.VOCATIONAL),
            ('Business Studies', 'BUS', Subject.CategoryChoices.COMMERCIAL),
        ]
        created_subjects = {}
        for sname, scode, scat in subjects_data:
            subj, _ = Subject.objects.get_or_create(school=school, name=sname, defaults={'code': scode, 'category': scat})
            created_subjects[sname] = subj

        TeacherSubjectAssignment.objects.get_or_create(school=school, teacher=t1_profile, subject=created_subjects['Mathematics'], class_arm=jss1_gold, academic_session=session)
        TeacherSubjectAssignment.objects.get_or_create(school=school, teacher=t1_profile, subject=created_subjects['Basic Science'], class_arm=jss1_gold, academic_session=session)
        TeacherSubjectAssignment.objects.get_or_create(school=school, teacher=t2_profile, subject=created_subjects['English Language'], class_arm=jss1_gold, academic_session=session)

        # 6. Assessment Scheme & Grading Scale
        scheme, _ = AssessmentScheme.objects.get_or_create(school=school, name='Standard Secondary (30% CA + 70% Exam)', defaults={'max_total_score': Decimal('100.00'), 'is_default': True})
        AssessmentComponent.objects.get_or_create(school=school, scheme=scheme, code='CA1', defaults={'name': 'First CA Test', 'max_score': Decimal('15.00'), 'order_index': 1})
        AssessmentComponent.objects.get_or_create(school=school, scheme=scheme, code='CA2', defaults={'name': 'Second CA Test', 'max_score': Decimal('15.00'), 'order_index': 2})
        AssessmentComponent.objects.get_or_create(school=school, scheme=scheme, code='EXAM', defaults={'name': 'Terminal Examination', 'max_score': Decimal('70.00'), 'order_index': 3})

        scale, _ = GradingScale.objects.get_or_create(school=school, name='WAEC Standard Grade Scale', defaults={'is_default': True})
        rules_data = [
            ('A', Decimal('75.00'), Decimal('100.00'), Decimal('5.0'), 'Excellent', 1),
            ('B', Decimal('65.00'), Decimal('74.99'), Decimal('4.0'), 'Very Good', 2),
            ('C', Decimal('50.00'), Decimal('64.99'), Decimal('3.0'), 'Credit', 3),
            ('D', Decimal('45.00'), Decimal('49.99'), Decimal('2.0'), 'Pass', 4),
            ('E', Decimal('40.00'), Decimal('44.99'), Decimal('1.0'), 'Fair', 5),
            ('F', Decimal('0.00'), Decimal('39.99'), Decimal('0.0'), 'Fail', 6),
        ]
        for gr, mn, mx, gp, rm, ordr in rules_data:
            GradeRule.objects.get_or_create(school=school, grading_scale=scale, grade=gr, defaults={'min_score': mn, 'max_score': mx, 'grade_point': gp, 'remark': rm, 'order_index': ordr})

        # 7. Students & Enrollments
        students_roster = [
            ('SMS/2024/001', 'Daniel', 'Kalu', 'MALE', datetime.date(2011, 4, 15)),
            ('SMS/2024/002', 'Amina', 'Bello', 'FEMALE', datetime.date(2011, 8, 22)),
            ('SMS/2024/003', 'Chukwuemeka', 'Okonkwo', 'MALE', datetime.date(2011, 2, 10)),
            ('SMS/2024/004', 'Zainab', 'Mohammed', 'FEMALE', datetime.date(2011, 11, 5)),
            ('SMS/2024/005', 'Favour', 'Adeyemi', 'FEMALE', datetime.date(2011, 6, 18)),
            ('SMS/2024/006', 'Samuel', 'Ogunleye', 'MALE', datetime.date(2011, 9, 30)),
            ('SMS/2024/007', 'Blessing', 'Eze', 'FEMALE', datetime.date(2011, 1, 14)),
            ('SMS/2024/008', 'Tariq', 'Ibrahim', 'MALE', datetime.date(2011, 7, 7)),
        ]
        created_students = []
        for adm, fn, ln, gnd, dob in students_roster:
            stu, _ = Student.objects.get_or_create(
                school=school, admission_number=adm,
                defaults={'first_name': fn, 'last_name': ln, 'gender': gnd, 'date_of_birth': dob, 'status': Student.StatusChoices.ACTIVE}
            )
            StudentEnrollment.objects.get_or_create(
                school=school, student=stu, academic_session=session,
                defaults={'class_arm': jss1_gold, 'status': StudentEnrollment.EnrollmentStatus.ACTIVE}
            )
            created_students.append(stu)

        # 8. Sample Attendance
        att_sess, _ = AttendanceSession.objects.get_or_create(
            school=school, class_arm=jss1_gold, date=today,
            defaults={'academic_session': session, 'academic_term': term1, 'marked_by': t1_user, 'status': AttendanceSession.StatusChoices.SUBMITTED}
        )
        for idx, stu in enumerate(created_students):
            AttendanceRecord.objects.get_or_create(
                school=school, attendance_session=att_sess, student=stu,
                defaults={'status': AttendanceRecord.StatusChoices.PRESENT if idx != 3 else AttendanceRecord.StatusChoices.ABSENT}
            )

        # 9. Sample Assessment Submission & Scores for Mathematics
        sub_math, _ = AssessmentSubmission.objects.get_or_create(
            school=school, class_arm=jss1_gold, subject=created_subjects['Mathematics'],
            academic_session=session, academic_term=term1,
            defaults={'assessment_scheme': scheme, 'grading_scale': scale, 'submitted_by': t1_user, 'status': AssessmentSubmission.StatusChoices.SUBMITTED}
        )
        sample_marks = [
            (created_students[0], {'CA1': 14.0, 'CA2': 13.5, 'EXAM': 62.0}),
            (created_students[1], {'CA1': 15.0, 'CA2': 14.0, 'EXAM': 65.0}),
            (created_students[2], {'CA1': 11.0, 'CA2': 12.0, 'EXAM': 54.0}),
            (created_students[3], {'CA1': 9.0, 'CA2': 10.0, 'EXAM': 42.0}),
            (created_students[4], {'CA1': 13.0, 'CA2': 13.0, 'EXAM': 58.0}),
            (created_students[5], {'CA1': 14.5, 'CA2': 14.0, 'EXAM': 60.0}),
            (created_students[6], {'CA1': 12.0, 'CA2': 11.5, 'EXAM': 49.0}),
            (created_students[7], {'CA1': 8.0, 'CA2': 9.0, 'EXAM': 35.0}),
        ]
        for stu, marks in sample_marks:
            calc = ResultCalculationService.calculate_score(sub_math, stu, marks, grading_scale=scale)
            StudentScore.objects.get_or_create(
                school=school, submission=sub_math, student=stu,
                defaults={'component_scores': calc['component_scores'], 'total_score': calc['total_score'], 'grade': calc['grade'], 'remark': calc['remark']}
            )

        # 10. Fee Structures & Student Invoicing
        tuition_cat, _ = FeeCategory.objects.get_or_create(school=school, name='Tuition Fee', defaults={'description': 'Standard Termly Tuition'})
        dev_cat, _ = FeeCategory.objects.get_or_create(school=school, name='Development Levy', defaults={'description': 'Institutional Development'})
        FeeStructure.objects.get_or_create(school=school, fee_category=tuition_cat, academic_session=session, academic_term=term1, class_level=created_levels['JSS 1'], defaults={'amount': Decimal('150000.00')})
        FeeStructure.objects.get_or_create(school=school, fee_category=dev_cat, academic_session=session, academic_term=term1, class_level=None, defaults={'amount': Decimal('25000.00')})

        # Generate sample invoice for Student 1 with partial payment
        inv1, _ = StudentInvoice.objects.get_or_create(
            school=school, student=created_students[0], academic_session=session, academic_term=term1,
            defaults={'invoice_number': 'INV-2024-001', 'total_amount': Decimal('175000.00'), 'amount_paid': Decimal('100000.00'), 'balance': Decimal('75000.00'), 'status': StudentInvoice.StatusChoices.PARTIALLY_PAID}
        )
        InvoiceItem.objects.get_or_create(school=school, invoice=inv1, fee_category=tuition_cat, defaults={'description': 'Tuition Fee - First Term', 'amount': Decimal('150000.00')})
        InvoiceItem.objects.get_or_create(school=school, invoice=inv1, fee_category=dev_cat, defaults={'description': 'Development Levy', 'amount': Decimal('25000.00')})

        Payment.objects.get_or_create(
            school=school, student=created_students[0], invoice=inv1, reference_number='REC-2024-001',
            defaults={'payment_date': today, 'amount': Decimal('100000.00'), 'payment_method': Payment.MethodChoices.BANK_TRANSFER, 'recorded_by': admin_user, 'notes': 'First installment via GTBank transfer.'}
        )

        self.stdout.write(self.style.SUCCESS(
            "Successfully seeded database! Credentials:\n"
            "  Admin: admin@providence.edu (Password: Admin123!)\n"
            "  Teacher: john.doe@providence.edu (Password: Teacher123!)\n"
            "  Teacher: sarah.smith@providence.edu (Password: Teacher123!)\n"
        ))
