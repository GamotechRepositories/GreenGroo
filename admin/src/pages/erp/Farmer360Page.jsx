import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import erpApi from '../../api/erpApi';

const TABS = [
  'Overview',
  'Farm',
  'Crops',
  'Products',
  'Inventory',
  'Orders',
  'Harvests',
  'Earnings',
  'Documents',
  'Pickups',
];

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function when(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-IN');
}

function Badge({ children }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {children || '—'}
    </span>
  );
}

function Empty({ label }) {
  return <p className="px-1 py-6 text-sm text-slate-400">{label}</p>;
}

function Table({ columns, rows, rowKey }) {
  if (!rows?.length) return <Empty label="No records" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/80">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="border-t border-slate-100 dark:border-slate-800">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 text-slate-700 dark:text-slate-200">
                  {col.render ? col.render(row) : row[col.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{value || '—'}</p>
    </div>
  );
}

export default function Farmer360Page() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');

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

  const farmer = data?.farmer || {};
  const photos = farmer.farmPhotos || [];
  const videos = farmer.farmVideos || [];

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      ['Farms', data.farms?.length || 0],
      ['Crops', data.crops?.length || 0],
      ['Products', data.products?.length || 0],
      ['Orders', data.orders?.length || 0],
      ['Harvest qty', data.production || 0],
      ['Earnings', money(data.payments)],
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading farmer
      </div>
    );
  }
  if (error) return <p className="text-rose-600">{error}</p>;

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
            {[farmer.village, farmer.taluka, farmer.district, farmer.mobile].filter(Boolean).join(' · ') || '—'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>KYC {farmer.kycStatus}</Badge>
            <Badge>Bank {farmer.bankStatus}</Badge>
            <Badge>{farmer.status}</Badge>
            {farmer.managerName ? <Badge>Manager {farmer.managerName}</Badge> : null}
            {farmer.vendorName ? <Badge>{farmer.vendorName}</Badge> : null}
          </div>
        </div>
        <Link to={`/traceability?q=${encodeURIComponent(farmer.farmerId)}`} className="text-sm font-semibold text-emerald-700">
          Full chain →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`shrink-0 border-b-2 px-3 py-2 text-xs font-semibold ${
              tab === name
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Profile</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={farmer.name} />
              <Field label="Mobile" value={farmer.mobile} />
              <Field label="Email" value={farmer.email} />
              <Field label="Gender" value={farmer.gender} />
              <Field label="Language" value={farmer.preferredLanguage} />
              <Field label="Joined" value={when(farmer.createdAt)} />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Address</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Village" value={farmer.village || farmer.address?.village} />
              <Field label="Taluka" value={farmer.taluka || farmer.address?.taluka} />
              <Field label="District" value={farmer.district || farmer.address?.district} />
              <Field label="State" value={farmer.state || farmer.address?.state} />
              <Field label="Pincode" value={farmer.pincode || farmer.address?.pincode} />
              <Field label="Farm address" value={farmer.farmAddress || farmer.farmGeo?.farmAddress} />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Bank</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Holder" value={farmer.bank?.accountHolder} />
              <Field label="Bank" value={farmer.bank?.bankName} />
              <Field label="Account" value={farmer.bank?.accountNumber} />
              <Field label="IFSC" value={farmer.bank?.ifsc} />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Team</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Manager" value={farmer.managerName || data.manager?.name} />
              <Field label="Manager mobile" value={data.manager?.mobile} />
              <Field label="Vendor" value={farmer.vendorName} />
              <Field label="Vendor ID" value={farmer.vendorId} />
            </div>
          </section>
        </div>
      )}

      {tab === 'Farm' && (
        <div className="space-y-3">
          {(data.farms || []).map((farm) => (
            <div key={farm.farmId || farm._id} className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              <p className="font-mono text-xs text-emerald-700">{farm.farmId}</p>
              <p className="font-semibold">{farm.farmName || farmer.farmName || 'Farm'}</p>
              <p className="text-slate-500">
                {[farm.area || farmer.farm?.totalFarmArea, farm.areaUnit || farmer.farm?.totalFarmAreaUnit].filter(Boolean).join(' ')}
                {' · '}
                {farm.soilType || farmer.farm?.soilType || '—'}
                {' · '}
                {farm.irrigationType || farmer.farm?.irrigationType || '—'}
              </p>
              <p className="text-xs text-slate-400">{farm.address || farm.farmLocation || farmer.farmLocation}</p>
            </div>
          ))}
          {!data.farms?.length && <Empty label="No farm records yet" />}
          {(photos.length > 0 || videos.length > 0) && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {photos.map((url) => (
                <img key={url} src={url} alt="" className="h-28 w-full rounded-xl object-cover" />
              ))}
              {videos.map((url) => (
                <video key={url} src={url} controls className="h-28 w-full rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Crops' && (
        <Table
          rows={data.crops}
          rowKey={(row) => row.id || row.cropId}
          columns={[
            { key: 'cropId', label: 'Crop ID', render: (row) => row.cropId || row.id },
            { key: 'cropName', label: 'Crop' },
            { key: 'variety', label: 'Variety' },
            { key: 'area', label: 'Area', render: (row) => `${row.area || 0} ${row.areaUnit || ''}`.trim() },
            { key: 'estimatedQuantity', label: 'Est. qty', render: (row) => `${row.estimatedQuantity || row.expectedProduction || 0} ${row.unit || ''}`.trim() },
            { key: 'status', label: 'Status' },
            { key: 'sowingDate', label: 'Sowing' },
            { key: 'expectedHarvestDate', label: 'Harvest' },
          ]}
        />
      )}

      {tab === 'Products' && (
        <Table
          rows={data.products}
          rowKey={(row) => row.id || row.productId}
          columns={[
            { key: 'productId', label: 'Product ID', render: (row) => row.productId || row.id },
            { key: 'name', label: 'Name', render: (row) => row.name || row.productName },
            { key: 'cropName', label: 'Crop' },
            { key: 'stock', label: 'Stock', render: (row) => `${row.availableQuantity ?? row.stock ?? 0} ${row.unit || ''}`.trim() },
            { key: 'sellingPrice', label: 'Price', render: (row) => money(row.sellingPrice || row.pricePerKg) },
            { key: 'status', label: 'Status' },
          ]}
        />
      )}

      {tab === 'Inventory' && (
        <Table
          rows={data.stockHistory}
          rowKey={(row) => row.id || row._id}
          columns={[
            { key: 'at', label: 'When', render: (row) => when(row.at || row.createdAt) },
            { key: 'productName', label: 'Product' },
            { key: 'action', label: 'Action' },
            { key: 'changedQuantity', label: 'Change' },
            { key: 'newStock', label: 'New stock' },
            { key: 'reason', label: 'Reason' },
          ]}
        />
      )}

      {tab === 'Orders' && (
        <Table
          rows={data.orders}
          rowKey={(row) => row.id || row.orderId}
          columns={[
            { key: 'orderId', label: 'Order', render: (row) => row.orderId || row.id },
            { key: 'productName', label: 'Product' },
            { key: 'totalQuantity', label: 'Qty', render: (row) => row.totalQuantity || row.orderedQuantity || 0 },
            { key: 'totalAmount', label: 'Amount', render: (row) => money(row.totalAmount || row.orderValue || row.amount) },
            { key: 'status', label: 'Status' },
            { key: 'paymentStatus', label: 'Payment' },
            { key: 'createdAt', label: 'Date', render: (row) => when(row.orderDate || row.createdAt) },
          ]}
        />
      )}

      {tab === 'Harvests' && (
        <Table
          rows={data.harvests}
          rowKey={(row) => row.id}
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'productName', label: 'Product' },
            { key: 'totalQuantity', label: 'Qty' },
            { key: 'totalAmount', label: 'Amount', render: (row) => money(row.totalAmount) },
            { key: 'status', label: 'Status' },
          ]}
        />
      )}

      {tab === 'Earnings' && (
        <Table
          rows={data.earnings}
          rowKey={(row) => row.id}
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'cropName', label: 'Crop' },
            { key: 'quantity', label: 'Qty' },
            { key: 'netEarnings', label: 'Net', render: (row) => money(row.netEarnings) },
            { key: 'status', label: 'Status' },
          ]}
        />
      )}

      {tab === 'Documents' && (
        <Table
          rows={data.documents}
          rowKey={(row) => row.id}
          columns={[
            { key: 'type', label: 'Type' },
            { key: 'fileName', label: 'File', render: (row) => row.fileName || row.name },
            { key: 'status', label: 'Status' },
            {
              key: 'fileUrl',
              label: 'Link',
              render: (row) =>
                row.fileUrl ? (
                  <a href={row.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                    Open
                  </a>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      )}

      {tab === 'Pickups' && (
        <div className="space-y-6">
          <Table
            rows={data.pickups}
            rowKey={(row) => row.pickupId || row.id}
            columns={[
              { key: 'pickupId', label: 'Pickup', render: (row) => row.pickupId || row.id },
              { key: 'productName', label: 'Product' },
              { key: 'status', label: 'Status' },
              { key: 'driverName', label: 'Driver' },
              { key: 'packedQuantity', label: 'Packed qty' },
              { key: 'scheduledDate', label: 'Scheduled' },
            ]}
          />
          <h3 className="text-sm font-semibold uppercase text-slate-500">Quality inspections</h3>
          <Table
            rows={data.inspections}
            rowKey={(row) => row.id || row._id}
            columns={[
              { key: 'inspectionId', label: 'ID', render: (row) => row.inspectionId || row.id },
              { key: 'status', label: 'Status' },
              { key: 'gradeAQuantity', label: 'A / B / C', render: (row) => `${row.gradeAQuantity || 0} / ${row.gradeBQuantity || 0} / ${row.gradeCQuantity || 0}` },
              { key: 'rejectedQuantity', label: 'Rejected' },
              { key: 'createdAt', label: 'Date', render: (row) => when(row.createdAt) },
            ]}
          />
        </div>
      )}
    </div>
  );
}
