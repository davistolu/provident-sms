import pytest
from apps.students.models import Student
from apps.finance.models import StudentInvoice

@pytest.mark.django_db
class TestTenantIsolation:
    def test_cross_school_student_isolation(self, api_client, school_a, school_b, admin_a, admin_b):
        # Create student in School A
        student_a = Student.objects.create(
            school=school_a,
            admission_number="ADM-A-001",
            first_name="Alice",
            last_name="Alpha",
            gender="FEMALE"
        )
        # Create student in School B
        student_b = Student.objects.create(
            school=school_b,
            admission_number="ADM-B-001",
            first_name="Bob",
            last_name="Beta",
            gender="MALE"
        )

        # Authenticate as Admin A
        api_client.force_authenticate(user=admin_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        # Admin A lists students: should see only Alice
        res = api_client.get('/api/v1/students/students/')
        assert res.status_code == 200
        student_ids = [s['id'] for s in res.data['results']]
        assert str(student_a.id) in student_ids
        assert str(student_b.id) not in student_ids

        # Admin A attempts direct GET of student_b: must return 404
        res_detail = api_client.get(f'/api/v1/students/students/{student_b.id}/')
        assert res_detail.status_code == 404

    def test_prevent_cross_school_mutation(self, api_client, school_a, school_b, admin_a):
        student_b = Student.objects.create(
            school=school_b,
            admission_number="ADM-B-002",
            first_name="Brenda",
            last_name="Beta",
            gender="FEMALE"
        )

        api_client.force_authenticate(user=admin_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        # Admin A attempts to modify School B's student
        res_patch = api_client.patch(
            f'/api/v1/students/students/{student_b.id}/',
            {'first_name': 'HackedName'}
        )
        assert res_patch.status_code == 404

        student_b.refresh_from_db()
        assert student_b.first_name == "Brenda"

    def test_auto_generate_admission_number(self, api_client, school_a, admin_a):
        api_client.force_authenticate(user=admin_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        # Register student without providing admission_number
        res = api_client.post('/api/v1/students/students/', {
            'first_name': 'David',
            'last_name': 'Mark',
            'gender': 'MALE'
        })
        assert res.status_code == 201
        assert 'admission_number' in res.data
        adm_no = res.data['admission_number']
        assert len(adm_no) > 0
        assert '/' in adm_no
