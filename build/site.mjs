#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(projectRoot, "the-house-of-dental-site");
const outputDir = path.resolve(projectRoot, process.env.SITE_OUTPUT || "dist");
const configDir = path.join(siteRoot, "config");
const templateDir = path.join(siteRoot, "templates");

const readText = (filePath) => fs.readFileSync(filePath, "utf8");
const readJson = (filePath) => JSON.parse(readText(filePath));
const config = readJson(path.join(configDir, "site.json"));
const routes = readJson(path.join(configDir, "routes.json"));
const technologyData = readJson(path.join(siteRoot, "data", "technology.json"));
const serviceData = readJson(path.join(siteRoot, "data", "services.json"));
const servicePages = readJson(path.join(siteRoot, "data", "service-pages.json"));
const acquisitionData = readJson(path.join(siteRoot, "data", "acquisition.json"));
const measurementData = readJson(path.join(siteRoot, "data", "measurement.json"));
const campaignPageData = readJson(path.join(siteRoot, "data", "campaign-pages.json"));
const careGuidesData = readJson(path.join(siteRoot, "data", "care-guides.json"));
const redirects = readJson(path.join(configDir, "redirects.json"));
const layout = readText(path.join(templateDir, "layout.html"));
const headerTemplate = readText(path.join(templateDir, "header.html"));
const footerTemplate = readText(path.join(templateDir, "footer.html"));
const breadcrumbTemplate = readText(path.join(templateDir, "breadcrumb.html"));
const stickyActionsTemplate = readText(path.join(templateDir, "sticky-actions.html"));
const campaignPageTemplate = readText(path.join(templateDir, "campaign-page.html"));

const fail = (message) => {
  throw new Error(message);
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const htmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const resolveRegistryText = (value) => String(value)
  .replaceAll("{{BRAND_NAME}}", config.brand.name)
  .replaceAll("{{PHONE_DISPLAY}}", config.contact.phone.display);

const xmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const minifyCss = (value) => value
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{}:;,>])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();

const canonicalBase = String(config.canonical?.baseUrl || "").replace(/\/+$/, "");
assert(canonicalBase, "config/site.json must provide canonical.baseUrl");
assert(config.canonical?.status, "config/site.json must document canonical.baseUrl status");
assert(config.brand?.name, "config/site.json must provide brand.name");
assert(config.brand?.alternateName, "config/site.json must provide brand.alternateName");
assert(config.contact?.phone?.display && config.contact?.phone?.tel, "config/site.json must provide contact.phone display and tel values");
assert(config.contact?.address?.street && config.contact?.address?.locality && config.contact?.address?.region && config.contact?.address?.postalCode, "config/site.json must provide the complete address");
assert(config.contact?.hours?.status, "config/site.json must document contact.hours status");
assert(Array.isArray(config.contact?.hours?.rows) && config.contact.hours.rows.length > 0, "config/site.json must provide contact.hours.rows");
assert(config.socialImage?.path && config.socialImage?.alt, "config/site.json must provide socialImage.path and socialImage.alt");
assert(config.reviewSource?.status, "config/site.json must document reviewSource status");
assert(config.analytics?.status, "config/site.json must document analytics status");
assert(config.appointmentUrl?.path && config.appointmentUrl?.status, "config/site.json must document appointmentUrl path and status");
assert(config.integrations?.appointmentForm?.status, "config/site.json must document appointment form integration status");
assert(Object.prototype.hasOwnProperty.call(config.integrations.appointmentForm, "handlerUrl"), "config/site.json must declare appointmentForm.handlerUrl, including null when unconfigured");
assert(config.integrations?.measurement?.dataLayer?.status, "config/site.json must document measurement data-layer status");
assert(Object.prototype.hasOwnProperty.call(config.integrations.measurement.dataLayer, "enabled"), "config/site.json must declare measurement dataLayer.enabled");
assert(config.integrations.measurement.ga4?.status, "config/site.json must document GA4 status");
assert(config.integrations.measurement.tagManager?.status, "config/site.json must document tag-manager status");
assert(config.integrations.measurement.callTracking?.status, "config/site.json must document call-tracking status");
assert(config.integrations.measurement.crmAttribution?.status, "config/site.json must document CRM attribution status");
assert(config.integrations.measurement.consent?.status, "config/site.json must document consent status");
assert(measurementData.version && Array.isArray(measurementData.conversionEvents), "data/measurement.json must declare the Phase 9 event contract");
assert(Array.isArray(measurementData.allowedFields) && measurementData.allowedFields.includes("state"), "data/measurement.json must declare approved event fields");
assert(campaignPageData.status && campaignPageData.campaigns, "data/campaign-pages.json must declare campaign records and status");
assert(Array.isArray(careGuidesData.guides) && careGuidesData.guides.length > 0, "data/care-guides.json must provide public care guides");
assert(careGuidesData.status, "data/care-guides.json must declare a content-system status");
assert(Array.isArray(acquisitionData.serviceGroups) && acquisitionData.serviceGroups.length > 0, "data/acquisition.json must declare the recommended service groups");

const careGuideById = new Map();
for (const guide of careGuidesData.guides) {
  assert(guide.id && !careGuideById.has(guide.id), `Care guide data contains duplicate id: ${guide.id || "(empty)"}`);
  assert(guide.title && guide.category && guide.pdf, `Care guide ${guide.id || "(unknown)"} is missing title, category, or pdf`);
  assert(Object.prototype.hasOwnProperty.call(guide, "lastReviewed"), `Care guide ${guide.id} must declare lastReviewed, including null`);
  assert(Object.prototype.hasOwnProperty.call(guide, "clinicalOwner"), `Care guide ${guide.id} must declare clinicalOwner, including null`);
  assert(guide.approvalStatus, `Care guide ${guide.id} must declare approvalStatus`);
  const pdfPath = path.resolve(siteRoot, guide.pdf);
  assert(pdfPath.startsWith(`${siteRoot}${path.sep}`) && fs.existsSync(pdfPath), `Care guide ${guide.id} references a missing local PDF: ${guide.pdf}`);
  careGuideById.set(guide.id, guide);
}
for (const held of careGuidesData.heldDownloads || []) {
  assert(held.id && held.path && held.approvalStatus, `Held care download is missing id, path, or approvalStatus`);
  assert(fs.existsSync(path.join(siteRoot, held.path)), `Held care download is missing from quarantine: ${held.path}`);
  assert(Object.prototype.hasOwnProperty.call(held, "lastReviewed"), `Held care download ${held.id} must declare lastReviewed, including null`);
  assert(Object.prototype.hasOwnProperty.call(held, "clinicalOwner"), `Held care download ${held.id} must declare clinicalOwner, including null`);
}

