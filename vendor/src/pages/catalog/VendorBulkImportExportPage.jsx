import React, { useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Loader2,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Package
} from 'lucide-react';
import { vendorApi } from '../../api/vendorApi';

const SAMPLE_JSON = [
  {
    sku: "VND-TOM-01",
    name: "Fresh Hybrid Tomato Grade-A",
    brandName: "GreenGrocc Fresh",
    categories: ["Vegetables", "Daily Essentials"],
    subcategory: "Tomatoes",
    price: 40,
    discountedPrice: 35,
    stock: 500,
    unit: "kg",
    isActive: true,
    description: "Farm fresh organic farmgate tomatoes harvested today."
  },
  {
    sku: "VND-ONI-01",
    name: "Nashik Garwa Red Onion",
    brandName: "GreenGrocc Fresh",
    categories: ["Vegetables"],
    subcategory: "Onions",
    price: 30,
    discountedPrice: 28,
    stock: 1200,
    unit: "kg",
    isActive: true,
    description: "Export quality unhali garwa onion with long shelf life."
  }
];

export default function VendorBulkImportExportPage() {
  const [jsonText, setJsonText] = useState('[]');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const exportJson = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await vendorApi.exportProductsJson();
      const payload = JSON.stringify(res.data || res || [], null, 2);
      setJsonText(payload);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendor-catalog-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed. Check connection.');
    } finally {
      setBusy(false);
    }
  };

  const importJson = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (e) {
        throw new Error('Invalid JSON format. Please verify brackets, quotes, and commas.');
      }

      const products = Array.isArray(parsed) ? parsed : parsed.products;
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('JSON must contain an array of product objects.');
      }

      const res = await vendorApi.importProductsJson(products);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Bulk import failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target?.result || '[]');
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setJsonText(JSON.stringify(SAMPLE_JSON, null, 2));
  };

  const copySample = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_JSON, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-amber-300" />
              <span>Multi-Vendor Bulk Operations</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Bulk Import & Export (JSON)
            </h1>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Download your full product and inventory catalog or upload new listings in bulk JSON format. Automatic matching is performed by SKU.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportJson}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Export Catalog JSON</span>
            </button>

            <button
              type="button"
              onClick={importJson}
              disabled={busy || !jsonText || jsonText === '[]'}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>Import & Sync JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error or Success Alerts */}
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
            <span>Bulk Process Completed Successfully!</span>
          </div>
          <p className="mt-1 text-slate-600">
            {result.message || `Processed ${result.data?.length || 'all'} records.`}
          </p>
          {result.details && (
            <pre className="mt-2 rounded-lg bg-white/80 p-2 font-mono text-[11px] text-slate-700 overflow-x-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* JSON Editor (2 columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <FileCode className="h-4 w-4 text-emerald-600" />
              <span>Catalog JSON Payload</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 cursor-pointer transition">
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={loadSample}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition"
              >
                Insert Sample
              </button>
            </div>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={16}
            placeholder="Paste or upload JSON products array here..."
            className="w-full font-mono text-xs text-slate-800 bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tip: Matching is performed automatically by <code className="font-bold text-emerald-700">sku</code>. Existing items will be updated with new prices and stock.</span>
          </div>
        </div>

        {/* Side Panel: Schema Reference */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Required Fields</h3>
              <button
                type="button"
                onClick={copySample}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy Sample'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="font-bold text-slate-800">sku</span>
                <span className="ml-1 text-[11px] text-rose-500 font-semibold">(Unique, Required)</span>
                <p className="text-[11px] text-slate-500">Unique product SKU (e.g. VND-TOM-01)</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="font-bold text-slate-800">name</span>
                <span className="ml-1 text-[11px] text-rose-500 font-semibold">(Required)</span>
                <p className="text-[11px] text-slate-500">Product title displayed to customers</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="font-bold text-slate-800">price & discountedPrice</span>
                <p className="text-[11px] text-slate-500">MRP and selling price in Rupees (₹)</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="font-bold text-slate-800">stock</span>
                <p className="text-[11px] text-slate-500">Available quantity in inventory</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="font-bold text-slate-800">categories</span>
                <p className="text-[11px] text-slate-500">Array of category names (e.g. ["Vegetables"])</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
