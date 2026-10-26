import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ImageIcon, Loader2, Pencil, Plus } from 'lucide-react';
import baseProductApi from '../api/baseProductApi';
import categoryApi from '../api/categoryApi';
import sectionApi from '../api/sectionApi';
import { apiErrorMessage } from '../utils/baseProducts';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../utils/ui';

function ImageUpload({ image, uploading, onUpload, onClear }) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-[#f4f8ec] transition hover:border-emerald-500">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400">
            <ImageIcon className="h-5 w-5" />
            Upload
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
          </span>
        ) : null}
      </label>
      <div className="text-xs text-slate-500">
        <p>Shown on the category page card.</p>
        {image ? (
          <button type="button" onClick={onClear} className="mt-1 font-medium text-rose-600">
            Remove image
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Add or edit one base product. `?id=` edits; `?section=&category=` pre-fills a new one. */
export default function BaseProducts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id') || '';

  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState(searchParams.get('section') || 'preorder');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sectionCategories = useMemo(
    () =>
      categories
        .filter((cat) => String(cat.section || 'preorder').toLowerCase() === section)
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName)),
    [categories, section]
  );

  useEffect(() => {
    (async () => {
      try {
        const [secRes, catRes, baseRes] = await Promise.all([
          sectionApi.getActiveSections(),
          categoryApi.getAllCategories({ limit: 500 }),
          editId ? baseProductApi.list() : Promise.resolve(null),
        ]);
        setSections(secRes.data || []);
        setCategories(catRes.data || []);
        if (editId) {
          const item = (baseRes?.data || []).find((row) => row._id === editId);
          if (!item) {
            setError('Base product not found.');
          } else {
            setEditing(item);
            setName(item.name);
            setImage(item.image || '');
            if (item.section) setSection(item.section);
            setCategory(item.category);
          }
        }
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load sections and categories.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  useEffect(() => {
    if (editing || loading) return;
    if (!sectionCategories.some((cat) => cat.categoryName === category)) {
      setCategory(sectionCategories[0]?.categoryName || '');
    }
  }, [sectionCategories, category, editing, loading]);

  const listUrl = `/products/base-products/${section}`;

  const handleUpload = async (file) => {
    try {
      setUploading(true);
      setError('');
      setImage(await baseProductApi.uploadImage(file));
    } catch (err) {
      setError(apiErrorMessage(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Enter a base product name.');
    if (!editing && !category) return setError('Choose a category first.');

    try {
      setSaving(true);
      setError('');
      if (editing) {
        await baseProductApi.update(editing._id, { name: trimmed, image });
      } else {
        await baseProductApi.create({ name: trimmed, image, section, category });
      }
      navigate(listUrl);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save base product.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Catalog · Product</p>
          <h1 className={PAGE_TITLE}>{editing ? 'Edit base product' : 'Add base product'}</h1>
          <p className={PAGE_SUB}>
            A base product groups products on the category page, e.g. Apple → Shimla Apple, Green Apple.
          </p>
        </div>
        <Link to={listUrl} className={`${BTN} gap-1.5`}>
          <ArrowLeft className="h-4 w-4" /> All base products
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      ) : null}

      <form onSubmit={handleSubmit} className={`${PANEL} space-y-5 p-4 sm:p-6`}>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Section</p>
          <div className="flex flex-wrap gap-2">
            {sections.map((sec) => (
              <button
                key={sec.slug}
                type="button"
                disabled={Boolean(editing)}
                onClick={() => setSection(sec.slug)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                  section === sec.slug
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {sec.sectionName}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Category</span>
            <select
              value={category}
              disabled={Boolean(editing) || loading}
              onChange={(e) => setCategory(e.target.value)}
              className={INPUT}
            >
              {sectionCategories.length === 0 ? <option value="">No categories in this section</option> : null}
              {editing && !sectionCategories.some((cat) => cat.categoryName === category) ? (
                <option value={category}>{category}</option>
              ) : null}
              {sectionCategories.map((cat) => (
                <option key={cat._id} value={cat.categoryName}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Base product name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apple, Onion, Tomato"
              className={INPUT}
            />
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Base product image</p>
          <ImageUpload image={image} uploading={uploading} onUpload={handleUpload} onClear={() => setImage('')} />
        </div>

        <div className="flex justify-end gap-2">
          <Link to={listUrl} className={BTN}>
            Cancel
          </Link>
          <button type="submit" disabled={saving || uploading || loading} className={`${BTN_PRIMARY} gap-1.5`}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editing ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editing ? 'Save changes' : 'Add base product'}
          </button>
        </div>
      </form>
    </div>
  );
}
