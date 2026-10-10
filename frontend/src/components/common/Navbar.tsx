import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, User, Shield, School, Plus, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CreateSchoolModal } from '@/components/common/CreateSchoolModal';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, activeMembership, memberships, switchSchool, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(false);
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
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
    <>
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
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Active School Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setSchoolMenuOpen(!schoolMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fbfbfa] border border-[#e8e6df] hover:border-[#064e3b] hover:bg-white transition-all text-left cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-[#064e3b] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {activeMembership?.school_name?.[0] || 'S'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-[#141d24] max-w-[140px] truncate leading-tight">
                  {activeMembership?.school_name || 'Active School'}
                </p>
                <p className="text-[10px] text-[#52606d] font-mono leading-tight">
                  {activeMembership?.school_code || 'Code'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8896a4] shrink-0" />
            </button>

            {schoolMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSchoolMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#e8e6df] shadow-xl py-2 z-50 divide-y divide-[#f0eee6]">
                  <div className="px-3 pb-2">
                    <p className="text-[10px] font-bold text-[#8896a4] uppercase tracking-wider">
                      Your School Accounts ({memberships.length})
                    </p>
                  </div>

                  <div className="py-1 max-h-60 overflow-y-auto divide-y divide-[#f9f8f6]">
                    {memberships.map((m) => {
                      const isActive = m.school_id === activeMembership?.school_id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSchoolMenuOpen(false);
                            if (!isActive) switchSchool(m.school_id);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors cursor-pointer ${
                            isActive ? 'bg-[#ecfdf5]' : 'hover:bg-[#faf9f5]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                isActive ? 'bg-[#064e3b] text-white' : 'bg-[#f4f3ef] text-[#52606d]'
                              }`}
                            >
                              {m.school_name?.[0] || 'S'}
                            </div>
                            <div className="overflow-hidden">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  isActive ? 'text-[#064e3b]' : 'text-[#141d24]'
                                }`}
                              >
                                {m.school_name}
                              </p>
                              <p className="text-[10px] text-[#8896a4] font-mono">
                                {m.school_code} &bull; {getRoleLabel(m.role)}
                              </p>
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-[#064e3b] shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 px-3">
                    <button
                      onClick={() => {
                        setSchoolMenuOpen(false);
                        setIsCreateSchoolOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#f4f3ef] hover:bg-[#064e3b]/10 text-[#064e3b] text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add / Provision Another School</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-[1px] bg-[#e8e6df] hidden sm:block" />

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

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setIsCreateSchoolOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#064e3b] hover:bg-[#ecfdf5] text-left cursor-pointer font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New School</span>
                    </button>
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

      {/* In-app School Creation Modal */}
      <CreateSchoolModal
        isOpen={isCreateSchoolOpen}
        onClose={() => setIsCreateSchoolOpen(false)}
      />
    </>
  );
};

