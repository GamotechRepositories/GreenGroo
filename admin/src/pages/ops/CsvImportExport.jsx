import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';

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
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Catalog</p>
          <h1 className={PAGE_TITLE}>CSV Import & Export</h1>
          <p className={PAGE_SUB}>
            Columns: sku, name, brandName, categories, subcategory, price, discountedPrice, stock,
            isActive
          </p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <FileSpreadsheet className="h-5 w-5" />
        </span>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className={`${PANEL} space-y-4 p-4`}>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} disabled={busy} className={BTN_PRIMARY}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
            Export CSV
          </button>
          <label className={`${BTN} cursor-pointer`}>
            <Upload className="mr-1.5 h-4 w-4" />
            Upload file
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>
          <button
            type="button"
            onClick={importCsv}
            disabled={!csv.trim() || busy}
            className={BTN_PRIMARY}
          >
            Import CSV
          </button>
        </div>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={14}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
          placeholder="sku,name,brandName,categories,subcategory,price,discountedPrice,stock,isActive"
        />
      </div>

      {result?.stats ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Imported {result.stats.total} rows · created {result.stats.created} · updated{' '}
          {result.stats.updated} · failed {result.stats.failed}
        </div>
      ) : null}
    </div>
  );
}
