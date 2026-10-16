import { B2bClient, B2bDealStage, B2bDeal } from "./models.js";
import User from "../../legacy/models/user.js";

const LEGACY_SEED_COMPANY_CODES = [
  "B2B-TAJ-001",
  "B2B-FSP-002",
  "B2B-APX-003",
  "B2B-FOI-004",
  "B2B-APO-005",
];

const LEGACY_SEED_NAMES = [
  "Taj Hospitality & Luxury Banquets Ltd",
  "FreshSprout Retail Chain Pvt Ltd",
  "Apex Tech Parks Corporate Dining Services",
  "Flavors of India Cloud Kitchens Network LLP",
  "Apollo MedHealth Nutrition & Care Foundation",
];

let legacyPurged = false;
/** Removes legacy hardcoded demo seed profiles from previous versions so real data is never mocked */
export async function purgeLegacySeedB2bClients() {
  if (legacyPurged) return;
  try {
    const res = await B2bClient.deleteMany({
      $or: [
        { companyCode: { $in: LEGACY_SEED_COMPANY_CODES } },
        { companyName: { $in: LEGACY_SEED_NAMES } },
      ],
    });
    legacyPurged = true;
    if (res?.deletedCount) {
      console.log(`[B2B] Purged ${res.deletedCount} legacy mock seeded B2B client company profiles.`);
    }
  } catch (err) {
    console.warn("[B2B] Purge legacy seed error:", err.message);
  }
}

/** Returns registered bulk users from MongoDB User collection to allow linking into B2B clients */
export async function listRegisteredBulkUsers(req, res) {
  try {
    const users = await User.find({
      $or: [
        { accountType: "bulk" },
        { gstNumber: { $exists: true, $ne: "" } },
        { shopName: { $exists: true, $ne: "" } },
      ],
    })
      .select("name email phone shopName shopAddress gstNumber accountType createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: users || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to load registered bulk users" });
  }
}

export async function listB2bClients(req, res) {
  try {
    await purgeLegacySeedB2bClients();

    const {
      search = "",
      category = "",
      status = "",
      clientType = "",
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 100,
    } = req.query;

    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (clientType && clientType !== "all") {
      filter.clientType = clientType;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [
        { companyName: regex },
        { tradeName: regex },
        { companyCode: regex },
        { gstin: regex },
        { pan: regex },
        { registrationNumber: regex },
        { "billingAddress.city": regex },
        { "representatives.name": regex },
        { "representatives.email": regex },
        { "representatives.phone": regex },
        { "representatives.designation": regex },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
    const skip = (p - 1) * l;

    const [clients, total] = await Promise.all([
      B2bClient.find(filter).sort(sortObj).skip(skip).limit(l).lean(),
      B2bClient.countDocuments(filter),
    ]);

    // Aggregate overall statistics
    const allClients = await B2bClient.find().select(
      "status category creditLimit creditUsed representatives clientType"
    ).lean();

    let totalReps = 0;
    let activeCreditVolume = 0;
    let totalCreditUsed = 0;
    let pendingVerifications = 0;
    const categoriesCount = {};

    allClients.forEach((c) => {
      totalReps += Array.isArray(c.representatives) ? c.representatives.length : 0;
      activeCreditVolume += Number(c.creditLimit || 0);
      totalCreditUsed += Number(c.creditUsed || 0);
      if (c.status === "pending_verification" || c.status === "under_review") {
        pendingVerifications++;
      }
      const cat = c.category || "Other";
      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    });

    res.json({
      success: true,
      data: clients,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
      stats: {
        totalClients: allClients.length,
        totalReps,
        activeCreditVolume,
        totalCreditUsed,
        pendingVerifications,
        categoriesCount,
      },
    });
  } catch (err) {
    console.error("[B2B] list error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to load B2B clients" });
  }
}

export async function getB2bClient(req, res) {
  try {
    const client = await B2bClient.findById(req.params.id).lean();
    if (!client) {
      return res.status(404).json({ success: false, message: "B2B client not found" });
    }
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createB2bClient(req, res) {
  try {
    const {
      companyName,
      tradeName = "",
      clientType = "client",
      category = "Hospitality & HoReCa",
      registrationNumber = "",
      gstin = "",
      pan = "",
      status = "active",
      creditLimit = 0,
      creditDays = 30,
      assignedDarkStore = "",
      darkStoreId = null,
      billingAddress = {},
      shippingAddress = {},
      contractDetails = {},
      representatives = [],
      notes = "",
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    // Auto generate code if not supplied
    const count = await B2bClient.countDocuments();
    const prefix = companyName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "B2B");
    const code = `B2B-${prefix}-${String(count + 1).padStart(3, "0")}`;

    const newClient = await B2bClient.create({
      companyCode: req.body.companyCode || code,
      companyName: companyName.trim(),
      tradeName: tradeName.trim(),
      clientType,
      category,
      registrationNumber: registrationNumber.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      status,
      creditLimit: Number(creditLimit) || 0,
      creditDays: Number(creditDays) || 30,
      creditUsed: 0,
      assignedDarkStore: assignedDarkStore ? assignedDarkStore.trim() : "",
      darkStoreId: darkStoreId || null,
      billingAddress,
      shippingAddress,
      contractDetails,
      representatives: Array.isArray(representatives) ? representatives : [],
      notes: notes.trim(),
      createdBy: req.user?.name || req.user?.email || "Admin",
    });

    res.status(201).json({
      success: true,
      message: "B2B Company profile created successfully",
      data: newClient,
    });
  } catch (err) {
    console.error("[B2B] create error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to create B2B profile" });
  }
}

export async function updateB2bClient(req, res) {
  try {
    const client = await B2bClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "B2B client not found" });
    }

    const updatable = [
      "companyName",
      "tradeName",
      "clientType",
      "category",
      "registrationNumber",
      "gstin",
      "pan",
      "status",
      "creditLimit",
      "creditDays",
      "creditUsed",
      "assignedDarkStore",
      "darkStoreId",
      "billingAddress",
      "shippingAddress",
      "contractDetails",
      "representatives",
      "notes",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });

    await client.save();
    res.json({
      success: true,
      message: "B2B Company profile updated successfully",
      data: client,
    });
  } catch (err) {
    console.error("[B2B] update error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update B2B profile" });
  }
}

