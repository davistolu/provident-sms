import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';

export const UserProfilePage: React.FC = () => {
  const { user, activeMembership, refreshProfile } = useAuth();

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.patch('/auth/me/', data),
    onSuccess: async () => {
      await refreshProfile();
      setProfileSuccess('Profile details updated successfully.');
      setProfileError(null);
      setTimeout(() => setProfileSuccess(null), 4000);
    },
    onError: (err: any) => {
      setProfileError(err.message || 'Failed to update profile.');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/change-password/', data),
    onSuccess: () => {
      setPasswordSuccess('Password changed successfully.');
      setPasswordError(null);
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPasswordSuccess(null), 4000);
    },
    onError: (err: any) => {
      setPasswordError(err.message || 'Failed to change password.');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }
    changePasswordMutation.mutate({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">User Account & Profile Settings</h1>
        <p className="text-xs text-slate-500">Manage your personal credentials, contact information, and security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md mb-3">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <h3 className="text-base font-bold text-slate-900">{user?.full_name}</h3>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <div className="mt-3">
            <Badge variant="indigo">{activeMembership?.role || 'User'}</Badge>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 w-full text-left text-xs text-slate-500 space-y-2">
            <p>Institution: <b className="text-slate-800">{activeMembership?.school_name}</b></p>
            <p>Role Status: <b className="text-emerald-600">Active</b></p>
          </div>
        </div>

        {/* Profile & Password Tabs */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Personal Details</h3>
            <p className="text-xs text-slate-500 mb-4">Update your profile name and contact number</p>

            {profileSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                />
                <Input
                  label="Last Name"
                  required
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                />
              </div>

              <Input
                label="Phone Number"
                placeholder="e.g. +234 803 000 0000"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" isLoading={updateProfileMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Security & Password</h3>
            <p className="text-xs text-slate-500 mb-4">Ensure your account uses a strong, secure password</p>

            {passwordSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                required
                value={passwordForm.old_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="New Password"
                  type="password"
                  required
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="secondary" size="sm" isLoading={changePasswordMutation.isPending}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
