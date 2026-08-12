import { useEffect, useMemo, useState } from 'react'
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
  updateFarmerLoginStatus,
  updateFarmerPassword,
  updateFarmerProduct,
  getFarmerHarvestOrders,
  createFarmerHarvestOrder,
  updateFarmerHarvestOrder,
  deleteFarmerHarvestOrder,
} from '@/api/farmerManagerApi'
import { formatDate, formatDateTime } from '@/components/farmer-manager/FmShared'
import { ExcelDataTable, ExcelInfoGrid, ExcelStatCard, ExcelStatusBadge } from '@/components/farmer-manager/ExcelUi'
import FarmerPanelGradeChart from '@/components/farmer-manager/FarmerPanelGradeChart'
import FarmerImageUploadField from '@/components/farmer-manager/FarmerImageUploadField'
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_OUTLINE,
  EXCEL_BTN_PRIMARY,
  EXCEL_CELL,
  EXCEL_HEAD,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
  EXCEL_TAB,
  EXCEL_TAB_ACTIVE,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from '@/components/farmer-manager/excelStyles'
import { formatCurrency } from '@/lib/utils'

const TABS = ['Dashboard', 'Product', 'Harvest Order', 'Earning', 'Document', 'Profile']

const CATEGORY_OPTIONS = [
  'Vegetables',
  'Fruits',
  'Grains & Pulses',
  'Dairy',
  'Spices',
  'Exotic Vegetables',
  'Herbs',
]

const ORDER_STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

