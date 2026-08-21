import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  Vendor,
  Farmer,
  FarmerManager,
  FarmerProduct,
  FarmerStockHistory,
  FarmerOrder,
  FarmerEarning,
  FarmerDocument,
  FarmerHarvestOrder,
} from "./models.js";

const JWT_SECRET = process.env.JWT_SECRET || "greengroo-secret";
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

const DEFAULT_VENDOR_ID = "vendor-1";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// ----------------------------------------------------
// SEED INITIAL DATA IF DB IS EMPTY
// ----------------------------------------------------
export async function seedInitialData() {
  try {
    // Seed default Vendor
    if ((await Vendor.countDocuments()) === 0) {
      const hashedVendorPwd = await bcrypt.hash("vendor123", 10);
      await Vendor.create({
        id: "vendor-1",
        vendorCode: "VND-1001",
        vendorName: "ABC Agro",
        ownerName: "Vijay Sharma",
        mobile: "9900000001",
        email: "vendor@abcagro.com",
        businessName: "ABC Agro Pvt Ltd",
        businessAddress: "Plot 12, MIDC Industrial Area",
        city: "Nashik",
        state: "Maharashtra",
        pincode: "422001",
        gstNumber: "27AAAAA0000A1Z5",
        panNumber: "AAAAA0000A",
        status: "Active",
        password: hashedVendorPwd,
        role: "VENDOR",
      }).catch(() => {});
    }

    const managers = [
      {
        id: "mgr-1",
        vendorId: DEFAULT_VENDOR_ID,
        name: "Rahul Patil",
        mobile: "9876501234",
        email: "rahul.manager@greengroo.com",
        address: "12 Market Road",
        city: "Nashik",
        state: "Maharashtra",
        pincode: "422001",
        location: "Nashik, Maharashtra",
        status: "Active",
        authType: "password",
        password: "manager123",
      },
      {
        id: "mgr-2",
        vendorId: DEFAULT_VENDOR_ID,
        name: "Sneha Deshmukh",
        mobile: "9876505678",
        email: "sneha.manager@greengroo.com",
        address: "45 Farm Lane",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        location: "Pune, Maharashtra",
        status: "Active",
        authType: "otp",
        password: "",
      },
    ];

    if ((await FarmerManager.countDocuments()) === 0) {
      const hashedMgrPwd = await bcrypt.hash("manager123", 10);
      const managersWithHash = managers.map((m) => ({ ...m, password: hashedMgrPwd }));
      await FarmerManager.insertMany(managersWithHash).catch(() => {});
    }

    const defaultHashedPassword = await bcrypt.hash("123456", 10);

    const farmers = [
      {
        id: "farmer-1",
        farmerCode: "FRM-1001",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        name: "Ramesh Patil",
        mobile: "9876543210",
        email: "ramesh.farmer@greengroo.com",
        password: defaultHashedPassword,
        loginEnabled: true,
        farmName: "Patil Organic Farm",
        farmLocation: "Nashik, Maharashtra",
        farmAddress: "Survey No. 42, Sinnar Road, Nashik - 422103",
        farmArea: "8 acres",
        farmType: "Organic",
        address: {
          village: "Sinnar",
          taluka: "Sinnar",
          district: "Nashik",
          state: "Maharashtra",
          pincode: "422103",
        },
        status: "Active",
        verificationStatus: "Approved",
        bank: {
          accountHolder: "Ramesh Patil",
          bankName: "State Bank of India",
          accountNumber: "XXXXXXXX4521",
          ifsc: "SBIN0001234",
        },
      },
      {
        id: "farmer-2",
        farmerCode: "FRM-1002",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        name: "Suresh Jadhav",
        mobile: "9876543211",
        email: "suresh.farmer@greengroo.com",
        password: defaultHashedPassword,
        loginEnabled: true,
        farmName: "Jadhav Fresh Farm",
        farmLocation: "Sinnar, Maharashtra",
        farmAddress: "Gut No. 18, Sinnar",
        farmArea: "5 acres",
        farmType: "Mixed",
        address: {
          village: "Sinnar",
          taluka: "Sinnar",
          district: "Nashik",
          state: "Maharashtra",
          pincode: "422103",
        },
        status: "Active",
        verificationStatus: "Approved",
        bank: {
          accountHolder: "Suresh Jadhav",
          bankName: "HDFC Bank",
          accountNumber: "XXXXXXXX7788",
          ifsc: "HDFC0001234",
        },
      },
      {
        id: "farmer-3",
        farmerCode: "FRM-1003",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-2",
        name: "Mahesh Shinde",
        mobile: "9876543212",
        email: "mahesh.farmer@greengroo.com",
        password: defaultHashedPassword,
        loginEnabled: true,
        farmName: "Shinde Agro",
        farmLocation: "Niphad, Maharashtra",
        farmAddress: "Village Niphad",
        farmArea: "12 acres",
        farmType: "Conventional",
        address: {
          village: "Niphad",
          taluka: "Niphad",
          district: "Nashik",
          state: "Maharashtra",
          pincode: "422303",
        },
        status: "Pending",
        verificationStatus: "Pending",
        bank: {
          accountHolder: "Mahesh Shinde",
          bankName: "Bank of Maharashtra",
          accountNumber: "XXXXXXXX9900",
          ifsc: "MAHB0001234",
        },
      },
    ];

    if ((await Farmer.countDocuments()) === 0) {
      await Farmer.insertMany(farmers).catch(() => {});
    }

    const products = [
      {
        id: "fp-1",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-1",
        sku: "FRM-1001-TOM",
        name: "Fresh Red Tomatoes",
        category: "Vegetables",
        subCategory: "Fresh Produce",
        description: "Farm-fresh organic red tomatoes harvested daily.",
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",
        images: ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80"],
        unit: "Kg",
        harvestDate: "2026-07-25",
        produceType: "organic",
        farmLocation: "Nashik, Maharashtra",
        status: "Approved",
        sellingPrice: 35,
        mrp: 45,
        lowStockLimit: 20,
        stock: 350,
        availableQuantity: 350,
        gradeAQty: 200,
        gradeBQty: 150,
        grades: [
          { id: "g-a", label: "Grade A", quantity: 200 },
          { id: "g-b", label: "Grade B", quantity: 150 },
        ],
      },
      {
        id: "fp-2",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-1",
        sku: "FRM-1001-ONN",
        name: "Nashik Red Onions",
        category: "Vegetables",
        subCategory: "Fresh Produce",
        description: "Premium quality Nashik red onions with long shelf life.",
        image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80",
        images: ["https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80"],
        unit: "Kg",
        harvestDate: "2026-07-20",
        produceType: "conventional",
        farmLocation: "Nashik, Maharashtra",
        status: "Approved",
        sellingPrice: 28,
        mrp: 35,
        lowStockLimit: 50,
        stock: 800,
        availableQuantity: 800,
        gradeAQty: 500,
        gradeBQty: 300,
        grades: [
          { id: "g-a", label: "Grade A", quantity: 500 },
          { id: "g-b", label: "Grade B", quantity: 300 },
        ],
      },
      {
        id: "fp-3",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-2",
        sku: "FRM-1002-POT",
        name: "Fresh Potatoes",
        category: "Vegetables",
        subCategory: "Fresh Produce",
        description: "High quality fresh potatoes suitable for all cooking.",
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80",
        images: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80"],
        unit: "Kg",
        harvestDate: "2026-07-22",
        produceType: "organic",
        farmLocation: "Sinnar, Maharashtra",
        status: "Approved",
        sellingPrice: 22,
        mrp: 30,
        lowStockLimit: 30,
        stock: 450,
        availableQuantity: 450,
        gradeAQty: 300,
        gradeBQty: 150,
        grades: [
          { id: "g-a", label: "Grade A", quantity: 300 },
          { id: "g-b", label: "Grade B", quantity: 150 },
        ],
      },
    ];

    if ((await FarmerProduct.countDocuments()) === 0) {
      await FarmerProduct.insertMany(products).catch(() => {});
    }

    const stockHistory = [
      {
        id: "sh-1",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-1",
        productId: "fp-1",
        productName: "Fresh Red Tomatoes",
        grade: "Grade A",
        action: "Stock Added",
        previousStock: 0,
        changedQuantity: 200,
        newStock: 200,
        reason: "Initial Harvest",
        updatedBy: "Farmer",
        reference: "HARV-001",
        at: new Date("2026-07-25T08:00:00.000Z"),
      },
      {
        id: "sh-2",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-1",
        productId: "fp-1",
        productName: "Fresh Red Tomatoes",
        grade: "Grade B",
        action: "Stock Added",
        previousStock: 0,
        changedQuantity: 150,
        newStock: 150,
        reason: "Initial Harvest",
        updatedBy: "Farmer",
        reference: "HARV-001",
        at: new Date("2026-07-25T08:05:00.000Z"),
      },
    ];

    if ((await FarmerStockHistory.countDocuments()) === 0) {
      await FarmerStockHistory.insertMany(stockHistory).catch(() => {});
    }

    const orders = [
      {
        id: "fo-101",
        orderId: "FO-1001",
        vendorId: DEFAULT_VENDOR_ID,
        farmerId: "farmer-1",
        customer: { name: "GreenGroo Central Hub", phone: "9876543000", address: "Andheri Hub, Mumbai" },
        products: [
          { id: "fp-1", name: "Fresh Red Tomatoes", grade: "Grade A", quantity: 50, unit: "Kg", price: 35, total: 1750 },
        ],
        totalQuantity: 50,
        totalAmount: 1750,
        amount: 1750,
        status: "Confirmed",
        deliveryStatus: "Pending",
        paymentStatus: "Paid",
        orderDate: new Date("2026-07-26T10:00:00.000Z"),
        timeline: [
          { status: "New", at: new Date("2026-07-26T10:00:00.000Z"), note: "Order placed" },
          { status: "Confirmed", at: new Date("2026-07-26T10:30:00.000Z"), note: "Order confirmed" },
        ],
      },
      {
        id: "fo-102",
        orderId: "FO-1002",
        vendorId: DEFAULT_VENDOR_ID,
        farmerId: "farmer-1",
        customer: { name: "Reliance Smart", phone: "9876543001", address: "Thane Distribution Depot" },
        products: [
          { id: "fp-2", name: "Nashik Red Onions", grade: "Grade A", quantity: 200, unit: "Kg", price: 28, total: 5600 },
        ],
        totalQuantity: 200,
        totalAmount: 5600,
        amount: 5600,
        status: "Completed",
        deliveryStatus: "Delivered",
        paymentStatus: "Paid",
        orderDate: new Date("2026-07-24T09:00:00.000Z"),
        timeline: [
          { status: "New", at: new Date("2026-07-24T09:00:00.000Z"), note: "Order placed" },
          { status: "Completed", at: new Date("2026-07-24T16:00:00.000Z"), note: "Delivered & payment settled" },
        ],
      },
    ];

    if ((await FarmerOrder.countDocuments()) === 0) {
      await FarmerOrder.insertMany(orders).catch(() => {});
    }

    const earnings = [
      {
        id: "earn-1",
        vendorId: DEFAULT_VENDOR_ID,
        farmerId: "farmer-1",
        orderId: "fo-102",
        date: "2026-07-24",
        cropName: "Nashik Red Onions",
        quantity: 200,
        ratePerKg: 28,
        grossEarnings: 5600,
        deductions: 200,
        netEarnings: 5400,
        status: "Paid",
      },
      {
        id: "earn-2",
        vendorId: DEFAULT_VENDOR_ID,
        farmerId: "farmer-1",
        orderId: "fo-101",
        date: "2026-07-26",
        cropName: "Fresh Red Tomatoes",
        quantity: 50,
        ratePerKg: 35,
        grossEarnings: 1750,
        deductions: 50,
        netEarnings: 1700,
        status: "Pending",
      },
    ];

    if ((await FarmerEarning.countDocuments()) === 0) {
      await FarmerEarning.insertMany(earnings).catch(() => {});
    }

    const documents = [
      {
        id: "doc-farmer-1-aadhaar",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-1",
        name: "Aadhaar / ID Proof",
        type: "aadhaar",
        fileName: "aadhaar_ramesh_patil.pdf",
        fileUrl: "https://example.com/docs/aadhaar.pdf",
        uploadedAt: new Date("2026-07-02T10:00:00.000Z"),
        status: "Approved",
      },
      {
        id: "doc-farmer-1-pan",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-1",
        name: "PAN",
        type: "pan",
        fileName: "pan_ramesh_patil.pdf",
        fileUrl: "https://example.com/docs/pan.pdf",
        uploadedAt: new Date("2026-07-02T10:05:00.000Z"),
        status: "Approved",
      },
      {
        id: "doc-farmer-1-bank",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-1",
        name: "Bank Details",
        type: "bank",
        fileName: "passbook_ramesh.pdf",
        fileUrl: "https://example.com/docs/passbook.pdf",
        uploadedAt: new Date("2026-07-02T10:10:00.000Z"),
        status: "Approved",
      },
      {
        id: "doc-farmer-1-address",
        vendorId: DEFAULT_VENDOR_ID,
        managerId: "mgr-1",
        farmerId: "farmer-1",
        name: "Address Proof",
        type: "address",
        fileName: "7_12_extract.pdf",
        fileUrl: "https://example.com/docs/7_12.pdf",
        uploadedAt: new Date("2026-07-02T10:15:00.000Z"),
        status: "Approved",
      },
    ];

    if ((await FarmerDocument.countDocuments()) === 0) {
      await FarmerDocument.insertMany(documents).catch(() => {});
    }

    console.log("Farmer Manager database seeded successfully!");
  } catch (err) {
    console.error("Failed to seed initial Farmer Manager data:", err);
  }
}

