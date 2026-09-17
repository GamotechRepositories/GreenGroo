import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";

const DUMMY_PRODUCTS = [
  // ==========================================
  // VEGETABLES
  // ==========================================
  {
    name: "Farm Fresh Hybrid Tomatoes",
    sku: "GG-VEG-001",
    categories: ["Vegetables", "Organic"],
    subcategory: "Daily Veggies",
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
    specifications: [
      { name: "Origin", value: "Nashik, Maharashtra" },
      { name: "Shelf Life", value: "4-5 Days" }
    ],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    hotSelling: true,
    farmerDetails: {
      name: "Ramesh Patil",
      location: "Nashik District",
      farmImage: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&h=600&q=80",
      totalArea: "5 Acres",
      cultivationArea: "2 Acres",
      cropCycle: "90 Days",
      agricultureMethod: "Organic Farming",
      waterSource: "Drip Irrigation",
      bio: "Ramesh has been practicing organic farming for over a decade, specializing in pesticide-free tomatoes."
    }
  },
  {
    name: "Nashik Red Onions (Kanda)",
    sku: "GG-VEG-002",
    categories: ["Vegetables"],
    subcategory: "Daily Veggies",
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
    justArrived: true,
  },

  // ==========================================
  // FRUITS
  // ==========================================
  {
    name: "Royal Delicious Shimla Apples",
    sku: "GG-FRT-001",
    categories: ["Fruits"],
    subcategory: "Seasonal Fruits",
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
    specifications: [
      { name: "Region", value: "Shimla, Himachal Pradesh" },
      { name: "Grade", value: "Premium A++" }
    ],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Imported Valencia Sweet Oranges (1kg)",
    sku: "GG-FRT-002",
    categories: ["Fruits"],
    subcategory: "Citrus",
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
  // DAIRY
  // ==========================================
  {
    name: "Pure Farm A2 Cow Milk (1 Litre)",
    sku: "GG-DRY-001",
    categories: ["Dairy"],
    subcategory: "Milk & Curd",
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
    specifications: [
      { name: "Fat Content", value: "4.5%" },
      { name: "Storage", value: "Keep Refrigerated at 4°C" }
    ],
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
  // GRAINS
  // ==========================================
  {
    name: "Daawat Rozana Super Basmati Rice (5kg)",
    sku: "SM-RCE-001",
    categories: ["Grains", "SuperMall Grains & Cereals"],
    subcategory: "Basmati Rice",
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
    bulkPricing: {
      slabs: [
        { minQuantity: 2, maxQuantity: 4, pricePerUnit: 370 },
        { minQuantity: 5, pricePerUnit: 350 }
      ]
    },
    section: "supermall",
    storeType: "mall",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Aashirvaad Shudh Chakki Atta (10kg)",
    sku: "SM-ATT-001",
    categories: ["Grains", "Grocery"],
    subcategory: "Atta & Flours",
    brandName: "Aashirvaad",
    price: 520,
    discountedPrice: 480,
    discountedPercent: 8,
    stock: 200,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1627464064378-b1dc713b1850?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "100% whole wheat atta milled from pure golden grains for soft, fluffy rotis.",
    features: ["Zero Maida", "Chakki Processed", "High Fiber"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },

  // ==========================================
  // PULSES
  // ==========================================
  {
    name: "Tata Sampann Unpolished Toor Dal (1kg)",
    sku: "SM-DAL-001",
    categories: ["Pulses", "Grocery"],
    subcategory: "Dals & Pulses",
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
    name: "Organic Green Moong Dal Whole (500g)",
    sku: "SM-DAL-002",
    categories: ["Pulses", "Organic"],
    subcategory: "Dals & Pulses",
    brandName: "GreenGrocc Select",
    price: 95,
    discountedPrice: 75,
    discountedPercent: 21,
    stock: 100,
    inStock: true,
    ratings: 4.7,
    productImages: [
      "https://images.unsplash.com/photo-1620211756543-7f21fecab642?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Premium quality whole green moong sourced from certified organic farms.",
    features: ["Certified Organic", "Rich in Fiber", "Pesticide Free"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },

  // ==========================================
  // GROCERY
  // ==========================================
  {
    name: "Tata Salt, Vacuum Evaporated (1kg)",
    sku: "SM-GRC-001",
    categories: ["Grocery"],
    subcategory: "Salt & Sugar",
    brandName: "Tata",
    price: 28,
    discountedPrice: 24,
    discountedPercent: 14,
    stock: 500,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1621217742055-6804a11c4df2?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Iodized vacuum evaporated salt, guaranteeing purity and the right iodine content.",
    features: ["Iodine Guaranteed", "Vacuum Evaporated", "Pure & White"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Madhur Pure & Hygienic Sugar (1kg)",
    sku: "SM-GRC-002",
    categories: ["Grocery"],
    subcategory: "Salt & Sugar",
    brandName: "Madhur",
    price: 55,
    discountedPrice: 50,
    discountedPercent: 9,
    stock: 300,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1581428982868-e410dd047a90?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Premium quality double refined sugar. Untouched by hand, clean, and crystal clear.",
    features: ["Sulphur Free Process", "Untouched by Hands", "Fine Crystals"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },

  // ==========================================
  // OILS
  // ==========================================
  {
    name: "Fortune Sunlite Refined Sunflower Oil (1L)",
    sku: "SM-OIL-001",
    categories: ["Oils", "Grocery"],
    subcategory: "Cooking Oils",
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
    name: "Patanjali Kachi Ghani Mustard Oil (1L)",
    sku: "SM-OIL-002",
    categories: ["Oils", "Grocery"],
    subcategory: "Cooking Oils",
    brandName: "Patanjali",
    price: 180,
    discountedPrice: 155,
    discountedPercent: 14,
    stock: 120,
    inStock: true,
    ratings: 4.6,
    productImages: [
      "https://images.unsplash.com/photo-1610444391694-8468d66ce1e1?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Cold pressed mustard oil that retains its natural pungency and health benefits. Perfect for authentic Indian cooking.",
    features: ["Cold Pressed", "High Pungency", "Heart Healthy"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },

  // ==========================================
  // SPICES
  // ==========================================
  {
    name: "Everest Kashmiri Lal Mirch Powder (100g)",
    sku: "SM-SPC-001",
    categories: ["Spices", "Grocery"],
    subcategory: "Powdered Spices",
    brandName: "Everest",
    price: 90,
    discountedPrice: 78,
    discountedPercent: 13,
    stock: 300,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Adds a brilliant red color to food without making it excessively spicy. Authentic Kashmiri chili blend.",
    features: ["Vibrant Color", "Mild Spice Level", "Fine Powder"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Catch Garam Masala Powder (100g)",
    sku: "SM-SPC-002",
    categories: ["Spices", "Grocery"],
    subcategory: "Blended Spices",
    brandName: "Catch",
    price: 75,
    discountedPrice: 65,
    discountedPercent: 13,
    stock: 200,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "A perfect blend of roasted ground spices to enhance the flavor of Indian dishes.",
    features: ["Low Temperature Grinding", "Aromatic Blend", "No Fillers"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },

  // ==========================================
  // DRY FRUITS
  // ==========================================
  {
    name: "Raw Organic California Almonds (Badam 500g)",
    sku: "SM-DRYF-001",
    categories: ["Dry Fruits", "SuperMall Grains & Cereals"],
    subcategory: "Dry Fruits & Nuts",
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
  },
  {
    name: "Premium Whole Cashews (Kaju 250g)",
    sku: "SM-DRYF-002",
    categories: ["Dry Fruits"],
    subcategory: "Dry Fruits & Nuts",
    brandName: "GreenGrocc Select",
    price: 320,
    discountedPrice: 270,
    discountedPercent: 15,
    stock: 110,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1601053073998-6a56fc4db65d?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "W240 grade premium cashews. Crispy, buttery, and perfect for snacking or rich gravies.",
    features: ["W240 Grade", "Crisp Texture", "Rich in Protein"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },

  // ==========================================
  // ORGANIC
  // ==========================================
  {
    name: "Pure Wild Forest Honey (500g)",
    sku: "GG-ORG-001",
    categories: ["Organic"],
    subcategory: "Organic Pantry",
    brandName: "Forest Natives",
    price: 350,
    discountedPrice: 280,
    discountedPercent: 20,
    stock: 60,
    inStock: true,
    ratings: 4.9,
    productImages: [
      "https://images.unsplash.com/photo-1587049352851-8d4e891347ba?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Raw, unpasteurized honey sustainably sourced from deep forests. Rich in pollen and enzymes.",
    features: ["Raw & Unfiltered", "No Added Sugar", "Sustainably Sourced"],
    specifications: [
      { name: "Certification", value: "India Organic" },
      { name: "Source", value: "Western Ghats" }
    ],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    justArrived: true,
  },
  {
    name: "Organic Cold Pressed Virgin Coconut Oil (500ml)",
    sku: "GG-ORG-002",
    categories: ["Organic", "Oils"],
    subcategory: "Organic Pantry",
    brandName: "Forest Natives",
    price: 420,
    discountedPrice: 350,
    discountedPercent: 16,
    stock: 45,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1620025732296-6d63a8a3068f?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Extracted from fresh coconut milk using cold-press technology. Excellent for cooking and skin care.",
    features: ["Cold Pressed", "Unbleached", "Edible Grade"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
  },

  // ==========================================
  // BEVERAGES
  // ==========================================
  {
    name: "Coca-Cola Original Taste (750ml)",
    sku: "SM-BEV-001",
    categories: ["Beverages", "SuperMall Snacks & Munchies"],
    subcategory: "Cold Drinks",
    brandName: "Coca-Cola",
    price: 45,
    discountedPrice: 40,
    discountedPercent: 11,
    stock: 120,
    inStock: true,
    ratings: 4.7,
    productImages: [
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "The classic, refreshing original taste of Coca-Cola in a convenient PET bottle.",
    features: ["Refreshing Taste", "Carbonated", "Best Served Chilled"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Red Bull Energy Drink (250ml)",
    sku: "SM-BEV-002",
    categories: ["Beverages"],
    subcategory: "Energy Drinks",
    brandName: "Red Bull",
    price: 125,
    discountedPrice: 115,
    discountedPercent: 8,
    stock: 80,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1620015507389-980b62eabfa8?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Red Bull vitalizes body and mind. Formula contains high quality ingredients like Caffeine, Taurine, B-Group Vitamins.",
    features: ["Vitalizes Body & Mind", "Contains Taurine", "Instant Energy"],
    section: "supermall",
    storeType: "mall",
    isActive: true,
  },

  // ==========================================
  // BAKERY
  // ==========================================
  {
    name: "Britannia 100% Whole Wheat Bread (400g)",
    sku: "GG-BAK-001",
    categories: ["Bakery", "Dairy"],
    subcategory: "Breads & Buns",
    brandName: "Britannia",
    price: 50,
    discountedPrice: 45,
    discountedPercent: 10,
    stock: 40,
    inStock: true,
    ratings: 4.5,
    productImages: [
      "https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Soft and nutritious bread made from 100% whole wheat atta. Zero maida.",
    features: ["100% Atta", "No Added Preservatives", "High Fiber"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
    hotSelling: true,
  },
  {
    name: "Fresh Baked Chocolate Chip Cookies (200g)",
    sku: "GG-BAK-002",
    categories: ["Bakery"],
    subcategory: "Cookies & Rusk",
    brandName: "GreenGrocc Bakers",
    price: 120,
    discountedPrice: 95,
    discountedPercent: 21,
    stock: 55,
    inStock: true,
    ratings: 4.8,
    productImages: [
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&h=600&q=80"
    ],
    description: "Crispy on the edges, chewy in the center. Handcrafted cookies loaded with real chocolate chips.",
    features: ["Freshly Baked", "Real Chocolate Chips", "No Artificial Flavors"],
    section: "greengrocc",
    storeType: "main",
    isActive: true,
  },

  // ==========================================
  // READY2COOK (EXTRA)
  // ==========================================
  {
    name: "Finely Chopped Red Onions (250g)",
    sku: "RTC-CHP-001",
    categories: ["Chopped Veggies", "Ready2Cook"],
    subcategory: "Chopped",
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
  }
];

async function seedProducts() {
  try {
    console.log("Connecting to MongoDB for Product Seeding...");
    await connectDB();

    console.log("Clearing existing products in GreenGroccproducts collection...");
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
