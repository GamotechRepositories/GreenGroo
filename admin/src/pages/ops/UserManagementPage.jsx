import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Loader2,
  MapPinned,
  Package,
  Search,
  Store,
  Users,
  UserRound,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function accountLabel(type) {
  return String(type || '').toLowerCase() === 'bulk' ? 'Bulk user' : 'Normal user';
}

function normalizeType(type) {
  const raw = String(type || '').toLowerCase();
  return raw === 'bulk' ? 'bulk' : 'retail';
}

function Breadcrumb({ items }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" /> : null}
            {item.to && !isLast ? (
              <Link to={item.to} className="font-medium text-slate-600 transition hover:text-emerald-700">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-semibold text-slate-800' : ''}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className={`${PANEL} flex items-center gap-3 px-4 py-3`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#217346]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className={`${PANEL} px-6 py-14 text-center`}>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

/** Step 1 — Normal / Bulk */
export function UserManagementTypePage() {
  const cards = [
    {
      type: 'retail',
      title: 'Normal user',
      description: 'Retail customers who place regular grocery orders.',
      icon: UserRound,
    },
    {
      type: 'bulk',
      title: 'Bulk user',
      description: 'B2B / wholesale accounts with shop and GST details.',
      icon: Package,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className={PAGE_KICKER}>Operations</p>
        <h1 className={PAGE_TITLE}>User management</h1>
        <p className={PAGE_SUB}>Choose a user type, then browse by zone and dark store.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.type}
              to={`/user-management/${card.type}`}
              className={`${PANEL} group flex flex-col gap-4 p-5 transition hover:border-emerald-300 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#217346] transition group-hover:bg-emerald-100">
                  <Icon className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{card.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{card.description}</p>
              </div>
              <span className="text-sm font-semibold text-[#217346]">View zones →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Step 2 — Zones (cities) */
export function UserManagementZonesPage() {
  const { accountType: rawType } = useParams();
  const accountType = normalizeType(rawType);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    opsApi
      .list('user-management/zones')
      .then((res) => {
        if (!alive) return;
        setZones(res.data || []);
      })
      .catch((err) => alive && setError(err.response?.data?.message || 'Failed to load zones'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return zones;
    return zones.filter((z) => [z.name, z.city, z.cityId].join(' ').toLowerCase().includes(needle));
  }, [zones, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Breadcrumb
            items={[
              { label: 'User management', to: '/user-management' },
              { label: accountLabel(accountType) },
            ]}
          />
          <h1 className={PAGE_TITLE}>Zones</h1>
          <p className={PAGE_SUB}>
            Select a city zone to see dark stores for {accountLabel(accountType).toLowerCase()}s.
          </p>
        </div>
        <Link to="/user-management" className={BTN}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Zones" value={zones.length} icon={MapPinned} />
        <StatCard
          label="Dark stores"
          value={zones.reduce((s, z) => s + (z.storeCount || 0), 0)}
          icon={Store}
        />
        <StatCard label="User type" value={accountLabel(accountType)} icon={Users} />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className={`${INPUT} pl-9`}
          placeholder="Search zone (e.g. Mumbai, Pune)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading zones…
        </div>
      ) : error ? (
        <EmptyState title="Could not load zones" subtitle={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No zones found" subtitle="Add dark stores with a city to populate zones." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((zone) => (
            <Link
              key={zone.zoneKey}
              to={`/user-management/${accountType}/zones/${encodeURIComponent(zone.zoneKey)}`}
              className={`${PANEL} group flex items-center gap-4 p-4 transition hover:border-emerald-300 hover:shadow-md`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-slate-900">{zone.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {zone.storeCount} store{zone.storeCount === 1 ? '' : 's'}
                  {zone.areaCount ? ` · ${zone.areaCount} areas` : ''}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-emerald-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Step 3 — Dark stores in zone */
export function UserManagementStoresPage() {
  const { accountType: rawType, zoneKey } = useParams();
  const accountType = normalizeType(rawType);
  const decodedZone = decodeURIComponent(zoneKey || '');
  const [stores, setStores] = useState([]);
  const [zone, setZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    opsApi
      .list(`user-management/zones/${encodeURIComponent(decodedZone)}/stores`)
      .then((res) => {
        if (!alive) return;
        setStores(res.data || []);
        setZone(res.zone || { name: decodedZone, zoneKey: decodedZone });
      })
      .catch((err) => alive && setError(err.response?.data?.message || 'Failed to load stores'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [decodedZone]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return stores;
    return stores.filter((s) =>
      [s.storeName, s.name, s.area, s.phone, s.email].join(' ').toLowerCase().includes(needle)
    );
  }, [stores, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Breadcrumb
            items={[
              { label: 'User management', to: '/user-management' },
              { label: accountLabel(accountType), to: `/user-management/${accountType}` },
              { label: zone?.name || decodedZone },
            ]}
          />
          <h1 className={PAGE_TITLE}>Dark stores</h1>
          <p className={PAGE_SUB}>
            Stores in {zone?.name || decodedZone}. Open a store to see {accountLabel(accountType).toLowerCase()}s who ordered there.
          </p>
        </div>
        <Link to={`/user-management/${accountType}`} className={BTN}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Zones
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Stores" value={stores.length} icon={Store} />
        <StatCard
          label="Orders (all)"
          value={stores.reduce((s, row) => s + (row.orderCount || 0), 0)}
          icon={Package}
        />
        <StatCard
          label="Customers (phones)"
          value={stores.reduce((s, row) => s + (row.customerCount || 0), 0)}
          icon={Users}
        />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className={`${INPUT} pl-9`}
          placeholder="Search store, area, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading stores…
        </div>
      ) : error ? (
        <EmptyState title="Could not load stores" subtitle={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No dark stores in this zone" subtitle="Try another zone or add stores in Dark Stores." />
      ) : (
        <div className={`${PANEL} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className={TH}>Store</th>
                  <th className={TH}>Area</th>
                  <th className={TH}>Contact</th>
                  <th className={TH}>Orders</th>
                  <th className={TH}>Status</th>
                  <th className={TH} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((store) => (
                  <tr key={store.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">{store.storeName}</p>
                      <p className="text-xs text-slate-500">{store.name}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">{store.area || '—'}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <p>{store.phone || '—'}</p>
                      <p className="text-xs text-slate-500">{store.email || ''}</p>
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-slate-800">{store.orderCount || 0}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          store.isActive ? 'bg-emerald-50 text-[#217346]' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {store.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to={`/user-management/${accountType}/zones/${encodeURIComponent(decodedZone)}/stores/${store.id}`}
                        className={`${BTN_PRIMARY} !min-h-9 !px-3 !text-xs`}
                      >
                        View users
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/** Step 4 — Users who ordered from store */
export function UserManagementUsersPage() {
  const { accountType: rawType, zoneKey, storeId } = useParams();
  const accountType = normalizeType(rawType);
  const decodedZone = decodeURIComponent(zoneKey || '');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [store, setStore] = useState(null);
  const [areas, setAreas] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [minOrders, setMinOrders] = useState(searchParams.get('minOrders') || '');
  const [maxOrders, setMaxOrders] = useState(searchParams.get('maxOrders') || '');
  const [minQty, setMinQty] = useState(searchParams.get('minQty') || '');
  const [maxQty, setMaxQty] = useState(searchParams.get('maxQty') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'lastOrderAt');

  const load = (overrides = {}) => {
    setLoading(true);
    setError('');
    const nextSearch = overrides.search ?? search;
    const nextArea = overrides.area ?? area;
    const nextDateFrom = overrides.dateFrom ?? dateFrom;
    const nextDateTo = overrides.dateTo ?? dateTo;
    const nextMinOrders = overrides.minOrders ?? minOrders;
    const nextMaxOrders = overrides.maxOrders ?? maxOrders;
    const nextMinQty = overrides.minQty ?? minQty;
    const nextMaxQty = overrides.maxQty ?? maxQty;
    const nextSort = overrides.sort ?? sort;

    const params = {
      accountType,
      search: String(nextSearch || '').trim() || undefined,
      area: nextArea || undefined,
      dateFrom: nextDateFrom || undefined,
      dateTo: nextDateTo || undefined,
      minOrders: nextMinOrders || undefined,
      maxOrders: nextMaxOrders || undefined,
      minQty: nextMinQty || undefined,
      maxQty: nextMaxQty || undefined,
      sort: nextSort,
      sortDir: 'desc',
    };
    Object.keys(params).forEach((key) => params[key] == null && delete params[key]);

    const next = new URLSearchParams();
    if (String(nextSearch || '').trim()) next.set('q', String(nextSearch).trim());
    if (nextArea) next.set('area', nextArea);
    if (nextDateFrom) next.set('dateFrom', nextDateFrom);
    if (nextDateTo) next.set('dateTo', nextDateTo);
    if (nextMinOrders) next.set('minOrders', nextMinOrders);
    if (nextMaxOrders) next.set('maxOrders', nextMaxOrders);
    if (nextMinQty) next.set('minQty', nextMinQty);
    if (nextMaxQty) next.set('maxQty', nextMaxQty);
    if (nextSort && nextSort !== 'lastOrderAt') next.set('sort', nextSort);
    setSearchParams(next, { replace: true });

    opsApi
      .list(`user-management/stores/${storeId}/users`, params)
      .then((res) => {
        setUsers(res.data || []);
        setStore(res.store || null);
        setAreas(res.filters?.areas || []);
        setStats(res.stats || null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, accountType]);

  const clearFilters = () => {
    setSearch('');
    setArea('');
    setDateFrom('');
    setDateTo('');
    setMinOrders('');
    setMaxOrders('');
    setMinQty('');
    setMaxQty('');
    setSort('lastOrderAt');
    load({
      search: '',
      area: '',
      dateFrom: '',
      dateTo: '',
      minOrders: '',
      maxOrders: '',
      minQty: '',
      maxQty: '',
      sort: 'lastOrderAt',
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Breadcrumb
            items={[
              { label: 'User management', to: '/user-management' },
              { label: accountLabel(accountType), to: `/user-management/${accountType}` },
              {
                label: store?.city || decodedZone,
                to: `/user-management/${accountType}/zones/${encodeURIComponent(decodedZone)}`,
              },
              { label: store?.storeName || 'Store users' },
            ]}
          />
          <h1 className={PAGE_TITLE}>{store?.storeName || 'Store users'}</h1>
          <p className={PAGE_SUB}>
            {accountLabel(accountType)}s who ordered from this dark store
            {store?.area ? ` · ${store.area}` : ''}.
          </p>
        </div>
        <button
          type="button"
          className={BTN}
          onClick={() =>
            navigate(`/user-management/${accountType}/zones/${encodeURIComponent(decodedZone)}`)
          }
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Stores
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={stats?.userCount ?? users.length} icon={Users} />
        <StatCard label="Orders" value={stats?.orderCount ?? 0} icon={Package} />
        <StatCard label="Total qty" value={stats?.totalQuantity ?? 0} icon={Package} />
        <StatCard label="Order value" value={money(stats?.totalAmount)} icon={Store} />
      </div>

      <div className={`${PANEL} space-y-3 p-4`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${INPUT} pl-9`}
                placeholder="Name, phone, or order ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Area</label>
            <select className={INPUT} value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-semibold text-slate-500">From date</label>
            <input type="date" className={INPUT} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-semibold text-slate-500">To date</label>
            <input type="date" className={INPUT} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Min orders</label>
            <input type="number" min="0" className={INPUT} value={minOrders} onChange={(e) => setMinOrders(e.target.value)} />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Max orders</label>
            <input type="number" min="0" className={INPUT} value={maxOrders} onChange={(e) => setMaxOrders(e.target.value)} />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Min qty</label>
            <input type="number" min="0" className={INPUT} value={minQty} onChange={(e) => setMinQty(e.target.value)} />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Max qty</label>
            <input type="number" min="0" className={INPUT} value={maxQty} onChange={(e) => setMaxQty(e.target.value)} />
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Sort by</label>
            <select className={INPUT} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="lastOrderAt">Last order time</option>
              <option value="orderCount">Order count</option>
              <option value="totalQuantity">Total quantity</option>
              <option value="totalAmount">Order value</option>
              <option value="name">Name</option>
            </select>
          </div>
          <button type="button" className={BTN_PRIMARY} onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Apply filters
          </button>
          <button type="button" className={BTN} onClick={clearFilters}>
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
        </div>
      ) : error ? (
        <EmptyState title="Could not load users" subtitle={error} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No matching users"
          subtitle="Try clearing filters, or check that orders are linked to this dark store."
        />
      ) : (
        <div className={`${PANEL} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className={TH}>Customer</th>
                  <th className={TH}>Phone</th>
                  {accountType === 'bulk' ? <th className={TH}>Shop</th> : null}
                  <th className={TH}>Area</th>
                  <th className={TH}>Orders</th>
                  <th className={TH}>Qty</th>
                  <th className={TH}>Value</th>
                  <th className={TH}>Last order</th>
                  <th className={TH}>Order ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      {user.email ? <p className="text-xs text-slate-500">{user.email}</p> : null}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-slate-800">{user.phone || '—'}</td>
                    {accountType === 'bulk' ? (
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <p className="font-medium">{user.shopName || '—'}</p>
                        {user.gstNumber ? <p className="text-xs text-slate-500">{user.gstNumber}</p> : null}
                      </td>
                    ) : null}
                    <td className="px-3 py-3 text-sm text-slate-700">
                      {user.lastArea || user.areas?.[0] || '—'}
                      {user.areas?.length > 1 ? (
                        <span className="ml-1 text-xs text-slate-400">+{user.areas.length - 1}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-slate-900">{user.orderCount}</td>
                    <td className="px-3 py-3 text-sm text-slate-800">{user.totalQuantity}</td>
                    <td className="px-3 py-3 text-sm font-medium text-slate-800">{money(user.totalAmount)}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">{formatDateTime(user.lastOrderAt)}</td>
                    <td className="px-3 py-3 text-sm font-mono text-slate-700">{user.lastOrderNumber || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
