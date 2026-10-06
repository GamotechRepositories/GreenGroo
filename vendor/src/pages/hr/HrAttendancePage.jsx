import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { personKey, pretty, HrBackButtons } from './hrShared';

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function HrAttendancePage() {
  const [tab, setTab] = useState('attendance');
  const [log, setLog] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [people, setPeople] = useState([]);
  const [roleKey, setRoleKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ assignee: '', date: new Date().toISOString().slice(0, 10), startTime: '09:00', endTime: '18:00', shiftName: 'General' });

  const load = async () => {
    setLoading(true);
    try {
      const [attendance, roster, directory] = await Promise.all([
        opsApi.list('hr/attendance'),
        opsApi.list('hr/shifts', { roleKey }),
        opsApi.list('hr'),
      ]);
      setLog(attendance.data || []);
      setShifts(roster.data || []);
      setPeople(directory.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [roleKey]);

  const createShift = async (event) => {
    event.preventDefault();
    const person = people.find((row) => personKey(row) === form.assignee);
    const [employeeType, ...rest] = form.assignee.split(':');
    await opsApi.create('hr/shifts', {
      ...form,
      employeeId: rest.join(':'),
      employeeType,
      name: person?.name,
      role: person?.role,
      roleKey: person?.roleKey,
    });
    setOpen(false);
    await load();
  };

  const roles = [...new Map(people.map((person) => [person.roleKey, person.role])).entries()];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons />
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Attendance & shifts</h1>
          <p className={PAGE_SUB}>Clock records and role-wise shift rosters.</p>
        </div>
        <div className="flex gap-2">
          <select className={`${INPUT} max-w-[200px]`} value={roleKey} onChange={(e) => setRoleKey(e.target.value)}>
            <option value="all">All roles</option>
            {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="button" onClick={load} className={BTN}><RefreshCw className="mr-1.5 h-4 w-4" />Refresh</button>
          <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}><Plus className="mr-1.5 h-4 w-4" />Assign shift</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      <div className="flex rounded-xl border border-slate-200 bg-white p-1">
        {[{ id: 'attendance', label: 'Attendance' }, { id: 'shifts', label: 'Shifts' }].map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === item.id ? 'bg-emerald-700 text-white' : 'text-slate-600'}`}>{item.label}</button>
        ))}
      </div>

      <div className={PANEL}>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : tab === 'attendance' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]"><tr>{['Name', 'Role', 'Date', 'In', 'Out'].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {log.filter((row) => roleKey === 'all' || pretty(row.role).toLowerCase().includes(roleKey.replaceAll('_', ' '))).slice(0, 80).map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5 text-xs">{row.role || '—'}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums">{row.date}</td>
                    <td className="px-3 py-2.5 text-xs">{formatTime(row.clockIn)}</td>
                    <td className="px-3 py-2.5 text-xs">{row.clockOut ? formatTime(row.clockOut) : 'Open'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]"><tr>{['Name', 'Role', 'Date', 'Shift', 'Hours'].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {shifts.map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5 text-xs">{row.role || pretty(row.roleKey)}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums">{row.date}</td>
                    <td className="px-3 py-2.5 text-xs">{row.shiftName}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums">{row.startTime} – {row.endTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={createShift} className={`w-full max-w-lg ${PANEL} p-5`}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">Assign shift</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">Employee
                <select required className={`${INPUT} mt-1.5`} value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))}>
                  <option value="">Select</option>
                  {people.filter((person) => roleKey === 'all' || person.roleKey === roleKey).map((person) => (
                    <option key={personKey(person)} value={personKey(person)}>{person.name} · {person.role}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">Date<input type="date" required className={`${INPUT} mt-1.5`} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></label>
              <label className="block text-xs font-semibold text-slate-600">Shift name<input className={`${INPUT} mt-1.5`} value={form.shiftName} onChange={(e) => setForm((p) => ({ ...p, shiftName: e.target.value }))} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-600">Start<input type="time" className={`${INPUT} mt-1.5`} value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} /></label>
                <label className="block text-xs font-semibold text-slate-600">End<input type="time" className={`${INPUT} mt-1.5`} value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} /></label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className={BTN_PRIMARY}>Save shift</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
