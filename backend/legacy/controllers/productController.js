import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/order/Order.js";
import mongoose from "mongoose";
import { normalizeOptionalQuantity, resolvePricingFields } from "../utils/productPricing.js";
import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination.js";
import {
  attachStoreAvailability,
  loadNearestStoreCatalog,
  mergeStoreFilter,
} from "../../delivery-service/src/services/nearestStoreCatalog.js";

const MOST_PURCHASE_TAG = "Most Purchase";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeProductFlag = (value) => value === true || value === "true";

const normalizeImages = (productImages, images) => {
  const source = productImages ?? images;
  if (!Array.isArray(source)) return [];
  return source
    .map((img) => (typeof img === "string" ? img.trim() : ""))
    .filter(Boolean);
};

const normalizeVideoUrl = (value) => {
  if (value == null) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
};

const normalizeFeatures = (features) => {
  if (!Array.isArray(features)) return [];
  return features
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const normalizeSpecifications = (specifications) => {
  if (!Array.isArray(specifications)) return [];

  const normalized = [];
  const seen = new Set();

  specifications.forEach((item) => {
    const name = item?.name?.trim();
    const value = item?.value?.trim();
    if (!name || !value) return;

    const key = `${name.toLowerCase()}::${value.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({ name, value });
  });

  return normalized;
};

const normalizeColors = (colors) => {
  if (!Array.isArray(colors)) return [];

  return colors
    .map((color) => {
      if (typeof color === "string") {
        const name = color.trim();
        return name ? { name, hex: "#cccccc" } : null;
      }

      const name = color?.name?.trim();
      if (!name) return null;

      const hex = color?.hex?.trim() || "#cccccc";
      return { name, hex };
    })
    .filter(Boolean);
};

const normalizeCategories = (categories, categoryName, category) => {
  let list = [];

  if (Array.isArray(categories)) {
    list = categories
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  } else if (Array.isArray(categoryName)) {
    list = categoryName
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  } else if (typeof categoryName === "string" && categoryName.trim()) {
    list = [categoryName.trim()];
  } else if (typeof category === "string" && category.trim()) {
    list = [category.trim()];
  }

  const unique = [];
  const seen = new Set();

  list.forEach((name) => {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(name);
    }
  });

  return unique;
};

const normalizeSubcategories = (body) => {
  if (Array.isArray(body?.subcategories)) {
    const unique = [];
    const seen = new Set();

    body.subcategories.forEach((item) => {
      const name = typeof item === "string" ? item.trim() : "";
      if (!name) return;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(name);
      }
    });

    return unique;
  }

  if (typeof body?.subcategory === "string" && body.subcategory.trim()) {
    return [body.subcategory.trim()];
  }

  return [];
};

const normalizeInStock = (value, legacyStock) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (legacyStock !== undefined && legacyStock !== null && legacyStock !== "") {
    return Number(legacyStock) > 0;
  }
  return true;
};

const legacyStockFromInStock = (inStock) => (inStock ? 1 : 0);

const findCategoryByName = async (categoryName) =>
  Category.findOne({
    categoryName: {
      $regex: new RegExp(`^${escapeRegex(categoryName.trim())}$`, "i"),
    },
  });

const validateCategoriesAndSubcategories = async (categories, subcategories) => {
  if (!categories.length) {
    return { valid: false, message: "At least one category is required" };
  }

  if (!subcategories.length) {
    return { valid: false, message: "At least one subcategory is required" };
  }

  const mainCategoryName = categories[0];
  const mainCategory = await findCategoryByName(mainCategoryName);

  if (!mainCategory) {
    return {
      valid: false,
      message: `Main category "${mainCategoryName}" not found`,
    };
  }

  const normalizedSubcategories = [];

  for (const subcategoryName of subcategories) {
    const trimmedSub = subcategoryName?.trim();
    if (!trimmedSub) continue;

    const matchedSub = mainCategory.subcategories.find(
      (sub) => sub.toLowerCase() === trimmedSub.toLowerCase()
    );

    if (!matchedSub && mainCategory.subcategories.length > 0) {
      return {
        valid: false,
        message: `Subcategory "${trimmedSub}" must be one of: ${mainCategory.subcategories.join(", ")}`,
      };
    }

    const resolved = matchedSub || trimmedSub;
    if (!normalizedSubcategories.some((sub) => sub.toLowerCase() === resolved.toLowerCase())) {
      normalizedSubcategories.push(resolved);
    }
  }

  if (!normalizedSubcategories.length) {
    return { valid: false, message: "At least one subcategory is required" };
  }

  const normalizedCategories = [];

  for (const categoryName of categories) {
    const categoryDoc = await findCategoryByName(categoryName);

    if (!categoryDoc) {
      return {
        valid: false,
        message: `Category "${categoryName}" not found`,
      };
    }

    normalizedCategories.push(categoryDoc.categoryName);
  }

  return {
    valid: true,
    categories: normalizedCategories,
    subcategories: normalizedSubcategories,
    subcategory: normalizedSubcategories[0],
  };
};

const buildProductPayload = (body) => {
  const variantType = body.variantType === "multi" ? "multi" : "single";
  const pricingType = body.pricingType === "bulk" ? "bulk" : "single";
  const sku = body.sku?.trim().toUpperCase() ?? "";

  const mapBulkPricingInput = (bulkPricing) => ({
    slabs: bulkPricing?.slabs || [],
  });

  const mapQuantityFields = (source = {}) => ({
    minOrderQuantity: normalizeOptionalQuantity(
      source.minOrderQuantity ?? source.bulkPricing?.minOrderQuantity
    ),
    maxOrderQuantity: normalizeOptionalQuantity(
      source.maxOrderQuantity ?? source.maxOrderQty ?? source.bulkPricing?.maxOrderQuantity
    ),
    stepByQuantity: normalizeOptionalQuantity(
      source.stepByQuantity ?? source.bulkPricing?.stepByQuantity
    ),
  });

  return {
    name: body.name?.trim(),
    sku,
    categories: normalizeCategories(
      body.categories,
      body.categoryName,
      body.category
    ),
    subcategory: body.subcategory?.trim(),
    subcategories: normalizeSubcategories(body),
    brandName: (body.brandName ?? body.brand)?.trim(),
    variantType,
    variants: Array.isArray(body.variants)
      ? body.variants.map((variant) => ({
          name: variant.name?.trim(),
          quantity: variant.quantity != null ? Number(variant.quantity) || 1 : 1,
          unitType: (variant.unitType || "Piece").trim(),
          pricingType: variant.pricingType === "bulk" ? "bulk" : "single",
          bulkPricing:
            variant.pricingType === "bulk"
              ? mapBulkPricingInput(variant.bulkPricing)
              : { slabs: [] },
          ...mapQuantityFields(variant),
          price: variant.price,
          discountedPrice: variant.discountedPrice,
          discountedPercent: variant.discountedPercent,
          stock: variant.stock,
          inStock: normalizeInStock(variant.inStock, variant.stock),
          colors: normalizeColors(variant.colors),
        }))
      : [],
    pricingType,
    bulkPricing:
      pricingType === "bulk"
        ? mapBulkPricingInput(body.bulkPricing)
        : { slabs: [] },
    ...mapQuantityFields(body),
    price: body.price ?? body.original_price,
    discountedPrice: body.discountedPrice ?? body.discounted_price,
    discountedPercent: body.discountedPercent ?? body.discount_percent,
    ratings: body.ratings,
    stock: body.stock,
    inStock: normalizeInStock(body.inStock, body.stock),
    colors: normalizeColors(body.colors),
    productImages: normalizeImages(body.productImages, body.images),
    videoUrl: normalizeVideoUrl(body.videoUrl),
    description: body.description?.trim() ?? "",
    features: normalizeFeatures(body.features),
    specifications: normalizeSpecifications(body.specifications),
    warranty: body.warranty?.trim() ?? "",
    isActive: body.isActive !== false,
    justArrived: normalizeProductFlag(body.justArrived),
    hotSelling: normalizeProductFlag(body.hotSelling),
    cardGlowColor: (body.cardGlowColor ?? body.glowColor)?.trim() ?? "",
    badge: body.badge?.trim() ?? "",
    unit: body.unit?.trim() || "1 pc",
    farmerName: body.farmerName?.trim() || body.farmerDetails?.name?.trim() || "",
    farmerLocation: body.farmerLocation?.trim() || body.farmerDetails?.location?.trim() || "",
    farmerImage: body.farmerImage?.trim() || body.farmerDetails?.farmerImage?.trim() || "",
    farmImage: body.farmImage?.trim() || body.farmerDetails?.farmImage?.trim() || "",
    harvestingDate: body.harvestingDate?.trim() || body.farmerDetails?.harvestingDate?.trim() || "",
    farmerDetails: {
      name: body.farmerDetails?.name?.trim() || body.farmerName?.trim() || "",
      location: body.farmerDetails?.location?.trim() || body.farmerLocation?.trim() || "",
      farmerImage: body.farmerDetails?.farmerImage?.trim() || body.farmerImage?.trim() || "",
      farmImage: body.farmerDetails?.farmImage?.trim() || body.farmImage?.trim() || "",
      totalArea: body.farmerDetails?.totalArea?.trim() || "",
      cultivationArea: body.farmerDetails?.cultivationArea?.trim() || "",
      cropCycle: body.farmerDetails?.cropCycle?.trim() || "",
      agricultureMethod: body.farmerDetails?.agricultureMethod?.trim() || "",
      lastCropTaken: body.farmerDetails?.lastCropTaken?.trim() || "",
      currentCrop: body.farmerDetails?.currentCrop?.trim() || "",
      waterSource: body.farmerDetails?.waterSource?.trim() || "",
      soilType: body.farmerDetails?.soilType?.trim() || "",
      farmTools: body.farmerDetails?.farmTools?.trim() || "",
      harvestingDate: body.farmerDetails?.harvestingDate?.trim() || body.harvestingDate?.trim() || "",
      bio: body.farmerDetails?.bio?.trim() || "",
    },
  };
};

const resolveProductPricing = (payload) => {
  if (payload.variantType === "multi") {
    const namedVariants = payload.variants.filter((variant) => variant.name);

    if (namedVariants.length < 2) {
      return { error: "At least 2 variants are required for multi variant products" };
    }

    const names = new Set();
    for (const variant of namedVariants) {
      const key = variant.name.toLowerCase();
      if (names.has(key)) {
        return { error: `Duplicate variant name "${variant.name}"` };
      }
      names.add(key);
    }

    const productMinOrderQuantity = normalizeOptionalQuantity(payload.minOrderQuantity);
    const productMaxOrderQuantity = normalizeOptionalQuantity(payload.maxOrderQuantity);
    const productStepByQuantity = normalizeOptionalQuantity(payload.stepByQuantity);
    const resolvedVariants = [];

    for (const variant of namedVariants) {
      const inStock = normalizeInStock(variant.inStock, variant.stock);

      const pricing = resolvePricingFields({
        pricingType: variant.pricingType,
        bulkPricing: variant.bulkPricing,
        minOrderQuantity:
          variant.pricingType === "bulk" ? productMinOrderQuantity : null,
        maxOrderQuantity:
          variant.pricingType === "bulk" ? productMaxOrderQuantity : null,
        stepByQuantity: null,
        price: variant.price,
        discountedPrice: variant.discountedPrice,
        discountedPercent: variant.discountedPercent,
      });

      if (pricing.error) {
        return { error: `Variant "${variant.name}": ${pricing.error}` };
      }

      resolvedVariants.push({
        name: variant.name,
        pricingType: pricing.pricingType,
        bulkPricing: pricing.bulkPricing,
        minOrderQuantity: null,
        maxOrderQuantity: null,
        stepByQuantity: null,
        price: pricing.price,
        discountedPrice: pricing.discountedPrice,
        discountedPercent: pricing.discountedPercent,
        inStock,
        stock: legacyStockFromInStock(inStock),
        colors: normalizeColors(variant.colors),
      });
    }

    const productInStock = resolvedVariants.some((variant) => variant.inStock);

    const minDiscounted = Math.min(
      ...resolvedVariants.map((variant) => variant.discountedPrice)
    );
    const maxPrice = Math.max(...resolvedVariants.map((variant) => variant.price));
    const hasBulk = resolvedVariants.some((variant) => variant.pricingType === "bulk");

    return {
      variantType: "multi",
      variants: resolvedVariants,
      inStock: productInStock,
      stock: legacyStockFromInStock(productInStock),
      colors: [],
      pricingType: hasBulk ? "bulk" : "single",
      bulkPricing: { slabs: [] },
      minOrderQuantity: productMinOrderQuantity,
      maxOrderQuantity: productMaxOrderQuantity,
      stepByQuantity: productStepByQuantity,
      price: maxPrice,
      discountedPrice: minDiscounted,
      discountedPercent:
        maxPrice > 0
          ? Math.round(((maxPrice - minDiscounted) / maxPrice) * 100)
          : 0,
    };
  }

  const pricing = resolvePricingFields(payload);
  if (pricing.error) {
    return { error: pricing.error };
  }

  const inStock = normalizeInStock(payload.inStock, payload.stock);

  return {
    variantType: "single",
    variants: [],
    inStock,
    stock: legacyStockFromInStock(inStock),
    colors: normalizeColors(payload.colors),
    pricingType: pricing.pricingType,
    bulkPricing: pricing.bulkPricing,
    minOrderQuantity: pricing.minOrderQuantity,
    maxOrderQuantity: normalizeOptionalQuantity(payload.maxOrderQuantity),
    stepByQuantity: pricing.stepByQuantity,
    price: pricing.price,
    discountedPrice: pricing.discountedPrice,
    discountedPercent: pricing.discountedPercent,
  };
};

const validateRequiredFields = (payload) => {
  const missing = [];

  if (!payload.name) missing.push("name");
  if (!payload.categories.length) missing.push("categories");
  if (payload.categories.length > 4) missing.push("categories (max 4)");
  if (!payload.subcategories?.length && !payload.subcategory) {
    missing.push("subcategories");
  }
  if (!payload.brandName) missing.push("brandName");
  if (!payload.productImages.length) missing.push("productImages");

  if (missing.length > 0) {
    return `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required`;
  }

  return null;
};

const sortOptions = { "categories.0": 1, subcategory: 1, createdAt: -1 };

async function getPurchaseCountsByProductIds(productIds = []) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return new Map();
  }

  const counts = await Order.aggregate([
    {
      $match: {
        status: { $nin: ["attempted", "cancelled", "return"] },
        "items.product": { $in: productIds },
      },
    },
    { $unwind: "$items" },
    { $match: { "items.product": { $in: productIds } } },
    {
      $group: {
        _id: "$items.product",
        purchaseCount: { $sum: "$items.quantity" },
      },
    },
  ]);

  return new Map(
    counts.map((entry) => [String(entry._id), Number(entry.purchaseCount) || 0])
  );
}

export const getProducts = async (req, res) => {
  try {
    const catalog = await loadNearestStoreCatalog(req.query);
    const filter = mergeStoreFilter({ isActive: true }, catalog);

    if (!catalog.requested && req.query.justArrived === "true") {
      filter.justArrived = true;
    }

    if (!catalog.requested && req.query.hotSelling === "true") {
      filter.hotSelling = true;
    }

    if (req.query.section?.trim()) {
      filter.section = req.query.section.trim().toLowerCase();
    }

    if (req.query.storeType?.trim()) {
      filter.storeType = req.query.storeType.trim().toLowerCase();
    }

    if (req.query.ids) {
      const ids = String(req.query.ids)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (ids.length) {
        filter._id = { $in: ids };
      }
    }

    if (
      req.query.mostPurchase === "true" ||
      req.query.categoryName?.trim().toLowerCase() ===
        MOST_PURCHASE_TAG.toLowerCase()
    ) {
      filter.categories = MOST_PURCHASE_TAG;
    } else if (req.query.categoryName?.trim() && !catalog.requested) {
      filter.categories = req.query.categoryName.trim();
    }

    if (req.query.subcategory?.trim()) {
      const subRegex = new RegExp(
        `^${escapeRegex(req.query.subcategory.trim())}$`,
        "i"
      );
      filter.$or = [{ subcategory: subRegex }, { subcategories: subRegex }];
    }

    if (req.query.q?.trim()) {
      const term = escapeRegex(req.query.q.trim());
      const regex = new RegExp(term, "i");
      filter.$or = [
        { name: regex },
        { brandName: regex },
        { subcategory: regex },
        { categories: regex },
        { description: regex },
        { sku: regex },
      ];
    }

    if (req.query.brandName?.trim()) {
      filter.brandName = {
        $regex: new RegExp(
          `^${escapeRegex(req.query.brandName.trim())}$`,
          "i"
        ),
      };
    }

    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      filter.discountedPrice = {};
      if (Number.isFinite(minPrice)) filter.discountedPrice.$gte = minPrice;
      if (Number.isFinite(maxPrice)) filter.discountedPrice.$lte = maxPrice;
    }

    let sort = { createdAt: -1, name: 1 };
    const sortParam = String(req.query.sort || "newest").trim();
    if (sortParam === "price-asc") sort = { discountedPrice: 1, name: 1 };
    else if (sortParam === "price-desc") sort = { discountedPrice: -1, name: 1 };
    else if (sortParam === "newest") sort = { createdAt: -1, name: 1 };
    else if (sortParam === "oldest") sort = { createdAt: 1, name: 1 };
    else if (sortParam === "name") sort = { name: 1 };
    else if (sortParam === "brand") sort = { brandName: 1, name: 1 };

    const usePagination =
      req.query.page !== undefined &&
      req.query.page !== null &&
      String(req.query.page).trim() !== "";

    if (usePagination) {
      const { page, limit: requestedLimit, skip } = getPaginationParams(req.query, 50);
      const limit = Math.min(requestedLimit, 50);

      const [total, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter).sort(sort).skip(skip).limit(limit),
      ]);

      const purchaseCounts = await getPurchaseCountsByProductIds(
        products.map((item) => item._id)
      );
      const data = attachStoreAvailability(
        products.map((item) => ({
          ...item.toObject(),
          purchaseCount: purchaseCounts.get(String(item._id)) || 0,
        })),
        catalog
      );

      return res.status(200).json({
        ...buildPaginatedResponse(data, total, page, limit),
        store: catalog.store,
      });
    }

    let query = Product.find(filter).sort(sort);

    if (req.query.limit) {
      const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
      query = query.limit(limit);
    }

    const products = await query;
    const purchaseCounts = await getPurchaseCountsByProductIds(products.map((item) => item._id));
    let data = attachStoreAvailability(
      products.map((item) => ({
        ...item.toObject(),
        purchaseCount: purchaseCounts.get(String(item._id)) || 0,
      })),
      catalog
    );

    if (!data.length && catalog.items?.length) {
      const cats = [...new Set(catalog.items.map((item) => item.category).filter(Boolean))];
      const loose = await Product.find({
        isActive: true,
        ...(req.query.categoryName?.trim()
          ? { categories: req.query.categoryName.trim() }
          : cats.length
            ? { categories: { $in: cats } }
            : {}),
      })
        .sort(sort)
        .limit(80);
      const looseCounts = await getPurchaseCountsByProductIds(loose.map((item) => item._id));
      data = attachStoreAvailability(
        loose.map((item) => ({
          ...item.toObject(),
          purchaseCount: looseCounts.get(String(item._id)) || 0,
        })),
        catalog
      );
      if (req.query.limit) {
        data = data.slice(0, Math.min(parseInt(req.query.limit, 10) || 15, 50));
      }
    }
    res.status(200).json({ success: true, data, store: catalog.store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, category, sortBy, sortDir, status } = req.query;

    const buildBaseFilter = () => {
      const filter = {};
      const andClauses = [];

      if (category && category !== "all") {
        filter.categories = category;
      }

      const query = typeof search === "string" ? search.trim() : "";
      if (query) {
        const pattern = new RegExp(escapeRegex(query), "i");
        andClauses.push({
          $or: [
            { name: pattern },
            { brandName: pattern },
            { subcategory: pattern },
            { subcategories: pattern },
            { categories: pattern },
            { sku: pattern },
          ],
        });
      }

      if (andClauses.length) {
        const rootClauses = Object.entries(filter).map(([key, value]) => ({ [key]: value }));
        Object.keys(filter).forEach((key) => delete filter[key]);
        filter.$and = [...rootClauses, ...andClauses];
      }

      return filter;
    };

    const mergeProductFilters = (baseFilter, extraFilter) => {
      if (!Object.keys(baseFilter).length) return { ...extraFilter };
      if (!Object.keys(extraFilter).length) return { ...baseFilter };
      return { $and: [baseFilter, extraFilter] };
    };

    const getStatusExtraFilter = (statusFilter) => {
      if (statusFilter === "inactive") {
        return { isActive: false };
      }
      if (statusFilter === "out_of_stock") {
        return { $or: [{ inStock: false }, { stock: { $lte: 0 } }] };
      }
      if (statusFilter === "low_stock") {
        return { isActive: true, inStock: true, stock: { $gt: 0, $lte: 5 } };
      }
      if (statusFilter === "active") {
        return { isActive: true, inStock: true, stock: { $gt: 0 } };
      }
      return {};
    };

    const baseFilter = buildBaseFilter();
    const statusFilter = typeof status === "string" ? status.trim().toLowerCase() : "";
    const filter = mergeProductFilters(baseFilter, getStatusExtraFilter(statusFilter));

    const sortMap = {
      name: "name",
      price: "discountedPrice",
      stock: "inStock",
      brand: "brandName",
      sku: "sku",
      createdAt: "createdAt",
      status: "isActive",
    };
    const sortField = sortMap[sortBy] || "createdAt";
    const sortOrder = sortDir === "desc" ? -1 : 1;

    const [total, products, allCount, activeCount, inactiveCount, outOfStockCount, lowStockCount] =
      await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
        Product.countDocuments(baseFilter),
        Product.countDocuments(mergeProductFilters(baseFilter, getStatusExtraFilter("active"))),
        Product.countDocuments(mergeProductFilters(baseFilter, getStatusExtraFilter("inactive"))),
        Product.countDocuments(
          mergeProductFilters(baseFilter, getStatusExtraFilter("out_of_stock"))
        ),
        Product.countDocuments(mergeProductFilters(baseFilter, getStatusExtraFilter("low_stock"))),
      ]);

    const response = buildPaginatedResponse(products, total, page, limit);
    response.statusCounts = {
      all: allCount,
      active: activeCount,
      inactive: inactiveCount,
      out_of_stock: outOfStockCount,
      low_stock: lowStockCount,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const catalog = await loadNearestStoreCatalog(req.query);
    const purchaseCounts = await getPurchaseCountsByProductIds([product._id]);
    const [decorated] = attachStoreAvailability(
      [
        {
          ...product.toObject(),
          purchaseCount: purchaseCounts.get(String(product._id)) || 0,
        },
      ],
      catalog
    );

    res.status(200).json({
      success: true,
      data: decorated || {
        ...product.toObject(),
        purchaseCount: purchaseCounts.get(String(product._id)) || 0,
        inStock: false,
        stock: 0,
        storeStock: 0,
        storeName: catalog.store?.storeName,
      },
      store: catalog.store,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSimilarProductLimit = (rawLimit) =>
  Math.min(Math.max(parseInt(rawLimit, 10) || 12, 1), 24);

const getRelevantCategories = (product) =>
  (product.categories || [])
    .map((category) => String(category || "").trim())
    .filter(
      (category) =>
        category && category.toLowerCase() !== MOST_PURCHASE_TAG.toLowerCase()
    );

const getRelevantSubcategories = (product) => [
  ...new Set(
    [product.subcategory, ...(product.subcategories || [])]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  ),
];

const buildSubcategoryMatch = (subcategories) => {
  if (!subcategories.length) return null;

  const matches = [];
  subcategories.forEach((subcategory) => {
    const regex = new RegExp(`^${escapeRegex(subcategory)}$`, "i");
    matches.push({ subcategory: regex }, { subcategories: regex });
  });

  return { $or: matches };
};

const fetchSimilarProductBatch = async ({ filter, limit, excludeIds }) => {
  if (limit <= 0) return [];

  return Product.find({
    ...filter,
    _id: { $nin: excludeIds },
  })
    .sort({ ratings: -1, hotSelling: -1, createdAt: -1 })
    .limit(limit);
};

export const getSimilarProducts = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const limit = getSimilarProductLimit(req.query.limit);
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const catalog = await loadNearestStoreCatalog(req.query);
    const baseFilter = mergeStoreFilter({ isActive: true }, catalog);
    const excludeIds = [product._id];
    const similar = [];
    const subcategories = getRelevantSubcategories(product);
    const categories = getRelevantCategories(product);
    const subcategoryMatch = buildSubcategoryMatch(subcategories);

    if (subcategoryMatch) {
      const matches = await fetchSimilarProductBatch({
        filter: { ...baseFilter, ...subcategoryMatch },
        limit: limit - similar.length,
        excludeIds,
      });
      similar.push(...matches);
      excludeIds.push(...matches.map((item) => item._id));
    }

    if (similar.length < limit && categories.length) {
      const matches = await fetchSimilarProductBatch({
        filter: { ...baseFilter, categories: { $in: categories } },
        limit: limit - similar.length,
        excludeIds,
      });
      similar.push(...matches);
      excludeIds.push(...matches.map((item) => item._id));
    }

    if (similar.length < limit && product.brandName?.trim()) {
      const brandRegex = new RegExp(
        `^${escapeRegex(product.brandName.trim())}$`,
        "i"
      );
      const matches = await fetchSimilarProductBatch({
        filter: { ...baseFilter, brandName: brandRegex },
        limit: limit - similar.length,
        excludeIds,
      });
      similar.push(...matches);
      excludeIds.push(...matches.map((item) => item._id));
    }

    if (similar.length < limit) {
      const matches = await fetchSimilarProductBatch({
        filter: baseFilter,
        limit: limit - similar.length,
        excludeIds,
      });
      similar.push(...matches);
    }

    res.status(200).json({
      success: true,
      data: attachStoreAvailability(similar, catalog),
      store: catalog.store,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const payload = buildProductPayload(req.body);
    const requiredError = validateRequiredFields(payload);

    if (requiredError) {
      return res.status(400).json({ success: false, message: requiredError });
    }

    const categoryCheck = await validateCategoriesAndSubcategories(
      payload.categories,
      payload.subcategories?.length ? payload.subcategories : [payload.subcategory].filter(Boolean)
    );

    if (!categoryCheck.valid) {
      return res
        .status(400)
        .json({ success: false, message: categoryCheck.message });
    }

    const pricingFields = resolveProductPricing(payload);
    if (pricingFields.error) {
      return res.status(400).json({ success: false, message: pricingFields.error });
    }

    const product = await Product.create({
      name: payload.name,
      sku: payload.sku,
      categories: categoryCheck.categories,
      subcategory: categoryCheck.subcategory,
      subcategories: categoryCheck.subcategories,
      brandName: payload.brandName,
      variantType: pricingFields.variantType,
      variants: pricingFields.variants,
      pricingType: pricingFields.pricingType,
      bulkPricing: pricingFields.bulkPricing,
      minOrderQuantity: pricingFields.minOrderQuantity,
      maxOrderQuantity: pricingFields.maxOrderQuantity,
      stepByQuantity: pricingFields.stepByQuantity,
      price: pricingFields.price,
      discountedPrice: pricingFields.discountedPrice,
      discountedPercent: pricingFields.discountedPercent,
      ratings: payload.ratings ?? 0,
      inStock: pricingFields.inStock ?? payload.inStock ?? true,
      stock: pricingFields.stock ?? legacyStockFromInStock(payload.inStock),
      colors: pricingFields.colors ?? [],
      productImages: payload.productImages,
      videoUrl: payload.videoUrl,
      description: payload.description,
      features: payload.features,
      specifications: payload.specifications,
      warranty: payload.warranty,
      isActive: payload.isActive ?? true,
      justArrived: payload.justArrived,
      hotSelling: payload.hotSelling,
      cardGlowColor: payload.cardGlowColor,
      badge: payload.badge,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res
        .status(400)
        .json({ success: false, message: "A product with this SKU already exists" });
    }
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const payload = buildProductPayload({
      name: req.body.name ?? existing.name,
      categories: req.body.categories ?? existing.categories,
      categoryName: req.body.categoryName,
      category: req.body.category,
      subcategory: req.body.subcategory ?? existing.subcategory,
      subcategories: req.body.subcategories ?? existing.subcategories,
      brandName: req.body.brandName ?? req.body.brand ?? existing.brandName,
      variantType: req.body.variantType ?? existing.variantType,
      variants: req.body.variants ?? existing.variants,
      pricingType: req.body.pricingType ?? existing.pricingType,
      bulkPricing: req.body.bulkPricing ?? existing.bulkPricing,
      price: req.body.price ?? req.body.original_price ?? existing.price,
      discountedPrice:
        req.body.discountedPrice ??
        req.body.discounted_price ??
        existing.discountedPrice,
      discountedPercent:
        req.body.discountedPercent ??
        req.body.discount_percent ??
        existing.discountedPercent,
      ratings: req.body.ratings ?? existing.ratings,
      stock: req.body.stock ?? existing.stock,
      inStock: req.body.inStock ?? existing.inStock,
      colors: req.body.colors ?? existing.colors,
      productImages:
        req.body.productImages ?? req.body.images ?? existing.productImages,
      videoUrl:
        req.body.videoUrl !== undefined
          ? normalizeVideoUrl(req.body.videoUrl)
          : existing.videoUrl,
      description: req.body.description ?? existing.description,
      features: req.body.features ?? existing.features,
      specifications: req.body.specifications ?? existing.specifications,
      warranty: req.body.warranty ?? existing.warranty,
      isActive: req.body.isActive ?? existing.isActive,
      justArrived:
        req.body.justArrived !== undefined
          ? req.body.justArrived
          : existing.justArrived,
      hotSelling:
        req.body.hotSelling !== undefined
          ? req.body.hotSelling
          : existing.hotSelling,
      sku: req.body.sku ?? existing.sku,
      minOrderQuantity:
        req.body.minOrderQuantity !== undefined
          ? req.body.minOrderQuantity
          : existing.minOrderQuantity,
      maxOrderQuantity:
        req.body.maxOrderQuantity !== undefined
          ? req.body.maxOrderQuantity
          : existing.maxOrderQuantity,
      stepByQuantity:
        req.body.stepByQuantity !== undefined
          ? req.body.stepByQuantity
          : existing.stepByQuantity,
      cardGlowColor:
        req.body.cardGlowColor !== undefined
          ? req.body.cardGlowColor
          : existing.cardGlowColor,
      badge:
        req.body.badge !== undefined
          ? req.body.badge
          : existing.badge,
    });

    const requiredError = validateRequiredFields(payload);

    if (requiredError) {
      return res.status(400).json({ success: false, message: requiredError });
    }

    const categoryCheck = await validateCategoriesAndSubcategories(
      payload.categories,
      payload.subcategories?.length ? payload.subcategories : [payload.subcategory].filter(Boolean)
    );

    if (!categoryCheck.valid) {
      return res
        .status(400)
        .json({ success: false, message: categoryCheck.message });
    }

    const pricingFields = resolveProductPricing(payload);
    if (pricingFields.error) {
      return res.status(400).json({ success: false, message: pricingFields.error });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: payload.name,
        sku: payload.sku,
        categories: categoryCheck.categories,
        subcategory: categoryCheck.subcategory,
        subcategories: categoryCheck.subcategories,
        brandName: payload.brandName,
        variantType: pricingFields.variantType,
        variants: pricingFields.variants,
        pricingType: pricingFields.pricingType,
        bulkPricing: pricingFields.bulkPricing,
        minOrderQuantity: pricingFields.minOrderQuantity,
        maxOrderQuantity: pricingFields.maxOrderQuantity,
        stepByQuantity: pricingFields.stepByQuantity,
        price: pricingFields.price,
        discountedPrice: pricingFields.discountedPrice,
        discountedPercent: pricingFields.discountedPercent,
        ratings: payload.ratings,
        inStock: pricingFields.inStock ?? payload.inStock ?? true,
        stock: pricingFields.stock ?? legacyStockFromInStock(payload.inStock),
        colors: pricingFields.colors ?? [],
        productImages: payload.productImages,
        videoUrl: payload.videoUrl,
        description: payload.description,
        features: payload.features,
        specifications: payload.specifications,
        warranty: payload.warranty,
        isActive: payload.isActive,
        justArrived: payload.justArrived,
        hotSelling: payload.hotSelling,
        cardGlowColor: payload.cardGlowColor,
        badge: payload.badge,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res
        .status(400)
        .json({ success: false, message: "A product with this SKU already exists" });
    }
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
