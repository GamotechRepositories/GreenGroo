import React from 'react';
import { Leaf, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 animate-in fade-in duration-300">
      <div className="max-w-xl w-full rounded-3xl bg-white p-8 sm:p-12 border border-slate-200/90 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-6">
        {/* Brand Icon */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white shadow-xl shadow-emerald-500/20">
          <Leaf className="h-10 w-10" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" /> Admin Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
            Welcome to <span className="text-emerald-600 dark:text-emerald-400">GreenGrocc</span> Admin
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You are signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name || 'Administrator'}</span> ({user?.email || 'admin@greengrocc.com'}).
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Status
          </div>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active & Ready</span>
        </div>
      </div>
    </div>
  );
}
