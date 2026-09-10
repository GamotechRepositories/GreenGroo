import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    balance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "redeemed", "disabled", "expired"],
      default: "active",
      index: true,
    },
    expiresAt: { type: Date, default: null },
    issuedToName: { type: String, default: "", trim: true },
    issuedToPhone: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    redeemedAt: { type: Date, default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

const dynamicPricingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true, index: true },
    minQuantity: { type: Number, required: true, min: 1, default: 10 },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number, required: true, min: 0, default: 5 },
    applyTo: { type: String, enum: ["all", "products", "categories"], default: "all" },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "GreenGroccProduct" }],
    categoryNames: [{ type: String, trim: true }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const bulkSellingDealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "GreenGroccProduct", required: true },
    productName: { type: String, default: "", trim: true },
    sku: { type: String, default: "", trim: true },
    minQuantity: { type: Number, required: true, min: 1, default: 10 },
    maxQuantity: { type: Number, default: null },
    discountPercent: { type: Number, default: 5, min: 0, max: 100 },
    pricePerUnit: { type: Number, default: null, min: 0 },
  },
  { timestamps: true }
);

const refundClaimSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String, default: "", trim: true },
    type: { type: String, enum: ["refund", "warranty"], default: "refund" },
    reason: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed"],
      default: "pending",
      index: true,
    },
    customerName: { type: String, default: "", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    adminNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const financeLedgerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["income", "expense", "payout", "settlement"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    storeName: { type: String, default: "", trim: true },
    vendorName: { type: String, default: "", trim: true },
    reference: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const HR_EMPLOYEE_TYPES = [
  "staff",
  "farmer_manager",
  "pickup_driver",
  "delivery_manager",
  "delivery_boy",
];

const hrAttendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeType: {
      type: String,
      enum: HR_EMPLOYEE_TYPES,
      default: "staff",
    },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    date: { type: String, required: true, trim: true },
    clockIn: { type: Date, default: Date.now },
    clockOut: { type: Date, default: null },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const hrEmploymentSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeType: { type: String, enum: HR_EMPLOYEE_TYPES, required: true, index: true },
    name: { type: String, default: "", trim: true },
    department: { type: String, default: "", trim: true },
    designation: { type: String, default: "", trim: true },
    joiningDate: { type: String, default: "", trim: true },
    salaryDate: { type: String, default: "", trim: true },
    monthlySalary: { type: Number, default: 0, min: 0 },
    salaryTax: { type: Number, default: 0, min: 0 },
    bankAccount: { type: String, default: "", trim: true },
    ifsc: { type: String, default: "", trim: true },
    upi: { type: String, default: "", trim: true },
    workNotes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);
hrEmploymentSchema.index({ employeeType: 1, employeeId: 1 }, { unique: true });

if (mongoose.models.AdminHrEmployment) {
  mongoose.models.AdminHrEmployment.schema.add({
    salaryDate: { type: String, default: "", trim: true },
    salaryTax: { type: Number, default: 0, min: 0 },
    workNotes: { type: String, default: "", trim: true },
  });
}

const hrPayrollSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeType: { type: String, enum: HR_EMPLOYEE_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    roleKey: { type: String, default: "", trim: true, index: true },
    month: { type: String, required: true, trim: true, index: true },
    gross: { type: Number, required: true, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    net: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    payrunId: { type: String, default: "", trim: true, index: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending", index: true },
    paidAt: { type: Date, default: null },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);
hrPayrollSchema.index({ employeeType: 1, employeeId: 1, month: 1 }, { unique: true });

const hrTaskSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeType: { type: String, enum: HR_EMPLOYEE_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    details: { type: String, default: "", trim: true },
    dueDate: { type: String, default: "", trim: true },
    status: { type: String, enum: ["open", "in_progress", "done"], default: "open", index: true },
  },
  { timestamps: true }
);

export const GiftCard = mongoose.models.AdminGiftCard || mongoose.model("AdminGiftCard", giftCardSchema);
export const DynamicPricingRule =
  mongoose.models.AdminDynamicPricingRule ||
  mongoose.model("AdminDynamicPricingRule", dynamicPricingRuleSchema);
export const BulkSellingDeal =
  mongoose.models.AdminBulkSellingDeal || mongoose.model("AdminBulkSellingDeal", bulkSellingDealSchema);
export const RefundClaim =
  mongoose.models.AdminRefundClaim || mongoose.model("AdminRefundClaim", refundClaimSchema);
export const FinanceLedger =
  mongoose.models.AdminFinanceLedger || mongoose.model("AdminFinanceLedger", financeLedgerSchema);
export const HrAttendance =
  mongoose.models.AdminHrAttendance || mongoose.model("AdminHrAttendance", hrAttendanceSchema);
export const HrEmployment =
  mongoose.models.AdminHrEmployment || mongoose.model("AdminHrEmployment", hrEmploymentSchema);
export const HrPayroll =
  mongoose.models.AdminHrPayroll || mongoose.model("AdminHrPayroll", hrPayrollSchema);
export const HrTask = mongoose.models.AdminHrTask || mongoose.model("AdminHrTask", hrTaskSchema);

const HR_ROLE_KEYS = [
  "vendor",
  "segregation_manager",
  "product_manager",
  "farmer_manager",
  "farmer",
  "pickup_driver",
  "delivery_manager",
  "delivery_boy",
  "admin",
];

const hrAnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", trim: true },
    roleKey: { type: String, default: "all", trim: true, index: true },
    category: {
      type: String,
      enum: ["announcement", "holiday", "note"],
      default: "announcement",
      index: true,
    },
    status: { type: String, enum: ["draft", "scheduled", "published"], default: "draft", index: true },
    scheduledAt: { type: String, default: "", trim: true },
    publishedAt: { type: Date, default: null },
    createdBy: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const hrLeavePolicySchema = new mongoose.Schema(
  {
    roleKey: { type: String, required: true, unique: true, trim: true },
    casualDays: { type: Number, default: 12, min: 0 },
    sickDays: { type: Number, default: 12, min: 0 },
    earnedDays: { type: Number, default: 15, min: 0 },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const hrLeaveRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeType: { type: String, enum: HR_EMPLOYEE_TYPES, default: "staff" },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    roleKey: { type: String, default: "", trim: true, index: true },
    leaveType: { type: String, enum: ["casual", "sick", "earned", "unpaid"], default: "casual" },
    fromDate: { type: String, required: true, trim: true },
    toDate: { type: String, required: true, trim: true },
    days: { type: Number, default: 1, min: 0 },
    dates: { type: [String], default: [] },
    reason: { type: String, default: "", trim: true },
    adminNotes: { type: String, default: "", trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    assignedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const hrShiftSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeType: { type: String, enum: HR_EMPLOYEE_TYPES, default: "staff" },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    roleKey: { type: String, default: "", trim: true, index: true },
    date: { type: String, required: true, trim: true, index: true },
    startTime: { type: String, default: "09:00", trim: true },
    endTime: { type: String, default: "18:00", trim: true },
    shiftName: { type: String, default: "General", trim: true },
    notes: { type: String, default: "", trim: true },
    status: { type: String, enum: ["scheduled", "published"], default: "published", index: true },
  },
  { timestamps: true }
);

const hrVacancySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    roleKey: { type: String, required: true, trim: true, index: true },
    openings: { type: Number, default: 1, min: 1 },
    location: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
  },
  { timestamps: true }
);

const hrCandidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    roleKey: { type: String, required: true, trim: true, index: true },
    vacancyId: { type: String, default: "", trim: true, index: true },
    /** Pipeline bucket: applied → selected → finalize → recruited */
    section: {
      type: String,
      enum: ["applied", "selected", "finalize", "recruited"],
      default: "applied",
      index: true,
    },
    /** Decision status while in Applied section */
    applicationStatus: {
      type: String,
      enum: ["pending", "in_review", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    /** Status while in Finalize section */
    finalizeStatus: {
      type: String,
      enum: [
        "",
        "selected_for_interview",
        "selected_for_training",
        "selected_for_offer",
        "on_hold",
        "cleared",
      ],
      default: "",
      index: true,
    },
    /** Legacy stage kept for compatibility */
    stage: {
      type: String,
      enum: [
        "applied",
        "screening",
        "interview",
        "shortlisted",
        "selected",
        "rejected",
        "in_review",
        "finalize",
        "recruited",
      ],
      default: "applied",
      index: true,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    notes: { type: String, default: "", trim: true },
    adminNotes: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    experience: { type: String, default: "", trim: true },
    education: { type: String, default: "", trim: true },
    currentCompany: { type: String, default: "", trim: true },
    expectedCtc: { type: String, default: "", trim: true },
    noticePeriod: { type: String, default: "", trim: true },
    coverLetter: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    resumeName: { type: String, default: "", trim: true },
    resumeUrl: { type: String, default: "", trim: true },
    resumeData: { type: String, default: "" },
    stageHistory: [
      {
        section: { type: String, default: "" },
        status: { type: String, default: "" },
        label: { type: String, default: "" },
        notes: { type: String, default: "" },
        by: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const HrAnnouncement =
  mongoose.models.AdminHrAnnouncement || mongoose.model("AdminHrAnnouncement", hrAnnouncementSchema);
export const HrLeavePolicy =
  mongoose.models.AdminHrLeavePolicy || mongoose.model("AdminHrLeavePolicy", hrLeavePolicySchema);
export const HrLeaveRequest =
  mongoose.models.AdminHrLeaveRequest || mongoose.model("AdminHrLeaveRequest", hrLeaveRequestSchema);
export const HrShift = mongoose.models.AdminHrShift || mongoose.model("AdminHrShift", hrShiftSchema);
export const HrVacancy =
  mongoose.models.AdminHrVacancy || mongoose.model("AdminHrVacancy", hrVacancySchema);
export const HrCandidate =
  mongoose.models.AdminHrCandidate || mongoose.model("AdminHrCandidate", hrCandidateSchema);
export { HR_EMPLOYEE_TYPES, HR_ROLE_KEYS };
