import React, { useEffect, useState } from 'react';
import { Headset, Loader2 } from 'lucide-react';
import opsApi from '../../api/opsApi';

export default function StoreSupport() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await opsApi.list('support', status === 'all' ? {} : { status });
      setTickets(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const update = async (id, nextStatus) => {
    await opsApi.patch(`support/${id}`, { status: nextStatus });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Headset className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Store Support</h1>
          <p className="text-sm text-slate-500">Customer and store tickets from the support inbox.</p>
        </div>
      </div>
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}
      <div className="flex gap-1">
        {['all', 'open', 'resolved'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${status === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">No tickets yet.</div>
        ) : (
          tickets.map((ticket) => (
            <article key={ticket._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{ticket.name} · {ticket.issueType?.replaceAll('_', ' ')}</p>
                  <p className="text-xs text-slate-500">{ticket.email} {ticket.phone ? `· ${ticket.phone}` : ''}</p>
                </div>
                <select
                  value={ticket.status}
                  onChange={(e) => update(ticket._id, e.target.value)}
                  className="rounded-lg border px-2 py-1 text-xs font-semibold"
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{ticket.message}</p>
              {ticket.orderId ? <p className="mt-1 text-xs text-slate-400">Order: {ticket.orderId}</p> : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