export async function deleteB2bClient(req, res) {
  try {
    const client = await B2bClient.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "B2B client not found" });
    }
    res.json({ success: true, message: "B2B Company profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function addB2bRepresentative(req, res) {
  try {
    const client = await B2bClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "B2B client not found" });
    }

    const {
      name,
      email,
      phone = "",
      designation = "Procurement Lead",
      department = "Procurement",
      roleTag = "procurement_lead",
      isPrimary = false,
      portalAccess = true,
      status = "active",
      notes = "",
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Representative Name and Email are required" });
    }

    if (isPrimary) {
      client.representatives.forEach((r) => {
        r.isPrimary = false;
      });
    }

    client.representatives.push({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      designation: designation.trim(),
      department: department.trim(),
      roleTag,
      isPrimary: Boolean(isPrimary),
      portalAccess: Boolean(portalAccess),
      status,
      notes: notes.trim(),
    });

    await client.save();
    res.status(201).json({
      success: true,
      message: "Representative added successfully",
      data: client,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateB2bRepresentative(req, res) {
  try {
    const client = await B2bClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "B2B client not found" });
    }

    const rep = client.representatives.id(req.params.repId);
    if (!rep) {
      return res.status(404).json({ success: false, message: "Representative not found" });
    }

    const fields = [
      "name",
      "email",
      "phone",
      "designation",
      "department",
      "roleTag",
      "isPrimary",
      "portalAccess",
      "status",
      "notes",
    ];

    if (req.body.isPrimary) {
      client.representatives.forEach((r) => {
        if (r._id.toString() !== rep._id.toString()) {
          r.isPrimary = false;
        }
      });
    }

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        rep[f] = req.body[f];
      }
    });

    await client.save();
    res.json({
      success: true,
      message: "Representative updated successfully",
      data: client,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteB2bRepresentative(req, res) {
  try {
    const client = await B2bClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "B2B client not found" });
    }

    client.representatives = client.representatives.filter(
      (r) => r._id.toString() !== req.params.repId
    );

    await client.save();
    res.json({
      success: true,
      message: "Representative removed successfully",
      data: client,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// -------------------------------------------------------------
// B2B DEAL STAGES & DEAL PIPELINE CONTROLLERS
// -------------------------------------------------------------

const DEFAULT_DEAL_STAGES = [
  {
    name: "Lead & Qualification",
    key: "qualification",
    order: 1,
    color: "blue",
    probability: 20,
    description: "Inbound inquiry or initial business qualification",
    isDefault: true,
  },
  {
    name: "Discovery & Demand Sizing",
    key: "discovery",
    order: 2,
    color: "amber",
    probability: 40,
    description: "Assessing weekly volume indents, categories, and dark store alignment",
    isDefault: true,
  },
  {
    name: "Sampling & Quality Testing",
    key: "sampling",
    order: 3,
    color: "purple",
    probability: 60,
    description: "Produce crate trials, cold chain validation, or chef tasting audit",
    isDefault: true,
  },
  {
    name: "Proposal & Commercial Terms",
    key: "proposal",
    order: 4,
    color: "indigo",
    probability: 75,
    description: "Wholesale pricing slab, credit period, and delivery SLA shared",
    isDefault: true,
  },
  {
    name: "Contract & KYC Negotiation",
    key: "negotiation",
    order: 5,
    color: "teal",
    probability: 85,
    description: "GSTIN verification, legal MSA review, and authorized signatory signoff",
    isDefault: true,
  },
  {
    name: "Closed - Won (Active Indents)",
    key: "won",
    order: 6,
    color: "emerald",
    probability: 100,
    isWon: true,
    description: "Account onboarded, dark store routing active, daily indents rolling",
    isDefault: true,
  },
  {
    name: "Closed - Lost",
    key: "lost",
    order: 7,
    color: "rose",
    probability: 0,
    isLost: true,
    description: "Deal declined, competitor chosen, or postponed indefinitely",
    isDefault: true,
  },
];

async function ensureDefaultDealStages() {
  try {
    const count = await B2bDealStage.countDocuments();
    if (count === 0) {
      await B2bDealStage.insertMany(DEFAULT_DEAL_STAGES);
    }
  } catch (err) {
    console.warn("[B2B Deal Stages] Seed default stages warning:", err.message);
  }
}

/** Lists all customizable deal stages ordered by pipeline sequence */
export async function listDealStages(req, res) {
  try {
    await ensureDefaultDealStages();
    const stages = await B2bDealStage.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: stages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to load deal stages" });
  }
}

/** Create a new customizable deal stage */
export async function createDealStage(req, res) {
  try {
    const {
      name,
      color = "emerald",
      probability = 50,
      description = "",
      isWon = false,
      isLost = false,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Stage name is required" });
    }

    const cleanName = name.trim();
    let key = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!key) key = `stage-${Date.now().toString(36)}`;

    // Ensure uniqueness
    const exists = await B2bDealStage.findOne({ key, isActive: true });
    if (exists) {
      key = `${key}-${Date.now().toString(36).slice(-4)}`;
    }

    const maxStage = await B2bDealStage.findOne({ isActive: true }).sort({ order: -1 }).select("order").lean();
    const nextOrder = (maxStage?.order || 0) + 1;

    const newStage = await B2bDealStage.create({
      name: cleanName,
      key,
      order: req.body.order !== undefined ? Number(req.body.order) : nextOrder,
      color: color || "emerald",
      probability: Math.min(100, Math.max(0, Number(probability) || 0)),
      isWon: Boolean(isWon),
      isLost: Boolean(isLost),
      description: description.trim(),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Deal stage created successfully",
      data: newStage,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create deal stage" });
  }
}

/** Update an existing deal stage (name, color, probability, order, description) */
export async function updateDealStage(req, res) {
  try {
    const stage = await B2bDealStage.findById(req.params.id);
    if (!stage) {
      return res.status(404).json({ success: false, message: "Deal stage not found" });
    }

    const prevName = stage.name;
    const prevKey = stage.key;

    if (req.body.name !== undefined && req.body.name.trim()) {
      stage.name = req.body.name.trim();
    }
    if (req.body.color !== undefined) stage.color = req.body.color;
    if (req.body.probability !== undefined) {
      stage.probability = Math.min(100, Math.max(0, Number(req.body.probability) || 0));
    }
    if (req.body.order !== undefined) stage.order = Number(req.body.order);
    if (req.body.description !== undefined) stage.description = req.body.description.trim();
    if (req.body.isWon !== undefined) stage.isWon = Boolean(req.body.isWon);
    if (req.body.isLost !== undefined) stage.isLost = Boolean(req.body.isLost);

    await stage.save();

    // If name changed, synchronize existing deals in this stage
    if (req.body.name && req.body.name.trim() !== prevName) {
      await B2bDeal.updateMany(
        { stageKey: prevKey },
        { $set: { stageName: stage.name } }
      );
    }

    res.json({
      success: true,
      message: "Deal stage updated successfully",
      data: stage,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update deal stage" });
  }
}

/** Delete a deal stage */
export async function deleteDealStage(req, res) {
  try {
    const stage = await B2bDealStage.findById(req.params.id);
    if (!stage) {
      return res.status(404).json({ success: false, message: "Deal stage not found" });
    }

    // Check if any deals are in this stage
    const count = await B2bDeal.countDocuments({ stageKey: stage.key });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete stage "${stage.name}" because ${count} deal(s) are currently placed here. Please move these deals to another stage first.`,
      });
    }

    await B2bDealStage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deal stage deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete deal stage" });
  }
}

/** Reorder stages in bulk */
export async function reorderDealStages(req, res) {
  try {
    const { stageOrders = [] } = req.body;
    if (Array.isArray(stageOrders)) {
      await Promise.all(
        stageOrders.map((item) =>
          B2bDealStage.findByIdAndUpdate(item.id, { $set: { order: Number(item.order) } })
        )
      );
    }
    const updated = await B2bDealStage.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, message: "Stages reordered successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to reorder stages" });
  }
}

/** List all deals with filtering, search, and pipeline metrics */
export async function listDeals(req, res) {
  try {
    const {
      clientId = "",
      stageKey = "",
      status = "",
      priority = "",
      search = "",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    if (clientId && clientId !== "all") filter.clientId = clientId;
    if (stageKey && stageKey !== "all") filter.stageKey = stageKey;
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;

    if (search && search.trim()) {
      const rx = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: rx },
        { clientName: rx },
        { companyCode: rx },
        { notes: rx },
        { assignedTo: rx },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const deals = await B2bDeal.find(filter).sort({ [sort]: sortOrder }).lean();

    // Calculate pipeline statistics
    const allDeals = await B2bDeal.find().lean();
    let totalPipelineValue = 0;
    let wonDealsValue = 0;
    let wonDealsCount = 0;
    let lostDealsCount = 0;
    let openDealsCount = 0;
    const dealsByStage = {};

    allDeals.forEach((d) => {
      const val = Number(d.dealValue || 0);
      if (d.status === "won") {
        wonDealsValue += val;
        wonDealsCount++;
      } else if (d.status === "lost") {
        lostDealsCount++;
      } else {
        totalPipelineValue += val;
        openDealsCount++;
      }

      const sk = d.stageKey || "unknown";
      if (!dealsByStage[sk]) {
        dealsByStage[sk] = { count: 0, totalValue: 0, stageName: d.stageName };
      }
      dealsByStage[sk].count++;
      dealsByStage[sk].totalValue += val;
    });

    const totalResolved = wonDealsCount + lostDealsCount;
    const winRate = totalResolved > 0 ? Math.round((wonDealsCount / totalResolved) * 100) : 0;

    res.json({
      success: true,
      data: deals,
      metrics: {
        totalDeals: allDeals.length,
        openDealsCount,
        totalPipelineValue,
        wonDealsCount,
        wonDealsValue,
        lostDealsCount,
        winRate,
        dealsByStage,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to load deals" });
  }
}

/** Create a new B2B Deal */
export async function createDeal(req, res) {
  try {
    const {
      title,
      clientId,
      dealValue = 0,
      currency = "INR",
      stageKey = "qualification",
      stageId = null,
      probability = 50,
      expectedCloseDate = null,
      priority = "medium",
      assignedTo = "",
      notes = "",
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Deal title is required" });
    }
    if (!clientId) {
      return res.status(400).json({ success: false, message: "Client profile is required" });
    }

    const client = await B2bClient.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Selected B2B client profile not found" });
    }

    // Resolve stage details
    let resolvedStage = null;
    if (stageId) {
      resolvedStage = await B2bDealStage.findById(stageId).lean();
    } else if (stageKey) {
      resolvedStage = await B2bDealStage.findOne({ key: stageKey, isActive: true }).lean();
    }

    if (!resolvedStage) {
      await ensureDefaultDealStages();
      resolvedStage = await B2bDealStage.findOne({ isActive: true }).sort({ order: 1 }).lean();
    }

    const sKey = resolvedStage?.key || stageKey || "qualification";
    const sName = resolvedStage?.name || "Lead & Qualification";
    const sProb = resolvedStage?.probability !== undefined ? resolvedStage.probability : Number(probability) || 50;
    const status = resolvedStage?.isWon ? "won" : resolvedStage?.isLost ? "lost" : "open";

    const deal = await B2bDeal.create({
      title: title.trim(),
      clientId: client._id,
      clientName: client.companyName,
      companyCode: client.companyCode || "",
      dealValue: Number(dealValue) || 0,
      currency,
      stageId: resolvedStage?._id || null,
      stageKey: sKey,
      stageName: sName,
      probability: sProb,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      priority,
      status,
      assignedTo: assignedTo.trim(),
      notes: notes.trim(),
      stageHistory: [
        {
          stageKey: sKey,
          stageName: sName,
          movedAt: new Date(),
          movedBy: req.user?.name || req.user?.email || "Admin",
          notes: "Deal created",
        },
      ],
      createdBy: req.user?.name || req.user?.email || "Admin",
    });

    res.status(201).json({
      success: true,
      message: "Deal created successfully",
      data: deal,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create deal" });
  }
}

/** Update deal properties */
export async function updateDeal(req, res) {
  try {
    const deal = await B2bDeal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

    const updatable = [
      "title",
      "dealValue",
      "currency",
      "expectedCloseDate",
      "priority",
      "assignedTo",
      "notes",
      "status",
      "lostReason",
      "probability",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        deal[field] = req.body[field];
      }
    });

    // If client changed
    if (req.body.clientId && req.body.clientId !== String(deal.clientId)) {
      const client = await B2bClient.findById(req.body.clientId);
      if (client) {
        deal.clientId = client._id;
        deal.clientName = client.companyName;
        deal.companyCode = client.companyCode || "";
      }
    }

    await deal.save();
    res.json({ success: true, message: "Deal updated successfully", data: deal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update deal" });
  }
}

/** Move a deal to a new stage */
export async function moveDealStage(req, res) {
  try {
    const { stageKey, stageId, notes = "" } = req.body;
    const deal = await B2bDeal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

    let targetStage = null;
    if (stageId) {
      targetStage = await B2bDealStage.findById(stageId).lean();
    } else if (stageKey) {
      targetStage = await B2bDealStage.findOne({ key: stageKey, isActive: true }).lean();
    }

    if (!targetStage) {
      return res.status(400).json({ success: false, message: "Target deal stage not found" });
    }

    const newKey = targetStage.key;
    const newName = targetStage.name;

    deal.stageId = targetStage._id;
    deal.stageKey = newKey;
    deal.stageName = newName;
    deal.probability = targetStage.probability ?? deal.probability;

    if (targetStage.isWon) {
      deal.status = "won";
    } else if (targetStage.isLost) {
      deal.status = "lost";
      if (notes) deal.lostReason = notes;
    } else {
      deal.status = "open";
    }

    deal.stageHistory.push({
      stageKey: newKey,
      stageName: newName,
      movedAt: new Date(),
      movedBy: req.user?.name || req.user?.email || "Admin",
      notes: notes || `Moved to ${newName}`,
    });

    await deal.save();
    res.json({
      success: true,
      message: `Deal moved to "${newName}" successfully`,
      data: deal,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to move deal stage" });
  }
}

/** Delete a deal */
export async function deleteDeal(req, res) {
  try {
    const deal = await B2bDeal.findByIdAndDelete(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }
    res.json({ success: true, message: "Deal deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete deal" });
  }
}
