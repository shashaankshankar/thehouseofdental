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

test("generated pages contain no inline implementation code", async () => {
  for (const page of pages) {
    const html = await readFile(`dist/${page}`, "utf8");
    assert.doesNotMatch(html, /\sstyle="/, page);
    assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json")(?![^>]*src=)[^>]*>/, page);
    assert.equal((html.match(/name="robots"/g) || []).length, 1, page);
  }
});

test("appointment form remains fail closed", async () => {
  const html = await readFile("dist/contact.html", "utf8");
  const script = await readFile("dist/main.js", "utf8");
  assert.match(html, /Nothing has been sent/);
  assert.doesNotMatch(html, /data-netlify|<form[^>]+action=/);
  assert.match(script, /preventDefault\(\)/);
  assert.match(script, /Nothing was sent/);
});

test("service and technology details are statically discoverable", async () => {
  const services = await readFile("dist/services.html", "utf8");
  const about = await readFile("dist/about.html", "utf8");
  const script = await readFile("dist/main.js", "utf8");
  assert.ok((services.match(/class="inline-detail/g) || []).length >= 14);
  assert.ok((about.match(/data-detail-kind="technology"/g) || []).length >= 8);
  assert.match(services, /id="implants"[^>]*data-detail-kind="service"/);
  assert.match(about, /id="cerec"[^>]*data-detail-kind="technology"/);
  assert.doesNotMatch(script, /fetch\(.*(?:services|technology)\.json/);
  assert.match(script, /history\.pushState/);
});

test("shared navigation and footer are generated consistently", async () => {
  const fullPages = ["index.html", "about.html", "contact.html", "facial-aesthetics.html", "new-patients.html", "pre-post-op.html", "reviews.html", "services.html"];
  const expectedNavigation = ["Services", "Facial Aesthetics", "New Patients", "About", "Reviews", "Contact", "Book"];
  for (const page of fullPages) {
    const html = await readFile(`dist/${page}`, "utf8");
    assert.match(html, /id="primary-navigation"/, page);
    assert.match(html, /Terms &amp; Conditions/, page);
    assert.match(html, /aria-label="Quick contact"/, page);
    const navigation = html.match(/<ul class="menu" id="primary-navigation">([\s\S]*?)<\/header>/)?.[1] || "";
    const labels = [...navigation.matchAll(/<a data-primary-link[^>]*>([^<]+)<\/a>/g)].map((match) => match[1].trim());
    assert.deepEqual(labels, expectedNavigation, page);
    assert.equal((navigation.match(/class="drop"/g) || []).length, 4, page);
    assert.doesNotMatch(navigation, /submenu-toggle/, page);
    assert.doesNotMatch(navigation, /nav-phone/, page);
  }
});

test("homepage follows the focused patient journey", async () => {
  const html = await readFile("dist/index.html", "utf8");
  const sections = ["home-services", "why-us", "dr-patel-home", "home-reviews", "visit"];
  let previous = html.indexOf('class="hero"');

  assert.ok(previous >= 0);
  for (const id of sections) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > previous, `${id} should follow the prior homepage section`);
    previous = position;
  }

  for (const removedDetail of ["techmodal", "offer-single", "ba-grid", "marquee-track"]) {
    assert.doesNotMatch(html, new RegExp(removedDetail), removedDetail);
  }
});

test("runtime keeps required accessible interactions", async () => {
  const script = await readFile("dist/main.js", "utf8");
  for (const behavior of ["aria-expanded", "aria-pressed", "aria-valuenow", "returnFocus", "reportValidity", "hashchange"]) {
    assert.match(script, new RegExp(behavior), behavior);
  }
  assert.doesNotMatch(script, /setInterval\(scan|\.innerHTML\s*=/);
});
