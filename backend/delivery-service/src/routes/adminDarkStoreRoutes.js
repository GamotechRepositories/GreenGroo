import express from "express";
import {
  getDarkStore,
  listDarkStores,
  updateDarkStoreLocation,
} from "../controllers/adminDarkStoreController.js";

const router = express.Router();

router.get("/", listDarkStores);
router.get("/:id", getDarkStore);
router.patch("/:id", updateDarkStoreLocation);
router.put("/:id", updateDarkStoreLocation);

export default router;
