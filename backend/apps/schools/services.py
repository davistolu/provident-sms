import datetime
import re
from django.db import transaction
from django.utils.text import slugify
from django.utils import timezone
from apps.schools.models import School, SchoolMembership, SchoolSettings
from apps.academics.models import AcademicSession, AcademicTerm, ClassLevel, ClassArm, Subject
from apps.assessments.models import AssessmentScheme, AssessmentComponent, GradingScale, GradeRule
from apps.finance.models import FeeCategory

class SchoolProvisioningService:
    """
    Automates the provisioning of a fully functional school environment,
    including tenant membership, academic calendar, educational stages,
    standard classes, subjects, and grading systems.
    """

    @classmethod
    def generate_unique_code(cls, name):
        # Extract initials or letters
        words = re.findall(r'[A-Za-z0-9]+', name)
        if words:
            initials = ''.join([w[0].upper() for w in words[:4]])
        else:
            initials = 'SCH'
        
        base_code = f"{initials}-001"
        code = base_code
        counter = 1
        while School.objects.filter(code=code).exists():
            counter += 1
            code = f"{initials}-{counter:03d}"
        return code

    @classmethod
    def generate_unique_slug(cls, name):
        base_slug = slugify(name) or 'school'
        slug = base_slug
        counter = 1
        while School.objects.filter(slug=slug).exists():
            counter += 1
            slug = f"{base_slug}-{counter}"
        return slug

    @classmethod
    @transaction.atomic
    def provision_school(
        cls,
        user,
        school_name,
        motto='',
        email='',
        phone='',
        address='',
        city='',
        state='',
        country='Nigeria',
        currency='NGN',
        currency_symbol='₦',
        session_name='2024/2025',
        stages=None,
        create_standard_classes=True,
        create_standard_subjects=True,
        create_standard_grading=True,
        school_code=None
    ):
        if not stages:
            stages = ['NURSERY', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY']

        # 1. Create School
        code = school_code.strip().upper() if school_code else cls.generate_unique_code(school_name)
        slug = cls.generate_unique_slug(school_name)

        school = School.objects.create(
            name=school_name.strip(),
            code=code,
            slug=slug,
            motto=motto.strip(),
            email=email.strip() or user.email,
            phone=phone.strip() or (user.phone or ''),
            address=address.strip(),
            city=city.strip(),
            state=state.strip(),
            country=country.strip(),
            currency=currency.strip(),
            currency_symbol=currency_symbol.strip(),
            is_active=True
        )

        # 2. School Settings
        SchoolSettings.objects.create(
            school=school,
            enable_positions=True,
            invoice_prefix='INV',
            receipt_prefix='REC',
            admission_number_prefix=code[:4].upper()
        )

        # 3. Membership
        membership = SchoolMembership.objects.create(
            school=school,
            user=user,
            role=SchoolMembership.RoleChoices.SUPER_ADMIN,
            is_active=True,
            is_default=True
        )

        # 4. Academic Session & 3 Terms
        now = timezone.now().date()
        current_year = now.year
        session = AcademicSession.objects.create(
            school=school,
            name=session_name.strip() or f"{current_year}/{current_year+1}",
            start_date=datetime.date(current_year, 9, 9),
            end_date=datetime.date(current_year + 1, 7, 25),
            is_current=True
        )

        AcademicTerm.objects.create(
            school=school,
            session=session,
            term_type=AcademicTerm.TermChoices.FIRST_TERM,
            name='First Term',
            start_date=datetime.date(current_year, 9, 9),
            end_date=datetime.date(current_year, 12, 15),
            is_current=True
        )
        AcademicTerm.objects.create(
            school=school,
            session=session,
            term_type=AcademicTerm.TermChoices.SECOND_TERM,
            name='Second Term',
            start_date=datetime.date(current_year + 1, 1, 6),
            end_date=datetime.date(current_year + 1, 4, 11),
            is_current=False
        )
        AcademicTerm.objects.create(
            school=school,
            session=session,
            term_type=AcademicTerm.TermChoices.THIRD_TERM,
            name='Third Term',
            start_date=datetime.date(current_year + 1, 4, 28),
            end_date=datetime.date(current_year + 1, 7, 25),
            is_current=False
        )

        # 5. Class Levels & Default Arms
        if create_standard_classes:
            level_definitions = []
            order = 1

            if 'NURSERY' in stages:
                level_definitions.extend([
                    ('Nursery 1', 'NUR-1', ClassLevel.CategoryChoices.NURSERY, order),
                    ('Nursery 2', 'NUR-2', ClassLevel.CategoryChoices.NURSERY, order + 1),
                    ('Nursery 3', 'NUR-3', ClassLevel.CategoryChoices.NURSERY, order + 2),
                ])
                order += 3

            if 'PRIMARY' in stages:
                level_definitions.extend([
                    ('Primary 1', 'PRI-1', ClassLevel.CategoryChoices.PRIMARY, order),
                    ('Primary 2', 'PRI-2', ClassLevel.CategoryChoices.PRIMARY, order + 1),
                    ('Primary 3', 'PRI-3', ClassLevel.CategoryChoices.PRIMARY, order + 2),
                    ('Primary 4', 'PRI-4', ClassLevel.CategoryChoices.PRIMARY, order + 3),
                    ('Primary 5', 'PRI-5', ClassLevel.CategoryChoices.PRIMARY, order + 4),
                    ('Primary 6', 'PRI-6', ClassLevel.CategoryChoices.PRIMARY, order + 5),
                ])
                order += 6

            if 'JUNIOR_SECONDARY' in stages:
                level_definitions.extend([
                    ('JSS 1', 'JSS-1', ClassLevel.CategoryChoices.JUNIOR_SECONDARY, order),
                    ('JSS 2', 'JSS-2', ClassLevel.CategoryChoices.JUNIOR_SECONDARY, order + 1),
                    ('JSS 3', 'JSS-3', ClassLevel.CategoryChoices.JUNIOR_SECONDARY, order + 2),
                ])
                order += 3

            if 'SENIOR_SECONDARY' in stages:
                level_definitions.extend([
                    ('SS 1', 'SS-1', ClassLevel.CategoryChoices.SENIOR_SECONDARY, order),
                    ('SS 2', 'SS-2', ClassLevel.CategoryChoices.SENIOR_SECONDARY, order + 1),
                    ('SS 3', 'SS-3', ClassLevel.CategoryChoices.SENIOR_SECONDARY, order + 2),
                ])

            for name, code_str, cat, ord_idx in level_definitions:
                lvl = ClassLevel.objects.create(
                    school=school,
                    name=name,
                    code=code_str,
                    category=cat,
                    order_index=ord_idx
                )
                ClassArm.objects.create(
                    school=school,
                    class_level=lvl,
                    name='A'
                )

        # 6. Standard Foundational Subjects
        if create_standard_subjects:
            subject_templates = [
                ('Mathematics', 'MTH', Subject.CategoryChoices.GENERAL),
                ('English Language', 'ENG', Subject.CategoryChoices.GENERAL),
                ('Basic Science & Technology', 'BST', Subject.CategoryChoices.SCIENCES),
                ('Social Studies', 'SOS', Subject.CategoryChoices.ARTS_HUMANITIES),
                ('Civic Education', 'CVE', Subject.CategoryChoices.GENERAL),
                ('Agricultural Science', 'AGR', Subject.CategoryChoices.SCIENCES),
                ('Computer Studies / ICT', 'ICT', Subject.CategoryChoices.SCIENCES),
                ('Creative & Cultural Arts', 'CCA', Subject.CategoryChoices.ARTS_HUMANITIES),
                ('Christian / Islamic Religious Studies', 'CRS', Subject.CategoryChoices.ARTS_HUMANITIES),
                ('Physical & Health Education', 'PHE', Subject.CategoryChoices.GENERAL),
            ]
            for s_name, s_code, s_cat in subject_templates:
                Subject.objects.create(
                    school=school,
                    name=s_name,
                    code=s_code,
                    category=s_cat,
                    is_active=True
                )

        # 7. Standard Assessment Scheme & Grading Scale
        if create_standard_grading:
            # Assessment Scheme
            scheme = AssessmentScheme.objects.create(
                school=school,
                name='Continuous Assessment & Terminal Exam (30/70)',
                max_total_score=100,
                is_default=True
            )
            AssessmentComponent.objects.create(school=school, scheme=scheme, name='1st Continuous Assessment', code='CA1', max_score=15, order_index=1)
            AssessmentComponent.objects.create(school=school, scheme=scheme, name='2nd Continuous Assessment', code='CA2', max_score=15, order_index=2)
            AssessmentComponent.objects.create(school=school, scheme=scheme, name='Terminal Examination', code='EXAM', max_score=70, order_index=3)

            # Standard Grading Scale
            scale = GradingScale.objects.create(
                school=school,
                name='Universal Standard 9-Point Scale (WAEC/NECO)',
                is_default=True
            )
            rules = [
                ('A1', 75, 100, 4.0, 'Excellent', 1),
                ('B2', 70, 74.99, 3.5, 'Very Good', 2),
                ('B3', 65, 69.99, 3.0, 'Good', 3),
                ('C4', 60, 64.99, 2.5, 'Credit', 4),
                ('C5', 55, 59.99, 2.0, 'Credit', 5),
                ('C6', 50, 54.99, 1.5, 'Credit', 6),
                ('D7', 45, 49.99, 1.0, 'Pass', 7),
                ('E8', 40, 44.99, 0.5, 'Pass', 8),
                ('F9', 0, 39.99, 0.0, 'Fail', 9),
            ]
            for grd, min_s, max_s, pts, rmk, ord_i in rules:
                GradeRule.objects.create(
                    school=school,
                    grading_scale=scale,
                    grade=grd,
                    min_score=min_s,
                    max_score=max_s,
                    grade_point=pts,
                    remark=rmk,
                    order_index=ord_i
                )

        # 8. Standard Default Fee Categories
        FeeCategory.objects.create(school=school, name='Tuition Fee', description='Termly tuition and academic instruction')
        FeeCategory.objects.create(school=school, name='Development Levy', description='School infrastructural and facility development')
        FeeCategory.objects.create(school=school, name='Books & Uniforms', description='Course materials, stationery, and institutional uniform')

        return school, membership
