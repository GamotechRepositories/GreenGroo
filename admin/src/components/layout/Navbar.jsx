import React from 'react';
import { Menu } from 'lucide-react';

export default function Navbar({ onMobileMenuToggle }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:bg-[#0b1310]/80 dark:border-slate-800/80 transition-all duration-300">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 hidden sm:inline-block">
          GreenGrocc Admin Dashboard
        </span>
      </div>

      {/* Right: Admin Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Online</span>
        </div>
      </div>
    </header>
  );
}
