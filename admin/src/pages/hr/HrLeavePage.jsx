import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Palmtree,
  Plus,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { personKey, Pill, pretty, HrBackButtons } from './hrShared';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', tone: 'amber' },
  { value: 'approved', label: 'Approved', tone: 'green' },
  { value: 'rejected', label: 'Rejected', tone: 'rose' },
];

function statusTone(status) {
  if (status === 'approved') return 'green';
  if (status === 'rejected') return 'rose';
  return 'amber';
}

export default function HrLeavePage() {
  const [params, setParams] = useSearchParams();
  const roleKey = params.get('role') || '';
  const [tab, setTab] = useState('requests');
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [byRole, setByRole] = useState({});
  const [policies, setPolicies] = useState([]);
  const [people, setPeople] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    assignee: '',
    leaveType: 'casual',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState('');

  const openRole = (value) => setParams(value ? { role: value } : {});

  const load = async () => {
    setLoading(true);
    try {
      const leaveQuery = roleKey
        ? { roleKey, status: statusFilter }
        : { status: 'all' };
      const [leaves, policy, directory, roleRows] = await Promise.all([
        opsApi.list('hr/leaves', leaveQuery),
        opsApi.list('hr/leave-policies'),
        opsApi.list('hr'),
        opsApi.list('hr/roles'),
      ]);
      setRows(leaves.data || []);
      setByRole(leaves.byRole || {});
      setRoles(
        roleRows.data?.length
          ? roleRows.data
          : leaves.roles || []
      );
      setPolicies(policy.data || []);
      setPeople(directory.data || []);
      const nextDrafts = {};
      (leaves.data || []).forEach((row) => {
        nextDrafts[row._id] = {
          status: row.status || 'pending',
          adminNotes: row.adminNotes || '',
        };
      });
      setDrafts(nextDrafts);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [roleKey, statusFilter]);

  const roleCards = useMemo(() => {
    const list = roles.length
      ? roles
      : Object.keys(byRole).map((value) => ({ value, label: pretty(value) }));
    return list.map((role) => {
      const stats = byRole[role.value] || { total: 0, pending: 0, approved: 0, rejected: 0 };
      return {
        ...role,
        label: role.label || pretty(role.value),
        ...stats,
      };
    });
  }, [roles, byRole]);

  const totalRequests = roleCards.reduce((sum, role) => sum + (role.total || 0), 0);
  const totalPending = roleCards.reduce((sum, role) => sum + (role.pending || 0), 0);
  const roleLabel =
    roleKey === 'all'
      ? 'All roles'
      : roles.find((r) => r.value === roleKey)?.label || pretty(roleKey);

  const peopleForRole = useMemo(
    () => (roleKey ? people.filter((p) => p.roleKey === roleKey) : people),
    [people, roleKey]
  );

  const setDraft = (id, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { status: 'pending', adminNotes: '' }), ...patch },
    }));
  };

  const saveRequest = async (row) => {
    const draft = drafts[row._id] || { status: row.status, adminNotes: row.adminNotes || '' };
    setSavingId(row._id);
    try {
      await opsApi.update('hr/leaves', row._id, {
        status: draft.status,
        adminNotes: draft.adminNotes,
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update leave request');
    } finally {
      setSavingId('');
    }
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
        roleKey: person?.roleKey || roleKey,
      });
      setOpen(false);
      setForm({ assignee: '', leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create leave');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons>
            {roleKey ? (
              <button type="button" className={BTN} onClick={() => openRole('')}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                All roles
              </button>
            ) : null}
          </HrBackButtons>
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>{roleKey ? `${roleLabel} leave` : 'Leave'}</h1>
          <p className={PAGE_SUB}>
            {roleKey
              ? 'Review requests, change status, and add admin notes.'
              : 'Choose a role to review leave requests for that team.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className={BTN}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {roleKey ? (
            <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}>
              <Plus className="mr-1.5 h-4 w-4" />
              New request
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!roleKey ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`${PANEL} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalRequests}</p>
            </div>
            <div className={`${PANEL} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{totalPending}</p>
            </div>
            <div className={`${PANEL} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Roles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{roleCards.length}</p>
            </div>
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {[
              { id: 'requests', label: 'Requests by role' },
              { id: 'policies', label: 'Policies by role' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  tab === item.id ? 'bg-emerald-700 text-white' : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'requests' ? (
            loading ? (
              <div className="flex justify-center py-20 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {roleCards.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => openRole(role.value)}
                    className={`${PANEL} group p-5 text-left transition hover:border-emerald-300 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                        <Palmtree className="h-4 w-4" />
                      </span>
                      <ChevronRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-slate-900">{role.label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                      {role.total || 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">leave request{(role.total || 0) === 1 ? '' : 's'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        {role.pending || 0} pending
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {role.approved || 0} approved
                      </span>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                        {role.rejected || 0} rejected
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )
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
                          onChange={(e) =>
                            setPolicies((list) =>
                              list.map((row) =>
                                row.roleKey === policy.roleKey
                                  ? { ...row, [key]: Number(e.target.value) }
                                  : row
                              )
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <button type="submit" className={`${BTN} mt-3 w-full text-xs`}>
                    Save policy
                  </button>
                </form>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={`${INPUT} max-w-[220px]`}
              value={roleKey}
              onChange={(e) => openRole(e.target.value)}
            >
              {roleCards.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <select
              className={`${INPUT} max-w-[160px]`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className={`${PANEL} flex flex-col items-center justify-center px-6 py-16 text-center`}>
              <Palmtree className="mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No leave requests</p>
              <p className="mt-1 text-xs text-slate-400">
                There are no {statusFilter === 'all' ? '' : `${statusFilter} `}requests for this role yet.
              </p>
              <button type="button" onClick={() => setOpen(true)} className={`${BTN_PRIMARY} mt-4`}>
                <Plus className="mr-1.5 h-4 w-4" />
                New request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const draft = drafts[row._id] || {
                  status: row.status || 'pending',
                  adminNotes: row.adminNotes || '',
                };
                const dirty =
                  draft.status !== (row.status || 'pending') ||
                  draft.adminNotes !== (row.adminNotes || '');
                return (
                  <article key={row._id} className={`${PANEL} p-4 sm:p-5`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">{row.name}</h3>
                          <Pill tone={statusTone(row.status)}>{row.status}</Pill>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.role || pretty(row.roleKey)} · {pretty(row.leaveType)} · {row.days} day
                          {row.days === 1 ? '' : 's'}
                        </p>
                        <p className="mt-1 text-xs tabular-nums text-slate-400">
                          {row.fromDate} → {row.toDate}
                        </p>
                        {row.reason ? (
                          <p className="mt-2 text-sm text-slate-600">
                            <span className="font-medium text-slate-700">Reason: </span>
                            {row.reason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto]">
                      <label className="block text-xs font-semibold text-slate-600">
                        Status
                        <select
                          className={`${INPUT} mt-1.5`}
                          value={draft.status}
                          onChange={(e) => setDraft(row._id, { status: e.target.value })}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-semibold text-slate-600">
                        Admin notes
                        <textarea
                          rows={2}
                          className={`${INPUT} mt-1.5`}
                          placeholder="Add a note for this request…"
                          value={draft.adminNotes}
                          onChange={(e) => setDraft(row._id, { adminNotes: e.target.value })}
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          type="button"
                          disabled={!dirty || savingId === row._id}
                          onClick={() => saveRequest(row)}
                          className={`${BTN_PRIMARY} w-full lg:w-auto`}
                        >
                          {savingId === row._id ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-1.5 h-4 w-4" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDraft(row._id, { status: opt.value })}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            draft.status === opt.value
                              ? opt.value === 'approved'
                                ? 'bg-emerald-700 text-white'
                                : opt.value === 'rejected'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <form onSubmit={create} className={`w-full max-w-lg ${PANEL} p-6 shadow-xl`}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Leave</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">New leave request</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Employee
                <select
                  required
                  className={`${INPUT} mt-1.5`}
                  value={form.assignee}
                  onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))}
                >
                  <option value="">Select</option>
                  {peopleForRole.map((person) => (
                    <option key={personKey(person)} value={personKey(person)}>
                      {person.name} · {person.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Type
                <select
                  className={`${INPUT} mt-1.5`}
                  value={form.leaveType}
                  onChange={(e) => setForm((p) => ({ ...p, leaveType: e.target.value }))}
                >
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="earned">Earned</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-600">
                  From
                  <input
                    type="date"
                    required
                    className={`${INPUT} mt-1.5`}
                    value={form.fromDate}
                    onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))}
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  To
                  <input
                    type="date"
                    required
                    className={`${INPUT} mt-1.5`}
                    value={form.toDate}
                    onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))}
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold text-slate-600">
                Reason
                <input
                  className={`${INPUT} mt-1.5`}
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" className={BTN} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>
                {saving ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
