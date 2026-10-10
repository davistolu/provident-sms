import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, CheckSquare, DollarSign, Award,
  ArrowRight, ShieldCheck, UserPlus, CreditCard, Layers,
  Calendar, Clock, Activity, FileCheck, AlertCircle, RefreshCw
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
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => api.get<any>('/dashboard/admin/'),
  });

  const overview = data?.overview;
  const currentCtx = data?.current_academic_context;
  const sectionData = data?.section_distribution || [];
  const recentLogs = data?.recent_activity || [];
  const curr = overview?.currency_symbol || '₦';

  const SECTION_COLORS = ['#064e3b', '#059669', '#d97706', '#334155'];

  return (
    <div className="space-y-6">
      {isError && (
        <div className="p-4 bg-[#fff1f2] border border-[#fecdd3] rounded-xl flex items-center justify-between text-xs text-[#be123c]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#e11d48] shrink-0" />
            <span>Failed to load institutional dashboard metrics: {(error as any)?.message || 'Server error'}</span>
          </div>
          <Button variant="secondary" size="xs" icon={RefreshCw} onClick={() => refetch()}>
            Retry Query
          </Button>
        </div>
      )}
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-[#141d24] tracking-tight">
              Institutional Executive Command
            </h1>
            <Badge variant="evergreen">Academic Session 2024/2025</Badge>
          </div>
          <p className="text-xs text-[#52606d] mt-1">
            Current Term: <b className="text-[#141d24]">{currentCtx?.session_name || '2024/2025'}</b> &bull;{' '}
            <b className="text-[#064e3b]">{currentCtx?.term_name || 'First Term'}</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/students">
            <Button variant="outline" size="sm" icon={UserPlus}>
              Enroll Student
            </Button>
          </Link>
          <Link to="/admin/results/review">
            <Button variant="primary" size="sm" icon={FileCheck}>
              Moderate Scores ({overview?.pending_reviews ?? 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Students"
          value={isLoading ? '...' : (overview?.total_students ?? 0).toLocaleString()}
          subtitle="Active student registry"
          icon={Users}
        />
        <StatCard
          title="Active Faculty"
          value={isLoading ? '...' : (overview?.active_teachers ?? 0).toLocaleString()}
          subtitle={`${overview?.total_classes ?? 0} Class streams`}
          icon={GraduationCap}
        />
        <StatCard
          title="Today's Attendance"
          value={isLoading ? '...' : `${overview?.attendance_rate ?? 0}%`}
          subtitle="Daily register marked"
          icon={CheckSquare}
          trend={{ value: 'Realtime', isPositive: true }}
        />
        <StatCard
          title="Outstanding Fees"
          value={isLoading ? '...' : `${curr}${(overview?.outstanding_balance ?? 0).toLocaleString()}`}
          subtitle={`Collected: ${curr}${(overview?.total_collected ?? 0).toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      {/* Center Grid: Section Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Enrollment Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-display text-[#141d24]">Enrollment by Section</h3>
              <p className="text-xs text-[#52606d]">Student distribution across Nursery, Primary, JSS, and SSS</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eee6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#52606d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#52606d' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#fbfbfa' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e6e4dc',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="students" radius={[4, 4, 0, 0]}>
                  {sectionData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={SECTION_COLORS[index % SECTION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Administrative Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-[#141d24] mb-1">Operational Shortcuts</h3>
            <p className="text-xs text-[#52606d] mb-4">Direct links to daily management tasks</p>
            <div className="space-y-2.5">
              <Link
                to="/admin/attendance"
                className="flex items-center justify-between p-3 rounded-xl border border-[#e6e4dc] hover:border-[#064e3b] hover:bg-[#fbfbfa] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#064e3b] border border-[#a7f3d0] flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141d24]">Daily Attendance</p>
                    <p className="text-[10px] text-[#8896a4]">Review class registers</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8896a4] group-hover:text-[#064e3b] transition-colors" />
              </Link>

              <Link
                to="/admin/results/report-cards"
                className="flex items-center justify-between p-3 rounded-xl border border-[#e6e4dc] hover:border-[#064e3b] hover:bg-[#fbfbfa] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#92400e] border border-[#fde68a] flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141d24]">Progress Report Cards</p>
                    <p className="text-[10px] text-[#8896a4]">Generate & download PDFs</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8896a4] group-hover:text-[#064e3b] transition-colors" />
              </Link>

              <Link
                to="/admin/finance/invoices"
                className="flex items-center justify-between p-3 rounded-xl border border-[#e6e4dc] hover:border-[#064e3b] hover:bg-[#fbfbfa] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f4f3ef] text-[#141d24] border border-[#e6e4dc] flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141d24]">Student Invoicing</p>
                    <p className="text-[10px] text-[#8896a4]">Fee billing & collections</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8896a4] group-hover:text-[#064e3b] transition-colors" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#e6e4dc] flex items-center justify-between text-xs text-[#52606d]">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#059669]" /> Enterprise Isolation
            </span>
            <span className="font-mono text-[11px] font-bold text-[#064e3b]">PROVI OS</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Trail */}
      <div className="bg-white p-6 rounded-2xl border border-[#e6e4dc] shadow-2xs">
        <div className="flex items-center justify-between mb-4 border-b border-[#f0eee6] pb-3">
          <div>
            <h3 className="text-sm font-bold font-display text-[#141d24]">Recent Institutional Activity</h3>
            <p className="text-xs text-[#52606d]">Realtime administrative security audit log</p>
          </div>
          <Link to="/admin/audit-logs">
            <Button variant="ghost" size="xs">
              View Complete Audit Trail
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-[#f0eee6]">
          {recentLogs.length === 0 ? (
            <p className="text-xs text-[#8896a4] py-6 text-center">No recent audit logs available.</p>
          ) : (
            recentLogs.map((log: any) => (
              <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Badge variant="neutral" size="sm">
                    {log.action}
                  </Badge>
                  <div>
                    <p className="font-bold text-[#141d24]">
                      {log.entity_type} <span className="text-[#8896a4] font-normal font-mono">#{log.entity_id}</span>
                    </p>
                    <p className="text-[11px] text-[#52606d]">
                      By {log.actor__first_name ? `${log.actor__first_name} ${log.actor__last_name}` : 'System'}
                    </p>
                  </div>
                </div>
                <span className="text-[#8896a4] font-mono text-[11px]">
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
