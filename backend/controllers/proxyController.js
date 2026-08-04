function getAllowedImageHosts() {
  const hosts = new Set(["res.cloudinary.com"]);

  if (process.env.CLOUDFRONT_URL) {
    try {
      hosts.add(new URL(process.env.CLOUDFRONT_URL).hostname);
    } catch {
      // ignore invalid CLOUDFRONT_URL
    }
  }

  return hosts;
}

function isAllowedImageUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    return getAllowedImageHosts().has(url.hostname);
  } catch {
    return false;
  }
}

function sanitizeFilename(filename) {
  return String(filename || "image.jpg")
    .replace(/[^\w.\-]/g, "_")
    .slice(0, 120);
}

async function streamImageResponse(imageUrl, res, { attachmentFilename } = {}) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    res.status(response.status).json({ message: "Failed to fetch image" });
    return false;
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=3600");

  if (attachmentFilename) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(attachmentFilename)}"`
    );
  }

  res.send(buffer);
  return true;
}

export async function proxyImage(req, res) {
  const imageUrl = String(req.query.url || "").trim();

  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  if (!isAllowedImageUrl(imageUrl)) {
    return res.status(403).json({ message: "Image URL is not allowed" });
  }

  try {
    const ok = await streamImageResponse(imageUrl, res);
    if (!ok) return;
  } catch {
    res.status(502).json({ message: "Failed to fetch image" });
  }
}

export async function proxyImageDownload(req, res) {
  const imageUrl = String(req.query.url || "").trim();
  const filename = sanitizeFilename(req.query.filename || "product-image.jpg");

  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  if (!isAllowedImageUrl(imageUrl)) {
    return res.status(403).json({ message: "Image URL is not allowed" });
  }

  try {
    const ok = await streamImageResponse(imageUrl, res, { attachmentFilename: filename });
    if (!ok) return;
  } catch {
    res.status(502).json({ message: "Failed to fetch image" });
  }
}
