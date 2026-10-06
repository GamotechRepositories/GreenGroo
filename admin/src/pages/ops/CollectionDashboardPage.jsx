import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, ClipboardList, Loader2, RefreshCw, Store, Tractor, UserRound } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, PANEL_HEAD, TD, TH } from '../../utils/ui';
import { StatusPill, formatDate } from './multiVendorShared';

function StatTile({ to, icon: Icon, label, value, lines }) {
  return (
    <Link to={to} className={`${PANEL} block p-4 transition hover:border-emerald-300 hover:shadow`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <Icon className="h-4 w-4 text-emerald-700" />
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-2 space-y-0.5 text-xs text-slate-500">
        {lines.map(([text, count]) => (
          <div key={text} className="flex justify-between">
            <span>{text}</span>
            <span className="font-semibold text-slate-700">{count}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

function CountLink({ to, value }) {
  if (!value) return <span className="text-slate-400">0</span>;
  return (
    <Link to={to} onClick={(e) => e.stopPropagation()} className="font-semibold text-emerald-700 hover:underline">
      {value}
    </Link>
  );
}

export default function CollectionDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await opsApi.get('collection-dashboard');
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading dashboard
      </div>
    );
  }

  const {
    centres,
    farmers,
    managers,
    darkStores,
    requests,
    productRequests = {},
    cropRequests = {},
    documentTypes,
    centreRows = [],
    recentRequests = [],
  } = data || {};

  const attention = data
    ? [
        requests.Pending > 0 && {
          text: `${requests.Pending} dark store request${requests.Pending === 1 ? '' : 's'} waiting for approval`,
          to: '/dark-store-requests',
        },
        productRequests.Pending > 0 && {
          text: `${productRequests.Pending} product request${productRequests.Pending === 1 ? '' : 's'} waiting for approval`,
          to: '/vendor-product-requests',
        },
        cropRequests.Pending > 0 && {
          text: `${cropRequests.Pending} crop request${cropRequests.Pending === 1 ? '' : 's'} waiting for approval`,
          to: '/vendor-crop-requests',
        },
        centres.pending > 0 && {
          text: `${centres.pending} collection centre${centres.pending === 1 ? '' : 's'} pending activation`,
          to: '/multi-vendor',
        },
        centres.withoutDocuments > 0 && {
          text: `${centres.withoutDocuments} collection centre${centres.withoutDocuments === 1 ? '' : 's'} with no documents uploaded`,
          to: '/multi-vendor',
        },
        darkStores.unassigned > 0 && {
          text: `${darkStores.unassigned} dark store${darkStores.unassigned === 1 ? '' : 's'} not assigned to any collection centre`,
          to: '/dark-stores',
        },
        farmers.unassignedManager > 0 && {
          text: `${farmers.unassignedManager} farmer${farmers.unassignedManager === 1 ? '' : 's'} without a farmer manager`,
          to: '/collection-farmers',
        },
        farmers.outsideCentres > 0 && {
          text: `${farmers.outsideCentres} farmer${farmers.outsideCentres === 1 ? '' : 's'} linked to a collection centre that no longer exists`,
          to: '/collection-farmers',
        },
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Multi Vendor · Collection Centre</p>
          <h1 className={PAGE_TITLE}>Dashboard</h1>
          <p className={PAGE_SUB}>Collection centres, farmers, farmer managers and dark stores at a glance</p>
        </div>
        <button type="button" onClick={load} className={BTN}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatTile
              to="/multi-vendor"
              icon={Building2}
              label="Collection centres"
              value={centres.total}
              lines={[
                ['Active', centres.active],
                ['Pending', centres.pending],
                ['Inactive / suspended', centres.inactive],
              ]}
            />
            <StatTile
              to="/collection-farmers"
              icon={Tractor}
              label="Farmers"
              value={farmers.total}
              lines={[
                ['Active', farmers.active],
                ['Pending', farmers.pending],
                ['Without manager', farmers.unassignedManager],
              ]}
            />
            <StatTile
              to="/collection-farmer-managers"
              icon={UserRound}
              label="Farmer managers"
              value={managers.total}
              lines={[
                ['Active', managers.active],
                ['Inactive', managers.inactive],
              ]}
            />
            <StatTile
              to="/dark-stores"
              icon={Store}
              label="Dark stores"
              value={darkStores.total}
              lines={[
                ['Active', darkStores.active],
                ['Assigned to a centre', darkStores.assigned],
                ['Not assigned', darkStores.unassigned],
              ]}
            />
            <StatTile
              to="/dark-store-requests"
              icon={ClipboardList}
              label="Dark store requests"
              value={requests.Pending}
              lines={[
                ['Approved', requests.Approved],
                ['Rejected', requests.Rejected],
                ['Cancelled', requests.Cancelled],
              ]}
            />
          </div>

          {attention.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900">
                <AlertTriangle className="h-4 w-4" /> Needs attention
              </div>
              <ul className="space-y-1 text-sm text-amber-900">
                {attention.map((item) => (
                  <li key={item.text}>
                    <Link to={item.to} className="hover:underline">
                      {item.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={`${PANEL} overflow-hidden`}>
            <div className={PANEL_HEAD}>Collection centre wise</div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className={TH}>Collection centre</th>
                    <th className={TH}>Location</th>
                    <th className={TH}>Status</th>
                    <th className={TH}>Farmers</th>
                    <th className={TH}>Farmer managers</th>
                    <th className={TH}>Dark stores</th>
                    <th className={TH}>Products</th>
                    <th className={TH}>Crops</th>
                    <th className={TH}>Pending requests</th>
                    <th className={TH}>Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {centreRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">
                        No collection centres yet
                      </td>
                    </tr>
                  ) : (
                    centreRows.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/multi-vendor/${c.id}`)}
                        className="cursor-pointer hover:bg-emerald-50/40"
                      >
                        <td className={TD}>
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-400">{c.centreId || c.id}</div>
                        </td>
                        <td className={TD}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                        <td className={TD}>
                          <StatusPill status={c.status} />
                        </td>
                        <td className={TD}>
                          <CountLink to={`/collection-farmers?vendorId=${encodeURIComponent(c.id)}`} value={c.farmers} />
                          {c.farmers ? <span className="ml-1 text-xs text-slate-400">({c.activeFarmers} active)</span> : null}
                        </td>
                        <td className={TD}>
                          <CountLink to={`/collection-farmer-managers?vendorId=${encodeURIComponent(c.id)}`} value={c.managers} />
                        </td>
                        <td className={TD}>
                          <CountLink to="/dark-stores" value={c.darkStores} />
                          {c.darkStores ? <span className="ml-1 text-xs text-slate-400">({c.activeDarkStores} active)</span> : null}
                        </td>
                        <td className={TD}>
                          <CountLink to={`/multi-vendor/${c.id}`} value={c.products} />
                        </td>
                        <td className={TD}>
                          <CountLink to={`/multi-vendor/${c.id}`} value={c.crops} />
                        </td>
                        <td className={TD}>
                          {c.pendingRequests || c.pendingProductRequests || c.pendingCropRequests ? (
                            <span className="flex flex-col text-xs">
                              {c.pendingRequests ? (
                                <Link to="/dark-store-requests" onClick={(e) => e.stopPropagation()} className="font-semibold text-emerald-700 hover:underline">
                                  {c.pendingRequests} dark store
                                </Link>
                              ) : null}
                              {c.pendingProductRequests ? (
                                <Link to="/vendor-product-requests" onClick={(e) => e.stopPropagation()} className="font-semibold text-emerald-700 hover:underline">
                                  {c.pendingProductRequests} product
                                </Link>
                              ) : null}
                              {c.pendingCropRequests ? (
                                <Link to="/vendor-crop-requests" onClick={(e) => e.stopPropagation()} className="font-semibold text-emerald-700 hover:underline">
                                  {c.pendingCropRequests} crop
                                </Link>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className={TD}>
                          <span className={c.documents >= documentTypes ? 'font-semibold text-emerald-700' : 'text-slate-600'}>
                            {c.documents}/{documentTypes}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`${PANEL} overflow-hidden`}>
            <div className={`${PANEL_HEAD} flex items-center justify-between`}>
              <span>Latest dark store requests waiting for approval</span>
              <Link to="/dark-store-requests" className="text-xs font-semibold text-emerald-700 hover:underline">
                View all
              </Link>
            </div>
            {recentRequests.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400">No pending requests</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-900">{r.storeName}</div>
                      <div className="text-xs text-slate-500">
                        {[r.area, r.city].filter(Boolean).join(', ')} · from{' '}
                        <Link to={`/multi-vendor/${r.vendorId}`} className="text-emerald-700 hover:underline">
                          {r.vendorName}
                        </Link>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
