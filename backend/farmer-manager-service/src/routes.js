import express from "express";
import {
  getFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
  setFarmerStatus,
  farmerLogin,
  registerFarmer,
  submitFarmerKyc,
  getFarmerMe,
  updateFarmerSelfProfile,
  updateFarmerFarmProfile,
  updateFarmerFarmLocation,
  confirmFarmerFarmLocation,
  updateFarmerPassword,
  updateFarmerLoginStatus,
  getFarmerDashboard,
  getFarmerProducts,
  getFarmerProductById,
  createFarmerProduct,
  updateFarmerProduct,
  deleteFarmerProduct,
  getFarmerInventory,
  adjustFarmerStock,
  getStockHistory,
  updateFarmerInventoryItem,
  getFarmerOrders,
  getFarmerOrderById,
  updateFarmerOrder,
  updateFarmerOrderStatus,
  createFarmerOrder,
  deleteFarmerOrder,
  getFarmerEarnings,
  getFarmerDocuments,
  uploadFarmerDocument,
  updateFarmerDocumentStatus,
  deleteFarmerDocument,
  getManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
  setManagerStatus,
  getHarvestOrders,
  createHarvestOrder,
  updateHarvestOrder,
  deleteHarvestOrder,
  // Vendor auth
  vendorLogin,
  getVendorMe,
  getVendors,
  createVendor,
  updateVendor,
  getVendorDashboard,
  // Manager auth
  managerLogin,
  getManagerMe,
  getManagerFarmers,
  getManagerDashboard,
  getManagerAllProducts,
  getManagerAllOrders,
  getManagerAllInventory,
  getManagerAllDocuments,
  getManagerAllStockHistory,
  getManagerAllHarvestOrders,
  getManagerAllEarnings,
  assignFarmerManager,
} from "./controllers.js";
import { requireVendor, requireManager, requireFarmer } from "./middleware.js";

const farmerRouter = express.Router();
const vendorFarmerRouter = express.Router();
const vendorManagerRouter = express.Router();
const vendorAuthRouter = express.Router();
const vendorRouter = express.Router();
const managerAuthRouter = express.Router();
const managerRouter = express.Router();

// ------------------------------------
// FARMER AUTH & COMMON API
// ------------------------------------
farmerRouter.post("/login", farmerLogin);
farmerRouter.post("/register", registerFarmer);
farmerRouter.get("/me", requireFarmer, getFarmerMe);
farmerRouter.put("/me/profile", requireFarmer, updateFarmerSelfProfile);
farmerRouter.put("/me/farm", requireFarmer, updateFarmerFarmProfile);
farmerRouter.put("/me/farm-location", requireFarmer, updateFarmerFarmLocation);
farmerRouter.post("/me/farm-location/confirm", requireFarmer, confirmFarmerFarmLocation);
farmerRouter.get("/", getFarmers);
farmerRouter.post("/", createFarmer);
farmerRouter.get("/:farmerId", getFarmerById);
farmerRouter.put("/:farmerId", updateFarmer);
farmerRouter.delete("/:farmerId", deleteFarmer);
farmerRouter.patch("/:farmerId/status", setFarmerStatus);

farmerRouter.get("/:farmerId/dashboard", getFarmerDashboard);

// Products
farmerRouter.get("/:farmerId/products", getFarmerProducts);
farmerRouter.post("/:farmerId/products", createFarmerProduct);
farmerRouter.get("/:farmerId/products/:productId", getFarmerProductById);
farmerRouter.put("/:farmerId/products/:productId", updateFarmerProduct);
farmerRouter.delete("/:farmerId/products/:productId", deleteFarmerProduct);

// Inventory & Stock
farmerRouter.get("/:farmerId/inventory", getFarmerInventory);
farmerRouter.post("/:farmerId/inventory/adjust", adjustFarmerStock);
farmerRouter.post("/:farmerId/inventory/add", adjustFarmerStock);
farmerRouter.post("/:farmerId/inventory/remove", (req, res, next) => {
  req.body.change = -Math.abs(Number(req.body.change || req.body.quantity || 0));
  adjustFarmerStock(req, res, next);
});
farmerRouter.put("/:farmerId/inventory/:inventoryId", updateFarmerInventoryItem);
farmerRouter.get("/:farmerId/stock-history", getStockHistory);

