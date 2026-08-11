import { access, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const repo = resolve(process.cwd());
const errors = [];
const exists = async (path) => { try { await access(resolve(repo, path)); return true; } catch { return false; } };
const read = (path) => readFile(resolve(repo, path), "utf8");
const requireEqual = (actual, expected, label) => {
  if (actual !== expected) errors.push(`${label}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
};

const config = JSON.parse(await read("wrangler.jsonc"));
const site = JSON.parse(await read("src/data/site.json"));
const pages = Object.entries(site.pages);
const contentPages = pages.filter(([, page]) => page.path);
const expectedPaths = [
  "/",
  "/about",
  "/accessibility",
  "/contact",
  "/facial-aesthetics",
  "/new-patients",
  "/pre-post-op",
  "/privacy",
  "/reviews",
  "/services",
  "/terms"
];

requireEqual(config.name, "thehouseofdental", "wrangler.jsonc name");
requireEqual(config.main, "./worker/index.mjs", "wrangler.jsonc main");
requireEqual(config.compatibility_date, "2026-08-11", "wrangler.jsonc compatibility_date");
requireEqual(config.workers_dev, false, "wrangler.jsonc workers_dev");
requireEqual(config.preview_urls, true, "wrangler.jsonc preview_urls");
const customDomain = (config.routes || []).find((route) => route.pattern === "thehouseofdentalwp.com");
if (!customDomain || customDomain.custom_domain !== true) errors.push("wrangler.jsonc: missing thehouseofdentalwp.com custom domain target");
if (config.compatibility_flags?.includes("nodejs_compat")) errors.push("wrangler.jsonc: nodejs_compat is unnecessary for this Worker");
for (const key of ["kv_namespaces", "d1_databases", "r2_buckets", "durable_objects", "queues", "services", "hyperdrive", "ai", "vectorize"]) {
  if (config[key] !== undefined) errors.push(`wrangler.jsonc: unnecessary binding ${key} is configured`);
}

requireEqual(config.assets?.directory, "./dist", "wrangler.jsonc assets.directory");
requireEqual(config.assets?.binding, "ASSETS", "wrangler.jsonc assets.binding");
requireEqual(config.assets?.html_handling, "drop-trailing-slash", "wrangler.jsonc assets.html_handling");
requireEqual(config.assets?.not_found_handling, "404-page", "wrangler.jsonc assets.not_found_handling");
if (JSON.stringify(config.assets?.run_worker_first) !== JSON.stringify(["/api/*"])) errors.push("wrangler.jsonc assets.run_worker_first must only include /api/*");

const metadataPaths = contentPages.map(([, page]) => page.path);
if (metadataPaths.length !== expectedPaths.length || !expectedPaths.every((path) => metadataPaths.includes(path))) errors.push("site metadata clean paths do not match the approved route inventory");
if (new Set(metadataPaths).size !== metadataPaths.length) errors.push("site metadata contains duplicate clean paths");
if (pages.find(([file, page]) => file === "404.html" && page.path !== null)) errors.push("404.html must not have a public clean path");

const redirects = (await read("dist/_redirects"))
  .split(/\r?\n/)
  .filter((line) => line.trim() && !line.trim().startsWith("#"))
  .map((line) => line.trim().split(/\s+/));
const redirectMap = new Map(redirects.map(([from, to, status]) => [from, { to, status }]));
for (const [file, page] of contentPages) {
  const rule = redirectMap.get(`/${file}`);
  if (!rule || rule.to !== page.path || rule.status !== "301") errors.push(`dist/_redirects: ${file} must redirect directly to ${page.path}`);
}
for (const [from, to] of Object.entries(site.redirects || {})) {
  const rule = redirectMap.get(from);
  if (!rule || rule.to !== to || rule.status !== "301") errors.push(`dist/_redirects: ${from} must redirect directly to ${to}`);
}
if ((await read("dist/_redirects")).includes("/* /404.html 404")) errors.push("dist/_redirects: unsupported wildcard 404 redirect remains");

const requiredEnvKeys = ["GOOGLE_PLACE_ID", "GOOGLE_PLACES_API_KEY", "RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_RECIPIENT_EMAIL", "CONTACT_ALLOWED_ORIGINS"];
const devVarsExample = await read(".dev.vars.example");
for (const key of requiredEnvKeys) if (!new RegExp(`^${key}=\\s*$`, "m").test(devVarsExample)) errors.push(`.dev.vars.example: missing empty ${key} entry`);

const worker = await read("worker/index.mjs");
for (const marker of ["/api/google-reputation", "/api/contact", "env.ASSETS.fetch", "GOOGLE_PLACE_ID", "GOOGLE_PLACES_API_KEY", "RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_RECIPIENT_EMAIL", "CONTACT_ALLOWED_ORIGINS"]) {
  if (!worker.includes(marker)) errors.push(`worker/index.mjs: missing ${marker}`);
}
if (/console\.(?:log|error|warn)/.test(worker)) errors.push("worker/index.mjs: personal information or secrets could be exposed through logs");
if (/Math\.random/.test(worker)) errors.push("worker/index.mjs: insecure random source");

for (const path of ["vercel.json", "api", "scripts/validate-vercel.mjs", "tests/vercel-functions.test.mjs"]) {
  if (await exists(path)) errors.push(`legacy Vercel path remains: ${path}`);
}
const sourcePaths = [
  "package.json",
  "README.md",
  ".github/workflows/cloudflare-qa.yml",
  "src/static/_headers",
  "dist/_headers",
  "dist/main.js",
  "dist/contact.html",
  "worker/index.mjs"
];
for (const path of sourcePaths) {
  if (!(await exists(path))) {
    errors.push(`missing Cloudflare migration file ${path}`);
    continue;
  }
  const contents = await read(path);
  if (/vercel|_vercel|@vercel/i.test(contents)) errors.push(`${path}: contains Vercel-specific coupling`);
}
if (await exists("src/static/_redirects")) errors.push("src/static/_redirects must be generated from site metadata, not hand-copied");

const contact = await read("dist/contact.html");
if (!/<form[^>]+action="\/api\/contact"[^>]+data-contact-form/.test(contact)) errors.push("dist/contact.html: missing Worker contact action");
if (/data-netlify|name="form-name"/.test(contact)) errors.push("dist/contact.html: contains an unrelated form provider contract");

const sitemap = await read("dist/sitemap.xml");
if (/\.html/.test(sitemap)) errors.push("dist/sitemap.xml: contains a legacy .html URL");
for (const [, page] of contentPages.filter(([, page]) => page.sitemap !== false && !page.robots.includes("noindex"))) {
  const canonical = new URL(page.path, `${site.baseUrl}/`).toString();
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`dist/sitemap.xml: missing ${canonical}`);
}

const generatedHtml = await readdir(resolve(repo, "dist"));
if (generatedHtml.filter((file) => file.endsWith(".html")).length !== 12) errors.push("dist: expected 12 generated HTML pages");
if (/\/_vercel\/|@vercel\/analytics/i.test(await read("dist/main.js"))) errors.push("dist/main.js: contains Vercel runtime code");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated Cloudflare Worker configuration, clean routes, redirects, headers, APIs, and generated runtime files.");
