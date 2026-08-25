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
  listFarmerCrops,
  getFarmerCrop,
  createFarmerCrop,
  updateFarmerCrop,
  deleteFarmerCrop,
  listFarmerCropPlans,
  getFarmerCropPlan,
  createFarmerCropPlan,
  updateFarmerCropPlan,
  listMyProducts,
  getMyProduct,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  patchMyProductPrice,
  patchMyProductStock,
  patchMyProductStatus,
  listMyOrders,
  getMyOrder,
  acceptMyOrder,
  rejectMyOrder,
  prepareMyOrder,
  packMyOrder,
  readyMyOrder,
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
import {
  listVendorDrivers,
  createVendorDriver,
  getVendorDriver,
  updateVendorDriver,
  setVendorDriverStatus,
  listVendorPickups,
  getVendorPickup,
  assignVendorPickupDriver,
  reassignVendorPickupDriver,
  startVendorPickup,
  arriveVendorPickup,
  listVendorCentres,
  createVendorCentre,
  receiveVendorPickup,
  getVendorPickupReceipt,
  listManagerPickups,
  getManagerPickup,
  verifyManagerPickupQr,
  confirmManagerPickup,
  listManagerDrivers,
  assignManagerPickupDriver,
  reassignManagerPickupDriver,
  driverLogin,
  getDriverMe,
  listDriverPickups,
  getDriverPickup,
  startDriverPickup,
  arriveDriverPickup,
  checkDriverPickupOrder,
  verifyDriverPickupQr,
  confirmDriverPickup,
  transitDriverPickup,
} from "./pickupControllers.js";
import { requireVendor, requireManager, requireFarmer, requireDriver } from "./middleware.js";

const farmerRouter = express.Router();
const vendorFarmerRouter = express.Router();
const vendorManagerRouter = express.Router();
const vendorAuthRouter = express.Router();
const vendorRouter = express.Router();
const managerAuthRouter = express.Router();
const managerRouter = express.Router();
const driverAuthRouter = express.Router();
const driverRouter = express.Router();

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
farmerRouter.get("/crops", requireFarmer, listFarmerCrops);
farmerRouter.post("/crops", requireFarmer, createFarmerCrop);
farmerRouter.get("/crops/:cropId", requireFarmer, getFarmerCrop);
farmerRouter.put("/crops/:cropId", requireFarmer, updateFarmerCrop);
farmerRouter.delete("/crops/:cropId", requireFarmer, deleteFarmerCrop);
farmerRouter.get("/crop-plans", requireFarmer, listFarmerCropPlans);
farmerRouter.post("/crop-plans", requireFarmer, createFarmerCropPlan);
farmerRouter.get("/crop-plans/:planId", requireFarmer, getFarmerCropPlan);
farmerRouter.put("/crop-plans/:planId", requireFarmer, updateFarmerCropPlan);
farmerRouter.get("/products", requireFarmer, listMyProducts);
farmerRouter.post("/products", requireFarmer, createMyProduct);
farmerRouter.get("/products/:productId", requireFarmer, getMyProduct);
farmerRouter.put("/products/:productId", requireFarmer, updateMyProduct);
farmerRouter.delete("/products/:productId", requireFarmer, deleteMyProduct);
farmerRouter.patch("/products/:productId/price", requireFarmer, patchMyProductPrice);
farmerRouter.patch("/products/:productId/stock", requireFarmer, patchMyProductStock);
farmerRouter.patch("/products/:productId/status", requireFarmer, patchMyProductStatus);
farmerRouter.get("/orders", requireFarmer, listMyOrders);
farmerRouter.get("/orders/:orderId", requireFarmer, getMyOrder);
farmerRouter.patch("/orders/:orderId/accept", requireFarmer, acceptMyOrder);
farmerRouter.patch("/orders/:orderId/reject", requireFarmer, rejectMyOrder);
farmerRouter.patch("/orders/:orderId/prepare", requireFarmer, prepareMyOrder);
farmerRouter.patch("/orders/:orderId/ready-for-pickup", requireFarmer, readyMyOrder);
farmerRouter.patch("/orders/:orderId/packing", requireFarmer, packMyOrder);
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
vendorAuthRouter.post("/driver/login", driverLogin);
vendorAuthRouter.get("/driver/me", requireDriver, getDriverMe);

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

