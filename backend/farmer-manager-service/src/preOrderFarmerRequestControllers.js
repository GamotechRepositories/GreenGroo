import mongoose from "mongoose";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import { Farmer, FarmerOrder } from "./models.js";
import { createFarmerOrder } from "./controllers.js";

const vendorIdOf = (req) => String(req.user?.vendorId || req.user?.id || "");

/** Runs an Express handler in-process and resolves with { status, body }. */
function runHandler(handler, req) {
  return new Promise((resolve, reject) => {
    let statusCode = 200;
    const res = {
      status(code) {
        statusCode = code;
        return res;
      },
      json(body) {
        resolve({ status: statusCode, body });
        return res;
      },
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

function serializeFarmerRequest(order, farmerById) {
  const farmer = farmerById.get(order.farmerId);
  return {
    id: order.id,
    storeOrderId: order.sourceStoreOrderId,
    orderNumber: order.sourceOrderNumber,
    farmerId: order.farmerId,
    farmerName: farmer?.name || farmer?.fullName || order.farmerId,
    farmerMobile: farmer?.mobile || "",
    products: (order.products || []).map((p) => ({ name: p.name, quantity: p.quantity, unit: p.unit })),
    requiredDate: order.requiredDate || "",
    status: order.status || "NEW",
    createdAt: order.createdAt,
  };
}

async function farmersById(ids) {
  const list = ids.length
    ? await Farmer.find({ id: { $in: [...new Set(ids)] } }).select("id name fullName mobile").lean()
    : [];
  return new Map(list.map((f) => [f.id, f]));
}

/** GET /api/vendor/preorders/farmer-requests — farmer requests this vendor raised for customer pre-orders. */
export async function listPreOrderFarmerRequests(req, res) {
  try {
    const orders = await FarmerOrder.find({ vendorId: vendorIdOf(req), sourceStoreOrderId: { $nin: ["", null] } })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    const farmerById = await farmersById(orders.map((o) => o.farmerId));
    res.json({ requests: orders.map((o) => serializeFarmerRequest(o, farmerById)) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load farmer requests" });
  }
}

/**
 * POST /api/vendor/preorders/:orderId/farmer-request
 * body { farmerId, products: [{ name, productId?, quantity, unit }], requiredDate?, note? }
 * Optional step: the vendor is short of stock for a confirmed pre-order and asks one of their farmers.
 */
export async function createPreOrderFarmerRequest(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    const farmerId = String(req.body?.farmerId || "").trim();
    if (!farmerId) return res.status(400).json({ message: "Select a farmer" });

    const products = (Array.isArray(req.body?.products) ? req.body.products : [])
      .map((p) => ({
        name: String(p?.name || "").trim(),
        productId: String(p?.productId || "").trim(),
        quantity: Number(p?.quantity || 0),
        unit: String(p?.unit || "Kg").trim() || "Kg",
      }))
      .filter((p) => p.name && p.quantity > 0);
    if (!products.length) return res.status(400).json({ message: "Add at least one item with a quantity" });

    const order = await StoreOrder.findOne({ _id: orderId, isPreOrder: true });
    if (!order) return res.status(404).json({ message: "Pre-order not found" });
    const store = await DeliveryManager.findById(order.managerId).select("vendorId storeName area").lean();
    if (store?.vendorId && String(store.vendorId) !== vendorId) {
      return res.status(403).json({ message: "This pre-order is not from one of your dark stores" });
    }
    if (order.status !== "preorder_hold") {
      return res.status(400).json({
        message: order.status === "cancelled" ? "This pre-order was cancelled" : "This pre-order has already been shipped",
      });
    }

    const requiredDate = String(req.body?.requiredDate || order.preOrderDate || "").slice(0, 10);
    const note = String(req.body?.note || "").trim().slice(0, 300);
    const result = await runHandler(createFarmerOrder, {
      params: { farmerId },
      user: req.user,
      body: {
        customer: {
          name: `Pre-order #${order.orderNumber}${note ? ` · ${note}` : ""}`,
          address: store?.storeName || store?.area || "",
        },
        products,
        unit: products[0].unit,
        requiredDate,
        pickupDate: requiredDate,
        sourceStoreOrderId: String(order._id),
        sourceOrderNumber: String(order.orderNumber || ""),
      },
    });
    if (result.status >= 400) {
      return res.status(result.status).json({ message: result.body?.message || "Could not send the farmer request" });
    }

    const farmerById = await farmersById([result.body.farmerId]);
    res.status(201).json({
      message: `Request sent to ${farmerById.get(result.body.farmerId)?.name || "the farmer"}`,
      request: serializeFarmerRequest(result.body.toObject ? result.body.toObject() : result.body, farmerById),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not send the farmer request" });
  }
}
