import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Leaf, Loader2, Plus } from 'lucide-react';
import erpApi from '../../api/erpApi';
import categoryApi from '../../api/categoryApi';
import opsApi from '../../api/opsApi';
import {
  DEFAULT_PRODUCT_CATEGORIES,
  getCategoryCode,
  resolveCropCode,
  resolveVarietyCode,
} from '../erp/CropsPage';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';

const initialForm = {
  category: 'Vegetables',
  cropName: '',
  variety: '',
};

export default function AdminAddCropPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [productCategories, setProductCategories] = useState(DEFAULT_PRODUCT_CATEGORIES);
  const [farmers, setFarmers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      erpApi.farmers({ limit: 100 }),
      categoryApi.getAllCategories(),
      opsApi.list('crop-catalog'),
    ]).then(([farmersRes, catRes, catalogRes]) => {
      if (!alive) return;
      if (farmersRes.status === 'fulfilled') {
        const list = farmersRes.value.data?.farmers || farmersRes.value.data?.items || [];
        setFarmers(Array.isArray(list) ? list : []);
      }
      if (catRes.status === 'fulfilled') {
        const raw = catRes.value?.categories || catRes.value?.data || catRes.value || [];
        const list = Array.isArray(raw) ? raw : [];
        const seen = new Set();
        const extracted = [];
        for (const c of list) {
          const name = String(c.categoryName || c.name || '').trim();
          if (name && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            extracted.push({ id: c._id || name, name, code: getCategoryCode(name) });
          }
        }
        if (extracted.length) setProductCategories(extracted);
      }
      if (catalogRes.status === 'fulfilled') {
        setCatalog(Array.isArray(catalogRes.value.data) ? catalogRes.value.data : []);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const previewCropId = useMemo(() => {
    const catCode = getCategoryCode(form.category || form.cropName);
    const cropCode = resolveCropCode(form.cropName);
    const varCode = resolveVarietyCode(form.variety);
    return `GGC-CRP-${catCode}-${cropCode}-${varCode}-00001`;
  }, [form.cropName, form.variety, form.category]);

  const handleCropNameChange = (val) => {
    const lower = val.toLowerCase();
    let detectedCat = form.category;
    if (
      lower.includes('mango') ||
      lower.includes('apple') ||
      lower.includes('banana') ||
      lower.includes('orange') ||
      lower.includes('fruit') ||
      lower.includes('grape')
    ) {
      const match = productCategories.find((c) => c.name.toLowerCase().includes('fruit'));
      if (match) detectedCat = match.name;
    } else if (
      lower.includes('tomato') ||
      lower.includes('onion') ||
      lower.includes('potato') ||
      lower.includes('carrot') ||
      lower.includes('brinjal') ||
      lower.includes('palak') ||
      lower.includes('spinach')
    ) {
      const match = productCategories.find((c) => c.name.toLowerCase().includes('veg'));
      if (match) detectedCat = match.name;
    } else if (
      lower.includes('wheat') ||
      lower.includes('rice') ||
      lower.includes('grain') ||
      lower.includes('bajra') ||
      lower.includes('jowar')
    ) {
      const match = productCategories.find((c) => c.name.toLowerCase().includes('grain'));
      if (match) detectedCat = match.name;
    } else if (
      lower.includes('chilli') ||
      lower.includes('turmeric') ||
      lower.includes('ginger') ||
      lower.includes('garlic') ||
      lower.includes('spice')
    ) {
      const match = productCategories.find((c) => c.name.toLowerCase().includes('spice'));
      if (match) detectedCat = match.name;
    }
    setForm((prev) => ({
      ...prev,
      cropName: val,
      category: prev.category === 'Vegetables' || !prev.category ? detectedCat : prev.category,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cropName = form.cropName.trim();
    const variety = form.variety.trim();
    if (!cropName) {
      setFormError('Please enter a crop name');
      return;
    }
    if (!variety) {
      setFormError('Please enter a variety name');
      return;
    }
    const exists = catalog.some(
      (c) =>
        String(c.cropName || '').trim().toLowerCase() === cropName.toLowerCase() &&
        String(c.variety || '').trim().toLowerCase() === variety.toLowerCase()
    );
    if (exists) {
      setFormError('This crop and variety is already in the catalog.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const catCode = getCategoryCode(form.category || cropName);
      const payload = {
        cropName,
        variety,
        category: form.category || 'Vegetables',
        categoryCode: catCode,
        cropCode: resolveCropCode(cropName),
        farmerId: farmers[0]?.id || 'farmer-master-catalog',
        season: 'Kharif',
        status: 'Growing',
      };
      const res = await erpApi.create('crops', payload);
      const newCrop = res.data?.item || res.data;
      setSuccessToast(`Crop "${cropName} (${variety})" added with ID ${newCrop?.cropId || 'ERP-CRP'}.`);
      setTimeout(() => navigate('/collection-crops'), 700);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create crop. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {successToast ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      ) : null}

      <div>
        <p className={PAGE_KICKER}>Farmers</p>
        <h1 className={PAGE_TITLE}>Add Crop</h1>
        <p className={PAGE_SUB}>Register a crop name and variety in the admin catalog.</p>
      </div>

      <form onSubmit={handleSubmit} className={`${PANEL} mx-auto max-w-xl p-6 space-y-4`}>
        {formError ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Crop ID</span>
              <p className="font-mono text-base font-extrabold tracking-wide text-emerald-950">{previewCropId}</p>
            </div>
            <span className="rounded-full bg-emerald-200/80 px-2.5 py-1 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-300">
              Auto Generated
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Category <span className="text-rose-500">*</span>
          </label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={INPUT}>
            {productCategories.map((cat) => (
              <option key={cat.id || cat.name} value={cat.name}>
                {cat.name} ({cat.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Crop Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Tomato, Onion, Mango"
            value={form.cropName}
            onChange={(e) => handleCropNameChange(e.target.value)}
            className={INPUT}
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Variety Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Yogi, Hybrid, Hapus"
            value={form.variety}
            onChange={(e) => setForm({ ...form, variety: e.target.value })}
            className={INPUT}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Link to="/collection-crops" className={BTN}>
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
            {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {isSubmitting ? 'Saving…' : 'Save Crop'}
          </button>
        </div>
      </form>

      <p className="mx-auto max-w-xl text-center text-xs text-slate-400">
        <Leaf className="mr-1 inline h-3.5 w-3.5" />
        Saved crops appear in All Crops and can be planted by farmers.
      </p>
    </div>
  );
}
