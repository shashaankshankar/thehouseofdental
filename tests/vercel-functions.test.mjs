import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const appointment = require("../api/appointment.js");
const reputation = require("../api/google-reputation.js");
const envKeys = [
  "GOOGLE_PLACE_ID",
  "GOOGLE_PLACES_API_KEY",
  "APPOINTMENT_BACKEND_URL",
  "APPOINTMENT_BACKEND_TOKEN",
  "APPOINTMENT_ALLOWED_ORIGINS"
];

const response = () => ({
  headers: {},
  statusCode: null,
  body: null,
  setHeader(key, value) {
    this.headers[key] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const withCleanEnv = async (callback) => {
  const saved = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  try {
    for (const key of envKeys) delete process.env[key];
    await callback();
  } finally {
    for (const key of envKeys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
};

test("appointment Function fails closed before a trusted origin is configured", async () => {
  await withCleanEnv(async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return { ok: true };
    };
    try {
      const result = response();
      await appointment({
        method: "POST",
        headers: { origin: "https://thehouseofdental.com" },
        body: { name: "Test Patient", phone: "4076781400", email: "test@example.com", "new-patient": "Yes", message: "" }
      }, result);
      assert.equal(result.statusCode, 403);
      assert.equal(fetchCalled, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("appointment Function forwards only after HTTPS backend and secret configuration", async () => {
  await withCleanEnv(async () => {
    process.env.APPOINTMENT_ALLOWED_ORIGINS = "https://thehouseofdental.com";
    process.env.APPOINTMENT_BACKEND_URL = "https://notify.example.test/appointments";
    process.env.APPOINTMENT_BACKEND_TOKEN = "test-token";
    const originalFetch = globalThis.fetch;
    let captured;
    globalThis.fetch = async (url, options) => {
      captured = { url: String(url), options };
      return { ok: true };
    };
    try {
      const result = response();
      await appointment({
        method: "POST",
        headers: { origin: "https://thehouseofdental.com" },
        body: { name: "Test Patient", phone: "(407) 678-1400", email: "test@example.com", "new-patient": "No", message: "" }
      }, result);
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.ok, true);
      assert.equal(captured.url, "https://notify.example.test/appointments");
      assert.equal(captured.options.headers.Authorization, "Bearer test-token");
      assert.equal(JSON.parse(captured.options.body).appointment.email, "test@example.com");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("reputation Function returns a safe configuration error without secrets", async () => {
  await withCleanEnv(async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return { ok: true };
    };
    try {
      const result = response();
      await reputation({ method: "GET", query: { place_id: "test" } }, result);
      assert.equal(result.statusCode, 503);
      assert.equal(fetchCalled, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
