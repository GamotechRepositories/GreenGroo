import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Staff from "../../staff-service/src/models/Staff.js";
import { ROLE_LABELS, STAFF_ROLES } from "../../staff-service/src/constants/roles.js";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import DeliveryBoy from "../../delivery-service/src/models/DeliveryBoy.js";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import SupportMessage from "../../legacy/models/support/SupportMessage.js";
import { Vendor } from "../../farmer-manager-service/src/models.js";
import { HrAttendance } from "./models.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

export async function listVendorsAdmin(_req, res, next) {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 }).lean();
    const data = vendors.map(({ password: _pw, ...vendor }) => vendor);
    return ok(res, data, {
      stats: {
        count: data.length,
        active: data.filter((v) => v.status === "Active").length,
        pending: data.filter((v) => v.status === "Pending").length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createVendorAdmin(req, res, next) {
  try {
    const ownerName = String(req.body.ownerName || req.body.vendorName || "").trim();
    const mobile = String(req.body.mobile || "").replace(/\D/g, "").slice(-10);
    if (!ownerName) return fail(res, 400, "Owner / vendor name is required");
    if (!/^[6-9]\d{9}$/.test(mobile)) return fail(res, 400, "Enter a valid 10-digit mobile number");
    const id = `vendor-${Date.now()}`;
    const hashedPassword = await bcrypt.hash(String(req.body.password || "vendor123"), 10);
    const vendor = await Vendor.create({
      id,
      vendorCode: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName: String(req.body.vendorName || ownerName).trim(),
      ownerName,
      mobile,
      email: String(req.body.email || "").trim().toLowerCase(),
      businessName: String(req.body.businessName || req.body.vendorName || ownerName).trim(),
      businessAddress: String(req.body.businessAddress || "").trim(),
      city: String(req.body.city || "").trim(),
      state: String(req.body.state || "").trim(),
      pincode: String(req.body.pincode || "").trim(),
      gstNumber: String(req.body.gstNumber || "").trim(),
      panNumber: String(req.body.panNumber || "").trim(),
      commissionRate: Number(req.body.commissionRate || 10),
      status: req.body.status || "Active",
      password: hashedPassword,
      role: "VENDOR",
    });
    const { password: _pw, ...data } = vendor.toObject();
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.code === 11000) return fail(res, 409, "A vendor with this mobile already exists");
    next(error);
  }
}

export async function updateVendorAdmin(req, res, next) {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ id: req.params.id }, { _id: req.params.id }] }
      : { id: req.params.id };
    const vendor = await Vendor.findOne(query);
    if (!vendor) return fail(res, 404, "Vendor not found");
    const fields = [
      "vendorName",
      "ownerName",
      "email",
      "businessName",
      "businessAddress",
      "city",
      "state",
      "pincode",
      "gstNumber",
      "panNumber",
      "status",
      "mobile",
    ];
    fields.forEach((key) => {
      if (req.body[key] !== undefined) vendor[key] = req.body[key];
    });
    if (req.body.commissionRate !== undefined) vendor.commissionRate = Number(req.body.commissionRate);
    if (req.body.password) vendor.password = await bcrypt.hash(String(req.body.password), 10);
    await vendor.save();
    const { password: _pw, ...data } = vendor.toObject();
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

export async function deleteVendorAdmin(req, res, next) {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ id: req.params.id }, { _id: req.params.id }] }
      : { id: req.params.id };
    const vendor = await Vendor.findOneAndDelete(query);
    if (!vendor) return fail(res, 404, "Vendor not found");
    return ok(res, { id: req.params.id });
  } catch (error) {
    next(error);
  }
}

export async function listHrDirectory(_req, res, next) {
  try {
    const [staff, managers, riders, openAttendance] = await Promise.all([
      Staff.find().sort({ createdAt: -1 }).lean(),
      DeliveryManager.find().select("name email phone city area storeName isActive createdAt").lean(),
      DeliveryBoy.find().select("name phone city area status isActive createdAt").lean(),
      HrAttendance.find({ clockOut: null }).sort({ clockIn: -1 }).lean(),
    ]);
    const people = [
      ...staff.map((item) => ({
        id: String(item._id),
        employeeType: "staff",
        name: item.name,
        email: item.email,
        phone: item.phone,
        role: ROLE_LABELS[item.role] || item.role,
        roleKey: item.role,
        isActive: item.isActive !== false,
        location: "",
        createdAt: item.createdAt,
      })),
      ...managers.map((item) => ({
        id: String(item._id),
        employeeType: "delivery_manager",
        name: item.name || item.storeName || "Store manager",
        email: item.email,
        phone: item.phone,
        role: "Delivery Manager",
        roleKey: "delivery_manager",
        isActive: item.isActive !== false,
        location: [item.area, item.city].filter(Boolean).join(", "),
        createdAt: item.createdAt,
      })),
      ...riders.map((item) => ({
        id: String(item._id),
        employeeType: "delivery_boy",
        name: item.name || "Delivery partner",
        email: "",
        phone: item.phone,
        role: "Delivery Boy",
        roleKey: "delivery_boy",
        isActive: item.isActive !== false,
        location: [item.area, item.city].filter(Boolean).join(", "),
        status: item.status,
        createdAt: item.createdAt,
      })),
    ];
    return ok(res, people, {
      stats: {
        total: people.length,
        staff: staff.length,
        managers: managers.length,
        riders: riders.length,
        clockedIn: openAttendance.length,
      },
      attendance: openAttendance,
      roles: STAFF_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] || role })),
    });
  } catch (error) {
    next(error);
  }
}

