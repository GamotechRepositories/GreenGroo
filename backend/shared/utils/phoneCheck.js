import mongoose from "mongoose";

export const normalizeIndianPhone = (phone) =>
  String(phone || "").replace(/\D/g, "").slice(-10);

/**
 * Checks if a 10-digit phone number is already registered across all account types:
 * - DeliveryManager
 * - DeliveryBoy
 * - Vendor
 * - User (Customer / Admin)
 * - Admin
 * - Staff
 * - Farmer
 * - Pending DarkStoreRequest
 *
 * @param {string} rawPhone
 * @param {object} [options]
 * @param {string} [options.excludeModel] - model/collection name to exclude
 * @param {string} [options.excludeId] - document ID to exclude
 * @returns {Promise<{ inUse: boolean, accountType?: string, message?: string }>}
 */
export async function checkPhoneConflict(rawPhone, { excludeModel = "", excludeId = null } = {}) {
  const phone = normalizeIndianPhone(rawPhone);
  if (!phone || phone.length < 10) {
    return { inUse: false };
  }

  const db = mongoose.connection;
  if (!db || db.readyState !== 1) {
    return { inUse: false };
  }

  const phoneVariants = [phone, `+91${phone}`, `91${phone}`];
  const exModel = excludeModel.toLowerCase();

  // 1. DeliveryManager
  if (exModel !== "deliverymanager" && exModel !== "deliverymanagers") {
    const q = { phone: { $in: phoneVariants } };
    if (excludeId && (exModel === "deliverymanager" || exModel === "deliverymanagers")) {
      q._id = { $ne: excludeId };
    }
    const dm = await db.collection("deliverymanagers").findOne(q).catch(() => null);
    if (dm) {
      return {
        inUse: true,
        accountType: "Delivery Manager",
        message: "This phone number is already registered to a Delivery Manager account",
      };
    }
  }

  // 2. DeliveryBoy
  if (exModel !== "deliveryboy" && exModel !== "deliveryboys") {
    const boy = await db.collection("deliveryboys").findOne({ phone: { $in: phoneVariants } }).catch(() => null);
    if (boy) {
      return {
        inUse: true,
        accountType: "Delivery Boy",
        message: "This phone number is already registered to a Delivery Boy account",
      };
    }
  }

  // 3. Vendor
  if (exModel !== "vendor" && exModel !== "vendors") {
    const vendor = await db.collection("vendors").findOne({
      $or: [
        { mobile: { $in: phoneVariants } },
        { phone: { $in: phoneVariants } },
      ],
    }).catch(() => null);
    if (vendor) {
      return {
        inUse: true,
        accountType: "Vendor",
        message: "This phone number is already registered to a Vendor account",
      };
    }
  }

  // 4. User (Customer / Admin)
  if (exModel !== "user" && exModel !== "users" && exModel !== "usersbulkmarts") {
    let user = null;
    try {
      user = await db.collection("usersbulkmarts").findOne({ phone: { $in: phoneVariants } });
    } catch {
      // ignore
    }
    if (!user) {
      try {
        user = await db.collection("users").findOne({ phone: { $in: phoneVariants } });
      } catch {
        // ignore
      }
    }
    if (user) {
      const type = user.role === "admin" ? "Admin" : "Customer";
      return {
        inUse: true,
        accountType: type,
        message: `This phone number is already registered to a ${type} account`,
      };
    }
  }

  // 5. Admin
  if (exModel !== "admin" && exModel !== "admins") {
    const admin = await db.collection("admins").findOne({ phone: { $in: phoneVariants } }).catch(() => null);
    if (admin) {
      return {
        inUse: true,
        accountType: "Admin",
        message: "This phone number is already registered to an Admin account",
      };
    }
  }

  // 6. Staff
  if (exModel !== "staff" && exModel !== "staffs") {
    const staff = await db.collection("staffs").findOne({ phone: { $in: phoneVariants } }).catch(() => null);
    if (staff) {
      return {
        inUse: true,
        accountType: "Staff",
        message: "This phone number is already registered to a Staff account",
      };
    }
  }

  // 7. Farmer
  if (exModel !== "farmer" && exModel !== "farmers") {
    const farmer = await db.collection("farmers").findOne({ mobile: { $in: phoneVariants } }).catch(() => null);
    if (farmer) {
      return {
        inUse: true,
        accountType: "Farmer",
        message: "This phone number is already registered to a Farmer account",
      };
    }
  }

  // 8. Pending DarkStoreRequest
  if (exModel !== "darkstorerequest" && exModel !== "darkstorerequests") {
    const dsrQuery = { phone, status: "Pending" };
    if (excludeId) dsrQuery.id = { $ne: excludeId };
    const dsr = await db.collection("darkstorerequests").findOne(dsrQuery).catch(() => null);
    if (dsr) {
      return {
        inUse: true,
        accountType: "Dark Store Request",
        message: "A pending dark store request is already waiting for approval with this phone number",
      };
    }
  }

  return { inUse: false };
}
