#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const sourceRoot = path.join(projectRoot, "the-house-of-dental-site");
const evidenceRoot = path.join(projectRoot, "docs", "evidence", "phase-10");
const read = (file) => fs.readFileSync(file, "utf8");
const readJson = (file) => JSON.parse(read(file));
const routes = readJson(path.join(sourceRoot, "config", "routes.json"));
const site = readJson(path.join(sourceRoot, "config", "site.json"));
const acquisition = readJson(path.join(sourceRoot, "data", "acquisition.json"));
const enabledRoutes = routes.filter((route) => route.enabled);
const routeByOutput = new Map(enabledRoutes.map((route) => [route.output, route]));
const routeById = new Map(routes.map((route) => [route.id, route]));
const findings = [];
const routeResults = [];

const add = (severity, code, message, routeId = null, evidence = null) => findings.push({severity, code, message, routeId, evidence});
const gzipSize = (file) => zlib.gzipSync(fs.readFileSync(file), {level: 9}).length;
const ids = (html) => [...html.matchAll(/(?:^|\s)id="([^"]+)"/g)].map((match) => match[1]);
const tagText = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))]
  .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim());

for (const route of enabledRoutes) {
  const file = path.join(distRoot, route.output);
  const html = read(file);
  const routeFindings = [];
  const record = (severity, code, message, evidence = null) => {
    const finding = {severity, code, message, routeId: route.id, evidence};
    findings.push(finding);
    routeFindings.push(finding);
  };
  const routeIds = ids(html);
  const duplicateIds = [...new Set(routeIds.filter((id, index) => routeIds.indexOf(id) !== index))];
  const h1s = tagText(html, "h1");
  const images = [...html.matchAll(/<img\b([^>]*)>/gi)].map((match) => match[1]);
  const controls = [...html.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)];
  const ariaControls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1]);
  const positiveTabindex = [...html.matchAll(/tabindex="([1-9][0-9]*)"/g)].map((match) => match[1]);
  const blankTargets = [...html.matchAll(/<a\b([^>]*target="_blank"[^>]*)>/gi)].map((match) => match[1]);
  const externalRuntime = [
    ...html.matchAll(/<(?:script|img|source)\b[^>]*(?:src|srcset)="(https?:\/\/[^" ]+)/gi),
    ...html.matchAll(/<link\b[^>]*rel="(?:stylesheet|preconnect|preload|modulepreload)"[^>]*href="(https?:\/\/[^" ]+)/gi)
  ].map((match) => match[1]);
  const visibleHtml = html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");

  if (!/^<!doctype html>/i.test(html)) record("high", "missing-doctype", "Generated page is missing the HTML doctype.");
  if (!/<html\b[^>]*lang="en"/i.test(html)) record("high", "missing-lang", "Generated page is missing html[lang=en].");
  if (!/<a\b[^>]*class="skip-link"[^>]*href="#main-content"/i.test(html)) record("high", "missing-skip-link", "Page is missing the skip link.");
  if (!/<header\b/i.test(html) || !/<main\b[^>]*id="main-content"/i.test(html) || !/<footer\b/i.test(html)) record("high", "missing-landmark", "Page is missing a required header, main, or footer landmark.");
  if (h1s.length !== 1) record("high", "h1-count", `Expected one H1; found ${h1s.length}.`, h1s);
  if (duplicateIds.length) record("high", "duplicate-id", "Duplicate IDs found.", duplicateIds);
  if (positiveTabindex.length) record("medium", "positive-tabindex", "Positive tabindex values can break focus order.", positiveTabindex);
  for (const image of images) {
    if (!/\balt="[^"]*"/i.test(image)) record("high", "missing-image-alt", "Image is missing an alt attribute.", image.slice(0, 180));
    if (!/\bwidth="\d+"/i.test(image) || !/\bheight="\d+"/i.test(image)) record("medium", "missing-image-dimensions", "Image is missing explicit width/height.", image.slice(0, 180));
  }
  for (const control of controls) {
    const attributes = control[2];
    const text = control[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!text && !/aria-label="[^"]+"|aria-labelledby="[^"]+"/i.test(attributes)) record("high", "unnamed-control", `${control[1]} has no accessible name.`, attributes.slice(0, 180));
  }
  for (const controlledId of ariaControls) if (!routeIds.includes(controlledId)) record("high", "broken-aria-controls", `aria-controls points to missing id ${controlledId}.`);
  for (const attributes of blankTargets) if (!/\brel="[^"]*noopener/i.test(attributes)) record("medium", "blank-target-rel", "target=_blank link is missing rel=noopener.", attributes.slice(0, 180));
  if (externalRuntime.length) record("medium", "third-party-runtime", "Page contains third-party runtime or media requests.", externalRuntime);
  if (/fonts\.(?:googleapis|gstatic)\.com/i.test(html)) record("high", "third-party-font", "Page still depends on Google Fonts.");
  if (/\b(?:332|5\.0)\b[^<]*(?:review|rating)|(?:review|rating)[^<]*\b(?:332|5\.0)\b/i.test(html)) record("high", "stale-review-number", "Page contains a stale or unverified review count/rating.");
  if (/QuietNite/i.test(visibleHtml) && route.pageType !== "draft" && route.pageType !== "campaign" && route.id !== "sitemap-page" && route.id !== "technology") record("high", "quietnite-public-contradiction", "QuietNite appears on a non-gated public route.");

  routeResults.push({
    id: route.id,
    output: route.output,
    indexable: route.indexable,
    bytes: fs.statSync(file).size,
    gzipBytes: gzipSize(file),
    h1: h1s[0] || null,
    findings: routeFindings
  });
}

