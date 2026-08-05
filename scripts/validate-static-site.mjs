#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(projectRoot, "the-house-of-dental-site");
const outputRoot = path.resolve(projectRoot, process.env.SITE_OUTPUT || "dist");
const config = JSON.parse(fs.readFileSync(path.join(siteRoot, "config", "site.json"), "utf8"));
const routes = JSON.parse(fs.readFileSync(path.join(siteRoot, "config", "routes.json"), "utf8"));
const strictAssets = process.argv.includes("--strict-assets");
const errors = [];
const warnings = [];
const pendingAssets = new Set([
  "assets/team/ashley.jpg",
  "assets/team/christy.jpg",
  "assets/team/eishan.jpg",
  "assets/team/emily.jpg",
  "assets/team/jennifer.jpg",
  "assets/team/patsi.jpg",
  "assets/team/renee.jpg",
  "assets/aesthetics/deka-laser.jpg",
  "assets/aesthetics/emage-scanner.jpg",
  "assets/aesthetics/hydroderm-facial.jpg",
  "assets/aesthetics/microneedling.jpg"
]);

const addError = (message) => errors.push(message);
const addWarning = (message) => warnings.push(message);
const exists = (filePath) => fs.existsSync(filePath);
const isExternal = (value) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
const cleanUrl = (value) => value.trim().split("#")[0].split("?")[0];
const stripTags = (value) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const htmlDecode = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'");
const resolveRegistryText = (value) => String(value)
  .replaceAll("{{BRAND_NAME}}", config.brand.name)
  .replaceAll("{{PHONE_DISPLAY}}", config.contact.phone.display);
const canonicalBase = String(config.canonical.baseUrl).replace(/\/+$/, "");

const enabledRoutes = routes.filter((route) => route.enabled);
const routeByOutput = new Map(routes.map((route) => [route.output, route]));
const routeById = new Map();
const routeOutputs = new Set();
const titles = new Map();
const descriptions = new Map();
const h1Values = new Map();

if (!exists(outputRoot)) addError(`Missing generated output directory: ${outputRoot}`);
if (!config.canonical.status) addError("Canonical base URL must carry an explicit status in config/site.json");

for (const route of routes) {
  if (!route.id) addError("Route registry contains a route without an id");
  if (routeById.has(route.id)) addError(`Duplicate route id: ${route.id}`);
  routeById.set(route.id, route);
  if (!route.output) addError(`Route ${route.id} is missing output`);
  if (routeOutputs.has(route.output)) addError(`Duplicate route output: ${route.output}`);
  routeOutputs.add(route.output);
  for (const field of ["title", "description", "h1", "canonicalPath", "pageType", "approvalStatus"]) {
    if (!route[field]) addError(`Route ${route.id} is missing ${field}`);
  }
  if (!Array.isArray(route.breadcrumb)) addError(`Route ${route.id} must declare breadcrumb as an array`);
  if (route.enabled && !route.source) addError(`Enabled route ${route.id} is missing a source content fragment`);
  if (route.enabled && route.source && !exists(path.join(siteRoot, route.source))) addError(`Missing source content for ${route.id}: ${route.source}`);
  const title = resolveRegistryText(route.title);
  const description = resolveRegistryText(route.description);
  const h1 = resolveRegistryText(route.h1);
  if (titles.has(title)) addError(`Duplicate route title: ${title} (${route.id}, ${titles.get(title)})`);
  else titles.set(title, route.id);
  if (descriptions.has(description)) addError(`Duplicate route description: ${description} (${route.id}, ${descriptions.get(description)})`);
  else descriptions.set(description, route.id);
  if (h1Values.has(h1)) addError(`Duplicate route H1: ${h1} (${route.id}, ${h1Values.get(h1)})`);
  else h1Values.set(h1, route.id);
}

const targetFor = (sourceFile, rawValue) => {
  const value = cleanUrl(rawValue);
  if (!value || isExternal(value)) return null;
  let target;
  if (value.startsWith("/")) target = path.resolve(outputRoot, value.slice(1));
  else target = path.resolve(path.dirname(sourceFile), value);
  if (value.endsWith("/")) target = path.join(target, "index.html");
  return target;
};

const checkTarget = (sourceFile, rawValue) => {
  const target = targetFor(sourceFile, rawValue);
  if (!target) return;
  const relative = path.relative(outputRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    addError(`${path.basename(sourceFile)} points outside generated output: ${rawValue}`);
    return;
  }
  if (!exists(target)) {
    const clean = cleanUrl(rawValue).replace(/^\/+/, "");
    if (pendingAssets.has(clean)) {
      const message = `${path.basename(sourceFile)} references pending local asset: ${rawValue}`;
      if (strictAssets) addError(message);
      else addWarning(message);
    } else {
      addError(`${path.basename(sourceFile)} references missing local link or asset: ${rawValue}`);
    }
  }
};

