import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, Trash2, Edit } from 'lucide-react';
import { api } from '@/services/api';
import { Expense, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';

export const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_voucher_no: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_voucher_no: '',
    notes: '',
  });

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get<PaginatedResponse<Expense>>('/finance/expenses/'),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/expenses/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false);
      setExpenseForm({
        title: '',
        category: 'Utilities',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        receipt_voucher_no: '',
        notes: '',
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/finance/expenses/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setEditTarget(null);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/expenses/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setDeleteTarget(null);
    },
  });

  const handleEditOpen = (exp: Expense) => {
    setEditTarget(exp);
    setEditForm({
      title: exp.title || '',
      category: exp.category || 'Utilities',
      amount: String(exp.amount || ''),
      expense_date: exp.expense_date || new Date().toISOString().split('T')[0],
      receipt_voucher_no: exp.receipt_voucher_no || '',
      notes: exp.notes || '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    updateExpenseMutation.mutate({
      id: editTarget.id,
      data: {
        ...editForm,
        amount: parseFloat(editForm.amount),
      },
    });
  };

  const columns: Column<Expense>[] = [
    {
      header: 'Expense Item',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.title}</p>
          {row.receipt_voucher_no && (
            <p className="text-[11px] font-mono text-slate-400">Voucher: {row.receipt_voucher_no}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (row) => <Badge variant="neutral">{row.category}</Badge>,
    },
    {
      header: 'Date',
      accessorKey: 'expense_date',
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (row) => (
        <span className="font-bold text-rose-700 text-sm">
          ₦{Number(row.amount).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Recorded By',
      accessorKey: 'recorded_by_name',
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
            icon={Edit}
            onClick={() => handleEditOpen(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50"
            icon={Trash2}
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Operating Expenses</h1>
          <p className="text-xs text-slate-500">Track and monitor school operational expenditures and utilities</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Record Expense
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={expensesData?.results || []}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Institutional Expense"
        subtitle="Log operational disbursement"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createExpenseMutation.mutate({
              ...expenseForm,
              amount: parseFloat(expenseForm.amount),
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Expense Description / Title"
            required
            placeholder="e.g. Generator Diesel Supply (500L)"
            value={expenseForm.title}
            onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="Utilities">Utilities & Fuel</option>
                <option value="Maintenance">Repairs & Maintenance</option>
                <option value="Supplies">Academic & Office Supplies</option>
                <option value="Transportation">Transportation & Logistics</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <Input
              label="Amount (₦)"
              type="number"
              required
              placeholder="e.g. 85000"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expense Date"
              type="date"
              required
              value={expenseForm.expense_date}
              onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
            />
            <Input
              label="Voucher / Invoice Number"
              placeholder="e.g. PV-2024-042"
              value={expenseForm.receipt_voucher_no}
              onChange={(e) => setExpenseForm({ ...expenseForm, receipt_voucher_no: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createExpenseMutation.isPending}>
              Save Expense Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Expense Record"
        subtitle={`Update expense: ${editTarget?.title}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Expense Description / Title"
            required
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="Utilities">Utilities & Fuel</option>
                <option value="Maintenance">Repairs & Maintenance</option>
                <option value="Supplies">Academic & Office Supplies</option>
                <option value="Transportation">Transportation & Logistics</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <Input
              label="Amount (₦)"
              type="number"
              required
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expense Date"
              type="date"
              required
              value={editForm.expense_date}
              onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
            />
            <Input
              label="Voucher / Invoice Number"
              placeholder="e.g. PV-2024-042"
              value={editForm.receipt_voucher_no}
              onChange={(e) => setEditForm({ ...editForm, receipt_voucher_no: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateExpenseMutation.isPending}>
              Save Expense Changes
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteExpenseMutation.mutate(deleteTarget.id);
        }}
        title="Delete Expense Record"
        message={`Are you sure you want to delete the expense "${deleteTarget?.title}" for ₦${deleteTarget?.amount}?`}
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};
