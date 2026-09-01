import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Search, GitBranch } from 'lucide-react';
import erpApi from '../../api/erpApi';

const CHAIN = [
  ['farmer', 'Farmer'],
  ['farm', 'Farm'],
  ['crop', 'Crop'],
  ['article', 'Article'],
  ['batch', 'Batch'],
  ['crate', 'Crate'],
  ['qr', 'QR'],
  ['quality', 'Quality'],
  ['collectionCentre', 'Collection Centre'],
  ['warehouse', 'Warehouse'],
  ['inventory', 'Inventory'],
  ['packaging', 'Packaging'],
  ['dispatch', 'Dispatch'],
  ['order', 'Order'],
  ['customer', 'Customer'],
  ['invoice', 'Invoice'],
  ['payment', 'Payment'],
];

function pickId(node, fallbackKeys = []) {
  if (!node) return '';
  if (Array.isArray(node)) return pickId(node[0], fallbackKeys);
  for (const key of fallbackKeys) {
    if (node[key]) return node[key];
  }
  return node.id || '';
}

function first(value) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

export default function TraceabilityPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') || '';
  const [query, setQuery] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async (value) => {
    const q = String(value || '').trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await erpApi.search(q);
      setResult(res.data);
      setParams({ q });
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const graph = result?.graph || {};
  const current = result?.current || {};

  const nodes = useMemo(() => {
    return CHAIN.map(([key, label]) => {
      const data = first(graph[key] || graph[`${key}s`]);
      return { key, label, data, id: pickId(data, [`${key}Id`, 'farmerId', 'orderId', 'qrId']) };
    }).filter((n) => n.data);
  }, [graph]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Traceability engine</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-900 dark:text-white">One ID → complete history</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="GGC-FR-MH-NK-SIN-00001  ·  GGC-BAT-20260830-00001  ·  GGC-QR-00001"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button type="submit" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Resolving chain
        </div>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {result && !result.found && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          No ERP record found for <span className="font-mono text-slate-800 dark:text-slate-200">{result.id}</span>
        </div>
      )}

      {result?.found && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Entity', result.entity],
              ['Status', current.status || '—'],
              ['Location', [current.locationType, current.locationId].filter(Boolean).join(' ') || '—'],
              ['Grade / Qty', `${current.grade || '—'} · ${current.quantity || 0}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 truncate font-semibold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-w-max items-center gap-2">
              {nodes.map((node, idx) => (
                <div key={node.key} className="flex items-center gap-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40">
                    <p className="text-[10px] font-semibold uppercase text-emerald-700">{node.label}</p>
                    <p className="font-mono text-xs text-slate-800 dark:text-slate-100">{node.id || '—'}</p>
                  </div>
                  {idx < nodes.length - 1 && <span className="text-slate-300">→</span>}
                </div>
              ))}
            </div>
          </div>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              <GitBranch className="h-4 w-4" /> Timeline
            </h2>
            <ol className="space-y-3">
              {(result.timeline || []).map((event, idx) => (
                <li key={`${event.title}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{event.title}</p>
                    <p className="text-xs text-slate-400">{event.at ? new Date(event.at).toLocaleString() : ''}</p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-emerald-700">{event.id}</p>
                  {event.status && <p className="mt-1 text-xs text-slate-500">Status: {event.status}</p>}
                </li>
              ))}
            </ol>
          </section>

          {(result.audits || []).length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Audit history</h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-2">Audit ID</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.audits.map((row) => (
                      <tr key={row.auditId} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 font-mono text-xs">{row.auditId}</td>
                        <td className="px-3 py-2">{row.action}</td>
                        <td className="px-3 py-2">{row.fieldChanged || '—'}</td>
                        <td className="px-3 py-2">{row.changedBy || row.userId || '—'}</td>
                        <td className="px-3 py-2 text-xs">{row.dateTime ? new Date(row.dateTime).toLocaleString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {graph.farmer && (
            <Link
              to={`/erp/farmers/${encodeURIComponent(graph.farmer.farmerId || graph.farmer.id)}`}
              className="inline-flex text-sm font-semibold text-emerald-700 hover:underline"
            >
              Open farmer 360 →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
