import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Table,
  FileText
} from 'lucide-react';
import { vendorApi } from '../../api/vendorApi';

const SAMPLE_CSV = `sku,name,brandName,categories,subcategory,price,discountedPrice,stock,unit,isActive
VND-TOM-01,Fresh Hybrid Tomato,GreenGrocc Fresh,Vegetables,Tomatoes,40,35,500,kg,true
VND-ONI-01,Nashik Red Onion,GreenGrocc Fresh,Vegetables,Onions,30,28,1200,kg,true
VND-POT-01,Jyoti Premium Potato,GreenGrocc Fresh,Vegetables,Potatoes,35,32,800,kg,true
VND-CHI-01,G4 Fresh Green Chilli,GreenGrocc Fresh,Vegetables,Chillies,60,55,150,kg,true`;

export default function VendorCsvImportExportPage() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewRows, setPreviewRows] = useState([]);

  const parseCsvPreview = (text) => {
    if (!text) {
      setPreviewRows([]);
      return;
    }
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length <= 1) {
      setPreviewRows([]);
      return;
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1, 6).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || '';
      });
      return obj;
    });
    setPreviewRows(rows);
  };

  const handleCsvChange = (val) => {
    setCsv(val);
    parseCsvPreview(val);
  };

  const exportCsv = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await vendorApi.exportProductsCsv();
      const csvData = res?.data?.csv || res?.csv || res;
      if (typeof csvData === 'string') {
        setCsv(csvData);
        parseCsvPreview(csvData);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vendor-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Export returned empty or unexpected format.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'CSV Export failed');
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    if (!csv.trim()) {
      setError('Please upload or paste CSV data before importing.');
      return;
    }
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await vendorApi.importProductsCsv(csv);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'CSV Import failed');
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      handleCsvChange(text);
    } catch (e) {
      setError('Could not read the uploaded CSV file.');
    }
  };

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'greengrocc-vendor-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 text-amber-300" />
              <span>Spreadsheet Operations</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              CSV Import & Export
            </h1>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Manage multi-vendor products, daily mandi prices, and stock inventory using Excel or Google Sheets compatible CSV templates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white transition"
            >
              <FileText className="h-4 w-4" />
              <span>Sample CSV Template</span>
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={importCsv}
              disabled={busy || !csv.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>Process & Import CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-medium text-rose-800 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-emerald-50 p-4 text-xs font-medium text-emerald-900 border border-emerald-200">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>CSV Processing Complete!</span>
          </div>
          <p className="mt-1 text-slate-600">
            {result.message || 'All valid rows have been successfully imported and mapped to your catalog.'}
          </p>
        </div>
      )}

      {/* Main CSV Input Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">CSV Data & File Upload</h2>
            <p className="text-xs text-slate-500">
              Columns: <code className="font-semibold text-emerald-700">sku, name, brandName, categories, subcategory, price, discountedPrice, stock, unit, isActive</code>
            </p>
          </div>

          <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer transition">
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Select .csv File</span>
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          </label>
        </div>

        <textarea
          value={csv}
          onChange={(e) => handleCsvChange(e.target.value)}
          rows={10}
          placeholder="Paste CSV text here or upload a file using the button above..."
          className="w-full font-mono text-xs text-slate-800 bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />

        {/* Live Parsed Preview Table */}
        {previewRows.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Table className="h-3.5 w-3.5 text-emerald-600" />
              <span>Parsed Preview (First {previewRows.length} rows)</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Product Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Disc. Price</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {previewRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono text-emerald-800 font-bold">{r.sku || '—'}</td>
                      <td className="px-3 py-2">{r.name || '—'}</td>
                      <td className="px-3 py-2">{r.categories || r.category || '—'}</td>
                      <td className="px-3 py-2">₹{r.price || '0'}</td>
                      <td className="px-3 py-2">₹{r.discountedPrice || '0'}</td>
                      <td className="px-3 py-2">{r.stock || '0'} {r.unit || ''}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          String(r.isActive).toLowerCase() === 'true' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {String(r.isActive).toLowerCase() === 'true' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
