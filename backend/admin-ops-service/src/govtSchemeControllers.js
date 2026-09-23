import { GovernmentScheme } from "./models.js";

const STATUS_LABELS = {
  active: "Active (अर्जासाठी खुले)",
  closing_soon: "Closing Soon (अंतिम तारीख जवळ)",
  upcoming: "Upcoming (लवकरच सुरू)",
  closed: "Closed",
};

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
    const rows = await GovernmentScheme.find({
      isActive: true,
      status: { $ne: "closed" },
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: rows.map(mapScheme) });
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
    res.json({ success: true, message: "Scheme deleted" });
  } catch (err) {
    next(err);
  }
}
