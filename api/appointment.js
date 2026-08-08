const MAX_BODY_BYTES = 12000;
const MAX_LENGTHS = {
  name: 100,
  phone: 50,
  email: 254,
  newPatient: 10,
  message: 2000
};

const json = (response, status, body) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  return response.status(status).json(body);
};

const headerValue = (request, name) => {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
};

const textValue = (value) => (typeof value === "string" ? value.trim() : "");

const parseBody = (request) => {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) return request.body;
  if (typeof request.body === "string" || Buffer.isBuffer(request.body)) {
    return Object.fromEntries(new URLSearchParams(String(request.body)));
  }
  return {};
};

const configuredOrigins = () => String(process.env.APPOINTMENT_ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const requestOrigin = (request) => {
  const origin = headerValue(request, "origin").trim();
  if (origin) return origin;
  const referer = headerValue(request, "referer").trim();
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^[+()\d.\-\s]{7,50}$/.test(value) && value.replace(/\D/g, "").length >= 7;

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Method not allowed." });
  }

  const contentLength = Number(headerValue(request, "content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json(response, 413, { error: "Request is too large." });
  }

  const allowedOrigins = configuredOrigins();
  if (!allowedOrigins.length || !allowedOrigins.includes(requestOrigin(request))) {
    return json(response, 403, { error: "Request origin is not allowed." });
  }

  const body = parseBody(request);
  if (textValue(body.company)) return json(response, 202, { ok: true });

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
  if (errors.length) return json(response, 422, { error: "Please review the highlighted fields and try again." });

  const backendUrl = String(process.env.APPOINTMENT_BACKEND_URL || "").trim();
  const backendToken = String(process.env.APPOINTMENT_BACKEND_TOKEN || "").trim();
  if (!backendUrl || !backendToken) {
    return json(response, 503, { error: "Online appointment requests are not configured. Please call the office." });
  }

  let destination;
  try {
    destination = new URL(backendUrl);
  } catch {
    return json(response, 503, { error: "Online appointment requests are not configured. Please call the office." });
  }
  if (destination.protocol !== "https:") {
    return json(response, 503, { error: "Online appointment requests are not configured. Please call the office." });
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
    if (!upstream.ok) return json(response, 502, { error: "We could not send your request. Please call the office." });
    return json(response, 200, { ok: true, message: "Your request was sent. The office will call to confirm." });
  } catch {
    return json(response, 502, { error: "We could not send your request. Please call the office." });
  } finally {
    clearTimeout(timeout);
  }
};
