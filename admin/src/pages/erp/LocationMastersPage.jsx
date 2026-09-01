import { useEffect, useState } from 'react';
import erpApi from '../../api/erpApi';

export default function LocationMastersPage() {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villages, setVillages] = useState([]);

  useEffect(() => {
    Promise.all([
      erpApi.list('states', { limit: 100 }),
      erpApi.list('districts', { limit: 100 }),
      erpApi.list('talukas', { limit: 100 }),
      erpApi.list('villages', { limit: 200 }),
    ]).then(([s, d, t, v]) => {
      setStates(s.data.items || []);
      setDistricts(d.data.items || []);
      setTalukas(t.data.items || []);
      setVillages(v.data.items || []);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Location Master</p>
        <h1 className="font-display text-2xl font-bold">STATE → DISTRICT → TALUKA → VILLAGE</h1>
        <p className="text-sm text-slate-500">PDF codes: ST-MH, DST-NK, TLK-SIN, VIL-SIN-0001</p>
      </div>
      {[
        ['States', states, 'stateId', 'stateName'],
        ['Districts', districts, 'districtId', 'districtName'],
        ['Talukas', talukas, 'talukaId', 'talukaName'],
        ['Villages', villages, 'villageId', 'villageName'],
      ].map(([title, rows, id, name]) => (
        <section key={title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">{title}</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <div key={row[id]} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-mono text-xs text-emerald-700">{row[id]}</span>
                <span>{row[name]}</span>
              </div>
            ))}
            {!rows.length && <p className="px-4 py-6 text-sm text-slate-400">No records</p>}
          </div>
        </section>
      ))}
    </div>
  );
}
