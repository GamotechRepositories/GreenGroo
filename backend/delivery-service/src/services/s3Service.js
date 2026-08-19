import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";

/** Check if AWS credentials and bucket are configured in environment */
export function isS3Configured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_BUCKET_NAME
  );
}

function getS3Client() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials are not configured in environment");
  }

  return new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function buildPublicUrl(key) {
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION || "ap-south-1";
  const cloudfront = (process.env.CLOUDFRONT_URL || "").replace(/\/$/, "");

  if (cloudfront) {
    return `${cloudfront}/${key.replace(/^\//, "")}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key.replace(/^\//, "")}`;
}

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf",
};

function extensionFromMime(mimeType) {
  return MIME_TO_EXT[String(mimeType || "").toLowerCase()] || "jpg";
}

/**
 * Upload a binary buffer to S3.
 * Returns { key, url }.
 */
export async function uploadBufferToS3({ buffer, mimeType, folder = "uploads", originalName = "" }) {
  if (!isS3Configured()) {
    throw new Error("AWS S3 environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME) are missing");
  }

  const ext = extensionFromMime(mimeType) || (originalName.match(/\.([a-z0-9]+)$/i)?.[1] || "jpg");
  const randomName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_\/-]/g, "").replace(/^\/+|\/+$/g, "");
  const s3Key = `${cleanFolder}/${randomName}`;

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType || "image/jpeg",
    })
  );

  return {
    key: s3Key,
    url: buildPublicUrl(s3Key),
  };
}

/**
 * Upload a data-URL string (data:image/jpeg;base64,...) to S3.
 * Returns { key, url }.
 */
export async function uploadDataUrlToS3(dataUrl, folder = "uploads") {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Invalid data URL string");
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) {
    throw new Error("Invalid image data URL format");
  }

  const mimeType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");

  return uploadBufferToS3({ buffer, mimeType, folder });
}