// Helper to enrich a single farmer object with calculated stats
async function enrichFarmerDoc(farmerDoc) {
  const f = farmerDoc.toObject ? farmerDoc.toObject() : { ...farmerDoc };
  const farmerId = f.id;

  const [manager, products, ordersCount, earningsList] = await Promise.all([
    f.managerId ? FarmerManager.findOne({ id: f.managerId }).select("name").lean() : null,
    FarmerProduct.find({ farmerId }).select("stock grades").lean(),
    FarmerOrder.countDocuments({ farmerId }),
    FarmerEarning.find({ farmerId }).select("netEarnings").lean(),
  ]);

  const totalProducts = products.length;
  const totalStock = products.reduce(
    (sum, p) => sum + (p.grades?.reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0)),
    0
  );
  const totalEarnings = earningsList.reduce((sum, e) => sum + Number(e.netEarnings || 0), 0);

  delete f.password;

  return {
    ...f,
    loginEnabled: f.loginEnabled !== false,
    managerName: manager?.name || "—",
    initials: initials(f.name),
    totalProducts,
    totalStock,
    totalInventory: totalStock,
    totalOrders: ordersCount,
    totalEarnings,
  };
}

// Batch helper to enrich multiple farmers in 4 consolidated DB queries instead of 4N queries
async function enrichFarmerDocsBatch(farmerDocs) {
  if (!farmerDocs || !farmerDocs.length) return [];

  const rawFarmers = farmerDocs.map((doc) => (doc.toObject ? doc.toObject() : { ...doc }));
  const farmerIds = rawFarmers.map((f) => f.id).filter(Boolean);
  const managerIds = Array.from(new Set(rawFarmers.map((f) => f.managerId).filter(Boolean)));

  const [managers, products, orders, earnings] = await Promise.all([
    managerIds.length ? FarmerManager.find({ id: { $in: managerIds } }).select("id name").lean() : [],
    FarmerProduct.find({ farmerId: { $in: farmerIds } }).select("farmerId stock grades").lean(),
    FarmerOrder.find({ farmerId: { $in: farmerIds } }).select("farmerId").lean(),
    FarmerEarning.find({ farmerId: { $in: farmerIds } }).select("farmerId netEarnings").lean(),
  ]);

  const managerMap = new Map();
  managers.forEach((m) => managerMap.set(m.id, m.name));

  const productStats = new Map();
  products.forEach((p) => {
    const cur = productStats.get(p.farmerId) || { count: 0, stock: 0 };
    cur.count += 1;
    cur.stock += (p.grades?.reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0));
    productStats.set(p.farmerId, cur);
  });

  const orderStats = new Map();
  orders.forEach((o) => {
    orderStats.set(o.farmerId, (orderStats.get(o.farmerId) || 0) + 1);
  });

  const earningStats = new Map();
  earnings.forEach((e) => {
    earningStats.set(e.farmerId, (earningStats.get(e.farmerId) || 0) + Number(e.netEarnings || 0));
  });

  return rawFarmers.map((f) => {
    delete f.password;
    const pStat = productStats.get(f.id) || { count: 0, stock: 0 };
    return {
      ...f,
      loginEnabled: f.loginEnabled !== false,
      managerName: managerMap.get(f.managerId) || "—",
      initials: initials(f.name),
      totalProducts: pStat.count,
      totalStock: pStat.stock,
      totalInventory: pStat.stock,
      totalOrders: orderStats.get(f.id) || 0,
      totalEarnings: earningStats.get(f.id) || 0,
    };
  });
}

