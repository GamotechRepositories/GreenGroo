import React, { useEffect, useState } from 'react';
import { Boxes, Loader2, Plus, Trash2 } from 'lucide-react';
import opsApi from '../../api/opsApi';

export default function BulkSelling() {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: 'Buy 10+ wholesale',
    productId: '',
    minQuantity: 10,
    discountPercent: 5,
    enabled: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [dealRes, productRes] = await Promise.all([
        opsApi.list('bulk-selling'),
        opsApi.list('products/lite'),
      ]);
      setDeals(dealRes.data || []);
      setProducts(productRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bulk deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await opsApi.create('bulk-selling', form);
      setForm((prev) => ({ ...prev, name: 'Buy 10+ wholesale', productId: '' }));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save deal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Boxes className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Bulk Selling</h1>
          <p className="text-sm text-slate-500">Wholesale slabs applied directly to product pricing.</p>
        </div>
      </div>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}

      <form onSubmit={handleCreate} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          placeholder="Deal name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <select
          required
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          value={form.productId}
          onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name} {product.sku ? `(${product.sku})` : ''}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          value={form.minQuantity}
          onChange={(e) => setForm((prev) => ({ ...prev, minQuantity: Number(e.target.value) }))}
        />
        <input
          type="number"
          min="0"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          value={form.discountPercent}
          onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: Number(e.target.value) }))}
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Apply deal
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex justify-center py-12 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Deal</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Min qty</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold">{deal.name}</td>
                  <td className="px-4 py-3">{deal.productName || deal.sku}</td>
                  <td className="px-4 py-3">{deal.minQuantity}</td>
                  <td className="px-4 py-3">{deal.discountPercent}%</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => opsApi.remove('bulk-selling', deal._id).then(load)}>
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
                    </button>
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
