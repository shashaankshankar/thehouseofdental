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
