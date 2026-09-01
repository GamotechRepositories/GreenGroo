import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import opsApi from '../../api/opsApi';

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    opsApi.list('reports')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  const kpis = data?.kpis || {};
  const topProducts = (data?.topProducts || []).map((row) => ({
    name: String(row._id || 'Product').slice(0, 18),
    sales: row.sales || 0,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-500">Sales, delivery, and catalog performance.</p>
        </div>
      </div>
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Sales', `₹${Number(kpis.sales || 0).toLocaleString('en-IN')}`],
          ['Orders', kpis.orders || 0],
          ['Products', kpis.products || 0],
          ['Delivered', kpis.delivered || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase text-slate-400">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-bold">Top products</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="sales" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Recent order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentOrders || []).map((order) => (
              <tr key={order._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{order.orderNumber || String(order._id).slice(-6)}</td>
                <td className="px-4 py-3">{order.status}</td>
                <td className="px-4 py-3">₹{Number(order.total || 0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
