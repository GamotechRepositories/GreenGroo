import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BTN } from '../../utils/ui';

export const HR_BASE = '/vendor/hr-management';

export const HR_LINKS = [
  { to: HR_BASE, label: 'Dashboard' },
  { to: `${HR_BASE}/calendar`, label: 'Calendar' },
  { to: `${HR_BASE}/announcements`, label: 'Announcements' },
  { to: `${HR_BASE}/leave`, label: 'Leave' },
  { to: `${HR_BASE}/my-leave`, label: 'My Leave' },
  { to: `${HR_BASE}/employees`, label: 'Employees' },
  { to: `${HR_BASE}/payroll`, label: 'Salary' },
  { to: `${HR_BASE}/recruitment`, label: 'Recruitment' },
  { to: `${HR_BASE}/attendance`, label: 'Attendance' },
  { to: `${HR_BASE}/meetings`, label: 'Meetings' },
];

/** Employee types a vendor manages: its farmer managers and pickup drivers. */
export const VENDOR_HR_TYPES = ['farmer_manager', 'pickup_driver'];

export const ROLE_FIELDS = {
  farmer_manager: ['email', 'address', 'city', 'state', 'pincode', 'location'],
  pickup_driver: ['vehicleNumber', 'vehicleType', 'licenseNumber', 'assignedArea'],
};

export function inr(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function initials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function pretty(value) {
  return String(value || '—').replaceAll('_', ' ');
}

export function personKey(person) {
  return `${person.employeeType}:${person.id}`;
}

export function goToPreviousPage(navigate, fallback = HR_BASE) {
  const idx = window.history.state?.idx;
  if (typeof idx === 'number' && idx > 0) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}

export function HrBackButtons({ children, fallback = HR_BASE }) {
  const navigate = useNavigate();
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <button type="button" className={BTN} onClick={() => goToPreviousPage(navigate, fallback)}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back
      </button>
      {children}
    </div>
  );
}

export function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-[#217346]',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    blue: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone] || tones.slate}`}>{children}</span>;
}
