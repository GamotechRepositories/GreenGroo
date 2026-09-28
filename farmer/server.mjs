import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 5177);
const API_TARGET = String(
  process.env.API_PROXY_TARGET || process.env.VITE_API_URL || "http://api.greengrocc.com"
).trim().replace(/\/+$/, "");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function shouldProxy(urlPath) {
  return urlPath === "/health" || urlPath.startsWith("/api/") || urlPath === "/api";
}

function proxy(req, res) {
  let target;
  try {
    target = new URL(req.url || "/", `${API_TARGET}/`);
  } catch {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "Invalid API proxy target" }));
    return;
  }

  const lib = target.protocol === "https:" ? https : http;
  const headers = { ...req.headers, host: target.host };
  delete headers.connection;

  const upstream = lib.request(
    target,
    { method: req.method, headers },
    (incoming) => {
      res.writeHead(incoming.statusCode || 502, incoming.headers);
      incoming.pipe(res);
    }
  );

  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "application/json" });
    }
    res.end(JSON.stringify({ message: "Unable to reach API server" }));
  });

  req.pipe(upstream);
}

const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".svg"]);
const ASSETS_DIR = path.join(DIST, "assets") + path.sep;

function sendFile(file, req, res) {
  const ext = path.extname(file).toLowerCase();
  const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(String(req.headers["accept-encoding"] || ""));
  const headers = {
    "content-type": MIME[ext] || "application/octet-stream",
    // Vite emits content-hashed filenames under /assets, so they never change once deployed.
    "cache-control": file.startsWith(ASSETS_DIR) ? "public, max-age=31536000, immutable" : "no-cache",
  };
  if (gzip) {
    headers["content-encoding"] = "gzip";
    headers.vary = "Accept-Encoding";
  }
  const stream = fs.createReadStream(file);
  stream.on("open", () => {
    res.writeHead(200, headers);
  });
  stream.on("error", () => {
    if (!res.headersSent) res.writeHead(404);
    res.end("Not found");
  });
  if (gzip) {
    stream.pipe(zlib.createGzip()).pipe(res);
  } else {
    stream.pipe(res);
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  let file = path.join(DIST, safePath === path.sep || safePath === "/" ? "index.html" : safePath);

  if (!file.startsWith(DIST)) {
    res.writeHead(403);
    res.end();
    return;
  }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      file = path.join(DIST, "index.html");
    }
    sendFile(file, req, res);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];
  if (shouldProxy(urlPath)) {
    proxy(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Farmer panel listening on ${PORT}, proxying /api -> ${API_TARGET}`);
});
