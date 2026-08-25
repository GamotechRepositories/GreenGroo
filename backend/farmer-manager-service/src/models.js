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
    dateOfBirth: { type: String, default: "" },
    gender: { type: String, enum: ["", "Male", "Female", "Other"], default: "" },
    referralCode: { type: String, default: "", trim: true },
    registrationStatus: {
      type: String,
      enum: ["REGISTERED", "ACTIVE"],
      default: "REGISTERED",
    },
    kycStatus: {
      type: String,
      enum: ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    preferredLanguage: { type: String, default: "" },
    bankVerificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
    farm: {
      farmId: { type: String, default: "" },
      farmName: { type: String, default: "" },
      totalFarmArea: { type: Number, default: 0 },
      totalFarmAreaUnit: { type: String, default: "Acre" },
      cultivatedArea: { type: Number, default: 0 },
      cultivatedAreaUnit: { type: String, default: "Acre" },
      soilType: { type: String, default: "" },
      irrigationType: { type: String, default: "" },
      waterSource: { type: String, default: "" },
      farmingMethod: { type: String, default: "" },
      farmingType: { type: String, default: "" },
      mainCrops: { type: String, default: "" },
      farmPhotos: [{ type: String }],
      farmVideos: [{ type: String }],
    },
    farmGeo: {
      village: { type: String, default: "" },
      taluka: { type: String, default: "" },
      district: { type: String, default: "" },
      pincode: { type: String, default: "" },
      farmAddress: { type: String, default: "" },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      confirmed: { type: Boolean, default: false },
    },
    // Extension point for future mobile OTP login without changing registration flow.
    authType: { type: String, default: "direct" },
    mobileVerified: { type: Boolean, default: false },
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
    productId: { type: String, default: "" },
    vendorId: { type: String, required: true, default: "vendor-1" },
    managerId: { type: String, default: "" },
    farmerId: { type: String, required: true },
    farmId: { type: String, default: "" },
    sku: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    productName: { type: String, default: "" },
    category: { type: String, default: "Vegetables" },
    subCategory: { type: String, default: "Fresh Produce" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    images: [{ type: String }],
    unit: { type: String, default: "Kg" },
    harvestDate: { type: String, default: "" },
    produceType: { type: String, default: "organic" },
    farmLocation: { type: String, default: "" },
    cropId: { type: String, default: "" },
    cropName: { type: String, default: "" },
    variety: { type: String, default: "" },
    status: { type: String, default: "Draft" },
    sellingPrice: { type: Number, default: 0 },
    pricePerKg: { type: Number, default: 0 },
    minimumOrderQuantity: { type: Number, default: 1 },
    mrp: { type: Number, default: 0 },
    lowStockLimit: { type: Number, default: 10 },
    stock: { type: Number, default: 0 },
    availableQuantity: { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    farmingType: { type: String, default: "" },
    availableFrom: { type: String, default: "" },
    availableUntil: { type: String, default: "" },
    gradeAQty: { type: Number, default: 0 },
    gradeBQty: { type: Number, default: 0 },
    grades: [
      {
        id: { type: String, default: "g-a" },
        grade: { type: String, default: "A" },
        label: { type: String, default: "Grade A" },
        quantity: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
      },
    ],
    media: {
      mainPhoto: { type: String, default: "" },
      farmPhotos: [{ type: String }],
      cropPhotos: [{ type: String }],
      harvestPhotos: [{ type: String }],
      videos: [{ type: String }],
    },
    priceHistory: [
      {
        pricePerKg: { type: Number, default: 0 },
        grades: { type: Array, default: [] },
        at: { type: Date, default: Date.now },
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
    customerId: { type: String, default: "" },
    productId: { type: String, default: "" },
    cropId: { type: String, default: "" },
    productName: { type: String, default: "" },
    variety: { type: String, default: "" },
    grade: { type: String, default: "" },
    orderedQuantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    orderValue: { type: Number, default: 0 },
    customerDeliveryArea: { type: String, default: "" },
    requiredDate: { type: String, default: "" },
    pickupDate: { type: String, default: "" },
    collectionCentre: { type: String, default: "" },
    reservedQuantity: { type: Number, default: 0 },
    packedQuantity: { type: Number, default: 0 },
    rejectionReason: { type: String, default: "" },
    rejectionNote: { type: String, default: "" },
    rejectedBy: { type: String, default: "" },
    preparationStatus: { type: String, default: "NOT_STARTED" },
    qrToken: { type: String, default: "" },
    packingDetails: {
      packageCount: { type: Number, default: 0 },
      packageType: { type: String, default: "" },
      packageWeight: { type: Number, default: 0 },
      packingDate: { type: String, default: "" },
      notes: { type: String, default: "" },
    },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    preparedAt: { type: Date, default: null },
    readyForPickupAt: { type: Date, default: null },
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
    status: { type: String, default: "NEW" },
    deliveryStatus: { type: String, default: "Pending" },
    paymentStatus: { type: String, default: "Pending" },
    orderDate: { type: Date, default: Date.now },
    grades: [{ type: mongoose.Schema.Types.Mixed }],
    timeline: [
      {
        status: { type: String, default: "" },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true, strict: false }
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

// ============================================================
// COMPOUND & QUERY OPTIMIZATION INDEXES
// ============================================================
// Vendor Indexes
vendorSchema.index({ status: 1 });

// Farmer Indexes
farmerSchema.index({ managerId: 1, vendorId: 1 });
farmerSchema.index({ vendorId: 1, status: 1 });
farmerSchema.index({ mobile: 1 });
farmerSchema.index({ status: 1 });
farmerSchema.index({ createdAt: -1 });

// Farmer Manager Indexes
farmerManagerSchema.index({ vendorId: 1, status: 1 });
farmerManagerSchema.index({ mobile: 1 });
farmerManagerSchema.index({ createdAt: -1 });

// Farmer Product Indexes
farmerProductSchema.index({ farmerId: 1, createdAt: -1 });
farmerProductSchema.index({ id: 1, farmerId: 1 });
farmerProductSchema.index({ managerId: 1, status: 1 });
farmerProductSchema.index({ vendorId: 1, status: 1 });
farmerProductSchema.index({ category: 1 });

// Farmer Stock History Indexes
farmerStockHistorySchema.index({ farmerId: 1, productId: 1, at: -1 });
farmerStockHistorySchema.index({ farmerId: 1, at: -1 });
farmerStockHistorySchema.index({ at: -1 });

// Farmer Order Indexes
farmerOrderSchema.index({ farmerId: 1, orderDate: -1 });
farmerOrderSchema.index({ farmerId: 1, createdAt: -1 });
farmerOrderSchema.index({ id: 1, farmerId: 1 });
farmerOrderSchema.index({ vendorId: 1, status: 1 });
farmerOrderSchema.index({ status: 1 });

// Farmer Earning Indexes
farmerEarningSchema.index({ farmerId: 1, date: -1 });
farmerEarningSchema.index({ farmerId: 1, status: 1 });
farmerEarningSchema.index({ vendorId: 1, status: 1 });

// Farmer Document Indexes
farmerDocumentSchema.index({ farmerId: 1, type: 1 });
farmerDocumentSchema.index({ farmerId: 1, status: 1 });
farmerDocumentSchema.index({ vendorId: 1 });

// Farmer Harvest Order Indexes
farmerHarvestOrderSchema.index({ farmerId: 1, date: -1 });
farmerHarvestOrderSchema.index({ farmerId: 1, createdAt: -1 });
farmerHarvestOrderSchema.index({ farmerId: 1, productId: 1 });
farmerHarvestOrderSchema.index({ managerId: 1, createdAt: -1 });
farmerHarvestOrderSchema.index({ vendorId: 1, createdAt: -1 });
farmerHarvestOrderSchema.index({ status: 1 });

const CROP_STATUSES = ["Planned", "Growing", "Ready for Harvest", "Harvested", "Completed"];

const farmerCropSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    cropId: { type: String, required: true, unique: true },
    farmerId: { type: String, required: true },
    farmId: { type: String, default: "" },
    cropName: { type: String, required: true, trim: true },
    variety: { type: String, required: true, trim: true },
    area: { type: Number, required: true, default: 0 },
    areaUnit: { type: String, default: "Acre" },
    sowingDate: { type: String, required: true },
    expectedHarvestDate: { type: String, required: true },
    estimatedQuantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: "Kg" },
    farmingMethod: { type: String, default: "" },
    farmingType: { type: String, default: "" },
    photos: [{ type: String }],
    status: { type: String, enum: CROP_STATUSES, default: "Planned" },
  },
  { timestamps: true }
);

const farmerCropPlanSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    planId: { type: String, required: true, unique: true },
    farmerId: { type: String, required: true },
    cropId: { type: String, required: true },
    harvestDate: { type: String, default: "" },
    estimatedProduction: { type: Number, default: 0 },
    expectedDemand: { type: Number, default: 0 },
    suggestedSaleQuantity: { type: Number, default: 0 },
    unit: { type: String, default: "Kg" },
    status: { type: String, default: "Planned" },
  },
  { timestamps: true }
);

farmerCropSchema.index({ farmerId: 1, createdAt: -1 });
farmerCropSchema.index({ farmerId: 1, cropId: 1 });
farmerCropPlanSchema.index({ farmerId: 1, createdAt: -1 });
farmerCropPlanSchema.index({ farmerId: 1, cropId: 1 }, { unique: true });

const pickupDriverSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    vehicleNumber: { type: String, default: "" },
    vehicleType: { type: String, default: "Van" },
    licenseNumber: { type: String, default: "" },
    assignedArea: { type: String, default: "" },
    documents: [{ type: String }],
    password: { type: String, default: "" },
    role: { type: String, default: "DRIVER" },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const collectionCentreSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    contactMobile: { type: String, default: "" },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const pickupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    pickupId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    vendorId: { type: String, required: true },
    managerId: { type: String, default: "" },
    farmerId: { type: String, required: true },
    driverId: { type: String, default: "" },
    collectionCentreId: { type: String, default: "" },
    scheduledDate: { type: String, default: "" },
    scheduledTime: { type: String, default: "" },
    pickupDate: { type: String, default: "" },
    pickupTime: { type: String, default: "" },
    pickupLocation: { type: String, default: "" },
    driverName: { type: String, default: "" },
    driverMobile: { type: String, default: "" },
    vehicleNumber: { type: String, default: "" },
    expectedQuantity: { type: Number, default: 0 },
    packedQuantity: { type: Number, default: 0 },
    packageCount: { type: Number, default: 0 },
    unit: { type: String, default: "Kg" },
    productName: { type: String, default: "" },
    variety: { type: String, default: "" },
    grade: { type: String, default: "" },
    qrToken: { type: String, default: "" },
    qrPayload: { type: String, default: "" },
    pickupInstructions: { type: String, default: "" },
    assignedAt: { type: Date, default: null },
    dispatchStartedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    orderVerifiedAt: { type: Date, default: null },
    driverStatus: { type: String, default: "" },
    timeline: [
      {
        status: { type: String, default: "" },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
    qrVerified: { type: Boolean, default: false },
    qrVerifiedBy: { type: String, default: "" },
    qrVerifiedAt: { type: Date, default: null },
    verification: {
      farmer: { type: Boolean, default: false },
      order: { type: Boolean, default: false },
      product: { type: Boolean, default: false },
      quantity: { type: Boolean, default: false },
      driver: { type: Boolean, default: false },
      vehicle: { type: Boolean, default: false },
    },
    pickupConfirmed: { type: Boolean, default: false },
    pickupConfirmedBy: { type: String, default: "" },
    pickupConfirmedAt: { type: Date, default: null },
    confirmedQuantity: { type: Number, default: 0 },
    confirmedPackageCount: { type: Number, default: 0 },
    confirmationPhotos: [{ type: String }],
    status: { type: String, default: "READY_FOR_PICKUP" },
    receiving: {
      status: { type: String, default: "" },
      expectedWeight: { type: Number, default: 0 },
      actualWeight: { type: Number, default: 0 },
      acceptedWeight: { type: Number, default: 0 },
      difference: { type: Number, default: 0 },
      weightUnit: { type: String, default: "Kg" },
      photos: [{ type: String }],
      receiptId: { type: String, default: "" },
      receivedAt: { type: Date, default: null },
      receivedBy: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

pickupDriverSchema.index({ vendorId: 1, createdAt: -1 });
pickupDriverSchema.index({ vendorId: 1, mobile: 1 });
collectionCentreSchema.index({ vendorId: 1 });
pickupSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
pickupSchema.index({ farmerId: 1, createdAt: -1 });
pickupSchema.index({ managerId: 1, createdAt: -1 });
pickupSchema.index({ driverId: 1, status: 1 });
pickupSchema.index({ orderId: 1 }, { unique: true });
pickupSchema.index({ qrToken: 1 });

const QUALITY_STATUSES = [
  "QUALITY_PENDING",
  "INSPECTION",
  "GRADING",
  "GRADE_CONFIRMED",
  "ORDER_COMPLETED",
];

const qualityInspectionSchema = new mongoose.Schema(
  {
    inspectionId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    farmerId: { type: String, required: true },
    productId: { type: String, default: "" },
    batchId: { type: String, default: "" },
    collectionCentreId: { type: String, default: "" },
    pickupId: { type: String, default: "" },
    vendorId: { type: String, default: "" },
    inspectorId: { type: String, default: "" },
    inspectorRole: { type: String, default: "" },
    inspectorName: { type: String, default: "" },
    qualityParameters: {
      freshness: { type: String, default: "" },
      size: { type: String, default: "" },
      colour: { type: String, default: "" },
      appearance: { type: String, default: "" },
      cleanliness: { type: String, default: "" },
      damage: { type: String, default: "" },
      moisture: { type: String, default: "" },
      weight: { type: String, default: "" },
      overallQuality: { type: String, default: "" },
    },
    qualityRemarks: { type: String, default: "" },
    qualityPhotos: [
      {
        url: { type: String, default: "" },
        label: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    gradeAQuantity: { type: Number, default: 0 },
    gradeBQuantity: { type: Number, default: 0 },
    gradeCQuantity: { type: Number, default: 0 },
    rejectedQuantity: { type: Number, default: 0 },
    rejectionReason: { type: String, default: "" },
    rejectionRemarks: { type: String, default: "" },
    status: { type: String, enum: QUALITY_STATUSES, default: "QUALITY_PENDING" },
    inspectionStartedAt: { type: Date, default: null },
    inspectionCompletedAt: { type: Date, default: null },
    gradingConfirmedAt: { type: Date, default: null },
    lastActionBy: { type: String, default: "" },
    lastActionRole: { type: String, default: "" },
    lastActionAt: { type: Date, default: null },
    actions: [
      {
        action: { type: String, default: "" },
        userId: { type: String, default: "" },
        role: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

qualityInspectionSchema.index({ orderId: 1 }, { unique: true });
qualityInspectionSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
qualityInspectionSchema.index({ farmerId: 1, status: 1 });
qualityInspectionSchema.index({ pickupId: 1 });
qualityInspectionSchema.index({ batchId: 1 });

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
export const FarmerCrop =
  mongoose.models.FarmerCrop || mongoose.model("FarmerCrop", farmerCropSchema);
export const FarmerCropPlan =
  mongoose.models.FarmerCropPlan || mongoose.model("FarmerCropPlan", farmerCropPlanSchema);
export const PickupDriver =
  mongoose.models.PickupDriver || mongoose.model("PickupDriver", pickupDriverSchema);
export const CollectionCentre =
  mongoose.models.CollectionCentre || mongoose.model("CollectionCentre", collectionCentreSchema);
export const Pickup =
  mongoose.models.Pickup || mongoose.model("Pickup", pickupSchema);
export const QualityInspection =
  mongoose.models.QualityInspection || mongoose.model("QualityInspection", qualityInspectionSchema);

/**
 * Ensures all MongoDB indexes for farmer-manager service are created in background
 */
export async function ensureFarmerIndexes() {
  try {
    const models = [
      Vendor,
      Farmer,
      FarmerManager,
      FarmerProduct,
      FarmerStockHistory,
      FarmerOrder,
      FarmerEarning,
      FarmerDocument,
      FarmerHarvestOrder,
      FarmerCrop,
      FarmerCropPlan,
      PickupDriver,
      CollectionCentre,
      Pickup,
      QualityInspection,
    ];

    await Promise.all(
      models.map((model) =>
        model.createIndexes().catch((err) => {
          console.warn(`[Indexes] Non-critical warning on ${model.modelName}:`, err.message);
        })
      )
    );
    console.log("[Indexes] Farmer-Manager indexes ensured successfully.");
  } catch (err) {
    console.warn("[Indexes] Error creating farmer indexes:", err.message);
  }
}
