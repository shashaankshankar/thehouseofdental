import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const repo = resolve(process.cwd());
const errors = [];
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const read = (path) => readFile(join(repo, path), "utf8");
const readJson = async (path) => JSON.parse(await read(path));
const requireEqual = (actual, expected, label) => {
  if (actual !== expected) errors.push(`${label}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
};

for (const path of ["vercel.json", ".env.example", "api/google-reputation.js", "api/appointment.js", "dist/contact.html", "dist/_headers"]) {
  if (!(await exists(join(repo, path)))) errors.push(`missing required Vercel file ${path}`);
}

let config;
try {
  config = await readJson("vercel.json");
} catch (error) {
  errors.push(`vercel.json is not valid JSON: ${error.message}`);
}

if (config) {
  requireEqual(config.installCommand, "npm ci", "vercel.json installCommand");
  requireEqual(config.buildCommand, "npm run check", "vercel.json buildCommand");
  requireEqual(config.outputDirectory, "dist", "vercel.json outputDirectory");

  const expectedRedirects = new Map([
    ["/index.html", "/"],
    ["/home", "/"],
    ["/about-us", "/about.html"],
    ["/dental-services", "/services.html"],
    ["/new-patient", "/new-patients.html"],
    ["/contact-us", "/contact.html"]
  ]);
  const redirects = new Map((config.redirects || []).map((rule) => [rule.source, rule]));
  for (const [source, destination] of expectedRedirects) {
    const rule = redirects.get(source);
    if (!rule) errors.push(`vercel.json redirects: missing ${source}`);
    else {
      requireEqual(rule.destination, destination, `vercel.json redirect ${source}`);
      if (rule.permanent !== true) errors.push(`vercel.json redirect ${source}: must be permanent`);
    }
  }

  const globalHeaders = (config.headers || []).find((rule) => rule.source === "/(.*)");
  const headerMap = new Map((globalHeaders?.headers || []).map((header) => [header.key, header.value]));
  for (const key of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options"]) {
    if (!headerMap.has(key)) errors.push(`vercel.json headers: missing ${key}`);
  }
  const csp = headerMap.get("Content-Security-Policy") || "";
  if (!csp.includes("form-action 'self'")) errors.push("vercel.json CSP: missing same-origin form-action");
  if (!csp.includes("sha256-qA1xVLVZZkhsh2h8PEraeZsQhOHWWH9fm/J8tFPbbXg=")) errors.push("vercel.json CSP: missing Vercel Analytics bootstrap hash");
  for (const source of ["https://vercel.live", "https://vercel.com", "https://assets.vercel.com", "wss://ws-us3.pusher.com"]) {
    if (!csp.includes(source)) errors.push(`vercel.json CSP: missing Vercel Toolbar source ${source}`);
  }
  if (!/style-src[^;]*https:\/\/vercel\.live[^;]*'unsafe-inline'/.test(csp)) errors.push("vercel.json CSP: missing Vercel Toolbar inline-style allowance");
  if (/script-src[^;]*'unsafe-inline'/.test(csp)) errors.push("vercel.json CSP: script-src must not allow unsafe-inline");

  const functionConfig = config.functions?.["api/*.js"];
  if (!functionConfig) errors.push("vercel.json functions: missing api/*.js configuration");
  else requireEqual(functionConfig.maxDuration, 10, "vercel.json api/*.js maxDuration");
}

const envExample = await read(".env.example");
for (const key of ["GOOGLE_PLACE_ID", "GOOGLE_PLACES_API_KEY", "APPOINTMENT_BACKEND_URL", "APPOINTMENT_BACKEND_TOKEN", "APPOINTMENT_ALLOWED_ORIGINS"]) {
  if (!new RegExp(`^${key}=\\s*$`, "m").test(envExample)) errors.push(`.env.example: missing empty ${key} entry`);
}

const contact = await read("dist/contact.html");
if (!/<form[^>]+action="\/api\/appointment"[^>]+data-appointment-form/.test(contact)) errors.push("dist/contact.html: missing Vercel appointment action");
if (/data-netlify|name="form-name"/.test(contact)) errors.push("dist/contact.html: still contains Netlify form attributes");

const staticHeaders = await read("dist/_headers");
if (!staticHeaders.includes("sha256-qA1xVLVZZkhsh2h8PEraeZsQhOHWWH9fm/J8tFPbbXg=")) errors.push("dist/_headers: missing Vercel Analytics bootstrap hash");

for (const [path, marker] of [["api/google-reputation.js", "module.exports"], ["api/appointment.js", "module.exports"]]) {
  const source = await read(path);
  if (!source.includes(marker)) errors.push(`${path}: missing Vercel Node Function export`);
}
if (await exists(join(repo, "functions/api/google-reputation.js"))) errors.push("legacy Cloudflare Pages function still exists");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated Vercel build, routing, headers, Function entrypoints, form wiring, and server environment contract.");
