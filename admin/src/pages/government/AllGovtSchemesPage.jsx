import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  closing_soon: 'bg-amber-50 text-amber-800 ring-amber-100',
  upcoming: 'bg-violet-50 text-violet-800 ring-violet-100',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function AllGovtSchemesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await opsApi.list('govt-schemes', status !== 'all' ? { status } : {});
      setRows(Array.isArray(res.data) ? res.data : []);
      setStats(res.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load government schemes');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.title, row.shortName, row.category, row.govtLevel, row.description]
        .some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this government scheme?')) return;
    try {
      await opsApi.remove('govt-schemes', id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete scheme');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={PAGE_KICKER}>Government</p>
          <h1 className={PAGE_TITLE}>All Govt Schemes</h1>
          <p className={PAGE_SUB}>Browse, edit, and manage agricultural government schemes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={load} className={BTN}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </button>
          <Link to="/government/schemes/create" className={BTN_PRIMARY}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Govt Scheme
          </Link>
        </div>
      </div>

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Closing soon', value: stats.closingSoon },
            { label: 'Upcoming', value: stats.upcoming },
          ].map((item) => (
            <div key={item.label} className={`${PANEL} px-4 py-3`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{item.value ?? 0}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`${PANEL} p-4`}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schemes..."
              className={`${INPUT} pl-9`}
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${INPUT} w-auto min-w-[160px]`}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="closing_soon">Closing soon</option>
            <option value="upcoming">Upcoming</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {error ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading schemes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Landmark className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No government schemes yet.</p>
            <Link to="/government/schemes/create" className={BTN_PRIMARY}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create first scheme
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className={TH}>Scheme</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Level</th>
                  <th className={TH}>Benefit</th>
                  <th className={TH}>Deadline</th>
                  <th className={TH}>Status</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-3">
                      <div className="min-w-[200px]">
                        <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                        <p className="text-xs text-slate-500">{row.shortName || '—'}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">{row.category || '—'}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">{row.govtLevel || '—'}</td>
                    <td className="px-3 py-3 text-sm font-medium text-emerald-800">
                      {row.maxBenefit || row.subsidyAmount || '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">{row.deadline || '—'}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                          STATUS_STYLES[row.status] || STATUS_STYLES.closed
                        }`}
                      >
                        {row.statusLabel || row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/government/schemes/${row._id}/edit`)}
                          className={BTN}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row._id)}
                          className={`${BTN} text-rose-700 hover:bg-rose-50`}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
