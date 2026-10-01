import { useEffect, useMemo, useState } from 'react';
import {
  Leaf,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import erpApi from '../../api/erpApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_TITLE, PANEL, TH } from '../../utils/ui';

const CROP_CATEGORIES = [
  { code: 'VEG', label: 'Vegetables' },
  { code: 'FRT', label: 'Fruits' },
  { code: 'GRN', label: 'Grains & Cereals' },
  { code: 'PLS', label: 'Pulses & Legumes' },
  { code: 'SPC', label: 'Spices' },
  { code: 'FLW', label: 'Flowers' },
  { code: 'CSH', label: 'Cash Crops' },
  { code: 'OTH', label: 'Other' },
];

const CROP_CODES_LOOKUP = {
  tomato: 'TOM',
  onion: 'ONI',
  potato: 'POT',
  carrot: 'CAR',
  cucumber: 'CUC',
  spinach: 'SPI',
  palak: 'SPI',
  cabbage: 'CAB',
  cauliflower: 'CAU',
  brinjal: 'BRI',
  eggplant: 'BRI',
  chilli: 'CHI',
  chili: 'CHI',
  capsicum: 'CAP',
  beans: 'BEA',
  okra: 'OKR',
  bhindi: 'OKR',
  garlic: 'GAR',
  ginger: 'GIN',
  lemon: 'LEM',
  mango: 'MAN',
  banana: 'BAN',
  apple: 'APP',
  orange: 'ORA',
  grapes: 'GRA',
  wheat: 'WHE',
  rice: 'RIC',
  bajra: 'BAJ',
  jowar: 'JOW',
  maize: 'MAI',
};

function resolveCropCode(name = '') {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return 'XXX';
  if (CROP_CODES_LOOKUP[key]) return CROP_CODES_LOOKUP[key];
  const hit = Object.keys(CROP_CODES_LOOKUP).find((n) => key.includes(n));
  if (hit) return CROP_CODES_LOOKUP[hit];
  const clean = key.replace(/[^a-z0-9]/g, '');
  return (clean.slice(0, 3) || 'XXX').toUpperCase().padEnd(3, 'X');
}

function resolveVarietyCode(name = '') {
  const raw = String(name || '').trim();
  if (!raw) return 'XXX';
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '');
  if (!cleaned) return 'XXX';
  return cleaned.slice(0, 3).toUpperCase().padEnd(3, 'X');
}

function resolveCategoryCode(name = '', chosen = 'VEG') {
  if (chosen && chosen !== 'VEG') return chosen;
  const n = String(name || '').toLowerCase();
  if (/(oil|soybean|mustard|sunflower|groundnut|sesame|linseed)/.test(n)) return 'OIL';
  if (/(mango|banana|apple|fruit|orange|grapes|pomegranate|papaya|guava|watermelon|chikoo|strawberry)/.test(n)) return 'FRT';
  if (/(wheat|rice|grain|bajra|jowar|maize|cereal|barley)/.test(n)) return 'GRN';
  if (/(dal|pulse|tur|moong|urad|gram|chana|pea|lentil)/.test(n)) return 'PLS';
  if (/(chilli|turmeric|spice|cumin|coriander|pepper|ginger|garlic|clove|cardamom)/.test(n)) return 'SPC';
  if (/(flower|rose|marigold|jasmine|mogra|shevanti)/.test(n)) return 'FLW';
  if (/(cotton|sugarcane|tobacco|cash|jute)/.test(n)) return 'CSH';
  return chosen || 'VEG';
}

