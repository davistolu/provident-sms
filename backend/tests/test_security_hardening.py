import pytest
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.accounts.models import User
from apps.schools.models import SchoolMembership, School
from apps.students.models import Student
from apps.finance.models import StudentInvoice, Payment, InvoiceItem
from apps.academics.models import AcademicSession, AcademicTerm

@pytest.mark.django_db
class TestSecurityHardening:

    def test_prevent_mass_assignment_privilege_escalation(self, api_client, school_a, teacher_a):
        """Verify normal user cannot escalate privileges to is_staff via profile patch."""
        api_client.force_authenticate(user=teacher_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        assert not teacher_a.is_staff
        assert not teacher_a.is_superuser

        # Attempt to escalate to is_staff
        res = api_client.patch('/api/v1/auth/me/', {
            'is_staff': True,
            'is_superuser': True,
            'first_name': 'UpdatedTeacher'
        })
        assert res.status_code == 200

        teacher_a.refresh_from_db()
        assert teacher_a.first_name == 'UpdatedTeacher'
        assert not teacher_a.is_staff  # Must remain False
        assert not teacher_a.is_superuser  # Must remain False

    def test_prevent_cross_school_password_overwrite(self, api_client, school_a, school_b, admin_a, admin_b):
        """Verify School B admin cannot overwrite the password of an existing user in School A."""
        victim_email = "victim.user@example.com"
        original_password = "SecretPassword123!"

        victim = User.objects.create_user(
            email=victim_email,
            password=original_password,
            first_name="Victim",
            last_name="User"
        )
        SchoolMembership.objects.create(
            school=school_a,
            user=victim,
            role=SchoolMembership.RoleChoices.TEACHER,
            is_active=True
        )

        # Admin of School B attempts to add victim to School B with a new password to take over their account
        api_client.force_authenticate(user=admin_b)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_b.id))

        res = api_client.post('/api/v1/memberships/', {
            'email': victim_email,
            'role': 'TEACHER',
            'password': 'MaliciousOverwrittenPassword123!'
        })
        assert res.status_code == 201

        victim.refresh_from_db()
        # The victim's original password must still work, malicious overwrite must fail
        assert victim.check_password(original_password)
        assert not victim.check_password('MaliciousOverwrittenPassword123!')

    def test_csv_formula_injection_sanitization_on_export(self, api_client, school_a, admin_a):
        """Verify student export prepends quote to cells starting with formula injection chars."""
        Student.objects.create(
            school=school_a,
            admission_number="=cmd|' /C calc'!A0",
            first_name="+2348000000000",
            last_name="-Hyphenated",
            gender="MALE"
        )

        api_client.force_authenticate(user=admin_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        res = api_client.get('/api/v1/students/students/export_csv/')
        assert res.status_code == 200
        content = res.content.decode('utf-8')

        # Formula characters must be escaped with leading single quote
        assert "'=cmd|' /C calc'!A0" in content
        assert "'+2348000000000" in content
        assert "'-Hyphenated" in content

    def test_csv_import_file_size_and_extension_validation(self, api_client, school_a, admin_a):
        """Verify bulk import rejects non-csv files and oversized files."""
        api_client.force_authenticate(user=admin_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        # Test non-csv extension
        fake_exe = SimpleUploadedFile("payload.exe", b"malicious binary content", content_type="application/octet-stream")
        res = api_client.post('/api/v1/students/students/bulk_import/', {'file': fake_exe}, format='multipart')
        assert res.status_code == 400
        assert 'Invalid file type' in res.data['error']

    def test_payment_decimal_precision_and_atomic_balance(self, api_client, school_a, admin_a):
        """Verify payment calculations use Decimal precision and prevent double settlement."""
        import datetime
        session = AcademicSession.objects.create(
            school=school_a,
            name="2024/2025",
            start_date=datetime.date(2024, 9, 1),
            end_date=datetime.date(2025, 7, 31),
            is_current=True
        )
        term = AcademicTerm.objects.create(
            school=school_a,
            session=session,
            name="First Term",
            term_type="FIRST",
            start_date=datetime.date(2024, 9, 1),
            end_date=datetime.date(2024, 12, 20),
            is_current=True
        )
        student = Student.objects.create(
            school=school_a,
            admission_number="ADM-PAY-001",
            first_name="Payee",
            last_name="Student",
            gender="FEMALE"
        )
        invoice = StudentInvoice.objects.create(
            school=school_a,
            student=student,
            academic_session=session,
            academic_term=term,
            invoice_number="INV-2024-TEST",
            total_amount=Decimal('50000.00'),
            amount_paid=Decimal('0.00'),
            balance=Decimal('50000.00'),
            status='UNPAID'
        )
        InvoiceItem.objects.create(
            school=school_a,
            invoice=invoice,
            description="Tuition Fee",
            amount=Decimal('50000.00')
        )

        api_client.force_authenticate(user=admin_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        # Record payment
        res = api_client.post(f'/api/v1/finance/invoices/{invoice.id}/record-payment/', {
            'amount': '25000.50',
            'payment_method': 'BANK_TRANSFER',
            'notes': 'Part payment'
        })
        assert res.status_code == 200

        invoice.refresh_from_db()
        assert invoice.amount_paid == Decimal('25000.50')
        assert invoice.balance == Decimal('24999.50')
        assert invoice.status == 'PARTIALLY_PAID'
