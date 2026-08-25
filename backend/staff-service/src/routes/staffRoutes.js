import express from "express";
import { protect, requireRoles } from "@greengrocc/shared";
import {
  createAccount,
  getHierarchy,
  listStaff,
  login,
  me,
} from "../controllers/staffController.js";
import {
  listAllInventoryRequests,
  reviewInventoryRequest,
} from "../../../delivery-service/src/controllers/inventoryRequestController.js";

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

export default router;
