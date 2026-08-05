import "dotenv/config";
import mongoose from "mongoose";
import Order from "../models/order/Order.js";
import { populateOrderItems, enrichOrderForResponse } from "../utils/orderHelpers.js";

const userId = "6a4250c633fa4a6b56a534fe";

await mongoose.connect(process.env.MONGODB_URI);

const orders = await populateOrderItems(
  Order.find({ user: userId, status: { $ne: "attempted" } }).sort({ createdAt: -1 })
);

console.log("Count:", orders.length);
console.log(
  "Sample:",
  orders.slice(0, 2).map((o) => ({
    id: o._id,
    status: o.status,
    orderNumber: o.orderNumber,
    items: o.items?.length,
  }))
);

const enriched = orders.map((order) => enrichOrderForResponse(order));
console.log("Enriched OK:", enriched.length);

await mongoose.disconnect();
