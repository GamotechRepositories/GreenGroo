import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2, Save, Trash2, Upload } from 'lucide-react';
import apiClient from '../../api/client';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';

const CATEGORIES = [
  'Financial Benefit',
  'Irrigation & Drip',
  'Solar & Energy',
  'Crop Insurance',
  'Machinery & Equipment',
  'Dairy & Livestock',
];

const DEFAULT_FORM = {
  title: '',
  shortName: '',
  description: '',
  category: 'Financial Benefit',
  govtLevel: 'Central',
  status: 'active',
  subsidyAmount: '',
  maxBenefit: '',
  deadline: '',
  image: '',
  applyUrl: '',
  eligibility: '',
  documents: '',
  isActive: true,
};

/** Normalize stored deadline values to YYYY-MM-DD for <input type="date">. */
function toDateInputValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';

  const pad = (n) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

export default function CreateGovtSchemePage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageMode, setImageMode] = useState('upload');
  const [imageUploading, setImageUploading] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await opsApi.get(`govt-schemes/${id}`);
        const row = res.data || {};
        if (!cancelled) {
          setForm({
            ...DEFAULT_FORM,
            title: row.title || '',
            shortName: row.shortName || '',
            description: row.description || '',
            category: row.category || 'Financial Benefit',
            govtLevel: row.govtLevel || 'Central',
            status: row.status || 'active',
            subsidyAmount: row.subsidyAmount || '',
            maxBenefit: row.maxBenefit || '',
            deadline: toDateInputValue(row.deadline),
            image: row.image || '',
            applyUrl: row.applyUrl || '',
            eligibility: row.eligibility || '',
            documents: row.documents || '',
            isActive: row.isActive !== false,
          });
          if (row.image) setImageMode('url');
          if (row.category && !CATEGORIES.includes(row.category)) {
            setShowCustomCategory(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load scheme');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }

    setImageUploading(true);
    setError('');
    try {
      const uploadData = new FormData();
      uploadData.append('files', file);
      uploadData.append('folder', 'govt-schemes');

      const res = await apiClient.post('/upload', uploadData);
      const data = res.data;
      if (!data?.success) {
        throw new Error(data?.message || 'Upload failed');
      }

      const uploadedUrl = Array.isArray(data.urls) ? data.urls[0] : data.url;
      if (!uploadedUrl) {
        throw new Error('Upload succeeded but no image URL was returned');
      }

      setField('image', uploadedUrl);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!String(form.title || '').trim()) {
      setError('Scheme title is required');
      return;
    }
    if ((showCustomCategory || !CATEGORIES.includes(form.category)) && !String(form.category || '').trim()) {
      setError('Please enter a custom category');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await opsApi.update('govt-schemes', id, form);
      } else {
        await opsApi.create('govt-schemes', form);
      }
      navigate('/government/schemes');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save scheme');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading scheme...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={PAGE_KICKER}>Government</p>
          <h1 className={PAGE_TITLE}>{isEdit ? 'Edit Govt Scheme' : 'Create Govt Schemes'}</h1>
          <p className={PAGE_SUB}>
            {isEdit
              ? 'Update scheme details shown to farmers and managers.'
              : 'Add a new government agricultural scheme for farmers.'}
          </p>
        </div>
        <Link to="/government/schemes" className={BTN}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to all schemes
        </Link>
      </div>

      <form onSubmit={handleSubmit} className={`${PANEL} space-y-5 p-5`}>
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title *</span>
            <input
              required
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className={INPUT}
              placeholder="e.g. Pradhan Mantri Kisan Samman Nidhi"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Short name</span>
            <input
              value={form.shortName}
              onChange={(e) => setField('shortName', e.target.value)}
              className={INPUT}
              placeholder="e.g. PM-KISAN"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
            <select
              value={showCustomCategory || !CATEGORIES.includes(form.category) ? 'Other' : form.category}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'Other') {
                  setShowCustomCategory(true);
                  setField('category', '');
                } else {
                  setShowCustomCategory(false);
                  setField('category', value);
                }
              }}
              className={INPUT}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            {showCustomCategory || !CATEGORIES.includes(form.category) ? (
              <input
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className={INPUT}
                placeholder="Enter custom category"
                required
              />
            ) : null}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Govt level</span>
            <select
              value={form.govtLevel}
              onChange={(e) => setField('govtLevel', e.target.value)}
              className={INPUT}
            >
              <option value="Central">Central</option>
              <option value="State">State</option>
              <option value="Central + State">Central + State</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              className={INPUT}
            >
              <option value="active">Active</option>
              <option value="closing_soon">Closing soon</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subsidy amount</span>
            <input
              value={form.subsidyAmount}
              onChange={(e) => setField('subsidyAmount', e.target.value)}
              className={INPUT}
              placeholder="e.g. ₹6,000 / year"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max benefit</span>
            <input
              value={form.maxBenefit}
              onChange={(e) => setField('maxBenefit', e.target.value)}
              className={INPUT}
              placeholder="e.g. Up to ₹50,000"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</span>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setField('deadline', e.target.value)}
              className={INPUT}
            />
          </label>

          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className={`${INPUT} min-h-[96px]`}
              placeholder="Short description of the scheme"
            />
          </label>

          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheme image</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`rounded-md px-2.5 py-1 transition ${
                    imageMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`rounded-md px-2.5 py-1 transition ${
                    imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {imageMode === 'upload' ? (
              <div className="space-y-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  disabled={imageUploading}
                  onClick={() => imageInputRef.current?.click()}
                  className={`${BTN} w-full justify-center border-dashed py-8`}
                >
                  {imageUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose image to upload
                    </>
                  )}
                </button>
              </div>
            ) : (
              <input
                value={form.image}
                onChange={(e) => setField('image', e.target.value)}
                className={INPUT}
                placeholder="https://..."
              />
            )}

            {form.image ? (
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <img
                  src={form.image}
                  alt="Scheme preview"
                  className="h-20 w-28 rounded-lg object-cover ring-1 ring-slate-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <ImagePlus className="h-3.5 w-3.5" />
                    Selected image
                  </p>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{form.image}</p>
                  <button
                    type="button"
                    onClick={() => setField('image', '')}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Apply URL</span>
            <input
              value={form.applyUrl}
              onChange={(e) => setField('applyUrl', e.target.value)}
              className={INPUT}
              placeholder="https://..."
            />
          </label>

          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Eligibility</span>
            <textarea
              value={form.eligibility}
              onChange={(e) => setField('eligibility', e.target.value)}
              className={`${INPUT} min-h-[88px]`}
              placeholder="Who can apply (one point per line)"
            />
          </label>

          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents required</span>
            <textarea
              value={form.documents}
              onChange={(e) => setField('documents', e.target.value)}
              className={`${INPUT} min-h-[88px]`}
              placeholder="Aadhaar, land records, bank passbook..."
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
            />
            Show this scheme on farmer apps
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Link to="/government/schemes" className={BTN}>
            Cancel
          </Link>
          <button type="submit" disabled={saving || imageUploading} className={BTN_PRIMARY}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            {isEdit ? 'Save changes' : 'Create scheme'}
          </button>
        </div>
      </form>
    </div>
  );
}
