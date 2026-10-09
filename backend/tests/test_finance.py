import pytest
import datetime
from decimal import Decimal
from apps.academics.models import AcademicSession, AcademicTerm, ClassLevel, ClassArm
from apps.students.models import Student, StudentEnrollment
from apps.finance.models import FeeCategory, FeeStructure, StudentInvoice, InvoiceItem, Payment

@pytest.mark.django_db
class TestFinance:
    def test_invoice_creation_and_partial_payments(self, api_client, school_a, admin_a):
        session = AcademicSession.objects.create(school=school_a, name="2024/2025", start_date=datetime.date(2024, 9, 1), end_date=datetime.date(2025, 7, 1))
        term = AcademicTerm.objects.create(school=school_a, session=session, term_type="FIRST_TERM", name="First Term", start_date=datetime.date(2024, 9, 1), end_date=datetime.date(2024, 12, 1))
        level = ClassLevel.objects.create(school=school_a, name="JSS 1")
        arm = ClassArm.objects.create(school=school_a, class_level=level, name="Gold")
        student = Student.objects.create(school=school_a, admission_number="ADM-FIN-01", first_name="Tunde", last_name="Bakare")
        StudentEnrollment.objects.create(school=school_a, student=student, class_arm=arm, academic_session=session)

        fee_cat = FeeCategory.objects.create(school=school_a, name="Tuition")
        FeeStructure.objects.create(school=school_a, fee_category=fee_cat, academic_session=session, academic_term=term, class_level=level, amount=Decimal('100000.00'))

        api_client.force_authenticate(user=admin_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        # Generate invoices for the class
        res_gen = api_client.post('/api/v1/finance/invoices/generate-for-class/', {
            'class_arm_id': str(arm.id),
            'academic_session_id': str(session.id),
            'academic_term_id': str(term.id)
        })
        assert res_gen.status_code == 200

        invoice = StudentInvoice.objects.filter(school=school_a, student=student).first()
        assert invoice is not None
        assert invoice.total_amount == Decimal('100000.00')
        assert invoice.balance == Decimal('100000.00')
        assert invoice.status == StudentInvoice.StatusChoices.UNPAID

        # Record partial payment of 40,000
        res_pay1 = api_client.post(f'/api/v1/finance/invoices/{invoice.id}/record-payment/', {
            'amount': 40000.00,
            'payment_method': 'BANK_TRANSFER',
            'notes': 'Part payment'
        })
        assert res_pay1.status_code == 200
        invoice.refresh_from_db()
        assert invoice.amount_paid == Decimal('40000.00')
        assert invoice.balance == Decimal('60000.00')
        assert invoice.status == StudentInvoice.StatusChoices.PARTIALLY_PAID

        # Record final payment of 60,000
        res_pay2 = api_client.post(f'/api/v1/finance/invoices/{invoice.id}/record-payment/', {
            'amount': 60000.00,
            'payment_method': 'CASH',
            'notes': 'Balance cleared'
        })
        assert res_pay2.status_code == 200
        invoice.refresh_from_db()
        assert invoice.amount_paid == Decimal('100000.00')
        assert invoice.balance == Decimal('0.00')
        assert invoice.status == StudentInvoice.StatusChoices.PAID
