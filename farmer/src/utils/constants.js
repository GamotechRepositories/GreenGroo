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

export const REGISTRATION_STATUS = {
  REGISTERED: "REGISTERED",
  ACTIVE: "ACTIVE",
};

export const KYC_STATUS = {
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const GENDER_OPTIONS = ["Male", "Female", "Other"];

export const PREFERRED_LANGUAGES = ["Marathi", "Hindi", "English"];

export const AREA_UNITS = ["Acre", "Hectare"];

export const SOIL_TYPES = ["Black Soil", "Red Soil", "Sandy", "Loamy", "Laterite", "Other"];

export const IRRIGATION_TYPES = ["Drip", "Sprinkler", "Flood", "Rainfed", "Canal"];

export const WATER_SOURCES = ["Borewell", "Well", "Canal", "River", "Pond", "Rainwater"];

export const FARMING_METHODS = ["Conventional", "Mixed", "Natural"];

export const FARMING_TYPES = ["Organic", "Conventional"];

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
  { to: "/farmer/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/farmer/market-prices", label: "Market Prices", icon: "market" },
  { to: "/farmer/community", label: "Farmer Community", icon: "community" },
  { to: "/farmer/schemes", label: "Govt Schemes", icon: "schemes" },
  { to: "/farmer/products", label: "Product", icon: "products" },
  { to: "/farmer/harvest-orders", label: "Harvest Order", icon: "harvest" },
  { to: "/farmer/earnings", label: "Earning", icon: "earnings" },
  { to: "/farmer/documents", label: "Document", icon: "documents" },
  {
    id: "profile",
    label: "Profile",
    icon: "profile",
    children: [
      { to: "/farmer/profile", label: "Farmer Profile" },
      { to: "/farmer/farm-profile", label: "Farm Profile" },
      { to: "/farmer/farm-location", label: "Farm Location" },
    ],
  },
];

export const MANAGER_SIDEBAR_ITEMS = [
  { to: "/farmer/manager/dashboard", label: "Dashboard", icon: "dashboard" },
  {
    id: "farmers",
    label: "Farmers",
    icon: "community",
    children: [
      { to: "/farmer/manager/farmers", label: "All Farmers" },
      { to: "/farmer/manager/farmers/add", label: "Add Farmer" },
    ],
  },
  {
    id: "products",
    label: "Products",
    icon: "products",
    children: [
      { to: "/farmer/manager/products", label: "All Products" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "inventory",
    children: [
      { to: "/farmer/manager/inventory", label: "All Inventory" },
      { to: "/farmer/manager/inventory/history", label: "Inventory History" },
    ],
  },
  {
    id: "orders",
    label: "Orders",
    icon: "orders",
    children: [
      { to: "/farmer/manager/orders", label: "All Orders" },
      { to: "/farmer/manager/orders/create", label: "Create Order" },
    ],
  },
  { to: "/farmer/manager/earnings", label: "Earnings", icon: "earnings" },
  { to: "/farmer/manager/documents", label: "Documents", icon: "documents" },
  { to: "/farmer/manager/profile", label: "Profile", icon: "profile" },
];

export const ROLES = {
  FARMER: "FARMER",
  FARMER_MANAGER: "FARMER_MANAGER",
  VENDOR: "VENDOR",
};

/** Selling routes require approved documents when verification is enforced */
export const SELLING_ROUTE_PREFIXES = [
  "/farmer/products",
  "/farmer/harvest-orders",
  "/farmer/earnings",
];
