import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User, Calendar, MapPin, Award, CreditCard,
  ArrowLeft, FileText, Download, CheckCircle2
} from 'lucide-react';
import { api } from '@/services/api';
import { Student, StudentTermResult, StudentInvoice, PaginatedResponse } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'finance'>('overview');

  const { data: student, isLoading } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => api.get<Student>(`/students/students/${id}/`),
  });

  const { data: resultsData } = useQuery({
    queryKey: ['student-results', id],
    queryFn: () => api.get<PaginatedResponse<StudentTermResult>>(`/results/term-results/?student=${id}`),
    enabled: !!id,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['student-invoices', id],
    queryFn: () => api.get<PaginatedResponse<StudentInvoice>>(`/finance/invoices/?student=${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500">Loading student profile...</div>;
  }

  if (!student) {
    return <div className="py-12 text-center text-slate-500">Student not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to="/admin/students" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4" /> Back to Student Registry
      </Link>

      {/* Student Banner Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl border border-indigo-200">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{student.full_name}</h1>
              <Badge variant={student.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {student.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Admission No: <b className="text-indigo-600">{student.admission_number}</b> &bull; Class: <b className="text-slate-800">{student.current_enrollment?.class_arm_name || 'Unassigned'}</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="indigo" size="md">
            Gender: {student.gender}
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Biodata & Info
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'results'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Academic Reports ({resultsData?.results?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'finance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Billing & Invoices ({invoicesData?.results?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Overview Biodata */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400">First Name</p>
                <p className="font-bold text-slate-800 mt-0.5">{student.first_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Surname</p>
                <p className="font-bold text-slate-800 mt-0.5">{student.last_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Date of Birth</p>
                <p className="font-bold text-slate-800 mt-0.5">{student.date_of_birth || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-slate-400">Gender</p>
                <p className="font-bold text-slate-800 mt-0.5">{student.gender}</p>
              </div>
              <div>
                <p className="text-slate-400">Blood Group / Genotype</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {student.blood_group || 'N/A'} &bull; {student.genotype || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Admission Date</p>
                <p className="font-bold text-slate-800 mt-0.5">{student.admission_date}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Contact & Address
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400">Residential Address</p>
                <p className="font-bold text-slate-800 mt-0.5">{student.address || 'No address provided'}</p>
              </div>
              <div>
                <p className="text-slate-400">State of Origin</p>
                <p className="font-bold text-slate-800 mt-0.5">{student.state_of_origin || 'Nigeria'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academic Results */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          {resultsData?.results?.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No published term results for this student yet.</p>
          ) : (
            resultsData?.results?.map((res) => (
              <div key={res.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {res.term_name} &bull; {res.session_name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Class: <b>{res.class_arm_name}</b> &bull; Average: <b className="text-indigo-600">{res.average_score}%</b> &bull; Position: <b>{res.position_in_class ? `${res.position_in_class} of ${res.total_students_in_class}` : 'N/A'}</b>
                  </p>
                </div>
                <a
                  href={`/api/v1/results/term-results/${res.id}/report-card-pdf/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="sm" icon={Download}>
                    PDF Report Card
                  </Button>
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Finance & Invoices */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          {invoicesData?.results?.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No fee invoices issued for this student yet.</p>
          ) : (
            invoicesData?.results?.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-mono font-bold text-indigo-600">{inv.invoice_number}</h4>
                    <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                      {inv.status_display}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {inv.term_name} ({inv.session_name}) &bull; Total: <b>₦{Number(inv.total_amount).toLocaleString()}</b> &bull; Paid: <b className="text-emerald-600">₦{Number(inv.amount_paid).toLocaleString()}</b> &bull; Balance: <b className="text-rose-600">₦{Number(inv.balance).toLocaleString()}</b>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
