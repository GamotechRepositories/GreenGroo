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
  Bike,
  Store,
  UserCog,
} from 'lucide-react';
import erpApi from '../../api/erpApi';
import { BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';

const FALLBACK_LENSES = [
  { id: 'all', label: 'All insights' },
  { id: 'farmers', label: 'Farmers' },
  { id: 'farmer_managers', label: 'Farmer managers' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'pickup_drivers', label: 'Pickup drivers' },
  { id: 'delivery_managers', label: 'Delivery managers' },
  { id: 'delivery_boys', label: 'Delivery boys' },
  { id: 'office_staff', label: 'Office staff' },
  { id: 'customers', label: 'Customers' },
];

const LENS_COPY = {
  all: 'Company-wide KPIs across farms, inventory, commerce, and the full people network.',
  farmers: 'Farmer registry, KYC, crops, products, orders, and payouts from the farmer app.',
  farmer_managers: 'Field managers who onboard and support farmers.',
  vendors: 'Vendor partners connected to farmer operations.',
  pickup_drivers: 'Farm pickup drivers and open collection jobs.',
  delivery_managers: 'Dark-store managers, store orders, and rider coverage.',
  delivery_boys: 'Delivery partners, live status, KYC, and completed drops.',
  office_staff: 'Admin-created office roles used across GreenGrocc staff apps.',
  customers: 'ERP customer master and last-mile commerce volume.',
};

const LENS_GROUPS = {
  all: [
    {
      title: 'People network',
      items: [
        { key: 'totalFarmers', label: 'Farmers', icon: Tractor },
        { key: 'farmerManagers', label: 'Farmer managers', icon: UserCog },
        { key: 'liveVendors', label: 'Vendors', icon: Users },
        { key: 'pickupDrivers', label: 'Pickup drivers', icon: Truck },
        { key: 'deliveryManagers', label: 'Delivery managers', icon: Store },
        { key: 'deliveryBoys', label: 'Delivery boys', icon: Bike },
        { key: 'staffCount', label: 'Office staff', icon: Users },
        { key: 'customerGrowth', label: 'Customers', icon: Users },
      ],
    },
    {
      title: 'Farm & Produce',
      items: [
        { key: 'activeFarmers', label: 'Active Farmers', icon: Tractor },
        { key: 'totalFarms', label: 'Total Farms', icon: Leaf },
        { key: 'activeCrops', label: 'Active Crops', icon: Wheat },
        { key: 'farmerCrops', label: 'Farmer crops', icon: Wheat },
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
        { key: 'storeOrders', label: 'Store orders', icon: ShoppingCart },
        { key: 'vendorPerformance', label: 'ERP vendors', icon: Users },
        { key: 'hrHeadcount', label: 'HR records', icon: Users },
      ],
    },
  ],
  farmers: [
    {
      title: 'Farmer insights',
      items: [
        { key: 'totalFarmers', label: 'Total farmers', icon: Tractor },
        { key: 'activeFarmers', label: 'Active farmers', icon: Tractor },
        { key: 'kycApproved', label: 'KYC approved', icon: ShieldCheck },
        { key: 'kycPending', label: 'KYC pending', icon: AlertTriangle },
        { key: 'bankVerified', label: 'Bank verified', icon: IndianRupee },
        { key: 'totalFarms', label: 'Farms', icon: Leaf },
      ],
    },
    {
      title: 'Produce & payouts',
      items: [
        { key: 'farmerCrops', label: 'Crops', icon: Wheat },
        { key: 'farmerProducts', label: 'Products', icon: Package },
        { key: 'farmerOrders', label: 'Farmer orders', icon: ShoppingCart },
        { key: 'farmerOrderValue', label: 'Order value', icon: IndianRupee, money: true },
        { key: 'farmerEarningsPaid', label: 'Paid earnings', icon: IndianRupee, money: true },
        { key: 'farmerEarningsPending', label: 'Pending earnings', icon: IndianRupee, money: true },
      ],
    },
  ],
  farmer_managers: [
    {
      title: 'Farmer manager insights',
      items: [
        { key: 'farmerManagers', label: 'Total managers', icon: UserCog },
        { key: 'activeFarmerManagers', label: 'Active managers', icon: UserCog },
        { key: 'totalFarmers', label: 'Farmers managed', icon: Tractor },
        { key: 'activeFarmers', label: 'Active farmers', icon: Tractor },
        { key: 'farmerCrops', label: 'Crops in field', icon: Wheat },
        { key: 'farmerProducts', label: 'Listed products', icon: Package },
      ],
    },
  ],
  vendors: [
    {
      title: 'Vendor insights',
      items: [
        { key: 'liveVendors', label: 'App vendors', icon: Users },
        { key: 'activeVendors', label: 'Active vendors', icon: Users },
        { key: 'pendingVendors', label: 'Pending vendors', icon: AlertTriangle },
        { key: 'vendorPerformance', label: 'ERP vendor master', icon: Users },
        { key: 'totalFarmers', label: 'Farmers linked', icon: Tractor },
        { key: 'farmerOrderValue', label: 'Farmer order value', icon: IndianRupee, money: true },
      ],
    },
  ],
  pickup_drivers: [
    {
      title: 'Pickup driver insights',
      items: [
        { key: 'pickupDrivers', label: 'Pickup drivers', icon: Truck },
        { key: 'activePickupDrivers', label: 'Active drivers', icon: Truck },
        { key: 'pickupsOpen', label: 'Open pickups', icon: Boxes },
        { key: 'driverPerformance', label: 'Driver records', icon: Truck },
        { key: 'farmerOrders', label: 'Farmer orders', icon: ShoppingCart },
        { key: 'qualityRejections', label: 'QC rejections', icon: ShieldCheck },
      ],
    },
  ],
  delivery_managers: [
    {
      title: 'Delivery manager insights',
      items: [
        { key: 'deliveryManagers', label: 'Store managers', icon: Store },
        { key: 'activeDeliveryManagers', label: 'Active stores', icon: Store },
        { key: 'deliveryBoys', label: 'Riders assigned', icon: Bike },
        { key: 'storeOrders', label: 'Store orders', icon: ShoppingCart },
        { key: 'storePending', label: 'Open store orders', icon: ShoppingCart },
        { key: 'storeDelivered', label: 'Delivered orders', icon: ShoppingCart },
      ],
    },
  ],
  delivery_boys: [
    {
      title: 'Delivery boy insights',
      items: [
        { key: 'deliveryBoys', label: 'Delivery boys', icon: Bike },
        { key: 'onlineBoys', label: 'Online now', icon: Bike },
        { key: 'onDeliveryBoys', label: 'On delivery', icon: Truck },
        { key: 'pendingBoyKyc', label: 'Pending KYC', icon: AlertTriangle },
        { key: 'todayRiderDeliveries', label: "Today's drops", icon: ShoppingCart },
        { key: 'storeDelivered', label: 'Delivered orders', icon: ShoppingCart },
      ],
    },
  ],
  office_staff: [
    {
      title: 'Office staff insights',
      items: [
        { key: 'staffCount', label: 'Office staff', icon: Users },
        { key: 'activeStaff', label: 'Active staff', icon: Users },
        { key: 'staffProductManagers', label: 'Product managers', icon: Package },
        { key: 'staffFarmerManagers', label: 'Staff farmer managers', icon: UserCog },
        { key: 'staffSegregationManagers', label: 'Segregation managers', icon: Boxes },
        { key: 'staffVendors', label: 'Staff vendor logins', icon: Users },
        { key: 'hrHeadcount', label: 'ERP HR records', icon: Users },
      ],
    },
  ],
  customers: [
    {
      title: 'Customer insights',
      items: [
        { key: 'customerGrowth', label: 'ERP customers', icon: Users },
        { key: 'todaysOrders', label: "Today's orders", icon: ShoppingCart },
        { key: 'pendingOrders', label: 'Pending orders', icon: ShoppingCart },
        { key: 'completedOrders', label: 'Completed orders', icon: ShoppingCart },
        { key: 'revenue', label: 'Revenue', icon: IndianRupee, money: true },
        { key: 'storeOrders', label: 'Dark-store orders', icon: Store },
      ],
    },
  ],
};

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
  const [lens, setLens] = useState('all');

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
  const lenses = data?.lenses?.length ? data.lenses : FALLBACK_LENSES;
  const groups = LENS_GROUPS[lens] || LENS_GROUPS.all;

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

  const activeLens = lenses.find((item) => item.id === lens) || lenses[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={PAGE_KICKER}>Admin Panel</p>
          <h1 className={`mt-1 ${PAGE_TITLE}`}>CEO Master Dashboard</h1>
          <p className={`mt-0.5 ${PAGE_SUB}`}>
            Filter whose insights to review. One ID → complete traceability → one dashboard.
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
              className={`${INPUT} pl-9`}
            />
          </div>
          <button type="submit" disabled={searching} className={BTN_PRIMARY}>
            {searching ? '...' : 'Trace'}
          </button>
        </form>
      </div>

      <div className={`${PANEL} p-3 sm:p-4`}>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Insight filter</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {activeLens?.label || 'All insights'}
            </p>
          </div>
          <p className="max-w-xl text-xs text-slate-500">{LENS_COPY[lens] || LENS_COPY.all}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {lenses.map((item) => {
            const selected = item.id === lens;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLens(item.id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  selected
                    ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
                {item.count != null ? (
                  <span className={`ml-1.5 tabular-nums ${selected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {Number(item.count).toLocaleString('en-IN')}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
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
        groups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{group.title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className={`${PANEL} p-4 sm:p-5`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#6B7280]">{item.label}</p>
                      <Icon className="h-4 w-4 text-[#217346]" />
                    </div>
                    <p className="mt-1 text-2xl font-bold text-[#1F2937]">
                      {formatValue(kpis[item.key], item)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {lens === 'all' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { label: 'Grade A / B / C', value: `${kpis.gradeAPercent || 0}% / ${kpis.gradeBPercent || 0}% / ${kpis.gradeCPercent || 0}%` },
            { label: 'Procurement', value: formatValue(kpis.procurementAmount, { money: true }) },
            { label: 'HR headcount', value: kpis.hrHeadcount || 0 },
          ].map((row) => (
            <div key={row.label} className={`${PANEL} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#217346]">{row.label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{row.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <BarChart3 className="h-4 w-4" />
        Click any ID in Traceability to walk Farmer → Farm → Crop → Article → Batch → QR → Order → Payment.
      </div>
    </div>
  );
}
