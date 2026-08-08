import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const pages = (await readdir("dist")).filter((name) => name.endsWith(".html")).sort();
const sourceScripts = (await readdir("src/scripts")).filter((name) => name.endsWith(".js"));
const sourceStyles = (await readdir("src/styles")).filter((name) => name.endsWith(".css"));

test("site remains a focused 12-page static site", () => {
  assert.equal(pages.length, 12);
  assert.deepEqual(pages, ["404.html", "about.html", "accessibility.html", "contact.html", "facial-aesthetics.html", "index.html", "new-patients.html", "pre-post-op.html", "privacy.html", "reviews.html", "services.html", "terms.html"]);
});

test("source is split into focused modules", () => {
  assert.ok(sourceScripts.length >= 8);
  assert.ok(sourceStyles.length >= 6);
});

test("GA4 integration is configurable and inactive by default", async () => {
  const site = JSON.parse(await readFile("src/data/site.json", "utf8"));
  const script = await readFile("dist/main.js", "utf8");
  const analyticsScript = await readFile("src/scripts/80-analytics.js", "utf8");
  const styles = await readFile("dist/styles.css", "utf8");
  const headers = await readFile("dist/_headers", "utf8");
  assert.deepEqual(site.analytics, {
    provider: "gtag",
    enabled: false,
    measurementId: "",
    consent: {
      mode: "advanced",
      version: 2,
      storageKey: "thod-analytics-consent",
      waitForUpdate: 500
    }
  });
  assert.match(script, /const __SITE_ANALYTICS = \{"provider":"gtag","enabled":false,"measurementId":"","consent":\{"mode":"advanced","version":2,"storageKey":"thod-analytics-consent","waitForUpdate":500\}\};/);
  assert.ok(script.includes("https://www.googletagmanager.com/gtag/js?id="));
  assert.ok(headers.includes("script-src 'self' https://www.googletagmanager.com"));
  assert.ok(headers.includes("sha256-qA1xVLVZZkhsh2h8PEraeZsQhOHWWH9fm/J8tFPbbXg="));
  assert.ok(headers.includes("connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com"));
  for (const consentType of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
    assert.match(analyticsScript, new RegExp(consentType));
  }
  assert.match(analyticsScript, /gtag\("consent", "default"/);
  assert.match(analyticsScript, /gtag\("consent", "update"/);
  assert.match(analyticsScript, /localStorage/);
  assert.match(styles, /\.consent-banner/);
});

test("Google reputation integration has a safe fallback and no client API key", async () => {
  const site = JSON.parse(await readFile("src/data/site.json", "utf8"));
  const script = await readFile("dist/main.js", "utf8");
  const index = await readFile("dist/index.html", "utf8");
  const reviews = await readFile("dist/reviews.html", "utf8");
  const endpoint = await readFile("api/google-reputation.js", "utf8");
  assert.deepEqual(site.reputation, {
    place_id: "ChIJM7fB_p1v54gR35t3HRaGH_Q",
    endpoint: "/api/google-reputation",
    fallback: { rating: 5, review_count: 332 }
  });
  assert.ok(script.includes('const __SITE_REPUTATION = {"place_id":"ChIJM7fB_p1v54gR35t3HRaGH_Q","endpoint":"/api/google-reputation","fallback":{"rating":5,"review_count":332}};'));
  assert.match(script, /if \(!placeId \|\| !endpoint\) \{\s*reveal\(fallback\);/);
  assert.match(index, /data-reputation-rating>—<\/b>/);
  assert.match(index, /data-reputation-review-count>—<\/b>/);
  assert.match(reviews, /data-reputation-rating>—<\/span>/);
  assert.match(reviews, /data-reputation-review-count>—<\/span>/);
  assert.match(script, /reputation-value-pending/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /requestAnimationFrame\(tick\)/);
  assert.match(endpoint, /GOOGLE_PLACES_API_KEY/);
  assert.match(endpoint, /X-Goog-FieldMask/);
  assert.match(endpoint, /rating,userRatingCount,googleMapsUri/);
  assert.match(endpoint, /module\.exports/);
  assert.match(endpoint, /s-maxage=300/);
  assert.doesNotMatch(endpoint, /onRequestGet/);
  assert.doesNotMatch(script, /GOOGLE_PLACES_API_KEY/);
});

test("generated pages contain no inline implementation code", async () => {
  for (const page of pages) {
    const html = await readFile(`dist/${page}`, "utf8");
    assert.doesNotMatch(html, /\sstyle="/, page);
    assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json")(?![^>]*src=)[^>]*>(?!window\.va)/, page);
    assert.equal((html.match(/name="robots"/g) || []).length, 1, page);
  }
});

test("appointment form targets the fail-closed Vercel backend", async () => {
  const html = await readFile("dist/contact.html", "utf8");
  const script = await readFile("dist/main.js", "utf8");
  const formScript = await readFile("src/scripts/60-forms.js", "utf8");
  const endpoint = await readFile("api/appointment.js", "utf8");
  assert.match(html, /<form[^>]+action="\/api\/appointment"[^>]+method="POST"[^>]+data-appointment-form/);
  assert.match(html, /name="company"/);
  assert.match(html, /id="appointment-status"/);
  assert.match(html, />Send Request</);
  assert.doesNotMatch(html, /data-netlify|name="form-name"/);
  assert.match(formScript, /preventDefault\(\)/);
  assert.match(formScript, /URLSearchParams\(new FormData\(form\)\)/);
  assert.match(endpoint, /APPOINTMENT_BACKEND_URL/);
  assert.match(endpoint, /APPOINTMENT_BACKEND_TOKEN/);
  assert.match(endpoint, /APPOINTMENT_ALLOWED_ORIGINS/);
  assert.match(endpoint, /Authorization: `Bearer \$\{backendToken\}`/);
  assert.doesNotMatch(endpoint, /console\.(log|error|warn)/);
});

test("Vercel config pins the build output, routing, headers, and Function budget", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  assert.equal(config.installCommand, "npm ci");
  assert.equal(config.buildCommand, "npm run check");
  assert.equal(config.outputDirectory, "dist");
  assert.equal(config.functions["api/*.js"].maxDuration, 10);
  assert.equal(config.redirects.length, 6);
  const globalHeaders = config.headers.find((rule) => rule.source === "/(.*)");
  const csp = globalHeaders.headers.find((header) => header.key === "Content-Security-Policy").value;
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /sha256-qA1xVLVZZkhsh2h8PEraeZsQhOHWWH9fm\/J8tFPbbXg=/);
  const envExample = await readFile(".env.example", "utf8");
  for (const key of ["GOOGLE_PLACE_ID", "GOOGLE_PLACES_API_KEY", "APPOINTMENT_BACKEND_URL", "APPOINTMENT_BACKEND_TOKEN", "APPOINTMENT_ALLOWED_ORIGINS"]) {
    assert.match(envExample, new RegExp(`^${key}=\\s*$`, "m"));
  }
});

test("service and technology details are embedded in the export", async () => {
  const services = await readFile("dist/services.html", "utf8");
  const about = await readFile("dist/about.html", "utf8");
  const script = await readFile("dist/main.js", "utf8");
  assert.doesNotMatch(services, /Select a Service to Explore/);
  assert.equal((services.match(/class="center-head services-collection-head"/g) || []).length, 2);
  assert.match(services, /id="implants"[^>]*data-svc="implants"/);
  assert.match(services, /id="facial-aesthetics-services"/);
  assert.match(services, /id="dental-services"/);
  for (const id of ["deka", "microneedling", "emage", "hydroderm", "quietnite"]) {
    assert.match(services, new RegExp(`data-svc="${id}"`), id);
  }
  const serviceOrder = [...services.matchAll(/data-svc="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(serviceOrder, [
    "deka", "microneedling", "emage", "hydroderm",
    "implants", "crowns", "restorative", "dentures", "root-canals",
    "cosmetic", "veneers", "preventive", "invisalign", "oral-surgery",
    "sedation", "tmj", "srp", "quietnite"
  ]);
  assert.match(services, /data-modal-prev/);
  assert.match(services, /data-modal-next/);
  assert.match(about, /data-tech="cerec"/);
  assert.match(script, /const __SITE_DETAIL_DATA =/);
  assert.match(script, /"services"/);
  assert.match(script, /"technology"/);
  assert.doesNotMatch(script, /fetch\(.*(?:services|technology)\.json/);
  assert.match(script, /history\.pushState/);
});

test("service cards keep modal triggers and expose matching treatment care links", async () => {
  const html = await readFile("dist/services.html", "utf8");
  const serviceIds = [...html.matchAll(/<button id="[^"]+" class="svc-card" data-svc="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(serviceIds, [
    "deka", "microneedling", "emage", "hydroderm", "implants", "crowns", "restorative",
    "dentures", "root-canals", "cosmetic", "veneers", "preventive", "invisalign", "oral-surgery",
    "sedation", "tmj", "srp", "quietnite"
  ]);
  const careAnchors = [...html.matchAll(/<a class="treatment-care-link" href="pre-post-op\.html#([^"]+)">Treatment Care<\/a>/g)].map((match) => match[1]);
  assert.deepEqual(careAnchors, [
    "deka-co2", "microneedling", "emage-scan", "hydroderm", "implants", "crowns", "dentures",
    "root-canals", "veneers", "sedation", "srp", "quietnite"
  ]);
  assert.equal((html.match(/class="treatment-care-link"/g) || []).length, careAnchors.length);
});

test("service modal navigation includes a reduced-motion-aware switch transition", async () => {
  const script = await readFile("dist/main.js", "utf8");
  const styles = await readFile("dist/styles.css", "utf8");
  assert.match(script, /transition: true, direction/);
  assert.match(script, /panel\.classList\.add\("is-switching"\)/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(styles, /\.svcmodal \.panel \{[\s\S]*?transition: opacity 0\.24s/);
  assert.match(styles, /\.svcmodal \.panel\.is-switching \{/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.svcmodal \.panel\.is-switching/);
});

test("treatment care links share the View Details line treatment", async () => {
  const styles = await readFile("dist/styles.css", "utf8");
  assert.match(styles, /\.service-card-wrap\.has-care-link[\s\S]*?\.treatment-care-link \{[\s\S]*?border-bottom: 1px solid var\(--gold-deep\)/);
  assert.match(styles, /\.services-page-groups \.treatment-care-link \{\s*display: inline-block;\s*align-self: flex-start;/);
  assert.match(styles, /\.service-card-wrap\.has-care-link \.svc-card h3 \{\s*min-height: 2\.875rem;/);
  assert.match(styles, /\.services-page-groups \.treatment-care-link \{[\s\S]*?margin: 1\.2rem 2rem 2\.4rem;/);
  assert.match(styles, /\.service-card-wrap\.has-care-link \.svc-card \.body \{[\s\S]*?padding-bottom: 0\.45rem/);
});

test("care navigation follows services and rendered guide order", async () => {
  const html = await readFile("dist/pre-post-op.html", "utf8");
  const expectedOrder = [
    "deka-co2", "microneedling", "emage-scan", "hydroderm",
    "implants", "crowns", "dentures", "root-canals", "veneers",
    "extractions", "sedation", "srp", "quietnite"
  ];
  const nav = html.match(/<section class="sec-noir care-nav">([\s\S]*?)<\/section>/)?.[1] || "";
  const navOrder = [...nav.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  const sectionOrder = [...html.matchAll(/<section class="sec sec-ivory care-block" id="([^"]+)">/g)].map((match) => match[1]);
  assert.deepEqual(navOrder, expectedOrder);
  assert.deepEqual(sectionOrder, expectedOrder);
  assert.ok(html.indexOf("<span>Facial Aesthetics</span>") < html.indexOf("<span>Dental Procedures</span>"));
});

test("services page links to treatment care after dental services", async () => {
  const html = await readFile("dist/services.html", "utf8");
  assert.match(html, /<section class="service-group" id="dental-services">[\s\S]*?<div class="service-group-action">\s*<a class="btn btn-outline rv rv-d2" href="pre-post-op\.html">View All Pre &amp; Post Treatment Care<\/a>\s*<\/div>\s*<\/section>/);
});

test("back-to-top control is scoped to the care page", async () => {
  const care = await readFile("dist/pre-post-op.html", "utf8");
  const services = await readFile("dist/services.html", "utf8");
  assert.match(care, /<a class="care-back-to-top" href="#main-content" aria-label="Back to top">/);
  assert.match(care, /<span aria-hidden="true">↑<\/span>/);
  assert.doesNotMatch(services, /care-back-to-top/);
});

test("care page keeps Services selected in the shared navigation", async () => {
  const html = await readFile("dist/pre-post-op.html", "utf8");
  const navigation = html.match(/<ul class="menu" id="primary-navigation">([\s\S]*?)<\/header>/)?.[1] || "";
  assert.match(navigation, /<a data-primary-link data-active-paths="pre-post-op\.html" href="services\.html">Services<\/a>/);
  const script = await readFile("dist/main.js", "utf8");
  assert.match(script, /link\.dataset\.activePaths/);
  assert.match(script, /link\.setAttribute\("aria-current", "page"\)/);
});

test("shared navigation and footer are generated consistently", async () => {
  const fullPages = ["index.html", "about.html", "contact.html", "facial-aesthetics.html", "new-patients.html", "pre-post-op.html", "reviews.html", "services.html"];
  const expectedNavigation = ["Facial Aesthetics", "Services", "New Patients", "About Us", "Reviews", "Contact", "Book"];
  for (const page of fullPages) {
    const html = await readFile(`dist/${page}`, "utf8");
    assert.match(html, /id="primary-navigation"/, page);
    assert.match(html, /Terms &amp; Conditions/, page);
    assert.match(html, /aria-label="Quick contact"/, page);
    const navigation = html.match(/<ul class="menu" id="primary-navigation">([\s\S]*?)<\/header>/)?.[1] || "";
    const labels = [...navigation.matchAll(/<a data-primary-link[^>]*>([^<]+)<\/a>/g)].map((match) => match[1].trim());
    assert.deepEqual(labels, expectedNavigation, page);
    assert.equal((navigation.match(/class="drop(?:\s|\")/g) || []).length, 4, page);
    const careGuidesPosition = navigation.indexOf("<strong>Pre &amp; Post Treatment Care</strong>");
    const facialServicesPosition = navigation.indexOf("<strong>Facial Aesthetics Services</strong>");
    const dentalServicesPosition = navigation.indexOf("<strong>Dental Care Services</strong>");
    const allServicesPosition = navigation.indexOf("<strong>All Services</strong>");
    assert.ok(careGuidesPosition >= 0, page);
    assert.ok(facialServicesPosition > careGuidesPosition, page);
    assert.ok(dentalServicesPosition > facialServicesPosition, page);
    assert.ok(allServicesPosition > dentalServicesPosition, page);
    assert.match(navigation, /href="services\.html#facial-aesthetics-services"/);
    assert.match(navigation, /href="services\.html#dental-services"/);
    assert.doesNotMatch(navigation, /submenu-toggle/, page);
    assert.doesNotMatch(navigation, /nav-phone/, page);
  }
});

test("homepage preserves the restored legacy journey", async () => {
  const html = await readFile("dist/index.html", "utf8");
  const sections = [
    "Precision-Crafted Restorations",
    'class="stats rv"',
    'class="marquee-track"',
    "The Collection",
    'id="technology"',
    'id="offers"',
    "Meet Dr. Mainak Patel",
    "quote-block",
    'class="ba-grid"',
    "Smile With Confidence"
  ];
  let previous = html.indexOf('class="hero"');

  assert.ok(previous >= 0);
  for (const marker of sections) {
    const position = html.indexOf(marker);
    assert.ok(position > previous, `${marker} should follow the prior homepage section`);
    previous = position;
  }
  assert.match(html, /id="techmodal"/);
});

test("runtime keeps required accessible interactions", async () => {
  const script = await readFile("dist/main.js", "utf8");
  for (const behavior of ["aria-expanded", "aria-pressed", "aria-valuenow", "returnFocus", "hashchange"]) {
    assert.match(script, new RegExp(behavior), behavior);
  }
  assert.doesNotMatch(script, /setInterval\(scan|\.innerHTML\s*=/);
});
