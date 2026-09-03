import { FARMER_STORAGE_KEY, VERIFICATION_STATUS } from "../utils/constants";
import { getApiBaseUrl } from "../config/env";

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(FARMER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getActiveFarmerId() {
  try {
    const stored = getStoredAuth();
    if (stored?.farmer?.id && stored?.farmer?.role !== "FARMER_MANAGER") {
      return stored.farmer.id;
    }
  } catch {
    // ignore parse error
  }
  return "";
}

function authHeaders() {
  const token = getStoredAuth()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function managerAuthHeaders() {
  return authHeaders();
}

function getActiveManagerId() {
  try {
    const stored = getStoredAuth();
    if (stored?.farmer?.role === "FARMER_MANAGER") return stored.farmer.id;
  } catch {
    // ignore
  }
  return null;
}

async function apiFetch(path, options = {}) {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    const error = new Error("Unable to connect to server. Please check whether the backend server is running.");
    error.status = 0;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  if (!raw || contentType.includes("text/html")) {
    const error = new Error(
      "Cannot reach the API from this site. On Render, add a Rewrite /api/* → http://api.greengrocc.com/api/* or run farmer as a Web Service with npm start."
    );
    error.status = 0;
    throw error;
  }

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    const error = new Error("API returned an invalid response. Check Render /api rewrite to http://api.greengrocc.com.");
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(data.message || "API request failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

function computeVerificationStatus(docs) {
  if (!Array.isArray(docs)) return VERIFICATION_STATUS.PENDING;
  const required = docs.filter((d) => ["aadhaar", "pan", "bank", "address"].includes(d.type));
  if (!required.length) return VERIFICATION_STATUS.PENDING;
  if (required.some((d) => d.status === "Not Uploaded" || d.status === "not_uploaded" || !d.fileName)) {
    return VERIFICATION_STATUS.PENDING;
  }
  if (required.some((d) => d.status === "Rejected" || d.status === "rejected")) {
    return VERIFICATION_STATUS.REJECTED;
  }
  if (required.every((d) => d.status === "Approved" || d.status === "approved")) {
    return VERIFICATION_STATUS.APPROVED;
  }
  return VERIFICATION_STATUS.PENDING;
}

/**
 * Unified login — tries farmer first, then manager.
 * Both return { token, farmer: { ...userData, role } }
 */
export async function farmerLogin({ mobile, password }) {
  const body = JSON.stringify({ mobile, password });
  try {
    const farmer = await apiFetch("/api/farmers/login", { method: "POST", body });
    if (farmer?.token) return farmer;
  } catch (farmerErr) {
    try {
      const manager = await apiFetch("/api/farmers/manager/login", { method: "POST", body });
      if (manager?.token) return manager;
    } catch (managerErr) {
      if (farmerErr?.status === 0) throw farmerErr;
      if (managerErr?.status === 0) throw managerErr;
      throw farmerErr;
    }
  }
  throw new Error("Invalid mobile number or password");
}

export async function registerFarmer(payload) {
  return apiFetch("/api/farmers/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitFarmerKyc() {
  const farmerId = getActiveFarmerId();
  if (!farmerId) throw new Error("Farmer session not found");
  return apiFetch(`/api/farmers/${farmerId}/kyc/submit`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getFarmerProfile() {
  const stored = getStoredAuth();
  if (stored?.farmer?.role === "FARMER_MANAGER") {
    return getManagerProfile();
  }
  const farmerId = getActiveFarmerId();
  if (!farmerId && !stored?.token) {
    if (stored?.farmer) {
      return {
        ...stored.farmer,
        role: stored.farmer.role || "FARMER",
        verificationStatus: stored.farmer.verificationStatus || "Approved",
      };
    }
    throw new Error("Farmer session not found");
  }
  try {
    const farmer = await apiFetch("/api/farmers/me", { headers: authHeaders() });
    return {
      ...farmer,
      role: farmer.role || "FARMER",
      verificationStatus: farmer.verificationStatus || "Approved",
    };
  } catch (err) {
    if (stored?.farmer) {
      return {
        ...stored.farmer,
        role: stored.farmer.role || "FARMER",
        verificationStatus: stored.farmer.verificationStatus || "Approved",
      };
    }
    throw err;
  }
}

export async function getManagerProfile() {
  const stored = getStoredAuth();
  if (stored?.token && stored?.farmer?.role === "FARMER_MANAGER") {
    try {
      const data = await apiFetch("/api/farmer-manager/auth/me", {
        headers: { Authorization: `Bearer ${stored.token}` },
      });
      return { ...data, role: "FARMER_MANAGER" };
    } catch {
      return stored.farmer;
    }
  }
  return stored?.farmer || null;
}

export async function updateFarmerProfile(payload) {
  return apiFetch("/api/farmers/me/profile", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateFarmProfile(payload) {
  return apiFetch("/api/farmers/me/farm", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateFarmLocation(payload) {
  return apiFetch("/api/farmers/me/farm-location", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function confirmFarmLocation(payload) {
  return apiFetch("/api/farmers/me/farm-location/confirm", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function getCrops() {
  return apiFetch("/api/farmer/crops", { headers: authHeaders() });
}

export async function getCrop(cropId) {
  return apiFetch(`/api/farmer/crops/${cropId}`, { headers: authHeaders() });
}

export async function createCrop(payload) {
  return apiFetch("/api/farmer/crops", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateCrop(cropId, payload) {
  return apiFetch(`/api/farmer/crops/${cropId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteCrop(cropId) {
  return apiFetch(`/api/farmer/crops/${cropId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function getCropPlans() {
  return apiFetch("/api/farmer/crop-plans", { headers: authHeaders() });
}

export async function getCropPlan(planId) {
  return apiFetch(`/api/farmer/crop-plans/${planId}`, { headers: authHeaders() });
}

export async function updateCropPlan(planId, payload) {
  return apiFetch(`/api/farmer/crop-plans/${planId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function changeFarmerPassword({ currentPassword, newPassword }) {
  if (!currentPassword || String(newPassword || "").length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}`, {
    method: "PUT",
    body: JSON.stringify({ password: newPassword }),
  });
}

export async function getDocuments() {
  const stored = getStoredAuth();
  const role = stored?.farmer?.role;
  if (role === "FARMER_MANAGER") return []; // Managers don't have personal documents
  const farmerId = getActiveFarmerId();
  if (!farmerId) return [];
  const docs = await apiFetch(`/api/farmers/${farmerId}/documents`);
  return docs.map((d) => ({
    ...d,
    status:
      d.status === "Approved"
        ? VERIFICATION_STATUS.APPROVED
        : d.status === "Rejected"
        ? VERIFICATION_STATUS.REJECTED
        : d.status === "Not Uploaded"
        ? VERIFICATION_STATUS.NOT_UPLOADED
        : VERIFICATION_STATUS.PENDING,
  }));
}

export async function uploadDocument(type, fileMeta) {
  const farmerId = getActiveFarmerId();
  const doc = await apiFetch(`/api/farmers/${farmerId}/documents`, {
    method: "POST",
    body: JSON.stringify({
      type,
      fileName: fileMeta.name,
      fileUrl: fileMeta.url || "",
    }),
  });
  return {
    ...doc,
    status: VERIFICATION_STATUS.PENDING,
  };
}

export async function deleteDocument(id) {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/documents/${id}`, {
    method: "DELETE",
  });
}

export async function submitDocumentsForVerification() {
  const farmerId = getActiveFarmerId();
  const docs = await apiFetch(`/api/farmers/${farmerId}/documents`);
  return {
    success: true,
    verificationStatus: computeVerificationStatus(docs),
  };
}

export async function getDashboardStats() {
  const farmerId = getActiveFarmerId();
  if (!farmerId) return {};
  return apiFetch(`/api/farmers/${farmerId}/dashboard`);
}

export async function getProducts({ q = "", status = "", sort = "newest", page = 1, limit = 10 } = {}) {
  const farmerId = getActiveFarmerId();
  if (!farmerId) return { products: [], total: 0, page: 1, totalPages: 1 };
  const list = await apiFetch(`/api/farmers/${farmerId}/products`);
  let filtered = [...list];
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle) ||
        (p.sku && p.sku.toLowerCase().includes(needle))
    );
  }
  if (status) filtered = filtered.filter((p) => p.status === status);
  if (sort === "price-asc") filtered.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
  else if (sort === "price-desc") filtered.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
  else if (sort === "stock") filtered.sort((a, b) => (a.stock || 0) - (b.stock || 0));
  else filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const total = filtered.length;
  const start = (page - 1) * limit;
  return {
    products: filtered.slice(start, start + limit),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProductById(id) {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/products/${id}`);
}

export async function getProductGradeChart(productId) {
  const farmerId = getActiveFarmerId();
  const product = await apiFetch(`/api/farmers/${farmerId}/products/${productId}`).catch(() => null);
  const rows = [
    {
      srNo: 1,
      date: new Date().toISOString().split("T")[0],
      weekday: "Today",
      gradeAQty: product?.gradeAQty || 0,
      gradeARate: product?.sellingPrice || 35,
      gradeBQty: product?.gradeBQty || 0,
      gradeBRate: Math.round((product?.sellingPrice || 35) * 0.8),
      aTotal: (product?.gradeAQty || 0) * (product?.sellingPrice || 35),
      bTotal: (product?.gradeBQty || 0) * Math.round((product?.sellingPrice || 35) * 0.8),
      abTotal:
        (product?.gradeAQty || 0) * (product?.sellingPrice || 35) +
        (product?.gradeBQty || 0) * Math.round((product?.sellingPrice || 35) * 0.8),
      unit: product?.unit || "Kg",
    },
  ];
  const totalRupees = rows.reduce((s, r) => s + r.abTotal, 0);
  return {
    rows,
    summary: { totalRupees, deposited: Math.round(totalRupees * 0.7), balance: Math.round(totalRupees * 0.3) },
  };
}

export async function getDashboardCharts() {
  const farmerId = getActiveFarmerId();
  if (!farmerId) return { stats: {}, all: { rows: [] }, products: [] };
  const [stats, products] = await Promise.all([
    apiFetch(`/api/farmers/${farmerId}/dashboard`),
    apiFetch(`/api/farmers/${farmerId}/products`),
  ]);

  const productItems = products.map((product) => {
    const aQty = product.gradeAQty || product.grades?.[0]?.quantity || 0;
    const bQty = product.gradeBQty || product.grades?.[1]?.quantity || 0;
    const price = product.sellingPrice || 35;
    const bPrice = Math.round(price * 0.8);
    const aTotal = aQty * price;
    const bTotal = bQty * bPrice;
    const abTotal = aTotal + bTotal;
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      unit: product.unit || "Kg",
      rows: [
        {
          srNo: 1,
          date: new Date().toISOString().split("T")[0],
          weekday: "Today",
          gradeAQty: aQty,
          gradeARate: price,
          gradeBQty: bQty,
          gradeBRate: bPrice,
          aTotal,
          bTotal,
          abTotal,
          unit: product.unit || "Kg",
        },
      ],
      summary: { totalRupees: abTotal, deposited: Math.round(abTotal * 0.7), balance: Math.round(abTotal * 0.3) },
    };
  });

  return {
    stats,
    all: {
      rows: productItems.flatMap((p) => p.rows),
      summary: { totalRupees: stats.totalEarnings || 0, deposited: Math.round((stats.totalEarnings || 0) * 0.7), balance: Math.round((stats.totalEarnings || 0) * 0.3) },
    },
    products: productItems,
  };
}

export async function createProduct(payload) {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id, payload) {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id) {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/products/${id}`, {
    method: "DELETE",
  });
}

export async function getMyProducts() {
  return apiFetch("/api/farmer/products", { headers: authHeaders() });
}

export async function getMyProduct(productId) {
  return apiFetch(`/api/farmer/products/${productId}`, { headers: authHeaders() });
}

export async function createMyProduct(payload) {
  return apiFetch("/api/farmer/products", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateMyProduct(productId, payload) {
  return apiFetch(`/api/farmer/products/${productId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteMyProduct(productId) {
  return apiFetch(`/api/farmer/products/${productId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function updateMyProductPrice(productId, payload) {
  return apiFetch(`/api/farmer/products/${productId}/price`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateMyProductStock(productId, payload) {
  return apiFetch(`/api/farmer/products/${productId}/stock`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateMyProductStatus(productId, status) {
  return apiFetch(`/api/farmer/products/${productId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}

export async function getInventory() {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/inventory`);
}

export async function adjustStock({
  productId,
  change,
  reason = "Manual Update",
  grade = "Grade A",
  updatedBy = "Farmer",
  reference = "—",
} = {}) {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/inventory/adjust`, {
    method: "POST",
    body: JSON.stringify({ productId, change, reason, grade, updatedBy, reference }),
  });
}

export async function getStockHistory(productId) {
  const farmerId = getActiveFarmerId();
  const url = productId
    ? `/api/farmers/${farmerId}/stock-history?productId=${productId}`
    : `/api/farmers/${farmerId}/stock-history`;
  const history = await apiFetch(url);
  return history.map((entry) => ({
    ...entry,
    changedQuantity: entry.changedQuantity ?? entry.change,
    newStock: entry.newStock ?? entry.stockAfter,
    previousStock: entry.previousStock ?? (entry.newStock - (entry.changedQuantity || 0)),
  }));
}

export async function getMyOrders({ filter = "", q = "" } = {}) {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (q) params.set("q", q);
  const query = params.toString();
  return apiFetch(`/api/farmer/orders${query ? `?${query}` : ""}`, { headers: authHeaders() });
}

export async function getMyOrder(orderId) {
  return apiFetch(`/api/farmer/orders/${orderId}`, { headers: authHeaders() });
}

export async function acceptMyOrder(orderId) {
  return apiFetch(`/api/farmer/orders/${orderId}/accept`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
}

export async function rejectMyOrder(orderId, payload) {
  return apiFetch(`/api/farmer/orders/${orderId}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function prepareMyOrder(orderId, payload = {}) {
  return apiFetch(`/api/farmer/orders/${orderId}/prepare`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function packMyOrder(orderId, payload) {
  return apiFetch(`/api/farmer/orders/${orderId}/packing`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function readyMyOrder(orderId) {
  return apiFetch(`/api/farmer/orders/${orderId}/ready-for-pickup`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
}

export async function getOrders({ status = "", q = "" } = {}) {
  const farmerId = getActiveFarmerId();
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  return apiFetch(`/api/farmers/${farmerId}/orders?${params.toString()}`);
}

export async function getOrderById(id) {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/orders/${id}`);
}

export async function updateOrderStatus(id, status, note = "") {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export async function getEarnings() {
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/earnings`);
}

export async function getHarvestOrders() {
  const stored = getStoredAuth();
  if (stored?.farmer?.role === "FARMER_MANAGER") {
    const data = await apiFetch("/api/farmer-manager/harvest-orders", {
      headers: managerAuthHeaders(),
    });
    return Array.isArray(data) ? data : data?.orders || [];
  }
  const farmerId = getActiveFarmerId();
  if (!farmerId) return [];
  return apiFetch(`/api/farmers/${farmerId}/harvest-orders`, { headers: authHeaders() });
}


// ============================================================
// MANAGER API FUNCTIONS (for FARMER_MANAGER role)
// ============================================================

export async function getManagerDashboard() {
  return apiFetch("/api/farmer-manager/dashboard", {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerFarmers({ q = "", status = "", lite = false } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (lite) params.set("lite", "1");
  return apiFetch(`/api/farmer-manager/farmers?${params.toString()}`, {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerAllProducts() {
  return apiFetch("/api/farmer-manager/products", {
    headers: managerAuthHeaders(),
  });
}

export async function reviewManagerFarmerProduct(farmerId, productId, decision, reason = "") {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/products/${encodeURIComponent(productId)}/review`, {
    method: "PATCH",
    headers: managerAuthHeaders(),
    body: JSON.stringify({ decision, reason }),
  });
}

export async function getManagerAllOrders() {
  return apiFetch("/api/farmer-manager/orders", {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerAllInventory() {
  return apiFetch("/api/farmer-manager/inventory", {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerAllDocuments() {
  return apiFetch("/api/farmer-manager/documents", {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerAllStockHistory({ farmerId = "" } = {}) {
  const params = new URLSearchParams();
  if (farmerId) params.set("farmerId", farmerId);
  const qs = params.toString();
  return apiFetch(`/api/farmer-manager/stock-history${qs ? `?${qs}` : ""}`, {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerAllHarvestOrders() {
  return apiFetch("/api/farmer-manager/harvest-orders", {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerAllEarnings() {
  return apiFetch("/api/farmer-manager/earnings", {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerFarmerById(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function getManagerFarmerCrops(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${encodeURIComponent(farmerId)}/crops`, {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerFarmerCrop(farmerId, cropId) {
  return apiFetch(`/api/farmer-manager/farmers/${encodeURIComponent(farmerId)}/crops/${encodeURIComponent(cropId)}`, {
    headers: managerAuthHeaders(),
  });
}

export async function createManagerFarmerCrop(farmerId, payload) {
  return apiFetch(`/api/farmer-manager/farmers/${encodeURIComponent(farmerId)}/crops`, {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateManagerFarmerCrop(farmerId, cropId, payload) {
  return apiFetch(`/api/farmer-manager/farmers/${encodeURIComponent(farmerId)}/crops/${encodeURIComponent(cropId)}`, {
    method: "PUT",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteManagerFarmerCrop(farmerId, cropId) {
  return apiFetch(`/api/farmer-manager/farmers/${encodeURIComponent(farmerId)}/crops/${encodeURIComponent(cropId)}`, {
    method: "DELETE",
    headers: managerAuthHeaders(),
  });
}

export async function getManagerFarmerProducts(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/products`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function createManagerFarmerProduct(farmerId, payload) {
  return apiFetch(`/api/farmer-manager/farmers/${encodeURIComponent(farmerId)}/products`, {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function getManagerFarmerProductById(farmerId, productId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/products/${productId}`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function updateManagerFarmerProduct(farmerId, productId, payload) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/products/${productId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
    body: JSON.stringify(payload),
  });
}

export async function getManagerFarmerInventory(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/inventory`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function adjustManagerFarmerStock(farmerId, payload) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/inventory/adjust`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
    body: JSON.stringify(payload),
  });
}

export async function getManagerFarmerStockHistory(farmerId, productId) {
  const url = productId
    ? `/api/farmer-manager/farmers/${farmerId}/stock-history?productId=${productId}`
    : `/api/farmer-manager/farmers/${farmerId}/stock-history`;
  return apiFetch(url, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function getManagerFarmerOrders(farmerId, { status = "", q = "" } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function getManagerFarmerOrderById(farmerId, orderId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function updateManagerFarmerOrderStatus(farmerId, orderId, status, note = "") {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
    body: JSON.stringify({ status, note }),
  });
}

export async function getManagerFarmerEarnings(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/earnings`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function getManagerFarmerDocuments(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/documents`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function uploadManagerFarmerDocument(farmerId, type, fileMeta) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
    body: JSON.stringify({
      type,
      fileName: fileMeta.name,
      fileUrl: fileMeta.url || "",
    }),
  });
}

export async function updateManagerFarmerDocumentStatus(farmerId, documentId, status, rejectionReason = "") {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/documents/${documentId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
    body: JSON.stringify({ status, rejectionReason }),
  });
}

export async function deleteManagerFarmer(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function createManagerFarmer(payload) {
  return apiFetch("/api/farmer-manager/farmers", {
    method: "POST",
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
    body: JSON.stringify(payload),
  });
}

export async function createManagerOrder(farmerId, payload) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateManagerFarmerOrder(farmerId, orderId, payload) {
  const token = getStoredAuth()?.token;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    return await apiFetch(`/api/farmer-manager/farmers/${farmerId}/orders/${orderId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err?.message?.includes("404") || err?.message?.includes("not found") || err?.message?.includes("Route not found")) {
      try {
        return await apiFetch(`/api/farmers/${farmerId}/orders/${orderId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback to PATCH if PUT is blocked
        return await apiFetch(`/api/farmer-manager/farmers/${farmerId}/orders/${orderId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        });
      }
    }
    throw err;
  }
}

export async function deleteManagerFarmerOrder(farmerId, orderId) {
  const token = getStoredAuth()?.token;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    return await apiFetch(`/api/farmer-manager/farmers/${farmerId}/orders/${orderId}`, {
      method: "DELETE",
      headers,
    });
  } catch (err) {
    if (err?.message?.includes("404") || err?.message?.includes("not found") || err?.message?.includes("Route not found")) {
      return await apiFetch(`/api/farmers/${farmerId}/orders/${orderId}`, {
        method: "DELETE",
        headers,
      });
    }
    throw err;
  }
}

export async function getManagerPickups({ filter = "requests" } = {}) {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  return apiFetch(`/api/farmer-manager/pickups?${params.toString()}`, {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerPickup(pickupId) {
  return apiFetch(`/api/farmer-manager/pickups/${pickupId}`, {
    headers: managerAuthHeaders(),
  });
}

export async function verifyManagerPickupQr(pickupId, payload) {
  return apiFetch(`/api/farmer-manager/pickups/${pickupId}/verify-qr`, {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function confirmManagerPickup(pickupId, payload = {}) {
  return apiFetch(`/api/farmer-manager/pickups/${pickupId}/confirm`, {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function getManagerDrivers({ q = "", status = "" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  return apiFetch(`/api/farmer-manager/drivers?${params.toString()}`, {
    headers: managerAuthHeaders(),
  });
}

export async function assignManagerPickup(pickupId, driverId) {
  return apiFetch(`/api/farmer-manager/pickups/${pickupId}/assign`, {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify({ driverId }),
  });
}

export async function reassignManagerPickup(pickupId, driverId) {
  return apiFetch(`/api/farmer-manager/pickups/${pickupId}/reassign`, {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify({ driverId }),
  });
}

export async function receiveManagerPickup(pickupId, payload = {}) {
  return apiFetch(`/api/farmer-manager/pickups/${pickupId}/receive`, {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function getManagerPickupReceipt(pickupId) {
  return apiFetch(`/api/farmer-manager/pickups/${pickupId}/receipt`, {
    headers: managerAuthHeaders(),
  });
}

export async function listManagerQuality({ bucket = "pending" } = {}) {
  const params = new URLSearchParams();
  if (bucket) params.set("bucket", bucket);
  return apiFetch(`/api/quality/pending?${params.toString()}`, {
    headers: managerAuthHeaders(),
  });
}

export async function getManagerQuality(orderId) {
  return apiFetch(`/api/quality/${orderId}`, {
    headers: managerAuthHeaders(),
  });
}

export async function verifyManagerQualityQr(payload) {
  return apiFetch("/api/quality/verify-qr", {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function startManagerQuality(orderId) {
  return apiFetch(`/api/quality/${orderId}/start`, {
    method: "POST",
    headers: managerAuthHeaders(),
  });
}

export async function uploadManagerQualityPhotos(orderId, payload) {
  return apiFetch(`/api/quality/${orderId}/photos`, {
    method: "POST",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function saveManagerQualityParameters(orderId, payload) {
  return apiFetch(`/api/quality/${orderId}/parameters`, {
    method: "PATCH",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function saveManagerQualityGrading(orderId, payload) {
  return apiFetch(`/api/quality/${orderId}/grading`, {
    method: "PATCH",
    headers: managerAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function confirmManagerQuality(orderId) {
  return apiFetch(`/api/quality/${orderId}/confirm`, {
    method: "POST",
    headers: managerAuthHeaders(),
  });
}

export async function getManagerQualitySummary(orderId) {
  return apiFetch(`/api/quality/${orderId}/final-summary`, {
    headers: managerAuthHeaders(),
  });
}





