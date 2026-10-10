import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, Layers, Edit3, Trash2, Sliders, CheckCircle2, Bookmark, BarChart3, Scale } from 'lucide-react';
import { api } from '@/services/api';
import { AssessmentScheme, AssessmentComponent, GradingScale, GradeRule, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';

export const AssessmentSchemesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'schemes' | 'grading'>('schemes');

  // Scheme state
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editSchemeTarget, setEditSchemeTarget] = useState<AssessmentScheme | null>(null);
  const [deleteSchemeTarget, setDeleteSchemeTarget] = useState<AssessmentScheme | null>(null);
  const [managingScheme, setManagingScheme] = useState<AssessmentScheme | null>(null);

  // Component state
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [editComponentTarget, setEditComponentTarget] = useState<AssessmentComponent | null>(null);
  const [deleteComponentTarget, setDeleteComponentTarget] = useState<AssessmentComponent | null>(null);

  // Grading Scale state
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [editScaleTarget, setEditScaleTarget] = useState<GradingScale | null>(null);
  const [deleteScaleTarget, setDeleteScaleTarget] = useState<GradingScale | null>(null);
  const [managingScale, setManagingScale] = useState<GradingScale | null>(null);

  // Grade Rule state
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [editRuleTarget, setEditRuleTarget] = useState<GradeRule | null>(null);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<GradeRule | null>(null);

  // Scheme Form
  const [schemeForm, setSchemeForm] = useState({
    name: '',
    max_total_score: 100,
    is_default: true,
  });

  const [editSchemeForm, setEditSchemeForm] = useState({
    name: '',
    max_total_score: 100,
    is_default: true,
  });

  // Component Form
  const [componentForm, setComponentForm] = useState({
    name: '',
    code: '',
    max_score: 20,
    order_index: 1,
  });

  const [editComponentForm, setEditComponentForm] = useState({
    name: '',
    code: '',
    max_score: 20,
    order_index: 1,
  });

  // Scale Form
  const [scaleForm, setScaleForm] = useState({
    name: '',
    is_default: true,
  });

  const [editScaleForm, setEditScaleForm] = useState({
    name: '',
    is_default: true,
  });

  // Rule Form
  const [ruleForm, setRuleForm] = useState({
    grade: '',
    min_score: 0,
    max_score: 100,
    grade_point: 0.0,
    remark: '',
    order_index: 1,
  });

  const [editRuleForm, setEditRuleForm] = useState({
    grade: '',
    min_score: 0,
    max_score: 100,
    grade_point: 0.0,
    remark: '',
    order_index: 1,
  });

  // Queries
  const { data: schemesData, isLoading: isSchemesLoading } = useQuery({
    queryKey: ['assessment-schemes'],
    queryFn: () => api.get<PaginatedResponse<AssessmentScheme>>('/assessments/schemes/'),
  });

  const { data: gradingData, isLoading: isGradingLoading } = useQuery({
    queryKey: ['grading-scales'],
    queryFn: () => api.get<PaginatedResponse<GradingScale>>('/assessments/grading-scales/'),
  });

  // Scheme Mutations
  const createSchemeMutation = useMutation({
    mutationFn: (data: any) => api.post('/assessments/schemes/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-schemes'] });
      setIsSchemeModalOpen(false);
      setSchemeForm({ name: '', max_total_score: 100, is_default: true });
    },
  });

  const updateSchemeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/assessments/schemes/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-schemes'] });
      setEditSchemeTarget(null);
    },
  });

  const deleteSchemeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/schemes/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-schemes'] });
      setDeleteSchemeTarget(null);
    },
  });

  // Component Mutations
  const createComponentMutation = useMutation({
    mutationFn: (data: any) => api.post('/assessments/components/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-schemes'] });
      setIsAddComponentOpen(false);
      setComponentForm({ name: '', code: '', max_score: 20, order_index: 1 });
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/assessments/components/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-schemes'] });
      setEditComponentTarget(null);
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/components/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-schemes'] });
      setDeleteComponentTarget(null);
    },
  });

  // Grading Scale Mutations
  const createScaleMutation = useMutation({
    mutationFn: (data: any) => api.post('/assessments/grading-scales/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setIsScaleModalOpen(false);
      setScaleForm({ name: '', is_default: true });
    },
  });

  const updateScaleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/assessments/grading-scales/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setEditScaleTarget(null);
    },
  });

  const deleteScaleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/grading-scales/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setDeleteScaleTarget(null);
    },
  });

  // Grade Rule Mutations
  const createRuleMutation = useMutation({
    mutationFn: (data: any) => api.post('/assessments/grade-rules/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setIsAddRuleOpen(false);
      setRuleForm({ grade: '', min_score: 0, max_score: 100, grade_point: 0.0, remark: '', order_index: 1 });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/assessments/grade-rules/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setEditRuleTarget(null);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/grade-rules/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setDeleteRuleTarget(null);
    },
  });

  // Handlers for Scheme
  const handleEditSchemeOpen = (scheme: AssessmentScheme) => {
    setEditSchemeTarget(scheme);
    setEditSchemeForm({
      name: scheme.name || '',
      max_total_score: scheme.max_total_score || 100,
      is_default: scheme.is_default,
    });
  };

  const handleEditSchemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSchemeTarget) return;
    updateSchemeMutation.mutate({ id: editSchemeTarget.id, data: editSchemeForm });
  };

  // Handlers for Component
  const handleEditComponentOpen = (comp: AssessmentComponent) => {
    setEditComponentTarget(comp);
    setEditComponentForm({
      name: comp.name || '',
      code: comp.code || '',
      max_score: comp.max_score || 0,
      order_index: comp.order_index || 1,
    });
  };

  const handleEditComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editComponentTarget) return;
    updateComponentMutation.mutate({ id: editComponentTarget.id, data: editComponentForm });
  };

  const handleAddComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingScheme) return;
    createComponentMutation.mutate({
      scheme: managingScheme.id,
      ...componentForm,
    });
  };

  // Handlers for Scale
  const handleEditScaleOpen = (scale: GradingScale) => {
    setEditScaleTarget(scale);
    setEditScaleForm({
      name: scale.name || '',
      is_default: scale.is_default,
    });
  };

  const handleEditScaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editScaleTarget) return;
    updateScaleMutation.mutate({ id: editScaleTarget.id, data: editScaleForm });
  };

  // Handlers for Rule
  const handleEditRuleOpen = (rule: GradeRule) => {
    setEditRuleTarget(rule);
    setEditRuleForm({
      grade: rule.grade || '',
      min_score: rule.min_score || 0,
      max_score: rule.max_score || 100,
      grade_point: rule.grade_point || 0,
      remark: rule.remark || '',
      order_index: rule.order_index || 1,
    });
  };

  const handleEditRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRuleTarget) return;
    updateRuleMutation.mutate({ id: editRuleTarget.id, data: editRuleForm });
  };

  const handleAddRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingScale) return;
    createRuleMutation.mutate({
      grading_scale: managingScale.id,
      ...ruleForm,
    });
  };

  // Keep managing scheme/scale in sync with query data
  const currentManagedScheme = schemesData?.results?.find((s) => s.id === managingScheme?.id) || managingScheme;
  const currentManagedScale = gradingData?.results?.find((s) => s.id === managingScale?.id) || managingScale;

  const schemeColumns: Column<AssessmentScheme>[] = [
    {
      header: 'Scheme Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#f4f3ef] border border-[#e5e3dc] flex items-center justify-center text-[#064e3b]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#141d24]">{row.name}</span>
              {row.is_default && <Badge variant="evergreen">Default</Badge>}
            </div>
            <div className="text-xs text-[#52606d] font-mono mt-0.5">
              Cumulative Cap: <span className="font-semibold text-[#141d24]">{row.max_total_score} marks</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Weightage Breakdown',
      cell: (row) => {
        const totalCompScore = row.components?.reduce((sum, c) => sum + Number(c.max_score || 0), 0) || 0;
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {row.components && row.components.length > 0 ? (
                row.components.map((c) => (
                  <span
                    key={c.id}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#f4f3ef] text-[#141d24] border border-[#e5e3dc]"
                  >
                    {c.name} ({c.code}: <span className="font-bold text-[#064e3b]">{c.max_score}m</span>)
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8c9ba5] italic">No components configured</span>
              )}
            </div>
            <p className="text-[11px] text-[#52606d] font-mono">
              Allocated: <span className={`font-bold ${totalCompScore === row.max_total_score ? 'text-[#064e3b]' : 'text-[#b45309]'}`}>{totalCompScore}</span> / {row.max_total_score} marks
            </p>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            icon={Sliders}
            onClick={() => setManagingScheme(row)}
          >
            Components
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#52606d] hover:text-[#064e3b] hover:bg-[#f4f3ef]"
            icon={Edit3}
            onClick={() => handleEditSchemeOpen(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#be123c] hover:bg-[#fff1f2]"
            icon={Trash2}
            onClick={() => setDeleteSchemeTarget(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const gradingColumns: Column<GradingScale>[] = [
    {
      header: 'Grading Scale Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#f4f3ef] border border-[#e5e3dc] flex items-center justify-center text-[#b45309]">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#141d24]">{row.name}</span>
              {row.is_default && <Badge variant="gold">Default</Badge>}
            </div>
            <div className="text-xs text-[#52606d] font-mono mt-0.5">
              {row.rules?.length || 0} Grade Brackets Configured
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Grade Boundaries',
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.rules && row.rules.length > 0 ? (
            row.rules.map((r) => (
              <span
                key={r.id}
                className="px-2 py-0.5 rounded bg-[#fffbeb] border border-[#fde68a] text-[11px] font-mono font-semibold text-[#b45309]"
              >
                {r.grade} ({r.min_score}-{r.max_score}%: {r.remark})
              </span>
            ))
          ) : (
            <span className="text-xs text-[#8c9ba5] italic">No grade rules configured</span>
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
            variant="outline"
            size="sm"
            icon={Award}
            onClick={() => setManagingScale(row)}
          >
            Grade Rules
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#52606d] hover:text-[#064e3b] hover:bg-[#f4f3ef]"
            icon={Edit3}
            onClick={() => handleEditScaleOpen(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#be123c] hover:bg-[#fff1f2]"
            icon={Trash2}
            onClick={() => setDeleteScaleTarget(row)}
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
            Assessment Schemes & Grading Rules
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Configure continuous assessment weightages, exam caps, and letter grade brackets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'schemes' ? (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsSchemeModalOpen(true)}>
              New Scheme
            </Button>
          ) : (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsScaleModalOpen(true)}>
              New Grading Scale
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e5e3dc]">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'schemes'
              ? 'border-[#064e3b] text-[#064e3b]'
              : 'border-transparent text-[#52606d] hover:text-[#141d24]'
          }`}
        >
          Assessment Schemes ({schemesData?.results?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'grading'
              ? 'border-[#064e3b] text-[#064e3b]'
              : 'border-transparent text-[#52606d] hover:text-[#141d24]'
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

      {/* ========================================================================= */}
      {/* ASSESSMENT SCHEME MODALS */}
      {/* ========================================================================= */}

      {/* Create Scheme Modal */}
      <Modal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        title="Create Assessment Scheme"
        subtitle="Define marks structure (e.g. 40% Continuous Assessment + 60% Terminal Exam)"
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
            placeholder="e.g. Junior Secondary 40/60 Scheme"
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
          <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#e5e3dc] bg-[#fbfbfa] cursor-pointer hover:bg-[#f4f3ef] transition-colors">
            <input
              type="checkbox"
              checked={schemeForm.is_default}
              onChange={(e) => setSchemeForm({ ...schemeForm, is_default: e.target.checked })}
              className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b] border-[#cbd2d9]"
            />
            <div>
              <div className="text-xs font-semibold text-[#141d24]">Set as Default Scheme</div>
              <div className="text-[11px] text-[#52606d]">Automatically applies to newly created subjects</div>
            </div>
          </label>
          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsSchemeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createSchemeMutation.isPending}>
              Create Scheme
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Scheme Modal */}
      <Modal
        isOpen={!!editSchemeTarget}
        onClose={() => setEditSchemeTarget(null)}
        title="Edit Assessment Scheme"
        subtitle={`Update ${editSchemeTarget?.name}`}
      >
        <form onSubmit={handleEditSchemeSubmit} className="space-y-4">
          <Input
            label="Scheme Title"
            required
            placeholder="e.g. Senior Secondary 30/70 Scheme"
            value={editSchemeForm.name}
            onChange={(e) => setEditSchemeForm({ ...editSchemeForm, name: e.target.value })}
          />
          <Input
            label="Maximum Cumulative Score"
            type="number"
            required
            value={editSchemeForm.max_total_score}
            onChange={(e) => setEditSchemeForm({ ...editSchemeForm, max_total_score: Number(e.target.value) })}
          />
          <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#e5e3dc] bg-[#fbfbfa] cursor-pointer hover:bg-[#f4f3ef] transition-colors">
            <input
              type="checkbox"
              checked={editSchemeForm.is_default}
              onChange={(e) => setEditSchemeForm({ ...editSchemeForm, is_default: e.target.checked })}
              className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b] border-[#cbd2d9]"
            />
            <div>
              <div className="text-xs font-semibold text-[#141d24]">Set as Default Scheme</div>
              <div className="text-[11px] text-[#52606d]">Automatically applies to newly created subjects</div>
            </div>
          </label>
          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditSchemeTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateSchemeMutation.isPending}>
              Save Scheme Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Scheme Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteSchemeTarget}
        onClose={() => setDeleteSchemeTarget(null)}
        onConfirm={() => {
          if (deleteSchemeTarget) deleteSchemeMutation.mutate(deleteSchemeTarget.id);
        }}
        title="Delete Assessment Scheme"
        message={`Are you sure you want to delete scheme "${deleteSchemeTarget?.name}"? All associated components will also be deleted.`}
        isLoading={deleteSchemeMutation.isPending}
      />

      {/* Manage Components Modal */}
      <Modal
        isOpen={!!managingScheme}
        onClose={() => {
          setManagingScheme(null);
          setIsAddComponentOpen(false);
          setEditComponentTarget(null);
        }}
        title={`Components: ${currentManagedScheme?.name || ''}`}
        subtitle={`Configure CA parts and Exam score breakdown (Max total: ${currentManagedScheme?.max_total_score || 100} marks)`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#141d24]">Assessment Components</span>
            {!isAddComponentOpen && !editComponentTarget && (
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setComponentForm({
                    name: '',
                    code: '',
                    max_score: 20,
                    order_index: (currentManagedScheme?.components?.length || 0) + 1,
                  });
                  setIsAddComponentOpen(true);
                }}
              >
                Add Component
              </Button>
            )}
          </div>

          {/* Add Component Subform */}
          {isAddComponentOpen && (
            <form onSubmit={handleAddComponentSubmit} className="p-3 bg-[#fbfbfa] border border-[#cbd2d9] rounded-md space-y-3">
              <p className="text-xs font-semibold text-[#064e3b]">Add New Assessment Component</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Component Name"
                  required
                  placeholder="e.g. CA 1, Midterm Exam"
                  value={componentForm.name}
                  onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                />
                <Input
                  label="Code / Acronym"
                  required
                  placeholder="e.g. CA1, CA2, EXAM"
                  value={componentForm.code}
                  onChange={(e) => setComponentForm({ ...componentForm, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Max Marks"
                  type="number"
                  required
                  value={componentForm.max_score}
                  onChange={(e) => setComponentForm({ ...componentForm, max_score: Number(e.target.value) })}
                />
                <Input
                  label="Order Index"
                  type="number"
                  value={componentForm.order_index}
                  onChange={(e) => setComponentForm({ ...componentForm, order_index: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddComponentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={createComponentMutation.isPending}>
                  Save Component
                </Button>
              </div>
            </form>
          )}

          {/* Edit Component Subform */}
          {editComponentTarget && (
            <form onSubmit={handleEditComponentSubmit} className="p-3 bg-[#fbfbfa] border border-[#cbd2d9] rounded-md space-y-3">
              <p className="text-xs font-semibold text-[#b45309]">Edit Component: {editComponentTarget.name}</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Component Name"
                  required
                  value={editComponentForm.name}
                  onChange={(e) => setEditComponentForm({ ...editComponentForm, name: e.target.value })}
                />
                <Input
                  label="Code"
                  required
                  value={editComponentForm.code}
                  onChange={(e) => setEditComponentForm({ ...editComponentForm, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Max Marks"
                  type="number"
                  required
                  value={editComponentForm.max_score}
                  onChange={(e) => setEditComponentForm({ ...editComponentForm, max_score: Number(e.target.value) })}
                />
                <Input
                  label="Order Index"
                  type="number"
                  value={editComponentForm.order_index}
                  onChange={(e) => setEditComponentForm({ ...editComponentForm, order_index: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditComponentTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={updateComponentMutation.isPending}>
                  Update Component
                </Button>
              </div>
            </form>
          )}

          {/* Component List */}
          <div className="divide-y divide-[#e5e3dc] border border-[#e5e3dc] rounded-md overflow-hidden">
            {currentManagedScheme?.components?.map((comp) => (
              <div key={comp.id} className="p-3 flex items-center justify-between bg-white hover:bg-[#fbfbfa] transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#141d24]">{comp.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#f4f3ef] text-[10px] font-mono font-bold text-[#52606d]">
                      {comp.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#52606d] font-mono mt-0.5">
                    Max Marks: <span className="font-semibold text-[#064e3b]">{comp.max_score}</span> | Order: {comp.order_index}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#52606d] hover:text-[#064e3b]"
                    icon={Edit3}
                    onClick={() => handleEditComponentOpen(comp)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#be123c] hover:bg-[#fff1f2]"
                    icon={Trash2}
                    onClick={() => setDeleteComponentTarget(comp)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {(!currentManagedScheme?.components || currentManagedScheme.components.length === 0) && (
              <div className="p-6 text-center text-xs text-[#8c9ba5]">
                No components added yet. Click &quot;Add Component&quot; to define CA / Exam marks.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setManagingScheme(null);
                setIsAddComponentOpen(false);
                setEditComponentTarget(null);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Component Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteComponentTarget}
        onClose={() => setDeleteComponentTarget(null)}
        onConfirm={() => {
          if (deleteComponentTarget) deleteComponentMutation.mutate(deleteComponentTarget.id);
        }}
        title="Delete Component"
        message={`Are you sure you want to delete component "${deleteComponentTarget?.name}" (${deleteComponentTarget?.code})?`}
        isLoading={deleteComponentMutation.isPending}
      />

      {/* ========================================================================= */}
      {/* GRADING SCALE & RULES MODALS */}
      {/* ========================================================================= */}

      {/* Create Grading Scale Modal */}
      <Modal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
        title="Create Grading Scale"
        subtitle="Define a grade system (e.g. Standard WAEC / Secondary Grading Scale)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createScaleMutation.mutate(scaleForm);
          }}
          className="space-y-4"
        >
          <Input
            label="Grading Scale Name"
            required
            placeholder="e.g. Primary School Letter Grading"
            value={scaleForm.name}
            onChange={(e) => setScaleForm({ ...scaleForm, name: e.target.value })}
          />
          <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#e5e3dc] bg-[#fbfbfa] cursor-pointer hover:bg-[#f4f3ef] transition-colors">
            <input
              type="checkbox"
              checked={scaleForm.is_default}
              onChange={(e) => setScaleForm({ ...scaleForm, is_default: e.target.checked })}
              className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b] border-[#cbd2d9]"
            />
            <div>
              <div className="text-xs font-semibold text-[#141d24]">Set as Default Grading Scale</div>
              <div className="text-[11px] text-[#52606d]">Default standard used for report cards across classes</div>
            </div>
          </label>
          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsScaleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createScaleMutation.isPending}>
              Create Grading Scale
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Grading Scale Modal */}
      <Modal
        isOpen={!!editScaleTarget}
        onClose={() => setEditScaleTarget(null)}
        title="Edit Grading Scale"
        subtitle={`Update ${editScaleTarget?.name}`}
      >
        <form onSubmit={handleEditScaleSubmit} className="space-y-4">
          <Input
            label="Grading Scale Name"
            required
            value={editScaleForm.name}
            onChange={(e) => setEditScaleForm({ ...editScaleForm, name: e.target.value })}
          />
          <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#e5e3dc] bg-[#fbfbfa] cursor-pointer hover:bg-[#f4f3ef] transition-colors">
            <input
              type="checkbox"
              checked={editScaleForm.is_default}
              onChange={(e) => setEditScaleForm({ ...editScaleForm, is_default: e.target.checked })}
              className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b] border-[#cbd2d9]"
            />
            <div>
              <div className="text-xs font-semibold text-[#141d24]">Set as Default Grading Scale</div>
              <div className="text-[11px] text-[#52606d]">Default standard used for report cards across classes</div>
            </div>
          </label>
          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditScaleTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateScaleMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Grading Scale Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteScaleTarget}
        onClose={() => setDeleteScaleTarget(null)}
        onConfirm={() => {
          if (deleteScaleTarget) deleteScaleMutation.mutate(deleteScaleTarget.id);
        }}
        title="Delete Grading Scale"
        message={`Are you sure you want to delete grading scale "${deleteScaleTarget?.name}"? All associated grade rules will also be deleted.`}
        isLoading={deleteScaleMutation.isPending}
      />

      {/* Manage Grade Rules Modal */}
      <Modal
        isOpen={!!managingScale}
        onClose={() => {
          setManagingScale(null);
          setIsAddRuleOpen(false);
          setEditRuleTarget(null);
        }}
        title={`Grade Rules: ${currentManagedScale?.name || ''}`}
        subtitle="Define letter grades, score percentages (min-max), GPA points, and remarks"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#141d24]">Grade Brackets</span>
            {!isAddRuleOpen && !editRuleTarget && (
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setRuleForm({
                    grade: '',
                    min_score: 70,
                    max_score: 100,
                    grade_point: 5.0,
                    remark: 'Excellent',
                    order_index: (currentManagedScale?.rules?.length || 0) + 1,
                  });
                  setIsAddRuleOpen(true);
                }}
              >
                Add Grade Rule
              </Button>
            )}
          </div>

          {/* Add Rule Subform */}
          {isAddRuleOpen && (
            <form onSubmit={handleAddRuleSubmit} className="p-3 bg-[#fbfbfa] border border-[#cbd2d9] rounded-md space-y-3">
              <p className="text-xs font-semibold text-[#064e3b]">Add New Grade Rule</p>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Grade Letter"
                  required
                  placeholder="e.g. A, B, C or A1"
                  value={ruleForm.grade}
                  onChange={(e) => setRuleForm({ ...ruleForm, grade: e.target.value.toUpperCase() })}
                />
                <Input
                  label="Min Score (%)"
                  type="number"
                  required
                  value={ruleForm.min_score}
                  onChange={(e) => setRuleForm({ ...ruleForm, min_score: Number(e.target.value) })}
                />
                <Input
                  label="Max Score (%)"
                  type="number"
                  required
                  value={ruleForm.max_score}
                  onChange={(e) => setRuleForm({ ...ruleForm, max_score: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Grade Point (GPA)"
                  type="number"
                  step="0.1"
                  value={ruleForm.grade_point}
                  onChange={(e) => setRuleForm({ ...ruleForm, grade_point: Number(e.target.value) })}
                />
                <Input
                  label="Remark"
                  required
                  placeholder="e.g. Distinction, Credit, Pass, Fail"
                  value={ruleForm.remark}
                  onChange={(e) => setRuleForm({ ...ruleForm, remark: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddRuleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={createRuleMutation.isPending}>
                  Save Rule
                </Button>
              </div>
            </form>
          )}

          {/* Edit Rule Subform */}
          {editRuleTarget && (
            <form onSubmit={handleEditRuleSubmit} className="p-3 bg-[#fbfbfa] border border-[#cbd2d9] rounded-md space-y-3">
              <p className="text-xs font-semibold text-[#b45309]">Edit Grade Rule: {editRuleTarget.grade}</p>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Grade Letter"
                  required
                  value={editRuleForm.grade}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, grade: e.target.value.toUpperCase() })}
                />
                <Input
                  label="Min Score (%)"
                  type="number"
                  required
                  value={editRuleForm.min_score}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, min_score: Number(e.target.value) })}
                />
                <Input
                  label="Max Score (%)"
                  type="number"
                  required
                  value={editRuleForm.max_score}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, max_score: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Grade Point (GPA)"
                  type="number"
                  step="0.1"
                  value={editRuleForm.grade_point}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, grade_point: Number(e.target.value) })}
                />
                <Input
                  label="Remark"
                  required
                  value={editRuleForm.remark}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, remark: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditRuleTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={updateRuleMutation.isPending}>
                  Update Rule
                </Button>
              </div>
            </form>
          )}

          {/* Grade Rules List */}
          <div className="divide-y divide-[#e5e3dc] border border-[#e5e3dc] rounded-md overflow-hidden">
            {currentManagedScale?.rules?.map((rule) => (
              <div key={rule.id} className="p-3 flex items-center justify-between bg-white hover:bg-[#fbfbfa] transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-md bg-[#ecfdf5] border border-[#a7f3d0] text-[#064e3b] font-mono font-bold flex items-center justify-center text-xs">
                      {rule.grade}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#141d24]">
                        {rule.min_score}% - {rule.max_score}% : <span className="text-[#064e3b] font-bold">{rule.remark}</span>
                      </p>
                      <p className="text-[11px] text-[#52606d] font-mono">Grade Point: {rule.grade_point}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#52606d] hover:text-[#064e3b]"
                    icon={Edit3}
                    onClick={() => handleEditRuleOpen(rule)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#be123c] hover:bg-[#fff1f2]"
                    icon={Trash2}
                    onClick={() => setDeleteRuleTarget(rule)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {(!currentManagedScale?.rules || currentManagedScale.rules.length === 0) && (
              <div className="p-6 text-center text-xs text-[#8c9ba5]">
                No grade rules defined yet. Click &quot;Add Grade Rule&quot; to set up score ranges.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setManagingScale(null);
                setIsAddRuleOpen(false);
                setEditRuleTarget(null);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Rule Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteRuleTarget}
        onClose={() => setDeleteRuleTarget(null)}
        onConfirm={() => {
          if (deleteRuleTarget) deleteRuleMutation.mutate(deleteRuleTarget.id);
        }}
        title="Delete Grade Rule"
        message={`Are you sure you want to delete grade rule "${deleteRuleTarget?.grade}" (${deleteRuleTarget?.min_score}-${deleteRuleTarget?.max_score}%)?`}
        isLoading={deleteRuleMutation.isPending}
      />
    </div>
  );
};
