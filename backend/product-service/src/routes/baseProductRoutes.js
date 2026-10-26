import express from "express";
import {
  getBaseProducts,
  createBaseProduct,
  updateBaseProduct,
  deleteBaseProduct,
} from "../controllers/baseProductController.js";

const router = express.Router();

router.get("/", getBaseProducts);
router.post("/", createBaseProduct);
router.put("/:id", updateBaseProduct);
router.delete("/:id", deleteBaseProduct);

export default router;
