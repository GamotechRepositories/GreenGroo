import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronDown, ChevronRight, Leaf, Loader2, RefreshCw, Search } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui';
import { StatusPill } from './multiVendorShared';
import { CentreCell, CentreFilter, displayStatus, useCentreOptions, useDebounced } from './centreListShared';

const PAGE_SIZE = 25;

export default function AdminFarmerCropsPage() {
  const [search, setSearch] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalCrops, setTotalCrops] = useState(0);
  const [perCentre, setPerCentre] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [openId, setOpenId] = useState('');
  const centres = useCentreOptions();
  const q = useDebounced(search);

  useEffect(() => {
    setPage(1);
  }, [q, vendorId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    opsApi
      .list('collection-farmer-crops', { q, vendorId, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!alive) return;
        setRows(Array.isArray(res.data) ? res.data : []);
        setTotal(res.total || 0);
        setTotalCrops(res.totalCrops || 0);
        setPerCentre(res.perCentre || {});
        setError('');
      })
      .catch((err) => alive && setError(err.response?.data?.message || 'Failed to load farmer crops'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, vendorId, page, reloadKey]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Farmers</p>
          <h1 className={PAGE_TITLE}>All Farmer Crops</h1>
          <p className={PAGE_SUB}>Each farmer and the crops they are growing.</p>
        </div>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={BTN}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className={`${PANEL} p-4 flex flex-col gap-3 lg:flex-row lg:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer name, ID, village, or crop"
            className={`${INPUT} pl-9`}
          />
        </div>
        <CentreFilter centres={centres} value={vendorId} counts={perCentre} onChange={setVendorId} />
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-100">
          {total} farmer{total === 1 ? '' : 's'}
        </span>
        <span className="rounded-full bg-slate-50 px-3 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
          {totalCrops} crop planting{totalCrops === 1 ? '' : 's'}
        </span>
      </div>

      <div className={PANEL}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Loading farmer crops…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="mx-auto mb-2 h-8 w-8" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Leaf className="mx-auto mb-3 h-10 w-10 text-emerald-600/40" />
            <p className="text-base font-bold text-slate-800">No farmer crops yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
              {q || vendorId
                ? 'Try a different search or collection centre.'
                : 'Farmers add crops from the farmer app. Catalog crops are managed in All Crops.'}
            </p>
            <Link to="/collection-crops" className={`${BTN} mt-4`}>
              View crop catalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className={TH}>Farmer</th>
                  <th className={TH}>Collection centre</th>
                  <th className={TH}>Crops</th>
                  <th className={TH}>Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((farmer) => {
                  const isOpen = openId === farmer.id;
                  return (
                    <React.Fragment key={farmer.id}>
                      <tr className="hover:bg-slate-50/80">
                        <td className={TD}>
                          <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? '' : farmer.id)}
                            className="flex items-start gap-2 text-left"
                          >
                            {isOpen ? (
                              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                            ) : (
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            )}
                            <span>
                              <span className="block font-bold text-slate-900">{farmer.name}</span>
                              <span className="block font-mono text-xs text-emerald-700">{farmer.farmerId}</span>
                              <span className="block text-xs text-slate-500">
                                {[farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(', ') || '—'}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className={TD}>
                          <CentreCell row={farmer} />
                          {farmer.status ? <div className="mt-1"><StatusPill status={displayStatus(farmer.status)} /></div> : null}
                        </td>
                        <td className={TD}>
                          <div className="flex flex-wrap gap-1.5">
                            {farmer.crops.map((crop) => (
                              <span
                                key={crop.id || crop.cropId}
                                className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
                              >
                                {crop.cropName}
                                {crop.variety ? ` · ${crop.variety}` : ''}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={`${TD} font-semibold text-slate-800`}>{farmer.cropCount}</td>
                      </tr>
                      {isOpen ? (
                        <tr className="bg-slate-50/60">
                          <td colSpan={4} className="px-4 py-3">
                            <table className="min-w-full text-left text-xs">
                              <thead>
                                <tr>
                                  <th className={TH}>Crop</th>
                                  <th className={TH}>Variety</th>
                                  <th className={TH}>Area</th>
                                  <th className={TH}>Sowing</th>
                                  <th className={TH}>Harvest</th>
                                  <th className={TH}>Est. qty</th>
                                  <th className={TH}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {farmer.crops.map((crop) => (
                                  <tr key={crop.id || crop.cropId}>
                                    <td className={TD}>{crop.cropName}</td>
                                    <td className={TD}>{crop.variety || '—'}</td>
                                    <td className={TD}>
                                      {crop.area || 0} {crop.areaUnit || 'Acre'}
                                    </td>
                                    <td className={TD}>{crop.sowingDate || '—'}</td>
                                    <td className={TD}>{crop.expectedHarvestDate || '—'}</td>
                                    <td className={TD}>
                                      {crop.estimatedQuantity || 0} {crop.unit || 'Kg'}
                                    </td>
                                    <td className={TD}>{crop.status || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
