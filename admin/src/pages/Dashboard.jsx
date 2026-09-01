import React from 'react';
import { Leaf, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_GROUPS } from '../config/adminNav';

const DASHBOARD_LINKS = NAV_GROUPS.flatMap((group) => group.items).filter(
  (item) => item.href !== '/' && item.href !== '/welcome'
);

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white shadow-xl shadow-emerald-500/20">
            <Leaf className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Admin Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              Welcome to <span className="text-emerald-600 dark:text-emerald-400">GreenGrocc</span> Admin
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name || 'Administrator'}</span> ({user?.email || 'admin@greengrocc.com'}).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DASHBOARD_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.description || 'Open this module from the admin panel.'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
