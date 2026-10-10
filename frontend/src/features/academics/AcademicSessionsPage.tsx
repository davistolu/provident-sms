import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, CheckCircle2, Edit3, Trash2, Clock, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/context/ToastContext';
import { AcademicSession, AcademicTerm, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';

export const AcademicSessionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademicSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicSession | null>(null);

  const [sessionForm, setSessionForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  const {
    data: sessionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: () => api.get<PaginatedResponse<AcademicSession>>('/academics/sessions/'),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/sessions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      setIsModalOpen(false);
      setSessionForm({ name: '', start_date: '', end_date: '', is_current: false });
      toast.success('Academic session created successfully');
    },
    onError: (err) => {
      toast.error(err, 'Failed to create academic session');
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/academics/sessions/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      setEditTarget(null);
      toast.success('Academic session updated successfully');
    },
    onError: (err) => {
      toast.error(err, 'Failed to update academic session');
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academics/sessions/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      setDeleteTarget(null);
      toast.success('Academic session deleted successfully');
    },
    onError: (err) => {
      toast.error(err, 'Failed to delete academic session');
    },
  });

  const handleEditOpen = (session: AcademicSession) => {
    setEditTarget(session);
    setEditForm({
      name: session.name || '',
      start_date: session.start_date || '',
      end_date: session.end_date || '',
      is_current: session.is_current,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    updateSessionMutation.mutate({ id: editTarget.id, data: editForm });
  };

  const columns: Column<AcademicSession>[] = [
    {
      header: 'Academic Session',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#f4f3ef] border border-[#e5e3dc] flex items-center justify-center text-[#141d24]">
            <Calendar className="w-4 h-4 text-[#064e3b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#141d24]">{row.name}</span>
              {row.is_current && <Badge variant="evergreen">Current Active</Badge>}
            </div>
            <div className="text-xs text-[#52606d] font-mono mt-0.5">
              ID: {row.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Calendar Span',
      cell: (row) => (
        <div className="text-xs font-mono text-[#52606d] flex items-center gap-1.5">
          <span className="text-[#141d24] font-medium">{row.start_date || 'N/A'}</span>
          <span>→</span>
          <span className="text-[#141d24] font-medium">{row.end_date || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Configured Terms',
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.terms && row.terms.length > 0 ? (
            row.terms.map((t) => (
              <span
                key={t.id}
                className={`px-2 py-0.5 rounded text-[11px] font-medium tracking-tight ${
                  t.is_current
                    ? 'bg-[#ecfdf5] text-[#064e3b] font-semibold border border-[#a7f3d0]'
                    : 'bg-[#f4f3ef] text-[#52606d] border border-[#e5e3dc]'
                }`}
              >
                {t.name} {t.is_current ? '• Active' : ''}
              </span>
            ))
          ) : (
            <span className="text-xs text-[#8c9ba5] italic">No terms configured</span>
          )}
        </div>
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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e3dc]">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#141d24]">
            Academic Sessions & Terms
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Configure institutional calendar cycles, active terms, and academic timelines
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Session
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sessionsData?.results || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Academic Session"
        subtitle="Define a new academic calendar cycle"
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
            placeholder="e.g. 2025/2026 Academic Session"
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
          <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#e5e3dc] bg-[#fbfbfa] cursor-pointer hover:bg-[#f4f3ef] transition-colors">
            <input
              type="checkbox"
              checked={sessionForm.is_current}
              onChange={(e) => setSessionForm({ ...sessionForm, is_current: e.target.checked })}
              className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b] border-[#cbd2d9]"
            />
            <div>
              <div className="text-xs font-semibold text-[#141d24]">Set as Active Session</div>
              <div className="text-[11px] text-[#52606d]">Marks this session as the institutional default across all modules</div>
            </div>
          </label>
          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createSessionMutation.isPending} loadingText="Creating...">
              Create Session
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Session Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Academic Session"
        subtitle={`Update calendar dates for session ${editTarget?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Session Name"
            required
            placeholder="e.g. 2025/2026"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={editForm.start_date}
              onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={editForm.end_date}
              onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#e5e3dc] bg-[#fbfbfa] cursor-pointer hover:bg-[#f4f3ef] transition-colors">
            <input
              type="checkbox"
              checked={editForm.is_current}
              onChange={(e) => setEditForm({ ...editForm, is_current: e.target.checked })}
              className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b] border-[#cbd2d9]"
            />
            <div>
              <div className="text-xs font-semibold text-[#141d24]">Set as Active Session</div>
              <div className="text-[11px] text-[#52606d]">Marks this session as the institutional default across all modules</div>
            </div>
          </label>
          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateSessionMutation.isPending} loadingText="Saving...">
              Save Session Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Session Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteSessionMutation.mutate(deleteTarget.id);
        }}
        title="Delete Academic Session"
        message={`Are you sure you want to delete session "${deleteTarget?.name}"? Any attached records will need to be re-assigned.`}
        isLoading={deleteSessionMutation.isPending}
        loadingText="Deleting..."
      />
    </div>
  );
};

