/**
 * Farmer-Manager feature port for Vendor panel.
 * Prefers /api/vendor/* endpoints (vendor auth). Aggregates where FM had
 * manager-wide list endpoints. Falls back to empty data so UI still loads.
 */
import { api, vendorApi } from "./vendorApi";

function unwrapList(res) {
  const data = res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.farmers)) return data.farmers;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.documents)) return data.documents;
  return [];
}

function farmerIdOf(f) {
  return f?.id || f?.farmerId || "";
}

async function listFarmers() {
  try {
    const res = await vendorApi.getFarmers();
    return unwrapList(res);
  } catch {
    return [];
  }
}

async function mapSettled(list, fn) {
  const results = await Promise.allSettled(list.map(fn));
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
}

/** Quality list — same /api/quality/pending?bucket= used by FM inventory. */
export async function listManagerQuality({ bucket = "pending" } = {}) {
  try {
    const res = await vendorApi.getQualityPending({ bucket });
    return res?.data || { items: [] };
  } catch {
    return { items: [] };
  }
}

export async function getManagerFarmers({ q = "", status = "" } = {}) {
  let farmers = await listFarmers();
  if (status) {
    farmers = farmers.filter((f) => String(f.status || "") === status);
  }
  if (q) {
    const needle = q.toLowerCase();
    farmers = farmers.filter(
      (f) =>
        String(f.name || "")
          .toLowerCase()
          .includes(needle) ||
        String(f.mobile || "").includes(needle) ||
        String(farmerIdOf(f)).toLowerCase().includes(needle)
    );
  }
  return farmers;
}

export async function getManagerAllProducts() {
  try {
    const res = await vendorApi.getProducts();
    const data = res?.data;
    if (data && (Array.isArray(data.products) || Array.isArray(data.farmers))) {
      return {
        farmers: Array.isArray(data.farmers) ? data.farmers : [],
        products: Array.isArray(data.products) ? data.products : unwrapList(res),
      };
    }
    return { farmers: await listFarmers(), products: unwrapList(res) };
  } catch {
    return { farmers: [], products: [] };
  }
}

export async function getManagerAllHarvestOrders() {
  try {
    const farmers = await listFarmers();
    if (!farmers.length) return { farmers: [], orders: [] };

    const perFarmer = await mapSettled(farmers, async (f) => {
      const id = farmerIdOf(f);
      if (!id) return [];
      try {
        const res = await vendorApi.getFarmerOrders(id);
        const orders = unwrapList(res);
        return orders.map((o) => ({
          ...o,
          farmerId: o.farmerId || id,
          farmerName: o.farmerName || f.name || "—",
          farmerMobile: o.farmerMobile || f.mobile || "",
        }));
      } catch {
        return [];
      }
    });

    const orders = perFarmer.flat().filter(Boolean);
    return { farmers, orders };
  } catch {
    return { farmers: [], orders: [] };
  }
}

export async function getManagerAllDocuments() {
  try {
    const farmers = await listFarmers();
    if (!farmers.length) return { farmers: [], documents: [] };

    const perFarmer = await mapSettled(farmers, async (f) => {
      const id = farmerIdOf(f);
      if (!id) return [];
      try {
        const res = await vendorApi.getFarmerDocuments(id);
        return unwrapList(res).map((d) => ({ ...d, farmerId: d.farmerId || id }));
      } catch {
        return [];
      }
    });

    return { farmers, documents: perFarmer.flat().filter(Boolean) };
  } catch {
    return { farmers: [], documents: [] };
  }
}

export async function getManagerFarmerById(farmerId) {
  const res = await vendorApi.getFarmerById(farmerId);
  return res?.data;
}

export async function getManagerFarmerProducts(farmerId) {
  try {
    const res = await vendorApi.getFarmerProducts(farmerId);
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    return unwrapList(res);
  } catch {
    return [];
  }
}

export async function getManagerFarmerOrders(farmerId) {
  try {
    const res = await vendorApi.getFarmerOrders(farmerId);
    return unwrapList(res);
  } catch {
    return [];
  }
}

export async function getManagerFarmerOrderById(farmerId, orderId) {
  const orders = await getManagerFarmerOrders(farmerId);
  const found = orders.find(
    (o) => String(o.id || o.orderId || o._id) === String(orderId)
  );
  if (found) return found;
  // Fallback: scan all harvest orders
  const all = await getManagerAllHarvestOrders();
  return (
    (all.orders || []).find((o) => String(o.id || o.orderId || o._id) === String(orderId)) ||
    null
  );
}

export async function createManagerOrder(farmerId, payload) {
  const res = await api.post(
    `/api/vendor/farmers/${encodeURIComponent(farmerId)}/orders`,
    payload
  );
  return res?.data;
}

export async function updateManagerFarmerOrder(farmerId, orderId, payload) {
  const res = await api.put(
    `/api/vendor/farmers/${encodeURIComponent(farmerId)}/orders/${encodeURIComponent(orderId)}`,
    payload
  );
  return res?.data;
}

export async function deleteManagerFarmerOrder(farmerId, orderId) {
  const res = await api.delete(
    `/api/vendor/farmers/${encodeURIComponent(farmerId)}/orders/${encodeURIComponent(orderId)}`
  );
  return res?.data;
}

export async function uploadManagerFarmerDocument(farmerId, type, fileMeta) {
  const res = await vendorApi.uploadFarmerDocument(farmerId, {
    type,
    fileName: fileMeta?.name || fileMeta?.fileName || "document",
    fileUrl: fileMeta?.url || fileMeta?.fileUrl || "",
  });
  return res?.data;
}

export async function updateManagerFarmerDocumentStatus(
  farmerId,
  documentId,
  status,
  rejectionReason = ""
) {
  const res = await api.patch(
    `/api/vendor/farmers/${encodeURIComponent(farmerId)}/documents/${encodeURIComponent(documentId)}/status`,
    { status, rejectionReason }
  );
  return res?.data;
}

export async function getManagerFarmerEarnings(farmerId) {
  try {
    const res = await vendorApi.getFarmerEarnings(farmerId);
    return unwrapList(res);
  } catch {
    return [];
  }
}

/** Stub: FM harvest-orders for logged-in farmer — not used by vendor aggregation. */
export async function getHarvestOrders() {
  return [];
}
