import {
  HR_ROLE_KEYS,
  HrAnnouncement,
  HrAttendance,
  HrCandidate,
  HrLeavePolicy,
  HrLeaveRequest,
  HrPayroll,
  HrShift,
  HrVacancy,
} from "./models.js";
import { ROLE_LABELS } from "../../staff-service/src/constants/roles.js";
import { loadHrPeople } from "./opsControllers.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

async function notifyDeliveryBoysAnnouncement(row) {
  try {
    const roleKey = String(row.roleKey || "all").toLowerCase();
    if (roleKey !== "all" && roleKey !== "delivery_boy") return;

    const DeliveryBoy = (await import("../../delivery-service/src/models/DeliveryBoy.js")).default;
    const { notifyRiders } = await import(
      "../../delivery-service/src/services/RiderNotificationService.js"
    );
    const riders = await DeliveryBoy.find({ isActive: { $ne: false } }).select("_id");
    if (!riders.length) return;
    await notifyRiders({
      riderIds: riders.map((r) => r._id),
      type: "ANNOUNCEMENT",
      title: row.title || "New announcement",
      message: row.body || "You have a new announcement",
      priority: "normal",
      dedupeKey: `announcement:${String(row._id || "")}`,
      data: {
        announcementId: String(row._id || ""),
        screen: "notifications",
        badge: "new",
      },
    });
  } catch (err) {
    console.warn("[HR] announcement notify failed:", err.message);
  }
}

export const HR_ROLES = [
  { value: "all", label: "All roles" },
  ...HR_ROLE_KEYS.map((value) => ({ value, label: ROLE_LABELS[value] || value.replaceAll("_", " ") })),
];

function daysBetween(fromDate, toDate) {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return 1;
  return Math.round((to - from) / 86400000) + 1;
}

async function ensureLeavePolicies() {
  const existing = await HrLeavePolicy.find().lean();
  const have = new Set(existing.map((row) => row.roleKey));
  const missing = HR_ROLE_KEYS.filter((role) => !have.has(role));
  if (missing.length) {
    await HrLeavePolicy.insertMany(
      missing.map((roleKey) => ({
        roleKey,
        casualDays: 12,
        sickDays: 12,
        earnedDays: 15,
        notes: "Default annual leave policy",
      }))
    );
  }
  return HrLeavePolicy.find().sort({ roleKey: 1 }).lean();
}

export async function getHrPerson(req, res, next) {
  try {
    const { type, id } = req.params;
    const { people } = await loadHrPeople();
    const person = people.find((row) => row.employeeType === type && String(row.id) === String(id));
    if (!person) return fail(res, 404, "Employee not found");
    const [attendance, leaves, payroll, tasks, shifts] = await Promise.all([
      HrAttendance.find({ employeeId: id }).sort({ clockIn: -1 }).limit(40).lean(),
      HrLeaveRequest.find({ employeeId: id }).sort({ fromDate: -1 }).limit(40).lean(),
      HrPayroll.find({ employeeId: id }).sort({ month: -1 }).limit(24).lean(),
      HrTask.find({ employeeId: id }).sort({ createdAt: -1 }).limit(40).lean(),
      HrShift.find({ employeeId: id }).sort({ date: -1 }).limit(40).lean(),
    ]);
    return ok(res, { person, attendance, leaves, payroll, tasks, shifts });
  } catch (error) {
    next(error);
  }
}

export async function listHrRoles(_req, res, next) {
  try {
    const { people } = await loadHrPeople();
    const counts = {};
    people.forEach((person) => {
      const key = person.roleKey || "other";
      counts[key] = (counts[key] || 0) + 1;
    });
    const roles = HR_ROLES.filter((role) => role.value !== "all").map((role) => ({
      ...role,
      count: counts[role.value] || 0,
    }));
    return ok(res, roles, { stats: { total: people.length } });
  } catch (error) {
    next(error);
  }
}

