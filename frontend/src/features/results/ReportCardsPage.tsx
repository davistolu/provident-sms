import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Award, Search, Filter, RefreshCw, CheckCircle2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/context/ToastContext';
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

  const {
    data: resultsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
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
      const msg = res.message || 'Results computed and published successfully!';
      setStatusMessage(msg);
      toast.success(msg);
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to compute class results. Ensure subject scores are approved.';
      setErrorMessage(msg);
      toast.error(err, 'Failed to compute class results');
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
      toast.success(`Report card downloaded for ${result.student_name}`);
    } catch (err: any) {
      toast.error(err, 'Failed to download report card PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: Column<StudentTermResult>[] = [
    {
      header: 'Rank / Pos',
      cell: (row) => (
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="w-7 h-7 rounded-md bg-[#f4f3ef] border border-[#e5e3dc] text-[#141d24] font-bold flex items-center justify-center">
            {row.position_in_class || '-'}
          </span>
          <span className="text-[#8c9ba5] font-normal text-[11px]">of {row.total_students_in_class}</span>
        </div>
      ),
    },
    {
      header: 'Student Name',
      cell: (row) => (
        <div>
          <p className="font-semibold text-sm text-[#141d24]">{row.student_name}</p>
          <p className="text-xs font-mono text-[#064e3b] font-medium">{row.admission_number}</p>
        </div>
      ),
    },
    {
      header: 'Class / Arm',
      accessorKey: 'class_arm_name',
      cell: (row) => <span className="text-xs font-medium text-[#141d24]">{row.class_arm_name}</span>,
    },
    {
      header: 'Total Marks',
      cell: (row) => (
        <span className="font-mono font-medium text-[#141d24] text-xs">
          {row.total_marks_obtained} <span className="text-[#8c9ba5]">/ {row.total_marks_possible}</span>
        </span>
      ),
    },
    {
      header: 'Overall Average',
      cell: (row) => (
        <span className="font-mono font-bold text-[#064e3b] text-xs px-2 py-0.5 bg-[#ecfdf5] border border-[#a7f3d0] rounded-md">
          {row.average_score}%
        </span>
      ),
    },
    {
      header: 'Attendance',
      cell: (row) => (
        <span className="text-xs font-mono text-[#52606d]">
          {row.attendance_present} / {row.attendance_total} days
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.is_published ? 'evergreen' : 'neutral'}>
          {row.is_published ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      header: 'Official Report Card',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e3dc]">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#141d24]">
            Student Progress Report Cards
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Computed term summaries, student rankings, and official PDF report dossiers
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
        <div className="p-3 bg-[#ecfdf5] border border-[#a7f3d0] text-[#064e3b] text-xs font-semibold rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] text-xs font-semibold rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#e11d48]" />
          {errorMessage}
        </div>
      )}

      <DataTable
        columns={columns}
        data={resultsData?.results || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        filterComponent={
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
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
            <label className="block text-xs font-semibold text-[#141d24] mb-1">Select Class Section / Arm</label>
            <select
              required
              value={publishClassId}
              onChange={(e) => setPublishClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
            >
              <option value="">Select Class Arm</option>
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[#52606d] bg-[#fbfbfa] p-3 rounded-md border border-[#e5e3dc] space-y-1">
            <p className="font-semibold text-[#141d24]">Official Computation Protocol</p>
            <p>
              Only approved subject scores will be aggregated into the term totals, averages, and class position rankings.
            </p>
          </div>

          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={publishMutation.isPending} loadingText="Publishing...">
              Compute & Publish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

