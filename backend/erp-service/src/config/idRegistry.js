/**
 * GreenGrocc Professional Master ID and Coding System
 * Source of truth: id naming.pdf — VERSION 2.0 ENTERPRISE ERP CODING
 *
 * Master structure:
 *   GGC-[MODULE]-[LOCATION/TYPE]-[DATE/SERIAL]
 *
 * Serial widths follow the PDF v2.0 examples. Widths are configurable
 * here rather than invented at call sites. IDs are never reused.
 */

export const COMPANY_PREFIX = "GGC";
export const COMPANY_NAME = "GreenGrocc";

/** Crop short codes from PDF page 3. */
export const CROP_CODES = {
  TOMATO: "TOM",
  ONION: "ONI",
  POTATO: "POT",
  CARROT: "CAR",
  CUCUMBER: "CUC",
  SPINACH: "SPI",
};

export const CROP_CODE_BY_NAME = {
  tomato: "TOM",
  onion: "ONI",
  potato: "POT",
  carrot: "CAR",
  cucumber: "CUC",
  spinach: "SPI",
  palak: "SPI",
  cabbage: "CAB",
  cauliflower: "CAU",
  brinjal: "BRI",
  eggplant: "BRI",
  chilli: "CHI",
  chili: "CHI",
  capsicum: "CAP",
  beans: "BEA",
  okra: "OKR",
  bhindi: "OKR",
  garlic: "GAR",
  ginger: "GIN",
  lemon: "LEM",
  mango: "MAN",
  banana: "BAN",
};

export const CROP_CATEGORIES = {
  VEG: "VEG",
  FRUIT: "FRT",
  GRAIN: "GRN",
  PULSE: "PLS",
  SPICE: "SPC",
  OTHER: "OTH",
};

export const GRADES = ["A", "B", "C"];

export const ERP_ROLES = [
  "CEO",
  "ADMIN",
  "VENDOR",
  "FARMER_MANAGER",
  "FARMER",
  "COLLECTION_CENTRE_STAFF",
  "WAREHOUSE_STAFF",
  "DRIVER",
  "HR",
  "FINANCE",
  "QUALITY_INSPECTOR",
  "CUSTOMER_SERVICE",
  "MANAGER",
];

export const CRM_ACTIVITY_TYPES = [
  "CALL",
  "WHATSAPP",
  "EMAIL",
  "COMPLAINT",
  "FOLLOWUP",
  "FEEDBACK",
];

export const DELIVERY_STATUSES = [
  "PICKUP",
  "STARTED",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
  "FAILED",
];

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
  "LOGIN",
  "LOGOUT",
  "STATUS_CHANGE",
  "PAYMENT",
  "INVENTORY_ADJUSTMENT",
  "GRADE_CHANGE",
  "ORDER_CHANGE",
];

/**
 * Detect entity from a business ID. Longer prefixes must be checked first
 * so GGC-INVCE is not mistaken for GGC-INV.
 */