const routeById = new Map();
const routeByPath = new Map();
for (const route of routes) {
  assert(route.id && !routeById.has(route.id), `Route registry contains duplicate id: ${route.id || "(empty)"}`);
  assert(route.output && !routeByPath.has(route.output), `Route registry contains duplicate output: ${route.output || "(empty)"}`);
  assert(route.canonicalPath && route.title && route.description && route.h1, `Route ${route.id || "(unknown)"} is missing title, description, h1, or canonicalPath`);
  assert(typeof route.indexable === "boolean", `Route ${route.id} must declare indexable true or false`);
  assert(Array.isArray(route.breadcrumb), `Route ${route.id} must declare breadcrumb as an array`);
  assert(route.approvalStatus, `Route ${route.id} must declare approvalStatus`);
  routeById.set(route.id, route);
  routeByPath.set(route.canonicalPath, route);
  if (route.pageType === "service" && route.enabled) {
    assert(route.serviceName && route.serviceType && route.servicePage, `Service route ${route.id} must declare serviceName, serviceType, and servicePage`);
    assert(servicePages[route.servicePage], `Service route ${route.id} is missing data/service-pages.json entry: ${route.servicePage}`);
  }
  if (route.campaignPage) {
    assert(route.campaignPage && campaignPageData.campaigns[route.campaignPage], `Campaign route ${route.id} is missing data/campaign-pages.json entry`);
    const campaign = campaignPageData.campaigns[route.campaignPage];
    assert(campaign.landingPageId && campaign.intent && campaign.trafficSource && campaign.searchIntent, `Campaign ${route.id} is missing audience/source intent metadata`);
    assert(campaign.approvalGate && campaign.status && Object.prototype.hasOwnProperty.call(campaign, "canonicalTargetId"), `Campaign ${route.id} is missing approval or canonicalization metadata`);
    assert(campaignPageData.campaigns[route.campaignPage].thankYouRouteId === null || routeById.has(campaignPageData.campaigns[route.campaignPage].thankYouRouteId) || routes.some((candidate) => candidate.id === campaignPageData.campaigns[route.campaignPage].thankYouRouteId), `Campaign ${route.id} has an unknown thank-you route`);
  }
}

for (const route of routes) {
  if (!route.canonicalTargetId) continue;
  const target = routeById.get(route.canonicalTargetId);
  assert(target, `Route ${route.id} points to an unknown canonical target: ${route.canonicalTargetId}`);
  assert(target.id !== route.id, `Route ${route.id} cannot canonicalize to itself through canonicalTargetId`);
  assert(target.enabled && target.indexable, `Route ${route.id} must canonicalize only to an enabled indexable route`);
}

const redirectBySource = new Map();
for (const redirect of redirects) {
  assert(redirect.source && redirect.destination, "Each redirect must provide source and destination paths");
  assert(redirect.status === 301, `Redirect ${redirect.source} must use a single-hop 301`);
  assert(!redirectBySource.has(redirect.source), `Redirect registry contains duplicate source: ${redirect.source}`);
  assert(redirect.destination !== "/" && redirect.destination !== "/index.html", `Redirect ${redirect.source} cannot point to the homepage`);
  redirectBySource.set(redirect.source, redirect);
}

