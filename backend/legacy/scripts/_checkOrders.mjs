import "dotenv/config";
import mongoose from "mongoose";
import Order from "../models/order/Order.js";
// from backend/scripts/

await mongoose.connect(process.env.MONGODB_URI);
const recent = await Order.find()
  .sort({ createdAt: -1 })
  .limit(8)
  .select("user status paymentStatus total createdAt orderNumber paymentMethod")
  .lean();
console.log("Recent orders:", JSON.stringify(recent, null, 2));
const counts = await Order.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } },
]);
console.log("Status counts:", counts);
await mongoose.disconnect();
