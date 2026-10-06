import crypto from "crypto";
import mongoose from "mongoose";
import Product from "../../legacy/models/Product.js";
import { VendorProduct, VendorProductRequest } from "./models.js";

const CATALOG_FIELDS =
  "name sku categories subcategory productImages price discountedPrice unit stock inStock isActive brandName varietyName";
const ADMIN_CATALOG_FILTER = { isActive: { $ne: false }, ownerManagerId: null };

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function vendorIdOf(req) {
  return req.user?.vendorId || req.user?.id || "";
}

export function catalogProductSummary(p) {
  return {
    productId: String(p._id),
    name: p.name,
    sku: p.sku || "",
    category: p.categories?.[0] || "",
    categories: p.categories || [],
    subcategory: p.subcategory || "",
    image: p.productImages?.[0] || "",
    price: p.price ?? 0,
    discountedPrice: p.discountedPrice ?? p.price ?? 0,
    unit: p.unit || "",
    stock: p.stock ?? 0,
    inStock: p.inStock !== false,
    isActive: p.isActive !== false,
    brandName: p.brandName || "",
    varietyName: p.varietyName || "",
    description: p.description || "",
  };
}

export function serializeVendorProductRequest(doc) {
  const { _id, __v, ...rest } = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return rest;
}

const VENDOR_PRICING_FIELDS = ["price", "discountedPrice", "stock"];
// Name, brand, variety, category and subcategory always come from the admin catalog.
const VENDOR_TEXT_FIELDS = [{ field: "description", key: "customDescription", label: "Description", max: 1000 }];
const VENDOR_UNIT_TYPES = [
  "Piece", "Kg", "Gram", "Liter", "ML", "Box", "Pack", "Packet", "Bag",
  "Set", "Pair", "Dozen", "Bundle", "Bunch", "Meter", "CM",
];

const hasOverride = (value) => value !== null && value !== undefined;

function parseVendorUnit(value) {
  const text = String(value ?? "").trim();
  if (!text) return { value: "" };
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/);
  const qty = match ? Number(match[1]) : NaN;
  const type = match ? VENDOR_UNIT_TYPES.find((t) => t.toLowerCase() === match[2].toLowerCase()) : null;
  if (!type || !(qty > 0)) return { error: "Unit must be a quantity and a unit type, e.g. 500 Gram" };
  return { value: `${qty} ${type}` };
}

const CUSTOM_KEYS = [
  ...VENDOR_PRICING_FIELDS,
  ...VENDOR_TEXT_FIELDS.map((f) => f.key),
  "customUnit",
  "customInStock",
];

/**
 * VendorProduct rows merged with live catalog data; `catalogMissing` marks products admin removed or disabled.
 * Every editable field is this vendor's own value when set, otherwise the catalog's; `catalog` holds the
 * untouched catalog values for reference.
 */
export async function vendorProductsWithCatalog(vendorId) {
  const rows = await VendorProduct.find({ vendorId }).sort({ createdAt: -1 }).lean();
  const ids = rows.map((r) => r.productId).filter((id) => mongoose.Types.ObjectId.isValid(id));
  const products = ids.length
    ? await Product.find({ _id: { $in: ids } }).select(`${CATALOG_FIELDS} description`).lean()
    : [];
  const byId = new Map(products.map((p) => [String(p._id), catalogProductSummary(p)]));
  return rows.map(({ _id, __v, ...row }) => {
    const live = byId.get(row.productId);
    const base = live || { name: row.productName, image: row.productImage, category: row.category, unit: row.unit };
    const effective = {};
    for (const field of VENDOR_PRICING_FIELDS) {
      effective[field] = hasOverride(row[field]) ? row[field] : base[field] ?? null;
    }
    if (!hasOverride(row.discountedPrice) && hasOverride(row.price) && Number(effective.discountedPrice) > Number(row.price)) {
      effective.discountedPrice = row.price;
    }
    for (const { field, key } of VENDOR_TEXT_FIELDS) effective[field] = row[key] || base[field] || "";
    effective.unit = row.customUnit || base.unit || "";
    effective.inStock = hasOverride(row.customInStock) ? row.customInStock : base.inStock !== false;
    const catalog = {
      name: base.name || "",
      brandName: base.brandName || "",
      varietyName: base.varietyName || "",
      category: base.category || "",
      subcategory: base.subcategory || "",
      description: base.description || "",
      unit: base.unit || "",
      price: live?.price ?? null,
      discountedPrice: live?.discountedPrice ?? null,
      stock: live?.stock ?? null,
      inStock: live ? live.inStock : null,
    };
    return {
      ...row,
      ...base,
      ...effective,
      catalog,
      catalogPrice: catalog.price,
      catalogDiscountedPrice: catalog.discountedPrice,
      catalogStock: catalog.stock,
      catalogUnit: catalog.unit,
      customPricing: CUSTOM_KEYS.some((key) => hasOverride(row[key]) && row[key] !== ""),
      catalogMissing: !live || !live.isActive,
    };
  });
}

function parseOptionalAmount(value, label) {
  if (value === null || value === undefined || String(value).trim() === "") return { value: null };
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return { error: `${label} must be a number of 0 or more` };
  return { value: Math.round(n * 100) / 100 };
}

