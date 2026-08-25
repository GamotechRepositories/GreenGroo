import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import StoreInventory from "../models/StoreInventory.js";
import StoreOrder from "../models/StoreOrder.js";
import Shift from "../models/Shift.js";
import { getIO } from "../../../socket.js";
import { dispatchNextRider } from "../services/dispatchService.js";
import InventoryRequest from "../models/InventoryRequest.js";
import { deductOrderStock } from "../services/storeStockService.js";
import { seedManagerStore } from "../services/seedManagerStore.js";
import { pickDemoOrderItems } from "../data/storeProductCatalog.js";

const getManager = async (req) => {
  let manager = await DeliveryManager.findById(req.user.id);
  if (!manager) {
    if (req.user.email || req.user.phone) {
      manager = await DeliveryManager.findOne({
        $or: [{ email: req.user.email }, { phone: req.user.phone }],
      });
    }
    if (!manager) {
      manager = await DeliveryManager.findOne({ isActive: true }).sort({ createdAt: 1 });
    }
    if (!manager) {
      manager = await DeliveryManager.create({
        name: "Baner Store Manager",
        email: req.user.email || "manager@greengroo.com",
        phone: req.user.phone || "9876500001",
        password: "hashedpassword123",
        storeName: "Baner Dark Store",
        storeAddress: "Plot 14, Main Road, Baner, Pune",
        city: "Pune",
        cityId: "pune",
        area: "Baner",
        state: "Maharashtra",
        isActive: true,
      });
    }
  }
  return manager;
};

const stockMapForManager = async (managerId) => {
  const rows = await StoreInventory.find({ managerId, isActive: true });
  return new Map(rows.map((r) => [r.sku, r]));
};

