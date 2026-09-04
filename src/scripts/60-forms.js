(() => {
  const forms = document.querySelectorAll("form[data-contact-form]");
  if (!forms.length) return;

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const secureAttemptId = () => {
    const random = window.crypto || (typeof crypto !== "undefined" ? crypto : null);
    if (typeof random?.randomUUID === "function") {
      const value = random.randomUUID();
      return uuidPattern.test(value) ? value.toLowerCase() : "";
    }
    if (typeof random?.getRandomValues !== "function" || typeof Uint8Array === "undefined") return "";
    const bytes = new Uint8Array(16);
    random.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };

  forms.forEach((form) => {
    let attemptId = "";
    const button = form.querySelector("button[type='submit']");
    const status = form.querySelector("[data-form-status]") || document.querySelector("#contact-status");
    const setStatus = (message, state) => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button?.disabled) return;
      button?.setAttribute("aria-busy", "true");
      if (button) button.disabled = true;
      setStatus("Sending your request…", "pending");

      try {
        if (!attemptId) attemptId = secureAttemptId();
        const headers = { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" };
        if (attemptId) headers["Idempotency-Key"] = attemptId;
        const response = await fetch(form.action, {
          method: "POST",
          headers,
          body: new URLSearchParams(new FormData(form))
        });
        const result = await response.json().catch(() => ({}));
        // A 202 is the Worker honeypot response, not a sent message.
        if (response.status !== 200 || result.ok !== true || result.accepted !== true) {
          const error = new Error(result.error || "Request failed");
          error.status = response.status;
          error.result = result;
          throw error;
        }
        const message = result.message || "Your request was sent. We'll get back to you soon.";
        form.reset();
        attemptId = "";
        setStatus(message, "success");
        window.thodAnalytics?.track("form_submit", { ctaLocation: "contact_form" });
        window.thodAnalytics?.track("generate_lead", { ctaLocation: "contact_form" });
        window.thodAnalytics?.track("appointment_request", { ctaLocation: "contact_form" });
        form.dispatchEvent(new CustomEvent("contact:success", { bubbles: true, detail: { message } }));
      } catch (error) {
        if (error.status === 422 && Array.isArray(error.result?.fields)) {
          form.dispatchEvent(new CustomEvent("contact:validation-error", {
            bubbles: true,
            detail: { fields: error.result.fields }
          }));
        }
        setStatus(error.result?.error || "We couldn't send your request online. Please call (407) 678-1400.", "error");
      } finally {
        button?.removeAttribute("aria-busy");
        if (button) button.disabled = false;
        status?.focus({ preventScroll: true });
      }
    });
  });
})();
