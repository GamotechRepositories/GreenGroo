import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d0b] text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72">
            <Sidebar isCollapsed={false} setIsCollapsed={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <Navbar
          isCollapsed={isCollapsed}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