const areaMatch = (manager) => ({
  $or: [
    { managerId: manager._id },
    {
      managerId: { $in: [null, undefined] },
      $or: [
        { cityId: manager.cityId, area: manager.area },
        { city: manager.city, area: manager.area },
      ],
    },
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
    await seedManagerStore(manager);
    const [
      incoming,
      inventoryCount,
      lowStock,
      ridersOnline,
      ridersTotal,
      pendingDrivers,
      pendingInventoryRequests,
    ] = await Promise.all([
      StoreOrder.countDocuments({
        managerId: manager._id,
        status: { $in: ["incoming", "order_received", "stock_issue"] },
      }),
      StoreInventory.countDocuments({ managerId: manager._id, isActive: true }),
      StoreInventory.countDocuments({
        managerId: manager._id,
        isActive: true,
        $expr: {
          $and: [
            { $gt: ["$stockCount", 0] },
            { $lte: ["$stockCount", { $ifNull: ["$lowStockThreshold", 10] }] },
          ],
        },
      }),
      DeliveryBoy.countDocuments(
        riderQuery(manager, { isActive: true, status: "online" })
      ),
      DeliveryBoy.countDocuments({}),
      DeliveryBoy.countDocuments({
        $or: [
          { verificationStatus: "pending" },
          { verificationStatus: { $exists: false } },
          { verificationStatus: null },
        ],
      }),
      InventoryRequest.countDocuments({
        managerId: manager._id,
        status: "pending",
      }),
    ]);

    return res.json({
      success: true,
      manager: manager.toSafeJSON(),
      summary: {
        incomingOrders: incoming,
        inventorySkus: inventoryCount,
        lowStockItems: lowStock,
        pendingInventoryRequests,
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
    await seedManagerStore(manager);
    const statusFilter = req.query.status
      ? String(req.query.status).split(",")
      : ["incoming", "order_received", "stock_issue", "packed", "offered", "assigned", "out_for_delivery"];

    const orders = await StoreOrder.find({
      managerId: manager._id,
      status: { $in: statusFilter },
    }).sort({ createdAt: -1 });

    const stockMap = await stockMapForManager(manager._id);

    return res.json({
      success: true,
      darkStoreQrCode: `DARKSTORE_${manager._id}`,
      darkStoreName: manager.storeName || `${manager.area} Dark Store`,
      orders: orders.map((o) => o.toSafeJSON(stockMap)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manager marks order as "packed", which automatically triggers Round-Robin auto-dispatch!
 */
export const packOrder = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { orderId } = req.params;

    const order = await StoreOrder.findOne({
      _id: orderId,
      managerId: manager._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["incoming", "order_received", "stock_issue"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be packed (current status: ${order.status})`,
      });
    }

    const stockResult = await deductOrderStock(manager._id, order);
    if (stockResult.empty) {
      return res.status(400).json({
        success: false,
        message: "No fulfilable items left on this order",
      });
    }
    if (stockResult.shortages?.length) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot confirm order — some items are out of stock at this dark store. Request inventory or inform the customer.",
        shortages: stockResult.shortages,
      });
    }

    order.status = "packed";
    order.packedAt = new Date();
    if (!order.darkStoreQrCode) {
      order.darkStoreQrCode = `DARKSTORE_${manager._id}`;
    }
    await order.save();

    // Trigger automated Round-Robin dispatch to eligible riders
    const dispatchResult = await dispatchNextRider(order._id);

    const stockMap = await stockMapForManager(manager._id);
    return res.json({
      success: true,
      message: dispatchResult.success
        ? `Order confirmed — stock deducted and offered to ${dispatchResult.offeredRider?.name} (10s window)`
        : "Order confirmed and stock deducted. " +
          (dispatchResult.message || "Waiting for available online riders."),
      dispatchResult,
      order: order.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a demo order for testing the full Dark Store & Round-Robin workflow easily.
 */
export const createDemoStoreOrder = async (req, res, next) => {
  try {
    const manager = await getManager(req);

    // IF AND ONLY IF at least one driver is online for this store location/slot, then only allow incoming demo order
    const onlineDriversCount = await DeliveryBoy.countDocuments({
      $or: [
        { cityId: manager.cityId, area: manager.area },
        { city: manager.city, area: manager.area },
      ],
      status: "online",
      isActive: true,
    });

    if (onlineDriversCount === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No delivery driver is currently online for this location/slot. Please bring a driver online first to receive/create incoming orders.",
      });
    }

    await seedManagerStore(manager);
    const inventory = await StoreInventory.find({
      managerId: manager._id,
      isActive: true,
    }).lean();
    const demoItems = pickDemoOrderItems(inventory, 3);
    if (demoItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No catalog items in this dark store to create an order",
      });
    }

    const orderNum = `ORD-${Date.now().toString().slice(-6)}`;

    const newOrder = await StoreOrder.create({
      orderNumber: orderNum,
      managerId: manager._id,
      city: manager.city || "Pune",
      cityId: manager.cityId || "pune",
      area: manager.area || "Mahalunge",
      customerName: req.body.customerName || "Akash Patil (Testing)",
      customerPhone: req.body.customerPhone || "9876543210",
      customerAddress:
        req.body.customerAddress ||
        "In front of Balewadi Stadium Gate, Mahalunge Road, Pune",
      customerLat: 18.5793,
      customerLng: 73.7712,
      items: demoItems,
      status: "order_received",
      darkStoreQrCode: `DARKSTORE_${manager._id}`,
      otpCode: "4321",
    });

    try {
      getIO().to(`store_${manager._id}`).emit("new_order_received", {
        orderId: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        itemsCount: newOrder.items.length,
      });
    } catch (e) {}

    const stockMap = await stockMapForManager(manager._id);
    return res.json({
      success: true,
      message: `Demo order #${orderNum} created successfully!`,
      order: newOrder.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

export const listInventory = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    await seedManagerStore(manager);
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
    const riders = await DeliveryBoy.find({}).sort({ status: -1, createdAt: -1 });

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
      $or: [
        { verificationStatus: "pending" },
        { verificationStatus: { $exists: false } },
        { verificationStatus: null },
      ],
    }).sort({ createdAt: -1, updatedAt: -1 });

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

    let rider = await DeliveryBoy.findOne({
      _id: riderId,
      $and: [areaMatch(manager)],
    });
    if (!rider) {
      rider = await DeliveryBoy.findById(riderId);
    }
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
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
      rider.managerId = manager._id;
      rider.storeId = manager._id.toString();
    } else {
      rider.isActive = false;
      rider.status = "offline";
      rider.verificationStatus = "rejected";
    }

      rider.verifiedAt = new Date();
      rider.verificationNote = note;
      await rider.save();



      try {
        getIO().to(`store_${manager._id}`).emit("rider_document_updated", {
          riderId: rider._id.toString(),
          documentType: "verification",
          verificationStatus: rider.verificationStatus,
          updatedAt: new Date().toISOString(),
        });
        getIO().to(`rider_${rider._id}`).emit("document_review_update", {
          documentType: "verification",
          verificationStatus: rider.verificationStatus,
          remarks: note,
        });
      } catch (err) {
        console.warn("[socket] verifyDriver emit failed:", err.message);
      }

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

    if (!["incoming", "order_received", "stock_issue", "packed"].includes(order.status)) {
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

    const stockResult = await deductOrderStock(manager._id, order);
    if (stockResult.empty) {
      order.status = "cancelled";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "No fulfilable items left on this order",
      });
    }
    if (stockResult.shortages?.length) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot assign — some items are out of stock. Inform customer or request restock.",
        shortages: stockResult.shortages,
      });
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

    rider.status = "on_delivery";
    rider.lastStatusAt = new Date();
    await rider.save();

    const freshStock = await stockMapForManager(manager._id);

    const orderPayload = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      totalAmount: order.totalAmount,
      assignedAt: order.assignedAt,
      status: order.status,
    };

    try {
      getIO().to(`rider_${rider._id}`).emit("new_order_assigned", orderPayload);
    } catch (err) {
      console.warn("[socket] assignOrder emit failed:", err.message);
    }

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

    if (order.assignedRiderId) {
      await DeliveryBoy.findByIdAndUpdate(order.assignedRiderId, {
        $set: { status: "online", lastStatusAt: new Date() },
      });
    }

    const stockMap = await stockMapForManager(manager._id);
    return res.json({
      success: true,
      order: order.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /drivers/:driverId
 * Returns complete aggregated driver details for manager view.
 */
export const getDriverDetails = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { driverId } = req.params;

    const rider = await DeliveryBoy.findById(driverId);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    // Today's date in Indian Standard Time (IST, UTC+5:30)
    const todayISTDateString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Query shifts for this rider
    const shifts = await Shift.find({
      "slots.bookings.deliveryPartnerId": rider._id,
    }).sort({ dateString: -1 }).limit(30);

    let bookedShiftsToday = 0;
    let completedShiftsToday = 0;
    const todayShifts = [];
    const recentShifts = [];

    for (const shift of shifts) {
      for (const slot of shift.slots || []) {
        for (const booking of slot.bookings || []) {
          if (booking.deliveryPartnerId?.toString() === rider._id.toString()) {
            const shiftItem = {
              shiftId: shift._id.toString(),
              shiftName: shift.name,
              shiftType: shift.type,
              dateString: shift.dateString,
              date: shift.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              bookingStatus: booking.status,
              bookedAt: booking.bookedAt,
              completedAt: booking.completedAt,
            };

            if (shift.dateString === todayISTDateString) {
              if (booking.status !== "CANCELLED") bookedShiftsToday++;
              if (booking.status === "COMPLETED") completedShiftsToday++;
              todayShifts.push(shiftItem);
            }
            recentShifts.push(shiftItem);
          }
        }
      }
    }

    const onlineMins = rider.todayOnlineMinutes || 0;
    const hours = Math.floor(onlineMins / 60);
    const mins = onlineMins % 60;
    const onlineTimeStr = `${hours}h ${mins}m`;

    return res.json({
      success: true,
      data: {
        driver: rider.toSafeJSON(),
        todayPerformance: {
          earnings: rider.todayEarnings || 0,
          completedOrders: rider.todayCompletedOrders || rider.todayOrderCount || 0,
          onlineMinutes: onlineMins,
          onlineTime: onlineTimeStr,
          shiftsBooked: bookedShiftsToday,
          completedShifts: completedShiftsToday,
        },
        wallet: {
          balance: rider.walletBalance || 0,
          todayEarnings: rider.todayEarnings || 0,
          lifetimeEarnings: rider.totalLifetimeEarnings || 0,
        },
        documents: rider.documents || {},
        selfie: rider.selfie || {},
        livenessPassed: rider.livenessPassed || false,
        livenessPassedAt: rider.livenessPassedAt || null,
        bankDetails: rider.bankDetails || {},
        todayShifts,
        recentShifts: recentShifts.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /drivers/:driverId/toggle-active
 * Toggles isActive status of delivery partner.
 */
export const toggleRiderActive = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const rider = await DeliveryBoy.findById(driverId);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    rider.isActive = !rider.isActive;
    if (!rider.isActive) {
      rider.status = "offline";
    }
    await rider.save();

    return res.json({
      success: true,
      message: `Driver status set to ${rider.isActive ? "Active" : "Inactive"}`,
      isActive: rider.isActive,
      driver: rider.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