// Orders
farmerRouter.get("/:farmerId/orders", getFarmerOrders);
farmerRouter.get("/farmers/:farmerId/orders", getFarmerOrders);
farmerRouter.post("/:farmerId/orders", createFarmerOrder);
farmerRouter.post("/farmers/:farmerId/orders", createFarmerOrder);
farmerRouter.get("/:farmerId/orders/:orderId", getFarmerOrderById);
farmerRouter.get("/farmers/:farmerId/orders/:orderId", getFarmerOrderById);
farmerRouter.put("/:farmerId/orders/:orderId", updateFarmerOrder);
farmerRouter.put("/farmers/:farmerId/orders/:orderId", updateFarmerOrder);
farmerRouter.patch("/:farmerId/orders/:orderId", updateFarmerOrder);
farmerRouter.patch("/farmers/:farmerId/orders/:orderId", updateFarmerOrder);
farmerRouter.patch("/:farmerId/orders/:orderId/status", updateFarmerOrderStatus);
farmerRouter.patch("/farmers/:farmerId/orders/:orderId/status", updateFarmerOrderStatus);
farmerRouter.delete("/:farmerId/orders/:orderId", deleteFarmerOrder);
farmerRouter.delete("/farmers/:farmerId/orders/:orderId", deleteFarmerOrder);

// Earnings
farmerRouter.get("/:farmerId/earnings", getFarmerEarnings);

// Harvest Orders
farmerRouter.get("/harvest-orders", getHarvestOrders);
farmerRouter.get("/:farmerId/harvest-orders", getHarvestOrders);
farmerRouter.post("/:farmerId/harvest-orders", createHarvestOrder);
farmerRouter.put("/:farmerId/harvest-orders/:id", updateHarvestOrder);
farmerRouter.delete("/:farmerId/harvest-orders/:id", deleteHarvestOrder);

// Documents
farmerRouter.get("/:farmerId/documents", getFarmerDocuments);
farmerRouter.post("/:farmerId/documents", uploadFarmerDocument);
farmerRouter.post("/:farmerId/kyc/submit", submitFarmerKyc);
farmerRouter.patch("/:farmerId/documents/:documentId/status", updateFarmerDocumentStatus);
farmerRouter.delete("/:farmerId/documents/:documentId", deleteFarmerDocument);

// ------------------------------------
// MANAGER LOGIN (unified — used by farmer panel)
// ------------------------------------
farmerRouter.post("/manager/login", managerLogin);


// ------------------------------------
// VENDOR FARMER MANAGEMENT API
// ------------------------------------
vendorFarmerRouter.get("/", getFarmers);
vendorFarmerRouter.post("/", createFarmer);
vendorFarmerRouter.get("/:farmerId", getFarmerById);
vendorFarmerRouter.put("/:farmerId", updateFarmer);
vendorFarmerRouter.delete("/:farmerId", deleteFarmer);
vendorFarmerRouter.patch("/:farmerId/status", setFarmerStatus);
vendorFarmerRouter.put("/:farmerId/password", updateFarmerPassword);
vendorFarmerRouter.put("/:farmerId/login-status", updateFarmerLoginStatus);
vendorFarmerRouter.put("/:farmerId/manager", assignFarmerManager);

vendorFarmerRouter.get("/:farmerId/products", getFarmerProducts);
vendorFarmerRouter.post("/:farmerId/products", createFarmerProduct);
vendorFarmerRouter.get("/:farmerId/products/:productId", getFarmerProductById);
vendorFarmerRouter.put("/:farmerId/products/:productId", updateFarmerProduct);
vendorFarmerRouter.delete("/:farmerId/products/:productId", deleteFarmerProduct);

