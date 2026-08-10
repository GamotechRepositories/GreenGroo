/**
 * API-ready farmer service layer.
 * Currently backed by in-memory mock data; swap implementations for real MERN endpoints.
 */
import {
  MOCK_DOCUMENTS,
  MOCK_EARNINGS,
  MOCK_FARMER,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
  MOCK_PRODUCT_GRADE_CHARTS,
  MOCK_STOCK_HISTORY,
} from "../data/mockData";
import { VERIFICATION_STATUS } from "../utils/constants";

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

let documentsDb = structuredClone(MOCK_DOCUMENTS);
let productsDb = structuredClone(MOCK_PRODUCTS);
let ordersDb = structuredClone(MOCK_ORDERS);
let earningsDb = structuredClone(MOCK_EARNINGS);
let stockHistoryDb = structuredClone(MOCK_STOCK_HISTORY);
let farmerDb = structuredClone(MOCK_FARMER);

function computeVerificationStatus(docs) {
  const required = docs.filter((d) => ["aadhaar", "pan", "bank", "address"].includes(d.type));
  if (required.some((d) => d.status === VERIFICATION_STATUS.NOT_UPLOADED || !d.fileName)) {
    return VERIFICATION_STATUS.PENDING;
  }
  if (required.some((d) => d.status === VERIFICATION_STATUS.REJECTED)) {
    return VERIFICATION_STATUS.REJECTED;
  }
  if (required.every((d) => d.status === VERIFICATION_STATUS.APPROVED)) {
    return VERIFICATION_STATUS.APPROVED;
  }
  return VERIFICATION_STATUS.PENDING;
}

export async function farmerLogin({ mobile, password }) {
  await delay();
  if (!mobile || String(password || "").length < 4) {
    const err = new Error("Invalid mobile or password");
    err.status = 401;
    throw err;
  }
  return {
    token: "farmer-demo-token",
    farmer: {
      ...farmerDb,
      verificationStatus: computeVerificationStatus(documentsDb),
    },
  };
}

export async function getFarmerProfile() {
  await delay(250);
  return {
    ...farmerDb,
    verificationStatus: computeVerificationStatus(documentsDb),
  };
}

export async function updateFarmerProfile(payload) {
  await delay();
  farmerDb = { ...farmerDb, ...payload, bank: { ...farmerDb.bank, ...(payload.bank || {}) } };
  return farmerDb;
}

