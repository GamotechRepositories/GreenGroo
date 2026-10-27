import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Monitor,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import bannerApi from '../api/bannerApi';
import { apiErrorMessage } from '../utils/baseProducts';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, PANEL_HEAD } from '../utils/ui';

const SECTIONS = [
  { slug: 'preorder', name: 'Preorder', storeUrl: '/' },
  { slug: 'ready2cook', name: 'Ready2Cook', storeUrl: '/?store=festive' },
  { slug: 'instantorder', name: 'Instant Order', storeUrl: '/?store=mall' },
];

const DEVICES = [
  { id: 'desktop', name: 'Desktop view', icon: Monitor },
  { id: 'mobile', name: 'Mobile view', icon: Smartphone },
];

/** Must match the storefront's banner slots (frontend `useSectionBanners`). */
const PLACEMENTS = [
  {
    id: 'hero',
    name: 'Hero carousel',
    where: 'Top of the section home page, full width.',
    size: { desktop: [1920, 600], mobile: [1080, 720] },
  },
  {
    id: 'shop',
    name: 'Shop page banner',
    where: 'Top of the product listing / category page.',
    size: { desktop: [1200, 400], mobile: [1024, 342] },
  },
  {
    id: 'stories',
    name: 'Farmer Stories banners',
    where: 'Home page, the two tiles under Shop by Category. Each tile rotates through its own banners; add a video to make a banner play it.',
    size: { desktop: [1200, 480], mobile: [1080, 360] },
    sections: ['preorder'],
    hasVideo: true,
    groups: [
      {
        key: 'farmfresh',
        name: 'Left tile · आज शेतात काय आहे?',
        empty: 'No banner yet — the left tile is hidden on the storefront.',
      },
      {
        key: 'farmerstories',
        name: 'Right tile · Farmer Stories (video)',
        empty: 'No banner yet — the right tile is hidden on the storefront.',
      },
    ],
  },
  {
    id: 'mid',
    name: 'Suggested for You banner',
    where: 'Slider just above the Suggested for You products.',
    size: { desktop: [1280, 400], mobile: [1080, 540] },
  },
  {
    id: 'offer',
    name: 'Top Offers banner',
    where: 'Under the payment offers; the text is drawn on top of the image.',
    size: { desktop: [1024, 342], mobile: [1024, 342] },
    hasText: true,
  },
  {
    id: 'category',
    name: 'Category banners',
    where: 'Above each category row on the home page; the text is drawn on top of the image.',
    size: { desktop: [1024, 342], mobile: [1024, 342] },
    sections: ['preorder'],
    hasText: true,
    groups: [
      // Keys must match `categoryBannerKey` in frontend/src/components/home/categoryBanners.js.
      ['beverages', 'Beverages'],
      ['dryfruits', 'Dry Fruits'],
      ['fruits', 'Fruits'],
      ['dairy', 'Dairy'],
      ['grains', 'Grains'],
      ['oils', 'Oils'],
      ['organic', 'Organic'],
      ['pulses', 'Pulses'],
      ['spices', 'Spices'],
      ['vegetables', 'Vegetables'],
    ].map(([key, name]) => ({
      key,
      name,
      addLabel: `Add ${name} banner`,
      empty: `No ${name} banner yet — the ${name} row shows without a banner.`,
    })),
  },
];

const groupName = (placement, key) => placement.groups?.find((group) => group.key === key)?.name || key;

const EMPTY_FORM = {
  imageUrl: '',
  alt: '',
  linkUrl: '',
  tag: '',
  title: '',
  subtitle: '',
  offerText: '',
  bgColor: '',
  videoUrl: '',
  isActive: true,
  startsAt: '',
  endsAt: '',
};

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function bannerStatus(banner) {
  const now = Date.now();
  if (!banner.isActive) return { label: 'Hidden', className: 'bg-slate-100 text-slate-600' };
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) {
    return { label: 'Scheduled', className: 'bg-amber-50 text-amber-700' };
  }
  if (banner.endsAt && new Date(banner.endsAt).getTime() < now) {
    return { label: 'Expired', className: 'bg-rose-50 text-rose-700' };
  }
  return { label: 'Live', className: 'bg-emerald-50 text-emerald-700' };
}

