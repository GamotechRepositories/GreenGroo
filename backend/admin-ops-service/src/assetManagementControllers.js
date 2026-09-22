import mongoose from "mongoose";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import DeliveryBoy from "../../delivery-service/src/models/DeliveryBoy.js";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import {
  OpsAsset,
  ASSET_ROLES,
  ASSET_TYPES,
  ASSET_STATUSES,
  ASSET_CONDITIONS,
} from "./models.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

function normalizeRole(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (raw === "manager" || raw === "delivery-manager") return "delivery_manager";
  if (raw === "rider" || raw === "boy" || raw === "delivery-boy") return "delivery_boy";
  if (ASSET_ROLES.includes(raw)) return raw;
  return "";
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function serializeAsset(doc) {
  const row = doc?.toObject ? doc.toObject() : doc;
  return {
    id: String(row._id),
    darkStoreId: row.darkStoreId ? String(row.darkStoreId) : "",
    zoneKey: row.zoneKey || "",
    city: row.city || "",
    area: row.area || "",
    storeName: row.storeName || "",
    role: row.role,
    assigneeName: row.assigneeName || "",
    assigneePhone: row.assigneePhone || "",
    assigneeRefId: row.assigneeRefId || "",
    assetName: row.assetName || "",
    assetType: row.assetType || "other",
    assetCode: row.assetCode || "",
    serialNumber: row.serialNumber || "",
    quantity: row.quantity || 1,
    condition: row.condition || "good",
    status: row.status || "assigned",
    assignedAt: row.assignedAt || row.createdAt || null,
    returnedAt: row.returnedAt || null,
    notes: row.notes || "",
    createdBy: row.createdBy || "",
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

export async function listAssetZones(req, res, next) {
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
      };
      existing.storeCount += 1;
      if (manager.isActive !== false) existing.activeStoreCount += 1;
      byZone.set(zoneKey, existing);
    }

    const zones = [...byZone.values()].sort((a, b) => a.name.localeCompare(b.name));
    return ok(res, zones, { count: zones.length });
  } catch (error) {
    next(error);
  }
}