for (const route of enabledRoutes) {
  const filePath = path.join(outputRoot, route.output);
  if (!exists(filePath)) {
    addError(`Missing generated route: ${route.output}`);
    continue;
  }
  const html = fs.readFileSync(filePath, "utf8");
  const titlesInPage = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => stripTags(match[1]));
  const descriptionsInPage = [...html.matchAll(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/gi)].map((match) => match[1].trim());
  const canonicalInPage = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => stripTags(match[1]));
  const robots = [...html.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/gi)].map((match) => match[1]);
  const ogTitles = [...html.matchAll(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/gi)].map((match) => htmlDecode(match[1]));
  const ogDescriptions = [...html.matchAll(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/gi)].map((match) => htmlDecode(match[1]));
  const ogUrls = [...html.matchAll(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["'][^>]*>/gi)].map((match) => match[1]);
  if (titlesInPage.length !== 1 || !titlesInPage[0]) addError(`${route.output} must contain exactly one non-empty title`);
  if (descriptionsInPage.length !== 1 || !descriptionsInPage[0]) addError(`${route.output} must contain exactly one meta description`);
  if (canonicalInPage.length !== 1 || canonicalInPage[0] !== `${canonicalBase}${route.canonicalPath === "/" ? "/" : route.canonicalPath}`) addError(`${route.output} canonical does not match the route registry`);
  if (h1s.length !== 1 || !h1s[0]) addError(`${route.output} must contain exactly one non-empty H1`);
  if (robots.length !== 1 || (route.indexable && !/^index, follow/.test(robots[0])) || (!route.indexable && !/^noindex, nofollow/.test(robots[0]))) addError(`${route.output} robots metadata does not match indexability`);
  if (ogTitles.length !== 1 || ogTitles[0] !== resolveRegistryText(route.title)) addError(`${route.output} must contain one route-specific og:title`);
  if (ogDescriptions.length !== 1 || ogDescriptions[0] !== resolveRegistryText(route.description)) addError(`${route.output} must contain one route-specific og:description`);
  if (ogUrls.length !== 1 || ogUrls[0] !== canonicalInPage[0]) addError(`${route.output} must contain one canonical og:url`);
  if (!/<a\b[^>]*class=["'][^"']*\bskip-link\b[^"']*["'][^>]*href=["']#main-content["']/i.test(html)) addError(`${route.output} is missing the #main-content skip link`);
  if (!/<main\b[^>]*id=["']main-content["']/i.test(html)) addError(`${route.output} is missing the #main-content target`);
  if ((html.match(/<header\b/gi) || []).length !== 1) addError(`${route.output} must contain exactly one shared header`);
  if ((html.match(/<footer\b/gi) || []).length !== 1) addError(`${route.output} must contain exactly one shared footer`);

  const ids = new Map();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) ids.set(match[1], (ids.get(match[1]) || 0) + 1);
  for (const [id, count] of ids) if (count > 1) addError(`${route.output} contains duplicate id="${id}" (${count})`);

  const jsonLd = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!jsonLd.length) addError(`${route.output} is missing JSON-LD`);
  for (const match of jsonLd) {
    try { JSON.parse(match[1]); } catch (error) { addError(`${route.output} contains malformed JSON-LD: ${error.message}`); }
  }
  for (const match of html.matchAll(/\b(?:href|src)=(["'])([^"']+)\1/gi)) checkTarget(filePath, match[2]);
  for (const match of html.matchAll(/\bsrcset=(["'])([^"']+)\1/gi)) match[2].split(",").forEach((candidate) => checkTarget(filePath, candidate.trim().split(/\s+/)[0]));
}

const contentFiles = fs.readdirSync(path.join(siteRoot, "content")).filter((file) => file.endsWith(".html"));
for (const contentFile of contentFiles) {
  const content = fs.readFileSync(path.join(siteRoot, "content", contentFile), "utf8");
  if (/<(?:html|head|body|header|footer)\b/i.test(content)) addError(`Content source ${contentFile} contains global shell markup; edit the shared templates instead`);
}

const sitemapPath = path.join(outputRoot, "sitemap.xml");
if (!exists(sitemapPath)) addError("Missing generated sitemap.xml");
else {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expectedUrls = enabledRoutes.filter((route) => route.indexable).map((route) => `${canonicalBase}${route.canonicalPath === "/" ? "/" : route.canonicalPath}`);
  if (sitemapUrls.length !== expectedUrls.length || sitemapUrls.some((url) => !expectedUrls.includes(url)) || expectedUrls.some((url) => !sitemapUrls.includes(url))) addError("sitemap.xml coverage does not match enabled indexable routes");
}

const uniqueErrors = [...new Set(errors)];
const uniqueWarnings = [...new Set(warnings)];
console.log(`Validated ${enabledRoutes.length} generated routes, route metadata, canonical URLs, IDs, internal links, assets, JSON-LD, source shell boundaries, and sitemap coverage.`);
uniqueWarnings.forEach((warning) => console.warn(`WARN: ${warning}`));
if (uniqueErrors.length) {
  uniqueErrors.forEach((error) => console.error(`ERROR: ${error}`));
  console.error(`Validation failed with ${uniqueErrors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`Validation passed${uniqueWarnings.length ? ` with ${uniqueWarnings.length} documented pending-asset warning(s)` : ""}.`);
}
