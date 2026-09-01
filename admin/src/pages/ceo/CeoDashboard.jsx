import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Search,
  Tractor,
  Wheat,
  Package,
  Boxes,
  Warehouse,
  ShoppingCart,
  IndianRupee,
  Truck,
  ShieldCheck,
  Users,
  AlertTriangle,
  Thermometer,
  Leaf,
  Loader2,
} from 'lucide-react';
import erpApi from '../../api/erpApi';

const KPI_GROUPS = [
  {
    title: 'Farm & Produce',
    items: [
      { key: 'totalFarmers', label: 'Total Farmers', icon: Tractor },
      { key: 'activeFarmers', label: 'Active Farmers', icon: Tractor },
      { key: 'totalFarms', label: 'Total Farms', icon: Leaf },
      { key: 'activeCrops', label: 'Active Crops', icon: Wheat },
      { key: 'totalArticles', label: 'Articles', icon: Package },
      { key: 'totalBatches', label: 'Batches', icon: Boxes },
    ],
  },
  {
    title: 'Inventory & Quality',
    items: [
      { key: 'totalInventory', label: 'Total Inventory', icon: Warehouse },
      { key: 'lowStock', label: 'Low Stock', icon: AlertTriangle },
      { key: 'warehouseStock', label: 'Warehouse Stock', icon: Warehouse },
      { key: 'coldStorageStock', label: 'Cold Storage', icon: Thermometer },
      { key: 'qualityRejections', label: 'QC Rejections', icon: ShieldCheck },
      { key: 'gradeAPercent', label: 'Grade A %', icon: ShieldCheck, suffix: '%' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { key: 'todaysOrders', label: "Today's Orders", icon: ShoppingCart },
      { key: 'pendingOrders', label: 'Pending Orders', icon: ShoppingCart },
      { key: 'completedOrders', label: 'Completed Orders', icon: ShoppingCart },
      { key: 'revenue', label: 'Revenue', icon: IndianRupee, money: true },
      { key: 'expenses', label: 'Expenses', icon: IndianRupee, money: true },
      { key: 'profit', label: 'Profit', icon: IndianRupee, money: true },
    ],
  },
  {
    title: 'Network',
    items: [
      { key: 'pendingPayments', label: 'Pending Payments', icon: IndianRupee },
      { key: 'collections', label: 'Collections', icon: IndianRupee, money: true },
      { key: 'deliveryPerformance', label: 'Delivery %', icon: Truck, suffix: '%' },
      { key: 'customerGrowth', label: 'Customers', icon: Users },
      { key: 'vendorPerformance', label: 'Vendors', icon: Users },
      { key: 'driverPerformance', label: 'Drivers', icon: Truck },
    ],
  },
];

function formatValue(value, meta) {
  if (value == null) return '0';
  if (meta.money) {
    return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  if (meta.suffix) return `${Number(value).toLocaleString('en-IN')}${meta.suffix}`;
  return Number(value).toLocaleString('en-IN');
}

export default function CeoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await erpApi.dashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load CEO dashboard. Sign in as admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = data?.kpis || {};

  const onSearch = async (event) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      navigate(`/traceability?q=${encodeURIComponent(q)}`);
    } finally {
      setSearching(false);
    }
  };

  const generated = useMemo(
    () => (data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : ''),
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">GGC Enterprise ERP</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            CEO Master Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            One ID → complete traceability → one dashboard. Live KPIs across the GreenGrocc chain.
          </p>
          {generated && <p className="mt-1 text-xs text-slate-400">Updated {generated}</p>}
        </div>
        <form onSubmit={onSearch} className="flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Farmer / Article / Batch / QR / Order ID"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none ring-emerald-500/20 focus:ring-4 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {searching ? '...' : 'Trace'}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading live KPIs
        </div>
      ) : (
        KPI_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{group.title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500">{item.label}</p>
                      <Icon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
                      {formatValue(kpis[item.key], item)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { label: 'Grade A / B / C', value: `${kpis.gradeAPercent || 0}% / ${kpis.gradeBPercent || 0}% / ${kpis.gradeCPercent || 0}%` },
          { label: 'Procurement', value: formatValue(kpis.procurementAmount, { money: true }) },
          { label: 'HR headcount', value: kpis.hrHeadcount || 0 },
        ].map((row) => (
          <div key={row.label} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{row.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{row.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <BarChart3 className="h-4 w-4" />
        Click any ID in Traceability to walk Farmer → Farm → Crop → Article → Batch → QR → Order → Payment.
      </div>
    </div>
  );
}
