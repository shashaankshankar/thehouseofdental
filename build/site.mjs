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
const layout = readText(path.join(templateDir, "layout.html"));
const headerTemplate = readText(path.join(templateDir, "header.html"));
const footerTemplate = readText(path.join(templateDir, "footer.html"));
const breadcrumbTemplate = readText(path.join(templateDir, "breadcrumb.html"));
const stickyActionsTemplate = readText(path.join(templateDir, "sticky-actions.html"));

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

const canonicalBase = String(config.canonical?.baseUrl || "").replace(/\/+$/, "");
assert(canonicalBase, "config/site.json must provide canonical.baseUrl");
assert(config.canonical?.status, "config/site.json must document canonical.baseUrl status");
assert(config.brand?.name, "config/site.json must provide brand.name");
assert(config.brand?.alternateName, "config/site.json must provide brand.alternateName");
assert(config.contact?.phone?.display && config.contact?.phone?.tel, "config/site.json must provide contact.phone display and tel values");
assert(config.contact?.address?.street && config.contact?.address?.locality && config.contact?.address?.region && config.contact?.address?.postalCode, "config/site.json must provide the complete address");
assert(config.contact?.hours?.status, "config/site.json must document contact.hours status");
assert(Array.isArray(config.contact?.hours?.rows) && config.contact.hours.rows.length > 0, "config/site.json must provide contact.hours.rows");
assert(config.reviewSource?.status, "config/site.json must document reviewSource status");
assert(config.analytics?.status, "config/site.json must document analytics status");
assert(config.appointmentUrl?.path && config.appointmentUrl?.status, "config/site.json must document appointmentUrl path and status");
assert(config.integrations?.appointmentForm?.status, "config/site.json must document appointment form integration status");
assert(Object.prototype.hasOwnProperty.call(config.integrations.appointmentForm, "handlerUrl"), "config/site.json must declare appointmentForm.handlerUrl, including null when unconfigured");

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

const hoursRows = config.contact.hours.rows.map((row) => `<tr><td>${htmlEscape(row.day)}</td><td>${htmlEscape(row.display)}</td></tr>`).join("\n");
const hoursDisplay = String(config.contact.hours.display).split("\n").map(htmlEscape).join("<br>");

