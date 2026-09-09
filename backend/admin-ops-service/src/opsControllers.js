import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Staff from "../../staff-service/src/models/Staff.js";
import { ROLE_LABELS, STAFF_ROLES } from "../../staff-service/src/constants/roles.js";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import DeliveryBoy from "../../delivery-service/src/models/DeliveryBoy.js";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import SupportMessage from "../../legacy/models/support/SupportMessage.js";
import { FarmerManager, PickupDriver, Vendor } from "../../farmer-manager-service/src/models.js";
import { seedManagerStore } from "../../delivery-service/src/services/seedManagerStore.js";
import { applyStoreOrderStatus } from "../../delivery-service/src/services/storeOrderLifecycle.js";
import { FinanceLedger, HR_EMPLOYEE_TYPES, HrAttendance, HrEmployment, HrPayroll, HrTask } from "./models.js";

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

const OFFICE_STAFF_ROLES = STAFF_ROLES.filter((role) => role !== "farmer");
const currentPayrollMonth = () => new Date().toISOString().slice(0, 7);

function withEmployment(person, employment) {
  if (!employment) return person;
  return {
    ...person,
    department: employment.department || person.department || "",
    designation: employment.designation || person.role,
    joiningDate: employment.joiningDate || "",
    salaryDate: employment.salaryDate || "",
    monthlySalary: Number(employment.monthlySalary || 0),
    salaryTax: Number(employment.salaryTax ?? employment.tax ?? 0),
    finalSalary: Math.max(0, Number(employment.monthlySalary || 0) - Number(employment.salaryTax ?? employment.tax ?? 0)),
    bankAccount: employment.bankAccount || "",
    ifsc: employment.ifsc || "",
    upi: employment.upi || "",
    workNotes: employment.workNotes || "",
  };
}

export async function loadHrPeople() {
  const [staff, farmerManagers, pickupDrivers, managers, riders, employments, openTasks] = await Promise.all([
    Staff.find({ role: { $ne: "farmer" } }).sort({ createdAt: -1 }).lean(),
    FarmerManager.find().select("-password").sort({ createdAt: -1 }).lean(),
    PickupDriver.find().select("-password").sort({ createdAt: -1 }).lean(),
    DeliveryManager.find().select("name email phone city area storeName isActive createdAt").lean(),
    DeliveryBoy.find()
      .select("name phone city area status isActive verificationStatus managerId createdAt")
      .populate("managerId", "name storeName")
      .lean(),
    HrEmployment.collection.find({}).toArray(),
    HrTask.find({ status: { $ne: "done" } }).lean(),
  ]);
  const employmentMap = new Map(employments.map((row) => [`${row.employeeType}:${String(row.employeeId)}`, row]));
  const openTaskCount = new Map();
  openTasks.forEach((task) => {
    const key = `${task.employeeType}:${task.employeeId}`;
    openTaskCount.set(key, (openTaskCount.get(key) || 0) + 1);
  });
  const people = [
    ...staff.map((item) => ({
      id: String(item._id),
      employeeType: "staff",
      team: "office",
      name: item.name,
      email: item.email,
      phone: item.phone,
      role: ROLE_LABELS[item.role] || item.role,
      roleKey: item.role,
      isActive: item.isActive !== false,
      location: "",
      createdAt: item.createdAt,
    })),
    ...farmerManagers.map((item) => ({
      id: String(item.id || item._id),
      employeeType: "farmer_manager",
      team: "field",
      name: item.name,
      email: item.email || "",
      phone: item.mobile || "",
      role: "Farmer Manager",
      roleKey: "farmer_manager",
      isActive: item.status !== "Inactive",
      location: [item.location, item.city, item.state].filter(Boolean).join(", "),
      joiningDate: item.joiningDate || "",
      createdAt: item.createdAt,
    })),
    ...pickupDrivers.map((item) => ({
      id: String(item.id || item._id),
      employeeType: "pickup_driver",
      team: "field",
      name: item.name,
      email: "",
      phone: item.mobile || "",
      role: "Pickup Driver",
      roleKey: "pickup_driver",
      isActive: item.status !== "Inactive",
      location: [item.assignedArea, item.vehicleType, item.vehicleNumber].filter(Boolean).join(" · "),
      createdAt: item.createdAt,
    })),
    ...managers.map((item) => ({
      id: String(item._id),
      employeeType: "delivery_manager",
      team: "delivery",
      name: item.name || item.storeName || "Store manager",
      email: item.email,
      phone: item.phone,
      role: "Delivery Manager",
      roleKey: "delivery_manager",
      isActive: item.isActive !== false,
      location: [item.storeName, item.area, item.city].filter(Boolean).join(", "),
      createdAt: item.createdAt,
      href: `/hr-management/employees/delivery_manager/${item._id}`,
    })),
    ...riders.map((item) => ({
      id: String(item._id),
      employeeType: "delivery_boy",
      team: "delivery",
      name: item.name || "Delivery partner",
      email: "",
      phone: item.phone,
      role: "Delivery Boy",
      roleKey: "delivery_boy",
      isActive: item.isActive !== false,
      location: [item.managerId?.storeName, item.area, item.city].filter(Boolean).join(", "),
      createdAt: item.createdAt,
      href: `/hr-management/employees/delivery_boy/${item._id}`,
    })),
  ].map((person) => {
    const key = `${person.employeeType}:${person.id}`;
    return {
      ...withEmployment(person, employmentMap.get(key)),
      openWork: openTaskCount.get(key) || 0,
      href: person.href || `/hr-management/employees/${person.employeeType}/${person.id}`,
    };
  });
  return { people, staff, farmerManagers, pickupDrivers, managers, riders };
}

