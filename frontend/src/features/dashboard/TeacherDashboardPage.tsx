import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, CheckSquare, Award, BookOpen, Clock,
  ArrowRight, CheckCircle2, AlertCircle, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { api } from '@/services/api';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const TeacherDashboardPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['teacher-dashboard-stats'],
    queryFn: () => api.get<any>('/dashboard/teacher/'),
  });

  const teacher = data?.teacher;
  const ctx = data?.academic_context;
  const classes = data?.assigned_classes || [];
  const subjects = data?.assigned_subjects || [];
  const subs = data?.submissions_summary;

  return (
    <div className="space-y-6">
      {isError && (
        <div className="p-4 bg-[#fff1f2] border border-[#fecdd3] rounded-xl flex items-center justify-between text-xs text-[#be123c]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#e11d48] shrink-0" />
            <span>Failed to load educator dashboard metrics: {(error as any)?.message || 'Server error'}</span>
          </div>
          <Button variant="secondary" size="xs" icon={RefreshCw} onClick={() => refetch()}>
            Retry Query
          </Button>
        </div>
      )}
      {/* Teacher Welcome Header */}
      <div className="bg-[#064e3b] text-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#043326]">
        <div>
          <Badge variant="gold" size="sm" className="mb-2">
            Educator Command Center
          </Badge>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">
            Welcome back, {teacher?.name || 'Faculty Member'}
          </h1>
          <p className="text-xs text-[#a7f3d0] mt-1 font-mono">
            Staff ID: <b className="text-white">{teacher?.staff_id}</b> &bull; {ctx?.session_name} ({ctx?.term_name})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/teacher/attendance">
            <Button variant="outline" size="sm" icon={CheckSquare} className="bg-white/10 text-white hover:bg-white/20 border-white/20">
              Mark Attendance
            </Button>
          </Link>
          <Link to="/teacher/assessments/scores">
            <Button variant="gold" size="sm" icon={FileSpreadsheet}>
              Enter Scores
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Classes"
          value={isLoading ? '...' : classes.length}
          subtitle="Teaching arms & streams"
          icon={Users}
        />
        <StatCard
          title="Curriculum Subjects"
          value={isLoading ? '...' : subjects.length}
          subtitle="Subject assignments"
          icon={BookOpen}
        />
        <StatCard
          title="Draft Scoresheets"
          value={isLoading ? '...' : subs?.drafts ?? 0}
          subtitle="Pending submission"
          icon={Clock}
        />
        <StatCard
          title="Approved Scores"
          value={isLoading ? '...' : subs?.approved ?? 0}
          subtitle="Moderated by principal"
          icon={CheckCircle2}
        />
      </div>

      {/* Grid: Assigned Classes & Assigned Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#f0eee6] pb-3">
            <div>
              <h3 className="text-sm font-bold font-display text-[#141d24]">My Teaching Streams</h3>
              <p className="text-xs text-[#52606d]">Classes assigned under your instruction</p>
            </div>
            <Link to="/teacher/attendance">
              <Button variant="ghost" size="xs">
                Attendance Ledger
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-[#f0eee6]">
            {classes.length === 0 ? (
              <p className="text-xs text-[#8896a4] py-8 text-center">No class arms assigned to your profile yet.</p>
            ) : (
              classes.map((c: any) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#f4f3ef] border border-[#e6e4dc] text-[#064e3b] font-bold text-xs rounded-xl flex items-center justify-center font-display">
                      {c.name.substring(0, 3)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#141d24]">{c.name}</p>
                      <p className="text-[11px] text-[#8896a4] font-mono">{c.student_count} Enrolled Students</p>
                    </div>
                  </div>
                  <Link to="/teacher/attendance">
                    <Button variant="outline" size="xs" icon={CheckSquare}>
                      Register
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subjects Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#f0eee6] pb-3">
            <div>
              <h3 className="text-sm font-bold font-display text-[#141d24]">Continuous Assessment & Exams</h3>
              <p className="text-xs text-[#52606d]">Subject score entry spreadsheets</p>
            </div>
            <Link to="/teacher/assessments/scores">
              <Button variant="ghost" size="xs">
                Open Score Grid
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-[#f0eee6]">
            {subjects.length === 0 ? (
              <p className="text-xs text-[#8896a4] py-8 text-center">No subject allocations found for this session.</p>
            ) : (
              subjects.map((s: any) => (
                <div key={s.assignment_id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#141d24]">{s.subject_name}</p>
                    <p className="text-[11px] text-[#064e3b] font-medium">{s.class_arm_name}</p>
                  </div>
                  <Link to={`/teacher/assessments/scores?class_arm=${s.class_arm_id}&subject=${s.subject_id}`}>
                    <Button variant="primary" size="xs" icon={Award}>
                      Enter Scores
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
