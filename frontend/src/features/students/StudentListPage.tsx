import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  UserPlus, Download, Upload, Eye, Filter, CheckCircle2,
  Trash2, Edit, AlertCircle, Users, GraduationCap
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Student, ClassArm, AcademicSession, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';

export const StudentListPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'MALE',
    date_of_birth: '',
    status: 'ACTIVE',
    class_arm_id: '',
  });
  const [editError, setEditError] = useState<string | null>(null);

  const studentDetailBase = isAdmin ? '/admin/students' : '/teacher/students';

  // Form State
  const [formData, setFormData] = useState({
    admission_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'MALE',
    date_of_birth: '',
    class_arm_id: '',
    academic_session_id: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Fetch classes & sessions for select menus
  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: () => api.get<PaginatedResponse<AcademicSession>>('/academics/sessions/'),
  });

  // Fetch students
  const {
    data: studentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['students', page, search, selectedClass],
    queryFn: () =>
      api.get<PaginatedResponse<Student>>('/students/students/', {
        page,
        search,
        class_arm: selectedClass || undefined,
      }),
  });

  // Create mutation
  const createStudentMutation = useMutation({
    mutationFn: (data: any) => api.post('/students/students/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsRegisterOpen(false);
      setFormData({
        admission_number: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'MALE',
        date_of_birth: '',
        class_arm_id: '',
        academic_session_id: '',
      });
      toast.success('Student enrolled successfully');
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to create student.';
      setFormError(msg);
      toast.error(err, 'Failed to create student');
    },
  });

  // Edit mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/students/students/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEditTarget(null);
      setEditError(null);
      toast.success('Student details updated successfully');
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to update student.';
      setEditError(msg);
      toast.error(err, 'Failed to update student');
    },
  });

  // Delete mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/students/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteTarget(null);
      toast.success('Student record deleted successfully');
    },
    onError: (err) => {
      toast.error(err, 'Failed to delete student');
    },
  });

  // Bulk import mutation
  const importMutation = useMutation({
    mutationFn: (fd: FormData) => api.upload('/students/students/bulk_import/', fd),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setImportResult(res);
      toast.success(`Successfully imported ${res.imported_count || 'all'} students`);
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to import CSV file.';
      setImportResult({ error: msg });
      toast.error(err, 'Failed to import students');
    },
  });

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await api.downloadFile('/students/students/export_csv/', 'Student_Registry.csv');
      toast.success('Student registry downloaded');
    } catch (err) {
      toast.error(err, 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createStudentMutation.mutate(formData);
  };

  const handleEditOpen = (student: Student) => {
    setEditTarget(student);
    setEditForm({
      first_name: student.first_name || '',
      middle_name: student.middle_name || '',
      last_name: student.last_name || '',
      gender: student.gender || 'MALE',
      date_of_birth: student.date_of_birth || '',
      status: student.status || 'ACTIVE',
      class_arm_id: student.current_enrollment?.class_arm_id || '',
    });
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    updateStudentMutation.mutate({ id: editTarget.id, data: editForm });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    const fd = new FormData();
    fd.append('file', importFile);
    if (formData.class_arm_id) fd.append('class_arm_id', formData.class_arm_id);
    if (formData.academic_session_id) fd.append('session_id', formData.academic_session_id);
    importMutation.mutate(fd);
  };

  const columns: Column<Student>[] = [
    {
      header: 'Admission Number',
      accessorKey: 'admission_number',
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-[#064e3b] bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0]">
          {row.admission_number}
        </span>
      ),
    },
    {
      header: 'Student Name',
      cell: (row) => (
        <div>
          <p className="font-bold text-[#141d24]">{row.full_name}</p>
          <p className="text-[11px] text-[#8896a4]">{row.gender}</p>
        </div>
      ),
    },
    {
      header: 'Class / Stream',
      cell: (row) => (
        <span className="font-semibold text-[#141d24]">
          {row.current_enrollment?.class_arm_name || <span className="text-[#8896a4] italic">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`${studentDetailBase}/${row.id}`}>
            <Button variant="outline" size="xs" icon={Eye}>
              Dossier
            </Button>
          </Link>
          {isAdmin && (
            <>
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
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-[#141d24]">
              {isAdmin ? 'Student Master Directory' : 'My Enrolled Students'}
            </h1>
            <Badge variant="evergreen">
              {studentsData?.count ?? 0} Students
            </Badge>
          </div>
          <p className="text-xs text-[#52606d] mt-0.5">
            {isAdmin
              ? 'Institutional admission registry, academic records, and enrollment streams'
              : 'Class rosters, biodata, and student academic performance dossiers'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCsv}
              isLoading={isExporting}
              loadingText="Exporting..."
            >
              Export CSV
            </Button>
            <Button variant="outline" size="sm" icon={Upload} onClick={() => setIsImportOpen(true)}>
              Bulk Import
            </Button>
            <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setIsRegisterOpen(true)}>
              Register Student
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={studentsData?.results || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        searchPlaceholder="Filter student by name or admission number..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterComponent={
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
          >
            <option value="">All Class Arms</option>
            {classesData?.results?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        }
        currentPage={page}
        totalPages={studentsData?.total_pages || 1}
        totalCount={studentsData?.count}
        onPageChange={(p) => setPage(p)}
      />

      {/* Register Student Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Student"
        subtitle="Create student profile and assign to an active class arm"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs font-medium rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Admission Number"
              placeholder="Auto-generated if left blank"
              value={formData.admission_number}
              helperText="Leave empty for sequential auto-generation"
              onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
            />
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="First Name"
              required
              placeholder="First name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Middle Name"
              placeholder="Middle name"
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
            />
            <Input
              label="Surname"
              required
              placeholder="Last name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
                Assign Class Stream
              </label>
              <select
                value={formData.class_arm_id}
                onChange={(e) => setFormData({ ...formData, class_arm_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
              >
                <option value="">Select Class Arm</option>
                {classesData?.results?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
              Academic Session
            </label>
            <select
              value={formData.academic_session_id}
              onChange={(e) => setFormData({ ...formData, academic_session_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
            >
              <option value="">Select Academic Session</option>
              {sessionsData?.results?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-[#e6e4dc] flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createStudentMutation.isPending} loadingText="Saving...">
              Save Student Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setImportResult(null);
        }}
        title="Bulk Import Students (CSV)"
        subtitle="Upload a CSV file containing Admission Number, First Name, Last Name, and Gender"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="p-3 bg-[#fbfbfa] border border-[#e6e4dc] rounded-lg text-xs text-[#52606d]">
            <p className="font-bold text-[#141d24] mb-1">CSV Column Requirements:</p>
            <p className="font-mono text-[11px]">Admission Number, First Name, Last Name, Gender, Date of Birth</p>
          </div>

          <input
            type="file"
            accept=".csv"
            required
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-[#52606d] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#ecfdf5] file:text-[#064e3b] hover:file:bg-[#d1fae5] cursor-pointer"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1">
                Assign to Class
              </label>
              <select
                value={formData.class_arm_id}
                onChange={(e) => setFormData({ ...formData, class_arm_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg"
              >
                <option value="">Select Class Arm</option>
                {classesData?.results?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1">
                Session
              </label>
              <select
                value={formData.academic_session_id}
                onChange={(e) => setFormData({ ...formData, academic_session_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg"
              >
                <option value="">Select Academic Session</option>
                {sessionsData?.results?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {importResult && (
            <div
              className={`p-3 rounded-lg text-xs ${
                importResult.error ? 'bg-[#fef2f2] text-[#991b1b]' : 'bg-[#ecfdf5] text-[#065f46]'
              }`}
            >
              {importResult.error ? (
                <p>{importResult.error}</p>
              ) : (
                <p className="font-bold">
                  Successfully imported {importResult.imported_count} students!
                </p>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-[#e6e4dc] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsImportOpen(false);
                setImportResult(null);
              }}
            >
              Close
            </Button>
            <Button type="submit" variant="primary" isLoading={importMutation.isPending} loadingText="Importing...">
              Upload & Process
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Student Record"
        subtitle={`Update details for ${editTarget?.full_name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs font-medium rounded-lg">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="First Name"
              required
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            />
            <Input
              label="Middle Name"
              value={editForm.middle_name}
              onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
            />
            <Input
              label="Surname"
              required
              value={editForm.last_name}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24]"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <Input
              label="Date of Birth"
              type="date"
              value={editForm.date_of_birth}
              onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
            />
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24]"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="GRADUATED">Graduated</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
              Assigned Class Stream
            </label>
            <select
              value={editForm.class_arm_id}
              onChange={(e) => setEditForm({ ...editForm, class_arm_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24]"
            >
              <option value="">Select Class Arm</option>
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-[#e6e4dc] flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateStudentMutation.isPending} loadingText="Saving...">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteStudentMutation.mutate(deleteTarget.id);
        }}
        title="Delete Student Record"
        message={`Are you sure you want to delete ${deleteTarget?.full_name} (${deleteTarget?.admission_number})? This action will remove their active enrollment.`}
        isLoading={deleteStudentMutation.isPending}
        loadingText="Deleting..."
      />
    </div>
  );
};