const appointmentParts = String(config.appointmentUrl.path).split("#");
const appointmentTargetPath = appointmentParts[0] || "/";
const appointmentHash = appointmentParts[1] ? `#${appointmentParts[1]}` : "";
const appointmentTarget = routeByPath.get(appointmentTargetPath);
assert(appointmentTarget || /^https?:\/\//i.test(appointmentTargetPath), `Configured appointment URL does not match a registered route: ${config.appointmentUrl.path}`);

const enabledRoutes = routes.filter((route) => route.enabled);
assert(enabledRoutes.length > 0, "Route registry has no enabled routes");
for (const route of enabledRoutes) {
  assert(route.source, `Enabled route ${route.id} must have a source content fragment`);
  assert(fs.existsSync(path.join(siteRoot, route.source)), `Missing source content for enabled route ${route.id}: ${route.source}`);
}

const outputRelative = (target) => path.relative(projectRoot, target) || ".";
const toPosix = (value) => value.split(path.sep).join(path.posix.sep);
const outputDirectoryFor = (route) => path.posix.dirname(toPosix(route.output));
const relativeOutputHref = (fromOutput, toOutput) => {
  const fromDir = path.posix.dirname(toPosix(fromOutput));
  const target = toPosix(toOutput);
  const relative = path.posix.relative(fromDir, target);
  return relative || path.posix.basename(target);
};
const staticHref = (route, relativePath) => {
  const relative = path.posix.relative(outputDirectoryFor(route), relativePath);
  return relative || path.posix.basename(relativePath);
};
const assetHref = (route, relativePath) => route.id === "404"
  ? `/${toPosix(relativePath)}`
  : staticHref(route, relativePath);
const routeHref = (fromRoute, targetId, suffix = "") => {
  const target = routeById.get(targetId);
  assert(target, `Template references unknown route id: ${targetId}`);
  const href = fromRoute.id === "404"
    ? `/${toPosix(target.output)}`
    : relativeOutputHref(fromRoute.output, target.output);
  return `${href}${suffix}`;
};

const appointmentHref = (route) => {
  if (/^https?:\/\//i.test(appointmentTargetPath)) return `${appointmentTargetPath}${appointmentHash}`;
  const href = route.id === "404"
    ? `/${toPosix(appointmentTarget.output)}`
    : relativeOutputHref(route.output, appointmentTarget.output);
  return `${href}${appointmentHash}`;
};

const validateAcquisitionRoute = (item, label) => {
  assert(item.routeId, `${label} is missing routeId`);
  const target = routeById.get(item.routeId);
  assert(target, `${label} points to unknown route: ${item.routeId}`);
  if (item.enabled !== false) {
    assert(target.enabled, `${label} points to a disabled route: ${item.routeId}`);
    assert(target.pageType !== "draft", `${label} cannot publish a draft route: ${item.routeId}`);
  }
  return target;
};

for (const item of acquisitionData.featuredServices || []) validateAcquisitionRoute(item, `Featured service ${item.routeId || "(unknown)"}`);
for (const item of acquisitionData.goalPaths || []) validateAcquisitionRoute(item, `Goal path ${item.id || "(unknown)"}`);
for (const item of acquisitionData.navigation?.topLevel || []) validateAcquisitionRoute(item, `Top-level navigation ${item.label || "(unknown)"}`);
for (const group of ["newPatients", "resources", "about"]) {
  for (const item of acquisitionData.navigation?.[group] || []) validateAcquisitionRoute(item, `Navigation item ${group}/${item.label || "(unknown)"}`);
}

const publicItems = (items = []) => items.filter((item) => item.enabled !== false);
const acquisitionHref = (route, item) => routeHref(route, item.routeId, item.suffix || "");
const revealDelay = (index) => index % 4 === 0 ? "" : ` rv-d${(index % 4)}`;

const renderFeaturedServiceCards = (route) => publicItems(acquisitionData.featuredServices)
  .map((item, index) => `<a class="featured-service-card rv${revealDelay(index)}" href="${htmlEscape(acquisitionHref(route, item))}" data-acquisition-path="featured">
  <span class="service-card-number">${String(index + 1).padStart(2, "0")}</span><span class="service-card-label">${htmlEscape(item.goal)}</span><h3>${htmlEscape(item.title)}</h3><p>${htmlEscape(item.description)}</p><span class="card-link">${htmlEscape(item.cta)} <span aria-hidden="true">→</span></span>
</a>`).join("\n");

const renderGoalCards = (route) => publicItems(acquisitionData.goalPaths)
  .map((item, index) => `<a class="goal-card rv${revealDelay(index)}${item.tone === "urgent" ? " goal-card-urgent" : ""}" href="${htmlEscape(acquisitionHref(route, item))}" data-acquisition-goal="${htmlEscape(item.id)}">
  <span class="goal-icon" aria-hidden="true">${htmlEscape(item.number)}</span><h3>${htmlEscape(item.label)}</h3><p>${htmlEscape(item.description)}</p><span class="card-link">${htmlEscape(item.cta)} <span aria-hidden="true">→</span></span>
</a>`).join("\n");

const renderTrustStrip = (route) => `<div class="trust-strip" aria-label="Practice proof and next steps">
  <a class="trust-item" href="${htmlEscape(routeHref(route, "about", "#dr-patel"))}"><span class="trust-label">Provider</span><strong>Dr. Mainak Patel, DMD</strong></a>
  <a class="trust-item" href="${htmlEscape(routeHref(route, "same-day-crowns"))}"><span class="trust-label">Technology</span><strong>Same-Day CEREC&reg; Crowns</strong></a>
  <a class="trust-item" href="${htmlEscape(routeHref(route, "new-patients", "#what-to-expect"))}"><span class="trust-label">New patients</span><strong>Appointments · Call to confirm</strong></a>
  <a class="trust-item" href="${htmlEscape(routeHref(route, "reviews"))}"><span class="trust-label">Patient perspective</span><strong>Review source status <span aria-hidden="true">→</span></strong></a>
</div>`;

const renderServicesMenu = (route) => {
  const groups = publicItems(acquisitionData.serviceGroups).map((group) => {
    const items = publicItems(group.items).map((item) => `<li><a href="${htmlEscape(acquisitionHref(route, item))}">${htmlEscape(item.label)}</a></li>`).join("\n");
    return `<li class="drop-group"><span class="drop-label">${htmlEscape(group.label)}</span><ul>${items}</ul></li>`;
  }).join("\n");
  return `<ul class="drop drop-mega">
  ${groups}
  <li class="drop-group drop-directory"><span class="drop-label">Directory</span><ul><li><a href="${htmlEscape(routeHref(route, "all-services"))}">All Services</a></li></ul></li>
</ul>`;
};

const renderSubmenu = (route, items) => `<ul class="drop">
  ${publicItems(items).map((item) => `<li><a href="${htmlEscape(acquisitionHref(route, item))}">${htmlEscape(item.label)}</a></li>`).join("\n  ")}
</ul>`;

const renderTopLevelNavigation = (route) => publicItems(acquisitionData.navigation.topLevel)
  .map((item) => {
    const href = htmlEscape(acquisitionHref(route, item));
    let submenu = "";
    if (item.menu === "services") submenu = renderServicesMenu(route);
    if (item.menu === "new-patients") submenu = renderSubmenu(route, acquisitionData.navigation.newPatients);
    if (item.menu === "resources") submenu = renderSubmenu(route, acquisitionData.navigation.resources);
    if (item.menu === "about") submenu = renderSubmenu(route, acquisitionData.navigation.about);
    return `<li><a href="${href}">${htmlEscape(item.label)}</a>${submenu}</li>`;
  }).join("\n      ");

const renderMobileNavActions = (route) => `<li class="menu-mobile-actions" aria-label="Quick actions">
  <a class="menu-action-call" href="${htmlEscape(`tel:${config.contact.phone.tel}`)}">Call <span>${htmlEscape(config.contact.phone.display)}</span></a>
  <a class="menu-action-request" href="${htmlEscape(appointmentHref(route))}">Request Appointment</a>
</li>`;

const renderOptionalFooterServices = (route) => publicItems(acquisitionData.navigation.topLevel)
  .filter((item) => item.routeId === "facial-aesthetics")
  .map((item) => `<li><a href="${htmlEscape(acquisitionHref(route, item))}">${htmlEscape(item.label)}</a></li>`)
  .join("\n          ");

const renderFooterLinks = (route, items) => publicItems(items)
  .map((item) => `<li><a href="${htmlEscape(acquisitionHref(route, item))}">${htmlEscape(item.label)}</a></li>`)
  .join("\n          ");

const renderFooterPrimaryLinks = (route) => renderFooterLinks(route, [
  {label: "Home", routeId: "home"},
  ...acquisitionData.navigation.topLevel
]);

const renderFooterPatientLinks = (route) => renderFooterLinks(route, [
  {label: "What to Expect", routeId: "new-patients", suffix: "#what-to-expect"},
  {label: "Forms", routeId: "new-patient-forms"},
  {label: "Insurance & Financing", routeId: "insurance-financing"},
  {label: "Savings Plan", routeId: "new-patients", suffix: "#savings-plan"},
  {label: "Special Offers", routeId: "special-offers"},
  {label: "Pre/Post-Op Care", routeId: "pre-post-op"},
  {label: "Emergency Guidance", routeId: "emergency-dentistry"}
]);

const renderOptionalHomepageSections = (route) => publicItems(acquisitionData.featuredServices)
  .filter((item) => ["facial-aesthetics", "laser-dentistry", "quietnite"].includes(item.routeId))
  .map((item) => `<section class="sec sec-ivory acquisition-optional" id="${htmlEscape(item.routeId)}">
  <div class="wrap optional-acquisition-card"><div><p class="eyebrow rv">${htmlEscape(item.goal)}</p><h2 class="rv rv-d1">${htmlEscape(item.title)}</h2><p class="rv rv-d2">${htmlEscape(item.description)}</p></div><a class="btn rv rv-d2" href="${htmlEscape(acquisitionHref(route, item))}">${htmlEscape(item.cta)}</a></div>
</section>`)
  .join("\n");

const hoursRows = config.contact.hours.rows.map((row) => `<tr><td>${htmlEscape(row.day)}</td><td>${htmlEscape(row.display)}</td></tr>`).join("\n");
const hoursDisplay = String(config.contact.hours.display).split("\n").map(htmlEscape).join("<br>");

const canonicalUrl = (route) => {
  const canonicalRoute = route.canonicalTargetId ? routeById.get(route.canonicalTargetId) : route;
  const canonicalPath = canonicalRoute?.canonicalPath || route.canonicalPath;
  return `${canonicalBase}${canonicalPath === "/" ? "/" : canonicalPath}`;
};
const absoluteAssetUrl = (relativePath) => `${canonicalBase}/${String(relativePath).replace(/^\/+/, "")}`;
const socialImageUrl = (route) => {
  const image = route.socialImage || config.socialImage.path;
  return /^https?:\/\//i.test(image) ? image : absoluteAssetUrl(image);
};

const renderBreadcrumb = (route) => {
  if (!route.breadcrumb.length) return "";
  const links = route.breadcrumb.map((crumb, index) => {
    const isCurrent = index === route.breadcrumb.length - 1;
    const target = routeByPath.get(crumb.path);
    assert(target, `Breadcrumb for ${route.id} points to an unregistered path: ${crumb.path}`);
    if (isCurrent) return `<span aria-current="page">${htmlEscape(crumb.label)}</span>`;
    return `<a href="${htmlEscape(relativeOutputHref(route.output, target.output))}">${htmlEscape(crumb.label)}</a>`;
  }).join('<span aria-hidden="true">/</span>');
  return breadcrumbTemplate.replace("{{BREADCRUMB_LINKS}}", links);
};

const renderSocialLinks = () => config.socialUrls
  .filter((social) => social.url)
  .map((social) => `<li><a href="${htmlEscape(social.url)}" target="_blank" rel="noopener">${htmlEscape(social.label)}</a></li>`)
  .join("\n          ");

const renderLegalLinks = (route) => config.legalLinks.map((legal) => {
  const target = routeById.get(legal.routeId);
  if (legal.enabled && target?.enabled) {
    return `<a href="${htmlEscape(relativeOutputHref(route.output, target.output))}">${htmlEscape(legal.label)}</a>`;
  }
  return htmlEscape(legal.label);
}).join(" · ");

const metadataFor = (route) => {
  const canonical = canonicalUrl(route);
  const title = resolveRegistryText(route.title);
  const description = resolveRegistryText(route.description);
  const robots = route.indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow";
  const socialImage = socialImageUrl(route);
  const socialImageAlt = route.socialImageAlt || config.socialImage.alt;
  return `<title>${htmlEscape(title)}</title>
<meta name="description" content="${htmlEscape(description)}">
<meta name="robots" content="${robots}">
<meta name="author" content="${htmlEscape(config.brand.name)}">
<link rel="canonical" href="${htmlEscape(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${htmlEscape(config.brand.name)}">
<meta property="og:title" content="${htmlEscape(title)}">
<meta property="og:description" content="${htmlEscape(description)}">
<meta property="og:url" content="${htmlEscape(canonical)}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${htmlEscape(socialImage)}">
<meta property="og:image:alt" content="${htmlEscape(socialImageAlt)}">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${htmlEscape(title)}">
<meta name="twitter:description" content="${htmlEscape(description)}">
<meta name="twitter:url" content="${htmlEscape(canonical)}">
<meta name="twitter:image" content="${htmlEscape(socialImage)}">
<meta name="twitter:image:alt" content="${htmlEscape(socialImageAlt)}">`;
};

const schemaScript = (value) => {
  const json = JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
};

const inlineJson = (value) => JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");

const renderCareMeta = (id) => {
  const guide = careGuideById.get(id);
  assert(guide, `Care content references unknown guide: ${id}`);
  const reviewed = guide.lastReviewed ? htmlEscape(guide.lastReviewed) : "Pending clinical review";
  const owner = guide.clinicalOwner ? htmlEscape(guide.clinicalOwner) : "Pending named clinical owner";
  return `<div class="care-meta" data-approval-status="${htmlEscape(guide.approvalStatus)}"><span><b>Last reviewed</b>${reviewed}</span><span><b>Clinical owner</b>${owner}</span></div>`;
};

const renderCarePdf = (route, id) => {
  const guide = careGuideById.get(id);
  assert(guide, `Care content references unknown guide: ${id}`);
  return `<a class="btn" href="${htmlEscape(assetHref(route, guide.pdf))}" download>Download &amp; Print These Instructions (PDF)</a>`;
};

const websiteId = `${canonicalBase}/#website`;
const organizationId = `${canonicalBase}/#organization`;
const practiceId = `${canonicalBase}/#practice`;
const providerId = `${canonicalBase}/about.html#provider`;

const providerNode = {
  "@type": "Person",
  "@id": providerId,
  "name": "Dr. Mainak Patel",
  "honorificSuffix": "DMD",
  "jobTitle": "Dentist",
  "url": `${canonicalBase}/about.html#dr-patel`,
  "worksFor": {"@id": practiceId},
  "affiliation": {"@id": organizationId}
};

const openingHours = config.contact.hours.rows
  .filter((row) => row.dayOfWeek && row.opens && row.closes)
  .map((row) => ({
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": row.dayOfWeek,
    "opens": row.opens,
    "closes": row.closes
  }));

const renderSchema = (route) => {
  const canonical = canonicalUrl(route);
  const pageUrl = `${canonicalBase}${route.canonicalPath === "/" ? "/" : route.canonicalPath}`;
  const title = resolveRegistryText(route.title);
  const description = resolveRegistryText(route.description);
  const h1 = resolveRegistryText(route.h1);
  const webPage = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    "url": pageUrl,
    "name": title,
    "description": description,
    "headline": h1,
    "isPartOf": {"@id": websiteId}
  };
  const graph = [webPage];
  if (route.id === "home") {
    graph.unshift(
      {
        "@type": "WebSite",
        "@id": websiteId,
        "url": `${canonicalBase}/`,
        "name": config.brand.name,
        "alternateName": config.brand.alternateName,
        "publisher": {"@id": organizationId}
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        "name": config.brand.name,
        "alternateName": config.brand.alternateName,
        "url": `${canonicalBase}/`,
        "telephone": config.contact.phone.tel.startsWith("+") ? config.contact.phone.tel : `+${config.contact.phone.tel}`,
        "logo": {"@type": "ImageObject", "url": absoluteAssetUrl("assets/logo.svg")},
        "address": {
          "@type": "PostalAddress",
          "streetAddress": config.contact.address.street,
          "addressLocality": config.contact.address.locality,
          "addressRegion": config.contact.address.region,
          "postalCode": config.contact.address.postalCode,
          "addressCountry": config.contact.address.country
        },
        "sameAs": config.socialUrls.filter((social) => social.url).map((social) => social.url),
        "founder": {"@id": providerId}
      },
      {
        "@type": "Dentist",
        "@id": practiceId,
        "name": config.brand.name,
        "alternateName": config.brand.alternateName,
        "url": `${canonicalBase}/`,
        "image": socialImageUrl(route),
        "telephone": config.contact.phone.tel.startsWith("+") ? config.contact.phone.tel : `+${config.contact.phone.tel}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": config.contact.address.street,
          "addressLocality": config.contact.address.locality,
          "addressRegion": config.contact.address.region,
          "postalCode": config.contact.address.postalCode,
          "addressCountry": config.contact.address.country
        },
        "hasMap": config.contact.mapUrl.value,
        "sameAs": config.socialUrls.filter((social) => social.url).map((social) => social.url),
        "parentOrganization": {"@id": organizationId},
        "founder": {"@id": providerId},
        "openingHoursSpecification": openingHours,
        "availableService": routes
          .filter((candidate) => candidate.enabled && candidate.indexable && candidate.pageType === "service")
          .map((candidate) => ({"@id": `${canonicalUrl(candidate)}#service`}))
      }
    );
    graph.push(providerNode);
  }
  if (route.id === "about" || route.id === "dr-mainak-patel-draft") {
    webPage.mainEntity = {"@id": providerId};
    graph.push(providerNode);
  }
  if (route.breadcrumb.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      "itemListElement": route.breadcrumb.map((crumb, position) => ({
        "@type": "ListItem",
        "position": position + 1,
        "name": crumb.label,
        "item": `${canonicalBase}${crumb.path === "/" ? "/" : crumb.path}`
      }))
    });
  }
  if (route.pageType === "service") {
    graph.push({
      "@type": "Service",
      "@id": `${canonical}#service`,
      "url": canonical,
      "name": route.serviceName,
      "serviceType": route.serviceType,
      "description": description,
      "provider": {"@id": practiceId}
    });
    const servicePage = servicePages[route.servicePage];
    if (servicePage?.faqs?.length) {
      graph.push({
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        "url": canonical,
        "mainEntity": servicePage.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {"@type": "Answer", "text": faq.a}
        }))
      });
    }
  }
  return schemaScript({"@context": "https://schema.org", "@graph": graph});
};