export async function createHrStaff(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").replace(/\D/g, "").slice(-10);
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "Staff@123");
    const role = String(req.body.role || "product_manager").trim();
    if (!name) return fail(res, 400, "Name is required");
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, "Valid email is required");
    if (!/^[6-9]\d{9}$/.test(phone)) return fail(res, 400, "Valid 10-digit phone is required");
    if (!STAFF_ROLES.includes(role)) return fail(res, 400, "Invalid staff role");
    const staff = await Staff.create({
      name,
      email,
      phone,
      password,
      role,
      createdBy: req.user?.id,
      createdByRole: req.user?.role || "admin",
    });
    return res.status(201).json({ success: true, data: staff.toSafeJSON() });
  } catch (error) {
    if (error.code === 11000) return fail(res, 409, "Email or phone already registered");
    next(error);
  }
}

export async function updateHrStaff(req, res, next) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return fail(res, 404, "Staff member not found");
    if (req.body.name) staff.name = String(req.body.name).trim();
    if (req.body.email) staff.email = String(req.body.email).trim().toLowerCase();
    if (req.body.phone) staff.phone = String(req.body.phone).replace(/\D/g, "").slice(-10);
    if (req.body.role && STAFF_ROLES.includes(req.body.role)) staff.role = req.body.role;
    if (typeof req.body.isActive === "boolean") staff.isActive = req.body.isActive;
    if (req.body.password) staff.password = String(req.body.password);
    await staff.save();
    return ok(res, staff.toSafeJSON());
  } catch (error) {
    next(error);
  }
}

export async function clockHrAttendance(req, res, next) {
  try {
    const employeeId = String(req.body.employeeId || "").trim();
    const name = String(req.body.name || "").trim();
    if (!employeeId || !name) return fail(res, 400, "Employee is required");
    const today = new Date().toISOString().slice(0, 10);
    const open = await HrAttendance.findOne({ employeeId, clockOut: null }).sort({ clockIn: -1 });
    if (req.body.action === "out") {
      if (!open) return fail(res, 400, "No open attendance to clock out");
      open.clockOut = new Date();
      open.notes = String(req.body.notes || open.notes || "").trim();
      await open.save();
      return ok(res, open);
    }
    if (open) return fail(res, 400, "Already clocked in");
    const record = await HrAttendance.create({
      employeeId,
      employeeType: req.body.employeeType || "staff",
      name,
      role: String(req.body.role || "").trim(),
      date: today,
      notes: String(req.body.notes || "").trim(),
    });
    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function listHrAttendance(req, res, next) {
  try {
    const filter = {};
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;
    const rows = await HrAttendance.find(filter).sort({ clockIn: -1 }).limit(200).lean();
    return ok(res, rows);
  } catch (error) {
    next(error);
  }
}

export async function listDeliveryOrders(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    const orders = await StoreOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("assignedRiderId", "name phone status currentLocation")
      .populate("managerId", "name storeName city area")
      .lean();
    const counts = await StoreOrder.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    return ok(res, orders, {
      stats: {
        total: orders.length,
        byStatus: Object.fromEntries(counts.map((row) => [row._id, row.count])),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function assignDeliveryOrder(req, res, next) {
  try {
    const order = await StoreOrder.findById(req.params.id);
    if (!order) return fail(res, 404, "Delivery order not found");
    const rider = await DeliveryBoy.findById(req.body.riderId);
    if (!rider) return fail(res, 404, "Delivery partner not found");
    order.assignedRiderId = rider._id;
    order.assignedAt = new Date();
    order.status = order.status === "incoming" || order.status === "order_received" ? "assigned" : order.status;
    order.assignmentStatus = "DRIVER_ASSIGNED";
    await order.save();
    rider.status = "on_delivery";
    await rider.save();
    return ok(res, order);
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryOrderStatus(req, res, next) {
  try {
    const order = await StoreOrder.findById(req.params.id);
    if (!order) return fail(res, 404, "Delivery order not found");
    const status = String(req.body.status || "").trim();
    const allowed = StoreOrder.schema.path("status").enumValues;
    if (!allowed.includes(status)) return fail(res, 400, "Invalid order status");
    order.status = status;
    if (status === "delivered") order.deliveredAt = new Date();
    await order.save();
    return ok(res, order);
  } catch (error) {
    next(error);
  }
}

export async function listRidersLite(_req, res, next) {
  try {
    const riders = await DeliveryBoy.find()
      .select("name phone status city area currentLocation lastSeenAt isActive")
      .sort({ name: 1 })
      .lean();
    return ok(res, riders);
  } catch (error) {
    next(error);
  }
}

export async function listDeliveryTracking(_req, res, next) {
  try {
    const riders = await DeliveryBoy.find()
      .select("name phone status city area currentLocation lastSeenAt todayCompletedOrders todayEarnings")
      .sort({ status: 1, name: 1 })
      .lean();
    return ok(res, riders, {
      stats: {
        total: riders.length,
        online: riders.filter((r) => r.status === "online").length,
        onDelivery: riders.filter((r) => r.status === "on_delivery").length,
        withLocation: riders.filter((r) => r.currentLocation?.lat && r.currentLocation?.lng).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listStoreSupport(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    const tickets = await SupportMessage.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return ok(res, tickets, {
      stats: {
        total: tickets.length,
        open: tickets.filter((t) => t.status === "open").length,
        resolved: tickets.filter((t) => t.status === "resolved").length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStoreSupport(req, res, next) {
  try {
    const ticket = await SupportMessage.findById(req.params.id);
    if (!ticket) return fail(res, 404, "Support ticket not found");
    if (req.body.status && ["open", "resolved"].includes(req.body.status)) {
      ticket.status = req.body.status;
    }
    if (req.body.adminNote !== undefined) ticket.adminNote = String(req.body.adminNote);
    await ticket.save();
    return ok(res, ticket);
  } catch (error) {
    next(error);
  }
}
