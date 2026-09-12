import express from "express";
import {
  adjustDarkStoreInventoryItem,
  createDarkStoreInventoryItem,
  getDarkStore,
  listDarkStoreInventory,
  listDarkStores,
  updateDarkStoreInventoryItem,
  updateDarkStoreLocation,
} from "../controllers/adminDarkStoreController.js";

const router = express.Router();

router.get("/", listDarkStores);
router.get("/:id/inventory", listDarkStoreInventory);
router.post("/:id/inventory", createDarkStoreInventoryItem);
router.patch("/:id/inventory/:itemId", updateDarkStoreInventoryItem);
router.post("/:id/inventory/:itemId/adjust", adjustDarkStoreInventoryItem);
router.get("/:id", getDarkStore);
router.patch("/:id", updateDarkStoreLocation);
router.put("/:id", updateDarkStoreLocation);

export default router;
