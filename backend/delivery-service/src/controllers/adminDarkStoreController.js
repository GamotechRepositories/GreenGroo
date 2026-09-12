import DeliveryManager from "../models/DeliveryManager.js";
import StoreInventory from "../models/StoreInventory.js";

const toCoord = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const citySlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const serializeStore = (store, extras = {}) => {
  if (!store) return extras;
  return {
    ...(typeof store.toSafeJSON === "function" ? store.toSafeJSON() : store),
    ...extras,
  };
};

export const listDarkStores = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { storeName: rx },
        { name: rx },
        { email: rx },
        { phone: rx },
        { city: rx },
        { area: rx },
        { state: rx },
        { storeAddress: rx },
      ];
    }
    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;

    const stores = await DeliveryManager.find(filter).sort({
      city: 1,
      area: 1,
      storeName: 1,
    });

    const counts = await StoreInventory.aggregate([
      { $match: { managerId: { $in: stores.map((s) => s._id) } } },
      {
        $group: {
          _id: "$managerId",
          skuCount: { $sum: 1 },
          inStockSkus: {
            $sum: { $cond: [{ $gt: ["$stockCount", 0] }, 1, 0] },
          },
          lowStockSkus: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$stockCount", 0] },
                    { $lte: ["$stockCount", "$lowStockThreshold"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalUnits: { $sum: "$stockCount" },
        },
      },
    ]);

    const countMap = new Map(
      counts.map((row) => [String(row._id), row])
    );

    return res.json({
      success: true,
      count: stores.length,
      stores: stores.map((store) => {
        const stock = countMap.get(store._id.toString()) || {};
        return serializeStore(store, {
          skuCount: stock.skuCount || 0,
          inStockSkus: stock.inStockSkus || 0,
          lowStockSkus: stock.lowStockSkus || 0,
          totalUnits: stock.totalUnits || 0,
        });
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const getDarkStore = async (req, res, next) => {
  try {
    const store = await DeliveryManager.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Dark store not found",
      });
    }

    const inventory = await StoreInventory.find({ managerId: store._id }).sort({ name: 1 });
    const items = inventory.map((row) => row.toSafeJSON());
    const skuCount = items.length;
    const inStockSkus = items.filter((row) => row.stockCount > 0).length;
    const lowStockSkus = items.filter((row) => row.isLowStock).length;
    const totalUnits = items.reduce((sum, row) => sum + Number(row.stockCount || 0), 0);

    return res.json({
      success: true,
      store: serializeStore(store, { skuCount, inStockSkus, lowStockSkus, totalUnits }),
      inventory: items,
      stats: { skuCount, inStockSkus, lowStockSkus, totalUnits },
    });
  } catch (error) {
    next(error);
  }
};

export const listDarkStoreInventory = async (req, res, next) => {
  try {
    const store = await DeliveryManager.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: "Dark store not found" });
    }
    const inventory = await StoreInventory.find({ managerId: store._id }).sort({ name: 1 });
    const items = inventory.map((row) => row.toSafeJSON());
    return res.json({
      success: true,
      store: serializeStore(store),
      data: items,
      stats: {
        skuCount: items.length,
        inStockSkus: items.filter((row) => row.stockCount > 0).length,
        lowStockSkus: items.filter((row) => row.isLowStock).length,
        totalUnits: items.reduce((sum, row) => sum + Number(row.stockCount || 0), 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDarkStoreInventoryItem = async (req, res, next) => {
  try {
    const store = await DeliveryManager.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: "Dark store not found" });
    }

    const item = await StoreInventory.findOne({
      _id: req.params.itemId,
      managerId: store._id,
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    if (req.body.name != null) item.name = String(req.body.name).trim() || item.name;
    if (req.body.category != null) item.category = String(req.body.category).trim() || item.category;
    if (req.body.unit != null) item.unit = String(req.body.unit).trim() || item.unit;
    if (req.body.price != null) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ success: false, message: "Price must be a non-negative number" });
      }
      item.price = price;
    }
    if (req.body.stockCount != null) {
      const stockCount = Number(req.body.stockCount);
      if (!Number.isFinite(stockCount) || stockCount < 0) {
        return res.status(400).json({ success: false, message: "Stock must be a non-negative number" });
      }
      item.stockCount = Math.floor(stockCount);
    }
    if (req.body.lowStockThreshold != null) {
      const low = Number(req.body.lowStockThreshold);
      if (!Number.isFinite(low) || low < 0) {
        return res.status(400).json({ success: false, message: "Low-stock threshold must be non-negative" });
      }
      item.lowStockThreshold = Math.floor(low);
    }
    if (typeof req.body.isActive === "boolean") item.isActive = req.body.isActive;

    await item.save();
    return res.json({
      success: true,
      message: "Inventory updated",
      data: item.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const adjustDarkStoreInventoryItem = async (req, res, next) => {
  try {
    const store = await DeliveryManager.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: "Dark store not found" });
    }

    const item = await StoreInventory.findOne({
      _id: req.params.itemId,
      managerId: store._id,
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    const delta = Number(req.body.change ?? req.body.delta ?? 0);
    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ success: false, message: "Enter a non-zero quantity to adjust" });
    }

    const nextStock = Math.max(0, Number(item.stockCount || 0) + Math.trunc(delta));
    item.stockCount = nextStock;
    await item.save();

    return res.json({
      success: true,
      message: "Stock adjusted",
      data: item.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const createDarkStoreInventoryItem = async (req, res, next) => {
  try {
    const store = await DeliveryManager.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: "Dark store not found" });
    }

    const sku = String(req.body.sku || "").trim();
    const name = String(req.body.name || "").trim();
    if (!sku || !name) {
      return res.status(400).json({ success: false, message: "SKU and name are required" });
    }

    const existing = await StoreInventory.findOne({ managerId: store._id, sku });
    if (existing) {
      return res.status(409).json({ success: false, message: "An item with this SKU already exists" });
    }

    const item = await StoreInventory.create({
      managerId: store._id,
      sku,
      name,
      category: String(req.body.category || "General").trim(),
      unit: String(req.body.unit || "pcs").trim(),
      price: Math.max(0, Number(req.body.price) || 0),
      stockCount: Math.max(0, Math.floor(Number(req.body.stockCount) || 0)),
      lowStockThreshold: Math.max(0, Math.floor(Number(req.body.lowStockThreshold) || 10)),
      isActive: req.body.isActive !== false,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory item created",
      data: item.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const updateDarkStoreLocation = async (req, res, next) => {
  try {
    const store = await DeliveryManager.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Dark store not found",
      });
    }

    const storeName = String(req.body.storeName ?? "").trim();
    const name = String(req.body.name ?? "").trim();
    const state = String(req.body.state ?? "").trim();
    const city = String(req.body.city ?? "").trim();
    const area = String(req.body.area ?? "").trim();
    const storeAddress = String(req.body.storeAddress ?? req.body.address ?? "").trim();
    const latitude = toCoord(req.body.latitude ?? req.body.lat);
    const longitude = toCoord(req.body.longitude ?? req.body.lng);
    const geofenceRadius = toCoord(req.body.geofenceRadius);

    if (storeName) store.storeName = storeName;
    if (name) store.name = name;
    if (state) store.state = state;
    if (city) {
      store.city = city;
      store.cityId = citySlug(city);
    }
    if (area) store.area = area;
    if (storeAddress) store.storeAddress = storeAddress;

    if (latitude != null) {
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          message: "Latitude must be between -90 and 90",
        });
      }
      store.latitude = latitude;
    }

    if (longitude != null) {
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          message: "Longitude must be between -180 and 180",
        });
      }
      store.longitude = longitude;
    }

    if (latitude != null && longitude == null) {
      return res.status(400).json({
        success: false,
        message: "Longitude is required when setting latitude",
      });
    }
    if (longitude != null && latitude == null) {
      return res.status(400).json({
        success: false,
        message: "Latitude is required when setting longitude",
      });
    }

    if (geofenceRadius != null) {
      if (geofenceRadius < 50 || geofenceRadius > 50000) {
        return res.status(400).json({
          success: false,
          message: "Service radius must be between 50 and 50,000 metres",
        });
      }
      store.geofenceRadius = geofenceRadius;
    }

    if (typeof req.body.isActive === "boolean") {
      store.isActive = req.body.isActive;
    }

    await DeliveryManager.updateOne(
      { _id: store._id },
      {
        $set: {
          storeName: store.storeName,
          name: store.name,
          state: store.state,
          city: store.city,
          cityId: store.cityId,
          area: store.area,
          storeAddress: store.storeAddress,
          latitude: store.latitude,
          longitude: store.longitude,
          geofenceRadius: store.geofenceRadius,
          isActive: store.isActive,
        },
      }
    );

    const updated = await DeliveryManager.findById(store._id);

    return res.json({
      success: true,
      message: "Dark store location updated",
      store: serializeStore(updated),
    });
  } catch (error) {
    next(error);
  }
};
