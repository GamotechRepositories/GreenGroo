export const HR_LINKS = [
  { to: '/hr-management', label: 'Dashboard' },
  { to: '/hr-management/calendar', label: 'Calendar' },
  { to: '/hr-management/announcements', label: 'Announcements' },
  { to: '/hr-management/leave', label: 'Leave' },
  { to: '/hr-management/employees', label: 'Employees' },
  { to: '/hr-management/payroll', label: 'Payroll' },
  { to: '/hr-management/recruitment', label: 'Recruitment' },
  { to: '/hr-management/attendance', label: 'Attendance' },
];

export const ROLE_FIELDS = {
  vendor: ['email', 'department'],
  segregation_manager: ['email', 'department'],
  product_manager: ['email', 'department'],
  farmer_manager: ['email', 'address', 'city', 'state', 'pincode', 'location', 'vendorId'],
  farmer: ['email', 'address', 'city', 'state', 'pincode'],
  pickup_driver: ['vehicleNumber', 'vehicleType', 'licenseNumber', 'assignedArea', 'vendorId'],
  delivery_manager: ['email', 'state', 'city', 'area', 'storeName', 'storeAddress', 'pincode'],
  delivery_boy: ['city', 'area', 'managerId', 'vehicleType'],
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

export function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-[#217346]',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    blue: 'bg-sky-50 text-sky-700',
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone] || tones.slate}`}>{children}</span>;
}
