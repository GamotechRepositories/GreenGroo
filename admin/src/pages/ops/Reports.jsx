import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import opsApi from '../../api/opsApi';
import { PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    opsApi
      .list('reports')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const topProducts = (data?.topProducts || []).map((row) => ({
    name: String(row._id || 'Product').slice(0, 18),
    sales: row.sales || 0,
  }));

  return (
    <div className="space-y-5 pb-10">
      <div>
        <p className={PAGE_KICKER}>Operations</p>
        <h1 className={PAGE_TITLE}>Reports</h1>
        <p className={PAGE_SUB}>Sales, delivery, and catalog performance</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Sales', `₹${Number(kpis.sales || 0).toLocaleString('en-IN')}`],
          ['Orders', kpis.orders || 0],
          ['Products', kpis.products || 0],
          ['Delivered', kpis.delivered || 0],
        ].map(([label, value]) => (
          <div key={label} className={`${PANEL} px-4 py-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className={`${PANEL} p-4`}>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
            <BarChart3 className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-slate-900">Top products</h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" fontSize={11} stroke="#94A3B8" />
              <YAxis fontSize={11} stroke="#94A3B8" />
              <Tooltip />
              <Bar dataKey="sales" fill="#047857" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${PANEL} overflow-hidden`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              {['Recent order', 'Status', 'Total'].map((h) => (
                <th key={h} className={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.recentOrders || []).map((order) => (
              <tr key={order._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                <td className="px-3 py-2.5 font-semibold text-slate-900">
                  {order.orderNumber || String(order._id).slice(-6)}
                </td>
                <td className="px-3 py-2.5 capitalize text-slate-600">
                  {String(order.status || '—').replaceAll('_', ' ')}
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-800">
                  ₹{Number(order.total || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
            {!data?.recentOrders?.length ? (
              <tr>
                <td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-400">
                  No recent orders
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
