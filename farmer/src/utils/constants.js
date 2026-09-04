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

export const CROP_OPTIONS = [
  "Tomato",
  "Onion",
  "Potato",
  "Capsicum",
  "Brinjal",
  "Cabbage",
  "Cauliflower",
  "Okra",
  "Chilli",
  "Cotton",
  "Soybean",
  "Wheat",
  "Rice",
  "Sugarcane",
  "Grapes",
  "Pomegranate",
  "Banana",
  "Maize",
  "Groundnut",
  "Turmeric",
  "Other",
];

/** Standardized varieties so Crop ID stays same across farmers (select from list). */
export const CROP_VARIETY_COMMON = ["Hybrid", "Local", "Desi", "Improved", "Open Pollinated"];

export const CROP_VARIETY_BY_CROP = {
  Tomato: ["Bajeerao", "Abhinav", "Sahoo", "Namdhari", "Heemsohna", "Hybrid", "Local"],
  Onion: ["Nashik Red", "Agrifound Light Red", "Pusa Red", "Hybrid", "Local"],
  Potato: ["Kufri Jyoti", "Kufri Pukhraj", "Kufri Chandramukhi", "Hybrid", "Local"],
  Capsicum: ["California Wonder", "Indra", "Hybrid", "Local"],
  Brinjal: ["Pusa Purple Long", "Hybrid", "Local"],
  Cabbage: ["Golden Acre", "Hybrid", "Local"],
  Cauliflower: ["Pusa Snowball", "Hybrid", "Local"],
  Okra: ["Parbhani Kranti", "Hybrid", "Local"],
  Chilli: ["Guntur", "Byadgi", "Hybrid", "Local"],
  Cotton: ["Bt Hybrid", "Desi", "Hybrid", "Local"],
  Soybean: ["JS 335", "MAUS", "Hybrid", "Local"],
  Wheat: ["Lokwan", "HD 2967", "Hybrid", "Local"],
  Rice: ["Indrayani", "Kolam", "Basmati", "Hybrid", "Local"],
  Sugarcane: ["Co 86032", "Local"],
  Grapes: ["Thompson Seedless", "Sharad Seedless", "Local"],
  Pomegranate: ["Bhagwa", "Ganesh", "Local"],
  Banana: ["Grand Naine", "Robusta", "Local"],
  Maize: ["Hybrid", "Local"],
  Groundnut: ["TAG 24", "Hybrid", "Local"],
  Turmeric: ["Salem", "Rajapore", "Local"],
};

export function varietyOptionsForCrop(cropName = "") {
  const key = String(cropName || "").trim();
  const specific = CROP_VARIETY_BY_CROP[key];
  if (specific?.length) return [...specific, "Other"];
  return [...CROP_VARIETY_COMMON, "Other"];
}

export const CROP_UNITS = ["Kg", "Quintal", "Ton"];

export const CROP_STATUSES = ["Planned", "Growing", "Ready for Harvest", "Harvested", "Completed"];

export const CROP_STATUS_FLOW = {
  Planned: ["Planned", "Growing"],
  Growing: ["Growing", "Ready for Harvest"],
  "Ready for Harvest": ["Ready for Harvest", "Harvested"],
  Harvested: ["Harvested", "Completed"],
  Completed: ["Completed"],
};

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
  "Active",
  "Approved",
  "Rejected",
  "Out of Stock",
  "Low Stock",
  "Paused",
  "Inactive",
];

export const FARMER_PRODUCT_STATUSES = [
  "Draft",
  "Pending Approval",
  "Active",
  "Rejected",
  "Low Stock",
  "Out of Stock",
  "Paused",
];

export const FARMER_PRODUCT_UNITS = ["Kg", "Quintal", "Ton"];

export const PRODUCT_GRADE_OPTIONS = ["A", "B", "C"];

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

export const FARMER_ORDER_FILTERS = [
  { id: "new", label: "New Orders", to: "/farmer/orders/new" },
  { id: "preparing", label: "Preparing", to: "/farmer/orders/preparing" },
  { id: "ready", label: "Ready for Pickup", to: "/farmer/orders/ready" },
  { id: "completed", label: "Completed", to: "/farmer/orders/completed" },
  { id: "rejected", label: "Rejected", to: "/farmer/orders/rejected" },
];

