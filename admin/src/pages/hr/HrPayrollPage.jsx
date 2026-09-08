import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, IndianRupee, Loader2, Pencil, RefreshCw, Search } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { inr, initials, Pill, pretty, HrBackButtons } from './hrShared';

function payKey(person) {
  return `${person.employeeType}:${person.id}`;
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function FoldHeader({ title, summary, open, onToggle, extra }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${open ? 'mb-4' : ''}`}>
      <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? '' : '-rotate-90'}`} />
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        {!open && summary ? <span className="truncate text-xs font-normal text-slate-500">{summary}</span> : null}
      </button>
      {extra}
    </div>
  );
}

function shiftMonth(yyyyMm, delta) {
  const [year, month] = String(yyyyMm || '').split('-').map(Number);
  if (!year || !month) return yyyyMm;
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function labelMonth(yyyyMm) {
  const [year, month] = String(yyyyMm || '').split('-').map(Number);
  if (!year || !month) return yyyyMm || '—';
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HrPayrollPage() {
  const [params, setParams] = useSearchParams();
  const role = params.get('role') || '';
  const employeeKey = params.get('employee') || '';
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [people, setPeople] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [form, setForm] = useState(null);
  const [editingComp, setEditingComp] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);

  const togglePanel = (id) => {
    setOpenPanel((current) => (current === id ? null : id));
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [directory, roleRows, payroll] = await Promise.all([
        opsApi.list('hr'),
        opsApi.list('hr/roles').catch(() => ({ data: [] })),
        opsApi.list('hr/payroll'),
      ]);
      setPeople(directory.data || []);
      setRoles(roleRows.data?.length ? roleRows.data : directory.roles || []);
      setRows(payroll.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load salary management');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const monthRows = useMemo(() => rows.filter((row) => row.month === month), [rows, month]);
  const payrollByPerson = useMemo(() => {
    const map = new Map();
    monthRows.forEach((row) => map.set(`${row.employeeType}:${row.employeeId}`, row));
    return map;
  }, [monthRows]);
  const personHistory = useMemo(() => {
    if (!employeeKey) return [];
    return rows
      .filter((row) => `${row.employeeType}:${row.employeeId}` === employeeKey)
      .sort((a, b) => String(b.month).localeCompare(String(a.month)));
  }, [rows, employeeKey]);

  const selectedRole = roles.find((item) => item.value === role);
  const employees = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people.filter((person) => {
      if (role && person.roleKey !== role) return false;
      if (!needle) return true;
      return [person.name, person.email, person.phone].join(' ').toLowerCase().includes(needle);
    });
  }, [people, role, query]);

  const person = useMemo(
    () => people.find((item) => payKey(item) === employeeKey) || null,
    [people, employeeKey],
  );
  const pay = person ? payrollByPerson.get(payKey(person)) : null;

  useEffect(() => {
    if (!person) {
      setForm(null);
      return;
    }
    setForm({
      monthlySalary: person.monthlySalary ?? 0,
      department: person.department ?? '',
      joiningDate: person.joiningDate ?? '',
      salaryDate: person.salaryDate ?? '',
      salaryTax: person.salaryTax ?? 0,
      bankAccount: person.bankAccount ?? '',
      ifsc: person.ifsc ?? '',
      upi: person.upi ?? '',
      tax: pay?.tax ?? person.salaryTax ?? 0,
      deductions: pay?.deductions ?? 0,
      notes: pay?.notes || person.workNotes || '',
    });
  }, [person, pay?._id, pay?.tax, pay?.deductions, pay?.notes, person?.monthlySalary, person?.salaryTax, person?.bankAccount, person?.upi, person?.ifsc, person?.department, person?.joiningDate, person?.salaryDate, person?.workNotes]);

  useEffect(() => {
    if (!person) {
      setEditingComp(false);
      setOpenPanel(null);
      return;
    }
    const hasDetails = Number(person.monthlySalary) > 0 || person.bankAccount || person.upi || person.department || person.joiningDate || person.salaryDate || Number(person.salaryTax) > 0;
    setEditingComp(!hasDetails);
    setOpenPanel(hasDetails ? null : 'comp');
  }, [employeeKey, person?.id]);

  const goRoles = () => setParams({});
  const goRole = () => setParams({ role });

  const generate = async () => {
    setBusy('run');
    try {
      await opsApi.create('hr/payroll/run', { month, roleKey: role || undefined });
      await load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not run payroll');
    } finally {
      setBusy('');
    }
  };

  const saveSalary = async () => {
    if (!person || !form) return;
    setBusy('salary');
    try {
      const salaryTax = Number(form.salaryTax || 0);
      await opsApi.create('hr/employment', {
        employeeId: person.id,
        employeeType: person.employeeType,
        name: person.name,
        role: person.role,
        monthlySalary: Number(form.monthlySalary || 0),
        department: form.department || '',
        joiningDate: form.joiningDate || '',
        salaryDate: form.salaryDate || '',
        salaryTax,
        tax: salaryTax,
        bankAccount: form.bankAccount || '',
        ifsc: form.ifsc || '',
        upi: form.upi || '',
        workNotes: form.notes || '',
      });
      if (pay?._id && pay.status !== 'paid') {
        await opsApi.update('hr/payroll', pay._id, { tax: salaryTax });
      }
      setPeople((prev) =>
        prev.map((item) =>
          payKey(item) === payKey(person)
            ? {
                ...item,
                monthlySalary: Number(form.monthlySalary || 0),
                salaryTax,
                department: form.department || '',
                joiningDate: form.joiningDate || '',
                salaryDate: form.salaryDate || '',
                bankAccount: form.bankAccount || '',
                ifsc: form.ifsc || '',
                upi: form.upi || '',
                workNotes: form.notes || '',
              }
            : item
        )
      );
      await load(true);
      setEditingComp(false);
      setOpenPanel(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save salary');
    } finally {
      setBusy('');
    }
  };

  const savePay = async (patch) => {
    if (!pay?._id) return;
    setBusy('pay');
    try {
      await opsApi.update('hr/payroll', pay._id, patch);
      await load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update payroll');
    } finally {
      setBusy('');
    }
  };

  const saveNotes = async () => {
    if (!person || !form) return;
    setBusy('notes');
    try {
      await opsApi.create('hr/employment', {
        employeeId: person.id,
        employeeType: person.employeeType,
        name: person.name,
        role: person.role,
        monthlySalary: Number(form.monthlySalary || person.monthlySalary || 0),
        department: form.department || person.department || '',
        joiningDate: form.joiningDate || person.joiningDate || '',
        salaryDate: form.salaryDate || person.salaryDate || '',
        salaryTax: Number(form.salaryTax ?? person.salaryTax ?? 0),
        tax: Number(form.salaryTax ?? person.salaryTax ?? 0),
        bankAccount: form.bankAccount || person.bankAccount || '',
        ifsc: form.ifsc || person.ifsc || '',
        upi: form.upi || person.upi || '',
        workNotes: form.notes || '',
      });
      if (pay?._id) {
        await opsApi.update('hr/payroll', pay._id, { notes: form.notes || '' });
      }
      setPeople((prev) =>
        prev.map((item) => (payKey(item) === payKey(person) ? { ...item, workNotes: form.notes || '' } : item))
      );
      await load(true);
      setOpenPanel(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save notes');
    } finally {
      setBusy('');
    }
  };

  const setPayStatus = async (status) => {
    if (!person) return;
    if (status === 'paid' && pay?.status === 'paid') return;
    if (status === 'pending' && pay && pay.status !== 'paid') return;
    if (status === 'paid' && !window.confirm(`Mark salary paid for ${person.name}?`)) return;
    setBusy('pay');
    try {
      let row = pay;
      if (!row) {
        const salary = Number(form?.monthlySalary ?? person.monthlySalary ?? 0);
        if (salary <= 0) {
          setError('Save a monthly salary first, then mark paid or not paid.');
          return;
        }
        await opsApi.create('hr/employment', {
          employeeId: person.id,
          employeeType: person.employeeType,
          name: person.name,
          role: person.role,
          monthlySalary: salary,
          department: form?.department || person.department || '',
          joiningDate: form?.joiningDate || person.joiningDate || '',
          salaryDate: form?.salaryDate || person.salaryDate || '',
          salaryTax: Number(form?.salaryTax ?? person.salaryTax ?? 0),
          tax: Number(form?.salaryTax ?? person.salaryTax ?? 0),
          bankAccount: form?.bankAccount || person.bankAccount || '',
          ifsc: form?.ifsc || person.ifsc || '',
          upi: form?.upi || person.upi || '',
        });
        await opsApi.create('hr/payroll/run', {
          month,
          employeeId: String(person.id),
          employeeType: person.employeeType,
        });
        const payroll = await opsApi.list('hr/payroll');
        const list = payroll.data || [];
        setRows(list);
        row = list.find((item) => item.month === month && `${item.employeeType}:${item.employeeId}` === payKey(person));
      }
      if (!row?._id) {
        setError('Could not create payroll for this employee');
        return;
      }
      await opsApi.update('hr/payroll', row._id, { status });
      await load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update salary status');
    } finally {
      setBusy('');
    }
  };

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <HrBackButtons>
          {person ? (
            <button type="button" className={BTN} onClick={goRole}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to employees
            </button>
          ) : role ? (
            <button type="button" className={BTN} onClick={goRoles}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to roles
            </button>
          ) : null}
        </HrBackButtons>
        <p className={PAGE_KICKER}>HR Management</p>
        <h1 className={PAGE_TITLE}>Salary management</h1>
        <p className={PAGE_SUB}>
          {!role
            ? 'Select a role.'
            : person
              ? pretty(selectedRole?.label || role)
              : pretty(selectedRole?.label || role)}
        </p>
      </div>
      {role ? (
        <div className="flex flex-wrap gap-2">
          {!person ? (
            <input type="month" className={`${INPUT} max-w-[170px]`} value={month} onChange={(e) => setMonth(e.target.value)} />
          ) : null}
          <button type="button" onClick={load} className={BTN}><RefreshCw className="mr-1.5 h-4 w-4" />Refresh</button>
          {person ? (
            <button type="button" onClick={generate} disabled={busy === 'run'} className={BTN_PRIMARY}>
              {busy === 'run' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-1.5 h-4 w-4" />}
              Run payroll
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      {header}
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      {loading && !people.length ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !role ? (
        <div className={`${PANEL} overflow-hidden`}>
          {roles.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No roles</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {roles.map((item) => (
                <li key={item.value}>
                  <button
                    type="button"
                    onClick={() => setParams({ role: item.value })}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    {item.label}
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : !employeeKey ? (
        <>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${INPUT} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee" />
          </div>
          <div className={`${PANEL} overflow-hidden`}>
            {employees.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">No employees in this role</p>
            ) : (
              <>
              <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                Status for {labelMonth(month)}. Select an employee, then choose the month and mark Paid or Not paid.
              </p>
              <ul className="divide-y divide-slate-100">
                {employees.map((item) => (
                  <li key={payKey(item)}>
                    <button
                      type="button"
                      onClick={() => setParams({ role, employee: payKey(item) })}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-medium text-slate-800">{item.name}</span>
                      <span className="flex items-center gap-2">
                        {(() => {
                          const row = payrollByPerson.get(payKey(item));
                          if (!row) return <span className="text-xs text-slate-400">Not generated</span>;
                          return <Pill tone={row.status === 'paid' ? 'green' : 'amber'}>{row.status === 'paid' ? 'Paid' : 'Not paid'}</Pill>;
                        })()}
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              </>
            )}
          </div>
        </>
      ) : !person ? (
        <p className="text-sm text-slate-500">Employee not found.</p>
      ) : !form ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          <div className={`${PANEL} overflow-hidden`}>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#217346]">
                {initials(person.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{person.name}</h2>
                  <Pill tone={person.isActive ? 'green' : 'rose'}>{person.isActive ? 'Active' : 'Inactive'}</Pill>
                </div>
                <p className="truncate text-xs text-slate-500">
                  {pretty(person.role)} · {person.phone || person.email || '—'} · Final {inr(Math.max(0, Number(form.monthlySalary || 0) - Number(form.salaryTax || 0)))}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2">
              <div className="flex items-center gap-1">
                <button type="button" className={`${BTN} h-8 min-h-0 px-2`} onClick={() => setMonth((current) => shiftMonth(current, -1))} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="month"
                  className={`${INPUT} h-8 min-h-0 max-w-[160px] py-0 text-sm`}
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
                <button type="button" className={`${BTN} h-8 min-h-0 px-2`} onClick={() => setMonth((current) => shiftMonth(current, 1))} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  disabled={busy === 'pay' || !month}
                  onClick={() => setPayStatus('pending')}
                  className={`px-3 py-1.5 text-xs font-semibold ${pay?.status === 'paid' ? 'text-slate-500 hover:bg-slate-50' : 'bg-amber-100 text-amber-900'}`}
                >
                  Not paid
                </button>
                <button
                  type="button"
                  disabled={busy === 'pay' || !month}
                  onClick={() => setPayStatus('paid')}
                  className={`px-3 py-1.5 text-xs font-semibold ${pay?.status === 'paid' ? 'bg-emerald-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {busy === 'pay' ? 'Saving…' : 'Paid'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <section className={`${PANEL} p-3`}>
              <FoldHeader
                title="This month"
                open={openPanel === 'month'}
                onToggle={() => togglePanel('month')}
                summary={
                  pay
                    ? `${pay.status === 'paid' ? 'Paid' : 'Not paid'} · final ${inr(pay.net)}`
                    : 'Not generated'
                }
              />
              {openPanel === 'month' ? (pay ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Gross</p>
                      <p className="mt-1 text-lg font-bold tabular-nums">{inr(pay.gross)}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Final salary</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-[#217346]">{inr(pay.net)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax</p>
                      <p className="mt-1 text-lg font-bold tabular-nums">{inr(pay.tax)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Deductions</p>
                      <p className="mt-1 text-lg font-bold tabular-nums">{inr(pay.deductions)}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Tax">
                      {pay.status === 'paid' ? (
                        <p className="py-2.5 text-sm font-semibold tabular-nums">{inr(pay.tax)}</p>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          className={INPUT}
                          value={form.tax}
                          onChange={(e) => setForm((p) => ({ ...p, tax: e.target.value }))}
                          onBlur={(e) => savePay({ tax: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Deductions">
                      {pay.status === 'paid' ? (
                        <p className="py-2.5 text-sm font-semibold tabular-nums">{inr(pay.deductions)}</p>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          className={INPUT}
                          value={form.deductions}
                          onChange={(e) => setForm((p) => ({ ...p, deductions: e.target.value }))}
                          onBlur={(e) => savePay({ deductions: e.target.value })}
                        />
                      )}
                    </Field>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-600">Payrun</p>
                      <p className="py-2 text-sm text-slate-700">{pay.payrunId || '—'}</p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-600">Paid on</p>
                      <p className="py-2 text-sm text-slate-700">{pay.paidAt ? new Date(pay.paidAt).toLocaleDateString('en-IN') : 'Not paid'}</p>
                    </div>
                  </div>
                  <Field label="Notes">
                    <textarea
                      rows={3}
                      className={INPUT}
                      value={form.notes ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    />
                    <button type="button" disabled={busy === 'notes'} onClick={saveNotes} className={`${BTN} mt-2`}>
                      {busy === 'notes' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                      Save notes
                    </button>
                  </Field>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">Salary not generated</p>
                    <p className="mt-1 text-xs text-slate-400">Save a monthly salary, then click Run payroll.</p>
                  </div>
                  <Field label="Notes">
                    <textarea
                      rows={3}
                      className={INPUT}
                      value={form.notes ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    />
                    <button type="button" disabled={busy === 'notes'} onClick={saveNotes} className={`${BTN} mt-2`}>
                      {busy === 'notes' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                      Save notes
                    </button>
                  </Field>
                </div>
              )) : null}
            </section>

            <section className={`${PANEL} p-3`}>
              <FoldHeader
                title="Compensation & bank"
                open={openPanel === 'comp'}
                onToggle={() => togglePanel('comp')}
                summary={`${inr(Math.max(0, Number(form.monthlySalary || 0) - Number(form.salaryTax || 0)))} final · tax ${inr(form.salaryTax)}`}
                extra={
                  !editingComp ? (
                    <button
                      type="button"
                      className={BTN}
                      onClick={() => {
                        setOpenPanel('comp');
                        setEditingComp(true);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </button>
                  ) : null
                }
              />
              {openPanel === 'comp' ? (editingComp ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Monthly salary">
                      <input type="number" min="0" className={INPUT} value={form.monthlySalary} onChange={(e) => setForm((p) => ({ ...p, monthlySalary: e.target.value }))} />
                    </Field>
                    <Field label="Tax">
                      <input type="number" min="0" className={INPUT} value={form.salaryTax ?? 0} onChange={(e) => setForm((p) => ({ ...p, salaryTax: e.target.value }))} />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Final salary {inr(Math.max(0, Number(form.monthlySalary || 0) - Number(form.salaryTax || 0)))}
                      </p>
                    </Field>
                    <Field label="Department">
                      <input className={INPUT} value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
                    </Field>
                    <Field label="Joining date">
                      <input type="date" className={INPUT} value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} />
                    </Field>
                    <Field label="Salary date">
                      <input type="date" className={INPUT} value={form.salaryDate} onChange={(e) => setForm((p) => ({ ...p, salaryDate: e.target.value }))} />
                    </Field>
                    <Field label="Bank / account">
                      <input className={INPUT} value={form.bankAccount} onChange={(e) => setForm((p) => ({ ...p, bankAccount: e.target.value }))} />
                    </Field>
                    <Field label="IFSC">
                      <input className={INPUT} value={form.ifsc} onChange={(e) => setForm((p) => ({ ...p, ifsc: e.target.value }))} />
                    </Field>
                    <Field label="UPI">
                      <input className={INPUT} value={form.upi} onChange={(e) => setForm((p) => ({ ...p, upi: e.target.value }))} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Notes">
                        <textarea rows={3} className={INPUT} value={form.notes ?? ''} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                      </Field>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={busy === 'salary'} onClick={saveSalary} className={BTN_PRIMARY}>
                      {busy === 'salary' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                      Save salary details
                    </button>
                    <button
                      type="button"
                      className={BTN}
                      onClick={() => {
                        setEditingComp(false);
                        setOpenPanel(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  {[
                    ['Monthly salary', inr(form.monthlySalary)],
                    ['Tax', inr(form.salaryTax)],
                    ['Final salary', inr(Math.max(0, Number(form.monthlySalary || 0) - Number(form.salaryTax || 0)))],
                    ['Department', form.department || '—'],
                    ['Joining date', formatDate(form.joiningDate)],
                    ['Salary date', formatDate(form.salaryDate)],
                    ['Bank / account', form.bankAccount || '—'],
                    ['IFSC', form.ifsc || '—'],
                    ['UPI', form.upi || '—'],
                    ['Notes', form.notes || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              )) : null}
            </section>

            <section className={`${PANEL} p-3`}>
            <FoldHeader
              title="Payment history"
              open={openPanel === 'history'}
              onToggle={() => togglePanel('history')}
              summary={
                personHistory.length
                  ? `${personHistory.length} month${personHistory.length === 1 ? '' : 's'}`
                  : 'No records'
              }
            />
            {openPanel === 'history' ? (
              personHistory.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No payroll records yet</p>
              ) : (
                <div className="-mx-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#F2F2F2]">
                      <tr>
                        {['Month', 'Monthly salary', 'Tax', 'Deductions', 'Final salary', 'Status', 'Paid on'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {personHistory.map((row) => (
                        <tr key={row._id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2.5 font-medium">{labelMonth(row.month)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{inr(row.gross)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{inr(row.tax)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{inr(row.deductions)}</td>
                          <td className="px-4 py-2.5 font-semibold tabular-nums text-[#217346]">{inr(row.net)}</td>
                          <td className="px-4 py-2.5">
                            <Pill tone={row.status === 'paid' ? 'green' : 'amber'}>{row.status === 'paid' ? 'Paid' : 'Not paid'}</Pill>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{row.paidAt ? new Date(row.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : null}
          </section>
          </div>
        </div>
      )}
    </div>
  );
}
