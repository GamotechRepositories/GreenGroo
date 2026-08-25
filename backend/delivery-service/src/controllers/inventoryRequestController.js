import InventoryRequest from "../models/InventoryRequest.js";
import StoreInventory from "../models/StoreInventory.js";
import DeliveryManager from "../models/DeliveryManager.js";
import Staff from "../../../staff-service/src/models/Staff.js";

const REVIEWER_ROLES = new Set([
  "product_manager",
  "vendor",
  "segregation_manager",
  "admin",
]);

const makeRequestNumber = () =>
  `INV-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;

const resolveManager = async (req) => {
  let manager = await DeliveryManager.findById(req.user.id);
  if (!manager && req.user.email) {
    manager = await DeliveryManager.findOne({ email: req.user.email });
  }
  return manager;
};

export const createInventoryRequest = async (req, res, next) => {
  try {
    const manager = await resolveManager(req);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Delivery manager not found",
      });
    }

    const sku = String(req.body.sku || "").trim();
    const quantity = Number(req.body.quantity);
    const note = String(req.body.note || "").trim();
    const productName = String(req.body.productName || req.body.name || "").trim();
    const unit = String(req.body.unit || "pcs").trim() || "pcs";
    const category = String(req.body.category || "General").trim() || "General";

    if (!sku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required",
      });
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Request quantity must be at least 1",
      });
    }

    let item = await StoreInventory.findOne({
      managerId: manager._id,
      sku,
    });
    if (!item) {
      item = await StoreInventory.create({
        managerId: manager._id,
        sku,
        name: productName || sku,
        category,
        unit,
        stockCount: 0,
        isActive: true,
      });
    }

    const existingPending = await InventoryRequest.findOne({
      managerId: manager._id,
      sku,
      status: "pending",
    });
    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: `A pending request already exists for ${item.name} (${existingPending.requestNumber})`,
        request: existingPending.toSafeJSON(),
      });
    }

    const request = await InventoryRequest.create({
      requestNumber: makeRequestNumber(),
      managerId: manager._id,
      storeName: manager.storeName || `${manager.area} Store`,
      managerName: manager.name || "",
      city: manager.city || "",
      area: manager.area || "",
      sku: item.sku,
      productName: item.name,
      category: item.category || "General",
      unit: item.unit || "pcs",
      quantity: Math.floor(quantity),
      currentStock: item.stockCount || 0,
      note,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: `Inventory request ${request.requestNumber} sent to Product Manager`,
      request: request.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const listMyInventoryRequests = async (req, res, next) => {
  try {
    const manager = await resolveManager(req);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Delivery manager not found",
      });
    }

    const status = String(req.query.status || "").trim();
    const filter = { managerId: manager._id };
    if (["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const requests = await InventoryRequest.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: requests.length,
      requests: requests.map((r) => r.toSafeJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const listAllInventoryRequests = async (req, res, next) => {
  try {
    if (!REVIEWER_ROLES.has(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Only product managers can review inventory requests",
      });
    }

    const status = String(req.query.status || "").trim();
    const filter = {};
    if (["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const requests = await InventoryRequest.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: requests.length,
      requests: requests.map((r) => r.toSafeJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const reviewInventoryRequest = async (req, res, next) => {
  try {
    if (!REVIEWER_ROLES.has(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Only product managers can review inventory requests",
      });
    }

    const decision = String(req.body.decision || req.body.status || "")
      .trim()
      .toLowerCase();
    const reviewNote = String(req.body.note || req.body.reviewNote || "").trim();

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision must be "approved" or "rejected"',
      });
    }

    const request = await InventoryRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Inventory request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    let reviewerName = req.user.email || "Product Manager";
    if (req.user.role !== "admin") {
      const staff = await Staff.findById(req.user.id).select("name email");
      if (staff) reviewerName = staff.name || staff.email || reviewerName;
    }

    if (decision === "approved") {
      const updated = await StoreInventory.findOneAndUpdate(
        { managerId: request.managerId, sku: request.sku },
        { $inc: { stockCount: request.quantity } },
        { new: true }
      );

      if (!updated) {
        await StoreInventory.create({
          managerId: request.managerId,
          sku: request.sku,
          name: request.productName,
          category: request.category || "General",
          unit: request.unit || "pcs",
          stockCount: request.quantity,
          isActive: true,
        });
      }
    }

    request.status = decision;
    request.reviewedBy = req.user.id;
    request.reviewedByName = reviewerName;
    request.reviewNote = reviewNote;
    request.reviewedAt = new Date();
    await request.save();

    return res.json({
      success: true,
      message:
        decision === "approved"
          ? `Approved — ${request.quantity} ${request.unit} added to ${request.storeName}`
          : "Inventory request rejected",
      request: request.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
