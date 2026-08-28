import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Leaf,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FolderTree,
  Package,
  Store,
  Ticket,
  Coins,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Dark Stores', href: '/dark-stores', icon: Store },
  { name: 'Sections & Categories', href: '/categories', icon: FolderTree },
  { name: 'Coupons & Offers', href: '/coupons', icon: Ticket },
  { name: 'Reward Points', href: '/rewards', icon: Coins },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-slate-200/80 bg-white/95 backdrop-blur-md dark:bg-[#0e1713]/95 dark:border-slate-800/80 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/70">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white shadow-md shadow-emerald-500/20">
            <Leaf className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                Green<span className="text-emerald-500">Grocc</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Admin Portal
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          {!isCollapsed ? 'Overview' : '•'}
        </div>

        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-emerald-600 dark:bg-emerald-400" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Section & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className={`flex items-center gap-3 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 ${isCollapsed ? 'justify-center' : ''}`}>
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt="Admin profile"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'admin@greengrocc.com'}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            title="Logout"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 dark:hover:bg-slate-700 dark:hover:text-rose-400 transition-colors shadow-none hover:shadow-sm"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
