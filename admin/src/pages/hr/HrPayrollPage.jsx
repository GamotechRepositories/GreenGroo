import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Loader2, RefreshCw } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { inr, Pill } from './hrShared';

export default function HrPayrollPage() {
  const [tab, setTab] = useState('dashboard');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await opsApi.list('hr/payroll', { month });
      setRows(res.data || []);
      setStats(res.stats || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payroll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const generate = async () => {
    setBusy('run');
    try {
      await opsApi.create('hr/payroll/run', { month });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not run payroll');
    } finally {
      setBusy('');
    }
  };

  const markPaid = async (row) => {
    if (!window.confirm(`Mark paid for ${row.name}?`)) return;
    setBusy(row._id);
    try {
      await opsApi.update('hr/payroll', row._id, { status: 'paid' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not mark paid');
    } finally {
      setBusy('');
    }
  };

  const saveTax = async (row, tax) => {
    await opsApi.update('hr/payroll', row._id, { tax: Number(tax || 0) });
    await load();
  };

  const pending = rows.filter((row) => row.status !== 'paid');
  const paid = rows.filter((row) => row.status === 'paid');
  const visible = tab === 'paydone' ? paid : tab === 'payrun' || tab === 'payments' ? pending : tab === 'taxes' ? rows : rows;

  const cards = [
    { id: 'dashboard', label: 'Salary dashboard', value: inr((stats?.pendingAmount || 0) + (stats?.paidAmount || 0)) },
    { id: 'payrun', label: 'Payrun', value: stats?.pendingCount ?? pending.length },
    { id: 'paydone', label: 'Pay done', value: stats?.paidCount ?? paid.length },
    { id: 'payments', label: 'Payments', value: inr(stats?.pendingAmount || 0) },
    { id: 'taxes', label: 'Taxes', value: inr(stats?.taxAmount || 0) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Payroll</h1>
          <p className={PAGE_SUB}>Salary dashboard, payruns, payments, and tax deductions.</p>
        </div>
        <div className="flex gap-2">
          <input type="month" className={`${INPUT} max-w-[170px]`} value={month} onChange={(e) => setMonth(e.target.value)} />
          <button type="button" onClick={load} className={BTN}><RefreshCw className="mr-1.5 h-4 w-4" />Refresh</button>
          <button type="button" onClick={generate} disabled={busy === 'run'} className={BTN_PRIMARY}>
            {busy === 'run' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-1.5 h-4 w-4" />}
            Run payroll
          </button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((card) => (
          <button key={card.id} type="button" onClick={() => setTab(card.id)} className={`${PANEL} px-4 py-3 text-left ${tab === card.id ? 'ring-2 ring-emerald-700/20' : ''}`}>
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-1 text-lg font-bold">{card.value}</p>
          </button>
        ))}
      </div>

      {stats?.payruns?.length ? <p className="text-xs text-slate-500">Payruns: {stats.payruns.join(', ')}</p> : null}

      <div className={PANEL}>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <PayrollTable rows={visible} onPaid={markPaid} onTax={saveTax} busy={busy} showTax={tab === 'taxes' || tab === 'dashboard'} />
        )}
      </div>
    </div>
  );
}

function PayrollTable({ rows, onPaid, onTax, busy, showTax }) {
  const [taxDraft, setTaxDraft] = useState({});
  const local = useMemo(() => rows, [rows]);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#F2F2F2]">
          <tr>
            {['Person', 'Month', 'Gross', 'Tax', 'Net', 'Status', ''].map((h) => <th key={h || 'a'} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {local.length === 0 ? (
            <tr><td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-400">No payroll rows</td></tr>
          ) : local.map((row) => (
            <tr key={row._id} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-2.5"><p className="font-semibold">{row.name}</p><p className="text-[11px] text-slate-400">{row.role}</p></td>
              <td className="px-3 py-2.5 text-xs">{row.month}<br /><span className="text-slate-400">{row.payrunId || ''}</span></td>
              <td className="px-3 py-2.5 tabular-nums">{inr(row.gross)}</td>
              <td className="px-3 py-2.5">
                {showTax && row.status !== 'paid' ? (
                  <input
                    type="number"
                    min="0"
                    className={`${INPUT} max-w-[110px]`}
                    value={taxDraft[row._id] ?? row.tax ?? 0}
                    onChange={(e) => setTaxDraft((p) => ({ ...p, [row._id]: e.target.value }))}
                    onBlur={(e) => onTax(row, e.target.value)}
                  />
                ) : inr(row.tax)}
              </td>
              <td className="px-3 py-2.5 font-semibold tabular-nums">{inr(row.net)}</td>
              <td className="px-3 py-2.5"><Pill tone={row.status === 'paid' ? 'green' : 'amber'}>{row.status}</Pill></td>
              <td className="px-3 py-2.5 text-right">
                {row.status !== 'paid' ? (
                  <button type="button" disabled={busy === row._id} className={`${BTN_PRIMARY} h-8 min-h-0 px-2.5 text-xs`} onClick={() => onPaid(row)}>Mark paid</button>
                ) : (
                  <span className="text-[11px] text-slate-400">{row.paidAt ? new Date(row.paidAt).toLocaleDateString('en-IN') : ''}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
