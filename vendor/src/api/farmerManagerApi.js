import {
  CURRENT_VENDOR_ID,
  documentsDb,
  earningsDb,
  farmersDb,
  initials,
  inventoryDb,
  managersDb,
  ordersDb,
  productsDb,
  stockHistoryDb,
} from '@/data/farmerManagerMock'

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms))

function byVendor(list, vendorId = CURRENT_VENDOR_ID) {
  return list.filter((item) => item.vendorId === vendorId)
}

function managerName(managerId) {
  return managersDb.find((m) => m.id === managerId)?.name || '—'
}

function productTotals(farmerId) {
  const products = productsDb.filter((p) => p.farmerId === farmerId)
  const stock = products.reduce(
    (sum, p) => sum + p.grades.reduce((s, g) => s + Number(g.quantity || 0), 0),
    0,
  )
  return { totalProducts: products.length, totalStock: stock }
}

function orderTotals(farmerId) {
  return ordersDb.filter((o) => o.farmerId === farmerId).length
}

function earningsTotals(farmerId) {
  const rows = earningsDb.filter((e) => e.farmerId === farmerId)
  const total = rows.reduce((s, r) => s + Number(r.netEarnings || 0), 0)
  const paid = rows.filter((r) => r.status === 'Paid').reduce((s, r) => s + Number(r.netEarnings || 0), 0)
  const pending = rows.filter((r) => r.status === 'Pending').reduce((s, r) => s + Number(r.netEarnings || 0), 0)
  const available = rows
    .filter((r) => r.status === 'Available')
    .reduce((s, r) => s + Number(r.netEarnings || 0), 0)
  return { totalEarnings: total, paidEarnings: paid, pendingEarnings: pending, availableEarnings: available }
}

function enrichFarmer(farmer) {
  const totals = productTotals(farmer.id)
  const earn = earningsTotals(farmer.id)
  return {
    ...farmer,
    managerName: managerName(farmer.managerId),
    initials: initials(farmer.name),
    totalProducts: totals.totalProducts,
    totalStock: totals.totalStock,
    totalInventory: totals.totalStock,
    totalOrders: orderTotals(farmer.id),
    totalEarnings: earn.totalEarnings,
  }
}

function enrichManager(manager) {
  const farmers = farmersDb.filter((f) => f.managerId === manager.id && f.vendorId === manager.vendorId)
  const farmerIds = new Set(farmers.map((f) => f.id))
  const products = productsDb.filter((p) => farmerIds.has(p.farmerId))
  const orders = ordersDb.filter((o) => farmerIds.has(o.farmerId))
  const earnings = earningsDb.filter((e) => farmerIds.has(e.farmerId))
  const inventoryQty = products.reduce(
    (sum, p) => sum + p.grades.reduce((s, g) => s + Number(g.quantity || 0), 0),
    0,
  )
  return {
    ...manager,
    initials: initials(manager.name),
    totalFarmers: farmers.length,
    activeFarmers: farmers.filter((f) => f.status === 'Active').length,
    totalProducts: products.length,
    totalInventory: inventoryQty,
    totalOrders: orders.length,
    totalEarnings: earnings.reduce((s, e) => s + Number(e.netEarnings || 0), 0),
  }
}

function syncInventoryFromProduct(product) {
  product.grades.forEach((g) => {
    const idx = inventoryDb.findIndex((i) => i.productId === product.id && i.gradeId === g.id)
    const reserved = idx >= 0 ? inventoryDb[idx].reservedStock : Math.round(g.quantity * 0.1)
    const sold = idx >= 0 ? inventoryDb[idx].soldStock : Math.round(g.quantity * 0.3)
    const row = {
      id: `inv-${product.id}-${g.id}`,
      vendorId: product.vendorId,
      managerId: product.managerId,
      farmerId: product.farmerId,
      productId: product.id,
      productName: product.name,
      gradeId: g.id,
      grade: g.label,
      unit: product.unit,
      currentStock: g.quantity,
      reservedStock: reserved,
      soldStock: sold,
      totalStock: g.quantity + reserved + sold,
      status: g.quantity <= 0 ? 'Out of Stock' : g.quantity < 20 ? 'Low Stock' : 'In Stock',
      lastUpdated: new Date().toISOString(),
    }
    if (idx >= 0) inventoryDb[idx] = row
    else inventoryDb.push(row)
  })
}

