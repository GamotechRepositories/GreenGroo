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
  ArrowLeft,
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
  Leaf,
  Utensils,
  ShoppingBag,
  Store,
  Flame,
  ChefHat,
} from 'lucide-react';
import categoryApi from '../api/categoryApi';
import sectionApi from '../api/sectionApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../utils/ui';

const API_BASE = 'http://localhost:5001';

const PRESET_ICONS_AND_IMAGES = [
  { name: 'Vegetables', image: '/categories/vegetables.webp', bg: '#E2F0D9', section: 'greengrocc' },
  { name: 'Fruits', image: '/categories/fruits.webp', bg: '#F0F7ED', section: 'greengrocc' },
  { name: 'Dairy', image: '/categories/dairy.webp', bg: '#E8F5E9', section: 'greengrocc' },
  { name: 'Grains', image: '/categories/grains.webp', bg: '#E8F5E0', section: 'greengrocc' },
  { name: 'Pulses', image: '/categories/pulses.webp', bg: '#EAF5DF', section: 'greengrocc' },
  { name: 'Grocery', image: '/categories/grocery.webp', bg: '#EAF5DF', section: 'greengrocc' },
  { name: 'Oils', image: '/categories/oils.webp', bg: '#F7F1DC', section: 'greengrocc' },
  { name: 'Spices', image: '/categories/spices.webp', bg: '#F7F1DC', section: 'greengrocc' },
  { name: 'Dry Fruits', image: '/categories/dry-fruits.webp', bg: '#F5EDE0', section: 'greengrocc' },
  { name: 'Organic', image: '/categories/organic.webp', bg: '#E8F5DF', section: 'greengrocc' },
  { name: 'Beverages', image: '/categories/beverages.webp', bg: '#E8F4FC', section: 'greengrocc' },
  { name: 'Bakery', image: '/categories/bakery.webp', bg: '#F5EBD9', section: 'greengrocc' },
  { name: 'Chopped Veggies', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=300&h=300&q=80', bg: '#E8F8EE', section: 'ready2cook' },
  { name: 'Cut & Sliced', image: 'https://images.unsplash.com/photo-1598170845058-12ef4a457c39?auto=format&fit=crop&w=300&h=300&q=80', bg: '#EEFBEB', section: 'ready2cook' },
  { name: 'Peeled Garlic', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&h=300&q=80', bg: '#EBF7FF', section: 'ready2cook' },
  { name: 'Packaged Foods', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80', bg: '#E8F8EE', section: 'supermall' },
];

const PRESET_COLORS = [
  { name: 'Mint', hex: '#E2F0D9' },
  { name: 'Emerald', hex: '#E8F5E9' },
  { name: 'Pistachio', hex: '#F0F7ED' },
  { name: 'Warm sand', hex: '#F7F1DC' },
  { name: 'Cream', hex: '#FFF8E7' },
  { name: 'Soft amber', hex: '#F5EDE0' },
  { name: 'Sky mist', hex: '#E8F4FC' },
  { name: 'Teal wash', hex: '#E6F7F4' },
  { name: 'Slate soft', hex: '#F1F5F9' },
];

const SECTION_THEME_COLORS = [
  { name: 'Brand green', hex: '#217346' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Forest', hex: '#059669' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Sky', hex: '#0284C7' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Warm orange', hex: '#EA580C' },
  { name: 'Slate', hex: '#475569' },
];

const formatHexGlow = (val) => {
  if (!val) return '';
  let str = String(val).trim().toUpperCase();
  if (!str.startsWith('#')) {
    str = `#${str}`;
  }
  str = '#' + str.slice(1).replace(/[^0-9A-F]/g, '');
  return str.slice(0, 7);
};

const getValidColorPickerHex = (val, fallback = '#E8F5E9') => {
  if (!val) return fallback;
  let str = String(val).trim();
  if (!str.startsWith('#')) str = `#${str}`;
  const cleanHex = '#' + str.slice(1).replace(/[^0-9A-Fa-f]/g, '');
  if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return cleanHex;
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(cleanHex)) {
    const r = cleanHex[1], g = cleanHex[2], b = cleanHex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
};

const renderDeptIcon = (slug = '', className = 'h-4 w-4') => {
  const s = (slug || '').toLowerCase();
  if (s === 'all') return <Layers className={className} />;
  if (s.includes('green') || s.includes('grocc') || s.includes('veg') || s.includes('farm') || s.includes('organic')) return <Leaf className={className} />;
  if (s.includes('cook') || s.includes('kitchen') || s.includes('food') || s.includes('meal') || s.includes('bake')) return <Utensils className={className} />;
  if (s.includes('mall') || s.includes('shop') || s.includes('super') || s.includes('store')) return <ShoppingBag className={className} />;
  return <FolderTree className={className} />;
};

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
    emoji: '',
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
    emoji: '',
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

  const handleSeedDefaults = async () => {
    try {
      setIsSubmitting(true);
      await Promise.all([
        sectionApi.seedDefaultSections().catch(() => {}),
        categoryApi.seedDefaultCategories().catch(() => {}),
      ]);
      showToast('Seeded default departments & categories successfully!');
      await loadData();
    } catch (err) {
      showToast('Failed to seed defaults: ' + (err.message || ''), 'error');
    } finally {
      setIsSubmitting(false);
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
        color: found.color || '#10B981',
      };
    }
    if (slug === 'ready2cook') return { name: 'Ready2Cook', color: '#EA580C' };
    if (slug === 'supermall') return { name: 'SuperMall', color: '#2563EB' };
    return { name: 'GreenGrocc', color: '#10B981' };
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
      emoji: '',
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
      emoji: '',
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
      emoji: '',
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
      emoji: '',
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

  // ================= FULL-PAGE SECTION FORM VIEW =================
  if (isAddSecModalOpen) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto pb-16">
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

        {/* Top Header & Breadcrumb Bar */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <button
                  type="button"
                  onClick={() => setIsAddSecModalOpen(false)}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer font-bold text-slate-600 dark:text-slate-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Categories & Departments</span>
                </button>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  {editingSection ? `Edit: ${editingSection.sectionName}` : 'Add Department'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {editingSection ? `Edit Department: ${editingSection.sectionName}` : 'Create Store Department'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure store department title, URL slug, theme styling, and storefront visibility
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsAddSecModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSection}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{editingSection ? 'Update Department' : 'Publish Department'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section Form Grid Layout */}
        <form onSubmit={handleSubmitSection} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden divide-y divide-slate-200/70 dark:divide-slate-800">
            {/* STEP 1: Basic Information */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Department Identification
                  </h3>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300">
                    Store section title, URL slug identifier, and tagline description
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department Name <span className="text-rose-500">*</span>
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Slug Identifier <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="organic-farm"
                      value={secFormData.slug}
                      onChange={(e) => setSecFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      className="w-full pl-6 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pure organic produce & farm-fresh essentials"
                  value={secFormData.description}
                  onChange={(e) => setSecFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                />
              </div>
            </div>

            {/* STEP 2: Branding & Colors */}
            <div className="bg-amber-50/40 dark:bg-amber-950/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-xs shadow-xs">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Branding & Theme Colors
                  </h3>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                    Accent palette, promotional badge, and color customization
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Preset Color Themes
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SECTION_THEME_COLORS.map((col) => {
                    const isSelected = (secFormData.color || '#10B981').toLowerCase() === col.hex.toLowerCase();
                    return (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setSecFormData((prev) => ({ ...prev, color: col.hex }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 ring-2 ring-emerald-100 shadow-sm bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 hover:border-emerald-300 bg-white text-slate-700'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full shadow-2xs shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Badge Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Mins / Express / Farm Fresh"
                    value={secFormData.badge}
                    onChange={(e) => setSecFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Hex Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secFormData.color || '#10B981'}
                      onChange={(e) => setSecFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="h-10 w-12 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800 p-1"
                    />
                    <input
                      type="text"
                      value={secFormData.color || '#10B981'}
                      onChange={(e) => setSecFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Display Order & Status */}
            <div className="bg-slate-50 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-xs shadow-xs">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Display Order & Visibility
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sort sequence and customer app visibility
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order Rank
                  </label>
                  <input
                    type="number"
                    value={secFormData.order}
                    onChange={(e) => setSecFormData((prev) => ({ ...prev, order: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Lower number appears earlier in department filter tabs.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Storefront Status
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSecFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        secFormData.isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${secFormData.isActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                      <span>{secFormData.isActive ? 'Active in Consumer App' : 'Hidden / Inactive'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Department Card Preview */}
          <div className="space-y-4">
            <div className="sticky top-20 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Live Preview
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Storefront View
                </span>
              </div>

              {/* Department Card Preview */}
              <div
                className="rounded-2xl border p-4 shadow-sm transition-all"
                style={{
                  borderColor: secFormData.color || '#10B981',
                  backgroundColor: `${secFormData.color || '#10B981'}0A`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-black/5 shrink-0"
                      style={{ backgroundColor: secFormData.color || '#10B981' }}
                    >
                      {renderDeptIcon(secFormData.slug, 'h-5 w-5')}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                        {secFormData.sectionName || 'Department Name'}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        /{secFormData.slug || 'department-slug'}
                      </p>
                    </div>
                  </div>

                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                    style={{
                      backgroundColor: `${secFormData.color || '#10B981'}20`,
                      color: secFormData.color || '#10B981',
                    }}
                  >
                    {secFormData.badge || 'Active'}
                  </span>
                </div>

                {secFormData.description && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                    {secFormData.description}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Order Rank: #{secFormData.order || 0}</span>
                  <span className={`font-bold ${secFormData.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    ● {secFormData.isActive ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSubmitSection}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Department...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{editingSection ? 'Update Department' : 'Create Department'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddSecModalOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel & Return
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ================= FULL-PAGE CATEGORY FORM VIEW =================
  if (isAddCatModalOpen) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 pb-12">
        {toast ? (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-xl ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ) : null}

        <button type="button" onClick={() => setIsAddCatModalOpen(false)} className={BTN}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to categories
        </button>

        <form onSubmit={handleSubmitCategory} className="space-y-4">
          {/* 1. Department & basics */}
          <div className={`${PANEL} space-y-4 p-5`}>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-bold text-[#217346]">
                1
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Department & details</h3>
                <p className="text-xs text-slate-500">Section, name, and URL slug</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Store department <span className="text-rose-500">*</span>
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
                    storeType:
                      chosenSlug === 'ready2cook' ? 'festive' : chosenSlug === 'supermall' ? 'mall' : 'main',
                  }));
                }}
                className={INPUT}
              >
                {sections.map((sec) => (
                  <option key={sec._id || sec.slug} value={sec.slug}>
                    {sec.sectionName} (/{sec.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">
                Category name <span className="text-rose-500">*</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Vegetables"
                  value={catFormData.categoryName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!editingCategory) {
                      setCatFormData((prev) => ({
                        ...prev,
                        categoryName: val,
                        slug: val
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, ''),
                      }));
                    } else {
                      setCatFormData((prev) => ({ ...prev, categoryName: val }));
                    }
                  }}
                  className={`${INPUT} mt-1.5`}
                />
              </label>

              <label className="block text-xs font-semibold text-slate-600">
                URL slug <span className="text-rose-500">*</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. fresh-vegetables"
                  value={catFormData.slug}
                  onChange={(e) =>
                    setCatFormData({
                      ...catFormData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''),
                    })
                  }
                  className={`${INPUT} mt-1.5 font-mono`}
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-slate-600">
              Items count label
              <input
                type="text"
                placeholder="e.g. 50+ items"
                value={catFormData.itemCount}
                onChange={(e) => setCatFormData({ ...catFormData, itemCount: e.target.value })}
                className={`${INPUT} mt-1.5`}
              />
            </label>
          </div>

          {/* 2. Media & appearance */}
          <div className={`${PANEL} space-y-4 p-5`}>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-bold text-[#217346]">
                2
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Media & appearance</h3>
                <p className="text-xs text-slate-500">Category image and card background</p>
              </div>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  imageMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                Image URL
              </button>
            </div>

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
                  className="group relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 transition hover:border-emerald-600"
                >
                  {imageUploading ? (
                    <div className="flex flex-col items-center gap-2 text-[#217346]">
                      <Loader2 className="h-7 w-7 animate-spin" />
                      <span className="text-xs font-semibold">Uploading…</span>
                    </div>
                  ) : imagePreview || catFormData.categoryImage ? (
                    <>
                      <img
                        src={imagePreview || catFormData.categoryImage}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
                          <Upload className="h-4 w-4" />
                          Change image
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
                        <ImageIcon className="h-5 w-5" />
                      </span>
                      <p className="text-xs font-semibold text-slate-700">Click or drag an image</p>
                      <p className="text-[11px] text-slate-400">JPG, PNG, WEBP · max 10MB</p>
                    </div>
                  )}
                </div>
                {(imagePreview || catFormData.categoryImage) && !imageUploading ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview('');
                      setCatFormData((p) => ({ ...p, categoryImage: '' }));
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove image
                  </button>
                ) : null}
              </div>
            ) : (
              <label className="block text-xs font-semibold text-slate-600">
                Image URL
                <input
                  type="text"
                  placeholder="https://… or /categories/fruits.webp"
                  value={catFormData.categoryImage}
                  onChange={(e) => {
                    setCatFormData({ ...catFormData, categoryImage: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                  className={`${INPUT} mt-1.5 font-mono`}
                />
              </label>
            )}

            <div className="space-y-2.5 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Card background</label>
                {catFormData.bg ? (
                  <button
                    type="button"
                    onClick={() => setCatFormData((prev) => ({ ...prev, bg: '#E8F5E9' }))}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
                  >
                    Reset
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                  <div
                    className="h-full w-full"
                    style={{ backgroundColor: formatHexGlow(catFormData.bg) || '#E8F5E9' }}
                  />
                  <input
                    type="color"
                    value={getValidColorPickerHex(catFormData.bg, '#E8F5E9')}
                    onChange={(e) =>
                      setCatFormData((prev) => ({ ...prev, bg: formatHexGlow(e.target.value) }))
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    title="Pick color"
                  />
                </div>
                <input
                  type="text"
                  placeholder="#E8F5E9"
                  value={catFormData.bg || ''}
                  onChange={(e) =>
                    setCatFormData((prev) => ({ ...prev, bg: formatHexGlow(e.target.value) }))
                  }
                  className={`${INPUT} font-mono uppercase`}
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => {
                  const isSelected = (catFormData.bg || '').toUpperCase() === c.hex.toUpperCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setCatFormData((prev) => ({ ...prev, bg: c.hex }))}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                      }`}
                      title={c.name}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Subcategories & visibility */}
          <div className={`${PANEL} space-y-4 p-5`}>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-bold text-[#217346]">
                3
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Subcategories & visibility</h3>
                <p className="text-xs text-slate-500">Filters and storefront status</p>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Subcategories</label>
                <span className="text-[11px] text-slate-400">Press Enter to add</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Fresh Milk, Paneer…"
                  value={newSubcategoryInput}
                  onChange={(e) => setNewSubcategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubcategory();
                    }
                  }}
                  className={INPUT}
                />
                <button type="button" onClick={handleAddSubcategory} className={BTN_PRIMARY}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {catFormData.subcategories.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {catFormData.subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {sub}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategory(sub)}
                        className="text-slate-400 hover:text-rose-600"
                        title={`Remove ${sub}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">
                Display order
                <input
                  type="number"
                  value={catFormData.order}
                  onChange={(e) =>
                    setCatFormData({ ...catFormData, order: parseInt(e.target.value, 10) || 0 })
                  }
                  className={`${INPUT} mt-1.5`}
                />
                <span className="mt-1 block text-[11px] font-normal text-slate-400">
                  Lower numbers appear first in the app
                </span>
              </label>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Storefront visibility
                </label>
                <button
                  type="button"
                  onClick={() => setCatFormData({ ...catFormData, isActive: !catFormData.isActive })}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                    catFormData.isActive
                      ? 'border-emerald-200 bg-emerald-50 text-[#217346]'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        catFormData.isActive ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                    />
                    {catFormData.isActive ? 'Active in customer app' : 'Hidden from store'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      catFormData.isActive ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {catFormData.isActive ? 'Live' : 'Hidden'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button type="button" onClick={() => setIsAddCatModalOpen(false)} className={BTN}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  {editingCategory ? 'Update category' : 'Publish category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-xl transition-all duration-300 ${
            toast.type === 'error' ? 'bg-rose-600 shadow-rose-500/25' : 'bg-emerald-700 shadow-emerald-700/25'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Catalog</p>
          <h1 className={PAGE_TITLE}>Sections & Categories</h1>
          <p className={PAGE_SUB}>Configure store sections and product categories for the catalog</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleOpenAddSecModal} className={BTN}>
            <FolderTree className="mr-1.5 h-4 w-4 text-emerald-700" />
            New section
          </button>
          <button type="button" onClick={handleOpenAddCatModal} className={BTN_PRIMARY}>
            <Plus className="mr-1.5 h-4 w-4" />
            New category
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total categories', value: metrics.total, hint: 'In catalog' },
          { label: 'Active in app', value: metrics.active, hint: 'Visible to customers' },
          { label: 'Store sections', value: metrics.totalSections, hint: 'Departments' },
          { label: 'Sub-filters', value: metrics.subCount, hint: 'Across categories' },
        ].map((item) => (
          <div key={item.label} className={`${PANEL} p-4`}>
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{item.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className={`${PANEL} space-y-3 p-4`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Store sections</h2>
            <p className="text-xs text-slate-500">Filter categories by section · {sections.length} active</p>
          </div>
          <button type="button" onClick={handleOpenAddSecModal} className={BTN}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New section
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {(() => {
            const isSelected = selectedSectionFilter === 'all';
            return (
              <button
                type="button"
                onClick={() => handleSectionFilterChange('all')}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-slate-900 ring-1 ring-emerald-600/20'
                    : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 shadow-sm'
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">All sections</p>
                    <p className="truncate font-mono text-[10px] text-slate-400">/all-catalog</p>
                  </div>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                    isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600 shadow-sm'
                  }`}
                >
                  {categories.length}
                </span>
              </button>
            );
          })()}

          {sections.map((sec) => {
            const isSelected = selectedSectionFilter.toLowerCase() === sec.slug.toLowerCase();
            const count = sectionCounts[sec.slug.toLowerCase()] || 0;

            return (
              <div
                key={sec._id || sec.slug}
                role="button"
                tabIndex={0}
                onClick={() => handleSectionFilterChange(sec.slug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSectionFilterChange(sec.slug);
                  }
                }}
                className={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-slate-900 ring-1 ring-emerald-600/20'
                    : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 shadow-sm'
                    }`}
                  >
                    {renderDeptIcon(sec.slug, 'h-4 w-4')}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{sec.sectionName}</p>
                    <p className="truncate font-mono text-[10px] text-slate-400">/{sec.slug}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                      isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600 shadow-sm'
                    }`}
                  >
                    {count}
                  </span>
                  <div
                    className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenEditSecModal(sec)}
                      className="rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                      title="Edit section"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSection(sec)}
                      className="rounded p-1 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                      title="Delete section"
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

      <div className={`${PANEL} space-y-3 p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {activeSectionObj ? activeSectionObj.sectionName : 'All categories'}
            </h2>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              {filteredCategories.length} items
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-52">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search category…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${INPUT} py-2 pl-9 pr-8 text-xs`}
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600">
              <ArrowUpDown className="h-3 w-3 shrink-0 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cursor-pointer bg-transparent focus:outline-none"
              >
                <option value="order">Order</option>
                <option value="name">Name (A-Z)</option>
                <option value="count">Item count</option>
              </select>
            </div>

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-2.5 py-1 capitalize transition ${
                    statusFilter === status
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'table' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
            <Layers className="mx-auto h-10 w-10 text-emerald-600/30" />
            <p className="mt-3 text-base font-semibold text-slate-800">No categories found</p>
            <p className="mt-1 text-sm text-slate-400">
              {searchTerm || selectedSectionFilter !== 'all'
                ? 'No catalog items match your search or filters.'
                : 'Create your first category or seed the default catalog.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={handleOpenAddCatModal} className={BTN_PRIMARY}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add category
              </button>
              {categories.length === 0 ? (
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  disabled={isSubmitting}
                  className={BTN}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                  Seed defaults
                </button>
              ) : null}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredCategories.map((cat) => {
              const secInfo = getSectionInfo(cat.section);
              return (
                <div
                  key={cat._id || cat.slug}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenEditCatModal(cat)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenEditCatModal(cat);
                    }
                  }}
                  className={`${PANEL} group flex cursor-pointer flex-col overflow-hidden transition hover:border-emerald-300 hover:shadow-md ${
                    cat.isActive ? '' : 'opacity-60'
                  }`}
                >
                  <div
                    className="relative flex h-28 items-center justify-center overflow-hidden border-b border-slate-100 sm:h-32"
                    style={{ background: cat.bg || '#F1F5F9' }}
                  >
                    <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-center justify-between gap-1.5">
                      <span className="pointer-events-auto max-w-[55%] truncate rounded-md border border-black/5 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">
                        {secInfo.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCatStatus(cat);
                        }}
                        className={`pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm transition ${
                          cat.isActive ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-slate-600 hover:bg-slate-700'
                        }`}
                        title="Toggle active status"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            cat.isActive ? 'animate-pulse bg-emerald-200' : 'bg-slate-300'
                          }`}
                        />
                        {cat.isActive ? 'Active' : 'Off'}
                      </button>
                    </div>

                    {cat.categoryImage ? (
                      <img
                        src={cat.categoryImage}
                        alt={cat.categoryName}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="items-center justify-center transition duration-300 group-hover:scale-110"
                      style={{ display: cat.categoryImage ? 'none' : 'flex' }}
                    >
                      <Package className="h-8 w-8 text-slate-400 stroke-[1.5]" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-2.5 p-3">
                    <div>
                      <h3
                        className="truncate text-sm font-bold text-slate-900 transition group-hover:text-emerald-700"
                        title={cat.categoryName}
                      >
                        {cat.categoryName}
                      </h3>
                      <div className="mt-1 flex items-center justify-between gap-1 font-mono text-[11px] text-slate-400">
                        <span className="min-w-0 truncate">/{cat.slug}</span>
                        <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          {cat.itemCount || '0 items'}
                        </span>
                      </div>
                      {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 ? (
                        <div className="mt-1.5 flex min-w-0 items-center gap-1 text-[10px] text-slate-500">
                          <Tag className="h-3 w-3 shrink-0 text-amber-500" />
                          <span className="truncate">
                            {cat.subcategories.length} sub-filters ({cat.subcategories.slice(0, 2).join(', ')})
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="font-mono text-[11px] font-bold text-slate-400">#{cat.order || 0}</span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCatModal(cat)}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                          title="Edit category"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCategory(cat)}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete category"
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
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    {['Category', 'Section', 'Subcategories', 'Order', 'Status', ''].map((h) => (
                      <th
                        key={h || 'actions'}
                        className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${
                          h === 'Order' || h === 'Status' ? 'text-center' : h === '' ? 'text-right' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => {
                    const secInfo = getSectionInfo(cat.section);
                    return (
                      <tr
                        key={cat._id || cat.slug}
                        onClick={() => handleOpenEditCatModal(cat)}
                        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200"
                              style={{ backgroundColor: cat.bg || '#E8F5E9' }}
                            >
                              {cat.categoryImage ? (
                                <img
                                  src={cat.categoryImage}
                                  alt={cat.categoryName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-slate-500 stroke-[1.5]" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{cat.categoryName}</p>
                              <p className="font-mono text-[11px] text-slate-400">
                                {cat.itemCount || '0 items'} · /{cat.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {secInfo.name}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex max-w-xs flex-wrap gap-1">
                            {cat.subcategories?.slice(0, 3).map((sub, i) => (
                              <span
                                key={i}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                              >
                                {sub}
                              </span>
                            ))}
                            {cat.subcategories?.length > 3 ? (
                              <span className="text-[10px] font-bold text-slate-400">
                                +{cat.subcategories.length - 3}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-xs font-bold text-slate-500">
                          #{cat.order || 0}
                        </td>
                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleCatStatus(cat)}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              cat.isActive
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCatModal(cat)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(cat)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
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

      {deletingCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setDeletingCategory(null)}
          />
          <div className={`${PANEL} relative z-10 w-full max-w-sm space-y-4 p-6`}>
            <h3 className="text-base font-bold text-slate-900">Delete category</h3>
            <p className="text-sm text-slate-600">
              Remove <strong className="text-slate-900">&quot;{deletingCategory.categoryName}&quot;</strong> from{' '}
              <strong className="text-slate-900">
                &quot;{deletingCategory.sectionName || deletingCategory.section || 'GreenGrocc'}&quot;
              </strong>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeletingCategory(null)} className={BTN}>
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteCategory}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingSection ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setDeletingSection(null)}
          />
          <div className={`${PANEL} relative z-10 w-full max-w-sm space-y-4 p-6`}>
            <h3 className="text-base font-bold text-slate-900">Delete section</h3>
            <p className="text-sm text-slate-600">
              Remove section <strong className="text-slate-900">&quot;{deletingSection.sectionName}&quot;</strong>?
            </p>
            {sectionCounts[deletingSection.slug.toLowerCase()] > 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
                Warning: {sectionCounts[deletingSection.slug.toLowerCase()]} categories belong to this section.
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeletingSection(null)} className={BTN}>
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteSection}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
