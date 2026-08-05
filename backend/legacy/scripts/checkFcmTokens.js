import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.js";

await mongoose.connect(process.env.MONGODB_URI);

const users = await User.find({
  fcmToken: { $exists: true, $ne: "" },
})
  .select("phone name fcmToken deviceType lastTokenUpdatedAt")
  .limit(10)
  .lean();

console.log(`Users with FCM token: ${users.length}`);
for (const user of users) {
  console.log({
    phone: user.phone,
    name: user.name,
    deviceType: user.deviceType,
    tokenLen: user.fcmToken?.length ?? 0,
    updated: user.lastTokenUpdatedAt,
  });
}

await mongoose.disconnect();
