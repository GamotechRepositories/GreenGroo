import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Warehouse } from 'lucide-react';
import { INPUT, PANEL } from '../../utils/ui';
import { CommissionPill, formatDate, formatMoney } from './multiVendorShared';

const COMMISSION_FILTERS = ['all', 'Unpaid', 'Partially paid', 'Paid', 'No sales'];

const SUMMARY_CARDS = [
  { key: 'sales', label: 'Vendor sales (delivered)', tone: 'text-[#1F2937]' },
  { key: 'commission', label: 'Total commission', tone: 'text-[#1F2937]' },
  { key: 'commissionPaid', label: 'Commission paid', tone: 'text-emerald-700' },
  { key: 'commissionUnpaid', label: 'Commission unpaid', tone: 'text-rose-700' },
];

export default function VendorCommissionTab({ rows, stats, loading, onRecordPayment }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => {
    const next = { all: rows.length };
    rows.forEach((row) => {
      const key = row.commission?.status || 'No sales';
      next[key] = (next[key] || 0) + 1;
    });
    return next;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) => filter === 'all' || (row.commission?.status || 'No sales') === filter)
      .filter(
        (row) =>
          !q ||
          [row.vendorName, row.businessName, row.ownerName, row.mobile, row.city, row.vendorCode, row.collectionCentre?.id]
            .some((value) => String(value || '').toLowerCase().includes(q))
      )
      .sort((a, b) => (b.commission?.unpaid || 0) - (a.commission?.unpaid || 0) || (b.commission?.sales || 0) - (a.commission?.sales || 0));
  }, [rows, search, filter]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SUMMARY_CARDS.map(({ key, label, tone }) => (
          <div key={key} className={`${PANEL} px-4 py-3`}>
            <p className="text-xs text-[#6B7280]">{label}</p>
            <p className={`mt-1 text-lg font-bold ${tone}`}>{formatMoney(stats?.[key])}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Commission = vendor's commission % × product value of delivered orders from that vendor's dark stores.
      </p>

      <div className={`${PANEL} flex flex-col gap-2 p-3 sm:flex-row sm:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search centre name, owner, mobile, city or ID..."
            className={`${INPUT} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {COMMISSION_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
                filter === item ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item} ({counts[item] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className={`overflow-hidden ${PANEL}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">No vendors match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Collection centre</th>
                  <th className="px-4 py-3 text-right font-semibold">Dark stores</th>
                  <th className="px-4 py-3 text-right font-semibold">Delivered orders</th>
                  <th className="px-4 py-3 text-right font-semibold">Sales</th>
                  <th className="px-4 py-3 text-right font-semibold">Rate</th>
                  <th className="px-4 py-3 text-right font-semibold">Commission</th>
                  <th className="px-4 py-3 text-right font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right font-semibold">Unpaid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last payment</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const c = row.commission || {};
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Warehouse className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                          <div>
                            <p className="font-semibold text-slate-900">{row.vendorName || row.businessName || row.ownerName}</p>
                            <p className="text-[11px] text-slate-500">{row.collectionCentre?.id || row.vendorCode || row.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{(row.darkStores || []).length}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{c.deliveredOrders || 0}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatMoney(c.sales)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{c.rate ?? row.commissionRate ?? 10}%</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatMoney(c.amount)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700">{formatMoney(c.paid)}</td>
                      <td className={`px-4 py-3 text-right ${c.unpaid > 0 ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
                        {formatMoney(c.unpaid)}
                      </td>
                      <td className="px-4 py-3">
                        <CommissionPill status={c.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {c.lastPaidAt ? formatDate(c.lastPaidAt) : '—'}
                        {c.payments ? <p className="text-[10px] text-slate-400">{c.payments} payment{c.payments === 1 ? '' : 's'}</p> : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onRecordPayment(row)}
                            className="whitespace-nowrap text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            Record payment
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/multi-vendor/${row.id}`)}
                            className="text-xs font-semibold text-slate-600 hover:underline"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
