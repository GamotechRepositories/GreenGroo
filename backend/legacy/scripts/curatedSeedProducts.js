import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";

const dummyJsonImages = {
  apple: "https://cdn.dummyjson.com/product-images/groceries/apple/1.webp",
  cookingOil: "https://cdn.dummyjson.com/product-images/groceries/cooking-oil/1.webp",
  cucumber: "https://cdn.dummyjson.com/product-images/groceries/cucumber/1.webp",
  eggs: "https://cdn.dummyjson.com/product-images/groceries/eggs/1.webp",
  bellPepper: "https://cdn.dummyjson.com/product-images/groceries/green-bell-pepper/1.webp",
  chiliPepper: "https://cdn.dummyjson.com/product-images/groceries/green-chili-pepper/1.webp",
  honey: "https://cdn.dummyjson.com/product-images/groceries/honey-jar/1.webp",
  iceCream: "https://cdn.dummyjson.com/product-images/groceries/ice-cream/1.webp",
  juice: "https://cdn.dummyjson.com/product-images/groceries/juice/1.webp",
  kiwi: "https://cdn.dummyjson.com/product-images/groceries/kiwi/1.webp",
  lemon: "https://cdn.dummyjson.com/product-images/groceries/lemon/1.webp",
  milk: "https://cdn.dummyjson.com/product-images/groceries/milk/1.webp",
  mulberry: "https://cdn.dummyjson.com/product-images/groceries/mulberry/1.webp",
  coffee: "https://cdn.dummyjson.com/product-images/groceries/nescafe-coffee/1.webp",
  potatoes: "https://cdn.dummyjson.com/product-images/groceries/potatoes/1.webp",
  protein: "https://cdn.dummyjson.com/product-images/groceries/protein-powder/1.webp",
  onions: "https://cdn.dummyjson.com/product-images/groceries/red-onions/1.webp",
  rice: "https://cdn.dummyjson.com/product-images/groceries/rice/1.webp",
  cola: "https://cdn.dummyjson.com/product-images/groceries/soft-drinks/1.webp",
  strawberry: "https://cdn.dummyjson.com/product-images/groceries/strawberry/1.webp",
  water: "https://cdn.dummyjson.com/product-images/groceries/water/1.webp",
};

