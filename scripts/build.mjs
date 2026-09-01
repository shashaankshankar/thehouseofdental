import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const source = "src";
const output = "dist";
const read = (path) => readFile(path, "utf8");
const escapeAttribute = (value = "") => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const site = JSON.parse(await read(join(source, "data/site.json")));
const canonicalFor = (page) => page.path ? new URL(page.path, `${site.baseUrl}/`).toString() : "";
const reviews = JSON.parse(await read(join(source, "data/reviews.json")));
const financing = JSON.parse(await read(join(source, "data/financing.json")));
const services = JSON.parse(await read(join(source, "data/services.json")));
const technology = JSON.parse(await read(join(source, "data/technology.json")));
const blog = JSON.parse(await read(join(source, "data/blog.json")));
const siteMeasurement = JSON.parse(await read("measurement/site.json"));
const routeEligibility = JSON.parse(await read("measurement/eligibility/routes.json"));
const contract = JSON.parse(await read("measurement/contracts/local_service_v1/contract.json"));
const contractEvents = JSON.parse(await read("measurement/contracts/local_service_v1/events.json"));
const contractParameters = JSON.parse(await read("measurement/contracts/local_service_v1/parameters.json"));
const analytics = {
  provider: siteMeasurement.ga4.provider,
  enabled: siteMeasurement.ga4.enabled,
  measurementId: siteMeasurement.ga4.measurementId,
  consent: siteMeasurement.consent,
  contractVersion: contract.version,
  routeEligibility,
  eventPolicy: {
    allowedEvents: contractEvents.events.map((event) => event.name),
    allowedLocations: contractParameters.allowed.cta_location,
    allowedCtaTypes: contractParameters.allowed.cta_type,
    allowedServiceCategories: contractParameters.allowed.service_category
  }
};
const reputation = site.reputation ?? {
  endpoint: "/api/google-reputation",
  fallback: { rating: 5.0, review_count: 332 }
};
const structuredData = JSON.parse(JSON.stringify(site.structuredData));
if (structuredData.aggregateRating && reputation.fallback) {
  structuredData.aggregateRating.ratingValue = Number(reputation.fallback.rating).toFixed(1);
  structuredData.aggregateRating.reviewCount = String(reputation.fallback.review_count);
}
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
const decorateAnalyticsAttributes = (markup) => markup
  .replaceAll('href="tel:', 'data-analytics-event="phone_click" data-analytics-location="phone_link" href="tel:')
  .replaceAll('href="mailto:', 'data-analytics-event="email_click" data-analytics-location="email_link" href="mailto:')
  .replaceAll('href="/contact#book"', 'data-analytics-event="cta_click" data-analytics-location="appointment_link" data-analytics-cta-type="appointment" href="/contact#book"')
  .replaceAll('href="https://goo.gl/maps', 'data-analytics-event="cta_click" data-analytics-location="directions_link" data-analytics-cta-type="directions" href="https://goo.gl/maps');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(source, "assets"), join(output, "assets"), { recursive: true });
for (const file of await readdir(join(source, "static"))) await cp(join(source, "static", file), join(output, file));

const styles = (await readdir(join(source, "styles"))).filter((file) => file.endsWith(".css")).sort();
const styleSources = await Promise.all(styles.map(async (file) => (await read(join(source, "styles", file))).trimEnd()));
await writeFile(join(output, "styles.css"), `${styleSources.join("\n\n")}\n`);
const scripts = (await readdir(join(source, "scripts"))).filter((file) => file.endsWith(".js")).sort();
const scriptSources = await Promise.all(scripts.map(async (file) => (await read(join(source, "scripts", file))).trimEnd()));
await writeFile(join(output, "main.js"), `const __SITE_DETAIL_DATA = ${JSON.stringify({ services, technology })};\nconst __SITE_ANALYTICS = ${JSON.stringify(analytics)};\nconst __SITE_REPUTATION = ${JSON.stringify(reputation)};\n\n${scriptSources.join("\n\n")}\n`);

const mobileActions = decorateAnalyticsAttributes('<nav class="mobile-actions" aria-label="Quick contact"><a href="tel:+14076781400">Call</a><a href="/contact#book">Book Appointment</a></nav>');
const escapeText = (value = "") => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const decodeEntities = (value = "") => value
  .replaceAll("&amp;", "&")
  .replaceAll("&mdash;", "—")
  .replaceAll("&ndash;", "–")
  .replaceAll("&times;", "×")
  .replaceAll("&reg;", "®");
