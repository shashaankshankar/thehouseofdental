(() => {
  const forms = document.querySelectorAll("form[data-contact-form]");
  if (!forms.length) return;

  forms.forEach((form) => {
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
        const response = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: new URLSearchParams(new FormData(form))
        });
        const result = await response.json().catch(() => ({}));
        // A 202 is the Worker honeypot response, not a sent message.
        if (response.status !== 200 || result.ok !== true) {
          const error = new Error(result.error || "Request failed");
          error.status = response.status;
          error.result = result;
          throw error;
        }
        const message = result.message || "Your request was sent. We'll get back to you soon.";
        form.reset();
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