const applyTokens = (value, tokens, label) => {
  let result = value;
  for (const [token, replacement] of Object.entries(tokens)) result = result.split(token).join(replacement);
  const unresolved = result.match(/\{\{[^}]+\}\}/g);
  assert(!unresolved, `${label} contains unresolved template token(s): ${unresolved?.join(", ")}`);
  return result;
};

const serviceHref = (route, targetId) => {
  const target = routeById.get(targetId);
  assert(target, `Service page ${route.id} references unknown related route: ${targetId}`);
  return relativeOutputHref(route.output, target.output);
};

const serviceActionHref = (route, type, relatedId = null) => {
  if (type === "phone") return `tel:${config.contact.phone.tel}`;
  if (type === "self") return "#what-it-is";
  if (type === "related") return serviceHref(route, relatedId);
  return appointmentHref(route);
};

const serviceActionAttributes = (route, href, location) => {
  const isPhone = href.startsWith("tel:");
  const inquiryEvent = route.id === "dental-implants" ? "implant_inquiry" : "";
  const events = isPhone ? ["click_to_call"] : ["appointment_click", inquiryEvent];
  return `data-hod-events="${htmlEscape(events.filter(Boolean).join(","))}" data-hod-cta-location="${htmlEscape(location)}" data-hod-conversion-type="${isPhone ? "call" : "appointment_request"}" data-hod-service-slug="${htmlEscape(route.servicePage || "")}"`;
};

