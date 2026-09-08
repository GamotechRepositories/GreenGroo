import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, RefreshCw, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { personKey, Pill } from './hrShared';

function monthDays(month) {
  const [year, mo] = month.split('-').map(Number);
  const first = new Date(year, mo - 1, 1);
  const startPad = first.getDay();
  const count = new Date(year, mo, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= count; d += 1) cells.push(`${month}-${String(d).padStart(2, '0')}`);
  return cells;
}

export default function HrCalendarPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [events, setEvents] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ date: '', assignee: '', leaveType: 'casual', reason: '', title: '', body: '', roleKey: 'all' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cal, directory] = await Promise.all([opsApi.list('hr/calendar', { month }), opsApi.list('hr')]);
      setEvents(cal.data || []);
      setPeople(directory.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const byDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = String(event.date || '').slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal === 'leave') {
        const [employeeType, ...rest] = form.assignee.split(':');
        const person = people.find((row) => personKey(row) === form.assignee);
        await opsApi.create('hr/leaves', {
          employeeId: rest.join(':'),
          employeeType,
          name: person?.name,
          role: person?.role,
          roleKey: person?.roleKey,
          fromDate: form.date,
          toDate: form.date,
          leaveType: form.leaveType,
          reason: form.reason,
          assign: true,
          status: 'approved',
        });
      } else {
        await opsApi.create('hr/announcements', {
          title: form.title,
          body: form.body,
          roleKey: form.roleKey,
          scheduledAt: form.date,
          status: 'scheduled',
        });
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const open = (kind, date) => {
    setForm((prev) => ({ ...prev, date }));
    setModal(kind);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Calendar</h1>
          <p className={PAGE_SUB}>Assign leave and schedule role-wise announcements.</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${INPUT} max-w-[180px]`} />
          <button type="button" onClick={load} className={BTN}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      <div className={PANEL}>
        <div className="grid grid-cols-7 border-b border-slate-100 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-2 py-2">{d}</div>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-7">
            {monthDays(month).map((date, index) => (
              <div key={date || `pad-${index}`} className="min-h-[110px] border-b border-r border-slate-100 p-1.5">
                {date ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{Number(date.slice(-2))}</span>
                      <div className="flex gap-0.5">
                        <button type="button" className="rounded p-0.5 text-slate-400 hover:bg-slate-100" title="Assign leave" onClick={() => open('leave', date)}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {(byDate.get(date) || []).slice(0, 3).map((item) => (
                        <p key={item.id} className="truncate rounded bg-slate-50 px-1 py-0.5 text-[10px] text-slate-600">
                          {item.kind === 'leave' ? 'Leave' : item.kind === 'shift' ? 'Shift' : 'Note'} · {item.title}
                        </p>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Pill tone="amber">Leave</Pill>
        <Pill tone="blue">Announcement</Pill>
        <Pill tone="green">Shift</Pill>
        <button type="button" className={BTN} onClick={() => open('announcement', `${month}-01`)}>Schedule announcement</button>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={submit} className={`w-full max-w-lg ${PANEL} p-5`}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">{modal === 'leave' ? 'Assign leave' : 'Schedule announcement'}</h2>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Date
                <input type="date" required className={`${INPUT} mt-1.5`} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </label>
              {modal === 'leave' ? (
                <>
                  <label className="block text-xs font-semibold text-slate-600">
                    Employee
                    <select required className={`${INPUT} mt-1.5`} value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))}>
                      <option value="">Select</option>
                      {people.map((person) => (
                        <option key={personKey(person)} value={personKey(person)}>{person.name} · {person.role}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Type
                    <select className={`${INPUT} mt-1.5`} value={form.leaveType} onChange={(e) => setForm((p) => ({ ...p, leaveType: e.target.value }))}>
                      <option value="casual">Casual</option>
                      <option value="sick">Sick</option>
                      <option value="earned">Earned</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Reason
                    <input className={`${INPUT} mt-1.5`} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
                  </label>
                </>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-slate-600">
                    Role
                    <select className={`${INPUT} mt-1.5`} value={form.roleKey} onChange={(e) => setForm((p) => ({ ...p, roleKey: e.target.value }))}>
                      <option value="all">All roles</option>
                      {[...new Map(people.map((p) => [p.roleKey, p.role])).entries()].map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Title
                    <input required className={`${INPUT} mt-1.5`} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Message
                    <textarea rows={3} className={`${INPUT} mt-1.5`} value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} />
                  </label>
                </>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