// ----------------------------------------------------
// FARMER CONTROLLERS
// ----------------------------------------------------
export async function getFarmers(req, res) {
  try {
    const { q = "", status = "", managerId = "", location = "", vendorId = DEFAULT_VENDOR_ID } = req.query;

    const query = { vendorId };
    if (status) query.status = status;
    if (managerId) query.managerId = managerId;
    if (location) query.farmLocation = { $regex: location, $options: "i" };

    let farmerDocs = await Farmer.find(query).sort({ createdAt: -1 }).lean();

    let enriched = await enrichFarmerDocsBatch(farmerDocs);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      enriched = enriched.filter(
        (f) =>
          f.name.toLowerCase().includes(needle) ||
          f.managerName.toLowerCase().includes(needle) ||
          f.mobile.includes(needle) ||
          f.farmName.toLowerCase().includes(needle) ||
          (f.farmerCode && f.farmerCode.toLowerCase().includes(needle))
      );
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch farmers" });
  }
}

export async function getFarmerById(req, res) {
  try {
    const { farmerId } = req.params;
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }
    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch farmer" });
  }
}

export async function createFarmer(req, res) {
  try {
    const payload = req.body;
    const vendorId = req.user?.vendorId || payload.vendorId || DEFAULT_VENDOR_ID;
    const managerId =
      req.user?.role === "FARMER_MANAGER"
        ? req.user.managerId
        : payload.managerId || "";

    if (!payload.name || !payload.mobile) {
      return res.status(400).json({ success: false, message: "Farmer name and mobile are required" });
    }

    const cleanMobile = String(payload.mobile).trim();
    const existing = await Farmer.findOne({ mobile: cleanMobile });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Farmer with this mobile number already exists.",
      });
    }

    const rawPassword = payload.password || "123456";
    if (String(rawPassword).length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters long" });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const id = `farmer-${Date.now()}`;
    const farmerCode = `FRM-${Math.floor(1000 + Math.random() * 9000)}`;

    const farmer = new Farmer({
      id,
      farmerCode,
      vendorId,
      managerId,
      name: payload.name.trim(),
      mobile: cleanMobile,
      email: payload.email || "",
      password: hashedPassword,
      loginEnabled: payload.loginEnabled !== false,
      profileImage: payload.profileImage || "",
      farmName: payload.farmName || "",
      farmLocation: payload.farmLocation || "",
      farmAddress: payload.farmAddress || "",
      farmArea: payload.farmArea || "",
      farmType: payload.farmType || "Organic",
      address: payload.address || {},
      status: payload.status || "Active",
      verificationStatus: payload.verificationStatus || "Approved",
      verificationRequired: false,
      bank: {
        accountHolder: payload.bank?.accountHolder || payload.name,
        bankName: payload.bank?.bankName || "",
        accountNumber: payload.bank?.accountNumber || "",
        ifsc: payload.bank?.ifsc || "",
      },
    });

    await farmer.save();

    // Create default document shells
    const defaultDocTypes = [
      { type: "aadhaar", name: "Aadhaar / ID Proof" },
      { type: "pan", name: "PAN" },
      { type: "address", name: "Address Proof" },
      { type: "bank", name: "Bank Details" },
      { type: "other", name: "Other Documents" },
    ];

    const docsToCreate = defaultDocTypes.map((d) => ({
      id: `doc-${farmer.id}-${d.type}`,
      vendorId,
      managerId: farmer.managerId,
      farmerId: farmer.id,
      name: d.name,
      type: d.type,
      fileName: payload.documents?.[d.type] || "",
      uploadedAt: payload.documents?.[d.type] ? new Date() : null,
      status: payload.documents?.[d.type] ? "Pending" : "Not Uploaded",
    }));

    await FarmerDocument.insertMany(docsToCreate);

    const enriched = await enrichFarmerDoc(farmer);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create farmer" });
  }
}

export async function updateFarmer(req, res) {
  try {
    const { farmerId } = req.params;
    const payload = req.body;

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    if (payload.name) farmer.name = payload.name;
    if (payload.mobile) farmer.mobile = payload.mobile;
    if (payload.email !== undefined) farmer.email = payload.email;
    if (payload.farmName !== undefined) farmer.farmName = payload.farmName;
    if (payload.farmLocation !== undefined) farmer.farmLocation = payload.farmLocation;
    if (payload.farmAddress !== undefined) farmer.farmAddress = payload.farmAddress;
    if (payload.farmArea !== undefined) farmer.farmArea = payload.farmArea;
    if (payload.farmType !== undefined) farmer.farmType = payload.farmType;
    if (payload.status) farmer.status = payload.status;
    if (payload.verificationStatus) farmer.verificationStatus = payload.verificationStatus;
    if (payload.managerId !== undefined) farmer.managerId = payload.managerId;
    if (payload.profileImage !== undefined) farmer.profileImage = payload.profileImage;

    if (payload.address) {
      farmer.address = { ...farmer.address, ...payload.address };
    }
    if (payload.bank) {
      farmer.bank = { ...farmer.bank, ...payload.bank };
    }

    await farmer.save();

    if (payload.managerId !== undefined) {
      await FarmerProduct.updateMany({ farmerId }, { managerId: payload.managerId });
      await FarmerDocument.updateMany({ farmerId }, { managerId: payload.managerId });
    }

    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update farmer" });
  }
}

export async function deleteFarmer(req, res) {
  try {
    const { farmerId } = req.params;
    await Farmer.deleteOne({ id: farmerId });
    await FarmerProduct.deleteMany({ farmerId });
    await FarmerOrder.deleteMany({ farmerId });
    await FarmerEarning.deleteMany({ farmerId });
    await FarmerDocument.deleteMany({ farmerId });
    await FarmerStockHistory.deleteMany({ farmerId });
    res.json({ success: true, message: "Farmer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete farmer" });
  }
}

export async function setFarmerStatus(req, res) {
  try {
    const { farmerId } = req.params;
    const { status } = req.body;
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    farmer.status = status;
    await farmer.save();
    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update status" });
  }
}

