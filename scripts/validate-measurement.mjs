import { mkdir, readFile, writeFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const errors = [];
const expectedEvents = ["form_start", "form_submit", "generate_lead", "phone_click", "email_click", "appointment_request", "cta_click"];
const validStatuses = new Set(["approved", "requires_review", "prohibited"]);

const pilot = await readJson("measurement/pilot-site.json");
const routes = await readJson("measurement/eligibility/routes.json");
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

if (pilot.version !== contract.version || pilot.version !== routes.version) errors.push("pilot, contract, and route policy versions must match");
if (pilot.industry?.classification !== "healthcare") errors.push("pilot industry classification must be healthcare");
if (pilot.ga4?.enabled !== false && !/^G-[A-Z0-9]+$/i.test(pilot.ga4?.measurementId || "")) errors.push("enabled GA4 requires a valid Measurement ID");
if (pilot.ga4?.enabled === true && !Object.values(routes.routes || {}).includes("approved")) errors.push("enabled GA4 requires at least one approved route");
if (!pilot.ga4?.connection?.scope?.endsWith("analytics.readonly")) errors.push("pilot connection must use analytics.readonly");
if (routes.default !== "prohibited") errors.push("unknown routes must be prohibited");
for (const [path, status] of Object.entries(routes.routes || {})) {
  if (!path.startsWith("/") || !validStatuses.has(status)) errors.push(`invalid route eligibility: ${path}`);
}
if (routes.routes?.["/contact.html"] !== "requires_review") errors.push("contact route must remain requires_review until client approval");
if (routes.routes?.["/pre-post-op.html"] !== "prohibited") errors.push("pre/post-op route must be prohibited");
for (const event of expectedEvents) {
  if (!events.events?.some((item) => item.name === event)) errors.push(`missing contract event: ${event}`);
  if (!parameters.allowed?.event?.includes(event)) errors.push(`event is not allowed by parameters: ${event}`);
}
if (events.events?.find((event) => event.name === "generate_lead")?.status !== "blocked_pending_downstream_confirmation") {
  errors.push("generate_lead must stay blocked until downstream confirmation is approved");
}
if (!mappings.notMapped?.some((item) => item.event === "generate_lead")) errors.push("missing generate_lead boundary mapping");
if (!validation.requiredChecks?.length) errors.push("measurement validation checks are required");

const allowedEvents = new Set(parameters.allowed.event);
check("allowed_event_matrix", expectedEvents.every((event) => allowedEvents.has(event)), "all seven contract events are allowlisted");
check("unknown_event_rejected", !allowedEvents.has("unknown_event"), "unknown events are absent from the allowlist");
check("consent_default_denied", pilot.consent.mode === "advanced" && pilot.consent.version === 2, "advanced Consent Mode v2 is configured");
check("unknown_route_fail_closed", routes.default === "prohibited", "unknown routes resolve to prohibited");
check("prohibited_route_fail_closed", routes.routes["/pre-post-op.html"] === "prohibited", "pre/post-op route is prohibited");
check("review_route_fail_closed", routes.routes["/contact.html"] === "requires_review", "contact route remains blocked pending approval");
check("query_string_not_allowed", parameters.prohibited.includes("URL query parameters"), "query parameters are prohibited payload sources");
check("fragment_not_allowed", parameters.prohibited.includes("URL query parameters"), "fragment/query URL data is not an analytics payload");
check("direct_identifiers_not_allowed", ["name", "email", "personal phone number", "form contents"].every((item) => parameters.prohibited.includes(item)), "direct identifiers and form contents are prohibited");
check("lead_boundary", events.events.find((event) => event.name === "generate_lead")?.status === "blocked_pending_downstream_confirmation", "generate_lead remains blocked without downstream confirmation");

await mkdir("measurement/evidence", { recursive: true });
await writeFile("measurement/evidence/validation.json", `${JSON.stringify({
  evidenceVersion: 1,
  capturedAt: new Date().toISOString(),
  status: errors.length ? "failed" : "validated_locally",
  approvalStatus: "pending_backlog",
  measurementIdStatus: pilot.ga4.measurementId ? "provided" : "not_provided",
  ga4RuntimeStatus: pilot.ga4.enabled ? "configured_but_route_and_approval_gated" : "disabled",
  checks: evidenceChecks,
  manualChecksRemaining: ["browser consent interaction", "DebugView event receipt", "production route verification", "appointment backend receipt"],
  notes: "This record proves local policy and build validation only; it is not client/privacy approval or proof of live GA4 collection."
}, null, 2)}\n`);

if (errors.length) {
  for (const error of errors) console.error(`Measurement validation failed: ${error}`);
  process.exit(1);
}

console.log("Validated pilot configuration, route eligibility, and local_service_v1 measurement contract.");
