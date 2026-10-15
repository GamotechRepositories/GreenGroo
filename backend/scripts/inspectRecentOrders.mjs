import "dotenv/config";
import mongoose from "mongoose";
import { buildTrackingSnapshot } from "../delivery-service/src/services/orderTrackingService.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const storeOrders = await db.collection("storeorders").find({}).sort({ updatedAt: -1 }).limit(5).toArray();
  for (const so of storeOrders) {
    const co = await db.collection("orders").findOne({ _id: so.sourceOrderId });
    const snapshot = await buildTrackingSnapshot({ customerOrder: co, storeOrders: [so] });
    console.log("-----------------------------------------");
    console.log("Order:", so._id, "status:", so.status, "num:", so.orderNumber);
    console.log("Store:", snapshot.store);
    console.log("Destination:", snapshot.destination);
    console.log("LastLocation:", snapshot.lastLocation);
    console.log("ETA:", snapshot.eta);
    console.log("Route source:", snapshot.route?.source);
    console.log("Route polyline:", snapshot.route?.polyline);
  }
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
