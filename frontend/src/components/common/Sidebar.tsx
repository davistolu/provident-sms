import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, School,
  BookOpen, Calendar, CheckSquare, Award, FileText,
  CreditCard, DollarSign, ShieldAlert, BookMarked,
  Layers, CheckCheck, UserCheck, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface NavSection {
  title: string;
  items: {
    title: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, activeMembership, isAdmin, isTeacher, logout } = useAuth();

  const adminSections: NavSection[] = [
    {
      title: 'Academic Management',
      items: [
        { title: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Students', to: '/admin/students', icon: Users },
        { title: 'Teachers & Staff', to: '/admin/teachers', icon: GraduationCap },
        { title: 'Classes & Arms', to: '/admin/classes', icon: Layers },
        { title: 'Subjects', to: '/admin/subjects', icon: BookOpen },
        { title: 'Sessions & Terms', to: '/admin/academic-sessions', icon: Calendar },
      ],
    },
    {
      title: 'Assessment & Records',
      items: [
        { title: 'Attendance', to: '/admin/attendance', icon: CheckSquare },
        { title: 'Assessment Schemes', to: '/admin/assessments', icon: Award },
        { title: 'Result Moderation', to: '/admin/results/review', icon: CheckCheck },
        { title: 'Report Cards', to: '/admin/results/report-cards', icon: FileText },
      ],
    },
    {
      title: 'Finance & Billing',
      items: [
        { title: 'Fee Invoices', to: '/admin/finance/invoices', icon: CreditCard },
        { title: 'Fee Tariffs', to: '/admin/finance/fee-structures', icon: BookMarked },
        { title: 'Expenses Ledger', to: '/admin/finance/expenses', icon: DollarSign },
      ],
    },
    {
      title: 'Administration',
      items: [
        { title: 'User Accounts', to: '/admin/users', icon: UserCheck },
        { title: 'School Settings', to: '/admin/settings', icon: Settings },
        { title: 'Audit Trail', to: '/admin/audit-logs', icon: ShieldAlert },
      ],
    },
  ];

  const teacherSections: NavSection[] = [
    {
      title: 'Teaching Workspace',
      items: [
        { title: 'Overview', to: '/teacher/dashboard', icon: LayoutDashboard },
        { title: 'My Classes & Students', to: '/teacher/classes', icon: Users },
        { title: 'Mark Attendance', to: '/teacher/attendance', icon: CheckSquare },
      ],
    },
    {
      title: 'Examinations',
      items: [
        { title: 'Score Entry', to: '/teacher/assessments/scores', icon: Award },
        { title: 'Result Submissions', to: '/teacher/submissions', icon: CheckCheck },
        { title: 'Report Cards', to: '/teacher/report-cards', icon: FileText },
      ],
    },
  ];

  const navSections = isAdmin ? adminSections : teacherSections;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#141d24]/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#ffffff] text-[#141d24] flex flex-col transition-transform duration-200 ease-in-out border-r border-[#e8e6df] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[#e8e6df]">
          <div className="w-8 h-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-bold text-sm shadow-xs font-display">
            P
          </div>
          <div className="overflow-hidden">
            <h2 className="text-xs font-bold text-[#141d24] tracking-wide truncate uppercase font-display">
              {activeMembership?.school_name || 'Providence SMS'}
            </h2>
            <p className="text-[10px] text-[#064e3b] font-semibold">
              School Management
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-[#8896a4] uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-0.5 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#064e3b]/10 text-[#064e3b] font-semibold'
                            : 'text-[#52606d] hover:text-[#141d24] hover:bg-[#f4f3ef]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-[#064e3b]' : 'text-[#8896a4] group-hover:text-[#141d24]'
                            }`}
                          />
                          <span className="truncate">{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Identity */}
        <div className="p-3 border-t border-[#e8e6df] bg-[#faf9f5]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#e8e6df]">
            <NavLink to="/settings/profile" className="overflow-hidden block flex-1 hover:opacity-80">
              <p className="text-xs font-bold text-[#141d24] truncate">{user?.full_name}</p>
              <p className="text-[10px] text-[#8896a4] font-mono truncate">{user?.email}</p>
            </NavLink>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-md hover:bg-[#f4f3ef] text-[#8896a4] hover:text-[#991b1b] transition-colors shrink-0 ml-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
