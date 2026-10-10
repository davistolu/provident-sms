import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, Trash2, Shield, Mail, CheckCircle2, Edit, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';
import { SchoolMembership, PaginatedResponse, Role } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';

export const UserAccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolMembership | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolMembership | null>(null);

  const [userForm, setUserForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'TEACHER' as Role,
  });

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: 'TEACHER' as Role,
    is_active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['school-memberships', search, roleFilter],
    queryFn: () =>
      api.get<PaginatedResponse<SchoolMembership>>('/memberships/', {
        search: search || undefined,
        role: roleFilter || undefined,
      }),
  });

  const createMembershipMutation = useMutation({
    mutationFn: (data: any) => api.post('/memberships/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships'] });
      setIsModalOpen(false);
      setUserForm({ email: '', first_name: '', last_name: '', password: '', role: 'TEACHER' });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create user account.');
    },
  });

  const updateMembershipMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/memberships/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships'] });
      setEditTarget(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || 'Failed to update user account.');
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/memberships/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships'] });
      setDeleteTarget(null);
    },
  });

  const handleEditOpen = (membership: SchoolMembership) => {
    setEditTarget(membership);
    setEditForm({
      first_name: membership.user?.first_name || '',
      last_name: membership.user?.last_name || '',
      role: membership.role,
      is_active: membership.is_active,
    });
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    updateMembershipMutation.mutate({ id: editTarget.id, data: editForm });
  };

  const columns: Column<SchoolMembership>[] = [
    {
      header: 'Full Name & Email',
      cell: (row) => (
        <div>
          <p className="font-bold text-[#141d24]">{row.user?.full_name}</p>
          <p className="text-[11px] text-[#8896a4] font-mono">{row.user?.email}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      accessorKey: 'role',
      cell: (row) => {
        const variant =
          row.role === 'ADMIN' || row.role === 'SUPER_ADMIN'
            ? 'danger'
            : row.role === 'PRINCIPAL'
            ? 'evergreen'
            : row.role === 'BURSAR'
            ? 'gold'
            : 'neutral';
        return <Badge variant={variant}>{row.role}</Badge>;
      },
    },
    {
      header: 'Account Status',
      cell: (row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      header: 'Date Joined',
      cell: (row) => (
        <span className="text-xs text-[#52606d] font-mono">
          {new Date(row.user?.date_joined || Date.now()).toLocaleDateString()}
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
            size="xs"
            icon={Edit}
            onClick={() => handleEditOpen(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-[#991b1b] hover:bg-[#fef2f2]"
            icon={Trash2}
            onClick={() => setDeleteTarget(row)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-[#141d24]">User Accounts & Roles</h1>
            <Badge variant="evergreen">{usersData?.count ?? 0} Accounts</Badge>
          </div>
          <p className="text-xs text-[#52606d] mt-0.5">
            Create staff accounts, assign administrative roles, and manage institutional system access
          </p>
        </div>
        <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
          Add User Account
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={usersData?.results || []}
        isLoading={isLoading}
        searchPlaceholder="Search staff by name or email..."
        searchValue={search}
        onSearchChange={setSearch}
        filterComponent={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24]"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">School Administrator</option>
            <option value="PRINCIPAL">Principal / Head</option>
            <option value="TEACHER">Teacher</option>
            <option value="BURSAR">Bursar / Accounts</option>
          </select>
        }
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add User Account"
        subtitle="Create login credentials and assign school membership role"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(null);
            createMembershipMutation.mutate(userForm);
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs font-medium rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              placeholder="First name"
              value={userForm.first_name}
              onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
            />
            <Input
              label="Surname"
              required
              placeholder="Surname"
              value={userForm.last_name}
              onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
            />
          </div>

          <Input
            label="Email Address (Username)"
            type="email"
            required
            placeholder="user@providence.edu"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Password"
              type="password"
              placeholder="Defaults to SchoolUser123!"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            />
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
                Assigned Role
              </label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as Role })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24]"
              >
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">School Administrator</option>
                <option value="PRINCIPAL">Principal / Head of School</option>
                <option value="BURSAR">Bursar / Accountant</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e6e4dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMembershipMutation.isPending}>
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Account & Role Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit User & Role"
        subtitle={`Update account details and role for ${editTarget?.user?.email}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs font-medium rounded-lg">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            />
            <Input
              label="Surname"
              required
              value={editForm.last_name}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
                Assigned Role
              </label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24]"
              >
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">School Administrator</option>
                <option value="PRINCIPAL">Principal / Head of School</option>
                <option value="BURSAR">Bursar / Accountant</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
                Account Status
              </label>
              <select
                value={editForm.is_active ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24]"
              >
                <option value="true">Active</option>
                <option value="false">Deactivated</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e6e4dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateMembershipMutation.isPending}>
              Save User Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMembershipMutation.mutate(deleteTarget.id);
        }}
        title="Remove User Membership"
        message={`Are you sure you want to remove ${deleteTarget?.user?.full_name} (${deleteTarget?.user?.email}) from this school? They will lose access to school operations.`}
        isLoading={deleteMembershipMutation.isPending}
      />
    </div>
  );
};
