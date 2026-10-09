from django.db import models
from apps.common.models import TenantModel

class FeeCategory(TenantModel):
    name = models.CharField(max_length=100, help_text="e.g. Tuition, Development Levy, Exam Fee")
    description = models.TextField(blank=True, default='')

    class Meta:
        unique_together = ('school', 'name')
        ordering = ['name']

    def __str__(self):
        return self.name

class FeeStructure(TenantModel):
    fee_category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name='fee_structures')
    academic_session = models.ForeignKey('academics.AcademicSession', on_delete=models.CASCADE, related_name='fee_structures')
    academic_term = models.ForeignKey('academics.AcademicTerm', on_delete=models.CASCADE, related_name='fee_structures')
    class_level = models.ForeignKey('academics.ClassLevel', on_delete=models.CASCADE, null=True, blank=True, related_name='fee_structures')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_mandatory = models.BooleanField(default=True)

    class Meta:
        unique_together = ('fee_category', 'academic_session', 'academic_term', 'class_level')
        ordering = ['class_level', 'fee_category']

    def __str__(self):
        target = self.class_level.name if self.class_level else "All Classes"
        return f"{self.fee_category.name} ({target}): {self.amount}"

class StudentInvoice(TenantModel):
    class StatusChoices(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        PAID = 'PAID', 'Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='invoices')
    academic_session = models.ForeignKey('academics.AcademicSession', on_delete=models.CASCADE, related_name='invoices')
    academic_term = models.ForeignKey('academics.AcademicTerm', on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, db_index=True)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.UNPAID, db_index=True)

    class Meta:
        unique_together = ('school', 'invoice_number')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} - {self.student.full_name} ({self.status})"

    def recalculate_totals(self):
        """Authoritative backend balance recalculation."""
        from django.db.models import Sum
        items_total = self.items.aggregate(total=Sum('amount'))['total'] or 0.00
        paid_total = self.payments.aggregate(total=Sum('amount'))['total'] or 0.00
        self.total_amount = items_total
        self.amount_paid = paid_total
        self.balance = max(0.00, float(items_total) - float(paid_total))
        if self.balance == 0 and self.total_amount > 0:
            self.status = self.StatusChoices.PAID
        elif self.amount_paid > 0:
            self.status = self.StatusChoices.PARTIALLY_PAID
        else:
            self.status = self.StatusChoices.UNPAID
        self.save()

class InvoiceItem(TenantModel):
    invoice = models.ForeignKey(StudentInvoice, on_delete=models.CASCADE, related_name='items')
    fee_category = models.ForeignKey(FeeCategory, on_delete=models.SET_NULL, null=True)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.description}: {self.amount}"

class Payment(TenantModel):
    class MethodChoices(models.TextChoices):
        CASH = 'CASH', 'Cash'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        POS = 'POS', 'POS'
        CHEQUE = 'CHEQUE', 'Cheque'
        ONLINE = 'ONLINE', 'Online'

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='payments')
    invoice = models.ForeignKey(StudentInvoice, on_delete=models.CASCADE, related_name='payments')
    reference_number = models.CharField(max_length=50, db_index=True)
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=MethodChoices.choices, default=MethodChoices.BANK_TRANSFER)
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='recorded_payments')
    notes = models.TextField(blank=True, default='')

    class Meta:
        unique_together = ('school', 'reference_number')
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"{self.reference_number}: {self.amount} ({self.student.full_name})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.recalculate_totals()

class Expense(TenantModel):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default='General Operational')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField()
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='recorded_expenses')
    receipt_voucher_no = models.CharField(max_length=50, blank=True, default='')
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-expense_date', '-created_at']

    def __str__(self):
        return f"{self.title}: {self.amount} on {self.expense_date}"
