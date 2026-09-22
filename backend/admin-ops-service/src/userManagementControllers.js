import mongoose from "mongoose";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import Order from "../../legacy/models/order/Order.js";
import User from "../../legacy/models/user.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeAccountType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "bulk" || raw === "b2b" || raw === "wholesale") return "bulk";
  if (raw === "retail" || raw === "normal") return "retail";
  return "";
}

function orderItemQty(items = []) {
  return (items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function orderAmount(order) {
  const collect = Number(order.amountToCollect || 0);
  if (collect > 0) return collect;
  return (order.items || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
}

function matchZone(manager, zoneKey) {
  const key = String(zoneKey || "").trim().toLowerCase();
  if (!key) return false;
  const cityId = String(manager.cityId || "").trim().toLowerCase();
  const citySlug = slugify(manager.city);
  const city = String(manager.city || "").trim().toLowerCase();
  return cityId === key || citySlug === key || city === key;
}

function serializeStore(manager, extras = {}) {
  return {
    id: String(manager._id),
    storeName: manager.storeName || manager.name || "Dark store",
    name: manager.name || "",
    phone: manager.phone || "",
    email: manager.email || "",
    city: manager.city || "",
    cityId: manager.cityId || slugify(manager.city),
    area: manager.area || "",
    state: manager.state || "",
    storeAddress: manager.storeAddress || "",
    pincode: manager.pincode || "",
    isActive: manager.isActive !== false,
    ...extras,
  };
}

/** Distinct cities (zones) with dark-store counts. */
export async function listUserMgmtZones(req, res, next) {
  try {
    const managers = await DeliveryManager.find()
      .select("city cityId area storeName name isActive")
      .lean();

    const byZone = new Map();
    for (const manager of managers) {
      const city = String(manager.city || "").trim();
      if (!city) continue;
      const zoneKey = String(manager.cityId || "").trim() || slugify(city);
      const existing = byZone.get(zoneKey) || {
        zoneKey,
        name: city,
        city,
        cityId: zoneKey,
        storeCount: 0,
        activeStoreCount: 0,
        areas: new Set(),
      };
      existing.storeCount += 1;
      if (manager.isActive !== false) existing.activeStoreCount += 1;
      if (manager.area) existing.areas.add(manager.area);
      byZone.set(zoneKey, existing);
    }

    const zones = [...byZone.values()]
      .map((zone) => ({
        zoneKey: zone.zoneKey,
        name: zone.name,
        city: zone.city,
        cityId: zone.cityId,
        storeCount: zone.storeCount,
        activeStoreCount: zone.activeStoreCount,
        areaCount: zone.areas.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return ok(res, zones, { count: zones.length });
  } catch (error) {
    next(error);
  }
}

/** Dark stores inside a zone (city). */
export async function listUserMgmtStores(req, res, next) {
  try {
    const zoneKey = String(req.params.zoneKey || req.query.zone || "").trim();
    if (!zoneKey) return fail(res, 400, "Zone is required");

    const managers = await DeliveryManager.find().select("-password").sort({ area: 1, storeName: 1 }).lean();
    const storesInZone = managers.filter((m) => matchZone(m, zoneKey));
    if (!storesInZone.length) return ok(res, [], { count: 0, zone: { zoneKey, name: zoneKey } });

    const storeIds = storesInZone.map((m) => m._id);
    const orderStats = await StoreOrder.aggregate([
      {
        $match: {
          $or: [{ darkStoreId: { $in: storeIds } }, { managerId: { $in: storeIds } }],
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$darkStoreId", "$managerId"] },
          orderCount: { $sum: 1 },
          customerPhones: { $addToSet: "$customerPhone" },
        },
      },
    ]);
    const statsById = Object.fromEntries(
      orderStats.map((row) => [
        String(row._id),
        {
          orderCount: row.orderCount || 0,
          customerCount: (row.customerPhones || []).filter(Boolean).length,
        },
      ])
    );

    const zoneName = storesInZone[0]?.city || zoneKey;
    const data = storesInZone.map((manager) =>
      serializeStore(manager, statsById[String(manager._id)] || { orderCount: 0, customerCount: 0 })
    );

    return ok(res, data, {
      count: data.length,
      zone: {
        zoneKey: String(storesInZone[0]?.cityId || "").trim() || slugify(zoneName),
        name: zoneName,
        city: zoneName,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Users who ordered from a dark store, filtered by accountType (retail/bulk).
 * Supports search (name, phone, order id/number) and filters (area, qty, date).
 */
export async function listUserMgmtStoreUsers(req, res, next) {
  try {
    const storeId = String(req.params.storeId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return fail(res, 400, "Invalid dark store id");
    }

    const accountType = normalizeAccountType(req.query.accountType) || "retail";
    const search = String(req.query.search || req.query.q || "").trim();
    const areaFilter = String(req.query.area || "").trim().toLowerCase();
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
    const minOrders = Number(req.query.minOrders);
    const maxOrders = Number(req.query.maxOrders);
    const minQty = Number(req.query.minQty);
    const maxQty = Number(req.query.maxQty);
    const sortBy = String(req.query.sort || "lastOrderAt").trim();
    const sortDir = String(req.query.sortDir || "desc").toLowerCase() === "asc" ? 1 : -1;

    const manager = await DeliveryManager.findById(storeId).select("-password").lean();
    if (!manager) return fail(res, 404, "Dark store not found");

    const storeFilter = {
      $or: [{ darkStoreId: manager._id }, { managerId: manager._id }],
    };
    if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
      storeFilter.createdAt = { ...(storeFilter.createdAt || {}), $gte: dateFrom };
    }
    if (dateTo && !Number.isNaN(dateTo.getTime())) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      storeFilter.createdAt = { ...(storeFilter.createdAt || {}), $lte: end };
    }
    if (areaFilter) {
      storeFilter.area = new RegExp(`^${areaFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    const storeOrders = await StoreOrder.find(storeFilter)
      .select(
        "orderNumber sourceOrderId customerName customerPhone customerAddress area city createdAt items amountToCollect status"
      )
      .sort({ createdAt: -1 })
      .lean();

    const sourceIds = [
      ...new Set(
        storeOrders
          .map((o) => (o.sourceOrderId ? String(o.sourceOrderId) : ""))
          .filter(Boolean)
      ),
    ];

    const ecommerceOrders = sourceIds.length
      ? await Order.find({ _id: { $in: sourceIds } })
          .select("_id user orderNumber")
          .lean()
      : [];
    const orderUserBySource = new Map(
      ecommerceOrders.map((o) => [String(o._id), o.user ? String(o.user) : ""])
    );

    const phones = [
      ...new Set(storeOrders.map((o) => String(o.customerPhone || "").replace(/\D/g, "").slice(-10)).filter((p) => p.length === 10)),
    ];

    const userIdsFromOrders = [
      ...new Set([...orderUserBySource.values()].filter(Boolean)),
    ];
    const orClauses = [];
    if (userIdsFromOrders.length) {
      orClauses.push({ _id: { $in: userIdsFromOrders } });
    }
    if (phones.length) {
      orClauses.push({ phone: { $in: phones } });
    }

    const users = orClauses.length
      ? await User.find({
          role: { $ne: "admin" },
          accountType,
          $or: orClauses,
        })
          .select("name phone email accountType shopName shopAddress gstNumber addresses createdAt")
          .lean()
      : [];

    const userById = new Map(users.map((u) => [String(u._id), u]));
    const userByPhone = new Map(users.map((u) => [String(u.phone || "").replace(/\D/g, "").slice(-10), u]));

    const buckets = new Map();

    for (const order of storeOrders) {
      const sourceId = order.sourceOrderId ? String(order.sourceOrderId) : "";
      const linkedUserId = sourceId ? orderUserBySource.get(sourceId) : "";
      const phone = String(order.customerPhone || "").replace(/\D/g, "").slice(-10);
      let user = linkedUserId ? userById.get(linkedUserId) : null;
      if (!user && phone) user = userByPhone.get(phone) || null;

      // Only include rows that match accountType via User; skip unmatched for typed lists
      if (!user) continue;
      if (normalizeAccountType(user.accountType) !== accountType) continue;

      const key = String(user._id);
      const qty = orderItemQty(order.items);
      const amount = orderAmount(order);
      const existing = buckets.get(key) || {
        userId: key,
        name: user.name || order.customerName || "Customer",
        phone: user.phone || phone || "",
        email: user.email || "",
        accountType: user.accountType || accountType,
        shopName: user.shopName || "",
        shopAddress: user.shopAddress || "",
        gstNumber: user.gstNumber || "",
        orderCount: 0,
        totalQuantity: 0,
        totalAmount: 0,
        areas: new Set(),
        orderIds: [],
        orderNumbers: [],
        lastOrderAt: null,
        firstOrderAt: null,
        lastOrderNumber: "",
        lastArea: "",
        lastAddress: "",
      };

      existing.orderCount += 1;
      existing.totalQuantity += qty;
      existing.totalAmount += amount;
      if (order.area) existing.areas.add(order.area);
      if (order.orderNumber) existing.orderNumbers.push(String(order.orderNumber));
      if (sourceId) existing.orderIds.push(sourceId);
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (createdAt && (!existing.lastOrderAt || createdAt > existing.lastOrderAt)) {
        existing.lastOrderAt = createdAt;
        existing.lastOrderNumber = order.orderNumber || "";
        existing.lastArea = order.area || "";
        existing.lastAddress = order.customerAddress || "";
      }
      if (createdAt && (!existing.firstOrderAt || createdAt < existing.firstOrderAt)) {
        existing.firstOrderAt = createdAt;
      }
      buckets.set(key, existing);
    }

    let rows = [...buckets.values()].map((row) => ({
      userId: row.userId,
      name: row.name,
      phone: row.phone,
      email: row.email,
      accountType: row.accountType,
      shopName: row.shopName,
      shopAddress: row.shopAddress,
      gstNumber: row.gstNumber,
      orderCount: row.orderCount,
      totalQuantity: row.totalQuantity,
      totalAmount: row.totalAmount,
      areas: [...row.areas],
      lastOrderAt: row.lastOrderAt,
      firstOrderAt: row.firstOrderAt,
      lastOrderNumber: row.lastOrderNumber,
      lastArea: row.lastArea,
      lastAddress: row.lastAddress,
      orderNumbers: row.orderNumbers.slice(0, 20),
    }));

    if (search) {
      const needle = search.toLowerCase();
      const digits = search.replace(/\D/g, "");
      rows = rows.filter((row) => {
        const hay = [row.name, row.phone, row.email, row.shopName, row.lastOrderNumber, ...(row.orderNumbers || [])]
          .join(" ")
          .toLowerCase();
        if (hay.includes(needle)) return true;
        if (digits && String(row.phone || "").includes(digits)) return true;
        if (digits && (row.orderNumbers || []).some((n) => String(n).includes(digits))) return true;
        return false;
      });
    }

    if (Number.isFinite(minOrders) && minOrders > 0) {
      rows = rows.filter((row) => row.orderCount >= minOrders);
    }
    if (Number.isFinite(maxOrders) && maxOrders > 0) {
      rows = rows.filter((row) => row.orderCount <= maxOrders);
    }
    if (Number.isFinite(minQty) && minQty > 0) {
      rows = rows.filter((row) => row.totalQuantity >= minQty);
    }
    if (Number.isFinite(maxQty) && maxQty > 0) {
      rows = rows.filter((row) => row.totalQuantity <= maxQty);
    }

    rows.sort((a, b) => {
      const pick = (row) => {
        if (sortBy === "orderCount") return row.orderCount;
        if (sortBy === "totalQuantity") return row.totalQuantity;
        if (sortBy === "totalAmount") return row.totalAmount;
        if (sortBy === "name") return String(row.name || "").toLowerCase();
        return row.lastOrderAt ? new Date(row.lastOrderAt).getTime() : 0;
      };
      const av = pick(a);
      const bv = pick(b);
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir * av.localeCompare(bv);
      }
      return sortDir * ((Number(av) || 0) - (Number(bv) || 0));
    });

    const areas = [
      ...new Set(
        storeOrders
          .map((o) => String(o.area || "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    return ok(res, rows, {
      count: rows.length,
      store: serializeStore(manager),
      filters: {
        accountType,
        areas,
      },
      stats: {
        userCount: rows.length,
        orderCount: storeOrders.length,
        totalQuantity: rows.reduce((s, r) => s + r.totalQuantity, 0),
        totalAmount: rows.reduce((s, r) => s + r.totalAmount, 0),
      },
    });
  } catch (error) {
    next(error);
  }
}
