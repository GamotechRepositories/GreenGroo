import express from "express";
import multer from "multer";
import path from "path";
import { assertS3Configured, getS3Client, uploadBufferToS3 } from "../services/s3Upload.js";

const router = express.Router();

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
    try {
      assertS3Configured();
    } catch (configError) {
      return res.status(500).json({ success: false, message: configError.message });
    }

    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const folder = normalizeFolder(req.body?.folder);
    const client = getS3Client();

    const uploadedResults = await Promise.all(
      files.map(async (file) => {
        const ext =
          path.extname(file.originalname).toLowerCase() ||
          (file.mimetype.startsWith("video/") ? ".mp4" : ".jpg");
        const { url, key } = await uploadBufferToS3({
          buffer: file.buffer,
          folder,
          ext,
          contentType: file.mimetype,
          client,
        });

        return {
          url,
          key,
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
