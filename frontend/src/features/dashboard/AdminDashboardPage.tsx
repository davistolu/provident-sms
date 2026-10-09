import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, CheckSquare, DollarSign, Award,
  ArrowRight, ShieldCheck, UserPlus, CreditCard, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts';
import { api } from '@/services/api';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const AdminDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => api.get<any>('/dashboard/admin/'),
  });

  const overview = data?.overview;
  const currentCtx = data?.current_academic_context;
  const sectionData = data?.section_distribution || [];
  const recentLogs = data?.recent_activity || [];
  const curr = overview?.currency_symbol || '₦';

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Institutional Administration</h1>
            <Badge variant="indigo">Live Session</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active Context: <b className="text-slate-700">{currentCtx?.session_name}</b> &bull; <b className="text-slate-700">{currentCtx?.term_name}</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/students">
            <Button variant="outline" size="sm" icon={UserPlus}>
              New Student
            </Button>
          </Link>
          <Link to="/admin/results/review">
            <Button variant="primary" size="sm" icon={Award}>
              Review Submissions ({overview?.pending_reviews ?? 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrolled Students"
          value={isLoading ? '...' : overview?.total_students ?? 0}
          subtitle="Across all classes"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Active Teachers"
          value={isLoading ? '...' : overview?.active_teachers ?? 0}
          subtitle={`${overview?.total_classes ?? 0} Class Arms`}
          icon={GraduationCap}
          variant="indigo"
        />
        <StatCard
          title="Today's Attendance"
          value={isLoading ? '...' : `${overview?.attendance_rate ?? 0}%`}
          subtitle="Attendance Rate"
          icon={CheckSquare}
          variant="success"
        />
        <StatCard
          title="Outstanding Fees"
          value={isLoading ? '...' : `${curr}${(overview?.outstanding_balance ?? 0).toLocaleString()}`}
          subtitle={`Collected: ${curr}${(overview?.total_collected ?? 0).toLocaleString()}`}
          icon={DollarSign}
          variant="warning"
        />
      </div>

      {/* Center Grid: Section Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Enrollment Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enrollment by Educational Section</h3>
              <p className="text-xs text-slate-500">Distribution across Nursery, Primary, JSS, and SSS</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                  {sectionData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Administrative Shortcuts</h3>
            <p className="text-xs text-slate-500 mb-4">Fast-path operational workflows</p>
            <div className="space-y-2.5">
              <Link
                to="/admin/attendance"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Review Daily Attendance</p>
                    <p className="text-[10px] text-slate-400">Audit class registers</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/admin/results/report-cards"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Generate Report Cards</p>
                    <p className="text-[10px] text-slate-400">Download printable PDFs</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/admin/finance/invoices"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Student Fee Invoices</p>
                    <p className="text-[10px] text-slate-400">Billing & receipts</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Multi-School Isolation
            </span>
            <span className="font-semibold text-indigo-600">Active</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Trail */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Institutional Activity</h3>
            <p className="text-xs text-slate-500">Security audit log records</p>
          </div>
          <Link to="/admin/audit-logs">
            <Button variant="ghost" size="sm">
              View Full Audit Trail
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recent audit logs available.</p>
          ) : (
            recentLogs.map((log: any) => (
              <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Badge variant="indigo" size="sm">
                    {log.action}
                  </Badge>
                  <div>
                    <p className="font-bold text-slate-800">
                      {log.entity_type} <span className="text-slate-400 font-normal">#{log.entity_id}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      By {log.actor__first_name ? `${log.actor__first_name} ${log.actor__last_name}` : 'System'}
                    </p>
                  </div>
                </div>
                <span className="text-slate-400 text-[11px]">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
