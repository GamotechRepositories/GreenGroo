import DeliveryBoy from "../../delivery-app/models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import StoreInventory from "../models/StoreInventory.js";
import StoreOrder from "../models/StoreOrder.js";

const getManager = async (req) => {
  const manager = await DeliveryManager.findById(req.user.id);
  if (!manager) {
    const err = new Error("Delivery manager not found");
    err.statusCode = 404;
    throw err;
  }
  return manager;
};

const stockMapForManager = async (managerId) => {
  const rows = await StoreInventory.find({ managerId, isActive: true });
  return new Map(rows.map((r) => [r.sku, r]));
};

const areaMatch = (manager) => ({
  $or: [
    { cityId: manager.cityId, area: manager.area },
    { city: manager.city, area: manager.area },
  ],
});

const approvedFilter = {
  $or: [
    { verificationStatus: "approved" },
    { verificationStatus: { $exists: false } },
  ],
};

const riderQuery = (manager, extra = {}) => ({
  ...extra,
  $and: [areaMatch(manager), approvedFilter],
});

const serializeRider = (r) => ({
  id: r._id.toString(),
  name: r.name || "Rider",
  phone: r.phone,
  vehicleType: r.vehicleType,
  status: r.status,
  city: r.city,
  cityId: r.cityId,
  area: r.area,
  language: r.language,
  documents: r.documents,
  selfie: r.selfie,
  bankDetails: r.bankDetails,
  livenessPassed: r.livenessPassed,
  lastSeenAt: r.lastSeenAt,
  lastStatusAt: r.lastStatusAt,
  onboardingComplete: r.onboardingComplete,
  onboardingStep: r.onboardingStep,
  verificationStatus: r.verificationStatus || "pending",
  verifiedAt: r.verifiedAt,
  verificationNote: r.verificationNote || "",
  isActive: r.isActive,
  createdAt: r.createdAt,
});

export const getDashboardSummary = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const [
      incoming,
      inventoryCount,
      lowStock,
      ridersOnline,
      ridersTotal,
      pendingDrivers,
    ] = await Promise.all([
      StoreOrder.countDocuments({
        managerId: manager._id,
        status: { $in: ["incoming", "stock_issue"] },
      }),
      StoreInventory.countDocuments({ managerId: manager._id, isActive: true }),
      StoreInventory.countDocuments({
        managerId: manager._id,
        isActive: true,
        stockCount: { $gt: 0, $lte: 10 },
      }),
      DeliveryBoy.countDocuments(
        riderQuery(manager, { isActive: true, status: "online" })
      ),
      DeliveryBoy.countDocuments(riderQuery(manager, { isActive: true })),
      DeliveryBoy.countDocuments({
        $and: [
          areaMatch(manager),
          { verificationStatus: "pending", onboardingComplete: true },
        ],
      }),
    ]);

    return res.json({
      success: true,
      manager: manager.toSafeJSON(),
      summary: {
        incomingOrders: incoming,
        inventorySkus: inventoryCount,
        lowStockItems: lowStock,
        ridersOnline,
        ridersTotal,
        pendingDrivers,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listIncomingOrders = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const statusFilter = req.query.status
      ? String(req.query.status).split(",")
      : ["incoming", "stock_issue"];

    const orders = await StoreOrder.find({
      managerId: manager._id,
      status: { $in: statusFilter },
    }).sort({ createdAt: -1 });

    const stockMap = await stockMapForManager(manager._id);

    return res.json({
      success: true,
      orders: orders.map((o) => o.toSafeJSON(stockMap)),
    });
  } catch (error) {
    next(error);
  }
};

export const listInventory = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const items = await StoreInventory.find({
      managerId: manager._id,
      isActive: true,
    }).sort({ category: 1, name: 1 });

    return res.json({
      success: true,
      inventory: items.map((i) => i.toSafeJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const listRiders = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const riders = await DeliveryBoy.find(
      riderQuery(manager, { isActive: true })
    ).sort({ status: -1, name: 1 });

    return res.json({
      success: true,
      riders: riders.map(serializeRider),
    });
  } catch (error) {
    next(error);
  }
};

/** New drivers who finished onboarding and await manager approval. */
export const listPendingDrivers = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const riders = await DeliveryBoy.find({
      $and: [
        areaMatch(manager),
        { verificationStatus: "pending", onboardingComplete: true },
      ],
    }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      riders: riders.map(serializeRider),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDriver = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { riderId } = req.params;
    const decision = String(req.body.decision || "").toLowerCase();
    const note = String(req.body.note || "").trim();
    const checkedItems = Array.isArray(req.body.checkedItems)
      ? req.body.checkedItems.map((x) => String(x))
      : [];

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision must be "approved" or "rejected"',
      });
    }

    const rider = await DeliveryBoy.findOne({
      _id: riderId,
      $and: [areaMatch(manager)],
    });
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Driver not found for this store area",
      });
    }

    const requiredChecks = [
      "aadhaar",
      "pan",
      "passport",
      "license",
      "rc",
      "insurance",
      "selfie",
      "bankDetails",
      "liveness",
    ];

    if (decision === "approved") {
      const missing = requiredChecks.filter((k) => !checkedItems.includes(k));
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Tick all document checkboxes before completing verification",
          missing,
        });
      }

      for (const key of [
        "aadhaar",
        "pan",
        "passport",
        "license",
        "rc",
        "insurance",
      ]) {
        if (!rider.documents[key]) rider.documents[key] = {};
        rider.documents[key].status = "verified";
      }
      if (!rider.selfie) rider.selfie = {};
      rider.selfie.status = "verified";
      rider.livenessPassed = true;
      rider.isActive = true;
      rider.verificationStatus = "approved";
    } else {
      rider.isActive = false;
      rider.status = "offline";
      rider.verificationStatus = "rejected";
    }

    rider.verifiedAt = new Date();
    rider.verificationNote = note;
    await rider.save();

    return res.json({
      success: true,
      message:
        decision === "approved"
          ? "Verified — driver can go online now"
          : "Driver application rejected",
      rider: serializeRider(rider),
    });
  } catch (error) {
    next(error);
  }
};

