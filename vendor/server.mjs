import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 5173);
function isLocalHost(hostname) {
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
}

function normalizeTarget(raw) {
  const value = String(raw || "").trim().replace(/\/+$/, "");
  try {
    const url = new URL(value);
    if (url.protocol === "http:" && !isLocalHost(url.hostname)) url.protocol = "https:";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return value;
  }
}

const API_TARGET = normalizeTarget(
  process.env.API_PROXY_TARGET || process.env.VITE_API_URL || "https://api.greengrocc.com"
);
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

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

function forward(target, req, body, res, hops = 0) {
  const lib = target.protocol === "https:" ? https : http;
  const headers = { ...req.headers, host: target.host };
  delete headers.connection;
  if (body) headers["content-length"] = String(body.length);
  else delete headers["content-length"];

  const upstream = lib.request(target, { method: req.method, headers }, (incoming) => {
    const location = incoming.headers.location;
    if (REDIRECT_CODES.has(incoming.statusCode) && location && hops < 3) {
      incoming.resume();
      forward(new URL(location, target), req, body, res, hops + 1);
      return;
    }
    res.writeHead(incoming.statusCode || 502, incoming.headers);
    incoming.pipe(res);
  });

  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "application/json" });
    }
    res.end(JSON.stringify({ message: "Unable to reach API server" }));
  });

  upstream.end(body || undefined);
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

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const body = chunks.length ? Buffer.concat(chunks) : null;
    forward(target, req, body, res);
  });
  req.on("error", () => {
    if (!res.headersSent) res.writeHead(400);
    res.end();
  });
}

function sendFile(file, res) {
  const stream = fs.createReadStream(file);
  stream.on("open", () => {
    res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  });
  stream.on("error", () => {
    if (!res.headersSent) res.writeHead(404);
    res.end("Not found");
  });
  stream.pipe(res);
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
    sendFile(file, res);
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
  console.log(`Vendor panel listening on ${PORT}, proxying /api -> ${API_TARGET}`);
});