export async function getManagers({ q = '', status = '' } = {}) {
  await delay()
  let list = byVendor(managersDb).map(enrichManager)
  if (status) list = list.filter((m) => m.status === status)
  if (q.trim()) {
    const needle = q.trim().toLowerCase()
    list = list.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.mobile.includes(needle) ||
        m.email.toLowerCase().includes(needle) ||
        m.location.toLowerCase().includes(needle),
    )
  }
  return structuredClone(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
}

export async function getManagerById(id) {
  await delay()
  const manager = managersDb.find((m) => m.id === id && m.vendorId === CURRENT_VENDOR_ID)
  if (!manager) throw Object.assign(new Error('Manager not found'), { status: 404 })
  return structuredClone(enrichManager(manager))
}

export async function createManager(payload) {
  await delay(400)
  const manager = {
    id: `mgr-${Date.now()}`,
    vendorId: CURRENT_VENDOR_ID,
    name: payload.name,
    profileImage: payload.profileImage || '',
    mobile: payload.mobile,
    email: payload.email,
    address: payload.address || '',
    city: payload.city || '',
    state: payload.state || '',
    pincode: payload.pincode || '',
    location: [payload.city, payload.state].filter(Boolean).join(', ') || payload.location || '',
    status: payload.status || 'Active',
    authType: payload.authType || 'password',
    password: payload.password || '',
    createdAt: new Date().toISOString(),
  }
  managersDb.unshift(manager)
  return structuredClone(enrichManager(manager))
}

export async function updateManager(id, payload) {
  await delay(400)
  const idx = managersDb.findIndex((m) => m.id === id && m.vendorId === CURRENT_VENDOR_ID)
  if (idx < 0) throw new Error('Manager not found')
  managersDb[idx] = {
    ...managersDb[idx],
    ...payload,
    location:
      payload.city || payload.state
        ? [payload.city || managersDb[idx].city, payload.state || managersDb[idx].state]
            .filter(Boolean)
            .join(', ')
        : payload.location ?? managersDb[idx].location,
  }
  return structuredClone(enrichManager(managersDb[idx]))
}

export async function setManagerStatus(id, status) {
  return updateManager(id, { status })
}

export async function deleteManager(id) {
  await delay(350)
  const linked = farmersDb.some((f) => f.managerId === id)
  if (linked) throw new Error('Remove or reassign farmers before deleting this manager')
  const idx = managersDb.findIndex((m) => m.id === id)
  if (idx < 0) throw new Error('Manager not found')
  managersDb.splice(idx, 1)
  return { success: true }
}

