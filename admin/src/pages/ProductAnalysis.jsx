import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Package, RefreshCw, Search } from 'lucide-react';
import opsApi from '../api/opsApi';
import { BTN, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../utils/ui';

const SORTS = {
  revenue: { label: 'Highest revenue', fn: (a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold },
  units: { label: 'Most units sold', fn: (a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue },
  recent: { label: 'Most sold (last 30 days)', fn: (a, b) => b.unitsLast30d - a.unitsLast30d || b.unitsSold - a.unitsSold },
  open: { label: 'Most open demand', fn: (a, b) => b.openUnits - a.openUnits },
  stock: { label: 'Lowest stock', fn: (a, b) => a.stock - b.stock },
};

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function ProductAnalysis() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState('all');
  const [salesFilter, setSalesFilter] = useState('all');
  const [sort, setSort] = useState('revenue');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await opsApi.list('products/analysis');
      setRows(Array.isArray(res.data) ? res.data : []);
      setStats(res.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product analysis');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (audience !== 'all' && row.audience !== audience) return false;
        if (salesFilter === 'sold' && row.unitsSold === 0) return false;
        if (salesFilter === 'never' && (row.unitsSold > 0 || row.removed)) return false;
        if (salesFilter === 'out' && row.inStock) return false;
        if (!q) return true;
        return [row.name, row.sku, row.category, row.subcategory].some((v) =>
          String(v || '').toLowerCase().includes(q)
        );
      })
      .sort(SORTS[sort].fn);
  }, [rows, search, audience, salesFilter, sort]);

  const maxRevenue = useMemo(() => Math.max(1, ...rows.map((r) => r.revenue)), [rows]);

  const cards = stats
    ? [
        { label: 'Delivered revenue', value: rupees(stats.revenue), hint: 'Items only, excludes delivery charges' },
        { label: 'Units sold', value: stats.unitsSold.toLocaleString('en-IN'), hint: 'Across delivered orders' },
        { label: 'Products sold', value: `${stats.productsSold} / ${stats.products}`, hint: 'Sold at least once' },
        { label: 'Never sold', value: stats.neverSold.toLocaleString('en-IN'), hint: 'In catalogue, zero delivered sales' },
      ]
    : [];

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Product Management</p>
          <h1 className={PAGE_TITLE}>Product-wise Analysis</h1>
          <p className={PAGE_SUB}>Sales, demand, and stock for every product, from customer orders.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className={BTN}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      ) : null}

      {cards.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className={`${PANEL} p-4`}>
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{card.hint}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`${PANEL} flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU, or category…"
            className={`${INPUT} pl-9`}
          />
        </div>
        <select value={audience} onChange={(e) => setAudience(e.target.value)} className={`${INPUT} md:max-w-[180px]`}>
          <option value="all">All user types</option>
          <option value="retail">Normal users (B2C)</option>
          <option value="bulk">Bulk users (B2B)</option>
        </select>
        <select value={salesFilter} onChange={(e) => setSalesFilter(e.target.value)} className={`${INPUT} md:max-w-[170px]`}>
          <option value="all">All products</option>
          <option value="sold">Sold at least once</option>
          <option value="never">Never sold</option>
          <option value="out">Out of stock</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${INPUT} md:max-w-[210px]`}>
          {Object.entries(SORTS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className={`${PANEL} overflow-hidden`}>
        {loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">No products match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  {['Product', 'Price', 'Stock', 'Units sold', 'Orders', 'Last 30 days', 'Open', 'Cancelled / returned', 'Revenue', 'Last sold'].map(
                    (h) => (
                      <th key={h} className={TH}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row._id} className="group">
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {row.image ? (
                            <img src={row.image} alt={row.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold text-slate-900">{row.name}</p>
                            {row.removed ? (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Removed</span>
                            ) : (
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
                                  row.audience === 'bulk'
                                    ? 'bg-amber-50 text-amber-800 ring-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                                }`}
                              >
                                {row.audience === 'bulk' ? 'Bulk' : 'Normal'}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {row.sku ? <span className="font-mono">{row.sku}</span> : null}
                            {row.category ? ` · ${row.category}` : ''}
                            {row.subcategory ? ` / ${row.subcategory}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${TD} tabular-nums`}>{row.removed ? '—' : rupees(row.price)}</td>
                    <td className={TD}>
                      {row.removed ? (
                        '—'
                      ) : (
                        <span className={`text-xs font-semibold ${row.inStock && row.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {row.inStock ? row.stock : 'Out of stock'}
                        </span>
                      )}
                    </td>
                    <td className={`${TD} font-semibold tabular-nums text-slate-900`}>{row.unitsSold}</td>
                    <td className={`${TD} tabular-nums`}>{row.deliveredOrders}</td>
                    <td className={`${TD} tabular-nums`}>{row.unitsLast30d}</td>
                    <td className={`${TD} tabular-nums`}>{row.openUnits}</td>
                    <td className={`${TD} tabular-nums`}>
                      {row.cancelledUnits} / {row.returnedUnits}
                    </td>
                    <td className={`${TD} min-w-[140px]`}>
                      <p className="font-semibold tabular-nums text-slate-900">{rupees(row.revenue)}</p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className={`${TD} whitespace-nowrap text-xs text-slate-500`}>
                      {row.lastSoldAt ? new Date(row.lastSoldAt).toLocaleDateString('en-IN') : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400">
        Units, orders, and revenue count delivered orders. Open = confirmed, processing, or shipping orders not yet delivered.
      </p>
    </div>
  );
}