export default function FarmerDetailPage() {
  const { farmerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useVendor()
  const rawTab = searchParams.get('tab') || 'Dashboard'
  const tab = rawTab === 'Overview' ? 'Dashboard' : rawTab

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

  // Filters & State
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')

  // Profile Edit Form State
  const [editProfile, setEditProfile] = useState(searchParams.get('edit') === '1')
  const [profileForm, setProfileForm] = useState(null)

  // Stock Add/Remove Modal
  const [stockModal, setStockModal] = useState(null)
  const [stockQty, setStockQty] = useState('')

  // Product Add/Edit Modal
  const [productModal, setProductModal] = useState(null)
  const [productForm, setProductForm] = useState(null)

  // Product Delete Modal
  const [deleteProductTarget, setDeleteProductTarget] = useState(null)

  // Inventory Item Edit Modal
  const [editInventoryModal, setEditInventoryModal] = useState(null)
  const [inventoryForm, setInventoryForm] = useState(null)

  // Product Detail View State
  const [viewProductDetail, setViewProductDetail] = useState(null)

  // Document Reject Modal
  const [rejectDocModal, setRejectDocModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Harvest Orders State & Modal Form
  const [harvestOrders, setHarvestOrders] = useState([])
  const [harvestOrderModal, setHarvestOrderModal] = useState(null)
  const [harvestOrderForm, setHarvestOrderForm] = useState({
    productId: '',
    productName: '',
    category: 'Vegetables',
    date: new Date().toISOString().split('T')[0],
    day: 'Wednesday',
    unit: 'Kg',
    grades: [
      { name: 'A Grade', quantity: 0 },
      { name: 'B Grade', quantity: 0 },
    ],
    rejectionQty: 0,
    status: 'Approved',
  })

  // Order Details Modal
  const [viewOrderModal, setViewOrderModal] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [f, mgrs, p, inv, o, e, d, h, ho] = await Promise.all([
        getFarmerById(farmerId),
        getManagers(),
        getFarmerProducts(farmerId),
        getFarmerInventory(farmerId),
        getFarmerOrders(farmerId),
        getFarmerEarnings(farmerId),
        getFarmerDocuments(farmerId),
        getStockHistory(farmerId),
        getFarmerHarvestOrders(farmerId).catch(() => []),
      ])
      setFarmer(f)
      setManagers(mgrs)
      setProducts(p)
      setInventory(inv)
      setOrders(o)
      setEarnings(e)
      setDocuments(d)
      setHistory(h)
      setHarvestOrders(ho)

      if (p.length > 0 && !selectedProductId) {
        setSelectedProductId(p[0].id || p[0].productId)
      }

      setProfileForm({
        name: f.name || '',
        managerId: f.managerId || '',
        mobile: f.mobile || '',
        email: f.email || '',
        farmName: f.farmName || '',
        farmLocation: f.farmLocation || '',
        farmAddress: f.farmAddress || '',
        farmArea: f.farmArea || f.totalFarmArea || '',
        farmType: f.farmType || 'Organic',
        status: f.status || 'Active',
        bank: {
          accountHolder: f.bank?.accountHolder || f.bank?.accountHolderName || '',
          bankName: f.bank?.bankName || '',
          accountNumber: f.bank?.accountNumber || '',
          ifsc: f.bank?.ifsc || '',
        },
      })
    } catch (err) {
      setError(err.message || 'Failed to load farmer details')
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

  // Calculated Stats
  const dashboardStats = useMemo(() => {
    const totalProducts = products.length
    const availableStock = inventory.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0)
    const totalOrders = orders.length
    const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length
    const totalEarnings = earnings.summary?.totalEarnings || 0
    return { totalProducts, availableStock, totalOrders, pendingOrders, totalEarnings }
  }, [products, inventory, orders, earnings])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQ =
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
      const matchS = !productStatusFilter || p.status === productStatusFilter
      return matchQ && matchS
    })
  }, [products, productSearch, productStatusFilter])

  const selectedProduct = useMemo(
    () => products.find((p) => (p.id || p.productId) === selectedProductId) || products[0] || null,
    [products, selectedProductId]
  )

  const productHarvestOrders = useMemo(
    () =>
      harvestOrders.filter(
        (ho) =>
          ho.productId === (selectedProduct?.id || selectedProduct?.productId) ||
          ho.productName === selectedProduct?.name
      ),
    [harvestOrders, selectedProduct]
  )

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      return !orderStatusFilter || o.status === orderStatusFilter
    })
  }, [orders, orderStatusFilter])

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
    })
    setProductModal({ mode: 'add' })
  }

  const openEditProductModal = (product) => {
    setProductForm({
      id: product.id || product.productId,
      name: product.name || '',
      category: product.category || 'Vegetables',
      subCategory: product.subCategory || 'Fresh Produce',
      description: product.description || '',
      image: product.image || '',
      unit: product.unit || 'Kg',
      harvestDate: product.harvestDate || new Date().toISOString().split('T')[0],
      produceType: product.organic !== false ? 'organic' : 'non-organic',
      farmLocation: product.farmLocation || farmer.farmLocation || '',
      status: product.status || 'Approved',
      gradeAQty: product.gradeAQty ?? product.grades?.[0]?.quantity ?? 0,
      gradeBQty: product.gradeBQty ?? product.grades?.[1]?.quantity ?? 0,
    })
    setProductModal({ mode: 'edit', row: product })
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!productForm.name.trim()) {
      toast('Product name is required', 'error')
      return
    }
    setBusy(true)
    try {
      if (productModal.mode === 'add') {
        await createFarmerProduct(farmerId, productForm)
        toast('Product added successfully for farmer')
      } else {
        await updateFarmerProduct(farmerId, productForm.id, productForm)
        toast('Product updated successfully')
      }
      setProductModal(null)
      await load()
    } catch (err) {
      toast(err.message || 'Failed to save product', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteProductConfirmed = async () => {
    if (!deleteProductTarget) return
    setBusy(true)
    try {
      await deleteFarmerProduct(farmerId, deleteProductTarget.id || deleteProductTarget.productId)
      toast('Product deleted')
      setDeleteProductTarget(null)
      await load()
    } catch (err) {
      toast(err.message || 'Failed to delete product', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveInventoryItem = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await updateFarmerInventoryItem(farmerId, editInventoryModal.id, inventoryForm)
      toast('Inventory item updated')
      setEditInventoryModal(null)
      await load()
    } catch (err) {
      toast(err.message || 'Failed to update inventory', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDocumentApprove = async (docId) => {
    setBusy(true)
    try {
      await updateFarmerDocumentStatus(farmerId, docId, 'Approved')
      toast('Document approved')
      await load()
    } catch (err) {
      toast(err.message || 'Failed to approve document', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDocumentRejectConfirmed = async () => {
    if (!rejectDocModal) return
    setBusy(true)
    try {
      await updateFarmerDocumentStatus(farmerId, rejectDocModal.id, 'Rejected', rejectReason)
      toast('Document rejected')
      setRejectDocModal(null)
      setRejectReason('')
      await load()
    } catch (err) {
      toast(err.message || 'Failed to reject document', 'error')
    } finally {
      setBusy(false)
    }
  }

  // ----------------------------------------------------
  // Columns Specifications
  // ----------------------------------------------------
  const productColumns = [
    {
      key: 'image',
      label: 'Photo',
      render: (row) => (
        <img
          src={row.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop'}
          alt={row.name}
          className="h-9 w-9 rounded object-cover border border-[#D4D4D4]"
        />
      ),
    },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    {
      key: 'harvestDate',
      label: 'Harvest Date',
      render: (row) => formatDate(row.harvestDate),
    },
    { key: 'farmLocation', label: 'Farm Location' },
    {
      key: 'organic',
      label: 'Type',
      render: (row) => (
        <span className="font-medium text-[#217346]">
          {row.organic !== false ? 'Organic' : 'Non-Organic'}
        </span>
      ),
    },
    {
      key: 'gradeAQty',
      label: 'Grade A Qty',
      align: 'right',
      render: (row) => `${row.gradeAQty ?? row.grades?.[0]?.quantity ?? 0} ${row.unit || 'Kg'}`,
    },
    {
      key: 'gradeBQty',
      label: 'Grade B Qty',
      align: 'right',
      render: (row) => `${row.gradeBQty ?? row.grades?.[1]?.quantity ?? 0} ${row.unit || 'Kg'}`,
    },
    {
      key: 'availableQuantity',
      label: 'Available Stock',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-[#217346]">
          {(Number(row.gradeAQty ?? row.grades?.[0]?.quantity ?? 0) + Number(row.gradeBQty ?? row.grades?.[1]?.quantity ?? 0))} {row.unit || 'Kg'}
        </span>
      ),
    },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" className={EXCEL_BTN} onClick={() => openEditProductModal(row)}>
            Edit
          </button>
          <button type="button" className={EXCEL_BTN_DANGER} onClick={() => setDeleteProductTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ]

  const inventoryColumns = [
    { key: 'productName', label: 'Product Name' },
    { key: 'grade', label: 'Grade' },
    {
      key: 'currentStock',
      label: 'Current Stock',
      align: 'right',
      render: (row) => (
        <span className="font-bold">{row.currentStock} {row.unit}</span>
      ),
    },
    {
      key: 'reservedStock',
      label: 'Reserved',
      align: 'right',
      render: (row) => `${row.reservedStock || 0} ${row.unit}`,
    },
    {
      key: 'soldStock',
      label: 'Sold Stock',
      align: 'right',
      render: (row) => `${row.soldStock || 0} ${row.unit}`,
    },
    { key: 'status', label: 'Stock Status', type: 'badge' },
    {
      key: 'actions',
      label: 'Adjust Stock',
      render: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={EXCEL_BTN_PRIMARY}
            onClick={() => setStockModal({ row, mode: 'add' })}
          >
            + Add Stock
          </button>
          <button
            type="button"
            className={EXCEL_BTN_DANGER}
            onClick={() => setStockModal({ row, mode: 'remove' })}
          >
            - Remove
          </button>
        </div>
      ),
    },
  ]

  const historyColumns = [
    { key: 'date', label: 'Date & Time', render: (row) => formatDateTime(row.date) },
    { key: 'productName', label: 'Product' },
    { key: 'grade', label: 'Grade' },
    { key: 'type', label: 'Action Type' },
    {
      key: 'change',
      label: 'Stock Change',
      align: 'right',
      render: (row) => (
        <span className={row.change > 0 ? 'font-bold text-[#217346]' : 'font-bold text-[#DC2626]'}>
          {row.change > 0 ? `+${row.change}` : row.change}
        </span>
      ),
    },
    { key: 'previousStock', label: 'Prev Stock', align: 'right' },
    { key: 'newStock', label: 'New Stock', align: 'right' },
    { key: 'updatedBy', label: 'Updated By' },
  ]

  const orderColumns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customerName', label: 'Customer', render: (row) => row.customer?.name || row.customerName || '—' },
    { key: 'productName', label: 'Product', render: (row) => row.products?.[0]?.name || row.productName || '—' },
    { key: 'quantity', label: 'Qty', align: 'right', render: (row) => `${row.quantity || row.products?.[0]?.quantity || 1} ${row.unit || 'Kg'}` },
    { key: 'amount', label: 'Amount', align: 'right', render: (row) => <span className="font-bold">{formatCurrency(row.amount)}</span> },
    { key: 'deliveryType', label: 'Delivery' },
    { key: 'status', label: 'Order Status', type: 'badge' },
    { key: 'orderDate', label: 'Order Date', render: (row) => formatDate(row.orderDate) },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => setViewOrderModal(row)}>
          View Order
        </button>
      ),
    },
  ]

  const txnColumns = [
    { key: 'id', label: 'Transaction ID' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'amount', label: 'Gross Amount', align: 'right', render: (row) => formatCurrency(row.amount) },
    { key: 'commission', label: 'Commission', align: 'right', render: (row) => formatCurrency(row.commission) },
    { key: 'netEarnings', label: 'Net Earnings', align: 'right', render: (row) => <span className="font-bold text-[#217346]">{formatCurrency(row.netEarnings)}</span> },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
  ]

  const docColumns = [
    { key: 'name', label: 'Document Name' },
    { key: 'fileName', label: 'File Name', render: (row) => row.fileName || 'Not uploaded' },
    { key: 'uploadedAt', label: 'Uploaded Date', render: (row) => formatDate(row.uploadedAt) },
    { key: 'status', label: 'Verification Status', type: 'badge' },
    {
      key: 'actions',
      label: 'Verification Actions',
      render: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {row.fileName ? (
            <a href={row.fileUrl || '#'} download={row.fileName} className={EXCEL_BTN}>
              Download
            </a>
          ) : null}
          {row.status !== 'Approved' ? (
            <button
              type="button"
              className={EXCEL_BTN_PRIMARY}
              onClick={() => handleDocumentApprove(row.id)}
            >
              Approve
            </button>
          ) : null}
          {row.status !== 'Rejected' ? (
            <button
              type="button"
              className={EXCEL_BTN_DANGER}
              onClick={() => {
                setRejectDocModal(row)
                setRejectReason('')
              }}
            >
              Reject
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header & Farmer Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D4D4D4] pb-3">
        <div>
          <Link to="/farmer-manager/farmers" className="text-xs font-semibold text-primary">
            ← Back to All Farmers
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-xl font-bold text-text-primary">{farmer.name}</h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                farmer.status === 'Active' ? 'bg-[#E8F5E9] text-[#217346]' : 'bg-[#FEE2E2] text-[#DC2626]'
              }`}
            >
              {farmer.status}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Manager: <strong>{farmer.managerName || 'Unassigned'}</strong> · Mobile: <strong>{farmer.mobile}</strong> · Location: <strong>{farmer.farmLocation || 'N/A'}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={EXCEL_BTN_OUTLINE}
            onClick={() => setTab('Profile')}
          >
            🔑 Credentials & Profile
          </button>
          <button
            type="button"
            className={EXCEL_BTN_PRIMARY}
            onClick={openAddProductModal}
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Excel Sheet Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[#D4D4D4]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={tab === t ? EXCEL_TAB_ACTIVE : EXCEL_TAB}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1: Dashboard / Overview */}
      {tab === 'Dashboard' ? (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <ExcelStatCard title="Total Products" value={dashboardStats.totalProducts} />
            <ExcelStatCard title="Available Stock" value={`${dashboardStats.availableStock} Kg`} />
            <ExcelStatCard title="Total Orders" value={dashboardStats.totalOrders} />
            <ExcelStatCard title="Pending Orders" value={dashboardStats.pendingOrders} />
            <ExcelStatCard title="Total Earnings" value={formatCurrency(dashboardStats.totalEarnings)} />
          </div>

          <section className={`${EXCEL_PANEL} p-3`}>
            <FarmerPanelGradeChart
              rows={farmer.dailyChartRows || []}
              summary={{
                totalRupees: dashboardStats.totalEarnings,
                deposited: Math.round(dashboardStats.totalEarnings * 0.7),
                balance: Math.round(dashboardStats.totalEarnings * 0.3),
              }}
              title="All Products Spreadsheet Grade Chart"
            />
          </section>

          <section className={EXCEL_PANEL}>
            <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
              <span>Product Wise Grade Spreadsheet</span>
              {products.length > 0 ? (
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={EXCEL_SELECT}
                >
                  {products.map((item) => (
                    <option key={item.id || item.productId} value={item.id || item.productId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            {selectedProduct ? (
              <div className="p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">{selectedProduct.name}</h3>
                    <p className="text-xs text-text-secondary">Category: {selectedProduct.category} · Unit: {selectedProduct.unit}</p>
                  </div>
                </div>
                <FarmerPanelGradeChart
                  rows={selectedProduct.dailyChartRows || farmer.dailyChartRows || []}
                  summary={{
                    totalRupees: productHarvestOrders.reduce((sum, ho) => sum + (ho.grades || []).reduce((gSum, g) => gSum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0), 0),
                    deposited: Math.round(productHarvestOrders.reduce((sum, ho) => sum + (ho.grades || []).reduce((gSum, g) => gSum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0), 0) * 0.7),
                    balance: productHarvestOrders.reduce((sum, ho) => sum + (ho.grades || []).reduce((gSum, g) => gSum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0), 0) - Math.round(productHarvestOrders.reduce((sum, ho) => sum + (ho.grades || []).reduce((gSum, g) => gSum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0), 0) * 0.7),
                  }}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-text-secondary">No products available for this farmer.</div>
            )}
          </section>
        </div>
      ) : null}

      {/* Tab 2: Product */}
      {tab === 'Product' || tab === 'Products' ? (
        <section className={EXCEL_PANEL}>
          <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
            <span>Products Management</span>
            <button type="button" className={EXCEL_BTN_PRIMARY} onClick={openAddProductModal}>
              + Add Product
            </button>
          </div>
          <div className="p-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                placeholder="Search products by name or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className={`${EXCEL_INPUT} max-w-xs`}
              />
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                className={EXCEL_SELECT}
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <ExcelDataTable
              columns={productColumns}
              rows={filteredProducts}
              emptyMessage="No products match your query."
            />
          </div>
        </section>
      ) : null}

      {/* Tab 3: Harvest Order */}
      {tab === 'Harvest Order' || tab === 'Orders' || tab === 'Inventory' ? (
        <section className={EXCEL_PANEL}>
          <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
            <span>Harvest Orders Management</span>
            <button
              type="button"
              className={EXCEL_BTN_PRIMARY}
              onClick={() => {
                const defaultProduct = products[0] || {}
                const defaultDate = new Date().toISOString().split('T')[0]
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                const dayName = days[new Date(defaultDate).getDay()]

                setHarvestOrderForm({
                  productId: defaultProduct.id || defaultProduct.productId || '',
                  productName: defaultProduct.name || '',
                  category: defaultProduct.category || 'Vegetables',
                  date: defaultDate,
                  day: dayName,
                  unit: defaultProduct.unit || 'Kg',
                  grades: [
                    { name: 'A Grade', quantity: 0 },
                    { name: 'B Grade', quantity: 0 },
                  ],
                  rejectionQty: 0,
                  status: 'Approved',
                })
                setHarvestOrderModal({ mode: 'add' })
              }}
            >
              + Create Harvest Order
            </button>
          </div>
          <div className="p-3">
            {harvestOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-secondary">
                No harvest orders created yet. Click "+ Create Harvest Order" to issue a new harvest record for this farmer.
              </div>
            ) : (
              <div className={EXCEL_WRAP}>
                <table className={EXCEL_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${EXCEL_HEAD} text-center`}>Sr.</th>
                      <th className={`${EXCEL_HEAD} text-left`}>Date</th>
                      <th className={`${EXCEL_HEAD} text-left`}>Day</th>
                      <th className={`${EXCEL_HEAD} text-left`}>Product</th>
                      <th className={`${EXCEL_HEAD} text-left`}>Category</th>
                      <th className={`${EXCEL_HEAD} text-center`}>Unit</th>
                      {Array.from(new Set(harvestOrders.flatMap(h => (h.grades || []).map(g => g.name)))).map(g => (
                        <th key={g} className={`${EXCEL_HEAD} text-right`}>{g} Qty</th>
                      ))}
                      <th className={`${EXCEL_HEAD} text-right text-red-600`}>Rejection Qty</th>
                      <th className={`${EXCEL_HEAD} text-center`}>Status</th>
                      <th className={`${EXCEL_HEAD} text-center`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {harvestOrders.map((ho, idx) => {
                      const dynamicGrades = Array.from(new Set(harvestOrders.flatMap(h => (h.grades || []).map(g => g.name))))
                      const gradeMap = {}
                      ;(ho.grades || []).forEach(g => { gradeMap[g.name] = g.quantity })

                      return (
                        <tr key={ho.id || idx} className="hover:bg-[#F9F9F9]">
                          <td className={`${EXCEL_CELL} text-center text-text-secondary`}>{idx + 1}</td>
                          <td className={`${EXCEL_CELL} font-medium`}>{ho.date || '—'}</td>
                          <td className={`${EXCEL_CELL} text-text-secondary`}>{ho.day || '—'}</td>
                          <td className={`${EXCEL_CELL} font-bold text-text-primary`}>{ho.productName}</td>
                          <td className={`${EXCEL_CELL} text-text-secondary`}>{ho.category}</td>
                          <td className={`${EXCEL_CELL} text-center text-text-secondary`}>{ho.unit}</td>
                          {dynamicGrades.map(g => (
                            <td key={g} className={`${EXCEL_CELL} text-right tabular-nums font-semibold`}>
                              {gradeMap[g] !== undefined ? `${gradeMap[g]} ${ho.unit}` : `0 ${ho.unit}`}
                            </td>
                          ))}
                          <td className={`${EXCEL_CELL} text-right tabular-nums font-bold text-red-600`}>
                            {ho.rejectionQty || 0} {ho.unit}
                          </td>
                          <td className={`${EXCEL_CELL} text-center`}>
                            <ExcelStatusBadge status={ho.status || 'Approved'} />
                          </td>
                          <td className={`${EXCEL_CELL} text-center`}>
                            <div className="flex justify-center gap-1">
                              <button
                                type="button"
                                className={EXCEL_BTN}
                                onClick={() => {
                                  setHarvestOrderForm({ ...ho })
                                  setHarvestOrderModal({ mode: 'edit', id: ho.id })
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={EXCEL_BTN_DANGER}
                                onClick={async () => {
                                  if (!confirm('Delete harvest order?')) return
                                  setBusy(true)
                                  try {
                                    await deleteFarmerHarvestOrder(farmerId, ho.id)
                                    toast('Harvest order deleted')
                                    await load()
                                  } catch (err) {
                                    toast(err.message || 'Delete failed', 'error')
                                  } finally {
                                    setBusy(false)
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Tab 5: Earning */}
      {tab === 'Earning' || tab === 'Earnings' ? (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ExcelStatCard title="Total Earnings" value={formatCurrency(earnings.summary?.totalEarnings || 0)} />
            <ExcelStatCard title="Available Balance" value={formatCurrency(earnings.summary?.availableBalance || earnings.summary?.availableEarnings || 0)} />
            <ExcelStatCard title="Pending Payments" value={formatCurrency(earnings.summary?.pendingPayments || earnings.summary?.pendingEarnings || 0)} />
            <ExcelStatCard title="Total Products" value={products.length} />
          </div>

          {/* Product-Wise Earning Selector & Spreadsheet */}
          <section className={EXCEL_PANEL}>
            <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
              <span>Product-Wise Earning Spreadsheet</span>
              {products.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B7280]">Select Product:</span>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className={EXCEL_SELECT}
                  >
                    {products.map((item) => (
                      <option key={item.id || item.productId} value={item.id || item.productId}>
                        {item.name} ({item.category})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            {selectedProduct ? (
              <div className="p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937]">{selectedProduct.name}</h3>
                    <p className="text-xs text-[#6B7280]">Category: {selectedProduct.category} · Location: {selectedProduct.farmLocation || "N/A"}</p>
                  </div>
                </div>

                <FarmerPanelGradeChart
                  rows={productHarvestOrders.length > 0 ? productHarvestOrders.map((ho, idx) => ({
                    id: ho.id || ho._id || idx,
                    srNo: idx + 1,
                    date: ho.date,
                    weekday: ho.day,
                    unit: ho.unit || "Kg",
                    grades: (ho.grades || []).map((g) => ({
                      name: g.name,
                      quantity: Number(g.quantity || 0),
                      rate: g.rate !== null && g.rate !== undefined && g.rate !== '' ? Number(g.rate) : null,
                    })),
                    rejectionQty: Number(ho.rejectionQty || 0),
                  })) : []}
                  summary={{
                    totalRupees: productHarvestOrders.reduce((sum, ho) => sum + (ho.grades || []).reduce((gSum, g) => gSum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0), 0),
                    deposited: Math.round(productHarvestOrders.reduce((sum, ho) => sum + (ho.grades || []).reduce((gSum, g) => gSum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0), 0) * 0.7),
                    balance: productHarvestOrders.reduce((sum, ho) => sum + (ho.grades || []).reduce((gSum, g) => gSum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0), 0) - Math.round(productHarvestOrders.reduce((sum, ho) => sum + (ho.grades || []).reduce((gSum, g) => gSum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0), 0) * 0.7),
                  }}
                  onSave={async (updatedRows) => {
                    try {
                      for (const r of updatedRows) {
                        if (r.id) {
                          await updateFarmerHarvestOrder(farmer.id, r.id, {
                            grades: r.grades,
                            rejectionQty: r.rejectionQty,
                            date: r.date,
                            day: r.weekday || getDayOfWeek(r.date),
                          })
                        }
                      }
                      toast.success("Rates and earning record updated successfully!")
                      load()
                    } catch (err) {
                      toast.error(err?.message || "Failed to update earning record rates")
                    }
                  }}
                  onDeleteRow={async (id) => {
                    try {
                      setBusy(true)
                      await deleteFarmerHarvestOrder(farmer.id, id)
                      toast.success("Harvest order deleted")
                      load()
                    } catch (err) {
                      toast.error(err?.message || "Failed to delete harvest order")
                    } finally {
                      setBusy(false)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#6B7280]">
                No products found for this farmer.
              </div>
            )}
          </section>

          <section className={EXCEL_PANEL}>
            <h2 className={EXCEL_PANEL_HEAD}>Bank Settlement Details</h2>
            <ExcelInfoGrid
              rows={[
                { label: 'Bank Account', value: farmer.bank?.accountNumber || '—' },
                { label: 'Bank Name', value: farmer.bank?.bankName || '—' },
                { label: 'Account Holder', value: farmer.bank?.accountHolder || farmer.name },
                { label: 'IFSC Code', value: farmer.bank?.ifsc || '—' },
              ]}
            />
          </section>
          <section className={EXCEL_PANEL}>
            <h2 className={EXCEL_PANEL_HEAD}>Transaction History Log</h2>
            <ExcelDataTable columns={txnColumns} rows={earnings.transactions || []} emptyMessage="No earnings transactions recorded." />
          </section>
        </div>
      ) : null}

      {/* Tab 6: Document */}
      {tab === 'Document' || tab === 'Documents' ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Farmer Documents & Verification Status</h2>
          <ExcelDataTable columns={docColumns} rows={documents} emptyMessage="No documents submitted." />
        </section>
      ) : null}

      {/* Tab 7: Profile */}
      {tab === 'Profile' ? (
        <div className="space-y-4">
          <section className={EXCEL_PANEL}>
            <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
              <span>Login Credentials & Security Access</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className={farmer.loginEnabled !== false ? EXCEL_BTN_DANGER : EXCEL_BTN_PRIMARY}
                  onClick={async () => {
                    try {
                      const nextStatus = !farmer.loginEnabled
                      const updated = await updateFarmerLoginStatus(farmer.id, nextStatus)
                      setFarmer(updated)
                      toast(`Farmer login ${nextStatus ? 'enabled' : 'disabled'}`)
                    } catch (err) {
                      toast(err.message || 'Failed to update login status', 'error')
                    }
                  }}
                >
                  {farmer.loginEnabled !== false ? 'Disable Login' : 'Enable Login'}
                </button>
                <button
                  type="button"
                  className={EXCEL_BTN_OUTLINE}
                  onClick={async () => {
                    const pass = prompt('Enter new password for farmer (minimum 4 characters):')
                    if (pass === null) return
                    if (pass.length < 4) {
                      toast('Password must be at least 4 characters long', 'error')
                      return
                    }
                    try {
                      await updateFarmerPassword(farmer.id, pass)
                      toast('Farmer password updated successfully')
                    } catch (err) {
                      toast(err.message || 'Failed to update password', 'error')
                    }
                  }}
                >
                  🔑 Reset Password
                </button>
              </div>
            </div>
            <ExcelInfoGrid
              rows={[
                { label: 'Mobile (Login ID)', value: farmer.mobile },
                { label: 'Password Hash', value: '•••••••• (Encrypted in MongoDB)' },
                {
                  label: 'Login Access',
                  value: farmer.loginEnabled !== false ? 'Enabled' : 'Disabled (Blocked)',
                },
              ]}
            />
          </section>

          {!editProfile || !profileForm ? (
            <>
              <section className={EXCEL_PANEL}>
                <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
                  <span>Personal Information</span>
                  <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => setEditProfile(true)}>
                    ✏️ Edit Profile
                  </button>
                </div>
                <ExcelInfoGrid
                  rows={[
                    { label: 'Name', value: farmer.name },
                    { label: 'Assigned Manager', value: farmer.managerName },
                    { label: 'Mobile', value: farmer.mobile },
                    { label: 'Email', value: farmer.email || '—' },
                    { label: 'Status', value: farmer.status },
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
              <section className={EXCEL_PANEL}>
                <h2 className={EXCEL_PANEL_HEAD}>Bank Details</h2>
                <ExcelInfoGrid
                  rows={[
                    { label: 'Account Holder', value: farmer.bank?.accountHolder || farmer.name },
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
              <h2 className={EXCEL_PANEL_HEAD}>Edit Farmer Profile</h2>
              <div className="grid gap-2 p-3 sm:grid-cols-2 text-xs">
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Farmer Name</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Assigned Manager</span>
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
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Mobile Number</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm((p) => ({ ...p, mobile: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Email Address</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Status</span>
                  <select
                    className={EXCEL_SELECT}
                    value={profileForm.status}
                    onChange={(e) => setProfileForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Farm Name</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmName: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Farm Location</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmLocation}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmLocation: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Farm Area</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmArea}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmArea: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Farm Type</span>
                  <select
                    className={EXCEL_SELECT}
                    value={profileForm.farmType}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmType: e.target.value }))}
                  >
                    <option value="Organic">Organic</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Conventional">Conventional</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Farm Address</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.farmAddress}
                    onChange={(e) => setProfileForm((p) => ({ ...p, farmAddress: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Account Holder Name</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.accountHolder}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, accountHolder: e.target.value } }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Bank Name</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.bankName}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, bankName: e.target.value } }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Account Number</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.accountNumber}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, accountNumber: e.target.value } }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">IFSC Code</span>
                  <input
                    className={EXCEL_INPUT}
                    value={profileForm.bank.ifsc}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, bank: { ...p.bank, ifsc: e.target.value } }))
                    }
                  />
                </label>
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
            className={`${EXCEL_PANEL} w-full max-w-3xl max-h-[90vh] overflow-y-auto`}
          >
            <h3 className={EXCEL_PANEL_HEAD}>
              {productModal.mode === 'add' ? 'Add Product' : 'Edit Product'}
            </h3>
            <div className="space-y-3 p-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Product Name</span>
                  <input
                    className={EXCEL_INPUT}
                    value={productForm.name}
                    onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Product Name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Category</span>
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
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Harvest Date</span>
                  <input
                    type="date"
                    className={EXCEL_INPUT}
                    value={productForm.harvestDate}
                    onChange={(e) => setProductForm((p) => ({ ...p, harvestDate: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Farm Location</span>
                  <input
                    className={EXCEL_INPUT}
                    value={productForm.farmLocation}
                    onChange={(e) => setProductForm((p) => ({ ...p, farmLocation: e.target.value }))}
                    placeholder="Location"
                  />
                </label>
              </div>

              <FarmerImageUploadField
                label="Product Photo (Camera or Upload)"
                value={productForm.image}
                onChange={(url) => setProductForm((p) => ({ ...p, image: url }))}
              />
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
                {busy ? 'Saving...' : 'Save Product'}
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

      {/* Harvest Order Modal */}
      {harvestOrderModal && harvestOrderForm ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                if (harvestOrderModal.mode === 'add') {
                  await createFarmerHarvestOrder(farmerId, harvestOrderForm)
                  toast('Harvest order created')
                } else {
                  await updateFarmerHarvestOrder(farmerId, harvestOrderModal.id, harvestOrderForm)
                  toast('Harvest order updated')
                }
                setHarvestOrderModal(null)
                await load()
              } catch (err) {
                toast(err.message || 'Failed to save harvest order', 'error')
              } finally {
                setBusy(false)
              }
            }}
            className={`${EXCEL_PANEL} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
          >
            <h3 className={EXCEL_PANEL_HEAD}>
              {harvestOrderModal.mode === 'add' ? 'Create Harvest Order' : 'Edit Harvest Order'}
            </h3>
            <div className="space-y-3 p-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Select Product</span>
                  <select
                    className={EXCEL_SELECT}
                    value={harvestOrderForm.productId}
                    onChange={(e) => {
                      const pid = e.target.value
                      const prod = products.find((p) => (p.id || p.productId) === pid)
                      setHarvestOrderForm((f) => ({
                        ...f,
                        productId: pid,
                        productName: prod ? prod.name : '',
                        category: prod ? prod.category : f.category,
                        unit: prod ? (prod.unit || 'Kg') : f.unit,
                      }))
                    }}
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id || p.productId} value={p.id || p.productId}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Category (Auto-Populated)</span>
                  <input
                    className={`${EXCEL_INPUT} bg-[#F2F2F2]`}
                    value={harvestOrderForm.category}
                    readOnly
                  />
                </label>

                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Date</span>
                  <input
                    type="date"
                    className={EXCEL_INPUT}
                    value={harvestOrderForm.date}
                    onChange={(e) => {
                      const dStr = e.target.value
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                      const dObj = new Date(dStr)
                      const dayName = isNaN(dObj.getTime()) ? '' : days[dObj.getDay()]
                      setHarvestOrderForm((f) => ({ ...f, date: dStr, day: dayName }))
                    }}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Day (Auto-Calculated)</span>
                  <input
                    className={`${EXCEL_INPUT} bg-[#F2F2F2]`}
                    value={harvestOrderForm.day}
                    readOnly
                  />
                </label>

                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#6B7280]">Product Unit</span>
                  <select
                    className={EXCEL_SELECT}
                    value={harvestOrderForm.unit}
                    onChange={(e) => setHarvestOrderForm((f) => ({ ...f, unit: e.target.value }))}
                  >
                    <option value="Kg">Kg</option>
                    <option value="Quintal">Quintal</option>
                    <option value="Ton">Ton</option>
                    <option value="Piece">Piece</option>
                    <option value="Bunch">Bunch</option>
                    <option value="Litre">Litre</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-0.5 block font-semibold text-[#DC2626]">Rejection Qty</span>
                  <input
                    type="number"
                    min="0"
                    className={EXCEL_INPUT}
                    value={harvestOrderForm.rejectionQty}
                    onChange={(e) => setHarvestOrderForm((f) => ({ ...f, rejectionQty: Number(e.target.value) }))}
                  />
                </label>
              </div>

              {/* Dynamic Grades Section */}
              <div className="border border-[#D4D4D4] bg-[#FAFAFA] p-3 rounded">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-[#1F2937]">Dynamic Grades Configuration</span>
                  <button
                    type="button"
                    className={`${EXCEL_BTN_PRIMARY} py-0.5 px-2 text-xs`}
                    onClick={() => {
                      const grades = harvestOrderForm.grades || []
                      const nextGradeLetter = String.fromCharCode(65 + grades.length) + ' Grade'
                      setHarvestOrderForm((f) => ({
                        ...f,
                        grades: [...(f.grades || []), { name: nextGradeLetter, quantity: 0 }],
                      }))
                    }}
                  >
                    + Add Grade
                  </button>
                </div>

                <div className="space-y-2">
                  {(harvestOrderForm.grades || []).map((g, gIdx) => (
                    <div key={gIdx} className="flex flex-wrap items-center gap-2 bg-white p-2 border border-[#E5E7EB]">
                      <div className="flex-1 min-w-[120px]">
                        <span className="block text-[10px] font-semibold text-[#6B7280]">Grade Name</span>
                        <input
                          className={EXCEL_INPUT}
                          value={g.name}
                          onChange={(e) => {
                            const val = e.target.value
                            setHarvestOrderForm((f) => {
                              const newG = [...f.grades]
                              newG[gIdx].name = val
                              return { ...f, grades: newG }
                            })
                          }}
                        />
                      </div>
                      <div className="w-28">
                        <span className="block text-[10px] font-semibold text-[#6B7280]">Quantity ({harvestOrderForm.unit})</span>
                        <input
                          type="number"
                          min="0"
                          className={EXCEL_INPUT}
                          value={g.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setHarvestOrderForm((f) => {
                              const newG = [...f.grades]
                              newG[gIdx].quantity = val
                              return { ...f, grades: newG }
                            })
                          }}
                        />
                      </div>
                      {harvestOrderForm.grades.length > 1 ? (
                        <button
                          type="button"
                          className={`${EXCEL_BTN_DANGER} self-end py-1 px-2 text-xs`}
                          onClick={() => {
                            setHarvestOrderForm((f) => ({
                              ...f,
                              grades: f.grades.filter((_, idx) => idx !== gIdx),
                            }))
                          }}
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                disabled={busy}
                onClick={() => setHarvestOrderModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className={EXCEL_BTN_PRIMARY} disabled={busy}>
                {busy ? 'Saving...' : harvestOrderModal.mode === 'add' ? 'Save Harvest Order' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Order Details View Modal */}
      {viewOrderModal ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className={`${EXCEL_PANEL} w-full max-w-lg`}>
            <h3 className={EXCEL_PANEL_HEAD}>Order Details: {viewOrderModal.id}</h3>
            <div className="p-3 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <div>
                  <span className="text-[#6B7280]">Customer Name:</span>
                  <p className="font-bold text-[#1F2937]">{viewOrderModal.customer?.name || viewOrderModal.customerName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Delivery Type:</span>
                  <p className="font-bold text-[#1F2937]">{viewOrderModal.deliveryType || 'Standard'}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Order Date:</span>
                  <p className="font-bold text-[#1F2937]">{formatDate(viewOrderModal.orderDate)}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Order Status:</span>
                  <div className="mt-0.5">
                    <ExcelStatusBadge status={viewOrderModal.status} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#1F2937] mb-1">Products Ordered</h4>
                <div className="rounded border bg-[#F9F9F9] p-2 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{viewOrderModal.products?.[0]?.name || viewOrderModal.productName || 'Farm Product'}</span>
                    <span>{formatCurrency(viewOrderModal.amount)}</span>
                  </div>
                  <p className="text-[#6B7280]">
                    Quantity: {viewOrderModal.quantity || viewOrderModal.products?.[0]?.quantity || 1} {viewOrderModal.unit || 'Kg'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#1F2937] mb-1">Delivery Address</h4>
                <p className="text-[#6B7280]">
                  {viewOrderModal.customer?.address || viewOrderModal.deliveryAddress || 'Address on file'}
                </p>
              </div>
            </div>
            <div className="flex justify-end border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                onClick={() => setViewOrderModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Document Reject Modal */}
      {rejectDocModal ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className={`${EXCEL_PANEL} w-full max-w-md`}>
            <h3 className={EXCEL_PANEL_HEAD}>Reject Document: {rejectDocModal.name}</h3>
            <div className="p-3 text-xs space-y-2">
              <label className="block">
                <span className="mb-0.5 block font-semibold text-[#6B7280]">Rejection Reason</span>
                <textarea
                  rows={3}
                  className={EXCEL_INPUT}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for document rejection..."
                  required
                />
              </label>
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
                onClick={handleDocumentRejectConfirmed}
              >
                {busy ? 'Rejecting...' : 'Reject Document'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