export async function listHrDirectory(_req, res, next) {
  try {
    const [{ people, staff, farmerManagers, pickupDrivers, managers, riders }, openAttendance] = await Promise.all([
      loadHrPeople(),
      HrAttendance.find({ clockOut: null }).sort({ clockIn: -1 }).lean(),
    ]);
    const salaryBill = people.reduce((sum, person) => sum + Number(person.monthlySalary || 0), 0);
    const openWork = people.reduce((sum, person) => sum + Number(person.openWork || 0), 0);
    return ok(res, people, {
      stats: {
        total: people.length,
        staff: staff.length,
        farmerManagers: farmerManagers.length,
        pickupDrivers: pickupDrivers.length,
        managers: managers.length,
        riders: riders.length,
        clockedIn: openAttendance.length,
        monthlySalaryBill: salaryBill,
        openWork,
        withSalary: people.filter((person) => Number(person.monthlySalary) > 0).length,
      },
      attendance: openAttendance,
      month: currentPayrollMonth(),
      roles: [
        ...OFFICE_STAFF_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] || role, employeeType: "staff" })),
        { value: "pickup_driver", label: "Pickup Driver", employeeType: "pickup_driver" },
        { value: "delivery_manager", label: "Delivery Manager", employeeType: "delivery_manager" },
        { value: "delivery_boy", label: "Delivery Boy", employeeType: "delivery_boy" },
      ],
    });
  } catch (error) {
    next(error);
  }
}

async function attachEmployment(employeeId, employeeType, name, roleLabel, body) {
  const monthlySalary = Number(body.monthlySalary || 0);
  await upsertEmployment({
    employeeId,
    employeeType,
    name,
    role: roleLabel,
    department: body.department,
    joiningDate: body.joiningDate,
    salaryDate: body.salaryDate,
    monthlySalary: Number.isFinite(monthlySalary) ? monthlySalary : 0,
    salaryTax: body.salaryTax,
    bankAccount: body.bankAccount,
    ifsc: body.ifsc,
    upi: body.upi,
    workNotes: body.workNotes,
  });
}

