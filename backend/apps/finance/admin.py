from django.contrib import admin
from .models import FeeCategory, FeeStructure, StudentInvoice, InvoiceItem, Payment, Expense

class FeeStructureInline(admin.TabularInline):
    model = FeeStructure
    extra = 1

@admin.register(FeeCategory)
class FeeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'school')
    search_fields = ('name', 'school__name')
    list_filter = ('school',)
    inlines = [FeeStructureInline]

@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('fee_category', 'class_level', 'academic_session', 'academic_term', 'amount', 'is_mandatory', 'school')
    list_filter = ('is_mandatory', 'academic_session', 'academic_term', 'school')
    search_fields = ('fee_category__name', 'class_level__name', 'school__name')

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1

class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ('reference_number', 'payment_date', 'amount', 'payment_method', 'recorded_by')

@admin.register(StudentInvoice)
class StudentInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'student', 'total_amount', 'amount_paid', 'balance', 'status', 'issue_date', 'school')
    list_filter = ('status', 'academic_session', 'academic_term', 'school')
    search_fields = ('invoice_number', 'student__first_name', 'student__last_name', 'student__admission_number', 'school__name')
    readonly_fields = ('total_amount', 'amount_paid', 'balance')
    inlines = [InvoiceItemInline, PaymentInline]

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'student', 'invoice', 'amount', 'payment_method', 'payment_date', 'recorded_by', 'school')
    list_filter = ('payment_method', 'payment_date', 'school')
    search_fields = ('reference_number', 'student__first_name', 'student__last_name', 'invoice__invoice_number')
    date_hierarchy = 'payment_date'
    raw_id_fields = ('student', 'invoice', 'recorded_by')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'expense_date', 'receipt_voucher_no', 'recorded_by', 'school')
    list_filter = ('category', 'expense_date', 'school')
    search_fields = ('title', 'receipt_voucher_no', 'category', 'school__name')
    date_hierarchy = 'expense_date'
    raw_id_fields = ('recorded_by',)
