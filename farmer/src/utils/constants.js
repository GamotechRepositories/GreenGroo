export const FARMER_COLORS = {
  primary: "#2E7D32",
  secondary: "#4CAF50",
  light: "#E8F5E9",
  background: "#F7F2E8",
  card: "#FFFFFF",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  warning: "#F59E0B",
  error: "#DC2626",
};

export const FARMER_STORAGE_KEY = "greengroo_farmer_auth";

export const DOCUMENT_TYPES = [
  { id: "aadhaar", name: "Aadhaar / ID Proof", required: false },
  { id: "pan", name: "PAN Card", required: false },
  { id: "bank", name: "Bank Details", required: false },
  { id: "address", name: "Address Proof", required: false },
  { id: "other", name: "Other Documents", required: false },
];

export const VERIFICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  NOT_UPLOADED: "not_uploaded",
};

export const PRODUCT_STATUS = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Out of Stock",
  "Inactive",
];

/** Status options shown on add / edit product form */
export const FARMER_PRODUCT_FORM_STATUS = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Out of Stock",
  "Inactive",
];

export const PRODUCT_UNITS = [
  "Kg",
  "Gram",
  "Quintal",
  "Litre",
  "ml",
  "Piece",
  "Dozen",
  "Packet",
  "Box",
  "Bundle",
  "Bag",
];

export const PRICING_TYPES = [
  "Fixed Price",
  "Per Kg",
  "Per Gram",
  "Per Piece",
  "Per Litre",
  "Per Packet",
  "Variant Pricing",
  "Bulk Pricing",
];

export const ORDER_STATUS = [
  "New",
  "Confirmed",
  "Processing",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
];

export const PAYMENT_STATUS = ["Pending", "Processing", "Paid", "Failed"];

export const STOCK_REASONS = ["Sale", "Harvest", "Damage", "Manual Update", "Other"];

export const STOCK_GRADES = ["Grade A", "Grade B"];

export const SIDEBAR_ITEMS = [
  { to: "/farmer/documents", label: "Documents", icon: "documents" },
  { to: "/farmer/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/farmer/products", label: "Products", icon: "products" },
  { to: "/farmer/inventory", label: "Inventory", icon: "inventory" },
  { to: "/farmer/orders", label: "Orders", icon: "orders" },
  { to: "/farmer/earnings", label: "Earnings", icon: "earnings" },
  { to: "/farmer/profile", label: "Profile", icon: "profile" },
];

/** Selling routes require approved documents when verification is enforced */
export const SELLING_ROUTE_PREFIXES = [
  "/farmer/products",
  "/farmer/inventory",
  "/farmer/orders",
  "/farmer/earnings",
];
