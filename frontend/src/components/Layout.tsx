import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, FlaskConical, Car, Award,
  ClipboardList, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  rd_engineer: 'R&D Engineer',
  rd_head: 'R&D Head',
  operations: 'Operations',
  sales: 'Sales',
};

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/firmware',  icon: Cpu,             label: 'Firmware Versions' },
  { to: '/stage1',    icon: FlaskConical,    label: 'Stage 1 – Sanity Test' },
  { to: '/stage2',    icon: Car,             label: 'Stage 2 – Field Test' },
  { to: '/stage3',    icon: Award,           label: 'Stage 3 – Final Sign-off' },
  { to: '/changelog', icon: ClipboardList,   label: 'Change Log' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200',
        'lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <div>
            <div className="text-sm font-bold tracking-widest text-blue-400 uppercase">abckedn</div>
            <div className="text-xs text-gray-400 mt-0.5">VTD Testing Protocol</div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                location.pathname === to
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {location.pathname === to && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div className="text-sm font-medium text-white">{user?.name}</div>
          <div className="text-xs text-gray-400">{ROLE_LABELS[user?.role || '']}</div>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">VTD Testing Protocol</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
