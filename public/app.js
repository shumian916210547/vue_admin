"use strict";

// A dependency-free production server for the compiled SPA. This file is
// copied to dist/ by Vue CLI, so it can be run with `node dist/app.js`.
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const port = Number.parseInt(process.env.PORT || "4200", 10);
const staticRoot = fs.existsSync(path.join(__dirname, "index.html"))
  ? __dirname
  : path.resolve(__dirname, "..", "dist");
const indexFile = path.join(staticRoot, "index.html");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendFile(req, res, file) {
  const extension = path.extname(file).toLowerCase();
  const isRuntimeConfig = path.basename(file) === "config.js";
  const isEntryPoint = path.basename(file) === "index.html";
  const headers = {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Cache-Control": isRuntimeConfig || isEntryPoint ? "no-cache" : "public, max-age=31536000, immutable",
  };

  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, headers);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
  });
}

function resolveRequestedFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  if (pathname.includes("\0")) return null;
  const requested = path.resolve(staticRoot, `.${pathname}`);
  if (requested !== staticRoot && !requested.startsWith(`${staticRoot}${path.sep}`)) return null;
  return requested;
}

const server = http.createServer((req, res) => {
  if (!["GET", "HEAD"].includes(req.method || "")) {
    res.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method not allowed");
    return;
  }

  let requested;
  try {
    requested = resolveRequestedFile(req.url || "/");
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  if (!requested) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  fs.stat(requested, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(req, res, requested);
      return;
    }

    // A path without an extension is a client-side route; assets must return 404.
    if (!path.extname(requested)) sendFile(req, res, indexFile);
    else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
      res.end("Not found");
    }
  });
});

server.listen(Number.isSafeInteger(port) && port > 0 ? port : 4200, "0.0.0.0", () => {
  console.log(`Static server listening on port ${server.address().port}`);
});
