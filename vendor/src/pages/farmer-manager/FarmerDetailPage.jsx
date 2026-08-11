import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { useVendor } from '@/context/VendorContext'
import {
  adjustFarmerStock,
  createFarmerProduct,
  deleteFarmerProduct,
  getFarmerById,
  getFarmerDocuments,
  getFarmerEarnings,
  getFarmerInventory,
  getFarmerOrders,
  getFarmerProducts,
  getManagers,
  getStockHistory,
  setFarmerStatus,
  updateFarmer,
  updateFarmerDocumentStatus,
  updateFarmerInventoryItem,
  updateFarmerProduct,
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

const CATEGORY_OPTIONS = [
  'Vegetables',
  'Fruits',
  'Grains & Pulses',
  'Dairy',
  'Spices',
  'Exotic Vegetables',
  'Herbs',
]

export default function FarmerDetailPage() {
  const { farmerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useVendor()
  const tab = searchParams.get('tab') || 'Overview'

  const [farmer, setFarmer] = useState(null)
  const [managers, setManagers] = useState([])
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [earnings, setEarnings] = useState({ summary: {}, transactions: [] })
  const [documents, setDocuments] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Profile Edit
  const [editProfile, setEditProfile] = useState(searchParams.get('edit') === '1')
  const [profileForm, setProfileForm] = useState(null)

  // Stock Add/Remove Modal
  const [stockModal, setStockModal] = useState(null)
  const [stockQty, setStockQty] = useState('')

  // Product Add/Edit Modal
  const [productModal, setProductModal] = useState(null) // { mode: 'add' | 'edit', row?: any }
  const [productForm, setProductForm] = useState(null)

  // Product Delete Modal
  const [deleteProductTarget, setDeleteProductTarget] = useState(null)

  // Inventory Item Edit Modal
  const [editInventoryModal, setEditInventoryModal] = useState(null) // row
  const [inventoryForm, setInventoryForm] = useState(null)

  // Document Reject Modal
  const [rejectDocModal, setRejectDocModal] = useState(null) // doc
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [f, mgrs, p, inv, o, e, d, h] = await Promise.all([
        getFarmerById(farmerId),
        getManagers(),
        getFarmerProducts(farmerId),
        getFarmerInventory(farmerId),
        getFarmerOrders(farmerId),
        getFarmerEarnings(farmerId),
        getFarmerDocuments(farmerId),
        getStockHistory(farmerId),
      ])
      setFarmer(f)
      setManagers(mgrs)
      setProducts(p)
      setInventory(inv)
      setOrders(o)
      setEarnings(e)
      setDocuments(d)
      setHistory(h)
      setProfileForm({
        name: f.name || '',
        managerId: f.managerId || '',
        mobile: f.mobile || '',
        email: f.email || '',
        farmName: f.farmName || '',
        farmLocation: f.farmLocation || '',
        farmAddress: f.farmAddress || '',
        farmArea: f.farmArea || '',
        farmType: f.farmType || 'Organic',
        status: f.status || 'Active',
        bank: {
          accountHolder: f.bank?.accountHolder || '',
          bankName: f.bank?.bankName || '',
          accountNumber: f.bank?.accountNumber || '',
          ifsc: f.bank?.ifsc || '',
        },
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

  // ----------------------------------------------------
  // Product Modal Open Helpers
  // ----------------------------------------------------
  const openAddProductModal = () => {
    setProductForm({
      name: '',
      category: 'Vegetables',
      subCategory: 'Fresh Produce',
      description: '',
      image: '',
      unit: 'Kg',
      harvestDate: new Date().toISOString().split('T')[0],
      produceType: 'organic',
      farmLocation: farmer.farmLocation || '',
      status: 'Approved',
      gradeAQty: 50,
      gradeBQty: 25,
      gradeCQty: 0,
    })
    setProductModal({ mode: 'add' })
  }

  const openEditProductModal = (row) => {
    setProductForm({
      id: row.id,
      name: row.name || '',
      category: row.category || 'Vegetables',
      subCategory: row.subCategory || '',
      description: row.description || '',
      image: row.image || row.imageUrl || '',
      unit: row.unit || 'Kg',
      harvestDate: row.harvestDate ? row.harvestDate.split('T')[0] : '',
      produceType: row.produceType || 'organic',
      farmLocation: row.farmLocation || '',
      status: row.status || 'Approved',
      gradeAQty: row.grades?.[0]?.quantity ?? 0,
      gradeBQty: row.grades?.[1]?.quantity ?? 0,
      gradeCQty: row.grades?.[2]?.quantity ?? 0,
    })
    setProductModal({ mode: 'edit', row })
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const grades = [
        { id: 'g-a', label: 'Grade A', quantity: Number(productForm.gradeAQty) || 0 },
        { id: 'g-b', label: 'Grade B', quantity: Number(productForm.gradeBQty) || 0 },
        { id: 'g-c', label: 'Grade C', quantity: Number(productForm.gradeCQty) || 0 },
      ]

      const payload = {
        name: productForm.name,
        category: productForm.category,
        subCategory: productForm.subCategory,
        description: productForm.description,
        image: productForm.image,
        unit: productForm.unit,
        harvestDate: productForm.harvestDate,
        produceType: productForm.produceType,
        farmLocation: productForm.farmLocation,
        status: productForm.status,
        grades,
      }

      if (productModal.mode === 'add') {
        await createFarmerProduct(farmerId, payload)
        toast('Product added for farmer')
      } else {
        await updateFarmerProduct(farmerId, productForm.id, payload)
        toast('Product updated')
      }

      setProductModal(null)
      await load()
    } catch (err) {
      toast(err.message || 'Product save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteProductConfirmed = async () => {
    if (!deleteProductTarget) return
    setBusy(true)
    try {
      await deleteFarmerProduct(farmerId, deleteProductTarget.id)
      toast('Product deleted')
      setDeleteProductTarget(null)
      await load()
    } catch (err) {
      toast(err.message || 'Delete failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  // ----------------------------------------------------
  // Inventory Edit Helper
  // ----------------------------------------------------
  const openEditInventoryModal = (row) => {
    setInventoryForm({
      id: row.id,
      productName: row.productName,
      grade: row.grade,
      currentStock: row.currentStock ?? 0,
      reservedStock: row.reservedStock ?? 0,
      soldStock: row.soldStock ?? 0,
      status: row.status || 'In Stock',
      unit: row.unit || 'Kg',
    })
    setEditInventoryModal(row)
  }

  const handleSaveInventoryItem = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await updateFarmerInventoryItem(farmerId, inventoryForm.id, {
        currentStock: Number(inventoryForm.currentStock) || 0,
        reservedStock: Number(inventoryForm.reservedStock) || 0,
        soldStock: Number(inventoryForm.soldStock) || 0,
        status: inventoryForm.status,
        unit: inventoryForm.unit,
      })
      toast('Inventory item updated')
      setEditInventoryModal(null)
      await load()
    } catch (err) {
      toast(err.message || 'Inventory update failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  // ----------------------------------------------------
  // Document Approval Helpers
  // ----------------------------------------------------
  const handleApproveDocument = async (doc) => {
    setBusy(true)
    try {
      await updateFarmerDocumentStatus(farmerId, doc.id, 'Approved', '')
      toast(`Document "${doc.name}" approved`)
      await load()
    } catch (err) {
      toast(err.message || 'Approval failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmRejectDocument = async () => {
    if (!rejectDocModal) return
    setBusy(true)
    try {
      await updateFarmerDocumentStatus(farmerId, rejectDocModal.id, 'Rejected', rejectReason)
      toast(`Document "${rejectDocModal.name}" rejected`)
      setRejectDocModal(null)
      setRejectReason('')
      await load()
    } catch (err) {
      toast(err.message || 'Rejection failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Columns Definitions
  const productColumns = [
    {
      key: 'image',
      header: 'Photo',
      width: '60px',
      render: (row) => (
        <img
          src={row.image || row.imageUrl || '/categories/grocery.webp'}
          alt={row.name}
          className="h-7 w-7 rounded border border-[#D4D4D4] object-cover"
          onError={(e) => {
            e.currentTarget.src = '/categories/grocery.webp'
          }}
        />
      ),
    },
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
      header: 'Grades Breakdown',
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
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={`${EXCEL_BTN_OUTLINE} py-0.5 px-1.5`}
            onClick={() => navigate(`/farmer-manager/farmers/${farmerId}/products/${row.id}`)}
          >
            View
          </button>
          <button
            type="button"
            className={`${EXCEL_BTN_PRIMARY} py-0.5 px-1.5`}
            onClick={() => openEditProductModal(row)}
          >
            Edit
          </button>
          <button
            type="button"
            className={`${EXCEL_BTN_DANGER} py-0.5 px-1.5`}
            onClick={() => setDeleteProductTarget(row)}
          >
            Del
          </button>
        </div>
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
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={`${EXCEL_BTN_PRIMARY} py-0.5 px-1.5`}
            onClick={() => setStockModal({ mode: 'add', row })}
          >
            + Add Stock
          </button>
          <button
            type="button"
            className={`${EXCEL_BTN_DANGER} py-0.5 px-1.5`}
            onClick={() => setStockModal({ mode: 'remove', row })}
          >
            Remove
          </button>
          <button
            type="button"
            className={`${EXCEL_BTN_OUTLINE} py-0.5 px-1.5`}
            onClick={() => openEditInventoryModal(row)}
          >
            Edit
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
        <span className={row.changedQuantity >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
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
      render: (row) => (
        <div className="flex gap-1">
          <button
            type="button"
            className={`${EXCEL_BTN_PRIMARY} py-0.5 px-1.5`}
            onClick={() => handleApproveDocument(row)}
            disabled={busy || row.status === 'Approved'}
          >
            Approve
          </button>
          <button
            type="button"
            className={`${EXCEL_BTN_DANGER} py-0.5 px-1.5`}
            onClick={() => {
              setRejectDocModal(row)
              setRejectReason(row.rejectionReason || '')
            }}
            disabled={busy || row.status === 'Rejected'}
          >
            Reject
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3 font-[Segoe_UI,Calibri,system-ui,sans-serif] text-[12px] text-[#1F2937]">
      {/* Header Bar */}
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
                <ExcelStatusBadge status={farmer.verificationStatus} />
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
            className={EXCEL_BTN_PRIMARY}
            onClick={() => {
              setTab('Profile')
              setEditProfile(true)
            }}
          >
            ✏️ Edit All Profile Fields
          </button>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab: Overview */}
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
                  { label: 'Assigned Manager', value: farmer.managerName },
                  { label: 'Mobile Number', value: farmer.mobile },
                  { label: 'Email', value: farmer.email },
                  { label: 'Status', value: farmer.status },
                  { label: 'Verification', value: farmer.verificationStatus },
                ]}
              />
            </section>
            <section className={EXCEL_PANEL}>
              <h2 className={EXCEL_PANEL_HEAD}>Farm & Bank Information</h2>
              <ExcelInfoGrid
                rows={[
                  { label: 'Farm Name', value: farmer.farmName },
                  { label: 'Farm Location', value: farmer.farmLocation },
                  { label: 'Farm Address', value: farmer.farmAddress },
                  { label: 'Farm Area', value: farmer.farmArea },
                  { label: 'Farm Type', value: farmer.farmType },
                  { label: 'Bank Name', value: farmer.bank?.bankName },
                  { label: 'Account Number', value: farmer.bank?.accountNumber },
                  { label: 'IFSC Code', value: farmer.bank?.ifsc },
                ]}
              />
            </section>
          </div>
        </div>
      ) : null}

      {/* Tab: Products */}
      {tab === 'Products' ? (
        <section className={EXCEL_PANEL}>
          <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
            <span>Farmer Products ({products.length})</span>
            <button
              type="button"
              className={EXCEL_BTN_PRIMARY}
              onClick={openAddProductModal}
            >
              + Add Product
            </button>
          </div>
          <ExcelDataTable
            columns={productColumns}
            rows={products}
            emptyMessage="No products for this farmer. Click '+ Add Product' to create one."
            onRowClick={(row) => navigate(`/farmer-manager/farmers/${farmerId}/products/${row.id}`)}
          />
        </section>
      ) : null}

      {/* Tab: Inventory */}
      {tab === 'Inventory' ? (
        <div className="space-y-3">
          <section className={EXCEL_PANEL}>
            <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
              <span>Inventory Stock</span>
              <button
                type="button"
                className={EXCEL_BTN_PRIMARY}
                onClick={openAddProductModal}
              >
                + Add New Product Stock
              </button>
            </div>
            <ExcelDataTable columns={inventoryColumns} rows={inventory} emptyMessage="No inventory rows." />
          </section>
          <section className={EXCEL_PANEL}>
            <h2 className={EXCEL_PANEL_HEAD}>Inventory Stock History</h2>
            <ExcelDataTable columns={historyColumns} rows={history} emptyMessage="No inventory history yet." />
          </section>
        </div>
      ) : null}

      {/* Tab: Orders */}
      {tab === 'Orders' ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Orders ({orders.length})</h2>
          <ExcelDataTable columns={orderColumns} rows={orders} emptyMessage="No orders for this farmer." />
        </section>
      ) : null}

      {/* Tab: Earnings */}
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

      {/* Tab: Documents */}
      {tab === 'Documents' ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Verification Documents</h2>
          <ExcelDataTable columns={docColumns} rows={documents} emptyMessage="No documents uploaded." />
        </section>
      ) : null}

      {/* Tab: Profile */}
      {tab === 'Profile' ? (
        <div className="space-y-3">
          {!editProfile || !profileForm ? (
            <>
              <section className={EXCEL_PANEL}>
                <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
                  <span>Personal Details</span>
                  <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => setEditProfile(true)}>
                    ✏️ Edit Profile Fields
                  </button>
                </div>
                <ExcelInfoGrid
                  rows={[
                    { label: 'Name', value: farmer.name },
                    { label: 'Assigned Manager', value: farmer.managerName },
                    { label: 'Mobile', value: farmer.mobile },
                    { label: 'Email', value: farmer.email },
                    { label: 'Status', value: farmer.status },
                    { label: 'Verification', value: farmer.verificationStatus },
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
              <h2 className={EXCEL_PANEL_HEAD}>Edit All Profile Fields</h2>
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                <Field label="Farmer Name">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Assigned Manager">
                  <select
                    className={EXCEL_SELECT}
                    value={profileForm.managerId}
                    onChange={(e) => setProfileForm((p) => ({ ...p, managerId: e.target.value }))}
                  >
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.location || 'Manager'})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Mobile Number">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm((p) => ({ ...p, mobile: e.target.value }))}
                  />
                </Field>
                <Field label="Email Address">
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
                <Field label="Farm Area (e.g. 5 acres)">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmArea}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmArea: e.target.value }))}
                  />
                </Field>
                <Field label="Farm Type">
                  <select
                    className={EXCEL_SELECT}
                    value={profileForm.farmType}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmType: e.target.value }))}
                  >
                    <option value="Organic">Organic</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Conventional">Conventional</option>
                  </select>
                </Field>
                <Field label="Farm Address" className="sm:col-span-2">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmAddress}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmAddress: e.target.value }))}
                  />
                </Field>
                <Field label="Account Holder Name">
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
                <Field label="IFSC Code">
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.ifsc}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, ifsc: e.target.value } }))
                    }
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
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

      {/* Stock Adjust Modal */}
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
            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
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
                      updatedBy: 'Vendor Manager',
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

      {/* Product Add/Edit Modal */}
      {productModal && productForm ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveProduct}
            className={`${EXCEL_PANEL} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
          >
            <h3 className={EXCEL_PANEL_HEAD}>
              {productModal.mode === 'add' ? 'Add New Product for Farmer' : 'Edit Product'}
            </h3>
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              <Field label="Product Name">
                <input
                  className={EXCEL_INPUT}
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Category">
                <select
                  className={EXCEL_SELECT}
                  value={productForm.category}
                  onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sub Category">
                <input
                  className={EXCEL_INPUT}
                  value={productForm.subCategory}
                  onChange={(e) => setProductForm((p) => ({ ...p, subCategory: e.target.value }))}
                />
              </Field>
              <Field label="Harvest Date">
                <input
                  type="date"
                  className={EXCEL_INPUT}
                  value={productForm.harvestDate}
                  onChange={(e) => setProductForm((p) => ({ ...p, harvestDate: e.target.value }))}
                />
              </Field>
              <Field label="Farm Location">
                <input
                  className={EXCEL_INPUT}
                  value={productForm.farmLocation}
                  onChange={(e) => setProductForm((p) => ({ ...p, farmLocation: e.target.value }))}
                />
              </Field>
              <Field label="Produce Type">
                <select
                  className={EXCEL_SELECT}
                  value={productForm.produceType}
                  onChange={(e) => setProductForm((p) => ({ ...p, produceType: e.target.value }))}
                >
                  <option value="organic">Organic</option>
                  <option value="non-organic">Non-Organic</option>
                </select>
              </Field>
              <Field label="Unit">
                <select
                  className={EXCEL_SELECT}
                  value={productForm.unit}
                  onChange={(e) => setProductForm((p) => ({ ...p, unit: e.target.value }))}
                >
                  <option value="Kg">Kg</option>
                  <option value="Gram">Gram</option>
                  <option value="Ton">Ton</option>
                  <option value="Piece">Piece</option>
                  <option value="Bunch">Bunch</option>
                </select>
              </Field>
              <Field label="Product Status">
                <select
                  className={EXCEL_SELECT}
                  value={productForm.status}
                  onChange={(e) => setProductForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Draft">Draft</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
              <Field label="Image URL / Photo" className="sm:col-span-2">
                <input
                  className={EXCEL_INPUT}
                  value={productForm.image}
                  onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                />
              </Field>
              <Field label="Grade A Qty">
                <input
                  type="number"
                  min="0"
                  className={EXCEL_INPUT}
                  value={productForm.gradeAQty}
                  onChange={(e) => setProductForm((p) => ({ ...p, gradeAQty: e.target.value }))}
                />
              </Field>
              <Field label="Grade B Qty">
                <input
                  type="number"
                  min="0"
                  className={EXCEL_INPUT}
                  value={productForm.gradeBQty}
                  onChange={(e) => setProductForm((p) => ({ ...p, gradeBQty: e.target.value }))}
                />
              </Field>
              <Field label="Grade C Qty">
                <input
                  type="number"
                  min="0"
                  className={EXCEL_INPUT}
                  value={productForm.gradeCQty}
                  onChange={(e) => setProductForm((p) => ({ ...p, gradeCQty: e.target.value }))}
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  rows={2}
                  className={EXCEL_INPUT}
                  value={productForm.description}
                  onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                disabled={busy}
                onClick={() => setProductModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className={EXCEL_BTN_PRIMARY} disabled={busy}>
                {busy ? 'Saving...' : productModal.mode === 'add' ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Delete Product Modal */}
      {deleteProductTarget ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className={`${EXCEL_PANEL} w-full max-w-sm`}>
            <h3 className={EXCEL_PANEL_HEAD}>Delete Product</h3>
            <div className="p-3 text-xs space-y-2">
              <p>Delete product <strong>{deleteProductTarget.name}</strong> for this farmer?</p>
              <p className="text-[#DC2626]">This will also remove associated inventory stock entries.</p>
            </div>
            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                disabled={busy}
                onClick={() => setDeleteProductTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={EXCEL_BTN_DANGER}
                disabled={busy}
                onClick={handleDeleteProductConfirmed}
              >
                {busy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Inventory Item Edit Modal */}
      {editInventoryModal && inventoryForm ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveInventoryItem}
            className={`${EXCEL_PANEL} w-full max-w-md`}
          >
            <h3 className={EXCEL_PANEL_HEAD}>Edit Inventory Item</h3>
            <div className="space-y-2 p-3 text-xs">
              <p>
                <span className="text-[#6B7280]">Product:</span> <strong>{inventoryForm.productName}</strong>
              </p>
              <p>
                <span className="text-[#6B7280]">Grade:</span> <strong>{inventoryForm.grade}</strong>
              </p>
              <Field label="Current Stock">
                <input
                  type="number"
                  min="0"
                  className={EXCEL_INPUT}
                  value={inventoryForm.currentStock}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, currentStock: e.target.value }))}
                />
              </Field>
              <Field label="Reserved Stock">
                <input
                  type="number"
                  min="0"
                  className={EXCEL_INPUT}
                  value={inventoryForm.reservedStock}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, reservedStock: e.target.value }))}
                />
              </Field>
              <Field label="Sold Stock">
                <input
                  type="number"
                  min="0"
                  className={EXCEL_INPUT}
                  value={inventoryForm.soldStock}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, soldStock: e.target.value }))}
                />
              </Field>
              <Field label="Unit">
                <select
                  className={EXCEL_SELECT}
                  value={inventoryForm.unit}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, unit: e.target.value }))}
                >
                  <option value="Kg">Kg</option>
                  <option value="Gram">Gram</option>
                  <option value="Ton">Ton</option>
                  <option value="Piece">Piece</option>
                  <option value="Bunch">Bunch</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  className={EXCEL_SELECT}
                  value={inventoryForm.status}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                disabled={busy}
                onClick={() => setEditInventoryModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className={EXCEL_BTN_PRIMARY} disabled={busy}>
                {busy ? 'Saving...' : 'Save Inventory'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Document Reject Modal */}
      {rejectDocModal ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className={`${EXCEL_PANEL} w-full max-w-md`}>
            <h3 className={EXCEL_PANEL_HEAD}>Reject Document: {rejectDocModal.name}</h3>
            <div className="p-3 text-xs space-y-2">
              <Field label="Rejection Reason">
                <textarea
                  rows={3}
                  className={EXCEL_INPUT}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for document rejection..."
                  required
                />
              </Field>
            </div>
            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                disabled={busy}
                onClick={() => setRejectDocModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={EXCEL_BTN_DANGER}
                disabled={busy || !rejectReason.trim()}
                onClick={handleConfirmRejectDocument}
              >
                {busy ? 'Saving...' : 'Confirm Rejection'}
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
