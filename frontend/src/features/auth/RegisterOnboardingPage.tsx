import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  School, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Layers, BookOpen, Building2, User, Check
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { SchoolMembership, User as UserType } from '@/types';
import { toast } from '@/context/ToastContext';

export const RegisterOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  // Step 1: Admin User
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: School Identity
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [motto, setMotto] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [currencySymbol, setCurrencySymbol] = useState('₦');

  // Step 3: Academic Setup & Stages
  const [sessionName, setSessionName] = useState('2024/2025');
  const [stages, setStages] = useState<string[]>([
    'NURSERY',
    'PRIMARY',
    'JUNIOR_SECONDARY',
    'SENIOR_SECONDARY',
  ]);

  // Step 4: Academic Presets
  const [createStandardClasses, setCreateStandardClasses] = useState(true);
  const [createStandardSubjects, setCreateStandardSubjects] = useState(true);
  const [createStandardGrading, setCreateStandardGrading] = useState(true);

  const toggleStage = (stageKey: string) => {
    setStages((prev) =>
      prev.includes(stageKey) ? prev.filter((s) => s !== stageKey) : [...prev, stageKey]
    );
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
        const msg = 'Please fill in all required personal credentials.';
        setError(msg);
        toast.error(msg);
        return;
      }
      if (password.length < 6) {
        const msg = 'Password must be at least 6 characters long.';
        setError(msg);
        toast.error(msg);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!schoolName.trim()) {
        const msg = 'Please enter the official name of your institution.';
        setError(msg);
        toast.error(msg);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (stages.length === 0) {
        const msg = 'Please select at least one educational stage for your academy.';
        setError(msg);
        toast.error(msg);
        return;
      }
      setStep(4);
    }
  };

  const handleCompleteSetup = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{
        status: string;
        message: string;
        token: string;
        user: UserType;
        memberships: SchoolMembership[];
        active_membership: SchoolMembership;
      }>('/auth/register-onboard/', {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone,
        school_name: schoolName,
        school_code: schoolCode,
        motto,
        school_email: schoolEmail,
        school_phone: schoolPhone,
        address,
        city,
        state,
        country,
        currency_symbol: currencySymbol,
        session_name: sessionName,
        stages,
        create_standard_classes: createStandardClasses,
        create_standard_subjects: createStandardSubjects,
        create_standard_grading: createStandardGrading,
      });

      toast.success('Academy provisioned successfully! Welcome to your administrative workspace.');
      setAuthData(res.token, res.user, res.memberships, res.active_membership);
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your submission.';
      setError(msg);
      toast.error(err, 'Institution provisioning failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col justify-between">
      {/* Top Brand Header */}
      <header className="px-6 py-4 border-b border-[#e5e3dc] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-bold text-base font-serif shadow-xs">
            P
          </div>
          <div>
            <h1 className="text-sm font-bold font-serif tracking-tight text-[#141d24]">
              PROVIDENCE ACADEMY OS
            </h1>
            <p className="text-[10px] text-[#52606d] font-sans">
              Institutional Multi-School Setup & Onboarding Wizard
            </p>
          </div>
        </div>

        <div className="text-xs text-[#52606d]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#064e3b] hover:underline">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Wizard Form Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {[
              { num: 1, label: 'Admin Account' },
              { num: 2, label: 'School Identity' },
              { num: 3, label: 'Educational Stages' },
              { num: 4, label: 'Review & Launch' },
            ].map((st, i, arr) => (
              <React.Fragment key={st.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === st.num
                        ? 'bg-[#064e3b] text-white ring-4 ring-[#064e3b]/10'
                        : step > st.num
                        ? 'bg-[#ecfdf5] text-[#064e3b] border border-[#a7f3d0]'
                        : 'bg-[#f4f3ef] text-[#8c9ba5] border border-[#cbd2d9]'
                    }`}
                  >
                    {step > st.num ? <Check className="w-4 h-4" /> : st.num}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium ${
                      step === st.num ? 'text-[#064e3b] font-bold' : 'text-[#8c9ba5]'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 -mt-4 transition-colors ${
                      step > st.num ? 'bg-[#064e3b]' : 'bg-[#e5e3dc]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-[#e5e3dc] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] text-xs font-semibold rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e11d48]" />
              {error}
            </div>
          )}

          {/* Step 1: Admin Credentials */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#141d24]">
                  Administrator Credentials
                </h2>
                <p className="text-xs text-[#52606d] mt-0.5">
                  Set up your master administrator profile to govern your school accounts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="First Name"
                  required
                  placeholder="e.g. Eleanor"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  required
                  placeholder="e.g. Vance"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <Input
                label="Official Email Address"
                type="email"
                required
                placeholder="e.g. principal@providence.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Account Password (min 6 characters)"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  label="Direct Phone Number"
                  placeholder="e.g. +234 803 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" icon={ArrowRight} iconPosition="right">
                  Proceed to School Profile
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: School Identity */}
          {step === 2 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#141d24]">
                  School Profile & Identity
                </h2>
                <p className="text-xs text-[#52606d] mt-0.5">
                  Establish the branding, institutional motto, and contact details of your first academy.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Input
                  label="Full Institution Name"
                  required
                  placeholder="e.g. Providence Premier International Academy"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="School Motto"
                    placeholder="e.g. Excellence, Knowledge & Leadership"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                  />
                  <Input
                    label="Short Code / Acronym (Optional)"
                    placeholder="e.g. PPIA (auto-generated if empty)"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Official School Email"
                    type="email"
                    placeholder="e.g. info@providence.edu"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                  />
                  <Input
                    label="Official School Phone"
                    placeholder="e.g. +234 803 123 4567"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Campus Address"
                    placeholder="e.g. 12 Victoria Island Blvd"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <Input
                    label="City / Town"
                    placeholder="e.g. Lagos"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <Input
                    label="State / Province"
                    placeholder="e.g. Lagos State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button type="button" variant="outline" icon={ArrowLeft} onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" icon={ArrowRight} iconPosition="right">
                  Next: Educational Stages
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Educational Stages & Session */}
          {step === 3 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#141d24]">
                  Educational Stages & Academic Calendar
                </h2>
                <p className="text-xs text-[#52606d] mt-0.5">
                  Select which educational departments and academic session apply to your institution.
                </p>
              </div>

              <div className="pt-2">
                <Input
                  label="Current Academic Session"
                  placeholder="e.g. 2024/2025"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#141d24]">
                  Active Educational Stages:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'NURSERY',
                      title: 'Early Years & Nursery',
                      desc: 'Nursery 1 to 3 with early developmental foundations',
                    },
                    {
                      key: 'PRIMARY',
                      title: 'Primary School',
                      desc: 'Basic 1 to Basic 6 comprehensive primary curriculum',
                    },
                    {
                      key: 'JUNIOR_SECONDARY',
                      title: 'Junior Secondary (JSS 1-3)',
                      desc: 'Basic 7-9 BECE preparation & continuous assessments',
                    },
                    {
                      key: 'SENIOR_SECONDARY',
                      title: 'Senior Secondary (SS 1-3)',
                      desc: 'SS 1 to SS 3 WAEC/NECO senior curriculum streams',
                    },
                  ].map((stg) => {
                    const selected = stages.includes(stg.key);
                    return (
                      <button
                        key={stg.key}
                        type="button"
                        onClick={() => toggleStage(stg.key)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-[#064e3b] bg-[#ecfdf5] text-[#064e3b]'
                            : 'border-[#cbd2d9] bg-[#fbfbfa] text-[#52606d] hover:border-[#8c9ba5]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-[#141d24]">{stg.title}</p>
                            <p className="text-[11px] text-[#52606d] leading-snug">{stg.desc}</p>
                          </div>
                          {selected && (
                            <div className="w-5 h-5 rounded-full bg-[#064e3b] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button type="button" variant="outline" icon={ArrowLeft} onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" icon={ArrowRight} iconPosition="right">
                  Next: Presets & Launch
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Review & Launch */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#141d24]">
                  Automated Academic Foundations & Launch
                </h2>
                <p className="text-xs text-[#52606d] mt-0.5">
                  Confirm the pre-built configurations to automatically populate your academy workspace.
                </p>
              </div>

              {/* Presets Checklist */}
              <div className="bg-[#fbfbfa] p-4 rounded-xl border border-[#e5e3dc] space-y-3 text-xs">
                <p className="font-bold text-[#141d24] uppercase tracking-wider text-[11px]">
                  Automated Starter Pack
                </p>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createStandardClasses}
                    onChange={(e) => setCreateStandardClasses(e.target.checked)}
                    className="rounded border-[#cbd2d9] text-[#064e3b] focus:ring-[#064e3b]"
                  />
                  <div>
                    <span className="font-semibold text-[#141d24]">
                      Pre-generate standard classes & default arm 'A'
                    </span>
                    <p className="text-[11px] text-[#52606d]">
                      Creates levels for each selected educational stage with arm 'A' ready for admissions.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createStandardSubjects}
                    onChange={(e) => setCreateStandardSubjects(e.target.checked)}
                    className="rounded border-[#cbd2d9] text-[#064e3b] focus:ring-[#064e3b]"
                  />
                  <div>
                    <span className="font-semibold text-[#141d24]">
                      Pre-populate foundational core subjects
                    </span>
                    <p className="text-[11px] text-[#52606d]">
                      Initializes Mathematics, English Language, Basic Sciences, Civic Education, etc.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createStandardGrading}
                    onChange={(e) => setCreateStandardGrading(e.target.checked)}
                    className="rounded border-[#cbd2d9] text-[#064e3b] focus:ring-[#064e3b]"
                  />
                  <div>
                    <span className="font-semibold text-[#141d24]">
                      Configure standard WAEC/Universal grading & 30/70 CA scheme
                    </span>
                    <p className="text-[11px] text-[#52606d]">
                      Enables automated continuous assessment calculations, letter grades, and remarks.
                    </p>
                  </div>
                </label>
              </div>

              {/* Summary Overview */}
              <div className="p-4 bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl text-xs space-y-1.5 text-[#064e3b]">
                <div className="flex items-center gap-2 font-bold">
                  <Sparkles className="w-4 h-4 text-[#059669]" />
                  <span>Ready to Provision {schoolName || 'Your School'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Administrator: <b>{firstName} {lastName}</b> ({email}) • Session: <b>{sessionName}</b> • Stages:{' '}
                  <b>{stages.join(', ')}</b>
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button type="button" variant="outline" icon={ArrowLeft} onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  loadingText="Provisioning Institution..."
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={handleCompleteSetup}
                >
                  Complete Setup & Open Workspace
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#e5e3dc] text-center text-[11px] text-[#8c9ba5]">
        &copy; {new Date().getFullYear()} Providence SMS Institutional Management &bull; Multi-Tenant Enterprise Engine
      </footer>
    </div>
  );
};
