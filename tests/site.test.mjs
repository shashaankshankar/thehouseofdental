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

test("shared navigation and footer are generated consistently", async () => {
  const fullPages = ["index.html", "about.html", "contact.html", "facial-aesthetics.html", "new-patients.html", "pre-post-op.html", "reviews.html", "services.html"];
  for (const page of fullPages) {
    const html = await readFile(`dist/${page}`, "utf8");
    assert.match(html, /id="primary-navigation"/, page);
    assert.match(html, /Terms &amp; Conditions/, page);
    assert.match(html, /aria-label="Quick contact"/, page);
  }
});

test("runtime keeps required accessible interactions", async () => {
  const script = await readFile("dist/main.js", "utf8");
  for (const behavior of ["aria-expanded", "aria-pressed", "aria-valuenow", "returnFocus", "reportValidity", "hashchange"]) {
    assert.match(script, new RegExp(behavior), behavior);
  }
  assert.doesNotMatch(script, /setInterval\(scan|\.innerHTML\s*=/);
});