const curatedProducts = [
  // Vegetables
  { name: "Fresh Cucumber", category: "Vegetables", subcategory: "Daily Veggies", section: "greengrocc", storeType: "main", image: dummyJsonImages.cucumber },
  { name: "Green Bell Capsicum", category: "Vegetables", subcategory: "Daily Veggies", section: "greengrocc", storeType: "main", image: dummyJsonImages.bellPepper },
  { name: "Spicy Green Chilli", category: "Vegetables", subcategory: "Daily Veggies", section: "greengrocc", storeType: "main", image: dummyJsonImages.chiliPepper },
  { name: "Nashik Red Onions", category: "Vegetables", subcategory: "Daily Veggies", section: "greengrocc", storeType: "main", image: dummyJsonImages.onions },
  { name: "Fresh Potatoes", category: "Vegetables", subcategory: "Root Vegetables", section: "greengrocc", storeType: "main", image: dummyJsonImages.potatoes },
  
  // Fruits
  { name: "Shimla Apple", category: "Fruits", subcategory: "Daily Fruits", section: "greengrocc", storeType: "main", image: dummyJsonImages.apple },
  { name: "Fuji Apple", category: "Fruits", subcategory: "Daily Fruits", section: "greengrocc", storeType: "main", image: dummyJsonImages.apple },
  { name: "Fresh Green Kiwi", category: "Fruits", subcategory: "Exotic Fruits", section: "greengrocc", storeType: "main", image: dummyJsonImages.kiwi },
  { name: "Fresh Lemons", category: "Fruits", subcategory: "Citrus", section: "greengrocc", storeType: "main", image: dummyJsonImages.lemon },
  { name: "Wild Mulberries", category: "Fruits", subcategory: "Exotic Fruits", section: "greengrocc", storeType: "main", image: dummyJsonImages.mulberry },
  { name: "Fresh Strawberries", category: "Fruits", subcategory: "Seasonal Fruits", section: "greengrocc", storeType: "main", image: dummyJsonImages.strawberry },

  // Dairy
  { name: "Farm Fresh Milk", category: "Dairy", subcategory: "Milk & Curd", section: "greengrocc", storeType: "main", image: dummyJsonImages.milk },
  { name: "Full Cream Milk", category: "Dairy", subcategory: "Milk & Curd", section: "greengrocc", storeType: "main", image: dummyJsonImages.milk },
  { name: "Vanilla Ice Cream", category: "Dairy", subcategory: "Paneer & Cheese", section: "greengrocc", storeType: "main", image: dummyJsonImages.iceCream },
  { name: "Farm Fresh Eggs 6pcs", category: "Dairy", subcategory: "Paneer & Cheese", section: "greengrocc", storeType: "main", image: dummyJsonImages.eggs },

  // Oils
  { name: "Refined Cooking Oil", category: "Oils", subcategory: "Cooking Oils", section: "supermall", storeType: "mall", image: dummyJsonImages.cookingOil },
  { name: "Sunflower Oil 1L", category: "Oils", subcategory: "Cooking Oils", section: "supermall", storeType: "mall", image: dummyJsonImages.cookingOil },

  // Grains
  { name: "Premium Basmati Rice", category: "Grains", subcategory: "Basmati Rice", section: "supermall", storeType: "mall", image: dummyJsonImages.rice },
  { name: "Rozana Rice", category: "Grains", subcategory: "Basmati Rice", section: "supermall", storeType: "mall", image: dummyJsonImages.rice },

  // Organic
  { name: "Pure Organic Honey", category: "Organic", subcategory: "Organic Pantry", section: "greengrocc", storeType: "main", image: dummyJsonImages.honey },
  { name: "Wild Forest Honey", category: "Organic", subcategory: "Organic Pantry", section: "greengrocc", storeType: "main", image: dummyJsonImages.honey },
  { name: "Whey Protein Powder", category: "Organic", subcategory: "Superfoods", section: "greengrocc", storeType: "main", image: dummyJsonImages.protein },

  // Beverages
  { name: "Mixed Fruit Juice", category: "Beverages", subcategory: "Juices", section: "supermall", storeType: "mall", image: dummyJsonImages.juice },
  { name: "Orange Juice", category: "Beverages", subcategory: "Juices", section: "supermall", storeType: "mall", image: dummyJsonImages.juice },
  { name: "Nescafe Classic Coffee", category: "Beverages", subcategory: "Tea & Coffee", section: "supermall", storeType: "mall", image: dummyJsonImages.coffee },
  { name: "Cola Soft Drink", category: "Beverages", subcategory: "Cold Drinks", section: "supermall", storeType: "mall", image: dummyJsonImages.cola },
  { name: "Mineral Water 1L", category: "Beverages", subcategory: "Cold Drinks", section: "supermall", storeType: "mall", image: dummyJsonImages.water },
];

async function runCuratedSeed() {
  try {
    console.log("Connecting to MongoDB for DummyJSON Curated Product Seeding...");
    await connectDB();

    console.log("Clearing all existing products in GreenGroccproducts collection...");
    await Product.deleteMany({});

    const productsToInsert = [];
    let skuCounter = 9000;

    for (const item of curatedProducts) {
      skuCounter++;
      const sku = `GG-${item.category.substring(0,3).toUpperCase()}-${skuCounter}`;
      
      const basePrice = Math.floor(Math.random() * 200) + 40; 
      const discountPercent = Math.floor(Math.random() * 30) + 5; 
      const discountedPrice = Math.floor(basePrice * (1 - (discountPercent/100)));

      const product = {
        name: item.name,
        sku: sku,
        categories: [item.category],
        subcategory: item.subcategory,
        subcategories: [item.subcategory],
        brandName: "GreenGrocc Select",
        price: basePrice,
        discountedPrice: discountedPrice,
        discountedPercent: discountPercent,
        stock: Math.floor(Math.random() * 300) + 20,
        inStock: true,
        ratings: parseFloat((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1)),
        productImages: [item.image, item.image],
        description: `Experience the finest quality ${item.name}. Guaranteed freshness and premium quality directly sourced and packed for your convenience.`,
        features: ["Premium Quality", "100% Authentic", "Carefully Packed"],
        section: item.section,
        storeType: item.storeType,
        isActive: true,
        hotSelling: Math.random() > 0.5,
        justArrived: Math.random() > 0.5,
      };

      if (item.category === "Vegetables" || item.category === "Fruits" || item.category === "Organic") {
         product.farmerDetails = {
            name: "Local Certified Farmer",
            location: "Regional Farm",
            cropCycle: "Seasonal",
            agricultureMethod: "Sustainable Farming"
         };
      }

      productsToInsert.push(product);
    }

    console.log(`Successfully generated ${productsToInsert.length} real image products. Inserting into MongoDB...`);
    
    await Product.insertMany(productsToInsert);

    console.log(`✅ Successfully seeded ${productsToInsert.length} products into MongoDB!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runCuratedSeed();
