import express from "express";
import { protect, requireRoles } from "@greengrocc/shared";
import {
  createAccount,
  getHierarchy,
  listStaff,
  login,
  me,
  getVendorBatches,
} from "../controllers/staffController.js";
import {
  listAllInventoryRequests,
  reviewInventoryRequest,
} from "../../../delivery-service/src/controllers/inventoryRequestController.js";
import {
  cancelPreOrderByStaff,
  forwardPreOrders,
  listPreOrdersForStaff,
  updatePreOrderStage,
} from "../../../delivery-service/src/controllers/preOrderController.js";

const PRE_ORDER_ROLES = ["product_manager", "segregation_manager", "admin"];

const router = express.Router();

router.get("/hierarchy", getHierarchy);
router.post("/login", login);

router.use(protect);

router.get("/me", me);
router.get("/", listStaff);
router.post("/", createAccount);
router.get(
  "/inventory-requests",
  requireRoles("product_manager", "vendor", "segregation_manager", "admin"),
  listAllInventoryRequests
);
router.patch(
  "/inventory-requests/:requestId",
  requireRoles("product_manager", "vendor", "segregation_manager", "admin"),
  reviewInventoryRequest
);

router.get("/preorders", requireRoles(...PRE_ORDER_ROLES), listPreOrdersForStaff);
router.get("/vendor-batches", requireRoles(...PRE_ORDER_ROLES), getVendorBatches);
router.post("/preorders/forward", requireRoles(...PRE_ORDER_ROLES), forwardPreOrders);
router.patch("/preorders/:orderId/stage", requireRoles(...PRE_ORDER_ROLES), updatePreOrderStage);
router.post("/preorders/:orderId/cancel", requireRoles(...PRE_ORDER_ROLES), cancelPreOrderByStaff);

export default router;
