import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';
import { useLive } from '../../realtime/useLive';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui';

const STATUS_TABS = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'all'];
const STATUS_TONE = {
  Pending: 'border-amber-200 text-amber-700',
  Approved: 'border-emerald-200 text-emerald-700',
  Rejected: 'border-red-200 text-red-700',
  Cancelled: 'border-slate-200 text-slate-500',
};
const ACTION_LABEL = { create: 'Add', update: 'Edit', delete: 'Delete' };
const PRODUCT_SUMMARY_FIELDS = [
  'name', 'section', 'categories', 'subcategory', 'brandName', 'unit', 'price', 'discountedPrice', 'stock', 'inStock',
  'isActive', 'varietyName', 'description',
];
const CATEGORY_SUMMARY_FIELDS = ['categoryName', 'section', 'sectionName', 'subcategories', 'isActive'];
const IGNORED_DIFF_KEYS = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'ownerVendorId', 'ownerManagerId', 'pendingRequest']);

const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

function fmtValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    if (value.every((v) => typeof v !== 'object')) return value.join(', ');
    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 160);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value).slice(0, 200);
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function changeRows(request) {
  const payload = request.payload || {};
  if (request.action === 'update' && request.current) {
    return Object.keys(payload)
      .filter((key) => !IGNORED_DIFF_KEYS.has(key) && !same(payload[key], request.current[key]))
      .map((key) => ({ key, before: request.current[key], after: payload[key] }));
  }
  const fields = request.kind === 'product' ? PRODUCT_SUMMARY_FIELDS : CATEGORY_SUMMARY_FIELDS;
  return fields.filter((key) => payload[key] !== undefined).map((key) => ({ key, after: payload[key] }));
}

export default function VendorCatalogRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('Pending');
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [openId, setOpenId] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useLive(
    async ({ silent }) => {
      if (!silent) setLoading(true);
      try {
        const { data } = await apiClient.get('/admin-ops/vendor-catalog-requests', { params: { status, kind } });
        setRequests(data?.data || []);
        setCounts(data?.counts || {});
        setError('');
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load vendor catalog requests');
      } finally {
        setLoading(false);
      }
    },
    [status, kind, reloadKey],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      [r.vendorName, r.vendorId, r.targetName, r.section, r.id].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [requests, query]);

  const act = async (request, decision) => {
    let remarks = '';
    if (decision === 'reject') {
      remarks = window.prompt(`Reason for rejecting "${request.targetName || request.id}"?`)?.trim() || '';
      if (!remarks) return;
    } else if (!window.confirm(`Approve: ${ACTION_LABEL[request.action]} ${request.kind} "${request.targetName || request.id}"?`)) {
      return;
    }
    setBusyId(request.id);
    setError('');
    setNotice('');
    try {
      const { data } = await apiClient.post(`/admin-ops/vendor-catalog-requests/${encodeURIComponent(request.id)}/${decision}`, { remarks });
      setNotice(data?.message || 'Done');
      setRequests((prev) => prev.filter((r) => r.id !== request.id || status === 'all'));
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${decision} request`);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <div className={PAGE_KICKER}>Multi vendor</div>
        <h1 className={PAGE_TITLE}>Vendor catalog requests</h1>
        <p className={PAGE_SUB}>
          Products and categories vendors want to add, edit or delete. Nothing changes in the live catalog until you approve it.
        </p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div> : null}

      <div className={`${PANEL} flex flex-wrap items-center gap-2 p-4`}>
        <select className={`${INPUT} w-auto py-1.5`} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="all">Products & categories</option>
          <option value="product">Products</option>
          <option value="category">Categories</option>
        </select>
        <input
          className={`${INPUT} w-full py-1.5 sm:w-72`}
          placeholder="Vendor, item, section or request id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={`${BTN} ml-auto`} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {STATUS_TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              status === key ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {key === 'all' ? 'All' : key}
            {key !== 'all' ? (
              <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{counts[key] || 0}</span>
            ) : null}
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
                <th className={TH} />
                <th className={TH}>Request</th>
                <th className={TH}>Vendor</th>
                <th className={TH}>Item</th>
                <th className={TH}>Section</th>
                <th className={TH}>Sent</th>
                <th className={TH}>Status</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((r) => {
                const open = openId === r.id;
                const rows = open ? changeRows(r) : [];
                return (
                  <Fragment key={r.id}>
                    <tr className="align-top">
                      <td className={TD}>
                        <button type="button" onClick={() => setOpenId(open ? '' : r.id)} className="text-slate-400 hover:text-slate-700">
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className={TD}>
                        <div className="font-semibold capitalize text-slate-900">
                          {ACTION_LABEL[r.action] || r.action} {r.kind}
                        </div>
                        <div className="text-[11px] text-slate-400">{r.id}</div>
                      </td>
                      <td className={TD}>
                        <div className="font-medium text-slate-800">{r.vendorName || '—'}</div>
                        <div className="text-[11px] text-slate-500">{r.vendorId}</div>
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
                        {r.adminRemarks ? <div className="mt-0.5 max-w-[200px] text-[11px] text-slate-500">{r.adminRemarks}</div> : null}
                      </td>
                      <td className={TD}>
                        {r.status === 'Pending' ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => act(r, 'approve')}
                              className={`${BTN_PRIMARY} px-3 py-1 text-xs`}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => act(r, 'reject')}
                              className={`${BTN} px-3 py-1 text-xs text-red-600`}
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                    {open ? (
                      <tr className="bg-slate-50/60">
                        <td />
                        <td colSpan={7} className="px-4 py-3">
                          {r.action === 'delete' ? (
                            <p className="text-sm text-slate-700">
                              The vendor wants to delete this {r.kind}
                              {r.current ? '' : ' (it no longer exists)'}.
                            </p>
                          ) : rows.length === 0 ? (
                            <p className="text-sm text-slate-500">No field changes compared to the live {r.kind}.</p>
                          ) : (
                            <table className="text-xs">
                              <thead>
                                <tr className="text-left text-slate-500">
                                  <th className="pb-1 pr-6 font-medium">Field</th>
                                  {r.action === 'update' ? <th className="pb-1 pr-6 font-medium">Live value</th> : null}
                                  <th className="pb-1 font-medium">{r.action === 'update' ? 'Requested value' : 'Value'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row) => (
                                  <tr key={row.key} className="align-top">
                                    <td className="py-0.5 pr-6 font-medium text-slate-700">{row.key}</td>
                                    {r.action === 'update' ? <td className="py-0.5 pr-6 text-slate-500">{fmtValue(row.before)}</td> : null}
                                    <td className="py-0.5 text-slate-900">{fmtValue(row.after)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
