const MAX_BODY_BYTES = 12000;
const MAX_REPORT_BODY_BYTES = 8_000_000;
const MAX_REPORT_ATTACHMENT_BASE64 = 7_000_000;
const MAX_LENGTHS = {
  name: 100,
  phone: 50,
  email: 254,
  newPatient: 10,
  message: 2000
};

const REPUTATION_CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=600";
const SITE_VERIFICATION_FILES = new Map([
  ["/google579852270caa3291.html", "google-site-verification: google579852270caa3291.html"]
]);
const SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob: https://winterparkdental.com https://images.unsplash.com https://www.google-analytics.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
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

const constantTimeEqual = async (left, right) => {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right))
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
};

const validBase64 = (value) => typeof value === "string"
  && value.length > 0
  && value.length <= MAX_REPORT_ATTACHMENT_BASE64
  && value.length % 4 === 0
  && /^[A-Za-z0-9+/]+={0,2}$/.test(value);

const handleReportEmail = async (request, env) => {
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed." }, { allow: "POST" });

  const relayToken = String(env.REPORT_RELAY_TOKEN || "").trim();
  const authorization = request.headers.get("authorization") || "";
  if (relayToken.length < 32 || !await constantTimeEqual(authorization, `Bearer ${relayToken}`)) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  const idempotencyKey = String(request.headers.get("idempotency-key") || "").trim();
  if (!contentType.includes("application/json") || !/^[A-Za-z0-9:_-]{8,200}$/.test(idempotencyKey)) {
    return jsonResponse(422, { error: "Invalid report request." });
  }

  const bodyResult = await readBody(request, MAX_REPORT_BODY_BYTES);
  if (bodyResult.tooLarge) return jsonResponse(413, { error: "Request is too large." });
  const body = parseBody(request, bodyResult.text);
  const recipient = String(env.REPORT_RELAY_RECIPIENT || "").trim().toLowerCase();
  const sender = String(env.CONTACT_FROM_EMAIL || "").trim();
  const resendApiKey = String(env.RESEND_API_KEY || "").trim();
  const recipients = Array.isArray(body.to) ? body.to : [];
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];
  const attachment = attachments[0] || {};
  const subject = textValue(body.subject);
  const html = typeof body.html === "string" ? body.html : "";
  const validPayload = isValidEmail(recipient)
    && recipients.length === 1
    && textValue(recipients[0]).toLowerCase() === recipient
    && subject.length > 0
    && subject.length <= 200
    && html.length > 0
    && html.length <= 100_000
    && attachments.length === 1
    && /^[A-Za-z0-9_.-]{1,100}\.pdf$/.test(textValue(attachment.filename))
    && validBase64(attachment.content);
  if (!resendApiKey || !isValidEmail(sender) || !validPayload) {
    return jsonResponse(422, { error: "Invalid report request." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "User-Agent": "the-house-of-dental-report-relay"
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject,
        html,
        attachments: [{ filename: textValue(attachment.filename), content: attachment.content }]
      }),
      signal: controller.signal
    });
    if (!upstream.ok) return jsonResponse(502, { error: "Report delivery failed." });
    const result = await upstream.json().catch(() => ({}));
    if (typeof result.id !== "string" || !result.id) return jsonResponse(502, { error: "Report delivery failed." });
    return jsonResponse(200, { id: result.id });
  } catch {
    return jsonResponse(502, { error: "Report delivery failed." });
  } finally {
    clearTimeout(timeout);
  }
};

const handleContact = async (request, env) => {
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed." }, { allow: "POST" });

  const bodyResult = await readBody(request);
  if (bodyResult.tooLarge) return jsonResponse(413, { error: "Request is too large." });

  const allowedOrigins = configuredOrigins(env);
  if (!allowedOrigins.length || !allowedOrigins.includes(requestOrigin(request))) {
    return jsonResponse(403, { error: "Request origin is not allowed." });
  }

  const body = parseBody(request, bodyResult.text);
  if (textValue(body.company)) return jsonResponse(202, { ok: true });

  const contact = {
    name: textValue(body.name),
    phone: textValue(body.phone),
    email: textValue(body.email),
    newPatient: textValue(body["new-patient"]),
    message: textValue(body.message)
  };

  const errors = [];
  if (!contact.name || contact.name.length > MAX_LENGTHS.name) errors.push("name");
  if (!isValidPhone(contact.phone) || contact.phone.length > MAX_LENGTHS.phone) errors.push("phone");
  if (!isValidEmail(contact.email) || contact.email.length > MAX_LENGTHS.email) errors.push("email");
  if (!["Yes", "No"].includes(contact.newPatient)) errors.push("new-patient");
  if (contact.message.length > MAX_LENGTHS.message) errors.push("message");
  if (errors.length) return jsonResponse(422, { error: "Please review the highlighted fields and try again." });

  const resendApiKey = String(env.RESEND_API_KEY || "").trim();
  const fromEmail = String(env.CONTACT_FROM_EMAIL || "").trim();
  const recipientEmail = String(env.CONTACT_RECIPIENT_EMAIL || "").trim();
  if (!resendApiKey || !fromEmail || !recipientEmail) {
    return jsonResponse(503, { error: "Online messages are not configured. Please call the office." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "the-house-of-dental-contact-form"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        reply_to: [contact.email],
        subject: `Website contact message from ${contact.name}`,
        text: [
          `Name: ${contact.name}`,
          `Phone: ${contact.phone}`,
          `Email: ${contact.email}`,
          `New patient: ${contact.newPatient}`,
          "",
          contact.message || "(No message provided.)"
        ].join("\n"),
        html: `<h2>Website contact message</h2><p><strong>Name:</strong> ${escapeHtml(contact.name)}</p><p><strong>Phone:</strong> ${escapeHtml(contact.phone)}</p><p><strong>Email:</strong> ${escapeHtml(contact.email)}</p><p><strong>New patient:</strong> ${escapeHtml(contact.newPatient)}</p><p><strong>Message:</strong></p><p>${escapeHtml(contact.message || "(No message provided.)").replace(/\n/g, "<br>")}</p>`
      }),
      signal: controller.signal
    });
    if (!upstream.ok) return jsonResponse(502, { error: "We could not send your message. Please call the office." });
    return jsonResponse(200, { ok: true, message: "Your message was sent. We'll get back to you soon." });
  } catch {
    return jsonResponse(502, { error: "We could not send your message. Please call the office." });
  } finally {
    clearTimeout(timeout);
  }
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
  if (path === "/api/contact") return handleContact(request, env);
  if (path === "/api/report-email") return handleReportEmail(request, env);
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
