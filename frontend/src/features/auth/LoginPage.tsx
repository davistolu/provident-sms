import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  School,
  ArrowRight,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/context/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success('Successfully authenticated. Welcome back!');
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials. Please verify your email and password.';
      setError(msg);
      toast.error(err, 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#1a202c] flex flex-col justify-between selection:bg-[#064e3b] selection:text-white">
      {/* Top Simple Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-[#043e2e] transition-colors">
            <School className="w-5 h-5 text-[#d1fae5]" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-[#111827] block leading-tight">
              Provident SMS
            </span>
            <span className="text-[11px] text-[#6b7280] font-medium block">
              School Management & Records
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6b7280] hidden sm:inline">New institution?</span>
          <Link
            to="/register"
            className="text-xs font-semibold text-[#064e3b] bg-white hover:bg-[#eae8e1] border border-[#d8d6cc] px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            Create School Account
          </Link>
        </div>
      </header>

      {/* Main Centered Sign-in Card Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          {/* Card */}
          <div className="bg-white border border-[#e2e0d8] rounded-2xl p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                Sign in to your school
              </h1>
              <p className="text-xs text-[#6b7280] mt-1.5">
                Enter your staff email and password to access your dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#d1d5db] rounded-lg text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-colors"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#374151]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-[#d1d5db] rounded-lg text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9ca3af] hover:text-[#4b5563] cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[#064e3b] hover:bg-[#043e2e] active:bg-[#032f23] text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Under-Card Context / Security Note */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[#6b7280]">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#059669]" />
              Multi-school encrypted
            </span>
            <span>&bull;</span>
            <span>Provident OS</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-[#9ca3af]">
        &copy; {new Date().getFullYear()} Provident SMS. All rights reserved.
      </footer>
    </div>
  );
};
