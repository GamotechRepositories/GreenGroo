import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import HeroBanner from "../models/HeroBanner.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const CATEGORIES = [
  {
    categoryName: "Chargers",
    categoryImage: "https://picsum.photos/seed/bmm-cat-chargers/400/400",
    subcategories: ["Fast Charger", "Car Charger", "Wireless Charger"],
  },
  {
    categoryName: "Earphones",
    categoryImage: "https://picsum.photos/seed/bmm-cat-earphones/400/400",
    subcategories: ["Wired", "Wireless", "Earbuds"],
  },
  {
    categoryName: "Cables",
    categoryImage: "https://picsum.photos/seed/bmm-cat-cables/400/400",
    subcategories: ["Type-C", "Lightning", "Micro USB"],
  },
  {
    categoryName: "Neckbands",
    categoryImage: "https://picsum.photos/seed/bmm-cat-neckbands/400/400",
    subcategories: ["Bluetooth", "Sports"],
  },
  {
    categoryName: "Power Banks",
    categoryImage: "https://picsum.photos/seed/bmm-cat-power-banks/400/400",
    subcategories: ["10000mAh", "20000mAh"],
  },
  {
    categoryName: "Smart Watches",
    categoryImage: "https://picsum.photos/seed/bmm-cat-smart-watches/400/400",
    subcategories: ["Fitness", "Kids"],
  },
  {
    categoryName: "Bluetooth Speakers",
    categoryImage: "https://picsum.photos/seed/bmm-cat-bluetooth-speakers/400/400",
    subcategories: ["Portable", "Party"],
  },
  {
    categoryName: "Mobile Covers",
    categoryImage: "https://picsum.photos/seed/bmm-cat-mobile-covers/400/400",
    subcategories: ["Silicone", "Hard Case"],
  },
  {
    categoryName: "Tempered Glass",
    categoryImage: "https://picsum.photos/seed/bmm-cat-tempered-glass/400/400",
    subcategories: ["9H", "Privacy"],
  },
  {
    categoryName: "Adapters",
    categoryImage: "https://picsum.photos/seed/bmm-cat-adapters/400/400",
    subcategories: ["OTG", "Audio Jack"],
  },
];

const PRODUCTS = [
  {
    name: "Fast Charger 20W",
    categories: ["Chargers"],
    subcategory: "Fast Charger",
    brandName: "BulkMart",
    price: 299,
    discountedPrice: 165,
    discountedPercent: 45,
    stock: 100,
    ratings: 4.5,
    productImages: [
      "https://picsum.photos/seed/bmm-fast-charger/400/400",
    ],
    description: "20W fast charging adapter with Type-C cable.",
    features: ["20W Output", "BIS Certified"],
    warranty: "6 months",
  },
  {
    name: "Bass Edition Neckband",
    categories: ["Neckbands"],
    subcategory: "Bluetooth",
    brandName: "BulkMart",
    price: 599,
    discountedPrice: 299,
    discountedPercent: 50,
    stock: 80,
    ratings: 4.2,
    productImages: [
      "https://picsum.photos/seed/bmm-neckband/400/400",
    ],
    description: "Wireless neckband with deep bass.",
    features: ["12hr Battery", "IPX5"],
    warranty: "1 year",
  },
  {
    name: "Type-C Cable 1M",
    categories: ["Cables"],
    subcategory: "Type-C",
    brandName: "BulkMart",
    price: 149,
    discountedPrice: 89,
    discountedPercent: 40,
    stock: 200,
    ratings: 4.0,
    productImages: [
      "https://picsum.photos/seed/bmm-typec-cable/400/400",
    ],
    description: "Durable braided Type-C cable.",
    features: ["1 Meter", "Fast Charge"],
    warranty: "3 months",
  },
  {
    name: "Power Bank 10000mAh",
    categories: ["Power Banks"],
    subcategory: "10000mAh",
    brandName: "BulkMart",
    price: 1299,
    discountedPrice: 799,
    discountedPercent: 38,
    stock: 50,
    ratings: 4.6,
    productImages: [
      "https://picsum.photos/seed/bmm-powerbank/400/400",
    ],
    description: "Compact 10000mAh power bank with dual USB.",
    features: ["Dual Port", "LED Indicator"],
    warranty: "1 year",
  },
  {
    name: "Wireless Earbuds Pro",
    categories: ["Earphones"],
    subcategory: "Earbuds",
    brandName: "BulkMart",
    price: 999,
    discountedPrice: 499,
    discountedPercent: 50,
    stock: 60,
    ratings: 4.3,
    productImages: [
      "https://picsum.photos/seed/bmm-earbuds/400/400",
    ],
    description: "True wireless earbuds with charging case.",
    features: ["Touch Control", "20hr Playback"],
    warranty: "1 year",
  },
  {
    name: "Dual Port Car Charger",
    categories: ["Chargers"],
    subcategory: "Car Charger",
    brandName: "BulkMart",
    price: 399,
    discountedPrice: 249,
    discountedPercent: 38,
    stock: 75,
    ratings: 4.1,
    productImages: [
      "https://picsum.photos/seed/bmm-car-charger/400/400",
    ],
    description: "Fast dual USB car charger.",
    features: ["Dual USB", "LED Light"],
    warranty: "6 months",
  },
];

