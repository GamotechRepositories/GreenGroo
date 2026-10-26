import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { catalogRequestsApi } from '../../api/vendorCatalogClient';
import { useLive } from '../../realtime/useLive';
import { BTN, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui';

const STATUS_TABS = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'all'];
const STATUS_TONE = {
  Pending: 'border-amber-200 text-amber-700',
  Approved: 'border-emerald-200 text-emerald-700',
  Rejected: 'border-red-200 text-red-700',
  Cancelled: 'border-slate-200 text-slate-500',
};
const ACTION_LABEL = { create: 'Add', update: 'Edit', delete: 'Delete' };

const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function VendorCatalogRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Pending');
  const [busyId, setBusyId] = useState('');

  const load = async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await catalogRequestsApi.list();
      setRequests(res?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useLive(load, []);

  const counts = useMemo(() => {
    const c = { all: requests.length };
    for (const r of requests) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [requests]);
  const visible = tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  const cancel = async (request) => {
    if (!window.confirm(`Cancel this ${request.kind} request?`)) return;
    setBusyId(request.id);
    try {
      await catalogRequestsApi.cancel(request.id);
      await load({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to cancel request');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={PAGE_KICKER}>Catalog</div>
          <h1 className={PAGE_TITLE}>Approval requests</h1>
          <p className={PAGE_SUB}>
            Every product and category you add, edit or delete waits here until admin approves it.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/vendor/catalog" className={BTN}>
            My catalog products
          </Link>
          <button type="button" onClick={() => load()} disabled={loading} className={BTN}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {STATUS_TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              tab === key ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {key === 'all' ? 'All' : key}
            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      <div className={`${PANEL} overflow-x-auto`}>
        {loading ? (
          <p className="p-4 text-sm text-slate-400">Loading requests…</p>
        ) : visible.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No requests here.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                <th className={TH}>Request</th>
                <th className={TH}>Item</th>
                <th className={TH}>Section</th>
                <th className={TH}>Sent</th>
                <th className={TH}>Status</th>
                <th className={TH}>Admin remarks</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className={TD}>
                    <div className="font-semibold capitalize text-slate-900">
                      {ACTION_LABEL[r.action] || r.action} {r.kind}
                    </div>
                    <div className="text-[11px] text-slate-400">{r.id}</div>
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      {r.image ? <img src={r.image} alt="" className="h-9 w-9 rounded object-cover" /> : null}
                      <span className="font-medium text-slate-800">{r.targetName || '—'}</span>
                    </div>
                  </td>
                  <td className={TD}>
                    <span className="text-xs capitalize text-slate-600">{r.section || '—'}</span>
                  </td>
                  <td className={TD}>
                    <span className="text-xs text-slate-600">{fmtDateTime(r.createdAt)}</span>
                  </td>
                  <td className={TD}>
                    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_TONE[r.status] || ''}`}>
                      {r.status}
                    </span>
                    {r.reviewedAt ? <div className="mt-0.5 text-[11px] text-slate-400">{fmtDateTime(r.reviewedAt)}</div> : null}
                  </td>
                  <td className={TD}>
                    <span className="max-w-[240px] text-xs text-slate-600">{r.adminRemarks || '—'}</span>
                  </td>
                  <td className={TD}>
                    {r.status === 'Pending' ? (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => cancel(r)}
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    ) : null}
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
