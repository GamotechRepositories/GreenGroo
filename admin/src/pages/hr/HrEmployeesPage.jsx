import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { ROLE_FIELDS, initials, inr, pretty, HrBackButtons } from './hrShared';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'product_manager',
  password: 'Staff@123',
  monthlySalary: '',
  department: '',
  joiningDate: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  location: '',
  vendorId: 'vendor-1',
  vehicleNumber: '',
  vehicleType: 'Van',
  licenseNumber: '',
  assignedArea: '',
  area: '',
  storeName: '',
  storeAddress: '',
  managerId: '',
};

export default function HrEmployeesPage() {
  const [params, setParams] = useSearchParams();
  const role = params.get('role') || '';
  const [people, setPeople] = useState([]);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [directory, roleRows] = await Promise.all([opsApi.list('hr'), opsApi.list('hr/roles')]);
      setPeople(directory.data || []);
      setRoles(roleRows.data?.length ? roleRows.data : directory.roles || []);
      if (directory.roles?.[0] && !form.role) setForm((prev) => ({ ...prev, role: directory.roles[0].value }));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people.filter((person) => {
      if (role && role !== 'all' && person.roleKey !== role) return false;
      if (!needle) return true;
      return [person.name, person.email, person.phone, person.role, person.location].join(' ').toLowerCase().includes(needle);
    });
  }, [people, query, role]);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await opsApi.create('hr', form);
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create login');
    } finally {
      setSaving(false);
    }
  };

  const fields = ROLE_FIELDS[form.role] || ['email', 'department'];
  const managers = people.filter((person) => person.employeeType === 'delivery_manager');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons>
            {role ? (
              <button type="button" className={BTN} onClick={() => setParams({})}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to roles
              </button>
            ) : null}
          </HrBackButtons>
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Employees</h1>
          <p className={PAGE_SUB}>Create a login for any role, then open the profile for full employment details.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className={BTN}><RefreshCw className="mr-1.5 h-4 w-4" />Refresh</button>
          <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}><Plus className="mr-1.5 h-4 w-4" />Create login</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      {!role ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button type="button" onClick={() => setParams({ role: 'all' })} className={`${PANEL} p-4 text-left hover:bg-slate-50`}>
            <p className="text-xs text-slate-500">All employees</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{people.length}</p>
            <p className="mt-2 inline-flex items-center text-xs font-semibold text-[#217346]">View employees <ChevronRight className="h-3.5 w-3.5" /></p>
          </button>
          {roles.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setParams({ role: item.value })}
              className={`${PANEL} p-4 text-left hover:bg-slate-50`}
            >
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{item.count ?? people.filter((p) => p.roleKey === item.value).length}</p>
              <p className="mt-2 inline-flex items-center text-xs font-semibold text-[#217346]">View employees <ChevronRight className="h-3.5 w-3.5" /></p>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={BTN} onClick={() => setParams({})}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to roles
            </button>
            <p className="text-sm font-semibold">{role === 'all' ? 'All employees' : pretty(role)}</p>
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${INPUT} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees" />
            </div>
          </div>
          <div className={PANEL}>
            {loading ? (
              <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F2F2F2]">
                    <tr>{['Employee', 'Contact', 'Salary', 'Location', ''].map((h) => <th key={h || 'a'} className={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map((person) => (
                      <tr key={`${person.employeeType}:${person.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-bold text-[#217346]">{initials(person.name)}</span>
                            <div>
                              <Link className="font-semibold text-[#217346] hover:underline" to={`/hr-management/employees/${person.employeeType}/${person.id}`}>{person.name}</Link>
                              <p className="text-[11px] text-slate-400">{person.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs">{person.phone}<br />{person.email || '—'}</td>
                        <td className="px-3 py-2.5 tabular-nums">{Number(person.monthlySalary) > 0 ? inr(person.monthlySalary) : '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">{person.location || person.department || '—'}</td>
                        <td className="px-3 py-2.5 text-right">
                          <Link className={`${BTN} h-8 min-h-0 px-2.5 text-xs`} to={`/hr-management/employees/${person.employeeType}/${person.id}`}>Profile</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={create} className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto ${PANEL} p-5`}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Create employee login</h2>
                <p className="text-xs text-slate-500">Fields change with the selected role so the account matches that dashboard.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">Role
                <select className={`${INPUT} mt-1.5`} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                  {(roles.length ? roles : [{ value: 'product_manager', label: 'Product Manager' }]).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">Full name<input required className={`${INPUT} mt-1.5`} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
              <label className="block text-xs font-semibold text-slate-600">Phone<input required className={`${INPUT} mt-1.5`} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></label>
              <label className="block text-xs font-semibold text-slate-600">Password<input className={`${INPUT} mt-1.5`} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} /></label>
              <label className="block text-xs font-semibold text-slate-600">Monthly salary<input type="number" min="0" className={`${INPUT} mt-1.5`} value={form.monthlySalary} onChange={(e) => setForm((p) => ({ ...p, monthlySalary: e.target.value }))} /></label>
              <label className="block text-xs font-semibold text-slate-600">Joining date<input type="date" className={`${INPUT} mt-1.5`} value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} /></label>
              {fields.includes('email') ? <label className="block text-xs font-semibold text-slate-600">Email<input required={form.role !== 'pickup_driver'} type="email" className={`${INPUT} mt-1.5`} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></label> : null}
              {fields.includes('department') ? <label className="block text-xs font-semibold text-slate-600">Department<input className={`${INPUT} mt-1.5`} value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /></label> : null}
              {fields.includes('address') ? <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">Address<input className={`${INPUT} mt-1.5`} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></label> : null}
              {fields.includes('city') ? <label className="block text-xs font-semibold text-slate-600">City<input required={form.role === 'delivery_manager'} className={`${INPUT} mt-1.5`} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></label> : null}
              {fields.includes('state') ? <label className="block text-xs font-semibold text-slate-600">State<input required={form.role === 'delivery_manager'} className={`${INPUT} mt-1.5`} value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} /></label> : null}
              {fields.includes('pincode') ? <label className="block text-xs font-semibold text-slate-600">Pincode<input className={`${INPUT} mt-1.5`} value={form.pincode} onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))} /></label> : null}
              {fields.includes('location') ? <label className="block text-xs font-semibold text-slate-600">Location<input className={`${INPUT} mt-1.5`} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></label> : null}
              {fields.includes('vendorId') ? <label className="block text-xs font-semibold text-slate-600">Vendor ID<input className={`${INPUT} mt-1.5`} value={form.vendorId} onChange={(e) => setForm((p) => ({ ...p, vendorId: e.target.value }))} /></label> : null}
              {fields.includes('vehicleNumber') ? <label className="block text-xs font-semibold text-slate-600">Vehicle number<input className={`${INPUT} mt-1.5`} value={form.vehicleNumber} onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value }))} /></label> : null}
              {fields.includes('vehicleType') ? (
                <label className="block text-xs font-semibold text-slate-600">Vehicle type
                  <select className={`${INPUT} mt-1.5`} value={form.vehicleType} onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))}>
                    {form.role === 'delivery_boy'
                      ? ['motorcycle', 'bicycle', 'electric', 'van', 'no_vehicle'].map((v) => <option key={v} value={v}>{v}</option>)
                      : ['Van', 'Pickup', 'Bike', 'Truck'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              ) : null}
              {fields.includes('licenseNumber') ? <label className="block text-xs font-semibold text-slate-600">License<input className={`${INPUT} mt-1.5`} value={form.licenseNumber} onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))} /></label> : null}
              {fields.includes('assignedArea') ? <label className="block text-xs font-semibold text-slate-600">Assigned area<input className={`${INPUT} mt-1.5`} value={form.assignedArea} onChange={(e) => setForm((p) => ({ ...p, assignedArea: e.target.value }))} /></label> : null}
              {fields.includes('area') ? <label className="block text-xs font-semibold text-slate-600">Area<input required={form.role === 'delivery_manager'} className={`${INPUT} mt-1.5`} value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} /></label> : null}
              {fields.includes('storeName') ? <label className="block text-xs font-semibold text-slate-600">Store name<input className={`${INPUT} mt-1.5`} value={form.storeName} onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))} /></label> : null}
              {fields.includes('storeAddress') ? <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">Store address<input className={`${INPUT} mt-1.5`} value={form.storeAddress} onChange={(e) => setForm((p) => ({ ...p, storeAddress: e.target.value }))} /></label> : null}
              {fields.includes('managerId') ? (
                <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">Delivery manager
                  <select className={`${INPUT} mt-1.5`} value={form.managerId} onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {managers.map((mgr) => <option key={mgr.id} value={mgr.id}>{mgr.name} · {mgr.location}</option>)}
                  </select>
                </label>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? 'Creating…' : 'Create login'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
