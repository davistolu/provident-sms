import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Award, Save, Send, CheckCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { ClassArm, Subject, AssessmentSubmission, StudentScore, PaginatedResponse } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const ScoreEntrySpreadsheetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('class_arm') || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get('subject') || '');
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch Class Arms & Subjects
  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<PaginatedResponse<Subject>>('/academics/subjects/'),
  });

  useEffect(() => {
    if (classesData?.results?.length && !selectedClass) {
      setSelectedClass(classesData.results[0].id);
    }
    if (subjectsData?.results?.length && !selectedSubject) {
      setSelectedSubject(subjectsData.results[0].id);
    }
  }, [classesData, subjectsData]);

  // Open Score Sheet
  const openScoresheetMutation = useMutation({
    mutationFn: (payload: { class_arm_id: string; subject_id: string }) =>
      api.post<AssessmentSubmission>('/results/submissions/open-scoresheet/', payload),
    onSuccess: (data) => {
      setSubmission(data);
      setScores(data.scores || []);
      setSaveSuccess(null);
      setValidationError(null);
    },
  });

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      openScoresheetMutation.mutate({ class_arm_id: selectedClass, subject_id: selectedSubject });
    }
  }, [selectedClass, selectedSubject]);

  // Save Scores Mutation
  const saveScoresMutation = useMutation({
    mutationFn: (payload: { submission_id: string; scores: any[]; action: string }) =>
      api.post<any>(`/results/submissions/${payload.submission_id}/save-scores/`, payload),
    onSuccess: (res) => {
      setSubmission(res.submission);
      setScores(res.submission.scores || []);
      setSaveSuccess(
        res.submission.status === 'SUBMITTED'
          ? 'Scores submitted for administrative review!'
          : 'Scores saved successfully!'
      );
      setTimeout(() => setSaveSuccess(null), 4000);
    },
    onError: (err: any) => {
      setValidationError(err.message || 'Failed to save scores.');
    },
  });

  const handleScoreChange = (studentId: string, compCode: string, value: string) => {
    const numVal = parseFloat(value) || 0;
    setScores((prev) =>
      prev.map((s) => {
        if (s.student === studentId) {
          const updatedComp = { ...s.component_scores, [compCode]: numVal };
          const newTotal = Object.values(updatedComp).reduce((acc, v) => acc + (Number(v) || 0), 0);
          return {
            ...s,
            component_scores: updatedComp,
            total_score: Math.round(newTotal * 100) / 100,
          };
        }
        return s;
      })
    );
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setScores((prev) =>
      prev.map((s) => (s.student === studentId ? { ...s, teacher_comment: comment } : s))
    );
  };

  const handleSaveScores = (actionType: 'save_draft' | 'submit') => {
    if (!submission) return;
    setValidationError(null);
    saveScoresMutation.mutate({
      submission_id: submission.id,
      scores: scores.map((s) => ({
        student_id: s.student,
        component_scores: s.component_scores,
        teacher_comment: s.teacher_comment || '',
      })),
      action: actionType,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Score Entry & Continuous Assessment</h1>
          <p className="text-xs text-slate-500">
            Spreadsheet-style gradebook for CA tests and terminal examinations
          </p>
        </div>
        {submission && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Save}
              isLoading={saveScoresMutation.isPending}
              onClick={() => handleSaveScores('save_draft')}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              isLoading={saveScoresMutation.isPending}
              onClick={() => handleSaveScores('submit')}
            >
              Submit for Review
            </Button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          {saveSuccess}
        </div>
      )}

      {validationError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {validationError}
        </div>
      )}

      {/* Selector Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Class Arm</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              {subjectsData?.results?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {submission && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">Submission State:</span>
            <Badge
              variant={
                submission.status === 'APPROVED' || submission.status === 'PUBLISHED'
                  ? 'success'
                  : submission.status === 'SUBMITTED'
                  ? 'indigo'
                  : submission.status === 'REJECTED'
                  ? 'danger'
                  : 'neutral'
              }
            >
              {submission.status_display}
            </Badge>
          </div>
        )}
      </div>

      {/* Spreadsheet Score Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {openScoresheetMutation.isPending ? (
          <div className="py-12 text-center text-xs text-slate-500">Opening score sheet roster...</div>
        ) : scores.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No enrolled students found for this class and session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-3 py-3 w-24 text-center">CA 1 (15m)</th>
                  <th className="px-3 py-3 w-24 text-center">CA 2 (15m)</th>
                  <th className="px-3 py-3 w-24 text-center">Exam (70m)</th>
                  <th className="px-3 py-3 w-20 text-center font-black text-indigo-700">Total (100)</th>
                  <th className="px-3 py-3 w-16 text-center">Grade</th>
                  <th className="px-4 py-3">Teacher Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {scores.map((s, idx) => {
                  const ca1 = s.component_scores?.['CA1'] ?? '';
                  const ca2 = s.component_scores?.['CA2'] ?? '';
                  const exam = s.component_scores?.['EXAM'] ?? '';

                  return (
                    <tr key={s.student} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-indigo-600">{s.admission_number}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{s.student_name}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="15"
                          value={ca1}
                          onChange={(e) => handleScoreChange(s.student, 'CA1', e.target.value)}
                          className="w-full text-center px-2 py-1 bg-white border border-slate-300 rounded-md focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="15"
                          value={ca2}
                          onChange={(e) => handleScoreChange(s.student, 'CA2', e.target.value)}
                          className="w-full text-center px-2 py-1 bg-white border border-slate-300 rounded-md focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="70"
                          value={exam}
                          onChange={(e) => handleScoreChange(s.student, 'EXAM', e.target.value)}
                          className="w-full text-center px-2 py-1 bg-white border border-slate-300 rounded-md focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-sm text-indigo-600">
                        {s.total_score}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {s.grade || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={s.teacher_comment || ''}
                          onChange={(e) => handleCommentChange(s.student, e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
