import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, Layers, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { AssessmentScheme, GradingScale, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

export const AssessmentSchemesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'schemes' | 'grading'>('schemes');
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [schemeForm, setSchemeForm] = useState({
    name: '',
    max_total_score: 100,
    is_default: true,
  });

  const { data: schemesData, isLoading: isSchemesLoading } = useQuery({
    queryKey: ['assessment-schemes'],
    queryFn: () => api.get<PaginatedResponse<AssessmentScheme>>('/assessments/schemes/'),
  });

  const { data: gradingData, isLoading: isGradingLoading } = useQuery({
    queryKey: ['grading-scales'],
    queryFn: () => api.get<PaginatedResponse<GradingScale>>('/assessments/grading-scales/'),
  });

  const createSchemeMutation = useMutation({
    mutationFn: (data: any) => api.post('/assessments/schemes/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-schemes'] });
      setIsSchemeModalOpen(false);
      setSchemeForm({ name: '', max_total_score: 100, is_default: true });
    },
  });

  const schemeColumns: Column<AssessmentScheme>[] = [
    {
      header: 'Scheme Name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-900">{row.name}</p>
          {row.is_default && <Badge variant="success">Default</Badge>}
        </div>
      ),
    },
    {
      header: 'Max Marks',
      accessorKey: 'max_total_score',
      cell: (row) => <span className="font-bold text-slate-800">{row.max_total_score} marks</span>,
    },
    {
      header: 'Components Breakdown',
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.components?.map((c) => (
            <span key={c.id} className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-semibold text-slate-700">
              {c.name} ({c.code}: {c.max_score}m)
            </span>
          ))}
        </div>
      ),
    },
  ];

  const gradingColumns: Column<GradingScale>[] = [
    {
      header: 'Grading Scale Name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-900">{row.name}</p>
          {row.is_default && <Badge variant="success">Default</Badge>}
        </div>
      ),
    },
    {
      header: 'Grade Boundaries',
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.rules?.map((r) => (
            <span key={r.id} className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-800">
              {r.grade} ({r.min_score}-{r.max_score}%: {r.remark})
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
          <h1 className="text-xl font-bold text-slate-900">Assessment Schemes & Grading Rules</h1>
          <p className="text-xs text-slate-500">Configure Continuous Assessment (CA) weightages and letter grade ranges</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsSchemeModalOpen(true)}>
          New Scheme
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'schemes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Assessment Schemes ({schemesData?.results?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'grading'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Grading Scales ({gradingData?.results?.length ?? 0})
        </button>
      </div>

      {activeTab === 'schemes' ? (
        <DataTable columns={schemeColumns} data={schemesData?.results || []} isLoading={isSchemesLoading} />
      ) : (
        <DataTable columns={gradingColumns} data={gradingData?.results || []} isLoading={isGradingLoading} />
      )}

      <Modal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        title="Create Assessment Scheme"
        subtitle="Define marks structure (e.g. 30% Continuous Assessment + 70% Terminal Exam)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSchemeMutation.mutate(schemeForm);
          }}
          className="space-y-4"
        >
          <Input
            label="Scheme Title"
            required
            placeholder="e.g. Senior Secondary 30/70 Scheme"
            value={schemeForm.name}
            onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
          />
          <Input
            label="Maximum Cumulative Score"
            type="number"
            required
            value={schemeForm.max_total_score}
            onChange={(e) => setSchemeForm({ ...schemeForm, max_total_score: Number(e.target.value) })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="scheme_default"
              checked={schemeForm.is_default}
              onChange={(e) => setSchemeForm({ ...schemeForm, is_default: e.target.checked })}
            />
            <label htmlFor="scheme_default" className="text-xs font-semibold text-slate-700">
              Set as institution default scheme
            </label>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsSchemeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createSchemeMutation.isPending}>
              Create Scheme
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