const renderServiceList = (items) => items.map((item) => `<li>${htmlEscape(item)}</li>`).join("\n");

const renderServiceFaqs = (faqs) => faqs.map((faq) => `<article class="service-faq">
  <h3>${htmlEscape(faq.q)}</h3>
  <p>${htmlEscape(faq.a)}</p>
</article>`).join("\n");

const renderServiceContent = (route) => {
  const data = servicePages[route.servicePage];
  assert(data, `Missing service page data for ${route.id}`);
  const phoneHref = `tel:${config.contact.phone.tel}`;
  const guideHref = data.guideAnchor ? `${relativeOutputHref(route.output, routeById.get("pre-post-op").output)}#${data.guideAnchor}` : relativeOutputHref(route.output, routeById.get("pre-post-op").output);
  const emergencyHref = routeHref(route, "emergency-dentistry");
  const primaryRelatedId = data.primaryType === "related" ? data.related[0]?.id : null;
  const primaryHref = serviceActionHref(route, data.primaryType, primaryRelatedId);
  const secondaryRelatedId = data.secondaryType === "related" ? data.related[0]?.id : null;
  const secondaryHref = serviceActionHref(route, data.secondaryType, secondaryRelatedId);
  const relatedLinks = data.related.map((item) => `<a class="related-card" href="${htmlEscape(serviceHref(route, item.id))}"><span class="related-label">Related care</span><strong>${htmlEscape(item.label)}</strong><span class="related-arrow" aria-hidden="true">→</span></a>`).join("\n");
  const proof = data.proof ? `<aside class="service-proof"><span class="service-proof-label">Practice context</span><p>${htmlEscape(data.proof)}</p></aside>` : "";
  const guide = `<a class="guide-link" href="${htmlEscape(guideHref)}"><span>Patient resource</span><strong>Review pre- and post-operative care</strong><small>Use the guide as a supplement to the instructions provided by the practice.</small></a>`;
  return `<section class="service-hero sec-noir">
  <div class="wrap service-hero-grid">
    <div>
      <p class="eyebrow rv in">${htmlEscape(data.eyebrow)}</p>
      <h1 class="rv in">${htmlEscape(route.h1)}</h1>
      <p class="service-lead rv in">${htmlEscape(data.lead)}</p>
      <div class="service-actions rv in">
        <a class="btn btn-solid" href="${htmlEscape(primaryHref)}" ${serviceActionAttributes(route, primaryHref, "service_hero_primary")}>${htmlEscape(data.primaryCta)}</a>
        <a class="btn" href="${htmlEscape(secondaryHref)}" ${serviceActionAttributes(route, secondaryHref, "service_hero_secondary")}>${htmlEscape(data.secondaryCta)}</a>
      </div>
    </div>
    <aside class="service-hero-note rv in" aria-label="Service summary">
      <span class="service-note-label">Plain-language path</span>
      <strong>${htmlEscape(data.plainLabel)}</strong>
      <span class="service-note-label">Clinical label</span>
      <span>${htmlEscape(data.clinicalLabel)}</span>
      <p>Care is planned around your goals and the findings from an evaluation in Winter Park.</p>
    </aside>
  </div>
</section>

<section class="sec sec-ivory service-body">
  <div class="wrap service-layout">
    <aside class="service-side">
      <nav class="service-side-nav" aria-label="On this page">
        <a href="#what-it-is">What it is</a>
        <a href="#fit">Who it may fit</a>
        <a href="#consultation">Consultation</a>
        <a href="#expect">What to expect</a>
        <a href="#questions">Questions</a>
      </nav>
      <a class="side-callout urgent-side-callout" href="${htmlEscape(emergencyHref)}"><span>Urgent dental concern?</span><strong>Call first</strong><small>Review the phone-first path before sending an online request.</small></a>
      <a class="side-callout" href="${htmlEscape(phoneHref)}"><span>Winter Park office</span><strong>${htmlEscape(config.contact.phone.display)}</strong><small>Call for questions or to start a conversation.</small></a>
    </aside>
    <div class="service-content">
      <section class="service-section service-opening" id="what-it-is">
        <p class="eyebrow">${htmlEscape(data.clinicalLabel)}</p>
        <h2>${htmlEscape(data.goalHeading)}</h2>
        <p class="service-intro">${htmlEscape(data.goalCopy)}</p>
        <p>${htmlEscape(data.what)}</p>
        <div class="service-option-box"><h3>Confirmed care paths</h3><ul class="service-list">${renderServiceList(data.options)}</ul></div>
        ${proof}
      </section>

      <section class="service-section" id="fit">
        <div class="service-two-col">
          <div><span class="section-number">01</span><h2>Who may be a candidate</h2><p>${htmlEscape(data.candidateMay)}</p></div>
          <div class="service-boundary"><span class="section-number">02</span><h2>What an online page cannot decide</h2><p>${htmlEscape(data.candidateNot)}</p></div>
        </div>
      </section>

      <section class="service-section" id="consultation">
        <p class="eyebrow">Start with clarity</p>
        <h2>Your Winter Park consultation</h2>
        <ol class="service-steps">${data.consultation.map((step, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><p>${htmlEscape(step)}</p></li>`).join("\n")}</ol>
      </section>

      <section class="service-section" id="expect">
        <div class="service-two-col service-expect-grid">
          <div><p class="eyebrow">Before you decide</p><h2>What to expect</h2><p>${htmlEscape(data.expect)}</p><p>${htmlEscape(data.comfort)}</p></div>
          <div><p class="eyebrow">Possible benefits</p><ul class="service-list">${renderServiceList(data.benefits)}</ul><p class="eyebrow service-sub-eyebrow">Limitations &amp; alternatives</p><ul class="service-list">${renderServiceList(data.limitations)}</ul></div>
        </div>
      </section>

      <section class="service-section service-care-section">
        <div class="service-care-grid"><div><p class="eyebrow">After your visit</p><h2>Care, recovery &amp; maintenance</h2><p>${htmlEscape(data.care)}</p></div><div>${guide}</div></div>
      </section>

      <section class="service-section service-financing">
        <p class="eyebrow">Planning the investment</p><h2>Insurance &amp; financing questions</h2><p>${htmlEscape(data.financing)}</p><a class="text-link" href="${htmlEscape(relativeOutputHref(route.output, routeById.get("new-patients").output))}#insurance" data-hod-event="financing_click" data-hod-cta-location="service_financing" data-hod-conversion-type="financing" data-hod-service-slug="${htmlEscape(route.servicePage || "")}">Review new-patient payment information <span aria-hidden="true">→</span></a>
      </section>

      <section class="service-section" id="questions">
        <p class="eyebrow">Questions patients ask</p><h2>Start with the questions that matter to you</h2>
        <div class="service-faq-list">${renderServiceFaqs(data.faqs)}</div>
      </section>

      <section class="service-section service-related">
        <p class="eyebrow">Keep exploring</p><h2>Related services</h2><div class="related-grid">${relatedLinks}</div>
      </section>
    </div>
  </div>
