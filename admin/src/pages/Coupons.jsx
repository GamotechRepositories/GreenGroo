import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  Tag,
  Percent,
  Calendar,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpDown,
  Copy,
  Check,
  X,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Gift,
  Coins,
  Ticket,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Users,
  Loader2,
} from 'lucide-react';
import couponApi from '../api/couponApi';

const PRESET_TEMPLATES = [
  {
    name: 'Welcome 20% OFF',
    code: 'WELCOME20',
    title: '20% OFF on First Order',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 299,
    maxRedemptionsPerUser: 1,
    maxTotalRedemptions: 1000,
    daysValid: 90,
    badge: 'New User',
  },
  {
    name: 'Flat ₹50 OFF',
    code: 'FRESH50',
    title: 'Flat ₹50 OFF on Ready2Cook & Produce',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 399,
    maxRedemptionsPerUser: null,
    maxTotalRedemptions: 500,
    daysValid: 30,
    badge: 'Popular',
  },
  {
    name: 'Mega ₹100 OFF',
    code: 'SUPER100',
    title: 'Flat ₹100 OFF on SuperMall Pantry',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 699,
    maxRedemptionsPerUser: null,
    maxTotalRedemptions: 500,
    daysValid: 30,
    badge: 'High Value',
  },
  {
    name: 'Festive 15% OFF',
    code: 'FESTIVE15',
    title: '15% Instant Savings on Festive Baskets',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 499,
    maxRedemptionsPerUser: 3,
    maxTotalRedemptions: 2000,
    daysValid: 15,
    badge: 'Festive',
  },
];

