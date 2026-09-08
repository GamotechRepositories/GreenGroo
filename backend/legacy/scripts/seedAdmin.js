import "dotenv/config";
import connectDB from "../config/dbconfig.js";
import User from "../models/user.js";

const [emailArg, passwordArg, nameArg, phoneArg] = process.argv.slice(2);

const email = (emailArg || "admin@greengrocc.com").trim().toLowerCase();
const password = passwordArg || "admin123";
const name = (nameArg || "Super Admin").trim();
let phone = (phoneArg || "9999999999").trim();

if (!email || !password) {
  console.error(
    "Usage: node legacy/scripts/seedAdmin.js [email] [password] [name] [phone]"
  );
  process.exit(1);
}

await connectDB();

let user = await User.findOne({ email }).select("+password");
if (!user) {
  user = await User.findOne({ phone }).select("+password");
}

const phoneOwner = await User.findOne({ phone });
if (phoneOwner && (!user || String(phoneOwner._id) !== String(user._id))) {
  phone = `9${Date.now().toString().slice(-9)}`;
  console.log(`Phone already in use, using ${phone} instead`);
}

if (user) {
  user.name = name;
  user.email = email;
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

console.log(`Login with ${email} / ${password}`);
process.exit(0);
