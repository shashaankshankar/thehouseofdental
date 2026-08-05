import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "dist");
const configRoot = path.join(projectRoot, "the-house-of-dental-site", "config");
const routes = JSON.parse(fs.readFileSync(path.join(configRoot, "routes.json"), "utf8"));
const enabledRoutes = routes.filter((route) => route.enabled);
const acquisition = JSON.parse(fs.readFileSync(path.join(projectRoot, "the-house-of-dental-site", "data", "acquisition.json"), "utf8"));
const siteConfig = JSON.parse(fs.readFileSync(path.join(configRoot, "site.json"), "utf8"));
const resolveRegistryText = (value) => String(value)
  .replaceAll("{{BRAND_NAME}}", siteConfig.brand.name)
  .replaceAll("{{PHONE_DISPLAY}}", siteConfig.contact.phone.display);
const htmlDecode = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'");

test("the generated output contains every enabled route", () => {
  for (const route of enabledRoutes) assert.ok(fs.existsSync(path.join(outputRoot, route.output)), route.output);
});

test("the generated output has one shared shell per route", () => {
  for (const route of enabledRoutes) {
    const html = fs.readFileSync(path.join(outputRoot, route.output), "utf8");
    assert.equal((html.match(/<header\b/gi) || []).length, 1, `${route.id} header`);
    assert.equal((html.match(/<footer\b/gi) || []).length, 1, `${route.id} footer`);
    assert.equal((html.match(/<title>/gi) || []).length, 1, `${route.id} title`);
    assert.equal((html.match(/<main\b/gi) || []).length, 1, `${route.id} main`);
    assert.match(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/i, `${route.id} h1`);
    assert.match(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/i, `${route.id} JSON-LD`);
  }
});

