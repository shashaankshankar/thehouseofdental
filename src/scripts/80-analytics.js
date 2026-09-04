(() => {
  const config = __SITE_ANALYTICS;
  const consentConfig = config?.consent;
  if (
    config?.provider !== "gtag"
    || config.enabled !== true
    || consentConfig?.mode !== "advanced"
    || consentConfig.version !== 2
    || !/^G-[A-Z0-9]+$/i.test(config.measurementId)
  ) return;

  const pagePath = () => {
    const path = window.location?.pathname || "/";
    const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
    return normalized.startsWith("/") ? normalized : "/";
  };
  const routeEligibility = config.routeEligibility;
  const eligibilityFor = (path) => routeEligibility?.routes?.[path] || routeEligibility?.default || routeEligibility?.default_behavior || "prohibited";
  if (eligibilityFor(pagePath()) !== "approved") return;

  const safeCampaignLocation = () => {
    const fragment = (window.location?.hash || "").replace(/^#/, "");
    const allowedFragments = new Set(routeEligibility?.fragments?.[pagePath()] || []);
    if (fragment && !allowedFragments.has(fragment)) return null;
    const allowedKeys = new Set(config.attribution?.allowedQueryParameters || ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]);
    const params = new URLSearchParams(window.location?.search || "");
    const sanitized = new URLSearchParams();
    const seen = new Set();
    for (const [key, value] of params) {
      if (!allowedKeys.has(key) || seen.has(key) || !/^[a-z0-9 ._~+-]{1,100}$/i.test(value) || /\d{4,}/.test(value)) return null;
      seen.add(key);
      sanitized.set(key, value);
    }
    const query = sanitized.toString();
    const origin = window.location?.origin || "";
    return `${origin}${pagePath()}${query ? `?${query}` : ""}`;
  };
  const pageLocation = safeCampaignLocation();
  if (!pageLocation) return;

  const storageKey = consentConfig.storageKey || "thod-analytics-consent";
  const readChoice = () => {
    try {
      const choice = localStorage.getItem(storageKey);
      if (choice === "granted") return choice;
      if (choice === "denied") {
        localStorage.removeItem(storageKey);
        try {
          sessionStorage.setItem(storageKey, "denied");
        } catch {
          // Legacy denial still applies to this page if session storage is unavailable.
        }
        return choice;
      }
    } catch {
      // Continue to the session-only denial check.
    }
    try {
      return sessionStorage.getItem(storageKey) === "denied" ? "denied" : null;
    } catch {
      return null;
    }
  };
  const saveChoice = (choice) => {
    if (choice === "granted") {
      try {
        localStorage.setItem(storageKey, choice);
      } catch {
        // Consent still applies to the current page if storage is unavailable.
      }
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // A stale session denial cannot override the in-memory choice on this page.
      }
      return;
    }
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // The in-memory denial still applies to this page.
    }
    try {
      sessionStorage.setItem(storageKey, "denied");
    } catch {
      // The in-memory denial still applies to this page if storage is unavailable.
    }
  };
  const defaultConsent = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  };
  const consentFor = (choice) => ({
    ...defaultConsent,
    analytics_storage: choice === "granted" ? "granted" : "denied"
  });
  const storedChoice = readChoice();
  let analyticsStorageGranted = storedChoice === "granted";
  const allowedEvents = new Set(config.eventPolicy?.allowedEvents || []);
  const allowedLocations = new Set(config.eventPolicy?.allowedLocations || []);
  const allowedCtaTypes = new Set(config.eventPolicy?.allowedCtaTypes || []);
  const allowedServiceCategories = new Set(config.eventPolicy?.allowedServiceCategories || []);
  const allowedFileCategories = new Set(config.eventPolicy?.allowedFileCategories || ["care_guide"]);
  const allowedDownloadCategories = new Set(config.eventPolicy?.allowedDownloadCategories || config.eventPolicy?.allowedFileCategories || ["care_guide"]);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  const defaultCommand = { ...defaultConsent };
  const waitForUpdate = Number(consentConfig.waitForUpdate);
  if (Number.isFinite(waitForUpdate) && waitForUpdate > 0) defaultCommand.wait_for_update = waitForUpdate;
  window.gtag("consent", "default", defaultCommand);
  if (storedChoice) window.gtag("consent", "update", consentFor(storedChoice));
  window.gtag("set", "ads_data_redaction", true);
  window.gtag("js", new Date());
  window.gtag("config", config.measurementId, {
    page_location: pageLocation,
    page_path: pagePath(),
    page_title: "",
    page_referrer: "",
    send_page_view: true
  });

  const track = (eventName, metadata = {}) => {
    if (!analyticsStorageGranted || !allowedEvents.has(eventName)) return;
    const payload = { page_path: pagePath() };
    if (allowedLocations.has(metadata.ctaLocation)) payload.cta_location = metadata.ctaLocation;
    if (allowedCtaTypes.has(metadata.ctaType)) payload.cta_type = metadata.ctaType;
    if (allowedServiceCategories.has(metadata.serviceCategory)) payload.service_category = metadata.serviceCategory;
    if (eventName === "file_download") {
      const downloadCategory = metadata.downloadCategory || metadata.fileCategory || "care_guide";
      if (!allowedFileCategories.has(downloadCategory) && !allowedDownloadCategories.has(downloadCategory)) return;
      payload.file_category = downloadCategory;
      payload.download_category = downloadCategory;
    }
    if (eventName === "form_step") {
      const formStep = Number(metadata.stepNumber ?? metadata.formStep);
      if (!Number.isInteger(formStep) || formStep < 1 || formStep > 3) return;
      payload.form_step = formStep;
      payload.step_number = formStep;
    }
    window.gtag("event", eventName, payload);
  };
  window.thodAnalytics = { track };

  document.querySelectorAll("[data-analytics-event]").forEach((element) => {
    element.addEventListener("click", () => track(element.dataset.analyticsEvent, {
      ctaLocation: element.dataset.analyticsLocation,
      ctaType: element.dataset.analyticsCtaType,
      serviceCategory: element.dataset.analyticsServiceCategory,
      fileCategory: element.dataset.analyticsFileCategory,
      downloadCategory: element.dataset.analyticsDownloadCategory
    }));
  });
  document.querySelectorAll("form[data-analytics-form]").forEach((form) => {
    let started = false;
    form.addEventListener("focusin", () => {
      if (started) return;
      started = true;
      track("form_start", { ctaLocation: "appointment_form" });
    });
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(config.measurementId);
  document.head.appendChild(script);

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const banner = create("aside", "consent-banner");
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-labelledby", "analytics-consent-title");
  banner.setAttribute("aria-describedby", "analytics-consent-description");
  banner.hidden = Boolean(storedChoice);
  const title = create("h2", "", "Privacy choices");
  title.id = "analytics-consent-title";
  const description = create(
    "p",
    "",
    "We use Google Analytics to understand how visitors use this website. Choose whether to allow analytics storage. Contact form values are not read or sent."
  );
  description.id = "analytics-consent-description";
  const actions = create("div", "consent-banner__actions");
  const accept = create("button", "btn btn-solid", "Allow analytics");
  accept.type = "button";
  const decline = create("button", "consent-button", "Decline analytics");
  decline.type = "button";
  actions.append(accept, decline);
  banner.append(title, description, actions);

  const settings = document.querySelectorAll("[data-consent-settings]")[0] || create("button", "consent-settings", "Privacy choices");
  if (!settings.parentNode) document.body.append(settings);
  settings.hidden = !storedChoice;
  settings.type = "button";
  settings.setAttribute("aria-label", "Change privacy choices");
  document.body.append(banner);

  const choose = (choice) => {
    saveChoice(choice);
    analyticsStorageGranted = choice === "granted";
    window.gtag("consent", "update", consentFor(choice));
    banner.hidden = true;
    settings.hidden = false;
    settings.focus({ preventScroll: true });
  };
  accept.addEventListener("click", () => choose("granted"));
  decline.addEventListener("click", () => choose("denied"));
  settings.addEventListener("click", () => {
    banner.hidden = false;
    settings.hidden = true;
    accept.focus();
  });
})();
