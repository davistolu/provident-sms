import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckSquare, Save, Send, Users, Calendar, CheckCheck, Clock, XCircle, AlertCircle, Sparkles } from 'lucide-react';
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
  const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e3dc]">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#141d24]">
            Daily Attendance Register
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Record class attendance, manage student roll calls, and submit verified registers
          </p>
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
              variant="primary"
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
        <div className="p-3 bg-[#ecfdf5] border border-[#a7f3d0] text-[#064e3b] text-xs font-semibold rounded-md flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-[#059669]" />
          {savedSuccess}
        </div>
      )}

      {/* Filter & Selector Bar */}
      <div className="bg-[#ffffff] p-4 rounded-lg border border-[#e5e3dc] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#52606d] mb-1">
              Class Section / Arm
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
            >
              {classesData?.results?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#52606d] mb-1">
              Register Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs font-mono bg-[#fbfbfa] border border-[#cbd2d9] rounded-md text-[#141d24] focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b]"
            />
          </div>
        </div>

        {/* Quick Batch Actions & Summary */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 bg-[#ecfdf5] text-[#064e3b] rounded-md border border-[#a7f3d0] font-semibold">
              {presentCount} Present
            </span>
            <span className="px-2.5 py-1 bg-[#fff1f2] text-[#be123c] rounded-md border border-[#fecdd3] font-semibold">
              {absentCount} Absent
            </span>
            {lateCount > 0 && (
              <span className="px-2.5 py-1 bg-[#fffbeb] text-[#b45309] rounded-md border border-[#fde68a] font-semibold">
                {lateCount} Late
              </span>
            )}
            {excusedCount > 0 && (
              <span className="px-2.5 py-1 bg-[#f4f3ef] text-[#52606d] rounded-md border border-[#e5e3dc] font-semibold">
                {excusedCount} Excused
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 border-l border-[#e5e3dc] pl-4">
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
      <div className="bg-[#ffffff] rounded-lg border border-[#e5e3dc] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {loadRosterMutation.isPending ? (
          <div className="py-12 text-center text-xs text-[#52606d]">Loading student attendance register...</div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#8c9ba5]">
            No students enrolled in this class arm for the active session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f4f3ef] border-b border-[#e5e3dc] text-[10px] font-bold text-[#52606d] uppercase tracking-wider">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Student Full Name</th>
                  <th className="px-4 py-3 text-center w-64">Attendance Status</th>
                  <th className="px-4 py-3">Remarks & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e3dc] text-xs">
                {records.map((r, idx) => (
                  <tr key={r.student} className="hover:bg-[#fbfbfa] transition-colors">
                    <td className="px-4 py-3 font-mono text-[#8c9ba5]">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#064e3b]">{r.admission_number}</td>
                    <td className="px-4 py-3 font-semibold text-[#141d24]">{r.student_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((st) => {
                          const isActive = r.status === st;
                          const styles = {
                            PRESENT: isActive
                              ? 'bg-[#064e3b] text-white font-bold shadow-xs'
                              : 'bg-[#f4f3ef] text-[#52606d] hover:bg-[#ecfdf5] hover:text-[#064e3b]',
                            ABSENT: isActive
                              ? 'bg-[#be123c] text-white font-bold shadow-xs'
                              : 'bg-[#f4f3ef] text-[#52606d] hover:bg-[#fff1f2] hover:text-[#be123c]',
                            LATE: isActive
                              ? 'bg-[#b45309] text-white font-bold shadow-xs'
                              : 'bg-[#f4f3ef] text-[#52606d] hover:bg-[#fffbeb] hover:text-[#b45309]',
                            EXCUSED: isActive
                              ? 'bg-[#475569] text-white font-bold shadow-xs'
                              : 'bg-[#f4f3ef] text-[#52606d] hover:bg-[#e2e8f0] hover:text-[#1e293b]',
                          };
                          const labels = {
                            PRESENT: 'P • Present',
                            ABSENT: 'A • Absent',
                            LATE: 'L • Late',
                            EXCUSED: 'E • Excused',
                          };
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(r.student, st)}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${styles[st]}`}
                              title={labels[st]}
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
                        placeholder="Optional remarks (e.g. sick note submitted)..."
                        value={r.remarks || ''}
                        onChange={(e) => handleRemarksChange(r.student, e.target.value)}
                        className="w-full px-3 py-1 text-xs bg-[#fbfbfa] border border-[#cbd2d9] rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b] focus:border-[#064e3b] placeholder:text-[#8c9ba5]"
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