export async function updateVendorMyProduct(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const productId = String(req.params.productId || "").trim();
    const row = await VendorProduct.findOne({ vendorId, productId });
    if (!row) return res.status(404).json({ message: "This product is not in your products" });

    const update = {};
    const body = req.body || {};
    if (body.reset === true) {
      for (const field of VENDOR_PRICING_FIELDS) update[field] = null;
      for (const { key } of VENDOR_TEXT_FIELDS) update[key] = "";
      update.customUnit = "";
      update.customInStock = null;
    } else {
      for (const { field, key, label, max } of VENDOR_TEXT_FIELDS) {
        if (!(field in body)) continue;
        const text = String(body[field] ?? "").trim();
        if (text.length > max) return res.status(400).json({ message: `${label} can be at most ${max} characters` });
        update[key] = text;
      }
      if ("unit" in body) {
        const parsed = parseVendorUnit(body.unit);
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        update.customUnit = parsed.value;
      }
      if ("inStock" in body) {
        if (body.inStock !== null && typeof body.inStock !== "boolean") {
          return res.status(400).json({ message: "In stock must be true or false" });
        }
        update.customInStock = body.inStock;
      }
      const labels = { price: "MRP", discountedPrice: "Selling price", stock: "Stock" };
      for (const field of VENDOR_PRICING_FIELDS) {
        if (!(field in (req.body || {}))) continue;
        const parsed = parseOptionalAmount(req.body[field], labels[field]);
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        update[field] = field === "stock" && parsed.value !== null ? Math.floor(parsed.value) : parsed.value;
      }
      if (!Object.keys(update).length) return res.status(400).json({ message: "Nothing to update" });
    }

    const nextPrice = "price" in update ? update.price : row.price;
    const nextSelling = "discountedPrice" in update ? update.discountedPrice : row.discountedPrice;
    if (hasOverride(nextPrice) && hasOverride(nextSelling) && nextSelling > nextPrice) {
      return res.status(400).json({ message: "Selling price cannot be more than MRP" });
    }

    Object.assign(row, update, { pricingUpdatedAt: new Date() });
    await row.save();
    const products = await vendorProductsWithCatalog(vendorId);
    res.json(products.find((p) => p.productId === productId) || null);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update product" });
  }
}

export async function listVendorCatalogProducts(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 24));
    const filter = { ...ADMIN_CATALOG_FILTER };
    if (req.query.category) filter.categories = String(req.query.category);
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { sku: rx }, { subcategory: rx }, { brandName: rx }, { varietyName: rx }];
    }
    const [products, total, categories, added, pending] = await Promise.all([
      Product.find(filter).select(CATALOG_FIELDS).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
      Product.distinct("categories", ADMIN_CATALOG_FILTER),
      VendorProduct.find({ vendorId }).select("productId").lean(),
      VendorProductRequest.find({ vendorId, status: "Pending" }).select("productId").lean(),
    ]);
    const addedIds = new Set(added.map((r) => r.productId));
    const pendingIds = new Set(pending.map((r) => r.productId));
    res.json({
      page,
      limit,
      total,
      categories: categories.filter(Boolean).sort(),
      products: products.map((p) => {
        const summary = catalogProductSummary(p);
        return { ...summary, added: addedIds.has(summary.productId), requested: pendingIds.has(summary.productId) };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load catalog products" });
  }
}

export async function listVendorMyProducts(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const [products, requests] = await Promise.all([
      vendorProductsWithCatalog(vendorId),
      VendorProductRequest.find({ vendorId }).sort({ createdAt: -1 }).lean(),
    ]);
    res.json({ products, requests: requests.map(serializeVendorProductRequest) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load products" });
  }
}

export async function createVendorProductRequest(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const productId = String(req.body?.productId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ message: "Select a product from the catalog" });
    const product = await Product.findOne({ _id: productId, ...ADMIN_CATALOG_FILTER }).select(CATALOG_FIELDS).lean();
    if (!product) return res.status(404).json({ message: "This product is not available in the admin catalog" });

    const [alreadyAdded, pending] = await Promise.all([
      VendorProduct.exists({ vendorId, productId }),
      VendorProductRequest.exists({ vendorId, productId, status: "Pending" }),
    ]);
    if (alreadyAdded) return res.status(409).json({ message: "This product is already in your products" });
    if (pending) return res.status(409).json({ message: "A request for this product is already waiting for approval" });

    const summary = catalogProductSummary(product);
    const request = await VendorProductRequest.create({
      id: `vpr-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      vendorId,
      productId,
      productName: summary.name,
      productImage: summary.image,
      category: summary.category,
      unit: summary.unit,
      notes: String(req.body?.notes || "").trim().slice(0, 500),
      status: "Pending",
    });
    res.status(201).json(serializeVendorProductRequest(request));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to send product request" });
  }
}

export async function cancelVendorProductRequest(req, res) {
  try {
    const request = await VendorProductRequest.findOne({ id: req.params.requestId, vendorId: vendorIdOf(req) });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "Pending") {
      return res.status(400).json({ message: `This request is already ${request.status.toLowerCase()}` });
    }
    request.status = "Cancelled";
    await request.save();
    res.json(serializeVendorProductRequest(request));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to cancel request" });
  }
}
