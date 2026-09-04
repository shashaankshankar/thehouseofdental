const MAX_BODY_BYTES = 12000;
const WEBHOOK_TOLERANCE_SECONDS = 300;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTACT_IDEMPOTENCY_SCOPE = "website-contact";
const RESEND_WEBHOOK_EVENTS = new Set([
  "email.sent",
  "email.delivered",
  "email.bounced",
  "email.complained",
  "email.failed",
  "email.suppressed"
]);
const MAX_LENGTHS = {
  name: 100,
  phone: 50,
  email: 254,
  newPatient: 10,
  message: 2000
};
const TREATMENT_LABELS = {
  implants: "Dental implants",
  "cerec-crowns": "Same-day CEREC crowns",
  "facial-aesthetics": "Facial aesthetics",
  "smile-makeover": "Smile makeover",
  checkup: "Checkup and cleaning",
  other: "Not sure yet"
};
const RESPONSE_LABELS = { phone: "Phone call", email: "Email" };
const PREFERRED_TIME_LABELS = { morning: "Mornings", afternoon: "Early afternoons", flexible: "Flexible" };
const NOT_PROVIDED = "Not provided";

const REPUTATION_CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=600";
const SITE_VERIFICATION_FILES = new Map([
  ["/google579852270caa3291.html", "google-site-verification: google579852270caa3291.html"]
]);
const SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob: https://winterparkdental.com https://images.unsplash.com https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
};

const redirectToCanonicalHost = (request) => {
  const url = new URL(request.url);
  if (url.hostname !== "www.thehouseofdentalwp.com") return null;
  url.hostname = "thehouseofdentalwp.com";
  return new Response(null, {
    status: 301,
    headers: {
      ...SECURITY_HEADERS,
      Location: url.toString(),
      "Cache-Control": "public, max-age=3600"
    }
  });
};

const jsonResponse = (status, body, { allow = "", cacheControl = "no-store" } = {}) => {
  const headers = new Headers({
    ...SECURITY_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl
  });
  if (allow) headers.set("Allow", allow);
  return new Response(JSON.stringify(body), { status, headers });
};

const textValue = (value) => (typeof value === "string" ? value.trim() : "");

const validUuid = (value) => UUID_PATTERN.test(value) ? value.toLowerCase() : "";

const contactAttemptId = (request) => {
  for (const header of ["idempotency-key", "x-contact-attempt-id"]) {
    const value = validUuid(request.headers.get(header)?.trim() || "");
    if (value) return value;
  }
  return crypto.randomUUID().toLowerCase();
};

const resendContactIdempotencyKey = (attemptId) => `${CONTACT_IDEMPOTENCY_SCOPE}:${attemptId}`;

