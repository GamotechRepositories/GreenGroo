import mongoose from "mongoose";
import Product from "../../legacy/models/Product.js";
import {
  GiftCard,
  DynamicPricingRule,
  BulkSellingDeal,
} from "./models.js";
import { generateGiftCode, previewGiftCard } from "./giftCardService.js";
import { invalidatePricingCache } from "./pricingAttach.js";
import { parseCsv, toCsv } from "./csv.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

function searchRegex(q) {
  const value = String(q || "").trim();
  if (!value) return null;
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function listGiftCards(req, res, next) {
  try {
    const q = searchRegex(req.query.search);
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    if (q) filter.$or = [{ code: q }, { issuedToName: q }, { issuedToPhone: q }];
    const cards = await GiftCard.find(filter).sort({ createdAt: -1 }).lean();
    const [issued, activeBalance, redeemed] = await Promise.all([
      GiftCard.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      GiftCard.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]),
      GiftCard.countDocuments({ status: "redeemed" }),
    ]);
    return ok(res, cards, {
      stats: {
        count: cards.length,
        totalIssued: issued[0]?.total || 0,
        activeBalance: activeBalance[0]?.total || 0,
        redeemed,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createGiftCard(req, res, next) {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      return fail(res, 400, "Amount must be at least ₹1");
    }
    let code = String(req.body.code || "").trim().toUpperCase() || generateGiftCode();
    while (await GiftCard.findOne({ code })) {
      code = generateGiftCode();
    }
    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    const card = await GiftCard.create({
      code,
      amount,
      balance: amount,
      status: "active",
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      issuedToName: String(req.body.issuedToName || "").trim(),
      issuedToPhone: String(req.body.issuedToPhone || "").trim(),
      note: String(req.body.note || "").trim(),
    });
    return res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
}

export async function updateGiftCard(req, res, next) {
  try {
    const card = await GiftCard.findById(req.params.id);
    if (!card) return fail(res, 404, "Gift card not found");
    const allowed = ["status", "expiresAt", "issuedToName", "issuedToPhone", "note"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) card[key] = req.body[key] || (key === "expiresAt" ? null : "");
    });
    if (req.body.expiresAt) card.expiresAt = new Date(req.body.expiresAt);
    await card.save();
    return ok(res, card);
  } catch (error) {
    next(error);
  }
}

export async function deleteGiftCard(req, res, next) {
  try {
    const card = await GiftCard.findByIdAndDelete(req.params.id);
    if (!card) return fail(res, 404, "Gift card not found");
    return ok(res, { id: req.params.id });
  } catch (error) {
    next(error);
  }
}

export async function validateGiftCardPublic(req, res, next) {
  try {
    const result = await previewGiftCard(req.body.code, req.body.payableAmount ?? req.body.subtotal);
    if (result.error) return fail(res, 400, result.error);
    return ok(res, result);
  } catch (error) {
    next(error);
  }
}

export async function listPricingRules(req, res, next) {
  try {
    const rules = await DynamicPricingRule.find().sort({ createdAt: -1 }).lean();
    return ok(res, rules, { stats: { count: rules.length, enabled: rules.filter((r) => r.enabled).length } });
  } catch (error) {
    next(error);
  }
}

export async function listActivePricingPublic(_req, res, next) {
  try {
    const { getActivePricingRules } = await import("./pricingAttach.js");
    const rules = await getActivePricingRules();
    return ok(res, rules);
  } catch (error) {
    next(error);
  }
}

function parsePricingBody(body) {
  const minQuantity = Number(body.minQuantity);
  const discountValue = Number(body.discountValue);
  if (!String(body.name || "").trim()) return { error: "Name is required" };
  if (!Number.isFinite(minQuantity) || minQuantity < 1) return { error: "Min quantity must be at least 1" };
  if (!Number.isFinite(discountValue) || discountValue < 0) return { error: "Discount value is required" };
  if (body.discountType === "percentage" && discountValue > 100) {
    return { error: "Percentage discount cannot exceed 100" };
  }
  return {
    name: String(body.name).trim(),
    enabled: body.enabled !== false,
    minQuantity,
    discountType: body.discountType === "fixed" ? "fixed" : "percentage",
    discountValue,
    applyTo: ["all", "products", "categories"].includes(body.applyTo) ? body.applyTo : "all",
    productIds: Array.isArray(body.productIds) ? body.productIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) : [],
    categoryNames: Array.isArray(body.categoryNames)
      ? body.categoryNames.map((name) => String(name).trim()).filter(Boolean)
      : String(body.categoryNames || "")
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
  };
}

