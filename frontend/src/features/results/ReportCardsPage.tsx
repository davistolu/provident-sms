import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Award, Search, Filter, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { StudentTermResult, ClassArm, AcademicSession, AcademicTerm, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';

export const ReportCardsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishClassId, setPublishClassId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: () => api.get<PaginatedResponse<AcademicSession>>('/academics/sessions/'),
  });

  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['term-results', selectedClass],
    queryFn: () =>
      api.get<PaginatedResponse<StudentTermResult>>('/results/term-results/', {
        class_arm: selectedClass || undefined,
      }),
  });

  // Publish / Compute Class Results Mutation
  const publishMutation = useMutation({
    mutationFn: (class_arm_id: string) =>
      api.post<any>('/results/submissions/publish-class-results/', { class_arm_id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['term-results'] });
      setIsPublishModalOpen(false);
      setStatusMessage(res.message || 'Results computed and published successfully!');
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 5000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to compute class results. Ensure subject scores are approved.');
      setTimeout(() => setErrorMessage(null), 6000);
    },
  });

  // Download Report Card Handler using JWT auth
  const handleDownloadReportCard = async (result: StudentTermResult) => {
    try {
      setDownloadingId(result.id);
      await api.downloadFile(
        `/results/term-results/${result.id}/report-card-pdf/`,
        `ReportCard_${result.admission_number}_${result.term_name || 'Term'}.pdf`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to download report card PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: Column<StudentTermResult>[] = [
    {
      header: 'Position',
      cell: (row) => (
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
            {row.position_in_class || '-'}
          </span>
          <span className="text-slate-400 font-normal">of {row.total_students_in_class}</span>
        </div>
      ),
    },
    {
      header: 'Student Name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.student_name}</p>
          <p className="text-[11px] font-mono text-slate-400">{row.admission_number}</p>
        </div>
      ),
    },
    {
      header: 'Class / Arm',
      accessorKey: 'class_arm_name',
    },
    {
      header: 'Total Marks',
      cell: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.total_marks_obtained} / {row.total_marks_possible}
        </span>
      ),
    },
    {
      header: 'Average %',
      cell: (row) => (
        <span className="font-bold text-indigo-700 text-xs px-2 py-0.5 bg-indigo-50 rounded">
          {row.average_score}%
        </span>
      ),
    },
    {
      header: 'Attendance',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.attendance_present} / {row.attendance_total} days
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.is_published ? 'success' : 'default'}>
          {row.is_published ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      header: 'Report Card',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            isLoading={downloadingId === row.id}
            onClick={() => handleDownloadReportCard(row)}
          >
            PDF Report
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Progress Report Cards</h1>
          <p className="text-xs text-slate-500">
            Official computed term summaries, student positions, and downloadable PDF report cards with school crest
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={() => setIsPublishModalOpen(true)}
          >
            Compute & Publish Class Results
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {errorMessage}
        </div>
      )}

      <DataTable
        columns={columns}
        data={resultsData?.results || []}
        isLoading={isLoading}
        filterComponent={
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Class Arms</option>
            {classesData?.results?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        }
      />

      {/* Compute & Publish Results Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Compute & Publish Class Results"
        subtitle="Aggregates subject scores, calculates student averages and rankings, and generates report cards"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (publishClassId) publishMutation.mutate(publishClassId);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Class Arm</label>
            <select
              required
              value={publishClassId}
              onChange={(e) => setPublishClassId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="">Select Class Arm</option>
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            Note: Only approved subject scores will be aggregated into the term totals, averages, and class position rankings.
          </p>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={publishMutation.isPending}>
              Compute & Publish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
