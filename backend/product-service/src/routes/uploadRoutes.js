import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import path from "path";

const router = express.Router();

// ---  AWS S3 Client Setup ---
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "greengrocc-s3";
const CLOUDFRONT_URL = (process.env.CLOUDFRONT_URL || "").replace(/\/$/, "");

// --- Multer in-memory storage (no disk needed) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max for images and video
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/") ||
      /\.(jpe?g|png|webp|gif|avif|svg|mp4|webm|mov|mkv|avi|ogg)$/i.test(file.originalname)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

/**
 * POST /api/upload
 * Accepts multipart/form-data with:
 *   - file or files: single or multiple images/videos
 *   - folder: optional prefix in S3 (e.g. "categories", "products", "videos"). defaults to "uploads"
 */
router.post("/", upload.any(), async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const folder = (req.body?.folder || "uploads").replace(/[^a-zA-Z0-9_-]/g, "");

    const uploadedResults = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith("video/") ? ".mp4" : ".jpg");
        const randomName = randomBytes(16).toString("hex");
        const s3Key = `${folder}/${randomName}${ext}`;

        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        await s3.send(command);

        const publicUrl = CLOUDFRONT_URL
          ? `${CLOUDFRONT_URL}/${s3Key}`
          : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${s3Key}`;

        return {
          url: publicUrl,
          key: s3Key,
          originalName: file.originalname,
          mimetype: file.mimetype,
          isVideo: file.mimetype.startsWith("video/"),
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: `${uploadedResults.length} file(s) uploaded successfully`,
      url: uploadedResults[0].url,
      key: uploadedResults[0].key,
      urls: uploadedResults.map((r) => r.url),
      files: uploadedResults,
    });
  } catch (err) {
    console.error("[UploadRoute] S3 upload error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
});

export default router;
