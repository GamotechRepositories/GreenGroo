import express from "express";
import {
  getTestimonials,
  getAllTestimonials,
  getTestimonialById,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getTestimonials);
router.get("/all", protect, requireAdmin, getAllTestimonials);
router.get("/:id", getTestimonialById);
router.post("/", protect, requireAdmin, addTestimonial);
router.put("/:id", protect, requireAdmin, updateTestimonial);
router.delete("/:id", protect, requireAdmin, deleteTestimonial);

export default router;