const canonicalUrl = (route) => `${canonicalBase}${route.canonicalPath === "/" ? "/" : route.canonicalPath}`;

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
  const socialImage = route.socialImage ? `\n<meta property="og:image" content="${htmlEscape(route.socialImage)}">\n<meta name="twitter:image" content="${htmlEscape(route.socialImage)}">` : "";
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
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${htmlEscape(title)}">
<meta name="twitter:description" content="${htmlEscape(description)}">${socialImage}`;
};

const schemaScript = (value) => {
  const json = JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
};

const inlineJson = (value) => JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");

const renderSchema = (route) => {
  const canonical = canonicalUrl(route);
  const title = resolveRegistryText(route.title);
  const description = resolveRegistryText(route.description);
  const h1 = resolveRegistryText(route.h1);
  const webPage = {
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    "url": canonical,
    "name": title,
    "description": description,
    "headline": h1,
    "isPartOf": {"@id": `${canonicalBase}/#website`}
  };
  const graph = [webPage];
  if (route.id === "home") {
    graph.unshift(
      {
        "@type": "WebSite",
        "@id": `${canonicalBase}/#website`,
        "url": `${canonicalBase}/`,
        "name": config.brand.name,
        "alternateName": config.brand.alternateName,
        "publisher": {"@id": `${canonicalBase}/#practice`}
      },
      {
        "@type": "Dentist",
        "@id": `${canonicalBase}/#practice`,
        "name": config.brand.name,
        "alternateName": config.brand.alternateName,
        "url": `${canonicalBase}/`,
        "telephone": config.contact.phone.tel.startsWith("+") ? config.contact.phone.tel : `+${config.contact.phone.tel}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": config.contact.address.street,
          "addressLocality": config.contact.address.locality,
          "addressRegion": config.contact.address.region,
          "postalCode": config.contact.address.postalCode,
          "addressCountry": config.contact.address.country
        },
        "sameAs": config.socialUrls.filter((social) => social.url).map((social) => social.url)
      }
    );
  }
  if (route.breadcrumb.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
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
      "provider": {"@id": `${canonicalBase}/#practice`}
    });
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
        <a class="btn btn-solid" href="${htmlEscape(primaryHref)}">${htmlEscape(data.primaryCta)}</a>
        <a class="btn" href="${htmlEscape(secondaryHref)}">${htmlEscape(data.secondaryCta)}</a>
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
        <p class="eyebrow">Planning the investment</p><h2>Insurance &amp; financing questions</h2><p>${htmlEscape(data.financing)}</p><a class="text-link" href="${htmlEscape(relativeOutputHref(route.output, routeById.get("new-patients").output))}#insurance">Review new-patient payment information <span aria-hidden="true">→</span></a>
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
  <div class="wrap service-cta-grid"><div><p class="eyebrow">Ready when you are</p><h2>Talk with the Winter Park team</h2><p>Ask a question, request an evaluation, or call if your concern feels urgent.</p></div><div class="service-actions"><a class="btn" href="${htmlEscape(primaryHref)}">${htmlEscape(data.primaryCta)}</a><a class="btn" href="${htmlEscape(phoneHref)}">${htmlEscape(config.contact.phone.display)}</a></div></div>
</section>

<section class="sec sec-noir service-location"><div class="wrap service-location-grid"><div><p class="eyebrow">Local trust</p><h2>Care in Winter Park, Florida</h2><p>The House of Dental is located at ${htmlEscape(config.contact.address.street)}, ${htmlEscape(config.contact.address.locality)}, ${htmlEscape(config.contact.address.region)} ${htmlEscape(config.contact.address.postalCode)}.</p></div><div><table class="hours-table">${hoursRows}</table><a class="text-link" href="${htmlEscape(config.contact.mapUrl.value)}" target="_blank" rel="noopener">Get directions <span aria-hidden="true">→</span></a></div></div></section>`;
};

const renderPage = (route) => {
  const contentPath = path.join(siteRoot, route.source);
  let content = readText(contentPath).trim();
  assert(!/<(?:html|head|body|header|footer)\b/i.test(content), `${route.source} must contain page content only; global shell markup belongs in templates`);
  content = content.replaceAll("{{BREADCRUMB}}", renderBreadcrumb(route));
  content = content.replaceAll("{{TECHNOLOGY_DATA}}", inlineJson(technologyData));
  content = content.replaceAll("{{SERVICE_DATA}}", inlineJson(serviceData));
  if (route.servicePage) content = content.replaceAll("{{SERVICE_PAGE_CONTENT}}", renderServiceContent(route));
  content = applyTokens(content, {
    "{{APPOINTMENT_HREF}}": htmlEscape(appointmentHref(route)),
    "{{PHONE_HREF}}": htmlEscape(`tel:${config.contact.phone.tel}`),
    "{{PHONE_DISPLAY}}": htmlEscape(config.contact.phone.display),
    "{{MAP_URL}}": htmlEscape(config.contact.mapUrl.value),
    "{{ADDRESS_STREET}}": htmlEscape(config.contact.address.street),
    "{{ADDRESS_LOCALITY}}": htmlEscape(config.contact.address.locality),
    "{{ADDRESS_REGION}}": htmlEscape(config.contact.address.region),
    "{{ADDRESS_POSTAL}}": htmlEscape(config.contact.address.postalCode),
    "{{HOURS_DISPLAY}}": hoursDisplay,
    "{{HOURS_ROWS}}": hoursRows,
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
    "{{HREF:home}}": htmlEscape(routeHref(route, "home")),
    "{{HREF:facial-aesthetics}}": htmlEscape(routeHref(route, "facial-aesthetics")),
    "{{HREF:services}}": htmlEscape(routeHref(route, "services")),
    "{{HREF:all-services}}": htmlEscape(routeHref(route, "all-services")),
    "{{HREF:dental-implants}}": htmlEscape(routeHref(route, "dental-implants")),
    "{{HREF:same-day-crowns}}": htmlEscape(routeHref(route, "same-day-crowns")),
    "{{HREF:invisalign}}": htmlEscape(routeHref(route, "invisalign")),
    "{{HREF:pre-post-op}}": htmlEscape(routeHref(route, "pre-post-op")),
    "{{HREF:new-patients}}": htmlEscape(routeHref(route, "new-patients")),
    "{{HREF:new-patient-forms}}": htmlEscape(routeHref(route, "new-patient-forms")),
    "{{HREF:insurance-financing}}": htmlEscape(routeHref(route, "insurance-financing")),
    "{{HREF:special-offers}}": htmlEscape(routeHref(route, "special-offers")),
    "{{HREF:patient-resources}}": htmlEscape(routeHref(route, "patient-resources")),
    "{{HREF:emergency-dentistry}}": htmlEscape(routeHref(route, "emergency-dentistry")),
    "{{HREF:reviews}}": htmlEscape(routeHref(route, "reviews")),
    "{{HREF:about}}": htmlEscape(routeHref(route, "about")),
    "{{HREF:contact}}": htmlEscape(routeHref(route, "contact"))
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
    "{{SOCIAL_LINKS}}": renderSocialLinks(),
    "{{LEGAL_LINKS}}": renderLegalLinks(route),
    "{{ASSET_HREF:logo.svg}}": htmlEscape(assetHref(route, "assets/logo.svg")),
    "{{HREF:home}}": htmlEscape(routeHref(route, "home")),
    "{{HREF:facial-aesthetics}}": htmlEscape(routeHref(route, "facial-aesthetics")),
    "{{HREF:services}}": htmlEscape(routeHref(route, "services")),
    "{{HREF:all-services}}": htmlEscape(routeHref(route, "all-services")),
    "{{HREF:restorative-dentistry}}": htmlEscape(routeHref(route, "restorative-dentistry")),
    "{{HREF:dental-implants}}": htmlEscape(routeHref(route, "dental-implants")),
    "{{HREF:same-day-crowns}}": htmlEscape(routeHref(route, "same-day-crowns")),
    "{{HREF:invisalign}}": htmlEscape(routeHref(route, "invisalign")),
    "{{HREF:preventive-care}}": htmlEscape(routeHref(route, "preventive-care")),
    "{{HREF:oral-surgery}}": htmlEscape(routeHref(route, "oral-surgery")),
    "{{HREF:new-patients}}": htmlEscape(routeHref(route, "new-patients")),
    "{{HREF:new-patient-forms}}": htmlEscape(routeHref(route, "new-patient-forms")),
    "{{HREF:insurance-financing}}": htmlEscape(routeHref(route, "insurance-financing")),
    "{{HREF:special-offers}}": htmlEscape(routeHref(route, "special-offers")),
    "{{HREF:patient-resources}}": htmlEscape(routeHref(route, "patient-resources")),
    "{{HREF:emergency-dentistry}}": htmlEscape(routeHref(route, "emergency-dentistry")),
    "{{HREF:reviews}}": htmlEscape(routeHref(route, "reviews")),
    "{{HREF:about}}": htmlEscape(routeHref(route, "about"))
  }, `${route.id} footer`);
  const stickyActions = applyTokens(stickyActionsTemplate, {
    "{{PHONE_HREF}}": `tel:${htmlEscape(config.contact.phone.tel)}`,
    "{{PHONE_DISPLAY}}": htmlEscape(config.contact.phone.display),
    "{{APPOINTMENT_HREF}}": htmlEscape(appointmentHref(route))
  }, `${route.id} sticky actions`);
  return applyTokens(layout, {
    "{{ROUTE_ID}}": htmlEscape(route.id),
    "{{PAGE_TYPE}}": htmlEscape(route.pageType),
    "{{METADATA}}": metadataFor(route),
    "{{SCHEMA}}": renderSchema(route),
    "{{FONT_LINKS}}": '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Jost:wght@300;400;500&family=Cormorant+Garamond:ital@1&display=swap" rel="stylesheet">',
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

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.cpSync(path.join(siteRoot, "assets"), path.join(outputDir, "assets"), { recursive: true });
fs.copyFileSync(path.join(siteRoot, "styles.css"), path.join(outputDir, "styles.css"));
fs.copyFileSync(path.join(siteRoot, "main.js"), path.join(outputDir, "main.js"));

for (const route of enabledRoutes) {
  const destination = path.join(outputDir, route.output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${renderPage(route)}\n`, "utf8");
}

const robots = readText(path.join(siteRoot, "robots.txt"));
fs.writeFileSync(path.join(outputDir, "robots.txt"), robots.replaceAll("{{CANONICAL_BASE_URL}}", canonicalBase), "utf8");
fs.writeFileSync(path.join(outputDir, "sitemap.xml"), renderSitemap(), "utf8");

console.log(`Built ${enabledRoutes.length} static HTML routes into ${outputRelative(outputDir)}`);
console.log(`Sitemap covers ${enabledRoutes.filter((route) => route.indexable).length} indexable routes; ${routes.length - enabledRoutes.length} registry routes remain planned or gated.`);
