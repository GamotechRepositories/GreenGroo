import mongoose from "mongoose";
import Banner, { BANNER_DEVICES, BANNER_PLACEMENTS } from "../models/Banner.js";
import { resolveImageUrl } from "../../../legacy/utils/urlResolver.js";
import { importDefaultBanners } from "../services/defaultBanners.js";

/** Accepts the same section aliases as categories (greengrocc, supermall, festive, mall…). */
export function canonicalBannerSection(value) {
  const key = String(value || "").trim().toLowerCase();
  if (["preorder", "main", "greengrocc", "pre-order"].includes(key)) return "preorder";
  if (["ready2cook", "ready-2-cook", "festive"].includes(key)) return "ready2cook";
  if (["instantorder", "instant", "supermall", "mall", "instantorders"].includes(key)) return "instantorder";
  return "";
}

const canonicalPlacement = (value) => {
  const key = String(value || "").trim().toLowerCase();
  return BANNER_PLACEMENTS.includes(key) ? key : "";
};

const canonicalDevice = (value) => {
  const key = String(value || "").trim().toLowerCase();
  if (key === "phone") return "mobile";
  return BANNER_DEVICES.includes(key) ? key : "";
};

const toDateOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const TEXT_FIELDS = ["alt", "linkUrl", "tag", "title", "subtitle", "offerText", "category", "videoUrl", "bgColor"];

function serialize(banner) {
  const data = typeof banner.toObject === "function" ? banner.toObject() : { ...banner };
  data.imageUrl = resolveImageUrl(data.imageUrl) || data.imageUrl;
  if (data.videoUrl) data.videoUrl = resolveImageUrl(data.videoUrl) || data.videoUrl;
  return data;
}

function buildFilter(query) {
  const filter = {};
  if (query.section) {
    const section = canonicalBannerSection(query.section);
    if (!section) return null;
    filter.section = section;
  }
  if (query.placement) {
    const placement = canonicalPlacement(query.placement);
    if (!placement) return null;
    filter.placement = placement;
  }
  if (query.device) {
    const device = canonicalDevice(query.device);
    if (!device) return null;
    filter.device = device;
  }
  return filter;
}

/** Public: active banners inside their schedule window. */
export const getBanners = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    if (!filter) return res.json({ success: true, data: [] });

    const now = new Date();
    const banners = await Banner.find({
      ...filter,
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({ success: true, data: banners.map(serialize) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin: every banner, including inactive and scheduled ones. */
export const getAllBanners = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    if (!filter) return res.json({ success: true, data: [] });
    const banners = await Banner.find(filter).sort({ order: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: banners.map(serialize) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    const section = canonicalBannerSection(req.body.section);
    const placement = canonicalPlacement(req.body.placement);
    const device = canonicalDevice(req.body.device);
    const imageUrl = String(req.body.imageUrl || "").trim();

    if (!section) return res.status(400).json({ success: false, message: "Choose a valid section" });
    if (!placement) return res.status(400).json({ success: false, message: "Choose a valid placement" });
    if (!device) return res.status(400).json({ success: false, message: "Device must be desktop or mobile" });
    if (!imageUrl) return res.status(400).json({ success: false, message: "Banner image is required" });
    const category = String(req.body.category || "").trim().toLowerCase();
    if (placement === "category" && !category) {
      return res.status(400).json({ success: false, message: "Choose a category for this banner" });
    }
    if (placement === "stories" && !category) {
      return res.status(400).json({ success: false, message: "Choose the left or right Farmer Stories tile" });
    }

    let order = Number(req.body.order);
    if (!Number.isFinite(order)) {
      const last = await Banner.findOne({ section, placement, device, ...(category ? { category } : {}) })
        .sort({ order: -1 })
        .lean();
      order = last ? (last.order || 0) + 1 : 0;
    }

    const doc = { section, placement, device, imageUrl, order, isActive: req.body.isActive !== false };
    TEXT_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) doc[field] = String(req.body[field] || "").trim();
    });
    doc.startsAt = toDateOrNull(req.body.startsAt);
    doc.endsAt = toDateOrNull(req.body.endsAt);

    const banner = await Banner.create(doc);
    res.status(201).json({ success: true, data: serialize(banner) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

    if (req.body.section !== undefined) {
      const section = canonicalBannerSection(req.body.section);
      if (!section) return res.status(400).json({ success: false, message: "Choose a valid section" });
      banner.section = section;
    }
    if (req.body.placement !== undefined) {
      const placement = canonicalPlacement(req.body.placement);
      if (!placement) return res.status(400).json({ success: false, message: "Choose a valid placement" });
      banner.placement = placement;
    }
    if (req.body.device !== undefined) {
      const device = canonicalDevice(req.body.device);
      if (!device) return res.status(400).json({ success: false, message: "Device must be desktop or mobile" });
      banner.device = device;
    }
    if (req.body.imageUrl !== undefined) {
      const imageUrl = String(req.body.imageUrl || "").trim();
      if (!imageUrl) return res.status(400).json({ success: false, message: "Banner image is required" });
      banner.imageUrl = imageUrl;
    }
    TEXT_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) banner[field] = String(req.body[field] || "").trim();
    });
    if (req.body.order !== undefined && Number.isFinite(Number(req.body.order))) banner.order = Number(req.body.order);
    if (req.body.isActive !== undefined) banner.isActive = Boolean(req.body.isActive);
    if (req.body.startsAt !== undefined) banner.startsAt = toDateOrNull(req.body.startsAt);
    if (req.body.endsAt !== undefined) banner.endsAt = toDateOrNull(req.body.endsAt);

    await banner.save();
    res.json({ success: true, data: serialize(banner) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Body: `{ ids: [...] }` in display order. */
export const reorderBanners = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id) => mongoose.isValidObjectId(id)) : [];
    if (!ids.length) return res.status(400).json({ success: false, message: "Nothing to reorder" });

    await Banner.bulkWrite(
      ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } }))
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Moves the storefront's old hardcoded banners to S3 + the database. */
export const importDefaults = async (_req, res) => {
  try {
    const summary = await importDefaultBanners();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