export async function createPricingRule(req, res, next) {
  try {
    const payload = parsePricingBody(req.body);
    if (payload.error) return fail(res, 400, payload.error);
    const rule = await DynamicPricingRule.create(payload);
    invalidatePricingCache();
    return res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
}

export async function updatePricingRule(req, res, next) {
  try {
    const rule = await DynamicPricingRule.findById(req.params.id);
    if (!rule) return fail(res, 404, "Pricing rule not found");
    const payload = parsePricingBody({ ...rule.toObject(), ...req.body });
    if (payload.error) return fail(res, 400, payload.error);
    Object.assign(rule, payload);
    await rule.save();
    invalidatePricingCache();
    return ok(res, rule);
  } catch (error) {
    next(error);
  }
}

export async function deletePricingRule(req, res, next) {
  try {
    const rule = await DynamicPricingRule.findByIdAndDelete(req.params.id);
    if (!rule) return fail(res, 404, "Pricing rule not found");
    invalidatePricingCache();
    return ok(res, { id: req.params.id });
  } catch (error) {
    next(error);
  }
}

async function applyDealToProduct(deal) {
  const product = await Product.findById(deal.productId);
  if (!product) return { error: "Product not found" };
  const base = Number(product.discountedPrice || product.price || 0);
  const unit =
    Number(deal.pricePerUnit) > 0
      ? Number(deal.pricePerUnit)
      : Math.round(base * (1 - Number(deal.discountPercent || 0) / 100) * 100) / 100;
  product.pricingType = "bulk";
  product.bulkPricing = {
    slabs: [
      {
        minQuantity: deal.minQuantity,
        maxQuantity: deal.maxQuantity || null,
        pricePerUnit: unit,
        originalPricePerUnit: base,
      },
    ],
  };
  product.minOrderQuantity = deal.minQuantity;
  await product.save();
  return { productName: product.name, sku: product.sku || "", unit };
}

export async function listBulkDeals(req, res, next) {
  try {
    const deals = await BulkSellingDeal.find().sort({ createdAt: -1 }).lean();
    return ok(res, deals, { stats: { count: deals.length, enabled: deals.filter((d) => d.enabled).length } });
  } catch (error) {
    next(error);
  }
}

export async function createBulkDeal(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.body.productId)) {
      return fail(res, 400, "A valid product is required");
    }
    const minQuantity = Number(req.body.minQuantity || 10);
    const deal = await BulkSellingDeal.create({
      name: String(req.body.name || "").trim() || `Buy ${minQuantity}+ wholesale`,
      enabled: req.body.enabled !== false,
      productId: req.body.productId,
      minQuantity,
      maxQuantity: req.body.maxQuantity ? Number(req.body.maxQuantity) : null,
      discountPercent: Number(req.body.discountPercent ?? 5),
      pricePerUnit: req.body.pricePerUnit ? Number(req.body.pricePerUnit) : null,
    });
    const applied = await applyDealToProduct(deal);
    if (applied.error) return fail(res, 404, applied.error);
    deal.productName = applied.productName;
    deal.sku = applied.sku;
    await deal.save();
    return res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
}

export async function updateBulkDeal(req, res, next) {
  try {
    const deal = await BulkSellingDeal.findById(req.params.id);
    if (!deal) return fail(res, 404, "Bulk deal not found");
    ["name", "enabled", "productId", "minQuantity", "maxQuantity", "discountPercent", "pricePerUnit"].forEach(
      (key) => {
        if (req.body[key] !== undefined) deal[key] = req.body[key];
      }
    );
    const applied = await applyDealToProduct(deal);
    if (applied.error) return fail(res, 404, applied.error);
    deal.productName = applied.productName;
    deal.sku = applied.sku;
    await deal.save();
    return ok(res, deal);
  } catch (error) {
    next(error);
  }
}

export async function deleteBulkDeal(req, res, next) {
  try {
    const deal = await BulkSellingDeal.findByIdAndDelete(req.params.id);
    if (!deal) return fail(res, 404, "Bulk deal not found");
    return ok(res, { id: req.params.id });
  } catch (error) {
    next(error);
  }
}

