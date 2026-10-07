/**
 * Seeds the real product catalog (varieties, unit variants, farm profiles) with
 * photos uploaded to S3, and stocks every active dark store with the new SKUs.
 *
 * Usage: node legacy/scripts/seedRealCatalog.js <imagesDir>
 *   <imagesDir>/manifest.json → { [productKey]: [{ file, title, page, license, artist }] }
 * Re-runnable: products are upserted by SKU and uploads are cached in <imagesDir>/uploaded.json.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import StoreInventory from "../../delivery-service/src/models/StoreInventory.js";
import { isS3Configured, uploadBufferToS3 } from "../utils/s3Upload.js";
import { PRODUCTS } from "./data/realCatalogProducts.js";
import { FARMERS } from "./data/realCatalogFarmers.js";

const READY2COOK = new Set(["Chopped Vegetables", "Cut & Sliced", "Peeled & Cleaned", "Cleaned Bhaji & Leafy", "Veggie & Bhaji Mix"]);

const sectionFor = (category) => {
  if (READY2COOK.has(category)) return { section: "ready2cook", storeType: "festive" };
  if (category.startsWith("SuperMall")) return { section: "instantorder", storeType: "mall" };
  return { section: "preorder", storeType: "main" };
};

const percentOff = (mrp, price) => (mrp > 0 ? Math.max(0, Math.round(((mrp - price) / mrp) * 100)) : 0);

const stockFor = (sku, salt = 0) => {
  let h = salt;
  for (const ch of sku) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 60 + (h % 140);
};

const credit = (img) => {
  const artist = String(img.artist || "").replace(/\s+/g, " ").trim().slice(0, 70) || "Unknown author";
  return `${artist} / Wikimedia Commons${img.license ? ` (${img.license})` : ""}`;
};

async function uploadImages(imagesDir, manifest) {
  const cachePath = path.join(imagesDir, "uploaded.json");
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : {};
  const urls = {};
  for (const product of PRODUCTS) {
    const images = manifest[product.key] || [];
    urls[product.key] = [];
    for (const img of images) {
      const name = path.basename(img.file);
      if (!cache[name]) {
        const { url } = await uploadBufferToS3({
          buffer: fs.readFileSync(path.join(imagesDir, name)),
          mimeType: "image/jpeg",
          folder: "products",
          originalName: `${product.key}.jpg`,
        });
        cache[name] = url;
        fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1));
      }
      urls[product.key].push(cache[name]);
    }
    if (!urls[product.key].length) throw new Error(`No images for ${product.key}`);
  }
  return urls;
}

function buildDoc(p, imageUrls, images) {
  const [base] = p.units;
  const variants = p.units.map(([name, quantity, unitType, mrp, price], i) => ({
    name,
    quantity,
    unitType,
    price: mrp,
    discountedPrice: price,
    discountedPercent: percentOff(mrp, price),
    stock: stockFor(p.sku, i + 1),
    inStock: true,
  }));
  const farmer = p.farmer ? FARMERS[p.farmer] : null;
  if (p.farmer && !farmer) throw new Error(`Unknown farmer ${p.farmer} on ${p.sku}`);

  const specifications = [
    ...p.specs.map(([name, value]) => ({ name, value })),
    { name: "Image credit", value: images.map(credit).join("; ") },
  ];

  return {
    name: p.name,
    sku: p.sku,
    categories: [p.category],
    subcategory: p.subcategory,
    subcategories: [p.subcategory],
    brandName: p.brand,
    variantType: variants.length > 1 ? "multi" : "single",
    variants: variants.length > 1 ? variants : [],
    pricingType: "single",
    price: base[3],
    discountedPrice: base[4],
    discountedPercent: percentOff(base[3], base[4]),
    unit: base[0],
    stock: variants.reduce((sum, v) => sum + v.stock, 0),
    inStock: true,
    minOrderQuantity: 1,
    maxOrderQuantity: 10,
    stepByQuantity: 1,
    ratings: p.rating,
    productImages: imageUrls,
    description: p.description,
    features: p.features,
    specifications,
    isActive: true,
    ...sectionFor(p.category),
    justArrived: Boolean(p.fresh),
    hotSelling: Boolean(p.hot),
    badge: p.badge || "",
    varietyGroupId: p.group || "",
    varietyName: p.variety || "",
    farmerName: farmer?.name || "",
    farmerLocation: farmer?.location || "",
    farmerImage: "",
    farmImage: "",
    harvestingDate: p.harvest || "",
    farmerDetails: farmer
      ? { ...farmer, farmerImage: "", farmImage: "", harvestingDate: p.harvest || "" }
      : { harvestingDate: p.harvest || "" },
  };
}

async function ensureCategories() {
  const categories = await Category.find({}).lean();
  const byName = new Map(categories.map((c) => [c.categoryName, c]));
  for (const p of PRODUCTS) {
    const cat = byName.get(p.category);
    if (!cat) throw new Error(`Category "${p.category}" not found (needed by ${p.sku})`);
    if (!(cat.subcategories || []).includes(p.subcategory)) {
      await Category.updateOne({ _id: cat._id }, { $addToSet: { subcategories: p.subcategory } });
      cat.subcategories = [...(cat.subcategories || []), p.subcategory];
      console.log(`  + subcategory "${p.subcategory}" added to ${p.category}`);
    }
  }
}

async function stockDarkStores(docs) {
  const managers = await mongoose.connection
    .collection("deliverymanagers")
    .find({ isActive: { $ne: false } }, { projection: { _id: 1, storeName: 1 } })
    .toArray();
  for (const manager of managers) {
    await StoreInventory.bulkWrite(
      docs.map((doc) => ({
        updateOne: {
          filter: { managerId: manager._id, sku: doc.sku },
          update: {
            $set: { name: doc.name, category: doc.categories[0], unit: doc.unit, price: doc.discountedPrice, isActive: true },
            $setOnInsert: { stockCount: stockFor(doc.sku, 99), lowStockThreshold: 10 },
          },
          upsert: true,
        },
      }))
    );
    console.log(`  stocked ${docs.length} SKUs in ${manager.storeName || manager._id}`);
  }
}

async function main() {
  const imagesDir = process.argv[2] || process.env.REAL_CATALOG_IMAGES;
  if (!imagesDir || !fs.existsSync(path.join(imagesDir, "manifest.json"))) {
    throw new Error("Pass the prepared images directory (containing manifest.json) as the first argument");
  }
  if (!isS3Configured()) throw new Error("S3 is not configured (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_BUCKET_NAME)");
  const manifest = JSON.parse(fs.readFileSync(path.join(imagesDir, "manifest.json"), "utf8"));

  await connectDB();
  console.log("Checking categories…");
  await ensureCategories();

  console.log("Uploading images to S3…");
  const urls = await uploadImages(imagesDir, manifest);

  console.log("Upserting products…");
  const docs = [];
  for (const p of PRODUCTS) {
    const doc = buildDoc(p, urls[p.key], manifest[p.key]);
    await Product.findOneAndUpdate({ sku: doc.sku }, { $set: doc }, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
    docs.push(doc);
  }
  console.log(`  ${docs.length} products upserted`);

  console.log("Stocking dark stores…");
  await stockDarkStores(docs);

  const attribution = PRODUCTS.flatMap((p) => (manifest[p.key] || []).map((img) => ({ product: p.name, file: img.title, page: img.page, license: img.license, artist: img.artist })));
  fs.writeFileSync(path.join(imagesDir, "attribution.json"), JSON.stringify(attribution, null, 1));
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