</section>

<section class="service-cta band">
  <div class="wrap service-cta-grid"><div><p class="eyebrow">Ready when you are</p><h2>Talk with the Winter Park team</h2><p>Ask a question, request an evaluation, or call if your concern feels urgent.</p></div><div class="service-actions"><a class="btn" href="${htmlEscape(primaryHref)}" ${serviceActionAttributes(route, primaryHref, "service_footer_primary")}>${htmlEscape(data.primaryCta)}</a><a class="btn" href="${htmlEscape(phoneHref)}" data-hod-event="click_to_call" data-hod-cta-location="service_footer_phone" data-hod-conversion-type="call" data-hod-service-slug="${htmlEscape(route.servicePage || "")}">${htmlEscape(config.contact.phone.display)}</a></div></div>
</section>

<section class="sec sec-noir service-location"><div class="wrap service-location-grid"><div><p class="eyebrow">Local trust</p><h2>Care in Winter Park, Florida</h2><p>The House of Dental is located at ${htmlEscape(config.contact.address.street)}, ${htmlEscape(config.contact.address.locality)}, ${htmlEscape(config.contact.address.region)} ${htmlEscape(config.contact.address.postalCode)}.</p></div><div><table class="hours-table">${hoursRows}</table><a class="text-link" href="${htmlEscape(config.contact.mapUrl.value)}" target="_blank" rel="noopener" data-hod-event="directions_click" data-hod-cta-location="service_location" data-hod-conversion-type="directions" data-hod-service-slug="${htmlEscape(route.servicePage || "")}">Get directions <span aria-hidden="true">→</span></a></div></div></section>`;
};

const campaignForRoute = (route) => {
  if (!route.campaignPage) return null;
  const campaign = campaignPageData.campaigns[route.campaignPage];
  assert(campaign, `Missing campaign data for ${route.id}`);
  return campaign;
};

const campaignList = (items = []) => items.map((item) => `<li>${htmlEscape(item)}</li>`).join("\n");

const campaignEventAttributes = (campaign, events, location, conversionType = "appointment_request") => {
  const eventNames = events.filter(Boolean).join(",");
  const serviceSlug = campaign.serviceSlug ? ` data-hod-service-slug="${htmlEscape(campaign.serviceSlug)}"` : "";
  return `data-hod-events="${htmlEscape(eventNames)}" data-hod-cta-location="${htmlEscape(location)}" data-hod-conversion-type="${htmlEscape(conversionType)}" data-hod-campaign-id="${htmlEscape(campaign.landingPageId)}"${serviceSlug}`;
};

const renderCampaignProof = (route, campaign) => {
  const durableLink = campaign.canonicalTargetId && routeById.get(campaign.canonicalTargetId)
    ? `<a class="text-link text-link-light" href="${htmlEscape(routeHref(route, campaign.canonicalTargetId))}">Review the durable page <span aria-hidden="true">→</span></a>`
    : "";
  return `<p>${htmlEscape(campaign.proof)}</p>${durableLink}`;
};

const renderCampaignGovernance = (route, campaign) => {
  const canonicalTarget = campaign.canonicalTargetId ? routeById.get(campaign.canonicalTargetId) : null;
  const canonicalLabel = canonicalTarget ? `Canonical target: ${canonicalTarget.canonicalPath}` : "Canonical self; no approved durable target";
  const eventLabel = campaign.conversionEvent || "No inquiry event enabled";
  const successLabel = campaign.successEvent || "No success event configured";
  const thankYouTarget = campaign.thankYouRouteId ? routeById.get(campaign.thankYouRouteId) : null;
  return `<dl class="campaign-governance-list">
  <div><dt>Audience</dt><dd>${htmlEscape(campaign.audience)}</dd></div>
  <div><dt>Traffic source</dt><dd>${htmlEscape(campaign.trafficSource)}</dd></div>
  <div><dt>Search/ad intent</dt><dd>${htmlEscape(campaign.searchIntent)}</dd></div>
  <div><dt>Landing-page ID</dt><dd><code>${htmlEscape(campaign.landingPageId)}</code></dd></div>
  <div><dt>Inquiry event</dt><dd><code>${htmlEscape(eventLabel)}</code></dd></div>
  <div><dt>Confirmed-success event</dt><dd><code>${htmlEscape(successLabel)}</code></dd></div>
  <div><dt>Thank-you route</dt><dd>${htmlEscape(thankYouTarget?.canonicalPath || "Not configured")}</dd></div>
  <div><dt>Indexability</dt><dd>${htmlEscape(route.indexable ? "Indexable after approval" : "Noindex local preview")}; ${htmlEscape(canonicalLabel)}</dd></div>
  <div><dt>Approval gate</dt><dd>${htmlEscape(campaign.approvalGate)}</dd></div>