vendorFarmerRouter.get("/:farmerId/inventory", getFarmerInventory);
vendorFarmerRouter.post("/:farmerId/inventory/adjust", adjustFarmerStock);
vendorFarmerRouter.put("/:farmerId/inventory/:inventoryId", updateFarmerInventoryItem);

vendorFarmerRouter.get("/:farmerId/orders", getFarmerOrders);
vendorFarmerRouter.get("/:farmerId/earnings", getFarmerEarnings);
vendorFarmerRouter.get("/:farmerId/documents", getFarmerDocuments);
vendorFarmerRouter.patch("/:farmerId/documents/:documentId/status", updateFarmerDocumentStatus);
vendorFarmerRouter.get("/:farmerId/stock-history", getStockHistory);

vendorFarmerRouter.get("/:farmerId/harvest-orders", getHarvestOrders);
vendorFarmerRouter.post("/:farmerId/harvest-orders", createHarvestOrder);
vendorFarmerRouter.put("/:farmerId/harvest-orders/:id", updateHarvestOrder);
vendorFarmerRouter.delete("/:farmerId/harvest-orders/:id", deleteHarvestOrder);


// ------------------------------------
// VENDOR MANAGER MANAGEMENT API
// ------------------------------------
vendorManagerRouter.get("/", getManagers);
vendorManagerRouter.post("/", createManager);
vendorManagerRouter.get("/:managerId", getManagerById);
vendorManagerRouter.put("/:managerId", updateManager);
vendorManagerRouter.delete("/:managerId", deleteManager);
vendorManagerRouter.patch("/:managerId/status", setManagerStatus);


// ------------------------------------
// VENDOR AUTH ROUTES
// ------------------------------------
vendorAuthRouter.post("/login", vendorLogin);
vendorAuthRouter.get("/me", requireVendor, getVendorMe);

// ------------------------------------
// VENDOR PANEL ROUTES (protected)
// ------------------------------------
vendorRouter.get("/dashboard", requireVendor, getVendorDashboard);
vendorRouter.get("/farmers", requireVendor, getFarmers);
vendorRouter.post("/farmers", requireVendor, createFarmer);
vendorRouter.get("/farmers/:farmerId", requireVendor, getFarmerById);
vendorRouter.put("/farmers/:farmerId", requireVendor, updateFarmer);
vendorRouter.delete("/farmers/:farmerId", requireVendor, deleteFarmer);
vendorRouter.patch("/farmers/:farmerId/status", requireVendor, setFarmerStatus);
vendorRouter.put("/farmers/:farmerId/manager", requireVendor, assignFarmerManager);
vendorRouter.get("/farmers/:farmerId/products", requireVendor, getFarmerProducts);
vendorRouter.get("/farmers/:farmerId/orders", requireVendor, getFarmerOrders);
vendorRouter.post("/farmers/:farmerId/orders", requireVendor, createFarmerOrder);
vendorRouter.put("/farmers/:farmerId/orders/:orderId", requireVendor, updateFarmerOrder);
vendorRouter.delete("/farmers/:farmerId/orders/:orderId", requireVendor, deleteFarmerOrder);
vendorRouter.get("/farmers/:farmerId/earnings", requireVendor, getFarmerEarnings);
vendorRouter.get("/farmers/:farmerId/documents", requireVendor, getFarmerDocuments);

vendorRouter.get("/managers", requireVendor, getManagers);
vendorRouter.post("/managers", requireVendor, createManager);
vendorRouter.get("/managers/:managerId", requireVendor, getManagerById);
vendorRouter.put("/managers/:managerId", requireVendor, updateManager);
vendorRouter.delete("/managers/:managerId", requireVendor, deleteManager);
vendorRouter.patch("/managers/:managerId/status", requireVendor, setManagerStatus);

vendorRouter.get("/vendors", getVendors);
vendorRouter.post("/vendors", createVendor);
vendorRouter.put("/vendors/:vendorId", requireVendor, updateVendor);


// ------------------------------------
// MANAGER AUTH ROUTES
// ------------------------------------
managerAuthRouter.post("/login", managerLogin);
managerAuthRouter.get("/me", requireManager, getManagerMe);