function mapJwtRoleToHrKey(role) {
  const raw = String(role || "").trim();
  if (HR_ROLE_KEYS.includes(raw.toLowerCase())) return raw.toLowerCase();
  const compact = raw.replace(/[\s-]/g, "_").toUpperCase();
  const map = {
    VENDOR: "vendor",
    SEGREGATION_MANAGER: "segregation_manager",
    PRODUCT_MANAGER: "product_manager",
    FARMER_MANAGER: "farmer_manager",
    FARMER: "farmer",
    DRIVER: "pickup_driver",
    PICKUP_DRIVER: "pickup_driver",
    DELIVERY_MANAGER: "delivery_manager",
    DELIVERY_BOY: "delivery_boy",
  };
  return map[compact] || null;
}

async function publishDueAnnouncements() {
  const now = new Date();
  const scheduled = await HrAnnouncement.find({ status: "scheduled" }).select("_id scheduledAt title body roleKey").lean();
  const due = scheduled.filter((row) => {
    if (!row.scheduledAt) return false;
    const when = new Date(row.scheduledAt);
    return !Number.isNaN(when.getTime()) && when <= now;
  });
  const dueIds = due.map((row) => row._id);
  if (dueIds.length) {
    await HrAnnouncement.updateMany(
      { _id: { $in: dueIds } },
      { $set: { status: "published", publishedAt: now } }
    );
    for (const row of due) {
      notifyDeliveryBoysAnnouncement({ ...row, status: "published" }).catch(() => {});
    }
  }
}

