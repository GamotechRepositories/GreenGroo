import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronRight, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { personKey, Pill, pretty, HrBackButtons } from './hrShared';

const KIND_TONE = { leave: 'amber', announcement: 'blue', shift: 'green' };
const KIND_LABEL = { leave: 'Leave', announcement: 'Announcement', shift: 'Shift' };

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

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function datesOnOrBetween(from, to) {
  const start = String(from || '').slice(0, 10);
  const end = String(to || from || '').slice(0, 10);
  if (!start) return [];
  const out = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime())) return [start];
  while (cursor <= last) {
    out.push(ymd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function formatDay(date) {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const emptyForm = {
  date: '',
  toDate: '',
  assignee: '',
  leaveType: 'casual',
  reason: '',
  title: '',
  body: '',
  roleKey: 'all',
  status: 'scheduled',
  startTime: '09:00',
  endTime: '18:00',
  shiftName: 'General',
  notes: '',
};

export default function HrCalendarPage() {
  const today = ymd(new Date());
  const [params, setParams] = useSearchParams();
  const roleKey = params.get('role') || '';
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [events, setEvents] = useState([]);
  const [roles, setRoles] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openRole = (value) => setParams({ role: value });

  const load = async () => {
    setLoading(true);
    try {
      const requests = [opsApi.list('hr/roles'), opsApi.list('hr')];
      if (roleKey) requests.unshift(opsApi.list('hr/calendar', { month, roleKey }));
      const results = await Promise.all(requests);
      let cal = { data: [], roles: [] };
      let roleRows;
      let directory;
      if (roleKey) {
        [cal, roleRows, directory] = results;
      } else {
        [roleRows, directory] = results;
      }
      setEvents(cal.data || []);
      setRoles(roleRows.data?.length ? roleRows.data : cal.roles?.filter((r) => r.value !== 'all') || []);
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
  }, [month, roleKey]);

  const peopleForRole = useMemo(
    () => (roleKey === 'all' ? people : people.filter((p) => p.roleKey === roleKey)),
    [people, roleKey]
  );

  const byDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const days = datesOnOrBetween(event.date, event.toDate || event.date);
      days.forEach((day) => {
        if (!map.has(day)) map.set(day, []);
        map.get(day).push(event);
      });
    });
    return map;
  }, [events]);

  const dayEvents = byDate.get(selectedDate) || [];

  const openCreate = (kind, date = selectedDate) => {
    setEditing(null);
    setForm({
      ...emptyForm,
      date,
      toDate: date,
      roleKey: roleKey === 'all' ? 'all' : roleKey,
    });
    setModal(kind);
  };

  const openEdit = (item) => {
    const meta = item.meta || {};
    setEditing(item);
    setForm({
      ...emptyForm,
      date: item.date || selectedDate,
      toDate: item.toDate || item.date || selectedDate,
      assignee: meta.employeeType && meta.employeeId ? `${meta.employeeType}:${meta.employeeId}` : '',
      leaveType: meta.leaveType || 'casual',
      reason: meta.reason || item.body || '',
      title: meta.title || item.title || '',
      body: meta.body || item.body || '',
      roleKey: item.roleKey || meta.roleKey || roleKey || 'all',
      status: meta.status || 'scheduled',
      startTime: meta.startTime || '09:00',
      endTime: meta.endTime || '18:00',
      shiftName: meta.shiftName || 'General',
      notes: meta.notes || '',
    });
    setModal(item.kind);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal === 'leave') {
        if (editing) {
          await opsApi.update('hr/leaves', editing.id, {
            leaveType: form.leaveType,
            fromDate: form.date,
            toDate: form.toDate || form.date,
            reason: form.reason,
            status: form.status === 'shift' ? 'approved' : form.status || 'approved',
          });
        } else {
          const [employeeType, ...rest] = form.assignee.split(':');
          const person = people.find((row) => personKey(row) === form.assignee);
          await opsApi.create('hr/leaves', {
            employeeId: rest.join(':'),
            employeeType,
            name: person?.name,
            role: person?.role,
            roleKey: person?.roleKey || form.roleKey,
            fromDate: form.date,
            toDate: form.toDate || form.date,
            leaveType: form.leaveType,
            reason: form.reason,
            assign: true,
            status: 'approved',
          });
        }
      } else if (modal === 'shift') {
        if (editing) {
          await opsApi.update('hr/shifts', editing.id, {
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            shiftName: form.shiftName,
            notes: form.notes,
            roleKey: form.roleKey,
          });
        } else {
          const [employeeType, ...rest] = form.assignee.split(':');
          const person = people.find((row) => personKey(row) === form.assignee);
          await opsApi.create('hr/shifts', {
            employeeId: rest.join(':'),
            employeeType,
            name: person?.name,
            role: person?.role,
            roleKey: person?.roleKey || form.roleKey,
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            shiftName: form.shiftName,
            notes: form.notes,
          });
        }
      } else if (editing) {
        await opsApi.update('hr/announcements', editing.id, {
          title: form.title,
          body: form.body,
          roleKey: form.roleKey,
          scheduledAt: form.date,
          status: form.status === 'published' ? 'published' : 'scheduled',
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
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const removeEvent = async (item) => {
    if (!window.confirm(`Delete this ${item.kind}?`)) return;
    try {
      const path = item.kind === 'leave' ? 'hr/leaves' : item.kind === 'shift' ? 'hr/shifts' : 'hr/announcements';
      await opsApi.remove(path, item.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete');
    }
  };

  const roleLabel = roleKey === 'all' ? 'All roles' : roles.find((r) => r.value === roleKey)?.label || pretty(roleKey);
  const announcementRoles = [{ value: 'all', label: 'All roles' }, ...roles.filter((r) => r.value !== 'all')];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons>
            {roleKey ? (
              <button type="button" className={BTN} onClick={() => setParams({})}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to roles
              </button>
            ) : null}
          </HrBackButtons>
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>{roleKey ? `${roleLabel} calendar` : 'Calendar'}</h1>
          <p className={PAGE_SUB}>
            {roleKey
              ? 'Open a date to view, edit, or delete that day’s events for this role (admin only).'
              : 'Choose a role to open that team’s calendar.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roleKey ? (
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${INPUT} max-w-[180px]`} />
          ) : null}
          <button type="button" onClick={load} className={BTN}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      {!roleKey ? (
        loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={() => openRole('all')} className={`${PANEL} p-4 text-left hover:bg-slate-50`}>
              <p className="text-xs text-slate-500">All roles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{people.length}</p>
              <p className="mt-2 inline-flex items-center text-xs font-semibold text-[#217346]">
                Open calendar <ChevronRight className="h-3.5 w-3.5" />
              </p>
            </button>
            {roles.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => openRole(item.value)}
                className={`${PANEL} p-4 text-left hover:bg-slate-50`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <CalendarDays className="h-4 w-4 text-[#217346]" />
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{item.count ?? people.filter((p) => p.roleKey === item.value).length}</p>
                <p className="mt-2 inline-flex items-center text-xs font-semibold text-[#217346]">
                  Open calendar <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </button>
            ))}
          </div>
        )
      ) : (
      <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={BTN} onClick={() => setParams({})}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to roles
        </button>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => openRole('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              roleKey === 'all' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            All roles
          </button>
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => openRole(role.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                roleKey === role.value ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className={PANEL}>
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">{roleLabel} calendar</p>
            <div className="flex gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Leave</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" /> Note</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Shift</span>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-2 py-2">{d}</div>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-7">
              {monthDays(month).map((date, index) => {
                const items = date ? byDate.get(date) || [] : [];
                const isSelected = date === selectedDate;
                const isToday = date === today;
                return (
                  <button
                    key={date || `pad-${index}`}
                    type="button"
                    disabled={!date}
                    onClick={() => date && setSelectedDate(date)}
                    className={`min-h-[104px] border-b border-r border-slate-100 p-1.5 text-left ${
                      !date ? 'bg-slate-50/60' : isSelected ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-700/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    {date ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${isToday ? 'text-[#217346]' : 'text-slate-700'}`}>
                            {Number(date.slice(-2))}
                          </span>
                          {items.length ? (
                            <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">{items.length}</span>
                          ) : null}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {items.slice(0, 3).map((item) => (
                            <p
                              key={`${item.kind}-${item.id}`}
                              className={`truncate rounded px-1 py-0.5 text-[10px] ${
                                item.kind === 'leave' ? 'bg-amber-50 text-amber-800' : item.kind === 'shift' ? 'bg-emerald-50 text-emerald-800' : 'bg-sky-50 text-sky-800'
                              }`}
                            >
                              {KIND_LABEL[item.kind]} · {item.title}
                            </p>
                          ))}
                          {items.length > 3 ? <p className="text-[10px] text-slate-400">+{items.length - 3} more</p> : null}
                        </div>
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className={`${PANEL} flex min-h-[420px] flex-col`}>
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#217346]">Day view</p>
            <h2 className="text-base font-bold text-slate-900">{formatDay(selectedDate)}</h2>
            <p className="text-xs text-slate-500">{dayEvents.length} event{dayEvents.length === 1 ? '' : 's'} · {roleLabel}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-3 py-2">
            <button type="button" className={`${BTN} h-8 min-h-0 px-2.5 text-xs`} onClick={() => openCreate('leave')}>
              <Plus className="mr-1 h-3 w-3" /> Leave
            </button>
            <button type="button" className={`${BTN} h-8 min-h-0 px-2.5 text-xs`} onClick={() => openCreate('announcement')}>
              <Plus className="mr-1 h-3 w-3" /> Note
            </button>
            <button type="button" className={`${BTN} h-8 min-h-0 px-2.5 text-xs`} onClick={() => openCreate('shift')}>
              <Plus className="mr-1 h-3 w-3" /> Shift
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {dayEvents.length === 0 ? (
              <p className="px-1 py-8 text-center text-sm text-slate-400">No events on this date. Add leave, a note, or a shift.</p>
            ) : (
              dayEvents.map((item) => (
                <article key={`${item.kind}-${item.id}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Pill tone={KIND_TONE[item.kind] || 'slate'}>{KIND_LABEL[item.kind]}</Pill>
                      {item.roleKey ? <span className="ml-1.5 text-[11px] text-slate-400">{pretty(item.roleKey)}</span> : null}
                      <p className="mt-1.5 text-sm font-semibold text-slate-900">{item.title}</p>
                      {item.body ? <p className="mt-0.5 text-xs text-slate-500">{item.body}</p> : null}
                      <p className="mt-1 text-[11px] capitalize text-slate-400">{item.status || '—'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-[#217346]" title="Edit" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-rose-600" title="Delete" onClick={() => removeEvent(item)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={submit} className={`w-full max-w-lg ${PANEL} p-5`}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">
                {editing ? 'Edit' : 'Add'} {KIND_LABEL[modal]?.toLowerCase() || modal}
              </h2>
              <button type="button" onClick={() => { setModal(null); setEditing(null); }} className="rounded-lg p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Date
                <input type="date" required className={`${INPUT} mt-1.5`} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </label>
              {modal === 'leave' ? (
                <>
                  {!editing ? (
                    <label className="block text-xs font-semibold text-slate-600">
                      Employee
                      <select required className={`${INPUT} mt-1.5`} value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))}>
                        <option value="">Select</option>
                        {peopleForRole.map((person) => (
                          <option key={personKey(person)} value={personKey(person)}>{person.name} · {person.role}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="block text-xs font-semibold text-slate-600">
                    Until
                    <input type="date" className={`${INPUT} mt-1.5`} value={form.toDate} onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))} />
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
                  {editing ? (
                    <label className="block text-xs font-semibold text-slate-600">
                      Status
                      <select className={`${INPUT} mt-1.5`} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </label>
                  ) : null}
                  <label className="block text-xs font-semibold text-slate-600">
                    Reason
                    <input className={`${INPUT} mt-1.5`} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
                  </label>
                </>
              ) : null}
              {modal === 'announcement' ? (
                <>
                  <label className="block text-xs font-semibold text-slate-600">
                    Role
                    <select className={`${INPUT} mt-1.5`} value={form.roleKey} onChange={(e) => setForm((p) => ({ ...p, roleKey: e.target.value }))}>
                      {announcementRoles.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
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
              ) : null}
              {modal === 'shift' ? (
                <>
                  {!editing ? (
                    <label className="block text-xs font-semibold text-slate-600">
                      Employee
                      <select required className={`${INPUT} mt-1.5`} value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))}>
                        <option value="">Select</option>
                        {peopleForRole.map((person) => (
                          <option key={personKey(person)} value={personKey(person)}>{person.name} · {person.role}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Start
                      <input type="time" className={`${INPUT} mt-1.5`} value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">
                      End
                      <input type="time" className={`${INPUT} mt-1.5`} value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-slate-600">
                    Shift name
                    <input className={`${INPUT} mt-1.5`} value={form.shiftName} onChange={(e) => setForm((p) => ({ ...p, shiftName: e.target.value }))} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Notes
                    <input className={`${INPUT} mt-1.5`} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                  </label>
                </>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => { setModal(null); setEditing(null); }}>Cancel</button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      ) : null}
      </>
      )}
    </div>
  );
}
