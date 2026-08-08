(() => {
  const form = document.querySelector("form[data-appointment-form]");
  if (!form) return;

  const button = form.querySelector("button[type='submit']");
  const status = document.querySelector("#appointment-status");
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
      if (!response.ok || result.ok !== true) throw new Error(result.error || "Request failed");
      form.reset();
      setStatus(result.message || "Your request was sent. The office will call to confirm.", "success");
    } catch {
      setStatus("We couldn't send your request online. Please call (407) 678-1400.", "error");
    } finally {
      button?.removeAttribute("aria-busy");
      if (button) button.disabled = false;
      status?.focus({ preventScroll: true });
    }
  });
})();