test("generated source exposes crawlable metadata, H1, text, and links", () => {
  for (const route of enabledRoutes) {
    const html = fs.readFileSync(path.join(outputRoot, route.output), "utf8");
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)">/i)?.[1];
    assert.equal(htmlDecode(title || ""), resolveRegistryText(route.title), `${route.id} title source`);
    assert.equal(htmlDecode(description || ""), resolveRegistryText(route.description), `${route.id} description source`);
    assert.match(html, new RegExp(`<link rel="canonical" href="[^\"]+${route.canonicalPath === "/" ? "" : route.canonicalPath.replaceAll("/", "\\/")}"`), `${route.id} canonical source`);
    assert.match(html, /<main\b[^>]*id="main-content"[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>/i, `${route.id} H1 and page text source`);
    assert.match(html, /<a\b[^>]*href="(?:\.\.\/|\.\/|[^h][^\"]*\.html)/i, `${route.id} internal links source`);
  }
});

test("unresolved config values are explicit and not silently substituted", () => {
  const config = siteConfig;
  assert.equal(config.reviewSource.url, null);
  assert.match(config.reviewSource.status, /unresolved/i);
  assert.equal(config.analytics.ga4MeasurementId, null);
  assert.match(config.analytics.status, /placeholders/i);
  assert.equal(config.contact.email.value, null);
  assert.match(config.contact.email.status, /unresolved/i);
  assert.match(config.appointmentUrl.status, /local|unresolved/i);
  assert.ok(config.contact.hours.rows.length > 0);
});

test("Phase 6 acquisition surfaces stay data-driven and approval-gated", () => {
  const homeHtml = fs.readFileSync(path.join(outputRoot, "index.html"), "utf8");
  const servicesHtml = fs.readFileSync(path.join(outputRoot, "services.html"), "utf8");
  const mainJs = fs.readFileSync(path.join(projectRoot, "the-house-of-dental-site", "main.js"), "utf8");
  const enabledFeatured = acquisition.featuredServices.filter((item) => item.enabled !== false);
  const enabledGoals = acquisition.goalPaths.filter((item) => item.enabled !== false);
  const disabledItems = [
    ...acquisition.featuredServices.filter((item) => item.enabled === false),
    ...acquisition.navigation.topLevel.filter((item) => item.enabled === false),
    ...acquisition.goalPaths.filter((item) => item.enabled === false)
  ];

  assert.match(homeHtml, /Advanced Dentistry,[\s\S]*Designed Around You/);
  assert.match(homeHtml, /Dentist in Winter Park, Florida/);
  assert.match(homeHtml, /Personalized dental care/);
  assert.match(homeHtml, /Review source status/);
  assert.doesNotMatch(homeHtml, /(?:5\.0|332|Google Rating|Google Reviews)/i);
  assert.doesNotMatch(homeHtml, /carousel|autoplay|auto-rotat|setInterval/i);
  assert.doesNotMatch(mainJs, /setInterval\s*\(/i);

  for (const item of enabledFeatured) {
    assert.match(homeHtml, new RegExp(`data-acquisition-path="featured"[\\s\\S]*?${item.title.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`));
    const target = routes.find((route) => route.id === item.routeId);
    assert.ok(target && homeHtml.includes(target.output), `${item.routeId} destination`);
  }
  for (const item of enabledGoals) {
    assert.ok(homeHtml.includes(`data-acquisition-goal="${item.id}"`), `${item.id} goal card`);
    assert.ok(servicesHtml.includes(`data-acquisition-goal="${item.id}"`), `${item.id} Services card`);
    const target = routes.find((route) => route.id === item.routeId);
    assert.ok(target && homeHtml.includes(target.output), `${item.id} destination`);
  }
  for (const item of disabledItems) {
    const label = item.title || item.label || item.id;
    assert.doesNotMatch(homeHtml, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${label} is gated from home`);
  }

  assert.match(homeHtml, /Services/);
  assert.match(homeHtml, /New Patients/);
  assert.match(homeHtml, /Patient Resources/);
  assert.match(homeHtml, /About/);
  assert.match(homeHtml, /Reviews/);
  assert.match(homeHtml, /Contact/);
  assert.doesNotMatch(homeHtml, /Special Offers|Referral Program/);
  assert.doesNotMatch(servicesHtml, /href="#goal-/);
});

test("Phase 7 trust, technology, care, and media gates are explicit", () => {
  const sourceRoot = path.join(projectRoot, "the-house-of-dental-site");
  const technologyData = JSON.parse(fs.readFileSync(path.join(sourceRoot, "data", "technology.json"), "utf8"));
  const careGuides = JSON.parse(fs.readFileSync(path.join(sourceRoot, "data", "care-guides.json"), "utf8"));
  const pageHtml = Object.fromEntries([
    ["home", "index.html"],
    ["about", "about.html"],
    ["reviews", "reviews.html"],
    ["technology", "technology/index.html"],
    ["care", "pre-post-op.html"]
  ].map(([id, output]) => [id, fs.readFileSync(path.join(outputRoot, output), "utf8")]));

  assert.deepEqual(Object.keys(technologyData), ["cerec"]);
  assert.equal(technologyData.cerec.img, null);
  assert.equal(careGuides.guides.length, 8);
  assert.ok(careGuides.guides.every((guide) => guide.lastReviewed === null && guide.clinicalOwner === null));

  assert.match(pageHtml.home, /Review source status/);
  assert.doesNotMatch(pageHtml.home, /Read Verified Patient Reviews|(?:5\.0|332|Google Rating|Google Reviews)/i);
  assert.match(pageHtml.about, /Provider details pending approval/);
  assert.match(pageHtml.about, /Authentic portrait pending/);
  assert.match(pageHtml.reviews, /Approved review link pending/);
  assert.doesNotMatch(pageHtml.reviews, /aggregateRating|reviewBody|reviewRating/i);
  assert.match(pageHtml.technology, /CEREC/);
  assert.match(pageHtml.technology, /Facial Aesthetics/);
  assert.match(pageHtml.technology, /Dental laser/);

  for (const [id, html] of Object.entries(pageHtml)) {
    assert.doesNotMatch(html, /<(?:img|source)\b[^>]+(?:src|srcset)="https?:\/\//i, `${id} remote image`);
    assert.doesNotMatch(html, /<(?:img|source)\b[^>]+(?:src|srcset)="\s*"/i, `${id} empty image source`);
    assert.doesNotMatch(html, /assets\/(?:team|aesthetics)\/[^"']+\.(?:jpe?g|png|webp|avif|gif)/i, `${id} missing team/aesthetics asset`);
  }

  assert.equal((pageHtml.care.match(/class="care-toggle"/g) || []).length, careGuides.guides.length);
  assert.equal((pageHtml.care.match(/class="care-panel"/g) || []).length, careGuides.guides.length);
  assert.equal((pageHtml.care.match(/class="care-meta"/g) || []).length, careGuides.guides.length);
  assert.equal((pageHtml.care.match(/Download &amp; Print These Instructions/g) || []).length, careGuides.guides.length);
  assert.match(pageHtml.care, /Find instructions by treatment or concern/);
  assert.match(pageHtml.care, /aria-expanded="true"/);
  assert.match(pageHtml.care, /aria-controls="care-panel-implants"/);
  assert.match(pageHtml.care, /If you have trouble breathing or swallowing/);
  assert.doesNotMatch(pageHtml.care, /complete-care-guide\.pdf|quietnite-care\.pdf/i);
});
