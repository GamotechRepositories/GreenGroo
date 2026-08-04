import { getMaxUploadBytesForFolder, formatMaxUploadMb } from "../utils/imageValidation.js";
import { isS3Configured, presignUpload } from "../utils/s3Upload.js";
import {
  ADMIN_UPLOAD_FOLDERS,
  PUBLIC_UPLOAD_FOLDERS,
  USER_UPLOAD_FOLDERS,
  normalizeUploadFolder,
} from "../utils/uploadFolders.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
]);

function canUploadToFolder(folder, user) {
  if (ADMIN_UPLOAD_FOLDERS.has(folder)) return user?.role === "admin";
  if (USER_UPLOAD_FOLDERS.has(folder)) return Boolean(user?._id);
  if (PUBLIC_UPLOAD_FOLDERS.has(folder)) return true;
  return false;
}

export const getPresignedUploadUrl = async (req, res) => {
  try {
    if (!isS3Configured()) {
      return res.status(500).json({
        success: false,
        message: "File upload is not configured. Check AWS settings on the server.",
      });
    }

    const { folder, mimeType, filename, fileSize } = req.body;

    const normalizedFolder = normalizeUploadFolder(folder || "");
    if (!normalizedFolder) {
      return res.status(400).json({ success: false, message: "Invalid upload folder" });
    }

    if (!canUploadToFolder(normalizedFolder, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to upload to this folder",
      });
    }

    if (!mimeType || !ALLOWED_MIME_TYPES.has(String(mimeType).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, MP4, WEBM, OGG, MOV, M4V",
      });
    }

    const maxBytes = getMaxUploadBytesForFolder(normalizedFolder);
    const size = Number(fileSize);
    if (Number.isFinite(size) && size > maxBytes) {
      return res.status(400).json({
        success: false,
        message: `Image must be under ${formatMaxUploadMb(maxBytes)}`,
      });
    }

    const result = await presignUpload({
      mimeType: String(mimeType).toLowerCase(),
      folder: normalizedFolder,
      originalName: filename || "",
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate upload URL",
    });
  }
};
