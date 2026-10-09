import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Users, UserCheck } from 'lucide-react';
import { api } from '@/services/api';
import { ClassArm, ClassLevel, TeacherProfile, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

export const ClassesAndArmsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isArmModalOpen, setIsArmModalOpen] = useState(false);
  const [armForm, setArmForm] = useState({
    class_level: '',
    name: '',
    class_teacher: '',
  });

  const { data: armsData, isLoading } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  const { data: levelsData } = useQuery({
    queryKey: ['class-levels'],
    queryFn: () => api.get<PaginatedResponse<ClassLevel>>('/academics/class-levels/'),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get<PaginatedResponse<TeacherProfile>>('/academics/teachers/'),
  });

  const createArmMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/class-arms/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      setIsArmModalOpen(false);
      setArmForm({ class_level: '', name: '', class_teacher: '' });
    },
  });

  const columns: Column<ClassArm>[] = [
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Classes & Arms</h1>
          <p className="text-xs text-slate-500">Configure academic class levels (Nursery through SSS) and class arms</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsArmModalOpen(true)}>
          New Class Arm
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={armsData?.results || []}
        isLoading={isLoading}
      />

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
    </div>
  );
};