function BannerCard({ banner, ratio, index, total, busy, onMove, onToggle, onEdit, onDelete }) {
  const status = bannerStatus(banner);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="relative bg-[#f4f8ec]" style={{ aspectRatio: ratio }}>
        <img src={banner.imageUrl} alt={banner.alt} className="h-full w-full object-cover" />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
          {status.label}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
          #{index + 1}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800" title={banner.title || banner.alt}>
            {banner.title || banner.alt || 'Untitled banner'}
          </p>
          <p className="truncate text-xs text-slate-500" title={banner.linkUrl}>
            {banner.videoUrl ? 'Plays a video' : banner.linkUrl ? `Opens ${banner.linkUrl}` : 'No link'}
          </p>
        </div>
        <div className="flex items-center gap-0.5 border-t border-slate-100 pt-2">
          <button
            type="button"
            title="Move earlier"
            disabled={busy || index === 0}
            onClick={() => onMove(-1)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Move later"
            disabled={busy || index === total - 1}
            onClick={() => onMove(1)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={banner.isActive ? 'Hide from storefront' : 'Show on storefront'}
            disabled={busy}
            onClick={onToggle}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <span className="flex-1" />
          <button
            type="button"
            title="Edit banner"
            onClick={onEdit}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Delete banner"
            disabled={busy}
            onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BannerModal({ open, editing, section, placement, device, category, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      editing
        ? {
            imageUrl: editing.imageUrl || '',
            alt: editing.alt || '',
            linkUrl: editing.linkUrl || '',
            tag: editing.tag || '',
            title: editing.title || '',
            subtitle: editing.subtitle || '',
            offerText: editing.offerText || '',
            bgColor: editing.bgColor || '',
            videoUrl: editing.videoUrl || '',
            isActive: editing.isActive !== false,
            startsAt: toLocalInput(editing.startsAt),
            endsAt: toLocalInput(editing.endsAt),
          }
        : EMPTY_FORM
    );
  }, [open, editing]);

  if (!open || !placement) return null;

  const [width, height] = placement.size[device];
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleUpload = async (file) => {
    try {
      setUploading(true);
      setError('');
      const url = await bannerApi.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    try {
      setUploadingVideo(true);
      setError('');
      const url = await bannerApi.uploadImage(file);
      setForm((prev) => ({ ...prev, videoUrl: url }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Video upload failed.'));
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) return setError('Upload a banner image first.');
    if (form.startsAt && form.endsAt && new Date(form.startsAt) > new Date(form.endsAt)) {
      return setError('End time must be after the start time.');
    }

    const payload = {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };

    try {
      setSaving(true);
      setError('');
      if (editing) {
        await bannerApi.update(editing._id, payload);
      } else {
        await bannerApi.create({
          ...payload,
          section: section.slug,
          placement: placement.id,
          device,
          ...(placement.groups ? { category } : {}),
        });
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save banner.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-6">
      <form onSubmit={handleSubmit} className={`${PANEL} w-full max-w-2xl`}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
          <div>
            <p className={PAGE_KICKER}>
              {section.name} · {placement.name}
              {placement.groups ? ` · ${groupName(placement, editing?.category || category)}` : ''} ·{' '}
              {device === 'mobile' ? 'Mobile' : 'Desktop'}
            </p>
            <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit banner' : 'Add banner'}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
          ) : null}

          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-700">Banner image</p>
            <label
              className={`relative mx-auto flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-[#f4f8ec] transition hover:border-emerald-500 ${
                device === 'mobile' ? 'max-w-sm' : 'w-full'
              }`}
              style={{ aspectRatio: `${width} / ${height}` }}
            >
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-xs font-medium text-slate-400">
                  <ImageIcon className="h-6 w-6" />
                  Click to upload
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
              {uploading ? (
                <span className="absolute inset-0 flex items-center justify-center bg-white/75">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                </span>
              ) : null}
            </label>
            <p className="mt-1.5 text-center text-xs text-slate-500">
              Recommended {width} × {height}px (JPG, PNG or WebP). Click the image to replace it.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Link when tapped</span>
              <input
                type="text"
                value={form.linkUrl}
                onChange={set('linkUrl')}
                placeholder="/product?categoryName=Fruits"
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Alt text</span>
              <input
                type="text"
                value={form.alt}
                onChange={set('alt')}
                placeholder="Describe the banner for screen readers"
                className={INPUT}
              />
            </label>
          </div>

          {placement.hasText ? (
            <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Tag</span>
                <input type="text" value={form.tag} onChange={set('tag')} placeholder="Farm Fresh" className={INPUT} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Offer</span>
                <input
                  type="text"
                  value={form.offerText}
                  onChange={set('offerText')}
                  placeholder="Up to 30% Off"
                  className={INPUT}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={set('title')}
                  placeholder="Gentle Summer Organic Care"
                  className={INPUT}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Subtitle</span>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={set('subtitle')}
                  placeholder="Farm Fresh Vegetables & Fruits"
                  className={INPUT}
                />
              </label>
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Text background colour</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.bgColor || '#f4fbf2'}
                    onChange={set('bgColor')}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <input
                    type="text"
                    value={form.bgColor}
                    onChange={set('bgColor')}
                    placeholder="#f4fbf2 (default light green)"
                    className={INPUT}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Fades from the left so the text stays readable.</p>
              </div>
            </div>
          ) : placement.hasVideo ? (
            <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Video (optional)</span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={form.videoUrl}
                    onChange={set('videoUrl')}
                    placeholder="Upload an MP4 or paste a video URL"
                    className={INPUT}
                  />
                  <label className={`${BTN} shrink-0 cursor-pointer gap-1.5`}>
                    {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    Upload video
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={uploadingVideo}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  With a video, tapping the tile plays it in a popup instead of opening the link.
                </p>
                {form.videoUrl ? (
                  <video src={form.videoUrl} controls className="mt-2 max-h-48 w-full rounded-xl bg-black" />
                ) : null}
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Video popup title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={set('title')}
                  placeholder="शेतकऱ्यांची खरी गोष्ट (Farmer Story)"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Video popup caption</span>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={set('subtitle')}
                  placeholder="स्थानिक शेतकरी: तुकाराम शिंदे (सातारा सेंद्रिय शेत)"
                  className={INPUT}
                />
              </label>
            </div>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Internal title (admin only)</span>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. Diwali sale"
                className={INPUT}
              />
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Show from (optional)</span>
              <input type="datetime-local" value={form.startsAt} onChange={set('startsAt')} className={INPUT} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Show until (optional)</span>
              <input type="datetime-local" value={form.endsAt} onChange={set('endsAt')} className={INPUT} />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700"
            />
            Show on the storefront
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-6">
          <button type="button" onClick={onClose} className={BTN}>
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading || uploadingVideo} className={`${BTN_PRIMARY} gap-1.5`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editing ? 'Save changes' : 'Add banner'}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Storefront banners at `/banners/:device/:sectionSlug?` — sidebar sub-tabs pick the device. */
export default function Banners() {
  const { device: deviceParam } = useParams();
  if (!DEVICES.some((dev) => dev.id === deviceParam)) {
    return <Navigate to="/banners/desktop" replace />;
  }
  return <BannersForDevice key={deviceParam} device={deviceParam} />;
}

function BannersForDevice({ device }) {
  const navigate = useNavigate();
  const { sectionSlug } = useParams();
  const section = SECTIONS.find((sec) => sec.slug === sectionSlug) || SECTIONS[0];
  const deviceInfo = DEVICES.find((dev) => dev.id === device);
  const DeviceIcon = deviceInfo.icon;

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);
  const [modal, setModal] = useState({ open: false, placement: null, editing: null });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bannerApi.list({ section: section.slug });
      setBanners(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load banners.'));
    } finally {
      setLoading(false);
    }
  }, [section.slug]);

  useEffect(() => {
    load();
  }, [load]);

  const placements = useMemo(
    () => PLACEMENTS.filter((p) => !p.sections || p.sections.includes(section.slug)),
    [section.slug]
  );

  const grouped = useMemo(() => {
    const map = {};
    banners.forEach((banner) => {
      const key = `${banner.placement}:${banner.device}`;
      (map[key] ||= []).push(banner);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    return map;
  }, [banners]);

  const countFor = (dev) =>
    placements.reduce((sum, p) => sum + (grouped[`${p.id}:${dev}`]?.length || 0), 0);

  const handleMove = async (list, index, step) => {
    const next = [...list];
    const [moved] = next.splice(index, 1);
    next.splice(index + step, 0, moved);
    const ids = next.map((b) => b._id);
    const orderById = new Map(ids.map((id, i) => [id, i]));
    setBanners((prev) => prev.map((b) => (orderById.has(b._id) ? { ...b, order: orderById.get(b._id) } : b)));
    try {
      setBusyId(moved._id);
      await bannerApi.reorder(ids);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reorder banners.'));
      load();
    } finally {
      setBusyId('');
    }
  };

  const handleToggle = async (banner) => {
    try {
      setBusyId(banner._id);
      setError('');
      const res = await bannerApi.update(banner._id, { isActive: !banner.isActive });
      setBanners((prev) => prev.map((b) => (b._id === banner._id ? res.data : b)));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update banner.'));
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm('Delete this banner? It will disappear from the storefront.')) return;
    try {
      setBusyId(banner._id);
      setError('');
      await bannerApi.remove(banner._id);
      setBanners((prev) => prev.filter((b) => b._id !== banner._id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete banner.'));
    } finally {
      setBusyId('');
    }
  };

  const handleImport = async () => {
    if (
      !window.confirm(
        'Upload the banners the website used to show to S3 and add them here, for every section, desktop and mobile? Banners that were already imported are skipped.'
      )
    ) {
      return;
    }
    try {
      setImporting(true);
      setError('');
      setNotice('');
      const { data } = await bannerApi.importDefaults();
      const missing = data?.missing?.length ? ` Missing files: ${data.missing.join(', ')}.` : '';
      setNotice(`Imported ${data?.created || 0} banner(s); ${data?.skipped || 0} were already imported.${missing}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not import the website banners.'));
    } finally {
      setImporting(false);
    }
  };

  const closeModal = () => setModal({ open: false, placement: null, editing: null, category: '' });

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Catalog · Banners</p>
          <h1 className={`${PAGE_TITLE} flex items-center gap-2`}>
            <DeviceIcon className="h-6 w-6 text-emerald-700" />
            {deviceInfo.name} banners
          </h1>
          <p className={PAGE_SUB}>
            {device === 'mobile'
              ? 'Shown on phones and small screens.'
              : 'Shown on laptops and large screens.'}{' '}
            Add as many banners as you like to each slot; a slot with no live banner is hidden on the storefront.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleImport} disabled={importing} className={`${BTN} gap-1.5`}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Import website banners
          </button>
          <button type="button" onClick={load} disabled={loading} className={`${BTN} gap-1.5`}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((sec) => (
          <button
            key={sec.slug}
            type="button"
            onClick={() => navigate(`/banners/${device}/${sec.slug}`)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              section.slug === sec.slug
                ? 'border-emerald-700 bg-emerald-700 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {sec.name}
          </button>
        ))}
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {DEVICES.map((dev) => {
          const Icon = dev.icon;
          const active = device === dev.id;
          return (
            <button
              key={dev.id}
              type="button"
              onClick={() => navigate(`/banners/${dev.id}/${section.slug}`)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                active ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {dev.name}
              <span
                className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}
              >
                {countFor(dev.id)}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      ) : null}

      {loading && !banners.length ? (
        <div className={`${PANEL} flex items-center justify-center gap-2 p-10 text-sm text-slate-500`}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading banners…
        </div>
      ) : (
        placements.map((placement) => {
          const list = grouped[`${placement.id}:${device}`] || [];
          const [width, height] = placement.size[device];

          const renderGrid = (items, emptyText) =>
            items.length ? (
              <div
                className={`grid gap-4 ${
                  device === 'mobile' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                }`}
              >
                {items.map((banner, index) => (
                  <BannerCard
                    key={banner._id}
                    banner={banner}
                    ratio={`${width} / ${height}`}
                    index={index}
                    total={items.length}
                    busy={busyId === banner._id}
                    onMove={(step) => handleMove(items, index, step)}
                    onToggle={() => handleToggle(banner)}
                    onEdit={() => setModal({ open: true, placement, editing: banner, category: banner.category })}
                    onDelete={() => handleDelete(banner)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                {emptyText}
              </p>
            );

          return (
            <section key={placement.id} className={PANEL}>
              <div className={`${PANEL_HEAD} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
                <div>
                  <p>
                    {placement.name}{' '}
                    <span className="font-normal text-slate-500">
                      · {list.length} banner{list.length === 1 ? '' : 's'}
                    </span>
                  </p>
                  <p className="text-xs font-normal text-slate-500">
                    {placement.where} Recommended {width} × {height}px.
                  </p>
                </div>
                {placement.groups ? null : (
                  <button
                    type="button"
                    onClick={() => setModal({ open: true, placement, editing: null })}
                    className={`${BTN_PRIMARY} gap-1.5`}
                  >
                    <Plus className="h-4 w-4" /> Add {device} banner
                  </button>
                )}
              </div>
              {placement.groups ? (
                <div className="divide-y divide-slate-100">
                  {placement.groups.map((group) => {
                    const items = list.filter((banner) => banner.category === group.key);
                    return (
                      <div key={group.key} className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">
                            {group.name}{' '}
                            <span className="font-normal text-slate-500">
                              · {items.length} banner{items.length === 1 ? '' : 's'}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => setModal({ open: true, placement, editing: null, category: group.key })}
                            className={`${BTN} gap-1.5`}
                          >
                            <Plus className="h-4 w-4" /> {group.addLabel || `Add ${device} banner`}
                          </button>
                        </div>
                        {renderGrid(items, group.empty)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4">
                  {renderGrid(list, `No ${device} banners yet — this slot is hidden on the storefront until you add one.`)}
                </div>
              )}
            </section>
          );
        })
      )}

      <BannerModal
        open={modal.open}
        editing={modal.editing}
        section={section}
        placement={modal.placement}
        device={device}
        category={modal.category}
        onClose={closeModal}
        onSaved={() => {
          closeModal();
          load();
        }}
      />
    </div>
  );
}
