import crypto from "crypto";
import ReturnPickup from "../models/ReturnPickup.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import StoreOrder from "../models/StoreOrder.js";
import { getIO } from "../../../socket.js";
import { isS3Configured, uploadDataUrlToS3 } from "../services/s3Service.js";
import { RefundClaim } from "../../../admin-ops-service/src/models.js";
import Order from "../../../legacy/models/order/Order.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const RETURN_QR_TTL_MS = 24 * 60 * 60 * 1000;

function buildReturnQrPayload(returnId, token) {
  return `RETURN_PICKUP:${returnId}:${token}`;
}

function parseReturnQr(raw) {
  const value = String(raw || "").trim();
  if (!value.startsWith("RETURN_PICKUP:")) return null;
  const parts = value.split(":");
  return { returnId: parts[1], token: parts[2] || "" };
}

async function getManager(req) {
  let manager = await DeliveryManager.findById(req.user.id);
  if (!manager && (req.user.email || req.user.phone)) {
    manager = await DeliveryManager.findOne({
      $or: [
        ...(req.user.email ? [{ email: req.user.email }] : []),
        ...(req.user.phone ? [{ phone: req.user.phone }] : []),
      ],
    });
  }
  return manager;
}

function serializeReturn(doc, extras = {}) {
  if (!doc) return null;
  if (typeof doc.toSafeJSON === "function") return doc.toSafeJSON(extras);
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(row._id),
    claimId: row.claimId ? String(row.claimId) : null,
    sourceOrderId: row.sourceOrderId ? String(row.sourceOrderId) : null,
    orderNumber: row.orderNumber || "",
    managerId: row.managerId ? String(row.managerId) : "",
    darkStoreId: row.darkStoreId ? String(row.darkStoreId) : "",
    accountType: row.accountType || "retail",
    type: row.type || "refund",
    reason: row.reason || "",
    amount: row.amount || 0,
    customerName: row.customerName || "",
    customerPhone: row.customerPhone || "",
    customerAddress: row.customerAddress || "",
    status: row.status,
    assignedRiderId: row.assignedRiderId ? String(row.assignedRiderId) : null,
    assignedAt: row.assignedAt,
    pickupQrScanned: Boolean(row.pickupQrScanned),
    pickupProofImageUrl: row.pickupProofImageUrl || "",
    pickupProofStatus: row.pickupProofStatus || "none",
    pickedUpAt: row.pickedUpAt,
    returnedToStoreAt: row.returnedToStoreAt,
    successfulAt: row.successfulAt,
    createdAt: row.createdAt,
    ...extras,
  };
}

/** Resolve dark store for an ecommerce order (via StoreOrder bridge). */
export async function resolveDarkStoreForOrder(orderId) {
  if (!orderId) return null;
  const storeOrder = await StoreOrder.findOne({ sourceOrderId: orderId })
    .sort({ createdAt: -1 })
    .lean();
  if (!storeOrder?.managerId) return null;
  return {
    managerId: storeOrder.managerId,
    darkStoreId: storeOrder.darkStoreId || storeOrder.managerId,
    storeOrderId: storeOrder._id,
    customerAddress: storeOrder.customerAddress || "",
    customerLat: storeOrder.customerLat,
    customerLng: storeOrder.customerLng,
  };
}

/** Called when admin accepts a refund/warranty claim. */
export async function createReturnPickupFromClaim(claim, options = {}) {
  if (!claim) throw new Error("Claim required");

  let managerId = options.managerId || claim.managerId || claim.darkStoreId;
  let darkStoreId = options.darkStoreId || claim.darkStoreId || managerId;
  let storeOrderId = null;
  let customerAddress = claim.customerAddress || "";
  let customerLat = null;
  let customerLng = null;

  if (!managerId && claim.orderId) {
    const resolved = await resolveDarkStoreForOrder(claim.orderId);
    if (resolved) {
      managerId = resolved.managerId;
      darkStoreId = resolved.darkStoreId;
      storeOrderId = resolved.storeOrderId;
      customerAddress = customerAddress || resolved.customerAddress;
      customerLat = resolved.customerLat;
      customerLng = resolved.customerLng;
    }
  }

  if (!managerId) {
    throw new Error(
      "No dark store found for this order. Ensure the order was fulfilled by a dark store."
    );
  }

  const existing = await ReturnPickup.findOne({
    claimId: claim._id,
    status: { $nin: ["cancelled"] },
  });
  if (existing) return existing;

  const pickup = await ReturnPickup.create({
    claimId: claim._id,
    sourceOrderId: claim.orderId || null,
    sourceStoreOrderId: storeOrderId,
    orderNumber: claim.orderNumber || "",
    managerId,
    darkStoreId: darkStoreId || managerId,
    accountType: claim.accountType === "bulk" ? "bulk" : "retail",
    type: claim.type === "warranty" ? "warranty" : "refund",
    reason: claim.reason || "",
    amount: claim.amount || 0,
    customerName: claim.customerName || "",
    customerPhone: claim.customerPhone || "",
    customerAddress,
    customerLat,
    customerLng,
    status: "awaiting_assignment",
    adminNote: claim.adminNote || "",
  });

  try {
    getIO()
      .to(`store_${managerId}`)
      .emit("return_pickup_created", {
        returnPickupId: pickup._id.toString(),
        orderNumber: pickup.orderNumber,
        type: pickup.type,
        customerName: pickup.customerName,
      });
  } catch {
    /* ignore */
  }

  return pickup;
}