export async function listLiveHrAnnouncements(req, res, next) {
  try {
    await publishDueAnnouncements();
    const queried = String(req.query.role || "").trim().toLowerCase();
    const roleKey = HR_ROLE_KEYS.includes(queried) ? queried : mapJwtRoleToHrKey(req.user?.role);
    if (!roleKey) return fail(res, 400, "role is required");
    const rows = await HrAnnouncement.find({
      status: "published",
      roleKey: { $in: ["all", roleKey] },
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(20)
      .select("title body roleKey publishedAt createdAt")
      .lean();
    return ok(res, rows);
  } catch (error) {
    next(error);
  }
}

export async function listHrAnnouncements(req, res, next) {
  try {
    await publishDueAnnouncements();
    const filter = {};
    if (req.query.roleKey && req.query.roleKey !== "all") {
      filter.$or = [{ roleKey: req.query.roleKey }, { roleKey: "all" }];
    }
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    const rows = await HrAnnouncement.find(filter).sort({ createdAt: -1 }).lean();
    return ok(res, rows, {
      roles: HR_ROLES,
      stats: {
        draft: rows.filter((row) => row.status === "draft").length,
        scheduled: rows.filter((row) => row.status === "scheduled").length,
        published: rows.filter((row) => row.status === "published").length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createHrAnnouncement(req, res, next) {
  try {
    const title = String(req.body.title || "").trim();
    if (!title) return fail(res, 400, "Title is required");
    const scheduledAt = String(req.body.scheduledAt || "").trim();
    let status = req.body.status === "published" ? "published" : scheduledAt ? "scheduled" : "draft";
    if (req.body.status === "draft") status = "draft";
    const row = await HrAnnouncement.create({
      title,
      body: String(req.body.body || "").trim(),
      roleKey: String(req.body.roleKey || "all").trim() || "all",
      status,
      scheduledAt,
      publishedAt: status === "published" ? new Date() : null,
      createdBy: req.user?.email || req.user?.name || "admin",
    });
    if (row.status === "published") {
      notifyDeliveryBoysAnnouncement(row).catch(() => {});
    }
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
}

export async function updateHrAnnouncement(req, res, next) {
  try {
    const row = await HrAnnouncement.findById(req.params.id);
    if (!row) return fail(res, 404, "Announcement not found");
    ["title", "body", "roleKey", "scheduledAt"].forEach((key) => {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    });
    if (req.body.status) {
      row.status = req.body.status;
      if (row.status === "published" && !row.publishedAt) row.publishedAt = new Date();
    }
    await row.save();
    if (row.status === "published") {
      notifyDeliveryBoysAnnouncement(row).catch(() => {});
    }
    return ok(res, row);
  } catch (error) {
    next(error);
  }
}

export async function deleteHrAnnouncement(req, res, next) {
  try {
    const row = await HrAnnouncement.findByIdAndDelete(req.params.id);
    if (!row) return fail(res, 404, "Announcement not found");
    return ok(res, { id: req.params.id });
  } catch (error) {
    next(error);
  }
}

export async function listHrLeavePolicies(_req, res, next) {
  try {
    const rows = await ensureLeavePolicies();
    return ok(
      res,
      rows.map((row) => ({
        ...row,
        role: ROLE_LABELS[row.roleKey] || row.roleKey,
      }))
    );
  } catch (error) {
    next(error);
  }
}

export async function upsertHrLeavePolicy(req, res, next) {
  try {
    const roleKey = String(req.body.roleKey || req.params.roleKey || "").trim();
    if (!HR_ROLE_KEYS.includes(roleKey)) return fail(res, 400, "Invalid role");
    const row = await HrLeavePolicy.findOneAndUpdate(
      { roleKey },
      {
        $set: {
          casualDays: Math.max(0, Number(req.body.casualDays ?? 12)),
          sickDays: Math.max(0, Number(req.body.sickDays ?? 12)),
          earnedDays: Math.max(0, Number(req.body.earnedDays ?? 15)),
          notes: String(req.body.notes || "").trim(),
        },
      },
      { new: true, upsert: true }
    );
    return ok(res, row);
  } catch (error) {
    next(error);
  }
}

export async function listHrLeaves(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    if (req.query.roleKey && req.query.roleKey !== "all") filter.roleKey = req.query.roleKey;
    const rows = await HrLeaveRequest.find(filter).sort({ createdAt: -1 }).limit(400).lean();
    return ok(res, rows, {
      stats: {
        pending: rows.filter((row) => row.status === "pending").length,
        approved: rows.filter((row) => row.status === "approved").length,
        rejected: rows.filter((row) => row.status === "rejected").length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createHrLeave(req, res, next) {
  try {
    const employeeId = String(req.body.employeeId || "").trim();
    const name = String(req.body.name || "").trim();
    const fromDate = String(req.body.fromDate || "").trim();
    const toDate = String(req.body.toDate || req.body.fromDate || "").trim();
    if (!employeeId || !name) return fail(res, 400, "Employee is required");
    if (!fromDate) return fail(res, 400, "Leave dates are required");
    const status = req.body.status === "approved" || req.body.assign ? "approved" : "pending";
    const row = await HrLeaveRequest.create({
      employeeId,
      employeeType: req.body.employeeType || "staff",
      name,
      role: String(req.body.role || "").trim(),
      roleKey: String(req.body.roleKey || "").trim(),
      leaveType: ["casual", "sick", "earned", "unpaid"].includes(req.body.leaveType) ? req.body.leaveType : "casual",
      fromDate,
      toDate,
      days: daysBetween(fromDate, toDate),
      reason: String(req.body.reason || "").trim(),
      status,
      assignedBy: status === "approved" ? req.user?.email || "admin" : "",
    });
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
}

export async function updateHrLeave(req, res, next) {
  try {
    const row = await HrLeaveRequest.findById(req.params.id);
    if (!row) return fail(res, 404, "Leave request not found");
    ["leaveType", "fromDate", "toDate", "reason", "status"].forEach((key) => {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    });
    if (row.fromDate && row.toDate) row.days = daysBetween(row.fromDate, row.toDate);
    await row.save();
    return ok(res, row);
  } catch (error) {
    next(error);
  }
}

export async function deleteHrLeave(req, res, next) {
  try {
    const row = await HrLeaveRequest.findByIdAndDelete(req.params.id);
    if (!row) return fail(res, 404, "Leave request not found");
    return ok(res, { id: req.params.id });
  } catch (error) {
    next(error);
  }
}

export async function listHrShifts(req, res, next) {
  try {
    const filter = {};
    if (req.query.roleKey && req.query.roleKey !== "all") filter.roleKey = req.query.roleKey;
    if (req.query.date) filter.date = req.query.date;
    const rows = await HrShift.find(filter).sort({ date: -1, startTime: 1 }).limit(400).lean();
    return ok(res, rows);
  } catch (error) {
    next(error);
  }
}

export async function createHrShift(req, res, next) {
  try {
    const employeeId = String(req.body.employeeId || "").trim();
    const name = String(req.body.name || "").trim();
    const date = String(req.body.date || "").trim();
    if (!employeeId || !name || !date) return fail(res, 400, "Employee and date are required");
    const row = await HrShift.create({
      employeeId,
      employeeType: req.body.employeeType || "staff",
      name,
      role: String(req.body.role || "").trim(),
      roleKey: String(req.body.roleKey || "").trim(),
      date,
      startTime: String(req.body.startTime || "09:00"),
      endTime: String(req.body.endTime || "18:00"),
      shiftName: String(req.body.shiftName || "General").trim(),
      notes: String(req.body.notes || "").trim(),
    });
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
}

export async function updateHrShift(req, res, next) {
  try {
    const row = await HrShift.findById(req.params.id);
    if (!row) return fail(res, 404, "Shift not found");
    ["date", "startTime", "endTime", "shiftName", "notes", "name", "role", "roleKey"].forEach((key) => {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    });
    await row.save();
    return ok(res, row);
  } catch (error) {
    next(error);
  }
}

export async function deleteHrShift(req, res, next) {
  try {
    const row = await HrShift.findByIdAndDelete(req.params.id);
    if (!row) return fail(res, 404, "Shift not found");
    return ok(res, { id: req.params.id });
  } catch (error) {
    next(error);
  }
}

export async function listHrCalendar(req, res, next) {
  try {
    const month = String(req.query.month || new Date().toISOString().slice(0, 7));
    const roleKey = String(req.query.roleKey || "all").trim();
    const { people } = await loadHrPeople();
    const peopleByKey = new Map(
      people.map((person) => [`${person.employeeType}:${String(person.id)}`, person])
    );
    const resolvedRole = (row) => {
      const stored = String(row.roleKey || "").trim();
      if (stored) return stored;
      const person = peopleByKey.get(`${row.employeeType}:${String(row.employeeId || "")}`);
      return String(person?.roleKey || "all").trim() || "all";
    };
    const matchesRole = (row) => {
      const key = resolvedRole(row);
      if (!roleKey || roleKey === "all") return true;
      return key === roleKey;
    };
    const [leaves, announcements, shifts] = await Promise.all([
      HrLeaveRequest.find({
        status: { $ne: "rejected" },
        $or: [{ fromDate: { $regex: `^${month}` } }, { toDate: { $regex: `^${month}` } }],
      }).lean(),
      HrAnnouncement.find({
        $or: [{ scheduledAt: { $regex: `^${month}` } }, { publishedAt: { $gte: new Date(`${month}-01`) } }],
      }).lean(),
      HrShift.find({ date: { $regex: `^${month}` } }).lean(),
    ]);
    const events = [
      ...leaves.filter(matchesRole).map((row) => ({
        id: String(row._id),
        kind: "leave",
        title: `${row.name} · ${row.leaveType} leave`,
        date: row.fromDate,
        toDate: row.toDate || row.fromDate,
        roleKey: resolvedRole(row),
        status: row.status,
        body: row.reason || "",
        meta: row,
      })),
      ...announcements.filter(matchesRole).map((row) => ({
        id: String(row._id),
        kind: "announcement",
        title: row.title,
        date: (row.scheduledAt || row.publishedAt || row.createdAt || "").toString().slice(0, 10),
        roleKey: resolvedRole(row),
        status: row.status,
        body: row.body || "",
        meta: row,
      })),
      ...shifts.filter(matchesRole).map((row) => ({
        id: String(row._id),
        kind: "shift",
        title: `${row.name} · ${row.shiftName}`,
        date: row.date,
        roleKey: resolvedRole(row),
        status: "shift",
        body: `${row.startTime || ""}–${row.endTime || ""}`.trim(),
        meta: row,
      })),
    ];
    return ok(res, events, { month, roleKey, roles: HR_ROLES });
  } catch (error) {
    next(error);
  }
}

export async function listHrVacancies(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    if (req.query.roleKey && req.query.roleKey !== "all") filter.roleKey = req.query.roleKey;
    const rows = await HrVacancy.find(filter).sort({ createdAt: -1 }).lean();
    return ok(res, rows, { roles: HR_ROLES.filter((role) => role.value !== "all") });
  } catch (error) {
    next(error);
  }
}

export async function createHrVacancy(req, res, next) {
  try {
    const title = String(req.body.title || "").trim();
    const roleKey = String(req.body.roleKey || "").trim();
    if (!title) return fail(res, 400, "Vacancy title is required");
    if (!HR_ROLE_KEYS.includes(roleKey)) return fail(res, 400, "Choose a role for this vacancy");
    const row = await HrVacancy.create({
      title,
      roleKey,
      openings: Math.max(1, Number(req.body.openings || 1)),
      location: String(req.body.location || "").trim(),
      description: String(req.body.description || "").trim(),
      status: req.body.status === "closed" ? "closed" : "open",
    });
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
}

export async function updateHrVacancy(req, res, next) {
  try {
    const row = await HrVacancy.findById(req.params.id);
    if (!row) return fail(res, 404, "Vacancy not found");
    ["title", "roleKey", "location", "description", "status"].forEach((key) => {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    });
    if (req.body.openings !== undefined) row.openings = Math.max(1, Number(req.body.openings) || 1);
    await row.save();
    return ok(res, row);
  } catch (error) {
    next(error);
  }
}

export async function listHrCandidates(req, res, next) {
  try {
    const filter = {};
    if (req.query.stage && req.query.stage !== "all") filter.stage = req.query.stage;
    if (req.query.roleKey && req.query.roleKey !== "all") filter.roleKey = req.query.roleKey;
    if (req.query.vacancyId) filter.vacancyId = req.query.vacancyId;
    const rows = await HrCandidate.find(filter).sort({ updatedAt: -1 }).lean();
    const byStage = {};
    rows.forEach((row) => {
      byStage[row.stage] = (byStage[row.stage] || 0) + 1;
    });
    return ok(res, rows, { stats: { total: rows.length, byStage } });
  } catch (error) {
    next(error);
  }
}

export async function createHrCandidate(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const roleKey = String(req.body.roleKey || "").trim();
    if (!name) return fail(res, 400, "Candidate name is required");
    if (!HR_ROLE_KEYS.includes(roleKey)) return fail(res, 400, "Choose a role");
    const row = await HrCandidate.create({
      name,
      email: String(req.body.email || "").trim().toLowerCase(),
      phone: String(req.body.phone || "").trim(),
      roleKey,
      vacancyId: String(req.body.vacancyId || "").trim(),
      stage: req.body.stage || "applied",
      rating: Math.min(5, Math.max(0, Number(req.body.rating || 0))),
      notes: String(req.body.notes || "").trim(),
      resumeName: String(req.body.resumeName || "").trim(),
      resumeUrl: String(req.body.resumeUrl || "").trim(),
      resumeData: String(req.body.resumeData || "").slice(0, 2_000_000),
    });
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
}

export async function updateHrCandidate(req, res, next) {
  try {
    const row = await HrCandidate.findById(req.params.id);
    if (!row) return fail(res, 404, "Candidate not found");
    ["name", "email", "phone", "roleKey", "vacancyId", "stage", "notes", "resumeName", "resumeUrl"].forEach((key) => {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    });
    if (req.body.rating !== undefined) row.rating = Math.min(5, Math.max(0, Number(req.body.rating) || 0));
    if (req.body.resumeData !== undefined) row.resumeData = String(req.body.resumeData || "").slice(0, 2_000_000);
    await row.save();
    return ok(res, row);
  } catch (error) {
    next(error);
  }
}

export async function downloadHrCandidateCv(req, res, next) {
  try {
    const row = await HrCandidate.findById(req.params.id);
    if (!row) return fail(res, 404, "Candidate not found");
    if (row.resumeUrl && !row.resumeData) {
      return ok(res, { url: row.resumeUrl, name: row.resumeName || "cv" });
    }
    if (!row.resumeData) return fail(res, 404, "No CV uploaded");
    return ok(res, { data: row.resumeData, name: row.resumeName || `${row.name}-cv` });
  } catch (error) {
    next(error);
  }
}
