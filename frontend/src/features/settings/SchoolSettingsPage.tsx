import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Save, CheckCircle2, ShieldCheck, Sliders, Globe } from 'lucide-react';
import { api } from '@/services/api';
import { School as SchoolType, SchoolSettings } from '@/types';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';

export const SchoolSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: schoolData, isLoading: isSchoolLoading } = useQuery({
    queryKey: ['current-school'],
    queryFn: () => api.get<SchoolType>('/schools/current/'),
  });

  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['current-settings'],
    queryFn: () => api.get<SchoolSettings>('/settings/current/'),
  });

  const [schoolForm, setSchoolForm] = useState({
    name: '',
    motto: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    currency: 'NGN',
    currency_symbol: '₦',
    timezone: 'Africa/Lagos',
  });

  const [settingsForm, setSettingsForm] = useState({
    admission_number_prefix: 'SMS',
    invoice_prefix: 'INV',
    receipt_prefix: 'REC',
    enable_positions: true,
  });

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (schoolData) {
      setSchoolForm({
        name: schoolData.name || '',
        motto: schoolData.motto || '',
        email: schoolData.email || '',
        phone: schoolData.phone || '',
        address: schoolData.address || '',
        city: schoolData.city || '',
        state: schoolData.state || '',
        currency: schoolData.currency || 'NGN',
        currency_symbol: schoolData.currency_symbol || '₦',
        timezone: schoolData.timezone || 'Africa/Lagos',
      });
    }
    if (settingsData) {
      setSettingsForm({
        admission_number_prefix: settingsData.admission_number_prefix || 'SMS',
        invoice_prefix: settingsData.invoice_prefix || 'INV',
        receipt_prefix: settingsData.receipt_prefix || 'REC',
        enable_positions: settingsData.enable_positions ?? true,
      });
    }
  }, [schoolData, settingsData]);

  const updateSchoolMutation = useMutation({
    mutationFn: (data: any) => api.patch('/schools/current/', data),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/current/', data),
  });

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    await Promise.all([
      updateSchoolMutation.mutateAsync(schoolForm),
      updateSettingsMutation.mutateAsync(settingsForm),
    ]);
    queryClient.invalidateQueries({ queryKey: ['current-school'] });
    queryClient.invalidateQueries({ queryKey: ['current-settings'] });
    setSaveSuccess('School information and institutional settings saved successfully!');
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const isSaving = updateSchoolMutation.isPending || updateSettingsMutation.isPending;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional & School Settings</h1>
          <p className="text-xs text-slate-500">Configure institution branding, contact details, numbering preferences, and grading rules</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveSuccess}
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* School Branding & Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Institution Identity & Profile</h3>
              <p className="text-xs text-slate-400">School name, motto, and branding displayed on reports and receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="School Official Name"
              required
              value={schoolForm.name}
              onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
            />
            <Input
              label="School Motto"
              placeholder="e.g. Excellence in Knowledge and Leadership"
              value={schoolForm.motto}
              onChange={(e) => setSchoolForm({ ...schoolForm, motto: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Official Email Address"
              type="email"
              value={schoolForm.email}
              onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
            />
            <Input
              label="Contact Phone Number"
              value={schoolForm.phone}
              onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Physical Address"
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
              />
            </div>
            <Input
              label="City & State"
              value={schoolForm.city}
              onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Currency Code"
              value={schoolForm.currency}
              onChange={(e) => setSchoolForm({ ...schoolForm, currency: e.target.value })}
            />
            <Input
              label="Currency Symbol"
              value={schoolForm.currency_symbol}
              onChange={(e) => setSchoolForm({ ...schoolForm, currency_symbol: e.target.value })}
            />
            <Input
              label="Timezone"
              value={schoolForm.timezone}
              onChange={(e) => setSchoolForm({ ...schoolForm, timezone: e.target.value })}
            />
          </div>
        </div>

        {/* Academic & Numbering Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Numbering Sequences & Academic Rules</h3>
              <p className="text-xs text-slate-400">Custom prefixes for automated ID generation and result ranking</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Admission No. Prefix"
              placeholder="e.g. SMS or PPIA"
              value={settingsForm.admission_number_prefix}
              onChange={(e) => setSettingsForm({ ...settingsForm, admission_number_prefix: e.target.value })}
              helperText="Generated as: PREFIX/YEAR/0001"
            />
            <Input
              label="Invoice Prefix"
              placeholder="e.g. INV"
              value={settingsForm.invoice_prefix}
              onChange={(e) => setSettingsForm({ ...settingsForm, invoice_prefix: e.target.value })}
              helperText="Generated as: INV-YEAR-0001"
            />
            <Input
              label="Receipt Prefix"
              placeholder="e.g. REC"
              value={settingsForm.receipt_prefix}
              onChange={(e) => setSettingsForm({ ...settingsForm, receipt_prefix: e.target.value })}
              helperText="Generated as: REC-YEAR-0001"
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_pos"
                checked={settingsForm.enable_positions}
                onChange={(e) => setSettingsForm({ ...settingsForm, enable_positions: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="enable_pos" className="text-xs font-semibold text-slate-800">
                Compute and display student ranking positions (1st, 2nd, 3rd) on official report cards
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" variant="primary" size="md" icon={Save} isLoading={isSaving}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
