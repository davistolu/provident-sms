from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolAdmin
from apps.finance.models import (
    FeeCategory, FeeStructure, StudentInvoice, InvoiceItem, Payment, Expense
)
from apps.finance.serializers import (
    FeeCategorySerializer, FeeStructureSerializer, StudentInvoiceSerializer,
    InvoiceItemSerializer, PaymentSerializer, ExpenseSerializer
)
from apps.finance.receipt_generator import PaymentReceiptPDFGenerator
from apps.students.models import Student, StudentEnrollment
from apps.academics.models import ClassArm, AcademicSession, AcademicTerm

class FeeCategoryViewSet(TenantScopedModelViewSet):
    queryset = FeeCategory.objects.all()
    serializer_class = FeeCategorySerializer
    permission_classes = [IsSchoolAdmin]

class FeeStructureViewSet(TenantScopedModelViewSet):
    queryset = FeeStructure.objects.all().select_related('fee_category', 'academic_session', 'academic_term', 'class_level')
    serializer_class = FeeStructureSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        session_id = self.request.query_params.get('session')
        term_id = self.request.query_params.get('term')
        class_level_id = self.request.query_params.get('class_level')
        if session_id:
            qs = qs.filter(academic_session_id=session_id)
        if term_id:
            qs = qs.filter(academic_term_id=term_id)
        if class_level_id:
            qs = qs.filter(class_level_id=class_level_id)
        return qs

class StudentInvoiceViewSet(TenantScopedModelViewSet):
    queryset = StudentInvoice.objects.all().select_related(
        'student', 'academic_session', 'academic_term'
    ).prefetch_related('items__fee_category', 'payments')
    serializer_class = StudentInvoiceSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        status_filter = self.request.query_params.get('status')
        session_id = self.request.query_params.get('session')
        term_id = self.request.query_params.get('term')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if session_id:
            qs = qs.filter(academic_session_id=session_id)
        if term_id:
            qs = qs.filter(academic_term_id=term_id)
        return qs

    @action(detail=False, methods=['post'], url_path='generate-for-class')
    def generate_for_class(self, request):
        """
        Batch-generates student invoices for an entire class based on applicable fee structures.
        """
        school = self.get_school()
        class_arm_id = request.data.get('class_arm_id')
        session_id = request.data.get('academic_session_id')
        term_id = request.data.get('academic_term_id')

        class_arm = ClassArm.objects.filter(school=school, id=class_arm_id).first()
        session = AcademicSession.objects.filter(school=school, id=session_id).first() if session_id else AcademicSession.objects.filter(school=school, is_current=True).first()
        term = AcademicTerm.objects.filter(school=school, id=term_id).first() if term_id else AcademicTerm.objects.filter(school=school, is_current=True).first()

        if not all([class_arm, session, term]):
            return Response({'error': 'class_arm_id, academic_session_id, and academic_term_id required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get fee structures matching class_level or general (null class_level)
        fee_structures = FeeStructure.objects.filter(
            school=school,
            academic_session=session,
            academic_term=term
        ).filter(
            class_level__in=[class_arm.class_level, None]
        ).select_related('fee_category')

        if not fee_structures.exists():
            return Response({'error': 'No fee structures configured for this class and term.'}, status=status.HTTP_400_BAD_REQUEST)

        enrollments = StudentEnrollment.objects.filter(
            school=school,
            class_arm=class_arm,
            academic_session=session,
            status='ACTIVE'
        ).select_related('student')

        generated_count = 0
        with transaction.atomic():
            for enr in enrollments:
                student = enr.student
                # Invoice number: e.g. INV-2024-001
                prefix = getattr(school.settings, 'invoice_prefix', 'INV') if hasattr(school, 'settings') else 'INV'
                inv_no = f"{prefix}-{session.name[:4]}-{str(student.id)[:6].upper()}"

                invoice, created = StudentInvoice.objects.get_or_create(
                    school=school,
                    student=student,
                    academic_session=session,
                    academic_term=term,
                    defaults={'invoice_number': inv_no}
                )

                if created or not invoice.items.exists():
                    for fs in fee_structures:
                        InvoiceItem.objects.create(
                            school=school,
                            invoice=invoice,
                            fee_category=fs.fee_category,
                            description=fs.fee_category.name,
                            amount=fs.amount
                        )
                    invoice.recalculate_totals()
                    generated_count += 1

        return Response({
            'status': 'success',
            'message': f"Invoices generated for {generated_count} students in {class_arm.display_name}.",
            'generated_count': generated_count
        })

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        """
        Records a manual payment against this invoice and recalculates balances.
        """
        invoice = self.get_object()
        amount = request.data.get('amount')
        method = request.data.get('payment_method', 'BANK_TRANSFER')
        notes = request.data.get('notes', '')
        payment_date = request.data.get('payment_date') or timezone.now().date().isoformat()

        try:
            amount_val = float(amount)
            if amount_val <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response({'error': 'Valid positive payment amount is required'}, status=status.HTTP_400_BAD_REQUEST)

        ref_no = f"REC-{timezone.now().strftime('%Y%m%d%H%M%S')}-{invoice.payments.count() + 1}"

        with transaction.atomic():
            payment = Payment.objects.create(
                school=invoice.school,
                student=invoice.student,
                invoice=invoice,
                reference_number=ref_no,
                payment_date=payment_date,
                amount=amount_val,
                payment_method=method,
                recorded_by=request.user,
                notes=notes
            )
            invoice.recalculate_totals()

        return Response({
            'status': 'success',
            'payment': PaymentSerializer(payment).data,
            'invoice': StudentInvoiceSerializer(invoice).data
        })

class PaymentViewSet(TenantScopedModelViewSet):
    queryset = Payment.objects.all().select_related('student', 'invoice', 'recorded_by')
    serializer_class = PaymentSerializer
    permission_classes = [IsSchoolAdmin]

    @action(detail=True, methods=['get'], url_path='receipt-pdf')
    def download_receipt(self, request, pk=None):
        """Generates and downloads printable payment receipt PDF."""
        payment = self.get_object()
        pdf_bytes = PaymentReceiptPDFGenerator.generate_receipt(payment)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Receipt_{payment.reference_number}.pdf"'
        return response

class ExpenseViewSet(TenantScopedModelViewSet):
    queryset = Expense.objects.all().select_related('recorded_by')
    serializer_class = ExpenseSerializer
    permission_classes = [IsSchoolAdmin]

    def perform_create(self, serializer):
        serializer.save(school=self.get_school(), recorded_by=self.request.user)
