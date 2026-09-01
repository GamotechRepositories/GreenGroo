import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import opsApi from '../../api/opsApi';

export default function CsvImportExport() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const exportCsv = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await opsApi.list('csv/products');
      setCsv(res.data?.csv || '');
      const blob = new Blob([res.data.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'greengrocc-products.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await opsApi.create('csv/products', { csv });
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">CSV Import & Export</h1>
          <p className="text-sm text-slate-500">
            Columns: sku, name, brandName, categories, subcategory, price, discountedPrice, stock, isActive
          </p>
        </div>
      </div>
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
          <Upload className="h-4 w-4" /> Upload file
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </label>
        <button type="button" onClick={importCsv} disabled={!csv.trim() || busy} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
          Import CSV
        </button>
      </div>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={14}
        className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
        placeholder="sku,name,brandName,categories,subcategory,price,discountedPrice,stock,isActive"
      />
      {result?.stats ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Imported {result.stats.total} rows · created {result.stats.created} · updated {result.stats.updated} · failed {result.stats.failed}
        </div>
      ) : null}
    </div>
  );
}
