import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uploadBufferToS3 } from "../utils/s3Upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagePath = path.resolve(__dirname, "../../frontend/public/og-share.jpg");

async function main() {
  const buffer = fs.readFileSync(imagePath);
  const uploaded = await uploadBufferToS3({
    buffer,
    mimeType: "image/jpeg",
    folder: "brands",
    originalName: "greengrocc-og-share.jpg",
  });

  console.log(uploaded.url);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
