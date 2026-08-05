import mongoose from "mongoose";
import User from "../models/user.js";
import Order from "../models/order/Order.js";

export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function normalizeOrderSearchInput(search) {
  const raw = typeof search === "string" ? search.trim() : "";
  if (!raw) return { text: "", digits: "" };

  const withoutHash = raw.replace(/^#+/, "").trim();
  const digits = withoutHash.replace(/\D/g, "");

  return {
    text: withoutHash || raw,
    digits,
  };
}

function getOrderDisplayDigits(order) {
  const num = order?.orderNumber ?? "";
  if (/^\d{6}$/.test(String(num))) return String(num);

  const fromNum = String(num).replace(/\D/g, "");
  if (fromNum.length >= 6) return fromNum.slice(-6);

  const fromId = String(order?._id ?? "").replace(/\D/g, "");
  return (fromId.slice(-6) || "000000").padStart(6, "0");
}

export function buildCategorySearchFilter(search) {
  const query = typeof search === "string" ? search.trim() : "";
  if (!query) return null;

  const pattern = new RegExp(escapeRegex(query), "i");
  return {
    $or: [{ categoryName: pattern }, { subcategories: pattern }],
  };
}

export function buildSupportSearchFilter(search) {
  const query = typeof search === "string" ? search.trim() : "";
  if (!query) return null;

  const normalized = query.replace(/^#+/, "").trim();
  const pattern = new RegExp(escapeRegex(normalized || query), "i");

  return {
    $or: [
      { name: pattern },
      { email: pattern },
      { phone: pattern },
      { orderId: pattern },
      { message: pattern },
      { issueType: pattern },
    ],
  };
}

export async function buildOrderSearchFilter(search) {
  const { text, digits } = normalizeOrderSearchInput(search);
  if (!text && !digits) return null;

  const conditions = [];
  const textPattern = new RegExp(escapeRegex(text), "i");

  if (text) {
    conditions.push({ orderNumber: textPattern });
    conditions.push({ "items.name": textPattern });
    conditions.push({ "deliveryAddress.fullName": textPattern });
    conditions.push({ "deliveryAddress.number": textPattern });
  }

  if (digits) {
    conditions.push({ orderNumber: digits });
    conditions.push({ orderNumber: new RegExp(escapeRegex(digits)) });
    conditions.push({ "deliveryAddress.number": new RegExp(escapeRegex(digits)) });

    if (digits.length <= 6) {
      conditions.push({ orderNumber: new RegExp(`${escapeRegex(digits)}$`) });
    }
  }

  if (/^[a-f\d]{24}$/i.test(text)) {
    conditions.push({ _id: new mongoose.Types.ObjectId(text) });
  }

  const namePattern = new RegExp(escapeRegex(text || digits), "i");
  const userQuery = [{ name: namePattern }];
  if (digits) {
    userQuery.push({ phone: new RegExp(escapeRegex(digits)) });
  } else if (text) {
    userQuery.push({ phone: textPattern });
  }

  const matchingUsers = await User.find({ $or: userQuery }).select("_id").lean();
  if (matchingUsers.length) {
    conditions.push({ user: { $in: matchingUsers.map((user) => user._id) } });
  }

  if (digits.length === 6) {
    const legacyOrders = await Order.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: "" },
      ],
    })
      .select("_id orderNumber")
      .lean();

    const legacyIds = legacyOrders
      .filter((order) => getOrderDisplayDigits(order) === digits)
      .map((order) => order._id);

    if (legacyIds.length) {
      conditions.push({ _id: { $in: legacyIds } });
    }
  }

  return { $or: conditions };
}
