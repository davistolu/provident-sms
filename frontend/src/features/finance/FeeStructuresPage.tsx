import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard, Trash2, Edit } from 'lucide-react';
import { api } from '@/services/api';
import { FeeStructure, FeeCategory, ClassLevel, AcademicSession, AcademicTerm, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';

export const FeeStructuresPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FeeStructure | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeStructure | null>(null);

  const [feeForm, setFeeForm] = useState({
    fee_category: '',
    academic_session: '',
    academic_term: '',
    class_level: '',
    amount: '',
  });

  const [editForm, setEditForm] = useState({
    fee_category: '',
    academic_session: '',
    academic_term: '',
    class_level: '',
    amount: '',
  });

  const { data: structuresData, isLoading } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => api.get<PaginatedResponse<FeeStructure>>('/finance/fee-structures/'),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['fee-categories'],
    queryFn: () => api.get<PaginatedResponse<FeeCategory>>('/finance/fee-categories/'),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: () => api.get<PaginatedResponse<AcademicSession>>('/academics/sessions/'),
  });

  const { data: levelsData } = useQuery({
    queryKey: ['class-levels'],
    queryFn: () => api.get<PaginatedResponse<ClassLevel>>('/academics/class-levels/'),
  });

  const createFeeMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/fee-structures/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsModalOpen(false);
      setFeeForm({ fee_category: '', academic_session: '', academic_term: '', class_level: '', amount: '' });
    },
  });

  const updateFeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/finance/fee-structures/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setEditTarget(null);
    },
  });

  const deleteFeeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/fee-structures/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setDeleteTarget(null);
    },
  });

  const handleEditOpen = (fee: FeeStructure) => {
    setEditTarget(fee);
    setEditForm({
      fee_category: fee.fee_category || '',
      academic_session: fee.academic_session || '',
      academic_term: fee.academic_term || '',
      class_level: fee.class_level || '',
      amount: String(fee.amount || ''),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    updateFeeMutation.mutate({
      id: editTarget.id,
      data: {
        ...editForm,
        amount: parseFloat(editForm.amount),
        class_level: editForm.class_level || null,
      },
    });
  };

  const columns: Column<FeeStructure>[] = [
    {
      header: 'Fee Category',
      accessorKey: 'fee_category_name',
      cell: (row) => <span className="font-bold text-slate-900">{row.fee_category_name}</span>,
    },
    {
      header: 'Class Target',
      cell: (row) => (
        <span className="font-semibold text-slate-700">
          {row.class_level_name || <Badge variant="neutral">All Classes</Badge>}
        </span>
      ),
    },
    {
      header: 'Academic Term',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.term_name} ({row.session_name})
        </span>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (row) => (
        <span className="font-bold text-indigo-700 text-sm">
          ₦{Number(row.amount).toLocaleString()}
        </span>
      ),
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
          <h1 className="text-xl font-bold text-slate-900">Fee Structures & Tariffs</h1>
          <p className="text-xs text-slate-500">Configure tuition, development, and examination charges by class level</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Fee Structure
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={structuresData?.results || []}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Fee Structure"
        subtitle="Set termly charges by educational level"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createFeeMutation.mutate({
              ...feeForm,
              amount: parseFloat(feeForm.amount),
              class_level: feeForm.class_level || null,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Category</label>
            <select
              required
              value={feeForm.fee_category}
              onChange={(e) => setFeeForm({ ...feeForm, fee_category: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="">Select Category</option>
              {categoriesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session</label>
              <select
                required
                value={feeForm.academic_session}
                onChange={(e) => setFeeForm({ ...feeForm, academic_session: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="">Select Session</option>
                {sessionsData?.results?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Term</label>
              <select
                required
                value={feeForm.academic_term}
                onChange={(e) => setFeeForm({ ...feeForm, academic_term: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="">Select Term</option>
                {sessionsData?.results?.find((s) => s.id === feeForm.academic_session)?.terms?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class Level (Optional)</label>
            <select
              value={feeForm.class_level}
              onChange={(e) => setFeeForm({ ...feeForm, class_level: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="">All Classes (General)</option>
              {levelsData?.results?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount (₦)"
            type="number"
            required
            placeholder="e.g. 150000"
            value={feeForm.amount}
            onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createFeeMutation.isPending}>
              Save Fee Tariff
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Fee Structure Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Fee Structure"
        subtitle={`Update tariff for ${editTarget?.fee_category_name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Category</label>
            <select
              required
              value={editForm.fee_category}
              onChange={(e) => setEditForm({ ...editForm, fee_category: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="">Select Category</option>
              {categoriesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session</label>
              <select
                required
                value={editForm.academic_session}
                onChange={(e) => setEditForm({ ...editForm, academic_session: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="">Select Session</option>
                {sessionsData?.results?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Term</label>
              <select
                required
                value={editForm.academic_term}
                onChange={(e) => setEditForm({ ...editForm, academic_term: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="">Select Term</option>
                {sessionsData?.results?.find((s) => s.id === editForm.academic_session)?.terms?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class Level (Optional)</label>
            <select
              value={editForm.class_level}
              onChange={(e) => setEditForm({ ...editForm, class_level: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="">All Classes (General)</option>
              {levelsData?.results?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount (₦)"
            type="number"
            required
            placeholder="e.g. 150000"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateFeeMutation.isPending}>
              Save Tariff Changes
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteFeeMutation.mutate(deleteTarget.id);
        }}
        title="Delete Fee Structure"
        message={`Are you sure you want to delete the fee structure "${deleteTarget?.fee_category_name}" for ₦${deleteTarget?.amount}?`}
        isLoading={deleteFeeMutation.isPending}
      />
    </div>
  );
};
