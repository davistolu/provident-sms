import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, CheckSquare, Award, BookOpen, Clock,
  ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { api } from '@/services/api';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const TeacherDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
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
      {/* Teacher Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-white/10 text-indigo-200 text-xs font-semibold rounded-full">
            Teacher Workspace
          </span>
          <h1 className="text-2xl font-bold mt-2">Welcome back, {teacher?.name || 'Educator'}</h1>
          <p className="text-xs text-indigo-200 mt-1">
            Staff ID: <b className="text-white">{teacher?.staff_id}</b> &bull; {ctx?.session_name} ({ctx?.term_name})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/teacher/attendance">
            <Button variant="success" size="sm" icon={CheckSquare}>
              Take Today's Attendance
            </Button>
          </Link>
          <Link to="/teacher/assessments/scores">
            <Button variant="secondary" size="sm" icon={Award}>
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
          subtitle="Active Arms"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Assigned Subjects"
          value={isLoading ? '...' : subjects.length}
          subtitle="Curriculum Load"
          icon={BookOpen}
          variant="indigo"
        />
        <StatCard
          title="Draft Score Sheets"
          value={isLoading ? '...' : subs?.drafts ?? 0}
          subtitle="Awaiting submission"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Approved Results"
          value={isLoading ? '...' : subs?.approved ?? 0}
          subtitle="Published to report cards"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Grid: Assigned Classes & Assigned Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">My Teaching Classes</h3>
              <p className="text-xs text-slate-500">Classes assigned under your curriculum</p>
            </div>
            <Link to="/teacher/attendance">
              <Button variant="ghost" size="sm">
                Attendance Register
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {classes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No class arms assigned yet.</p>
            ) : (
              classes.map((c: any) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs">
                      {c.name.substring(0, 3)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.student_count} Enrolled Students</p>
                    </div>
                  </div>
                  <Link to="/teacher/attendance">
                    <Button variant="outline" size="sm" icon={CheckSquare}>
                      Mark Register
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subjects Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Continuous Assessment & Exams</h3>
              <p className="text-xs text-slate-500">Assigned subjects for score entry</p>
            </div>
            <Link to="/teacher/assessments/scores">
              <Button variant="ghost" size="sm">
                Open Score Grid
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {subjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No subjects assigned yet.</p>
            ) : (
              subjects.map((s: any) => (
                <div key={s.assignment_id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{s.subject_name}</p>
                    <p className="text-[11px] text-indigo-600 font-semibold">{s.class_arm_name}</p>
                  </div>
                  <Link to={`/teacher/assessments/scores?class_arm=${s.class_arm_id}&subject=${s.subject_id}`}>
                    <Button variant="primary" size="sm" icon={Award}>
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