const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDisplayDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusInfo = (coupon) => {
  if (!coupon.isActive) {
    return {
      status: 'inactive',
      label: 'Inactive',
      color: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400',
    };
  }
  const now = new Date();
  const start = new Date(coupon.startDate);
  const end = new Date(coupon.endDate);

  if (now < start) {
    return {
      status: 'scheduled',
      label: 'Scheduled',
      color: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400',
    };
  }
  if (now > end) {
    return {
      status: 'expired',
      label: 'Expired',
      color: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400',
    };
  }
  return {
    status: 'active',
    label: 'Active',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400',
  };
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, scheduled, expired, inactive
  const [typeFilter, setTypeFilter] = useState('all'); // all, percentage, fixed
  const [sortBy, setSortBy] = useState('newest'); // newest, expiring, discount, redemptions
  const [viewMode, setViewMode] = useState('grid'); // grid, table

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 199,
    startDate: '',
    endDate: '',
    isActive: true,
    maxRedemptionsPerUser: '',
    maxTotalRedemptions: '',
    isTotalUnlimited: true,
    isUserUnlimited: true,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text, label = 'Coupon code') => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} "${text}" to clipboard!`);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await couponApi.getAllCoupons({ limit: 200 });
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      } else if (Array.isArray(res)) {
        setCoupons(res);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
      showToast('Could not load coupons from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Metrics
  const metrics = useMemo(() => {
    const total = coupons.length;
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let inactive = 0;
    let totalRedemptions = 0;

    const now = new Date();
    coupons.forEach((c) => {
      totalRedemptions += Number(c.totalRedemptions || 0);
      if (!c.isActive) {
        inactive += 1;
      } else {
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        if (now < start) scheduled += 1;
        else if (now > end) expired += 1;
        else active += 1;
      }
    });

    return { total, active, scheduled, expired, inactive, totalRedemptions };
  }, [coupons]);

  // Filtered & Sorted Coupons
  const filteredCoupons = useMemo(() => {
    let result = coupons.filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusInfo = getStatusInfo(c);
      const matchStatus =
        statusFilter === 'all' ? true : statusInfo.status === statusFilter;

      const matchType =
        typeFilter === 'all' ? true : c.discountType === typeFilter;

      return matchSearch && matchStatus && matchType;
    });

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'expiring') {
        return new Date(a.endDate || 0) - new Date(b.endDate || 0);
      }
      if (sortBy === 'discount') {
        return Number(b.discountValue || 0) - Number(a.discountValue || 0);
      }
      if (sortBy === 'redemptions') {
        return Number(b.totalRedemptions || 0) - Number(a.totalRedemptions || 0);
      }
      return 0;
    });

    return result;
  }, [coupons, searchTerm, statusFilter, typeFilter, sortBy]);

  // Modal Handlers
  const handleOpenCreateModal = (preset = null) => {
    setEditingCoupon(null);
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + (preset?.daysValid || 30) * 24 * 60 * 60 * 1000);

    setFormData({
      code: preset ? preset.code : '',
      title: preset ? preset.title : '',
      discountType: preset ? preset.discountType : 'percentage',
      discountValue: preset ? preset.discountValue : 10,
      minOrderAmount: preset ? preset.minOrderAmount : 199,
      startDate: formatDateInput(now),
      endDate: formatDateInput(defaultEnd),
      isActive: true,
      maxRedemptionsPerUser: preset?.maxRedemptionsPerUser || '',
      maxTotalRedemptions: preset?.maxTotalRedemptions || '',
      isTotalUnlimited: !preset?.maxTotalRedemptions,
      isUserUnlimited: !preset?.maxRedemptionsPerUser,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      title: coupon.title || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || 0,
      minOrderAmount: coupon.minOrderAmount || 0,
      startDate: formatDateInput(coupon.startDate),
      endDate: formatDateInput(coupon.endDate),
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      maxRedemptionsPerUser: coupon.maxRedemptionsPerUser || '',
      maxTotalRedemptions: coupon.maxTotalRedemptions || '',
      isTotalUnlimited: coupon.maxTotalRedemptions === null || coupon.maxTotalRedemptions === undefined,
      isUserUnlimited: coupon.maxRedemptionsPerUser === null || coupon.maxRedemptionsPerUser === undefined,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const updatedStatus = !coupon.isActive;
      const res = await couponApi.updateCoupon(coupon._id, { isActive: updatedStatus });
      if (res.success) {
        showToast(`Coupon ${coupon.code} ${updatedStatus ? 'Activated' : 'Disabled'}`);
        setCoupons((prev) =>
          prev.map((c) => (c._id === coupon._id ? { ...c, isActive: updatedStatus } : c))
        );
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      showToast('Coupon code is required', 'error');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      showToast('Start and end dates are required', 'error');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      showToast('End date must be after start date', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        code: cleanCode,
        title: formData.title.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue) || 0,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: Boolean(formData.isActive),
        maxRedemptionsPerUser: formData.isUserUnlimited ? null : Number(formData.maxRedemptionsPerUser) || 1,
        maxTotalRedemptions: formData.isTotalUnlimited ? null : Number(formData.maxTotalRedemptions) || 100,
      };

      if (editingCoupon) {
        const res = await couponApi.updateCoupon(editingCoupon._id, payload);
        if (res.success) {
          showToast(`Updated coupon "${cleanCode}"`);
          setIsModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'Update failed', 'error');
        }
      } else {
        const res = await couponApi.createCoupon(payload);
        if (res.success) {
          showToast(`Created coupon "${cleanCode}"`);
          setIsModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'Creation failed', 'error');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;
    try {
      setIsSubmitting(true);
      const res = await couponApi.deleteCoupon(deletingCoupon._id);
      if (res.success) {
        showToast(`Deleted coupon "${deletingCoupon.code}"`);
        setDeletingCoupon(null);
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

  const handleSeedDefaults = async () => {
    try {
      setIsSubmitting(true);
      const res = await couponApi.seedDefaultCoupons();
      if (res.success) {
        showToast('Seeded default promo coupons successfully!');
        loadData();
      } else {
        showToast(res.message || 'Seeding failed', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Seeding failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold text-white transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-rose-600 shadow-rose-500/25'
              : 'bg-slate-950 dark:bg-emerald-600 shadow-black/30'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Coupon & Discount Management
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Discounts
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create, schedule, monitor discount codes, and manage customer promotional campaigns
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Seed starter promo coupons"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Seed Defaults</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Coupon</span>
            </button>
          </div>
        </div>

        {/* Metrics Stats Strip */}
        <div className="flex flex-wrap items-center gap-y-2.5 gap-x-6 sm:gap-x-8 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Coupons:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">
              {metrics.total}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              Active in Store:
            </span>
            <span className="font-bold tabular-nums px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs">
              {metrics.active}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              Scheduled:
            </span>
            <span className="font-bold tabular-nums px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
              {metrics.scheduled}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              Total Orders Redeemed:
            </span>
            <span className="font-bold tabular-nums px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs">
              {metrics.totalRedemptions} orders
            </span>
          </div>
        </div>
      </div>

      {/* Preset Campaign Templates Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Quick Promo Presets
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click to load pre-configured template</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.code}
              onClick={() => handleOpenCreateModal(tmpl)}
              className="group p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-500/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-black/5 shadow-2xs">
                    {tmpl.badge}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {tmpl.discountType === 'percentage' ? `${tmpl.discountValue}% OFF` : `₹${tmpl.discountValue} OFF`}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {tmpl.code}
                </p>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Min ₹{tmpl.minOrderAmount} · {tmpl.daysValid} Days
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                Use Template →
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Catalog Coupons</span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {filteredCoupons.length} items
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            {searchTerm && (
              <button
                type="button"
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
              <option value="newest">Newest First</option>
              <option value="expiring">Expiring Soon</option>
              <option value="discount">Highest Discount</option>
              <option value="redemptions">Most Redeemed</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            {['all', 'active', 'scheduled', 'expired', 'inactive'].map((status) => (
              <button
                key={status}
                type="button"
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
              type="button"
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
              type="button"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 py-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Ticket className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No coupons found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No coupons match your search query or active filter settings.'
              : 'Get started by creating your first promotional coupon.'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Create Coupon
            </button>
            <button
              type="button"
              onClick={handleSeedDefaults}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Seed Default Coupons</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Voucher Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCoupons.map((coupon) => {
            const statusInfo = getStatusInfo(coupon);
            const isPercentage = coupon.discountType === 'percentage';

            return (
              <div
                key={coupon._id || coupon.code}
                className={`relative rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 flex flex-col justify-between ${
                  coupon.isActive
                    ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/60'
                    : 'border-slate-200 dark:border-slate-800 opacity-65'
                }`}
              >
                {/* Card Header Strip with Voucher Cutout Appearance */}
                <div
                  className={`p-4 border-b border-dashed border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 ${
                    isPercentage
                      ? 'bg-gradient-to-r from-emerald-50/60 to-green-50/30 dark:from-emerald-950/30 dark:to-green-950/20'
                      : 'bg-gradient-to-r from-amber-50/60 to-orange-50/30 dark:from-amber-950/30 dark:to-orange-950/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm sm:text-base font-black tracking-wider text-slate-900 dark:text-white">
                        {coupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(coupon.code)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 cursor-pointer"
                        title="Copy code"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate">
                      {coupon.title || (isPercentage ? `${coupon.discountValue}% Discount` : `₹${coupon.discountValue} OFF`)}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border shadow-2xs ${statusInfo.color}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                {/* Card Body Info */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs">
                    {/* Discount Value Display */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                        Discount Value:
                      </span>
                      <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {isPercentage ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
                      </span>
                    </div>

                    {/* Minimum Order */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                        Min. Order Amount:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'No Minimum'}
                      </span>
                    </div>

                    {/* Validity Period */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                        Validity Range:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                        {formatDisplayDate(coupon.startDate)} – {formatDisplayDate(coupon.endDate)}
                      </span>
                    </div>

                    {/* Redemptions & Limit */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Redemptions:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {coupon.totalRedemptions || 0}
                        {coupon.maxTotalRedemptions ? ` / ${coupon.maxTotalRedemptions}` : ' (Unlimited)'}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(coupon)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        coupon.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {coupon.isActive ? 'Active ✓' : 'Disabled'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(coupon)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 text-slate-600 transition-all cursor-pointer"
                        title="Edit Coupon"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCoupon(coupon)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-400 transition-all cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3.5">Code & Campaign</th>
                  <th className="py-2.5 px-3">Discount</th>
                  <th className="py-2.5 px-3">Min Order</th>
                  <th className="py-2.5 px-3">Validity</th>
                  <th className="py-2.5 px-3 text-center">Uses</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredCoupons.map((coupon) => {
                  const statusInfo = getStatusInfo(coupon);
                  const isPercentage = coupon.discountType === 'percentage';

                  return (
                    <tr
                      key={coupon._id || coupon.code}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 dark:text-white">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(coupon.code)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Copy code"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        {coupon.title && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {coupon.title}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {isPercentage ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold">
                        {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'None'}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDisplayDate(coupon.startDate)} – {formatDisplayDate(coupon.endDate)}
                      </td>

                      <td className="py-3 px-3 text-center font-bold tabular-nums">
                        {coupon.totalRedemptions || 0}
                        {coupon.maxTotalRedemptions ? ` / ${coupon.maxTotalRedemptions}` : ''}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                              coupon.isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                            title="Toggle Status"
                          >
                            {coupon.isActive ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCoupon(coupon)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-400"
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

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure discount code, calculation logic, customer limits, and validity dates
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* SECTION 1: Code & Title */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Coupon Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GREEN20"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-black uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Campaign Title / Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 20% OFF on Organic Produce"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Discount Structure */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Discount Calculation Structure
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setFormData((p) => ({ ...p, discountType: 'percentage' }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.discountType === 'percentage'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-black">Percentage (%)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Deducts % discount from cart subtotal
                    </p>
                  </div>

                  <div
                    onClick={() => setFormData((p) => ({ ...p, discountType: 'fixed' }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.discountType === 'fixed'
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-black">Fixed Flat (₹)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Deducts fixed rupee value from subtotal
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Discount Value ({formData.discountType === 'percentage' ? '%' : '₹'}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={formData.discountType === 'percentage' ? 100 : 10000}
                      value={formData.discountValue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum Order Value (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 for no minimum"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minOrderAmount: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Validity Schedule & Limits */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      End Date / Expiry <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Total Uses Limit
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            isTotalUnlimited: !p.isTotalUnlimited,
                            maxTotalRedemptions: !p.isTotalUnlimited ? '' : 500,
                          }))
                        }
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {formData.isTotalUnlimited ? 'Set Limit' : 'Make Unlimited'}
                      </button>
                    </div>
                    {formData.isTotalUnlimited ? (
                      <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-400">
                        Unlimited Total Uses
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 500"
                        value={formData.maxTotalRedemptions}
                        onChange={(e) => setFormData((prev) => ({ ...prev, maxTotalRedemptions: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Uses Per Customer
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            isUserUnlimited: !p.isUserUnlimited,
                            maxRedemptionsPerUser: !p.isUserUnlimited ? '' : 1,
                          }))
                        }
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {formData.isUserUnlimited ? 'Set Limit' : 'Make Unlimited'}
                      </button>
                    </div>
                    {formData.isUserUnlimited ? (
                      <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-400">
                        Unlimited Per Customer
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1 (First order only)"
                        value={formData.maxRedemptionsPerUser}
                        onChange={(e) => setFormData((prev) => ({ ...prev, maxRedemptionsPerUser: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    )}
                  </div>
                </div>

                {/* Active Toggle Switch */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Active in Storefront</p>
                    <p className="text-[10px] text-slate-400">Allow customers to claim and apply this coupon immediately</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{editingCoupon ? 'Update Coupon' : 'Publish Coupon'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Delete Coupon "{deletingCoupon.code}"?
            </h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to permanently delete this coupon? Customers will no longer be able to apply it at checkout.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCoupon(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
