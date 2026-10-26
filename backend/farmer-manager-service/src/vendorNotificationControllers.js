import { Vendor } from "./models.js";

const MAX_READ_IDS = 500;
const vendorIdOf = (req) => String(req.user?.vendorId || req.user?.id || "");

/** GET /api/vendor/notifications/read-state */
export async function getVendorNotificationReadState(req, res) {
  try {
    const vendor = await Vendor.findOne({ id: vendorIdOf(req) }).select("+readNotificationIds").lean();
    res.json({ readIds: vendor?.readNotificationIds || [] });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load notification state" });
  }
}

/** POST /api/vendor/notifications/read  body { ids: string[] } */
export async function markVendorNotificationsRead(req, res) {
  try {
    const ids = [...new Set((Array.isArray(req.body?.ids) ? req.body.ids : []).map((id) => String(id).slice(0, 120)))]
      .filter(Boolean)
      .slice(0, 200);
    if (!ids.length) return res.status(400).json({ message: "No notifications given" });

    const vendor = await Vendor.findOne({ id: vendorIdOf(req) }).select("+readNotificationIds");
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    const merged = [...new Set([...(vendor.readNotificationIds || []), ...ids])].slice(-MAX_READ_IDS);
    await Vendor.updateOne({ _id: vendor._id }, { $set: { readNotificationIds: merged } });
    res.json({ readIds: merged });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark notifications read" });
  }
}
