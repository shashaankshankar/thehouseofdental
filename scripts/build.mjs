import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { extname } from "node:path";

const output = "dist";
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of await readdir(".", { withFileTypes: true })) {
  if (entry.name.startsWith(".") || ["dist", "scripts", "tests", "node_modules"].includes(entry.name)) continue;
  if (entry.isDirectory() && entry.name !== "assets") continue;
  if (entry.isFile() && ![".html", ".css", ".js", ".xml", ".txt", ""].includes(extname(entry.name))) continue;
  await cp(entry.name, `${output}/${entry.name}`, { recursive: true });
}
console.log("Built the static site in dist/.");