export async function listManagerReturnPickups(req, res, next) {
  try {
    const manager = await getManager(req);
    if (!manager) return fail(res, 401, "Manager not found");

    const filter = { managerId: manager._id };
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

    const rows = await ReturnPickup.find(filter).sort({ createdAt: -1 }).lean();
    const riderIds = [...new Set(rows.map((r) => r.assignedRiderId).filter(Boolean).map(String))];
    const riders = riderIds.length
      ? await DeliveryBoy.find({ _id: { $in: riderIds } }).select("name phone").lean()
      : [];
    const riderMap = Object.fromEntries(riders.map((r) => [String(r._id), r]));

    return ok(
      res,
      rows.map((row) =>
        serializeReturn(row, {
          rider: row.assignedRiderId
            ? {
                id: String(row.assignedRiderId),
                name: riderMap[String(row.assignedRiderId)]?.name || "",
                phone: riderMap[String(row.assignedRiderId)]?.phone || "",
              }
            : null,
        })
      ),
      {
        count: rows.length,
        stats: {
          awaiting: rows.filter((r) => r.status === "awaiting_assignment").length,
          assigned: rows.filter((r) => ["assigned", "qr_scanned", "proof_pending", "picked_up"].includes(r.status)).length,
          successful: rows.filter((r) => r.status === "successful").length,
        },
      }
    );
  } catch (error) {
    next(error);
  }
}

export async function getManagerReturnPickup(req, res, next) {
  try {
    const manager = await getManager(req);
    if (!manager) return fail(res, 401, "Manager not found");
    const row = await ReturnPickup.findOne({ _id: req.params.id, managerId: manager._id }).lean();
    if (!row) return fail(res, 404, "Return pickup not found");
    let rider = null;
    if (row.assignedRiderId) {
      rider = await DeliveryBoy.findById(row.assignedRiderId).select("name phone status").lean();
    }
    return ok(res, serializeReturn(row, { rider }));
  } catch (error) {
    next(error);
  }
}

/** Manual assign rider for return pickup (no accept/decline offer). */
export async function assignReturnPickup(req, res, next) {
  try {
    const manager = await getManager(req);
    if (!manager) return fail(res, 401, "Manager not found");
    const riderId = String(req.body.riderId || "").trim();
    if (!riderId) return fail(res, 400, "riderId is required");

    const pickup = await ReturnPickup.findOne({ _id: req.params.id, managerId: manager._id });
    if (!pickup) return fail(res, 404, "Return pickup not found");
    if (!["awaiting_assignment", "assigned"].includes(pickup.status)) {
      return fail(res, 400, `Cannot assign in status: ${pickup.status}`);
    }

    const rider = await DeliveryBoy.findOne({
      _id: riderId,
      managerId: manager._id,
      isActive: { $ne: false },
    });
    if (!rider) return fail(res, 404, "Rider not found for this store");

    pickup.assignedRiderId = rider._id;
    pickup.assignedAt = new Date();
    pickup.status = "assigned";
    pickup.pickupQrScanned = false;
    pickup.pickupProofStatus = "none";
    pickup.pickupProofImageUrl = "";
    await pickup.save();

    try {
      getIO()
        .to(`rider_${rider._id}`)
        .emit("return_pickup_assigned", {
          returnPickupId: pickup._id.toString(),
          orderNumber: pickup.orderNumber,
          customerName: pickup.customerName,
          customerAddress: pickup.customerAddress,
          message: "New return pickup assigned. Collect item from customer.",
        });
    } catch {
      /* ignore */
    }

    return ok(res, serializeReturn(pickup, {
      rider: { id: String(rider._id), name: rider.name, phone: rider.phone },
    }), { message: `Assigned to ${rider.name || rider.phone}` });
  } catch (error) {
    next(error);
  }
}

