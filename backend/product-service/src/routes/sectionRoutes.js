import express from "express";
import {
  getSections,
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  seedSections,
} from "../controllers/sectionController.js";

const router = express.Router();

// Public / Customer routes
router.get("/", getSections);
router.get("/all", getAllSections);
router.get("/:id", getSectionById);

// Admin operations
router.post("/", createSection);
router.post("/seed", seedSections);
router.put("/:id", updateSection);
router.delete("/:id", deleteSection);

export default router;
