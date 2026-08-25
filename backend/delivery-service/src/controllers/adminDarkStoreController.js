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
    return res.json({ success: true, store: serializeStore(store) });
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