export async function listAssetStores(req, res, next) {
  try {
    const zoneKey = String(req.params.zoneKey || "").trim();
    if (!zoneKey) return fail(res, 400, "Zone is required");

    const managers = await DeliveryManager.find().select("-password").sort({ area: 1, storeName: 1 }).lean();
    const storesInZone = managers.filter((m) => matchZone(m, zoneKey));
    if (!storesInZone.length) {
      return ok(res, [], { count: 0, zone: { zoneKey, name: zoneKey } });
    }

    const storeIds = storesInZone.map((m) => m._id);
    const assetCounts = await OpsAsset.aggregate([
      { $match: { darkStoreId: { $in: storeIds } } },
      { $group: { _id: "$darkStoreId", count: { $sum: 1 } } },
    ]);
    const countById = Object.fromEntries(assetCounts.map((r) => [String(r._id), r.count]));

    const zoneName = storesInZone[0]?.city || zoneKey;
    const data = storesInZone.map((manager) =>
      serializeStore(manager, { assetCount: countById[String(manager._id)] || 0 })
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

export async function listAssetRolePeople(req, res, next) {
  try {
    const storeId = String(req.params.storeId || "").trim();
    const role = normalizeRole(req.query.role || req.params.role);
    if (!mongoose.Types.ObjectId.isValid(storeId)) return fail(res, 400, "Invalid dark store id");
    if (!role) return fail(res, 400, "Valid role is required");

    const manager = await DeliveryManager.findById(storeId).select("-password").lean();
    if (!manager) return fail(res, 404, "Dark store not found");

    let people = [];

    if (role === "delivery_manager") {
      people = [
        {
          id: String(manager._id),
          name: manager.name || manager.storeName || "Delivery manager",
          phone: manager.phone || "",
          label: manager.storeName || manager.name || "",
        },
      ];
    } else if (role === "delivery_boy") {
      const boys = await DeliveryBoy.find({ managerId: manager._id })
        .select("name phone vehicleType status")
        .sort({ name: 1 })
        .lean();
      people = boys.map((b) => ({
        id: String(b._id),
        name: b.name || "Delivery boy",
        phone: b.phone || "",
        label: b.vehicleType || b.status || "",
      }));
    } else if (role === "customer") {
      const orders = await StoreOrder.find({
        $or: [{ darkStoreId: manager._id }, { managerId: manager._id }],
      })
        .select("customerName customerPhone")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();
      const seen = new Set();
      for (const order of orders) {
        const phone = normalizePhone(order.customerPhone);
        if (!phone || seen.has(phone)) continue;
        seen.add(phone);
        people.push({
          id: phone,
          name: order.customerName || "Customer",
          phone,
          label: "Customer",
        });
        if (people.length >= 50) break;
      }
    } else if (role === "admin") {
      // Free-form assignment; optional recent creators from existing assets
      const prior = await OpsAsset.find({ role: "admin", darkStoreId: manager._id })
        .select("assigneeName assigneePhone assigneeRefId")
        .sort({ createdAt: -1 })
        .limit(40)
        .lean();
      const seen = new Set();
      for (const row of prior) {
        const phone = normalizePhone(row.assigneePhone);
        const key = phone || String(row.assigneeName || "").toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        people.push({
          id: row.assigneeRefId || phone || key,
          name: row.assigneeName || "Admin",
          phone,
          label: "Previously assigned",
        });
      }
    }

    return ok(res, people, {
      count: people.length,
      store: serializeStore(manager),
      role,
      roles: ASSET_ROLES,
      assetTypes: ASSET_TYPES,
      statuses: ASSET_STATUSES,
      conditions: ASSET_CONDITIONS,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAssets(req, res, next) {
  try {
    const storeId = String(req.params.storeId || req.query.darkStoreId || "").trim();
    const role = normalizeRole(req.query.role || req.params.role);
    if (!mongoose.Types.ObjectId.isValid(storeId)) return fail(res, 400, "Invalid dark store id");
    if (!role) return fail(res, 400, "Valid role is required");

    const manager = await DeliveryManager.findById(storeId).select("-password").lean();
    if (!manager) return fail(res, 404, "Dark store not found");

    const filter = { darkStoreId: manager._id, role };
    const search = String(req.query.search || req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    if (status && ASSET_STATUSES.includes(status)) filter.status = status;

    let assets = await OpsAsset.find(filter).sort({ assignedAt: -1, createdAt: -1 }).lean();

    if (search) {
      const needle = search.toLowerCase();
      const digits = search.replace(/\D/g, "");
      assets = assets.filter((row) => {
        const hay = [row.assigneeName, row.assigneePhone, row.assetName, row.assetCode, row.serialNumber, row.notes]
          .join(" ")
          .toLowerCase();
        if (hay.includes(needle)) return true;
        if (digits && String(row.assigneePhone || "").includes(digits)) return true;
        return false;
      });
    }

    return ok(res, assets.map(serializeAsset), {
      count: assets.length,
      store: serializeStore(manager),
      role,
      meta: {
        roles: ASSET_ROLES,
        assetTypes: ASSET_TYPES,
        statuses: ASSET_STATUSES,
        conditions: ASSET_CONDITIONS,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createAsset(req, res, next) {
  try {
    const storeId = String(req.params.storeId || req.body.darkStoreId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(storeId)) return fail(res, 400, "Invalid dark store id");

    const manager = await DeliveryManager.findById(storeId).select("-password").lean();
    if (!manager) return fail(res, 404, "Dark store not found");

    const role = normalizeRole(req.body.role);
    const assigneeName = String(req.body.assigneeName || "").trim();
    const assigneePhone = normalizePhone(req.body.assigneePhone);
    const assetName = String(req.body.assetName || "").trim();
    const assetType = String(req.body.assetType || "other").trim();

    if (!role) return fail(res, 400, "Role is required");
    if (!assigneeName) return fail(res, 400, "Assignee name is required");
    if (!/^[6-9]\d{9}$/.test(assigneePhone)) return fail(res, 400, "Enter a valid 10-digit phone number");
    if (!assetName) return fail(res, 400, "Asset name is required");
    if (!ASSET_TYPES.includes(assetType)) return fail(res, 400, "Invalid asset type");

    const condition = ASSET_CONDITIONS.includes(req.body.condition) ? req.body.condition : "good";
    const status = ASSET_STATUSES.includes(req.body.status) ? req.body.status : "assigned";
    const quantity = Math.max(1, Number(req.body.quantity) || 1);
    const zoneKey =
      String(req.body.zoneKey || manager.cityId || "").trim() || slugify(manager.city);

    const asset = await OpsAsset.create({
      darkStoreId: manager._id,
      zoneKey,
      city: manager.city || "",
      area: manager.area || "",
      storeName: manager.storeName || manager.name || "",
      role,
      assigneeName,
      assigneePhone,
      assigneeRefId: String(req.body.assigneeRefId || "").trim(),
      assetName,
      assetType,
      assetCode: String(req.body.assetCode || "").trim(),
      serialNumber: String(req.body.serialNumber || "").trim(),
      quantity,
      condition,
      status,
      assignedAt: req.body.assignedAt ? new Date(req.body.assignedAt) : new Date(),
      notes: String(req.body.notes || "").trim(),
      createdBy: String(req.user?.name || req.user?.email || req.user?._id || "admin"),
    });

    return ok(res, serializeAsset(asset), { message: "Asset assigned successfully" });
  } catch (error) {
    next(error);
  }
}

export async function updateAsset(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) return fail(res, 400, "Invalid asset id");

    const asset = await OpsAsset.findById(id);
    if (!asset) return fail(res, 404, "Asset not found");

    if (req.body.assigneeName != null) asset.assigneeName = String(req.body.assigneeName).trim();
    if (req.body.assigneePhone != null) {
      const phone = normalizePhone(req.body.assigneePhone);
      if (!/^[6-9]\d{9}$/.test(phone)) return fail(res, 400, "Enter a valid 10-digit phone number");
      asset.assigneePhone = phone;
    }
    if (req.body.assetName != null) {
      const name = String(req.body.assetName).trim();
      if (!name) return fail(res, 400, "Asset name is required");
      asset.assetName = name;
    }
    if (req.body.assetType != null && ASSET_TYPES.includes(req.body.assetType)) {
      asset.assetType = req.body.assetType;
    }
    if (req.body.assetCode != null) asset.assetCode = String(req.body.assetCode).trim();
    if (req.body.serialNumber != null) asset.serialNumber = String(req.body.serialNumber).trim();
    if (req.body.quantity != null) asset.quantity = Math.max(1, Number(req.body.quantity) || 1);
    if (req.body.condition != null && ASSET_CONDITIONS.includes(req.body.condition)) {
      asset.condition = req.body.condition;
    }
    if (req.body.status != null && ASSET_STATUSES.includes(req.body.status)) {
      asset.status = req.body.status;
      if (req.body.status === "returned" && !asset.returnedAt) asset.returnedAt = new Date();
    }
    if (req.body.notes != null) asset.notes = String(req.body.notes).trim();
    if (req.body.assignedAt) asset.assignedAt = new Date(req.body.assignedAt);

    await asset.save();
    return ok(res, serializeAsset(asset), { message: "Asset updated" });
  } catch (error) {
    next(error);
  }
}

export async function deleteAsset(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) return fail(res, 400, "Invalid asset id");
    const asset = await OpsAsset.findByIdAndDelete(id);
    if (!asset) return fail(res, 404, "Asset not found");
    return ok(res, { id }, { message: "Asset deleted" });
  } catch (error) {
    next(error);
  }
}
