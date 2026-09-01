import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import erpApi from '../../api/erpApi';

export default function Farmer360Page() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    erpApi
      .farmer(id)
      .then((res) => alive && setData(res.data))
      .catch((err) => alive && setError(err.response?.data?.message || 'Farmer not found'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading farmer
      </div>
    );
  }
  if (error) return <p className="text-rose-600">{error}</p>;

  const farmer = data.farmer || {};
  const photos = farmer.farmPhotos || [];
  const videos = farmer.farmVideos || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:flex-row">
        <img
          src={farmer.profileImage || farmer.profilePhoto || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=300'}
          alt=""
          className="h-28 w-28 rounded-2xl object-cover"
        />
        <div className="flex-1">
          <p className="font-mono text-xs text-emerald-700">{farmer.farmerId}</p>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{farmer.fullName || farmer.name}</h1>
          <p className="text-sm text-slate-500">
            {farmer.village} · {farmer.taluka} · {farmer.district} · {farmer.mobile}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">KYC {farmer.kycStatus}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Bank {farmer.bankStatus}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{farmer.status}</span>
          </div>
        </div>
        <Link to={`/traceability?q=${encodeURIComponent(farmer.farmerId)}`} className="text-sm font-semibold text-emerald-700">
          Full chain →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Farms', data.farms?.length || 0],
          ['Crops', data.crops?.length || 0],
          ['Articles', data.articles?.length || 0],
          ['Production', data.production || 0],
          ['Payments', data.payments || 0],
          ['Batches', data.batches?.length || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Farms</h2>
        <div className="space-y-2">
          {(data.farms || []).map((farm) => (
            <div key={farm.farmId} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
              <p className="font-mono text-xs text-emerald-700">{farm.farmId}</p>
              <p>{farm.farmName || 'Farm'} · {farm.area} {farm.areaUnit} · {farm.soilType}</p>
            </div>
          ))}
          {!data.farms?.length && <p className="text-sm text-slate-400">No ERP farm records yet</p>}
        </div>
      </section>

      {(photos.length > 0 || videos.length > 0) && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Farm media</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {photos.map((url) => (
              <img key={url} src={url} alt="" className="h-28 w-full rounded-xl object-cover" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
