import mongoose from "mongoose";
import Product from "../../../legacy/models/Product.js";
import StoreInventory from "../models/StoreInventory.js";
import {
  createProductRecord,
  updateProductRecord,
} from "../../../legacy/controllers/productController.js";
import { getManager } from "./managerDashboardController.js";

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SECTION_ALIASES = {
  preorder: ["preorder", "greengrocc", "main"],
  ready2cook: ["ready2cook", "ready-2-cook", "festive"],
  instantorder: ["instantorder", "instant", "supermall", "mall"],
};

function generateSku(manager) {
  const store = String(manager._id).slice(-4).toUpperCase();
  return `DM${store}-${Date.now().toString().slice(-7)}`;
}

/**
 * Keep the dark store's inventory row in step with the product so it shows as
 * in-stock for this store's customers and stock is deducted when orders are packed.
 */
async function syncInventory(manager, product, { previousSku = "", stock } = {}) {
  const sku = String(product.sku || "").trim();
  if (!sku) return;

  const update = {
    name: product.name,
    category: product.categories?.[0] || "General",
    unit: product.unit || "pcs",
    price: Number(product.discountedPrice || product.price || 0),
    isActive: product.isActive !== false,
  };
  if (stock !== undefined) {
    update.stockCount = Math.max(0, Number(stock) || 0);
  }

  if (previousSku && previousSku !== sku) {
    await StoreInventory.updateOne(
      { managerId: manager._id, sku: previousSku },
      { $set: { sku, ...update } }
    );
  }

  await StoreInventory.updateOne(
    { managerId: manager._id, sku },
    update.stockCount === undefined
      ? { $set: update, $setOnInsert: { stockCount: 0 } }
      : { $set: update },
    { upsert: true }
  );
}

function withStock(product, inventoryBySku) {
  const doc = product.toObject ? product.toObject() : product;
  const row = inventoryBySku.get(String(doc.sku || ""));
  return {
    ...doc,
    storeStock: row ? row.stockCount : 0,
  };
}

export const listManagerProducts = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const filter = { ownerManagerId: manager._id };

    const section = String(req.query.section || "").trim().toLowerCase();
    if (section && section !== "all") {
      filter.section = { $in: SECTION_ALIASES[section] || [section] };
    }

    const search = String(req.query.search || "").trim();
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { name: pattern },
        { sku: pattern },
        { departmentId: pattern },
        { categories: pattern },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(500);
    const inventory = await StoreInventory.find({
      managerId: manager._id,
      sku: { $in: products.map((p) => p.sku).filter(Boolean) },
    }).lean();
    const inventoryBySku = new Map(inventory.map((row) => [row.sku, row]));

    return res.json({
      success: true,
      data: products.map((product) => withStock(product, inventoryBySku)),
      store: {
        id: manager._id.toString(),
        storeName: manager.storeName || `${manager.area} Store`,
        pincode: manager.pincode || "",
        area: manager.area || "",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createManagerProduct = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const body = { ...req.body };
    if (!String(body.sku || "").trim()) body.sku = generateSku(manager);

    const result = await createProductRecord(body, { ownerManagerId: manager._id });
    if (result.product) {
      await syncInventory(manager, result.product, { stock: body.stock ?? 0 });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
};

export const updateManagerProduct = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const existing = mongoose.Types.ObjectId.isValid(req.params.id)
      ? await Product.findOne({ _id: req.params.id, ownerManagerId: manager._id }).select("sku")
      : null;
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const result = await updateProductRecord(req.params.id, req.body, {
      ownerManagerId: manager._id,
    });
    if (result.product) {
      await syncInventory(manager, result.product, {
        previousSku: existing.sku,
        stock: req.body.stock,
      });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
};

export const deleteManagerProduct = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      ownerManagerId: manager._id,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.sku) {
      await StoreInventory.deleteOne({ managerId: manager._id, sku: product.sku });
    }
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};