const hashTechnicalIdentifier = async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const configuredOrigins = (env) => String(env.CONTACT_ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const requestOrigin = (request) => {
  const origin = request.headers.get("origin")?.trim() || "";
  if (origin) return origin;
  const referer = request.headers.get("referer")?.trim() || "";
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^[+()\d.\-\s]{7,50}$/.test(value) && value.replace(/\D/g, "").length >= 7;

const readBody = async (request, maxBytes = MAX_BODY_BYTES) => {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return { tooLarge: true, text: "" };
  if (!request.body) return { tooLarge: false, text: "" };

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { tooLarge: true, text: "" };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { tooLarge: false, text: new TextDecoder().decode(bytes) };
};

const parseBody = (request, text) => {
  if ((request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(text));
};

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[character]));

const structuredLog = (level, event) => {
  const write = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  write(JSON.stringify(event));
};

const deliveryDatabase = (env) => {
  const database = env?.DELIVERY_DB;
  return database && typeof database.prepare === "function" ? database : null;
};

const schedule = async (ctx, promise) => {
  if (typeof ctx?.waitUntil === "function") {
    ctx.waitUntil(promise);
    return;
  }
  await promise;
};

const persistContactCorrelation = async (env, record) => {
  const database = deliveryDatabase(env);
  if (!database || !record.submissionHash) return;
  const clientId = (env && env.CLIENT_ID) || "thehouseofdental";
  try {
    await database.prepare(`
      INSERT INTO delivery_correlations (
        request_id,
        submission_hash,
        client_id,
        resend_message_id,
        provider_status,
        provider_status_code,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(submission_hash) DO UPDATE SET
        request_id = excluded.request_id,
        client_id = excluded.client_id,
        resend_message_id = COALESCE(excluded.resend_message_id, delivery_correlations.resend_message_id),
        provider_status = excluded.provider_status,
        provider_status_code = excluded.provider_status_code,
        updated_at = excluded.updated_at
    `).bind(
      record.requestId,
      record.submissionHash,
      clientId,
      record.resendMessageId,
      record.providerStatus,
      record.providerStatusCode,
      record.createdAt,
      record.updatedAt
    ).run();
  } catch {
    structuredLog("warn", {
      event: "delivery_correlation_persist_failed",
      operation: "contact",
      request_id: record.requestId
    });
  }
};

const safeProviderId = (value) => typeof value === "string" && /^[A-Za-z0-9._:-]{1,200}$/.test(value) ? value : null;
const safeProviderTimestamp = (value) => typeof value === "string" && value.length <= 64 && /^[0-9T:.+Z-]+$/.test(value) ? value : null;

const persistWebhookCorrelation = async (env, record) => {
  const database = deliveryDatabase(env);
  if (!database) return { enabled: false, duplicate: false };
  try {
    const inserted = await database.prepare(`
      INSERT INTO delivery_webhook_events (
        webhook_id,
        event_type,
        resend_message_id,
        provider_event_at,
        received_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(webhook_id) DO NOTHING
    `).bind(
      record.webhookId,
      record.eventType,
      record.resendMessageId,
      record.providerEventAt,
      record.receivedAt
    ).run();
    const duplicate = Number.isFinite(Number(inserted?.meta?.changes)) && Number(inserted.meta.changes) === 0;
    if (!duplicate && record.resendMessageId) {
      await database.prepare(`
        UPDATE delivery_correlations
        SET provider_status = ?,
            last_webhook_id = ?,
            last_webhook_at = ?,
            updated_at = ?
        WHERE resend_message_id = ?
      `).bind(
        record.eventType,
        record.webhookId,
        record.providerEventAt || record.receivedAt,
        record.receivedAt,
        record.resendMessageId
      ).run();
    }
    return { enabled: true, duplicate };
  } catch {
    structuredLog("warn", {
      event: "delivery_correlation_persist_failed",
      operation: "webhook",
      webhook_id: record.webhookId
    });
    return { enabled: true, duplicate: false };
  }
};

const resendErrorCategory = (status, body) => {
  const text = `${body?.name || ""} ${body?.message || ""}`.toLowerCase();
  if (status === 401 || status === 403) return "authentication";
  if (text.includes("domain") || text.includes("sender") || text.includes("from")) return "sender_domain";
  if (text.includes("suppress")) return "suppression";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limit";
  return status >= 500 ? "provider" : "rejected";
};

const decodeBase64 = (value) => {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

const verifyResendWebhook = async (request, payload, secret) => {
  const id = request.headers.get("svix-id") || "";
  const timestamp = request.headers.get("svix-timestamp") || "";
  const signatures = (request.headers.get("svix-signature") || "")
    .split(" ")
    .map((entry) => entry.split(",", 2))
    .filter(([version, signature]) => version === "v1" && signature);
  const timestampNumber = Number(timestamp);
  if (!id || !Number.isInteger(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > WEBHOOK_TOLERANCE_SECONDS) {
    return false;
  }

  const encodedSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = decodeBase64(encodedSecret);
  if (!secretBytes || !signatures.length) return false;
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`)));
  for (const [, encodedSignature] of signatures) {
    const actual = decodeBase64(encodedSignature);
    if (!actual || actual.length !== expected.length) continue;
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index];
    if (difference === 0) return true;
  }
  return false;
};

const contactEmailPayload = (contact, fromEmail, recipientEmail) => {
  const rows = [
    ["Name", contact.name],
    ["Phone", contact.phone || NOT_PROVIDED],
    ["Email", contact.email || NOT_PROVIDED],
    ["New patient", contact.newPatient],
    ["Interested in", TREATMENT_LABELS[contact.treatment] || NOT_PROVIDED],
    ["Preferred follow-up", RESPONSE_LABELS[contact.preferredResponse] || NOT_PROVIDED],
    ["Preferred time", PREFERRED_TIME_LABELS[contact.preferredTime] || NOT_PROVIDED]
  ];
  const message = contact.message || "(No message provided.)";
  const payload = {
    from: fromEmail,
    to: [recipientEmail],
    subject: `Website Appointment Request from ${contact.name}`,
    text: [...rows.map(([label, value]) => `${label}: ${value}`), "", message].join("\n"),
    html: `<h2>Website Appointment Request</h2>${rows.map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("")}<p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`
  };
  if (contact.email) payload.reply_to = [contact.email];
  return payload;
};

const handleContact = async (request, env, ctx) => {
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed." }, { allow: "POST" });

  const bodyResult = await readBody(request);
  if (bodyResult.tooLarge) return jsonResponse(413, { error: "Request is too large." });

  const allowedOrigins = configuredOrigins(env);
  if (!allowedOrigins.length || !allowedOrigins.includes(requestOrigin(request))) {
    return jsonResponse(403, { error: "Request origin is not allowed." });
  }

  const body = parseBody(request, bodyResult.text);
  // Keep this decoy name unrelated to common autofill fields such as "company".
  // The old field is intentionally ignored so cached forms cannot suppress a real request.
  if (textValue(body.form_note)) return jsonResponse(202, { ok: true, accepted: false });

  const contact = {
    name: textValue(body.name),
    phone: textValue(body.phone),
    email: textValue(body.email),
    newPatient: textValue(body["new-patient"]),
    treatment: textValue(body.treatment),
    preferredResponse: textValue(body["preferred-response"]),
    preferredTime: textValue(body["preferred-time"]),
    message: textValue(body.message)
  };

  // A stated follow-up preference makes only that channel mandatory; without
  // one the request must carry both so the office can always reach back.
  const phoneRequired = contact.preferredResponse !== "email";
  const emailRequired = contact.preferredResponse !== "phone";
  const errors = [];
  if (!contact.name || contact.name.length > MAX_LENGTHS.name) errors.push("name");
  if ((phoneRequired || contact.phone) && (!isValidPhone(contact.phone) || contact.phone.length > MAX_LENGTHS.phone)) errors.push("phone");
  if ((emailRequired || contact.email) && (!isValidEmail(contact.email) || contact.email.length > MAX_LENGTHS.email)) errors.push("email");
  if (!["Yes", "No"].includes(contact.newPatient)) errors.push("new-patient");
  if (contact.treatment && !TREATMENT_LABELS[contact.treatment]) errors.push("treatment");
  if (contact.preferredResponse && !RESPONSE_LABELS[contact.preferredResponse]) errors.push("preferred-response");
  if (contact.preferredTime && !PREFERRED_TIME_LABELS[contact.preferredTime]) errors.push("preferred-time");
  if (contact.message.length > MAX_LENGTHS.message) errors.push("message");
  if (errors.length) return jsonResponse(422, { error: "Please review the highlighted fields and try again.", fields: [...new Set(errors)] });

  const resendApiKey = String(env.RESEND_API_KEY || "").trim();
  const fromEmail = String(env.CONTACT_FROM_EMAIL || "").trim();
  const recipientEmail = String(env.CONTACT_RECIPIENT_EMAIL || "").trim();
  if (!resendApiKey || !fromEmail || !recipientEmail) {
    return jsonResponse(503, { error: "Online messages are not configured. Please call the office." });
  }

  const requestId = crypto.randomUUID();
  const attemptId = contactAttemptId(request);
  const submissionHash = await hashTechnicalIdentifier(attemptId).catch(() => "");
  const timestamp = new Date().toISOString();
  const persist = (providerStatus, providerStatusCode, resendMessageId = null) => schedule(ctx, persistContactCorrelation(env, {
    requestId,
    submissionHash,
    resendMessageId: safeProviderId(resendMessageId),
    providerStatus,
    providerStatusCode,
    createdAt: timestamp,
    updatedAt: new Date().toISOString()
  }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": resendContactIdempotencyKey(attemptId),
        "User-Agent": "the-house-of-dental-contact-form"
      },
      body: JSON.stringify(contactEmailPayload(contact, fromEmail, recipientEmail)),
      signal: controller.signal
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      structuredLog("error", {
        event: "contact_email_rejected",
        request_id: requestId,
        provider_status: upstream.status,
        category: resendErrorCategory(upstream.status, result)
      });
      await persist("rejected", upstream.status);
      return jsonResponse(502, { error: "We could not send your message. Please call the office.", request_id: requestId });
    }
    if (typeof result.id !== "string" || !result.id) {
      structuredLog("error", { event: "contact_email_invalid_acceptance", request_id: requestId, provider_status: upstream.status });
      await persist("invalid_acceptance", upstream.status);
      return jsonResponse(502, { error: "We could not send your message. Please call the office.", request_id: requestId });
    }
    await persist("accepted", upstream.status, result.id);
    structuredLog("info", { event: "contact_email_accepted", request_id: requestId, email_id: result.id });
    return jsonResponse(200, { ok: true, accepted: true, message: "Your request was sent. We'll get back to you soon.", request_id: requestId });
  } catch (error) {
    structuredLog("error", {
      event: "contact_email_transport_failure",
      request_id: requestId,
      category: error?.name === "AbortError" ? "timeout" : "network"
    });
    await persist(error?.name === "AbortError" ? "timeout" : "transport_failure", null);
    return jsonResponse(502, { error: "We could not send your message. Please call the office." });
  } finally {
    clearTimeout(timeout);
  }
};

const handleResendWebhook = async (request, env) => {
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed." }, { allow: "POST" });
  const secret = String(env.RESEND_WEBHOOK_SECRET || "").trim();
  if (!secret) return jsonResponse(503, { error: "Webhook is not configured." });

  const bodyResult = await readBody(request);
  if (bodyResult.tooLarge) return jsonResponse(413, { error: "Request is too large." });
  if (!await verifyResendWebhook(request, bodyResult.text, secret)) {
    return jsonResponse(400, { error: "Invalid webhook signature." });
  }

  let event;
  try {
    event = JSON.parse(bodyResult.text);
  } catch {
    return jsonResponse(400, { error: "Invalid webhook payload." });
  }
  if (!RESEND_WEBHOOK_EVENTS.has(event?.type)) return jsonResponse(200, { ok: true });
  const webhookId = safeProviderId(request.headers.get("svix-id"));
  const resendMessageId = safeProviderId(event.data?.email_id);
  const correlation = await persistWebhookCorrelation(env, {
    webhookId,
    eventType: event.type,
    resendMessageId,
    providerEventAt: safeProviderTimestamp(event.data?.created_at || event.created_at),
    receivedAt: new Date().toISOString()
  });
  if (correlation.duplicate) return jsonResponse(200, { ok: true });
  structuredLog(["email.failed", "email.bounced", "email.complained", "email.suppressed"].includes(event.type) ? "warn" : "info", {
    event: "resend_delivery_event",
    event_type: event.type,
    email_id: resendMessageId,
    webhook_id: webhookId
  });
  return jsonResponse(200, { ok: true });
};

const reputationCacheKey = (request) => {
  const url = new URL(request.url);
  url.pathname = "/api/google-reputation";
  url.search = "";
  return new Request(url, { method: "GET" });
};

const cacheResponse = async (cache, key, response, ctx) => {
  if (!cache) return;
  const write = cache.put(key, response.clone()).catch(() => undefined);
  if (ctx?.waitUntil) ctx.waitUntil(write);
  else await write;
};

const handleReputation = async (request, env, ctx) => {
  if (request.method !== "GET") return jsonResponse(405, { error: "Method not allowed." }, { allow: "GET" });

  const cache = globalThis.caches?.default;
  const cacheKey = reputationCacheKey(request);
  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    } catch {
      // A cache miss or local cache failure must not block the upstream request.
    }
  }

  const configuredPlaceId = String(env.GOOGLE_PLACE_ID || "").trim();
  const apiKey = String(env.GOOGLE_PLACES_API_KEY || "").trim();
  if (!configuredPlaceId) return jsonResponse(503, { error: "Google place configuration is incomplete." });
  if (!apiKey) return jsonResponse(503, { error: "Google Places API key is not configured." });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const upstream = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(configuredPlaceId)}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri"
      },
      signal: controller.signal
    });
    if (!upstream.ok) return jsonResponse(502, { error: "Google Places API request failed." });

    const place = await upstream.json();
    const rating = Number(place.rating);
    const reviewCount = Number(place.userRatingCount);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Number.isInteger(reviewCount) || reviewCount < 0) {
      return jsonResponse(502, { error: "Google Places API returned incomplete reputation data." });
    }

    const response = jsonResponse(200, {
      rating,
      review_count: reviewCount,
      googleMapsUri: typeof place.googleMapsUri === "string" ? place.googleMapsUri : null
    }, { cacheControl: REPUTATION_CACHE_CONTROL });
    await cacheResponse(cache, cacheKey, response, ctx);
    return response;
  } catch {
    return jsonResponse(502, { error: "Google Places API is unavailable." });
  } finally {
    clearTimeout(timeout);
  }
};

const handleApi = (request, env, ctx) => {
  const path = new URL(request.url).pathname;
  if (path === "/api/google-reputation") return handleReputation(request, env, ctx);
  if (path === "/api/contact") return handleContact(request, env, ctx);
  if (path === "/api/resend-webhook") return handleResendWebhook(request, env);
  return Promise.resolve(jsonResponse(404, { error: "Not found." }));
};

const assetRequestForPath = (request, env) => {
  return env.ASSETS.fetch(request);
};

export default {
  async fetch(request, env, ctx) {
    const canonicalRedirect = redirectToCanonicalHost(request);
    if (canonicalRedirect) return canonicalRedirect;
    const path = new URL(request.url).pathname;
    if (path === "/api" || path.startsWith("/api/")) return handleApi(request, env, ctx);
    if (SITE_VERIFICATION_FILES.has(path)) {
      return new Response(SITE_VERIFICATION_FILES.get(path), {
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }
    return assetRequestForPath(request, env);
  }
};
