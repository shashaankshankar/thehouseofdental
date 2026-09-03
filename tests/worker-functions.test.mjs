import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.mjs";

const origin = "https://thehouseofdentalwp.com";
const validFields = {
  name: "Test Patient",
  phone: "(407) 678-1400",
  email: "test@example.com",
  "new-patient": "Yes",
  message: ""
};

const requestFor = (path, init = {}, host = origin) => new Request(`${host}${path}`, init);
const json = (response) => response.json();
const context = () => {
  const pending = [];
  return {
    waitUntil(promise) { pending.push(promise); },
    async flush() { await Promise.all(pending); }
  };
};
const assets = (handler = async () => new Response("asset", { status: 200 })) => ({ fetch: handler });
const webhookSecret = `whsec_${Buffer.from("test-webhook-secret").toString("base64")}`;
const signedWebhookHeaders = async (payload, { id = "msg_test_webhook", timestamp = Math.floor(Date.now() / 1000) } = {}) => {
  const key = await crypto.subtle.importKey(
    "raw",
    Buffer.from(webhookSecret.slice(6), "base64"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`))).toString("base64");
  return { "svix-id": id, "svix-timestamp": String(timestamp), "svix-signature": `v1,${signature}` };
};

test("unknown API paths return JSON 404 and endpoint methods return 405 with Allow", async () => {
  const env = { ASSETS: assets() };
  const missing = await worker.fetch(requestFor("/api/unknown"), env, context());
  assert.equal(missing.status, 404);
  assert.deepEqual(await json(missing), { error: "Not found." });
  assert.match(missing.headers.get("content-type"), /application\/json/);

  const reputationMethod = await worker.fetch(requestFor("/api/google-reputation", { method: "POST" }), env, context());
  assert.equal(reputationMethod.status, 405);
  assert.equal(reputationMethod.headers.get("allow"), "GET");

  const contactMethod = await worker.fetch(requestFor("/api/contact"), env, context());
  assert.equal(contactMethod.status, 405);
  assert.equal(contactMethod.headers.get("allow"), "POST");

  const webhookMethod = await worker.fetch(requestFor("/api/resend-webhook"), env, context());
  assert.equal(webhookMethod.status, 405);
  assert.equal(webhookMethod.headers.get("allow"), "POST");
});

test("clean page routes resolve through the Static Assets binding", async () => {
  const requests = [];
  const env = { ASSETS: assets(async (request) => {
    requests.push(new URL(request.url).pathname);
    return new Response("page", { status: 200 });
  }) };
  const response = await worker.fetch(requestFor("/about"), env, context());
  assert.equal(response.status, 200);
  assert.deepEqual(requests, ["/about"]);
});

test("Google site verification is served directly without invoking static assets", async () => {
  let assetRequests = 0;
  const env = { ASSETS: assets(async () => {
    assetRequests += 1;
    return new Response("unexpected asset");
  }) };
  const filename = "google579852270caa3291.html";
  const response = await worker.fetch(requestFor(`/${filename}`), env, context());

  assert.equal(response.status, 200);
  assert.equal(await response.text(), `google-site-verification: ${filename}`);
  assert.match(response.headers.get("content-type"), /^text\/plain/);
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(assetRequests, 0);
});

test("www redirects to the canonical apex host", async () => {
  const response = await worker.fetch(requestFor("/contact?source=test", {}, "https://www.thehouseofdentalwp.com"), { ASSETS: assets() }, context());
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://thehouseofdentalwp.com/contact?source=test");
});

test("contact endpoint fails closed before forwarding", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response("unexpected");
  };
  try {
    const response = await worker.fetch(requestFor("/api/contact", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(validFields)
    }), { ASSETS: assets() }, context());
    assert.equal(response.status, 403);
    assert.deepEqual(await json(response), { error: "Request origin is not allowed." });
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact endpoint validates body size, origin, fields, honeypot, and configuration", async () => {
  const env = { ASSETS: assets(), CONTACT_ALLOWED_ORIGINS: origin };
    const oversized = await worker.fetch(requestFor("/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: "x".repeat(12001)
  }), env, context());
  assert.equal(oversized.status, 413);

    const invalidOrigin = await worker.fetch(requestFor("/api/contact", {
    method: "POST",
    headers: { Origin: "https://evil.example", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(validFields)
  }), env, context());
  assert.equal(invalidOrigin.status, 403);

    const invalidFields = await worker.fetch(requestFor("/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...validFields, email: "not-an-email" })
  }), env, context());
  assert.equal(invalidFields.status, 422);
  assert.deepEqual((await json(invalidFields)).fields, ["email"]);

    const honeypot = await worker.fetch(requestFor("/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...validFields, form_note: "bot" })
  }), env, context());
  assert.equal(honeypot.status, 202);
  assert.deepEqual(await json(honeypot), { ok: true });

    const legacyAutofill = await worker.fetch(requestFor("/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...validFields, company: "autofilled value" })
  }), env, context());
  assert.equal(legacyAutofill.status, 503);

    const unconfigured = await worker.fetch(requestFor("/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(validFields)
  }), env, context());
  assert.equal(unconfigured.status, 503);
});

test("contact endpoint sends the mapped Resend payload", async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return new Response(JSON.stringify({ id: "contact-email-1" }), { status: 200 });
  };
  try {
    const env = {
      ASSETS: assets(),
      CONTACT_ALLOWED_ORIGINS: origin,
      RESEND_API_KEY: "re_test-token",
      CONTACT_FROM_EMAIL: "website@example.com",
      CONTACT_RECIPIENT_EMAIL: "office@example.com"
    };
    const response = await worker.fetch(requestFor("/api/contact", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...validFields, "new-patient": "No" })
    }), env, context());
    assert.equal(response.status, 200);
    const result = await json(response);
    assert.equal(result.ok, true);
    assert.equal(result.message, "Your request was sent. We'll get back to you soon.");
    assert.match(result.request_id, /^[0-9a-f-]{36}$/);
    assert.equal(captured.url, "https://api.resend.com/emails");
    assert.equal(captured.options.headers.Authorization, "Bearer re_test-token");
    const payload = JSON.parse(captured.options.body);
    assert.deepEqual(payload.to, ["office@example.com"]);
    assert.deepEqual(payload.reply_to, [validFields.email]);
    assert.equal(payload.subject, "Website appointment request from Test Patient");
    assert.match(payload.html, /Test Patient/);
    assert.match(payload.text, /Interested in: Not provided\nPreferred follow-up: Not provided\nPreferred time: Not provided/);
    assert.doesNotMatch(payload.html, /<script>/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact endpoint validates appointment preferences and makes phone or email conditional", async () => {
  const originalFetch = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (url, options) => {
    sent.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ id: `contact-email-${sent.length}` }), { status: 200 });
  };
  const env = {
    ASSETS: assets(),
    CONTACT_ALLOWED_ORIGINS: origin,
    RESEND_API_KEY: "re_test-token",
    CONTACT_FROM_EMAIL: "website@example.com",
    CONTACT_RECIPIENT_EMAIL: "office@example.com"
  };
  const post = (fields) => worker.fetch(requestFor("/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields)
  }), env, context());
  try {
    const phoneOnly = await post({ name: "Phone Patient", phone: "407-678-1400", email: "", "new-patient": "Yes", treatment: "implants", "preferred-response": "phone", "preferred-time": "morning", message: "Two missing molars." });
    assert.equal(phoneOnly.status, 200);
    assert.equal("reply_to" in sent.at(-1), false);
    assert.match(sent.at(-1).text, /Email: Not provided/);
    assert.match(sent.at(-1).text, /Interested in: Dental implants\nPreferred follow-up: Phone call\nPreferred time: Mornings/);
    assert.match(sent.at(-1).html, /<strong>Interested in:<\/strong> Dental implants/);

    const emailOnly = await post({ name: "Email Patient", phone: "", email: "email.patient@example.com", "new-patient": "No", treatment: "facial-aesthetics", "preferred-response": "email", "preferred-time": "flexible", message: "" });
    assert.equal(emailOnly.status, 200);
    assert.deepEqual(sent.at(-1).reply_to, ["email.patient@example.com"]);
    assert.match(sent.at(-1).text, /Phone: Not provided/);

    const escaped = await post({ name: "<b>Escaped</b>", phone: "407-678-1400", email: "", "new-patient": "Yes", treatment: "other", "preferred-response": "phone", "preferred-time": "afternoon", message: "<script>alert(1)</script>" });
    assert.equal(escaped.status, 200);
    assert.doesNotMatch(sent.at(-1).html, /<script>|<b>Escaped/);
    assert.match(sent.at(-1).html, /&lt;script&gt;/);

    const sentBefore = sent.length;
    for (const fields of [
      { ...validFields, phone: "", "preferred-response": "phone" },
      { ...validFields, email: "", "preferred-response": "email" },
      { ...validFields, email: "" },
      { ...validFields, "preferred-response": "carrier-pigeon" },
      { ...validFields, treatment: "unlisted" },
      { ...validFields, "preferred-time": "midnight" },
      { ...validFields, "preferred-response": "email", phone: "not a phone" },
      { ...validFields, "preferred-response": "phone", email: "not-an-email" }
    ]) {
      const rejected = await post(fields);
      assert.equal(rejected.status, 422, JSON.stringify(fields));
    }
    assert.equal(sent.length, sentBefore);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact rejects missing provider IDs and classifies provider failures without personal data", async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const logs = [];
  console.error = (value) => logs.push(JSON.parse(value));
  const env = {
    ASSETS: assets(),
    CONTACT_ALLOWED_ORIGINS: origin,
    RESEND_API_KEY: "re_test-token",
    CONTACT_FROM_EMAIL: "website@example.com",
    CONTACT_RECIPIENT_EMAIL: "office@example.com"
  };
  try {
    const post = () => worker.fetch(requestFor("/api/contact", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(validFields)
    }), env, context());
    const cases = [
      [async () => new Response("{}", { status: 200 }), "contact_email_invalid_acceptance", undefined],
      [async () => new Response(JSON.stringify({ message: "Invalid API key" }), { status: 401 }), "contact_email_rejected", "authentication"],
      [async () => new Response(JSON.stringify({ message: "Sender domain is not verified" }), { status: 422 }), "contact_email_rejected", "sender_domain"],
      [async () => new Response(JSON.stringify({ message: "Recipient is suppressed" }), { status: 422 }), "contact_email_rejected", "suppression"],
      [async () => new Response(JSON.stringify({ message: "Invalid payload" }), { status: 422 }), "contact_email_rejected", "validation"],
      [async () => { throw new DOMException("Timed out", "AbortError"); }, "contact_email_transport_failure", "timeout"]
    ];
    for (const [fetchImpl, event, category] of cases) {
      globalThis.fetch = fetchImpl;
      const response = await post();
      assert.equal(response.status, 502);
      const log = logs.at(-1);
      assert.equal(log.event, event);
      if (category) assert.equal(log.category, category);
      const serialized = JSON.stringify(log);
      for (const value of Object.values(validFields)) if (value) assert.doesNotMatch(serialized, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test("Resend webhook requires a current valid signature and logs only delivery identifiers", async () => {
  const originalConsoleLog = console.log;
  const logs = [];
  console.log = (value) => logs.push(JSON.parse(value));
  try {
    const unconfigured = await worker.fetch(requestFor("/api/resend-webhook", { method: "POST", body: "{}" }), { ASSETS: assets() }, context());
    assert.equal(unconfigured.status, 503);

    const invalid = await worker.fetch(requestFor("/api/resend-webhook", {
      method: "POST",
      headers: { "svix-id": "invalid", "svix-timestamp": String(Math.floor(Date.now() / 1000)), "svix-signature": "v1,invalid" },
      body: "{}"
    }), { ASSETS: assets(), RESEND_WEBHOOK_SECRET: webhookSecret }, context());
    assert.equal(invalid.status, 400);

    const payload = JSON.stringify({
      type: "email.delivered",
      created_at: "2026-08-28T05:00:00Z",
      data: { email_id: "contact-email-1", to: ["private@example.com"], subject: "Private subject" }
    });
    const headers = await signedWebhookHeaders(payload);
    const response = await worker.fetch(requestFor("/api/resend-webhook", { method: "POST", headers, body: payload }), {
      ASSETS: assets(),
      RESEND_WEBHOOK_SECRET: webhookSecret
    }, context());
    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), { ok: true });
    assert.deepEqual(logs.at(-1), {
      event: "resend_delivery_event",
      event_type: "email.delivered",
      email_id: "contact-email-1",
      webhook_id: headers["svix-id"]
    });
    assert.doesNotMatch(JSON.stringify(logs), /private@example\.com|Private subject/);

    const staleHeaders = await signedWebhookHeaders(payload, { timestamp: Math.floor(Date.now() / 1000) - 301 });
    const stale = await worker.fetch(requestFor("/api/resend-webhook", { method: "POST", headers: staleHeaders, body: payload }), {
      ASSETS: assets(),
      RESEND_WEBHOOK_SECRET: webhookSecret
    }, context());
    assert.equal(stale.status, 400);
  } finally {
    console.log = originalConsoleLog;
  }
});

test("report relay is bearer-protected, recipient-locked, and forwards one PDF idempotently", async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return new Response(JSON.stringify({ id: "email-report-1" }), { status: 200 });
  };
  const relayToken = "r".repeat(48);
  const env = {
    ASSETS: assets(),
    RESEND_API_KEY: "re_live-token",
    CONTACT_FROM_EMAIL: "website@example.com",
    REPORT_RELAY_TOKEN: relayToken,
    REPORT_RELAY_RECIPIENT: "operator@example.com"
  };
  const payload = {
    from: "ignored@example.com",
    to: ["operator@example.com"],
    subject: "Approved analytics report",
    html: "<p>Approved report.</p>",
    attachments: [{ filename: "analytics-report.pdf", content: "JVBERi0xLjQ=" }]
  };
  try {
    const unauthorized = await worker.fetch(requestFor("/api/report-email", {
      method: "POST",
      headers: { Authorization: "Bearer incorrect", "Content-Type": "application/json", "Idempotency-Key": "report:test:1" },
      body: JSON.stringify(payload)
    }), env, context());
    assert.equal(unauthorized.status, 401);
    assert.equal(captured, undefined);

    const wrongRecipient = await worker.fetch(requestFor("/api/report-email", {
      method: "POST",
      headers: { Authorization: `Bearer ${relayToken}`, "Content-Type": "application/json", "Idempotency-Key": "report:test:1" },
      body: JSON.stringify({ ...payload, to: ["other@example.com"] })
    }), env, context());
    assert.equal(wrongRecipient.status, 422);
    assert.equal(captured, undefined);

    const response = await worker.fetch(requestFor("/api/report-email", {
      method: "POST",
      headers: { Authorization: `Bearer ${relayToken}`, "Content-Type": "application/json", "Idempotency-Key": "report:test:1" },
      body: JSON.stringify(payload)
    }), env, context());
    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), { id: "email-report-1" });
    assert.equal(captured.url, "https://api.resend.com/emails");
    assert.equal(captured.options.headers.Authorization, "Bearer re_live-token");
    assert.equal(captured.options.headers["Idempotency-Key"], "report:test:1");
    const forwarded = JSON.parse(captured.options.body);
    assert.equal(forwarded.from, "website@example.com");
    assert.deepEqual(forwarded.to, ["operator@example.com"]);
    assert.deepEqual(forwarded.attachments, payload.attachments);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("report relay rejects malformed payloads and fails closed on provider errors", async () => {
  const originalFetch = globalThis.fetch;
  const relayToken = "r".repeat(48);
  const env = {
    ASSETS: assets(),
    RESEND_API_KEY: "re_live-token",
    CONTACT_FROM_EMAIL: "website@example.com",
    REPORT_RELAY_TOKEN: relayToken,
    REPORT_RELAY_RECIPIENT: "operator@example.com"
  };
  const headers = { Authorization: `Bearer ${relayToken}`, "Content-Type": "application/json", "Idempotency-Key": "report:test:2" };
  try {
    const malformed = await worker.fetch(requestFor("/api/report-email", {
      method: "POST", headers, body: JSON.stringify({ to: ["operator@example.com"], subject: "Report", html: "<p>x</p>", attachments: [] })
    }), env, context());
    assert.equal(malformed.status, 422);

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "rejected" }), { status: 401 });
    const failed = await worker.fetch(requestFor("/api/report-email", {
      method: "POST", headers, body: JSON.stringify({ to: ["operator@example.com"], subject: "Report", html: "<p>x</p>", attachments: [{ filename: "report.pdf", content: "JVBERi0xLjQ=" }] })
    }), env, context());
    assert.equal(failed.status, 502);
    assert.deepEqual(await json(failed), { error: "Report delivery failed." });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reputation endpoint validates configuration, upstream data, and caches successes only", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const cacheStore = new Map();
  let cachePutCount = 0;
  globalThis.caches = {
    default: {
      async match(request) { return cacheStore.get(request.url)?.clone(); },
      async put(request, response) { cachePutCount += 1; cacheStore.set(request.url, response.clone()); }
    }
  };
  const env = { ASSETS: assets(), GOOGLE_PLACE_ID: "env-place-id", GOOGLE_PLACES_API_KEY: "test-google-key" };
  let upstreamCalls = 0;
  try {
    globalThis.fetch = async (url, options) => {
      upstreamCalls += 1;
      assert.equal(String(url), "https://places.googleapis.com/v1/places/env-place-id");
      assert.equal(options.headers["X-Goog-FieldMask"], "rating,userRatingCount,googleMapsUri");
      return new Response(JSON.stringify({ rating: 5, userRatingCount: 332, googleMapsUri: "https://maps.google.test" }), { status: 200 });
    };
    const firstContext = context();
    const first = await worker.fetch(requestFor("/api/google-reputation"), env, firstContext);
    await firstContext.flush();
    assert.equal(first.status, 200);
    assert.deepEqual(await json(first), { rating: 5, review_count: 332, googleMapsUri: "https://maps.google.test" });
    assert.match(first.headers.get("cache-control"), /s-maxage=300/);
    assert.equal(cachePutCount, 1);

    globalThis.fetch = async () => { throw new Error("cache should prevent upstream fetch"); };
    const cached = await worker.fetch(requestFor("/api/google-reputation?ignored=1"), env, context());
    assert.equal(cached.status, 200);
    assert.deepEqual(await json(cached), { rating: 5, review_count: 332, googleMapsUri: "https://maps.google.test" });
    assert.equal(upstreamCalls, 1);

    cacheStore.clear();
    globalThis.fetch = async () => new Response(JSON.stringify({ rating: 9, userRatingCount: -1 }), { status: 200 });
    const invalid = await worker.fetch(requestFor("/api/google-reputation"), env, context());
    assert.equal(invalid.status, 502);
    assert.equal(cachePutCount, 1);

    const missing = await worker.fetch(requestFor("/api/google-reputation"), { ASSETS: assets() }, context());
    assert.equal(missing.status, 503);
    assert.equal(cachePutCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
  }
});
