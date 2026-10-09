import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  UserPlus, Download, Upload, Eye, Filter, CheckCircle2,
  Trash2, Edit, AlertCircle
} from 'lucide-react';
import { api } from '@/services/api';
import { Student, ClassArm, AcademicSession, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

export const StudentListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

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
  const { data: studentsData, isLoading } = useQuery({
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
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create student.');
    },
  });

  // Bulk import mutation
  const importMutation = useMutation({
    mutationFn: (fd: FormData) => api.upload('/students/students/bulk_import/', fd),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setImportResult(res);
    },
    onError: (err: any) => {
      setImportResult({ error: err.message });
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createStudentMutation.mutate(formData);
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
      header: 'Admission No',
      accessorKey: 'admission_number',
      cell: (row) => <span className="font-mono font-bold text-xs text-indigo-600">{row.admission_number}</span>,
    },
    {
      header: 'Full Name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.full_name}</p>
          <p className="text-[11px] text-slate-400">{row.gender}</p>
        </div>
      ),
    },
    {
      header: 'Class / Arm',
      cell: (row) => (
        <span className="font-semibold text-slate-700">
          {row.current_enrollment?.class_arm_name || <span className="text-slate-400">Unassigned</span>}
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
        <div className="flex items-center justify-end gap-2">
          <Link to={`/admin/students/${row.id}`}>
            <Button variant="outline" size="sm" icon={Eye}>
              Profile
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-xs text-slate-500">Manage institution student registry, admissions, and enrollments</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/v1/students/students/export_csv/" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" icon={Download}>
              Export CSV
            </Button>
          </a>
          <Button variant="outline" size="sm" icon={Upload} onClick={() => setIsImportOpen(true)}>
            Bulk Import
          </Button>
          <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setIsRegisterOpen(true)}>
            Register Student
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={studentsData?.results || []}
        isLoading={isLoading}
        searchPlaceholder="Search student by name or admission no..."
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
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
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
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Admission Number"
              required
              placeholder="e.g. SMS/2024/009"
              value={formData.admission_number}
              onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
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
              label="Last Name (Surname)"
              required
              placeholder="Surname"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Class Arm</label>
              <select
                value={formData.class_arm_id}
                onChange={(e) => setFormData({ ...formData, class_arm_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Session</label>
            <select
              value={formData.academic_session_id}
              onChange={(e) => setFormData({ ...formData, academic_session_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Select Academic Session</option>
              {sessionsData?.results?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createStudentMutation.isPending}>
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
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <p className="font-bold text-slate-800 mb-1">CSV Column Requirements:</p>
            <p className="font-mono text-[11px]">Admission Number, First Name, Last Name, Gender, Date of Birth</p>
          </div>

          <input
            type="file"
            accept=".csv"
            required
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Class</label>
              <select
                value={formData.class_arm_id}
                onChange={(e) => setFormData({ ...formData, class_arm_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session</label>
              <select
                value={formData.academic_session_id}
                onChange={(e) => setFormData({ ...formData, academic_session_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
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
                importResult.error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
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

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
            <Button type="submit" variant="primary" isLoading={importMutation.isPending}>
              Upload & Process
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
