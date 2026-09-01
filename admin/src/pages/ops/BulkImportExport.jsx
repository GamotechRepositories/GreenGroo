import React, { useState } from 'react';
import { ArrowUpDown, Download, Loader2 } from 'lucide-react';
import opsApi from '../../api/opsApi';

export default function BulkImportExport() {
  const [jsonText, setJsonText] = useState('[]');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const exportJson = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await opsApi.list('bulk/products');
      const payload = JSON.stringify(res.data || [], null, 2);
      setJsonText(payload);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'greengrocc-products.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const importJson = async () => {
    setBusy(true);
    setError('');
    try {
      const products = JSON.parse(jsonText);
      const res = await opsApi.create('bulk/products', { products });
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <ArrowUpDown className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Bulk Import / Export</h1>
          <p className="text-sm text-slate-500">Import or export the product catalog as JSON. Matching is done by SKU.</p>
        </div>
      </div>
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}
      <div className="flex gap-2">
        <button type="button" onClick={exportJson} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export JSON
        </button>
        <button type="button" onClick={importJson} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white">
          Import JSON
        </button>
      </div>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={16}
        className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
      />
      {result?.stats ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Processed {result.stats.total} · created {result.stats.created} · updated {result.stats.updated} · failed {result.stats.failed}
        </div>
      ) : null}
    </div>
  );
}