export async function createHrStaff(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || req.body.mobile || "").replace(/\D/g, "").slice(-10);
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "Staff@123");
    const role = String(req.body.role || "product_manager").trim();
    if (!name) return fail(res, 400, "Name is required");
    if (!/^[6-9]\d{9}$/.test(phone)) return fail(res, 400, "Valid 10-digit phone is required");
    if (password.length < 6) return fail(res, 400, "Password must be at least 6 characters");

    let employeeId = "";
    let employeeType = "staff";
    let payload = null;

    if (role === "farmer_manager") {
      const created = await FarmerManager.create({
        id: `fm-${Date.now()}`,
        vendorId: String(req.body.vendorId || "vendor-1").trim() || "vendor-1",
        name,
        mobile: phone,
        email,
        address: String(req.body.address || "").trim(),
        city: String(req.body.city || "").trim(),
        state: String(req.body.state || "").trim(),
        pincode: String(req.body.pincode || "").trim(),
        location: String(req.body.location || req.body.city || "").trim(),
        joiningDate: String(req.body.joiningDate || "").trim(),
        status: "Active",
        password,
        role: "FARMER_MANAGER",
      });
      employeeId = String(created.id || created._id);
      employeeType = "farmer_manager";
      payload = created.toObject();
      delete payload.password;
    } else if (role === "pickup_driver") {
      const created = await PickupDriver.create({
        id: `drv-${Date.now()}`,
        vendorId: String(req.body.vendorId || "vendor-1").trim() || "vendor-1",
        name,
        mobile: phone,
        vehicleNumber: String(req.body.vehicleNumber || "").trim(),
        vehicleType: String(req.body.vehicleType || "Van").trim(),
        licenseNumber: String(req.body.licenseNumber || "").trim(),
        assignedArea: String(req.body.assignedArea || req.body.area || "").trim(),
        password,
        role: "DRIVER",
        status: "Active",
      });
      employeeId = String(created.id || created._id);
      employeeType = "pickup_driver";
      payload = created.toObject();
      delete payload.password;
    } else if (role === "delivery_manager") {
      if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, "Valid email is required");
      const state = String(req.body.state || "").trim();
      const city = String(req.body.city || "").trim();
      const area = String(req.body.area || "").trim();
      if (!state || !city || !area) return fail(res, 400, "State, city and area are required");
      const manager = await DeliveryManager.create({
        name,
        email,
        phone,
        password,
        state,
        city,
        cityId: String(req.body.cityId || city).trim().toLowerCase().replace(/\s+/g, "-"),
        area,
        storeName: String(req.body.storeName || `${area} Store`).trim(),
        storeAddress: String(req.body.storeAddress || "").trim(),
        pincode: String(req.body.pincode || "").trim(),
      });
      await seedManagerStore(manager);
      employeeId = String(manager._id);
      employeeType = "delivery_manager";
      payload = manager.toSafeJSON();
    } else if (role === "delivery_boy") {
      const managerId = String(req.body.managerId || "").trim();
      const boy = await DeliveryBoy.create({
        name,
        phone,
        password,
        city: String(req.body.city || "").trim(),
        cityId: String(req.body.cityId || "").trim(),
        area: String(req.body.area || "").trim(),
        managerId: managerId || undefined,
        vehicleType: ["motorcycle", "bicycle", "electric", "van", "no_vehicle"].includes(req.body.vehicleType)
          ? req.body.vehicleType
          : "",
        verificationStatus: "pending",
      });
      employeeId = String(boy._id);
      employeeType = "delivery_boy";
      payload = boy.toSafeJSON ? boy.toSafeJSON() : { id: employeeId, name, phone };
    } else {
      if (!OFFICE_STAFF_ROLES.includes(role)) return fail(res, 400, "Invalid staff role");
      if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, "Valid email is required");
      const staff = await Staff.create({
        name,
        email,
        phone,
        password,
        role,
        createdBy: req.user?.id,
        createdByRole: req.user?.role || "admin",
        meta: req.body.meta && typeof req.body.meta === "object" ? req.body.meta : {},
      });
      employeeId = staff._id.toString();
      employeeType = "staff";
      payload = staff.toSafeJSON();
    }

    await attachEmployment(employeeId, employeeType, name, ROLE_LABELS[role] || role, req.body);
    return res.status(201).json({ success: true, data: payload });
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
    if (
      req.body.monthlySalary !== undefined ||
      req.body.salaryTax !== undefined ||
      req.body.department !== undefined ||
      req.body.joiningDate !== undefined ||
      req.body.salaryDate !== undefined ||
      req.body.bankAccount !== undefined
    ) {
      await upsertEmployment({
        employeeId: staff._id.toString(),
        employeeType: "staff",
        name: staff.name,
        role: ROLE_LABELS[staff.role] || staff.role,
        ...req.body,
      });
    }
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

