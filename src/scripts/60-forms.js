(() => {
  const form = document.querySelector("form[data-contact-form]");
  if (!form) return;

  const button = form.querySelector("button[type='submit']");
  const status = document.querySelector("#contact-status");
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
    setStatus("Sending your message…", "pending");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams(new FormData(form))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || "Request failed");
      form.reset();
      setStatus(result.message || "Your message was sent. We'll get back to you soon.", "success");
      window.thodAnalytics?.track("form_submit", { ctaLocation: "contact_form" });
      window.thodAnalytics?.track("generate_lead", { ctaLocation: "contact_form" });
      window.thodAnalytics?.track("appointment_request", { ctaLocation: "contact_form" });
    } catch {
      setStatus("We couldn't send your request online. Please call (407) 678-1400.", "error");
    } finally {
      button?.removeAttribute("aria-busy");
      if (button) button.disabled = false;
      status?.focus({ preventScroll: true });
    }
  });
})();
