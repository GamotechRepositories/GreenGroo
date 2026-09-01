import React, { useEffect, useState } from 'react';
import { Loader2, MapPinned } from 'lucide-react';
import opsApi from '../../api/opsApi';

export default function DeliveryTracking() {
  const [riders, setRiders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await opsApi.list('tracking');
      setRiders(res.data || []);
      setStats(res.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tracking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <MapPinned className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Delivery Tracking</h1>
          <p className="text-sm text-slate-500">Live rider status and last known GPS location. Refreshes every 15 seconds.</p>
        </div>
      </div>
      {stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-semibold uppercase text-slate-400">{key}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {riders.map((rider) => {
            const lat = rider.currentLocation?.lat;
            const lng = rider.currentLocation?.lng;
            const maps = Number.isFinite(lat) && Number.isFinite(lng) ? `https://www.google.com/maps?q=${lat},${lng}` : '';
            return (
              <article key={rider._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{rider.name || rider.phone}</p>
                    <p className="text-xs text-slate-500">{[rider.area, rider.city].filter(Boolean).join(', ') || 'No area'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase">{rider.status}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {maps ? `Last ping: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'No live location yet'}
                </p>
                {maps ? (
                  <a href={maps} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-emerald-700">
                    Open map
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