const reorderCareSections = (content) => {
  const firstDivider = content.indexOf('<section class="care-divider">');
  const finalSection = content.indexOf('<section class="sec sec-noir">', firstDivider);
  if (firstDivider < 0 || finalSection < 0) return content;
  const careArea = content.slice(firstDivider, finalSection);
  const sections = new Map([...careArea.matchAll(/<section class="sec sec-ivory care-block" id="([^"]+)">[\s\S]*?<\/section>/g)].map((match) => [match[1], match[0]]));
  const facial = ["deka-co2", "microneedling", "emage-scan", "hydroderm"];
  const dental = ["implants", "crowns", "dentures", "root-canals", "veneers", "extractions", "sedation", "srp", "quietnite"];
  const divider = (label) => `<section class="care-divider"><div class="wrap"><span>${label}</span></div></section>`;
  const ordered = [divider("Facial Aesthetics"), ...facial.map((id) => sections.get(id)), divider("Dental Procedures"), ...dental.map((id) => sections.get(id))].filter(Boolean).join("\n\n");
  return `${content.slice(0, firstDivider)}${ordered}\n${content.slice(finalSection)}`;
};
const alignCareCopy = (content) => {
  const replacements = [
    ["QuietNite Sleep Appliance", "QuietNite Sleep"],
    ["Eat a normal meal before your appointment unless you're receiving IV sedation — if sedated, follow the fasting instructions given to you and arrange for someone to drive you home.", "Eat a normal meal before your appointment."],
    ["Bite firmly on gauze for 30–45 minutes at a time. ", ""],
    ["After 24 hours, switch to moist heat.", "After 48 hours, switch to moist heat."],
    ["Starting the day after, rinse with warm salt water (one teaspoon in eight ounces) two to three times daily.", "Starting the day after, rinse with warm salt water (one teaspoon in eight ounces) two to three times daily. Use a wet Q-tip to lightly roll over an implant site to keep it clean and plaque free."],
    ["Do not spit, rinse vigorously, smoke, or use a straw for the first 24 hours.", "Do not spit, rinse vigorously, smoke, or use a straw for the first week."],
    ["Soft, cool foods for the first day. Avoid hot liquids and chewing near the site. Return to a normal diet as comfort allows.", "Soft, cool foods for the first week. Avoid hot liquids and chewing near the site. For the first week, also avoid all spicy foods and anything crunchy, and do not sip through a straw when drinking. Return to a normal diet as comfort allows."],
    ["Avoid sticky and hard foods — gum, taffy, hard candy, crusty bread. When flossing, slide the floss out sideways rather than pulling up, so you don't dislodge it.", "Avoid sticky and hard foods — gum, taffy, hard candy, crusty bread. When flossing, slide the floss out sideways rather than pulling up, so you don't dislodge it. If you have a connected temporary crown, use Closys or StellaLife mouthwash, available on Amazon."],
    ["<div class=\"care-row rv\"><span class=\"care-label\">If It Comes Off</span>", "<div class=\"care-row rv\"><span class=\"care-label\">Front Teeth</span><p>Do not bite directly into anything hard with your front teeth — corn on the cob, whole apples, pears, and similar foods. Cut them into pieces and chew with your back teeth instead.</p></div><div class=\"care-row rv\"><span class=\"care-label\">If It Comes Off</span>"],
    ["Rinse two to three times daily with a quarter teaspoon of salt (and optionally a quarter teaspoon of baking soda) in a cup of warm water. Rinse as often as you find it soothing.", "Rinse two or three times daily with 1 teaspoon of salt in 8 oz of warm water. Rinse as often as you find it soothing."],
    ["Temporaries are far less sturdy than the final restorations. Avoid chewy, sticky, and hard foods entirely while they're in.", "Temporaries are far less sturdy than the final restorations. Do not bite with your front teeth. Avoid chewy, sticky, and hard foods entirely while they're in."],
    ["Brush gently. When flossing, pull the floss out to the side rather than up, so you don't lift the temporary off.", "You will not be able to floss. It is recommended to rinse twice daily with Closys or StellaLife mouthwash, which can be found on Amazon."],
    ["<li>Do not eat or drink for the period we specify before your appointment — typically six to eight hours for oral or IV sedation.</li><li>Arrange for a responsible adult to drive you both ways and stay with you afterward.</li>", "<li>Eat a small meal so there is something in your stomach for oral sedation.</li><li>You must have a driver to and from the appointment who is able to stay for the duration of the visit if needed.</li><li>Arrange for a responsible adult to drive you both ways and stay with you afterward.</li>"],
    ["Stop retinoids, glycolic acid, and other exfoliating products one week prior.", "Stop all active ingredients in all skincare products one week prior to your appointment.</li><li>Bring a list of all active ingredients that you are currently applying to your skin."],
    ["Beginning the morning after treatment, gently cleanse", "Beginning day two, gently cleanse"],
    ["Always wash your hands first. No scrubbing, no washcloths, no exfoliants.", "Always wash your hands first. Pat face dry with a clean disposable facial towel. No scrubbing, no washcloths, no exfoliants."],
    ["Stop retinol and Vitamin A products for one week prior.", "Stop all active skincare ingredients — retinol, salicylic acid, benzoyl peroxide, glycolic acid, and similar — for one week prior."],
    ["Sleep on a clean pillowcase — the goal is keeping the skin free of anything that could settle into the micro-channels.", "Sleep on a clean pillowcase — the goal is keeping the skin free of anything that could settle into the micro-channels. Keep face moist with any thermal water face mist."],
    ["including retinol and Vitamin A — only once", "including retinol and other active ingredients — only once"]
  ];
  return replacements.reduce((value, [from, to]) => value.replaceAll(from, to), content);
};
const reviewCards = reviews.map((review) => `<div class="review-card rv ${review.delay}"><p class="stars">★★★★★</p><p>&ldquo;${escapeText(review.text)}&rdquo;</p><p class="who">${escapeText(review.author)}</p></div>`).join("");
const money = (value) => `$${Math.round(value).toLocaleString("en-US")}`;
const financingCalculator = `<div class="cherry-box rv"><p class="eyebrow u-inline-001">${escapeText(financing.provider)}</p><h3>${escapeText(financing.heading)}</h3><p class="cherry-sub">${escapeText(financing.description)}</p><div class="cherry-amount"><span id="chr-amt">${money(financing.initial)}</span></div><input type="range" id="chr-range" min="${financing.minimum}" max="${financing.maximum}" step="${financing.step}" value="${financing.initial}" aria-label="Estimated treatment cost"><div class="cherry-plans"><div class="cherry-plan"><span class="val" id="chr-bi">${money(financing.initial / 4)} <i>&times;4</i></span><span class="lbl">Every 2 Weeks*</span></div><div class="cherry-plan"><span class="val" id="chr-24">${money(financing.initial / 24)}<i>/mo</i></span><span class="lbl">24 Months</span></div><div class="cherry-plan"><span class="val" id="chr-60">${money(financing.initial / 60)}<i>/mo</i></span><span class="lbl">60 Months</span></div></div><a class="btn btn-solid" href="${escapeAttribute(financing.applyUrl)}" id="chr-apply" target="_blank" rel="noopener">Apply With Cherry</a><p class="cherry-note">${escapeText(financing.disclosure)}</p></div>`;
const blogArticlePath = (article) => `/blog/${article.slug}`;
const blogArticleFile = (article) => `blog/${article.slug}.html`;
const blogImagePath = (article, size) => `/assets/blog/${article.slug}-${size}.jpg`;
const absoluteUrl = (path) => new URL(path, `${site.baseUrl}/`).toString();
const articleWordCount = (article) => article.sections.reduce((count, section) => count + section.paragraphs.join(" ").split(/\s+/).filter(Boolean).length, 0);
const readingMinutes = (article) => Math.max(1, Math.ceil(articleWordCount(article) / 220));
const formattedDate = (date) => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const articleBySlug = new Map(blog.articles.map((article) => [article.slug, article]));
const renderBlogCard = (article, index = 1) => `<article class="blog-card"><a class="blog-card-media" href="${blogArticlePath(article)}"><img src="${blogImagePath(article, "card")}" width="720" height="480" alt="${escapeAttribute(article.imageAlt)}" decoding="async"${index === 0 ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"'}></a><div class="blog-card-body"><div class="blog-card-meta"><span>${escapeText(article.category)}</span><span>${readingMinutes(article)} min read</span></div><h2><a href="${blogArticlePath(article)}">${escapeText(article.title)}</a></h2><p>${escapeText(article.description)}</p><span class="blog-read" aria-hidden="true">Read article</span></div></article>`;
const blogCards = blog.articles.map(renderBlogCard).join("\n");
const organization = { "@type": "Organization", name: site.name, url: site.baseUrl, logo: absoluteUrl("/assets/logo.svg") };
const collectionSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "CollectionPage", name: site.pages["blog.html"].title, description: site.pages["blog.html"].description, url: absoluteUrl("/blog"), publisher: organization },
    { "@type": "ItemList", itemListElement: blog.articles.map((article, index) => ({ "@type": "ListItem", position: index + 1, name: article.title, url: absoluteUrl(blogArticlePath(article)) })) }
  ]
};
const articleSchema = (article) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      headline: article.title,
      description: article.description,
      image: absoluteUrl(blogImagePath(article, "hero")),
      datePublished: blog.publishedAt,
      dateModified: blog.publishedAt,
      author: organization,
      publisher: organization,
      mainEntityOfPage: absoluteUrl(blogArticlePath(article)),
      articleSection: article.category,
      wordCount: articleWordCount(article)
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
        { "@type": "ListItem", position: 3, name: article.title, item: absoluteUrl(blogArticlePath(article)) }
      ]
    }
  ]
});
const renderDocument = (page, content, options = {}) => {
  const shell = {
    header: decorateAnalyticsAttributes(templates[page.shell].header),
    footer: decorateAnalyticsAttributes(templates[page.shell].footer)
  };
  const canonicalUrl = canonicalFor(page);
  const canonical = canonicalUrl ? `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}">` : "";
  const description = page.description ? `<meta name="description" content="${escapeAttribute(page.description)}">` : "";
  const keywords = page.keywords ? `<meta name="keywords" content="${escapeAttribute(page.keywords)}">` : "";
  const geo = page.geoPlacename ? `<meta name="geo.region" content="US-FL"><meta name="geo.placename" content="${escapeAttribute(page.geoPlacename)}">` : "";
  const socialTitle = page.socialTitle || page.title;
  const socialDescription = page.socialDescription || page.description;
  const socialImage = options.socialImage ? `<meta property="og:image" content="${escapeAttribute(options.socialImage)}"><meta property="og:image:width" content="1440"><meta property="og:image:height" content="960"><meta property="og:image:alt" content="${escapeAttribute(options.socialImageAlt || "")}"><meta name="twitter:image" content="${escapeAttribute(options.socialImage)}">` : "";
  const articleSocial = options.publishedAt ? `<meta property="article:published_time" content="${escapeAttribute(options.publishedAt)}"><meta property="article:modified_time" content="${escapeAttribute(options.modifiedAt || options.publishedAt)}"><meta property="article:section" content="${escapeAttribute(options.articleSection || "")}">` : "";
  const social = canonicalUrl ? `<meta property="og:title" content="${escapeAttribute(socialTitle)}"><meta property="og:description" content="${escapeAttribute(socialDescription)}"><meta property="og:type" content="${escapeAttribute(options.socialType || "website")}"><meta property="og:site_name" content="${escapeAttribute(site.name)}"><meta property="og:locale" content="en_US"><meta property="og:url" content="${escapeAttribute(canonicalUrl)}">${socialImage}${articleSocial}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeAttribute(socialTitle)}"><meta name="twitter:description" content="${escapeAttribute(socialDescription)}">` : "";
  const author = page.author ? `<meta name="author" content="${escapeAttribute(page.author)}">` : "";
  const schemaData = options.schemaData ?? (page.schema === false ? null : page.shell === "full" ? structuredData : null);
  const schema = schemaData ? `<script type="application/ld+json">${JSON.stringify(schemaData)}</script>` : "";
  const fonts = page.shell === "full" ? '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Jost:wght@300;400;500&family=Cormorant+Garamond:ital@1&display=swap" rel="stylesheet">' : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0a0a0b"><title>${escapeText(page.title)}</title>${keywords}${social}${geo}${description}<meta name="robots" content="${escapeAttribute(page.robots)}">${canonical}${author}${schema}${fonts}<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16"><link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"><link rel="stylesheet" href="/styles.css"></head><body><a class="skip-link" href="#main-content">Skip to main content</a>${shell.header}${content}${shell.footer}${mobileActions}<script src="/main.js" defer></script></body></html>`;
};
for (const [file, page] of Object.entries(site.pages)) {
  let content = (await read(join(source, "pages", file))).replace("{{REVIEWS}}", reviewCards).replace("{{FINANCING_CALCULATOR}}", financingCalculator).replace("{{BLOG_CARDS}}", blogCards);
  if (file === "pre-post-op.html") content = alignCareCopy(reorderCareSections(content));
  content = decorateAnalyticsAttributes(content);
  const html = renderDocument(page, content, { schemaData: page.schemaType === "blog-index" ? collectionSchema : undefined });
  await writeFile(join(output, file), `${html}\n`);
}