export async function getFarmers({
  q = '',
  status = '',
  managerId = '',
  location = '',
  vendorId = CURRENT_VENDOR_ID,
} = {}) {
  await delay()
  let list = byVendor(farmersDb, vendorId).map(enrichFarmer)
  if (managerId) list = list.filter((f) => f.managerId === managerId)
  if (status) list = list.filter((f) => f.status === status)
  if (location) list = list.filter((f) => f.farmLocation.toLowerCase().includes(location.toLowerCase()))
  if (q.trim()) {
    const needle = q.trim().toLowerCase()
    list = list.filter(
      (f) =>
        f.name.toLowerCase().includes(needle) ||
        f.managerName.toLowerCase().includes(needle) ||
        f.mobile.includes(needle) ||
        f.farmName.toLowerCase().includes(needle),
    )
  }
  return structuredClone(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
}

export async function getFarmerById(id) {
  await delay()
  const farmer = farmersDb.find((f) => f.id === id && f.vendorId === CURRENT_VENDOR_ID)
  if (!farmer) throw Object.assign(new Error('Farmer not found'), { status: 404 })
  return structuredClone(enrichFarmer(farmer))
}

export async function createFarmer(payload) {
  await delay(400)
  if (!payload.managerId) throw new Error('Manager is required')
  const manager = managersDb.find((m) => m.id === payload.managerId && m.vendorId === CURRENT_VENDOR_ID)
  if (!manager) throw new Error('Manager not found')

  const farmer = {
    id: `farmer-${Date.now()}`,
    vendorId: CURRENT_VENDOR_ID,
    managerId: payload.managerId,
    name: payload.name,
    profileImage: payload.profileImage || '',
    mobile: payload.mobile,
    email: payload.email || '',
    farmName: payload.farmName || '',
    farmLocation: payload.farmLocation || '',
    farmAddress: payload.farmAddress || '',
    farmArea: payload.farmArea || '',
    farmType: payload.farmType || 'Organic',
    status: payload.status || 'Pending',
    verificationStatus: 'Pending',
    bank: {
      accountHolder: payload.bank?.accountHolder || payload.name,
      bankName: payload.bank?.bankName || '',
      accountNumber: payload.bank?.accountNumber || '',
      ifsc: payload.bank?.ifsc || '',
    },
    createdAt: new Date().toISOString(),
  }
  farmersDb.unshift(farmer)

  const docs = [
    { type: 'aadhaar', name: 'Aadhaar / ID Proof' },
    { type: 'pan', name: 'PAN' },
    { type: 'address', name: 'Address Proof' },
    { type: 'bank', name: 'Bank Details' },
    { type: 'other', name: 'Other Documents' },
  ]
  docs.forEach((d) => {
    documentsDb.unshift({
      id: `doc-${Date.now()}-${d.type}`,
      vendorId: CURRENT_VENDOR_ID,
      managerId: farmer.managerId,
      farmerId: farmer.id,
      name: d.name,
      type: d.type,
      fileName: payload.documents?.[d.type] || '',
      uploadedAt: payload.documents?.[d.type] ? new Date().toISOString() : '',
      status: 'Pending',
      rejectionReason: '',
    })
  })

  return structuredClone(enrichFarmer(farmer))
}

export async function updateFarmer(id, payload) {
  await delay(400)
  const idx = farmersDb.findIndex((f) => f.id === id && f.vendorId === CURRENT_VENDOR_ID)
  if (idx < 0) throw new Error('Farmer not found')
  farmersDb[idx] = {
    ...farmersDb[idx],
    ...payload,
    bank: { ...farmersDb[idx].bank, ...(payload.bank || {}) },
  }
  // Keep related rows' managerId in sync if reassigned
  if (payload.managerId) {
    productsDb.forEach((p, i) => {
      if (p.farmerId === id) productsDb[i] = { ...p, managerId: payload.managerId }
    })
    inventoryDb.forEach((row, i) => {
      if (row.farmerId === id) inventoryDb[i] = { ...row, managerId: payload.managerId }
    })
  }
  return structuredClone(enrichFarmer(farmersDb[idx]))
}

export async function removeFarmerFromManager(farmerId) {
  await delay(300)
  return updateFarmer(farmerId, { managerId: '', status: 'Inactive' })
}

export async function setFarmerStatus(id, status) {
  return updateFarmer(id, { status })
}

export async function getFarmerProducts(farmerId) {
  await delay()
  return structuredClone(
    productsDb
      .filter((p) => p.farmerId === farmerId && p.vendorId === CURRENT_VENDOR_ID)
      .map((p) => ({
        ...p,
        totalQuantity: p.grades.reduce((s, g) => s + Number(g.quantity || 0), 0),
        gradesSummary: p.grades.map((g) => `${g.label} - ${g.quantity} ${p.unit}`).join(', '),
      })),
  )
}

export async function getFarmerProduct(farmerId, productId) {
  await delay()
  const product = productsDb.find(
    (p) => p.id === productId && p.farmerId === farmerId && p.vendorId === CURRENT_VENDOR_ID,
  )
  if (!product) throw new Error('Product not found')
  const farmer = enrichFarmer(farmersDb.find((f) => f.id === farmerId))
  return structuredClone({
    ...product,
    farmerName: farmer.name,
    managerName: farmer.managerName,
  })
}

export async function getFarmerInventory(farmerId) {
  await delay()
  return structuredClone(inventoryDb.filter((i) => i.farmerId === farmerId && i.vendorId === CURRENT_VENDOR_ID))
}

export async function adjustFarmerStock({ farmerId, productId, gradeId, change, updatedBy = 'Vendor' }) {
  await delay(350)
  const pIdx = productsDb.findIndex(
    (p) => p.id === productId && p.farmerId === farmerId && p.vendorId === CURRENT_VENDOR_ID,
  )
  if (pIdx < 0) throw new Error('Product not found')
  const product = productsDb[pIdx]
  const gIdx = product.grades.findIndex((g) => g.id === gradeId || g.label === gradeId)
  if (gIdx < 0) throw new Error('Grade not found')

  const previousStock = Number(product.grades[gIdx].quantity) || 0
  const delta = Number(change) || 0
  const newStock = Math.max(0, previousStock + delta)
  const applied = newStock - previousStock
  if (applied === 0 && delta < 0) throw new Error('Not enough stock to remove')

  product.grades[gIdx] = { ...product.grades[gIdx], quantity: newStock }
  product.updatedAt = new Date().toISOString()
  productsDb[pIdx] = product
  syncInventoryFromProduct(product)

  const entry = {
    id: `sh-${Date.now()}`,
    vendorId: product.vendorId,
    managerId: product.managerId,
    farmerId,
    productId,
    productName: product.name,
    grade: product.grades[gIdx].label,
    previousStock,
    action: applied >= 0 ? 'Stock Added' : 'Stock Removed',
    changedQuantity: applied,
    newStock,
    updatedBy,
    at: new Date().toISOString(),
  }
  stockHistoryDb.unshift(entry)
  return structuredClone({ product, history: entry })
}

export async function getStockHistory(farmerId) {
  await delay()
  return structuredClone(
    stockHistoryDb
      .filter((h) => h.farmerId === farmerId && h.vendorId === CURRENT_VENDOR_ID)
      .sort((a, b) => new Date(b.at) - new Date(a.at)),
  )
}

export async function getFarmerOrders(farmerId) {
  await delay()
  return structuredClone(
    ordersDb
      .filter((o) => o.farmerId === farmerId && o.vendorId === CURRENT_VENDOR_ID)
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)),
  )
}

