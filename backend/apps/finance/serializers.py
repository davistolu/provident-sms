from rest_framework import serializers
from apps.finance.models import (
    FeeCategory, FeeStructure, StudentInvoice, InvoiceItem, Payment, Expense
)
from apps.students.models import Student

class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeCategory
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class FeeStructureSerializer(serializers.ModelSerializer):
    fee_category_name = serializers.CharField(source='fee_category.name', read_only=True)
    session_name = serializers.CharField(source='academic_session.name', read_only=True)
    term_name = serializers.CharField(source='academic_term.name', read_only=True)
    class_level_name = serializers.CharField(source='class_level.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'fee_category', 'fee_category_name', 'academic_session', 'session_name',
            'academic_term', 'term_name', 'class_level', 'class_level_name', 'amount', 'is_mandatory'
        ]
        read_only_fields = ['id']

class InvoiceItemSerializer(serializers.ModelSerializer):
    fee_category_name = serializers.CharField(source='fee_category.name', read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ['id', 'invoice', 'fee_category', 'fee_category_name', 'description', 'amount']
        read_only_fields = ['id']

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'invoice',
            'reference_number', 'payment_date', 'amount', 'payment_method',
            'payment_method_display', 'recorded_by', 'recorded_by_name', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class StudentInvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    session_name = serializers.CharField(source='academic_session.name', read_only=True)
    term_name = serializers.CharField(source='academic_term.name', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = StudentInvoice
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'academic_session', 'session_name',
            'academic_term', 'term_name', 'invoice_number', 'issue_date', 'due_date',
            'total_amount', 'amount_paid', 'balance', 'status', 'status_display',
            'items', 'payments', 'created_at'
        ]
        read_only_fields = ['id', 'amount_paid', 'balance', 'status', 'created_at']

class ExpenseSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'category', 'amount', 'expense_date',
            'recorded_by', 'recorded_by_name', 'receipt_voucher_no', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
