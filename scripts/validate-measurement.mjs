import { mkdir, readFile, writeFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const errors = [];
const expectedEvents = ["form_start", "form_submit", "generate_lead", "phone_click", "email_click", "appointment_request", "cta_click"];
const validStatuses = new Set(["approved", "requires_review", "prohibited"]);

const siteMeasurement = await readJson("measurement/site.json");
const routes = await readJson("measurement/eligibility/routes.json");
const site = await readJson("src/data/site.json");
const blog = await readJson("src/data/blog.json");
const contract = await readJson("measurement/contracts/local_service_v1/contract.json");
const events = await readJson("measurement/contracts/local_service_v1/events.json");
const parameters = await readJson("measurement/contracts/local_service_v1/parameters.json");
const mappings = await readJson("measurement/contracts/local_service_v1/mappings.json");
const validation = await readJson("measurement/contracts/local_service_v1/validation.json");
const evidenceChecks = [];
const check = (name, passed, detail) => {
  evidenceChecks.push({ name, passed, detail });
  if (!passed) errors.push(`${name}: ${detail}`);
};

if (siteMeasurement.version !== contract.version || siteMeasurement.version !== routes.version) errors.push("site, contract, and route policy versions must match");
if (siteMeasurement.deployment?.status !== "live") errors.push("site deployment status must record the live production state");
if (siteMeasurement.industry?.classification !== "healthcare") errors.push("site industry classification must be healthcare");
if (siteMeasurement.ga4?.enabled !== false && !/^G-[A-Z0-9]+$/i.test(siteMeasurement.ga4?.measurementId || "")) errors.push("enabled GA4 requires a valid Measurement ID");
if (siteMeasurement.ga4?.enabled === true && siteMeasurement.ga4?.collectionStatus !== "live") errors.push("enabled production GA4 must record live collection status");
if (siteMeasurement.ga4?.enabled === true && !Object.values(routes.routes || {}).includes("approved")) errors.push("enabled GA4 requires at least one approved route");
if (!siteMeasurement.ga4?.connection?.scope?.endsWith("analytics.readonly")) errors.push("site connection must use analytics.readonly");
if (routes.default !== "prohibited") errors.push("unknown routes must be prohibited");
for (const [path, status] of Object.entries(routes.routes || {})) {
  if (!path.startsWith("/") || !validStatuses.has(status)) errors.push(`invalid route eligibility: ${path}`);
}
const expectedSiteRoutes = [
  ...Object.values(site.pages).filter((page) => page.path).map((page) => page.path),
  ...blog.articles.map((article) => `/blog/${article.slug}`)
];
const configuredSiteRoutes = Object.keys(routes.routes || {});
if (new Set(expectedSiteRoutes).size !== expectedSiteRoutes.length) errors.push("site metadata contains duplicate clean page paths");
if (new Set(configuredSiteRoutes).size !== configuredSiteRoutes.length) errors.push("measurement route policy contains duplicate paths");
if (expectedSiteRoutes.some((path) => path.includes(".html")) || configuredSiteRoutes.some((path) => path.includes(".html"))) {
  errors.push("clean route metadata and measurement policy must not contain .html paths");
}
const routeSetsMatch = expectedSiteRoutes.length === configuredSiteRoutes.length
  && expectedSiteRoutes.every((path) => configuredSiteRoutes.includes(path));
check("route_metadata_sync", routeSetsMatch, "approved route policy matches the clean paths declared in src/data/site.json");
for (const path of expectedSiteRoutes) if (routes.routes[path] !== "approved") errors.push(`site route must be approved: ${path}`);
for (const event of expectedEvents) {
  if (!events.events?.some((item) => item.name === event)) errors.push(`missing contract event: ${event}`);
  if (!parameters.allowed?.event?.includes(event)) errors.push(`event is not allowed by parameters: ${event}`);
}
if (siteMeasurement.industry?.analyticsEligibility !== "approved") errors.push("healthcare analytics eligibility approval is required");
if (contract.status !== "approved" || !contract.approvedBy || !contract.approvedAt) errors.push("measurement contract approval record is required");
if (validation.approval?.status !== "approved" || !validation.approval?.approvedBy) errors.push("privacy and consent approval record is required");
if (events.events?.find((event) => event.name === "generate_lead")?.status !== "implemented") errors.push("approved generate_lead semantics must be implemented");
if (!mappings.mappings?.some((item) => item.event === "generate_lead")) errors.push("approved generate_lead mapping is required");
if (!validation.requiredChecks?.length) errors.push("measurement validation checks are required");

const allowedEvents = new Set(parameters.allowed.event);
check("allowed_event_matrix", expectedEvents.every((event) => allowedEvents.has(event)), "all seven contract events are allowlisted");
check("unknown_event_rejected", !allowedEvents.has("unknown_event"), "unknown events are absent from the allowlist");
check("consent_default_denied", siteMeasurement.consent.mode === "advanced" && siteMeasurement.consent.version === 2, "advanced Consent Mode v2 is configured");
check("unknown_route_fail_closed", routes.default === "prohibited", "unknown routes resolve to prohibited");
check("approved_routes_allowlisted", Object.values(routes.routes).every((status) => status === "approved"), "all configured production site routes are approved");
check("approved_route_coverage", Object.values(routes.routes).some((status) => status === "approved"), "the production site has at least one approved route");
check("query_string_not_allowed", parameters.prohibited.includes("URL query parameters"), "query parameters are prohibited payload sources");
check("fragment_not_allowed", parameters.prohibited.includes("URL query parameters"), "fragment/query URL data is not an analytics payload");
check("direct_identifiers_not_allowed", ["name", "email", "personal phone number", "form contents"].every((item) => parameters.prohibited.includes(item)), "direct identifiers and form contents are prohibited");
check("lead_boundary", events.events.find((event) => event.name === "generate_lead")?.status === "implemented" && mappings.mappings.some((item) => item.event === "generate_lead"), "generate_lead fires only after the approved validated request handoff");

const evidencePath = "measurement/evidence/validation.json";
const evidence = {
  evidenceVersion: 1,
  status: errors.length ? "failed" : "validated_locally",
  approvalStatus: "approved",
  deploymentStatus: siteMeasurement.deployment.status,
  measurementIdStatus: siteMeasurement.ga4.measurementId ? "provided" : "not_provided",
  ga4RuntimeStatus: siteMeasurement.ga4.enabled ? "enabled_on_live_approved_routes" : "disabled",
  checks: evidenceChecks,
  manualChecksRemaining: ["GA4 DebugView event receipt for each applicable event", "production appointment inbox delivery"],
  notes: "Governance was approved by the workspace owner. This record proves local policy and build validation; DebugView receipt and production inbox delivery remain independently observable evidence."
};

let previousEvidence = null;
try {
  previousEvidence = await readJson(evidencePath);
} catch {
  // The first validation run creates the evidence file.
}

const { capturedAt: previousCapturedAt, ...previousEvidenceWithoutTimestamp } = previousEvidence || {};
const evidenceUnchanged = JSON.stringify(previousEvidenceWithoutTimestamp) === JSON.stringify(evidence);
const nextEvidence = {
  evidenceVersion: evidence.evidenceVersion,
  capturedAt: evidenceUnchanged && previousCapturedAt ? previousCapturedAt : new Date().toISOString(),
  ...Object.fromEntries(Object.entries(evidence).filter(([key]) => key !== "evidenceVersion"))
};

await mkdir("measurement/evidence", { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(nextEvidence, null, 2)}\n`);

if (errors.length) {
  for (const error of errors) console.error(`Measurement validation failed: ${error}`);
  process.exit(1);
}

console.log("Validated live-site configuration, route eligibility, and local_service_v1 measurement contract.");
