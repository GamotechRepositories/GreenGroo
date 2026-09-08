import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BTN, BTN_PRIMARY, INPUT } from '../../utils/ui';

export default function Navbar({ onOpenSidebar, searchValue, onSearchChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  const onSearch = (event) => {
    event.preventDefault();
    const q = String(searchValue || '').trim();
    if (!q) return;
    navigate(`/traceability?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="z-20 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5">
        <button type="button" onClick={onOpenSidebar} className={`${BTN} px-2.5 lg:hidden`} aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </button>

        <form onSubmit={onSearch} className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchValue || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search farmer, batch, QR, or order ID"
            className={`${INPUT} pl-9`}
          />
        </form>

        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
          Admin
        </span>

        <div className={`${BTN} hidden items-center gap-2 pr-3 sm:inline-flex`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
            {initial}
          </span>
          <span className="max-w-[140px] truncate text-sm font-semibold">{user?.name || 'Admin'}</span>
        </div>

        <button type="button" onClick={logout} className={`${BTN_PRIMARY} gap-1.5 px-3`}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
