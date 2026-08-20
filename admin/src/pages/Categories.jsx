import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  Layers,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  LayoutGrid,
  List,
  FolderTree,
  ArrowUpDown,
  Copy,
  ExternalLink,
  Tag,
  TrendingUp,
  Package,
  Eye,
  SlidersHorizontal,
  Upload,
  ImageIcon,
  Loader2,
  Link2,
} from 'lucide-react';
import categoryApi from '../api/categoryApi';
import sectionApi from '../api/sectionApi';

const API_BASE = 'http://localhost:5001';

const PRESET_ICONS_AND_IMAGES = [
  { name: 'Vegetables', emoji: '🥦', image: '/categories/vegetables.webp', bg: '#E2F0D9', section: 'greengrocc' },
  { name: 'Fruits', emoji: '🍎', image: '/categories/fruits.webp', bg: '#F0F7ED', section: 'greengrocc' },
  { name: 'Dairy', emoji: '🥛', image: '/categories/dairy.webp', bg: '#E8F5E9', section: 'greengrocc' },
  { name: 'Grains', emoji: '🌾', image: '/categories/grains.webp', bg: '#E8F5E0', section: 'greengrocc' },
  { name: 'Pulses', emoji: '🌱', image: '/categories/pulses.webp', bg: '#EAF5DF', section: 'greengrocc' },
  { name: 'Grocery', emoji: '🧂', image: '/categories/grocery.webp', bg: '#EAF5DF', section: 'greengrocc' },
  { name: 'Oils', emoji: '🫒', image: '/categories/oils.webp', bg: '#F7F1DC', section: 'greengrocc' },
  { name: 'Spices', emoji: '🌶️', image: '/categories/spices.webp', bg: '#F7F1DC', section: 'greengrocc' },
  { name: 'Dry Fruits', emoji: '🥜', image: '/categories/dry-fruits.webp', bg: '#F5EDE0', section: 'greengrocc' },
  { name: 'Organic', emoji: '🍯', image: '/categories/organic.webp', bg: '#E8F5DF', section: 'greengrocc' },
  { name: 'Beverages', emoji: '🥤', image: '/categories/beverages.webp', bg: '#E8F4FC', section: 'greengrocc' },
  { name: 'Bakery', emoji: '🍞', image: '/categories/bakery.webp', bg: '#F5EBD9', section: 'greengrocc' },
  { name: 'Chopped Veggies', emoji: '🧅', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=300&h=300&q=80', bg: '#E8F8EE', section: 'ready2cook' },
  { name: 'Cut & Sliced', emoji: '🥕', image: 'https://images.unsplash.com/photo-1598170845058-12ef4a457c39?auto=format&fit=crop&w=300&h=300&q=80', bg: '#EEFBEB', section: 'ready2cook' },
  { name: 'Peeled Garlic', emoji: '🥔', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&h=300&q=80', bg: '#EBF7FF', section: 'ready2cook' },
  { name: 'Packaged Foods', emoji: '🛒', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80', bg: '#E8F8EE', section: 'supermall' },
];

const PRESET_SECTION_EMOJIS = [
  '🥦', '🍳', '🏬', '🥗', '🍎', '🌾', '🥛', '🍞',
  '🌿', '🌶️', '🥩', '☕', '🧴', '🛍️', '📦', '🍯',
  '🥜', '🧃', '🍫', '✨', '⚡', '🛒'
];

const PRESET_COLORS = [
  { name: 'Mint', hex: '#E2F0D9' },
  { name: 'Emerald', hex: '#E8F5E9' },
  { name: 'Pistachio', hex: '#F0F7ED' },
  { name: 'Yellow', hex: '#F7F1DC' },
  { name: 'Cream', hex: '#FFF8E7' },
  { name: 'Orange', hex: '#F5EDE0' },
  { name: 'Blue', hex: '#E8F4FC' },
  { name: 'Purple', hex: '#F3E8FF' },
  { name: 'Pink', hex: '#FFE8E8' },
];

export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSectionParam = searchParams.get('section') || 'all';

  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState(initialSectionParam);
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('order'); // order, name, count
  const [viewMode, setViewMode] = useState('grid'); // grid, table

  // Modals state
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const [isAddSecModalOpen, setIsAddSecModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [deletingSection, setDeletingSection] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'
  const imageInputRef = useRef(null);

  // Form State for Category
  const [catFormData, setCatFormData] = useState({
    categoryName: '',
    slug: '',
    section: 'greengrocc',
    sectionName: 'GreenGrocc',
    categoryImage: '',
    itemCount: '100+ items',
    emoji: '🥦',
    bg: '#E8F5E9',
    subcategories: [],
    storeType: 'main',
    order: 0,
    isActive: true,
  });
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');

  // Form State for Section
  const [secFormData, setSecFormData] = useState({
    sectionName: '',
    slug: '',
    description: '',
    emoji: '🌿',
    badge: '',
    color: '#10B981',
    order: 0,
    isActive: true,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [secRes, catRes] = await Promise.all([
        sectionApi.getActiveSections({ includeInactive: true }),
        categoryApi.getAllCategories({ limit: 200 }),
      ]);

      if (secRes.success && Array.isArray(secRes.data)) {
        setSections(secRes.data);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      } else {
        const fallback = await categoryApi.getActiveCategories({ includeInactive: true });
        if (fallback.success && Array.isArray(fallback.data)) {
          setCategories(fallback.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast('Could not load data from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const urlSection = searchParams.get('section');
    if (urlSection) {
      setSelectedSectionFilter(urlSection);
    }
  }, [searchParams]);

  const handleSectionFilterChange = (secSlug) => {
    setSelectedSectionFilter(secSlug);
    if (secSlug === 'all') {
      searchParams.delete('section');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ section: secSlug });
    }
  };

  // Section category counts
  const sectionCounts = useMemo(() => {
    const counts = { all: categories.length };
    categories.forEach((cat) => {
      const slug = (cat.section || 'greengrocc').toLowerCase();
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [categories]);

  // Overall Stats
  const metrics = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive).length;
    const inactive = total - active;
    const subCount = categories.reduce(
      (acc, c) => acc + (Array.isArray(c.subcategories) ? c.subcategories.length : 0),
      0
    );
    return { total, active, inactive, subCount, totalSections: sections.length };
  }, [categories, sections]);

  // Filtered & Sorted categories list
  const filteredCategories = useMemo(() => {
    let result = categories.filter((cat) => {
      const matchSearch =
        !searchTerm ||
        cat.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.sectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.subcategories?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? cat.isActive
          : !cat.isActive;

      const catSectionSlug = (cat.section || 'greengrocc').toLowerCase();
      const matchSection =
        selectedSectionFilter === 'all'
          ? true
          : catSectionSlug === selectedSectionFilter.toLowerCase();

      return matchSearch && matchStatus && matchSection;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.categoryName || '').localeCompare(b.categoryName || '');
      }
      if (sortBy === 'count') {
        const countA = parseInt(a.itemCount) || 0;
        const countB = parseInt(b.itemCount) || 0;
        return countB - countA;
      }
      return (a.order || 0) - (b.order || 0);
    });

    return result;
  }, [categories, searchTerm, statusFilter, selectedSectionFilter, sortBy]);

  const getSectionInfo = (secSlug) => {
    const slug = (secSlug || 'greengrocc').toLowerCase();
    const found = sections.find((s) => s.slug.toLowerCase() === slug);
    if (found) {
      return {
        name: found.sectionName,
        emoji: found.emoji || '🌿',
        color: found.color || '#10B981',
      };
    }
    if (slug === 'ready2cook') return { name: 'Ready2Cook', emoji: '🍳', color: '#EA580C' };
    if (slug === 'supermall') return { name: 'SuperMall', emoji: '🏬', color: '#2563EB' };
    return { name: 'GreenGrocc', emoji: '🥦', color: '#10B981' };
  };

  // ================= IMAGE UPLOAD HANDLERS =================
  const handleImageFileChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'categories');

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setCatFormData((prev) => ({ ...prev, categoryImage: data.url }));
        setImagePreview(data.url);
        showToast('Image uploaded to S3 ✓');
      } else {
        showToast(data.message || 'Upload failed', 'error');
        setImagePreview(catFormData.categoryImage || '');
      }
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
      setImagePreview(catFormData.categoryImage || '');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFileChange(file);
  };

  // ================= CATEGORY HANDLERS =================
  const handleOpenAddCatModal = () => {
    const defaultSecSlug =
      selectedSectionFilter !== 'all' ? selectedSectionFilter : (sections[0]?.slug || 'greengrocc');
    const defaultSec = sections.find((s) => s.slug === defaultSecSlug);

    setEditingCategory(null);
    setImagePreview('');
    setImageMode('upload');
    setCatFormData({
      categoryName: '',
      slug: '',
      section: defaultSecSlug,
      sectionName: defaultSec ? defaultSec.sectionName : 'GreenGrocc',
      categoryImage: '',
      itemCount: '50+ items',
      emoji: '🥦',
      bg: '#E2F0D9',
      subcategories: ['Fresh Produce', 'Daily Essentials'],
      storeType: defaultSecSlug === 'ready2cook' ? 'festive' : defaultSecSlug === 'supermall' ? 'mall' : 'main',
      order: categories.length + 1,
      isActive: true,
    });
    setNewSubcategoryInput('');
    setIsAddCatModalOpen(true);
  };

  const handleOpenEditCatModal = (cat) => {
    const catSection = (cat.section || 'greengrocc').toLowerCase();
    const foundSec = sections.find((s) => s.slug.toLowerCase() === catSection);

    setEditingCategory(cat);
    setImagePreview(cat.categoryImage || '');
    setImageMode(cat.categoryImage ? 'upload' : 'upload');
    setCatFormData({
      categoryName: cat.categoryName || '',
      slug: cat.slug || cat.categoryName || '',
      section: catSection,
      sectionName: cat.sectionName || (foundSec ? foundSec.sectionName : 'GreenGrocc'),
      categoryImage: cat.categoryImage || '',
      itemCount: cat.itemCount || '50+ items',
      emoji: cat.emoji || '🛒',
      bg: cat.bg || '#E8F5E9',
      subcategories: Array.isArray(cat.subcategories) ? [...cat.subcategories] : [],
      storeType: cat.storeType || (catSection === 'ready2cook' ? 'festive' : catSection === 'supermall' ? 'mall' : 'main'),
      order: cat.order || 0,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
    });
    setNewSubcategoryInput('');
    setIsAddCatModalOpen(true);
  };

  const handleSelectPreset = (preset) => {
    const secSlug = preset.section || catFormData.section || 'greengrocc';
    const foundSec = sections.find((s) => s.slug.toLowerCase() === secSlug.toLowerCase());

    setCatFormData((prev) => ({
      ...prev,
      categoryName: prev.categoryName || preset.name,
      slug: prev.slug || preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      emoji: preset.emoji,
      categoryImage: preset.image,
      bg: preset.bg,
      section: secSlug,
      sectionName: foundSec ? foundSec.sectionName : prev.sectionName,
    }));
  };

  const handleAddSubcategory = (e) => {
    if (e) e.preventDefault();
    const trimmed = newSubcategoryInput.trim();
    if (!trimmed) return;
    if (!catFormData.subcategories.includes(trimmed)) {
      setCatFormData((prev) => ({
        ...prev,
        subcategories: [...prev.subcategories, trimmed],
      }));
    }
    setNewSubcategoryInput('');
  };

  const handleRemoveSubcategory = (sub) => {
    setCatFormData((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((s) => s !== sub),
    }));
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.categoryName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...catFormData,
        categoryName: catFormData.categoryName.trim(),
        slug: catFormData.slug.trim() || catFormData.categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        section: (catFormData.section || 'greengrocc').toLowerCase(),
        order: Number(catFormData.order) || 0,
      };

      if (editingCategory) {
        const res = await categoryApi.updateCategory(editingCategory._id, payload);
        if (res.success) {
          showToast(`Updated "${payload.categoryName}"`);
          setIsAddCatModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'Failed to update', 'error');
        }
      } else {
        const res = await categoryApi.createCategory(payload);
        if (res.success) {
          showToast(`Added "${payload.categoryName}"`);
          setIsAddCatModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'Failed to create', 'error');
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      showToast(err.response?.data?.message || err.message || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      setIsSubmitting(true);
      const res = await categoryApi.deleteCategory(deletingCategory._id);
      if (res.success) {
        showToast(`Deleted "${deletingCategory.categoryName}"`);
        setDeletingCategory(null);
        loadData();
      } else {
        showToast(res.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCatStatus = async (cat) => {
    try {
      const updatedStatus = !cat.isActive;
      const res = await categoryApi.updateCategory(cat._id, { isActive: updatedStatus });
      if (res.success) {
        showToast(`Category ${updatedStatus ? 'Activated' : 'Disabled'}`);
        setCategories((prev) =>
          prev.map((c) => (c._id === cat._id ? { ...c, isActive: updatedStatus } : c))
        );
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // ================= SECTION HANDLERS =================
  const handleOpenAddSecModal = () => {
    setEditingSection(null);
    setSecFormData({
      sectionName: '',
      slug: '',
      description: '',
      emoji: '🌿',
      badge: '',
      color: '#10B981',
      order: sections.length + 1,
      isActive: true,
    });
    setIsAddSecModalOpen(true);
  };

  const handleOpenEditSecModal = (sec) => {
    setEditingSection(sec);
    setSecFormData({
      sectionName: sec.sectionName || '',
      slug: sec.slug || '',
      description: sec.description || '',
      emoji: sec.emoji || '🌿',
      badge: sec.badge || '',
      color: sec.color || '#10B981',
      order: typeof sec.order === 'number' ? sec.order : 0,
      isActive: sec.isActive !== undefined ? sec.isActive : true,
    });
    setIsAddSecModalOpen(true);
  };

  const handleSubmitSection = async (e) => {
    e.preventDefault();
    if (!secFormData.sectionName.trim()) {
      showToast('Section name is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...secFormData,
        sectionName: secFormData.sectionName.trim(),
        slug: secFormData.slug.trim() || secFormData.sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        order: Number(secFormData.order) || 0,
      };

      if (editingSection) {
        const res = await sectionApi.updateSection(editingSection._id, payload);
        if (res.success) {
          showToast(`Updated "${res.data.sectionName}"`);
          setIsAddSecModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'Failed to update section', 'error');
        }
      } else {
        const res = await sectionApi.createSection(payload);
        if (res.success) {
          showToast(`Created "${res.data.sectionName}"`);
          setIsAddSecModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'Failed to create section', 'error');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingSection) return;
    try {
      setIsSubmitting(true);
      const res = await sectionApi.deleteSection(deletingSection._id);
      if (res.success) {
        showToast(`Deleted "${deletingSection.sectionName}"`);
        setDeletingSection(null);
        if (selectedSectionFilter === deletingSection.slug) {
          handleSectionFilterChange('all');
        }
        loadData();
      } else {
        showToast(res.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSectionObj = sections.find((s) => s.slug.toLowerCase() === selectedSectionFilter.toLowerCase());

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-xl text-xs font-semibold text-white transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error' ? 'bg-rose-600 shadow-rose-500/25' : 'bg-slate-950 dark:bg-emerald-600 shadow-black/30'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Catalog Management
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure store departments & product categories efficiently
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddSecModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs cursor-pointer"
          >
            <FolderTree className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>New Section</span>
          </button>

          <button
            onClick={handleOpenAddCatModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Ribbon - Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Categories</span>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{metrics.total}</p>
          </div>
          <Package className="h-5 w-5 text-emerald-500/80 shrink-0" />
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active in App</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">{metrics.active}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600/80 shrink-0" />
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Store Sections</span>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400 leading-tight">{metrics.totalSections}</p>
          </div>
          <FolderTree className="h-5 w-5 text-blue-500/80 shrink-0" />
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sub-filters</span>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 leading-tight">{metrics.subCount}</p>
          </div>
          <Tag className="h-5 w-5 text-amber-500/80 shrink-0" />
        </div>
      </div>

      {/* ================= STORE SECTIONS BAR (Compact & Understandable) ================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <FolderTree className="h-3 w-3" />
            <span>Store Departments</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Select to filter view
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* "All Sections" Pill Card */}
          <div
            onClick={() => handleSectionFilterChange('all')}
            className={`group relative rounded-xl p-2.5 cursor-pointer transition-all duration-200 border flex items-center justify-between gap-2 ${
              selectedSectionFilter === 'all'
                ? 'bg-slate-950 text-white dark:bg-emerald-950/80 dark:border-emerald-500 shadow-md ring-2 ring-slate-950/20 dark:ring-emerald-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">🌐</span>
              <div className="min-w-0">
                <p className="font-black text-xs truncate">All Sections</p>
                <p className={`text-[10px] truncate ${selectedSectionFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Full Catalog
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                selectedSectionFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {categories.length}
            </span>
          </div>

          {/* Dynamic Section Cards */}
          {sections.map((sec) => {
            const isSelected = selectedSectionFilter.toLowerCase() === sec.slug.toLowerCase();
            const count = sectionCounts[sec.slug.toLowerCase()] || 0;
            return (
              <div
                key={sec._id || sec.slug}
                onClick={() => handleSectionFilterChange(sec.slug)}
                className={`group relative rounded-xl p-2.5 cursor-pointer transition-all duration-200 border flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                {/* Accent top border bar */}
                <div
                  className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full"
                  style={{ backgroundColor: sec.color || '#10B981' }}
                />

                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{sec.emoji || '🌿'}</span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {sec.sectionName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      /{sec.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {count}
                  </span>
                  <div
                    className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenEditSecModal(sec)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Edit Section"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setDeletingSection(sec)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40"
                      title="Delete Section"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= CATEGORIES CATALOG SECTION ================= */}
      <div className="space-y-3 pt-2">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{activeSectionObj ? `${activeSectionObj.emoji} ${activeSectionObj.sectionName}` : 'All Categories'}</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {filteredCategories.length} items
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
              <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value="order">Order</option>
                <option value="name">Name (A-Z)</option>
                <option value="count">Item Count</option>
              </select>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-0.5 rounded-lg capitalize transition-all cursor-pointer text-[11px] ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Grid / Table Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 py-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-800" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
            <Layers className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No categories found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchTerm || selectedSectionFilter !== 'all'
                ? 'No catalog items match your search query or filters.'
                : 'Get started by creating your first product category.'}
            </p>
            <button
              onClick={handleOpenAddCatModal}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Add Category
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Sleek Compact Grid View (5-6 Columns, Small Cards, Understandable & Clear) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredCategories.map((cat) => {
              const secInfo = getSectionInfo(cat.section);
              return (
                <div
                  key={cat._id || cat.slug}
                  className={`group relative rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 flex flex-col justify-between ${
                    cat.isActive
                      ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 hover:-translate-y-0.5'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Top Image Showcase Banner - Compact (h-22 = 88px) */}
                  <div
                    className="relative w-full h-22 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/80 transition-colors"
                    style={{
                      background: cat.bg || '#F1F5F9',
                    }}
                  >
                    {/* Department Chip Top-Left */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-[9px] font-extrabold text-slate-700 dark:text-slate-200 shadow-2xs border border-black/5">
                        <span>{secInfo.emoji}</span>
                        <span className="truncate max-w-[65px]">{secInfo.name}</span>
                      </span>
                    </div>

                    {/* Active Toggle Dot/Button Top-Right */}
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <button
                        onClick={() => handleToggleCatStatus(cat)}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold shadow-2xs backdrop-blur-xs transition-all active:scale-95 cursor-pointer ${
                          cat.isActive
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-slate-600 text-white hover:bg-slate-700'
                        }`}
                        title="Toggle Active Status"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cat.isActive ? 'bg-emerald-200 animate-pulse' : 'bg-slate-300'}`} />
                        <span>{cat.isActive ? 'Active' : 'Off'}</span>
                      </button>
                    </div>

                    {/* Category Image or Big Emoji */}
                    {cat.categoryImage ? (
                      <img
                        src={cat.categoryImage}
                        alt={cat.categoryName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <span
                      className="text-4xl transition-transform duration-300 group-hover:scale-110 select-none"
                      style={{ display: cat.categoryImage ? 'none' : 'block' }}
                    >
                      {cat.emoji || '🛒'}
                    </span>
                  </div>

                  {/* Body Content - Compact & Clean */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs leading-snug truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={cat.categoryName}>
                        {cat.categoryName}
                      </h3>

                      <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-slate-400 font-mono">
                        <span className="truncate">/{cat.slug}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                          {cat.itemCount || '0 items'}
                        </span>
                      </div>

                      {/* Subcategories count badge if present */}
                      {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 truncate">
                          <Tag className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                          <span className="truncate">{cat.subcategories.length} sub-filters ({cat.subcategories.slice(0, 2).join(', ')})</span>
                        </div>
                      )}
                    </div>

                    {/* Compact Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 font-mono">
                        #{cat.order || 0}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditCatModal(cat)}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 text-slate-600 transition-all cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-400 transition-all cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Modern Compact Table View */
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Subcategories</th>
                    <th className="py-2.5 px-3 text-center">Order</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {filteredCategories.map((cat) => {
                    const secInfo = getSectionInfo(cat.section);
                    return (
                      <tr key={cat._id || cat.slug} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-base shadow-2xs border border-black/5 overflow-hidden"
                              style={{ backgroundColor: cat.bg || '#E8F5E9' }}
                            >
                              {cat.categoryImage ? (
                                <img
                                  src={cat.categoryImage}
                                  alt={cat.categoryName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                cat.emoji || '🛒'
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs">
                                {cat.categoryName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {cat.itemCount || '0 items'} • /{cat.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <span>{secInfo.emoji}</span>
                            <span>{secInfo.name}</span>
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {cat.subcategories?.slice(0, 3).map((sub, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                {sub}
                              </span>
                            ))}
                            {cat.subcategories?.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                +{cat.subcategories.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 text-xs">
                          #{cat.order || 0}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleCatStatus(cat)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer ${
                              cat.isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditCatModal(cat)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingCategory(cat)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT SECTION ================= */}
      {isAddSecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => !isSubmitting && setIsAddSecModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {editingSection ? 'Edit Store Section' : 'Create Store Section'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddSecModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSection} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Farm"
                    value={secFormData.sectionName}
                    onChange={(e) => {
                      const name = e.target.value;
                      if (!editingSection) {
                        const autoSlug = name
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setSecFormData((prev) => ({ ...prev, sectionName: name, slug: autoSlug }));
                      } else {
                        setSecFormData((prev) => ({ ...prev, sectionName: name }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Slug identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. organic-farm"
                    value={secFormData.slug}
                    onChange={(e) => setSecFormData({ ...secFormData, slug: e.target.value.toLowerCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pure organic produce & farm essentials"
                  value={secFormData.description}
                  onChange={(e) => setSecFormData({ ...secFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Emoji Icon ({secFormData.emoji})
                </label>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-20 overflow-y-auto custom-scrollbar">
                  {PRESET_SECTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSecFormData({ ...secFormData, emoji })}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-lg transition-transform cursor-pointer ${
                        secFormData.emoji === emoji
                          ? 'bg-emerald-600 text-white shadow-sm scale-105'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Badge (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Mins"
                    value={secFormData.badge}
                    onChange={(e) => setSecFormData({ ...secFormData, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={secFormData.order}
                    onChange={(e) => setSecFormData({ ...secFormData, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSecModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT CATEGORY WITH LIVE PREVIEW ================= */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => !isSubmitting && setIsAddCatModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {editingCategory ? 'Edit Product Category' : 'Add New Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddCatModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="mt-5 space-y-4">
              {/* Department Target Selector */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/30">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                  <FolderTree className="h-4 w-4 text-emerald-600" />
                  <span>Choose Section (Department) *</span>
                </label>
                <select
                  value={catFormData.section}
                  onChange={(e) => {
                    const chosenSlug = e.target.value;
                    const chosenSec = sections.find((s) => s.slug.toLowerCase() === chosenSlug.toLowerCase());
                    setCatFormData((prev) => ({
                      ...prev,
                      section: chosenSlug,
                      sectionName: chosenSec ? chosenSec.sectionName : chosenSlug,
                      storeType: chosenSlug === 'ready2cook' ? 'festive' : chosenSlug === 'supermall' ? 'mall' : 'main',
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/40 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer shadow-xs"
                >
                  {sections.map((sec) => (
                    <option key={sec._id || sec.slug} value={sec.slug}>
                      {sec.emoji} {sec.sectionName} ({sec.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exotic Veggies"
                    value={catFormData.categoryName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!editingCategory) {
                        setCatFormData((prev) => ({ ...prev, categoryName: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
                      } else {
                        setCatFormData((prev) => ({ ...prev, categoryName: val }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Slug identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. exotic-veggies"
                    value={catFormData.slug}
                    onChange={(e) => setCatFormData({ ...catFormData, slug: e.target.value.toLowerCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Quick Presets Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Quick Presets</span>
                </label>
                <div className="flex flex-wrap gap-1 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-20 overflow-y-auto custom-scrollbar">
                  {PRESET_ICONS_AND_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                    >
                      {preset.emoji} {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji & Items count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emoji Avatar
                  </label>
                  <input
                    type="text"
                    value={catFormData.emoji}
                    onChange={(e) => setCatFormData({ ...catFormData, emoji: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Items Count Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50+ items"
                    value={catFormData.itemCount}
                    onChange={(e) => setCatFormData({ ...catFormData, itemCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Image Upload & Background Color */}
              <div className="space-y-3">
                {/* Upload / URL Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      imageMode === 'upload'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      imageMode === 'url'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Paste URL
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Upload zone or URL input */}
                  <div>
                    {imageMode === 'upload' ? (
                      <div>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e.target.files?.[0])}
                        />
                        <div
                          onDrop={handleImageDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => !imageUploading && imageInputRef.current?.click()}
                          className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors cursor-pointer overflow-hidden bg-slate-50 dark:bg-slate-800 group"
                          style={{ minHeight: '130px' }}
                        >
                          {imageUploading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                              <span className="text-xs font-semibold text-emerald-600">Uploading to S3...</span>
                            </div>
                          ) : imagePreview || catFormData.categoryImage ? (
                            <>
                              <img
                                src={imagePreview || catFormData.categoryImage}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                style={{ maxHeight: '130px' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="text-white text-xs font-bold flex items-center gap-1.5">
                                  <Upload className="h-4 w-4" />
                                  Change Image
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                              <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-emerald-600" />
                              </div>
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">
                                Click or drag & drop to upload
                              </p>
                              <p className="text-[11px] text-slate-400">JPG, PNG, WEBP — max 10 MB</p>
                            </div>
                          )}
                        </div>
                        {(imagePreview || catFormData.categoryImage) && !imageUploading && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImagePreview('');
                              setCatFormData((p) => ({ ...p, categoryImage: '' }));
                            }}
                            className="mt-1.5 text-[11px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="h-3 w-3" /> Remove image
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Image URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://... or /categories/fruits.webp"
                          value={catFormData.categoryImage}
                          onChange={(e) => {
                            setCatFormData({ ...catFormData, categoryImage: e.target.value });
                            setImagePreview(e.target.value);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                        {catFormData.categoryImage && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ maxHeight: '80px' }}>
                            <img
                              src={catFormData.categoryImage}
                              alt="URL Preview"
                              className="w-full object-cover"
                              style={{ maxHeight: '80px' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Card Background Glow Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={catFormData.bg || '#E8F5E9'}
                        onChange={(e) => setCatFormData({ ...catFormData, bg: e.target.value })}
                        className="h-10 w-12 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {PRESET_COLORS.slice(0, 5).map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setCatFormData({ ...catFormData, bg: c.hex })}
                            className="h-7 w-7 rounded-lg border border-black/10 transition-transform hover:scale-110 cursor-pointer"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcategories / Sub-filters
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add subcategory and press Enter"
                    value={newSubcategoryInput}
                    onChange={(e) => setNewSubcategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategory();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 min-h-[40px]">
                  {catFormData.subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategory(sub)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Order & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={catFormData.order}
                    onChange={(e) => setCatFormData({ ...catFormData, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-4">
                  <input
                    type="checkbox"
                    id="catIsActive"
                    checked={catFormData.isActive}
                    onChange={(e) => setCatFormData({ ...catFormData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="catIsActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Active & visible in customer app
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CATEGORY ================= */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => !isSubmitting && setDeletingCategory(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Category</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to delete <strong>"{deletingCategory.categoryName}"</strong> from <strong>"{deletingCategory.sectionName || deletingCategory.section || 'GreenGrocc'}"</strong>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteCategory}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE SECTION ================= */}
      {deletingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => !isSubmitting && setDeletingSection(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Section</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to delete section <strong>"{deletingSection.sectionName}"</strong>?
            </p>
            {sectionCounts[deletingSection.slug.toLowerCase()] > 0 && (
              <p className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-500/20">
                ⚠️ Warning: {sectionCounts[deletingSection.slug.toLowerCase()]} categories belong to this section.
              </p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingSection(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteSection}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