const BROKEN_IMAGE_REPLACEMENTS = {
  "photo-1591290619762-d2a4c81c3f67":
    "https://picsum.photos/seed/bmm-fast-charger/400/400",
  "photo-1505740420928-5e560c06d30e":
    "https://picsum.photos/seed/bmm-neckband/400/400",
  "photo-1625948515291-69613efd103f":
    "https://picsum.photos/seed/bmm-typec-cable/400/400",
  "photo-1609091839311-d5365f9ff1c5":
    "https://picsum.photos/seed/bmm-powerbank/400/400",
  "photo-1572569511254-d8f925fe2cbb":
    "https://picsum.photos/seed/bmm-earbuds/400/400",
  "photo-1618005198919-d86d5f5b4a9f":
    "https://picsum.photos/seed/bmm-car-charger/400/400",
};

async function fixEmptyCategoryImages() {
  let updated = 0;

  for (const cat of CATEGORIES) {
    const result = await Category.updateOne(
      {
        categoryName: cat.categoryName,
        $or: [
          { categoryImage: { $exists: false } },
          { categoryImage: "" },
          { categoryImage: { $regex: /res\.cloudinary\.com\/demo/i } },
        ],
      },
      { $set: { categoryImage: cat.categoryImage } },
    );
    if (result.modifiedCount > 0) updated += 1;
  }

  if (updated > 0) {
    console.log(`Fixed empty category images on ${updated} categories`);
  }
}

async function fixBrokenProductImages() {
  const products = await Product.find({ productImages: /unsplash\.com/ });
  let updated = 0;

  for (const product of products) {
    let changed = false;
    product.productImages = product.productImages.map((url) => {
      for (const [partial, replacement] of Object.entries(
        BROKEN_IMAGE_REPLACEMENTS
      )) {
        if (url.includes(partial)) {
          changed = true;
          return replacement;
        }
      }
      return url;
    });

    if (changed) {
      await product.save();
      updated += 1;
    }
  }

  if (updated > 0) {
    console.log(`Fixed broken product images on ${updated} products`);
  }
}

async function seed() {
  await connectDB();

  const existingCategories = await Category.countDocuments();
  const existingProducts = await Product.countDocuments();
  const existingBanners = await HeroBanner.countDocuments();

  if (existingCategories === 0) {
    await Category.insertMany(CATEGORIES);
    console.log(`Seeded ${CATEGORIES.length} categories`);
  } else {
    console.log(`Categories already exist (${existingCategories}), skipping`);
  }

  if (existingBanners === 0) {
    await HeroBanner.create({
      imageUrl: "/hero-banner.webp",
      alt: "BulkMobileMart wholesale mobile accessories",
      order: 0,
    });
    console.log("Seeded 1 hero banner");
  } else {
    console.log(`Hero banners already exist (${existingBanners}), skipping`);
  }

  if (existingProducts === 0) {
    await Product.insertMany(PRODUCTS);
    console.log(`Seeded ${PRODUCTS.length} products`);
  } else {
    console.log(`Products already exist (${existingProducts}), skipping`);
  }

  await fixEmptyCategoryImages();
  await fixBrokenProductImages();

  const summary = {
    database: mongoose.connection.name,
    categories: await Category.countDocuments(),
    products: await Product.countDocuments(),
    banners: await HeroBanner.countDocuments(),
  };

  console.log("Seed complete:", summary);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
