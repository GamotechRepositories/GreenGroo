import React, { useState } from 'react';
import { ArrowUpDown, Download, Loader2, Upload } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';

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
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Catalog</p>
          <h1 className={PAGE_TITLE}>Bulk Import / Export</h1>
          <p className={PAGE_SUB}>
            Import or export the product catalog as JSON. Matching is done by SKU.
          </p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <ArrowUpDown className="h-5 w-5" />
        </span>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className={`${PANEL} space-y-4 p-4`}>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportJson} disabled={busy} className={BTN_PRIMARY}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
            Export JSON
          </button>
          <button type="button" onClick={importJson} disabled={busy} className={BTN}>
            <Upload className="mr-1.5 h-4 w-4" />
            Import JSON
          </button>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={16}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
        />
      </div>

      {result?.stats ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Processed {result.stats.total} · created {result.stats.created} · updated{' '}
          {result.stats.updated} · failed {result.stats.failed}
        </div>
      ) : null}
    </div>
  );
}