const homeHtml = read(path.join(distRoot, "index.html"));
const navMatch = homeHtml.match(/<ul id="primary-navigation"[\s\S]*?<\/ul>\s*<\/div>/i)?.[0] || "";
const footerMatch = homeHtml.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || "";
const expectedTopLevel = ["Services", "New Patients", "Patient Resources", "About", "Reviews", "Contact"];
for (const label of expectedTopLevel) if (!navMatch.includes(`>${label}<`)) add("high", "missing-primary-navigation", `Primary navigation is missing ${label}.`, "home");
for (const label of ["Replace Missing Teeth", "Repair &amp; Relieve Pain", "Improve My Smile", "Prevent &amp; Maintain", "Comfort &amp; Function"]) {
  if (!navMatch.includes(label.replaceAll("&", "&amp;")) && !navMatch.includes(label)) add("high", "missing-service-group", `Services menu is missing ${label}.`, "home");
}
for (const heldLabel of ["Facial Aesthetics", "Sleep & Snoring", "Laser Dentistry", "QuietNite", "Referral Program", "Blog / Education"]) {
  if (navMatch.includes(`>${heldLabel}<`) || navMatch.includes(heldLabel.replaceAll("&", "&amp;"))) add("high", "gated-topic-in-navigation", `${heldLabel} is exposed in public navigation before approval.`, "home");
}
for (const label of [...expectedTopLevel, "Sitemap", "Privacy Policy", "Terms & Conditions", "Accessibility"]) {
  if (!footerMatch.includes(label.replaceAll("&", "&amp;")) && !footerMatch.includes(label)) add("high", "missing-footer-path", `Footer is missing ${label}.`, "home");
}

const appointmentHandler = site.integrations.appointmentForm.handlerUrl;
if (appointmentHandler !== null) add("high", "unexpected-form-handler", "Appointment form handler is configured without a Phase 10 verified delivery record.");
if (!/nothing was sent/i.test(read(path.join(sourceRoot, "main.js")))) add("high", "form-false-success-risk", "Unconfigured form copy does not state that nothing was sent.");
if (site.integrations.measurement.dataLayer.enabled !== false) add("high", "analytics-enabled-unapproved", "Nonessential measurement is enabled before consent/vendor approval.");
if (site.integrations.measurement.ga4.measurementId || site.integrations.measurement.tagManager.containerId) add("high", "analytics-id-present", "Analytics IDs are present without a Phase 10 activation approval record.");
if (site.integrations.measurement.callTracking.trackingNumber) add("high", "call-tracking-number-present", "Call tracking is configured before NAP and consent approval.");

const sitemapXml = read(path.join(distRoot, "sitemap.xml"));
for (const route of enabledRoutes.filter((route) => route.indexable)) {
  if (!sitemapXml.includes(`${site.canonical.baseUrl}${route.canonicalPath}`)) add("high", "sitemap-missing-route", `Indexable route ${route.id} is missing from sitemap.xml.`, route.id);
}
for (const route of enabledRoutes.filter((route) => !route.indexable)) {
  if (sitemapXml.includes(`${site.canonical.baseUrl}${route.canonicalPath}`)) add("high", "sitemap-includes-noindex", `Noindex route ${route.id} appears in sitemap.xml.`, route.id);
}

const inventory = read(path.join(projectRoot, "docs", "URL-INVENTORY.csv"));
const inventoryBlocked = (inventory.match(/blocked-[a-z0-9-]+/gi) || []).length;
const inventoryBlockedRows = inventory.trim().split(/\r?\n/).slice(1).filter((row) => /blocked-[a-z0-9-]+/i.test(row)).length;
if (inventoryBlockedRows) add("blocker", "migration-inventory-blocked", `${inventoryBlockedRows} URL inventory rows contain ${inventoryBlocked} blocked or held markers pending crawl, parity, analytics, or approval evidence.`, null, "docs/URL-INVENTORY.csv");

