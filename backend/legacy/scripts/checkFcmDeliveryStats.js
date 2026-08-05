import "dotenv/config";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

await mongoose.connect(process.env.MONGODB_URI);

const since = new Date("2026-06-27T12:20:00Z");
const success = await Notification.countDocuments({
  fcmSent: true,
  createdAt: { $gte: since },
});
const failed = await Notification.countDocuments({
  fcmSent: false,
  createdAt: { $gte: since },
});

console.log({ sinceFix_success: success, sinceFix_failed: failed });

const lastFailed = await Notification.findOne({ fcmSent: false })
  .sort({ createdAt: -1 })
  .select("title type fcmError createdAt")
  .lean();

console.log("Last failed:", lastFailed || "none");

await mongoose.disconnect();
