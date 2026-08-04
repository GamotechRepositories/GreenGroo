import "dotenv/config";
import connectDB from "../config/dbconfig.js";
import User from "../models/user.js";

const [emailArg, passwordArg, nameArg, phoneArg] = process.argv.slice(2);

const email = (emailArg || "admin@bulkmobilemart.in").trim().toLowerCase();
const password = passwordArg || "admin@2026";
const name = (nameArg || "Admin User").trim();
const phone = (phoneArg || "9876543210").trim();

if (!email || !password) {
  console.error(
    "Usage: node scripts/seedAdmin.js [email] [password] [name] [phone]"
  );
  process.exit(1);
}

await connectDB();

let user = await User.findOne({ email }).select("+password");

if (user) {
  user.name = name;
  user.phone = phone;
  user.password = password;
  user.role = "admin";
  await user.save();
  console.log(`Updated admin: ${user.email}`);
} else {
  user = await User.create({
    name,
    email,
    phone,
    password,
    role: "admin",
  });
  console.log(`Created admin: ${user.email}`);
}

process.exit(0);