const sourceMain = path.join(sourceRoot, "main.js");
const budgets = {
  htmlGzipBytes: 25000,
  cssGzipBytes: 20000,
  jsGzipBytes: 15000,
  homeCriticalBytes: 175000,
  homeRequests: 8,
  thirdPartyRequests: 0
};
const weights = {
  css: {bytes: fs.statSync(path.join(distRoot, "styles.css")).size, gzipBytes: gzipSize(path.join(distRoot, "styles.css"))},
  js: {bytes: fs.statSync(path.join(distRoot, "main.js")).size, gzipBytes: gzipSize(path.join(distRoot, "main.js"))},
  homeHtml: {bytes: fs.statSync(path.join(distRoot, "index.html")).size, gzipBytes: gzipSize(path.join(distRoot, "index.html"))},
  homeHeroDesktopAvif: fs.statSync(path.join(distRoot, "assets", "office-exterior.avif")).size,
  homeHeroMobileAvif: fs.statSync(path.join(distRoot, "assets", "office-exterior-mobile-800x900.avif")).size,
  logo: {bytes: fs.statSync(path.join(distRoot, "assets", "logo.svg")).size, gzipBytes: gzipSize(path.join(distRoot, "assets", "logo.svg"))}
};
weights.homeDesktopCriticalEstimate = weights.css.gzipBytes + weights.js.gzipBytes + weights.homeHtml.gzipBytes + weights.homeHeroDesktopAvif + weights.logo.gzipBytes;
weights.homeMobileCriticalEstimate = weights.css.gzipBytes + weights.js.gzipBytes + weights.homeHtml.gzipBytes + weights.homeHeroMobileAvif + weights.logo.gzipBytes;
if (weights.css.gzipBytes > budgets.cssGzipBytes) add("medium", "css-budget", "CSS exceeds the gzip budget.", null, weights.css);
if (weights.js.gzipBytes > budgets.jsGzipBytes) add("medium", "js-budget", "JavaScript exceeds the gzip budget.", null, weights.js);
if (weights.homeDesktopCriticalEstimate > budgets.homeCriticalBytes) add("medium", "home-critical-budget", "Estimated desktop critical transfer exceeds the budget.", null, weights.homeDesktopCriticalEstimate);
if (Math.max(...routeResults.map((route) => route.gzipBytes)) > budgets.htmlGzipBytes) add("medium", "html-budget", "At least one route exceeds the HTML gzip budget.");

const explicitBlockers = [
  "Final public/legal brand relationship and canonical-domain decision are pending.",
  "NAP, hours, public email, map pin, and social ownership still require practice confirmation.",
  "Appointment form delivery, security controls, notification ownership, and failure monitoring are unverified.",
  "Privacy, Terms, Accessibility, offer, referral, and public-form legal review are incomplete.",
  "Facial Aesthetics, Sleep, Laser Dentistry, and QuietNite facts and public release approvals are incomplete.",
  "The production URL crawl, analytics/Search Console evidence, and one-to-one migration parity are incomplete.",
  "No analytics, consent, CRM, call-tracking, or campaign vendor activation has been approved or live-tested.",
  "Provider/team/media rights, credential, review-source, testimonial, and clinical-care approvals remain incomplete."
];

fs.mkdirSync(evidenceRoot, {recursive: true});
const report = {
  generatedAt: new Date().toISOString(),
  verdict: "NO-GO",
  routeCount: enabledRoutes.length,
  indexableRouteCount: enabledRoutes.filter((route) => route.indexable).length,
  budgets,
  weights,
  findings,
  counts: {
    blocker: findings.filter((finding) => finding.severity === "blocker").length,
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length
  },
  explicitBlockers,
  implementationFindingCount: findings.filter((finding) => finding.severity !== "blocker").length,
  routeResults
};
fs.writeFileSync(path.join(evidenceRoot, "phase-10-static-qa.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 10 static QA checked ${enabledRoutes.length} routes; ${report.implementationFindingCount} implementation findings; ${report.counts.blocker} migration blocker; ${explicitBlockers.length} external launch blockers.`);
console.log(`Performance weights: CSS ${weights.css.gzipBytes} B gzip; JS ${weights.js.gzipBytes} B gzip; home desktop estimate ${weights.homeDesktopCriticalEstimate} B.`);
console.log("Verdict: NO-GO until the recorded external approvals and live integration/migration checks are complete.");
