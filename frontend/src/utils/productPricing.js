const DEFAULT_SINGLE_MOQ = 1;

export function isMultiVariant(product) {
  return product?.variantType === "multi" && Array.isArray(product?.variants) && product.variants.length > 0;
}

export function getVariant(product, variantName) {
  if (!isMultiVariant(product) || !variantName) return null;

  const target = String(variantName).trim().toLowerCase();
  return (
    product.variants.find(
      (variant) => variant.name?.trim().toLowerCase() === target
    ) || null
  );
}

export function isProductInStock(product, variantName = "") {
  if (isMultiVariant(product)) {
    const variant = getVariant(product, variantName);
    if (!variant) return false;
    if (typeof variant.inStock === "boolean") return variant.inStock;
    return (variant.stock ?? 0) > 0;
  }

  if (typeof product?.inStock === "boolean") return product.inStock;
  return (product?.stock ?? 0) > 0;
}

const IN_STOCK_MAX_QTY = 9999;

export function getVariantStock(product, variantName = "") {
  return isProductInStock(product, variantName) ? IN_STOCK_MAX_QTY : 0;
}

export function getAvailableColors(product, variantName = "") {
  if (isMultiVariant(product)) {
    const variant = getVariant(product, variantName);
    return Array.isArray(variant?.colors) ? variant.colors : [];
  }

  return Array.isArray(product?.colors) ? product.colors : [];
}

export function getTotalProductStock(product) {
  if (isMultiVariant(product)) {
    return product.variants.some((variant) =>
      typeof variant.inStock === "boolean" ? variant.inStock : (variant.stock ?? 0) > 0
    )
      ? IN_STOCK_MAX_QTY
      : 0;
  }

  return isProductInStock(product) ? IN_STOCK_MAX_QTY : 0;
}

export function getPricingSource(product, variantName = "") {
  const productMoq =
    product?.minOrderQuantity ?? product?.bulkPricing?.minOrderQuantity ?? null;
  const productStep =
    product?.stepByQuantity ?? product?.bulkPricing?.stepByQuantity ?? null;

  if (isMultiVariant(product)) {
    const variant = getVariant(product, variantName);
    if (!variant) return null;

    return {
      pricingType: variant.pricingType,
      bulkPricing: variant.bulkPricing,
      price: variant.price,
      discountedPrice: variant.discountedPrice,
      minOrderQuantity:
        productMoq ??
        variant.minOrderQuantity ??
        variant.bulkPricing?.minOrderQuantity ??
        null,
      stepByQuantity:
        productStep ??
        variant.stepByQuantity ??
        variant.bulkPricing?.stepByQuantity ??
        null,
    };
  }

  return {
    pricingType: product?.pricingType,
    bulkPricing: product?.bulkPricing,
    price: product?.price,
    discountedPrice: product?.discountedPrice,
    minOrderQuantity: productMoq,
    stepByQuantity: productStep,
  };
}

export function getUnitPriceForQuantity(product, quantity, variantName = "") {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) return 0;

  const source = getPricingSource(product, variantName);
  if (!source) return 0;

  if (source.pricingType === "bulk" && source.bulkPricing?.slabs?.length) {
    const slabs = [...source.bulkPricing.slabs].sort(
      (a, b) => a.minQuantity - b.minQuantity
    );

    for (let i = slabs.length - 1; i >= 0; i -= 1) {
      const slab = slabs[i];
      const inRange =
        qty >= slab.minQuantity &&
        (slab.maxQuantity == null || qty <= slab.maxQuantity);

      if (inRange) return slab.pricePerUnit;
    }

    return slabs[slabs.length - 1]?.pricePerUnit ?? 0;
  }

  return source.discountedPrice ?? source.price ?? 0;
}

export function getMinOrderQuantity(product, variantName = "", fallback = DEFAULT_SINGLE_MOQ) {
  const source = getPricingSource(product, variantName);
  if (!source) return fallback;

  const moq = Number(source.minOrderQuantity);
  if (Number.isFinite(moq) && moq > 0) {
    return moq;
  }

  return fallback;
}

export function getQuantityStep(product, variantName = "", fallback = DEFAULT_SINGLE_MOQ) {
  const source = getPricingSource(product, variantName);
  if (!source) return fallback;

  const step = Number(source.stepByQuantity);
  if (Number.isFinite(step) && step > 0) {
    return step;
  }

  return fallback;
}

export function getCartAdjustStep(product, variantName = "", fallback = DEFAULT_SINGLE_MOQ) {
  const source = getPricingSource(product, variantName);
  if (!source) return fallback;

  const step = Number(source.stepByQuantity);
  if (Number.isFinite(step) && step > 0) {
    return step;
  }

  const moq = Number(source.minOrderQuantity);
  if (Number.isFinite(moq) && moq > 0) {
    return moq;
  }

  return fallback;
}

