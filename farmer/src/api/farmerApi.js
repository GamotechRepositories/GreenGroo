import { FARMER_STORAGE_KEY, VERIFICATION_STATUS } from "../utils/constants";

const API_BASE = "http://localhost:5001";

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
    if (stored?.farmer?.role !== "FARMER_MANAGER" && stored?.farmer?.id) {
      return stored.farmer.id;
    }
  } catch {
    // ignore parse error
  }
  return "farmer-1";
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
  const url = `${API_BASE}${path}`;
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

  const data = await response.json().catch(() => ({}));

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
  // Try farmer login first
  try {
    const data = await apiFetch("/api/farmers/login", {
      method: "POST",
      body: JSON.stringify({ mobile, password }),
    });
    if (data.token) return data;
  } catch (err) {
    // If 401, credentials wrong (not a role mismatch — rethrow)
    if (err.status === 401 || err.status === 403) {
      // Try manager login before giving up
    } else if (err.status === 0) {
      throw err; // Server not running
    }
  }

  // Try manager login
  const managerData = await apiFetch("/api/farmers/manager/login", {
    method: "POST",
    body: JSON.stringify({ mobile, password }),
  });
  return managerData;
}

export async function getFarmerProfile() {
  const farmerId = getActiveFarmerId();
  const farmer = await apiFetch(`/api/farmers/${farmerId}`);
  const docs = await apiFetch(`/api/farmers/${farmerId}/documents`).catch(() => []);
  return {
    ...farmer,
    role: farmer.role || "FARMER",
    verificationStatus: computeVerificationStatus(docs),
  };
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
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}`, {
    method: "PUT",
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
  return apiFetch(`/api/farmers/${farmerId}/dashboard`);
}

export async function getProducts({ q = "", status = "", sort = "newest", page = 1, limit = 10 } = {}) {
  const farmerId = getActiveFarmerId();
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
  const farmerId = getActiveFarmerId();
  return apiFetch(`/api/farmers/${farmerId}/harvest-orders`);
}


// ============================================================
// MANAGER API FUNCTIONS (for FARMER_MANAGER role)
// ============================================================

export async function getManagerDashboard() {
  return apiFetch("/api/farmer-manager/dashboard", {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function getManagerFarmers({ q = "", status = "" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  return apiFetch(`/api/farmer-manager/farmers?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function getManagerFarmerById(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
  });
}

export async function getManagerFarmerProducts(farmerId) {
  return apiFetch(`/api/farmer-manager/farmers/${farmerId}/products`, {
    headers: { Authorization: `Bearer ${getStoredAuth()?.token}` },
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