async function upsertEmployment(payload) {
  const employeeId = String(payload.employeeId || "").trim();
  const employeeType = String(payload.employeeType || "staff").trim();
  if (!employeeId || !HR_EMPLOYEE_TYPES.includes(employeeType)) {
    throw Object.assign(new Error("Employee is required"), { status: 400 });
  }
  const monthlySalary = Number(payload.monthlySalary ?? 0);
  const gross = Number.isFinite(monthlySalary) ? Math.max(0, monthlySalary) : 0;
  const salaryTax = Math.max(0, Number(payload.salaryTax ?? payload.tax ?? 0) || 0);
  const now = new Date();
  const update = {
    name: String(payload.name || "").trim(),
    department: String(payload.department || "").trim(),
    designation: String(payload.designation || payload.role || "").trim(),
    joiningDate: String(payload.joiningDate || "").trim(),
    salaryDate: String(payload.salaryDate || "").trim(),
    monthlySalary: gross,
    bankAccount: String(payload.bankAccount || "").trim(),
    ifsc: String(payload.ifsc || "").trim(),
    upi: String(payload.upi || "").trim(),
    workNotes: String(payload.workNotes ?? "").trim(),
    updatedAt: now,
  };
  if (payload.salaryTax !== undefined || payload.tax !== undefined) update.salaryTax = salaryTax;
  if (payload.workNotes === undefined) delete update.workNotes;
  await HrEmployment.collection.updateOne(
    { employeeId, employeeType },
    { $set: update, $setOnInsert: { employeeId, employeeType, createdAt: now } },
    { upsert: true }
  );
  return HrEmployment.collection.findOne({ employeeId, employeeType });
}

export async function upsertHrEmployment(req, res, next) {
  try {
    const record = await upsertEmployment(req.body);
    return ok(res, record);
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    next(error);
  }
}

