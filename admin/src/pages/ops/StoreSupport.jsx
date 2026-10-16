import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock3,
  Headset,
  History,
  ImageIcon,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  X,
  Bookmark,
  Filter,
  Search,
  SlidersHorizontal,
  Plus,
  Check,
  Trash2,
  Sparkles,
  Zap,
  FileText,
  AlertCircle,
  Paperclip,
  Calendar,
  Layers,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_SUB, PAGE_TITLE, PANEL, PANEL_HEAD } from '../../utils/ui';

function formatIssueType(value) {
  return String(value || 'other').replaceAll('_', ' ');
}

function formatWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function supportRoleLabel(value) {
  if (value === 'customer') return 'Users (Frontend)';
  return String(value || '').replaceAll('_', ' ');
}

function StatusBadge({ status }) {
  const open = status === 'open';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
        open
          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
      }`}
    >
      {status || 'open'}
    </span>
  );
}

const SUPPORT_ROLE_OPTIONS = [
  { id: 'all', label: 'All Roles & Panels' },
  { id: 'customer', label: 'Users (Consumer App)' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'segregation_manager', label: 'Segregation Manager' },
  { id: 'product_manager', label: 'Product Manager' },
  { id: 'farmer_manager', label: 'Farmer Manager' },
  { id: 'farmer', label: 'Farmer' },
  { id: 'pickup_driver', label: 'Pickup Driver' },
  { id: 'delivery_manager', label: 'Delivery Manager' },
  { id: 'delivery_boy', label: 'Delivery Boy' },
  { id: 'admin', label: 'Admin' },
];

const ISSUE_TYPE_OPTIONS = [
  { id: 'all', label: 'All Issue Categories' },
  { id: 'payment', label: 'Payment Failures / UPI' },
  { id: 'order', label: 'Order Inquiry & Modification' },
  { id: 'return_refund', label: 'Return & Refund' },
  { id: 'product_inquiry', label: 'Produce & Product Quality' },
  { id: 'delivery', label: 'Delivery & Transit Delay' },
  { id: 'place_order', label: 'Order Placement Help' },
  { id: 'other', label: 'General / Other Issues' },
];

const DATE_RANGE_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today (Last 24h)' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
];

const DEFAULT_SAVED_SEARCHES = [
  {
    id: 'open-urgent',
    title: 'Open Escalations',
    description: 'All unresolved tickets awaiting response',
    badge: 'Urgent',
    filters: { status: 'open', roleKey: 'all', issueType: 'all', dateRange: 'all', hasAttachment: false, q: '' },
  },
  {
    id: 'payments-refunds',
    title: 'Payment & Refunds',
    description: 'UPI, payment drops & refund inquiries',
    badge: 'Billing',
    filters: { status: 'open', roleKey: 'all', issueType: 'payment', dateRange: 'all', hasAttachment: false, q: '' },
  },
  {
    id: 'delivery-complaints',
    title: 'Delivery Complaints',
    description: 'Delayed, missing, or transit order issues',
    badge: 'Logistics',
    filters: { status: 'open', roleKey: 'all', issueType: 'delivery', dateRange: 'all', hasAttachment: false, q: '' },
  },
  {
    id: 'today-new',
    title: "Today's Tickets",
    description: 'Cases reported today requiring same-day SLA',
    badge: 'New (24h)',
    filters: { status: 'all', roleKey: 'all', issueType: 'all', dateRange: 'today', hasAttachment: false, q: '' },
  },
  {
    id: 'photo-evidence',
    title: 'Photo Evidence Attached',
    description: 'Damage proof or uploaded receipts',
    badge: 'Evidence',
    filters: { status: 'all', roleKey: 'all', issueType: 'all', dateRange: 'all', hasAttachment: true, q: '' },
  },
  {
    id: 'consumer-app',
    title: 'Customer App Tickets',
    description: 'End-user grocery buyer requests',
    badge: 'Users',
    filters: { status: 'open', roleKey: 'customer', issueType: 'all', dateRange: 'all', hasAttachment: false, q: '' },
  },
  {
    id: 'farmer-field',
    title: 'Farmer & Field Issues',
    description: 'Farmer manager and grower support',
    badge: 'Agri Field',
    filters: { status: 'open', roleKey: 'farmer', issueType: 'all', dateRange: 'all', hasAttachment: false, q: '' },
  },
];

function UserHistorySection({ ticket, onOpenAttachment }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ count: 0, open: 0, resolved: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { excludeId: ticket._id };
        if (ticket.user) params.userId = String(ticket.user);
        if (ticket.email) params.email = ticket.email;
        if (ticket.phone) params.phone = ticket.phone;
        const res = await opsApi.list('support/history', params);
        if (cancelled) return;
        setRows(Array.isArray(res.data) ? res.data : []);
        setMeta({
          count: res.count || 0,
          open: res.open || 0,
          resolved: res.resolved || 0,
        });
        setError('');
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err.response?.data?.message || 'Failed to load user history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticket._id, ticket.email, ticket.phone, ticket.user]);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-700" />
          <p className="text-sm font-bold text-slate-900">Support history for this user</p>
        </div>
        {!loading && !error ? (
          <p className="text-[11px] font-semibold text-slate-500">
            {meta.count} prior case{meta.count === 1 ? '' : 's'}
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-amber-700">{meta.open} open</span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-emerald-700">{meta.resolved} resolved</span>
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-6 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : error ? (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">No earlier support cases for this user.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 text-xs">
          {rows.map((row) => {
            const hasAtt = Boolean(row.attachment);
            return (
              <li key={row._id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={row.status} />
                    <span className="font-semibold text-slate-800">
                      {formatIssueType(row.issueType)}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                      {supportRoleLabel(row.roleKey)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatWhen(row.createdAt)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-slate-600">{row.message}</p>
                {hasAtt ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAttachment?.(row.attachment, row.attachmentName);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    <ImageIcon className="h-3 w-3" />
                    View attachment ({row.attachmentName || 'image'})
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AttachmentPreview({ url, name, onOpen }) {
  if (!url) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(url, name);
      }}
      className="group relative mt-3 block overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-300 hover:shadow"
    >
      <img
        src={url}
        alt={name || 'Support attachment'}
        className="h-40 w-full object-cover sm:h-48"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) {
            fallback.classList.remove('hidden');
            fallback.classList.add('flex');
          }
        }}
      />
      <div className="hidden h-40 w-full flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400 sm:h-48">
        <ImageIcon className="h-8 w-8" />
        <span className="text-xs font-medium">Could not load image</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-3 py-2">
        <p className="truncate text-xs font-semibold text-white">
          {name || 'Attachment'} · Click to enlarge
        </p>
      </div>
    </button>
  );
}

function ImageLightbox({ url, name, onClose }) {
  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Support attachment"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{name || 'Support attachment'}</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Open original
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-56px)] overflow-auto bg-slate-50 p-3">
          <img src={url} alt={name || 'Support attachment'} className="mx-auto max-h-[75vh] w-auto max-w-full rounded-lg object-contain" />
        </div>
      </div>
    </div>
  );
}

export default function StoreSupport() {
  const { roleKey: urlRoleKey } = useParams();
  const navigate = useNavigate();

  // Primary tab view: 'tickets' (all search & filter segments) vs 'roles' (roles overview)
  const [activeTab, setActiveTab] = useState(urlRoleKey ? 'tickets' : 'tickets');

  // Filter state
  const [roleKey, setRoleKey] = useState(urlRoleKey || 'all');
  const [status, setStatus] = useState('all');
  const [issueType, setIssueType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [hasAttachment, setHasAttachment] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSavedSearchId, setActiveSavedSearchId] = useState('');

  // Data & loading state
  const [tickets, setTickets] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [lightbox, setLightbox] = useState({ url: '', name: '' });

  // Custom Saved Searches persisted in localStorage
  const [customSavedSearches, setCustomSavedSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('greengrocc_support_saved_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal for saving new custom filter segment
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSearchTitle, setNewSearchTitle] = useState('');
  const [newSearchBadge, setNewSearchBadge] = useState('Custom');

  // Combined Saved Searches
  const allSavedSearches = useMemo(() => {
    return [
      ...DEFAULT_SAVED_SEARCHES,
      ...customSavedSearches.map((cs) => ({ ...cs, isCustom: true })),
    ];
  }, [customSavedSearches]);

  // Synchronize urlRoleKey if url changes
  useEffect(() => {
    if (urlRoleKey) {
      setRoleKey(urlRoleKey);
      setActiveTab('tickets');
    }
  }, [urlRoleKey]);

  // Load ticket data based on active filters
  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleKey && roleKey !== 'all') params.roleKey = roleKey;
      if (status && status !== 'all') params.status = status;
      if (issueType && issueType !== 'all') params.issueType = issueType;
      if (dateRange && dateRange !== 'all') params.dateRange = dateRange;
      if (hasAttachment) params.hasAttachment = true;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await opsApi.list('support', params);
      const list = Array.isArray(res.data) ? res.data : [];
      setTickets(list);
      setStats({
        total: list.length,
        open: list.filter((t) => t.status === 'open').length,
        resolved: list.filter((t) => t.status === 'resolved').length,
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  // Load roles overview counts
  const loadRoles = async () => {
    try {
      const res = await opsApi.list('support', { overview: 'roles' });
      setRoles(res.data || []);
    } catch (err) {
      console.warn('Failed to load support roles overview:', err.message);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [roleKey, status, issueType, dateRange, hasAttachment]);

  useEffect(() => {
    loadRoles();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTickets();
  };

  // Apply a Saved Search filter segment
  const applySavedSearch = (segment) => {
    setActiveSavedSearchId(segment.id);
    const f = segment.filters || {};
    setStatus(f.status || 'all');
    setRoleKey(f.roleKey || 'all');
    setIssueType(f.issueType || 'all');
    setDateRange(f.dateRange || 'all');
    setHasAttachment(Boolean(f.hasAttachment));
    setSearchQuery(f.q || '');
  };

  // Check if current filter matches a saved search
  const isSegmentActive = (seg) => {
    if (activeSavedSearchId === seg.id) return true;
    const f = seg.filters || {};
    return (
      (f.status || 'all') === status &&
      (f.roleKey || 'all') === roleKey &&
      (f.issueType || 'all') === issueType &&
      (f.dateRange || 'all') === dateRange &&
      Boolean(f.hasAttachment) === Boolean(hasAttachment) &&
      (f.q || '') === searchQuery
    );
  };

  // Save current filter as a new custom segment
  const handleSaveCurrentSearch = () => {
    if (!newSearchTitle.trim()) return;
    const newSegment = {
      id: `custom-${Date.now()}`,
      title: newSearchTitle.trim(),
      description: `Custom segment: ${roleKey !== 'all' ? roleKey : 'All Roles'}, ${status}`,
      badge: newSearchBadge.trim() || 'Custom',
      filters: {
        status,
        roleKey,
        issueType,
        dateRange,
        hasAttachment,
        q: searchQuery,
      },
    };
    const updated = [newSegment, ...customSavedSearches];
    setCustomSavedSearches(updated);
    try {
      localStorage.setItem('greengrocc_support_saved_searches', JSON.stringify(updated));
    } catch {}
    setActiveSavedSearchId(newSegment.id);
    setShowSaveModal(false);
    setNewSearchTitle('');
  };

  // Delete custom saved search
  const deleteCustomSavedSearch = (id) => {
    const updated = customSavedSearches.filter((s) => s.id !== id);
    setCustomSavedSearches(updated);
    try {
      localStorage.setItem('greengrocc_support_saved_searches', JSON.stringify(updated));
    } catch {}
    if (activeSavedSearchId === id) setActiveSavedSearchId('');
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setStatus('all');
    setRoleKey('all');
    setIssueType('all');
    setDateRange('all');
    setHasAttachment(false);
    setSearchQuery('');
    setActiveSavedSearchId('');
  };

  const hasActiveFilters =
    status !== 'all' ||
    roleKey !== 'all' ||
    issueType !== 'all' ||
    dateRange !== 'all' ||
    hasAttachment ||
    Boolean(searchQuery.trim());

  // Ticket status update (resolve / reopen)
  const updateTicketStatus = async (id, nextStatus) => {
    try {
      await opsApi.patch(`support/${id}`, { status: nextStatus });
      await loadTickets();
      await loadRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update ticket');
    }
  };

  const relatedCount = (ticket) =>
    tickets.filter((row) => {
      if (String(row._id) === String(ticket._id)) return false;
      if (ticket.user && row.user && String(ticket.user) === String(row.user)) return true;
      if (ticket.email && row.email && ticket.email.toLowerCase() === String(row.email).toLowerCase()) {
        return true;
      }
      const a = String(ticket.phone || '').replace(/\D/g, '').slice(-10);
      const b = String(row.phone || '').replace(/\D/g, '').slice(-10);
      return Boolean(a && b && a === b);
    }).length;

  const totalAllRoles = roles.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalOpenRoles = roles.reduce((sum, r) => sum + (r.open || 0), 0);

  return (
    <div className="space-y-5 pb-16">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <Headset className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Help Desk & Operations Support
              </p>
              <h1 className={PAGE_TITLE}>Store Support</h1>
            </div>
          </div>
          <p className={PAGE_SUB}>
            Unified support tickets across Consumer App users, dark stores, delivery staff, and agricultural field managers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: All Inboxes vs Roles Overview */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'tickets'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Support Inbox
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'roles'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <UsersIcon className="h-3.5 w-3.5" />
              Browse by Role
              <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-mono">
                {roles.length || 10}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              loadTickets();
              loadRoles();
            }}
            className={BTN}
            title="Refresh Tickets"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* SAVED SEARCHES SECTION */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Bookmark className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Saved Searches
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {allSavedSearches.length} segments
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Reuse complex filter segments instantly for speedy, repeatable support.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shrink-0"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600" />
            Save Current Search
          </button>
        </div>

        {/* Saved Search Chips Carousel */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {allSavedSearches.map((seg) => {
            const isActive = isSegmentActive(seg);
            return (
              <div key={seg.id} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => applySavedSearch(seg)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
                    isActive
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200'
                  }`}
                  title={seg.description}
                >
                  <Zap className={`h-3 w-3 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
                  <span>{seg.title}</span>
                  {seg.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-slate-200/90 text-slate-700'
                      }`}
                    >
                      {seg.badge}
                    </span>
                  )}
                </button>
                {seg.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomSavedSearch(seg.id);
                    }}
                    className="ml-1 text-slate-300 hover:text-rose-600 p-0.5 rounded transition"
                    title="Delete custom saved search"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-xs text-rose-500 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB CONTENT: TICKETS VIEW */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Complex Filter Controls Toolbar */}
          <div className={`${PANEL} p-4 sm:p-5 space-y-4`}>
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets by customer name, phone number, order ID, email, or message keyword..."
                  className={`${INPUT} pl-10 text-sm`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      loadTickets();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className={`${BTN_PRIMARY} px-5`}>
                Search
              </button>
            </form>

            {/* Filter Dropdowns & Pills Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-slate-100 text-xs">
              {/* Role Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Target Panel / Role
                </label>
                <select
                  value={roleKey}
                  onChange={(e) => setRoleKey(e.target.value)}
                  className={`${INPUT} py-1.5 text-xs bg-white`}
                >
                  {SUPPORT_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Category Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Issue Category
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className={`${INPUT} py-1.5 text-xs bg-white`}
                >
                  {ISSUE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Time Window
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className={`${INPUT} py-1.5 text-xs bg-white`}
                >
                  {DATE_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status & Attachment Segment Toggles */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Status & Attachments
                </label>
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'open', label: 'Open' },
                      { id: 'resolved', label: 'Resolved' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatus(st.id)}
                        className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${
                          status === st.id
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasAttachment}
                      onChange={(e) => setHasAttachment(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <Paperclip className="h-3 w-3 text-slate-400" />
                    Has Photo
                  </label>
                </div>
              </div>
            </div>

            {/* Active Filters Summary & Reset */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-slate-500">Active Segment Filters:</span>
                  {roleKey !== 'all' && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                      Role: {supportRoleLabel(roleKey)}
                    </span>
                  )}
                  {status !== 'all' && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200 uppercase">
                      Status: {status}
                    </span>
                  )}
                  {issueType !== 'all' && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                      Issue: {formatIssueType(issueType)}
                    </span>
                  )}
                  {dateRange !== 'all' && (
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800 border border-purple-200">
                      Window: {dateRange}
                    </span>
                  )}
                  {hasAttachment && (
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-200">
                      📎 Photo Evidence Only
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200">
                      Query: "{searchQuery.trim()}"
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Tickets Results Header */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">
              Showing {tickets.length} Support Tickets
            </span>
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-amber-700">{stats.open} Open</span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700">{stats.resolved} Resolved</span>
            </div>
          </div>

          {/* Tickets Feed List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-20 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
                <Headset className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-3 text-base font-bold text-slate-700">No matching support tickets</p>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  No tickets found matching this filter segment. Try selecting another Saved Search segment or clearing active filters.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={`${BTN} mt-4 text-xs`}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              tickets.map((ticket) => {
                const id = ticket._id;
                const open = expandedId === id;
                const hasAtt = Boolean(ticket.attachment);
                const brief =
                  String(ticket.message || '').length > 140
                    ? `${String(ticket.message).slice(0, 140)}…`
                    : ticket.message;

                return (
                  <article
                    key={id}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:border-slate-300"
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setExpandedId(open ? '' : id)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-bold text-slate-900">
                            {ticket.name || 'Unknown User'}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-slate-700 border border-slate-200">
                            {formatIssueType(ticket.issueType)}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            {supportRoleLabel(ticket.roleKey)}
                          </span>
                          <StatusBadge status={ticket.status} />
                          {hasAtt && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              <Paperclip className="h-3 w-3" />
                              Photo
                            </span>
                          )}
                          {relatedCount(ticket) > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
                              <History className="h-3 w-3" />
                              {relatedCount(ticket) + 1} cases
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {ticket.phone && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {ticket.phone}
                            </span>
                          )}
                          {ticket.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {ticket.email}
                            </span>
                          )}
                          {ticket.orderId && (
                            <span className="inline-flex items-center gap-1 font-mono text-emerald-700 font-semibold">
                              Order: {ticket.orderId}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock3 className="h-3 w-3 text-slate-400" />
                            {formatWhen(ticket.createdAt)}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-slate-700">{open ? ticket.message : brief}</p>
                      </button>

                      <div className="flex shrink-0 items-center gap-2 self-start">
                        {ticket.status === 'open' ? (
                          <button
                            type="button"
                            onClick={() => updateTicketStatus(id, 'resolved')}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Resolve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateTicketStatus(id, 'open')}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? '' : id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          aria-label={open ? 'Collapse ticket' : 'Expand ticket'}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>
                    </div>

                    {open ? (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                        {ticket.attachment ? (
                          <div className="mt-1">
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              Uploaded Attachment / Evidence
                            </p>
                            <AttachmentPreview
                              url={ticket.attachment}
                              name={ticket.attachmentName}
                              onOpen={(url, name) => setLightbox({ url, name: name || '' })}
                            />
                          </div>
                        ) : null}

                        {ticket.adminNote ? (
                          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">Admin note:</span> {ticket.adminNote}
                          </p>
                        ) : null}

                        <UserHistorySection
                          ticket={ticket}
                          onOpenAttachment={(url, name) => setLightbox({ url, name: name || '' })}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BROWSE BY ROLE */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total requests</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalAllRoles}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/70">Open Escalations</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">{totalOpenRoles}</p>
            </div>
          </div>

          <div className={`${PANEL} p-4`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {roles.map((role) => {
                const isUsers = role.roleKey === 'customer';
                return (
                  <button
                    key={role.roleKey}
                    type="button"
                    onClick={() => {
                      setRoleKey(role.roleKey);
                      setActiveTab('tickets');
                    }}
                    className={`group flex items-start justify-between gap-3 rounded-2xl border bg-white p-4 text-left transition hover:shadow-sm ${
                      isUsers
                        ? 'border-emerald-300 ring-1 ring-emerald-100 hover:border-emerald-400'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900 group-hover:text-emerald-800">
                        {role.label}
                      </p>
                      {isUsers && (
                        <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                          Customer website · frontend
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{role.total || 0}</span> total
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="font-semibold text-amber-700">{role.open || 0}</span> open
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="font-semibold text-emerald-700">{role.resolved || 0}</span> resolved
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 group-hover:text-emerald-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SAVE SEARCH MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Save Current Search Segment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Save your current filter configuration (Role: <span className="font-semibold text-slate-800">{supportRoleLabel(roleKey)}</span>, Status: <span className="font-semibold text-slate-800">{status}</span>{issueType !== 'all' ? `, Issue: ${formatIssueType(issueType)}` : ''}) to reuse anytime.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Segment Name *
                </label>
                <input
                  type="text"
                  value={newSearchTitle}
                  onChange={(e) => setNewSearchTitle(e.target.value)}
                  placeholder="e.g. Pune Hub Payment Drops"
                  className={`${INPUT} text-sm`}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tag Badge Label
                </label>
                <input
                  type="text"
                  value={newSearchBadge}
                  onChange={(e) => setNewSearchBadge(e.target.value)}
                  placeholder="e.g. VIP, Urgent, Pune"
                  className={`${INPUT} text-sm`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className={`${BTN} text-xs`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newSearchTitle.trim()}
                onClick={handleSaveCurrentSearch}
                className={`${BTN_PRIMARY} text-xs px-4`}
              >
                Save Segment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for attachments */}
      <ImageLightbox
        url={lightbox.url}
        name={lightbox.name}
        onClose={() => setLightbox({ url: '', name: '' })}
      />
    </div>
  );
}

function UsersIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
