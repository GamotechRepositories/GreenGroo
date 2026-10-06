import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, IndianRupee, Loader2, MapPin, Plus, RefreshCw, Search, Store, Trash2, Upload, Warehouse, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import {
  DOCUMENT_TYPES,
  DOC_SHORT,
  PendingDarkStoreRequestsBanner,
  StatusPill,
  openVendorDocument,
} from './multiVendorShared';

const STATUS_OPTIONS = ['Pending', 'Active', 'Inactive', 'Suspended'];
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

const DEFAULTS = {
  vendorName: '',
  ownerName: '',
  mobile: '',
  email: '',
  businessAddress: '',
  village: '',
  taluka: '',
  district: '',
  city: '',
  state: 'Maharashtra',
  gstNumber: '',
  commissionRate: 10,
  status: 'Active',
  password: 'vendor123',
};

const STAT_LABELS = {
  total: 'Total collection centres',
  active: 'Active',
  pending: 'Pending approval',
  inactive: 'Inactive / Suspended',
};

function Field({ label, required, className = '', children }) {
  return (
    <label className={`block text-xs font-semibold text-slate-600 ${className}`}>
      {label}
      {required ? <span className="text-rose-500"> *</span> : null}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function MultiVendor() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [docFiles, setDocFiles] = useState({});
  const [docError, setDocError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const pendingEdit = useRef(location.state?.editId ? location.state : null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await opsApi.list('vendors');
      setRows(Array.isArray(res.data) ? res.data : []);
      setStats(res.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load collection centres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unpaidVendors = useMemo(() => rows.filter((row) => (row.commission?.unpaid || 0) > 0).length, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byStatus = status === 'all' ? rows : rows.filter((row) => row.status === status);
    if (!q) return byStatus;
    return byStatus.filter((row) =>
      [
        row.vendorName,
        row.businessName,
        row.ownerName,
        row.mobile,
        row.email,
        row.city,
        row.vendorCode,
        row.collectionCentre?.id,
        ...(row.darkStores || []).map((store) => store.storeName),
      ].some((value) => String(value || '').toLowerCase().includes(q))
    );
  }, [rows, search, status]);

  const setField = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const openCreate = () => {
    setForm(DEFAULTS);
    setDocFiles({});
    setDocError('');
    setModal({ mode: 'create' });
  };

  const openEdit = useCallback((row, returnTo = null) => {
    const next = { ...DEFAULTS, password: '' };
    Object.keys(next).forEach((key) => {
      if (row[key] !== undefined && key !== 'password') next[key] = row[key];
    });
    setForm(next);
    setDocFiles({});
    setDocError('');
    setModal({ mode: 'edit', row, returnTo });
  }, []);

  useEffect(() => {
    const request = pendingEdit.current;
    if (!request || loading) return;
    pendingEdit.current = null;
    navigate(location.pathname, { replace: true, state: null });
    const row = rows.find((r) => r.id === request.editId);
    if (row) openEdit(row, request.returnTo);
  }, [rows, loading, openEdit, navigate, location.pathname]);

  const closeModal = () => {
    const returnTo = modal?.returnTo;
    setModal(null);
    if (returnTo) navigate(returnTo);
  };

  const pickDocument = async (type, file) => {
    setDocError('');
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setDocError('Only image or PDF files are allowed.');
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setDocError(`${file.name} is larger than 5 MB.`);
      return;
    }
    try {
      const fileUrl = await readAsDataUrl(file);
      setDocFiles((prev) => ({ ...prev, [type]: { type, fileName: file.name, fileUrl } }));
    } catch (err) {
      setDocError(err.message);
    }
  };

  const clearDocument = (type) =>
    setDocFiles((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });

  const viewDocument = async (row, doc) => {
    try {
      await openVendorDocument(row.id, doc);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open document');
    }
  };

  const deleteDocument = async (row, doc) => {
    if (!window.confirm(`Remove ${doc.name}?`)) return;
    try {
      await opsApi.remove(`vendors/${row.id}/documents`, doc.id);
      setModal((prev) =>
        prev?.row ? { ...prev, row: { ...prev.row, documents: prev.row.documents.filter((d) => d.id !== doc.id) } } : prev
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove document');
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, documents: Object.values(docFiles) };
      if (modal.mode === 'edit') {
        await opsApi.update('vendors', modal.row.id, payload);
      } else {
        await opsApi.create('vendors', payload);
      }
      if (modal.returnTo) {
        navigate(modal.returnTo);
        return;
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save collection centre');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete collection centre "${row.vendorName || row.ownerName}"?`)) return;
    try {
      await opsApi.remove('vendors', row.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete collection centre');
    }
  };

  const isCreate = modal?.mode === 'create';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Multi Vendor / Collection Centre</h1>
          <p className={`mt-0.5 ${PAGE_SUB}`}>
            Every vendor is a collection centre. Add new centres and manage all of them here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className={`${BTN} gap-1.5 text-xs`}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button type="button" onClick={openCreate} className={`${BTN_PRIMARY} gap-1.5 text-xs`}>
            <Plus className="h-3.5 w-3.5" /> Add Multi Vendor
          </button>
        </div>
      </div>

      <PendingDarkStoreRequestsBanner />

      {unpaidVendors > 0 ? (
        <Link
          to="/vendor-commission"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-800 hover:bg-rose-100"
        >
          <IndianRupee className="h-4 w-4 shrink-0" />
          {unpaidVendors} vendor{unpaidVendors === 1 ? ' has' : 's have'} unpaid commission
          <span className="ml-auto text-xs font-semibold underline">View commission</span>
        </Link>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      {stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.entries(STAT_LABELS).map(([key, label]) => (
            <div key={key} className={`${PANEL} px-4 py-3`}>
              <p className="text-xs text-[#6B7280]">{label}</p>
              <p className="mt-1 text-lg font-bold text-[#1F2937]">
                {Number(stats[key] || 0).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`${PANEL} flex flex-col gap-2 p-3 sm:flex-row sm:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search centre name, owner, mobile, city or ID..."
            className={`${INPUT} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {['all', ...STATUS_OPTIONS].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
                status === item ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={`overflow-hidden ${PANEL}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No collection centres yet. Click “Add Multi Vendor” to create the first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Collection centre</th>
                  <th className="px-4 py-3 font-semibold">Owner / Contact</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Dark stores</th>
                  <th className="px-4 py-3 font-semibold">Documents</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/multi-vendor/${row.id}`)}
                    className="cursor-pointer border-b border-slate-100 align-top last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Warehouse className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {row.vendorName || row.businessName || row.ownerName}
                          </p>
                          <p className="text-[11px] text-slate-500">{row.collectionCentre?.id || row.vendorCode || row.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{row.ownerName || '—'}</p>
                      <p className="text-[11px] text-slate-500">{row.mobile}</p>
                      {row.email ? <p className="text-[11px] text-slate-500">{row.email}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.businessAddress || row.city || row.state ? (
                        <p className="flex items-start gap-1 text-xs">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                          {[row.businessAddress, row.city, row.state].filter(Boolean).join(', ')}
                        </p>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(row.darkStores || []).length === 0 ? (
                        <span className="text-xs text-slate-400">None</span>
                      ) : (
                        <div className="space-y-0.5">
                          {row.darkStores.map((store) => (
                            <p key={store.id} className="flex items-center gap-1 text-xs text-slate-700">
                              <Store className="h-3 w-3 shrink-0 text-emerald-700" />
                              {store.storeName}
                              {store.city ? <span className="text-slate-400">· {store.city}</span> : null}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(row.documents || []).length === 0 ? (
                        <span className="text-xs text-slate-400">Not uploaded</span>
                      ) : (
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          {row.documents.map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewDocument(row, doc);
                              }}
                              title={`${doc.name} — ${doc.fileName}`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
                            >
                              <FileText className="h-3 w-3" />
                              {DOC_SHORT[doc.type] || doc.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">
                        {(row.documents || []).length}/{DOCUMENT_TYPES.length} uploaded
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleSave} className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto ${PANEL} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {isCreate ? 'Add Multi Vendor / Collection Centre' : 'Edit Collection Centre'}
              </h2>
              <button type="button" onClick={closeModal} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Collection centre / Vendor name" required className="sm:col-span-2">
                <input value={form.vendorName} onChange={setField('vendorName')} className={INPUT} required />
              </Field>
              <Field label="Owner name" required>
                <input value={form.ownerName} onChange={setField('ownerName')} className={INPUT} required />
              </Field>
              <Field label="Mobile" required>
                <input value={form.mobile} onChange={setField('mobile')} className={INPUT} required />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={setField('email')} className={INPUT} />
              </Field>
              <Field label="GST number">
                <input value={form.gstNumber} onChange={setField('gstNumber')} className={INPUT} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <textarea value={form.businessAddress} onChange={setField('businessAddress')} className={INPUT} rows={2} />
              </Field>
              {isCreate ? (
                <>
                  <Field label="Village">
                    <input value={form.village} onChange={setField('village')} className={INPUT} />
                  </Field>
                  <Field label="Taluka">
                    <input value={form.taluka} onChange={setField('taluka')} className={INPUT} />
                  </Field>
                  <Field label="District">
                    <input value={form.district} onChange={setField('district')} className={INPUT} />
                  </Field>
                </>
              ) : null}
              <Field label="City">
                <input value={form.city} onChange={setField('city')} className={INPUT} />
              </Field>
              <Field label="State">
                <input value={form.state} onChange={setField('state')} className={INPUT} />
              </Field>
              <Field label="Commission %">
                <input type="number" value={form.commissionRate} onChange={setField('commissionRate')} className={INPUT} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={setField('status')} className={INPUT}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={isCreate ? 'Login password' : 'New password (leave blank to keep)'}>
                <input value={form.password} onChange={setField('password')} className={INPUT} />
              </Field>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Documents</p>
              <p className="mb-2 text-[11px] text-slate-500">Image or PDF, up to 5 MB each.</p>
              <div className="space-y-2">
                {DOCUMENT_TYPES.map(({ type, label }) => {
                  const picked = docFiles[type];
                  const existing = modal.row?.documents?.find((d) => d.type === type);
                  return (
                    <div
                      key={type}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 px-3 py-2 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700">{label}</p>
                        {picked ? (
                          <p className="flex items-center gap-1 truncate text-[11px] text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 shrink-0" /> {picked.fileName}
                          </p>
                        ) : existing ? (
                          <p className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="truncate">Uploaded: {existing.fileName}</span>
                            <button
                              type="button"
                              onClick={() => viewDocument(modal.row, existing)}
                              className="font-semibold text-emerald-700 hover:underline"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDocument(modal.row, existing)}
                              className="font-semibold text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">Not uploaded</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {picked ? (
                          <button type="button" onClick={() => clearDocument(type)} className="text-slate-400 hover:text-rose-600">
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                        <label className={`${BTN} cursor-pointer gap-1.5 text-xs`}>
                          <Upload className="h-3.5 w-3.5" />
                          {picked || existing ? 'Replace' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              pickDocument(type, e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              {docError ? <p className="mt-2 text-xs text-rose-600">{docError}</p> : null}
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className={BTN}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={`${BTN_PRIMARY} gap-2`}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}

    </div>
  );
}
