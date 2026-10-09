import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { AcademicSession, AcademicTerm, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

export const AcademicSessionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: () => api.get<PaginatedResponse<AcademicSession>>('/academics/sessions/'),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/sessions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      setIsModalOpen(false);
      setSessionForm({ name: '', start_date: '', end_date: '', is_current: false });
    },
  });

  const columns: Column<AcademicSession>[] = [
    {
      header: 'Academic Session',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <span>{row.name}</span>
          {row.is_current && <Badge variant="success">Current Active</Badge>}
        </div>
      ),
    },
    {
      header: 'Start Date',
      accessorKey: 'start_date',
    },
    {
      header: 'End Date',
      accessorKey: 'end_date',
    },
    {
      header: 'Configured Terms',
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.terms?.map((t) => (
            <span
              key={t.id}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                t.is_current ? 'bg-indigo-100 text-indigo-700 font-bold border border-indigo-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.name} {t.is_current ? '(Active)' : ''}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Sessions & Terms</h1>
          <p className="text-xs text-slate-500">Configure institutional calendar, sessions, and term date boundaries</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Session
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sessionsData?.results || []}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Academic Session"
        subtitle="Define new calendar year session"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSessionMutation.mutate(sessionForm);
          }}
          className="space-y-4"
        >
          <Input
            label="Session Name"
            required
            placeholder="e.g. 2025/2026"
            value={sessionForm.name}
            onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={sessionForm.start_date}
              onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={sessionForm.end_date}
              onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_current"
              checked={sessionForm.is_current}
              onChange={(e) => setSessionForm({ ...sessionForm, is_current: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_current" className="text-xs font-semibold text-slate-700">
              Set as current active academic session
            </label>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createSessionMutation.isPending}>
              Create Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
