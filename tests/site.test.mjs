import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const pages = (await readdir(".")).filter((name) => name.endsWith(".html"));

test("site stays intentionally small", () => {
  assert.ok(pages.length >= 10 && pages.length <= 12, `expected 10–12 pages, found ${pages.length}`);
});

test("all pages have one primary heading and a main landmark", async () => {
  for (const page of pages) {
    const html = await readFile(page, "utf8");
    assert.equal((html.match(/<h1\b/g) || []).length, 1, page);
    assert.equal((html.match(/<main\b/g) || []).length, 1, page);
  }
});

test("appointment form fails closed", async () => {
  const html = await readFile("contact.html", "utf8");
  const script = await readFile("main.js", "utf8");
  assert.match(html, /Nothing has been sent/);
  assert.doesNotMatch(html, /data-netlify|action=/);
  assert.match(script, /preventDefault\(\)/);
});

test("stock image hosts are removed", async () => {
  for (const page of pages) assert.doesNotMatch(await readFile(page, "utf8"), /images\.unsplash\.com/, page);
});
