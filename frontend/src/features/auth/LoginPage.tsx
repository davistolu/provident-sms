import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { School, ArrowRight, ShieldCheck, Sparkles, BookOpen, GraduationCap, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col lg:flex-row">
      {/* Left Editorial Brand Pane */}
      <div className="lg:w-1/2 bg-[#064e3b] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#043326]">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#064e3b] flex items-center justify-center font-bold text-lg font-display shadow-md">
              P
            </div>
            <div>
              <h2 className="text-sm font-bold font-display tracking-wide uppercase">
                Providence Premier Academy
              </h2>
              <p className="text-[11px] text-[#a7f3d0] font-medium">Academic Management System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-12 lg:my-0 max-w-md">
          <Badge variant="gold" size="sm" className="mb-4">
            Institutional OS 2.0
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight leading-tight">
            Nurturing Knowledge, Character, and Distinction.
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-[#d1fae5]/90 leading-relaxed">
            A cohesive operational platform for nursery, primary, junior secondary, and senior secondary education management.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#043d2e] pt-6 text-xs text-[#a7f3d0]">
            <div>
              <p className="font-bold text-white text-sm font-mono">100%</p>
              <p className="text-[11px] text-[#a7f3d0]">Automated Report Cards</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm font-mono">Real-time</p>
              <p className="text-[11px] text-[#a7f3d0]">Bursary & Fee Invoicing</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-[#a7f3d0]/80 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#34d399]" />
          <span>Tenant Isolated &bull; Concurrency Safe &bull; 2026 Academic Session</span>
        </div>
      </div>

      {/* Right Sign-in Portal */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#141d24] tracking-tight">
              Sign In to Your Portal
            </h2>
            <p className="text-xs text-[#52606d]">
              Enter your official staff or administrative credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs font-medium rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Official Email Address"
              type="email"
              required
              placeholder="e.g. admin@providence.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Account Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Authenticate & Enter Workspace
            </Button>

            <div className="pt-2 text-center">
              <p className="text-xs text-[#52606d]">
                Setting up a new school entity?{' '}
                <Link
                  to="/register"
                  className="font-bold text-[#064e3b] hover:text-[#043326] underline inline-flex items-center gap-1"
                >
                  <span>Register & Setup School</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-6 border-t border-[#e6e4dc]">
            <p className="text-[11px] font-bold text-[#52606d] uppercase tracking-wider mb-2.5 text-center">
              Quick Role Credentials
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo('admin@providence.edu', 'Admin123!')}
                className="p-3 text-left bg-white border border-[#e6e4dc] hover:border-[#064e3b] hover:bg-[#fbfbfa] rounded-xl transition-all shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#141d24]">Principal / Admin</span>
                  <Badge variant="evergreen" size="sm">Admin</Badge>
                </div>
                <p className="text-[10px] text-[#8896a4] font-mono truncate">admin@providence.edu</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('john.doe@providence.edu', 'Teacher123!')}
                className="p-3 text-left bg-white border border-[#e6e4dc] hover:border-[#064e3b] hover:bg-[#fbfbfa] rounded-xl transition-all shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#141d24]">Class Educator</span>
                  <Badge variant="gold" size="sm">Teacher</Badge>
                </div>
                <p className="text-[10px] text-[#8896a4] font-mono truncate">john.doe@providence.edu</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
