import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, XCircle, Eye, Globe, Award, CheckCircle2, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { api } from '@/services/api';
import { AssessmentSubmission, ClassArm, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';

export const ResultReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSub, setSelectedSub] = useState<AssessmentSubmission | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishClassId, setPublishClassId] = useState('');
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['assessment-submissions'],
    queryFn: () => api.get<PaginatedResponse<AssessmentSubmission>>('/results/submissions/'),
  });

  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  // Review Mutation (Approve / Reject)
  const reviewMutation = useMutation({
    mutationFn: (payload: { id: string; decision: 'APPROVE' | 'REJECT'; feedback: string }) =>
      api.post(`/results/submissions/${payload.id}/review/`, {
        decision: payload.decision,
        feedback: payload.feedback,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-submissions'] });
      setSelectedSub(null);
      setFeedbackNotes('');
    },
  });

  // Publish Class Results Mutation
  const publishMutation = useMutation({
    mutationFn: (class_arm_id: string) =>
      api.post<any>('/results/submissions/publish-class-results/', { class_arm_id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-submissions'] });
      setIsPublishModalOpen(false);
      setPublishMessage(res.message || 'Results published successfully!');
      setTimeout(() => setPublishMessage(null), 4000);
    },
  });

  const columns: Column<AssessmentSubmission>[] = [
    {
      header: 'Class / Arm',
      accessorKey: 'class_arm_name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-sm text-[#141d24]">{row.class_arm_name}</span>
          <div className="text-xs text-[#52606d] font-mono mt-0.5">
            {row.term_name} • {row.session_name}
          </div>
        </div>
      ),
    },
    {
      header: 'Subject Curriculum',
      accessorKey: 'subject_name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#064e3b]" />
          <span className="font-semibold text-xs text-[#141d24]">{row.subject_name}</span>
        </div>
      ),
    },
    {
      header: 'Submitted By',
      cell: (row) => (
        <div>
          <p className="font-medium text-[#141d24] text-xs">{row.submitted_by_name || 'Assigned Educator'}</p>
          <p className="text-[11px] text-[#52606d] font-mono">{row.scores_count} students graded</p>
        </div>
      ),
    },
    {
      header: 'Moderation Status',
      cell: (row) => {
        const variant =
          row.status === 'PUBLISHED' || row.status === 'APPROVED'
            ? 'evergreen'
            : row.status === 'SUBMITTED'
            ? 'gold'
            : row.status === 'REJECTED'
            ? 'danger'
            : 'neutral';
        return <Badge variant={variant}>{row.status_display}</Badge>;
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedSub(row);
              setFeedbackNotes(row.feedback_notes || '');
            }}
          >
            Review Scores
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e3dc]">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#141d24]">
            Assessment Result Reviews & Publication
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Moderate teacher score entries, review grade distributions, and publish institutional term results
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Globe}
          onClick={() => setIsPublishModalOpen(true)}
        >
          Publish Class Results
        </Button>
      </div>

      {publishMessage && (
        <div className="p-3 bg-[#ecfdf5] border border-[#a7f3d0] text-[#064e3b] text-xs font-semibold rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          {publishMessage}
        </div>
      )}

      <DataTable
        columns={columns}
        data={submissionsData?.results || []}
        isLoading={isLoading}
      />

      {/* Review Submission Dialog */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title={`Review Marks: ${selectedSub?.subject_name} (${selectedSub?.class_arm_name})`}
        subtitle={`Submitted by ${selectedSub?.submitted_by_name || 'Educator'} • ${selectedSub?.scores?.length ?? 0} students evaluated`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {selectedSub?.feedback_notes && (
            <div className="p-3 bg-[#fbfbfa] border border-[#e5e3dc] rounded-md text-xs space-y-1">
              <div className="font-semibold text-[#141d24] flex items-center justify-between">
                <span>Existing Moderation Feedback</span>
                {selectedSub.reviewed_by_name && (
                  <span className="text-[11px] text-[#52606d] font-normal">
                    By {selectedSub.reviewed_by_name} {selectedSub.reviewed_at ? `on ${new Date(selectedSub.reviewed_at).toLocaleDateString()}` : ''}
                  </span>
                )}
              </div>
              <p className="text-[#52606d]">{selectedSub.feedback_notes}</p>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto border border-[#e5e3dc] rounded-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f4f3ef] border-b border-[#e5e3dc] font-bold text-[#52606d] text-[10px] uppercase tracking-wider sticky top-0 bg-[#f4f3ef]">
                  <th className="px-3 py-2.5">Admission No</th>
                  <th className="px-3 py-2.5">Student Name</th>
                  <th className="px-3 py-2.5 text-center">Total (100)</th>
                  <th className="px-3 py-2.5 text-center">Grade</th>
                  <th className="px-3 py-2.5">Remark</th>
                  <th className="px-3 py-2.5">Teacher Feedback / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e3dc]">
                {selectedSub?.scores?.map((sc) => (
                  <tr key={sc.id} className="hover:bg-[#fbfbfa]">
                    <td className="px-3 py-2 font-mono font-bold text-[#064e3b]">{sc.admission_number}</td>
                    <td className="px-3 py-2 font-semibold text-[#141d24]">{sc.student_name}</td>
                    <td className="px-3 py-2 text-center font-mono font-bold text-[#141d24]">{sc.total_score}</td>
                    <td className="px-3 py-2 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#ecfdf5] font-bold text-[#064e3b] border border-[#a7f3d0]">
                        {sc.grade}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#52606d] font-medium">{sc.remark}</td>
                    <td className="px-3 py-2 text-[#52606d]">
                      {sc.teacher_comment ? (
                        <span className="italic text-[#141d24]">"{sc.teacher_comment}"</span>
                      ) : (
                        <span className="text-[#8c9ba5]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141d24] mb-1">
              Feedback / Moderation Notes for Teacher
            </label>
            <textarea
              rows={2}
              placeholder="Add moderation comments, corrections required, or feedback for the teacher..."
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#fbfbfa] border border-[#cbd2d9] rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b] placeholder:text-[#8c9ba5]"
            />
          </div>

          <div className="pt-3 border-t border-[#e5e3dc] flex items-center justify-between">
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={XCircle}
              isLoading={reviewMutation.isPending}
              onClick={() => {
                if (selectedSub) {
                  reviewMutation.mutate({ id: selectedSub.id, decision: 'REJECT', feedback: feedbackNotes });
                }
              }}
            >
              Return for Corrections
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedSub(null)}>
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={CheckCheck}
                isLoading={reviewMutation.isPending}
                onClick={() => {
                  if (selectedSub) {
                    reviewMutation.mutate({ id: selectedSub.id, decision: 'APPROVE', feedback: feedbackNotes });
                  }
                }}
              >
                Approve Submission
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Publish Class Results Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Publish Class Term Results"
        subtitle="This action computes overall averages, positions, and generates official report cards"
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
              <option value="">Select Class to Publish</option>
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[#52606d] bg-[#fbfbfa] p-3 rounded-md border border-[#e5e3dc] space-y-1">
            <p className="font-semibold text-[#141d24]">What happens upon publication?</p>
            <p>
              Marks all approved subject score sheets as official, recalculates class averages, positions, and unlocks report cards for download.
            </p>
          </div>

          <div className="pt-3 border-t border-[#e5e3dc] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={publishMutation.isPending}>
              Compute & Publish Results
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

