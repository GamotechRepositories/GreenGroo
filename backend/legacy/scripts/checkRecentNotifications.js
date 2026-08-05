import "dotenv/config";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

await mongoose.connect(process.env.MONGODB_URI);

const recent = await Notification.find({})
  .sort({ createdAt: -1 })
  .limit(15)
  .select("title type fcmSent fcmError isRead createdAt user")
  .lean();

console.log("Recent notifications:");
for (const n of recent) {
  console.log({
    title: n.title,
    type: n.type,
    fcmSent: n.fcmSent,
    fcmError: n.fcmError || "",
    createdAt: n.createdAt,
  });
}

await mongoose.disconnect();
