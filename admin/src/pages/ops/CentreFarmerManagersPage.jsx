import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle2, Edit3, Loader2, RefreshCw, Search, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui';
import { StatusPill, formatDate } from './multiVendorShared';
import { CentreCell, CentreFilter, useCentreOptions, useDebounced } from './centreListShared';

/**
 * Modal to assign Collection Centre (Vendor) to a Farmer Manager
 */
function AssignManagerCentreModal({ manager, centres, onClose, onSaved }) {
  const [selectedVendorId, setSelectedVendorId] = useState(manager.vendorId || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await opsApi.update('collection-farmer-managers', manager.id, {
        vendorId: selectedVendorId,
      });
      const updated = res?.data || {
        ...manager,
        vendorId: selectedVendorId,
        vendorName: centres.find((c) => String(c.id) === String(selectedVendorId))?.vendorName || '',
      };
      onSaved(updated);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update collection centre');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVendor = centres.find((c) => String(c.id) === String(selectedVendorId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Assign Collection Centre
              </h3>
              <p className="text-xs text-slate-500">
                Assign or change collection centre (vendor) for this Farmer Manager
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Manager Info Card */}
        <div className="border-b border-slate-100 bg-[#F9FAF8] px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Farmer Manager</div>
              <div className="text-sm font-bold text-slate-900">{manager.name}</div>
              <div className="font-mono text-xs text-emerald-700">{manager.managerCode || manager.id}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Mobile: <span className="font-semibold text-slate-800">{manager.mobile || '—'}</span></div>
              <div>Farmers: <span className="font-semibold text-emerald-700">{manager.farmerCount || 0}</span></div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Collection Centre / Vendor <span className="text-rose-500">*</span>
              </label>
              {selectedVendor && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedVendor.vendorName || selectedVendor.businessName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Select which Collection Centre / Vendor this farmer manager is assigned to.
            </p>
            <select
              value={selectedVendorId}
              onChange={(e) => {
                setSelectedVendorId(e.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">— Unassigned (No Collection Centre) —</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.vendorName || c.businessName || c.ownerName} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Save Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CentreFarmerManagersPage() {
  const [params, setParams] = useSearchParams();
  const vendorId = params.get('vendorId') || '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState([]);
  const [perCentre, setPerCentre] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
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

  const handleAssignmentSaved = (updatedManager) => {
    setRows((prev) =>
      prev.map((r) => (r.id === updatedManager.id ? { ...r, ...updatedManager } : r))
    );
    setToast(`Collection centre updated for manager ${updatedManager.name || updatedManager.id}`);
    setTimeout(() => setToast(''), 4500);
    setAssignTarget(null);
  };

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

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} className="ml-auto text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
              <th className={`${TH} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading farmer managers
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
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
                    {manager.vendorId ? (
                      <div className="flex items-center gap-1.5">
                        <CentreCell row={manager} />
                        <button
                          type="button"
                          onClick={() => setAssignTarget(manager)}
                          title="Change Collection Centre"
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAssignTarget(manager)}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
                      >
                        ⚠️ Assign Centre
                      </button>
                    )}
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
                  <td className={`${TD} text-right`}>
                    <button
                      type="button"
                      onClick={() => setAssignTarget(manager)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs transition ${
                        !manager.vendorId
                          ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-600 hover:text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      {!manager.vendorId ? 'Assign Centre' : 'Change Centre'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-slate-500">
        {rows.length} farmer manager{rows.length === 1 ? '' : 's'}
      </div>

      {/* Assign Collection Centre Modal */}
      {assignTarget && (
        <AssignManagerCentreModal
          manager={assignTarget}
          centres={centres}
          onClose={() => setAssignTarget(null)}
          onSaved={handleAssignmentSaved}
        />
      )}
    </div>
  );
}
