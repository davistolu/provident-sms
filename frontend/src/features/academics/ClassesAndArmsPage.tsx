import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Users, Trash2, Edit, GraduationCap } from 'lucide-react';
import { api } from '@/services/api';
import { ClassArm, ClassLevel, TeacherProfile, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';

export const ClassesAndArmsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'arms' | 'levels'>('arms');
  
  // Arm modals state
  const [isArmModalOpen, setIsArmModalOpen] = useState(false);
  const [editArmTarget, setEditArmTarget] = useState<ClassArm | null>(null);
  const [deleteArmTarget, setDeleteArmTarget] = useState<ClassArm | null>(null);

  // Level modals state
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editLevelTarget, setEditLevelTarget] = useState<ClassLevel | null>(null);
  const [deleteLevelTarget, setDeleteLevelTarget] = useState<ClassLevel | null>(null);

  const [armForm, setArmForm] = useState({
    class_level: '',
    name: '',
    class_teacher: '',
  });

  const [editArmForm, setEditArmForm] = useState({
    class_level: '',
    name: '',
    class_teacher: '',
  });

  const [levelForm, setLevelForm] = useState({
    name: '',
    code: '',
    category: 'PRIMARY',
    order_index: 1,
  });

  const [editLevelForm, setEditLevelForm] = useState({
    name: '',
    code: '',
    category: 'PRIMARY',
    order_index: 1,
  });

  const { data: armsData, isLoading: isArmsLoading } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  const { data: levelsData, isLoading: isLevelsLoading } = useQuery({
    queryKey: ['class-levels'],
    queryFn: () => api.get<PaginatedResponse<ClassLevel>>('/academics/class-levels/'),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get<PaginatedResponse<TeacherProfile>>('/academics/teachers/'),
  });

  // Arm mutations
  const createArmMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/class-arms/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      queryClient.invalidateQueries({ queryKey: ['class-levels'] });
      setIsArmModalOpen(false);
      setArmForm({ class_level: '', name: '', class_teacher: '' });
    },
  });

  const updateArmMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/academics/class-arms/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      queryClient.invalidateQueries({ queryKey: ['class-levels'] });
      setEditArmTarget(null);
    },
  });

  const deleteArmMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academics/class-arms/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      queryClient.invalidateQueries({ queryKey: ['class-levels'] });
      setDeleteArmTarget(null);
    },
  });

  // Level mutations
  const createLevelMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/class-levels/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-levels'] });
      setIsLevelModalOpen(false);
      setLevelForm({ name: '', code: '', category: 'PRIMARY', order_index: (levelsData?.results?.length || 0) + 1 });
    },
  });

  const updateLevelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/academics/class-levels/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-levels'] });
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      setEditLevelTarget(null);
    },
  });

  const deleteLevelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academics/class-levels/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-levels'] });
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      setDeleteLevelTarget(null);
    },
  });

  const handleEditArmOpen = (arm: ClassArm) => {
    setEditArmTarget(arm);
    setEditArmForm({
      class_level: arm.class_level || '',
      name: arm.name || '',
      class_teacher: arm.class_teacher || '',
    });
  };

  const handleEditArmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArmTarget) return;
    updateArmMutation.mutate({
      id: editArmTarget.id,
      data: {
        class_level: editArmForm.class_level,
        name: editArmForm.name,
        class_teacher: editArmForm.class_teacher || null,
      },
    });
  };

  const handleEditLevelOpen = (level: ClassLevel) => {
    setEditLevelTarget(level);
    setEditLevelForm({
      name: level.name || '',
      code: level.code || '',
      category: level.category || 'PRIMARY',
      order_index: level.order_index || 1,
    });
  };

  const handleEditLevelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLevelTarget) return;
    updateLevelMutation.mutate({ id: editLevelTarget.id, data: editLevelForm });
  };

  const armColumns: Column<ClassArm>[] = [
    {
      header: 'Class / Arm',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.display_name}</p>
          <p className="text-[11px] text-slate-400">{row.class_level_name}</p>
        </div>
      ),
    },
    {
      header: 'Class Teacher',
      cell: (row) => (
        <span className="font-semibold text-slate-700">
          {row.class_teacher_name || <span className="text-slate-400">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'Enrolled Students',
      cell: (row) => (
        <Badge variant="indigo">
          {row.enrolled_students_count ?? 0} Students
        </Badge>
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
            onClick={() => handleEditArmOpen(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50"
            icon={Trash2}
            onClick={() => setDeleteArmTarget(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const levelColumns: Column<ClassLevel>[] = [
    {
      header: 'Level / Grade Name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-[11px] font-mono text-slate-400">{row.code || 'NO-CODE'}</p>
        </div>
      ),
    },
    {
      header: 'Educational Section',
      cell: (row) => {
        const variant =
          row.category === 'NURSERY'
            ? 'neutral'
            : row.category === 'PRIMARY'
            ? 'success'
            : row.category === 'JUNIOR_SECONDARY'
            ? 'indigo'
            : 'danger';
        return <Badge variant={variant}>{row.category_display}</Badge>;
      },
    },
    {
      header: 'Display Order',
      accessorKey: 'order_index',
      cell: (row) => <span className="font-mono text-xs text-slate-600">#{row.order_index}</span>,
    },
    {
      header: 'Active Arms',
      cell: (row) => <span className="font-bold text-slate-800 text-xs">{row.arms_count ?? 0} Arms</span>,
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
            onClick={() => handleEditLevelOpen(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50"
            icon={Trash2}
            onClick={() => setDeleteLevelTarget(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Classes & Levels</h1>
          <p className="text-xs text-slate-500">
            Configure institutional educational levels (Nursery through SSS) and assigned class arms
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'arms' ? (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsArmModalOpen(true)}>
              New Class Arm
            </Button>
          ) : (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsLevelModalOpen(true)}>
              New Class Level
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('arms')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'arms'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Class Arms ({armsData?.results?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'levels'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Class Levels / Grades ({levelsData?.results?.length ?? 0})
        </button>
      </div>

      {activeTab === 'arms' ? (
        <DataTable columns={armColumns} data={armsData?.results || []} isLoading={isArmsLoading} />
      ) : (
        <DataTable columns={levelColumns} data={levelsData?.results || []} isLoading={isLevelsLoading} />
      )}

      {/* Create Class Arm Modal */}
      <Modal
        isOpen={isArmModalOpen}
        onClose={() => setIsArmModalOpen(false)}
        title="Create New Class Arm"
        subtitle="Associate an arm with an existing class level"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createArmMutation.mutate(armForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Level</label>
            <select
              required
              value={armForm.class_level}
              onChange={(e) => setArmForm({ ...armForm, class_level: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Select Class Level</option>
              {levelsData?.results?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.category_display})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Arm Name (optional)"
            placeholder="e.g. Gold, Diamond, Blue, or leave empty"
            value={armForm.name}
            onChange={(e) => setArmForm({ ...armForm, name: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Teacher</label>
            <select
              value={armForm.class_teacher}
              onChange={(e) => setArmForm({ ...armForm, class_teacher: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Assign Class Teacher (Optional)</option>
              {teachersData?.results?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.full_name} ({t.staff_id})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsArmModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createArmMutation.isPending}>
              Create Arm
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Class Arm Modal */}
      <Modal
        isOpen={!!editArmTarget}
        onClose={() => setEditArmTarget(null)}
        title="Edit Class Arm"
        subtitle={`Update class arm ${editArmTarget?.display_name}`}
      >
        <form onSubmit={handleEditArmSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Level</label>
            <select
              required
              value={editArmForm.class_level}
              onChange={(e) => setEditArmForm({ ...editArmForm, class_level: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Select Class Level</option>
              {levelsData?.results?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.category_display})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Arm Name (optional)"
            placeholder="e.g. Gold, Diamond, Blue, or leave empty"
            value={editArmForm.name}
            onChange={(e) => setEditArmForm({ ...editArmForm, name: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Teacher</label>
            <select
              value={editArmForm.class_teacher}
              onChange={(e) => setEditArmForm({ ...editArmForm, class_teacher: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Assign Class Teacher (Optional)</option>
              {teachersData?.results?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.full_name} ({t.staff_id})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditArmTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateArmMutation.isPending}>
              Save Arm Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Class Level Modal */}
      <Modal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        title="Create Academic Class Level"
        subtitle="Define a new grade level (e.g. Nursery 2, JSS 3, SS 3, Grade 1)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLevelMutation.mutate(levelForm);
          }}
          className="space-y-4"
        >
          <Input
            label="Class Level Name"
            required
            placeholder="e.g. JSS 3, SS 3, Primary 6, Grade 1"
            value={levelForm.name}
            onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Short Code"
              placeholder="e.g. JSS-3, SS-3, PRI-6"
              value={levelForm.code}
              onChange={(e) => setLevelForm({ ...levelForm, code: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Educational Section</label>
              <select
                value={levelForm.category}
                onChange={(e) => setLevelForm({ ...levelForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="NURSERY">Nursery / Pre-School</option>
                <option value="PRIMARY">Primary School</option>
                <option value="JUNIOR_SECONDARY">Junior Secondary (JSS)</option>
                <option value="SENIOR_SECONDARY">Senior Secondary (SSS)</option>
              </select>
            </div>
          </div>

          <Input
            label="Ordering Priority (Sequence Index)"
            type="number"
            value={levelForm.order_index}
            onChange={(e) => setLevelForm({ ...levelForm, order_index: parseInt(e.target.value) || 1 })}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsLevelModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createLevelMutation.isPending}>
              Create Class Level
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Class Level Modal */}
      <Modal
        isOpen={!!editLevelTarget}
        onClose={() => setEditLevelTarget(null)}
        title="Edit Class Level"
        subtitle={`Update class level ${editLevelTarget?.name}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editLevelTarget) return;
            updateLevelMutation.mutate({ id: editLevelTarget.id, data: editLevelForm });
          }}
          className="space-y-4"
        >
          <Input
            label="Class Level Name"
            required
            value={editLevelForm.name}
            onChange={(e) => setEditLevelForm({ ...editLevelForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Short Code"
              value={editLevelForm.code}
              onChange={(e) => setEditLevelForm({ ...editLevelForm, code: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Educational Section</label>
              <select
                value={editLevelForm.category}
                onChange={(e) => setEditLevelForm({ ...editLevelForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="NURSERY">Nursery / Pre-School</option>
                <option value="PRIMARY">Primary School</option>
                <option value="JUNIOR_SECONDARY">Junior Secondary (JSS)</option>
                <option value="SENIOR_SECONDARY">Senior Secondary (SSS)</option>
              </select>
            </div>
          </div>

          <Input
            label="Ordering Priority (Sequence Index)"
            type="number"
            value={editLevelForm.order_index}
            onChange={(e) => setEditLevelForm({ ...editLevelForm, order_index: parseInt(e.target.value) || 1 })}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditLevelTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateLevelMutation.isPending}>
              Save Level Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Arm Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteArmTarget}
        onClose={() => setDeleteArmTarget(null)}
        onConfirm={() => {
          if (deleteArmTarget) deleteArmMutation.mutate(deleteArmTarget.id);
        }}
        title="Delete Class Arm"
        message={`Are you sure you want to delete the class arm "${deleteArmTarget?.display_name}"?`}
        isLoading={deleteArmMutation.isPending}
      />

      {/* Delete Level Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteLevelTarget}
        onClose={() => setDeleteLevelTarget(null)}
        onConfirm={() => {
          if (deleteLevelTarget) deleteLevelMutation.mutate(deleteLevelTarget.id);
        }}
        title="Delete Class Level"
        message={`Are you sure you want to delete class level "${deleteLevelTarget?.name}"? All associated arms should be removed first.`}
        isLoading={deleteLevelMutation.isPending}
      />
    </div>
  );
};
