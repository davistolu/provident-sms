import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, DollarSign, Download, Plus, CheckCircle2, FileText } from 'lucide-react';
import { api } from '@/services/api';
import { StudentInvoice, ClassArm, PaginatedResponse } from '@/types';
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StudentInvoice | null>(null);

  // Generate form
  const [genClassId, setGenClassId] = useState('');
  const [genMessage, setGenMessage] = useState<string | null>(null);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'BANK_TRANSFER',
    notes: '',
  });

  const { data: invoicesData, isLoading } = useQuery({
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

  // Generate Invoices Mutation
  const generateMutation = useMutation({
    mutationFn: (class_arm_id: string) =>
      api.post<any>('/finance/invoices/generate-for-class/', { class_arm_id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsGenerateModalOpen(false);
      setGenMessage(res.message || 'Invoices generated successfully!');
      setTimeout(() => setGenMessage(null), 4000);
    },
  });

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (payload: { invoice_id: string; amount: number; payment_method: string; notes: string }) =>
      api.post<any>(`/finance/invoices/${payload.invoice_id}/record-payment/`, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', payment_method: 'BANK_TRANSFER', notes: '' });
      setSelectedInvoice(null);
    },
  });

  const columns: Column<StudentInvoice>[] = [
    {
      header: 'Invoice No',
      accessorKey: 'invoice_number',
      cell: (row) => <span className="font-mono font-bold text-xs text-indigo-600">{row.invoice_number}</span>,
    },
    {
      header: 'Student Name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.student_name}</p>
          <p className="text-[11px] font-mono text-slate-400">{row.admission_number}</p>
        </div>
      ),
    },
    {
      header: 'Term / Session',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.term_name} ({row.session_name})
        </span>
      ),
    },
    {
      header: 'Total Billed',
      cell: (row) => <span className="font-bold text-slate-900 text-xs">₦{Number(row.total_amount).toLocaleString()}</span>,
    },
    {
      header: 'Paid to Date',
      cell: (row) => (
        <span className="font-bold text-emerald-700 text-xs">₦{Number(row.amount_paid).toLocaleString()}</span>
      ),
    },
    {
      header: 'Balance Due',
      cell: (row) => (
        <span className="font-bold text-rose-700 text-xs">₦{Number(row.balance).toLocaleString()}</span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'PAID' ? 'success' : row.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'
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
          {row.status !== 'PAID' && (
            <Button
              variant="outline"
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
          {row.payments?.length > 0 && (
            <a
              href={`/api/v1/finance/payments/${row.payments[0].id}/receipt-pdf/`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="ghost" size="sm" icon={FileText} title="Download Receipt">
                Receipt
              </Button>
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Fee Invoicing & Receipts</h1>
          <p className="text-xs text-slate-500">Track fee obligations, record manual collections, and issue official receipts</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsGenerateModalOpen(true)}>
          Generate Class Invoices
        </Button>
      </div>

      {genMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {genMessage}
        </div>
      )}

      <DataTable
        columns={columns}
        data={invoicesData?.results || []}
        isLoading={isLoading}
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
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

      {/* Generate Invoices Modal */}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Class</label>
            <select
              required
              value={genClassId}
              onChange={(e) => setGenClassId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="">Select Class Arm</option>
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            This will calculate applicable fees for all enrolled students in the selected class and create pending invoice statements.
          </p>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={generateMutation.isPending}>
              Issue Invoices
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Fee Payment"
        subtitle={`Invoice: ${selectedInvoice?.invoice_number} &bull; Student: ${selectedInvoice?.student_name}`}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
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

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" isLoading={recordPaymentMutation.isPending}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
