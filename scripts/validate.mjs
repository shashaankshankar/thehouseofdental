import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(process.argv[2] || "dist");
const files = (await readdir(root)).filter((name) => name.endsWith(".html")).sort();
const errors = [];
const htmlByFile = new Map(await Promise.all(files.map(async (file) => [file, await readFile(resolve(root, file), "utf8")])));
const exists = async (path) => { try { await access(path); return true; } catch { return false; } };

if (files.length !== 12) errors.push(`expected 12 HTML pages, found ${files.length}`);
for (const [file, html] of htmlByFile) {
  const count = (pattern) => (html.match(pattern) || []).length;
  for (const [label, pattern, expected] of [
    ["title", /<title\b/g, 1], ["viewport", /name="viewport"/g, 1], ["robots", /name="robots"/g, 1],
    ["main", /<main\b/g, 1], ["h1", /<h1\b/g, 1], ["stylesheet", /href="styles\.css"/g, 1]
  ]) if (count(pattern) !== expected) errors.push(`${file}: expected ${expected} ${label}, found ${count(pattern)}`);
  if (file !== "404.html" && count(/rel="canonical"/g) !== 1) errors.push(`${file}: expected one canonical URL`);
  if (/\sstyle="/i.test(html)) errors.push(`${file}: contains inline style attribute`);
  if (/<[a-z][^>]*\bclass="[^"]*"[^>]*\bclass="/i.test(html)) errors.push(`${file}: contains duplicate class attributes`);
  if (/<script(?![^>]*type="application\/ld\+json")(?![^>]*src=)[^>]*>/i.test(html)) errors.push(`${file}: contains executable inline script`);
  if (/data-netlify|<form[^>]+action=/i.test(html)) errors.push(`${file}: contains a transmitting form action`);
  if (/images\.unsplash\.com/i.test(html)) errors.push(`${file}: contains an external stock-image host`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${file}: duplicate id`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1];
    if (!raw || /^(?:https?:|tel:|mailto:|data:)/.test(raw)) continue;
    const [reference, fragment] = raw.split("#");
    const targetFile = reference || file;
    if (targetFile && !(await exists(resolve(dirname(resolve(root, file)), targetFile)))) {
      if (!targetFile.startsWith("assets/team/")) errors.push(`${file}: missing local target ${targetFile}`);
      continue;
    }
    if (fragment && targetFile.endsWith(".html")) {
      const targetHtml = htmlByFile.get(targetFile) || await readFile(resolve(root, targetFile), "utf8");
      if (!new RegExp(`id=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(targetHtml)) errors.push(`${file}: missing anchor ${raw}`);
    }
  }
}

for (const required of ["_headers", "_redirects", "robots.txt", "sitemap.xml", "main.js", "styles.css", "data/services.json", "data/technology.json"]) {
  if (!(await exists(resolve(root, required)))) errors.push(`missing generated file ${required}`);
}
const headers = await readFile(resolve(root, "_headers"), "utf8");
for (const directive of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
  if (!headers.includes(directive)) errors.push(`_headers: missing ${directive}`);
}
if (headers.includes("unsafe-inline")) errors.push("_headers: CSP still allows unsafe-inline");
for (const dataFile of ["services.json", "technology.json"]) JSON.parse(await readFile(resolve(root, "data", dataFile), "utf8"));

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${files.length} generated HTML pages and production support files.`);
