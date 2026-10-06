import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui';
import { StatusPill, formatDate } from './multiVendorShared';
import { CentreCell, CentreFilter, useCentreOptions, useDebounced } from './centreListShared';

export default function CentreFarmerManagersPage() {
  const [params, setParams] = useSearchParams();
  const vendorId = params.get('vendorId') || '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState([]);
  const [perCentre, setPerCentre] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const centres = useCentreOptions();
  const q = useDebounced(search);

  const setCentre = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('vendorId', value);
    else next.delete('vendorId');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    opsApi
      .list('collection-farmer-managers', { q, status, vendorId })
      .then((res) => {
        if (!alive) return;
        setRows(res.data || []);
        setPerCentre(res.perCentre || {});
        setError('');
      })
      .catch((err) => alive && setError(err.response?.data?.message || 'Failed to load farmer managers'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, status, vendorId, reloadKey]);

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Multi Vendor · Collection Centre</p>
          <h1 className={PAGE_TITLE}>All Farmer Managers</h1>
          <p className={PAGE_SUB}>Every farmer manager, their collection centre and how many farmers they handle</p>
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
            placeholder="Search name, mobile, email, city…"
            className={`${INPUT} pl-9`}
          />
        </div>
        <CentreFilter centres={centres} value={vendorId} counts={perCentre} onChange={setCentre} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${INPUT} lg:w-40`}>
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className={`${PANEL} overflow-x-auto`}>
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              <th className={TH}>Farmer manager</th>
              <th className={TH}>Contact</th>
              <th className={TH}>Location</th>
              <th className={TH}>Collection centre</th>
              <th className={TH}>Farmers</th>
              <th className={TH}>Status</th>
              <th className={TH}>Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading farmer managers
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  No farmer managers found
                </td>
              </tr>
            ) : (
              rows.map((manager) => (
                <tr key={manager.id} className="hover:bg-slate-50/60">
                  <td className={TD}>
                    <div className="font-semibold text-slate-900">{manager.name}</div>
                    <div className="text-xs text-slate-400">{manager.managerCode || manager.id}</div>
                  </td>
                  <td className={TD}>
                    <div>{manager.mobile || '—'}</div>
                    {manager.email ? <div className="text-xs text-slate-400">{manager.email}</div> : null}
                  </td>
                  <td className={TD}>{manager.location || '—'}</td>
                  <td className={TD}>
                    <CentreCell row={manager} />
                  </td>
                  <td className={TD}>
                    {manager.farmerCount > 0 ? (
                      <Link
                        to={`/collection-farmers?managerId=${encodeURIComponent(manager.id)}`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        {manager.farmerCount} farmer{manager.farmerCount === 1 ? '' : 's'}
                      </Link>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className={TD}>
                    <StatusPill status={manager.status} />
                  </td>
                  <td className={TD}>{formatDate(manager.joiningDate || manager.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-slate-500">
        {rows.length} farmer manager{rows.length === 1 ? '' : 's'}
      </div>
    </div>
  );
}