const PRODUCT_CSV_HEADERS = [
  "sku",
  "name",
  "brandName",
  "categories",
  "subcategory",
  "price",
  "discountedPrice",
  "stock",
  "isActive",
];

function serializeProductRow(product) {
  return {
    sku: product.sku || "",
    name: product.name || "",
    brandName: product.brandName || "",
    categories: Array.isArray(product.categories) ? product.categories.join("|") : "",
    subcategory: product.subcategory || "",
    price: product.price ?? "",
    discountedPrice: product.discountedPrice ?? "",
    stock: product.stock ?? "",
    isActive: product.isActive !== false,
  };
}

export async function exportProductsCsv(_req, res, next) {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    const csv = toCsv(products.map(serializeProductRow), PRODUCT_CSV_HEADERS);
    return ok(res, { csv, count: products.length, headers: PRODUCT_CSV_HEADERS });
  } catch (error) {
    next(error);
  }
}

export async function exportProductsJson(_req, res, next) {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return ok(res, products.map(serializeProductRow), { count: products.length });
  } catch (error) {
    next(error);
  }
}

async function upsertProductRow(row) {
  const sku = String(row.sku || "").trim();
  const name = String(row.name || "").trim();
  const price = Number(row.price);
  const discountedPrice = Number(row.discountedPrice ?? row.price);
  const stock = Number(row.stock);
  const brandName = String(row.brandName || "GreenGrocc").trim() || "GreenGrocc";
  const categories = String(row.categories || "Grocery")
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const subcategory = String(row.subcategory || categories[0] || "General").trim();
  const isActive = !["false", "0", "no", "inactive"].includes(String(row.isActive ?? "true").toLowerCase());

  if (!sku && !name) return { error: "sku or name is required" };

  let product = sku ? await Product.findOne({ sku }) : null;
  if (product) {
    if (name) product.name = name;
    if (brandName) product.brandName = brandName;
    if (categories.length) product.categories = categories;
    if (subcategory) product.subcategory = subcategory;
    if (Number.isFinite(price)) product.price = price;
    if (Number.isFinite(discountedPrice)) product.discountedPrice = discountedPrice;
    if (Number.isFinite(stock)) {
      product.stock = stock;
      product.inStock = stock > 0;
    }
    product.isActive = isActive;
    await product.save();
    return { action: "updated", sku: product.sku, name: product.name };
  }

  if (!name || !Number.isFinite(price)) {
    return { error: "New products need name and price" };
  }

  const created = await Product.create({
    sku: sku || undefined,
    name,
    brandName,
    categories: categories.length ? categories : ["Grocery"],
    subcategory,
    subcategories: [subcategory],
    price,
    discountedPrice: Number.isFinite(discountedPrice) ? discountedPrice : price,
    discountedPercent:
      price > 0 && Number.isFinite(discountedPrice)
        ? Math.max(0, Math.round(((price - discountedPrice) / price) * 100))
        : 0,
    stock: Number.isFinite(stock) ? stock : 0,
    inStock: Number.isFinite(stock) ? stock > 0 : true,
    isActive,
    productImages: [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop",
    ],
  });
  return { action: "created", sku: created.sku, name: created.name };
}

export async function importProductsCsv(req, res, next) {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : parseCsv(req.body.csv);
    if (!rows.length) return fail(res, 400, "No CSV rows found");
    const results = [];
    for (const row of rows) {
      try {
        results.push(await upsertProductRow(row));
      } catch (error) {
        results.push({ error: error.message, sku: row.sku, name: row.name });
      }
    }
    return ok(res, results, {
      stats: {
        total: results.length,
        created: results.filter((row) => row.action === "created").length,
        updated: results.filter((row) => row.action === "updated").length,
        failed: results.filter((row) => row.error).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function importProductsJson(req, res, next) {
  try {
    const rows = Array.isArray(req.body.products) ? req.body.products : req.body.rows;
    if (!Array.isArray(rows) || !rows.length) return fail(res, 400, "Provide a products array");
    req.body.rows = rows;
    return importProductsCsv(req, res, next);
  } catch (error) {
    next(error);
  }
}

export async function listProductsLite(_req, res, next) {
  try {
    const products = await Product.find({ isActive: true })
      .select("name sku discountedPrice price stock")
      .sort({ name: 1 })
      .limit(500)
      .lean();
    return ok(res, products);
  } catch (error) {
    next(error);
  }
}
