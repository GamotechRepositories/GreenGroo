import express from "express";
import { loadNearestStoreCatalog } from "../services/nearestStoreCatalog.js";

const router = express.Router();

router.get("/nearest", async (req, res, next) => {
  try {
    const catalog = await loadNearestStoreCatalog(req.query);
    return res.json({
      success: true,
      store: catalog.store,
      inStockCount: catalog.store?.inStockCount || catalog.items?.length || 0,
      categories: catalog.store?.categories || [],
      needsLocation: Boolean(catalog.needsLocation),
      reason: catalog.reason,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
