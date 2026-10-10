import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard, Trash2, Edit3, Banknote, Sparkles, Layers } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/context/ToastContext';
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

  const {
    data: structuresData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
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
      toast.success('Fee structure created successfully');
    },
    onError: (err) => {
      toast.error(err, 'Failed to create fee structure');
    },
  });

  const updateFeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/finance/fee-structures/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setEditTarget(null);
      toast.success('Fee structure updated successfully');
    },
    onError: (err) => {
      toast.error(err, 'Failed to update fee structure');
    },
  });

  const deleteFeeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/fee-structures/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setDeleteTarget(null);
      toast.success('Fee structure deleted successfully');
    },
    onError: (err) => {
      toast.error(err, 'Failed to delete fee structure');
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
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#f4f3ef] border border-[#e5e3dc] flex items-center justify-center text-[#064e3b]">
            <Banknote className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#141d24]">{row.fee_category_name}</p>
            <p className="text-xs text-[#52606d] font-mono mt-0.5">
              {row.term_name} • {row.session_name}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Educational Tier Target',
      cell: (row) => (
        <span className="font-medium text-xs text-[#141d24]">
          {row.class_level_name ? (
            <span className="px-2 py-0.5 rounded bg-[#f4f3ef] border border-[#e5e3dc] font-mono">
              {row.class_level_name}
            </span>
          ) : (
            <Badge variant="neutral">All School Levels</Badge>
          )}
        </span>
      ),
    },
    {
      header: 'Tariff Amount',
      accessorKey: 'amount',
      cell: (row) => (
        <span className="font-mono font-bold text-[#064e3b] text-sm">
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
            className="text-[#52606d] hover:text-[#064e3b] hover:bg-[#f4f3ef]"
            icon={Edit3}
            onClick={() => handleEditOpen(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#be123c] hover:bg-[#fff1f2]"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e3dc]">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#141d24]">
            Fee Structures & Tariffs
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Configure institutional tuition, development, lab, and examination charges by class level
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Fee Structure
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={structuresData?.results || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
      />

      {/* Add Modal */}
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
            <label className="block text-xs font-semibold text-[#141d24] mb-1">Fee Category</label>
            <select
              required
              value={feeForm.fee_category}
              onChange={(e) => setFeeForm({ ...feeForm, fee_category: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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
              <label className="block text-xs font-semibold text-[#141d24] mb-1">Session</label>
              <select
                required
                value={feeForm.academic_session}
                onChange={(e) => setFeeForm({ ...feeForm, academic_session: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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
              <label className="block text-xs font-semibold text-[#141d24] mb-1">Term</label>
              <select
                required
                value={feeForm.academic_term}
                onChange={(e) => setFeeForm({ ...feeForm, academic_term: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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
            <label className="block text-xs font-semibold text-[#141d24] mb-1">Target Class Level (Optional)</label>
            <select
              value={feeForm.class_level}
              onChange={(e) => setFeeForm({ ...feeForm, class_level: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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

          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createFeeMutation.isPending} loadingText="Saving...">
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
            <label className="block text-xs font-semibold text-[#141d24] mb-1">Fee Category</label>
            <select
              required
              value={editForm.fee_category}
              onChange={(e) => setEditForm({ ...editForm, fee_category: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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
              <label className="block text-xs font-semibold text-[#141d24] mb-1">Session</label>
              <select
                required
                value={editForm.academic_session}
                onChange={(e) => setEditForm({ ...editForm, academic_session: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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
              <label className="block text-xs font-semibold text-[#141d24] mb-1">Term</label>
              <select
                required
                value={editForm.academic_term}
                onChange={(e) => setEditForm({ ...editForm, academic_term: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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
            <label className="block text-xs font-semibold text-[#141d24] mb-1">Target Class Level (Optional)</label>
            <select
              value={editForm.class_level}
              onChange={(e) => setEditForm({ ...editForm, class_level: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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

          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateFeeMutation.isPending} loadingText="Saving...">
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
        loadingText="Deleting..."
      />
    </div>
  );
};

