import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Calendar, MapPin, Award, CreditCard,
  ArrowLeft, FileText, Download, CheckCircle2, Edit, Printer
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Student, ClassArm, StudentTermResult, StudentInvoice, PaginatedResponse } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'finance'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const backUrl = isAdmin ? '/admin/students' : '/teacher/classes';

  const { data: student, isLoading } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => api.get<Student>(`/students/students/${id}/`),
  });

  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
    enabled: isAdmin,
  });

  const [editForm, setEditForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'MALE',
    date_of_birth: '',
    blood_group: '',
    genotype: '',
    address: '',
    state_of_origin: '',
    status: 'ACTIVE',
    class_arm_id: '',
  });

  useEffect(() => {
    if (student) {
      setEditForm({
        first_name: student.first_name || '',
        middle_name: student.middle_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'MALE',
        date_of_birth: student.date_of_birth || '',
        blood_group: student.blood_group || '',
        genotype: student.genotype || '',
        address: student.address || '',
        state_of_origin: student.state_of_origin || '',
        status: student.status || 'ACTIVE',
        class_arm_id: student.current_enrollment?.class_arm_id || '',
      });
    }
  }, [student]);

  const updateStudentMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/students/students/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsEditModalOpen(false);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || 'Failed to update student profile.');
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    updateStudentMutation.mutate(editForm);
  };

  const { data: resultsData } = useQuery({
    queryKey: ['student-results', id],
    queryFn: () => api.get<PaginatedResponse<StudentTermResult>>(`/results/term-results/?student=${id}`),
    enabled: !!id,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['student-invoices', id],
    queryFn: () => api.get<PaginatedResponse<StudentInvoice>>(`/finance/invoices/?student=${id}`),
    enabled: !!id && isAdmin,
  });

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-[#8896a4]">Loading student dossier...</div>;
  }

  if (!student) {
    return <div className="py-12 text-center text-xs text-[#8896a4]">Student record not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link to={backUrl} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#52606d] hover:text-[#064e3b] transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {isAdmin ? 'Student Directory' : 'My Classes'}
      </Link>

      {/* Student Banner Dossier */}
      <div className="bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#064e3b] text-white flex items-center justify-center font-bold text-lg font-display border border-[#043326] shadow-inner">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-[#141d24]">{student.full_name}</h1>
              <Badge variant={student.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {student.status}
              </Badge>
            </div>
            <p className="text-xs text-[#52606d] mt-1 font-mono">
              Admission No: <b className="text-[#064e3b] font-bold">{student.admission_number}</b> &bull; Stream: <b className="text-[#141d24]">{student.current_enrollment?.class_arm_name || 'Unassigned'}</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Gender: {student.gender}
          </Badge>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              icon={Edit}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Dossier
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e6e4dc]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#064e3b] text-[#064e3b]'
              : 'border-transparent text-[#52606d] hover:text-[#141d24]'
          }`}
        >
          Biodata & Info
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'results'
              ? 'border-[#064e3b] text-[#064e3b]'
              : 'border-transparent text-[#52606d] hover:text-[#141d24]'
          }`}
        >
          Academic Reports ({resultsData?.results?.length ?? 0})
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'finance'
                ? 'border-[#064e3b] text-[#064e3b]'
                : 'border-transparent text-[#52606d] hover:text-[#141d24]'
            }`}
          >
            Billing & Invoices ({invoicesData?.results?.length ?? 0})
          </button>
        )}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-[#52606d] uppercase tracking-wider border-b border-[#f0eee6] pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[#8896a4]">First Name</p>
                <p className="font-bold text-[#141d24] mt-0.5">{student.first_name}</p>
              </div>
              <div>
                <p className="text-[#8896a4]">Surname</p>
                <p className="font-bold text-[#141d24] mt-0.5">{student.last_name}</p>
              </div>
              <div>
                <p className="text-[#8896a4]">Date of Birth</p>
                <p className="font-bold text-[#141d24] mt-0.5">{student.date_of_birth || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-[#8896a4]">Gender</p>
                <p className="font-bold text-[#141d24] mt-0.5">{student.gender}</p>
              </div>
              <div>
                <p className="text-[#8896a4]">Blood Group & Genotype</p>
                <p className="font-bold text-[#141d24] mt-0.5">
                  {student.blood_group || 'N/A'} &bull; {student.genotype || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[#8896a4]">Admission Date</p>
                <p className="font-bold text-[#141d24] mt-0.5">{student.admission_date}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-[#52606d] uppercase tracking-wider border-b border-[#f0eee6] pb-2">
              Contact & Address
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[#8896a4]">Residential Address</p>
                <p className="font-bold text-[#141d24] mt-0.5">{student.address || 'No address provided'}</p>
              </div>
              <div>
                <p className="text-[#8896a4]">State of Origin</p>
                <p className="font-bold text-[#141d24] mt-0.5">{student.state_of_origin || 'Nigeria'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academic Results */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-[#e6e4dc] shadow-2xs divide-y divide-[#f0eee6]">
          {resultsData?.results?.length === 0 ? (
            <p className="text-xs text-[#8896a4] py-12 text-center">No published term progress reports for this student yet.</p>
          ) : (
            resultsData?.results?.map((res) => (
              <div key={res.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-display text-[#141d24]">
                    {res.term_name} &bull; {res.session_name}
                  </h4>
                  <p className="text-xs text-[#52606d] mt-0.5">
                    Stream: <b>{res.class_arm_name}</b> &bull; Average: <b className="text-[#064e3b]">{res.average_score}%</b> &bull; Rank: <b>{res.position_in_class ? `${res.position_in_class} of ${res.total_students_in_class}` : 'N/A'}</b>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  icon={Download}
                  onClick={() =>
                    api.downloadFile(
                      `/results/term-results/${res.id}/report-card-pdf/`,
                      `ReportCard_${student.admission_number}_${res.term_name}.pdf`
                    )
                  }
                >
                  PDF Report Card
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Finance & Invoices */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-2xl border border-[#e6e4dc] shadow-2xs divide-y divide-[#f0eee6]">
          {invoicesData?.results?.length === 0 ? (
            <p className="text-xs text-[#8896a4] py-12 text-center">No fee invoices issued for this student yet.</p>
          ) : (
            invoicesData?.results?.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-mono font-bold text-[#064e3b]">{inv.invoice_number}</h4>
                    <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                      {inv.status_display}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#52606d] mt-1 font-mono">
                    {inv.term_name} ({inv.session_name}) &bull; Billed: <b>₦{Number(inv.total_amount).toLocaleString()}</b> &bull; Paid: <b className="text-[#059669]">₦{Number(inv.amount_paid).toLocaleString()}</b> &bull; Balance: <b className="text-[#991b1b]">₦{Number(inv.balance).toLocaleString()}</b>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={FileText}
                    onClick={() =>
                      api.downloadFile(
                        `/finance/invoices/${inv.id}/invoice-pdf/`,
                        `Invoice_${inv.invoice_number}.pdf`
                      )
                    }
                  >
                    Invoice PDF
                  </Button>
                  {inv.payments?.length > 0 && (
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-[#065f46] border-[#a7f3d0] hover:bg-[#ecfdf5]"
                      icon={Printer}
                      onClick={() =>
                        api.downloadFile(
                          `/finance/payments/${inv.payments[0].id}/receipt-pdf/`,
                          `Receipt_${inv.payments[0].reference_number}.pdf`
                        )
                      }
                    >
                      Receipt PDF
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Information"
        subtitle={`Update biodata and class assignment for ${student.full_name}`}
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

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Blood Group"
              placeholder="e.g. O+, A+"
              value={editForm.blood_group}
              onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
            />
            <Input
              label="Genotype"
              placeholder="e.g. AA, AS"
              value={editForm.genotype}
              onChange={(e) => setEditForm({ ...editForm, genotype: e.target.value })}
            />
            <div>
              <label className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-1.5">
                Class Stream
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State of Origin"
              placeholder="e.g. Lagos, Abuja"
              value={editForm.state_of_origin}
              onChange={(e) => setEditForm({ ...editForm, state_of_origin: e.target.value })}
            />
            <Input
              label="Residential Address"
              placeholder="Full home address"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-[#e6e4dc] flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateStudentMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
