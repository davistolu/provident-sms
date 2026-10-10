import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Save, CheckCircle2, ShieldCheck, Sliders, Globe, Building2, Hash, Sparkles } from 'lucide-react';
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
    setSaveSuccess('Institutional configuration and numbering sequences updated successfully!');
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const isSaving = updateSchoolMutation.isPending || updateSettingsMutation.isPending;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e3dc]">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#141d24]">
            Institutional & School Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Configure school identity, crest branding, automated numbering sequences, and grading protocols
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#064e3b] text-xs font-semibold rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          {saveSuccess}
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* School Branding & Profile */}
        <div className="bg-[#ffffff] p-6 rounded-lg border border-[#e5e3dc] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex items-center gap-3 border-b border-[#e5e3dc] pb-4">
            <div className="w-9 h-9 rounded-md bg-[#f4f3ef] border border-[#e5e3dc] flex items-center justify-center text-[#064e3b]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#141d24]">Institutional Identity & Dossier</h3>
              <p className="text-xs text-[#52606d]">Official legal name, motto, and contact coordinates for documents</p>
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
              placeholder="e.g. Excellence in Knowledge and Character"
              value={schoolForm.motto}
              onChange={(e) => setSchoolForm({ ...schoolForm, motto: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Official Contact Email"
              type="email"
              value={schoolForm.email}
              onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
            />
            <Input
              label="Official Contact Phone"
              value={schoolForm.phone}
              onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Physical Campus Address"
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
        <div className="bg-[#ffffff] p-6 rounded-lg border border-[#e5e3dc] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex items-center gap-3 border-b border-[#e5e3dc] pb-4">
            <div className="w-9 h-9 rounded-md bg-[#f4f3ef] border border-[#e5e3dc] flex items-center justify-center text-[#b45309]">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#141d24]">Numbering Sequences & Academic Evaluation</h3>
              <p className="text-xs text-[#52606d]">Prefix definitions for automated identifiers and student positioning rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Admission No. Prefix"
              placeholder="e.g. SMS or PPIA"
              value={settingsForm.admission_number_prefix}
              onChange={(e) => setSettingsForm({ ...settingsForm, admission_number_prefix: e.target.value })}
              helperText="Auto-generates as: PREFIX/YYYY/0001"
            />
            <Input
              label="Invoice Prefix"
              placeholder="e.g. INV"
              value={settingsForm.invoice_prefix}
              onChange={(e) => setSettingsForm({ ...settingsForm, invoice_prefix: e.target.value })}
              helperText="Auto-generates as: INV-YYYY-0001"
            />
            <Input
              label="Receipt Prefix"
              placeholder="e.g. REC"
              value={settingsForm.receipt_prefix}
              onChange={(e) => setSettingsForm({ ...settingsForm, receipt_prefix: e.target.value })}
              helperText="Auto-generates as: REC-YYYY-0001"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 rounded-md border border-[#e5e3dc] bg-[#fbfbfa] cursor-pointer hover:bg-[#f4f3ef] transition-colors">
              <input
                type="checkbox"
                id="enable_pos"
                checked={settingsForm.enable_positions}
                onChange={(e) => setSettingsForm({ ...settingsForm, enable_positions: e.target.checked })}
                className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b] border-[#cbd2d9]"
              />
              <div>
                <div className="text-xs font-semibold text-[#141d24]">Compute Class Rankings & Student Positions</div>
                <div className="text-[11px] text-[#52606d]">
                  Calculates 1st, 2nd, 3rd positions and displays ordinal ranks on official student report cards
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" size="md" icon={Save} isLoading={isSaving}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

