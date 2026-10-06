import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, PAGE_SUB, PAGE_TITLE } from '../../utils/ui';
import { RecordCommissionPaymentModal } from './multiVendorShared';
import VendorCommissionTab from './VendorCommissionTab';

export default function VendorCommissionPage() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingVendor, setPayingVendor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await opsApi.list('vendors');
      setRows(Array.isArray(res.data) ? res.data : []);
      setStats(res.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendor commission');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Vendor Commission</h1>
          <p className={`mt-0.5 ${PAGE_SUB}`}>
            Commission earned on each vendor's sales, and how much of it has been paid.
          </p>
        </div>
        <button type="button" onClick={load} className={`${BTN} gap-1.5 text-xs`}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <VendorCommissionTab rows={rows} stats={stats} loading={loading} onRecordPayment={setPayingVendor} />

      {payingVendor ? (
        <RecordCommissionPaymentModal
          vendor={payingVendor}
          onClose={() => setPayingVendor(null)}
          onSaved={async () => {
            setPayingVendor(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}