export const ID_PREFIX_ORDER = [
  { prefix: "GGC-INVCE", module: "INVCE", entity: "invoice" },
  { prefix: "GGC-ERP", module: "ERP", entity: "erpTransaction" },
  { prefix: "GGC-ANL", module: "ANL", entity: "analytics" },
  { prefix: "GGC-API", module: "API", entity: "api" },
  { prefix: "GGC-AUD", module: "AUD", entity: "audit" },
  { prefix: "GGC-ATT", module: "ATT", entity: "attendance" },
  { prefix: "GGC-ART", module: "ART", entity: "article" },
  { prefix: "GGC-CRP", module: "CRP", entity: "crop" },
  { prefix: "GGC-CRT", module: "CRT", entity: "crate" },
  { prefix: "GGC-CUS", module: "CUS", entity: "customer" },
  { prefix: "GGC-CRM", module: "CRM", entity: "crmActivity" },
  { prefix: "GGC-CS-", module: "CS", entity: "coldStorage" },
  { prefix: "GGC-CC-", module: "CC", entity: "collectionCentre" },
  { prefix: "GGC-DS-", module: "DS", entity: "darkStore" },
  { prefix: "GGC-DSP", module: "DSP", entity: "dispatch" },
  { prefix: "GGC-DEL", module: "DEL", entity: "delivery" },
  { prefix: "GGC-DMG", module: "DMG", entity: "damage" },
  { prefix: "GGC-DRV", module: "DRV", entity: "driver" },
  { prefix: "GGC-EMP", module: "EMP", entity: "employee" },
  { prefix: "GGC-FIN", module: "FIN", entity: "finance" },
  { prefix: "GGC-FRM", module: "FM", entity: "farm" }, // v1 alias, maps to farm
  { prefix: "GGC-FM-", module: "FM", entity: "farm" },
  { prefix: "GGC-FR-", module: "FR", entity: "farmer" },
  { prefix: "GGC-GRN", module: "GRN", entity: "goodsReceipt" },
  { prefix: "GGC-INV-", module: "INV", entity: "inventory" },
  { prefix: "GGC-ORD", module: "ORD", entity: "order" },
  { prefix: "GGC-PAY", module: "PAY", entity: "payment" },
  { prefix: "GGC-PKG", module: "PKG", entity: "packaging" },
  { prefix: "GGC-PRC", module: "PRC", entity: "procurement" },
  { prefix: "GGC-PO-", module: "PO", entity: "purchaseOrder" },
  { prefix: "GGC-QC-", module: "QC", entity: "qualityCheck" },
  { prefix: "GGC-QR-", module: "QR", entity: "qr" },
  { prefix: "GGC-REC", module: "REC", entity: "recruitment" },
  { prefix: "GGC-RET", module: "RET", entity: "return" },
  { prefix: "GGC-USR", module: "USR", entity: "userLogin" },
  { prefix: "GGC-VEN", module: "VEN", entity: "vendor" },
  { prefix: "GGC-VEH", module: "VEH", entity: "vehicle" },
  { prefix: "GGC-WH-", module: "WH", entity: "warehouse" },
  { prefix: "GGC-BAT", module: "BAT", entity: "batch" },
  { prefix: "DST-", module: "DST", entity: "district" },
  { prefix: "TLK-", module: "TLK", entity: "taluka" },
  { prefix: "VIL-", module: "VIL", entity: "village" },
  { prefix: "ST-", module: "ST", entity: "state" },
  { prefix: "GGC", module: "COM", entity: "company" },
];

export function detectEntity(businessId = "") {
  const id = String(businessId).trim().toUpperCase();
  for (const row of ID_PREFIX_ORDER) {
    if (id.startsWith(row.prefix)) return row;
  }
  return null;
}

function pad(n, width) {
  return String(n).padStart(width, "0");
}

function req(parts, keys) {
  for (const key of keys) {
    if (!parts[key]) {
      throw new Error(`ID generation for this module requires "${key}"`);
    }
  }
}

/**
 * Module registry.
 * counterKey must be stable. Deleting a record must NOT reset the counter.
 */