vendorRouter.get("/drivers", requireVendor, listVendorDrivers);
vendorRouter.post("/drivers", requireVendor, createVendorDriver);
vendorRouter.get("/drivers/:driverId", requireVendor, getVendorDriver);
vendorRouter.put("/drivers/:driverId", requireVendor, updateVendorDriver);
vendorRouter.patch("/drivers/:driverId/status", requireVendor, setVendorDriverStatus);
vendorRouter.get("/pickups", requireVendor, listVendorPickups);
vendorRouter.get("/pickups/:pickupId", requireVendor, getVendorPickup);
vendorRouter.post("/pickups/:pickupId/assign", requireVendor, assignVendorPickupDriver);
vendorRouter.post("/pickups/:pickupId/reassign", requireVendor, reassignVendorPickupDriver);
vendorRouter.post("/pickups/:pickupId/start", requireVendor, startVendorPickup);
vendorRouter.post("/pickups/:pickupId/arrive", requireVendor, arriveVendorPickup);
vendorRouter.post("/pickups/:pickupId/receive", requireVendor, receiveVendorPickup);
vendorRouter.get("/pickups/:pickupId/receipt", requireVendor, getVendorPickupReceipt);
vendorRouter.get("/collection-centres", requireVendor, listVendorCentres);
vendorRouter.post("/collection-centres", requireVendor, createVendorCentre);

vendorRouter.get("/driver-desk/pickups", requireDriver, listDriverPickups);
vendorRouter.get("/driver-desk/pickups/:pickupId", requireDriver, getDriverPickup);
vendorRouter.post("/driver-desk/pickups/:pickupId/start", requireDriver, startDriverPickup);
vendorRouter.post("/driver-desk/pickups/:pickupId/arrive", requireDriver, arriveDriverPickup);
vendorRouter.post("/driver-desk/pickups/:pickupId/check-order", requireDriver, checkDriverPickupOrder);
vendorRouter.post("/driver-desk/pickups/:pickupId/verify-qr", requireDriver, verifyDriverPickupQr);
vendorRouter.post("/driver-desk/pickups/:pickupId/confirm", requireDriver, confirmDriverPickup);
vendorRouter.post("/driver-desk/pickups/:pickupId/transit", requireDriver, transitDriverPickup);


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
managerRouter.get("/pickups", requireManager, listManagerPickups);
managerRouter.get("/pickups/:pickupId", requireManager, getManagerPickup);
managerRouter.post("/pickups/:pickupId/verify-qr", requireManager, verifyManagerPickupQr);
managerRouter.post("/pickups/:pickupId/confirm", requireManager, confirmManagerPickup);
managerRouter.get("/drivers", requireManager, listManagerDrivers);
managerRouter.post("/pickups/:pickupId/assign", requireManager, assignManagerPickupDriver);
managerRouter.post("/pickups/:pickupId/reassign", requireManager, reassignManagerPickupDriver);
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

driverAuthRouter.post("/login", driverLogin);
driverAuthRouter.get("/me", requireDriver, getDriverMe);
driverRouter.get("/pickups", requireDriver, listDriverPickups);
driverRouter.get("/pickups/:pickupId", requireDriver, getDriverPickup);
driverRouter.post("/pickups/:pickupId/start", requireDriver, startDriverPickup);
driverRouter.post("/pickups/:pickupId/arrive", requireDriver, arriveDriverPickup);
driverRouter.post("/pickups/:pickupId/check-order", requireDriver, checkDriverPickupOrder);
driverRouter.post("/pickups/:pickupId/verify-qr", requireDriver, verifyDriverPickupQr);
driverRouter.post("/pickups/:pickupId/confirm", requireDriver, confirmDriverPickup);
driverRouter.post("/pickups/:pickupId/transit", requireDriver, transitDriverPickup);

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
  { path: "/api/driver/auth", router: driverAuthRouter },
  { path: "/api/driver", router: driverRouter },
];
