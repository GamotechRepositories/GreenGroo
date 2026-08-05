import "dotenv/config";
import connectDB from "../config/dbconfig.js";
import User from "../models/user.js";

const email = process.argv[2];

if (!email?.trim()) {
  console.error("Usage: node scripts/createAdmin.js <email>");
  process.exit(1);
}

await connectDB();

const user = await User.findOne({ email: email.trim().toLowerCase() });

if (!user) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

if (user.role === "admin") {
  console.log(`${user.email} is already an admin.`);
  process.exit(0);
}

user.role = "admin";
await user.save();

console.log(`Promoted ${user.email} to admin.`);
process.exit(0);
