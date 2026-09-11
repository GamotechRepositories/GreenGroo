import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GitBranch, Loader2, Search } from 'lucide-react';
import erpApi from '../../api/erpApi';
import { BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';

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

function when(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-IN');
  } catch {
    return String(value);
  }
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
      return {
        key,
        label,
        data,
        id: pickId(data, [`${key}Id`, 'farmerId', 'orderId', 'qrId']),
      };
    }).filter((n) => n.data);
  }, [graph]);

  return (
    <div className="space-y-5 pb-10">
      <div>
        <p className={PAGE_KICKER}>ERP</p>
        <h1 className={PAGE_TITLE}>Traceability</h1>
        <p className={PAGE_SUB}>Search one ID to see the full farm-to-customer chain</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className={`${PANEL} flex flex-col gap-3 p-4 sm:flex-row sm:items-center`}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="GGC-FR-… · GGC-BAT-… · GGC-QR-…"
            className={`${INPUT} pl-9`}
          />
        </div>
        <button type="submit" disabled={loading || !query.trim()} className={BTN_PRIMARY}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}
          Search
        </button>
      </form>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result && !result.found ? (
        <div className={`${PANEL} px-6 py-12 text-center`}>
          <p className="text-sm text-slate-500">
            No ERP record found for{' '}
            <span className="font-mono font-semibold text-slate-800">{result.id}</span>
          </p>
        </div>
      ) : null}

      {result?.found ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Entity', result.entity],
              ['Status', current.status || '—'],
              [
                'Location',
                [current.locationType, current.locationId].filter(Boolean).join(' ') || '—',
              ],
              ['Grade / Qty', `${current.grade || '—'} · ${current.quantity || 0}`],
            ].map(([label, value]) => (
              <div key={label} className={`${PANEL} p-4`}>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className={`${PANEL} overflow-x-auto p-4`}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Chain
            </p>
            <div className="flex min-w-max items-center gap-2">
              {nodes.map((node, idx) => (
                <div key={node.key} className="flex items-center gap-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      {node.label}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-800">{node.id || '—'}</p>
                  </div>
                  {idx < nodes.length - 1 ? (
                    <span className="text-slate-300" aria-hidden>
                      →
                    </span>
                  ) : null}
                </div>
              ))}
              {!nodes.length ? (
                <p className="text-sm text-slate-400">No chain nodes for this record</p>
              ) : null}
            </div>
          </div>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <GitBranch className="h-4 w-4 text-emerald-700" />
              Timeline
            </h2>
            {!result.timeline?.length ? (
              <div className={`${PANEL} px-4 py-8 text-center text-sm text-slate-400`}>
                No timeline events
              </div>
            ) : (
              <ol className="space-y-3">
                {(result.timeline || []).map((event, idx) => (
                  <li key={`${event.title}-${idx}`} className={`${PANEL} p-4`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-400">{when(event.at)}</p>
                    </div>
                    {event.id ? (
                      <p className="mt-1 font-mono text-xs text-emerald-700">{event.id}</p>
                    ) : null}
                    {event.status ? (
                      <p className="mt-1 text-xs text-slate-500">Status: {event.status}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {(result.audits || []).length > 0 ? (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Audit history
              </h2>
              <div className={`${PANEL} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/80">
                      <tr>
                        {['Audit ID', 'Action', 'Field', 'User', 'When'].map((h) => (
                          <th key={h} className={TH}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.audits.map((row) => (
                        <tr
                          key={row.auditId}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-700">
                            {row.auditId}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">{row.action}</td>
                          <td className="px-3 py-2.5 text-slate-600">{row.fieldChanged || '—'}</td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {row.changedBy || row.userId || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{when(row.dateTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}

          {graph.farmer ? (
            <Link
              to={`/erp/farmers/${encodeURIComponent(graph.farmer.farmerId || graph.farmer.id)}`}
              className="inline-flex text-sm font-semibold text-emerald-700 hover:underline"
            >
              Open farmer 360 →
            </Link>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