export function hasConfiguredMinOrderQuantity(product, variantName = "") {
  const source = getPricingSource(product, variantName);
  if (!source) return false;

  const moq = Number(source.minOrderQuantity);
  return Number.isFinite(moq) && moq > 1;
}

export function hasConfiguredQuantityStep(product, variantName = "") {
  const source = getPricingSource(product, variantName);
  if (!source) return false;

  const step = Number(source.stepByQuantity);
  return Number.isFinite(step) && step > 1;
}

export function getDisplayPriceForSource(source) {
  if (!source) return 0;

  if (source.pricingType === "bulk" && source.bulkPricing?.slabs?.length) {
    return Math.min(...source.bulkPricing.slabs.map((slab) => slab.pricePerUnit));
  }

  return source.discountedPrice ?? source.price ?? 0;
}

export function getDisplayPrice(product, variantName = "") {
  if (isMultiVariant(product) && !variantName) {
    return Math.min(
      ...product.variants.map((variant) =>
        getDisplayPriceForSource({
          pricingType: variant.pricingType,
          bulkPricing: variant.bulkPricing,
          price: variant.price,
          discountedPrice: variant.discountedPrice,
        })
      )
    );
  }

  return getDisplayPriceForSource(getPricingSource(product, variantName));
}

export function getSortedBulkSlabs(product, variantName = "") {
  const source = getPricingSource(product, variantName);
  if (!source || source.pricingType !== "bulk" || !source.bulkPricing?.slabs?.length) {
    return [];
  }

  return [...source.bulkPricing.slabs].sort((a, b) => a.minQuantity - b.minQuantity);
}

export function getLastBulkSlab(product, variantName = "") {
  const slabs = getSortedBulkSlabs(product, variantName);
  return slabs.length ? slabs[slabs.length - 1] : null;
}

export function getOriginalPriceForQuantity(product, quantity, variantName = "") {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) return 0;

  const source = getPricingSource(product, variantName);
  if (!source) return 0;

  if (source.pricingType === "bulk" && source.bulkPricing?.slabs?.length) {
    const slabs = [...source.bulkPricing.slabs].sort(
      (a, b) => a.minQuantity - b.minQuantity
    );

    for (let i = slabs.length - 1; i >= 0; i -= 1) {
      const slab = slabs[i];
      const inRange =
        qty >= slab.minQuantity &&
        (slab.maxQuantity == null || qty <= slab.maxQuantity);

      if (inRange) {
        const original = Number(slab.originalPricePerUnit);
        return Number.isFinite(original) && original > 0 ? original : 0;
      }
    }

    return 0;
  }

  return Number(source.price) || 0;
}

export function getProductListPriceInfo(product, variantName = "") {
  const source = getPricingSource(product, variantName);
  if (!source) {
    return { originalPrice: 0, salePrice: 0, hasDiscount: false, isBulk: false };
  }

  const isBulk = source.pricingType === "bulk" && source.bulkPricing?.slabs?.length > 0;

  if (isBulk) {
    const lastSlab = getLastBulkSlab(product, variantName);
    const salePrice = lastSlab?.pricePerUnit ?? 0;
    const original = Number(lastSlab?.originalPricePerUnit);
    const originalPrice = Number.isFinite(original) && original > 0 ? original : 0;
    const hasDiscount = originalPrice > salePrice && salePrice > 0;

    return { originalPrice, salePrice, hasDiscount, isBulk: true };
  }

  const salePrice = getDisplayPriceForSource(source);
  const originalPrice = Number(source.price) || salePrice;
  const hasDiscount = originalPrice > salePrice && salePrice > 0;

  return { originalPrice, salePrice, hasDiscount, isBulk: false };
}

export function isBulkPricing(product, variantName = "") {
  const source = getPricingSource(product, variantName);
  return source?.pricingType === "bulk" && source.bulkPricing?.slabs?.length > 0;
}

export function getBulkTierRows(product, variantName = "") {
  const source = getPricingSource(product, variantName);
  if (!source || source.pricingType !== "bulk" || !source.bulkPricing?.slabs?.length) {
    return [];
  }

  return [...source.bulkPricing.slabs]
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((slab) => ({
    key: `${slab.minQuantity}-${slab.maxQuantity ?? "plus"}`,
    minQuantity: slab.minQuantity,
    price: slab.pricePerUnit,
    originalPrice: slab.originalPricePerUnit ?? slab.pricePerUnit,
    hasDiscount:
      Number(slab.originalPricePerUnit) > Number(slab.pricePerUnit) &&
      Number(slab.pricePerUnit) > 0,
  }));
}

export function formatProductPriceLabel(product, formatPrice, variantName = "") {
  const amount = getDisplayPrice(product, variantName);
  return formatPrice(amount);
}

export function buildProductPricingView(product, variantName = "") {
  const source = getPricingSource(product, variantName);
  if (!source) return null;

  return {
    pricingType: source.pricingType,
    bulkPricing: source.bulkPricing,
    price: source.price,
    discountedPrice: source.discountedPrice,
  };
}
