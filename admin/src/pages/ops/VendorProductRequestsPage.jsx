import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  Layers,
  List,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  User,
  Warehouse,
  X,
  XCircle,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { formatDate } from './multiVendorShared';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Products' },
  { key: 'Pending', label: 'Pending Approvals' },
  { key: 'Approved', label: 'Approved Products' },
  { key: 'Rejected', label: 'Rejected' },
];

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  Cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function VendorProductRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlVendorId = searchParams.get('vendorId') || '';

  const [rows, setRows] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalVendors: 0, totalProducts: 0 });
  const [status, setStatus] = useState('all'); // Default to 'all' so all vendors and products show immediately
  const [selectedVendorId, setSelectedVendorId] = useState(urlVendorId);
  const [search, setSearch] = useState('');
  const [showEmptyVendors, setShowEmptyVendors] = useState(true);
  const [viewMode, setViewMode] = useState('vendor'); // 'vendor' (vendor-wise) or 'list' (flat list)
  const [collapsedVendors, setCollapsedVendors] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [remarks, setRemarks] = useState('');

  // Keep selectedVendorId synced if URL query changes
  useEffect(() => {
    if (urlVendorId) setSelectedVendorId(urlVendorId);
  }, [urlVendorId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (status !== 'all') params.status = status;
      if (selectedVendorId) params.vendorId = selectedVendorId;

      const res = await opsApi.list('vendor-product-requests', params);
      setRows(Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(res.vendors)) {
        setVendorsList(res.vendors);
      }
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product requests');
    } finally {
      setLoading(false);
    }
  }, [status, selectedVendorId]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (row) => {
    if (!window.confirm(`Approve and add "${row.productName}" to ${row.vendorName || 'this collection centre'}?`)) return;
    setBusyId(row.id);
    setError('');
    try {
      const res = await opsApi.create(`vendor-product-requests/${row.id}/approve`, {});
      setToast(res.message || `"${row.productName}" approved for ${row.vendorName || 'vendor'}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve request');
    } finally {
      setBusyId('');
    }
  };

  const approveAllPending = async (vendorId, vendorName, items) => {
    const pendingItems = items.filter((it) => it.status === 'Pending');
    if (!pendingItems.length) return;
    if (!window.confirm(`Approve all ${pendingItems.length} pending product requests for "${vendorName || 'this collection centre'}"?`)) return;

    setBusyId(`bulk-${vendorId}`);
    setError('');
    let successCount = 0;
    try {
      for (const item of pendingItems) {
        try {
          await opsApi.create(`vendor-product-requests/${item.id}/approve`, {});
          successCount += 1;
        } catch (e) {
          console.error('Failed to approve request', item.id, e);
        }
      }
      setToast(`Successfully approved ${successCount} product(s) for ${vendorName || 'vendor'}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete bulk approval');
    } finally {
      setBusyId('');
    }
  };

  const submitReject = async (event) => {
    event.preventDefault();
    if (!rejecting) return;
    setBusyId(rejecting.id);
    setError('');
    try {
      const res = await opsApi.create(`vendor-product-requests/${rejecting.id}/reject`, { remarks });
      setToast(res.message || `"${rejecting.productName}" rejected`);
      setRejecting(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject request');
    } finally {
      setBusyId('');
    }
  };

  // Build unique vendor lookup
  const vendorLookup = useMemo(() => {
    const map = new Map();
    vendorsList.forEach((v) => {
      map.set(v.id, v);
    });
    rows.forEach((r) => {
      if (r.vendorId && !map.has(r.vendorId)) {
        map.set(r.vendorId, {
          id: r.vendorId,
          vendorName: r.vendorName || r.vendorId,
          vendorCode: r.vendorCode || '',
          ownerName: r.vendorOwnerName || '',
          mobile: r.vendorMobile || '',
          city: r.vendorCity || '',
          state: r.vendorState || '',
          status: 'Active',
        });
      }
    });
    return map;
  }, [vendorsList, rows]);

  // Filtered rows by search
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const catalog = r.catalog || {};
      return [
        r.productName,
        r.category,
        r.unit,
        r.vendorId,
        r.vendorName,
        r.vendorOwnerName,
        r.vendorMobile,
        r.vendorCode,
        r.vendorCity,
        r.notes,
        catalog.name,
        catalog.sku,
        catalog.subcategory,
      ].some((val) => String(val || '').toLowerCase().includes(q));
    });
  }, [rows, search]);

  // Group requests vendor-wise: INCLUDES ALL REGISTERED MULTIVENDORS
  const vendorGroups = useMemo(() => {
    const groups = new Map();

    // 1. Initialize with ALL registered multivendors so NO vendor is hidden
    vendorsList.forEach((v) => {
      groups.set(v.id, {
        vendorId: v.id,
        vendorName: v.vendorName || v.businessName || v.ownerName || v.id,
        vendorCode: v.vendorCode || '',
        ownerName: v.ownerName || '—',
        mobile: v.mobile || '',
        email: v.email || '',
        city: v.city || '',
        state: v.state || '',
        status: v.status || 'Active',
        collectionCentreName: v.collectionCentreName || '',
        items: [],
        totalItemsCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
      });
    });

    // 2. Also register any vendor that might only exist in rows
    rows.forEach((r) => {
      if (r.vendorId && !groups.has(r.vendorId)) {
        groups.set(r.vendorId, {
          vendorId: r.vendorId,
          vendorName: r.vendorName || r.vendorId,
          vendorCode: r.vendorCode || '',
          ownerName: r.vendorOwnerName || '—',
          mobile: r.vendorMobile || '',
          email: r.vendorEmail || '',
          city: r.vendorCity || '',
          state: r.vendorState || '',
          status: 'Active',
          collectionCentreName: '',
          items: [],
          totalItemsCount: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
        });
      }
    });

    // 3. Tally counts for each vendor from unfiltered rows
    rows.forEach((r) => {
      const g = groups.get(r.vendorId);
      if (g) {
        g.totalItemsCount += 1;
        if (r.status === 'Pending') g.pendingCount += 1;
        else if (r.status === 'Approved') g.approvedCount += 1;
        else if (r.status === 'Rejected') g.rejectedCount += 1;
      }
    });

    // 4. Populate matching filtered items into each vendor's items array
    filteredRows.forEach((item) => {
      const g = groups.get(item.vendorId);
      if (g) {
        g.items.push(item);
      }
    });

    // 5. Convert to array and apply vendor filter & search filter
    let list = Array.from(groups.values());

    if (selectedVendorId) {
      list = list.filter((g) => g.vendorId === selectedVendorId);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      // If searching, keep vendors that match vendor info OR have products matching query
      list = list.filter((g) => {
        const vendorMatches = [
          g.vendorName,
          g.vendorCode,
          g.ownerName,
          g.mobile,
          g.email,
          g.city,
          g.state,
        ].some((val) => String(val || '').toLowerCase().includes(q));
        return vendorMatches || g.items.length > 0;
      });
    } else if (!showEmptyVendors) {
      // If user toggled off empty vendors, show only vendors that have products in current filter
      list = list.filter((g) => g.items.length > 0);
    }

    // Sort: Vendors with pending items first, then vendors with most products, then alphabetical
    return list.sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      if (b.items.length !== a.items.length) return b.items.length - a.items.length;
      return a.vendorName.localeCompare(b.vendorName);
    });
  }, [vendorsList, rows, filteredRows, selectedVendorId, search, showEmptyVendors]);

  const toggleVendorCollapse = (vId) => {
    setCollapsedVendors((prev) => ({ ...prev, [vId]: !prev[vId] }));
  };

  const expandAll = () => {
    setCollapsedVendors({});
  };

  const collapseAll = () => {
    const map = {};
    vendorGroups.forEach((g) => {
      map[g.vendorId] = true;
    });
    setCollapsedVendors(map);
  };

  const clearVendorFilter = () => {
    setSelectedVendorId('');
    searchParams.delete('vendorId');
    setSearchParams(searchParams);
  };

  const handleVendorSelect = (vId) => {
    setSelectedVendorId(vId);
    if (vId) {
      searchParams.set('vendorId', vId);
    } else {
      searchParams.delete('vendorId');
    }
    setSearchParams(searchParams);
  };

  const totalPendingInView = useMemo(
    () => rows.filter((r) => r.status === 'Pending').length,
    [rows]
  );
  const totalApprovedInView = useMemo(
    () => rows.filter((r) => r.status === 'Approved').length,
    [rows]
  );
  const totalRejectedInView = useMemo(
    () => rows.filter((r) => r.status === 'Rejected').length,
    [rows]
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Multi Vendor Products & Requests</h1>
          <p className={`mt-0.5 ${PAGE_SUB}`}>
            Showing all collection centres and their requested/assigned catalog products. Review approvals and manage catalogs vendor-wise.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className={`${BTN} gap-1.5 text-xs`}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link to="/multi-vendor" className={`${BTN} gap-1.5 text-xs text-emerald-700`}>
            <Warehouse className="h-3.5 w-3.5" /> Multi Vendor Management
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {toast ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} className="ml-auto text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
          <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={`${PANEL} p-3.5 border-l-4 border-l-slate-700`}>
          <p className="text-xs text-slate-500 font-medium">All MultiVendors</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-xl font-bold text-slate-900">{vendorsList.length || vendorLookup.size}</p>
            <span className="text-[11px] text-slate-400 font-medium">registered centres</span>
          </div>
        </div>
        <div className={`${PANEL} p-3.5 border-l-4 border-l-amber-500`}>
          <p className="text-xs text-amber-700 font-medium">Pending Approvals</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-xl font-bold text-amber-900">{stats.pending ?? totalPendingInView}</p>
            {totalPendingInView > 0 ? (
              <span className="text-[11px] font-bold text-amber-600">action required</span>
            ) : null}
          </div>
        </div>
        <div className={`${PANEL} p-3.5 border-l-4 border-l-emerald-500`}>
          <p className="text-xs text-emerald-700 font-medium">Approved Products</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-xl font-bold text-emerald-900">{stats.approved ?? totalApprovedInView}</p>
            <span className="text-[11px] text-emerald-600 font-medium">in vendor catalogs</span>
          </div>
        </div>
        <div className={`${PANEL} p-3.5 border-l-4 border-l-blue-500`}>
          <p className="text-xs text-blue-700 font-medium">Total Products Listed</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-xl font-bold text-blue-900">{rows.length}</p>
            <span className="text-[11px] text-blue-600 font-medium">across centres</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Vendor Dropdown, Search, Status Tabs, View Mode Toggle */}
      <div className={`${PANEL} space-y-3 p-3.5`}>
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vendor name, owner, city, phone, product name, SKU..."
              className={`${INPUT} pl-9`}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Vendor Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[240px]">
              <Warehouse className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedVendorId}
                onChange={(e) => handleVendorSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="">All MultiVendors ({vendorsList.length || vendorLookup.size})</option>
                {Array.from(vendorLookup.values()).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName || v.businessName || v.ownerName || v.id}
                    {v.vendorCode ? ` (${v.vendorCode})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedVendorId ? (
              <button
                type="button"
                onClick={clearVendorFilter}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                title="Clear vendor filter"
              >
                Clear
              </button>
            ) : null}
          </div>

          {/* View Mode Toggle: Vendor-wise vs Flat List */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('vendor')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors ${
                viewMode === 'vendor'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Vendor-wise ({vendorGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Flat List ({filteredRows.length})
            </button>
          </div>
        </div>

        {/* Status Filter Chips & Expand/Collapse All Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-[11px] font-semibold text-slate-400">Status:</span>
            {STATUS_FILTERS.map((item) => {
              const isSelected = status === item.key;
              const count =
                item.key === 'all'
                  ? rows.length
                  : item.key === 'Pending'
                  ? totalPendingInView
                  : item.key === 'Approved'
                  ? totalApprovedInView
                  : item.key === 'Rejected'
                  ? totalRejectedInView
                  : 0;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatus(item.key)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Show empty vendors toggle */}
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showEmptyVendors}
                onChange={(e) => setShowEmptyVendors(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Show all MultiVendors (even 0 products)</span>
            </label>

            {/* Expand / Collapse Controls */}
            {viewMode === 'vendor' ? (
              <div className="inline-flex items-center gap-1 border-l border-slate-200 pl-3">
                <button
                  type="button"
                  onClick={expandAll}
                  className="rounded px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                  title="Expand all vendor product lists"
                >
                  Expand All
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="rounded px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                  title="Collapse all vendor product lists"
                >
                  Collapse All
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className={`${PANEL} flex items-center justify-center py-20 text-slate-400`}>
          <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
          <span className="ml-2 text-sm font-medium text-slate-600">Loading MultiVendors & products...</span>
        </div>
      ) : viewMode === 'vendor' ? (
        /* ============================================================== */
        /* VENDOR-WISE VIEW (ALL MULTIVENDORS + THEIR PRODUCTS)           */
        /* ============================================================== */
        vendorGroups.length === 0 ? (
          <div className={`${PANEL} py-16 text-center text-sm text-slate-500`}>
            <Warehouse className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No MultiVendors found</p>
            <p className="mt-1 text-xs text-slate-400">
              {search
                ? 'No collection centres or products match your search.'
                : 'No collection centres registered in the system.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vendorGroups.map((group) => {
              const isCollapsed = Boolean(collapsedVendors[group.vendorId]);
              const pendingItems = group.items.filter((it) => it.status === 'Pending');

              return (
                <section
                  key={group.vendorId}
                  className={`${PANEL} overflow-hidden shadow-xs transition-shadow hover:shadow-md border border-slate-200/80`}
                >
                  {/* MultiVendor Header Card */}
                  <div className="flex flex-col gap-3 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white p-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-xs ring-1 ring-emerald-200">
                        <Warehouse className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">{group.vendorName}</h2>
                          {group.vendorCode ? (
                            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                              {group.vendorCode}
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              group.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {group.status || 'Active'}
                          </span>

                          {/* Product Count Badges */}
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {group.items.length} Product{group.items.length === 1 ? '' : 's'}
                          </span>

                          {group.pendingCount > 0 ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-300 animate-pulse">
                              {group.pendingCount} Pending Approval
                            </span>
                          ) : null}
                          {group.approvedCount > 0 ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              {group.approvedCount} Approved
                            </span>
                          ) : null}
                          {group.rejectedCount > 0 ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-semibold text-rose-700 ring-1 ring-rose-200">
                              {group.rejectedCount} Rejected
                            </span>
                          ) : null}
                        </div>

                        {/* MultiVendor Details: Owner, Phone, Location */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          {group.ownerName && group.ownerName !== '—' ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              <span>Owner: <strong className="text-slate-700 font-medium">{group.ownerName}</strong></span>
                            </span>
                          ) : null}
                          {group.mobile ? (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{group.mobile}</span>
                            </span>
                          ) : null}
                          {group.city || group.state ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{[group.city, group.state].filter(Boolean).join(', ')}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Actions on Vendor Header */}
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      {pendingItems.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => approveAllPending(group.vendorId, group.vendorName, group.items)}
                          disabled={busyId === `bulk-${group.vendorId}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
                          title="Approve all pending requests for this collection centre"
                        >
                          {busyId === `bulk-${group.vendorId}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve All ({pendingItems.length})
                        </button>
                      ) : null}

                      <Link
                        to={`/multi-vendor/${encodeURIComponent(group.vendorId)}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        Profile →
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleVendorCollapse(group.vendorId)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50"
                        title={isCollapsed ? 'Expand product list' : 'Collapse product list'}
                      >
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* MultiVendor Product Catalog List */}
                  {!isCollapsed ? (
                    group.items.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 bg-slate-50/40">
                        <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">No products for this collection centre</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {status !== 'all'
                            ? `No products matching status "${status}".`
                            : 'This collection centre has not requested or been assigned any products yet.'}
                        </p>
                        <div className="mt-3 flex justify-center gap-2">
                          <Link
                            to={`/multi-vendor/${encodeURIComponent(group.vendorId)}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View Collection Centre Profile
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {group.items.map((row) => {
                          const catalog = row.catalog;
                          const image = catalog?.image || row.productImage;
                          return (
                            <li
                              key={row.id}
                              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start hover:bg-slate-50/60 transition-colors"
                            >
                              {/* Product Image */}
                              {image ? (
                                <img
                                  src={image}
                                  alt={row.productName}
                                  className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-base font-bold text-emerald-700">
                                  {String(row.productName || 'P').charAt(0)}
                                </div>
                              )}

                              {/* Product Info */}
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">
                                    {catalog?.name || row.productName}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${
                                      STATUS_STYLES[row.status] || STATUS_STYLES.Cancelled
                                    }`}
                                  >
                                    {row.status === 'Approved' && row.isAssignedProduct ? 'Active in Catalog' : row.status}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600">
                                  {[catalog?.category || row.category, catalog?.subcategory, catalog?.unit || row.unit]
                                    .filter(Boolean)
                                    .join(' · ')}
                                  {catalog ? (
                                    <span className="font-semibold text-emerald-700">
                                      {' · '}
                                      {formatPrice(catalog.discountedPrice)}
                                      {catalog.price && catalog.price > catalog.discountedPrice ? (
                                        <span className="ml-1 text-slate-400 line-through text-[11px]">
                                          {formatPrice(catalog.price)}
                                        </span>
                                      ) : null}
                                    </span>
                                  ) : null}
                                  {catalog?.sku ? <span className="text-slate-400"> · SKU {catalog.sku}</span> : null}
                                </p>

                                {!catalog || !catalog.isActive ? (
                                  <p className="text-xs font-semibold text-rose-600">
                                    ⚠ This product is not active in Admin Master Catalog
                                  </p>
                                ) : null}

                                <p className="text-xs text-slate-500">
                                  {row.isAssignedProduct ? 'Active in catalog' : `Requested on ${formatDate(row.createdAt)}`}
                                </p>

                                {row.notes ? (
                                  <p className="text-xs text-slate-600 bg-slate-50 rounded-md p-1.5 border border-slate-100 inline-block">
                                    <span className="font-semibold text-slate-500">Vendor note:</span> {row.notes}
                                  </p>
                                ) : null}

                                {row.adminRemarks ? (
                                  <p className="text-xs text-rose-600 font-medium">
                                    <span className="font-semibold">Rejection remarks:</span> {row.adminRemarks}
                                  </p>
                                ) : null}

                                {row.reviewedAt ? (
                                  <p className="text-[11px] text-slate-400">Reviewed {formatDate(row.reviewedAt)}</p>
                                ) : null}
                              </div>

                              {/* Approval / Rejection Action Buttons */}
                              {row.status === 'Pending' ? (
                                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRemarks('');
                                      setRejecting(row);
                                    }}
                                    disabled={busyId === row.id}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> Reject
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => approve(row)}
                                    disabled={busyId === row.id}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                                  >
                                    {busyId === row.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    Approve
                                  </button>
                                </div>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : null}
                </section>
              );
            })}
          </div>
        )
      ) : (
        /* ============================================================== */
        /* FLAT LIST VIEW (ALL REQUESTS CHRONOLOGICAL)                    */
        /* ============================================================== */
        filteredRows.length === 0 ? (
          <div className={`${PANEL} py-16 text-center text-sm text-slate-500`}>
            <Package className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No products found</p>
            <p className="mt-1 text-xs text-slate-400">Try changing your search query or status filter.</p>
          </div>
        ) : (
          <div className={`overflow-hidden ${PANEL}`}>
            <ul className="divide-y divide-slate-100">
              {filteredRows.map((row) => {
                const catalog = row.catalog;
                const image = catalog?.image || row.productImage;
                return (
                  <li key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start hover:bg-slate-50/60 transition-colors">
                    {image ? (
                      <img
                        src={image}
                        alt={row.productName}
                        className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-base font-bold text-emerald-700">
                        {String(row.productName || 'P').charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{catalog?.name || row.productName}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${
                            STATUS_STYLES[row.status] || STATUS_STYLES.Cancelled
                          }`}
                        >
                          {row.status === 'Approved' && row.isAssignedProduct ? 'Active in Catalog' : row.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        {[catalog?.category || row.category, catalog?.subcategory, catalog?.unit || row.unit].filter(Boolean).join(' · ')}
                        {catalog ? ` · ${formatPrice(catalog.discountedPrice)}` : ''}
                        {catalog?.sku ? <span className="text-slate-400"> · SKU {catalog.sku}</span> : null}
                      </p>

                      <p className="text-xs text-slate-600">
                        Collection Centre:{' '}
                        <Link
                          to={`/multi-vendor/${encodeURIComponent(row.vendorId)}`}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          {row.vendorName || row.vendorId}
                          {row.vendorCode ? ` (${row.vendorCode})` : ''}
                        </Link>{' '}
                        · {formatDate(row.createdAt)}
                      </p>

                      {row.notes ? <p className="text-xs text-slate-600 italic">Note: {row.notes}</p> : null}
                      {row.adminRemarks ? (
                        <p className="text-xs text-rose-600 font-medium">Remarks: {row.adminRemarks}</p>
                      ) : null}
                    </div>

                    {row.status === 'Pending' ? (
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRemarks('');
                            setRejecting(row);
                          }}
                          disabled={busyId === row.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => approve(row)}
                          disabled={busyId === row.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {busyId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        )
      )}

      {/* Rejection Reason Modal */}
      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={submitReject} className={`w-full max-w-md ${PANEL} p-5 shadow-xl`}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Reject “{rejecting.productName}”</h2>
                <p className="text-xs text-slate-500">Requested by {rejecting.vendorName || rejecting.vendorId}</p>
              </div>
              <button
                type="button"
                onClick={() => setRejecting(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block text-xs font-semibold text-slate-600">
              Rejection Reason (will be shown to the collection centre / vendor)
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={`${INPUT} mt-1`}
                rows={3}
                placeholder="e.g. Out of stock, not available for this region, etc."
                required
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className={BTN}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyId === rejecting.id}
                className={`${BTN_PRIMARY} border-rose-600 bg-rose-600 hover:bg-rose-700`}
              >
                {busyId === rejecting.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
