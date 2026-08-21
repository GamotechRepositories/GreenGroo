import mongoose from "mongoose";

// ============================================================
// VENDOR
// ============================================================
const vendorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorCode: { type: String, default: "" },
    vendorName: { type: String, default: "", trim: true },
    ownerName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, unique: true },
    email: { type: String, default: "", trim: true },
    businessName: { type: String, default: "" },
    businessAddress: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    bank: {
      accountHolder: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifsc: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Inactive", "Suspended"],
      default: "Pending",
    },
    password: { type: String, default: "" },
    role: { type: String, default: "VENDOR" },
  },
  { timestamps: true }
);

const farmerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    farmerCode: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    password: { type: String, default: "123456" },
    profileImage: { type: String, default: "" },
    farmName: { type: String, default: "" },
    farmLocation: { type: String, default: "" },
    farmAddress: { type: String, default: "" },
    farmArea: { type: String, default: "" },
    farmType: { type: String, default: "Organic" },
    address: {
      village: { type: String, default: "" },
      taluka: { type: String, default: "" },
      district: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    bank: {
      accountHolder: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifsc: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Inactive", "Suspended"],
      default: "Pending",
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Not Uploaded"],
      default: "Approved",
    },
    verificationRequired: { type: Boolean, default: false },
    loginEnabled: { type: Boolean, default: true },
    vendorId: { type: String, required: true, default: "vendor-1" },
    managerId: { type: String, default: "" },
    role: { type: String, default: "FARMER" },
  },
  { timestamps: true }
);

const farmerManagerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true, default: "vendor-1" },
    name: { type: String, required: true, trim: true },
    profileImage: { type: String, default: "" },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    location: { type: String, default: "" },
    joiningDate: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    authType: { type: String, default: "password" },
    password: { type: String, default: "123456" },
    role: { type: String, default: "FARMER_MANAGER" },
  },
  { timestamps: true }
);

const farmerProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true, default: "vendor-1" },
    managerId: { type: String, default: "" },
    farmerId: { type: String, required: true },
    sku: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "Vegetables" },
    subCategory: { type: String, default: "Fresh Produce" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    images: [{ type: String }],
    unit: { type: String, default: "Kg" },
    harvestDate: { type: String, default: "" },
    produceType: { type: String, default: "organic" },
    farmLocation: { type: String, default: "" },
    status: { type: String, default: "Approved" },
    sellingPrice: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    lowStockLimit: { type: Number, default: 10 },
    stock: { type: Number, default: 0 },
    availableQuantity: { type: Number, default: 0 },
    gradeAQty: { type: Number, default: 0 },
    gradeBQty: { type: Number, default: 0 },
    grades: [
      {
        id: { type: String, default: "g-a" },
        label: { type: String, default: "Grade A" },
        quantity: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

const farmerStockHistorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true, default: "vendor-1" },
    managerId: { type: String, default: "" },
    farmerId: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, default: "" },
    grade: { type: String, default: "All Grades" },
    action: { type: String, default: "Stock Added" },
    previousStock: { type: Number, default: 0 },
    changedQuantity: { type: Number, default: 0 },
    newStock: { type: Number, default: 0 },
    reason: { type: String, default: "Manual Update" },
    updatedBy: { type: String, default: "Farmer" },
    reference: { type: String, default: "—" },
    at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const farmerOrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    orderId: { type: String, default: "" },
    vendorId: { type: String, required: true, default: "vendor-1" },
    farmerId: { type: String, required: true },
    customer: {
      name: { type: String, default: "Customer" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    products: [
      {
        id: { type: String, default: "" },
        name: { type: String, default: "" },
        grade: { type: String, default: "Grade A" },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: "Kg" },
        price: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
    ],
    harvestDate: { type: String, default: "" },
    harvestTime: { type: String, default: "" },
    day: { type: String, default: "" },
    unit: { type: String, default: "Kg" },
    rejectionQty: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    status: { type: String, default: "Confirmed" },
    deliveryStatus: { type: String, default: "Pending" },
    paymentStatus: { type: String, default: "Pending" },
    orderDate: { type: Date, default: Date.now },
    timeline: [
      {
        status: { type: String, default: "" },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

const farmerEarningSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true, default: "vendor-1" },
    farmerId: { type: String, required: true },
    orderId: { type: String, default: "" },
    date: { type: String, default: "" },
    cropName: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    ratePerKg: { type: Number, default: 0 },
    grossEarnings: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netEarnings: { type: Number, default: 0 },
    status: { type: String, enum: ["Paid", "Pending", "Available"], default: "Pending" },
  },
  { timestamps: true }
);

const farmerDocumentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true, default: "vendor-1" },
    managerId: { type: String, default: "" },
    farmerId: { type: String, required: true },
    name: { type: String, default: "" },
    type: { type: String, enum: ["aadhaar", "pan", "address", "bank", "other"], default: "other" },
    fileName: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    uploadedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Not Uploaded"],
      default: "Not Uploaded",
    },
    adminRemarks: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

const farmerHarvestOrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true, default: "vendor-1" },
    managerId: { type: String, default: "" },
    farmerId: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, default: "" },
    category: { type: String, default: "Vegetables" },
    date: { type: String, required: true },
    day: { type: String, default: "" },
    unit: { type: String, default: "Kg" },
    grades: [
      {
        name: { type: String, default: "A Grade" },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, default: null },
        amount: { type: Number, default: 0 },
      },
    ],
    rejectionQty: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, default: "Approved" },
  },
  { timestamps: true }
);

// Indexes for fast querying
farmerSchema.index({ vendorId: 1 });
farmerSchema.index({ managerId: 1, vendorId: 1 });
farmerSchema.index({ mobile: 1 });
farmerSchema.index({ status: 1 });
farmerSchema.index({ createdAt: -1 });

farmerManagerSchema.index({ vendorId: 1 });
farmerManagerSchema.index({ mobile: 1 });
farmerManagerSchema.index({ status: 1 });
farmerManagerSchema.index({ createdAt: -1 });

farmerProductSchema.index({ farmerId: 1 });
farmerProductSchema.index({ vendorId: 1 });
farmerProductSchema.index({ managerId: 1 });
farmerProductSchema.index({ id: 1, farmerId: 1 });
farmerProductSchema.index({ status: 1 });
farmerProductSchema.index({ createdAt: -1 });

farmerStockHistorySchema.index({ farmerId: 1 });
farmerStockHistorySchema.index({ productId: 1 });
farmerStockHistorySchema.index({ farmerId: 1, productId: 1 });
farmerStockHistorySchema.index({ at: -1 });

farmerOrderSchema.index({ farmerId: 1 });
farmerOrderSchema.index({ vendorId: 1 });
farmerOrderSchema.index({ id: 1, farmerId: 1 });
farmerOrderSchema.index({ orderDate: -1 });
farmerOrderSchema.index({ createdAt: -1 });
farmerOrderSchema.index({ status: 1 });

farmerEarningSchema.index({ farmerId: 1 });
farmerEarningSchema.index({ vendorId: 1 });
farmerEarningSchema.index({ status: 1 });
farmerEarningSchema.index({ date: -1 });

farmerDocumentSchema.index({ farmerId: 1 });
farmerDocumentSchema.index({ vendorId: 1 });
farmerDocumentSchema.index({ id: 1, farmerId: 1 });
farmerDocumentSchema.index({ farmerId: 1, type: 1 });

farmerHarvestOrderSchema.index({ farmerId: 1 });
farmerHarvestOrderSchema.index({ vendorId: 1 });
farmerHarvestOrderSchema.index({ managerId: 1 });
farmerHarvestOrderSchema.index({ createdAt: -1 });

export const Vendor =
  mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export const Farmer =
  mongoose.models.Farmer || mongoose.model("Farmer", farmerSchema);
export const FarmerManager =
  mongoose.models.FarmerManager || mongoose.model("FarmerManager", farmerManagerSchema);
export const FarmerProduct =
  mongoose.models.FarmerProduct || mongoose.model("FarmerProduct", farmerProductSchema);
export const FarmerStockHistory =
  mongoose.models.FarmerStockHistory || mongoose.model("FarmerStockHistory", farmerStockHistorySchema);
export const FarmerOrder =
  mongoose.models.FarmerOrder || mongoose.model("FarmerOrder", farmerOrderSchema);
export const FarmerEarning =
  mongoose.models.FarmerEarning || mongoose.model("FarmerEarning", farmerEarningSchema);
export const FarmerDocument =
  mongoose.models.FarmerDocument || mongoose.model("FarmerDocument", farmerDocumentSchema);
export const FarmerHarvestOrder =
  mongoose.models.FarmerHarvestOrder || mongoose.model("FarmerHarvestOrder", farmerHarvestOrderSchema);
