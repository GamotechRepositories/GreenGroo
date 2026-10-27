import "dotenv/config";
import { execFileSync } from "child_process";
import path from "path";
import mongoose from "mongoose";
import Banner from "./product-service/src/models/Banner.js";
import { getS3Client, uploadBufferToS3 } from "./product-service/src/services/s3Upload.js";

const git = (args, encoding) => execFileSync("git", args, { cwd: "..", encoding, maxBuffer: 64 * 1024 * 1024 });

/** File contents from the last git commit that still had it (the files were removed from frontend/public). */
function readFromGit(publicPath) {
  const repoPath = `frontend/public${publicPath}`;
  const hash = git(["rev-list", "-n", "1", "--all", "--", repoPath], "utf8").trim();
  if (!hash) throw new Error(`not in git history: ${repoPath}`);
  for (const rev of [hash, `${hash}^`]) {
    try {
      return git(["show", `${rev}:${repoPath}`]);
    } catch {
      /* deleted in this commit; try its parent */
    }
  }
  throw new Error(`could not read ${repoPath}`);
}
const ALT1 = "Instant Order — Fresh Farm Produce Delivered to Your Doorstep On Time & Always Fresh";
const ALT2 = "Stock up on Daily Essentials — Fresh Farm Goodness & Exotic Fruits & Vegetables";
const SLIDES = {
  desktop: [
    ["/assets/payment/instant order.webp", ALT1],
    ["/assets/payment/instant order 2.webp", ALT2],
  ],
  mobile: [
    ["/assets/payment/instant order mobile banner 1.png", ALT1],
    ["/assets/payment/instant order mobile banner 2.png", ALT2],
  ],
};
const TYPES = { ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg" };

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || undefined });
const client = getS3Client();

const docs = [];
for (const [device, list] of Object.entries(SLIDES)) {
  for (const [order, [file, alt]] of list.entries()) {
    const buffer = readFromGit(file);
    const ext = path.extname(file).toLowerCase();
    const { url } = await uploadBufferToS3({ buffer, folder: "banners", ext, contentType: TYPES[ext], client });
    docs.push({
      section: "instantorder",
      placement: "hero",
      device,
      imageUrl: url,
      alt,
      linkUrl: "/product?store=mall",
      order,
      isActive: true,
      seedKey: `default:instantorder:hero:${device}:${file}`,
    });
  }
}

const del = await Banner.deleteMany({ section: "instantorder", placement: "hero" });
await Banner.insertMany(docs);
console.log("removed copied hero banners:", del.deletedCount, "restored:", docs.length);
for (const d of docs) console.log(d.device, d.order, d.imageUrl);
await mongoose.disconnect();
