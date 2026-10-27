import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Leaf,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui';

export default function AdminCropCatalogPage() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [copiedId, setCopiedId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    opsApi
      .list('crop-catalog', { q, category })
      .then((res) => {
        if (!alive) return;
        setRows(Array.isArray(res.data) ? res.data : []);
        setCategories(Array.isArray(res.categories) ? res.categories : []);
        setError('');
      })
      .catch((err) => alive && setError(err.response?.data?.message || 'Failed to load crop catalog'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, category, reloadKey]);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2500);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.cropId) return;
    setIsDeleting(true);
    try {
      await opsApi.remove('crop-catalog', deleteTarget.cropId);
      setToast(`Crop "${deleteTarget.cropName}" removed from catalog.`);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete crop');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {toast ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{toast}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Farmers</p>
          <h1 className={PAGE_TITLE}>All Crops</h1>
          <p className={PAGE_SUB}>Catalog of crops added by admin. Farmers pick from this list when they add a crop.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={BTN}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link to="/collection-crops/add" className={BTN_PRIMARY}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Crop
          </Link>
        </div>
      </div>

      <div className={`${PANEL} p-4 flex flex-col gap-3 sm:flex-row sm:items-center`}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search crop name, variety, or crop ID"
            className={`${INPUT} pl-9`}
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${INPUT} sm:w-56`}>
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className={PANEL}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Loading crop catalog…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="mx-auto mb-2 h-8 w-8" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Leaf className="mx-auto mb-3 h-10 w-10 text-emerald-600/40" />
            <p className="text-base font-bold text-slate-800">No crops in catalog</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
              {q || category !== 'all' ? 'Try a different search.' : 'Add the first crop so farmers can plant it.'}
            </p>
            <Link to="/collection-crops/add" className={`${BTN_PRIMARY} mt-4`}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Crop
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className={TH}>Crop ID</th>
                  <th className={TH}>Crop</th>
                  <th className={TH}>Variety</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Farmers growing</th>
                  <th className={`${TH} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((crop) => {
                  const id = crop.cropId;
                  const isCopied = copiedId === id;
                  return (
                    <tr key={id} className="hover:bg-slate-50/80">
                      <td className={`${TD} font-mono text-xs`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-800">{id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(id)}
                            className="rounded p-1 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                            title="Copy Crop ID"
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className={`${TD} font-bold text-slate-900`}>{crop.cropName}</td>
                      <td className={TD}>{crop.variety || '—'}</td>
                      <td className={TD}>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {crop.category || '—'}
                        </span>
                      </td>
                      <td className={TD}>{crop.farmerCropCount || 0}</td>
                      <td className={`${TD} text-right`}>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(crop)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete crop"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete crop from catalog?</h3>
              <p className="mt-1.5 text-sm text-slate-600">
                Remove <span className="font-semibold text-slate-900">{deleteTarget.cropName}</span>
                {deleteTarget.variety ? ` (${deleteTarget.variety})` : ''} from the admin catalog. Farmer plantings stay as they are.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className={BTN}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-60"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
