import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Edit3, Loader2, RefreshCw, Search, UserCheck, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui';
import { StatusPill, formatDate } from './multiVendorShared';
import { CentreCell, CentreFilter, displayStatus, useCentreOptions, useDebounced } from './centreListShared';

const PAGE_SIZE = 25;

/**
 * Modal to assign Collection Centre (Vendor) 1st, then Farmer Manager 2nd
 */
function AssignFarmerModal({ farmer, centres, onClose, onSaved }) {
  const [selectedVendorId, setSelectedVendorId] = useState(farmer.vendorId || '');
  const [selectedManagerId, setSelectedManagerId] = useState(farmer.managerId || '');
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // When selected vendor changes, load managers belonging strictly to that vendor
  useEffect(() => {
    if (!selectedVendorId) {
      setManagers([]);
      setSelectedManagerId('');
      return;
    }
    let alive = true;
    setLoadingManagers(true);
    opsApi
      .list('collection-farmer-managers', { vendorId: selectedVendorId })
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setManagers(list);
        // If farmer's current manager belongs to this vendor, keep it selected; otherwise reset
        if (farmer.vendorId === selectedVendorId && farmer.managerId) {
          const match = list.some((m) => String(m.id) === String(farmer.managerId));
          setSelectedManagerId(match ? farmer.managerId : '');
        } else {
          setSelectedManagerId('');
        }
      })
      .catch(() => {
        if (alive) setManagers([]);
      })
      .finally(() => {
        if (alive) setLoadingManagers(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedVendorId, farmer.vendorId, farmer.managerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendorId) {
      setError('Please select a Collection Centre / Vendor first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await opsApi.update('collection-farmers', farmer.id, {
        vendorId: selectedVendorId,
        managerId: selectedManagerId,
      });
      const updatedFarmer = res?.data || {
        ...farmer,
        vendorId: selectedVendorId,
        managerId: selectedManagerId,
      };
      onSaved(updatedFarmer);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update assignment');
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
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Assign Collection Centre & Manager
              </h3>
              <p className="text-xs text-slate-500">
                1st assign Vendor &rarr; then assign Farmer Manager under that Vendor
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

        {/* Farmer Info Banner */}
        <div className="border-b border-slate-100 bg-[#F9FAF8] px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Farmer</div>
              <div className="text-sm font-bold text-slate-900">{farmer.name}</div>
              <div className="font-mono text-xs text-emerald-700">{farmer.id}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Mobile: <span className="font-semibold text-slate-800">{farmer.mobile || '—'}</span></div>
              <div className="truncate max-w-[220px]" title={[farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(', ')}>
                {[farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(', ') || '—'}
              </div>
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

          {/* STEP 1: VENDOR / COLLECTION CENTRE */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-black text-white">
                  1
                </span>
                Collection Centre / Vendor <span className="text-rose-500">*</span>
              </label>
              {selectedVendor && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Step 1 Selected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Select which Collection Centre / Vendor this farmer will supply.
            </p>
            <select
              value={selectedVendorId}
              onChange={(e) => {
                setSelectedVendorId(e.target.value);
                setError('');
              }}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">— Select Collection Centre / Vendor —</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.vendorName || c.businessName || c.ownerName} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: FARMER MANAGER (UNDER SELECTED VENDOR) */}
          <div
            className={`rounded-xl border p-3.5 space-y-2 transition ${
              !selectedVendorId
                ? 'border-slate-200/60 bg-slate-50/60 opacity-70'
                : 'border-slate-200/90 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                    !selectedVendorId ? 'bg-slate-300 text-slate-600' : 'bg-sky-600 text-white'
                  }`}
                >
                  2
                </span>
                Farmer Manager (Under Selected Vendor)
              </label>
              {loadingManagers && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading managers...
                </span>
              )}
            </div>

            {!selectedVendorId ? (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚠️ Please select a Collection Centre / Vendor in Step 1 first.
              </p>
            ) : (
              <>
                <p className="text-[11px] text-slate-500">
                  Assign a field manager from{' '}
                  <strong className="text-slate-700">
                    {selectedVendor?.vendorName || selectedVendor?.businessName || 'this centre'}
                  </strong>{' '}
                  to manage this farmer.
                </p>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  disabled={loadingManagers}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:opacity-50"
                >
                  <option value="">— Unassigned (No Manager) —</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.mobile ? `· ${m.mobile}` : ''} {m.managerCode ? `(${m.managerCode})` : ''}
                    </option>
                  ))}
                </select>

                {managers.length === 0 && !loadingManagers && (
                  <p className="text-[11px] text-slate-500 italic">
                    ℹ️ No managers registered under this Collection Centre yet. You can save the Collection Centre now and assign a manager later.
                  </p>
                )}
              </>
            )}
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
              disabled={submitting || !selectedVendorId}
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
  const [toast, setToast] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
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

  const handleAssignmentSaved = (updatedFarmer) => {
    setRows((prev) =>
      prev.map((r) => (r.id === updatedFarmer.id ? { ...r, ...updatedFarmer } : r))
    );
    setToast(`Assignment updated successfully for farmer ${updatedFarmer.name || updatedFarmer.id}`);
    setTimeout(() => setToast(''), 4500);
    setAssignTarget(null);
  };

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
              <th className={`${TH} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading farmers
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
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
                  <td className={TD} onClick={(e) => e.stopPropagation()}>
                    {farmer.vendorId ? (
                      <div className="flex items-center gap-1.5">
                        <CentreCell row={farmer} />
                        <button
                          type="button"
                          onClick={() => setAssignTarget(farmer)}
                          title="Change Collection Centre or Manager"
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAssignTarget(farmer)}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
                      >
                        ⚠️ Assign Vendor
                      </button>
                    )}
                  </td>
                  <td className={TD} onClick={(e) => e.stopPropagation()}>
                    {farmer.managerId ? (
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/collection-farmers?managerId=${encodeURIComponent(farmer.managerId)}`}
                          onClick={() => setPage(1)}
                          className="text-emerald-700 hover:underline font-medium"
                        >
                          {farmer.managerName || farmer.managerId}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setAssignTarget(farmer)}
                          title="Change Manager"
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAssignTarget(farmer)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border transition ${
                          farmer.vendorId
                            ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {farmer.vendorId ? '👤 Assign Manager' : 'Needs Vendor 1st'}
                      </button>
                    )}
                  </td>
                  <td className={TD}>
                    <StatusPill status={displayStatus(farmer.status)} />
                  </td>
                  <td className={TD}>{formatDate(farmer.createdAt)}</td>
                  <td className={`${TD} text-right`} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setAssignTarget(farmer)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs transition ${
                        !farmer.vendorId
                          ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-600 hover:text-white'
                          : !farmer.managerId
                          ? 'border-sky-400 bg-sky-50 text-sky-900 hover:bg-sky-600 hover:text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {!farmer.vendorId ? 'Assign Vendor' : !farmer.managerId ? 'Assign Manager' : 'Edit'}
                    </button>
                  </td>
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

      {/* Assign Modal */}
      {assignTarget && (
        <AssignFarmerModal
          farmer={assignTarget}
          centres={centres}
          onClose={() => setAssignTarget(null)}
          onSaved={handleAssignmentSaved}
        />
      )}
    </div>
  );
}
