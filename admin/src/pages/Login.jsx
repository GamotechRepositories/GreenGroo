import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@greengrocc.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    login(
      {
        name: 'Super Admin',
        email,
        role: 'superadmin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      'greengrocc_admin_jwt_session'
    );
    navigate('/');
  };

  const handleQuickDemoLogin = (roleName, roleEmail) => {
    login(
      {
        name: roleName,
        email: roleEmail,
        role: roleName.toLowerCase().replace(' ', '_'),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      'demo_session_token'
    );
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#08120d] text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-green-500/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white shadow-lg shadow-emerald-500/30">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black font-display tracking-tight text-white">
            Green<span className="text-emerald-400">Grocc</span>
          </h1>
          <p className="text-xs text-emerald-200/80 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Central Administration Portal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-slate-900/80 p-6 sm:p-8 border border-emerald-900/40 shadow-2xl backdrop-blur-xl space-y-6">
          {error && (
            <div className="rounded-xl bg-rose-950/50 border border-rose-800/60 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@greengrocc.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 py-3 font-bold text-white shadow-lg shadow-emerald-600/30 transition-all duration-200"
            >
              Sign In to Command Center <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* One-click demo roles */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400" /> Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Super Admin', 'admin@greengrocc.com')}
                className="rounded-xl border border-slate-700 bg-slate-800/60 p-2 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:bg-slate-800 transition-colors text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Inventory Lead', 'inventory@greengrocc.com')}
                className="rounded-xl border border-slate-700 bg-slate-800/60 p-2 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:bg-slate-800 transition-colors text-center"
              >
                Inventory Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
