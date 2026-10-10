import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, DollarSign, Download, Plus, CheckCircle2, FileText, Printer, User, Wallet, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/context/ToastContext';
import { StudentInvoice, ClassArm, Student, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

export const InvoicesListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isStudentInvoiceModalOpen, setIsStudentInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StudentInvoice | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Generate form
  const [genClassId, setGenClassId] = useState('');
  const [genStudentId, setGenStudentId] = useState('');
  const [genMessage, setGenMessage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'BANK_TRANSFER',
    notes: '',
  });

  const {
    data: invoicesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invoices', page, statusFilter],
    queryFn: () =>
      api.get<PaginatedResponse<StudentInvoice>>('/finance/invoices/', {
        page,
        status: statusFilter || undefined,
      }),
  });

  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['active-students-list'],
    queryFn: () => api.get<PaginatedResponse<Student>>('/students/students/?status=ACTIVE'),
  });

  // Generate Invoices for Class Mutation
  const generateMutation = useMutation({
    mutationFn: (class_arm_id: string) =>
      api.post<any>('/finance/invoices/generate-for-class/', { class_arm_id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsGenerateModalOpen(false);
      const msg = res.message || 'Invoices generated successfully!';
      setGenMessage(msg);
      toast.success(msg);
      setGenError(null);
      setTimeout(() => setGenMessage(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to generate class invoices.';
      setGenError(msg);
      toast.error(err, 'Failed to generate class invoices');
    },
  });

  // Generate Invoice for Single Student Mutation
  const generateStudentInvoiceMutation = useMutation({
    mutationFn: (student_id: string) =>
      api.post<any>('/finance/invoices/generate-for-student/', { student_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsStudentInvoiceModalOpen(false);
      const msg = 'Student invoice generated successfully!';
      setGenMessage(msg);
      toast.success(msg);
      setGenError(null);
      setTimeout(() => setGenMessage(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to generate student invoice.';
      setGenError(msg);
      toast.error(err, 'Failed to generate student invoice');
    },
  });

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (payload: { invoice_id: string; amount: number; payment_method: string; notes: string }) =>
      api.post<any>(`/finance/invoices/${payload.invoice_id}/record-payment/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', payment_method: 'BANK_TRANSFER', notes: '' });
      setSelectedInvoice(null);
      const msg = 'Payment recorded successfully!';
      setGenMessage(msg);
      toast.success(msg);
      setTimeout(() => setGenMessage(null), 4000);
    },
    onError: (err) => {
      toast.error(err, 'Failed to record payment');
    },
  });

  // Safe PDF Download Handlers
  const handleDownloadInvoicePDF = async (inv: StudentInvoice) => {
    try {
      setDownloadingId(`inv-${inv.id}`);
      await api.downloadFile(`/finance/invoices/${inv.id}/invoice-pdf/`, `Invoice_${inv.invoice_number}.pdf`);
      toast.success(`Invoice ${inv.invoice_number} downloaded`);
    } catch (err: any) {
      toast.error(err, 'Failed to download invoice PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadReceiptPDF = async (paymentId: string, refNo: string) => {
    try {
      setDownloadingId(`rec-${paymentId}`);
      await api.downloadFile(`/finance/payments/${paymentId}/receipt-pdf/`, `Receipt_${refNo}.pdf`);
      toast.success(`Receipt ${refNo} downloaded`);
    } catch (err: any) {
      toast.error(err, 'Failed to download receipt PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: Column<StudentInvoice>[] = [
    {
      header: 'Invoice Reference',
      accessorKey: 'invoice_number',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-[#064e3b]">{row.invoice_number}</span>
          <div className="text-[11px] text-[#52606d] font-sans">
            {row.term_name} • {row.session_name}
          </div>
        </div>
      ),
    },
    {
      header: 'Student Dossier',
      cell: (row) => (
        <div>
          <p className="font-semibold text-sm text-[#141d24]">{row.student_name}</p>
          <p className="text-xs font-mono text-[#52606d]">{row.admission_number}</p>
        </div>
      ),
    },
    {
      header: 'Total Billed',
      cell: (row) => <span className="font-mono font-bold text-[#141d24] text-xs">₦{Number(row.total_amount).toLocaleString()}</span>,
    },
    {
      header: 'Paid to Date',
      cell: (row) => (
        <span className="font-mono font-bold text-[#064e3b] text-xs">₦{Number(row.amount_paid).toLocaleString()}</span>
      ),
    },
    {
      header: 'Balance Due',
      cell: (row) => (
        <span className="font-mono font-bold text-[#be123c] text-xs">₦{Number(row.balance).toLocaleString()}</span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'PAID' ? 'evergreen' : row.status === 'PARTIALLY_PAID' ? 'gold' : 'danger'
          }
        >
          {row.status_display}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Download Invoice PDF */}
          <Button
            variant="outline"
            size="sm"
            icon={FileText}
            title="Download Official Invoice PDF"
            isLoading={downloadingId === `inv-${row.id}`}
            onClick={() => handleDownloadInvoicePDF(row)}
          >
            Invoice
          </Button>

          {/* Pay Button */}
          {row.status !== 'PAID' && (
            <Button
              variant="primary"
              size="sm"
              icon={DollarSign}
              onClick={() => {
                setSelectedInvoice(row);
                setPaymentForm({ amount: String(row.balance), payment_method: 'BANK_TRANSFER', notes: '' });
                setIsPaymentModalOpen(true);
              }}
            >
              Pay
            </Button>
          )}

          {/* Download Receipt PDF if payment recorded */}
          {row.payments && row.payments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-[#064e3b] border-[#a7f3d0] hover:bg-[#ecfdf5]"
              icon={Printer}
              title="Download Payment Receipt PDF"
              isLoading={downloadingId === `rec-${row.payments[0].id}`}
              onClick={() => handleDownloadReceiptPDF(row.payments[0].id, row.payments[0].reference_number)}
            >
              Receipt
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e3dc]">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#141d24]">
            Student Fee Invoicing & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Track student fee obligations, issue official PDF billing statements, and record financial settlements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={User} onClick={() => setIsStudentInvoiceModalOpen(true)}>
            Single Student Invoice
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsGenerateModalOpen(true)}>
            Generate Class Invoices
          </Button>
        </div>
      </div>

      {genMessage && (
        <div className="p-3.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#064e3b] text-xs font-semibold rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          {genMessage}
        </div>
      )}

      {genError && (
        <div className="p-3.5 bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] text-xs font-semibold rounded-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#be123c]" />
          {genError}
        </div>
      )}

      <DataTable
        columns={columns}
        data={invoicesData?.results || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
          >
            <option value="">All Payment Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid in Full</option>
          </select>
        }
        currentPage={page}
        totalPages={invoicesData?.total_pages || 1}
        totalCount={invoicesData?.count}
        onPageChange={(p) => setPage(p)}
      />

      {/* Generate Class Invoices Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Invoices for Class"
        subtitle="Batch-issues student invoices according to active fee tariffs"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (genClassId) generateMutation.mutate(genClassId);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#141d24] mb-1">Select Target Class</label>
            <select
              required
              value={genClassId}
              onChange={(e) => setGenClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
            >
              <option value="">Select Class Arm</option>
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[#52606d] bg-[#fbfbfa] p-3 rounded-md border border-[#e5e3dc] space-y-1">
            <p className="font-semibold text-[#141d24]">Automated Fee Allocation</p>
            <p>
              Calculates applicable tuition and auxiliary levies for all enrolled students in the selected class arm, creating pending debit records.
            </p>
          </div>

          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={generateMutation.isPending} loadingText="Generating...">
              Issue Invoices
            </Button>
          </div>
        </form>
      </Modal>

      {/* Generate Single Student Invoice Modal */}
      <Modal
        isOpen={isStudentInvoiceModalOpen}
        onClose={() => setIsStudentInvoiceModalOpen(false)}
        title="Generate Student Invoice"
        subtitle="Issue or refresh fee invoice for an individual student"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (genStudentId) generateStudentInvoiceMutation.mutate(genStudentId);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#141d24] mb-1">Select Student</label>
            <select
              required
              value={genStudentId}
              onChange={(e) => setGenStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
            >
              <option value="">Select Student</option>
              {studentsData?.results?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.admission_number})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsStudentInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={generateStudentInvoiceMutation.isPending} loadingText="Generating...">
              Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Fee Settlement"
        subtitle={`Invoice: ${selectedInvoice?.invoice_number} • Student: ${selectedInvoice?.student_name}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedInvoice) {
              recordPaymentMutation.mutate({
                invoice_id: selectedInvoice.id,
                amount: parseFloat(paymentForm.amount),
                payment_method: paymentForm.payment_method,
                notes: paymentForm.notes,
              });
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Payment Amount (₦)"
            type="number"
            required
            max={selectedInvoice?.balance}
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-[#141d24] mb-1">Payment Method</label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
            >
              <option value="BANK_TRANSFER">Bank Direct Transfer</option>
              <option value="CASH">Cash Deposit</option>
              <option value="POS">Point of Sale (POS)</option>
              <option value="CHEQUE">Bank Cheque</option>
            </select>
          </div>

          <Input
            label="Payment Notes / Bank Reference"
            placeholder="e.g. GTBank transfer Ref: 98124401"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
          />

          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={recordPaymentMutation.isPending} loadingText="Recording...">
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

