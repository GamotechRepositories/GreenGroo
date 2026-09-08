import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { personKey, Pill, pretty, HrBackButtons } from './hrShared';

export default function HrLeavePage() {
  const [tab, setTab] = useState('requests');
  const [rows, setRows] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [people, setPeople] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ assignee: '', leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [leaves, policy, directory] = await Promise.all([
        opsApi.list('hr/leaves', { status }),
        opsApi.list('hr/leave-policies'),
        opsApi.list('hr'),
      ]);
      setRows(leaves.data || []);
      setPolicies(policy.data || []);
      setPeople(directory.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const decide = async (row, next) => {
    await opsApi.update('hr/leaves', row._id, { status: next });
    await load();
  };

  const savePolicy = async (policy) => {
    await opsApi.update('hr/leave-policies', policy.roleKey, policy);
    await load();
  };

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const person = people.find((row) => personKey(row) === form.assignee);
      const [employeeType, ...rest] = form.assignee.split(':');
      await opsApi.create('hr/leaves', {
        ...form,
        employeeId: rest.join(':'),
        employeeType,
        name: person?.name,
        role: person?.role,
        roleKey: person?.roleKey,
      });
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create leave');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons />
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Leave</h1>
          <p className={PAGE_SUB}>Leave requests and annual policies for every login role.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className={BTN}><RefreshCw className="mr-1.5 h-4 w-4" />Refresh</button>
          <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}><Plus className="mr-1.5 h-4 w-4" />New request</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      <div className="flex rounded-xl border border-slate-200 bg-white p-1">
        {[
          { id: 'requests', label: 'Requests' },
          { id: 'policies', label: 'Policies by role' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === item.id ? 'bg-emerald-700 text-white' : 'text-slate-600'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        <>
          <select className={`${INPUT} max-w-[160px]`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className={PANEL}>
            {loading ? (
              <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F2F2F2]">
                    <tr>{['Employee', 'Type', 'Dates', 'Status', ''].map((h) => <th key={h || 'a'} className={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">No leave requests</td></tr>
                    ) : rows.map((row) => (
                      <tr key={row._id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold">{row.name}</p>
                          <p className="text-[11px] text-slate-400">{row.role || pretty(row.roleKey)}</p>
                        </td>
                        <td className="px-3 py-2.5 capitalize">{row.leaveType} · {row.days}d</td>
                        <td className="px-3 py-2.5 text-xs tabular-nums">{row.fromDate} → {row.toDate}</td>
                        <td className="px-3 py-2.5">
                          <Pill tone={row.status === 'approved' ? 'green' : row.status === 'rejected' ? 'rose' : 'amber'}>{row.status}</Pill>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {row.status === 'pending' ? (
                            <div className="flex justify-end gap-1">
                              <button type="button" className={`${BTN} h-8 min-h-0 px-2.5 text-xs`} onClick={() => decide(row, 'rejected')}>Reject</button>
                              <button type="button" className={`${BTN_PRIMARY} h-8 min-h-0 px-2.5 text-xs`} onClick={() => decide(row, 'approved')}>Approve</button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {policies.map((policy) => (
            <form
              key={policy.roleKey}
              className={`${PANEL} p-4`}
              onSubmit={(e) => {
                e.preventDefault();
                savePolicy(policy);
              }}
            >
              <p className="font-semibold text-slate-900">{policy.role || pretty(policy.roleKey)}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {['casualDays', 'sickDays', 'earnedDays'].map((key) => (
                  <label key={key} className="text-[11px] font-semibold text-slate-500">
                    {pretty(key.replace('Days', ''))}
                    <input
                      type="number"
                      min="0"
                      className={`${INPUT} mt-1`}
                      value={policy[key]}
                      onChange={(e) => setPolicies((list) => list.map((row) => (row.roleKey === policy.roleKey ? { ...row, [key]: Number(e.target.value) } : row)))}
                    />
                  </label>
                ))}
              </div>
              <button type="submit" className={`${BTN} mt-3 w-full text-xs`}>Save policy</button>
            </form>
          ))}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={create} className={`w-full max-w-lg ${PANEL} p-5`}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">Leave request</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
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
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-600">From<input type="date" required className={`${INPUT} mt-1.5`} value={form.fromDate} onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))} /></label>
                <label className="block text-xs font-semibold text-slate-600">To<input type="date" required className={`${INPUT} mt-1.5`} value={form.toDate} onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))} /></label>
              </div>
              <label className="block text-xs font-semibold text-slate-600">Reason<input className={`${INPUT} mt-1.5`} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>Submit</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
