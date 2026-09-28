import { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, Loader2, Video, XCircle } from 'lucide-react';
import erpApi from '../../api/erpApi';
import { INPUT, PANEL } from '../../utils/ui';

const DOC_TYPES = [
  { type: 'aadhaar', label: 'Aadhaar Card', required: true },
  { type: 'pan', label: 'PAN Card', required: true },
  { type: 'address_proof', label: 'Address Proof', required: true },
  { type: 'bank', label: 'Bank Passbook', required: true },
  { type: 'farmer_id', label: 'Farmer ID' },
  { type: 'land_712', label: '7/12 Extract' },
  { type: 'land_8a', label: '8A Extract' },
  { type: 'farmer_photo', label: 'Farmer Photo' },
  { type: 'video_kyc', label: 'Live Video KYC' },
];

const TONES = {
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  Missing: 'bg-slate-100 text-slate-500 ring-slate-200',
};

function StatusPill({ status }) {
  const label = status === 'Pending' ? 'Under review' : status === 'Missing' ? 'Not uploaded' : status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${TONES[status] || TONES.Missing}`}
    >
      {label}
    </span>
  );
}

function when(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-IN');
}

function labelFor(doc) {
  return DOC_TYPES.find((d) => d.type === doc.type)?.label || doc.name || doc.type;
}

function fileKind(url) {
  if (url.startsWith('data:image') || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)) return 'image';
  if (url.startsWith('data:video') || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return 'video';
  if (url.startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(url)) return 'pdf';
  return /^https?:\/\//i.test(url) ? 'image' : 'file';
}

function openDocument(url) {
  if (!url) return;
  if (url.startsWith('data:')) {
    const comma = url.indexOf(',');
    const meta = url.slice(0, comma);
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const binary = atob(url.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(blobUrl, '_blank', 'noopener');
    return;
  }
  window.open(url, '_blank', 'noopener');
}

function Preview({ url, kind }) {
  if (kind === 'image') {
    return (
      <img
        src={url}
        alt=""
        className="h-44 w-full cursor-zoom-in rounded-lg bg-slate-100 object-contain"
        onClick={() => openDocument(url)}
      />
    );
  }
  if (kind === 'video') {
    return <video src={url} controls className="h-44 w-full rounded-lg bg-slate-900 object-contain" />;
  }
  return (
    <button
      type="button"
      onClick={() => openDocument(url)}
      className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg bg-red-50 text-xs font-semibold text-red-700"
    >
      <FileText className="h-8 w-8" />
      {kind === 'pdf' ? 'PDF document — click to open' : 'File — click to open'}
    </button>
  );
}

function DocumentCard({ doc, farmerId, onUpdated }) {
  const [saving, setSaving] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const url = String(doc.fileUrl || '');
  const kind = fileKind(url);

  const submit = async (status) => {
    if (status === 'Rejected' && !reason.trim()) {
      setError('Enter a reason so the farmer knows what to fix.');
      return;
    }
    setSaving(status);
    setError('');
    try {
      await erpApi.reviewFarmerDocument(farmerId, doc.id || doc.type, {
        status,
        rejectionReason: status === 'Rejected' ? reason.trim() : '',
      });
      setRejecting(false);
      setReason('');
      await onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update document');
    } finally {
      setSaving('');
    }
  };

  return (
    <article className={`${PANEL} flex flex-col p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
            {kind === 'video' ? <Video className="h-3.5 w-3.5 text-sky-600" /> : null}
            {labelFor(doc)}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{doc.fileName || doc.type}</p>
          <p className="mt-1 text-[11px] text-slate-400">Uploaded {when(doc.uploadedAt || doc.createdAt)}</p>
        </div>
        <StatusPill status={doc.status} />
      </div>

      <div className="mt-3">
        <Preview url={url} kind={kind} />
      </div>

      {doc.status === 'Rejected' && doc.rejectionReason ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          Reason: {doc.rejectionReason}
        </p>
      ) : null}

      {rejecting ? (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this document rejected? (e.g. photo blurry, name mismatch)"
          rows={2}
          className={`${INPUT} mt-3 text-xs`}
          autoFocus
        />
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <button
          type="button"
          onClick={() => openDocument(url)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </button>
        <div className="ml-auto flex gap-2">
          {rejecting ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setRejecting(false);
                  setError('');
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!saving}
                onClick={() => submit('Rejected')}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {saving === 'Rejected' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Confirm reject
              </button>
            </>
          ) : (
            <>
              {doc.status !== 'Rejected' ? (
                <button
                  type="button"
                  disabled={!!saving}
                  onClick={() => setRejecting(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              ) : null}
              {doc.status !== 'Approved' ? (
                <button
                  type="button"
                  disabled={!!saving}
                  onClick={() => submit('Approved')}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving === 'Approved' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Approve
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function FarmerDocumentsPanel({ farmerId, documents, onUpdated }) {
  const byType = useMemo(() => Object.fromEntries(documents.map((d) => [d.type, d])), [documents]);
  const extraDocs = documents.filter((d) => !DOC_TYPES.some((t) => t.type === d.type));
  const requiredDone = DOC_TYPES.filter((t) => t.required && byType[t.type]?.status === 'Approved').length;
  const requiredTotal = DOC_TYPES.filter((t) => t.required).length;

  return (
    <div className="space-y-4">
      <section className={`${PANEL} p-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">KYC checklist</h2>
          <p className="text-xs text-slate-500">
            Required approved:{' '}
            <span className={requiredDone === requiredTotal ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-800'}>
              {requiredDone}/{requiredTotal}
            </span>
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_TYPES.map((t) => (
            <div key={t.type} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">
                {t.label}
                {t.required ? <span className="ml-1 text-rose-500">*</span> : null}
              </span>
              <StatusPill status={byType[t.type]?.status || 'Missing'} />
            </div>
          ))}
        </div>
      </section>

      {documents.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...DOC_TYPES.map((t) => byType[t.type]).filter(Boolean), ...extraDocs].map((doc) => (
            <DocumentCard key={doc.id || doc.type} doc={doc} farmerId={farmerId} onUpdated={onUpdated} />
          ))}
        </div>
      ) : (
        <div className={`${PANEL} px-6 py-12 text-center text-sm text-slate-400`}>
          The farmer has not uploaded any documents yet.
        </div>
      )}
    </div>
  );
}