export async function farmerLogin(req, res) {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: "Mobile number and password are required" });
    }

    const cleanMobile = String(mobile).trim();
    const farmer = await Farmer.findOne({ mobile: cleanMobile });
    if (!farmer) {
      return res.status(401).json({ success: false, message: "Invalid mobile number or password" });
    }

    if (farmer.loginEnabled === false) {
      return res.status(403).json({
        success: false,
        message: "Farmer login is currently disabled. Please contact your manager.",
      });
    }

    if (farmer.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Farmer account is currently ${farmer.status.toLowerCase()}. Please contact your manager.`,
      });
    }

    let isMatch = false;
    if (farmer.password && (farmer.password.startsWith("$2a$") || farmer.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, farmer.password);
    } else {
      isMatch = farmer.password === password;
      if (isMatch) {
        farmer.password = await bcrypt.hash(password, 10);
        await farmer.save();
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid mobile number or password" });
    }

    const token = signToken({
      id: farmer.id,
      farmerId: farmer.id,
      vendorId: farmer.vendorId,
      managerId: farmer.managerId || "",
      role: "FARMER",
      name: farmer.name,
    });

    const enriched = await enrichFarmerDoc(farmer);

    res.json({
      success: true,
      message: "Login successful",
      token,
      farmer: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Login failed" });
  }
}

export async function updateFarmerPassword(req, res) {
  try {
    const { farmerId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters long" });
    }
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found" });

    farmer.password = await bcrypt.hash(newPassword, 10);
    await farmer.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update password" });
  }
}

export async function updateFarmerLoginStatus(req, res) {
  try {
    const { farmerId } = req.params;
    const { loginEnabled } = req.body;

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found" });

    farmer.loginEnabled = Boolean(loginEnabled);
    await farmer.save();

    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update login status" });
  }
}

export async function getFarmerDashboard(req, res) {
  try {
    const { farmerId } = req.params;
    const [products, orders, earningsList] = await Promise.all([
      FarmerProduct.find({ farmerId }).lean(),
      FarmerOrder.find({ farmerId }).sort({ orderDate: -1 }).lean(),
      FarmerEarning.find({ farmerId }).lean(),
    ]);

    const totalProducts = products.length;
    const availableStock = products.reduce(
      (sum, p) => sum + (p.grades?.reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0)),
      0
    );
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => ["New", "Confirmed", "Processing"].includes(o.status)).length;
    const completedOrders = orders.filter((o) => o.status === "Completed").length;
    const totalEarnings = earningsList.reduce((sum, e) => sum + Number(e.netEarnings || 0), 0);
    const pendingEarnings = earningsList
      .filter((e) => e.status === "Pending")
      .reduce((sum, e) => sum + Number(e.netEarnings || 0), 0);

    res.json({
      totalProducts,
      availableStock,
      totalInventory: availableStock,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalEarnings,
      pendingEarnings,
      recentOrders: orders.slice(0, 5),
      lowStockProducts: products.filter((p) => (p.stock || 0) <= (p.lowStockLimit || 10)),
      recentEarnings: earningsList.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch dashboard" });
  }
}

// ----------------------------------------------------
// PRODUCT CONTROLLERS
// ----------------------------------------------------
export async function getFarmerProducts(req, res) {
  try {
    const { farmerId } = req.params;
    const products = await FarmerProduct.find({ farmerId }).sort({ createdAt: -1 }).lean();
    const enriched = products.map((p) => {
      const totalQty = p.grades?.reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0);
      const gradesSummary = p.grades?.map((g) => `${g.label} - ${g.quantity} ${p.unit || "Kg"}`).join(", ") || "";
      return {
        ...p,
        totalQuantity: totalQty,
        stock: totalQty,
        availableQuantity: totalQty,
        gradesSummary,
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch products" });
  }
}

export async function getFarmerProductById(req, res) {
  try {
    const { farmerId, productId } = req.params;
    const product = await FarmerProduct.findOne({ id: productId, farmerId });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch product" });
  }
}

export async function createFarmerProduct(req, res) {
  try {
    const { farmerId } = req.params;
    const payload = req.body;
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const grades = (payload.grades || []).map((g, idx) => ({
      id: g.id || `g-${String.fromCharCode(97 + idx)}`,
      label: g.label || `Grade ${String.fromCharCode(65 + idx)}`,
      quantity: Number(g.quantity) || 0,
    }));

    if (!grades.length) {
      grades.push(
        { id: "g-a", label: "Grade A", quantity: Number(payload.gradeAQty) || 0 },
        { id: "g-b", label: "Grade B", quantity: Number(payload.gradeBQty) || 0 }
      );
    }

    const totalStock = grades.reduce((s, g) => s + Number(g.quantity || 0), 0);

    const product = new FarmerProduct({
      id: `fp-${Date.now()}`,
      vendorId: farmer.vendorId,
      managerId: farmer.managerId,
      farmerId,
      sku: payload.sku || `FRM-${farmerId.slice(-4)}-${Date.now().toString().slice(-4)}`,
      name: payload.name,
      category: payload.category || "Vegetables",
      subCategory: payload.subCategory || "Fresh Produce",
      description: payload.description || "",
      image: payload.image || payload.imageUrl || "",
      images: payload.images?.length ? payload.images : [payload.image || payload.imageUrl || ""],
      unit: payload.unit || "Kg",
      harvestDate: payload.harvestDate || new Date().toISOString().split("T")[0],
      produceType: payload.produceType || "organic",
      farmLocation: payload.farmLocation || farmer.farmLocation || "",
      status: payload.status || "Approved",
      sellingPrice: Number(payload.sellingPrice) || 0,
      mrp: Number(payload.mrp) || 0,
      lowStockLimit: Number(payload.lowStockLimit) || 10,
      stock: totalStock,
      availableQuantity: totalStock,
      gradeAQty: Number(grades[0]?.quantity) || 0,
      gradeBQty: Number(grades[1]?.quantity) || 0,
      grades,
    });

    await product.save();

    // Log stock history for created product
    for (const g of grades) {
      if (g.quantity > 0) {
        await FarmerStockHistory.create({
          id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          vendorId: farmer.vendorId,
          managerId: farmer.managerId,
          farmerId,
          productId: product.id,
          productName: product.name,
          grade: g.label,
          action: "Stock Added",
          previousStock: 0,
          changedQuantity: g.quantity,
          newStock: g.quantity,
          reason: "Initial Harvest",
          updatedBy: "Farmer",
          reference: "HARV-NEW",
        });
      }
    }

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create product" });
  }
}

export async function updateFarmerProduct(req, res) {
  try {
    const { farmerId, productId } = req.params;
    const payload = req.body;

    const product = await FarmerProduct.findOne({ id: productId, farmerId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (payload.name) product.name = payload.name;
    if (payload.category) product.category = payload.category;
    if (payload.subCategory) product.subCategory = payload.subCategory;
    if (payload.description !== undefined) product.description = payload.description;
    if (payload.image !== undefined) product.image = payload.image;
    if (payload.images) product.images = payload.images;
    if (payload.unit) product.unit = payload.unit;
    if (payload.sellingPrice !== undefined) product.sellingPrice = Number(payload.sellingPrice);
    if (payload.mrp !== undefined) product.mrp = Number(payload.mrp);
    if (payload.lowStockLimit !== undefined) product.lowStockLimit = Number(payload.lowStockLimit);
    if (payload.status) product.status = payload.status;

    if (payload.grades) {
      const prevGrades = product.grades || [];
      const nextGrades = payload.grades.map((g, idx) => ({
        id: g.id || prevGrades[idx]?.id || `g-${String.fromCharCode(97 + idx)}`,
        label: g.label || prevGrades[idx]?.label || `Grade ${String.fromCharCode(65 + idx)}`,
        quantity: Number(g.quantity) || 0,
      }));

      // Check differences for history
      for (let i = 0; i < nextGrades.length; i++) {
        const prevQty = Number(prevGrades[i]?.quantity) || 0;
        const nextQty = Number(nextGrades[i]?.quantity) || 0;
        if (prevQty !== nextQty) {
          const diff = nextQty - prevQty;
          await FarmerStockHistory.create({
            id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            vendorId: product.vendorId,
            managerId: product.managerId,
            farmerId,
            productId: product.id,
            productName: product.name,
            grade: nextGrades[i].label,
            action: diff > 0 ? "Stock Added" : "Stock Reduced",
            previousStock: prevQty,
            changedQuantity: diff,
            newStock: nextQty,
            reason: "Manual Update",
            updatedBy: "Farmer",
            reference: "EDIT",
          });
        }
      }

      product.grades = nextGrades;
      const totalStock = nextGrades.reduce((s, g) => s + Number(g.quantity || 0), 0);
      product.stock = totalStock;
      product.availableQuantity = totalStock;
      product.gradeAQty = Number(nextGrades[0]?.quantity) || 0;
      product.gradeBQty = Number(nextGrades[1]?.quantity) || 0;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update product" });
  }
}

export async function deleteFarmerProduct(req, res) {
  try {
    const { farmerId, productId } = req.params;
    await FarmerProduct.deleteOne({ id: productId, farmerId });
    await FarmerStockHistory.deleteMany({ productId });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete product" });
  }
}

// ----------------------------------------------------
// INVENTORY & STOCK CONTROLLERS
// ----------------------------------------------------
export async function getFarmerInventory(req, res) {
  try {
    const { farmerId } = req.params;
    const products = await FarmerProduct.find({ farmerId }).lean();
    const inventoryList = [];

    products.forEach((p) => {
      const grades = p.grades && p.grades.length ? p.grades : [{ id: "g-a", label: "Grade A", quantity: p.stock || 0 }];
      grades.forEach((g) => {
        const qty = Number(g.quantity || 0);
        const reserved = Math.round(qty * 0.1);
        const sold = Math.round(qty * 0.3);
        inventoryList.push({
          id: `inv-${p.id}-${g.id}`,
          vendorId: p.vendorId,
          managerId: p.managerId,
          farmerId: p.farmerId,
          productId: p.id,
          productName: p.name,
          gradeId: g.id,
          grade: g.label,
          unit: p.unit || "Kg",
          currentStock: qty,
          reservedStock: reserved,
          soldStock: sold,
          totalStock: qty + reserved + sold,
          status: qty <= 0 ? "Out of Stock" : qty < (p.lowStockLimit || 20) ? "Low Stock" : "In Stock",
          lastUpdated: p.updatedAt,
        });
      });
    });

    res.json(inventoryList);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch inventory" });
  }
}

export async function adjustFarmerStock(req, res) {
  try {
    const { farmerId } = req.params;
    const { productId, gradeId, change, grade, updatedBy = "Vendor", reason = "Manual Update", reference = "—" } = req.body;

    const product = await FarmerProduct.findOne({ id: productId, farmerId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const delta = Number(change) || 0;
    if (!delta) return res.status(400).json({ message: "Enter a valid non-zero quantity to adjust" });

    let grades = product.grades && product.grades.length ? [...product.grades] : [
      { id: "g-a", label: "Grade A", quantity: product.gradeAQty || 0 },
      { id: "g-b", label: "Grade B", quantity: product.gradeBQty || 0 },
    ];

    let gIdx = grades.findIndex((g) => g.id === gradeId || g.label === gradeId || g.label === grade);
    if (gIdx < 0) {
      const targetLabel = grade || "Grade A";
      grades.push({ id: `g-${Date.now()}`, label: targetLabel, quantity: 0 });
      gIdx = grades.length - 1;
    }

    const prevStock = Number(grades[gIdx].quantity) || 0;
    const nextStock = Math.max(0, prevStock + delta);
    const appliedChange = nextStock - prevStock;

    if (appliedChange === 0 && delta < 0) {
      return res.status(400).json({ message: "Not enough available stock to remove" });
    }

    grades[gIdx].quantity = nextStock;
    product.grades = grades;

    const totalStock = grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
    product.stock = totalStock;
    product.availableQuantity = totalStock;
    product.gradeAQty = Number(grades[0]?.quantity) || 0;
    product.gradeBQty = Number(grades[1]?.quantity) || 0;
    if (totalStock <= 0) product.status = "Out of Stock";

    await product.save();

    const historyEntry = new FarmerStockHistory({
      id: `sh-${Date.now()}`,
      vendorId: product.vendorId,
      managerId: product.managerId,
      farmerId,
      productId,
      productName: product.name,
      grade: grades[gIdx].label,
      action: appliedChange >= 0 ? "Stock Added" : "Stock Reduced",
      previousStock: prevStock,
      changedQuantity: appliedChange,
      newStock: nextStock,
      reason,
      updatedBy,
      reference,
      at: new Date(),
    });

    await historyEntry.save();

    res.json({ product, history: historyEntry });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to adjust stock" });
  }
}

export async function getStockHistory(req, res) {
  try {
    const { farmerId } = req.params;
    const { productId } = req.query;

    const query = { farmerId };
    if (productId) query.productId = productId;

    const history = await FarmerStockHistory.find(query).sort({ at: -1 }).lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch stock history" });
  }
}

export async function updateFarmerInventoryItem(req, res) {
  try {
    const { farmerId, inventoryId } = req.params;
    const { currentStock, reservedStock, soldStock, gradeId, productId } = req.body;

    if (productId) {
      const product = await FarmerProduct.findOne({ id: productId, farmerId });
      if (product && currentStock !== undefined) {
        const gIdx = product.grades.findIndex((g) => g.id === gradeId);
        if (gIdx >= 0) {
          product.grades[gIdx].quantity = Number(currentStock);
          const total = product.grades.reduce((s, g) => s + Number(g.quantity || 0), 0);
          product.stock = total;
          product.availableQuantity = total;
          await product.save();
        }
      }
    }

    res.json({ success: true, id: inventoryId, currentStock, reservedStock, soldStock });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update inventory item" });
  }
}

// ----------------------------------------------------
// ORDER CONTROLLERS
// ----------------------------------------------------
export async function getFarmerOrders(req, res) {
  try {
    const { farmerId } = req.params;
    const { status, q } = req.query;
    const query = { farmerId };
    if (status) query.status = status;

    let orders = await FarmerOrder.find(query).sort({ orderDate: -1 }).lean();
    if (q) {
      const needle = q.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(needle) ||
          (o.customer?.name && o.customer.name.toLowerCase().includes(needle))
      );
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch orders" });
  }
}

export async function getFarmerOrderById(req, res) {
  try {
    const { farmerId, orderId } = req.params;
    const order = await FarmerOrder.findOne({ id: orderId, farmerId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch order" });
  }
}

export async function updateFarmerOrderStatus(req, res) {
  try {
    const { farmerId, orderId } = req.params;
    const { status, note } = req.body;

    const order = await FarmerOrder.findOne({ id: orderId, farmerId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    order.timeline.push({
      status,
      at: new Date(),
      note: note || `Status updated to ${status}`,
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update order status" });
  }
}

export async function createFarmerOrder(req, res) {
  try {
    const { farmerId } = req.params;
    const {
      customer,
      products,
      harvestDate = "",
      harvestTime = "",
      day = "",
      unit = "Kg",
      rejectionQty = 0,
      status = "Confirmed",
      paymentStatus = "Pending",
      deliveryStatus = "Pending",
    } = req.body;

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const totalQuantity = (products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const totalAmount = (products || []).reduce(
      (sum, p) => sum + Number(p.total || (Number(p.price || 0) * Number(p.quantity || 1)) || 0),
      0
    );

    const id = `fo-${Date.now()}`;
    const order = new FarmerOrder({
      id,
      orderId: id,
      vendorId: farmer.vendorId || req.user?.vendorId || DEFAULT_VENDOR_ID,
      farmerId,
      customer: {
        name: customer?.name || "Daily Harvest / Store Order",
        phone: customer?.phone || farmer.mobile || "",
        address: customer?.address || farmer.farmLocation || "",
      },
      products: (products || []).map((p) => ({
        id: p.id || p.productId || "",
        name: p.name || "",
        grade: p.grade || "Grade A",
        quantity: Number(p.quantity || 1),
        unit: p.unit || unit || "Kg",
        price: Number(p.price || 0),
        total: Number(p.total || (Number(p.price || 0) * Number(p.quantity || 1)) || 0),
      })),
      harvestDate: harvestDate || new Date().toISOString().split("T")[0],
      harvestTime: harvestTime || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      day: day || "Today",
      unit: unit || "Kg",
      rejectionQty: Number(rejectionQty || 0),
      totalQuantity,
      totalAmount,
      amount: totalAmount,
      status,
      deliveryStatus,
      paymentStatus,
      orderDate: new Date(),
      timeline: [
        {
          status: "Order Created",
          at: new Date(),
          note: `Harvest order recorded by ${req.user?.role === "FARMER_MANAGER" ? "Manager" : "Vendor"} for ${farmer.name}`,
        },
      ],
    });

    await order.save();

    // Deduct stock from FarmerProduct grades if available
    for (const item of products || []) {
      const prodId = item.id || item.productId;
      if (prodId) {
        const prod = await FarmerProduct.findOne({ id: prodId, farmerId });
        if (prod) {
          const gradeItem = prod.grades?.find((g) => g.label === item.grade);
          if (gradeItem) {
            gradeItem.quantity = Math.max(0, Number(gradeItem.quantity || 0) - Number(item.quantity || 0));
          }
          prod.stock = Math.max(0, Number(prod.stock || 0) - Number(item.quantity || 0));
          await prod.save();

          // Log stock history
          await FarmerStockHistory.create({
            id: `sh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            vendorId: farmer.vendorId || DEFAULT_VENDOR_ID,
            managerId: farmer.managerId || "",
            farmerId,
            productId: prod.id,
            productName: prod.name,
            grade: item.grade || "All Grades",
            action: "Order Deduction",
            previousStock: Number(prod.stock || 0) + Number(item.quantity || 0),
            changedQuantity: -Number(item.quantity || 0),
            newStock: prod.stock,
            reason: `Order #${id}`,
            updatedBy: req.user?.role === "FARMER_MANAGER" ? "Manager" : "Vendor",
            reference: id,
            at: new Date(),
          }).catch(() => {});
        }
      }
    }

    // Create Farmer Earning entry
    await FarmerEarning.create({
      id: `earn-${Date.now()}`,
      vendorId: farmer.vendorId || DEFAULT_VENDOR_ID,
      farmerId,
      orderId: id,
      date: new Date().toISOString().split("T")[0],
      cropName: products?.[0]?.name || "Produce",
      quantity: totalQuantity,
      ratePerKg: totalQuantity > 0 ? Math.round(totalAmount / totalQuantity) : 0,
      grossEarnings: totalAmount,
      deductions: 0,
      netEarnings: totalAmount,
      status: paymentStatus === "Paid" ? "Paid" : "Pending",
    }).catch(() => {});

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create order" });
  }
}