await mkdir(join(output, "blog"), { recursive: true });
const articlePages = blog.articles.map((article) => {
  const page = {
    path: blogArticlePath(article),
    title: `${article.title} | The House of Dental`,
    description: article.description,
    socialTitle: article.title,
    socialDescription: article.description,
    author: site.name,
    robots: "index, follow, max-image-preview:large",
    shell: "full",
    changefreq: "monthly",
    priority: "0.7",
    lastmod: blog.publishedAt
  };
  const relatedCards = article.related.map((slug, index) => renderBlogCard(articleBySlug.get(slug), index + 1)).join("\n");
  const sections = article.sections.map((section) => `<section><h2>${escapeText(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}</section>`).join("\n");
  const sources = article.sources.map((sourceItem) => `<li><a href="${escapeAttribute(sourceItem.url)}" target="_blank" rel="noopener noreferrer">${escapeText(sourceItem.label)}</a></li>`).join("");
  const content = decorateAnalyticsAttributes(`<main id="main-content">
  <article>
    <header class="page-hero sec-noir article-hero">
      <div class="wrap">
        <p class="crumb"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span>${escapeText(article.category)}</p>
        <p class="eyebrow u-inline-001">${escapeText(article.category)}</p>
        <h1>${escapeText(article.title)}</h1>
        <p class="article-dek">${escapeText(article.description)}</p>
        <div class="article-meta"><span>${formattedDate(blog.publishedAt)}</span><span>${readingMinutes(article)} min read</span><span>Published by ${escapeText(site.name)}</span></div>
      </div>
    </header>
    <div class="sec sec-ivory article-shell">
      <figure class="article-figure"><img src="${blogImagePath(article, "hero")}" width="1440" height="960" alt="${escapeAttribute(article.imageAlt)}" loading="eager" fetchpriority="high" decoding="async"></figure>
      <div class="wrap article-layout">
        <div class="article-body">
          ${sections}
          <section class="article-sources" aria-labelledby="sources-heading"><h2 id="sources-heading">Sources and further reading</h2><ol>${sources}</ol></section>
          <p class="article-disclaimer"><strong>Editorial note:</strong> ${escapeText(blog.disclaimer)}</p>
        </div>
        <aside class="article-aside" aria-label="Related care"><h2>Related care</h2><p>Read about the service connected to this topic.</p><a href="${escapeAttribute(article.serviceHref)}">${escapeText(article.serviceLabel)}</a></aside>
      </div>
    </div>
  </article>
  <section class="sec sec-ivory article-related" aria-labelledby="related-heading"><div class="wrap"><div class="center-head"><p class="eyebrow">Keep reading</p><h2 id="related-heading">Related Articles</h2></div><div class="blog-grid">${relatedCards}</div></div></section>
</main>`);
  const html = renderDocument(page, content, {
    schemaData: articleSchema(article),
    socialType: "article",
    socialImage: absoluteUrl(blogImagePath(article, "hero")),
    socialImageAlt: article.imageAlt,
    publishedAt: blog.publishedAt,
    modifiedAt: blog.publishedAt,
    articleSection: article.category
  });
  return { file: blogArticleFile(article), page, html };
});
for (const articlePage of articlePages) await writeFile(join(output, articlePage.file), `${articlePage.html}\n`);

const allPages = [...Object.entries(site.pages).map(([file, page]) => ({ file, page })), ...articlePages.map(({ file, page }) => ({ file, page }))];
const sitemapPages = allPages.filter(({ page }) => page.path && page.sitemap !== false && !page.robots.includes("noindex"));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPages.map(({ page }) => `  <url><loc>${canonicalFor(page)}</loc>${page.lastmod || page.path === "/blog" ? `<lastmod>${page.lastmod || blog.publishedAt}</lastmod>` : ""}<changefreq>${page.changefreq || "monthly"}</changefreq><priority>${page.priority || "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`;
await writeFile(join(output, "sitemap.xml"), sitemap);
const pageRedirects = allPages.filter(({ page }) => page.path).map(({ file, page }) => `/${file} ${page.path} 301`);
const aliasRedirects = Object.entries(site.redirects || {}).map(([from, to]) => `${from} ${to} 301`);
await writeFile(join(output, "_redirects"), `# Generated from src/data/site.json clean paths and legacy aliases.\n${[...pageRedirects, ...aliasRedirects].join("\n")}\n`);
console.log(`Built ${allPages.length} static pages in ${output}/.`);
