#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(projectRoot, "the-house-of-dental-site");
const outputRoot = path.resolve(projectRoot, process.env.SITE_OUTPUT || "dist");
const evidenceRoot = path.join(projectRoot, "docs", "evidence", "phase-8");
const config = JSON.parse(fs.readFileSync(path.join(siteRoot, "config", "site.json"), "utf8"));
const routes = JSON.parse(fs.readFileSync(path.join(siteRoot, "config", "routes.json"), "utf8"));
const redirects = JSON.parse(fs.readFileSync(path.join(siteRoot, "config", "redirects.json"), "utf8"));
const canonicalBase = String(config.canonical.baseUrl).replace(/\/+$/, "");
const enabledRoutes = routes.filter((route) => route.enabled);
const indexableRoutes = enabledRoutes.filter((route) => route.indexable);
const routeById = new Map(routes.map((route) => [route.id, route]));
const errors = [];
const warnings = [];
const addError = (message) => errors.push(message);
const addWarning = (message) => warnings.push(message);
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const stripTags = (value) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const resolveText = (value) => String(value)
  .replaceAll("{{BRAND_NAME}}", config.brand.name)
  .replaceAll("{{PHONE_DISPLAY}}", config.contact.phone.display);
const countMatches = (html, regex) => [...html.matchAll(regex)].length;
const tagCount = (html, attribute, value) => countMatches(html, new RegExp(`<meta\\b[^>]*${attribute}=["']${escapeRegex(value)}["'][^>]*>`, "gi"));
const extractMetaContent = (html, attribute, value) => {
  const match = html.match(new RegExp(`<meta\\b[^>]*${attribute}=["']${escapeRegex(value)}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i"));
  return match?.[1] || "";
};
const canonicalFor = (route) => {
  const target = route.canonicalTargetId ? routeById.get(route.canonicalTargetId) : route;
  const canonicalPath = target?.canonicalPath || route.canonicalPath;
  return `${canonicalBase}${canonicalPath === "/" ? "/" : canonicalPath}`;
};
const outputForPath = (route) => path.join(outputRoot, route.output);
const exists = (filePath) => fs.existsSync(filePath);
const readHtml = (route) => fs.readFileSync(outputForPath(route), "utf8");
const parseJsonLd = (html, route) => {
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (blocks.length !== 1) addError(`${route.id} must contain exactly one JSON-LD block`);
  try {
    const parsed = JSON.parse(blocks[0]?.[1] || "{}");
    return parsed?.["@graph"] || [parsed];
  } catch (error) {
    addError(`${route.id} JSON-LD is not valid JSON: ${error.message}`);
    return [];
  }
};
const csvRows = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};
const readInventory = () => {
  const inventoryPath = path.join(projectRoot, "docs", "URL-INVENTORY.csv");
  if (!exists(inventoryPath)) return {headers: [], rows: []};
  const [headers = [], ...values] = csvRows(fs.readFileSync(inventoryPath, "utf8"));
  return {headers, rows: values.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])))};
};

const duplicateValues = (rows, key) => {
  const seen = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!value) continue;
    const ids = seen.get(value) || [];
    ids.push(row.id);
    seen.set(value, ids);
  }
  return [...seen.entries()].filter(([, ids]) => ids.length > 1);
};

if (!canonicalBase.includes("winterparkdental.com")) addError(`Phase 8 canonical baseline must use the current domain, got ${canonicalBase}`);
if (!/provisional|blocked/i.test(config.canonical.status)) addError("Phase 8 canonical baseline must remain explicitly provisional or blocked");
if (!config.socialImage?.path || !config.socialImage?.alt) addError("Shared social image configuration is incomplete");

const metadataReport = [];
const schemaReport = [];
const headingReport = [];
const indexabilityReport = [];
const representativeIds = new Set(["home", "services", "cosmetic-dentistry", "dental-implants", "about", "dr-mainak-patel-draft", "reviews", "contact", "blog"]);
const representativeRows = [];

for (const route of enabledRoutes) {
  const filePath = outputForPath(route);
  if (!exists(filePath)) {
    addError(`Missing generated route ${route.output}`);
    continue;
  }
  const html = readHtml(route);
  const titleCount = countMatches(html, /<title\b[^>]*>[\s\S]*?<\/title>/gi);
  const descriptionCount = tagCount(html, "name", "description");
  const robotsCount = tagCount(html, "name", "robots");
  const canonicalCount = countMatches(html, /<link\b[^>]*rel=["']canonical["'][^>]*>/gi);
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
  const title = stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = extractMetaContent(html, "name", "description");
  const expectedRobots = route.indexable ? "index, follow" : "noindex, nofollow";
  const ogFields = ["og:type", "og:site_name", "og:title", "og:description", "og:url", "og:locale", "og:image", "og:image:alt"];
  const twitterFields = ["twitter:card", "twitter:title", "twitter:description", "twitter:url", "twitter:image", "twitter:image:alt"];
  if (titleCount !== 1) addError(`${route.id} must have one title`);
  if (descriptionCount !== 1) addError(`${route.id} must have one description`);
  if (robotsCount !== 1 || !extractMetaContent(html, "name", "robots").startsWith(expectedRobots)) addError(`${route.id} robots directive does not match indexability`);
  if (canonicalCount !== 1 || canonical !== canonicalFor(route)) addError(`${route.id} canonical is not exactly the registered canonical`);
  for (const field of ogFields) if (tagCount(html, "property", field) !== 1) addError(`${route.id} must have exactly one ${field}`);
  for (const field of twitterFields) if (tagCount(html, "name", field) !== 1) addError(`${route.id} must have exactly one ${field}`);
  if (/<meta\b[^>]*name=["']keywords["']/i.test(html)) addError(`${route.id} still emits obsolete meta keywords`);
  const socialImage = extractMetaContent(html, "property", "og:image");
  if (!socialImage.startsWith(`${canonicalBase}/assets/`)) addError(`${route.id} social image must use the provisional current-domain asset URL`);
  let localSocialPath = "";
  try {
    localSocialPath = path.join(outputRoot, new URL(socialImage).pathname.replace(/^\/+/, ""));
  } catch {
    addError(`${route.id} social image URL is invalid`);
  }
  if (localSocialPath && !exists(localSocialPath)) addError(`${route.id} social image is not present in generated output`);
  const h1Count = countMatches(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/gi);
  if (h1Count !== 1) addError(`${route.id} must have exactly one H1`);
  const headingLevels = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((match) => Number(match[1]));
  if (headingLevels[0] !== 1) addError(`${route.id} must begin its heading hierarchy with H1`);
  for (let index = 1; index < headingLevels.length; index += 1) if (headingLevels[index] - headingLevels[index - 1] > 1) addError(`${route.id} skips a heading level before H${headingLevels[index]}`);
  if (route.indexable && !html.includes(config.contact.address.street)) addError(`${route.id} is missing the verified street address`);
  if (route.indexable && !html.includes(config.contact.phone.display)) addError(`${route.id} is missing the verified phone number`);
  if (route.indexable && !/Winter Park/i.test(html)) addError(`${route.id} is missing natural Winter Park context`);
  const graph = parseJsonLd(html, route);
  const types = graph.flatMap((node) => Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]]).filter(Boolean);
  if (!types.includes("WebPage")) addError(`${route.id} is missing a WebPage node`);
  if (route.breadcrumb.length > 1 && !types.includes("BreadcrumbList")) addError(`${route.id} has visible breadcrumbs but no BreadcrumbList`);
  if (route.pageType === "service") {
    if (!types.includes("Service")) addError(`${route.id} is missing a Service node`);
    if (countMatches(html, /class=["'][^"']*service-faq[^"']*["']/gi) && !types.includes("FAQPage")) addError(`${route.id} has visible FAQs but no FAQPage node`);
    if (types.includes("FAQPage") && !countMatches(html, /class=["'][^"']*service-faq[^"']*["']/gi)) addError(`${route.id} has FAQPage schema without visible FAQs`);
  } else if (types.includes("Service")) addError(`${route.id} emits Service schema outside a service page`);
  if (route.id === "home") {
    for (const type of ["WebSite", "Organization", "Dentist"]) if (!types.includes(type)) addError(`Homepage graph is missing ${type}`);
    if (graph.some((node) => node.aggregateRating || node.reviewBody || node.reviewRating)) addError("Homepage graph contains unsupported review markup");
  }
  if (route.id === "about" || route.id === "dr-mainak-patel-draft") {
    const provider = graph.find((node) => node["@type"] === "Person");
    if (!provider || provider.worksFor?.["@id"] !== `${canonicalBase}/#practice`) addError(`${route.id} provider Person is not linked to the practice`);
  }
  if (/aggregateRating|reviewBody|reviewRating/i.test(html)) addError(`${route.id} contains review schema fields that require approval`);
  metadataReport.push({id: route.id, output: route.output, indexable: route.indexable, title, description, canonical, robots: extractMetaContent(html, "name", "robots"), socialImage});
  schemaReport.push({id: route.id, output: route.output, types, jsonLdBlocks: countMatches(html, /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/gi)});
  headingReport.push({id: route.id, output: route.output, h1Count, levels: headingLevels});
  indexabilityReport.push({id: route.id, output: route.output, indexable: route.indexable, robots: extractMetaContent(html, "name", "robots"), inSitemap: false});
  if (representativeIds.has(route.id)) representativeRows.push({id: route.id, output: route.output, title, canonical, h1: stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ""), metadataTags: titleCount + descriptionCount + robotsCount + canonicalCount, jsonLdTypes: types});
}

