import { isS3Configured, presignUpload } from "../../legacy/utils/s3Upload.js";

const DOCUMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

const UPLOADER_ROLES = new Set(["FARMER", "FARMER_MANAGER", "VENDOR"]);

/**
 * POST /api/farmers/:farmerId/documents/presign
 * Direct-to-S3 upload URL so large KYC files (videos) never pass through the API body limit.
 */
export async function presignFarmerDocumentUpload(req, res) {
  try {
    if (!UPLOADER_ROLES.has(req.user?.role)) {
      return res.status(401).json({ message: "Login required to upload documents" });
    }
    if (req.user.role === "FARMER") {
      const myId = String(req.user.farmerId || req.user.id || "");
      if (!myId || myId !== String(req.params.farmerId)) {
        return res.status(403).json({ message: "Forbidden — not your account" });
      }
    }
    if (!isS3Configured()) {
      return res.status(500).json({ message: "File upload is not configured on the server" });
    }

    const mimeType = String(req.body?.mimeType || "").toLowerCase();
    if (!DOCUMENT_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    const result = await presignUpload({
      mimeType,
      folder: "farmers",
      originalName: req.body?.fileName || "",
      expiresIn: 600,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to prepare upload" });
  }
}