export async function changeFarmerPassword({ currentPassword, newPassword }) {
  await delay();
  if (!currentPassword || String(newPassword || "").length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  return { success: true };
}

export async function getDocuments() {
  await delay(250);
  return structuredClone(documentsDb);
}

export async function uploadDocument(type, fileMeta) {
  await delay(600);
  const idx = documentsDb.findIndex((d) => d.type === type);
  const next = {
    id: documentsDb[idx]?.id || `doc-${type}`,
    type,
    name: documentsDb[idx]?.name || type,
    fileName: fileMeta.name,
    fileUrl: fileMeta.url || URL.createObjectURL(fileMeta.file || new Blob()),
    uploadedAt: new Date().toISOString(),
    status: VERIFICATION_STATUS.PENDING,
    adminRemarks: "",
  };
  if (idx >= 0) documentsDb[idx] = next;
  else documentsDb.push(next);
  return structuredClone(next);
}

export async function deleteDocument(id) {
  await delay();
  const doc = documentsDb.find((d) => d.id === id);
  if (!doc) throw new Error("Document not found");
  if (doc.status === VERIFICATION_STATUS.APPROVED) {
    throw new Error("Approved documents cannot be deleted");
  }
  documentsDb = documentsDb.map((d) =>
    d.id === id
      ? {
          ...d,
          fileName: "",
          fileUrl: "",
          uploadedAt: null,
          status: VERIFICATION_STATUS.NOT_UPLOADED,
          adminRemarks: "",
        }
      : d
  );
  return { success: true };
}

export async function submitDocumentsForVerification() {
  await delay();
  documentsDb = documentsDb.map((d) =>
    d.fileName && d.status !== VERIFICATION_STATUS.APPROVED
      ? { ...d, status: VERIFICATION_STATUS.PENDING }
      : d
  );
  return {
    success: true,
    verificationStatus: computeVerificationStatus(documentsDb),
  };
}

export async function getDashboardStats() {
  await delay(300);
  const totalProducts = productsDb.length;
  const availableStock = productsDb.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const totalOrders = ordersDb.length;
  const pendingOrders = ordersDb.filter((o) =>
    ["New", "Confirmed", "Processing"].includes(o.status)
  ).length;
  return {
    totalProducts,
    availableStock,
    totalOrders,
    pendingOrders,
    totalEarnings: earningsDb.totalEarnings,
    recentOrders: ordersDb.slice(0, 5),
    lowStockProducts: productsDb.filter((p) => p.stock <= p.lowStockLimit),
    recentEarnings: earningsDb.transactions.slice(0, 5),
  };
}

export async function getProducts({ q = "", status = "", sort = "newest", page = 1, limit = 10 } = {}) {
  await delay(300);
  let list = [...productsDb];
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle)
    );
  }
  if (status) list = list.filter((p) => p.status === status);
  if (sort === "price-asc") list.sort((a, b) => a.sellingPrice - b.sellingPrice);
  else if (sort === "price-desc") list.sort((a, b) => b.sellingPrice - a.sellingPrice);
  else if (sort === "stock") list.sort((a, b) => a.stock - b.stock);
  else list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const total = list.length;
  const start = (page - 1) * limit;
  return {
    products: list.slice(start, start + limit),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProductById(id) {
  await delay(200);
  const product = productsDb.find((p) => p.id === id);
  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return structuredClone(product);
}

export async function getProductGradeChart(productId) {
  await delay(200);
  const source = MOCK_PRODUCT_GRADE_CHARTS[productId] || [];
  const rows = structuredClone(source).map((row, index) => {
    const aTotal = Number(row.gradeAQty) * Number(row.gradeARate);
    const bTotal = Number(row.gradeBQty) * Number(row.gradeBRate);
    return {
      ...row,
      srNo: index + 1,
      aTotal,
      bTotal,
      abTotal: aTotal + bTotal,
    };
  });

  const totalRupees = rows.reduce((s, r) => s + Number(r.abTotal || 0), 0);
  // Demo: ~70% collected; rest pending — replace with API settlement later
  const deposited = Math.round(totalRupees * 0.7);
  const balance = Math.max(0, totalRupees - deposited);

  return {
    rows,
    summary: {
      totalRupees,
      deposited,
      balance,
    },
  };
}

export async function createProduct(payload) {
  await delay(500);
  const product = {
    id: `fp-${Date.now()}`,
    sku: payload.sku || `FRM-${Date.now().toString().slice(-6)}`,
    lowStockLimit: Number(payload.lowStockLimit) || 10,
    updatedAt: new Date().toISOString(),
    images: payload.images?.length ? payload.images : ["/categories/grocery.webp"],
    ...payload,
    stock: Number(payload.stock ?? payload.availableQuantity) || 0,
    availableQuantity: Number(payload.availableQuantity ?? payload.stock) || 0,
    gradeAQty: Number(payload.gradeAQty) || 0,
    gradeBQty: Number(payload.gradeBQty) || 0,
    grades: payload.grades || [],
    farmLocation: payload.farmLocation || "",
    availableForDelivery: payload.availableForDelivery !== false,
    sellingPrice: Number(payload.sellingPrice) || 0,
    mrp: Number(payload.mrp) || 0,
  };
  productsDb = [product, ...productsDb];
  return structuredClone(product);
}

export async function updateProduct(id, payload) {
  await delay(500);
  const idx = productsDb.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error("Product not found");
  productsDb[idx] = {
    ...productsDb[idx],
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  return structuredClone(productsDb[idx]);
}

export async function deleteProduct(id) {
  await delay();
  productsDb = productsDb.filter((p) => p.id !== id);
  return { success: true };
}

export async function getInventory() {
  await delay(250);
  return productsDb.map((p) => ({
    id: p.id,
    product: p.name,
    sku: p.sku,
    currentStock: p.stock,
    unit: p.unit,
    lowStockLimit: p.lowStockLimit,
    status: p.stock <= 0 ? "Out of Stock" : p.stock <= p.lowStockLimit ? "Low Stock" : "In Stock",
    lastUpdated: p.updatedAt,
  }));
}

export async function adjustStock({ productId, change, reason }) {
  await delay(400);
  const idx = productsDb.findIndex((p) => p.id === productId);
  if (idx < 0) throw new Error("Product not found");
  const nextStock = Math.max(0, Number(productsDb[idx].stock) + Number(change));
  productsDb[idx] = {
    ...productsDb[idx],
    stock: nextStock,
    status: nextStock <= 0 ? "Out of Stock" : productsDb[idx].status === "Out of Stock" ? "Approved" : productsDb[idx].status,
    updatedAt: new Date().toISOString(),
  };
  const entry = {
    id: `sh-${Date.now()}`,
    productId,
    productName: productsDb[idx].name,
    change: Number(change),
    reason: reason || "Stock adjustment",
    stockAfter: nextStock,
    at: new Date().toISOString(),
  };
  stockHistoryDb = [entry, ...stockHistoryDb];
  return { product: structuredClone(productsDb[idx]), history: entry };
}

export async function getStockHistory() {
  await delay(200);
  return structuredClone(stockHistoryDb);
}

export async function getOrders({ status = "", q = "" } = {}) {
  await delay(300);
  let list = [...ordersDb];
  if (status) list = list.filter((o) => o.status === status);
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(needle) ||
        o.customer.name.toLowerCase().includes(needle) ||
        o.products.some((p) => p.name.toLowerCase().includes(needle))
    );
  }
  return list.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
}

export async function getOrderById(id) {
  await delay(200);
  const order = ordersDb.find((o) => o.id === id);
  if (!order) throw new Error("Order not found");
  return structuredClone(order);
}

export async function updateOrderStatus(id, status, note = "") {
  await delay(400);
  const idx = ordersDb.findIndex((o) => o.id === id);
  if (idx < 0) throw new Error("Order not found");
  const timelineNote =
    note ||
    (status === "Ready for Pickup"
      ? "Ready — delivery/operations notified"
      : `Status updated to ${status}`);
  ordersDb[idx] = {
    ...ordersDb[idx],
    status,
    timeline: [
      ...ordersDb[idx].timeline,
      { status, at: new Date().toISOString(), note: timelineNote },
    ],
  };
  return structuredClone(ordersDb[idx]);
}

export async function getEarnings() {
  await delay(250);
  return structuredClone(earningsDb);
}
