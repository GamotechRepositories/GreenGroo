import express from "express";
import multer from "multer";
import { randomBytes } from "crypto";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const router = express.Router();

const getS3Client = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are not configured. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in backend/.env");
  }
  return new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: { accessKeyId, secretAccessKey },
  });
};

const BUCKET_NAME = () => process.env.AWS_BUCKET_NAME || "";
const REGION = () => process.env.AWS_REGION || "ap-south-1";
const CLOUDFRONT_URL = () => (process.env.CLOUDFRONT_URL || "").replace(/\/$/, "");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
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

const buildPublicUrl = (s3Key) => {
  const cdn = CLOUDFRONT_URL();
  if (cdn) return `${cdn}/${s3Key}`;
  return `https://${BUCKET_NAME()}.s3.${REGION()}.amazonaws.com/${s3Key}`;
};

const normalizeFolder = (raw) => {
  const cleaned = String(raw || "uploads")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "");
  // Keep first path segment for safety (products, categories, farmers, …)
  const segment = cleaned.split("/").filter(Boolean)[0] || "uploads";
  return segment;
};

/**
 * POST /api/upload
 * multipart: file | files (+ optional folder)
 */
router.post("/", upload.any(), async (req, res) => {
  try {
    if (!BUCKET_NAME()) {
      return res.status(500).json({
        success: false,
        message: "AWS_BUCKET_NAME is not configured in backend/.env",
      });
    }
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return res.status(500).json({
        success: false,
        message: "AWS credentials are not configured in backend/.env",
      });
    }

    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const folder = normalizeFolder(req.body?.folder);
    const s3 = getS3Client();

    const uploadedResults = await Promise.all(
      files.map(async (file) => {
        const ext =
          path.extname(file.originalname).toLowerCase() ||
          (file.mimetype.startsWith("video/") ? ".mp4" : ".jpg");
        const randomName = randomBytes(16).toString("hex");
        const s3Key = `${folder}/${Date.now()}-${randomName}${ext}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME(),
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        return {
          url: buildPublicUrl(s3Key),
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
