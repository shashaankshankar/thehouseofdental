(() => {
  const OFFICE = { timeZone: "America/New_York", days: [1, 2, 3, 4], opens: 8 * 60, closes: 15 * 60 };
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const clock = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")}${hour < 12 ? "am" : "pm"}`;
  };
  const officeStatus = (now = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: OFFICE.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
    }).formatToParts(now);
    const read = (type) => parts.find((part) => part.type === type)?.value || "";
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(read("weekday"));
    const minutes = (Number(read("hour")) % 24) * 60 + Number(read("minute"));
    if (day < 0 || !Number.isFinite(minutes)) throw new Error("Unavailable office clock");
    const openDay = OFFICE.days.includes(day);
    if (openDay && minutes >= OFFICE.opens && minutes < OFFICE.closes) {
      return { open: true, text: `Open now · until ${clock(OFFICE.closes)}` };
    }
    if (openDay && minutes < OFFICE.opens) return { open: false, text: `Closed · opens today at ${clock(OFFICE.opens)}` };
    for (let offset = 1; offset <= 7; offset += 1) {
      const next = (day + offset) % 7;
      if (!OFFICE.days.includes(next)) continue;
      const label = offset === 1 ? "tomorrow" : DAY_NAMES[next];
      return { open: false, text: `Closed · opens ${label} at ${clock(OFFICE.opens)}` };
    }
    return { open: false, text: "Closed" };
  };
  const renderOfficeStatus = () => {
    const targets = document.querySelectorAll("[data-office-status]");
    if (!targets.length) return;
    let status;
    try {
      status = officeStatus();
    } catch {
      return;
    }
    targets.forEach((element) => {
      element.textContent = status.text;
      element.dataset.officeOpen = String(status.open);
    });
  };
  renderOfficeStatus();
  window.setInterval(renderOfficeStatus, 60000);
  window.thodInquiry = { officeStatus };

  const drawer = document.querySelector("[data-inquiry]");
  if (!drawer) return;

  // The Contact page renders the form in place; the step flow runs the same,
  // but nothing overlays, traps focus, or needs closing.
  const inline = drawer.hasAttribute("data-inquiry-inline");
  const panel = drawer.querySelector(".inquiry-panel");
  const form = drawer.querySelector("form[data-contact-form]");
  const steps = [...drawer.querySelectorAll("[data-inquiry-step]")];
  const summary = drawer.querySelector("[data-inquiry-summary]");
  const progressLabel = drawer.querySelector("[data-inquiry-progress-label]");
  const progressBars = [...drawer.querySelectorAll(".inquiry-progress-bars i")];
  const backButton = drawer.querySelector("[data-inquiry-back]");
  const nextButton = drawer.querySelector("[data-inquiry-next]");
  const submitButton = drawer.querySelector("[data-inquiry-submit]");
  const success = drawer.querySelector("[data-inquiry-success]");
  const status = form.querySelector("[data-form-status]");
  const phoneField = form.querySelector('input[name="phone"]');
  const emailField = form.querySelector('input[name="email"]');
  const nameField = form.querySelector('input[name="name"]');
  const messageField = form.querySelector('textarea[name="message"]');
  const total = steps.length;
  const fieldErrorMessage = {
    name: "Please tell us your name.",
    phone: "Enter a phone number with at least 7 digits.",
    email: "Enter a valid email address.",
    treatment: "Choose the option that fits best so we can route your request.",
    "preferred-response": "Choose whether we should call or email you.",
    "preferred-time": "Choose a preferred time or select Flexible.",
    "new-patient": "Tell us whether you are a new patient.",
    message: "Keep your note under 2,000 characters."
  };
  const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  const isInquiryHash = (hash) => hash === "#request" || hash === "#book";

  let current = 1;
  let returnFocus = null;
  let inerted = [];
  let completed = false;
  const trackFormStep = (step) => window.thodAnalytics?.track("form_step", {
    ctaLocation: "appointment_form",
    formStep: step
  });

  const checked = (name) => form.querySelector(`input[name="${name}"]:checked`);
  const choiceLabel = (name) => checked(name)?.parentElement?.querySelector("strong")?.textContent?.trim() || "";
  const fieldsFor = (name) => [...form.querySelectorAll("[name]")].filter((field) => field.name === name);
  const fieldError = (name) => form.querySelector(`[data-inquiry-field-error="${name}"]`);
  const setFieldError = (name, message = "") => {
    const error = fieldError(name);
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
    fieldsFor(name).forEach((field) => {
      field.setAttribute("aria-invalid", String(Boolean(message)));
      if (!error?.id) return;
      const describedBy = new Set((field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
      if (message) describedBy.add(error.id);
      else describedBy.delete(error.id);
      if (describedBy.size) field.setAttribute("aria-describedby", [...describedBy].join(" "));
      else field.removeAttribute("aria-describedby");
    });
  };
  const clearFieldErrors = () => form.querySelectorAll("[data-inquiry-field-error]").forEach((error) => setFieldError(error.dataset.inquiryFieldError, ""));
  const clearStepFieldErrors = (step) => step.querySelectorAll("[data-inquiry-field-error]").forEach((error) => setFieldError(error.dataset.inquiryFieldError, ""));
  const focusFirst = (step) => {
    const target = step.querySelector('input:checked, input:not([type="radio"]):not([type="hidden"]), textarea, input');
    if (!target) return;
    window.setTimeout(() => target.focus({ preventScroll: true }), 0);
  };
  const setError = (step, message) => {
    const error = step.querySelector("[data-inquiry-error]");
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
  };
  const isFocusable = (element) => {
    if (!element || element.disabled || element.hidden || element.closest("[hidden]")) return false;
    const styles = getComputedStyle(element);
    return styles.display !== "none" && styles.visibility !== "hidden";
  };
  const focusable = () => [...panel.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => element.tabIndex >= 0 && isFocusable(element));

  const renderSummary = () => {
    summary.replaceChildren();
    const items = [{ step: 1, label: "Asking about", value: choiceLabel("treatment") }];
    if (current > 2) {
      items.push({ step: 2, label: "Follow-up", value: choiceLabel("preferred-response") });
      items.push({ step: 2, label: "Timing", value: choiceLabel("preferred-time") });
    }
    const visible = items.filter((item) => item.value);
    summary.hidden = current === 1 || !visible.length;
    visible.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `${item.label}: ${item.value}. Change this answer`);
      const label = document.createElement("small");
      label.textContent = item.label;
      const value = document.createElement("span");
      value.textContent = item.value;
      const change = document.createElement("em");
      change.textContent = "Change";
      button.append(label, value, change);
      button.addEventListener("click", () => showStep(item.step));
      summary.append(button);
    });
  };
  const syncContactRequirements = () => {
    const method = checked("preferred-response")?.value || "phone";
    const phoneRequired = method === "phone";
    const emailRequired = method === "email";
    phoneField.required = phoneRequired;
    emailField.required = emailRequired;
    phoneField.setAttribute("aria-required", String(phoneRequired));
    emailField.setAttribute("aria-required", String(emailRequired));
    form.querySelectorAll("[data-inquiry-optional]").forEach((hint) => {
      hint.hidden = hint.dataset.inquiryOptional === "phone" ? phoneRequired : emailRequired;
    });
  };
  const showStep = (index, { focus = true, track = false } = {}) => {
    const next = Math.min(Math.max(index, 1), total);
    const changed = next !== current;
    current = next;
    steps.forEach((step, position) => {
      const active = position + 1 === current;
      step.hidden = !active;
      step.classList.toggle("is-entering", active && !reducedMotion());
      if (!active) {
        setError(step, "");
        clearStepFieldErrors(step);
      }
    });
    progressLabel.textContent = `Step ${current} of ${total}`;
    progressBars.forEach((bar, position) => bar.classList.toggle("is-done", position < current));
    backButton.hidden = current === 1;
    nextButton.hidden = current === total;
    submitButton.hidden = current !== total;
    syncContactRequirements();
    renderSummary();
    if (focus) {
      focusFirst(steps[current - 1]);
      panel.scrollTo?.({ top: 0, behavior: "auto" });
    }
    if (track && changed) trackFormStep(current);
  };
  const validateStep = (index) => {
    const step = steps[index - 1];
    if (index === 1 && !checked("treatment")) {
      setFieldError("treatment", fieldErrorMessage.treatment);
      return false;
    }
    if (index === 2 && !checked("preferred-response")) {
      setFieldError("preferred-response", fieldErrorMessage["preferred-response"]);
      return false;
    }
    if (index === 3) {
      syncContactRequirements();
      clearStepFieldErrors(step);
      const fields = [nameField, phoneField, emailField];
      const phoneValue = phoneField.value.trim();
      const emailValue = emailField.value.trim();
      const phoneLooksValid = /^[+()\d.\-\s]{7,50}$/.test(phoneValue) && phoneValue.replace(/\D/g, "").length >= 7;
      const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
      const manualInvalid = new Set();
      if (!nameField.value.trim() || nameField.value.trim().length > 100) manualInvalid.add(nameField);
      if ((phoneField.required && !phoneValue) || (phoneValue && (!phoneLooksValid || phoneValue.length > 50))) manualInvalid.add(phoneField);
      if ((emailField.required && !emailValue) || (emailValue && (!emailLooksValid || emailValue.length > 254))) manualInvalid.add(emailField);
      const invalid = fields.filter((field) => manualInvalid.has(field) || !field.checkValidity());
      if (invalid.length) {
        const first = invalid[0];
        const messages = {
          name: fieldErrorMessage.name,
          phone: phoneField.required && !phoneValue ? "Add the phone number we should call." : fieldErrorMessage.phone,
          email: emailField.required && !emailValue ? "Add the email address we should reply to." : fieldErrorMessage.email
        };
        setFieldError(first.name, messages[first.name]);
        first.focus({ preventScroll: true });
        return false;
      }
    }
    setError(step, "");
    return true;
  };

  const resetFlow = () => {
    form.reset();
    completed = false;
    form.hidden = false;
    success.hidden = true;
    if (status) {
      status.textContent = "";
      delete status.dataset.state;
    }
    clearFieldErrors();
    form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
    showStep(1, { focus: false });
  };
  const inertBackground = () => {
    if (inerted.length) return;
    const background = [...document.body.children].filter((element) => element !== drawer && element.tagName !== "SCRIPT");
    inerted = background.map((element) => ({ element, inert: element.inert }));
    background.forEach((element) => { element.inert = true; });
  };
  const releaseBackground = () => {
    inerted.forEach(({ element, inert }) => { element.inert = inert; });
    inerted = [];
  };
  const open = ({ treatment = "", trigger = null } = {}) => {
    const wasOpen = drawer.classList.contains("is-open");
    if (!wasOpen && !inline) returnFocus = trigger || document.activeElement;
    if (completed) resetFlow();
    const preset = treatment ? form.querySelector(`input[name="treatment"][value="${CSS.escape(treatment)}"]`) : null;
    if (preset) preset.checked = true;
    if (inline) {
      showStep(preset ? 2 : 1, { focus: false, track: true });
      drawer.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
      window.setTimeout(() => {
        if (preset) focusFirst(steps[1]);
        else panel.focus({ preventScroll: true });
      }, 0);
      return;
    }
    drawer.classList.add("is-open");
    document.body.classList.add("inquiry-open");
    inertBackground();
    showStep(preset ? 2 : 1, { focus: false, track: true });
    window.setTimeout(() => {
      if (!drawer.classList.contains("is-open")) return;
      if (preset) focusFirst(steps[1]);
      else panel.focus({ preventScroll: true });
    }, 0);
  };
  const close = () => {
    if (inline) {
      // "Done" on the inline form simply readies it for another request.
      if (completed) resetFlow();
      panel.focus({ preventScroll: true });
      return;
    }
    if (!drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    document.body.classList.remove("inquiry-open");
    releaseBackground();
    if (isInquiryHash(location.hash)) history.replaceState(null, "", `${location.pathname}${location.search}`);
    if (completed) resetFlow();
    const target = returnFocus?.isConnected && isFocusable(returnFocus) ? returnFocus : document.querySelector(".burger");
    returnFocus = null;
    if (target && isFocusable(target)) target.focus({ preventScroll: true });
  };

  nextButton.addEventListener("click", () => {
    if (validateStep(current)) showStep(current + 1, { track: true });
  });
  backButton.addEventListener("click", () => showStep(current - 1, { track: true }));
  form.addEventListener("submit", (event) => {
    if (current !== total || !validateStep(total)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (current !== total) showStep(current);
    }
  });
  form.querySelectorAll('input[name="preferred-response"]').forEach((input) => input.addEventListener("change", syncContactRequirements));
  form.querySelectorAll('input[type="radio"]').forEach((input) => input.addEventListener("change", () => {
    setFieldError(input.name, "");
    setError(input.closest("[data-inquiry-step]"), "");
  }));
  [nameField, phoneField, emailField, messageField].forEach((field) => field.addEventListener("input", () => setFieldError(field.name, "")));
  form.addEventListener("contact:validation-error", (event) => {
    const fields = [...new Set((event.detail?.fields || []).filter((name) => fieldErrorMessage[name]))];
    if (!fields.length) return;
    clearFieldErrors();
    const firstField = fieldsFor(fields[0])[0];
    const targetStep = firstField?.closest("[data-inquiry-step]");
    const targetIndex = targetStep ? steps.indexOf(targetStep) + 1 : total;
    showStep(targetIndex, { focus: false });
    fields.forEach((name) => setFieldError(name, fieldErrorMessage[name]));
    const firstInvalid = fields.flatMap(fieldsFor)[0];
    firstInvalid?.focus({ preventScroll: true });
  });
  form.addEventListener("contact:success", () => {
    completed = true;
    form.hidden = true;
    success.hidden = false;
    panel.scrollTo?.({ top: 0, behavior: "auto" });
    window.setTimeout(() => success.focus({ preventScroll: true }), 0);
  });
  drawer.querySelectorAll("[data-inquiry-close]").forEach((element) => element.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (!drawer.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.stopPropagation();
      return;
    }
    if (event.key !== "Tab") return;
    event.stopPropagation();
    const items = focusable();
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (!panel.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, true);

  const inquiryLink = (link) => {
    let url;
    try {
      url = new URL(link.getAttribute("href") || "", location.href);
    } catch {
      return false;
    }
    return url.origin === location.origin && (url.pathname === "/contact" || url.pathname === location.pathname) && isInquiryHash(url.hash);
  };
  document.querySelectorAll("a[href]").forEach((link) => {
    if (!inquiryLink(link)) return;
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      open({ treatment: link.dataset.inquiryTreatment || "", trigger: link });
    });
  });
  const openFromHash = () => {
    if (!isInquiryHash(location.hash)) return;
    open();
    if (!inline) history.replaceState(null, "", `${location.pathname}${location.search}`);
  };
  addEventListener("hashchange", openFromHash);
  showStep(1, { focus: false });
  openFromHash();
})();