export async function listHrTasks(req, res, next) {
  try {
    const filter = {};
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    const rows = await HrTask.find(filter).sort({ createdAt: -1 }).limit(300).lean();
    return ok(res, rows, {
      stats: {
        open: rows.filter((row) => row.status === "open").length,
        in_progress: rows.filter((row) => row.status === "in_progress").length,
        done: rows.filter((row) => row.status === "done").length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createHrTask(req, res, next) {
  try {
    const title = String(req.body.title || "").trim();
    const employeeId = String(req.body.employeeId || "").trim();
    const name = String(req.body.name || "").trim();
    const employeeType = String(req.body.employeeType || "staff").trim();
    if (!title) return fail(res, 400, "Work title is required");
    if (!employeeId || !name) return fail(res, 400, "Assign this work to a person");
    if (!HR_EMPLOYEE_TYPES.includes(employeeType)) return fail(res, 400, "Invalid employee type");
    const task = await HrTask.create({
      title,
      details: String(req.body.details || "").trim(),
      dueDate: String(req.body.dueDate || "").trim(),
      employeeId,
      employeeType,
      name,
      status: req.body.status === "in_progress" ? "in_progress" : "open",
    });
    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function updateHrTask(req, res, next) {
  try {
    const task = await HrTask.findById(req.params.id);
    if (!task) return fail(res, 404, "Work item not found");
    ["title", "details", "dueDate", "status"].forEach((key) => {
      if (req.body[key] !== undefined) task[key] = req.body[key];
    });
    if (task.status && !["open", "in_progress", "done"].includes(task.status)) {
      return fail(res, 400, "Invalid work status");
    }
    await task.save();
    return ok(res, task);
  } catch (error) {
    next(error);
  }
}

export async function listHrPayroll(req, res, next) {
  try {
    const filter = {};
    if (req.query.month) filter.month = req.query.month;
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    if (req.query.roleKey && req.query.roleKey !== "all") filter.roleKey = req.query.roleKey;
    const rows = await HrPayroll.find(filter).sort({ month: -1, name: 1 }).lean();
    const pending = rows.filter((row) => row.status !== "paid");
    const paid = rows.filter((row) => row.status === "paid");
    return ok(res, rows, {
      stats: {
        count: rows.length,
        pendingCount: pending.length,
        paidCount: paid.length,
        pendingAmount: pending.reduce((sum, row) => sum + Number(row.net || 0), 0),
        paidAmount: paid.reduce((sum, row) => sum + Number(row.net || 0), 0),
        taxAmount: rows.reduce((sum, row) => sum + Number(row.tax || 0), 0),
        payruns: [...new Set(rows.map((row) => row.payrunId).filter(Boolean))],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function runHrPayroll(req, res, next) {
  try {
    const month = String(req.body.month || currentPayrollMonth()).trim();
    if (!/^\d{4}-\d{2}$/.test(month)) return fail(res, 400, "Use month as YYYY-MM");
    const { people } = await loadHrPeople();
    const roleKey = String(req.body.roleKey || "").trim();
    const employeeId = String(req.body.employeeId || "").trim();
    const employeeType = String(req.body.employeeType || "").trim();
    let payable = people.filter((person) => person.isActive && Number(person.monthlySalary) > 0);
    if (roleKey) payable = payable.filter((person) => person.roleKey === roleKey);
    if (employeeId) {
      payable = people.filter((person) => person.id === employeeId && Number(person.monthlySalary) > 0);
      if (employeeType) payable = payable.filter((person) => person.employeeType === employeeType);
    }
    if (!payable.length) return fail(res, 400, "Set monthly salaries before generating payroll");
    const existing = await HrPayroll.find({ month }).lean();
    const seen = new Set(existing.map((row) => `${row.employeeType}:${row.employeeId}`));
    const payrunId = `PR-${month}-${Date.now().toString().slice(-6)}`;
    const created = [];
    for (const person of payable) {
      const key = `${person.employeeType}:${person.id}`;
      if (seen.has(key)) continue;
      const gross = Number(person.monthlySalary);
      const tax = Math.min(gross, Math.max(0, Number(person.salaryTax || 0)));
      const net = Math.max(0, gross - tax);
      created.push(
        await HrPayroll.create({
          employeeId: person.id,
          employeeType: person.employeeType,
          name: person.name,
          role: person.role,
          roleKey: person.roleKey || "",
          month,
          gross,
          deductions: 0,
          tax,
          net,
          payrunId,
          status: "pending",
        })
      );
    }
    return ok(res, created, { month, payrunId, created: created.length, already: existing.length });
  } catch (error) {
    next(error);
  }
}

export async function updateHrPayroll(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return fail(res, 404, "Payroll row not found");
    }
    const objectId = new mongoose.Types.ObjectId(String(req.params.id));
    const row = await HrPayroll.collection.findOne({ _id: objectId });
    if (!row) return fail(res, 404, "Payroll row not found");
    const patch = {};
    if (req.body.deductions !== undefined) patch.deductions = Math.max(0, Number(req.body.deductions) || 0);
    if (req.body.gross !== undefined) patch.gross = Math.max(0, Number(req.body.gross) || 0);
    if (req.body.tax !== undefined) patch.tax = Math.max(0, Number(req.body.tax) || 0);
    const gross = patch.gross !== undefined ? patch.gross : Number(row.gross || 0);
    const deductions = patch.deductions !== undefined ? patch.deductions : Number(row.deductions || 0);
    const tax = patch.tax !== undefined ? patch.tax : Number(row.tax || 0);
    patch.net = Math.max(0, gross - deductions - tax);
    if (req.body.notes !== undefined) patch.notes = String(req.body.notes || "").trim();
    if (req.body.status === "paid" && row.status !== "paid") {
      patch.status = "paid";
      patch.paidAt = new Date();
      await FinanceLedger.create({
        type: "payout",
        title: `Salary · ${row.name} · ${row.month}`,
        amount: patch.net,
        reference: String(row._id),
        notes: `${row.role || "Staff"} payroll`,
        date: new Date(),
      });
    } else if (req.body.status === "pending") {
      patch.status = "pending";
      patch.paidAt = null;
    }
    patch.updatedAt = new Date();
    await HrPayroll.collection.updateOne({ _id: objectId }, { $set: patch });
    return ok(res, await HrPayroll.collection.findOne({ _id: objectId }));
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
    const status = String(req.body.status || "").trim();
    const result = await applyStoreOrderStatus({
      storeOrderId: req.params.id,
      status,
      skipCompletionGuards: true,
      restoreStockOnCancel: true,
    });
    if (!result.success) return fail(res, result.statusCode || 400, result.message);
    return ok(res, result.order, { message: result.message });
  } catch (error) {
    next(error);
  }
}

export async function listRidersLite(_req, res, next) {
  try {
    const riders = await DeliveryBoy.find()
      .select("-password -fcmToken")
      .populate("managerId", "name storeName city area phone")
      .sort({ name: 1 })
      .lean();
    return ok(
      res,
      riders.map((rider) => serializeDeliveryBoy(rider))
    );
  } catch (error) {
    next(error);
  }
}

export async function listDeliveryTracking(_req, res, next) {
  try {
    const riders = await DeliveryBoy.find()
      .select("-password -fcmToken")
      .populate("managerId", "name storeName city area")
      .sort({ status: 1, name: 1 })
      .lean();
    const data = riders.map((rider) => serializeDeliveryBoy(rider));
    return ok(res, data, {
      stats: {
        total: data.length,
        online: data.filter((r) => r.status === "online").length,
        onDelivery: data.filter((r) => r.status === "on_delivery").length,
        offline: data.filter((r) => r.status === "offline").length,
        withLocation: data.filter((r) => r.currentLocation?.lat && r.currentLocation?.lng).length,
        pendingVerification: data.filter((r) => r.verificationStatus === "pending").length,
      },
    });
  } catch (error) {
    next(error);
  }
}

function documentRows(docs = {}) {
  return Object.entries(docs || {}).map(([type, meta]) => ({
    type,
    url: meta?.url || "",
    status: meta?.status || "pending",
    capturedAt: meta?.capturedAt || null,
  }));
}

function serializeDeliveryManager(manager, extras = {}) {
  if (!manager) return null;
  return {
    id: String(manager._id),
    name: manager.name || manager.storeName || "Delivery manager",
    email: manager.email || "",
    phone: manager.phone || "",
    state: manager.state || "",
    city: manager.city || "",
    cityId: manager.cityId || "",
    area: manager.area || "",
    storeName: manager.storeName || `${manager.area || "Store"} Store`,
    storeAddress: manager.storeAddress || "",
    pincode: manager.pincode || "",
    latitude: manager.latitude ?? null,
    longitude: manager.longitude ?? null,
    deliveryRadiusKm: manager.deliveryRadiusKm ?? 5,
    geofenceRadius: manager.geofenceRadius ?? 500,
    isActive: manager.isActive !== false,
    createdAt: manager.createdAt,
    updatedAt: manager.updatedAt,
    ...extras,
  };
}

function serializeDeliveryBoy(boy, extras = {}) {
  if (!boy) return null;
  const manager = boy.managerId && typeof boy.managerId === "object" && boy.managerId._id ? boy.managerId : null;
  return {
    id: String(boy._id),
    name: boy.name || "Delivery partner",
    phone: boy.phone || "",
    language: boy.language || "en",
    city: boy.city || "",
    cityId: boy.cityId || "",
    area: boy.area || "",
    storeId: boy.storeId || (manager ? String(manager._id) : ""),
    vehicleType: boy.vehicleType || "",
    rating: boy.rating ?? 5,
    totalRatingsCount: boy.totalRatingsCount || 0,
    status: boy.status || "offline",
    isActive: boy.isActive !== false,
    verificationStatus: boy.verificationStatus || "pending",
    verifiedAt: boy.verifiedAt || null,
    verificationNote: boy.verificationNote || "",
    onboardingComplete: Boolean(boy.onboardingComplete),
    onboardingStep: boy.onboardingStep || "",
    livenessPassed: Boolean(boy.livenessPassed),
    lastSeenAt: boy.lastSeenAt,
    lastOnlineAt: boy.lastOnlineAt,
    lastOfflineAt: boy.lastOfflineAt,
    currentLocation: boy.currentLocation?.lat != null && boy.currentLocation?.lng != null ? boy.currentLocation : null,
    todayOnlineMinutes: boy.todayOnlineMinutes || 0,
    todayCompletedOrders: boy.todayCompletedOrders || 0,
    todayOrderCount: boy.todayOrderCount || boy.todayCompletedOrders || 0,
    todayEarnings: boy.todayEarnings || 0,
    walletBalance: boy.walletBalance || 0,
    totalLifetimeEarnings: boy.totalLifetimeEarnings || 0,
    lastOrderAssignedAt: boy.lastOrderAssignedAt || boy.lastAssignedAt || null,
    lastOrderCompletedAt: boy.lastOrderCompletedAt || null,
    activeOrderId: boy.activeOrderId ? String(boy.activeOrderId) : null,
    bankDetails: boy.bankDetails || {},
    selfie: boy.selfie || {},
    documents: documentRows(boy.documents),
    manager: manager
      ? {
          id: String(manager._id),
          name: manager.name || "",
          storeName: manager.storeName || "",
          area: manager.area || "",
          city: manager.city || "",
          phone: manager.phone || "",
        }
      : null,
    createdAt: boy.createdAt,
    updatedAt: boy.updatedAt,
    ...extras,
  };
}

function orderLite(order) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    status: order.status,
    assignmentStatus: order.assignmentStatus,
    area: order.area,
    city: order.city,
    assignedAt: order.assignedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
  };
}

export async function listDeliveryTeam(_req, res, next) {
  try {
    const [managers, boys, boyOrders, managerOrders] = await Promise.all([
      DeliveryManager.find().select("-password").sort({ createdAt: -1 }).lean(),
      DeliveryBoy.find().select("-password -fcmToken").populate("managerId", "name storeName city area phone email").sort({ createdAt: -1 }).lean(),
      StoreOrder.aggregate([
        { $match: { assignedRiderId: { $ne: null } } },
        { $group: { _id: "$assignedRiderId", total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } } } },
      ]),
      StoreOrder.aggregate([
        { $group: { _id: "$managerId", total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } } } },
      ]),
    ]);
    const boyStats = Object.fromEntries(boyOrders.map((row) => [String(row._id), row]));
    const managerStats = Object.fromEntries(managerOrders.map((row) => [String(row._id), row]));
    const boysByManager = {};
    for (const boy of boys) {
      const key = boy.managerId?._id ? String(boy.managerId._id) : "unassigned";
      boysByManager[key] = (boysByManager[key] || 0) + 1;
    }
    const managerItems = managers.map((manager) =>
      serializeDeliveryManager(manager, {
        riderCount: boysByManager[String(manager._id)] || 0,
        orderCount: managerStats[String(manager._id)]?.total || 0,
        deliveredCount: managerStats[String(manager._id)]?.delivered || 0,
      })
    );
    const boyItems = boys.map((boy) =>
      serializeDeliveryBoy(boy, {
        orderCount: boyStats[String(boy._id)]?.total || 0,
        deliveredCount: boyStats[String(boy._id)]?.delivered || 0,
      })
    );
    return ok(res, { managers: managerItems, boys: boyItems }, {
      stats: {
        managers: managerItems.length,
        activeManagers: managerItems.filter((m) => m.isActive).length,
        boys: boyItems.length,
        online: boyItems.filter((b) => b.status === "online").length,
        onDelivery: boyItems.filter((b) => b.status === "on_delivery").length,
        pendingVerification: boyItems.filter((b) => b.verificationStatus === "pending").length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryManagerAdmin(req, res, next) {
  try {
    const manager = await DeliveryManager.findById(req.params.id).select("-password").lean();
    if (!manager) return fail(res, 404, "Delivery manager not found");
    const [boys, orders] = await Promise.all([
      DeliveryBoy.find({ managerId: manager._id }).select("-password -fcmToken").sort({ createdAt: -1 }).lean(),
      StoreOrder.find({ managerId: manager._id }).sort({ createdAt: -1 }).limit(40).lean(),
    ]);
    return ok(res, {
      manager: serializeDeliveryManager(manager, {
        riderCount: boys.length,
        orderCount: orders.length,
      }),
      riders: boys.map((boy) => serializeDeliveryBoy({ ...boy, managerId: manager })),
      orders: orders.map(orderLite),
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryBoyAdmin(req, res, next) {
  try {
    const boy = await DeliveryBoy.findById(req.params.id)
      .select("-password -fcmToken")
      .populate("managerId", "name storeName city area phone email storeAddress pincode")
      .lean();
    if (!boy) return fail(res, 404, "Delivery partner not found");
    const orders = await StoreOrder.find({ assignedRiderId: boy._id }).sort({ createdAt: -1 }).limit(40).lean();
    return ok(res, {
      rider: serializeDeliveryBoy(boy, {
        orderCount: orders.length,
        deliveredCount: orders.filter((o) => o.status === "delivered").length,
      }),
      manager: serializeDeliveryManager(boy.managerId && boy.managerId._id ? boy.managerId : null),
      orders: orders.map(orderLite),
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
