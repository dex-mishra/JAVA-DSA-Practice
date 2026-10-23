// Minimal zero-dependency static file server for LOCAL PREVIEW ONLY.
// Serves the repo root as-is. No build, no generator, no data mutation.
// Run: node tools/static-serve.mjs   then open http://localhost:8000/
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(ROOT, path.normalize(urlPath));
    // prevent path traversal outside ROOT
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found: " + urlPath);
        return;
      }
      const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
  }
});

server.listen(PORT, () => {
  console.log("Static preview server running at http://localhost:" + PORT + "/");
  console.log("Serving: " + ROOT);
  console.log("Press Ctrl+C to stop.");
});
