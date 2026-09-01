import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import erpApi from '../../api/erpApi';

export default function FarmersPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      erpApi
        .farmers({ q, page: 1, limit: 50 })
        .then((res) => setItems(res.data.items || []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Farmer Master</p>
          <h1 className="font-display text-2xl font-bold">Farmers</h1>
          <p className="text-xs text-slate-500">IDs follow GGC-FR-STATE-DISTRICT-TALUKA-SERIAL</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search farmer ID, name, mobile"
          className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/80">
              <tr>
                <th className="px-3 py-2">Farmer ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Village / Taluka / Dist</th>
                <th className="px-3 py-2">Mobile</th>
                <th className="px-3 py-2">KYC</th>
                <th className="px-3 py-2">Bank</th>
                <th className="px-3 py-2">Farms / Crops</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.farmerId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">
                    <Link to={`/erp/farmers/${encodeURIComponent(f.farmerId)}`} className="font-mono text-xs text-emerald-700 hover:underline">
                      {f.farmerId}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-medium">{f.fullName}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {f.village || '—'} / {f.taluka || '—'} / {f.district || '—'}
                  </td>
                  <td className="px-3 py-2">{f.mobile}</td>
                  <td className="px-3 py-2 text-xs">{f.kycStatus}</td>
                  <td className="px-3 py-2 text-xs">{f.bankStatus}</td>
                  <td className="px-3 py-2 text-xs">
                    {f.farmCount} / {f.cropCount}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                    No farmers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
