import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, RefreshCw, Search, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui';
import { StatusPill, formatDate } from './multiVendorShared';
import { CentreCell, CentreFilter, displayStatus, useCentreOptions, useDebounced } from './centreListShared';

const PAGE_SIZE = 25;

export default function CentreFarmersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const vendorId = params.get('vendorId') || '';
  const managerId = params.get('managerId') || '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [perCentre, setPerCentre] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const centres = useCentreOptions();
  const q = useDebounced(search);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    opsApi
      .list('collection-farmers', { q, status, vendorId, managerId, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!alive) return;
        setRows(res.data || []);
        setTotal(res.total || 0);
        setPerCentre(res.perCentre || {});
        setError('');
      })
      .catch((err) => alive && setError(err.response?.data?.message || 'Failed to load farmers'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, status, vendorId, managerId, page, reloadKey]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const managerName = managerId ? rows.find((r) => r.managerId === managerId)?.managerName || managerId : '';

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Multi Vendor · Collection Centre</p>
          <h1 className={PAGE_TITLE}>All Farmers</h1>
          <p className={PAGE_SUB}>Every farmer and the collection centre they supply</p>
        </div>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={BTN}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className={`${PANEL} flex flex-col gap-3 p-4 lg:flex-row lg:items-center`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, mobile, farmer ID, village…"
            className={`${INPUT} pl-9`}
          />
        </div>
        <CentreFilter centres={centres} value={vendorId} counts={perCentre} onChange={(v) => setParam('vendorId', v)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${INPUT} lg:w-40`}>
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {managerId ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          Showing farmers of manager <span className="font-semibold text-slate-900">{managerName}</span>
          <button
            type="button"
            onClick={() => setParam('managerId', '')}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold hover:bg-slate-200"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className={`${PANEL} overflow-x-auto`}>
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              <th className={TH}>Farmer</th>
              <th className={TH}>Mobile</th>
              <th className={TH}>Village / Taluka / District</th>
              <th className={TH}>Collection centre</th>
              <th className={TH}>Farmer manager</th>
              <th className={TH}>Status</th>
              <th className={TH}>Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading farmers
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  No farmers found
                </td>
              </tr>
            ) : (
              rows.map((farmer) => (
                <tr
                  key={farmer.id}
                  onClick={() => navigate(`/erp/farmers/${encodeURIComponent(farmer.id)}`)}
                  className="cursor-pointer hover:bg-emerald-50/40"
                >
                  <td className={TD}>
                    <div className="font-semibold text-slate-900">{farmer.name}</div>
                    <div className="text-xs text-slate-400">{farmer.id}</div>
                  </td>
                  <td className={TD}>{farmer.mobile || '—'}</td>
                  <td className={TD}>
                    {[farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className={TD}>
                    <CentreCell row={farmer} />
                  </td>
                  <td className={TD} onClick={(e) => e.stopPropagation()}>
                    {farmer.managerId ? (
                      <Link
                        to={`/collection-farmers?managerId=${encodeURIComponent(farmer.managerId)}`}
                        onClick={() => setPage(1)}
                        className="text-emerald-700 hover:underline"
                      >
                        {farmer.managerName || farmer.managerId}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className={TD}>
                    <StatusPill status={displayStatus(farmer.status)} />
                  </td>
                  <td className={TD}>{formatDate(farmer.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {total} farmer{total === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`${BTN} disabled:opacity-40`}>
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className={`${BTN} disabled:opacity-40`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
