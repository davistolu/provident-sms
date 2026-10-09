import pytest
import datetime
from decimal import Decimal
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.schools.models import School, SchoolMembership, SchoolSettings
from apps.academics.models import (
    AcademicSession, AcademicTerm, ClassLevel, ClassArm, Subject,
    TeacherProfile, TeacherSubjectAssignment
)
from apps.students.models import Student, StudentEnrollment
from apps.assessments.models import AssessmentScheme, AssessmentComponent, GradingScale, GradeRule

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def school_a():
    school = School.objects.create(
        name="School Alpha",
        code="SCH-A",
        slug="school-alpha"
    )
    SchoolSettings.objects.create(school=school)
    return school

@pytest.fixture
def school_b():
    school = School.objects.create(
        name="School Beta",
        code="SCH-B",
        slug="school-beta"
    )
    SchoolSettings.objects.create(school=school)
    return school

@pytest.fixture
def admin_a(school_a):
    user = User.objects.create_user(
        email="admin.a@schoola.com",
        password="Password123!",
        first_name="Admin",
        last_name="Alpha"
    )
    SchoolMembership.objects.create(
        school=school_a,
        user=user,
        role=SchoolMembership.RoleChoices.ADMIN,
        is_default=True
    )
    return user

@pytest.fixture
def admin_b(school_b):
    user = User.objects.create_user(
        email="admin.b@schoolb.com",
        password="Password123!",
        first_name="Admin",
        last_name="Beta"
    )
    SchoolMembership.objects.create(
        school=school_b,
        user=user,
        role=SchoolMembership.RoleChoices.ADMIN,
        is_default=True
    )
    return user

@pytest.fixture
def teacher_a(school_a):
    user = User.objects.create_user(
        email="teacher.a@schoola.com",
        password="Password123!",
        first_name="Teacher",
        last_name="Alpha"
    )
    SchoolMembership.objects.create(
        school=school_a,
        user=user,
        role=SchoolMembership.RoleChoices.TEACHER,
        is_default=True
    )
    TeacherProfile.objects.create(
        school=school_a,
        user=user,
        staff_id="TCH-A-01"
    )
    return user
