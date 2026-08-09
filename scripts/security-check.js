"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceDirectory = path.join(root, "src");
const checks = [
  { pattern: /from\s+["']parse["']/, message: "Parse browser SDK import" },
  { pattern: /window\.process\b/, message: "Server environment exposed to browser code" },
  { pattern: /VUE_APP_[A-Z_]*MASTER(?:_KEY)?/, message: "Secret exposed through frontend environment" },
  { pattern: /VUE_APP_PARSE_SERVER/, message: "Direct Parse Server browser endpoint" },
  { pattern: /(?:localhost|127\.0\.0\.1):1337|\/parse(?:[/?'"`]|$)/i, message: "Direct Parse Server browser endpoint" },
  { pattern: /from\s+["']xlsx["']/, message: "Vulnerable xlsx dependency import" },
  { pattern: /@wangeditor\//, message: "Unreviewed rich text editor dependency" },
];

function filesIn(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) filesIn(fullPath, files);
    else if (entry.isFile() && /\.(js|vue)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

const failures = [];
for (const file of filesIn(sourceDirectory)) {
  const source = fs.readFileSync(file, "utf8");
  for (const check of checks) {
    if (check.pattern.test(source)) failures.push(`${path.relative(root, file)}: ${check.message}`);
  }
}

const runtimeConfigFile = path.join(root, "public", "config.js");
if (fs.existsSync(runtimeConfigFile)) {
  const source = fs.readFileSync(runtimeConfigFile, "utf8");
  for (const check of checks) {
    if (check.pattern.test(source)) failures.push(`public/config.js: ${check.message}`);
  }
}

for (const envFile of [".env.development", ".env.example"]) {
  const file = path.join(root, envFile);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  if (/VUE_APP_[A-Z_]*MASTER(?:_KEY)?/.test(source) || /VUE_APP_PARSE_SERVER/.test(source)) {
    failures.push(`${envFile}: secret or direct Parse endpoint exposed`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
