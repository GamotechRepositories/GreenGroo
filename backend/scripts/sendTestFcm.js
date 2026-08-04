import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import User from "../models/user.js";
import { sendTestNotification } from "../services/notificationService.js";
import { getFirebaseAdmin } from "../config/firebaseAdmin.js";

await connectDB();
getFirebaseAdmin();

const phone = process.argv[2] || "7499972072";
const user = await User.findOne({ phone }).select("_id phone name fcmToken deviceType").lean();

if (!user) {
  console.error("User not found for phone:", phone);
  process.exit(1);
}

console.log("Sending test FCM to:", {
  id: user._id.toString(),
  phone: user.phone,
  name: user.name,
  tokenLen: user.fcmToken?.length ?? 0,
  deviceType: user.deviceType,
});

const result = await sendTestNotification(user._id);
console.log("Result:", JSON.stringify({
  success: result?.success,
  delivered: result?.delivered,
  reason: result?.reason,
  error: result?.error,
  notificationId: result?.notification?._id?.toString(),
}, null, 2));

await mongoose.disconnect();
