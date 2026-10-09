import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, School as SchoolIcon,
  BookOpen, Calendar, CheckSquare, Award, FileText,
  CreditCard, DollarSign, ShieldAlert, BookMarked,
  Layers, CheckCheck, FileBarChart, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, activeMembership, isAdmin, isTeacher, logout } = useAuth();

  const adminNav = [
    { title: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Student Registry', to: '/admin/students', icon: Users },
    { title: 'Teachers & Staff', to: '/admin/teachers', icon: GraduationCap },
    { title: 'Classes & Arms', to: '/admin/classes', icon: Layers },
    { title: 'Subjects', to: '/admin/subjects', icon: BookOpen },
    { title: 'Sessions & Terms', to: '/admin/academic-sessions', icon: Calendar },
    { title: 'Daily Attendance', to: '/admin/attendance', icon: CheckSquare },
    { title: 'Assessment Schemes', to: '/admin/assessments', icon: Award },
    { title: 'Result Reviews', to: '/admin/results/review', icon: CheckCheck },
    { title: 'Report Cards', to: '/admin/results/report-cards', icon: FileText },
    { title: 'Fees & Invoicing', to: '/admin/finance/invoices', icon: CreditCard },
    { title: 'Fee Structures', to: '/admin/finance/fee-structures', icon: BookMarked },
    { title: 'School Expenses', to: '/admin/finance/expenses', icon: DollarSign },
    { title: 'Audit Trail', to: '/admin/audit-logs', icon: ShieldAlert },
  ];

  const teacherNav = [
    { title: 'Teacher Dashboard', to: '/teacher/dashboard', icon: LayoutDashboard },
    { title: 'My Classes & Students', to: '/teacher/classes', icon: Users },
    { title: 'Mark Attendance', to: '/teacher/attendance', icon: CheckSquare },
    { title: 'Score Entry Grid', to: '/teacher/assessments/scores', icon: Award },
    { title: 'My Submissions', to: '/teacher/submissions', icon: CheckCheck },
    { title: 'Report Cards', to: '/teacher/report-cards', icon: FileText },
  ];

  const navItems = isAdmin ? adminNav : teacherNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-base shadow-inner">
            P
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">PROVI SMS</h2>
            <p className="text-[11px] text-indigo-400 font-medium tracking-wide truncate">
              {activeMembership?.school_name || 'School Management'}
            </p>
          </div>
        </div>

        {/* Role Banner */}
        <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Logged in as:</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
            {activeMembership?.role || 'User'}
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-40" />
              </NavLink>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Logout"
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
