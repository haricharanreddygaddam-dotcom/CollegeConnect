import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Briefcase, School, Shield, 
  ArrowRight, Lock, Mail, Sparkles, CheckCircle2 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, demoUsers, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('haricharan.reddy@campusconnect.edu');
  const [password, setPassword] = useState('StudentPassword@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'student' | 'faculty' | 'hod' | 'admin') => {
    setLoading(true);
    try {
      await switchDemoRole(role);
      navigate('/');
    } catch (err: any) {
      setError('Failed to login with demo role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between p-4 sm:p-8 selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/30">
            CC
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">CampusConnect</span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full ml-2 border border-indigo-500/30">
              v1.0 Portal
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left column: Overview & 1-Click Interactive Demo Logins */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Unified Academic Management Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              One connected platform for your entire campus.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Manage attendance with live QR codes, automate continuous marks evaluation, publish official circulars, and verify student credentials instantly.
            </p>
          </div>

          {/* 1-Click Interactive Role Cards */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              ⚡ Instant 1-Click Test Role Logins:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student')}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/40 border border-slate-700/80 hover:border-indigo-400 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-200">Student Portal</h4>
                  <p className="text-[10px] text-slate-400">Haricharan Reddy (B.Tech CSE)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('faculty')}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-emerald-600/40 border border-slate-700/80 hover:border-emerald-400 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-200">Faculty Portal</h4>
                  <p className="text-[10px] text-slate-400">Prof. David Thorne (Web Tech)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('hod')}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-amber-600/40 border border-slate-700/80 hover:border-amber-400 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-200">HOD Portal</h4>
                  <p className="text-[10px] text-slate-400">Dr. Sarah Mitchell (CSE)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-purple-600/40 border border-slate-700/80 hover:border-purple-400 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-200">Admin Portal</h4>
                  <p className="text-[10px] text-slate-400">Prof. Arthur Pendelton (Dean)</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Login form */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto">
          <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Sign In to CampusConnect</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your registered institutional credentials</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-2xl border border-rose-500/30">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@campusconnect.edu"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500">
        CampusConnect v1.0 • Built with React, TypeScript, Tailwind CSS, FastAPI & PostgreSQL
      </div>

    </div>
  );
};
