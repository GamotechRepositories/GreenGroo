import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { useVendor } from '@/context/VendorContext'
import {
  adjustFarmerStock,
  getFarmerById,
  getFarmerDocuments,
  getFarmerEarnings,
  getFarmerInventory,
  getFarmerOrders,
  getFarmerProducts,
  getStockHistory,
  setFarmerStatus,
  updateFarmer,
} from '@/api/farmerManagerApi'
import { formatDate, formatDateTime } from '@/components/farmer-manager/FmShared'
import { ExcelDataTable, ExcelInfoGrid, ExcelStatCard, ExcelStatusBadge } from '@/components/farmer-manager/ExcelUi'
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_OUTLINE,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
  EXCEL_TAB,
  EXCEL_TAB_ACTIVE,
} from '@/components/farmer-manager/excelStyles'
import { formatCurrency } from '@/lib/utils'

const TABS = ['Overview', 'Products', 'Inventory', 'Orders', 'Earnings', 'Documents', 'Profile']

export default function FarmerDetailPage() {
  const { farmerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useVendor()
  const tab = searchParams.get('tab') || 'Overview'

  const [farmer, setFarmer] = useState(null)
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [earnings, setEarnings] = useState({ summary: {}, transactions: [] })
  const [documents, setDocuments] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stockModal, setStockModal] = useState(null)
  const [stockQty, setStockQty] = useState('')
  const [busy, setBusy] = useState(false)
  const [editProfile, setEditProfile] = useState(searchParams.get('edit') === '1')
  const [profileForm, setProfileForm] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [f, p, inv, o, e, d, h] = await Promise.all([
        getFarmerById(farmerId),
        getFarmerProducts(farmerId),
        getFarmerInventory(farmerId),
        getFarmerOrders(farmerId),
        getFarmerEarnings(farmerId),
        getFarmerDocuments(farmerId),
        getStockHistory(farmerId),
      ])
      setFarmer(f)
      setProducts(p)
      setInventory(inv)
      setOrders(o)
      setEarnings(e)
      setDocuments(d)
      setHistory(h)
      setProfileForm({
        name: f.name,
        mobile: f.mobile,
        email: f.email,
        farmName: f.farmName,
        farmLocation: f.farmLocation,
        farmAddress: f.farmAddress,
        farmArea: f.farmArea,
        farmType: f.farmType,
        status: f.status,
        bank: { ...f.bank },
      })
    } catch (err) {
      setError(err.message || 'Failed to load farmer')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [farmerId])

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    params.delete('edit')
    setSearchParams(params)
    setEditProfile(false)
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState description={error} onRetry={load} />
  if (!farmer) return null

  const productColumns = [
    { key: 'name', header: 'Product Name' },
    { key: 'category', header: 'Category' },
    { key: 'subCategory', header: 'Sub Category' },
    {
      key: 'totalQuantity',
      header: 'Total Qty',
      align: 'right',
      render: (row) => `${row.totalQuantity} ${row.unit}`,
    },
    {
      key: 'grades',
      header: 'Grades',
      wrap: true,
      render: (row) => (
        <div className="space-y-0.5">
          {row.grades.map((g) => (
            <div key={g.id || g.label}>
              {g.label} — {g.quantity} {row.unit}
            </div>
          ))}
        </div>
      ),
    },
    { key: 'harvestDate', header: 'Harvest Date', render: (row) => formatDate(row.harvestDate) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <ExcelStatusBadge status={row.status} />,
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <button
          type="button"
          className={`${EXCEL_BTN_OUTLINE} py-0.5`}
          onClick={() => navigate(`/farmer-manager/farmers/${farmerId}/products/${row.id}`)}
        >
          View
        </button>
      ),
    },
  ]

  const inventoryColumns = [
    { key: 'productName', header: 'Product' },
    { key: 'grade', header: 'Grade' },
    {
      key: 'currentStock',
      header: 'Current Stock',
      align: 'right',
      render: (row) => `${row.currentStock} ${row.unit}`,
    },
    {
      key: 'reservedStock',
      header: 'Reserved',
      align: 'right',
      render: (row) => `${row.reservedStock} ${row.unit}`,
    },
    {
      key: 'soldStock',
      header: 'Sold',
      align: 'right',
      render: (row) => `${row.soldStock} ${row.unit}`,
    },
    {
      key: 'totalStock',
      header: 'Total Stock',
      align: 'right',
      render: (row) => `${row.totalStock} ${row.unit}`,
    },
    { key: 'status', header: 'Status', render: (row) => <ExcelStatusBadge status={row.status} /> },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (row) => formatDateTime(row.lastUpdated),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <button type="button" className={`${EXCEL_BTN_PRIMARY} py-0.5`} onClick={() => setStockModal({ mode: 'add', row })}>
            + Add
          </button>
          <button type="button" className={`${EXCEL_BTN_DANGER} py-0.5`} onClick={() => setStockModal({ mode: 'remove', row })}>
            Remove
          </button>
        </div>
      ),
    },
  ]

  const historyColumns = [
    { key: 'at', header: 'Date & Time', render: (row) => formatDateTime(row.at) },
    { key: 'productName', header: 'Product' },
    { key: 'grade', header: 'Grade' },
    { key: 'previousStock', header: 'Previous Stock', align: 'right' },
    { key: 'action', header: 'Action' },
    {
      key: 'changedQuantity',
      header: 'Changed Qty',
      align: 'right',
      render: (row) => (
        <span className={row.changedQuantity >= 0 ? 'text-emerald-700' : 'text-red-600'}>
          {row.changedQuantity >= 0 ? `+${row.changedQuantity}` : row.changedQuantity}
        </span>
      ),
    },
    { key: 'newStock', header: 'New Stock', align: 'right' },
    { key: 'updatedBy', header: 'Updated By' },
  ]

  const orderColumns = [
    { key: 'id', header: 'Order ID' },
    { key: 'customer', header: 'Customer' },
    { key: 'product', header: 'Product' },
    { key: 'grade', header: 'Grade' },
    { key: 'quantity', header: 'Qty', align: 'right' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'status', header: 'Status', render: (row) => <ExcelStatusBadge status={row.status} /> },
    { key: 'orderDate', header: 'Order Date', render: (row) => formatDate(row.orderDate) },
  ]

  const txnColumns = [
    { key: 'id', header: 'Transaction ID' },
    { key: 'orderId', header: 'Order ID' },
    { key: 'product', header: 'Product' },
    { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount) },
    {
      key: 'commission',
      header: 'Commission',
      align: 'right',
      render: (row) => formatCurrency(row.commission),
    },
    {
      key: 'netEarnings',
      header: 'Net Earnings',
      align: 'right',
      render: (row) => formatCurrency(row.netEarnings),
    },
    { key: 'status', header: 'Status', render: (row) => <ExcelStatusBadge status={row.status} /> },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
  ]

  const docColumns = [
    { key: 'name', header: 'Document Name' },
    {
      key: 'uploadedAt',
      header: 'Uploaded Date',
      render: (row) => (row.uploadedAt ? formatDate(row.uploadedAt) : '—'),
    },
    { key: 'status', header: 'Status', render: (row) => <ExcelStatusBadge status={row.status} /> },
    {
      key: 'rejectionReason',
      header: 'Rejection Reason',
      wrap: true,
      render: (row) => row.rejectionReason || '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <div className="flex gap-1">
          <button type="button" className={`${EXCEL_BTN_OUTLINE} py-0.5`}>
            View
          </button>
          <button type="button" className={`${EXCEL_BTN} py-0.5`}>
            Download
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3 font-[Segoe_UI,Calibri,system-ui,sans-serif] text-[12px] text-[#1F2937]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            to={farmer.managerId ? `/farmer-manager/managers/${farmer.managerId}` : '/farmer-manager/farmers'}
            className="text-xs font-semibold text-[#217346] hover:underline"
          >
            ← {farmer.managerName !== '—' ? farmer.managerName : 'All Farmers'}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center border border-[#D4D4D4] bg-[#F2F2F2] text-xs font-bold text-[#217346]">
              {(farmer.name || 'F')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join('')}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={EXCEL_PAGE_TITLE}>{farmer.name}</h1>
                <ExcelStatusBadge status={farmer.status} />
              </div>
              <p className={EXCEL_PAGE_SUB}>
                Manager: <span className="font-semibold text-[#1F2937]">{farmer.managerName}</span>
                {' · '}
                {farmer.farmName} · {farmer.farmLocation}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={EXCEL_BTN_OUTLINE}
            onClick={async () => {
              const next = farmer.status === 'Active' ? 'Inactive' : 'Active'
              await setFarmerStatus(farmer.id, next)
              toast(`Farmer marked ${next}`)
              load()
            }}
          >
            {farmer.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className={EXCEL_BTN}
            onClick={() => {
              setTab('Profile')
              setEditProfile(true)
            }}
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-0 border border-[#D4D4D4] bg-white">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`${tab === item ? EXCEL_TAB_ACTIVE : EXCEL_TAB} border-0 border-r border-[#D4D4D4] last:border-r-0`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === 'Overview' ? (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <ExcelStatCard title="Total Products" value={farmer.totalProducts} />
            <ExcelStatCard title="Total Stock" value={farmer.totalStock} />
            <ExcelStatCard title="Total Orders" value={farmer.totalOrders} />
            <ExcelStatCard title="Total Earnings" value={formatCurrency(farmer.totalEarnings)} />
            <ExcelStatCard title="Verification" value={farmer.verificationStatus} />
            <ExcelStatCard title="Farm Type" value={farmer.farmType} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <section className={EXCEL_PANEL}>
              <h2 className={EXCEL_PANEL_HEAD}>Personal Information</h2>
              <ExcelInfoGrid
                rows={[
                  { label: 'Farmer Name', value: farmer.name },
                  { label: 'Mobile Number', value: farmer.mobile },
                  { label: 'Email', value: farmer.email },
                ]}
              />
            </section>
            <section className={EXCEL_PANEL}>
              <h2 className={EXCEL_PANEL_HEAD}>Farm Information</h2>
              <ExcelInfoGrid
                rows={[
                  { label: 'Farm Name', value: farmer.farmName },
                  { label: 'Farm Location', value: farmer.farmLocation },
                  { label: 'Farm Address', value: farmer.farmAddress },
                  { label: 'Farm Area', value: farmer.farmArea },
                  { label: 'Farm Type', value: farmer.farmType },
                ]}
              />
            </section>
          </div>
        </div>
      ) : null}

      {tab === 'Products' ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Products</h2>
          <ExcelDataTable
            columns={productColumns}
            rows={products}
            emptyMessage="No products for this farmer."
            onRowClick={(row) => navigate(`/farmer-manager/farmers/${farmerId}/products/${row.id}`)}
          />
        </section>
      ) : null}

      {tab === 'Inventory' ? (
        <div className="space-y-3">
          <section className={EXCEL_PANEL}>
            <h2 className={EXCEL_PANEL_HEAD}>Inventory</h2>
            <ExcelDataTable columns={inventoryColumns} rows={inventory} emptyMessage="No inventory rows." />
          </section>
          <section className={EXCEL_PANEL}>
            <h2 className={EXCEL_PANEL_HEAD}>Inventory History</h2>
            <ExcelDataTable columns={historyColumns} rows={history} emptyMessage="No inventory history yet." />
          </section>
        </div>
      ) : null}

      {tab === 'Orders' ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Orders</h2>
          <ExcelDataTable columns={orderColumns} rows={orders} emptyMessage="No orders for this farmer." />
        </section>
      ) : null}

      {tab === 'Earnings' ? (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ExcelStatCard title="Total Earnings" value={formatCurrency(earnings.summary.totalEarnings)} />
            <ExcelStatCard title="Available Earnings" value={formatCurrency(earnings.summary.availableEarnings)} />
            <ExcelStatCard title="Pending Earnings" value={formatCurrency(earnings.summary.pendingEarnings)} />
            <ExcelStatCard title="Paid Earnings" value={formatCurrency(earnings.summary.paidEarnings)} />
          </div>
          <section className={EXCEL_PANEL}>
            <h2 className={EXCEL_PANEL_HEAD}>Transaction History</h2>
            <ExcelDataTable
              columns={txnColumns}
              rows={earnings.transactions}
              emptyMessage="No transactions yet."
            />
          </section>
        </div>
      ) : null}

      {tab === 'Documents' ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Documents</h2>
          <ExcelDataTable columns={docColumns} rows={documents} emptyMessage="No documents uploaded." />
        </section>
      ) : null}

      {tab === 'Profile' ? (
        <div className="space-y-3">
          {!editProfile || !profileForm ? (
            <>
              <section className={EXCEL_PANEL}>
                <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
                  <span>Personal Details</span>
                  <button type="button" className={EXCEL_BTN} onClick={() => setEditProfile(true)}>
                    Edit
                  </button>
                </div>
                <ExcelInfoGrid
                  rows={[
                    { label: 'Name', value: farmer.name },
                    { label: 'Mobile', value: farmer.mobile },
                    { label: 'Email', value: farmer.email },
                  ]}
                />
              </section>
              <section className={EXCEL_PANEL}>
                <h2 className={EXCEL_PANEL_HEAD}>Farm Details</h2>
                <ExcelInfoGrid
                  rows={[
                    { label: 'Farm Name', value: farmer.farmName },
                    { label: 'Farm Location', value: farmer.farmLocation },
                    { label: 'Farm Address', value: farmer.farmAddress },
                    { label: 'Farm Area', value: farmer.farmArea },
                    { label: 'Farm Type', value: farmer.farmType },
                  ]}
                />
              </section>
              <section className={EXCEL_PANEL}>
                <h2 className={EXCEL_PANEL_HEAD}>Bank Details</h2>
                <ExcelInfoGrid
                  rows={[
                    { label: 'Account Holder', value: farmer.bank?.accountHolder },
                    { label: 'Bank Name', value: farmer.bank?.bankName },
                    { label: 'Account Number', value: farmer.bank?.accountNumber },
                    { label: 'IFSC', value: farmer.bank?.ifsc },
                  ]}
                />
              </section>
            </>
          ) : (
            <form
              className={EXCEL_PANEL}
              onSubmit={async (e) => {
                e.preventDefault()
                setBusy(true)
                try {
                  await updateFarmer(farmerId, profileForm)
                  toast('Farmer profile updated')
                  setEditProfile(false)
                  await load()
                } catch (err) {
                  toast(err.message || 'Update failed', 'error')
                } finally {
                  setBusy(false)
                }
              }}
            >
              <h2 className={EXCEL_PANEL_HEAD}>Edit Profile</h2>
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>
                <Field label="Mobile">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm((p) => ({ ...p, mobile: e.target.value }))}
                  />
                </Field>
                <Field label="Email">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </Field>
                <Field label="Status">
                  <select
                    className={EXCEL_SELECT}
                    value={profileForm.status}
                    onChange={(e) => setProfileForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>
                <Field label="Farm Name">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmName: e.target.value }))}
                  />
                </Field>
                <Field label="Farm Location">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmLocation}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmLocation: e.target.value }))}
                  />
                </Field>
                <Field label="Farm Address" className="sm:col-span-2">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmAddress}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmAddress: e.target.value }))}
                  />
                </Field>
                <Field label="Farm Area">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmArea}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmArea: e.target.value }))}
                  />
                </Field>
                <Field label="Farm Type">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmType}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmType: e.target.value }))}
                  />
                </Field>
                <Field label="Account Holder">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.accountHolder}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, accountHolder: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="Bank Name">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.bankName}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, bankName: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="Account Number">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.accountNumber}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, accountNumber: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="IFSC">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.ifsc}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, ifsc: e.target.value } }))
                    }
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2">
                <button type="button" className={EXCEL_BTN_OUTLINE} onClick={() => setEditProfile(false)}>
                  Cancel
                </button>
                <button type="submit" className={EXCEL_BTN_PRIMARY} disabled={busy}>
                  {busy ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {stockModal ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className={`${EXCEL_PANEL} w-full max-w-md`}>
            <h3 className={EXCEL_PANEL_HEAD}>
              {stockModal.mode === 'add' ? 'Add Stock' : 'Remove Stock'}
            </h3>
            <div className="space-y-2 p-3 text-xs">
              <p>
                <span className="text-[#6B7280]">Product:</span>{' '}
                <strong>{stockModal.row.productName}</strong>
              </p>
              <p>
                <span className="text-[#6B7280]">Grade:</span> <strong>{stockModal.row.grade}</strong>
              </p>
              <p>
                <span className="text-[#6B7280]">Current Stock:</span>{' '}
                <strong>
                  {stockModal.row.currentStock} {stockModal.row.unit}
                </strong>
              </p>
              <label className="block">
                <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Quantity</span>
                <input
                  type="number"
                  min="1"
                  className={EXCEL_INPUT}
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  autoFocus
                />
              </label>
              {stockQty ? (
                <p className="text-[#6B7280]">
                  Updated Stock:{' '}
                  <strong className="text-[#1F2937]">
                    {Math.max(
                      0,
                      Number(stockModal.row.currentStock) +
                        (stockModal.mode === 'add' ? Number(stockQty) : -Number(stockQty)),
                    )}{' '}
                    {stockModal.row.unit}
                  </strong>
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                disabled={busy}
                onClick={() => {
                  setStockModal(null)
                  setStockQty('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={stockModal.mode === 'add' ? EXCEL_BTN_PRIMARY : EXCEL_BTN_DANGER}
                disabled={busy}
                onClick={async () => {
                  const qty = Number(stockQty)
                  if (!qty || qty <= 0) {
                    toast('Enter a valid quantity', 'error')
                    return
                  }
                  setBusy(true)
                  try {
                    await adjustFarmerStock({
                      farmerId,
                      productId: stockModal.row.productId,
                      gradeId: stockModal.row.gradeId,
                      change: stockModal.mode === 'add' ? qty : -qty,
                      updatedBy: 'Vendor',
                    })
                    toast(stockModal.mode === 'add' ? 'Stock added' : 'Stock removed')
                    setStockModal(null)
                    setStockQty('')
                    await load()
                  } catch (err) {
                    toast(err.message || 'Stock update failed', 'error')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {busy ? 'Saving…' : stockModal.mode === 'add' ? 'Add Stock' : 'Remove Stock'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">{label}</span>
      {children}
    </label>
  )
}
