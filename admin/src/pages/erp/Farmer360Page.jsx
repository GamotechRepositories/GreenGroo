import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  Leaf,
  Loader2,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  Tractor,
} from 'lucide-react';
import erpApi from '../../api/erpApi';
import { BTN, PAGE_KICKER, PANEL } from '../../utils/ui';

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

function statusTone(value) {
  const v = String(value || '').toLowerCase();
  if (['approved', 'verified', 'active', 'completed', 'success', 'paid'].includes(v)) return 'green';
  if (['pending', 'in_progress', 'submitted', 'review', 'scheduled'].includes(v)) return 'amber';
  if (['rejected', 'failed', 'inactive', 'blocked', 'cancelled'].includes(v)) return 'rose';
  return 'slate';
}

function Pill({ children, tone = 'slate' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tones[tone] || tones.slate}`}
    >
      {children || '—'}
    </span>
  );
}

function pretty(value) {
  return String(value || '—')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Empty({ label }) {
  return (
    <div className={`${PANEL} px-6 py-12 text-center text-sm text-slate-400`}>{label}</div>
  );
}

function Table({ columns, rows, rowKey }) {
  if (!rows?.length) return <Empty label="No records" />;
  return (
    <div className={`${PANEL} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-slate-700">
                    {col.render ? col.render(row) : row[col.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className={`${PANEL} p-4`}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
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
      { label: 'Farms', value: data.farms?.length || 0, icon: Tractor },
      { label: 'Crops', value: data.crops?.length || 0, icon: Leaf },
      { label: 'Products', value: data.products?.length || 0, icon: Package },
      { label: 'Orders', value: data.orders?.length || 0, icon: ShoppingCart },
      { label: 'Harvest qty', value: data.production || 0, icon: Leaf },
      { label: 'Earnings', value: money(data.payments), icon: Banknote },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading farmer
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/erp/farmers" className={BTN}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to farmers
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  const displayName = farmer.fullName || farmer.name || 'Farmer';
  const place = [farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(' · ');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/erp/farmers" className={BTN}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Farmers
        </Link>
        <Link
          to={`/traceability?q=${encodeURIComponent(farmer.farmerId)}`}
          className={`${BTN} text-emerald-700`}
        >
          Full chain →
        </Link>
      </div>

      <div className={`${PANEL} overflow-hidden`}>
        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 px-5 py-6 text-white sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
            Farmer 360
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <img
              src={
                farmer.profileImage ||
                farmer.profilePhoto ||
                'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=300'
              }
              alt=""
              className="h-24 w-24 rounded-2xl object-cover ring-2 ring-white/30"
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-emerald-100/90">{farmer.farmerId}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-emerald-50/90">
                {place ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {place}
                  </span>
                ) : null}
                {farmer.mobile ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {farmer.mobile}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-5 py-3 sm:px-6">
          <Pill tone={statusTone(farmer.kycStatus)}>KYC {pretty(farmer.kycStatus)}</Pill>
          <Pill tone={statusTone(farmer.bankStatus)}>Bank {pretty(farmer.bankStatus)}</Pill>
          <Pill tone={statusTone(farmer.status)}>{pretty(farmer.status)}</Pill>
          {farmer.managerName ? <Pill tone="slate">Manager · {farmer.managerName}</Pill> : null}
          {farmer.vendorName ? <Pill tone="slate">{farmer.vendorName}</Pill> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${PANEL} p-3.5`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                <Icon className="h-3.5 w-3.5 text-emerald-600/70" />
              </div>
              <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
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
          <Section title="Profile">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name" value={farmer.name} />
              <Field label="Mobile" value={farmer.mobile} />
              <Field label="Email" value={farmer.email} />
              <Field label="Gender" value={farmer.gender} />
              <Field label="Language" value={farmer.preferredLanguage} />
              <Field label="Joined" value={when(farmer.createdAt)} />
            </div>
          </Section>
          <Section title="Address">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Village" value={farmer.village || farmer.address?.village} />
              <Field label="Taluka" value={farmer.taluka || farmer.address?.taluka} />
              <Field label="District" value={farmer.district || farmer.address?.district} />
              <Field label="State" value={farmer.state || farmer.address?.state} />
              <Field label="Pincode" value={farmer.pincode || farmer.address?.pincode} />
              <Field
                label="Farm address"
                value={farmer.farmAddress || farmer.farmGeo?.farmAddress}
              />
            </div>
          </Section>
          <Section title="Bank">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Holder" value={farmer.bank?.accountHolder} />
              <Field label="Bank" value={farmer.bank?.bankName} />
              <Field label="Account" value={farmer.bank?.accountNumber} />
              <Field label="IFSC" value={farmer.bank?.ifsc} />
            </div>
          </Section>
          <Section title="Team">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Manager" value={farmer.managerName || data.manager?.name} />
              <Field label="Manager mobile" value={data.manager?.mobile} />
              <Field label="Vendor" value={farmer.vendorName} />
              <Field label="Vendor ID" value={farmer.vendorId} />
            </div>
          </Section>
        </div>
      )}

      {tab === 'Farm' && (
        <div className="space-y-3">
          {(data.farms || []).map((farm) => (
            <div key={farm.farmId || farm._id} className={`${PANEL} p-4`}>
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                  <Tractor className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-mono text-[11px] text-emerald-700">{farm.farmId}</p>
                  <p className="font-semibold text-slate-900">
                    {farm.farmName || farmer.farmName || 'Farm'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[
                      farm.area || farmer.farm?.totalFarmArea,
                      farm.areaUnit || farmer.farm?.totalFarmAreaUnit,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    {' · '}
                    {farm.soilType || farmer.farm?.soilType || '—'}
                    {' · '}
                    {farm.irrigationType || farmer.farm?.irrigationType || '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {farm.address || farm.farmLocation || farmer.farmLocation || '—'}
                  </p>
                </div>
              </div>
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
            {
              key: 'area',
              label: 'Area',
              render: (row) => `${row.area || 0} ${row.areaUnit || ''}`.trim(),
            },
            {
              key: 'estimatedQuantity',
              label: 'Est. qty',
              render: (row) =>
                `${row.estimatedQuantity || row.expectedProduction || 0} ${row.unit || ''}`.trim(),
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <Pill tone={statusTone(row.status)}>{pretty(row.status)}</Pill>,
            },
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
            {
              key: 'name',
              label: 'Name',
              render: (row) => row.name || row.productName,
            },
            { key: 'cropName', label: 'Crop' },
            {
              key: 'stock',
              label: 'Stock',
              render: (row) =>
                `${row.availableQuantity ?? row.stock ?? 0} ${row.unit || ''}`.trim(),
            },
            {
              key: 'sellingPrice',
              label: 'Price',
              render: (row) => money(row.sellingPrice || row.pricePerKg),
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <Pill tone={statusTone(row.status)}>{pretty(row.status)}</Pill>,
            },
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
            {
              key: 'totalQuantity',
              label: 'Qty',
              render: (row) => row.totalQuantity || row.orderedQuantity || 0,
            },
            {
              key: 'totalAmount',
              label: 'Amount',
              render: (row) => money(row.totalAmount || row.orderValue || row.amount),
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <Pill tone={statusTone(row.status)}>{pretty(row.status)}</Pill>,
            },
            { key: 'paymentStatus', label: 'Payment' },
            {
              key: 'createdAt',
              label: 'Date',
              render: (row) => when(row.orderDate || row.createdAt),
            },
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
            {
              key: 'totalAmount',
              label: 'Amount',
              render: (row) => money(row.totalAmount),
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <Pill tone={statusTone(row.status)}>{pretty(row.status)}</Pill>,
            },
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
            {
              key: 'netEarnings',
              label: 'Net',
              render: (row) => money(row.netEarnings),
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <Pill tone={statusTone(row.status)}>{pretty(row.status)}</Pill>,
            },
          ]}
        />
      )}

      {tab === 'Documents' && (
        <Table
          rows={data.documents}
          rowKey={(row) => row.id}
          columns={[
            { key: 'type', label: 'Type' },
            {
              key: 'fileName',
              label: 'File',
              render: (row) => row.fileName || row.name,
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <Pill tone={statusTone(row.status)}>{pretty(row.status)}</Pill>,
            },
            {
              key: 'fileUrl',
              label: 'Link',
              render: (row) =>
                row.fileUrl ? (
                  <a
                    href={row.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-700 hover:underline"
                  >
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
              {
                key: 'pickupId',
                label: 'Pickup',
                render: (row) => row.pickupId || row.id,
              },
              { key: 'productName', label: 'Product' },
              {
                key: 'status',
                label: 'Status',
                render: (row) => <Pill tone={statusTone(row.status)}>{pretty(row.status)}</Pill>,
              },
              { key: 'driverName', label: 'Driver' },
              { key: 'packedQuantity', label: 'Packed qty' },
              { key: 'scheduledDate', label: 'Scheduled' },
            ]}
          />
          <div>
            <p className={PAGE_KICKER}>Quality inspections</p>
            <h3 className="mb-3 mt-1 text-base font-semibold text-slate-900">Inspections</h3>
            <Table
              rows={data.inspections}
              rowKey={(row) => row.id || row._id}
              columns={[
                {
                  key: 'inspectionId',
                  label: 'ID',
                  render: (row) => row.inspectionId || row.id,
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => (
                    <Pill tone={statusTone(row.status)}>{pretty(row.status)}</Pill>
                  ),
                },
                {
                  key: 'gradeAQuantity',
                  label: 'A / B / C',
                  render: (row) =>
                    `${row.gradeAQuantity || 0} / ${row.gradeBQuantity || 0} / ${row.gradeCQuantity || 0}`,
                },
                { key: 'rejectedQuantity', label: 'Rejected' },
                {
                  key: 'createdAt',
                  label: 'Date',
                  render: (row) => when(row.createdAt),
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