export default function CropsPage() {
  const [crops, setCrops] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedId, setCopiedId] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State - only Crop Name and Variety Name as requested
  const initialForm = {
    cropName: '',
    variety: '',
  };
  const [form, setForm] = useState(initialForm);

  // Dynamic preview for Add Crop
  const previewCropId = useMemo(() => {
    const cat = resolveCategoryCode(form.cropName);
    const cropCode = resolveCropCode(form.cropName);
    const varCode = resolveVarietyCode(form.variety);
    return `GGC-CRP-${cat}-${cropCode}-${varCode}-00001`;
  }, [form.cropName, form.variety]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cropsRes, farmersRes] = await Promise.allSettled([
        erpApi.list('crops', { limit: 100 }),
        erpApi.farmers({ limit: 100 }),
      ]);

      if (cropsRes.status === 'fulfilled') {
        setCrops(cropsRes.value.data.items || []);
      } else {
        setError('Failed to load crop records. Please ensure backend is running.');
      }

      if (farmersRes.status === 'fulfilled') {
        const fList = farmersRes.value.data.farmers || farmersRes.value.data.items || [];
        setFarmers(fList);
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to ERP service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2500);
  };

  const handleOpenAdd = () => {
    setForm(initialForm);
    setFormError('');
    setIsAddOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cropName.trim()) {
      setFormError('Please enter a crop name');
      return;
    }
    if (!form.variety.trim()) {
      setFormError('Please enter a variety name');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const catCode = resolveCategoryCode(form.cropName);
      const cropCode = resolveCropCode(form.cropName);
      const payload = {
        cropName: form.cropName.trim(),
        variety: form.variety.trim(),
        category: catCode,
        categoryCode: catCode,
        cropCode,
        farmerId: farmers[0]?.id || 'farmer-master-catalog',
        season: 'Kharif',
        status: 'Growing',
      };

      const res = await erpApi.create('crops', payload);
      const newCrop = res.data?.item || res.data;
      setSuccessToast(`Crop "${payload.cropName} (${payload.variety})" added successfully with ID: ${newCrop?.cropId || 'ERP-CRP'}!`);
      setIsAddOpen(false);
      setForm(initialForm);
      await loadData();
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      console.error('Failed to create crop:', err);
      setFormError(err.response?.data?.message || 'Failed to create crop. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.cropId || deleteTarget.id || deleteTarget._id;
    setIsDeleting(true);
    try {
      await erpApi.remove('crops', targetId);
      setSuccessToast(`Crop "${deleteTarget.cropName}" deleted successfully.`);
      setDeleteTarget(null);
      await loadData();
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Failed to delete crop:', err);
      alert(err.response?.data?.message || 'Failed to delete crop.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCrops = useMemo(() => {
    return crops.filter((c) => {
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) {
        return false;
      }
      if (q.trim()) {
        const query = q.toLowerCase();
        const matchesId = String(c.cropId || '').toLowerCase().includes(query);
        const matchesName = String(c.cropName || '').toLowerCase().includes(query);
        const matchesVariety = String(c.variety || '').toLowerCase().includes(query);
        if (!matchesId && !matchesName && !matchesVariety) {
          return false;
        }
      }
      return true;
    });
  }, [crops, q, selectedCategory]);

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className={PAGE_TITLE}>Crops</h1>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            {crops.length} Master Crops
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className={BTN}
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Add Crop
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={`${PANEL} p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Crop ID, Crop Name, Variety..."
            className={`${INPUT} pl-9 text-xs`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="ALL">All Categories</option>
            {CROP_CATEGORIES.map((cat) => (
              <option key={cat.code} value={cat.code}>
                {cat.label} ({cat.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table / List */}
      <div className={PANEL}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-sm font-medium">Loading crops from ERP database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Leaf className="mx-auto h-10 w-10 text-emerald-600/40 mb-3" />
            <p className="text-base font-bold text-slate-800">No crops found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {q || selectedCategory !== 'ALL'
                ? 'Try adjusting your search filters.'
                : 'Click "Add Crop" to register the first crop in the system.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className={`${BTN_PRIMARY} mt-4`}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Crop
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className={TH}>Crop ID</th>
                  <th className={TH}>Crop Name</th>
                  <th className={TH}>Variety Name</th>
                  <th className={TH}>Category</th>
                  <th className={`${TH} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCrops.map((crop) => {
                  const id = crop.cropId || crop.id;
                  const isCopied = copiedId === id;
                  return (
                    <tr
                      key={crop._id || id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-3 py-3 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-800">{id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(id)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Copy Crop ID"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900">
                        {crop.cropName}
                      </td>
                      <td className="px-3 py-3 text-slate-700 font-medium">
                        {crop.variety || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {crop.category || 'VEG'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(crop)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete Crop"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADD CROP MODAL (Only Crop Name and Variety Name) */}
      {/* ============================================================ */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Crop</h3>
                  <p className="text-xs text-slate-500">Register crop master profile with name and variety</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Dynamic Auto-Generated Crop ID Banner */}
              <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50/70 p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Crop ID (ERP Master)
                    </span>
                    <p className="font-mono text-base font-extrabold tracking-wide text-emerald-950">
                      {previewCropId}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-200/80 px-2.5 py-1 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-300">
                    Auto Generated
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Follows GGC-CRP-&#123;Category&#125;-&#123;Crop&#125;-&#123;Variety&#125;-&#123;Serial&#125; ERP standard format
                </p>
              </div>

              {/* Crop Name & Variety Name — strictly these two fields */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Crop Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tomato, Onion, Potato..."
                    value={form.cropName}
                    onChange={(e) => setForm({ ...form, cropName: e.target.value })}
                    className={INPUT}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Variety Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yogi, Hybrid, Bajeerao..."
                    value={form.variety}
                    onChange={(e) => setForm({ ...form, variety: e.target.value })}
                    className={INPUT}
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmitting}
                  className={BTN}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60 transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving Crop...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Save Crop
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Crop?</h3>
              <p className="mt-1.5 text-sm text-slate-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900">{deleteTarget.cropName}</span>
                {deleteTarget.variety ? ` (${deleteTarget.variety})` : ''}?
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-500">
                Crop ID: {deleteTarget.cropId || deleteTarget.id}
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className={BTN}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-60 transition"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" /> Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
