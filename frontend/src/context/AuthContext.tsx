import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SchoolMembership } from '@/types';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  activeMembership: SchoolMembership | null;
  memberships: SchoolMembership[];
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchSchool: (schoolId: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeMembership, setActiveMembership] = useState<SchoolMembership | null>(null);
  const [memberships, setMemberships] = useState<SchoolMembership[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      if (!localStorage.getItem('auth_token')) {
        setIsLoading(false);
        return;
      }
      const data = await api.get<{
        user: User;
        memberships: SchoolMembership[];
        active_membership: SchoolMembership | null;
      }>('/auth/me/');

      setUser(data.user);
      setMemberships(data.memberships);

      const savedSchoolId = localStorage.getItem('active_school_id');
      const matched = data.memberships.find(m => m.school_id === savedSchoolId);
      const active = matched || data.active_membership || data.memberships[0] || null;

      setActiveMembership(active);
      if (active) {
        localStorage.setItem('active_school_id', active.school_id);
      }
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('active_school_id');
      setUser(null);
      setActiveMembership(null);
      setMemberships([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<{
        status: string;
        token: string;
        user: User;
        memberships: SchoolMembership[];
        active_membership: SchoolMembership | null;
      }>('/auth/login/', { email, password });

      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setMemberships(res.memberships);

      const active = res.active_membership || res.memberships[0] || null;
      setActiveMembership(active);
      if (active) {
        localStorage.setItem('active_school_id', active.school_id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('active_school_id');
      setToken(null);
      setUser(null);
      setActiveMembership(null);
      setMemberships([]);
    }
  };

  const switchSchool = (schoolId: string) => {
    const selected = memberships.find(m => m.school_id === schoolId);
    if (selected) {
      setActiveMembership(selected);
      localStorage.setItem('active_school_id', selected.school_id);
      window.location.reload();
    }
  };

  const isAdmin = activeMembership?.role === 'ADMIN' || activeMembership?.role === 'SUPER_ADMIN' || activeMembership?.role === 'PRINCIPAL' || (user?.is_staff ?? false);
  const isTeacher = activeMembership?.role === 'TEACHER';

  return (
    <AuthContext.Provider
      value={{
        user,
        activeMembership,
        memberships,
        token,
        isLoading,
        isAdmin,
        isTeacher,
        login,
        logout,
        switchSchool,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
