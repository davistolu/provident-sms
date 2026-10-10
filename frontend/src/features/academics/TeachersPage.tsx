import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, UserPlus, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { TeacherProfile, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';

export const TeachersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherProfile | null>(null);

  const [teacherForm, setTeacherForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    staff_id: '',
    qualification: '',
    specialization: '',
    phone: '',
    gender: 'MALE',
  });

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    staff_id: '',
    qualification: '',
    specialization: '',
    phone: '',
    gender: 'MALE',
    is_active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get<PaginatedResponse<TeacherProfile>>('/academics/teachers/'),
  });

  const createTeacherMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/teachers/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsModalOpen(false);
      setTeacherForm({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        staff_id: '',
        qualification: '',
        specialization: '',
        phone: '',
        gender: 'MALE',
      });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create teacher.');
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/academics/teachers/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setEditTarget(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || 'Failed to update teacher.');
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academics/teachers/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setDeleteTarget(null);
    },
  });

  const handleEditOpen = (teacher: TeacherProfile) => {
    setEditTarget(teacher);
    setEditForm({
      first_name: teacher.user.first_name || '',
      last_name: teacher.user.last_name || '',
      staff_id: teacher.staff_id || '',
      qualification: teacher.qualification || '',
      specialization: teacher.specialization || '',
      phone: teacher.phone || '',
      gender: teacher.gender || 'MALE',
      is_active: teacher.is_active,
    });
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    updateTeacherMutation.mutate({ id: editTarget.id, data: editForm });
  };

  const columns: Column<TeacherProfile>[] = [
    {
      header: 'Staff ID',
      accessorKey: 'staff_id',
      cell: (row) => <span className="font-mono font-bold text-indigo-600 text-xs">{row.staff_id}</span>,
    },
    {
      header: 'Teacher Name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.user.full_name}</p>
          <p className="text-[11px] text-slate-400">{row.user.email}</p>
        </div>
      ),
    },
    {
      header: 'Specialization & Qualification',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-700 text-xs">{row.specialization || 'General'}</p>
          <p className="text-[11px] text-slate-400">{row.qualification || 'B.Ed / NCE'}</p>
        </div>
      ),
    },
    {
      header: 'Gender',
      accessorKey: 'gender',
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Inactive'}
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
            onClick={() => handleEditOpen(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
          <h1 className="text-xl font-bold text-slate-900">Teachers & Academic Staff</h1>
          <p className="text-xs text-slate-500">Manage teacher profiles, staff credentials, and specializations</p>
        </div>
        <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
          New Teacher
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={teachersData?.results || []}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Teacher Profile"
        subtitle="Create teacher account and assign Staff ID"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(null);
            createTeacherMutation.mutate(teacherForm);
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Staff Identification Number"
              placeholder="Auto-generated if left blank"
              helperText="Leave empty to auto-generate unique Staff ID"
              value={teacherForm.staff_id}
              onChange={(e) => setTeacherForm({ ...teacherForm, staff_id: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={teacherForm.gender}
                onChange={(e) => setTeacherForm({ ...teacherForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              placeholder="First name"
              value={teacherForm.first_name}
              onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
            />
            <Input
              label="Last Name (Surname)"
              required
              placeholder="Surname"
              value={teacherForm.last_name}
              onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address (Login Username)"
              type="email"
              required
              placeholder="teacher@providence.edu"
              value={teacherForm.email}
              onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="TeacherPass123!"
              value={teacherForm.password}
              onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Specialization"
              placeholder="e.g. Physics / Mathematics"
              value={teacherForm.specialization}
              onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
            />
            <Input
              label="Highest Qualification"
              placeholder="e.g. B.Sc Ed, M.Sc"
              value={teacherForm.qualification}
              onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createTeacherMutation.isPending}>
              Create Teacher Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Teacher Profile"
        subtitle={`Update staff details for ${editTarget?.user.full_name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Staff Identification Number"
              required
              value={editForm.staff_id}
              onChange={(e) => setEditForm({ ...editForm, staff_id: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            />
            <Input
              label="Last Name (Surname)"
              required
              value={editForm.last_name}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="e.g. +2348012345678"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
              <select
                value={editForm.is_active ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Specialization"
              placeholder="e.g. Physics / Mathematics"
              value={editForm.specialization}
              onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
            />
            <Input
              label="Highest Qualification"
              placeholder="e.g. B.Sc Ed, M.Sc"
              value={editForm.qualification}
              onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateTeacherMutation.isPending}>
              Save Teacher Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTeacherMutation.mutate(deleteTarget.id);
        }}
        title="Delete Teacher Profile"
        message={`Are you sure you want to delete ${deleteTarget?.user.full_name} (${deleteTarget?.staff_id})?`}
        isLoading={deleteTeacherMutation.isPending}
      />
    </div>
  );
};
