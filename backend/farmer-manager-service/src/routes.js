import express from "express";
import {
  getFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
  setFarmerStatus,
  farmerLogin,
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
  updateFarmerOrderStatus,
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
} from "./controllers.js";

const farmerRouter = express.Router();
const vendorFarmerRouter = express.Router();
const vendorManagerRouter = express.Router();

// ------------------------------------
// FARMER AUTH & COMMON API
// ------------------------------------
farmerRouter.post("/login", farmerLogin);
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
farmerRouter.get("/:farmerId/orders/:orderId", getFarmerOrderById);
farmerRouter.patch("/:farmerId/orders/:orderId/status", updateFarmerOrderStatus);

// Earnings
farmerRouter.get("/:farmerId/earnings", getFarmerEarnings);

// Harvest Orders
farmerRouter.get("/harvest-orders", getHarvestOrders);
farmerRouter.get("/:farmerId/harvest-orders", getHarvestOrders);
farmerRouter.post("/:farmerId/harvest-orders", createHarvestOrder);
farmerRouter.put("/:farmerId/harvest-orders/:id", updateHarvestOrder);
farmerRouter.delete("/:farmerId/harvest-orders/:id", deleteHarvestOrder);

vendorFarmerRouter.get("/:farmerId/harvest-orders", getHarvestOrders);
vendorFarmerRouter.post("/:farmerId/harvest-orders", createHarvestOrder);
vendorFarmerRouter.put("/:farmerId/harvest-orders/:id", updateHarvestOrder);
vendorFarmerRouter.delete("/:farmerId/harvest-orders/:id", deleteHarvestOrder);

// Documents
farmerRouter.get("/:farmerId/documents", getFarmerDocuments);
farmerRouter.post("/:farmerId/documents", uploadFarmerDocument);
farmerRouter.patch("/:farmerId/documents/:documentId/status", updateFarmerDocumentStatus);
farmerRouter.delete("/:farmerId/documents/:documentId", deleteFarmerDocument);


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


// ------------------------------------
// VENDOR MANAGER MANAGEMENT API
// ------------------------------------
vendorManagerRouter.get("/", getManagers);
vendorManagerRouter.post("/", createManager);
vendorManagerRouter.get("/:managerId", getManagerById);
vendorManagerRouter.put("/:managerId", updateManager);
vendorManagerRouter.delete("/:managerId", deleteManager);
vendorManagerRouter.patch("/:managerId/status", setManagerStatus);

export default [
  { path: "/api/farmers", router: farmerRouter },
  { path: "/api/farmer", router: farmerRouter },
  { path: "/api/vendor/farmers", router: vendorFarmerRouter },
  { path: "/api/vendor/managers", router: vendorManagerRouter },
];
