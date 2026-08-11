const MAX_BODY_BYTES = 12000;
const MAX_LENGTHS = {
  name: 100,
  phone: 50,
  email: 254,
  newPatient: 10,
  message: 2000
};

const REPUTATION_CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=600";
const SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob: https://winterparkdental.com https://images.unsplash.com https://www.google-analytics.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
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

const configuredOrigins = (env) => String(env.APPOINTMENT_ALLOWED_ORIGINS || "")
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

const readBody = async (request) => {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return { tooLarge: true, text: "" };
  if (!request.body) return { tooLarge: false, text: "" };

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
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

const handleAppointment = async (request, env) => {
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed." }, { allow: "POST" });

  const bodyResult = await readBody(request);
  if (bodyResult.tooLarge) return jsonResponse(413, { error: "Request is too large." });

  const allowedOrigins = configuredOrigins(env);
  if (!allowedOrigins.length || !allowedOrigins.includes(requestOrigin(request))) {
    return jsonResponse(403, { error: "Request origin is not allowed." });
  }

  const body = parseBody(request, bodyResult.text);
  if (textValue(body.company)) return jsonResponse(202, { ok: true });

  const appointment = {
    name: textValue(body.name),
    phone: textValue(body.phone),
    email: textValue(body.email),
    newPatient: textValue(body["new-patient"]),
    message: textValue(body.message)
  };

  const errors = [];
  if (!appointment.name || appointment.name.length > MAX_LENGTHS.name) errors.push("name");
  if (!isValidPhone(appointment.phone) || appointment.phone.length > MAX_LENGTHS.phone) errors.push("phone");
  if (!isValidEmail(appointment.email) || appointment.email.length > MAX_LENGTHS.email) errors.push("email");
  if (!["Yes", "No"].includes(appointment.newPatient)) errors.push("new-patient");
  if (appointment.message.length > MAX_LENGTHS.message) errors.push("message");
  if (errors.length) return jsonResponse(422, { error: "Please review the highlighted fields and try again." });

  const backendUrl = String(env.APPOINTMENT_BACKEND_URL || "").trim();
  const backendToken = String(env.APPOINTMENT_BACKEND_TOKEN || "").trim();
  if (!backendUrl || !backendToken) {
    return jsonResponse(503, { error: "Online messages are not configured. Please call the office." });
  }

  let destination;
  try {
    destination = new URL(backendUrl);
  } catch {
    return jsonResponse(503, { error: "Online messages are not configured. Please call the office." });
  }
  if (destination.protocol !== "https:") {
    return jsonResponse(503, { error: "Online messages are not configured. Please call the office." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch(destination, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${backendToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: "the-house-of-dental-website",
        submitted_at: new Date().toISOString(),
        appointment
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
  if (path === "/api/appointment") return handleAppointment(request, env);
  return Promise.resolve(jsonResponse(404, { error: "Not found." }));
};

const assetRequestForPath = (request, env) => {
  const url = new URL(request.url);
  const normalizedPath = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  if (request.method !== "GET" && request.method !== "HEAD") return env.ASSETS.fetch(request);
  if (normalizedPath === "/") {
    url.pathname = "/index.html";
    return env.ASSETS.fetch(new Request(url, request));
  }
  if (/^\/[a-z0-9-]+$/i.test(normalizedPath) && normalizedPath !== "/404") {
    url.pathname = `${normalizedPath}.html`;
    return env.ASSETS.fetch(new Request(url, request));
  }
  return env.ASSETS.fetch(request);
};

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === "/api" || path.startsWith("/api/")) return handleApi(request, env, ctx);
    return assetRequestForPath(request, env);
  }
};