// ------------------------------------
// MANAGER PANEL ROUTES (protected)
// ------------------------------------
managerRouter.get("/dashboard", requireManager, getManagerDashboard);
managerRouter.get("/farmers", requireManager, getManagerFarmers);
managerRouter.get("/products", requireManager, getManagerAllProducts);
managerRouter.get("/orders", requireManager, getManagerAllOrders);
managerRouter.get("/inventory", requireManager, getManagerAllInventory);
managerRouter.get("/documents", requireManager, getManagerAllDocuments);
managerRouter.get("/stock-history", requireManager, getManagerAllStockHistory);
managerRouter.get("/harvest-orders", requireManager, getManagerAllHarvestOrders);
managerRouter.get("/earnings", requireManager, getManagerAllEarnings);
managerRouter.post("/farmers", requireManager, createFarmer);
managerRouter.get("/farmers/:farmerId", requireManager, getFarmerById);
managerRouter.delete("/farmers/:farmerId", requireManager, deleteFarmer);
managerRouter.get("/farmers/:farmerId/products", requireManager, getFarmerProducts);
managerRouter.get("/farmers/:farmerId/products/:productId", requireManager, getFarmerProductById);
managerRouter.put("/farmers/:farmerId/products/:productId", requireManager, updateFarmerProduct);
managerRouter.get("/farmers/:farmerId/inventory", requireManager, getFarmerInventory);
managerRouter.post("/farmers/:farmerId/inventory/adjust", requireManager, adjustFarmerStock);
managerRouter.put("/farmers/:farmerId/inventory/:inventoryId", requireManager, updateFarmerInventoryItem);
managerRouter.get("/farmers/:farmerId/stock-history", requireManager, getStockHistory);
managerRouter.get("/farmers/:farmerId/orders", requireManager, getFarmerOrders);
managerRouter.get("/:farmerId/orders", requireManager, getFarmerOrders);
managerRouter.post("/farmers/:farmerId/orders", requireManager, createFarmerOrder);
managerRouter.post("/:farmerId/orders", requireManager, createFarmerOrder);
managerRouter.get("/farmers/:farmerId/orders/:orderId", requireManager, getFarmerOrderById);
managerRouter.get("/:farmerId/orders/:orderId", requireManager, getFarmerOrderById);
managerRouter.put("/farmers/:farmerId/orders/:orderId", requireManager, updateFarmerOrder);
managerRouter.put("/:farmerId/orders/:orderId", requireManager, updateFarmerOrder);
managerRouter.patch("/farmers/:farmerId/orders/:orderId", requireManager, updateFarmerOrder);
managerRouter.patch("/:farmerId/orders/:orderId", requireManager, updateFarmerOrder);
managerRouter.patch("/farmers/:farmerId/orders/:orderId/status", requireManager, updateFarmerOrderStatus);
managerRouter.patch("/:farmerId/orders/:orderId/status", requireManager, updateFarmerOrderStatus);
managerRouter.delete("/farmers/:farmerId/orders/:orderId", requireManager, deleteFarmerOrder);
managerRouter.delete("/:farmerId/orders/:orderId", requireManager, deleteFarmerOrder);
managerRouter.get("/farmers/:farmerId/earnings", requireManager, getFarmerEarnings);
managerRouter.get("/farmers/:farmerId/documents", requireManager, getFarmerDocuments);
managerRouter.patch("/farmers/:farmerId/documents/:documentId/status", requireManager, updateFarmerDocumentStatus);


export default [
  { path: "/api/farmers", router: farmerRouter },
  { path: "/api/farmer", router: farmerRouter },
  { path: "/api/vendor/farmers", router: vendorFarmerRouter },
  { path: "/api/vendor/managers", router: vendorManagerRouter },
  // New authenticated routes
  { path: "/api/vendor/auth", router: vendorAuthRouter },
  { path: "/api/vendor", router: vendorRouter },
  { path: "/api/farmer-manager/auth", router: managerAuthRouter },
  { path: "/api/farmer-manager", router: managerRouter },
];
