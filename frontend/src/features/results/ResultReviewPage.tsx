import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, XCircle, Eye, Globe, Award, CheckCircle2 } from 'lucide-react';
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
      cell: (row) => <span className="font-bold text-slate-900">{row.class_arm_name}</span>,
    },
    {
      header: 'Subject',
      accessorKey: 'subject_name',
      cell: (row) => <span className="font-semibold text-indigo-700">{row.subject_name}</span>,
    },
    {
      header: 'Session & Term',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.term_name} ({row.session_name})
        </span>
      ),
    },
    {
      header: 'Submitted By',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{row.submitted_by_name || 'Teacher'}</p>
          <p className="text-[10px] text-slate-400">{row.scores_count} Students graded</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => {
        const variant =
          row.status === 'PUBLISHED' || row.status === 'APPROVED'
            ? 'success'
            : row.status === 'SUBMITTED'
            ? 'indigo'
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
          <Button variant="outline" size="sm" icon={Eye} onClick={() => setSelectedSub(row)}>
            Review Marks
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assessment Result Reviews & Publication</h1>
          <p className="text-xs text-slate-500">
            Inspect teacher score submissions, approve grades, and publish official term results
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
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
        subtitle={`Submitted by ${selectedSub?.submitted_by_name} &bull; ${selectedSub?.scores?.length ?? 0} students`}
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="px-3 py-2">Admission No</th>
                  <th className="px-3 py-2">Student Name</th>
                  <th className="px-3 py-2 text-center">Total (100)</th>
                  <th className="px-3 py-2 text-center">Grade</th>
                  <th className="px-3 py-2">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedSub?.scores?.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 font-mono font-bold text-indigo-600">{sc.admission_number}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">{sc.student_name}</td>
                    <td className="px-3 py-2 text-center font-bold text-slate-800">{sc.total_score}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 font-bold text-indigo-700">
                        {sc.grade}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{sc.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feedback / Review Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add feedback for teacher or approval notes..."
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
                variant="success"
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
        subtitle="This action computes overall averages, positions, and publishes report cards"
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
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Select Class to Publish</option>
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            Publishing marks all approved subjects as official, recalculates weighted student averages, and produces updated rankings.
          </p>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