/** Manager informs customer that an item is out of stock. */
export const informCustomer = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { orderId } = req.params;
    const itemId = String(req.body.itemId || "");

    const order = await StoreOrder.findOne({
      _id: orderId,
      managerId: manager._id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const stockMap = await stockMapForManager(manager._id);
    const stock = stockMap.get(item.sku);
    const available = stock ? stock.stockCount : 0;
    if (available >= item.quantity) {
      return res.status(400).json({
        success: false,
        message: "Item is available in stock — no need to inform customer",
      });
    }

    item.customerInformed = true;
    item.customerInformedAt = new Date();
    order.status = "stock_issue";
    order.notes = `Customer informed: "${item.name}" is not available.`;
    await order.save();

    // Notification stub — wire to notification-service later
    const notification = {
      to: order.customerPhone || order.customerName,
      message: `Sorry — "${item.name}" is currently not available for order ${order.orderNumber}.`,
      channel: "sms_stub",
      sentAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      message: "Customer informed about out-of-stock item",
      notification,
      order: order.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

/** Assign order to an available (preferably online) rider; deduct stock. */
export const assignOrder = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { orderId } = req.params;
    const riderId = String(req.body.riderId || "");

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "riderId is required",
      });
    }

    const order = await StoreOrder.findOne({
      _id: orderId,
      managerId: manager._id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["incoming", "stock_issue"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be assigned (status: ${order.status})`,
      });
    }

    const rider = await DeliveryBoy.findOne(
      riderQuery(manager, { _id: riderId, isActive: true })
    );
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found for this store area",
      });
    }

    const stockMap = await stockMapForManager(manager._id);
    const shortages = [];
    for (const item of order.items) {
      if (item.customerInformed) continue; // skipped item after customer informed
      const stock = stockMap.get(item.sku);
      const available = stock ? stock.stockCount : 0;
      if (available < item.quantity) {
        shortages.push({
          sku: item.sku,
          name: item.name,
          needed: item.quantity,
          available,
        });
      }
    }

    if (shortages.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot assign — some items are out of stock. Inform customer or wait for restock.",
        shortages,
      });
    }

    // Deduct stock for items still on the order
    for (const item of order.items) {
      if (item.customerInformed) continue;
      await StoreInventory.findOneAndUpdate(
        { managerId: manager._id, sku: item.sku },
        { $inc: { stockCount: -item.quantity } }
      );
    }

    // Remove informed OOS items from fulfilment
    const informedIds = order.items
      .filter((i) => i.customerInformed)
      .map((i) => i._id);
    for (const id of informedIds) {
      order.items.pull(id);
    }
    if (order.items.length === 0) {
      order.status = "cancelled";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "No fulfilable items left on this order",
      });
    }

    order.assignedRiderId = rider._id;
    order.assignedAt = new Date();
    order.status = "assigned";
    await order.save();

    const freshStock = await stockMapForManager(manager._id);

    return res.json({
      success: true,
      message: `Order assigned to ${rider.name || rider.phone}`,
      order: order.toSafeJSON(freshStock),
      rider: {
        id: rider._id.toString(),
        name: rider.name,
        phone: rider.phone,
        status: rider.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Mark delivered (optional — stock already deducted on assign). */
export const markDelivered = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const order = await StoreOrder.findOne({
      _id: req.params.orderId,
      managerId: manager._id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "assigned" && order.status !== "out_for_delivery") {
      return res.status(400).json({
        success: false,
        message: "Only assigned orders can be marked delivered",
      });
    }
    order.status = "delivered";
    order.deliveredAt = new Date();
    await order.save();
    const stockMap = await stockMapForManager(manager._id);
    return res.json({
      success: true,
      order: order.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};
