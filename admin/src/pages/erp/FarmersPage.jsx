import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Landmark,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Tractor,
  UserRound,
  Users,
} from 'lucide-react';
import erpApi from '../../api/erpApi';
import { BTN, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';

function statusTone(value) {
  const v = String(value || '').toLowerCase();
  if (['approved', 'verified', 'active', 'completed', 'success'].includes(v)) return 'green';
  if (['pending', 'in_progress', 'submitted', 'review'].includes(v)) return 'amber';
  if (['rejected', 'failed', 'inactive', 'blocked', 'suspended'].includes(v)) return 'rose';
  return 'slate';
}

function Pill({ children, tone = 'slate' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tones[tone] || tones.slate}`}
    >
      {children || '—'}
    </span>
  );
}

function pretty(value) {
  return String(value || '—')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function locationLine(f) {
  return [f.village, f.taluka, f.district].filter(Boolean).join(' · ') || 'Location not set';
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'F';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function FarmersPage() {
  const [items, setItems] = useState([]);
  const [managers, setManagers] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [managersLoading, setManagersLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('farmers');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadFarmers = () => {
    setLoading(true);
    setError('');
    erpApi
      .farmers({ q, page: 1, limit: 100 })
      .then((res) => {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load farmers'))
      .finally(() => setLoading(false));
  };

  const loadManagers = () => {
    setManagersLoading(true);
    erpApi
      .farmerManagers()
      .then((res) => setManagers(res.data.items || []))
      .catch(() => setManagers([]))
      .finally(() => setManagersLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(loadFarmers, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    loadManagers();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items;
    return items.filter((f) => String(f.status || '').toLowerCase() === statusFilter);
  }, [items, statusFilter]);

  const stats = useMemo(() => {
    const active = items.filter((f) => String(f.status || '').toLowerCase() === 'active').length;
    const kycOk = items.filter((f) =>
      ['approved', 'verified'].includes(String(f.kycStatus || '').toLowerCase())
    ).length;
    const bankOk = items.filter((f) =>
      ['approved', 'verified'].includes(String(f.bankStatus || '').toLowerCase())
    ).length;
    return [
      { label: 'Farmers', value: total || items.length, icon: Tractor, hint: 'In registry' },
      { label: 'Active', value: active, icon: ShieldCheck, hint: 'Currently active' },
      { label: 'KYC done', value: kycOk, icon: UserRound, hint: 'Verified / approved' },
      { label: 'Managers', value: managers.length, icon: Users, hint: 'Farmer managers' },
      { label: 'Bank verified', value: bankOk, icon: Landmark, hint: 'Bank status ok' },
    ];
  }, [items, total, managers]);

  const statusOptions = useMemo(() => {
    const set = new Set(items.map((f) => String(f.status || '').toLowerCase()).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>ERP · Supply</p>
          <h1 className={PAGE_TITLE}>Farmers</h1>
          <p className={PAGE_SUB}>
            Registry, managers, KYC and farm activity from farmer apps
          </p>
        </div>
        <button
          type="button"
          className={BTN}
          onClick={() => {
            loadFarmers();
            loadManagers();
          }}
        >
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${PANEL} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{item.value}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
                </div>
                <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'farmers', label: 'Farmers', count: total || items.length },
          { id: 'managers', label: 'Managers', count: managers.length },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              tab === item.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {item.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                tab === item.id ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'farmers' ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search ID, name, mobile, village…"
                className={`${INPUT} pl-9`}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === status
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All status' : pretty(status)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !filtered.length ? (
            <div className={`${PANEL} px-6 py-16 text-center`}>
              <Tractor className="mx-auto h-10 w-10 text-emerald-600/30" />
              <p className="mt-3 text-base font-semibold text-slate-800">No farmers found</p>
              <p className="mt-1 text-sm text-slate-400">
                Try another search or clear the status filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((f) => (
                <Link
                  key={f.farmerId || f.sourceId}
                  to={`/erp/farmers/${encodeURIComponent(f.farmerId)}`}
                  className={`${PANEL} group block p-4 transition hover:border-emerald-300 hover:shadow-md`}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-sm font-bold text-white shadow-sm">
                      {initials(f.fullName || f.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-slate-900">
                          {f.fullName || f.name || 'Unnamed farmer'}
                        </h2>
                        <Pill tone={statusTone(f.status)}>{pretty(f.status)}</Pill>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-emerald-700">
                        {f.farmerId}
                        {f.farmerCode && f.farmerCode !== f.farmerId ? ` · ${f.farmerCode}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {locationLine(f)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {f.mobile || '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {f.managerName || 'No manager'}
                        </span>
                      </div>
                      {f.farmName ? (
                        <p className="mt-1.5 text-xs text-slate-400">{f.farmName}</p>
                      ) : null}
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-col sm:items-end">
                      <div className="flex flex-wrap gap-1.5">
                        <Pill tone={statusTone(f.kycStatus)}>KYC {pretty(f.kycStatus)}</Pill>
                        <Pill tone={statusTone(f.bankStatus)}>Bank {pretty(f.bankStatus)}</Pill>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                        <span>{f.cropCount || 0} crops</span>
                        <span className="text-slate-300">·</span>
                        <span>{f.productCount || 0} products</span>
                        <span className="text-slate-300">·</span>
                        <span>{f.orderCount || 0} orders</span>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'managers' ? (
        managersLoading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !managers.length ? (
          <div className={`${PANEL} px-6 py-16 text-center`}>
            <Users className="mx-auto h-10 w-10 text-emerald-600/30" />
            <p className="mt-3 text-base font-semibold text-slate-800">No farmer managers found</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {managers.map((m) => (
              <article key={m.id} className={`${PANEL} p-4`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-600">
                    {initials(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-900">{m.name || 'Manager'}</h3>
                      <Pill tone={statusTone(m.status)}>{pretty(m.status)}</Pill>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">{m.id}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                  <p className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {m.mobile || '—'}
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {m.location || '—'}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Farmers
                    </p>
                    <p className="text-lg font-bold text-slate-900">{m.farmerCount || 0}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600/80">
                      Active
                    </p>
                    <p className="text-lg font-bold text-emerald-800">{m.activeFarmers || 0}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
