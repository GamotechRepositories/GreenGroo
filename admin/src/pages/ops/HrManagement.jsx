import React, { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import opsApi from '../../api/opsApi';

export default function HrManagement() {
  const [people, setPeople] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'product_manager',
    password: 'Staff@123',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await opsApi.list('hr');
      setPeople(res.data || []);
      setStats(res.stats || null);
      setRoles(res.roles || []);
      if (res.roles?.[0]?.value) {
        setForm((prev) => ({ ...prev, role: prev.role || res.roles[0].value }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load HR directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createStaff = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await opsApi.create('hr', form);
      setForm({ name: '', email: '', phone: '', role: form.role, password: 'Staff@123' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create staff');
    }
  };

  const clock = async (person, action) => {
    try {
      await opsApi.create('hr/attendance', {
        action,
        employeeId: person.id,
        employeeType: person.employeeType,
        name: person.name,
        role: person.role,
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Attendance update failed');
    }
  };

  const toggleActive = async (person) => {
    if (person.employeeType !== 'staff') return;
    await opsApi.update('hr', person.id, { isActive: !person.isActive });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">HR Management</h1>
          <p className="text-sm text-slate-500">Staff, store managers, delivery partners, and attendance.</p>
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-semibold uppercase text-slate-400">{key}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}

      <form onSubmit={createStaff} className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
        <input required placeholder="Name" className="rounded-xl border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input required type="email" placeholder="Email" className="rounded-xl border px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <input required placeholder="Phone" className="rounded-xl border px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <select className="rounded-xl border px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
          {roles.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Add staff</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={`${person.employeeType}-${person.id}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold">{person.name}</td>
                  <td className="px-4 py-3">{person.role}</td>
                  <td className="px-4 py-3">{person.phone || person.email}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(person)} className="text-xs font-bold">
                      {person.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button type="button" onClick={() => clock(person, 'in')} className="text-xs font-semibold text-emerald-700">Clock in</button>
                    <button type="button" onClick={() => clock(person, 'out')} className="text-xs font-semibold text-slate-500">Clock out</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
