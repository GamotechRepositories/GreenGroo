import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";

const router = express.Router();

router.use(protect);

router.get("/", getAddresses);
router.post("/", addAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
