import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  RefreshCw,
  Store,
  MapPin,
  Calendar,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { vendorApi } from '../../api/vendorApi';

export default function VendorMarketPricesPage() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('ALL');
  const [selectedTrend, setSelectedTrend] = useState('ALL');

  // Calculator widget state
  const [calcMandiRate, setCalcMandiRate] = useState(2500); // per quintal
  const [calcMargin, setCalcMargin] = useState(15); // % margin
  const [calcWastage, setCalcWastage] = useState(5); // % grading/transit loss

  const loadPrices = async () => {
    setLoading(true);
    setError('');
    try {
      // First try live prices
      const liveRes = await vendorApi.getLiveMarketPrices();
      const rawList = Array.isArray(liveRes?.data) ? liveRes.data : Array.isArray(liveRes) ? liveRes : [];
      if (rawList.length > 0) {
        setPrices(rawList);
      } else {
        // Fallback to standard market prices
        const res = await vendorApi.getMarketPrices();
        const fallbackList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setPrices(fallbackList);
      }
    } catch (err) {
      console.error(err);
      setError('Could not fetch market mandi prices. Showing cached or standard rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const markets = useMemo(() => {
    const set = new Set();
    prices.forEach((p) => {
      if (p.marketName) set.add(p.marketName);
    });
    return Array.from(set).sort();
  }, [prices]);

  const filteredPrices = useMemo(() => {
    return prices.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (p.productName || p.cropName || '').toLowerCase().includes(q) ||
        (p.variety || '').toLowerCase().includes(q) ||
        (p.marketName || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q);

      const matchesMarket = selectedMarket === 'ALL' || p.marketName === selectedMarket;

      const matchesTrend =
        selectedTrend === 'ALL' ||
        (selectedTrend === 'rising' && (p.priceTrend === 'rising' || p.trend === 'rising')) ||
        (selectedTrend === 'falling' && (p.priceTrend === 'falling' || p.trend === 'falling')) ||
        (selectedTrend === 'stable' && (p.priceTrend === 'stable' || p.trend === 'stable'));

      return matchesSearch && matchesMarket && matchesTrend;
    });
  }, [prices, search, selectedMarket, selectedTrend]);

  // Stats
  const stats = useMemo(() => {
    if (!prices.length) return { avg: 0, high: 0, low: 0, total: 0 };
    const rates = prices.map((p) => Number(p.modalPrice || p.price || 0)).filter((r) => r > 0);
    if (!rates.length) return { avg: 0, high: 0, low: 0, total: prices.length };
    const high = Math.max(...rates);
    const low = Math.min(...rates);
    const avg = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    return { avg, high, low, total: prices.length };
  }, [prices]);

  // Derived margin calculator values
  const costPerKg = (calcMandiRate / 100) * (1 + calcWastage / 100);
  const targetSellPrice = costPerKg * (1 + calcMargin / 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>APMC Live Mandi Rate Intelligence</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Market Prices & APMC Mandi Rates
            </h1>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Daily wholesale APMC rates, fair modal pricing, and commodity price trends across Maharashtra and regional mandis to assist your procurement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadPrices}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Rates</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-emerald-600/50 pt-5">
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <p className="text-xs font-medium text-emerald-200">Tracked Commodities</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.total} listings</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <p className="text-xs font-medium text-emerald-200">Average Modal Rate</p>
            <p className="text-xl font-bold text-white mt-0.5">₹{stats.avg} <span className="text-xs font-normal text-emerald-200">/ Qtl</span></p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <p className="text-xs font-medium text-emerald-200">Highest Rate Today</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">₹{stats.high} <span className="text-xs font-normal text-emerald-200">/ Qtl</span></p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <p className="text-xs font-medium text-emerald-200">Active Mandis</p>
            <p className="text-xl font-bold text-white mt-0.5">{markets.length} Mandis</p>
          </div>
        </div>
      </div>

      {/* Real-time Pricing Calculator Widget */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
          <Calculator className="h-4 w-4 text-emerald-600" />
          <span>Vendor Procurement & Margin Estimator</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Quickly convert mandi auction rates (per Quintal = 100 kg) to landing cost and retail price per kg.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mandi Rate (₹ / Quintal)</label>
            <input
              type="number"
              value={calcMandiRate}
              onChange={(e) => setCalcMandiRate(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Grading & Transit Loss (%)</label>
            <input
              type="number"
              value={calcWastage}
              onChange={(e) => setCalcWastage(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Margin (%)</label>
            <input
              type="number"
              value={calcMargin}
              onChange={(e) => setCalcMargin(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5">
            <div className="text-[11px] font-medium text-emerald-800">Effective Cost: <span className="font-bold">₹{costPerKg.toFixed(1)}/kg</span></div>
            <div className="text-sm font-extrabold text-emerald-900 mt-0.5">Selling Target: <span className="text-emerald-700">₹{targetSellPrice.toFixed(1)}/kg</span></div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search crop, variety, or mandi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none shadow-2xs"
          >
            <option value="ALL">All APMC Mandis ({markets.length})</option>
            {markets.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={selectedTrend}
            onChange={(e) => setSelectedTrend(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Price Trends</option>
            <option value="rising">Rising (Bullish)</option>
            <option value="stable">Stable</option>
            <option value="falling">Falling (Bearish)</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-xs font-medium text-amber-800 border border-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Rates Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Commodity & Variety</th>
                <th className="px-4 py-3.5">Mandi / Market</th>
                <th className="px-4 py-3.5">Min Rate</th>
                <th className="px-4 py-3.5">Modal (Fair) Rate</th>
                <th className="px-4 py-3.5">Max Rate</th>
                <th className="px-4 py-3.5">Per Kg Equivalent</th>
                <th className="px-4 py-3.5">Trend</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPrices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                        <span>Fetching live mandi rates...</span>
                      </div>
                    ) : (
                      'No market price records found matching your filters.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredPrices.map((item, idx) => {
                  const modalVal = Number(item.modalPrice || item.price || 0);
                  const minVal = Number(item.minPrice || (modalVal * 0.9) || 0);
                  const maxVal = Number(item.maxPrice || (modalVal * 1.1) || 0);
                  const perKg = modalVal > 0 ? (modalVal / 100).toFixed(1) : '—';
                  const trend = item.priceTrend || item.trend || 'stable';

                  return (
                    <tr key={item._id || item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{item.productName || item.cropName || 'Commodity'}</div>
                        <div className="text-[11px] text-slate-500">{item.variety || 'Standard Grade'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{item.marketName || 'Regional Mandi'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 pl-5">
                          {[item.district, item.state].filter(Boolean).join(', ') || 'Maharashtra'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-600">
                        ₹{minVal.toLocaleString()}
                        <span className="text-[10px] text-slate-400 font-normal"> /Qtl</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-100">
                          ₹{modalVal.toLocaleString()} /Qtl
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-600">
                        ₹{maxVal.toLocaleString()}
                        <span className="text-[10px] text-slate-400 font-normal"> /Qtl</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900">₹{perKg}</span>
                        <span className="text-[10px] text-slate-400 font-normal"> /kg</span>
                      </td>

                      <td className="px-4 py-3.5">
                        {trend === 'rising' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                            Rising
                          </span>
                        ) : trend === 'falling' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            <TrendingDown className="h-3 w-3 text-rose-600" />
                            Falling
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            <Minus className="h-3 w-3 text-slate-500" />
                            Stable
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setCalcMandiRate(modalVal)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                          title="Load into margin calculator"
                        >
                          <Calculator className="h-3 w-3 text-emerald-600" />
                          Simulate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
