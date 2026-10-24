/**
 * Assigns a base product (name, id, image) to every existing catalog product.
 * Usage: node legacy/scripts/assignBaseProducts.js [--write]
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";

const GROUP_BASE = {
  "vg-tomato": "Tomato",
  "vg-onion": "Onion",
  "vg-capsicum": "Capsicum",
  "vg-carrot": "Carrot",
  "vg-mango": "Mango",
  "vg-banana": "Banana",
  "vg-apple": "Apple",
  "vg-grapes": "Grapes",
  "vg-rice": "Rice",
  "vg-rajma": "Rajma",
  "vg-chilli": "Chilli",
  "vg-almond": "Almond",
};

const NAME_RULES = [
  [/pav bhaji/i, "Pav Bhaji Mix"],
  [/sambar veg/i, "Sambar Mix"],
  [/misal/i, "Misal"],
  [/orange juice/i, "Orange Juice"],
  [/potato chip|lay'?s/i, "Potato Chips"],
  [/noodle|maggi/i, "Noodles"],
  [/ketchup/i, "Ketchup"],
  [/tomato/i, "Tomato"],
  [/onion/i, "Onion"],
  [/garlic/i, "Garlic"],
  [/chocolate|dairy milk/i, "Chocolate"],
  [/milk/i, "Milk"],
  [/pomegranate|anar/i, "Pomegranate"],
  [/mosambi|sweet lime/i, "Mosambi"],
  [/orange|santra/i, "Orange"],
  [/dragon fruit/i, "Dragon Fruit"],
  [/kiwi/i, "Kiwi"],
  [/mango|alphonso|hapus/i, "Mango"],
  [/apple|\bseb\b/i, "Apple"],
  [/banana|\bkela\b/i, "Banana"],
  [/grape/i, "Grapes"],
  [/potato|batata/i, "Potato"],
  [/palak|spinach/i, "Palak"],
  [/methi|fenugreek/i, "Methi"],
  [/cucumber/i, "Cucumber"],
  [/broccoli|baby corn/i, "Broccoli"],
  [/lauki|bottle gourd/i, "Bottle Gourd"],
  [/\bpav\b/i, "Pav"],
  [/sourdough|loaf|bread/i, "Bread"],
  [/\btea\b/i, "Tea"],
  [/coffee/i, "Coffee"],
  [/coriander/i, "Coriander"],
  [/mint|pudina/i, "Mint"],
  [/french bean/i, "French Beans"],
  [/capsicum/i, "Capsicum"],
  [/mushroom/i, "Mushroom"],
  [/ginger/i, "Ginger"],
  [/ghee/i, "Ghee"],
  [/paneer/i, "Paneer"],
  [/shrikhand/i, "Shrikhand"],
  [/dahi|curd/i, "Curd"],
  [/butter|makkhan/i, "Butter"],
  [/walnut/i, "Walnut"],
  [/dates?/i, "Dates"],
  [/cashew/i, "Cashew"],
  [/atta/i, "Atta"],
  [/jowar|sorghum/i, "Jowar"],
  [/besan/i, "Besan"],
  [/jaggery|\bgul\b/i, "Jaggery"],
  [/poha/i, "Poha"],
  [/mustard oil/i, "Mustard Oil"],
  [/groundnut oil/i, "Groundnut Oil"],
  [/honey/i, "Honey"],
  [/kabuli|chana\b/i, "Kabuli Chana"],
  [/toor/i, "Toor Dal"],
  [/moong/i, "Moong Dal"],
  [/cardamom/i, "Cardamom"],
  [/turmeric|haldi/i, "Turmeric"],
  [/cumin|jeera/i, "Jeera"],
  [/cola|coca/i, "Cola"],
  [/oats/i, "Oats"],
  [/quinoa/i, "Quinoa"],
  [/bhujia/i, "Bhujia"],
  [/biscuit|parle/i, "Biscuits"],
  [/bakarwadi/i, "Bakarwadi"],
];

const slug = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function baseNameFor(product) {
  const group = String(product.varietyGroupId || "").trim();
  if (GROUP_BASE[group]) return GROUP_BASE[group];
  const name = String(product.name || "");
  for (const [pattern, label] of NAME_RULES) {
    if (pattern.test(name)) return label;
  }
  return name.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim() || "Product";
}

const categoryOf = (product) =>
  (Array.isArray(product.categories) && product.categories[0]) || product.category || "General";

const imageOf = (product) =>
  (Array.isArray(product.productImages) && product.productImages.find(Boolean)) || product.image || "";

async function main() {
  const write = process.argv.includes("--write");
  await connectDB();
  const products = await Product.find({}).lean();
  const groups = new Map();

  for (const product of products) {
    const category = categoryOf(product);
    const name = baseNameFor(product);
    const id = `bp-${slug(category)}-${slug(name)}`;
    if (!groups.has(id)) groups.set(id, { id, name, category, products: [] });
    groups.get(id).products.push(product);
  }

  const ops = [];
  for (const group of groups.values()) {
    const lead = group.products.find((item) => item.hotSelling && imageOf(item)) || group.products.find((item) => imageOf(item)) || group.products[0];
    const image = imageOf(lead);
    console.log(`${group.category} / ${group.name} (${group.products.length})`);
    for (const product of group.products) {
      console.log(`  - ${product.name}`);
      ops.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              baseProductId: group.id,
              baseProductName: group.name,
              baseProductImage: image,
            },
          },
        },
      });
    }
  }

  if (write) {
    const result = await Product.bulkWrite(ops);
    console.log(`updated ${result.modifiedCount}`);
  } else {
    console.log(`dry run: ${ops.length} products, ${groups.size} base products. Pass --write to save.`);
  }
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
