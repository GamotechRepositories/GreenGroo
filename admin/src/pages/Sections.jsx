import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LayoutGrid,
  List,
  Layers,
  Sparkles,
  AlertTriangle,
  FolderTree,
  Palette,
  Smile,
  ArrowRight,
  ExternalLink,
  Shield,
  Check,
  X,
  Leaf,
  Utensils,
  ShoppingBag,
  Store,
  Flame,
} from 'lucide-react';
import sectionApi from '../api/sectionApi';

const PRESET_COLORS = [
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Warm Orange', hex: '#EA580C' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Vibrant Purple', hex: '#8B5CF6' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Rose Pink', hex: '#F43F5E' },
  { name: 'Cyan Teal', hex: '#06B6D4' },
  { name: 'Slate Gray', hex: '#64748B' },
];

const renderSectionIcon = (slug = '', className = 'h-6 w-6') => {
  const s = slug.toLowerCase();
  if (s === 'greengrocc') return <Leaf className={className} />;
  if (s === 'ready2cook') return <Utensils className={className} />;
  if (s === 'supermall') return <ShoppingBag className={className} />;
  return <FolderTree className={className} />;
};

export default function Sections() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [viewMode, setViewMode] = useState('grid'); // grid, table

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [deletingSection, setDeletingSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    sectionName: '',
    slug: '',
    description: '',
    badge: '',
    color: '#10B981',
    order: 0,
    isActive: true,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSections = async () => {
    try {
      setLoading(true);
      const res = await sectionApi.getAllSections({ limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        setSections(res.data);
      } else {
        const fallback = await sectionApi.getActiveSections({ includeInactive: true });
        if (fallback.success && Array.isArray(fallback.data)) {
          setSections(fallback.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sections:', err);
      showToast('Could not fetch sections from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!editingSection) {
      const autoSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, sectionName: name, slug: autoSlug }));
    } else {
      setFormData((prev) => ({ ...prev, sectionName: name }));
    }
  };

  const handleOpenAddModal = () => {
    setEditingSection(null);
    setFormData({
      sectionName: '',
      slug: '',
      description: '',
      badge: '',
      color: '#10B981',
      order: sections.length + 1,
      isActive: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (sec) => {
    setEditingSection(sec);
    setFormData({
      sectionName: sec.sectionName || '',
      slug: sec.slug || '',
      description: sec.description || '',
      badge: sec.badge || '',
      color: sec.color || '#10B981',
      order: typeof sec.order === 'number' ? sec.order : 0,
      isActive: sec.isActive !== undefined ? sec.isActive : true,
    });
    setIsAddModalOpen(true);
  };

  // Submit Section Form (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sectionName.trim()) {
      showToast('Section name is required.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        sectionName: formData.sectionName.trim(),
        slug: formData.slug.trim() || formData.sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        order: Number(formData.order) || 0,
      };

      if (editingSection) {
        const res = await sectionApi.updateSection(editingSection._id, payload);
        if (res.success) {
          showToast(`Updated "${res.data.sectionName}"`);
          setIsAddModalOpen(false);
          loadSections();
        } else {
          showToast(res.message || 'Failed to update section', 'error');
        }
      } else {
        const res = await sectionApi.createSection(payload);
        if (res.success) {
          showToast(`Created "${res.data.sectionName}"`);
          setIsAddModalOpen(false);
          loadSections();
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

  // Delete Section
  const handleDelete = async () => {
    if (!deletingSection) return;
    try {
      setIsSubmitting(true);
      const res = await sectionApi.deleteSection(deletingSection._id);
      if (res.success) {
        showToast(`Deleted section "${deletingSection.sectionName}"`);
        setDeletingSection(null);
        loadSections();
      } else {
        showToast(res.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (sec) => {
    try {
      const updatedStatus = !sec.isActive;
      const res = await sectionApi.updateSection(sec._id, { isActive: updatedStatus });
      if (res.success) {
        showToast(`Section ${updatedStatus ? 'Activated' : 'Disabled'}`);
        setSections((prev) =>
          prev.map((s) => (s._id === sec._id ? { ...s, isActive: updatedStatus } : s))
        );
      }
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const filteredSections = useMemo(() => {
    return sections
      .filter((sec) => {
        const matchesSearch =
          !searchTerm ||
          sec.sectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sec.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sec.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'active'
            ? sec.isActive
            : !sec.isActive;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections, searchTerm, statusFilter]);

  const activeCount = sections.filter((s) => s.isActive).length;
  const totalCategoriesCount = sections.reduce((acc, s) => acc + (s.categoryCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium text-white transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-rose-600 shadow-rose-500/25'
              : 'bg-slate-950 dark:bg-emerald-600 shadow-black/30'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Stats Strip */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Store Sections
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage main store departments and showcase distinct catalog experiences
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Section</span>
          </button>
        </div>

        {/* Simple & Professional Metric Stats Strip (No Separate Cards) */}
        <div className="flex flex-wrap items-center gap-y-2.5 gap-x-6 sm:gap-x-8 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Sections:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">
              {sections.length}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              Active Departments:
            </span>
            <span className="font-bold tabular-nums px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs">
              {activeCount}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              Linked Categories:
            </span>
            <span className="font-bold tabular-nums px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
              {totalCategoriesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/60 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-sm">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-semibold">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Grid / Table View Switch */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 py-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <FolderTree className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No sections found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchTerm || statusFilter !== 'all'
              ? 'No store sections match your search or filter parameters.'
              : 'Create your first store department to group product categories.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            Create Section
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSections.map((sec) => (
            <div
              key={sec._id}
              className={`group relative rounded-3xl border bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                sec.isActive
                  ? 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:-translate-y-1'
                  : 'border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              {/* Color Bar Accent Top */}
              <div
                className="absolute top-0 left-6 right-6 h-1 rounded-b-full"
                style={{ backgroundColor: sec.color || '#10B981' }}
              />

              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner border border-black/5"
                    style={{ backgroundColor: `${sec.color || '#10B981'}15` }}
                  >
                    {renderSectionIcon(sec.slug, 'h-6 w-6 text-emerald-600 dark:text-emerald-400')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {sec.sectionName}
                    </h3>
                  </div>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => handleToggleStatus(sec)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                    sec.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-700/20'
                  }`}
                >
                  {sec.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 min-h-[32px]">
                {sec.description || 'No department description configured.'}
              </p>

              {/* Badges and Info */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: sec.color || '#10B981' }}
                    title="Theme color"
                  />
                  {sec.badge && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs"
                      style={{ backgroundColor: sec.color || '#10B981' }}
                    >
                      {sec.badge}
                    </span>
                  )}
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    Order #{sec.order || 0}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate(`/categories?section=${sec.slug}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                    title="View linked categories"
                  >
                    <Layers className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{sec.categoryCount || 0} Cats</span>
                    <ArrowRight className="h-3 w-3 opacity-60" />
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-3 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEditModal(sec)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Edit2 className="h-3 w-3 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeletingSection(sec)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 shadow-2xs transition-colors cursor-pointer"
                  title="Delete Section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table Layout */
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Section Name</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Badge & Theme</th>
                  <th className="py-3.5 px-4 text-center">Order</th>
                  <th className="py-3.5 px-4 text-center">Categories</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredSections.map((sec) => (
                  <tr
                    key={sec._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <FolderTree className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {sec.sectionName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                            {sec.description || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {sec.slug}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: sec.color || '#10B981' }}
                        />
                        {sec.badge && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: sec.color || '#10B981' }}
                          >
                            {sec.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600 dark:text-slate-300">
                      #{sec.order || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {sec.categoryCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(sec)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sec.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {sec.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(sec)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingSection(sec)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsAddModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingSection ? 'Edit Section' : 'Add New Section'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Farm Store"
                    value={formData.sectionName}
                    onChange={handleNameChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Slug (URL identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. organic-farm-store"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Certified organic greens, cold pressed oils & natural staples"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Theme Color Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-emerald-500" />
                  <span>Theme Accent Color</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: col.hex })}
                      className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        formData.color?.toLowerCase() === col.hex.toLowerCase()
                          ? 'border-slate-900 dark:border-white scale-125'
                          : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {formData.color?.toLowerCase() === col.hex.toLowerCase() && (
                        <Check className="h-3 w-3 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={formData.color || '#10B981'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-7 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Badge & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Promo Badge (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Mins, 40% OFF"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="sectionIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="sectionIsActive"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Active & visible in customer app
                </label>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingSection ? 'Save Changes' : 'Create Section'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isSubmitting && setDeletingSection(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Section</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the section{' '}
              <strong className="text-slate-900 dark:text-white">
                "{deletingSection.sectionName}"
              </strong>
              ?
            </p>

            {deletingSection.categoryCount > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ Warning: There are <strong>{deletingSection.categoryCount} categories</strong> associated with this section. Deleting it may leave them unassigned.
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeletingSection(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-500/25 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
