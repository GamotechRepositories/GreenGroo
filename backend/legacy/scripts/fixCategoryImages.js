import "dotenv/config";
import connectDB from "../config/dbconfig.js";
import Category from "../models/Category.js";

await connectDB();

const result = await Category.updateMany(
  {
    $or: [
      { categoryImage: { $regex: /res\.cloudinary\.com\/demo/i } },
      { categoryImage: { $regex: /^[a-z]+\.png$/i } },
    ],
  },
  { $set: { categoryImage: "" } }
);

console.log(`Cleared ${result.modifiedCount} broken category image URL(s).`);
process.exit(0);
