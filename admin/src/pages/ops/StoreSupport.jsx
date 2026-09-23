import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, INPUT, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';

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
        open ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
      }`}
    >
      {status || 'open'}
    </span>
  );
}

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
            {meta.open ? ` · ${meta.open} open` : ''}
            {meta.resolved ? ` · ${meta.resolved} resolved` : ''}
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
        <ul className="mt-3 space-y-2">
          {rows.map((row) => {
            const brief =
              String(row.message || '').length > 100
                ? `${String(row.message).slice(0, 100)}…`
                : row.message;
            return (
              <li
                key={row._id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600 ring-1 ring-slate-200">
                    {formatIssueType(row.issueType)}
                  </span>
                  <StatusBadge status={row.status} />
                  <span className="text-[10px] font-semibold text-slate-400">
                    {supportRoleLabel(row.roleKey)}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400">{formatWhen(row.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{brief || '—'}</p>
                {row.orderId ? (
                  <p className="mt-1 text-[10px] text-slate-400">Order: {row.orderId}</p>
                ) : null}
                {row.attachment ? (
                  <button
                    type="button"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                    onClick={() => onOpenAttachment?.(row.attachment, row.attachmentName)}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    View attachment
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

function RoleListScreen() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await opsApi.list('support', { overview: 'roles' });
      setRoles(res.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalOpen = roles.reduce((sum, role) => sum + (role.open || 0), 0);
  const totalAll = roles.reduce((sum, role) => sum + (role.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Headset className="h-5 w-5" />
          </div>
          <h1 className={PAGE_TITLE}>Store Support</h1>
          <p className={PAGE_SUB}>
            Support requests from every role panel and the Users site. Choose a role to review
            tickets.
          </p>
        </div>
        <button type="button" onClick={load} className={BTN}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total requests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalAll}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/70">Open</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{totalOpen}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className={`${PANEL} p-4`}>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => {
              const isUsers = role.roleKey === 'customer';
              return (
                <button
                  key={role.roleKey}
                  type="button"
                  onClick={() => navigate(`/store-support/${role.roleKey}`)}
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
                    {isUsers ? (
                      <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                        Customer website · frontend
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{role.total || 0}</span> total
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-semibold text-amber-700">{role.open || 0}</span> open
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-semibold text-emerald-700">{role.resolved || 0}</span> resolved
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Updated{' '}
                      {role.updatedAt
                        ? new Date(role.updatedAt).toLocaleDateString('en-IN')
                        : '—'}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 group-hover:text-emerald-600" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleTicketsScreen({ roleKey }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [roleLabel, setRoleLabel] = useState(roleKey);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [lightbox, setLightbox] = useState({ url: '', name: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await opsApi.list('support', { roleKey });
      const list = Array.isArray(res.data) ? res.data : [];
      setTickets(list);
      if (res.role?.label) setRoleLabel(res.role.label);
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

  useEffect(() => {
    load();
  }, [roleKey]);

  const update = async (id, nextStatus) => {
    try {
    await opsApi.patch(`support/${id}`, { status: nextStatus });
    await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update ticket');
    }
  };

  const visibleTickets =
    status === 'all' ? tickets : tickets.filter((t) => t.status === status);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate('/store-support')}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            All roles
          </button>
          <h1 className={PAGE_TITLE}>{roleLabel} support</h1>
          <p className={PAGE_SUB}>
            Review requests, open a card for the full message, then mark resolved.
          </p>
        </div>
        <button type="button" onClick={load} className={BTN}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: 'all', label: 'All', count: stats.total },
            { id: 'open', label: 'Open', count: stats.open },
            { id: 'resolved', label: 'Resolved', count: stats.resolved },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                status === item.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {item.label}
              <span
                className={`ml-1.5 tabular-nums ${
                  status === item.id ? 'text-emerald-100' : 'text-slate-400'
                }`}
              >
                {item.count ?? 0}
              </span>
          </button>
        ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : visibleTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Headset className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">No support requests yet</p>
            <p className="mt-1 text-xs text-slate-400">
              {status === 'all'
                ? 'New tickets from this role will show up here.'
                : `No ${status} tickets for this role.`}
            </p>
          </div>
        ) : (
          visibleTickets.map((ticket) => {
            const id = ticket._id;
            const open = expandedId === id;
            const brief =
              String(ticket.message || '').length > 140
                ? `${String(ticket.message).slice(0, 140)}…`
                : ticket.message;

            return (
              <article
                key={id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setExpandedId(open ? '' : id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">
                        {ticket.name || 'Unknown'}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                        {formatIssueType(ticket.issueType)}
                      </span>
                      <StatusBadge status={ticket.status} />
                      {relatedCount(ticket) > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
                          <History className="h-3 w-3" />
                          {relatedCount(ticket) + 1} cases
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {ticket.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {ticket.email}
                        </span>
                      ) : null}
                      {ticket.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {ticket.phone}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                        {formatWhen(ticket.createdAt)}
                      </span>
                </div>

                    {!open ? (
                      <>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{brief || '—'}</p>
                        {ticket.attachment ? (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                            <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                            Has attachment · open for preview
                          </p>
                        ) : null}
                      </>
                    ) : null}

                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      {open ? 'Hide details' : 'View full message'}
                      <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Status
                <select
                        value={ticket.status || 'open'}
                        onChange={(e) => update(id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`${INPUT} mt-1 min-w-[120px] py-2 text-xs font-semibold`}
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
                    </label>
                  </div>
                </div>

                {open ? (
                  <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Message
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {ticket.message || '—'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      {ticket.orderId ? (
                        <span className="rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                          Order: <span className="font-semibold text-slate-700">{ticket.orderId}</span>
                        </span>
                      ) : null}
                      {ticket.attachmentName && !ticket.attachment ? (
                        <span className="rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                          Attachment:{' '}
                          <span className="font-semibold text-slate-700">{ticket.attachmentName}</span>
                        </span>
                      ) : null}
                    </div>
                    {ticket.attachment ? (
                      <div className="mt-3">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Uploaded image
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
                        <span className="font-semibold text-slate-800">Admin note:</span>{' '}
                        {ticket.adminNote}
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

      <ImageLightbox
        url={lightbox.url}
        name={lightbox.name}
        onClose={() => setLightbox({ url: '', name: '' })}
      />
    </div>
  );
}

export default function StoreSupport() {
  const { roleKey } = useParams();
  if (roleKey) {
    return <RoleTicketsScreen roleKey={roleKey} />;
  }
  return <RoleListScreen />;
}
