import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import opsApi from '../../api/opsApi';
import { INPUT } from '../../utils/ui';

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useCentreOptions() {
  const [centres, setCentres] = useState([]);
  useEffect(() => {
    opsApi
      .list('vendors')
      .then((res) => setCentres(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCentres([]));
  }, []);
  return centres;
}

export function CentreFilter({ centres, value, counts = {}, onChange }) {
  const known = new Set(centres.map((c) => c.id));
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} lg:w-72`}>
      <option value="">All collection centres</option>
      {centres.map((c) => (
        <option key={c.id} value={c.id}>
          {c.vendorName || c.businessName || c.ownerName} ({counts[c.id] || 0})
        </option>
      ))}
      {value && !known.has(value) ? <option value={value}>{value}</option> : null}
    </select>
  );
}

export function CentreCell({ row }) {
  if (!row.vendorId) return <span className="text-slate-400">Not assigned</span>;
  if (!row.vendorName) {
    return <span className="text-slate-400" title="This collection centre no longer exists">{row.vendorId}</span>;
  }
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <Link to={`/multi-vendor/${row.vendorId}`} className="font-medium text-emerald-700 hover:underline">
        {row.vendorName}
      </Link>
      {row.centreId ? <span className="block text-xs text-slate-400">{row.centreId}</span> : null}
    </span>
  );
}

export function displayStatus(status) {
  const s = String(status || '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}
