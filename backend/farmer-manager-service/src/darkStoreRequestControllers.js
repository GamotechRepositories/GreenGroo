import crypto from "crypto";
import bcrypt from "bcrypt";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import { DarkStoreRequest } from "./models.js";

function vendorIdOf(req) {
  return req.user?.vendorId || req.user?.id || "";
}

export function serializeDarkStoreRequest(doc) {
  const { passwordHash: _hash, _id, __v, ...rest } = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return rest;
}

function toCoord(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function listVendorDarkStoreRequests(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const [requests, stores] = await Promise.all([
      DarkStoreRequest.find({ vendorId }).sort({ createdAt: -1 }).lean(),
      DeliveryManager.find({ vendorId }).sort({ storeName: 1 }),
    ]);
    res.json({
      requests: requests.map(serializeDarkStoreRequest),
      darkStores: stores.map((store) => store.toSafeJSON()),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load dark stores" });
  }
}

export async function createVendorDarkStoreRequest(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const body = req.body || {};
    const storeName = String(body.storeName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
    const password = String(body.password || "");
    const state = String(body.state || "").trim();
    const city = String(body.city || "").trim();
    const area = String(body.area || "").trim();

    if (!storeName) return res.status(400).json({ message: "Dark store name is required" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid manager email" });
    if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!state || !city || !area) return res.status(400).json({ message: "State, city and area are required" });

    const latitude = toCoord(body.latitude);
    const longitude = toCoord(body.longitude);
    if ((latitude === null) !== (longitude === null)) {
      return res.status(400).json({ message: "Enter both latitude and longitude, or leave both empty" });
    }

    const [takenAccount, pendingDuplicate] = await Promise.all([
      DeliveryManager.exists({ $or: [{ email }, { phone }] }),
      DarkStoreRequest.exists({ status: "Pending", $or: [{ email }, { phone }] }),
    ]);
    if (takenAccount) return res.status(409).json({ message: "A dark store with this email or mobile already exists" });
    if (pendingDuplicate) {
      return res.status(409).json({ message: "A pending request with this email or mobile is already waiting for approval" });
    }

    const request = await DarkStoreRequest.create({
      id: `dsr-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      vendorId,
      storeName,
      managerName: String(body.managerName || "").trim(),
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      state,
      city,
      area,
      storeAddress: String(body.storeAddress || "").trim(),
      pincode: String(body.pincode || "").trim(),
      latitude,
      longitude,
      notes: String(body.notes || "").trim(),
      status: "Pending",
    });
    res.status(201).json(serializeDarkStoreRequest(request));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to send dark store request" });
  }
}

export async function cancelVendorDarkStoreRequest(req, res) {
  try {
    const request = await DarkStoreRequest.findOne({ id: req.params.requestId, vendorId: vendorIdOf(req) });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "Pending") return res.status(400).json({ message: `This request is already ${request.status.toLowerCase()}` });
    request.status = "Cancelled";
    await request.save();
    res.json(serializeDarkStoreRequest(request));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to cancel request" });
  }
}
