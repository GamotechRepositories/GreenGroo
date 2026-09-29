import { useState } from 'react';
import { CheckCircle2, Clock, Loader2, X, XCircle } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT } from '../../utils/ui';

export const APP_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-800 ring-emerald-200 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200 border-rose-200',
};

export const APP_STATUS_LABELS = {
  pending: 'Pending (प्रलंबित)',
  accepted: 'Accepted (मंजूर)',
  approved: 'Approved (मंजूर)',
  rejected: 'Rejected (अमान्य)',
};

export function AppStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        APP_STATUS_STYLES[status] || APP_STATUS_STYLES.pending
      }`}
    >
      {status === 'accepted' || status === 'approved' ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : status === 'rejected' ? (
        <XCircle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {APP_STATUS_LABELS[status] || status}
    </span>
  );
}

const STATUS_CHOICES = [
  { key: 'pending', label: 'Pending (प्रलंबित)', color: 'border-amber-500 bg-amber-50 text-amber-900' },
  { key: 'accepted', label: 'Accepted (मंजूर)', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
  { key: 'rejected', label: 'Rejected (अमान्य)', color: 'border-rose-500 bg-rose-50 text-rose-900' },
];

export function ApplicationStatusModal({ app, onClose, onSaved }) {
  const [status, setStatus] = useState(app.status === 'approved' ? 'accepted' : app.status || 'pending');
  const [notes, setNotes] = useState(app.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await opsApi.update('govt-schemes/applications', `${app._id}/status`, { status, adminNotes: notes });
      await onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Update Application Status</h3>
            <p className="text-xs text-slate-500">
              {app.farmerName} • {app.schemeTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Application Status (अर्जाची स्थिती)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_CHOICES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key)}
                  className={`rounded-xl border-2 p-2.5 text-center text-xs font-bold transition-all ${
                    status === s.key ? s.color : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Admin Remarks / Rejection Reason (शेरा / कारण)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. 'कागदपत्रे तपासली, मंजुरी मिळाली आहे' किंवा '7/12 उतारा अपूर्ण असल्याने अमान्य'..."
              className={INPUT}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              This note will be visible to the farmer in their mobile application.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className={BTN} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={BTN_PRIMARY}>
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
