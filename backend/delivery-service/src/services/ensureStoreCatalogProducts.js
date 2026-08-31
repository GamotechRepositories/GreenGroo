import Product from "../../../legacy/models/Product.js";
import { STORE_PRODUCT_CATALOG } from "../data/storeProductCatalog.js";

const CATEGORY_IMAGES = {
  Vegetables: "/categories/vegetables.webp",
  Fruits: "/categories/fruits.webp",
  Dairy: "/categories/dairy.webp",
  Staples: "/categories/grains.webp",
  Bakery: "/categories/bakery.webp",
  Beverages: "/categories/beverages.webp",
  Snacks: "/categories/snacks.webp",
  "Ready to Cook": "/categories/ready_to_cook.webp",
  "Personal Care": "/categories/personal_care.webp",
  Household: "/categories/household.webp",
};

let ensurePromise = null;

function productDocFromCatalog(entry) {
  const price = Number(entry.price) || 0;
  const image = CATEGORY_IMAGES[entry.category] || "/categories/vegetables.webp";
  const category = String(entry.category || "Grocery").trim();

  return {
    name: entry.name,
    sku: entry.sku,
    categories: [category],
    subcategory: category,
    subcategories: [category],
    brandName: "GreenGrocc",
    variantType: "single",
    variants: [],
    pricingType: "single",
    price,
    discountedPrice: price,
    discountedPercent: 0,
    stock: 999,
    inStock: true,
    productImages: [image],
    description: `Fresh ${entry.name} delivered from your nearest dark store.`,
    features: ["Dark store fresh", "Fast delivery"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
  };
}

export async function ensureStoreCatalogProducts() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      let upserted = 0;
      for (const entry of STORE_PRODUCT_CATALOG) {
        const doc = productDocFromCatalog(entry);
        const result = await Product.findOneAndUpdate(
          { sku: entry.sku },
          { $set: doc },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
        if (result) upserted += 1;
      }
      return upserted;
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}
