import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import erpApi from '../../api/erpApi';
import { INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';

function Badge({ children }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {children || '—'}
    </span>
  );
}

export default function FarmersPage() {
  const [items, setItems] = useState([]);
  const [managers, setManagers] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setError('');
      erpApi
        .farmers({ q, page: 1, limit: 100 })
        .then((res) => {
          setItems(res.data.items || []);
          setTotal(res.data.total || 0);
        })
        .catch((err) => setError(err.response?.data?.message || 'Failed to load farmers'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    erpApi
      .farmerManagers()
      .then((res) => setManagers(res.data.items || []))
      .catch(() => setManagers([]));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Farmer Master</p>
          <h1 className={PAGE_TITLE}>Farmers</h1>
          <p className={PAGE_SUB}>{total} farmers from the farmer and farmer-manager apps</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ID, name, mobile, village"
          className={`${INPUT} max-w-sm`}
        />
      </div>
      {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

      <div className={PANEL}>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Farmer ID', 'Name', 'Location', 'Mobile', 'Manager', 'KYC / Bank', 'Crops / Products / Orders'].map((h) => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.farmerId || f.sourceId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <Link to={`/erp/farmers/${encodeURIComponent(f.farmerId)}`} className="font-mono text-xs text-[#217346] hover:underline">
                      {f.farmerId}
                    </Link>
                    {f.farmerCode && f.farmerCode !== f.farmerId ? (
                      <p className="text-[11px] text-slate-400">{f.farmerCode}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{f.fullName}</p>
                    <p className="text-[11px] text-slate-400">{f.farmName || '—'}</p>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {[f.village, f.taluka, f.district].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-3 py-2">{f.mobile || '—'}</td>
                  <td className="px-3 py-2 text-xs">{f.managerName || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge>{f.kycStatus}</Badge>
                      <Badge>{f.bankStatus}</Badge>
                      <Badge>{f.status}</Badge>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {f.cropCount || 0} / {f.productCount || 0} / {f.orderCount || 0}
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
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Farmer managers</h2>
        <div className={`${PANEL} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Manager ID', 'Name', 'Mobile', 'Location', 'Status', 'Farmers'].map((h) => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{m.id}</td>
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2">{m.mobile}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{m.location || '—'}</td>
                  <td className="px-3 py-2"><Badge>{m.status}</Badge></td>
                  <td className="px-3 py-2 text-xs">
                    {m.farmerCount} total · {m.activeFarmers} active
                  </td>
                </tr>
              ))}
              {!managers.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                    No farmer managers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
