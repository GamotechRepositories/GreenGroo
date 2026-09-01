import React, { useEffect, useState } from 'react';
import { Loader2, Truck } from 'lucide-react';
import opsApi from '../../api/opsApi';

export default function DeliveryManagement() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [orderRes, riderRes] = await Promise.all([
        opsApi.list('delivery/orders', status === 'all' ? {} : { status }),
        opsApi.list('delivery/riders'),
      ]);
      setOrders(orderRes.data || []);
      setRiders(riderRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const assign = async (orderId, riderId) => {
    if (!riderId) return;
    await opsApi.patch(`delivery/orders/${orderId}/assign`, { riderId });
    await load();
  };

  const updateStatus = async (orderId, nextStatus) => {
    await opsApi.patch(`delivery/orders/${orderId}/status`, { status: nextStatus });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Truck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Delivery Management</h1>
          <p className="text-sm text-slate-500">Assign riders and update dark-store order status.</p>
        </div>
      </div>
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}
      <div className="flex flex-wrap gap-1">
        {['all', 'order_received', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${status === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            {item.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assign rider</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    {order.customerName}
                    <div className="text-xs text-slate-400">{order.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3">{order.managerId?.storeName || order.area || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-xs"
                    >
                      {['order_received', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'].map((item) => (
                        <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={order.assignedRiderId?._id || ''}
                      onChange={(e) => assign(order._id, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-xs"
                    >
                      <option value="">Select rider</option>
                      {riders.map((rider) => (
                        <option key={rider._id} value={rider._id}>
                          {rider.name || rider.phone} ({rider.status})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
