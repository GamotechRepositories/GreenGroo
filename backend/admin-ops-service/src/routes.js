import express from "express";
import { protect, requireAdmin, optionalAuth } from "@greengrocc/shared";
import {
  listGiftCards,
  createGiftCard,
  updateGiftCard,
  deleteGiftCard,
  validateGiftCardPublic,
  listPricingRules,
  listActivePricingPublic,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  listBulkDeals,
  createBulkDeal,
  updateBulkDeal,
  deleteBulkDeal,
  exportProductsCsv,
  exportProductsJson,
  importProductsCsv,
  importProductsJson,
  listProductsLite,
} from "./catalogControllers.js";
import {
  listVendorsAdmin,
  createVendorAdmin,
  updateVendorAdmin,
  deleteVendorAdmin,
  listHrDirectory,
  createHrStaff,
  updateHrStaff,
  clockHrAttendance,
  listHrAttendance,
  listDeliveryOrders,
  assignDeliveryOrder,
  updateDeliveryOrderStatus,
  listRidersLite,
  listDeliveryTracking,
  listStoreSupport,
  updateStoreSupport,
} from "./opsControllers.js";
import {
  listFinance,
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
  listRefunds,
  createRefund,
  updateRefund,
  getReports,
} from "./financeControllers.js";

const router = express.Router();

router.post("/gift-cards/validate", optionalAuth, validateGiftCardPublic);
router.get("/pricing/active", listActivePricingPublic);

router.use(protect, requireAdmin);

router.get("/gift-cards", listGiftCards);
router.post("/gift-cards", createGiftCard);
router.put("/gift-cards/:id", updateGiftCard);
router.delete("/gift-cards/:id", deleteGiftCard);

router.get("/pricing", listPricingRules);
router.post("/pricing", createPricingRule);
router.put("/pricing/:id", updatePricingRule);
router.delete("/pricing/:id", deletePricingRule);

router.get("/bulk-selling", listBulkDeals);
router.post("/bulk-selling", createBulkDeal);
router.put("/bulk-selling/:id", updateBulkDeal);
router.delete("/bulk-selling/:id", deleteBulkDeal);

router.get("/products/lite", listProductsLite);
router.get("/csv/products", exportProductsCsv);
router.post("/csv/products", importProductsCsv);
router.get("/bulk/products", exportProductsJson);
router.post("/bulk/products", importProductsJson);

router.get("/vendors", listVendorsAdmin);
router.post("/vendors", createVendorAdmin);
router.put("/vendors/:id", updateVendorAdmin);
router.delete("/vendors/:id", deleteVendorAdmin);

router.get("/hr", listHrDirectory);
router.post("/hr", createHrStaff);
router.put("/hr/:id", updateHrStaff);
router.get("/hr/attendance", listHrAttendance);
router.post("/hr/attendance", clockHrAttendance);

router.get("/delivery/orders", listDeliveryOrders);
router.get("/delivery/riders", listRidersLite);
router.patch("/delivery/orders/:id/assign", assignDeliveryOrder);
router.patch("/delivery/orders/:id/status", updateDeliveryOrderStatus);
router.get("/tracking", listDeliveryTracking);

router.get("/support", listStoreSupport);
router.patch("/support/:id", updateStoreSupport);

router.get("/finance", listFinance);
router.post("/finance", createFinanceEntry);
router.put("/finance/:id", updateFinanceEntry);
router.delete("/finance/:id", deleteFinanceEntry);

router.get("/refunds", listRefunds);
router.post("/refunds", createRefund);
router.put("/refunds/:id", updateRefund);

router.get("/reports", getReports);

export default [{ path: "/api/admin-ops", router }];