export const ORDER_REJECTION_REASONS = [
  "Stock Unavailable",
  "Product Unavailable",
  "Quality Issue",
  "Pickup Issue",
  "Quantity Issue",
  "Other",
];

export const ORDER_PACKAGE_TYPES = ["Crate", "Bag", "Box", "Bundle", "Sack", "Other"];

export const PAYMENT_STATUS = ["Pending", "Processing", "Paid", "Failed"];

export const STOCK_REASONS = ["Sale", "Harvest", "Damage", "Manual Update", "Other"];

export const STOCK_GRADES = ["Grade A", "Grade B"];

export const SIDEBAR_ITEMS = [
  { to: "/farmer/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/farmer/market-prices", label: "Market Prices", icon: "market" },
  { to: "/farmer/community", label: "Farmer Community", icon: "community" },
  { to: "/farmer/schemes", label: "Govt Schemes", icon: "schemes" },
  {
    id: "crops",
    label: "Crops",
    icon: "crops",
    children: [
      { to: "/farmer/crops", label: "My Crops", end: true },
      { to: "/farmer/crops/add", label: "Add Crop" },
      { to: "/farmer/crop-planning", label: "Crop Planning" },
    ],
  },
  {
    id: "products",
    label: "Products",
    icon: "products",
    children: [
      { to: "/farmer/products", label: "My Products", end: true },
      { to: "/farmer/products/add", label: "Add Product" },
      { to: "/farmer/products/details", label: "Product Details" },
    ],
  },
  {
    id: "orders",
    label: "Orders",
    icon: "orders",
    children: [
      { to: "/farmer/orders/new", label: "New Orders" },
      { to: "/farmer/orders/preparing", label: "Preparing" },
      { to: "/farmer/orders/ready", label: "Ready for Pickup" },
      { to: "/farmer/orders/completed", label: "Completed" },
      { to: "/farmer/orders/rejected", label: "Rejected" },
      { to: "/farmer/harvest-orders", label: "Harvest Orders" },
    ],
  },
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
      { to: "/farmer/manager/products", label: "All Products", end: true },
      { to: "/farmer/manager/products/add", label: "Add Product" },
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
      { to: "/farmer/manager/orders", label: "All Orders", end: true },
      { to: "/farmer/manager/orders?tab=by-product", label: "Create Order by Product" },
      { to: "/farmer/manager/orders/create", label: "Create Order" },
    ],
  },
  { to: "/farmer/manager/earnings", label: "Earnings", icon: "earnings" },
  {
    id: "pickup",
    label: "Pickup / Driver",
    icon: "pickup",
    children: [
      { to: "/farmer/manager/pickups/ready", label: "Ready for Pickup" },
      { to: "/farmer/manager/pickups/assigned", label: "Assigned Pickups" },
      { to: "/farmer/manager/pickups/today", label: "Today's Pickups" },
      { to: "/farmer/manager/pickups/active", label: "Active Pickups" },
      { to: "/farmer/manager/pickups/incoming", label: "Incoming at Centre" },
      { to: "/farmer/manager/pickups/history", label: "Picked Up" },
    ],
  },
  {
    id: "quality",
    label: "Quality & Grading",
    icon: "quality",
    children: [
      { to: "/farmer/manager/quality/pending", label: "Pending Inspection" },
      { to: "/farmer/manager/quality/inspection", label: "Quality Inspection" },
      { to: "/farmer/manager/quality/grading", label: "Grading" },
      { to: "/farmer/manager/quality/completed", label: "Completed" },
    ],
  },
  { to: "/farmer/manager/documents", label: "Documents", icon: "documents" },
  { to: "/farmer/manager/profile", label: "Profile", icon: "profile" },
];

export const ROLES = {
  FARMER: "FARMER",
  FARMER_MANAGER: "FARMER_MANAGER",
  VENDOR: "VENDOR",
  DRIVER: "DRIVER",
};

/** Selling routes require approved documents when verification is enforced */
export const SELLING_ROUTE_PREFIXES = [
  "/farmer/products",
  "/farmer/harvest-orders",
  "/farmer/earnings",
];
