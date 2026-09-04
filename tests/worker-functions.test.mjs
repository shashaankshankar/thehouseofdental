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
  assert.deepEqual(await json(honeypot), { ok: true, accepted: false });

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
    assert.equal(result.accepted, true);
    assert.equal(result.message, "Your request was sent. We'll get back to you soon.");
    assert.match(result.request_id, /^[0-9a-f-]{36}$/);
    assert.equal(captured.url, "https://api.resend.com/emails");
    assert.equal(captured.options.headers.Authorization, "Bearer re_test-token");
    assert.match(captured.options.headers["Idempotency-Key"], /^website-contact:[0-9a-f-]{36}$/);
    const payload = JSON.parse(captured.options.body);
    assert.deepEqual(payload.to, ["office@example.com"]);
    assert.deepEqual(payload.reply_to, [validFields.email]);
    assert.equal(payload.subject, "Website Appointment Request from Test Patient");
    assert.match(payload.html, /Test Patient/);
    assert.match(payload.text, /Interested in: Not provided\nPreferred follow-up: Not provided\nPreferred time: Not provided/);
    assert.doesNotMatch(payload.html, /<script>/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact retries reuse a valid attempt key while preserving provider status handling", async () => {
  const originalFetch = globalThis.fetch;
  const idempotencyKeys = [];
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    idempotencyKeys.push(options.headers["Idempotency-Key"]);
    calls += 1;
    return calls === 1
      ? new Response(JSON.stringify({ message: "temporary provider failure" }), { status: 500 })
      : new Response(JSON.stringify({ id: "contact-email-retry" }), { status: 200 });
  };
  const env = {
    ASSETS: assets(),
    CONTACT_ALLOWED_ORIGINS: origin,
    RESEND_API_KEY: "re_test-token",
    CONTACT_FROM_EMAIL: "website@example.com",
    CONTACT_RECIPIENT_EMAIL: "office@example.com"
  };
  const attemptId = "123e4567-e89b-42d3-a456-426614174000";
  const post = () => worker.fetch(requestFor("/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": attemptId },
    body: new URLSearchParams(validFields)
  }), env, context());
  try {
    assert.equal((await post()).status, 502);
    assert.equal((await post()).status, 200);
    assert.deepEqual(idempotencyKeys, [`website-contact:${attemptId}`, `website-contact:${attemptId}`]);
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

test("optional D1 correlation stores technical fields and deduplicates webhook delivery", async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleLog = console.log;
  const databaseCalls = [];
  const webhookIds = new Set();
  const database = {
    prepare(sql) {
      return {
        bind(...args) {
          databaseCalls.push({ sql: sql.replace(/\s+/g, " ").trim(), args });
          return {
            async run() {
              if (sql.includes("INSERT INTO delivery_webhook_events")) {
                const webhookId = args[0];
                if (webhookIds.has(webhookId)) return { meta: { changes: 0 } };
                webhookIds.add(webhookId);
              }
              return { meta: { changes: 1 } };
            }
          };
        }
      };
    }
  };
  const attemptId = "123e4567-e89b-42d3-a456-426614174000";
  const contactEnv = {
    ASSETS: assets(),
    CONTACT_ALLOWED_ORIGINS: origin,
    RESEND_API_KEY: "re_test-token",
    CONTACT_FROM_EMAIL: "website@example.com",
    CONTACT_RECIPIENT_EMAIL: "office@example.com",
    DELIVERY_DB: database
  };
  globalThis.fetch = async () => new Response(JSON.stringify({ id: "contact-email-d1" }), { status: 200 });
  try {
    const contactContext = context();
    const contact = await worker.fetch(requestFor("/api/contact", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": attemptId },
      body: new URLSearchParams(validFields)
    }), contactEnv, contactContext);
    await contactContext.flush();
    assert.equal(contact.status, 200);
    assert.equal((await json(contact)).accepted, true);

    const contactInsert = databaseCalls.find(({ sql }) => sql.includes("INSERT INTO delivery_correlations"));
    assert.ok(contactInsert);
    assert.match(contactInsert.args[0], /^[0-9a-f-]{36}$/);
    assert.match(contactInsert.args[1], /^[0-9a-f]{64}$/);
    assert.equal(contactInsert.args[2], "thehouseofdental");
    assert.equal(contactInsert.args[3], "contact-email-d1");
    assert.equal(contactInsert.args[4], "accepted");
    assert.doesNotMatch(JSON.stringify(contactInsert), /Test Patient|test@example\.com|407-678-1400/);

    const customContext = context();
    const customContact = await worker.fetch(requestFor("/api/contact", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": "223e4567-e89b-42d3-a456-426614174000" },
      body: new URLSearchParams({ ...validFields, message: "Custom client" })
    }), { ...contactEnv, CLIENT_ID: "custom-client" }, customContext);
    await customContext.flush();
    assert.equal(customContact.status, 200);
    const customInsert = databaseCalls.filter(({ sql }) => sql.includes("INSERT INTO delivery_correlations"))[1];
    assert.ok(customInsert);
    assert.equal(customInsert.args[2], "custom-client");

    const logs = [];
    console.log = (value) => logs.push(JSON.parse(value));
    const payload = JSON.stringify({
      type: "email.delivered",
      data: { email_id: "contact-email-d1", created_at: "2026-08-28T05:00:00Z", to: ["private@example.com"] }
    });
    const headers = await signedWebhookHeaders(payload, { id: "msg_d1_webhook" });
    const webhookEnv = { ASSETS: assets(), RESEND_WEBHOOK_SECRET: webhookSecret, DELIVERY_DB: database };
    const first = await worker.fetch(requestFor("/api/resend-webhook", { method: "POST", headers, body: payload }), webhookEnv, context());
    const duplicate = await worker.fetch(requestFor("/api/resend-webhook", { method: "POST", headers, body: payload }), webhookEnv, context());
    assert.equal(first.status, 200);
    assert.equal(duplicate.status, 200);
    assert.equal(logs.filter((entry) => entry.event === "resend_delivery_event").length, 1);
    assert.equal(databaseCalls.filter(({ sql }) => sql.includes("INSERT INTO delivery_webhook_events")).length, 2);
    assert.doesNotMatch(JSON.stringify(logs), /private@example\.com/);
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalConsoleLog;
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
