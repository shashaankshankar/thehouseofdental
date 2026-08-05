#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(projectRoot, "the-house-of-dental-site");
const outputRoot = path.resolve(projectRoot, process.env.SITE_OUTPUT || "dist");
const evidenceRoot = path.join(projectRoot, "docs", "evidence", "phase-9");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const readText = (filePath) => fs.readFileSync(filePath, "utf8");
const config = readJson(path.join(siteRoot, "config", "site.json"));
const routes = readJson(path.join(siteRoot, "config", "routes.json"));
const measurement = readJson(path.join(siteRoot, "data", "measurement.json"));
const campaignData = readJson(path.join(siteRoot, "data", "campaign-pages.json"));
const canonicalBase = String(config.canonical.baseUrl).replace(/\/+$/, "");
const routeById = new Map(routes.map((route) => [route.id, route]));
const enabledRoutes = routes.filter((route) => route.enabled);
const campaignRoutes = enabledRoutes.filter((route) => route.campaignPage);
const errors = [];
const addError = (message) => errors.push(message);
const exists = (filePath) => fs.existsSync(filePath);
const canonicalFor = (route) => {
  const target = route.canonicalTargetId ? routeById.get(route.canonicalTargetId) : route;
  const canonicalPath = target?.canonicalPath || route.canonicalPath;
  return `${canonicalBase}${canonicalPath === "/" ? "/" : canonicalPath}`;
};
const ownUrlFor = (route) => `${canonicalBase}${route.canonicalPath === "/" ? "/" : route.canonicalPath}`;
const htmlFor = (route) => readText(path.join(outputRoot, route.output));
const parseAttributeList = (html, attribute) => [...html.matchAll(new RegExp(`${attribute}=["']([^"']+)["']`, "gi"))]
  .flatMap((match) => match[1].split(",").map((value) => value.trim()).filter(Boolean));
const allEventNames = new Set([...measurement.conversionEvents, ...(measurement.diagnosticEvents || [])]);
const successNames = new Set(["appointment_submit_success", "contact_submit_success", "offer_claim", "referral_submit_success"]);

if (!exists(outputRoot)) addError(`Missing generated output directory: ${outputRoot}`);
if (config.integrations?.measurement?.dataLayer?.enabled !== false) addError("Nonessential measurement must remain disabled until approved vendor and consent configuration exists");
if (config.integrations?.measurement?.ga4?.measurementId !== null) addError("GA4 measurementId must remain null without an approved ID");
if (config.integrations?.measurement?.tagManager?.containerId !== null) addError("Tag-manager containerId must remain null without an approved ID");
if (config.integrations?.measurement?.callTracking?.approved !== false || config.integrations?.measurement?.callTracking?.trackingNumber !== null) addError("Call tracking must remain unconfigured and preserve the canonical phone number");
if (config.integrations?.measurement?.crmAttribution?.approved !== false || config.integrations?.measurement?.crmAttribution?.endpoint !== null) addError("CRM attribution must remain unconfigured without an approved destination");
if (config.integrations?.measurement?.consent?.vendor !== null || !/no_vendor|disabled/i.test(config.integrations?.measurement?.consent?.status || "")) addError("Consent status must document the no-vendor/nonessential-disabled state");
if (measurement.allowedFields.join(",") !== "event,page_type,service_slug,cta_location,conversion_type,campaign_source,state") addError("Measurement allowedFields changed from the approved Phase 9 contract");
for (const eventName of [
  "click_to_call", "appointment_click", "form_start", "appointment_submit_success", "contact_submit_success",
  "directions_click", "financing_click", "offer_claim", "referral_submit_success", "implant_inquiry",
  "facial_aesthetics_inquiry", "quietnite_inquiry", "emergency_call"
]) if (!measurement.conversionEvents.includes(eventName)) addError(`Missing required event contract entry: ${eventName}`);

