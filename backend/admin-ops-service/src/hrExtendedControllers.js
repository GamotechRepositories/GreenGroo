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

function todayYmd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Date-only YYYY-MM-DD is due on that calendar day; full timestamps use wall-clock. */
function isScheduleDue(scheduledAt, now = new Date()) {
  const raw = String(scheduledAt || "").trim();
  if (!raw) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw <= todayYmd(now);
  const when = new Date(raw);
  return !Number.isNaN(when.getTime()) && when <= now;
}

function resolveAnnouncementStatus({ status, scheduledAt }) {
  const date = String(scheduledAt || "").trim();
  const wanted = String(status || "").trim().toLowerCase();
  if (wanted === "draft") return "draft";
  if (wanted === "published") return "published";
  if (date) return isScheduleDue(date) ? "published" : "scheduled";
  if (wanted === "scheduled") return "draft";
  // Default: publish immediately so role apps/panels can see it
  return "published";
}

async function publishDueAnnouncements() {
  const now = new Date();
  const scheduled = await HrAnnouncement.find({ status: "scheduled" })
    .select("_id scheduledAt title body roleKey category")
    .lean();
  const due = scheduled.filter((row) => isScheduleDue(row.scheduledAt, now));
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

async function publishDueShifts() {
  const today = todayYmd();
  await HrShift.updateMany(
    { status: "scheduled", date: { $lte: today } },
    { $set: { status: "published" } }
  );
}

function announcementKind(row) {
  const cat = String(row.category || "announcement").toLowerCase();
  if (cat === "holiday" || cat === "note") return cat;
  return "announcement";
}

function normalizeAnnouncementCategory(value) {
  const cat = String(value || "announcement").toLowerCase().trim();
  if (cat === "holiday" || cat === "note" || cat === "announcement") return cat;
  return "announcement";
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
      .select("title body roleKey category scheduledAt publishedAt createdAt")
      .lean();
    return ok(
      res,
      rows.map((row) => ({
        ...row,
        kind: announcementKind(row),
        category: announcementKind(row),
      }))
    );
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
    const status = resolveAnnouncementStatus({ status: req.body.status, scheduledAt });
    const category = normalizeAnnouncementCategory(req.body.category || req.body.kind);
    const row = await HrAnnouncement.create({
      title,
      body: String(req.body.body || "").trim(),
      roleKey: String(req.body.roleKey || "all").trim() || "all",
      category,
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
    if (req.body.category !== undefined || req.body.kind !== undefined) {
      row.category = normalizeAnnouncementCategory(req.body.category || req.body.kind);
    }
    if (req.body.status !== undefined || req.body.scheduledAt !== undefined) {
      const status = resolveAnnouncementStatus({
        status: req.body.status !== undefined ? req.body.status : row.status,
        scheduledAt: row.scheduledAt,
      });
      row.status = status;
      if (status === "published" && !row.publishedAt) row.publishedAt = new Date();
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
    const allForStats =
      req.query.roleKey && req.query.roleKey !== "all"
        ? await HrLeaveRequest.find({}).select("roleKey status").lean()
        : rows;
    const byRole = {};
    allForStats.forEach((row) => {
      const key = String(row.roleKey || "other").trim() || "other";
      if (!byRole[key]) byRole[key] = { total: 0, pending: 0, approved: 0, rejected: 0 };
      byRole[key].total += 1;
      if (row.status === "pending") byRole[key].pending += 1;
      else if (row.status === "approved") byRole[key].approved += 1;
      else if (row.status === "rejected") byRole[key].rejected += 1;
    });
    return ok(res, rows, {
      roles: HR_ROLES.filter((role) => role.value !== "all"),
      byRole,
      stats: {
        pending: rows.filter((row) => row.status === "pending").length,
        approved: rows.filter((row) => row.status === "approved").length,
        rejected: rows.filter((row) => row.status === "rejected").length,
        total: rows.length,
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
    ["leaveType", "fromDate", "toDate", "reason", "adminNotes", "status"].forEach((key) => {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    });
    if (row.fromDate && row.toDate) row.days = daysBetween(row.fromDate, row.toDate);
    if (req.body.status === "approved" || req.body.status === "rejected") {
      row.assignedBy = req.user?.email || req.user?.name || row.assignedBy || "admin";
    }
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
    let status = req.body.status === "scheduled" ? "scheduled" : "published";
    if (status === "scheduled" && isScheduleDue(date)) status = "published";
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
      status,
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
    if (req.body.status !== undefined) {
      let status = req.body.status === "scheduled" ? "scheduled" : "published";
      if (status === "scheduled" && isScheduleDue(row.date)) status = "published";
      row.status = status;
    }
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
    await publishDueAnnouncements();
    await publishDueShifts();
    const month = String(req.query.month || todayYmd().slice(0, 7));
    if (!/^\d{4}-\d{2}$/.test(month)) return fail(res, 400, "month must be YYYY-MM");
    const roleKey = String(req.query.roleKey || "all").trim();
    const monthStart = new Date(`${month}-01T00:00:00`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
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
      return key === roleKey || key === "all";
    };
    const inMonth = (value) => {
      const day = String(value || "").slice(0, 10);
      return day.startsWith(month);
    };
    const [announcements, shifts] = await Promise.all([
      HrAnnouncement.find({
        $or: [
          { scheduledAt: { $regex: `^${month}` } },
          { publishedAt: { $gte: monthStart, $lt: monthEnd } },
          {
            $and: [
              { $or: [{ scheduledAt: "" }, { scheduledAt: null }, { scheduledAt: { $exists: false } }] },
              { createdAt: { $gte: monthStart, $lt: monthEnd } },
            ],
          },
        ],
      }).lean(),
      HrShift.find({ date: { $regex: `^${month}` } }).lean(),
    ]);
    const events = [
      ...announcements
        .filter(matchesRole)
        .map((row) => {
          const date = (row.scheduledAt || row.publishedAt || row.createdAt || "")
            .toString()
            .slice(0, 10);
          const kind = announcementKind(row);
          return {
            id: String(row._id),
            kind,
            title: row.title,
            date,
            roleKey: resolvedRole(row),
            status: row.status,
            body: row.body || "",
            meta: row,
          };
        })
        .filter((row) => inMonth(row.date)),
      ...shifts.filter(matchesRole).map((row) => ({
        id: String(row._id),
        kind: "shift",
        title: `${row.name} · ${row.shiftName}`,
        date: row.date,
        roleKey: resolvedRole(row),
        status: row.status || "published",
        body: `${row.startTime || ""}–${row.endTime || ""}`.trim(),
        meta: row,
      })),
    ];
    return ok(res, events, { month, roleKey, roles: HR_ROLES });
  } catch (error) {
    next(error);
  }
}

/** Role apps/panels: upcoming calendar notes + shifts for this role (role-scoped). */
export async function listLiveHrCalendar(req, res, next) {
  try {
    await publishDueAnnouncements();
    await publishDueShifts();
    const queried = String(req.query.role || "").trim().toLowerCase();
    const roleKey = HR_ROLE_KEYS.includes(queried) ? queried : mapJwtRoleToHrKey(req.user?.role);
    if (!roleKey) return fail(res, 400, "role is required");
    const today = todayYmd();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);
    const until = todayYmd(horizon);
    const recentCut = new Date();
    recentCut.setDate(recentCut.getDate() - 14);
    const recentDay = todayYmd(recentCut);

    const [announcements, shifts] = await Promise.all([
      HrAnnouncement.find({
        status: { $in: ["published", "scheduled"] },
        roleKey: { $in: ["all", roleKey] },
      })
        .sort({ scheduledAt: 1, publishedAt: -1, createdAt: -1 })
        .limit(40)
        .select("title body roleKey category status scheduledAt publishedAt createdAt")
        .lean(),
      HrShift.find({
        roleKey: { $in: ["all", roleKey] },
        date: { $gte: today, $lte: until },
        $or: [{ status: "published" }, { status: { $exists: false } }, { status: null }],
      })
        .sort({ date: 1, startTime: 1 })
        .limit(40)
        .lean(),
    ]);

    const announcementEvents = announcements
      .map((row) => {
        const date = (row.scheduledAt || row.publishedAt || row.createdAt || "")
          .toString()
          .slice(0, 10);
        if (!date) return null;
        if (row.status === "scheduled") {
          if (date < today || date > until) return null;
        } else if (date < recentDay) {
          return null;
        }
        const kind = announcementKind(row);
        return {
          id: String(row._id),
          kind,
          category: kind,
          title: row.title,
          body: row.body || "",
          date,
          roleKey: row.roleKey || "all",
          status: row.status,
        };
      })
      .filter(Boolean);

    const shiftEvents = shifts.map((row) => ({
      id: String(row._id),
      kind: "shift",
      title: `${row.name || "Shift"} · ${row.shiftName || "General"}`,
      body: `${row.startTime || ""}–${row.endTime || ""}`.trim(),
      date: row.date,
      roleKey: row.roleKey || roleKey,
      status: row.status || "published",
    }));

    const events = [...announcementEvents, ...shiftEvents].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );

    return ok(res, events.slice(0, 20));
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