</dl>`;
};

const campaignPrimaryHref = (route, campaign) => {
  if (!campaign.primaryCta) return null;
  if (campaign.primaryCta.startsWith("Explore") && campaign.canonicalTargetId && routeById.has(campaign.canonicalTargetId)) {
    return routeHref(route, campaign.canonicalTargetId);
  }
  if (campaign.status === "ready_for_named_approval" && campaign.primaryCta.toLowerCase().includes("call")) {
    return `tel:${config.contact.phone.tel}`;
  }
  if (campaign.status === "ready_for_named_approval") return appointmentHref(route);
  return null;
};

const renderCampaignAction = (route, campaign, location, compact = false) => {
  const href = campaignPrimaryHref(route, campaign);
  if (!href) return `<span class="draft-button campaign-disabled-action" aria-disabled="true">Campaign action not enabled</span>`;
  const isEmergency = campaign.conversionEvent === "emergency_call";
  const events = isEmergency ? ["emergency_call"] : ["appointment_click", campaign.conversionEvent];
  const conversionType = isEmergency ? "emergency_call" : campaign.conversionEvent || "appointment_request";
  const label = compact && campaign.primaryCta.startsWith("Explore") ? "Review the durable page" : campaign.primaryCta;
  return `<a class="btn ${compact ? "" : "btn-solid"}" href="${htmlEscape(href)}" ${campaignEventAttributes(campaign, events, location, conversionType)}>${htmlEscape(label)}</a>`;
};

const renderCampaignCtaActions = (route, campaign) => {
  const primary = renderCampaignAction(route, campaign, "campaign_primary", true);
  const isEmergency = campaign.conversionEvent === "emergency_call";
  const phoneEvent = isEmergency ? "emergency_call" : "click_to_call";
  const phoneAttrs = campaignEventAttributes(campaign, [phoneEvent], "campaign_phone", isEmergency ? "emergency_call" : "call");
  return `${primary}<a class="btn" href="${htmlEscape(`tel:${config.contact.phone.tel}`)}" ${phoneAttrs}>Call ${htmlEscape(config.contact.phone.display)}</a>`;
};

const renderCampaignContent = (route) => {
  const campaign = campaignForRoute(route);
  const primaryActions = campaign.status === "ready_for_named_approval"
    ? `<div class="campaign-actions rv in">${renderCampaignAction(route, campaign, "campaign_hero", false)}<a class="btn" href="${htmlEscape(`tel:${config.contact.phone.tel}`)}" ${campaignEventAttributes(campaign, [campaign.conversionEvent === "emergency_call" ? "emergency_call" : "click_to_call"], "campaign_hero_phone", campaign.conversionEvent === "emergency_call" ? "emergency_call" : "call")}>Call ${htmlEscape(config.contact.phone.display)}</a></div>`
    : `<div class="campaign-actions rv in"><span class="draft-button campaign-disabled-action" aria-disabled="true">Campaign action not enabled</span><span class="campaign-action-note">${htmlEscape(campaign.approvalGate)}</span></div>`;
  const faqMarkup = campaign.faqs.map((faq) => `<article class="campaign-faq"><h3>${htmlEscape(faq.q)}</h3><p>${htmlEscape(faq.a)}</p></article>`).join("\n");
  return applyTokens(campaignPageTemplate, {
    "{{CAMPAIGN_INTENT}}": htmlEscape(campaign.intent),
    "{{CAMPAIGN_HEADLINE}}": htmlEscape(campaign.headline),
    "{{CAMPAIGN_SUPPORT}}": htmlEscape(campaign.support),
    "{{CAMPAIGN_PRIMARY_ACTIONS}}": primaryActions,
    "{{CAMPAIGN_PROOF}}": renderCampaignProof(route, campaign),
    "{{CAMPAIGN_MESSAGE}}": htmlEscape(campaign.message),
    "{{CAMPAIGN_EXPLANATION}}": htmlEscape(campaign.explanation),
    "{{CAMPAIGN_GOVERNANCE}}": renderCampaignGovernance(route, campaign),
    "{{CAMPAIGN_AUDIENCE}}": htmlEscape(campaign.audience),
    "{{CAMPAIGN_EXPECTATIONS}}": `<ul class="campaign-list">${campaignList(campaign.expectations)}</ul>`,
    "{{CAMPAIGN_LIMITATIONS}}": `<ul class="campaign-list">${campaignList(campaign.limitations)}</ul>`,
    "{{CAMPAIGN_FAQS}}": faqMarkup,
    "{{CAMPAIGN_DISCLAIMER}}": htmlEscape(campaign.disclaimer),
    "{{CAMPAIGN_CTA_HEADING}}": htmlEscape(campaign.ctaHeading),
    "{{CAMPAIGN_CTA_COPY}}": htmlEscape(campaign.ctaCopy),
    "{{CAMPAIGN_CTA_ACTIONS}}": renderCampaignCtaActions(route, campaign),
    "{{MAP_URL}}": htmlEscape(config.contact.mapUrl.value),
    "{{FINANCING_HREF}}": htmlEscape(routeHref(route, "insurance-financing"))
  }, `${route.id} campaign template`);
};

const measurementRuntimeConfig = (route) => {
  const measurement = config.integrations.measurement;
  const consentApproved = measurement.consent?.status === "approved";
  const campaign = campaignForRoute(route);
  return {
    version: measurementData.version,
    enabled: measurement.dataLayer.enabled === true && consentApproved,
    debugQueryParam: measurement.dataLayer.debugQueryParam || measurementData.debug.queryParam,
    allowedEvents: [...measurementData.conversionEvents, ...(measurementData.diagnosticEvents || [])],
    allowedFields: measurementData.allowedFields,
    stateValues: measurementData.stateValues,
    attribution: measurementData.attribution,
    crmMappingEnabled: measurement.crmAttribution?.approved === true && Boolean(measurement.crmAttribution?.endpoint),
    ownHost: new URL(canonicalBase).hostname,
    routeId: route.id,
    pageType: route.pageType,
    serviceSlug: route.servicePage || campaign?.serviceSlug || null,
    campaignId: campaign?.landingPageId || null
  };
};

const renderPage = (route) => {
  const contentPath = path.join(siteRoot, route.source);
  let content = readText(contentPath).trim();
  assert(!/<(?:html|head|body|header|footer)\b/i.test(content), `${route.source} must contain page content only; global shell markup belongs in templates`);
  content = content.replaceAll("{{BREADCRUMB}}", renderBreadcrumb(route));
  content = content.replaceAll("{{TECHNOLOGY_DATA}}", inlineJson(technologyData));
  content = content.replaceAll("{{SERVICE_DATA}}", inlineJson(serviceData));
  content = content.replaceAll("{{FEATURED_SERVICE_CARDS}}", renderFeaturedServiceCards(route));
  content = content.replaceAll("{{PATIENT_GOAL_CARDS}}", renderGoalCards(route));
  content = content.replaceAll("{{TRUST_STRIP}}", renderTrustStrip(route));
  content = content.replaceAll("{{OPTIONAL_HOMEPAGE_SECTIONS}}", renderOptionalHomepageSections(route));
  content = content.replace(/\{\{CARE_META:([^}]+)\}\}/g, (_match, id) => renderCareMeta(id));
  content = content.replace(/\{\{CARE_PDF:([^}]+)\}\}/g, (_match, id) => renderCarePdf(route, id));
  if (route.servicePage) content = content.replaceAll("{{SERVICE_PAGE_CONTENT}}", renderServiceContent(route));
  if (route.campaignPage) content = content.replaceAll("{{CAMPAIGN_PAGE_CONTENT}}", renderCampaignContent(route));
  content = applyTokens(content, {
    "{{APPOINTMENT_HREF}}": htmlEscape(appointmentHref(route)),
    "{{PHONE_HREF}}": htmlEscape(`tel:${config.contact.phone.tel}`),
    "{{PHONE_DISPLAY}}": htmlEscape(config.contact.phone.display),
    "{{ALL_SERVICES_HREF}}": htmlEscape(routeHref(route, "all-services")),
    "{{ABOUT_HREF}}": htmlEscape(routeHref(route, "about")),
    "{{TECHNOLOGY_HREF}}": htmlEscape(routeHref(route, "technology")),
    "{{SAME_DAY_CROWNS_HREF}}": htmlEscape(routeHref(route, "same-day-crowns")),
    "{{REVIEWS_HREF}}": htmlEscape(routeHref(route, "reviews")),
    "{{MAP_URL}}": htmlEscape(config.contact.mapUrl.value),
    "{{ADDRESS_STREET}}": htmlEscape(config.contact.address.street),
    "{{ADDRESS_LOCALITY}}": htmlEscape(config.contact.address.locality),
    "{{ADDRESS_REGION}}": htmlEscape(config.contact.address.region),
    "{{ADDRESS_POSTAL}}": htmlEscape(config.contact.address.postalCode),
    "{{HOURS_DISPLAY}}": hoursDisplay,
    "{{HOURS_ROWS}}": hoursRows,
    "{{EMAIL_VALUE}}": htmlEscape(config.contact.email.value || "Email pending confirmation"),
    "{{PATIENT_RESOURCES_HREF}}": htmlEscape(routeHref(route, "patient-resources")),
    "{{NEW_PATIENT_FORMS_HREF}}": htmlEscape(routeHref(route, "new-patient-forms")),
    "{{INSURANCE_FINANCING_HREF}}": htmlEscape(routeHref(route, "insurance-financing")),
    "{{SPECIAL_OFFERS_HREF}}": htmlEscape(routeHref(route, "special-offers")),
    "{{EMERGENCY_HREF}}": htmlEscape(routeHref(route, "emergency-dentistry")),
    "{{PRE_POST_OP_HREF}}": htmlEscape(routeHref(route, "pre-post-op")),
    "{{PRIVACY_HREF}}": htmlEscape(routeHref(route, "privacy")),
    "{{TERMS_HREF}}": htmlEscape(routeHref(route, "terms")),
    "{{ACCESSIBILITY_HREF}}": htmlEscape(routeHref(route, "accessibility")),
    "{{APPOINTMENT_SUCCESS_HREF}}": htmlEscape(routeHref(route, "thank-you-appointment")),
    "{{OFFER_SUCCESS_HREF}}": htmlEscape(routeHref(route, "thank-you-offer")),
    "{{FORM_HANDLER_URL}}": htmlEscape(config.integrations.appointmentForm.handlerUrl || ""),
    "{{FORM_HANDLER_STATUS}}": htmlEscape(config.integrations.appointmentForm.status)
  }, `${route.id} content`);
  content = content.replaceAll("{{STATIC_PREFIX}}", outputDirectoryFor(route) === "." ? "" : `${"../".repeat(outputDirectoryFor(route).split("/").length)}`);
  const unresolvedContentTokens = content.match(/\{\{[^}]+\}\}/g);
  assert(!unresolvedContentTokens, `${route.id} content contains unresolved template token(s): ${unresolvedContentTokens?.join(", ")}`);
  const header = applyTokens(headerTemplate, {
    "{{BRAND_NAME}}": htmlEscape(config.brand.name),
    "{{PHONE_HREF}}": `tel:${htmlEscape(config.contact.phone.tel)}`,
    "{{PHONE_DISPLAY}}": htmlEscape(config.contact.phone.display),
    "{{APPOINTMENT_HREF}}": htmlEscape(appointmentHref(route)),
    "{{ASSET_HREF:logo.svg}}": htmlEscape(assetHref(route, "assets/logo.svg")),
    "{{HOME_HREF}}": htmlEscape(routeHref(route, "home")),
    "{{TOP_LEVEL_NAV}}": renderTopLevelNavigation(route),
    "{{MOBILE_NAV_ACTIONS}}": renderMobileNavActions(route)
  }, `${route.id} header`);
  const footer = applyTokens(footerTemplate, {
    "{{BRAND_NAME}}": htmlEscape(config.brand.name),
    "{{PHONE_HREF}}": `tel:${htmlEscape(config.contact.phone.tel)}`,
    "{{PHONE_DISPLAY}}": htmlEscape(config.contact.phone.display),
    "{{MAP_URL}}": htmlEscape(config.contact.mapUrl.value),
    "{{ADDRESS_STREET}}": htmlEscape(config.contact.address.street),
    "{{ADDRESS_LOCALITY}}": htmlEscape(config.contact.address.locality),
    "{{ADDRESS_REGION}}": htmlEscape(config.contact.address.region),
    "{{ADDRESS_POSTAL}}": htmlEscape(config.contact.address.postalCode),
    "{{EMAIL_VALUE}}": htmlEscape(config.contact.email.value || "Email pending confirmation"),
    "{{HOURS_DISPLAY}}": hoursDisplay,
    "{{SOCIAL_LINKS}}": renderSocialLinks(),
    "{{LEGAL_LINKS}}": renderLegalLinks(route),
    "{{FOOTER_PRIMARY_LINKS}}": renderFooterPrimaryLinks(route),
    "{{FOOTER_PATIENT_LINKS}}": renderFooterPatientLinks(route),
    "{{FOOTER_OPTIONAL_SERVICES}}": renderOptionalFooterServices(route),
    "{{HREF_ALL_SERVICES}}": htmlEscape(routeHref(route, "all-services")),
    "{{HREF_SITEMAP}}": htmlEscape(routeHref(route, "sitemap-page")),
    "{{ASSET_HREF:logo.svg}}": htmlEscape(assetHref(route, "assets/logo.svg")),
    "{{HOME_HREF}}": htmlEscape(routeHref(route, "home"))
  }, `${route.id} footer`);
  const stickyActions = applyTokens(stickyActionsTemplate, {
    "{{PHONE_HREF}}": `tel:${htmlEscape(config.contact.phone.tel)}`,
    "{{PHONE_DISPLAY}}": htmlEscape(config.contact.phone.display),
    "{{APPOINTMENT_HREF}}": htmlEscape(appointmentHref(route))
  }, `${route.id} sticky actions`);
  return applyTokens(layout, {
    "{{ROUTE_ID}}": htmlEscape(route.id),
    "{{PAGE_TYPE}}": htmlEscape(route.pageType),
    "{{SERVICE_SLUG}}": htmlEscape(route.servicePage || campaignForRoute(route)?.serviceSlug || ""),
    "{{CAMPAIGN_ID}}": htmlEscape(campaignForRoute(route)?.landingPageId || ""),
    "{{METADATA}}": metadataFor(route),
    "{{SCHEMA}}": renderSchema(route),
    "{{MEASUREMENT_CONFIG}}": inlineJson(measurementRuntimeConfig(route)),
    "{{FONT_LINKS}}": "",
    "{{PERFORMANCE_HINTS}}": route.id === "home" ? '<link rel="preload" as="image" href="assets/office-exterior-mobile-800x900.avif" type="image/avif" media="(max-width: 720px)" fetchpriority="high">\n<link rel="preload" as="image" href="assets/office-exterior.avif" imagesrcset="assets/office-exterior-wide-1200x881.avif 1200w, assets/office-exterior.avif 1464w" imagesizes="100vw" type="image/avif" media="(min-width: 721px)" fetchpriority="high">' : "",
    "{{STYLES_HREF}}": htmlEscape(assetHref(route, "styles.css")),
    "{{SCRIPT_HREF}}": htmlEscape(assetHref(route, "main.js")),
    "{{FAVICON_HREF}}": htmlEscape(assetHref(route, "assets/logo.svg")),
    "{{HEADER}}": header,
    "{{CONTENT}}": content,
    "{{FOOTER}}": footer,
    "{{STICKY_ACTIONS}}": stickyActions
  }, `${route.id} layout`);
};

const renderSitemap = () => {
  const urls = enabledRoutes.filter((route) => route.indexable).map((route) => `  <url><loc>${xmlEscape(canonicalUrl(route))}</loc><changefreq>monthly</changefreq></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const renderRedirects = () => {
  const lines = [
    "# Phase 8 migration artifact — review and test before deployment.",
    "# Cloudflare Pages _redirects format; no domain move is configured.",
    "# Blocked current URLs remain in docs/URL-INVENTORY.csv until content parity is approved."
  ];
  for (const redirect of redirects) lines.push(`${redirect.source} ${redirect.destination} ${redirect.status}`);
  return `${lines.join("\n")}\n`;
};

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.cpSync(path.join(siteRoot, "assets"), path.join(outputDir, "assets"), { recursive: true });
fs.writeFileSync(path.join(outputDir, "styles.css"), `${minifyCss(readText(path.join(siteRoot, "styles.css")))}\n`, "utf8");
fs.copyFileSync(path.join(siteRoot, "main.js"), path.join(outputDir, "main.js"));

for (const route of enabledRoutes) {
  const destination = path.join(outputDir, route.output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${renderPage(route)}\n`, "utf8");
}

const robots = readText(path.join(siteRoot, "robots.txt"));
fs.writeFileSync(path.join(outputDir, "robots.txt"), robots.replaceAll("{{CANONICAL_BASE_URL}}", canonicalBase), "utf8");
fs.writeFileSync(path.join(outputDir, "sitemap.xml"), renderSitemap(), "utf8");
fs.writeFileSync(path.join(outputDir, "_redirects"), renderRedirects(), "utf8");

console.log(`Built ${enabledRoutes.length} static HTML routes into ${outputRelative(outputDir)}`);
console.log(`Sitemap covers ${enabledRoutes.filter((route) => route.indexable).length} indexable routes; ${routes.length - enabledRoutes.length} registry routes remain planned or gated.`);
