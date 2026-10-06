import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, MapPin, RefreshCw, Store, X, XCircle } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { formatDate } from './multiVendorShared';

const FILTERS = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'all'];

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-100',
  Cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export default function DarkStoreRequestsPage() {
  const [rows, setRows] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [remarks, setRemarks] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await opsApi.list('dark-store-requests', status !== 'all' ? { status } : {});
      setRows(Array.isArray(res.data) ? res.data : []);
      setPendingCount(res.stats?.pending || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dark store requests');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (row) => {
    if (!window.confirm(`Approve "${row.storeName}" for ${row.vendorName || 'this collection centre'}? The dark store will be created now.`)) return;
    setBusyId(row.id);
    setError('');
    try {
      const res = await opsApi.create(`dark-store-requests/${row.id}/approve`, {});
      setToast(res.message || 'Dark store approved');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve request');
    } finally {
      setBusyId('');
    }
  };

  const submitReject = async (event) => {
    event.preventDefault();
    setBusyId(rejecting.id);
    setError('');
    try {
      const res = await opsApi.create(`dark-store-requests/${rejecting.id}/reject`, { remarks });
      setToast(res.message || 'Request rejected');
      setRejecting(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject request');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Dark Store Requests</h1>
          <p className={`mt-0.5 ${PAGE_SUB}`}>
            Collection centres request new dark stores here. Approving creates the dark store under that centre.
          </p>
        </div>
        <button type="button" onClick={load} className={`${BTN} gap-1.5 text-xs`}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {toast ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {toast}
          <button type="button" onClick={() => setToast('')} className="ml-auto text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className={`${PANEL} flex flex-wrap items-center gap-1 p-3`}>
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
              status === item ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {item}
            {item === 'Pending' && pendingCount ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      <div className={`overflow-hidden ${PANEL}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            {status === 'Pending' ? 'No requests waiting for approval.' : 'No requests found.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Store className="h-4 w-4 text-emerald-700" />
                    <span className="font-semibold text-slate-900">{row.storeName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_STYLES[row.status] || STATUS_STYLES.Cancelled}`}>
                      {row.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Requested by{' '}
                    {row.vendorName ? (
                      <Link to={`/multi-vendor/${row.vendorId}`} className="font-semibold text-emerald-700 hover:underline">
                        {row.vendorName}
                      </Link>
                    ) : (
                      <span className="font-semibold">{row.vendorId}</span>
                    )}{' '}
                    on {formatDate(row.createdAt)}
                  </p>
                  <p className="flex items-start gap-1 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {[row.storeAddress, row.area, row.city, row.state, row.pincode].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-sm text-slate-600">
                    Manager: {row.managerName || '—'} · {row.phone} · {row.email}
                  </p>
                  {row.latitude != null && row.longitude != null ? (
                    <p className="text-xs text-slate-500">
                      Pin: {row.latitude}, {row.longitude}{' '}
                      <a
                        href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Open map
                      </a>
                    </p>
                  ) : null}
                  {row.notes ? <p className="text-sm text-slate-600">Note: {row.notes}</p> : null}
                  {row.adminRemarks ? <p className="text-sm text-slate-500">Admin remarks: {row.adminRemarks}</p> : null}
                  {row.reviewedAt ? <p className="text-xs text-slate-400">Reviewed {formatDate(row.reviewedAt)}</p> : null}
                </div>
                {row.status === 'Pending' ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRemarks('');
                        setRejecting(row);
                      }}
                      disabled={busyId === row.id}
                      className={`${BTN} gap-1.5 text-xs text-rose-600`}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => approve(row)}
                      disabled={busyId === row.id}
                      className={`${BTN_PRIMARY} gap-1.5 text-xs`}
                    >
                      {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={submitReject} className={`w-full max-w-md ${PANEL} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Reject “{rejecting.storeName}”</h2>
              <button type="button" onClick={() => setRejecting(null)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block text-xs font-semibold text-slate-600">
              Reason (shown to the collection centre)
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={`${INPUT} mt-1`}
                rows={3}
                required
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className={BTN}>
                Cancel
              </button>
              <button type="submit" disabled={busyId === rejecting.id} className={`${BTN_PRIMARY} border-rose-600 bg-rose-600 hover:bg-rose-700`}>
                Reject request
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
