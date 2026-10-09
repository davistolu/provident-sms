import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, UserCheck } from 'lucide-react';
import { api } from '@/services/api';
import { Subject, TeacherSubjectAssignment, ClassArm, TeacherProfile, AcademicSession, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

export const SubjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'subjects' | 'assignments'>('subjects');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Subject Form
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    category: 'GENERAL',
  });

  // Assignment Form
  const [assignForm, setAssignForm] = useState({
    teacher: '',
    subject: '',
    class_arm: '',
    academic_session: '',
  });

  // Queries
  const { data: subjectsData, isLoading: isSubjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<PaginatedResponse<Subject>>('/academics/subjects/'),
  });

  const { data: assignmentsData, isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => api.get<PaginatedResponse<TeacherSubjectAssignment>>('/academics/assignments/'),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get<PaginatedResponse<TeacherProfile>>('/academics/teachers/'),
  });

  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: () => api.get<PaginatedResponse<AcademicSession>>('/academics/sessions/'),
  });

  // Mutations
  const createSubjectMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/subjects/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsSubjectModalOpen(false);
      setSubjectForm({ name: '', code: '', category: 'GENERAL' });
    },
  });

  const createAssignMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/assignments/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setIsAssignModalOpen(false);
      setAssignForm({ teacher: '', subject: '', class_arm: '', academic_session: '' });
    },
  });

  const subjectColumns: Column<Subject>[] = [
    {
      header: 'Subject Name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-[11px] font-mono text-slate-400">{row.code || 'NO-CODE'}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category_display',
      cell: (row) => <Badge variant="indigo">{row.category_display}</Badge>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const assignmentColumns: Column<TeacherSubjectAssignment>[] = [
    {
      header: 'Teacher',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.teacher_name}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.staff_id}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Subject',
      accessorKey: 'subject_name',
      cell: (row) => <span className="font-semibold text-indigo-700">{row.subject_name}</span>,
    },
    {
      header: 'Class / Arm',
      accessorKey: 'class_arm_name',
      cell: (row) => <Badge variant="neutral">{row.class_arm_name}</Badge>,
    },
    {
      header: 'Session',
      accessorKey: 'session_name',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Curriculum & Subject Assignments</h1>
          <p className="text-xs text-slate-500">Manage institution subject registry and teacher allocations</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'subjects' ? (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsSubjectModalOpen(true)}>
              New Subject
            </Button>
          ) : (
            <Button variant="primary" size="sm" icon={UserCheck} onClick={() => setIsAssignModalOpen(true)}>
              Assign Teacher
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'subjects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Subjects Catalog ({subjectsData?.results?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'assignments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Teacher Assignments ({assignmentsData?.results?.length ?? 0})
        </button>
      </div>

      {activeTab === 'subjects' ? (
        <DataTable
          columns={subjectColumns}
          data={subjectsData?.results || []}
          isLoading={isSubjectsLoading}
        />
      ) : (
        <DataTable
          columns={assignmentColumns}
          data={assignmentsData?.results || []}
          isLoading={isAssignmentsLoading}
        />
      )}

      {/* New Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Create New Subject"
        subtitle="Add a subject to the school curriculum"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSubjectMutation.mutate(subjectForm);
          }}
          className="space-y-4"
        >
          <Input
            label="Subject Name"
            required
            placeholder="e.g. Further Mathematics"
            value={subjectForm.name}
            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
          />
          <Input
            label="Subject Code"
            placeholder="e.g. FMTH"
            value={subjectForm.code}
            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={subjectForm.category}
              onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="GENERAL">General / Core</option>
              <option value="SCIENCES">Sciences</option>
              <option value="ARTS_HUMANITIES">Arts & Humanities</option>
              <option value="COMMERCIAL">Commercial / Business</option>
              <option value="VOCATIONAL">Vocational / Technical</option>
              <option value="LANGUAGES">Languages</option>
            </select>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createSubjectMutation.isPending}>
              Save Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Subject to Teacher"
        subtitle="Allocate teaching responsibilities for a class arm and session"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAssignMutation.mutate(assignForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher</label>
            <select
              required
              value={assignForm.teacher}
              onChange={(e) => setAssignForm({ ...assignForm, teacher: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Select Teacher</option>
              {teachersData?.results?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.full_name} ({t.staff_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <select
              required
              value={assignForm.subject}
              onChange={(e) => setAssignForm({ ...assignForm, subject: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Select Subject</option>
              {subjectsData?.results?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Arm</label>
              <select
                required
                value={assignForm.class_arm}
                onChange={(e) => setAssignForm({ ...assignForm, class_arm: e.target.value })}
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Session</label>
              <select
                required
                value={assignForm.academic_session}
                onChange={(e) => setAssignForm({ ...assignForm, academic_session: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
              >
                <option value="">Select Session</option>
                {sessionsData?.results?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createAssignMutation.isPending}>
              Assign Responsibility
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
