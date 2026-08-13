import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import vm from "node:vm";

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

test("GA4 integration is configurable and enabled for the approved production routes", async () => {
  const siteMeasurement = JSON.parse(await readFile("measurement/site.json", "utf8"));
  const routes = JSON.parse(await readFile("measurement/eligibility/routes.json", "utf8"));
  const contract = JSON.parse(await readFile("measurement/contracts/local_service_v1/events.json", "utf8"));
  const script = await readFile("dist/main.js", "utf8");
  const analyticsScript = await readFile("src/scripts/80-analytics.js", "utf8");
  const styles = await readFile("dist/styles.css", "utf8");
  const headers = await readFile("dist/_headers", "utf8");
  assert.equal(siteMeasurement.deployment.status, "live");
  assert.equal(siteMeasurement.ga4.enabled, true);
  assert.equal(siteMeasurement.ga4.collectionStatus, "live");
  assert.equal(siteMeasurement.ga4.measurementId, "G-TC66MQQ0T7");
  assert.equal(routes.default, "prohibited");
  assert.equal(routes.routes["/contact"], "approved");
  assert.ok(routes.fragments["/contact"].includes("book"));
  assert.deepEqual(contract.events.map((event) => event.name), ["form_start", "form_submit", "generate_lead", "phone_click", "email_click", "appointment_request", "cta_click"]);
  assert.match(script, /const __SITE_ANALYTICS = \{"provider":"gtag","enabled":true,"measurementId":"G-TC66MQQ0T7","consent":\{"mode":"advanced","version":2,"storageKey":"thod-analytics-consent","waitForUpdate":500\},"contractVersion":"local_service_v1"/);
  assert.doesNotMatch(script, /"propertyId"|"webStreamId"|"connection"/);
  assert.ok(script.includes("https://www.googletagmanager.com/gtag/js?id="));
  assert.ok(headers.includes("script-src 'self' https://www.googletagmanager.com"));
  assert.ok(headers.includes("connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com"));
  assert.match(headers, /style-src[^;]*'unsafe-inline'/);
  assert.doesNotMatch(headers, /vercel|_vercel/i);
  assert.doesNotMatch(headers, /script-src[^;]*'unsafe-inline'/);
  for (const consentType of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
    assert.match(analyticsScript, new RegExp(consentType));
  }
  assert.match(analyticsScript, /gtag\("consent", "default"/);
  assert.match(analyticsScript, /gtag\("consent", "update"/);
  assert.match(analyticsScript, /localStorage/);
  assert.match(styles, /\.consent-banner/);
});

test("GA4 conversion events are consent-gated and privacy-safe", async () => {
  const analyticsScript = await readFile("src/scripts/80-analytics.js", "utf8");
  const formScript = await readFile("src/scripts/60-forms.js", "utf8");
  const handoff = await readFile("docs/ANALYTICS-HANDOFF.md", "utf8");
  for (const eventName of ["form_start", "form_submit", "generate_lead", "phone_click", "email_click", "appointment_request", "cta_click"]) {
    assert.match(handoff, new RegExp(`\\x60${eventName}\\x60`), eventName);
  }
  assert.match(analyticsScript, /if \(!analyticsStorageGranted \|\| !allowedEvents\.has\(eventName\)\) return;/);
  assert.match(analyticsScript, /eligibilityFor\(pagePath\(\)\) !== "approved"/);
  assert.match(analyticsScript, /const payload = \{ page_path: pagePath\(\) \};/);
  assert.match(analyticsScript, /page_location: pageLocation/);
  assert.match(analyticsScript, /page_referrer: ""/);
  assert.match(analyticsScript, /allowedLocations\.has\(metadata\.ctaLocation\)/);
  assert.match(analyticsScript, /allowedCtaTypes\.has\(metadata\.ctaType\)/);
  assert.match(analyticsScript, /allowedServiceCategories\.has\(metadata\.serviceCategory\)/);
  assert.match(analyticsScript, /analyticsStorageGranted = choice === "granted"/);
  assert.match(formScript, /result\.ok !== true/);
  assert.match(formScript, /window\.thodAnalytics\?\.track\("form_submit"/);
  assert.match(formScript, /window\.thodAnalytics\?\.track\("generate_lead"/);
  assert.match(formScript, /window\.thodAnalytics\?\.track\("appointment_request"/);
  assert.equal((formScript.match(/appointment_request/g) || []).length, 1);
  assert.doesNotMatch(analyticsScript, /FormData|name:|email:|phone:|message:|health/i);
  assert.match(handoff, /Form values, patient information, query strings, titles/);
});

test("generated CTAs carry contract analytics attributes", async () => {
  const contact = await readFile("dist/contact.html", "utf8");
  const home = await readFile("dist/index.html", "utf8");
  assert.match(contact, /data-analytics-event="phone_click" data-analytics-location="phone_link" href="tel:/);
  assert.match(contact, /data-analytics-event="cta_click" data-analytics-location="directions_link" data-analytics-cta-type="directions" href="https:\/\/goo\.gl\/maps/);
  assert.match(home, /data-analytics-event="cta_click" data-analytics-location="appointment_link" data-analytics-cta-type="appointment" href="\/contact#book"/);
  assert.match(contact, /data-analytics-form="contact_message"/);
});

test("disabled analytics does not touch Google or the page", async () => {
  const analyticsScript = await readFile("src/scripts/80-analytics.js", "utf8");
  const window = {};
  const document = new Proxy({}, {
    get() {
      throw new Error("disabled analytics must not access the document");
    }
  });
  vm.runInNewContext(analyticsScript, {
    __SITE_ANALYTICS: { provider: "gtag", enabled: false, measurementId: "" },
    window,
    document
  });
  assert.equal(window.dataLayer, undefined);
});

test("conversion events wait for consent and decline keeps analytics storage denied", async () => {
  const analyticsScript = await readFile("src/scripts/80-analytics.js", "utf8");
  const listeners = new Map();
  const makeElement = () => ({
    children: [],
    dataset: {},
    addEventListener(type, handler) { listeners.set(`${this.label || this.textContent}:${type}`, handler); },
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.children.push(child); },
    setAttribute() {},
    focus() {}
  });
  const phone = makeElement();
  phone.label = "phone";
  phone.dataset = { analyticsEvent: "phone_click", analyticsLocation: "phone_link" };
  const document = {
    head: makeElement(),
    body: makeElement(),
    createElement: makeElement,
    querySelectorAll(selector) {
      return selector === "[data-analytics-event]" ? [phone] : [];
    }
  };
  const window = { location: { pathname: "/contact" } };
  vm.runInNewContext(analyticsScript, {
    __SITE_ANALYTICS: {
      provider: "gtag",
      enabled: true,
      measurementId: "G-TEST123",
      consent: { mode: "advanced", version: 2, storageKey: "test-consent", waitForUpdate: 500 },
      routeEligibility: { default: "prohibited", routes: { "/contact": "approved" } },
      eventPolicy: {
        allowedEvents: ["phone_click"],
        allowedLocations: ["phone_link"],
        allowedCtaTypes: [],
        allowedServiceCategories: []
      }
    },
    window,
    document,
    localStorage: { getItem: () => null, setItem() {} },
    Set,
    Number,
    encodeURIComponent,
    URLSearchParams
  });
  listeners.get("phone:click")();
  assert.equal(window.dataLayer.filter((entry) => entry[0] === "event").length, 0);
  const allElements = (elements) => elements.flatMap((element) => [element, ...allElements(element.children)]);
  const decline = allElements(document.body.children).find((element) => element.textContent === "Decline analytics");
  listeners.get(`${decline.textContent}:click`)();
  listeners.get("phone:click")();
  assert.equal(window.dataLayer.filter((entry) => entry[0] === "event").length, 0);
  const consentUpdates = window.dataLayer.filter((entry) => entry[0] === "consent" && entry[1] === "update");
  assert.deepEqual(JSON.parse(JSON.stringify(consentUpdates.at(-1)[2])), {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  });
});

test("successful contact response emits the three consented post-success events exactly once", async () => {
  const analyticsScript = await readFile("src/scripts/80-analytics.js", "utf8");
  const formScript = await readFile("src/scripts/60-forms.js", "utf8");
  const makeElement = (tag = "div") => ({
    tag,
    children: [],
    dataset: {},
    hidden: false,
    disabled: false,
    listeners: new Map(),
    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    },
    async dispatch(type, event = {}) {
      for (const handler of this.listeners.get(type) || []) await handler(event);
    },
    append(...children) {
      for (const child of children) {
        child.parentNode = this;
        this.children.push(child);
      }
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
    },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
    focus() {}
  });
  const submitButton = makeElement("button");
  const form = makeElement("form");
  form.action = "/api/contact";
  form.fields = [["name", "Measurement QA"], ["email", "measurement.qa@example.com"], ["message", "Test only"]];
  form.querySelector = (selector) => selector === "button[type='submit']" ? submitButton : null;
  form.resetCount = 0;
  form.reset = () => { form.resetCount += 1; };
  const status = makeElement("p");
  const document = {
    head: makeElement("head"),
    body: makeElement("body"),
    createElement: makeElement,
    querySelector(selector) {
      if (selector === "form[data-contact-form]") return form;
      if (selector === "#contact-status") return status;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "form[data-analytics-form]") return [form];
      return [];
    }
  };
  const stored = new Map();
  const window = { location: { pathname: "/contact", origin: "https://thehouseofdentalwp.com", search: "", hash: "#book" } };
  class TestFormData {
    constructor(target) { this.values = target.fields; }
    *[Symbol.iterator]() { yield* this.values; }
  }
  const context = {
    __SITE_ANALYTICS: {
      provider: "gtag",
      enabled: true,
      measurementId: "G-TEST123",
      consent: { mode: "advanced", version: 2, storageKey: "test-consent", waitForUpdate: 500 },
      routeEligibility: { default: "prohibited", routes: { "/contact": "approved" }, fragments: { "/contact": ["book"] } },
      eventPolicy: {
        allowedEvents: ["form_start", "form_submit", "generate_lead", "appointment_request"],
        allowedLocations: ["appointment_form", "contact_form"],
        allowedCtaTypes: [],
        allowedServiceCategories: []
      }
    },
    window,
    document,
    localStorage: { getItem: (key) => stored.get(key) || null, setItem: (key, value) => stored.set(key, value) },
    fetch: async () => ({ ok: true, json: async () => ({ ok: true, message: "Your message was sent. We'll get back to you soon." }) }),
    FormData: TestFormData,
    URLSearchParams,
    Set,
    Number,
    Date,
    encodeURIComponent
  };
  vm.runInNewContext(analyticsScript, context);
  vm.runInNewContext(formScript, context);

  const allElements = (elements) => elements.flatMap((element) => [element, ...allElements(element.children)]);
  const allow = allElements(document.body.children).find((element) => element.textContent === "Allow analytics");
  await allow.dispatch("click");
  await form.dispatch("focusin");
  await form.dispatch("submit", { preventDefault() {} });

  const events = JSON.parse(JSON.stringify(window.dataLayer
    .filter((entry) => entry[0] === "event")
    .map((entry) => ({ name: entry[1], payload: entry[2] }))));
  assert.deepEqual(events.map((event) => event.name), ["form_start", "form_submit", "generate_lead", "appointment_request"]);
  assert.deepEqual(events.slice(1).map((event) => event.payload), [
    { page_path: "/contact", cta_location: "contact_form" },
    { page_path: "/contact", cta_location: "contact_form" },
    { page_path: "/contact", cta_location: "contact_form" }
  ]);
  assert.equal(form.resetCount, 1);
  assert.equal(status.dataset.state, "success");
  assert.equal(status.textContent, "Your message was sent. We'll get back to you soon.");
});

test("unapproved and unknown routes do not initialize analytics", async () => {
  const analyticsScript = await readFile("src/scripts/80-analytics.js", "utf8");
  const window = { location: { pathname: "/unknown" } };
  const document = new Proxy({}, {
    get() {
      throw new Error("unapproved routes must not access the document");
    }
  });
  vm.runInNewContext(analyticsScript, {
    __SITE_ANALYTICS: {
      provider: "gtag",
      enabled: true,
      measurementId: "G-TEST123",
      consent: { mode: "advanced", version: 2 },
      routeEligibility: { default: "prohibited", routes: { "/contact": "requires_review" } },
      eventPolicy: { allowedEvents: [], allowedLocations: [], allowedCtaTypes: [], allowedServiceCategories: [] }
    },
    window,
    document
  });
  assert.equal(window.dataLayer, undefined);
});

test("unsafe URL data fails closed before GA4 initializes", async () => {
  const analyticsScript = await readFile("src/scripts/80-analytics.js", "utf8");
  for (const location of [
    { pathname: "/contact", origin: "https://example.test", search: "?email=person@example.com", hash: "" },
    { pathname: "/contact", origin: "https://example.test", search: "?utm_campaign=patient-12345", hash: "" },
    { pathname: "/contact", origin: "https://example.test", search: "", hash: "#patient-12345" }
  ]) {
    const window = { location };
    const document = new Proxy({}, { get() { throw new Error("unsafe URL must fail before document access"); } });
    vm.runInNewContext(analyticsScript, {
      __SITE_ANALYTICS: {
        provider: "gtag", enabled: true, measurementId: "G-TEST123",
        consent: { mode: "advanced", version: 2 },
        routeEligibility: { default: "prohibited", routes: { "/contact": "approved" } },
        eventPolicy: { allowedEvents: [], allowedLocations: [], allowedCtaTypes: [], allowedServiceCategories: [] }
      },
      window, document, URLSearchParams, Set
    });
    assert.equal(window.dataLayer, undefined);
  }
});

test("measurement evidence separates governance approval from observed DebugView proof", async () => {
  const evidence = JSON.parse(await readFile("measurement/evidence/validation.json", "utf8"));
  assert.equal(evidence.status, "validated_locally");
  assert.equal(evidence.approvalStatus, "approved");
  assert.equal(evidence.deploymentStatus, "live");
  assert.equal(evidence.ga4RuntimeStatus, "enabled_on_live_approved_routes");
  assert.equal(evidence.measurementIdStatus, "provided");
  assert.ok(evidence.checks.length >= 10);
  assert.ok(evidence.manualChecksRemaining.some((item) => item.includes("GA4 DebugView event receipt")));
});

test("Google reputation integration has a safe fallback and no client API key", async () => {
  const site = JSON.parse(await readFile("src/data/site.json", "utf8"));
  const script = await readFile("dist/main.js", "utf8");
  const index = await readFile("dist/index.html", "utf8");
  const reviews = await readFile("dist/reviews.html", "utf8");
  const endpoint = await readFile("worker/index.mjs", "utf8");
  assert.deepEqual(site.reputation, {
    endpoint: "/api/google-reputation",
    fallback: { rating: 4.9, review_count: 337 }
  });
  assert.ok(script.includes('const __SITE_REPUTATION = {"endpoint":"/api/google-reputation","fallback":{"rating":4.9,"review_count":337}};'));
  assert.match(script, /if \(!endpoint\) \{\s*reveal\(fallback\);/);
  assert.doesNotMatch(script, /place_id/);
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
  assert.match(endpoint, /export default/);
  assert.match(endpoint, /s-maxage=300/);
  assert.doesNotMatch(endpoint, /onRequestGet|queryValue|requestedPlaceId/);
  assert.doesNotMatch(script, /GOOGLE_PLACES_API_KEY/);
});

test("generated pages contain no inline implementation code", async () => {
  for (const page of pages) {
    const html = await readFile(`dist/${page}`, "utf8");
    assert.doesNotMatch(html, /\sstyle="/, page);
    assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json")(?![^>]*src=)[^>]*>/, page);
    assert.equal((html.match(/name="robots"/g) || []).length, 1, page);
  }
});

test("contact form targets the Resend-backed Worker contact endpoint", async () => {
  const html = await readFile("dist/contact.html", "utf8");
  const script = await readFile("dist/main.js", "utf8");
  const formScript = await readFile("src/scripts/60-forms.js", "utf8");
  const endpoint = await readFile("worker/index.mjs", "utf8");
  assert.match(html, /<form[^>]+action="\/api\/contact"[^>]+method="POST"[^>]+data-contact-form/);
  assert.match(html, /name="company"/);
  assert.match(html, /id="contact-status"/);
  assert.match(html, />Send Message</);
  assert.doesNotMatch(html, /data-netlify|name="form-name"/);
  assert.match(formScript, /preventDefault\(\)/);
  assert.match(formScript, /URLSearchParams\(new FormData\(form\)\)/);
  assert.match(endpoint, /RESEND_API_KEY/);
  assert.match(endpoint, /CONTACT_FROM_EMAIL/);
  assert.match(endpoint, /CONTACT_RECIPIENT_EMAIL/);
  assert.match(endpoint, /CONTACT_ALLOWED_ORIGINS/);
  assert.match(endpoint, /Authorization: `Bearer \$\{resendApiKey\}`/);
  assert.doesNotMatch(endpoint, /console\.(log|error|warn)/);
});

test("Cloudflare config pins the Worker, Static Assets, routes, and safe variables", async () => {
  const config = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
  assert.equal(config.name, "thehouseofdental");
  assert.equal(config.main, "./worker/index.mjs");
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, true);
  assert.equal(config.assets.directory, "./dist");
  assert.equal(config.assets.binding, "ASSETS");
  assert.equal(config.assets.html_handling, "drop-trailing-slash");
  assert.equal(config.assets.not_found_handling, "404-page");
  assert.deepEqual(config.assets.run_worker_first, ["/*"]);
  assert.deepEqual(config.routes, [
    { pattern: "thehouseofdentalwp.com", custom_domain: true },
    { pattern: "www.thehouseofdentalwp.com", custom_domain: true }
  ]);
  const csp = await readFile("dist/_headers", "utf8");
  assert.match(csp, /form-action 'self'/);
  assert.doesNotMatch(csp, /vercel|_vercel/i);
  const envExample = await readFile(".dev.vars.example", "utf8");
  for (const key of ["GOOGLE_PLACE_ID", "GOOGLE_PLACES_API_KEY", "RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_RECIPIENT_EMAIL", "CONTACT_ALLOWED_ORIGINS"]) {
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
  const careAnchors = [...html.matchAll(/<a class="treatment-care-link" href="\/pre-post-op#([^"]+)">Treatment Care<\/a>/g)].map((match) => match[1]);
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

test("mobile treatment-care links restore the selected guide section", async () => {
  const script = await readFile("dist/main.js", "utf8");
  const styles = await readFile("dist/styles.css", "utf8");
  assert.match(script, /document\.querySelectorAll\("\.care-block\[id\]"\)/);
  assert.match(script, /window\.matchMedia\("\(max-width: 800px\)"\)/);
  assert.match(script, /target\.scrollIntoView\(\{ block: "start" \}\)/);
  assert.match(styles, /@media \(max-width: 800px\) \{[\s\S]*?\.care-block \{ scroll-margin-top: calc\(var\(--head-h, 86px\) \+ 1rem\); \}/);
});

test("services page links to treatment care after dental services", async () => {
  const html = await readFile("dist/services.html", "utf8");
  assert.match(html, /<section class="service-group" id="dental-services">[\s\S]*?<div class="service-group-action">\s*<a class="btn btn-outline rv rv-d2" href="\/pre-post-op">View All Pre &amp; Post Treatment Care<\/a>\s*<\/div>\s*<\/section>/);
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
  assert.match(navigation, /<a data-primary-link data-active-paths="\/pre-post-op" href="\/services">Services<\/a>/);
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
    assert.match(navigation, /href="\/services#facial-aesthetics-services"/);
    assert.match(navigation, /href="\/services#dental-services"/);
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
