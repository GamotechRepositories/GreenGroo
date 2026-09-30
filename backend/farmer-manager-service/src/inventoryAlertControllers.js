import mongoose from "mongoose";
import { VendorInventoryAlert } from "./models.js";

const LIMIT_FIELDS = ["minGradeA", "minGradeB", "minGradeC", "minTotal"];

function vendorIdOf(req) {
  return req.user?.vendorId || req.user?.id || "";
}

export async function listInventoryAlerts(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    if (!vendorId) return res.status(401).json({ message: "Vendor login required" });
    const items = await VendorInventoryAlert.find({ vendorId }).sort({ productName: 1 }).lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load inventory alerts" });
  }
}

export async function saveInventoryAlert(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    if (!vendorId) return res.status(401).json({ message: "Vendor login required" });
    const productKey = String(req.body?.productKey || "").trim();
    if (!productKey) return res.status(400).json({ message: "Product is required" });

    const update = {
      productName: String(req.body.productName || "").trim(),
      variety: String(req.body.variety || "").trim(),
      enabled: req.body.enabled !== false,
    };
    for (const field of LIMIT_FIELDS) {
      const value = Number(req.body[field] ?? 0);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({ message: `${field} must be 0 or more` });
      }
      update[field] = value;
    }
    if (LIMIT_FIELDS.every((field) => update[field] === 0)) {
      return res.status(400).json({ message: "Set at least one minimum quantity" });
    }

    const item = await VendorInventoryAlert.findOneAndUpdate(
      { vendorId, productKey },
      { $set: update, $setOnInsert: { vendorId, productKey } },
      { upsert: true, returnDocument: "after", runValidators: true }
    ).lean();
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to save inventory alert" });
  }
}

export async function deleteInventoryAlert(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    if (!vendorId) return res.status(401).json({ message: "Vendor login required" });
    if (!mongoose.isValidObjectId(req.params.alertId)) {
      return res.status(404).json({ message: "Alert not found" });
    }
    const result = await VendorInventoryAlert.deleteOne({ _id: req.params.alertId, vendorId });
    if (!result.deletedCount) return res.status(404).json({ message: "Alert not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete inventory alert" });
  }
}
