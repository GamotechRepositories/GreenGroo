import "dotenv/config";
import mongoose from "mongoose";
import { clearRouteCache, getRouteAndEta } from "../delivery-service/src/services/directionsService.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const storeOrderId = new mongoose.Types.ObjectId("6ad0aa10919d2c69cd0de680");

  // Set betterluck store ~1.6 km down the road from ibis Pune Hinjewadi
  await db.collection("deliverymanagers").updateOne(
    { storeName: "betterluck store" },
    { $set: { latitude: 18.5905, longitude: 73.7295 } }
  );

  // Set initial scooty (driver) position at the store
  await db.collection("storeorders").updateOne(
    { _id: storeOrderId },
    {
      $set: {
        driverLocation: {
          type: "Point",
          coordinates: [73.7295, 18.5905],
          heading: 310,
          speed: 25,
          updatedAt: new Date(),
        },
      },
    }
  );

  clearRouteCache("order:6ad0aa10919d2c69cd0de680");

  const route = await getRouteAndEta({
    origin: { lat: 18.5905, lng: 73.7295 },
    destination: { lat: 18.5959425, lng: 73.7182662 },
  });

  console.log("Updated order distance & route:", {
    distanceMeters: route.distanceMeters,
    distanceKm: (route.distanceMeters / 1000).toFixed(2) + " km",
    etaText: route.etaText,
    source: route.source,
    polylinePoints: route.polyline?.length,
  });

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
