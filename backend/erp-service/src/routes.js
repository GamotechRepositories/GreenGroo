import express from "express";
import { requireErpAuth, requirePermission, erpRateLimit } from "./middleware/rbac.js";
import {
  listResource,
  getResource,
  createResource,
  updateResource,
  softDeleteResource,
  listModules,
} from "./controllers/resourceController.js";
import {
  ceoDashboard,
  globalSearch,
  generateBusinessId,
  listFarmers,
  listFarmerManagers,
  getFarmer360,
  assignErpFarmerManager,
  deleteErpFarmer,
  reviewFarmerDocument,
  receiveGrn,
  detectId,
  report,
} from "./controllers/ceoController.js";
import { createFarmer } from "../../farmer-manager-service/src/controllers.js";

const router = express.Router();

router.use(erpRateLimit());
router.use(requireErpAuth);

router.get("/modules", requirePermission("erp:read"), listModules);
router.get("/ceo/dashboard", requirePermission("erp:read"), ceoDashboard);
router.get("/search", requirePermission("erp:read"), globalSearch);
router.get("/search/:id", requirePermission("erp:read"), globalSearch);
router.get("/detect", requirePermission("erp:read"), detectId);
router.post("/ids/generate", requirePermission("erp:write"), generateBusinessId);

router.get("/farmers", requirePermission("erp:read"), listFarmers);
router.post("/farmers", requirePermission("erp:write"), createFarmer);
router.get("/farmer-managers", requirePermission("erp:read"), listFarmerManagers);
router.get("/farmers/:id", requirePermission("erp:read"), getFarmer360);
router.put("/farmers/:id/manager", requirePermission("erp:write"), assignErpFarmerManager);
router.delete("/farmers/:id", requirePermission("erp:write"), deleteErpFarmer);
router.patch(
  "/farmers/:id/documents/:documentId/status",
  requirePermission("erp:write"),
  reviewFarmerDocument
);

router.post("/goods_receipts/:id/receive", requirePermission("erp:write"), (req, res, next) => {
  req.body.grnId = req.body.grnId || req.params.id;
  return receiveGrn(req, res, next);
});

router.get("/reports/:resource", requirePermission("erp:read"), report);

router.get("/:resource", requirePermission("erp:read"), listResource);
router.post("/:resource", requirePermission("erp:write"), createResource);
router.get("/:resource/:id", requirePermission("erp:read"), getResource);
router.patch("/:resource/:id", requirePermission("erp:write"), updateResource);
router.delete("/:resource/:id", requirePermission("erp:write"), softDeleteResource);

export default [{ path: "/api/erp", router }];
