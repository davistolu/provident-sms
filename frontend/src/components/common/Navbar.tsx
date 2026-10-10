import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, User, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, activeMembership, memberships, switchSchool, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  // Determine section name from pathname
  const getSectionTitle = (path: string) => {
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/students')) return 'Students';
    if (path.includes('/teachers')) return 'Teachers & Staff';
    if (path.includes('/classes')) return 'Classes & Arms';
    if (path.includes('/subjects')) return 'Curriculum & Subjects';
    if (path.includes('/academic-sessions')) return 'Academic Sessions';
    if (path.includes('/attendance')) return 'Daily Attendance';
    if (path.includes('/assessments')) return 'Assessment Schemes';
    if (path.includes('/results/review') || path.includes('/submissions')) return 'Result Moderation';
    if (path.includes('/report-cards')) return 'Report Cards';
    if (path.includes('/finance/invoices')) return 'Fee Invoices';
    if (path.includes('/finance/fee-structures')) return 'Fee Schedules';
    if (path.includes('/finance/expenses')) return 'School Expenses';
    if (path.includes('/settings/profile')) return 'My Profile';
    if (path.includes('/settings')) return 'School Settings';
    if (path.includes('/audit-logs')) return 'Audit Trail';
    if (path.includes('/users')) return 'User Accounts';
    return 'School Management';
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Administrator';
      case 'PRINCIPAL': return 'Principal';
      case 'TEACHER': return 'Teacher';
      case 'BURSAR': return 'Bursar';
      default: return role || 'Staff';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#e8e6df] sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-[#52606d] hover:text-[#141d24] hover:bg-[#f4f3ef] lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-semibold text-[#141d24]">
            {getSectionTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Active Academic Term Context */}
        <div className="hidden md:block text-right">
          <p className="text-xs font-medium text-[#141d24]">2024/2025 Session</p>
          <p className="text-[11px] text-[#8896a4]">First Term</p>
        </div>

        <div className="h-6 w-[1px] bg-[#e8e6df] hidden md:block" />

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#f4f3ef] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#064e3b] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#141d24] leading-tight max-w-[130px] truncate">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-[#8896a4] leading-tight font-medium">
                {getRoleLabel(activeMembership?.role)}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8896a4]" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-[#e8e6df] shadow-lg py-1 z-50 divide-y divide-[#f0eee6]">
                <div className="px-4 py-2.5">
                  <p className="text-xs font-bold text-[#141d24] truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-[#8896a4] truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold bg-[#064e3b]/10 text-[#064e3b] rounded">
                    {getRoleLabel(activeMembership?.role)}
                  </span>
                </div>

                {memberships.length > 1 && (
                  <div className="px-3 py-2">
                    <p className="text-[10px] font-bold text-[#8896a4] uppercase mb-1">Switch School</p>
                    <select
                      value={activeMembership?.school_id}
                      onChange={(e) => {
                        switchSchool(e.target.value);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-xs bg-[#f4f3ef] border border-[#e8e6df] rounded-md p-1.5 font-medium text-[#141d24]"
                    >
                      {memberships.map((m) => (
                        <option key={m.id} value={m.school_id}>
                          {m.school_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="py-1">
                  <Link
                    to="/settings/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-[#52606d] hover:text-[#141d24] hover:bg-[#faf9f5]"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile & Settings</span>
                  </Link>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#991b1b] hover:bg-[#fef2f2] text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
