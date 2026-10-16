import mongoose from "mongoose";

// 1. Estimation / Draft Quotes
const financeEstimationSchema = new mongoose.Schema(
  {
    estimateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: "", trim: true },
    customerMobile: { type: String, default: "", trim: true },
    company: { type: String, default: "", trim: true },
    date: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String, default: "" },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 0, min: 0 },
        taxAmount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "declined", "converted"],
      default: "draft",
      index: true,
    },
    notes: { type: String, default: "" },
    terms: { type: String, default: "Payment due within 15 days of invoice date." },
  },
  { timestamps: true }
);

// 2. Tax Rates
const financeTaxRateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    zone: { type: String, default: "All Zones", trim: true },
    agency: { type: String, default: "CBIC / State GST", trim: true },
    isCompound: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// 3. Tax Zones
const financeTaxZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    regions: [{ type: String, trim: true }],
    defaultRate: { type: Number, default: 18, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// 4. Tax Categories
const financeTaxCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    standardRate: { type: Number, default: 5, min: 0 },
    taxType: { type: String, default: "GST", trim: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// 5. Tax Agencies
const financeTaxAgencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    registrationNumber: { type: String, default: "", trim: true },
    jurisdiction: { type: String, default: "National", trim: true },
    filingFrequency: { type: String, enum: ["monthly", "quarterly", "annually"], default: "monthly" },
    contactEmail: { type: String, default: "", trim: true },
    contactPhone: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// 6. Tax Payments
const financeTaxPaymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    agencyName: { type: String, required: true, trim: true },
    period: { type: String, required: true, trim: true }, // e.g. "2026-Q3", "2026-10"
    amountPaid: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "neft_rtgs", "challan", "cheque", "card"],
      default: "bank_transfer",
    },
    challanNumber: { type: String, default: "", trim: true },
    status: { type: String, enum: ["paid", "scheduled", "reconciled"], default: "paid" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// 7. Track Expense Transactions
const financeExpenseSchema = new mongoose.Schema(
  {
    expenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    paymentType: {
      type: String,
      enum: ["cash", "credit", "installment", "bank_transfer"],
      default: "cash",
      index: true,
    },
    installmentDetails: {
      totalInstallments: { type: Number, default: 1, min: 1 },
      currentInstallment: { type: Number, default: 1, min: 1 },
      installmentAmount: { type: Number, default: 0, min: 0 },
      frequency: { type: String, default: "Monthly" },
    },
    vendorName: { type: String, default: "", trim: true },
    receiptNumber: { type: String, default: "", trim: true },
    date: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ["paid", "partial", "unpaid"], default: "paid", index: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// 8. Purchase Transactions
const financePurchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vendorName: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, default: 0, min: 0 },
    purchaseDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["paid", "partial", "outstanding", "overdue"],
      default: "outstanding",
      index: true,
    },
    items: [
      {
        name: { type: String, trim: true, default: "General Purchase Item" },
        quantity: { type: Number, default: 1, min: 1 },
        unitCost: { type: Number, default: 0, min: 0 },
        total: { type: Number, default: 0, min: 0 },
      },
    ],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// 9. Chart of Accounts (Preloaded & Custom)
const financeAccountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["asset", "liability", "equity", "revenue", "expense"],
      required: true,
      index: true,
    },
    subType: { type: String, default: "current", trim: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    isPreloaded: { type: Boolean, default: false },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

// 10. Journals (Double-Entry System)
const financeJournalSchema = new mongoose.Schema(
  {
    journalNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    date: { type: Date, default: Date.now, index: true },
    reference: { type: String, default: "", trim: true },
    memo: { type: String, required: true, trim: true },
    entries: [
      {
        accountCode: { type: String, required: true },
        accountName: { type: String, required: true },
        type: { type: String, enum: ["debit", "credit"], required: true },
        amount: { type: Number, required: true, min: 0.01 },
        description: { type: String, default: "" },
      },
    ],
    totalDebit: { type: Number, required: true, min: 0 },
    totalCredit: { type: Number, required: true, min: 0 },
    isBalanced: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "posted"], default: "posted", index: true },
    postedBy: { type: String, default: "Admin", trim: true },
  },
  { timestamps: true }
);

// 11. Create Customers & Vendors
const financeContactSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["customer", "vendor", "both"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    mobile: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    taxNumber: { type: String, default: "", trim: true }, // GSTIN / PAN
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// 12. Internal Cash Transfer
const financeTransferSchema = new mongoose.Schema(
  {
    transferNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    fromAccountCode: { type: String, required: true },
    fromAccountName: { type: String, required: true },
    toAccountCode: { type: String, required: true },
    toAccountName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    transferFee: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
    reference: { type: String, default: "", trim: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const FinanceEstimation =
  mongoose.models.AdminFinanceEstimation || mongoose.model("AdminFinanceEstimation", financeEstimationSchema);

export const FinanceTaxRate =
  mongoose.models.AdminFinanceTaxRate || mongoose.model("AdminFinanceTaxRate", financeTaxRateSchema);

export const FinanceTaxZone =
  mongoose.models.AdminFinanceTaxZone || mongoose.model("AdminFinanceTaxZone", financeTaxZoneSchema);

export const FinanceTaxCategory =
  mongoose.models.AdminFinanceTaxCategory || mongoose.model("AdminFinanceTaxCategory", financeTaxCategorySchema);

export const FinanceTaxAgency =
  mongoose.models.AdminFinanceTaxAgency || mongoose.model("AdminFinanceTaxAgency", financeTaxAgencySchema);

export const FinanceTaxPayment =
  mongoose.models.AdminFinanceTaxPayment || mongoose.model("AdminFinanceTaxPayment", financeTaxPaymentSchema);

export const FinanceExpense =
  mongoose.models.AdminFinanceExpense || mongoose.model("AdminFinanceExpense", financeExpenseSchema);

export const FinancePurchase =
  mongoose.models.AdminFinancePurchase || mongoose.model("AdminFinancePurchase", financePurchaseSchema);

export const FinanceAccount =
  mongoose.models.AdminFinanceAccount || mongoose.model("AdminFinanceAccount", financeAccountSchema);

export const FinanceJournal =
  mongoose.models.AdminFinanceJournal || mongoose.model("AdminFinanceJournal", financeJournalSchema);

export const FinanceContact =
  mongoose.models.AdminFinanceContact || mongoose.model("AdminFinanceContact", financeContactSchema);

export const FinanceTransfer =
  mongoose.models.AdminFinanceTransfer || mongoose.model("AdminFinanceTransfer", financeTransferSchema);
