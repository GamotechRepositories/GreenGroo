export const CURRENT_VENDOR_ID = 'vendor-1'

const API_BASE = 'http://localhost:5001'

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const response = await fetch(url, { ...options, headers })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'API request failed')
    error.status = response.status
    throw error
  }

  return data
}

export async function getManagers({ q = '', status = '' } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  params.set('vendorId', CURRENT_VENDOR_ID)
  return apiFetch(`/api/vendor/managers?${params.toString()}`)
}

export async function getManagerById(id) {
  return apiFetch(`/api/vendor/managers/${id}`)
}

export async function createManager(payload) {
  return apiFetch('/api/vendor/managers', {
    method: 'POST',
    body: JSON.stringify({ ...payload, vendorId: CURRENT_VENDOR_ID }),
  })
}

export async function updateManager(id, payload) {
  return apiFetch(`/api/vendor/managers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function setManagerStatus(id, status) {
  return apiFetch(`/api/vendor/managers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteManager(id) {
  return apiFetch(`/api/vendor/managers/${id}`, {
    method: 'DELETE',
  })
}

export async function getFarmers({
  q = '',
  status = '',
  managerId = '',
  location = '',
  vendorId = CURRENT_VENDOR_ID,
} = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  if (managerId) params.set('managerId', managerId)
  if (location) params.set('location', location)
  params.set('vendorId', vendorId)
  return apiFetch(`/api/vendor/farmers?${params.toString()}`)
}

export async function getFarmerById(id) {
  return apiFetch(`/api/vendor/farmers/${id}`)
}

export async function createFarmer(payload) {
  return apiFetch('/api/vendor/farmers', {
    method: 'POST',
    body: JSON.stringify({ ...payload, vendorId: CURRENT_VENDOR_ID }),
  })
}

export async function updateFarmer(id, payload) {
  return apiFetch(`/api/vendor/farmers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function removeFarmerFromManager(farmerId) {
  return updateFarmer(farmerId, { managerId: '', status: 'Inactive' })
}

export async function setFarmerStatus(id, status) {
  return apiFetch(`/api/vendor/farmers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function updateFarmerPassword(farmerId, newPassword) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
  })
}

export async function updateFarmerLoginStatus(farmerId, loginEnabled) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/login-status`, {
    method: 'PUT',
    body: JSON.stringify({ loginEnabled }),
  })
}

export async function getFarmerProducts(farmerId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/products`)
}

export async function getFarmerProduct(farmerId, productId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/products/${productId}`)
}

export async function createFarmerProduct(farmerId, payload) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/products`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateFarmerProduct(farmerId, productId, payload) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteFarmerProduct(farmerId, productId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/products/${productId}`, {
    method: 'DELETE',
  })
}

export async function getFarmerInventory(farmerId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/inventory`)
}

export async function adjustFarmerStock({ farmerId, productId, gradeId, change, grade, updatedBy = 'Vendor' }) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/inventory/adjust`, {
    method: 'POST',
    body: JSON.stringify({ productId, gradeId, change, grade, updatedBy }),
  })
}

export async function updateFarmerInventoryItem(farmerId, inventoryId, payload) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/inventory/${inventoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getStockHistory(farmerId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/stock-history`)
}

export async function getFarmerOrders(farmerId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/orders`)
}

export async function getFarmerEarnings(farmerId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/earnings`)
}

export async function getFarmerDocuments(farmerId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/documents`)
}

export async function updateFarmerDocumentStatus(farmerId, documentId, status, rejectionReason = '') {
  return apiFetch(`/api/vendor/farmers/${farmerId}/documents/${documentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, rejectionReason }),
  })
}

export async function getFarmerHarvestOrders(farmerId) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/harvest-orders`)
}

export async function createFarmerHarvestOrder(farmerId, payload) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/harvest-orders`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, farmerId }),
  })
}

export async function updateFarmerHarvestOrder(farmerId, id, payload) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/harvest-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteFarmerHarvestOrder(farmerId, id) {
  return apiFetch(`/api/vendor/farmers/${farmerId}/harvest-orders/${id}`, {
    method: 'DELETE',
  })
}
