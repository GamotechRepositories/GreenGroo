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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (JPEG, PNG, WEBP, GIF, AVIF)"));
    }
  },
});

/**
 * POST /api/upload
 * Accepts multipart/form-data with:
 *   - file: the image file (required)
 *   - folder: optional prefix in S3 (e.g. "categories", "products"). defaults to "uploads"
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const folder = (req.body?.folder || "uploads").replace(/[^a-zA-Z0-9_-]/g, "");
    const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const randomName = randomBytes(16).toString("hex");
    const s3Key = `${folder}/${randomName}${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3.send(command);

    // Build final URL — prefer CloudFront, fall back to S3 public URL
    const publicUrl = CLOUDFRONT_URL
      ? `${CLOUDFRONT_URL}/${s3Key}`
      : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${s3Key}`;

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      url: publicUrl,
      key: s3Key,
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
