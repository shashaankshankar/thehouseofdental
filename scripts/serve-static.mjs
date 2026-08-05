#!/usr/bin/env node

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.resolve(projectRoot, process.env.SITE_OUTPUT || "dist");
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf"
};

const safePath = (pathname) => {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, "") || "index.html";
  const candidate = path.resolve(siteRoot, relative.endsWith("/") ? `${relative}index.html` : relative);
  if (!candidate.startsWith(`${siteRoot}${path.sep}`) && candidate !== siteRoot) return null;
  return candidate;
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
  } catch {
    response.writeHead(400, {"content-type": "text/plain; charset=utf-8"});
    response.end("Bad request");
    return;
  }

  const candidate = safePath(pathname);
  const filePath = candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(siteRoot, "404.html");
  const statusCode = candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? 200 : 404;
  if (!fs.existsSync(filePath)) {
    response.writeHead(500, {"content-type": "text/plain; charset=utf-8"});
    response.end("Build output is missing. Run npm run build first.");
    return;
  }
  response.writeHead(statusCode, {"content-type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"});
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${siteRoot} at http://127.0.0.1:${port}/`);
});