export async function getFarmerEarnings(farmerId) {
  await delay()
  const transactions = earningsDb
    .filter((e) => e.farmerId === farmerId && e.vendorId === CURRENT_VENDOR_ID)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const summary = earningsTotals(farmerId)
  return structuredClone({ summary, transactions })
}

export async function getFarmerDocuments(farmerId) {
  await delay()
  return structuredClone(
    documentsDb.filter((d) => d.farmerId === farmerId && d.vendorId === CURRENT_VENDOR_ID),
  )
}

export async function createFarmerProduct(farmerId, payload) {
  await delay(400)
  const farmer = farmersDb.find((f) => f.id === farmerId && f.vendorId === CURRENT_VENDOR_ID)
  if (!farmer) throw new Error('Farmer not found')

  const grades = (payload.grades || []).map((g, idx) => ({
    id: g.id || `g-${String.fromCharCode(97 + idx)}`,
    label: g.label || `Grade ${String.fromCharCode(65 + idx)}`,
    quantity: Number(g.quantity) || 0,
  }))

  if (!grades.length) {
    grades.push(
      { id: 'g-a', label: 'Grade A', quantity: Number(payload.gradeAQty) || 0 },
      { id: 'g-b', label: 'Grade B', quantity: Number(payload.gradeBQty) || 0 },
    )
  }

  const product = {
    id: `fp-${Date.now()}`,
    vendorId: CURRENT_VENDOR_ID,
    managerId: farmer.managerId,
    farmerId,
    name: payload.name,
    category: payload.category || 'Vegetables',
    subCategory: payload.subCategory || 'Fresh Produce',
    description: payload.description || '',
    image: payload.image || payload.imageUrl || '',
    unit: payload.unit || 'Kg',
    harvestDate: payload.harvestDate || new Date().toISOString().split('T')[0],
    produceType: payload.produceType || 'organic',
    farmLocation: payload.farmLocation || farmer.farmLocation || '',
    status: payload.status || 'Approved',
    grades,
    updatedAt: new Date().toISOString(),
  }

  productsDb.unshift(product)
  syncInventoryFromProduct(product)
  return structuredClone(product)
}

