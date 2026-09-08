import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import erpApi from '../../api/erpApi';
import { BTN, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';

const RESOURCE_META = {
  farms: { title: 'Farms', id: 'farmId', cols: ['farmId', 'farmerId', 'farmName', 'area', 'status'] },
  crops: { title: 'Crops', id: 'cropId', cols: ['cropId', 'cropName', 'cropCode', 'farmerId', 'status'] },
  articles: { title: 'Articles', id: 'articleId', cols: ['articleId', 'productName', 'grade', 'availableStock', 'sellingPrice'] },
  batches: { title: 'Batches', id: 'batchId', cols: ['batchId', 'farmerId', 'articleId', 'quantity', 'grade', 'status'] },
  crates: { title: 'Crates', id: 'crateId', cols: ['crateId', 'batchId', 'weight', 'damageStatus', 'status'] },
  qr_codes: { title: 'QR Codes', id: 'qrId', cols: ['qrId', 'entityType', 'entityId', 'batchId', 'status'] },
  collection_centres: { title: 'Collection Centres', id: 'collectionCentreId', cols: ['collectionCentreId', 'name', 'totalWeight', 'packingStatus'] },
  warehouses: { title: 'Warehouses', id: 'warehouseId', cols: ['warehouseId', 'name', 'city', 'currentStock', 'availableCapacity'] },
  cold_storages: { title: 'Cold Storage', id: 'coldStorageId', cols: ['coldStorageId', 'name', 'temperature', 'humidity', 'alertStatus'] },
  dark_stores: { title: 'Dark Stores', id: 'darkStoreId', cols: ['darkStoreId', 'name', 'city', 'currentStock'] },
  inventories: { title: 'Inventory', id: 'inventoryId', cols: ['inventoryId', 'locationType', 'articleId', 'availableStock', 'lowStockAlert'] },
  procurements: { title: 'Procurement', id: 'procurementId', cols: ['procurementId', 'farmerId', 'quantity', 'purchaseAmount', 'paymentStatus'] },
  purchase_orders: { title: 'Purchase Orders', id: 'purchaseOrderId', cols: ['purchaseOrderId', 'vendorId', 'totalAmount', 'approvalStatus'] },
  goods_receipts: { title: 'GRN', id: 'grnId', cols: ['grnId', 'purchaseOrderId', 'acceptedQuantity', 'qualityStatus'] },
  vendors: { title: 'Vendors', id: 'vendorId', cols: ['vendorId', 'vendorName', 'category', 'outstanding'] },
  payments: { title: 'Payments', id: 'paymentId', cols: ['paymentId', 'amount', 'payerType', 'paymentStatus'] },
  invoices: { title: 'Invoices', id: 'invoiceId', cols: ['invoiceId', 'customerId', 'totalAmount', 'paymentStatus'] },
  customer_orders: { title: 'Customer Orders', id: 'orderId', cols: ['orderId', 'customerId', 'amount', 'deliveryStatus'] },
  deliveries: { title: 'Deliveries', id: 'deliveryId', cols: ['deliveryId', 'orderId', 'driverId', 'deliveryStatus'] },
  vehicles: { title: 'Vehicles', id: 'vehicleId', cols: ['vehicleId', 'vehicleType', 'registrationNumber', 'currentStatus'] },
  drivers: { title: 'Drivers', id: 'driverId', cols: ['driverId', 'name', 'city', 'rating'] },
  quality_checks: { title: 'Quality Checks', id: 'qualityCheckId', cols: ['qualityCheckId', 'batchId', 'grade', 'rejectedQuantity'] },
  packaging: { title: 'Packaging', id: 'packagingId', cols: ['packagingId', 'batchId', 'crateId', 'quantity'] },
  dispatches: { title: 'Dispatch', id: 'dispatchId', cols: ['dispatchId', 'orderId', 'vehicleId', 'status'] },
  employees: { title: 'HR / Employees', id: 'employeeId', cols: ['employeeId', 'employeeName', 'department', 'employmentStatus'] },
  customers: { title: 'Customers', id: 'customerId', cols: ['customerId', 'name', 'city', 'lifetimeValue'] },
  audit_logs: { title: 'Audit Logs', id: 'auditId', cols: ['auditId', 'module', 'action', 'recordId', 'dateTime'] },
};

export default function ErpListPage() {
  const { resource } = useParams();
  const meta = RESOURCE_META[resource] || { title: resource, id: 'id', cols: [] };
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    erpApi
      .list(resource, { q, page, limit: 20 })
      .then((res) => {
        if (!alive) return;
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.response?.data?.message || 'Failed to load');
        setItems([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [resource, q, page]);

  const cols = meta.cols.length ? meta.cols : Object.keys(items[0] || {}).filter((k) => k !== '_id' && k !== '__v').slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>ERP Master</p>
          <h1 className={PAGE_TITLE}>{meta.title}</h1>
          <p className={PAGE_SUB}>{total} records · IDs are permanent and never reused</p>
        </div>
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search ID or name"
          className={`${INPUT} max-w-xs`}
        />
      </div>
      {error && <p className="text-sm text-[#DC2626]">{error}</p>}
      <div className={PANEL}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {cols.map((col) => (
                  <th key={col} className={TH}>
                    {col}
                  </th>
                ))}
                <th className={TH}>Trace</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 1} className="px-3 py-8 text-center text-slate-400">
                    No records yet
                  </td>
                </tr>
              )}
              {items.map((row) => (
                <tr key={row[meta.id] || row._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  {cols.map((col) => (
                    <td key={col} className="px-3 py-2.5 font-mono text-xs text-[#217346]">
                      {String(row[col] ?? '—')}
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <Link
                      to={`/traceability?q=${encodeURIComponent(row[meta.id] || '')}`}
                      className="text-xs font-semibold text-[#217346] hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 text-sm">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`${BTN} disabled:opacity-40`}>
          Prev
        </button>
        <span className="text-slate-500">Page {page}</span>
        <button
          disabled={page * 20 >= total}
          onClick={() => setPage((p) => p + 1)}
          className={`${BTN} disabled:opacity-40`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
