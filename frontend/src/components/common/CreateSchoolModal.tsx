import React, { useState } from 'react';
import { School, Sparkles, Building2, CheckCircle, ArrowRight, Layers, Check } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { SchoolMembership, User } from '@/types';

interface CreateSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSchoolModal: React.FC<CreateSchoolModalProps> = ({ isOpen, onClose }) => {
  const { user, token, setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [schoolName, setSchoolName] = useState('');
  const [motto, setMotto] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₦');
  const [sessionName, setSessionName] = useState('2024/2025');

  const [stages, setStages] = useState<string[]>([
    'NURSERY',
    'PRIMARY',
    'JUNIOR_SECONDARY',
    'SENIOR_SECONDARY',
  ]);
  const [createStandardClasses, setCreateStandardClasses] = useState(true);
  const [createStandardSubjects, setCreateStandardSubjects] = useState(true);
  const [createStandardGrading, setCreateStandardGrading] = useState(true);

  const toggleStage = (stageKey: string) => {
    setStages((prev) =>
      prev.includes(stageKey) ? prev.filter((s) => s !== stageKey) : [...prev, stageKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      setError('Please provide a valid school name.');
      return;
    }
    if (stages.length === 0) {
      setError('Please select at least one educational stage for your school.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{
        status: string;
        message: string;
        school: any;
        memberships: SchoolMembership[];
        active_membership: SchoolMembership;
      }>('/schools/create-school/', {
        school_name: schoolName,
        motto,
        email,
        phone,
        address,
        city,
        state,
        currency_symbol: currencySymbol,
        session_name: sessionName,
        stages,
        create_standard_classes: createStandardClasses,
        create_standard_subjects: createStandardSubjects,
        create_standard_grading: createStandardGrading,
      });

      if (token && user) {
        setAuthData(token, user, res.memberships, res.active_membership);
        onClose();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add / Provision New School"
      subtitle="Establish a new school entity under your administrator account"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] text-xs font-semibold rounded-md">
            {error}
          </div>
        )}

        {/* Basic Details */}
        <div className="space-y-3">
          <Input
            label="School Name"
            required
            placeholder="e.g. St. Jude International College"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="School Motto"
              placeholder="e.g. Knowledge is Light"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
            />
            <Input
              label="Initial Academic Session"
              placeholder="e.g. 2024/2025"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="School Contact Email"
              type="email"
              placeholder="e.g. info@stjude.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="School Phone"
              placeholder="e.g. +234 800 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Campus Address"
              placeholder="e.g. 10 University Road"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              label="City"
              placeholder="e.g. Ikeja"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="State"
              placeholder="e.g. Lagos State"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
        </div>

        {/* Educational Stages */}
        <div className="pt-3 border-t border-[#e5e3dc] space-y-2">
          <label className="block text-xs font-bold text-[#141d24]">
            Educational Stages to Provision:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'NURSERY', label: 'Early Years / Nursery' },
              { key: 'PRIMARY', label: 'Primary (Basic 1-6)' },
              { key: 'JUNIOR_SECONDARY', label: 'Junior Sec (JSS 1-3)' },
              { key: 'SENIOR_SECONDARY', label: 'Senior Sec (SS 1-3)' },
            ].map((stg) => {
              const selected = stages.includes(stg.key);
              return (
                <button
                  key={stg.key}
                  type="button"
                  onClick={() => toggleStage(stg.key)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    selected
                      ? 'border-[#064e3b] bg-[#ecfdf5] text-[#064e3b] font-semibold'
                      : 'border-[#cbd2d9] bg-[#fbfbfa] text-[#52606d] hover:border-[#8c9ba5]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] leading-tight">{stg.label}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-[#064e3b] shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Automated Presets */}
        <div className="pt-3 border-t border-[#e5e3dc] space-y-2">
          <label className="block text-xs font-bold text-[#141d24]">
            Automated Academic Presets:
          </label>
          <div className="space-y-1.5 text-xs text-[#52606d]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createStandardClasses}
                onChange={(e) => setCreateStandardClasses(e.target.checked)}
                className="rounded border-[#cbd2d9] text-[#064e3b] focus:ring-[#064e3b]"
              />
              <span>Generate standard class levels & default arm 'A' for selected stages</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createStandardSubjects}
                onChange={(e) => setCreateStandardSubjects(e.target.checked)}
                className="rounded border-[#cbd2d9] text-[#064e3b] focus:ring-[#064e3b]"
              />
              <span>Pre-populate core curriculum subjects (Math, English, Sciences, Humanities)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createStandardGrading}
                onChange={(e) => setCreateStandardGrading(e.target.checked)}
                className="rounded border-[#cbd2d9] text-[#064e3b] focus:ring-[#064e3b]"
              />
              <span>Initialize WAEC/Universal standard grading scale and CA (30/70) scheme</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-[#e5e3dc] flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={loading}
            icon={ArrowRight}
            iconPosition="right"
          >
            Provision & Switch to School
          </Button>
        </div>
      </form>
    </Modal>
  );
};