export async function updateFarmerProduct(farmerId, productId, payload) {
  await delay(400)
  const pIdx = productsDb.findIndex(
    (p) => p.id === productId && p.farmerId === farmerId && p.vendorId === CURRENT_VENDOR_ID,
  )
  if (pIdx < 0) throw new Error('Product not found')

  const prev = productsDb[pIdx]
  const updatedGrades = payload.grades
    ? payload.grades.map((g, idx) => ({
        id: g.id || prev.grades[idx]?.id || `g-${String.fromCharCode(97 + idx)}`,
        label: g.label || prev.grades[idx]?.label || `Grade ${String.fromCharCode(65 + idx)}`,
        quantity: Number(g.quantity) || 0,
      }))
    : prev.grades

  const next = {
    ...prev,
    ...payload,
    grades: updatedGrades,
    updatedAt: new Date().toISOString(),
  }

  productsDb[pIdx] = next
  syncInventoryFromProduct(next)
  return structuredClone(next)
}

export async function deleteFarmerProduct(farmerId, productId) {
  await delay(350)
  const pIdx = productsDb.findIndex(
    (p) => p.id === productId && p.farmerId === farmerId && p.vendorId === CURRENT_VENDOR_ID,
  )
  if (pIdx < 0) throw new Error('Product not found')
  productsDb.splice(pIdx, 1)

  for (let i = inventoryDb.length - 1; i >= 0; i--) {
    if (inventoryDb[i].productId === productId && inventoryDb[i].farmerId === farmerId) {
      inventoryDb.splice(i, 1)
    }
  }
  return { success: true }
}

export async function updateFarmerInventoryItem(farmerId, inventoryId, payload) {
  await delay(350)
  const idx = inventoryDb.findIndex(
    (i) => i.id === inventoryId && i.farmerId === farmerId && i.vendorId === CURRENT_VENDOR_ID,
  )
  if (idx < 0) throw new Error('Inventory item not found')

  const current = inventoryDb[idx]
  const nextStock = payload.currentStock != null ? Number(payload.currentStock) : current.currentStock
  const reserved = payload.reservedStock != null ? Number(payload.reservedStock) : current.reservedStock
  const sold = payload.soldStock != null ? Number(payload.soldStock) : current.soldStock

  const updated = {
    ...current,
    ...payload,
    currentStock: nextStock,
    reservedStock: reserved,
    soldStock: sold,
    totalStock: nextStock + reserved + sold,
    status:
      payload.status || (nextStock <= 0 ? 'Out of Stock' : nextStock < 20 ? 'Low Stock' : 'In Stock'),
    lastUpdated: new Date().toISOString(),
  }

  inventoryDb[idx] = updated

  const pIdx = productsDb.findIndex((p) => p.id === current.productId)
  if (pIdx >= 0) {
    const gIdx = productsDb[pIdx].grades.findIndex((g) => g.id === current.gradeId || g.label === current.grade)
    if (gIdx >= 0) {
      productsDb[pIdx].grades[gIdx].quantity = nextStock
    }
  }

  return structuredClone(updated)
}

export async function updateFarmerDocumentStatus(farmerId, documentId, status, rejectionReason = '') {
  await delay(350)
  const idx = documentsDb.findIndex(
    (d) => d.id === documentId && d.farmerId === farmerId && d.vendorId === CURRENT_VENDOR_ID,
  )
  if (idx < 0) throw new Error('Document not found')

  documentsDb[idx] = {
    ...documentsDb[idx],
    status,
    rejectionReason,
  }

  const farmerDocs = documentsDb.filter((d) => d.farmerId === farmerId)
  const reqTypes = ['aadhaar', 'pan', 'address', 'bank']
  const reqDocs = farmerDocs.filter((d) => reqTypes.includes(d.type))
  const fIdx = farmersDb.findIndex((f) => f.id === farmerId)

  if (fIdx >= 0) {
    if (reqDocs.every((d) => d.status === 'Approved')) {
      farmersDb[fIdx].verificationStatus = 'Approved'
      farmersDb[fIdx].status = 'Active'
    } else if (reqDocs.some((d) => d.status === 'Rejected')) {
      farmersDb[fIdx].verificationStatus = 'Rejected'
    }
  }

  return structuredClone(documentsDb[idx])
}
