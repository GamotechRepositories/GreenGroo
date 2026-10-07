import { GovernmentScheme, FarmerSchemeApplication } from "./models.js";
import { getIO } from "../../shared/socket.js";
import { createMemoryCache } from "../../shared/cache/memoryCache.js";

const liveSchemesCache = createMemoryCache({
  name: "govt-schemes-live",
  ttlMs: 10 * 60_000,
  collections: [GovernmentScheme.collection.collectionName],
  maxEntries: 1,
});

const STATUS_LABELS = {
  active: "Active (अर्जासाठी खुले)",
  closing_soon: "Closing Soon (अंतिम तारीख जवळ)",
  upcoming: "Upcoming (लवकरच सुरू)",
  closed: "Closed",
};

function safeEmit(fn) {
  try {
    const io = getIO();
    if (io) fn(io);
  } catch (_) {}
}

function mapScheme(doc) {
  if (!doc) return null;
  const row = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    ...row,
    statusLabel: STATUS_LABELS[row.status] || row.status,
    statusBadge: row.status,
  };
}

export async function listGovtSchemes(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") {
      filter.status = String(req.query.status);
    }
    if (req.query.category && req.query.category !== "all") {
      filter.category = String(req.query.category);
    }
    const rows = await GovernmentScheme.find(filter).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: rows.map(mapScheme),
      stats: {
        total: rows.length,
        active: rows.filter((r) => r.status === "active").length,
        closingSoon: rows.filter((r) => r.status === "closing_soon").length,
        upcoming: rows.filter((r) => r.status === "upcoming").length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listLiveGovtSchemes(req, res, next) {
  try {
    const payload = await liveSchemesCache.get("govt-schemes:live", async () => {
      const rows = await GovernmentScheme.find({
        isActive: true,
        status: { $ne: "closed" },
      })
        .sort({ createdAt: -1 })
        .lean();
      return { success: true, data: rows.map(mapScheme) };
    });
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

export async function getGovtScheme(req, res, next) {
  try {
    const row = await GovernmentScheme.findById(req.params.id).lean();
    if (!row) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }
    res.json({ success: true, data: mapScheme(row) });
  } catch (err) {
    next(err);
  }
}

export async function createGovtScheme(req, res, next) {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const row = await GovernmentScheme.create({
      title,
      shortName: String(body.shortName || "").trim(),
      description: String(body.description || "").trim(),
      category: String(body.category || "Financial Benefit").trim(),
      govtLevel: String(body.govtLevel || "Central").trim(),
      status: body.status || "active",
      subsidyAmount: String(body.subsidyAmount || "").trim(),
      maxBenefit: String(body.maxBenefit || "").trim(),
      deadline: String(body.deadline || "").trim(),
      image: String(body.image || "").trim(),
      applyUrl: String(body.applyUrl || "").trim(),
      eligibility: String(body.eligibility || "").trim(),
      documents: String(body.documents || "").trim(),
      isActive: body.isActive !== false,
    });

    liveSchemesCache.invalidate();
    safeEmit((io) => io.emit("govt_scheme_changed", { action: "create", id: row._id }));
    res.status(201).json({ success: true, data: mapScheme(row) });
  } catch (err) {
    next(err);
  }
}

export async function updateGovtScheme(req, res, next) {
  try {
    const row = await GovernmentScheme.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    const body = req.body || {};
    const fields = [
      "title",
      "shortName",
      "description",
      "category",
      "govtLevel",
      "status",
      "subsidyAmount",
      "maxBenefit",
      "deadline",
      "image",
      "applyUrl",
      "eligibility",
      "documents",
      "isActive",
    ];

    for (const key of fields) {
      if (body[key] !== undefined) {
        row[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
      }
    }

    if (!String(row.title || "").trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    await row.save();
    liveSchemesCache.invalidate();
    safeEmit((io) => io.emit("govt_scheme_changed", { action: "update", id: row._id }));
    res.json({ success: true, data: mapScheme(row) });
  } catch (err) {
    next(err);
  }
}

export async function deleteGovtScheme(req, res, next) {
  try {
    const row = await GovernmentScheme.findByIdAndDelete(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }
    liveSchemesCache.invalidate();
    safeEmit((io) => io.emit("govt_scheme_changed", { action: "delete", id: req.params.id }));
    res.json({ success: true, message: "Scheme deleted" });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// FARMER SCHEME APPLICATIONS CONTROLLERS
// -------------------------------------------------------------

export async function applyGovtScheme(req, res, next) {
  try {
    const body = req.body || {};
    const farmerId = String(body.farmerId || req.user?.id || req.user?._id || "").trim();
    const schemeId = String(body.schemeId || "").trim();

    if (!farmerId) {
      return res.status(400).json({ success: false, message: "Farmer ID is required" });
    }
    if (!schemeId) {
      return res.status(400).json({ success: false, message: "Scheme ID is required" });
    }

    const scheme = await GovernmentScheme.findById(schemeId).lean();
    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    // Check if application already exists for this farmer & scheme
    let existing = await FarmerSchemeApplication.findOne({ farmerId, schemeId });
    if (existing) {
      if (existing.status === "pending") {
        return res.json({
          success: true,
          message: "Application is already submitted and pending review",
          data: existing,
        });
      }
      if (existing.status === "accepted" || existing.status === "approved") {
        return res.json({
          success: true,
          message: "Application has already been accepted/approved",
          data: existing,
        });
      }
      // If rejected, allow re-applying
      existing.status = "pending";
      existing.notes = String(body.notes || existing.notes || "").trim();
      existing.farmerName = String(body.farmerName || existing.farmerName || "").trim();
      existing.farmerPhone = String(body.farmerPhone || existing.farmerPhone || "").trim();
      existing.farmerVillage = String(body.farmerVillage || existing.farmerVillage || "").trim();
      existing.farmerTaluka = String(body.farmerTaluka || existing.farmerTaluka || "").trim();
      existing.farmerDistrict = String(body.farmerDistrict || existing.farmerDistrict || "").trim();
      existing.landAcres = String(body.landAcres || existing.landAcres || "").trim();
      existing.adminNotes = "";
      existing.appliedAt = new Date();
      existing.reviewedAt = null;
      existing.reviewedBy = "";
      await existing.save();
      safeEmit((io) => {
        io.to(`farmer_${farmerId}`).emit("scheme_application_updated", existing);
        io.emit("govt_scheme_application_updated", existing);
      });
      return res.status(200).json({
        success: true,
        message: "Application resubmitted successfully",
        data: existing,
      });
    }

    const appDoc = await FarmerSchemeApplication.create({
      farmerId,
      farmerName: String(body.farmerName || "").trim(),
      farmerPhone: String(body.farmerPhone || "").trim(),
      farmerVillage: String(body.farmerVillage || "").trim(),
      farmerTaluka: String(body.farmerTaluka || "").trim(),
      farmerDistrict: String(body.farmerDistrict || "").trim(),
      landAcres: String(body.landAcres || "").trim(),
      schemeId: scheme._id,
      schemeTitle: scheme.title,
      schemeCategory: scheme.category,
      subsidyAmount: scheme.subsidyAmount || scheme.maxBenefit || "",
      status: "pending",
      notes: String(body.notes || "").trim(),
      appliedAt: new Date(),
    });

    safeEmit((io) => {
      io.to(`farmer_${farmerId}`).emit("scheme_application_created", appDoc);
      io.emit("govt_scheme_application_created", appDoc);
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: appDoc,
    });
  } catch (err) {
    next(err);
  }
}

export async function listMyGovtSchemeApplications(req, res, next) {
  try {
    const farmerId = String(req.query.farmerId || req.user?.id || req.user?._id || "").trim();
    if (!farmerId) {
      return res.json({ success: true, data: [] });
    }
    const apps = await FarmerSchemeApplication.find({ farmerId })
      .populate("schemeId")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: apps });
  } catch (err) {
    next(err);
  }
}

export async function listAllGovtSchemeApplications(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") {
      filter.status = String(req.query.status);
    }
    if (req.query.schemeId && req.query.schemeId !== "all") {
      filter.schemeId = req.query.schemeId;
    }
    if (req.query.search) {
      const q = String(req.query.search).trim();
      filter.$or = [
        { farmerName: { $regex: q, $options: "i" } },
        { farmerPhone: { $regex: q, $options: "i" } },
        { farmerVillage: { $regex: q, $options: "i" } },
        { schemeTitle: { $regex: q, $options: "i" } },
      ];
    }

    const apps = await FarmerSchemeApplication.find(filter)
      .populate("schemeId")
      .sort({ createdAt: -1 })
      .lean();

    const allApps = await FarmerSchemeApplication.find({}).lean();
    const stats = {
      total: allApps.length,
      pending: allApps.filter((a) => a.status === "pending").length,
      accepted: allApps.filter((a) => a.status === "accepted" || a.status === "approved").length,
      rejected: allApps.filter((a) => a.status === "rejected").length,
    };

    res.json({ success: true, data: apps, stats });
  } catch (err) {
    next(err);
  }
}

export async function updateGovtSchemeApplicationStatus(req, res, next) {
  try {
    const appDoc = await FarmerSchemeApplication.findById(req.params.id);
    if (!appDoc) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const body = req.body || {};
    const nextStatus = String(body.status || "").toLowerCase().trim();
    if (["pending", "accepted", "approved", "rejected"].includes(nextStatus)) {
      appDoc.status = nextStatus === "approved" ? "accepted" : nextStatus;
    }
    if (body.adminNotes !== undefined) {
      appDoc.adminNotes = String(body.adminNotes || "").trim();
    }
    appDoc.reviewedAt = new Date();
    appDoc.reviewedBy = String(body.reviewedBy || req.user?.name || "Admin").trim();

    await appDoc.save();

    safeEmit((io) => {
      io.to(`farmer_${appDoc.farmerId}`).emit("scheme_application_updated", appDoc);
      io.emit("govt_scheme_application_updated", appDoc);
    });
    import("../../farmer-manager-service/src/farmerPush.js")
      .then((mod) => mod.notifyFarmerSchemeUpdate(appDoc.toObject()))
      .catch((err) => console.warn("[FarmerPush] scheme push failed:", err.message));

    res.json({
      success: true,
      message: `Status updated to ${appDoc.status}`,
      data: appDoc,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteGovtSchemeApplication(req, res, next) {
  try {
    const appDoc = await FarmerSchemeApplication.findByIdAndDelete(req.params.id);
    if (!appDoc) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    safeEmit((io) => {
      io.to(`farmer_${appDoc.farmerId}`).emit("scheme_application_deleted", { id: appDoc._id });
      io.emit("govt_scheme_application_deleted", { id: appDoc._id });
    });

    res.json({ success: true, message: "Application deleted successfully" });
  } catch (err) {
    next(err);
  }
}
