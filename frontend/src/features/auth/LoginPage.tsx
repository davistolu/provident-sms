import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, School, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-lg mb-4">
          P
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">PROVI SMS</h2>
        <p className="text-sm text-slate-500 mt-1">Enterprise School Management Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200/80">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g. admin@providence.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to Institution
            </Button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
              Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@providence.edu', 'Admin123!')}
                className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors text-xs"
              >
                <p className="font-bold text-slate-800">School Admin</p>
                <p className="text-[10px] text-slate-500 truncate">admin@providence.edu</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('john.doe@providence.edu', 'Teacher123!')}
                className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors text-xs"
              >
                <p className="font-bold text-slate-800">Class Teacher</p>
                <p className="text-[10px] text-slate-500 truncate">john.doe@providence.edu</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; 2026 PROVI School Management System &bull; Production Ready
        </p>
      </div>
    </div>
  );
};
