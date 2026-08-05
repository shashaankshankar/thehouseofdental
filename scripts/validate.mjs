import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(process.argv[2] || ".");
const files = (await readdir(root)).filter((name) => name.endsWith(".html"));
const errors = [];
for (const file of files) {
  const path = resolve(root, file);
  const html = await readFile(path, "utf8");
  for (const token of ["<title", 'name="viewport"', "<main", "<h1"]) {
    if (!html.includes(token)) errors.push(`${file}: missing ${token}`);
  }
  if (file !== "404.html" && !html.includes('rel="canonical"')) errors.push(`${file}: missing canonical URL`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${file}: duplicate id`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1].split("#")[0].split("?")[0];
    if (!ref || /^(?:https?:|tel:|mailto:|data:)/.test(ref)) continue;
    const target = resolve(dirname(path), ref);
    try { await access(target); } catch {
      if (!ref.startsWith("assets/team/")) errors.push(`${file}: missing local target ${ref}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${files.length} HTML pages.`);
