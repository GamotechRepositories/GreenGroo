import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import sharp from "sharp";

/**
 * GET /api/img?url=<image url>&w=<device px>&h=<device px>
 *
 * Resizes so the image still covers a w×h box (never upscales) and re-encodes
 * as WebP at a visually lossless quality. Output is cached on disk and served
 * immutable — S3 keys are unique per upload, so a URL's bytes never change.
 */

// Requested sizes snap up to one of these so the cache stays small and the
// served image is always at least as sharp as the slot it fills.
const WIDTHS = [96, 160, 240, 320, 480, 640, 800, 1080, 1440, 1920];
const WEBP_OPTIONS = { quality: 85, alphaQuality: 90, smartSubsample: true, effort: 4 };
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const CACHE_DIR = process.env.IMAGE_CACHE_DIR || path.join(os.tmpdir(), "greengrocc-img-cache");
const IMMUTABLE = "public, max-age=31536000, immutable";

sharp.cache({ memory: 64, items: 200 });
sharp.concurrency(Math.max(1, Math.min(4, os.cpus().length)));

const inflight = new Map();
let cacheDirReady = null;

function allowedHosts() {
  const hosts = new Set(["res.cloudinary.com", "cdn.greengrocc.com"]);
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION || "ap-south-1";
  if (bucket) {
    hosts.add(`${bucket}.s3.${region}.amazonaws.com`);
    hosts.add(`${bucket}.s3.amazonaws.com`);
  }
  for (const value of [process.env.CLOUDFRONT_URL, process.env.CLOUDFRONT_DOMAIN]) {
    if (!value) continue;
    try {
      hosts.add(new URL(value.includes("://") ? value : `https://${value}`).hostname);
    } catch {
      // ignore malformed env value
    }
  }
  for (const host of (process.env.IMAGE_PROXY_HOSTS || "").split(",")) {
    if (host.trim()) hosts.add(host.trim().toLowerCase());
  }
  return hosts;
}

function parseSource(raw) {
  try {
    const url = new URL(String(raw || "").trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    const hosts = allowedHosts();
    if (hosts.has(host)) return url;
    // Any bucket of ours in any region: <bucket>.s3.<region>.amazonaws.com
    const bucket = process.env.AWS_BUCKET_NAME;
    if (bucket && host.startsWith(`${bucket}.s3.`) && host.endsWith(".amazonaws.com")) return url;
    return null;
  } catch {
    return null;
  }
}

function snap(raw) {
  const px = Number.parseInt(raw, 10);
  if (!Number.isFinite(px) || px <= 0) return null;
  return WIDTHS.find((b) => b >= px) ?? WIDTHS[WIDTHS.length - 1];
}

async function fetchSource(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow" });
    if (!response.ok) {
      const err = new Error(`Upstream ${response.status}`);
      err.status = response.status === 404 ? 404 : 502;
      throw err;
    }
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_SOURCE_BYTES) {
      const err = new Error("Image too large");
      err.status = 413;
      throw err;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, contentType: response.headers.get("content-type") || "application/octet-stream" };
  } finally {
    clearTimeout(timer);
  }
}

async function optimize(url, width, height) {
  const source = await fetchSource(url);
  const type = source.contentType.toLowerCase();

  // Vector and animated formats would lose quality or motion; pass them through.
  if (type.includes("svg") || type.includes("gif")) {
    return { body: source.buffer, contentType: source.contentType };
  }

  let image = sharp(source.buffer, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  let resized = false;
  if (width || height) {
    // "outside" keeps both sides >= the box, so cover-cropped slots stay sharp.
    image = image.resize({
      width: width || undefined,
      height: height || undefined,
      fit: "outside",
      withoutEnlargement: true,
      kernel: "lanczos3",
    });
    resized = Boolean(
      (width && meta.width > width) || (height && meta.height > height)
    );
  }
  const body = await image.webp(WEBP_OPTIONS).toBuffer();

  // Already-small originals can come out larger; never serve the bigger file.
  if (!resized && body.length >= source.buffer.length) {
    return { body: source.buffer, contentType: source.contentType };
  }
  return { body, contentType: "image/webp" };
}

async function ensureCacheDir() {
  if (!cacheDirReady) {
    cacheDirReady = mkdir(CACHE_DIR, { recursive: true }).catch(() => {
      cacheDirReady = null;
    });
  }
  await cacheDirReady;
}

async function getOptimized(url, width, height) {
  const key = createHash("sha1").update(`${url}|${width}|${height}|v1`).digest("hex");
  const file = path.join(CACHE_DIR, key);

  try {
    const [body, contentType] = await Promise.all([
      readFile(file),
      readFile(`${file}.type`, "utf8"),
    ]);
    return { body, contentType };
  } catch {
    // cache miss
  }

  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    const result = await optimize(url, width, height);
    await ensureCacheDir();
    await Promise.all([
      writeFile(file, result.body),
      writeFile(`${file}.type`, result.contentType),
    ]).catch(() => {});
    return result;
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}

export async function optimizedImage(req, res) {
  const source = parseSource(req.query.url);
  if (!source) {
    return res.status(400).json({ message: "Image URL is missing or not allowed" });
  }

  try {
    const width = snap(req.query.w);
    const height = snap(req.query.h);
    const { body, contentType } = await getOptimized(
      source.toString(),
      width ?? (height ? null : WIDTHS[WIDTHS.length - 1]),
      height
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", IMMUTABLE);
    res.setHeader("Content-Length", body.length);
    return res.end(body);
  } catch (error) {
    // Optimization failed: send clients to the original so the image still shows.
    if (!error.status || error.status >= 500) {
      return res.redirect(302, source.toString());
    }
    return res.status(error.status).json({ message: error.message });
  }
}
