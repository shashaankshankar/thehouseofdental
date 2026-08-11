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

const requestFor = (path, init = {}) => new Request(`${origin}${path}`, init);
const json = (response) => response.json();
const context = () => {
  const pending = [];
  return {
    waitUntil(promise) { pending.push(promise); },
    async flush() { await Promise.all(pending); }
  };
};
const assets = (handler = async () => new Response("asset", { status: 200 })) => ({ fetch: handler });

test("unknown API paths return JSON 404 and endpoint methods return 405 with Allow", async () => {
  const env = { ASSETS: assets() };
  const missing = await worker.fetch(requestFor("/api/unknown"), env, context());
  assert.equal(missing.status, 404);
  assert.deepEqual(await json(missing), { error: "Not found." });
  assert.match(missing.headers.get("content-type"), /application\/json/);

  const reputationMethod = await worker.fetch(requestFor("/api/google-reputation", { method: "POST" }), env, context());
  assert.equal(reputationMethod.status, 405);
  assert.equal(reputationMethod.headers.get("allow"), "GET");

  const appointmentMethod = await worker.fetch(requestFor("/api/appointment"), env, context());
  assert.equal(appointmentMethod.status, 405);
  assert.equal(appointmentMethod.headers.get("allow"), "POST");
});

test("clean page routes resolve through the Static Assets binding", async () => {
  const requests = [];
  const env = { ASSETS: assets(async (request) => {
    requests.push(new URL(request.url).pathname);
    return new Response("page", { status: 200 });
  }) };
  const response = await worker.fetch(requestFor("/about"), env, context());
  assert.equal(response.status, 200);
  assert.deepEqual(requests, ["/about.html"]);
});

test("appointment endpoint fails closed before forwarding", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response("unexpected");
  };
  try {
    const response = await worker.fetch(requestFor("/api/appointment", {
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

test("appointment endpoint validates body size, origin, fields, honeypot, and configuration", async () => {
  const env = { ASSETS: assets(), APPOINTMENT_ALLOWED_ORIGINS: origin };
  const oversized = await worker.fetch(requestFor("/api/appointment", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: "x".repeat(12001)
  }), env, context());
  assert.equal(oversized.status, 413);

  const invalidOrigin = await worker.fetch(requestFor("/api/appointment", {
    method: "POST",
    headers: { Origin: "https://evil.example", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(validFields)
  }), env, context());
  assert.equal(invalidOrigin.status, 403);

  const invalidFields = await worker.fetch(requestFor("/api/appointment", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...validFields, email: "not-an-email" })
  }), env, context());
  assert.equal(invalidFields.status, 422);

  const honeypot = await worker.fetch(requestFor("/api/appointment", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...validFields, company: "bot" })
  }), env, context());
  assert.equal(honeypot.status, 202);
  assert.deepEqual(await json(honeypot), { ok: true });

  const unconfigured = await worker.fetch(requestFor("/api/appointment", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(validFields)
  }), env, context());
  assert.equal(unconfigured.status, 503);
});

test("appointment endpoint forwards only over HTTPS with the original JSON contract", async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return new Response("accepted", { status: 200 });
  };
  try {
    const env = {
      ASSETS: assets(),
      APPOINTMENT_ALLOWED_ORIGINS: origin,
      APPOINTMENT_BACKEND_URL: "https://notify.example.test/appointments",
      APPOINTMENT_BACKEND_TOKEN: "test-token"
    };
    const response = await worker.fetch(requestFor("/api/appointment", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...validFields, "new-patient": "No" })
    }), env, context());
    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), { ok: true, message: "Your message was sent. We'll get back to you soon." });
    assert.equal(captured.url, "https://notify.example.test/appointments");
    assert.equal(captured.options.headers.Authorization, "Bearer test-token");
    assert.equal(JSON.parse(captured.options.body).appointment.email, validFields.email);

    const httpEnv = { ...env, APPOINTMENT_BACKEND_URL: "http://notify.example.test/appointments" };
    const httpResponse = await worker.fetch(requestFor("/api/appointment", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(validFields)
    }), httpEnv, context());
    assert.equal(httpResponse.status, 503);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("appointment upstream failure and timeout fail closed with 502", async () => {
  const originalFetch = globalThis.fetch;
  const env = {
    ASSETS: assets(),
    APPOINTMENT_ALLOWED_ORIGINS: origin,
    APPOINTMENT_BACKEND_URL: "https://notify.example.test/appointments",
    APPOINTMENT_BACKEND_TOKEN: "test-token"
  };
  try {
    globalThis.fetch = async () => new Response("failed", { status: 500 });
    const failed = await worker.fetch(requestFor("/api/appointment", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(validFields)
    }), env, context());
    assert.equal(failed.status, 502);

    globalThis.fetch = async () => { throw new Error("upstream timeout"); };
    const timedOut = await worker.fetch(requestFor("/api/appointment", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(validFields)
    }), env, context());
    assert.equal(timedOut.status, 502);
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
