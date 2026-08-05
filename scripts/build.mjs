import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const source = "src";
const output = "dist";
const read = (path) => readFile(path, "utf8");
const escapeAttribute = (value = "") => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const site = JSON.parse(await read(join(source, "data/site.json")));
const reviews = JSON.parse(await read(join(source, "data/reviews.json")));
const financing = JSON.parse(await read(join(source, "data/financing.json")));
const templates = {
  full: {
    header: await read(join(source, "templates/header-full.html")),
    footer: await read(join(source, "templates/footer-full.html"))
  },
  minimal: {
    header: await read(join(source, "templates/header-minimal.html")),
    footer: await read(join(source, "templates/footer-minimal.html"))
  },
  none: { header: "", footer: "" }
};

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(source, "assets"), join(output, "assets"), { recursive: true });
await cp(join(source, "data/services.json"), join(output, "data/services.json"), { recursive: true });
await cp(join(source, "data/technology.json"), join(output, "data/technology.json"), { recursive: true });
for (const file of await readdir(join(source, "static"))) await cp(join(source, "static", file), join(output, file));

const styles = (await readdir(join(source, "styles"))).filter((file) => file.endsWith(".css")).sort();
const styleSources = await Promise.all(styles.map(async (file) => (await read(join(source, "styles", file))).trimEnd()));
await writeFile(join(output, "styles.css"), `${styleSources.join("\n\n")}\n`);
const scripts = (await readdir(join(source, "scripts"))).filter((file) => file.endsWith(".js")).sort();
const scriptSources = await Promise.all(scripts.map(async (file) => (await read(join(source, "scripts", file))).trimEnd()));
await writeFile(join(output, "main.js"), `${scriptSources.join("\n\n")}\n`);

const mobileActions = '<nav class="mobile-actions" aria-label="Quick contact"><a href="tel:+14076781400">Call</a><a href="contact.html#book">Request Appointment</a></nav>';
const escapeText = (value = "") => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const reviewCards = reviews.map((review) => `<div class="review-card rv ${review.delay}"><p class="stars">★★★★★</p><p>&ldquo;${escapeText(review.text)}&rdquo;</p><p class="who">${escapeText(review.author)}</p></div>`).join("");
const money = (value) => `$${Math.round(value).toLocaleString("en-US")}`;
const financingCalculator = `<div class="cherry-box rv"><p class="eyebrow u-inline-001">${escapeText(financing.provider)}</p><h3>${escapeText(financing.heading)}</h3><p class="cherry-sub">${escapeText(financing.description)}</p><div class="cherry-amount"><span id="chr-amt">${money(financing.initial)}</span></div><input type="range" id="chr-range" min="${financing.minimum}" max="${financing.maximum}" step="${financing.step}" value="${financing.initial}" aria-label="Estimated treatment cost"><div class="cherry-plans"><div class="cherry-plan"><span class="val" id="chr-bi">${money(financing.initial / 4)} <i>&times;4</i></span><span class="lbl">Every 2 Weeks*</span></div><div class="cherry-plan"><span class="val" id="chr-24">${money(financing.initial / 24)}<i>/mo</i></span><span class="lbl">24 Months</span></div><div class="cherry-plan"><span class="val" id="chr-60">${money(financing.initial / 60)}<i>/mo</i></span><span class="lbl">60 Months</span></div></div><a class="btn btn-solid" href="${escapeAttribute(financing.applyUrl)}" id="chr-apply" target="_blank" rel="noopener">Apply With Cherry</a><p class="cherry-note">${escapeText(financing.disclosure)}</p></div>`;
for (const [file, page] of Object.entries(site.pages)) {
  const content = (await read(join(source, "pages", file))).replace("{{REVIEWS}}", reviewCards).replace("{{FINANCING_CALCULATOR}}", financingCalculator);
  const shell = templates[page.shell];
  const canonical = page.canonical ? `<link rel="canonical" href="${escapeAttribute(page.canonical)}">` : "";
  const description = page.description ? `<meta name="description" content="${escapeAttribute(page.description)}">` : "";
  const social = page.canonical ? `<meta property="og:type" content="website"><meta property="og:site_name" content="${escapeAttribute(site.name)}"><meta property="og:title" content="${escapeAttribute(page.title)}"><meta property="og:description" content="${escapeAttribute(page.description)}"><meta property="og:url" content="${escapeAttribute(page.canonical)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escapeAttribute(page.title)}"><meta name="twitter:description" content="${escapeAttribute(page.description)}">` : "";
  const schema = page.shell === "full" ? `<script type="application/ld+json">${JSON.stringify(site.structuredData)}</script>` : "";
  const fonts = page.shell === "full" ? '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Jost:wght@300;400;500&family=Cormorant+Garamond:ital@1&display=swap" rel="stylesheet">' : "";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0a0a0b"><title>${page.title}</title>${description}<meta name="robots" content="${escapeAttribute(page.robots)}">${canonical}${social}<link rel="icon" href="assets/logo.svg" type="image/svg+xml">${schema}${fonts}<link rel="stylesheet" href="styles.css"></head><body><a class="skip-link" href="#main-content">Skip to main content</a>${shell.header}${content}${shell.footer}${mobileActions}<script src="main.js" defer></script></body></html>`;
  await writeFile(join(output, file), `${html}\n`);
}

const sitemapPages = Object.entries(site.pages).filter(([file, page]) => file !== "404.html" && page.canonical && !page.robots.includes("noindex"));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPages.map(([, page]) => `  <url><loc>${page.canonical}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(join(output, "sitemap.xml"), sitemap);
console.log(`Built ${Object.keys(site.pages).length} static pages in ${output}/.`);