if (!representativeRows.some((row) => row.id === "blog")) {
  representativeRows.push({
    id: "blog",
    output: "live current source: https://winterparkdental.com/blog/ (local route disabled pending content crawl)",
    title: "Blog | Winter Park Dental",
    canonical: `${canonicalBase}/blog/`,
    h1: "Blog",
    metadataTags: "observed-current-source; local route not generated",
    jsonLdTypes: ["source-hold; production crawl required"]
  });
}

for (const [field, label] of [["title", "title"], ["description", "description"], ["canonical", "canonical"]]) {
  for (const [value, ids] of duplicateValues(metadataReport.filter((row) => row.indexable), field)) {
    addError(`Indexable routes share a duplicate ${label}: ${value} (${ids.join(", ")})`);
  }
}

const sitemapPath = path.join(outputRoot, "sitemap.xml");
const sitemapText = exists(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8") : "";
const sitemapUrls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapUrls = indexableRoutes.map(canonicalFor);
for (const url of expectedSitemapUrls) if (!sitemapUrls.includes(url)) addError(`Sitemap is missing ${url}`);
for (const url of sitemapUrls) if (!expectedSitemapUrls.includes(url)) addError(`Sitemap contains a non-indexable or unregistered URL ${url}`);
if (sitemapUrls.some((url) => !url.startsWith(`${canonicalBase}/`))) addError("Sitemap contains a URL outside the provisional current domain");
for (const row of indexabilityReport) row.inSitemap = sitemapUrls.includes(canonicalFor(routes.find((route) => route.id === row.id)));

const robotsPath = path.join(outputRoot, "robots.txt");
const robotsText = exists(robotsPath) ? fs.readFileSync(robotsPath, "utf8") : "";
if (!/^User-agent:\s*\*/m.test(robotsText) || !/^Allow:\s*\/$/m.test(robotsText)) addError("robots.txt must allow normal crawling");
if (!new RegExp(`^Sitemap:\\s*${escapeRegex(canonicalBase)}/sitemap\\.xml$`, "m").test(robotsText)) addError("robots.txt must reference the provisional current-domain sitemap");

const redirectPath = path.join(outputRoot, "_redirects");
const redirectText = exists(redirectPath) ? fs.readFileSync(redirectPath, "utf8") : "";
const redirectLines = redirectText.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
const sourceSet = new Set(redirects.map((redirect) => redirect.source));
if (sourceSet.size !== redirects.length) addError("Redirect registry contains duplicate source paths");
if (redirectLines.length !== redirects.length) addError(`Generated _redirects contains ${redirectLines.length} active rules; expected ${redirects.length}`);
for (const redirect of redirects) {
  if (redirect.status !== 301) addError(`Redirect must use status 301: ${redirect.source}`);
  if (!redirect.source || !redirect.destination) addError(`Redirect is missing a source or destination: ${JSON.stringify(redirect)}`);
  const line = `${redirect.source} ${redirect.destination} ${redirect.status}`;
  if (!redirectLines.includes(line)) addError(`Generated _redirects is missing ${line}`);
  const destinationPath = redirect.destination.split("#")[0];
  if (sourceSet.has(destinationPath)) addError(`Redirect chain detected: ${redirect.source} -> ${redirect.destination}`);
  if (redirect.destination === "/" || redirect.destination === "/index.html") addError(`Mass-home redirect detected: ${redirect.source}`);
  if (!redirect.destination.startsWith("/")) addError(`Redirect destination must be a local path: ${redirect.destination}`);
  const technicalDestination = ["/sitemap.xml", "/robots.txt"].includes(destinationPath);
  if (!technicalDestination && !routes.some((route) => route.enabled && route.canonicalPath === destinationPath)) addError(`Redirect destination is not an enabled route: ${redirect.destination}`);
}
const redirectReport = {format: "Cloudflare Pages _redirects", deployed: false, rules: redirects, activeRuleCount: redirectLines.length, noHomeRedirects: redirectLines.every((line) => !/\s\/(?:index\.html)?\s+301$/.test(line)), noChains: redirects.every((redirect) => !sourceSet.has(redirect.destination.split("#")[0]))};

const inventory = readInventory();
const requiredHeaders = ["current_url", "final_destination", "content_parity", "redirect_code", "canonical", "indexability", "owner", "status", "notes"];
if (JSON.stringify(inventory.headers) !== JSON.stringify(requiredHeaders)) addError(`URL inventory headers must be exactly ${requiredHeaders.join(",")}`);
const currentUrls = new Set();
for (const row of inventory.rows) {
  if (!row.current_url || currentUrls.has(row.current_url)) addError(`URL inventory has a missing or duplicate current_url: ${row.current_url}`);
  currentUrls.add(row.current_url);
  if (!row.owner || !row.status || !row.indexability) addError(`URL inventory row is missing owner/status/indexability: ${row.current_url}`);
  if (row.final_destination === `${canonicalBase}/` && row.current_url !== `${canonicalBase}/`) addError(`URL inventory mass-home destination: ${row.current_url}`);
  if (row.redirect_code === "301" && !sourceSet.has(new URL(row.current_url).pathname)) addError(`URL inventory 301 has no redirect rule: ${row.current_url}`);
}

const fourOhFour = routes.find((route) => route.id === "404");
const fourOhFourHtml = fourOhFour && exists(outputForPath(fourOhFour)) ? readHtml(fourOhFour) : "";
const fourOhFourReport = {
  output: fourOhFour?.output,
  generated: Boolean(fourOhFourHtml),
  indexable: fourOhFour?.indexable === true,
  branded: /The House of Dental|Page Not Found/i.test(fourOhFourHtml),
  expectedHttpStatusForUnknownPath: 404,
  verifiedBy: "scripts/serve-static.mjs local static server check"
};
if (!fourOhFourHtml || fourOhFour?.indexable || !/Page Not Found/i.test(fourOhFourHtml)) addError("Branded 404 route is missing, indexable, or unbranded");

fs.mkdirSync(evidenceRoot, {recursive: true});
const writeEvidence = (name, value) => fs.writeFileSync(path.join(evidenceRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
writeEvidence("metadata-report.json", {canonicalBase, routeCount: enabledRoutes.length, indexableCount: indexableRoutes.length, routes: metadataReport});
writeEvidence("schema-report.json", {routes: schemaReport, forbiddenReviewMarkup: true, faqPolicy: "FAQPage is emitted only for visible service FAQs; no rich-result eligibility is promised."});
writeEvidence("heading-report.json", {routes: headingReport});
writeEvidence("indexability-report.json", {routes: indexabilityReport, sitemapCount: sitemapUrls.length});
writeEvidence("sitemap-report.json", {sitemap: "dist/sitemap.xml", urls: sitemapUrls, expectedUrls: expectedSitemapUrls, containsNoindexOrRedirectRoutes: sitemapUrls.every((url) => expectedSitemapUrls.includes(url))});
writeEvidence("robots-report.json", {path: "dist/robots.txt", text: robotsText, references: `${canonicalBase}/sitemap.xml`});
writeEvidence("redirect-report.json", redirectReport);
writeEvidence("404-report.json", fourOhFourReport);
writeEvidence("route-source-report.json", {generatedRouteCount: enabledRoutes.length, generatedRoutes: enabledRoutes.map((route) => ({id: route.id, output: route.output, indexable: route.indexable})), representativeRows});

const viewSource = [
  "# Phase 8 representative view-source inspection",
  "",
  `Generated ${enabledRoutes.length} routes; inspected ${representativeRows.length} representative source documents.`,
  "",
  ...representativeRows.map((row) => `## ${row.id}\n\n- Output: ${row.output}\n- Title: ${row.title}\n- H1: ${row.h1}\n- Canonical: ${row.canonical}\n- Required metadata element count: ${row.metadataTags}\n- JSON-LD types: ${row.jsonLdTypes.join(", ")}`)
];
fs.writeFileSync(path.join(evidenceRoot, "view-source-representative.md"), `${viewSource.join("\n\n")}\n`, "utf8");

console.log(`Phase 8 checked ${enabledRoutes.length} generated routes (${indexableRoutes.length} indexable), ${redirects.length} redirect rules, sitemap, robots, inventory, schema, metadata, headings, and 404 source.`);
warnings.forEach((warning) => console.warn(`WARN: ${warning}`));
const uniqueErrors = [...new Set(errors)];
uniqueErrors.forEach((error) => console.error(`ERROR: ${error}`));
if (uniqueErrors.length) {
  console.error(`Phase 8 validation failed with ${uniqueErrors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log("Phase 8 validation passed; deployment and Search Console actions remain intentionally out of scope.");
}