const returnQrTokens = new Map(); // in-memory fallback keyed by returnId+driverId

export async function getReturnPickupQr(req, res, next) {
  try {
    const manager = await getManager(req);
    if (!manager) return fail(res, 401, "Manager not found");
    const pickup = await ReturnPickup.findOne({ _id: req.params.id, managerId: manager._id });
    if (!pickup) return fail(res, 404, "Return pickup not found");
    if (!pickup.assignedRiderId) return fail(res, 400, "Assign a delivery boy first");
    if (!["assigned", "qr_scanned", "proof_pending", "picked_up"].includes(pickup.status)) {
      return fail(res, 400, `QR not available for status: ${pickup.status}`);
    }

    const key = `${pickup._id}:${pickup.assignedRiderId}`;
    let entry = returnQrTokens.get(key);
    if (!entry || new Date(entry.expiresAt) < new Date() || entry.used) {
      const token = crypto.randomBytes(20).toString("hex");
      entry = {
        token,
        expiresAt: new Date(Date.now() + RETURN_QR_TTL_MS),
        used: false,
      };
      returnQrTokens.set(key, entry);
    }

    return ok(res, {
      returnPickupId: pickup._id.toString(),
      orderNumber: pickup.orderNumber,
      qrPayload: buildReturnQrPayload(pickup._id.toString(), entry.token),
      expiresAt: entry.expiresAt,
      status: pickup.status,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveReturnProof(req, res, next) {
  try {
    const manager = await getManager(req);
    if (!manager) return fail(res, 401, "Manager not found");
    const pickup = await ReturnPickup.findOne({ _id: req.params.id, managerId: manager._id });
    if (!pickup) return fail(res, 404, "Return pickup not found");
    if (pickup.pickupProofStatus !== "pending" && pickup.status !== "proof_pending") {
      return fail(res, 400, "No pending pickup proof to approve");
    }

    pickup.pickupProofStatus = "approved";
    pickup.status = "picked_up";
    pickup.pickedUpAt = pickup.pickedUpAt || new Date();
    await pickup.save();

    try {
      getIO()
        .to(`rider_${pickup.assignedRiderId}`)
        .emit("return_pickup_proof_approved", {
          returnPickupId: pickup._id.toString(),
          message: "Proof approved. Return the item to the dark store.",
        });
    } catch {
      /* ignore */
    }

    return ok(res, serializeReturn(pickup), { message: "Pickup proof approved" });
  } catch (error) {
    next(error);
  }
}

/** DM confirms boy returned the item to store → successful. */
export async function markReturnSuccessful(req, res, next) {
  try {
    const manager = await getManager(req);
    if (!manager) return fail(res, 401, "Manager not found");
    const pickup = await ReturnPickup.findOne({ _id: req.params.id, managerId: manager._id });
    if (!pickup) return fail(res, 404, "Return pickup not found");
    if (!["picked_up", "returned_to_store", "proof_pending", "qr_scanned"].includes(pickup.status)) {
      if (pickup.status === "successful") {
        return ok(res, serializeReturn(pickup), { message: "Already successful" });
      }
      return fail(res, 400, `Cannot mark successful from status: ${pickup.status}`);
    }

    const now = new Date();
    pickup.status = "successful";
    pickup.returnedToStoreAt = pickup.returnedToStoreAt || now;
    pickup.successfulAt = now;
    if (req.body.managerNote != null) pickup.managerNote = String(req.body.managerNote).trim();
    await pickup.save();

    if (pickup.claimId) {
      await RefundClaim.findByIdAndUpdate(pickup.claimId, {
        status: "successful",
        successfulAt: now,
      });
    }
    if (pickup.sourceOrderId) {
      await Order.findByIdAndUpdate(pickup.sourceOrderId, {
        status: "return",
        ...(pickup.type === "refund" ? { paymentStatus: "refundable" } : {}),
      });
    }

    return ok(res, serializeReturn(pickup), { message: "Return marked successful" });
  } catch (error) {
    next(error);
  }
}

/* ─── Delivery boy endpoints ─────────────────────────────────────────── */

export async function listRiderReturnPickups(req, res, next) {
  try {
    const riderId = req.user.id;
    const rows = await ReturnPickup.find({
      assignedRiderId: riderId,
      status: { $in: ["assigned", "qr_scanned", "proof_pending", "picked_up"] },
    })
      .sort({ assignedAt: -1 })
      .lean();
    return ok(res, rows.map((r) => serializeReturn(r)));
  } catch (error) {
    next(error);
  }
}

export async function scanReturnPickupQr(req, res, next) {
  try {
    const riderId = req.user.id;
    const parsed = parseReturnQr(req.body.qrPayload || req.body.scannedPayload);
    if (!parsed?.returnId || !parsed.token) {
      return fail(res, 400, "Invalid return pickup QR code");
    }

    const pickup = await ReturnPickup.findById(parsed.returnId);
    if (!pickup) return fail(res, 404, "Return pickup not found");
    if (String(pickup.assignedRiderId) !== String(riderId)) {
      return fail(res, 403, "This return QR is not for your assignment");
    }
    if (!["assigned", "qr_scanned", "proof_pending"].includes(pickup.status)) {
      return fail(res, 400, `Cannot scan in status: ${pickup.status}`);
    }

    const key = `${pickup._id}:${pickup.assignedRiderId}`;
    const entry = returnQrTokens.get(key);
    if (!entry || entry.token !== parsed.token) {
      return fail(res, 400, "Invalid or expired return QR token — ask manager to refresh QR");
    }
    if (new Date(entry.expiresAt) < new Date()) {
      return fail(res, 400, "Return QR expired — ask manager to refresh");
    }

    entry.used = true;
    pickup.pickupQrScanned = true;
    pickup.pickupQrScannedAt = new Date();
    pickup.status = "qr_scanned";
    await pickup.save();

    try {
      getIO()
        .to(`store_${pickup.managerId}`)
        .emit("return_pickup_qr_scanned", {
          returnPickupId: pickup._id.toString(),
          orderNumber: pickup.orderNumber,
        });
    } catch {
      /* ignore */
    }

    return ok(res, serializeReturn(pickup), {
      message: "QR scanned. Take a photo of the returned item.",
    });
  } catch (error) {
    next(error);
  }
}

export async function submitReturnPickupProof(req, res, next) {
  try {
    const riderId = req.user.id;
    const pickup = await ReturnPickup.findById(req.params.id);
    if (!pickup) return fail(res, 404, "Return pickup not found");
    if (String(pickup.assignedRiderId) !== String(riderId)) {
      return fail(res, 403, "Not assigned to you");
    }
    if (!pickup.pickupQrScanned) {
      return fail(res, 400, "Scan return QR first");
    }

    const imageData = String(req.body.imageBase64 || req.body.photo || "").trim();
    if (!imageData) return fail(res, 400, "Pickup photo is required");

    let imageUrl = imageData;
    if (imageData.startsWith("data:image/") && isS3Configured()) {
      try {
        const s3Res = await uploadDataUrlToS3(imageData, "return-pickup-proofs");
        if (s3Res?.url) imageUrl = s3Res.url;
      } catch (err) {
        console.warn("[return-proof] S3 upload failed:", err.message);
      }
    }

    pickup.pickupProofImageUrl = imageUrl;
    pickup.pickupProofStatus = "pending";
    pickup.pickupProofSubmittedAt = new Date();
    pickup.status = "proof_pending";
    await pickup.save();

    try {
      getIO()
        .to(`store_${pickup.managerId}`)
        .emit("return_pickup_proof_submitted", {
          returnPickupId: pickup._id.toString(),
          orderNumber: pickup.orderNumber,
          pickupProofImageUrl: imageUrl,
        });
    } catch {
      /* ignore */
    }

    return ok(res, serializeReturn(pickup), {
      message: "Photo submitted. Waiting for delivery manager approval.",
    });
  } catch (error) {
    next(error);
  }
}

export async function markReturnedToStore(req, res, next) {
  try {
    const riderId = req.user.id;
    const pickup = await ReturnPickup.findById(req.params.id);
    if (!pickup) return fail(res, 404, "Return pickup not found");
    if (String(pickup.assignedRiderId) !== String(riderId)) {
      return fail(res, 403, "Not assigned to you");
    }
    if (!["picked_up", "proof_pending"].includes(pickup.status)) {
      return fail(res, 400, "Return item must be picked up before handing to store");
    }

    pickup.status = "returned_to_store";
    pickup.returnedToStoreAt = new Date();
    await pickup.save();

    try {
      getIO()
        .to(`store_${pickup.managerId}`)
        .emit("return_arrived_at_store", {
          returnPickupId: pickup._id.toString(),
          orderNumber: pickup.orderNumber,
          message: "Rider returned the item to store. Confirm successful.",
        });
    } catch {
      /* ignore */
    }

    return ok(res, serializeReturn(pickup), {
      message: "Marked as returned to store. Manager will confirm success.",
    });
  } catch (error) {
    next(error);
  }
}

export { serializeReturn, buildReturnQrPayload };
