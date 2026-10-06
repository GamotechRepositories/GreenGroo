import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader2, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PANEL } from '../../utils/ui';

export function PendingDarkStoreRequestsBanner() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let alive = true;
    opsApi
      .list('dark-store-requests', { status: 'Pending' })
      .then((res) => alive && setPending(res.stats?.pending || 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!pending) return null;
  return (
    <Link
      to="/dark-store-requests"
      className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
    >
      <ClipboardList className="h-4 w-4 shrink-0" />
      {pending} dark store request{pending === 1 ? '' : 's'} waiting for approval
      <span className="ml-auto text-xs font-semibold underline">Review</span>
    </Link>
  );
}

export const DOCUMENT_TYPES = [
  { type: 'aadhaar', label: 'Owner Aadhaar Card', short: 'Aadhaar' },
  { type: 'pan', label: 'PAN Card', short: 'PAN' },
  { type: 'gst', label: 'GST Certificate', short: 'GST' },
  { type: 'shop_licence', label: 'Shop / Trade Licence', short: 'Licence' },
  { type: 'bank', label: 'Bank Passbook / Cancelled Cheque', short: 'Bank' },
  { type: 'owner_photo', label: 'Owner Photo', short: 'Photo' },
];
export const DOC_SHORT = Object.fromEntries(DOCUMENT_TYPES.map((d) => [d.type, d.short]));

const STATUS_STYLES = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  Suspended: 'bg-rose-50 text-rose-700 ring-rose-100',
};

export function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
        STATUS_STYLES[status] || STATUS_STYLES.Inactive
      }`}
    >
      {status || '—'}
    </span>
  );
}

const COMMISSION_STYLES = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'Partially paid': 'bg-amber-50 text-amber-700 ring-amber-100',
  Unpaid: 'bg-rose-50 text-rose-700 ring-rose-100',
  'No sales': 'bg-slate-100 text-slate-500 ring-slate-200',
};

export function CommissionPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
        COMMISSION_STYLES[status] || COMMISSION_STYLES['No sales']
      }`}
    >
      {status || 'No sales'}
    </span>
  );
}

export function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// The tab must be opened synchronously inside the click handler, otherwise popup blockers stop it.
export async function openVendorDocument(vendorId, doc) {
  const tab = window.open('', '_blank');
  try {
    const res = await opsApi.get(`vendors/${vendorId}/documents/${doc.id}`);
    const blob = await (await fetch(res.data.fileUrl)).blob();
    const url = URL.createObjectURL(blob);
    if (tab) tab.location.href = url;
    else window.location.assign(url);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

const PAYMENT_METHODS = ['Bank transfer', 'UPI', 'Cash', 'Cheque', 'Adjusted in payout'];

export function RecordCommissionPaymentModal({ vendor, onClose, onSaved }) {
  const unpaid = vendor.commission?.unpaid || 0;
  const [form, setForm] = useState({
    amount: unpaid > 0 ? String(unpaid) : '',
    paidAt: new Date().toISOString().slice(0, 10),
    method: PAYMENT_METHODS[0],
    reference: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const setField = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await opsApi.create(`vendors/${vendor.id}/commission/payments`, { ...form, amount: Number(form.amount) });
      await onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record payment');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={handleSubmit} className={`w-full max-w-md ${PANEL} p-5`}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Record commission payment</h2>
          <button type="button" onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          {vendor.vendorName || vendor.businessName || vendor.ownerName} · Unpaid {formatMoney(unpaid)}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">
            Amount (₹) <span className="text-rose-500">*</span>
            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={setField('amount')} className={`${INPUT} mt-1`} required />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Payment date
            <input type="date" value={form.paidAt} onChange={setField('paidAt')} className={`${INPUT} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Method
            <select value={form.method} onChange={setField('method')} className={`${INPUT} mt-1`}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Reference / UTR
            <input value={form.reference} onChange={setField('reference')} className={`${INPUT} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
            Note
            <textarea value={form.note} onChange={setField('note')} rows={2} className={`${INPUT} mt-1`} />
          </label>
        </div>
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={`${BTN_PRIMARY} gap-2`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save payment
          </button>
        </div>
      </form>
    </div>
  );
}