// ----------------------------------------------------
// EARNINGS CONTROLLERS
// ----------------------------------------------------
export async function getFarmerEarnings(req, res) {
  try {
    const { farmerId } = req.params;
    const earningsList = await FarmerEarning.find({ farmerId }).sort({ date: -1 }).lean();

    const totalEarnings = earningsList.reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    const paidEarnings = earningsList
      .filter((r) => r.status === "Paid")
      .reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    const pendingEarnings = earningsList
      .filter((r) => r.status === "Pending")
      .reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    const availableEarnings = earningsList
      .filter((r) => r.status === "Available")
      .reduce((s, r) => s + Number(r.netEarnings || 0), 0);

    res.json({
      summary: { totalEarnings, paidEarnings, pendingEarnings, availableEarnings },
      transactions: earningsList,
      totalEarnings,
      paidEarnings,
      pendingEarnings,
      availableEarnings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch earnings" });
  }
}

// ----------------------------------------------------
// DOCUMENT CONTROLLERS
// ----------------------------------------------------
export async function getFarmerDocuments(req, res) {
  try {
    const { farmerId } = req.params;
    const docs = await FarmerDocument.find({ farmerId }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch documents" });
  }
}

export async function uploadFarmerDocument(req, res) {
  try {
    const { farmerId } = req.params;
    const { type, fileName, fileUrl } = req.body;

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    let doc = await FarmerDocument.findOne({ farmerId, type });
    if (!doc) {
      doc = new FarmerDocument({
        id: `doc-${farmerId}-${type}`,
        vendorId: farmer.vendorId,
        managerId: farmer.managerId,
        farmerId,
        name: type === "aadhaar" ? "Aadhaar / ID Proof" : type === "pan" ? "PAN" : type.toUpperCase(),
        type,
      });
    }

    doc.fileName = fileName || doc.fileName;
    doc.fileUrl = fileUrl || doc.fileUrl || "";
    doc.uploadedAt = new Date();
    doc.status = "Pending";
    doc.rejectionReason = "";

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to upload document" });
  }
}

export async function updateFarmerDocumentStatus(req, res) {
  try {
    const { farmerId, documentId } = req.params;
    const { status, rejectionReason } = req.body;

    const doc = await FarmerDocument.findOne({ id: documentId, farmerId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    doc.status = status;
    if (rejectionReason !== undefined) doc.rejectionReason = rejectionReason;
    await doc.save();

    // Check farmer verification status
    const farmerDocs = await FarmerDocument.find({ farmerId });
    const reqTypes = ["aadhaar", "pan", "address", "bank"];
    const reqDocs = farmerDocs.filter((d) => reqTypes.includes(d.type));

    const farmer = await Farmer.findOne({ id: farmerId });
    if (farmer) {
      if (reqDocs.every((d) => d.status === "Approved")) {
        farmer.verificationStatus = "Approved";
        farmer.status = "Active";
      } else if (reqDocs.some((d) => d.status === "Rejected")) {
        farmer.verificationStatus = "Rejected";
      }
      await farmer.save();
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update document status" });
  }
}

export async function deleteFarmerDocument(req, res) {
  try {
    const { farmerId, documentId } = req.params;
    const doc = await FarmerDocument.findOne({ id: documentId, farmerId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (doc.status === "Approved") {
      return res.status(400).json({ message: "Approved documents cannot be deleted" });
    }

    doc.fileName = "";
    doc.fileUrl = "";
    doc.uploadedAt = null;
    doc.status = "Not Uploaded";
    doc.rejectionReason = "";
    await doc.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete document" });
  }
}

// ----------------------------------------------------
// MANAGER CONTROLLERS
// ----------------------------------------------------
async function enrichManagerDoc(mgrDoc) {
  const m = mgrDoc.toObject ? mgrDoc.toObject() : { ...mgrDoc };
  const farmers = await Farmer.find({ managerId: m.id, vendorId: m.vendorId }).select("id status").lean();
  const farmerIds = farmers.map((f) => f.id);

  const [products, ordersCount, earnings] = await Promise.all([
    farmerIds.length ? FarmerProduct.find({ farmerId: { $in: farmerIds } }).select("stock grades").lean() : [],
    farmerIds.length ? FarmerOrder.countDocuments({ farmerId: { $in: farmerIds } }) : 0,
    farmerIds.length ? FarmerEarning.find({ farmerId: { $in: farmerIds } }).select("netEarnings").lean() : [],
  ]);

  const inventoryQty = products.reduce(
    (sum, p) => sum + (p.grades?.reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0)),
    0
  );

  delete m.password;

  return {
    ...m,
    initials: initials(m.name),
    totalFarmers: farmers.length,
    activeFarmers: farmers.filter((f) => f.status === "Active").length,
    totalProducts: products.length,
    totalInventory: inventoryQty,
    totalOrders: ordersCount,
    totalEarnings: earnings.reduce((s, e) => s + Number(e.netEarnings || 0), 0),
  };
}

async function enrichManagerDocsBatch(mgrDocs) {
  if (!mgrDocs || !mgrDocs.length) return [];

  const rawManagers = mgrDocs.map((doc) => (doc.toObject ? doc.toObject() : { ...doc }));
  const managerIds = rawManagers.map((m) => m.id).filter(Boolean);

  const farmers = await Farmer.find({ managerId: { $in: managerIds } }).select("id managerId status").lean();
  const farmerIds = farmers.map((f) => f.id);

  const [products, orders, earnings] = await Promise.all([
    farmerIds.length ? FarmerProduct.find({ farmerId: { $in: farmerIds } }).select("farmerId stock grades").lean() : [],
    farmerIds.length ? FarmerOrder.find({ farmerId: { $in: farmerIds } }).select("farmerId").lean() : [],
    farmerIds.length ? FarmerEarning.find({ farmerId: { $in: farmerIds } }).select("farmerId netEarnings").lean() : [],
  ]);

  const farmerToManager = new Map();
  const managerFarmersMap = new Map();
  farmers.forEach((f) => {
    farmerToManager.set(f.id, f.managerId);
    const list = managerFarmersMap.get(f.managerId) || [];
    list.push(f);
    managerFarmersMap.set(f.managerId, list);
  });

  const managerProductStats = new Map();
  products.forEach((p) => {
    const mgrId = farmerToManager.get(p.farmerId);
    if (mgrId) {
      const cur = managerProductStats.get(mgrId) || { count: 0, stock: 0 };
      cur.count += 1;
      cur.stock += (p.grades?.reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0));
      managerProductStats.set(mgrId, cur);
    }
  });

  const managerOrderCount = new Map();
  orders.forEach((o) => {
    const mgrId = farmerToManager.get(o.farmerId);
    if (mgrId) {
      managerOrderCount.set(mgrId, (managerOrderCount.get(mgrId) || 0) + 1);
    }
  });

  const managerEarnings = new Map();
  earnings.forEach((e) => {
    const mgrId = farmerToManager.get(e.farmerId);
    if (mgrId) {
      managerEarnings.set(mgrId, (managerEarnings.get(mgrId) || 0) + Number(e.netEarnings || 0));
    }
  });

  return rawManagers.map((m) => {
    delete m.password;
    const fList = managerFarmersMap.get(m.id) || [];
    const pStat = managerProductStats.get(m.id) || { count: 0, stock: 0 };
    return {
      ...m,
      initials: initials(m.name),
      totalFarmers: fList.length,
      activeFarmers: fList.filter((f) => f.status === "Active").length,
      totalProducts: pStat.count,
      totalInventory: pStat.stock,
      totalOrders: managerOrderCount.get(m.id) || 0,
      totalEarnings: managerEarnings.get(m.id) || 0,
    };
  });
}

export async function getManagers(req, res) {
  try {
    const { q = "", status = "", vendorId = DEFAULT_VENDOR_ID } = req.query;
    const query = { vendorId };
    if (status) query.status = status;

    const mgrDocs = await FarmerManager.find(query).sort({ createdAt: -1 }).lean();
    let enriched = await enrichManagerDocsBatch(mgrDocs);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      enriched = enriched.filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.mobile.includes(needle) ||
          m.email.toLowerCase().includes(needle) ||
          (m.location && m.location.toLowerCase().includes(needle))
      );
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch managers" });
  }
}

export async function getManagerById(req, res) {
  try {
    const { managerId } = req.params;
    const manager = await FarmerManager.findOne({ id: managerId });
    if (!manager) return res.status(404).json({ message: "Manager not found" });
    const enriched = await enrichManagerDoc(manager);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch manager" });
  }
}

export async function createManager(req, res) {
  try {
    const payload = req.body;
    const vendorId = req.user?.vendorId || payload.vendorId || DEFAULT_VENDOR_ID;
    const id = `mgr-${Date.now()}`;
    const location = [payload.city, payload.state].filter(Boolean).join(", ") || payload.location || "";

    if (!payload.name || !payload.mobile) {
      return res.status(400).json({ message: "Manager name and mobile are required" });
    }

    const existing = await FarmerManager.findOne({ mobile: String(payload.mobile).trim(), vendorId });
    if (existing) {
      return res.status(409).json({ message: "A manager with this mobile number already exists" });
    }

    const rawPassword = payload.password || "manager123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const manager = new FarmerManager({
      id,
      vendorId,
      name: payload.name,
      profileImage: payload.profileImage || "",
      mobile: String(payload.mobile).trim(),
      email: payload.email || "",
      address: payload.address || "",
      city: payload.city || "",
      state: payload.state || "",
      pincode: payload.pincode || "",
      location,
      joiningDate: payload.joiningDate || new Date().toISOString().split("T")[0],
      status: payload.status || "Active",
      authType: payload.authType || "password",
      password: hashedPassword,
      role: "FARMER_MANAGER",
    });

    await manager.save();
    const enriched = await enrichManagerDoc(manager);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create manager" });
  }
}

export async function updateManager(req, res) {
  try {
    const { managerId } = req.params;
    const payload = req.body;

    const manager = await FarmerManager.findOne({ id: managerId });
    if (!manager) return res.status(404).json({ message: "Manager not found" });

    if (payload.name) manager.name = payload.name;
    if (payload.mobile) manager.mobile = payload.mobile;
    if (payload.email !== undefined) manager.email = payload.email;
    if (payload.address !== undefined) manager.address = payload.address;
    if (payload.city !== undefined) manager.city = payload.city;
    if (payload.state !== undefined) manager.state = payload.state;
    if (payload.pincode !== undefined) manager.pincode = payload.pincode;
    if (payload.status) manager.status = payload.status;

    manager.location = [manager.city, manager.state].filter(Boolean).join(", ") || payload.location || manager.location;

    await manager.save();
    const enriched = await enrichManagerDoc(manager);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update manager" });
  }
}

export async function setManagerStatus(req, res) {
  try {
    const { managerId } = req.params;
    const { status } = req.body;
    const manager = await FarmerManager.findOne({ id: managerId });
    if (!manager) return res.status(404).json({ message: "Manager not found" });
    manager.status = status;
    await manager.save();
    const enriched = await enrichManagerDoc(manager);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update manager status" });
  }
}

export async function deleteManager(req, res) {
  try {
    const { managerId } = req.params;
    const linkedFarmers = await Farmer.countDocuments({ managerId });
    if (linkedFarmers > 0) {
      return res.status(400).json({ message: "Remove or reassign farmers before deleting this manager" });
    }
    await FarmerManager.deleteOne({ id: managerId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete manager" });
  }
}

// ----------------------------------------------------
// VENDOR AUTH CONTROLLERS
// ----------------------------------------------------
export async function vendorLogin(req, res) {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password are required" });
    }
    const vendor = await Vendor.findOne({ mobile: String(mobile).trim() });
    if (!vendor) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }
    if (vendor.status !== "Active") {
      return res.status(403).json({ message: `Vendor account is ${vendor.status.toLowerCase()}` });
    }
    let isMatch = false;
    if (vendor.password && (vendor.password.startsWith("$2a$") || vendor.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, vendor.password);
    } else {
      isMatch = vendor.password === password;
      if (isMatch) {
        vendor.password = await bcrypt.hash(password, 10);
        await vendor.save();
      }
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }
    const token = signToken({
      id: vendor.id,
      vendorId: vendor.id,
      role: "VENDOR",
      name: vendor.ownerName,
      vendorName: vendor.vendorName,
    });
    const { password: _pw, ...vendorData } = vendor.toObject();
    res.json({ success: true, token, vendor: vendorData });
  } catch (err) {
    res.status(500).json({ message: err.message || "Vendor login failed" });
  }
}

export async function getVendorMe(req, res) {
  try {
    const vendor = await Vendor.findOne({ id: req.user.vendorId }).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    const { password: _pw, ...vendorData } = vendor;
    res.json(vendorData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

export async function getVendors(req, res) {
  try {
    const vendors = await Vendor.find().lean();
    res.json(vendors.map(({ password: _pw, ...v }) => v));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

export async function createVendor(req, res) {
  try {
    const payload = req.body;
    const id = `vendor-${Date.now()}`;
    const rawPassword = payload.password || "vendor123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const vendor = new Vendor({
      id,
      vendorCode: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      password: hashedPassword,
      role: "VENDOR",
    });
    await vendor.save();
    const { password: _pw, ...vendorData } = vendor.toObject();
    res.status(201).json(vendorData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create vendor" });
  }
}

export async function updateVendor(req, res) {
  try {
    const { vendorId } = req.params;
    const payload = req.body;
    const vendor = await Vendor.findOne({ id: vendorId });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    Object.assign(vendor, payload);
    if (payload.password) vendor.password = await bcrypt.hash(payload.password, 10);
    await vendor.save();
    const { password: _pw, ...vendorData } = vendor.toObject();
    res.json(vendorData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update vendor" });
  }
}

export async function getVendorDashboard(req, res) {
  try {
    const vendorId = req.user.vendorId;
    const [farmers, managers, products, orders, earnings] = await Promise.all([
      Farmer.find({ vendorId }).lean(),
      FarmerManager.find({ vendorId }).lean(),
      FarmerProduct.find({ vendorId }).lean(),
      FarmerOrder.find({ vendorId }).sort({ orderDate: -1 }).lean(),
      FarmerEarning.find({ vendorId }).lean(),
    ]);
    const totalEarnings = earnings.reduce((s, e) => s + Number(e.netEarnings || 0), 0);
    const pendingEarnings = earnings.filter((e) => e.status === "Pending").reduce((s, e) => s + Number(e.netEarnings || 0), 0);
    const recentOrders = orders.slice(0, 10).map(async (o) => {
      const farmer = farmers.find((f) => f.id === o.farmerId);
      return { ...o, farmerName: farmer?.name || "—" };
    });
    res.json({
      totalFarmers: farmers.length,
      activeFarmers: farmers.filter((f) => f.status === "Active").length,
      totalManagers: managers.length,
      activeManagers: managers.filter((m) => m.status === "Active").length,
      totalProducts: products.length,
      totalInventory: products.reduce((s, p) => s + (p.grades?.reduce((gs, g) => gs + Number(g.quantity || 0), 0) || Number(p.stock || 0)), 0),
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => ["New", "Confirmed", "Processing"].includes(o.status)).length,
      totalEarnings,
      pendingEarnings,
      recentOrders: await Promise.all(recentOrders),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

// ----------------------------------------------------
// MANAGER AUTH CONTROLLERS
// ----------------------------------------------------
export async function managerLogin(req, res) {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password are required" });
    }
    const manager = await FarmerManager.findOne({ mobile: String(mobile).trim() });
    if (!manager) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }
    if (manager.status !== "Active") {
      return res.status(403).json({ message: `Manager account is ${manager.status.toLowerCase()}` });
    }
    let isMatch = false;
    if (manager.password && (manager.password.startsWith("$2a$") || manager.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, manager.password);
    } else {
      isMatch = manager.password === password;
      if (isMatch) {
        manager.password = await bcrypt.hash(password, 10);
        await manager.save();
      }
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }
    const token = signToken({
      id: manager.id,
      managerId: manager.id,
      vendorId: manager.vendorId,
      role: "FARMER_MANAGER",
      name: manager.name,
    });
    const { password: _pw, ...managerData } = manager.toObject();
    res.json({
      success: true,
      token,
      // Return in same shape as farmer login so the farmer app can handle it
      farmer: {
        ...managerData,
        id: manager.id,
        role: "FARMER_MANAGER",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Manager login failed" });
  }
}

export async function getManagerMe(req, res) {
  try {
    const manager = await FarmerManager.findOne({ id: req.user.managerId }).lean();
    if (!manager) return res.status(404).json({ message: "Manager not found" });
    const { password: _pw, ...managerData } = manager;
    res.json(managerData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

// ----------------------------------------------------
// MANAGER-SCOPED CONTROLLERS
// ----------------------------------------------------
export async function getManagerFarmers(req, res) {
  try {
    const managerId = req.user.managerId;
    const vendorId = req.user.vendorId;
    const { q = "", status = "" } = req.query;
    const query = { managerId, vendorId };
    if (status) query.status = status;
    let farmerDocs = await Farmer.find(query).sort({ createdAt: -1 }).lean();
    let enriched = await enrichFarmerDocsBatch(farmerDocs);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      enriched = enriched.filter(
        (f) => f.name.toLowerCase().includes(needle) || f.mobile.includes(needle)
      );
    }
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch farmers" });
  }
}

export async function getManagerDashboard(req, res) {
  try {
    const managerId = req.user.managerId;
    const vendorId = req.user.vendorId;
    const farmers = await Farmer.find({ managerId, vendorId }).lean();
    const farmerIds = farmers.map((f) => f.id);
    const [products, orders, earnings] = await Promise.all([
      FarmerProduct.find({ farmerId: { $in: farmerIds } }).lean(),
      FarmerOrder.find({ farmerId: { $in: farmerIds } }).sort({ orderDate: -1 }).lean(),
      FarmerEarning.find({ farmerId: { $in: farmerIds } }).lean(),
    ]);
    const totalEarnings = earnings.reduce((s, e) => s + Number(e.netEarnings || 0), 0);
    const pendingEarnings = earnings.filter((e) => e.status === "Pending").reduce((s, e) => s + Number(e.netEarnings || 0), 0);
    const totalInventory = products.reduce(
      (s, p) => s + (p.grades?.reduce((gs, g) => gs + Number(g.quantity || 0), 0) || Number(p.stock || 0)), 0
    );
    const lowStock = products
      .filter((p) => {
        const total = p.grades?.reduce((gs, g) => gs + Number(g.quantity || 0), 0) || Number(p.stock || 0);
        return total <= Number(p.lowStockLimit || 10);
      })
      .map((p) => ({
        farmerId: p.farmerId,
        farmerName: farmers.find((f) => f.id === p.farmerId)?.name || "—",
        productName: p.name,
        grades: p.grades,
        currentStock: p.grades?.reduce((gs, g) => gs + Number(g.quantity || 0), 0) || Number(p.stock || 0),
        status: "Low Stock",
      }));
    const recentOrders = orders.slice(0, 10).map((o) => ({
      ...o,
      farmerName: farmers.find((f) => f.id === o.farmerId)?.name || "—",
    }));
    res.json({
      totalFarmers: farmers.length,
      activeFarmers: farmers.filter((f) => f.status === "Active").length,
      totalProducts: products.length,
      totalInventory,
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => ["New", "Confirmed", "Processing"].includes(o.status)).length,
      totalEarnings,
      pendingEarnings,
      recentOrders,
      lowStock,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

export async function assignFarmerManager(req, res) {
  try {
    const { farmerId } = req.params;
    const { managerId } = req.body;
    const vendorId = req.user?.vendorId || DEFAULT_VENDOR_ID;
    const farmer = await Farmer.findOne({ id: farmerId, vendorId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    if (managerId) {
      const manager = await FarmerManager.findOne({ id: managerId, vendorId });
      if (!manager) return res.status(404).json({ message: "Manager not found" });
    }
    farmer.managerId = managerId || "";
    await farmer.save();
    await FarmerProduct.updateMany({ farmerId }, { managerId: managerId || "" });
    await FarmerDocument.updateMany({ farmerId }, { managerId: managerId || "" });
    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to assign manager" });
  }
}

// ----------------------------------------------------
// HARVEST ORDERS CONTROLLERS
// ----------------------------------------------------
export async function getHarvestOrders(req, res) {
  try {
    const { farmerId } = req.query;
    const filter = {};
    if (farmerId) filter.farmerId = farmerId;
    const list = await FarmerHarvestOrder.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch harvest orders" });
  }
}

export async function createHarvestOrder(req, res) {
  try {
    const payload = req.body;
    const id = `ho-${Date.now()}`;
    const order = new FarmerHarvestOrder({
      id,
      vendorId: payload.vendorId || DEFAULT_VENDOR_ID,
      farmerId: payload.farmerId,
      productId: payload.productId,
      productName: payload.productName,
      category: payload.category || "Vegetables",
      date: payload.date || new Date().toISOString().split("T")[0],
      day: payload.day || "",
      unit: payload.unit || "Kg",
      grades: payload.grades || [],
      rejectionQty: Number(payload.rejectionQty) || 0,
      totalQuantity: Number(payload.totalQuantity) || 0,
      totalAmount: Number(payload.totalAmount) || 0,
      status: payload.status || "Approved",
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create harvest order" });
  }
}

export async function updateHarvestOrder(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body;
    const order = await FarmerHarvestOrder.findOne({ id });
    if (!order) return res.status(404).json({ message: "Harvest order not found" });

    if (payload.productId) order.productId = payload.productId;
    if (payload.productName) order.productName = payload.productName;
    if (payload.category) order.category = payload.category;
    if (payload.date) order.date = payload.date;
    if (payload.day !== undefined) order.day = payload.day;
    if (payload.unit) order.unit = payload.unit;
    if (payload.grades) order.grades = payload.grades;
    if (payload.rejectionQty !== undefined) order.rejectionQty = Number(payload.rejectionQty);
    if (payload.totalQuantity !== undefined) order.totalQuantity = Number(payload.totalQuantity);
    if (payload.totalAmount !== undefined) order.totalAmount = Number(payload.totalAmount);
    if (payload.status) order.status = payload.status;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update harvest order" });
  }
}

export async function deleteHarvestOrder(req, res) {
  try {
    const { id } = req.params;
    await FarmerHarvestOrder.deleteOne({ id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete harvest order" });
  }
}
