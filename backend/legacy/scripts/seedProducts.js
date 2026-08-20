import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";

const DUMMY_PRODUCTS = [
  // ==========================================
  // 1. GREENGROCC - VEGETABLES & ORGANIC
  // ==========================================
  {
    name: "Farm Fresh Hybrid Tomatoes",
    sku: "GG-VEG-001",
    categories: ["Vegetables", "Organic"],
    subcategory: "Daily Veggies",
    subcategories: ["Daily Veggies", "Organic"],
    brandName: "GreenGrocc Farms",
    price: 45,
    discountedPrice: 28,
    discountedPercent: 37,
    stock: 150,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&h=600&q=80",
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Plump, vine-ripened red tomatoes sourced directly from local organic farms. Ideal for curries, salads, and gravies.",
    features: ["100% Organically Grown", "Chemical-Free", "Rich in Lycopene"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Nashik Red Onions (Kanda)",
    sku: "GG-VEG-002",
    categories: ["Vegetables"],
    subcategory: "Daily Veggies",
    subcategories: ["Daily Veggies"],
    brandName: "GreenGrocc Farms",
    price: 40,
    discountedPrice: 26,
    discountedPercent: 35,
    stock: 200,
    inStock: true,
    ratings: 4.7,
    productImages: [
      "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Premium pungent red onions from Nashik farms. Essential base for all Indian gravies and tadkas.",
    features: ["Medium Sized", "Dry Skin", "Long Shelf Life"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Fresh Green Capsicum (Simla Mirch)",
    sku: "GG-VEG-003",
    categories: ["Vegetables"],
    subcategory: "Daily Veggies",
    subcategories: ["Daily Veggies"],
    brandName: "GreenGrocc Farms",
    price: 65,
    discountedPrice: 42,
    discountedPercent: 35,
    stock: 80,
    inStock: true,
    ratings: 4.6,
    productImages: [
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Crisp and crunchy bell peppers freshly harvested. Great for stir-fries, pizza toppings, and stuffed capsicum.",
    features: ["Crisp Texture", "Rich in Vitamin C", "Pesticide Checked"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
  },
  {
    name: "Tender Green Spinach (Palak Bunch)",
    sku: "GG-VEG-004",
    categories: ["Vegetables", "Organic"],
    subcategory: "Leafy Greens",
    subcategories: ["Leafy Greens", "Organic"],
    brandName: "GreenGrocc Farms",
    price: 30,
    discountedPrice: 18,
    discountedPercent: 40,
    stock: 90,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Nutritious farm-picked spinach leaves with tender stems. Washed and packed cleanly.",
    features: ["Iron Rich", "Harvested This Morning", "Tender Stems"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    justArrived: true,
  },

  // ==========================================
  // 2. GREENGROCC - FRUITS
  // ==========================================
  {
    name: "Royal Delicious Shimla Apples",
    sku: "GG-FRT-001",
    categories: ["Fruits"],
    subcategory: "Seasonal Fruits",
    subcategories: ["Seasonal Fruits"],
    brandName: "GreenGrocc Orchards",
    price: 180,
    discountedPrice: 135,
    discountedPercent: 25,
    stock: 100,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Crisp, sweet, and juicy Shimla apples hand-graded for premium quality and natural aroma.",
    features: ["Wax Free", "Natural Sweetness", "High Antioxidants"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Robusta Golden Bananas (1 Dozen)",
    sku: "GG-FRT-002",
    categories: ["Fruits"],
    subcategory: "Daily Fruits",
    subcategories: ["Daily Fruits"],
    brandName: "GreenGrocc Orchards",
    price: 60,
    discountedPrice: 42,
    discountedPercent: 30,
    stock: 120,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Naturally ripened Robusta bananas packed with potassium and instant energy.",
    features: ["No Chemical Ripening", "Naturally Sweet", "High Energy"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
  },
  {
    name: "Imported Valencia Sweet Oranges (1kg)",
    sku: "GG-FRT-003",
    categories: ["Fruits"],
    subcategory: "Citrus",
    subcategories: ["Citrus"],
    brandName: "GreenGrocc Orchards",
    price: 140,
    discountedPrice: 99,
    discountedPercent: 29,
    stock: 75,
    inStock: true,
    ratings: 4.7,
    productImages: [
      "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Juicy, pulpy Valencia oranges rich in vitamin C. Excellent for breakfast juicing.",
    features: ["Juicy & Seedless", "Immunity Booster", "Farm Fresh"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
  },

  // ==========================================
  // 3. GREENGROCC - DAIRY & BAKERY
  // ==========================================
  {
    name: "Pure Farm A2 Cow Milk (1 Litre)",
    sku: "GG-DRY-001",
    categories: ["Dairy"],
    subcategory: "Milk & Curd",
    subcategories: ["Milk & Curd"],
    brandName: "GreenGrocc Dairy",
    price: 75,
    discountedPrice: 65,
    discountedPercent: 13,
    stock: 100,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Pasteurized, unadulterated pure A2 cow milk delivered fresh chilled every morning.",
    features: ["100% Pure A2 Protein", "Zero Preservatives", "Chilled Delivery"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Fresh Malai Paneer (200g)",
    sku: "GG-DRY-002",
    categories: ["Dairy"],
    subcategory: "Paneer & Cheese",
    subcategories: ["Paneer & Cheese"],
    brandName: "GreenGrocc Dairy",
    price: 95,
    discountedPrice: 78,
    discountedPercent: 18,
    stock: 60,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Ultra-soft cottage cheese made from fresh whole milk. Super tender texture for paneer tikka and butter masala.",
    features: ["Soft & Spongy", "High Protein", "Vacuum Packed"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
  },

  // ==========================================
  // 4. READY2COOK - CHOPPED, PEELED & KITS
  // ==========================================
  {
    name: "Finely Chopped Red Onions (250g)",
    sku: "RTC-CHP-001",
    categories: ["Chopped Veggies", "Ready2Cook"],
    subcategory: "Chopped",
    subcategories: ["Chopped", "Peeled"],
    brandName: "Ready2Cook",
    price: 45,
    discountedPrice: 32,
    discountedPercent: 29,
    stock: 80,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Hygienically machine-diced red onions. No tears, no peeling hassle — ready for the pan.",
    features: ["Tear-Free Prep", "Washed in RO Water", "Air-Sealed Tray"],
    section: "ready2cook",
    storeType: "festive",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Fresh Peeled Garlic Cloves (150g)",
    sku: "RTC-PEL-001",
    categories: ["Peeled & Cleaned", "Ready2Cook"],
    subcategory: "Peeled",
    subcategories: ["Peeled", "Cleaned"],
    brandName: "Ready2Cook",
    price: 55,
    discountedPrice: 39,
    discountedPercent: 29,
    stock: 95,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "100% skinless, clean garlic cloves. Save 15 minutes of prep time every time you cook.",
    features: ["Clean Skinless", "Pungent Aroma", "Food Grade Pouch"],
    section: "ready2cook",
    storeType: "festive",
    isActive: true,
  },
  {
    name: "Pav Bhaji Gourmet Veggie Mix (500g)",
    sku: "RTC-MIX-001",
    categories: ["Veggie & Bhaji Mix", "Ready2Cook"],
    subcategory: "Mix Kits",
    subcategories: ["Mix Kits"],
    brandName: "Ready2Cook",
    price: 85,
    discountedPrice: 62,
    discountedPercent: 27,
    stock: 65,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Perfect proportion of diced potatoes, cauliflower, green peas, and capsicum ready to boil and mash.",
    features: ["Curated Proportions", "Zero Wastage", "Includes Recipe Card"],
    section: "ready2cook",
    storeType: "festive",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Cleaned & Trimmed Methi Leaves (250g)",
    sku: "RTC-LEA-001",
    categories: ["Cleaned Bhaji & Leafy", "Ready2Cook"],
    subcategory: "Leafy Cleaned",
    subcategories: ["Leafy Cleaned"],
    brandName: "Ready2Cook",
    price: 40,
    discountedPrice: 28,
    discountedPercent: 30,
    stock: 70,
    inStock: true,
    ratings: 4.7,
    productImages: [
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Fresh fenugreek leaves plucked, washed, and dried. Perfect for methi thepla and aloo methi.",
    features: ["Stem Removed", "Ozone Cleaned", "Ready to Knead"],
    section: "ready2cook",
    storeType: "festive",
    isActive: true,
  },

  // ==========================================
  // 5. SUPERMALL - GROCERY, GRAINS & ESSENTIALS
  // ==========================================
  {
    name: "Fortune Sunlite Refined Sunflower Oil (1L)",
    sku: "SM-OIL-001",
    categories: ["SuperMall Grains & Cereals", "Grocery", "Oils"],
    subcategory: "Cooking Oils",
    subcategories: ["Cooking Oils", "Grocery"],
    brandName: "Fortune",
    price: 165,
    discountedPrice: 138,
    discountedPercent: 16,
    stock: 250,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Light and healthy refined sunflower oil enriched with vitamins A & D. Light on digestion.",
    features: ["Enriched with Vitamins", "High Smoke Point", "Low Absorption"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Daawat Rozana Super Basmati Rice (5kg)",
    sku: "SM-RCE-001",
    categories: ["SuperMall Grains & Cereals", "Grains"],
    subcategory: "Basmati Rice",
    subcategories: ["Basmati Rice", "Grains"],
    brandName: "Daawat",
    price: 495,
    discountedPrice: 385,
    discountedPercent: 22,
    stock: 180,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Long grain aromatic basmati rice aged to perfection. Fluffy, non-sticky grains for daily biryani and pulao.",
    features: ["Aged Grains", "Exquisite Aroma", "Elongates 2x on Cooking"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Tata Sampann Unpolished Toor Dal (1kg)",
    sku: "SM-DAL-001",
    categories: ["SuperMall Grains & Cereals", "Pulses"],
    subcategory: "Dals & Pulses",
    subcategories: ["Dals & Pulses"],
    brandName: "Tata Sampann",
    price: 185,
    discountedPrice: 154,
    discountedPercent: 17,
    stock: 140,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Nutritious unpolished toor dal that retains natural goodness and protein content without water polishing.",
    features: ["Unpolished Pure Dal", "High Protein", "Quick Cooking"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },
  {
    name: "Haldiram's Nagpur Aloo Bhujia (400g)",
    sku: "SM-SNK-001",
    categories: ["SuperMall Snacks & Munchies", "Snacks"],
    subcategory: "Namkeen",
    subcategories: ["Namkeen", "Snacks"],
    brandName: "Haldirams",
    price: 110,
    discountedPrice: 89,
    discountedPercent: 19,
    stock: 160,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Iconic spicy crispy potato and gram flour noodles. The classic teatime snack of India.",
    features: ["Crispy & Spicy", "Zero Trans Fat", "Nitro Packed Freshness"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },
  {
    name: "Raw Organic California Almonds (Badam 500g)",
    sku: "SM-DRY-001",
    categories: ["SuperMall Grains & Cereals", "Dry Fruits"],
    subcategory: "Dry Fruits & Nuts",
    subcategories: ["Dry Fruits & Nuts"],
    brandName: "GreenGrocc Select",
    price: 450,
    discountedPrice: 349,
    discountedPercent: 22,
    stock: 90,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Crunchy jumbo California almonds rich in vitamin E and essential healthy fatty acids.",
    features: ["Jumbo Size", "High Vitamin E", "Vacuum Sealed"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  }
];

async function seedProducts() {
  try {
    console.log("Connecting to MongoDB for Product Seeding...");
    await connectDB();

    console.log("Clearing existing dummy products in GreenGroccproducts collection...");
    await Product.deleteMany({});

    console.log(`Inserting ${DUMMY_PRODUCTS.length} curated grocery products...`);
    const inserted = await Product.insertMany(DUMMY_PRODUCTS);

    console.log(`✅ Successfully seeded ${inserted.length} products into MongoDB!`);
    
    // Print breakdown
    const greenCount = inserted.filter(p => p.section === 'greengrocc').length;
    const rtcCount = inserted.filter(p => p.section === 'ready2cook').length;
    const mallCount = inserted.filter(p => p.section === 'supermall').length;

    console.log(`- GreenGrocc Fresh Farm: ${greenCount} products`);
    console.log(`- Ready2Cook Kitchen Kits: ${rtcCount} products`);
    console.log(`- SuperMall Essentials: ${mallCount} products`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedProducts();
