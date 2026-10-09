import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard } from 'lucide-react';
import { api } from '@/services/api';
import { FeeStructure, FeeCategory, ClassLevel, AcademicSession, AcademicTerm, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

export const FeeStructuresPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({
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
    </div>
  );
};