export const MODULES = {
  COM: {
    description: "Company ID — fixed GGC",
    formatHint: "GGC",
    generate: () => COMPANY_PREFIX,
  },
  ST: {
    description: "State ID",
    formatHint: "ST-{stateCode}",
    generate: (p) => {
      req(p, ["stateCode"]);
      return `ST-${String(p.stateCode).toUpperCase()}`;
    },
  },
  DST: {
    description: "District ID (PDF: DST-NK, DST-PN, DST-ND)",
    formatHint: "DST-{districtCode}",
    generate: (p) => {
      req(p, ["districtCode"]);
      return `DST-${String(p.districtCode).toUpperCase()}`;
    },
  },
  TLK: {
    description: "Taluka ID (PDF: TLK-YEL)",
    formatHint: "TLK-{talukaCode}",
    generate: (p) => {
      req(p, ["talukaCode"]);
      return `TLK-${String(p.talukaCode).toUpperCase()}`;
    },
  },
  VIL: {
    description: "Village ID (PDF: VIL-SIN-0001)",
    formatHint: "VIL-{talukaCode}-{serial}",
    serialWidth: 4,
    counterKey: (p) => `village-${String(p.talukaCode || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["talukaCode"]);
      return `VIL-${String(p.talukaCode).toUpperCase()}-${pad(seq, 4)}`;
    },
  },
  FR: {
    description: "Farmer Master ID",
    formatHint: "GGC-FR-{state}-{district}-{taluka}-{serial}",
    example: "GGC-FR-MH-NK-SIN-00001",
    serialWidth: 5,
    counterKey: (p) =>
      `farmer-${String(p.state || "MH").toUpperCase()}-${String(p.district || "XX").toUpperCase()}-${String(p.taluka || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["state", "district", "taluka"]);
      return `${COMPANY_PREFIX}-FR-${String(p.state).toUpperCase()}-${String(p.district).toUpperCase()}-${String(p.taluka).toUpperCase()}-${pad(seq, 5)}`;
    },
  },
  FM: {
    description: "Farm Master ID (PDF v2 prefix FM; v1 used FRM)",
    formatHint: "GGC-FM-{farmerSerial}-{serial}",
    example: "GGC-FM-00001-01",
    serialWidth: 2,
    counterKey: (p) => `farm-${p.farmerSerial || p.farmerId}`,
    generate: (p, seq) => {
      req(p, ["farmerSerial"]);
      return `${COMPANY_PREFIX}-FM-${p.farmerSerial}-${pad(seq, 2)}`;
    },
  },
  CRP: {
    description: "Crop Master ID — category + crop + variety + serial (shared across farmers)",
    formatHint: "GGC-CRP-{category}-{crop}-{variety}-{serial}",
    example: "GGC-CRP-VEG-TOM-BAJ-00002",
    serialWidth: 5,
    counterKey: (p) =>
      `crop-${String(p.category || "VEG").toUpperCase()}-${String(p.crop || "XXX").toUpperCase()}-${String(p.variety || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["category", "crop"]);
      const variety = String(p.variety || "XXX").toUpperCase();
      return `${COMPANY_PREFIX}-CRP-${String(p.category).toUpperCase()}-${String(p.crop).toUpperCase()}-${variety}-${pad(seq, 5)}`;
    },
  },
  ART: {
    description: "Article / Product Master ID — category + crop + variety + serial (product) or crop + grade + serial (ERP article)",
    formatHint: "GGC-ART-{category}-{crop}-{variety}-{serial}",
    example: "GGC-ART-VEG-TOM-BAJ-00001",
    serialWidth: 5,
    counterKey: (p) =>
      p.category && !p.grade
        ? `article-prod-${String(p.category || "VEG").toUpperCase()}-${String(p.crop || "XXX").toUpperCase()}-${String(p.variety || "XXX").toUpperCase()}`
        : `article-${String(p.crop || "XXX").toUpperCase()}-${String(p.grade || "A").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["crop"]);
      if (p.category && !p.grade) {
        const variety = String(p.variety || "XXX").toUpperCase();
        return `${COMPANY_PREFIX}-ART-${String(p.category).toUpperCase()}-${String(p.crop).toUpperCase()}-${variety}-${pad(seq, 5)}`;
      }
      req(p, ["grade"]);
      return `${COMPANY_PREFIX}-ART-${String(p.crop).toUpperCase()}-${String(p.grade).toUpperCase()}-${pad(seq, 5)}`;
    },
  },
  BAT: {
    description: "Batch / Lot Master ID",
    formatHint: "GGC-BAT-{YYYYMMDD}-{serial}",
    example: "GGC-BAT-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `batch-${p.date || todayYmd()}`,
    generate: (p, seq) => {
      const date = p.date || todayYmd();
      return `${COMPANY_PREFIX}-BAT-${date}-${pad(seq, 5)}`;
    },
  },
  CRT: {
    description: "Crate Master ID",
    formatHint: "GGC-CRT-{serial}",
    example: "GGC-CRT-00001",
    serialWidth: 5,
    counterKey: () => "crate",
    generate: (_p, seq) => `${COMPANY_PREFIX}-CRT-${pad(seq, 5)}`,
  },
  QR: {
    description: "QR Master ID",
    formatHint: "GGC-QR-{serial}",
    example: "GGC-QR-00001",
    serialWidth: 5,
    counterKey: () => "qr",
    generate: (_p, seq) => `${COMPANY_PREFIX}-QR-${pad(seq, 5)}`,
  },
  CC: {
    description: "Collection Centre ID (state + district + taluka + village + serial)",
    formatHint: "GGC-CC-{state}-{district}-{taluka}-{village}-{serial}",
    example: "GGC-CC-MH-NK-TLK-VIL-001",
    serialWidth: 3,
    counterKey: (p) =>
      `cc-${String(p.state || "MH").toUpperCase()}-${String(p.district || "XX").toUpperCase()}-${String(p.taluka || "XXX").toUpperCase()}-${String(p.village || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      const state = String(p.state || "MH").toUpperCase();
      const district = String(p.district || "XX").toUpperCase();
      const taluka = String(p.taluka || "XXX").toUpperCase();
      const village = String(p.village || "XXX").toUpperCase();
      return `${COMPANY_PREFIX}-CC-${state}-${district}-${taluka}-${village}-${pad(seq, 3)}`;
    },
  },
  WH: {
    description: "Warehouse ID",
    formatHint: "GGC-WH-{city}-{serial}",
    example: "GGC-WH-MUM-00001",
    serialWidth: 5,
    counterKey: (p) => `wh-${String(p.city || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["city"]);
      return `${COMPANY_PREFIX}-WH-${String(p.city).toUpperCase()}-${pad(seq, 5)}`;
    },
  },
  CS: {
    description: "Cold Storage ID",
    formatHint: "GGC-CS-{city}-{serial}",
    example: "GGC-CS-MUM-001",
    serialWidth: 3,
    counterKey: (p) => `cs-${String(p.city || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["city"]);
      return `${COMPANY_PREFIX}-CS-${String(p.city).toUpperCase()}-${pad(seq, 3)}`;
    },
  },
  DS: {
    description: "Dark Store ID",
    formatHint: "GGC-DS-{city}-{serial}",
    example: "GGC-DS-MUM-001",
    serialWidth: 3,
    counterKey: (p) => `ds-${String(p.city || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["city"]);
      return `${COMPANY_PREFIX}-DS-${String(p.city).toUpperCase()}-${pad(seq, 3)}`;
    },
  },
  INV: {
    description: "Inventory Master ID (location-aware)",
    formatHint: "GGC-INV-{location}-{article}-{serial}",
    example: "GGC-INV-WH001-TOM-000001",
    serialWidth: 6,
    counterKey: (p) =>
      `inv-${String(p.location || "LOC").toUpperCase()}-${String(p.article || "ART").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["location", "article"]);
      return `${COMPANY_PREFIX}-INV-${String(p.location).toUpperCase()}-${String(p.article).toUpperCase()}-${pad(seq, 6)}`;
    },
  },
  PRC: {
    description: "Procurement ID",
    formatHint: "GGC-PRC-{YYYYMMDD}-{serial}",
    example: "GGC-PRC-20260830-000001",
    serialWidth: 6,
    counterKey: (p) => `prc-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-PRC-${p.date || todayYmd()}-${pad(seq, 6)}`,
  },
  PO: {
    description: "Purchase Order ID",
    formatHint: "GGC-PO-{YYYYMMDD}-{serial}",
    example: "GGC-PO-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `po-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-PO-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  GRN: {
    description: "Goods Receipt Note ID",
    formatHint: "GGC-GRN-{YYYYMMDD}-{serial}",
    example: "GGC-GRN-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `grn-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-GRN-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  VEN: {
    description: "Vendor Master ID",
    formatHint: "GGC-VEN-{category}-{serial}",
    example: "GGC-VEN-PKG-00001",
    serialWidth: 5,
    counterKey: (p) => `ven-${String(p.category || "GEN").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["category"]);
      return `${COMPANY_PREFIX}-VEN-${String(p.category).toUpperCase()}-${pad(seq, 5)}`;
    },
  },
  FIN: {
    description: "Finance Account ID",
    formatHint: "GGC-FIN-{type}-{YYYYMMDD}-{serial}",
    example: "GGC-FIN-REV-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `fin-${String(p.type || "GEN").toUpperCase()}-${p.date || todayYmd()}`,
    generate: (p, seq) => {
      const type = String(p.type || "GEN").toUpperCase();
      return `${COMPANY_PREFIX}-FIN-${type}-${p.date || todayYmd()}-${pad(seq, 5)}`;
    },
  },
  PAY: {
    description: "Payment ID",
    formatHint: "GGC-PAY-{YYYYMMDD}-{serial}",
    example: "GGC-PAY-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `pay-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-PAY-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  INVCE: {
    description: "Invoice ID (PDF v2 prefix INVCE, not INV — INV is inventory)",
    formatHint: "GGC-INVCE-{YYYYMMDD}-{serial}",
    example: "GGC-INVCE-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `invce-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-INVCE-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  EMP: {
    description: "Employee / HR Master ID",
    formatHint: "GGC-EMP-{department}-{serial}",
    example: "GGC-EMP-OPS-000001",
    serialWidth: 6,
    counterKey: (p) => `emp-${String(p.department || "GEN").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["department"]);
      return `${COMPANY_PREFIX}-EMP-${String(p.department).toUpperCase()}-${pad(seq, 6)}`;
    },
  },
  REC: {
    description: "Recruitment ID",
    formatHint: "GGC-REC-{YYYYMMDD}-{serial}",
    example: "GGC-REC-20260830-000001",
    serialWidth: 6,
    counterKey: (p) => `rec-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-REC-${p.date || todayYmd()}-${pad(seq, 6)}`,
  },
  ATT: {
    description: "Attendance ID (one per employee per day)",
    formatHint: "GGC-ATT-{employeeSerial}-{YYYYMMDD}",
    example: "GGC-ATT-000001-20260830",
    generate: (p) => {
      req(p, ["employeeSerial", "date"]);
      return `${COMPANY_PREFIX}-ATT-${p.employeeSerial}-${p.date}`;
    },
  },
  CUS: {
    description: "Customer Master ID",
    formatHint: "GGC-CUS-{city}-{serial}",
    example: "GGC-CUS-MUM-000001",
    serialWidth: 6,
    counterKey: (p) => `cus-${String(p.city || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["city"]);
      return `${COMPANY_PREFIX}-CUS-${String(p.city).toUpperCase()}-${pad(seq, 6)}`;
    },
  },
  CRM: {
    description: "CRM Activity ID",
    formatHint: "GGC-CRM-{customerSerial}-{YYYYMMDD}-{serial}",
    example: "GGC-CRM-000001-20260830-001",
    serialWidth: 3,
    counterKey: (p) => `crm-${p.customerSerial}-${p.date || todayYmd()}`,
    generate: (p, seq) => {
      req(p, ["customerSerial"]);
      return `${COMPANY_PREFIX}-CRM-${p.customerSerial}-${p.date || todayYmd()}-${pad(seq, 3)}`;
    },
  },
  ORD: {
    description: "Customer Order ID",
    formatHint: "GGC-ORD-{YYYYMMDD}-{serial}",
    example: "GGC-ORD-20240830-00001",
    serialWidth: 5,
    counterKey: (p) => `ord-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-ORD-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  DEL: {
    description: "Delivery ID",
    formatHint: "GGC-DEL-{YYYYMMDD}-{serial}",
    example: "GGC-DEL-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `del-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-DEL-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  VEH: {
    description: "Vehicle ID (PDF v2: VEH, not VH)",
    formatHint: "GGC-VEH-{type}-{serial}",
    example: "GGC-VEH-VAN-00001",
    serialWidth: 5,
    counterKey: (p) => `veh-${String(p.type || "VAN").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["type"]);
      return `${COMPANY_PREFIX}-VEH-${String(p.type).toUpperCase()}-${pad(seq, 5)}`;
    },
  },
  DRV: {
    description: "Driver ID (PDF: DRV, DRY was crossed out)",
    formatHint: "GGC-DRV-{city}-{serial}",
    example: "GGC-DRV-MUM-00001",
    serialWidth: 5,
    counterKey: (p) => `drv-${String(p.city || "XXX").toUpperCase()}`,
    generate: (p, seq) => {
      req(p, ["city"]);
      return `${COMPANY_PREFIX}-DRV-${String(p.city).toUpperCase()}-${pad(seq, 5)}`;
    },
  },
  QC: {
    description: "Quality Check ID",
    formatHint: "GGC-QC-{YYYYMMDD}-{serial}",
    example: "GGC-QC-20260830-000001",
    serialWidth: 6,
    counterKey: (p) => `qc-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-QC-${p.date || todayYmd()}-${pad(seq, 6)}`,
  },
  PKG: {
    description: "Packaging ID",
    formatHint: "GGC-PKG-{YYYYMMDD}-{serial}",
    example: "GGC-PKG-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `pkg-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-PKG-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  DSP: {
    description: "Dispatch ID",
    formatHint: "GGC-DSP-{YYYYMMDD}-{serial}",
    example: "GGC-DSP-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `dsp-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-DSP-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  RET: {
    description: "Return ID",
    formatHint: "GGC-RET-{YYYYMMDD}-{serial}",
    example: "GGC-RET-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `ret-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-RET-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  DMG: {
    description: "Damage ID (date-based primary format from PDF)",
    formatHint: "GGC-DMG-{YYYYMMDD}-{serial}",
    example: "GGC-DMG-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `dmg-${p.date || todayYmd()}`,
    generate: (p, seq) => `${COMPANY_PREFIX}-DMG-${p.date || todayYmd()}-${pad(seq, 5)}`,
  },
  USR: {
    description: "User Login ID",
    formatHint: "GGC-USR-{serial}",
    example: "GGC-USR-00001",
    serialWidth: 5,
    counterKey: () => "usr",
    generate: (_p, seq) => `${COMPANY_PREFIX}-USR-${pad(seq, 5)}`,
  },
  AUD: {
    description: "Audit Log ID",
    formatHint: "GGC-AUD-{module}-{YYYYMMDD}-{serial}",
    example: "GGC-AUD-INV-20260830-00001",
    serialWidth: 5,
    counterKey: (p) => `aud-${String(p.auditModule || "GEN").toUpperCase()}-${p.date || todayYmd()}`,
    generate: (p, seq) => {
      const mod = String(p.auditModule || "GEN").toUpperCase();
      return `${COMPANY_PREFIX}-AUD-${mod}-${p.date || todayYmd()}-${pad(seq, 5)}`;
    },
  },
  ANL: {
    description: "Analytics Report ID",
    formatHint: "GGC-ANL-{report}-{YYYYMMDD}",
    example: "GGC-ANL-SALES-20260830",
    generate: (p) => {
      req(p, ["report"]);
      return `${COMPANY_PREFIX}-ANL-${String(p.report).toUpperCase()}-${p.date || todayYmd()}`;
    },
  },
  API: {
    description: "API Master ID — never embed secrets",
    formatHint: "GGC-API-{system}-{version}-{serial}",
    example: "GGC-API-ERP-V1-000001",
    serialWidth: 6,
    counterKey: (p) =>
      `api-${String(p.system || "ERP").toUpperCase()}-${String(p.version || "V1").toUpperCase()}`,
    generate: (p, seq) => {
      const system = String(p.system || "ERP").toUpperCase();
      const version = String(p.version || "V1").toUpperCase();
      return `${COMPANY_PREFIX}-API-${system}-${version}-${pad(seq, 6)}`;
    },
  },
  ERP: {
    description: "ERP Transaction ID",
    formatHint: "GGC-ERP-{module}-{YYYYMMDD}-{serial}",
    example: "GGC-ERP-SALES-20260830-000001",
    serialWidth: 6,
    counterKey: (p) => `erp-${String(p.txnModule || "GEN").toUpperCase()}-${p.date || todayYmd()}`,
    generate: (p, seq) => {
      const mod = String(p.txnModule || "GEN").toUpperCase();
      return `${COMPANY_PREFIX}-ERP-${mod}-${p.date || todayYmd()}-${pad(seq, 6)}`;
    },
  },
};

export function todayYmd(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function farmerSerialFromId(farmerId = "") {
  const parts = String(farmerId).split("-");
  return parts[parts.length - 1] || farmerId.replace(/\W/g, "").slice(-5).padStart(5, "0");
}

export function cropCodeFromName(name = "") {
  const key = String(name).trim().toLowerCase();
  if (CROP_CODE_BY_NAME[key]) return CROP_CODE_BY_NAME[key];
  const hit = Object.keys(CROP_CODE_BY_NAME).find((n) => key.includes(n));
  if (hit) return CROP_CODE_BY_NAME[hit];
  return String(name)
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
}

/** 3-letter variety code for crop IDs (e.g. Bajra → BAJ). */
export function varietyCodeFromName(name = "") {
  const raw = String(name || "").trim();
  if (!raw) return "XXX";
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
  if (!cleaned) return "XXX";
  return cleaned.slice(0, 3).toUpperCase().padEnd(3, "X");
}

export function categoryFromName(name = "") {
  const n = String(name).toLowerCase();
  if (/(mango|banana|apple|fruit|orange|grapes)/.test(n)) return "FRT";
  if (/(wheat|rice|grain|bajra|jowar)/.test(n)) return "GRN";
  if (/(dal|pulse|tur|moong)/.test(n)) return "PLS";
  if (/(chilli|turmeric|spice|cumin)/.test(n)) return "SPC";
  return "VEG";
}