const mainJs = readText(path.join(siteRoot, "main.js"));
const eventBuilderStart = mainJs.indexOf("const emitMeasurementEvent");
const eventBuilderEnd = mainJs.indexOf("const resetMeasurement");
const eventBuilder = mainJs.slice(eventBuilderStart, eventBuilderEnd);
for (const prohibited of measurement.prohibitedPayloadKeys) {
  if (eventBuilder.includes(`:${prohibited}`) || eventBuilder.includes(`"${prohibited}"`)) addError(`Prohibited payload key appears in the runtime event builder: ${prohibited}`);
}
if (!mainJs.includes("window.sessionStorage")) addError("Attribution/dedupe storage must use sessionStorage");
if (mainJs.includes("window.localStorage")) addError("Attribution/dedupe storage must not use localStorage");
if (!mainJs.includes("document.referrer") || !mainJs.includes("new URL(value).hostname")) addError("Referrer handling must reduce the value to a hostname");
if (!mainJs.includes("measurementConfig.crmMappingEnabled !== true")) addError("CRM attribution must remain explicitly gated");
if (!mainJs.includes("if (result?.ok)")) addError("Form success handling must be downstream of confirmed handler success");
if (!mainJs.includes("successEventNames.has(eventName)")) addError("Click hooks must prevent success-event names from firing on button clicks");
if (!mainJs.includes("hod_debug")) addError("Debug/test mode query parameter is missing");
if (/(?:googletagmanager|gtag\s*\(|fbq\s*\(|hotjar|fullstory|clarity\s*=|segment\.com)/i.test(mainJs)) addError("Unapproved vendor or ad/session-recording runtime found in main.js");

const sitemap = exists(path.join(outputRoot, "sitemap.xml")) ? readText(path.join(outputRoot, "sitemap.xml")) : "";
const campaignReport = campaignRoutes.map((route) => {
  const html = htmlFor(route);
  const campaign = campaignData.campaigns[route.campaignPage];
  const ownUrl = ownUrlFor(route);
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] || "";
  const events = parseAttributeList(html, "data-hod-events").concat(parseAttributeList(html, "data-hod-event"));
  const forbiddenClickSuccessEvents = events.filter((eventName) => successNames.has(eventName));
  const blockedInquiryEvents = events.filter((eventName) => ["quietnite_inquiry", "facial_aesthetics_inquiry"].includes(eventName) && campaign.status !== "ready_for_named_approval");
  if (!campaign) addError(`Missing campaign data for ${route.id}`);
  if (!html.includes('data-page-type="campaign"')) addError(`${route.id} does not render as a campaign page`);
  if (!html.includes('meta name="robots" content="noindex, nofollow"')) addError(`${route.id} must be noindex`);
  if (sitemap.includes(ownUrl)) addError(`${route.id} is present in the sitemap despite being noindex`);
  if (canonical !== canonicalFor(route)) addError(`${route.id} canonical does not match its governed canonical decision`);
  for (const eventName of events) if (!allEventNames.has(eventName)) addError(`${route.id} contains an event outside the contract: ${eventName}`);
  if (forbiddenClickSuccessEvents.length) addError(`${route.id} attempts to fire a success event from a click: ${forbiddenClickSuccessEvents.join(", ")}`);
  if (blockedInquiryEvents.length) addError(`${route.id} exposes an inquiry event before approval: ${blockedInquiryEvents.join(", ")}`);
  for (const requiredText of ["Traffic source", "Search/ad intent", "Landing-page ID", "Confirmed-success event", "Approval gate", "Limitations and boundaries", "Questions patients ask"]) {
    if (!html.includes(requiredText)) addError(`${route.id} is missing campaign governance/content section: ${requiredText}`);
  }
  return {
    id: route.id,
    route: route.canonicalPath,
    output: route.output,
    status: campaign.status,
    indexable: route.indexable,
    robots: "noindex, nofollow",
    canonical,
    canonicalTargetId: route.canonicalTargetId || null,
    landingPageId: campaign.landingPageId,
    trafficSource: campaign.trafficSource,
    searchIntent: campaign.searchIntent,
    conversionEvent: campaign.conversionEvent,
    successEvent: campaign.successEvent,
    thankYouRouteId: campaign.thankYouRouteId,
    clickEvents: events,
    ownUrlInSitemap: sitemap.includes(ownUrl),
    approvalGate: campaign.approvalGate
  };
});

if (campaignRoutes.length !== Object.keys(campaignData.campaigns).length) addError("Route registry and campaign data counts do not match");
const publicOutputs = enabledRoutes.filter((route) => !route.campaignPage && route.indexable);
for (const route of publicOutputs) {
  const html = htmlFor(route);
  if (/href=["'][^"']*campaigns\//i.test(html)) addError(`${route.id} links to a Phase 9 campaign variant from a public/indexable surface`);
}
const generatedHtml = enabledRoutes.map(htmlFor).join("\n");
if (/(?:googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|hotjar\.com|fullstory\.com|clarity\.ms)/i.test(generatedHtml)) addError("Generated output includes an unapproved analytics/ad/session-recording vendor");
if (/<script[^>]+src=["'][^"']*(?:gtag|analytics|tag-manager|pixel)[^"']*/i.test(generatedHtml)) addError("Generated output includes an unapproved tracking script");
if (generatedHtml.includes("data-hod-measurement-config") && !generatedHtml.includes('"enabled": false')) addError("Generated measurement config does not remain disabled");

fs.mkdirSync(evidenceRoot, { recursive: true });
fs.writeFileSync(path.join(evidenceRoot, "phase-9-contract-report.json"), `${JSON.stringify({
  version: measurement.version,
  generatedAt: new Date().toISOString(),
  configuredIntegrations: {
    dataLayerEnabled: config.integrations.measurement.dataLayer.enabled,
    ga4MeasurementId: config.integrations.measurement.ga4.measurementId,
    tagManagerContainerId: config.integrations.measurement.tagManager.containerId,
    callTrackingApproved: config.integrations.measurement.callTracking.approved,
    crmAttributionApproved: config.integrations.measurement.crmAttribution.approved,
    consentVendor: config.integrations.measurement.consent.vendor,
    consentStatus: config.integrations.measurement.consent.status
  },
  allowedFields: measurement.allowedFields,
  conversionEvents: measurement.conversionEvents,
  diagnosticEvents: measurement.diagnosticEvents,
  attribution: measurement.attribution,
  prohibitedPayloadKeys: measurement.prohibitedPayloadKeys,
  checks: {
    successRequiresConfirmedBackend: mainJs.includes("if (result?.ok)"),
    clickHooksBlockSuccessEvents: mainJs.includes("successEventNames.has(eventName)"),
    sessionOnlyStorage: mainJs.includes("window.sessionStorage") && !mainJs.includes("window.localStorage"),
    vendorScriptsAbsent: !/(?:googletagmanager|google-analytics|connect\.facebook\.net|hotjar|fullstory|clarity\.ms)/i.test(generatedHtml)
  }
}, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(evidenceRoot, "phase-9-campaign-indexability.json"), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalVariants: campaignReport.length,
  sitemapIndexableRouteCount: (sitemap.match(/<loc>/g) || []).length,
  variants: campaignReport
}, null, 2)}\n`, "utf8");

console.log(`Phase 9 checked ${campaignReport.length} campaign variants, the privacy-safe event contract, integration gates, and generated vendor surface.`);
if (errors.length) {
  [...new Set(errors)].forEach((error) => console.error(`ERROR: ${error}`));
  console.error(`Phase 9 validation failed with ${new Set(errors).size} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`Phase 9 validation passed; nonessential tracking remains disabled and campaign variants remain local/noindex.`);
}
