import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckSquare, Save, Send, Users, Calendar, CheckCheck, Clock, XCircle, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { ClassArm, AttendanceSession, AttendanceRecord, PaginatedResponse } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const AttendanceRegisterPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionData, setSessionData] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Fetch Class Arms
  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  // Set default class if available
  useEffect(() => {
    if (classesData?.results?.length && !selectedClass) {
      setSelectedClass(classesData.results[0].id);
    }
  }, [classesData]);

  // Fetch or initialize register for selected class & date
  const loadRosterMutation = useMutation({
    mutationFn: (payload: { class_arm_id: string; date: string }) =>
      api.post<AttendanceSession>('/attendance/sessions/mark-roster/', payload),
    onSuccess: (data) => {
      setSessionData(data);
      setRecords(data.records || []);
      setSavedSuccess(null);
    },
  });

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadRosterMutation.mutate({ class_arm_id: selectedClass, date: selectedDate });
    }
  }, [selectedClass, selectedDate]);

  // Save register mutation
  const saveRegisterMutation = useMutation({
    mutationFn: (payload: { session_id: string; records: any[]; status: string }) =>
      api.post<any>('/attendance/sessions/save-register/', payload),
    onSuccess: (res) => {
      setSessionData(res.session);
      setSavedSuccess('Attendance register saved successfully!');
      setTimeout(() => setSavedSuccess(null), 3500);
    },
  });

  const handleStatusChange = (studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setRecords((prev) =>
      prev.map((r) => (r.student === studentId ? { ...r, status: newStatus } : r))
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.student === studentId ? { ...r, remarks } : r))
    );
  };

  const markAll = (statusVal: 'PRESENT' | 'ABSENT') => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: statusVal })));
  };

  const handleSave = (statusVal: 'DRAFT' | 'SUBMITTED') => {
    if (!sessionData) return;
    saveRegisterMutation.mutate({
      session_id: sessionData.id,
      records: records.map((r) => ({
        student_id: r.student,
        status: r.status,
        remarks: r.remarks || '',
      })),
      status: statusVal,
    });
  };

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Attendance Register</h1>
          <p className="text-xs text-slate-500">Record daily class attendance, track absences, and submit verified registers</p>
        </div>
        {sessionData && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Save}
              isLoading={saveRegisterMutation.isPending}
              onClick={() => handleSave('DRAFT')}
            >
              Save Draft
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={Send}
              isLoading={saveRegisterMutation.isPending}
              onClick={() => handleSave('SUBMITTED')}
            >
              Submit Register
            </Button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          {savedSuccess}
        </div>
      )}

      {/* Filter & Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Class Arm</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-600"
            >
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Quick Batch Actions & Summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
              {presentCount} Present
            </span>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
              {absentCount} Absent
            </span>
            {lateCount > 0 && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                {lateCount} Late
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <Button variant="outline" size="sm" onClick={() => markAll('PRESENT')}>
              Mark All Present
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAll('ABSENT')}>
              Mark All Absent
            </Button>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadRosterMutation.isPending ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading student attendance register...</div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No students enrolled in this class arm for the active session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Student Full Name</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {records.map((r, idx) => (
                  <tr key={r.student} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{r.admission_number}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.student_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((st) => {
                          const isActive = r.status === st;
                          const styles = {
                            PRESENT: isActive ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
                            ABSENT: isActive ? 'bg-rose-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700',
                            LATE: isActive ? 'bg-amber-500 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700',
                            EXCUSED: isActive ? 'bg-sky-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700',
                          };
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(r.student, st)}
                              className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${styles[st]}`}
                            >
                              {st === 'PRESENT' ? 'P' : st === 'ABSENT' ? 'A' : st === 'LATE' ? 'L' : 'E'}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. excused with note)..."
                        value={r.remarks || ''}
                        onChange={(e) => handleRemarksChange(r.student, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
