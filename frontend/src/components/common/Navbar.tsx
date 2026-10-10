import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, School, Bell, LogOut, ChevronDown, UserCog } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, activeMembership, memberships, switchSchool, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-School Context Switcher */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <School className="w-4 h-4" />
          </div>
          <div>
            {memberships.length > 1 ? (
              <select
                value={activeMembership?.school_id}
                onChange={(e) => switchSchool(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer pr-4"
              >
                {memberships.map((m) => (
                  <option key={m.id} value={m.school_id}>
                    {m.school_name} ({m.role})
                  </option>
                ))}
              </select>
            ) : (
              <h1 className="text-sm font-bold text-slate-800">
                {activeMembership?.school_name || 'Providence Premier Academy'}
              </h1>
            )}
            <p className="text-[11px] text-slate-400 font-medium">
              Academic Session 2024/2025 &bull; First Term
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <Link
          to="/settings/profile"
          className="flex items-center gap-2 pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.full_name}</p>
            <p className="text-[10px] font-semibold text-slate-400">{activeMembership?.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
};
