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

  const storageKey = consentConfig.storageKey || "thod-analytics-consent";
  const validChoices = new Set(["granted", "denied"]);
  const readChoice = () => {
    try {
      const choice = localStorage.getItem(storageKey);
      return validChoices.has(choice) ? choice : null;
    } catch {
      return null;
    }
  };
  const saveChoice = (choice) => {
    try {
      localStorage.setItem(storageKey, choice);
    } catch {
      // Consent still applies to the current page if storage is unavailable.
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
  window.gtag("config", config.measurementId);

  const track = (eventName, metadata = {}) => {
    if (!analyticsStorageGranted || !allowedEvents.has(eventName)) return;
    const payload = { page_path: pagePath() };
    if (allowedLocations.has(metadata.ctaLocation)) payload.cta_location = metadata.ctaLocation;
    if (allowedCtaTypes.has(metadata.ctaType)) payload.cta_type = metadata.ctaType;
    if (allowedServiceCategories.has(metadata.serviceCategory)) payload.service_category = metadata.serviceCategory;
    window.gtag("event", eventName, payload);
  };
  window.thodAnalytics = { track };

  document.querySelectorAll("[data-analytics-event]").forEach((element) => {
    element.addEventListener("click", () => track(element.dataset.analyticsEvent, {
      ctaLocation: element.dataset.analyticsLocation,
      ctaType: element.dataset.analyticsCtaType
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
