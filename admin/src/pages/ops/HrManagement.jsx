import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, Loader2, Megaphone, Palmtree, RefreshCw, UserPlus, UserRound, Wallet } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { inr } from '../hr/hrShared';

const MODULES = [
  { to: '/hr-management/employees', label: 'Employees', text: 'Role-wise people, logins, and profiles', icon: UserRound },
  { to: '/hr-management/calendar', label: 'Calendar', text: 'Assign leave and schedule announcements', icon: CalendarDays },
  { to: '/hr-management/announcements', label: 'Announcements', text: 'Draft and publish by role', icon: Megaphone },
  { to: '/hr-management/leave', label: 'Leave', text: 'Requests and policies for every role', icon: Palmtree },
  { to: '/hr-management/payroll', label: 'Payroll', text: 'Payruns, payments, and taxes', icon: Wallet },
  { to: '/hr-management/recruitment', label: 'Recruitment', text: 'Vacancies, screening, interviews, CVs', icon: UserPlus },
  { to: '/hr-management/attendance', label: 'Attendance', text: 'Clock logs and role-wise shifts', icon: Clock3 },
];

export default function HrManagement() {
  const [stats, setStats] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const month = new Date().toISOString().slice(0, 7);
      const [directory, pays, leaveRows, roleRows] = await Promise.all([
        opsApi.list('hr'),
        opsApi.list('hr/payroll', { month }).catch(() => ({ stats: {} })),
        opsApi.list('hr/leaves').catch(() => ({ stats: {} })),
        opsApi.list('hr/roles').catch(() => ({ data: [] })),
      ]);
      setStats(directory.stats || null);
      setPayroll(pays.stats || null);
      setLeaves(leaveRows.stats || null);
      setRoles(roleRows.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load HR dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = [
    { label: 'People', value: stats?.total ?? 0, to: '/hr-management/employees' },
    { label: 'Clocked in', value: stats?.clockedIn ?? 0, to: '/hr-management/attendance' },
    { label: 'Open work', value: stats?.openWork ?? 0, to: '/hr-management/employees' },
    { label: 'Pending leave', value: leaves?.pending ?? 0, to: '/hr-management/leave' },
    { label: 'Payroll pending', value: inr(payroll?.pendingAmount || 0), to: '/hr-management/payroll' },
    { label: 'Monthly bill', value: inr(stats?.monthlySalaryBill || 0), to: '/hr-management/payroll' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Dashboard</h1>
          <p className={PAGE_SUB}>People, leave, payroll, recruitment, and attendance in one place.</p>
        </div>
        <button type="button" onClick={load} className={BTN}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      {loading && !stats ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {cards.map((card) => (
              <Link key={card.label} to={card.to} className={`${PANEL} px-4 py-3 hover:bg-slate-50`}>
                <p className="text-xs text-[#6B7280]">{card.label}</p>
                <p className="mt-1 text-xl font-bold text-[#1F2937]">{card.value}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {MODULES.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className={`${PANEL} p-4 hover:bg-slate-50`}>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#217346]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.text}</p>
                </Link>
              );
            })}
          </div>

          <div className={PANEL}>
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Employees by role</div>
            <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((role) => (
                <Link
                  key={role.value}
                  to={`/hr-management/employees?role=${encodeURIComponent(role.value)}`}
                  className="bg-white px-4 py-3 hover:bg-slate-50"
                >
                  <p className="text-xs text-slate-500">{role.label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{role.count}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
