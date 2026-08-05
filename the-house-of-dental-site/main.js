/* THE HOUSE OF DENTAL — shared interactions */
(function () {
  document.body.classList.remove("no-js");
  document.body.classList.add("js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----- Query-gated lab performance diagnostics (never sent off-site) ----- */
  const performanceDebugEnabled = ["1", "true"].includes(new URLSearchParams(window.location.search).get("hod_perf"));
  if (performanceDebugEnabled && "performance" in window) {
    const lab = {lcp: null, cls: 0, tbt: 0, longTasks: 0};
    const resultNode = document.createElement("script");
    resultNode.type = "application/json";
    resultNode.setAttribute("data-hod-performance-results", "");
    document.head.appendChild(resultNode);
    const summarize = () => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      const paints = performance.getEntriesByType("paint");
      const ownHost = window.location.hostname;
      const groups = {};
      let totalTransfer = navigation?.transferSize || 0;
      resources.forEach((entry) => {
        const type = entry.initiatorType || "other";
        const size = entry.transferSize || entry.encodedBodySize || 0;
        totalTransfer += size;
        groups[type] = groups[type] || {requests: 0, transferSize: 0, duration: 0};
        groups[type].requests += 1;
        groups[type].transferSize += size;
        groups[type].duration += entry.duration || 0;
      });
      const thirdParty = resources.filter((entry) => {
        try { return new URL(entry.name).hostname !== ownHost; } catch (error) { return false; }
      }).map((entry) => ({url: entry.name, type: entry.initiatorType, transferSize: entry.transferSize || 0, duration: entry.duration || 0}));
      resultNode.textContent = JSON.stringify({
        measuredAt: new Date().toISOString(),
        route: document.body.dataset.route,
        viewport: {width: window.innerWidth, height: window.innerHeight},
        navigation: navigation ? {
          ttfb: Math.max(0, navigation.responseStart - navigation.requestStart),
          domContentLoaded: navigation.domContentLoadedEventEnd,
          load: navigation.loadEventEnd,
          transferSize: navigation.transferSize || navigation.encodedBodySize || 0
        } : null,
        fcp: paints.find((entry) => entry.name === "first-contentful-paint")?.startTime || null,
        lcp: lab.lcp,
        cls: lab.cls,
        tbtProxy: lab.tbt,
        longTasks: lab.longTasks,
        totalTransfer,
        requests: resources.length + (navigation ? 1 : 0),
        groups,
        thirdParty
      });
    };
    if ("PerformanceObserver" in window) {
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length) lab.lcp = entries[entries.length - 1].startTime;
          summarize();
        }).observe({type: "largest-contentful-paint", buffered: true});
      } catch (error) { /* Unsupported performance entry type. */ }
      try {
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) lab.cls += entry.value;
          });
          summarize();
        }).observe({type: "layout-shift", buffered: true});
      } catch (error) { /* Unsupported performance entry type. */ }
      try {
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            lab.longTasks += 1;
            lab.tbt += Math.max(0, entry.duration - 50);
          });
          summarize();
        }).observe({type: "longtask", buffered: true});
      } catch (error) { /* Unsupported performance entry type. */ }
    }
    window.addEventListener("load", () => window.setTimeout(summarize, 0), {once: true});
    document.addEventListener("visibilitychange", summarize);
    summarize();
  }

  const focusableSelector = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'summary',
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  const focusable = (root) =>
    Array.from(root.querySelectorAll(focusableSelector)).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getClientRects().length > 0;
    });

  /* ----- Privacy-safe measurement contract ----- */
  const measurementNode = document.querySelector("[data-hod-measurement-config]");
  let measurementConfig = {};
  try {
    measurementConfig = JSON.parse(measurementNode?.textContent || "{}");
  } catch (error) {
    measurementConfig = {};
  }
  const debugParam = measurementConfig.debugQueryParam || "hod_debug";
  const debugEnabled = ["1", "true"].includes(new URLSearchParams(window.location.search).get(debugParam));
  const measurementEnabled = measurementConfig.enabled === true;
  const canEmitMeasurement = measurementEnabled || debugEnabled;
  const measurementStorageKey = "hod:measurement:v1";
  const successEventNames = new Set(["appointment_submit_success", "contact_submit_success", "offer_claim", "referral_submit_success"]);
  const readMeasurementStorage = () => {
    try {
      return JSON.parse(window.sessionStorage.getItem(measurementStorageKey) || "{}");
    } catch (error) {
      return {};
    }
  };
  const writeMeasurementStorage = (value) => {
    try {
      window.sessionStorage.setItem(measurementStorageKey, JSON.stringify(value));
    } catch (error) {
      /* Storage can be blocked; the in-memory contract still remains usable. */
    }
  };
  let measurementStorage = readMeasurementStorage();
  const safeToken = (value) => {
    const token = String(value || "").trim().toLowerCase();
    return /^[a-z0-9][a-z0-9._~-]{0,79}$/.test(token) ? token : null;
  };
  const safeHost = (value) => {
    try {
      const host = new URL(value).hostname.toLowerCase();
      return /^[a-z0-9.-]{1,253}$/.test(host) ? host : null;
    } catch (error) {
      return null;
    }
  };
  const captureAttribution = () => {
    const url = new URL(window.location.href);
    const allowedQueryKeys = measurementConfig.attribution?.allowedQueryKeys || ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
    const incoming = {};
    allowedQueryKeys.forEach((key) => {
      const value = safeToken(url.searchParams.get(key));
      if (value) incoming[key] = value;
    });
    const referrerHost = safeHost(document.referrer);
    if (referrerHost && referrerHost !== measurementConfig.ownHost) incoming.referrer_host = referrerHost;
    const hasIncoming = Object.keys(incoming).length > 0;
    if (!measurementStorage.attribution) measurementStorage.attribution = {};
    if (hasIncoming) {
      if (!measurementStorage.attribution.first) measurementStorage.attribution.first = incoming;
      measurementStorage.attribution.last = incoming;
    } else if (!measurementStorage.attribution.first && referrerHost && referrerHost !== measurementConfig.ownHost) {
      measurementStorage.attribution.first = { referrer_host: referrerHost };
      measurementStorage.attribution.last = { referrer_host: referrerHost };
    }
    const campaignId = safeToken(document.body.dataset.campaignId);
    if (campaignId && !measurementStorage.attribution.landing_page_id) {
      measurementStorage.attribution.landing_page_id = campaignId;
    }
    writeMeasurementStorage(measurementStorage);
  };
  captureAttribution();
  const getAttribution = () => measurementStorage.attribution?.last || measurementStorage.attribution?.first || {};
  const getCampaignSource = () => {
    const attribution = getAttribution();
    if (attribution.utm_source) return attribution.utm_source;
    if (attribution.referrer_host) return safeToken(`referrer_${attribution.referrer_host.replaceAll(".", "_")}`) || "referral";
    return "direct";
  };
  const rememberJourney = (element) => {
    const serviceSlug = safeToken(element?.dataset.hodServiceSlug || document.body.dataset.serviceSlug);
    const campaignId = safeToken(element?.dataset.hodCampaignId || document.body.dataset.campaignId);
    if (!serviceSlug && !campaignId) return;
    measurementStorage.journey = {
      ...(measurementStorage.journey || {}),
      ...(serviceSlug ? { service_slug: serviceSlug } : {}),
      ...(campaignId ? { campaign_id: campaignId } : {})
    };
    writeMeasurementStorage(measurementStorage);
  };
  const getServiceSlug = (element) => safeToken(
    element?.dataset.hodServiceSlug || document.body.dataset.serviceSlug || measurementStorage.journey?.service_slug
  );
  const getOnceKey = (key) => `emitted:${String(key || "event").toLowerCase().replace(/[^a-z0-9._~-]+/g, "_").slice(0, 120)}`;
  const wasEmitted = (key) => Boolean(measurementStorage.emitted?.[getOnceKey(key)]);
  const markEmitted = (key) => {
    measurementStorage.emitted = {...(measurementStorage.emitted || {}), [getOnceKey(key)]: true};
    writeMeasurementStorage(measurementStorage);
  };
  const contextFor = (element, overrides = {}) => ({
    page_type: safeToken(overrides.pageType || document.body.dataset.pageType) || "page",
    service_slug: safeToken(overrides.serviceSlug || getServiceSlug(element)),
    cta_location: safeToken(overrides.ctaLocation || element?.dataset.hodCtaLocation || "content") || "content",
    conversion_type: safeToken(overrides.conversionType || element?.dataset.hodConversionType || "conversion") || "conversion",
    campaign_source: getCampaignSource(),
    state: overrides.state || "activated"
  });
  const emitMeasurementEvent = (eventName, element, overrides = {}, onceKey = null) => {
    if (!canEmitMeasurement) return false;
    const allowedEvents = new Set(measurementConfig.allowedEvents || []);
    if (!allowedEvents.has(eventName)) return false;
    if (onceKey && wasEmitted(onceKey)) return false;
    const event = {event: eventName, ...contextFor(element, overrides)};
    if (!Array.isArray(window.__HOD_EVENTS__) && debugEnabled) window.__HOD_EVENTS__ = [];
    if (Array.isArray(window.__HOD_EVENTS__)) window.__HOD_EVENTS__.push(event);
    if ((measurementEnabled || debugEnabled) && !Array.isArray(window.dataLayer)) window.dataLayer = [];
    if ((measurementEnabled || debugEnabled) && Array.isArray(window.dataLayer)) window.dataLayer.push(event);
    if (onceKey) markEmitted(onceKey);
    return true;
  };
  const resetMeasurement = ({clearAttribution = false} = {}) => {
    measurementStorage = clearAttribution ? {} : {...measurementStorage, emitted: {}};
    writeMeasurementStorage(measurementStorage);
    if (Array.isArray(window.__HOD_EVENTS__)) window.__HOD_EVENTS__.length = 0;
    if (Array.isArray(window.dataLayer)) window.dataLayer.length = 0;
  };
  window.__HOD_MEASUREMENT__ = {
    enabled: measurementEnabled,
    debug: debugEnabled,
    config: measurementConfig,
    track: (eventName, details = {}) => emitMeasurementEvent(eventName, null, details, details.onceKey || null),
    getAttribution,
    reset: resetMeasurement
  };

  /* ----- Header height variable (fixed header offset) ----- */
  const hdr = document.querySelector("header.site");
  const setHeadH = () => {
    if (hdr) document.documentElement.style.setProperty("--head-h", hdr.offsetHeight + "px");
  };
  setHeadH();
  window.addEventListener("resize", setHeadH);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeadH);

  /* ----- Scroll reveals ----- */
  const revealElements = document.querySelectorAll(".rv, .rv-img, .rv-line");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );
    revealElements.forEach((el) => io.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("in"));
  }

  /* ----- Hero parallax ----- */
  const onScroll = () => {
    const bg = document.querySelector(".hero-bg");
    if (bg && !reduced) bg.style.transform = `translateY(${window.scrollY * 0.28}px)`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----- Counters ----- */
  window.animateCounter = function (el) {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;
    const dec = (el.dataset.count.split(".")[1] || "").length;
    const suffix = el.dataset.suffix || "";
    if (reduced) {
      el.textContent = el.dataset.count + suffix;
      return;
    }
    el.textContent = (0).toFixed(dec) + suffix;
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          window.animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      }),
      { threshold: 0.6 }
    );
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(window.animateCounter);
  }

  /* ----- Manual testimonial controls ----- */
  const quotes = Array.from(document.querySelectorAll("[data-quote]"));
  const dots = Array.from(document.querySelectorAll(".quote-dot"));
  if (quotes.length) {
    const status = document.querySelector("[data-quote-status]");
    const show = (index) => {
      const safeIndex = (index + quotes.length) % quotes.length;
      quotes.forEach((quote, n) => {
        const active = n === safeIndex;
        quote.hidden = !active;
        quote.setAttribute("aria-hidden", String(!active));
      });
      dots.forEach((dot, n) => {
        const active = n === safeIndex;
        dot.classList.toggle("on", active);
        dot.setAttribute("aria-current", String(active));
        dot.setAttribute("aria-selected", String(active));
      });
      if (status) status.textContent = `Testimonial ${safeIndex + 1} of ${quotes.length}`;
    };
    dots.forEach((dot, index) => dot.addEventListener("click", () => show(index)));
    show(0);
  }

  /* ----- Accessible before / after comparisons ----- */
  /* ----- Findable care guides with no-JS content preserved ----- */
  const careBlocks = Array.from(document.querySelectorAll(".care-block[data-care-guide]"));
  const careSearch = document.getElementById("care-search-input");
  const careResults = document.getElementById("care-results");
  const careFilters = Array.from(document.querySelectorAll("[data-care-filter]"));
  if (careBlocks.length) {
    let activeCareCategory = "all";
    const updateCareResults = () => {
      const query = (careSearch?.value || "").trim().toLowerCase();
      let visible = 0;
      careBlocks.forEach((block) => {
        const categoryMatch = activeCareCategory === "all" || block.dataset.careCategory === activeCareCategory;
        const textMatch = !query || block.textContent.toLowerCase().includes(query);
        const isVisible = categoryMatch && textMatch;
        block.hidden = !isVisible;
        if (isVisible) visible += 1;
      });
      if (careResults) {
        careResults.textContent = query || activeCareCategory !== "all"
          ? `Showing ${visible} of ${careBlocks.length} care guides`
          : `Showing all ${careBlocks.length} care guides`;
      }
    };
    careSearch?.addEventListener("input", updateCareResults);
    careFilters.forEach((filter) => filter.addEventListener("click", () => {
      activeCareCategory = filter.dataset.careFilter || "all";
      careFilters.forEach((item) => {
        const active = item === filter;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      updateCareResults();
    }));
    updateCareResults();
  }

  document.querySelectorAll(".care-toggle").forEach((toggle) => {
    const panelId = toggle.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    const label = toggle.querySelector("span:first-child");
    const icon = toggle.querySelector(".care-toggle-icon");
    if (!panel) return;
    const setExpanded = (expanded) => {
      toggle.setAttribute("aria-expanded", String(expanded));
      panel.hidden = !expanded;
      if (label) label.textContent = expanded ? "Hide care instructions" : "Show care instructions";
      if (icon) icon.textContent = expanded ? "−" : "+";
    };
    setExpanded(toggle.getAttribute("aria-expanded") !== "false");
    toggle.addEventListener("click", () => setExpanded(toggle.getAttribute("aria-expanded") !== "true"));
  });

  /* ----- Accessible before / after comparisons ----- */
  document.querySelectorAll(".ba").forEach((ba) => {
    const wrap = ba.querySelector(".after-wrap");
    const handle = ba.querySelector(".handle");
    const range = ba.parentElement.querySelector(".ba-range") || ba.querySelector(".ba-range");
    const output = ba.parentElement.querySelector("[data-ba-output]") || ba.querySelector("[data-ba-output]");
    if (!wrap || !handle) return;

    const sync = (value) => {
      const p = Math.max(0, Math.min(100, Number(value)));
      wrap.style.clipPath = `inset(0 0 0 ${p}%)`;
      handle.style.left = p + "%";
      if (range) {
        range.value = String(p);
        range.setAttribute("aria-valuetext", `${p}% after`);
      }
      if (output) output.textContent = `${p}% after`;
    };
    const fromClientX = (clientX) => {
      const rect = ba.getBoundingClientRect();
      sync(((clientX - rect.left) / rect.width) * 100);
    };

    if (range) range.addEventListener("input", () => sync(range.value));
    let dragging = false;
    ba.addEventListener("pointerdown", (event) => {
      if (event.target === range || range?.contains(event.target)) return;
      dragging = true;
      ba.setPointerCapture?.(event.pointerId);
      fromClientX(event.clientX);
    });
    ba.addEventListener("pointermove", (event) => {
      if (dragging) fromClientX(event.clientX);
    });
    const stopDragging = () => { dragging = false; };
    ba.addEventListener("pointerup", stopDragging);
    ba.addEventListener("pointercancel", stopDragging);
    sync(range ? range.value : 50);
  });

  /* ----- Mobile navigation ----- */
  const burger = document.querySelector(".burger");
  const menu = document.querySelector(".menu");
  const isMobileNav = () => window.innerWidth <= 1024;
  let menuOpen = false;

  if (burger && menu) {
    if (!menu.id) menu.id = "primary-navigation";
    burger.type = "button";
    burger.setAttribute("aria-controls", menu.id);
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    menu.setAttribute("aria-label", "Primary navigation");

    const submenuButtons = [];
    Array.from(menu.children).forEach((li, index) => {
      if (li.tagName !== "LI") return;
      const link = Array.from(li.children).find((child) => child.tagName === "A");
      const submenu = Array.from(li.children).find((child) => child.classList?.contains("drop"));
      if (!link || !submenu) return;

      const row = document.createElement("div");
      row.className = "menu-item-row";
      li.insertBefore(row, link);
      row.appendChild(link);

      const submenuId = submenu.id || `primary-submenu-${index + 1}`;
      submenu.id = submenuId;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "submenu-toggle";
      button.setAttribute("aria-controls", submenuId);
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", `Open ${link.textContent.trim()} submenu`);
      button.innerHTML = '<span class="sr-only">Toggle submenu</span><span class="toggle-symbol" aria-hidden="true">+</span>';
      row.appendChild(button);
      submenuButtons.push({ button, li, link });
    });

    const setSubmenu = (item, open) => {
      item.li.classList.toggle("open-sub", open);
      item.button.setAttribute("aria-expanded", String(open));
      item.button.setAttribute("aria-label", `${open ? "Close" : "Open"} ${item.link.textContent.trim()} submenu`);
      item.li.querySelector(".drop")?.setAttribute("aria-hidden", String(isMobileNav() ? !open : false));
    };
    const closeSubmenus = () => submenuButtons.forEach((item) => setSubmenu(item, false));
    submenuButtons.forEach((item) => setSubmenu(item, false));
    const setMenuInert = (inert) => {
      if (inert) {
        menu.setAttribute("inert", "");
      } else {
        menu.removeAttribute("inert");
      }
    };
    const openMenu = () => {
      menuOpen = true;
      menu.classList.add("open");
      menu.setAttribute("aria-hidden", "false");
      setMenuInert(false);
      burger.classList.add("open");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Close menu");
      document.body.classList.add("menu-open");
      const enterMenuFocus = () => {
        if (menuOpen) focusable(menu)[0]?.focus();
      };
      window.requestAnimationFrame(enterMenuFocus);
      window.setTimeout(enterMenuFocus, 60);
    };
    const closeMenu = (returnFocus = true) => {
      const wasOpen = menuOpen;
      menuOpen = false;
      menu.classList.remove("open");
      menu.setAttribute("aria-hidden", isMobileNav() ? "true" : "false");
      setMenuInert(isMobileNav());
      closeSubmenus();
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("menu-open");
      if (wasOpen && returnFocus) burger.focus();
    };

    const syncMenuForViewport = () => {
      if (isMobileNav()) {
        if (!menuOpen) {
          menu.setAttribute("aria-hidden", "true");
          setMenuInert(true);
        }
      } else {
        if (menuOpen) closeMenu(false);
        menu.setAttribute("aria-hidden", "false");
        setMenuInert(false);
      }
    };
    syncMenuForViewport();

    burger.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
    submenuButtons.forEach((item) => item.button.addEventListener("click", () => {
      const open = item.button.getAttribute("aria-expanded") !== "true";
      submenuButtons.forEach((other) => { if (other !== item) setSubmenu(other, false); });
      setSubmenu(item, open);
    }));
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      if (menuOpen) closeMenu(false);
    }));
    document.addEventListener("keydown", (event) => {
      if (!menuOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable(menu);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.addEventListener("focusin", (event) => {
      if (menuOpen && !menu.contains(event.target) && event.target !== burger) focusable(menu)[0]?.focus();
    });
    window.addEventListener("resize", syncMenuForViewport);
  }

  /* ----- Data-driven service, technology, and payment enhancements ----- */
  const readInlineJson = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || "null");
    } catch (error) {
      console.error(`Unable to read ${selector}`, error);
      return null;
    }
  };
  const technologyData = readInlineJson('script[data-tech-data]');
  const serviceData = readInlineJson('script[data-service-data]');
  const richText = (paragraphs = []) => paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
  const itemList = (items = []) => items.length ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>` : "";
  const openModal = (modal) => modal?.classList.add("open");
  const closeModal = (modal) => modal?.classList.remove("open");

  const technologyModal = document.getElementById("techmodal");
  if (technologyData && technologyModal) {
    const category = technologyModal.querySelector("#techm-cat");
    const title = technologyModal.querySelector("#techm-title");
    const body = technologyModal.querySelector("#techm-body");
    const soon = technologyModal.querySelector("#techm-soon");
    const showTechnology = (key) => {
      const record = technologyData[key];
      if (!record) return;
      if (category) category.textContent = record.cat || "";
      if (title) title.innerHTML = record.title || "";
      if (body) body.innerHTML = `${richText(record.paras)}${itemList(record.items)}`;
      if (soon) soon.style.display = record.soon ? "block" : "none";
      openModal(technologyModal);
    };
    document.querySelectorAll(".tech-card[data-tech]").forEach((card) => {
      card.addEventListener("click", () => showTechnology(card.dataset.tech));
    });
    technologyModal.querySelectorAll("[data-close]").forEach((control) => {
      control.addEventListener("click", () => closeModal(technologyModal));
    });
    const technologyHash = location.hash.slice(1);
    if (technologyHash && technologyData[technologyHash]) window.setTimeout(() => showTechnology(technologyHash), 0);
  }

  const serviceModal = document.getElementById("svcmodal");
  if (serviceData && serviceModal) {
    const image = serviceModal.querySelector("#svcm-img");
    const category = serviceModal.querySelector("#svcm-cat");
    const title = serviceModal.querySelector("#svcm-title");
    const body = serviceModal.querySelector("#svcm-body");
    const showService = (key) => {
      const record = serviceData[key];
      if (!record) return;
      if (image) {
        image.src = record.img || "";
        image.alt = record.title || "";
      }
      if (category) category.textContent = record.cat || "";
      if (title) title.innerHTML = record.title || "";
      if (body) body.innerHTML = `${richText(record.paras)}${itemList(record.items)}`;
      openModal(serviceModal);
    };
    document.querySelectorAll(".svc-card:not(.svc-card-gated)[data-svc]").forEach((card) => {
      card.addEventListener("click", () => showService(card.dataset.svc));
    });
    serviceModal.querySelectorAll("[data-close]").forEach((control) => {
      control.addEventListener("click", () => closeModal(serviceModal));
    });
    const serviceHash = location.hash.slice(1);
    if (serviceHash && serviceData[serviceHash]) window.setTimeout(() => showService(serviceHash), 0);
  }

  const cherryRange = document.getElementById("chr-range");
  if (cherryRange) {
    const amount = document.getElementById("chr-amt");
    const biweekly = document.getElementById("chr-bi");
    const month24 = document.getElementById("chr-24");
    const month60 = document.getElementById("chr-60");
    const formatCurrency = (value) => `$${Math.round(value).toLocaleString("en-US")}`;
    const updateCherry = () => {
      const value = Number(cherryRange.value);
      if (amount) amount.textContent = formatCurrency(value);
      if (biweekly) biweekly.innerHTML = value <= 3000
        ? `${formatCurrency(value / 4)} <i>&times;4</i>`
        : '<i class="na">Over $3,000</i>';
      if (month24) month24.innerHTML = `${formatCurrency(value / 24)}<i>/mo</i>`;
      if (month60) month60.innerHTML = `${formatCurrency(value / 60)}<i>/mo</i>`;
    };
    cherryRange.addEventListener("input", updateCherry);
    updateCherry();
  }

  /* ----- Accessible dialog lifecycle for service and technology modals ----- */
  const dialogTriggers = new WeakMap();
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.(".svc-card:not(.svc-card-gated), .tech-card");
    if (!trigger) return;
    const modal = document.getElementById(trigger.classList.contains("tech-card") ? "techmodal" : "svcmodal");
    if (modal) dialogTriggers.set(modal, trigger);
  }, true);

  const setElementInert = (element, value) => {
    if (value) {
      element.setAttribute("inert", "");
      if ("inert" in element) element.inert = true;
    } else {
      if ("inert" in element) element.inert = false;
      element.removeAttribute("inert");
    }
  };

  document.querySelectorAll(".svcmodal").forEach((modal) => {
    const panel = modal.querySelector(".panel");
    const closeButton = modal.querySelector("[data-close].close");
    if (!panel) return;
    panel.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");
    let open = false;
    let isolated = [];

    const isolateBackground = () => {
      isolated = [];
      let current = modal;
      while (current && current.parentElement) {
        const parent = current.parentElement;
        Array.from(parent.children).forEach((sibling) => {
          if (sibling === current || sibling.tagName === "SCRIPT") return;
          isolated.push({
            element: sibling,
            ariaHidden: sibling.getAttribute("aria-hidden"),
            hadInert: sibling.hasAttribute("inert")
          });
          setElementInert(sibling, true);
          sibling.setAttribute("aria-hidden", "true");
        });
        if (parent === document.body) break;
        current = parent;
      }
    };
    const restoreBackground = () => {
      isolated.forEach(({ element, ariaHidden, hadInert }) => {
        if (!hadInert) setElementInert(element, false);
        else setElementInert(element, true);
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      isolated = [];
    };
    const onOpen = () => {
      if (open) return;
      open = true;
      modal.setAttribute("aria-hidden", "false");
      isolateBackground();
      document.body.classList.add("modal-open");
      window.requestAnimationFrame(() => (focusable(modal)[0] || panel).focus({ preventScroll: true }));
    };
    const onClose = () => {
      if (!open) return;
      open = false;
      modal.setAttribute("aria-hidden", "true");
      restoreBackground();
      document.body.classList.remove("modal-open");
      const trigger = dialogTriggers.get(modal);
      if (trigger && document.contains(trigger)) trigger.focus();
    };
    const observer = new MutationObserver(() => {
      if (modal.classList.contains("open")) onOpen();
      else onClose();
    });
    observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
    modal.addEventListener("keydown", (event) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeButton?.click();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable(modal);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    modal.addEventListener("focusin", (event) => {
      if (open && !modal.contains(event.target)) (focusable(modal)[0] || panel).focus();
    });
  });

  /* ----- Accessible form integration adapter ----- */
  const emitFormState = (form, state) => emitMeasurementEvent("form_state", form, {
    ctaLocation: form.dataset.ctaLocation || "appointment_form",
    conversionType: form.dataset.conversionType || "form",
    state: state === "validation_error" ? "validation_error" : state === "timeout" ? "timeout" : state === "blocked" || state === "blocked_unconfigured" ? "blocked" : state === "server_error" || state === "network_error" ? "failure" : "started"
  });
  const emitFormSuccess = (form) => {
    const eventName = form.dataset.hodSuccessEvent;
    if (!successEventNames.has(eventName)) return false;
    const journeyKey = measurementStorage.journey?.campaign_id || measurementStorage.journey?.service_slug || "direct";
    const onceKey = ["success", form.dataset.hodFormId || form.name || "form", eventName, journeyKey].join(":");
    return emitMeasurementEvent(eventName, form, {
      ctaLocation: form.dataset.ctaLocation || "appointment_form",
      conversionType: form.dataset.conversionType || "form",
      state: "success"
    }, onceKey);
  };
  const appendApprovedCrmAttribution = (payload, form) => {
    if (measurementConfig.crmMappingEnabled !== true) return;
    const attribution = getAttribution();
    const fields = {
      campaign_source: getCampaignSource(),
      campaign_medium: attribution.utm_medium,
      campaign_name: attribution.utm_campaign,
      campaign_content: attribution.utm_content,
      referrer_host: attribution.referrer_host,
      service_slug: getServiceSlug(form),
      landing_page_id: measurementStorage.journey?.campaign_id || measurementStorage.attribution?.landing_page_id
    };
    Object.entries(fields).forEach(([key, value]) => {
      if (value) payload.set(key, value);
    });
  };

  document.querySelectorAll("form").forEach((form) => {
    const status = form.querySelector('[role="status"]');
    const summary = form.querySelector("[data-form-error-summary]");
    const summaryList = summary?.querySelector("ul");
    const retry = form.querySelector("[data-form-retry]");
    const submit = form.querySelector('button[type="submit"]');
    const honeypot = form.querySelector("[data-honeypot]");
    let inFlight = false;
    let invalidTimer = null;
    let formStarted = false;
    const formId = form.dataset.hodFormId || form.name || form.id || "form";

    const fieldError = (field) => field?.id ? document.getElementById(`${field.id}-error`) : null;
    const labelFor = (field) => field?.labels?.[0]?.textContent?.replace(/\s+/g, " ").trim() || "This field";
    const clearFieldError = (field) => {
      if (!field?.matches?.("input, select, textarea")) return;
      field.removeAttribute("aria-invalid");
      const error = fieldError(field);
      if (error) error.textContent = "";
    };
    const errorText = (field) => {
      if (field.validity.valueMissing) return "This field is required.";
      if (field.validity.typeMismatch) return "Enter a valid email address.";
      if (field.validity.patternMismatch) return "Use the requested format.";
      return "Check this field and try again.";
    };
    const clearSummary = () => {
      if (!summary) return;
      summary.hidden = true;
      if (summaryList) summaryList.replaceChildren();
    };
    const showStatus = (message, tone = "info") => {
      if (!status) return;
      status.hidden = false;
      status.dataset.tone = tone;
      status.textContent = message;
    };
    const showValidation = () => {
      const fields = Array.from(form.elements).filter((field) =>
        field.matches?.('input:not([type="hidden"]), select, textarea') && !field.checkValidity()
      );
      if (!fields.length) return true;
      clearSummary();
      fields.forEach((field) => {
        field.setAttribute("aria-invalid", "true");
        const error = fieldError(field);
        if (error) error.textContent = errorText(field);
        if (summaryList) {
          const item = document.createElement("li");
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = `${labelFor(field)}: ${errorText(field)}`;
          button.addEventListener("click", () => field.focus());
          item.appendChild(button);
          summaryList.appendChild(item);
        }
      });
      if (summary) {
        summary.hidden = false;
        summary.focus({ preventScroll: true });
      }
      showStatus("Please review the highlighted fields before sending.", "validation");
      emitFormState(form, "validation_error");
      return false;
    };
    const setSubmitting = (value) => {
      inFlight = value;
      form.dataset.submitting = String(value);
      if (submit) {
        submit.disabled = value;
        submit.setAttribute("aria-busy", String(value));
      }
    };
    const sendToApprovedHandler = async (payload, endpoint) => {
      if (typeof window.__HOD_FORM_ADAPTER__ === "function") {
        return window.__HOD_FORM_ADAPTER__({ form, payload, endpoint });
      }
      if (!endpoint) return { ok: false, kind: "unconfigured" };
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: payload,
          headers: { Accept: "application/json" },
          credentials: "omit",
          signal: controller.signal
        });
        return response.ok
          ? { ok: true }
          : { ok: false, kind: "server", status: response.status };
      } finally {
        window.clearTimeout(timeout);
      }
    };

    form.addEventListener("invalid", (event) => {
      const field = event.target;
      if (!field.matches?.("input, select, textarea")) return;
      field.setAttribute("aria-invalid", "true");
      const error = fieldError(field);
      if (error) error.textContent = errorText(field);
      showStatus("Please review the highlighted fields before sending.", "validation");
      if (!invalidTimer) {
        invalidTimer = true;
        showValidation();
        window.setTimeout(() => {
          invalidTimer = null;
        }, 0);
      }
    }, true);
    form.addEventListener("input", (event) => {
      const field = event.target;
      if (!field.matches?.("input, select, textarea")) return;
      if (field.checkValidity()) clearFieldError(field);
      if (form.checkValidity()) clearSummary();
    });
    form.addEventListener("focusin", () => {
      if (formStarted) return;
      formStarted = true;
      rememberJourney(form);
      emitMeasurementEvent("form_start", form, {
        ctaLocation: form.dataset.ctaLocation || "appointment_form",
        conversionType: form.dataset.conversionType || "form",
        state: "started"
      }, ["form_start", document.body.dataset.route || "page", formId].join(":"));
    });
    retry?.addEventListener("click", () => form.requestSubmit());
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (inFlight) {
        showStatus("This request is already being processed. Please wait.", "info");
        return;
      }
      if (!showValidation()) return;
      if (honeypot?.value.trim()) {
        showStatus("We could not send this request. Please call the office instead.", "error");
        emitFormState(form, "blocked");
        return;
      }

      const endpoint = (form.dataset.handlerUrl || "").trim();
      const payload = new FormData(form);
      appendApprovedCrmAttribution(payload, form);
      setSubmitting(true);
      if (retry) retry.hidden = true;
      showStatus("Preparing your request…", "loading");
      emitFormState(form, "submit_start");
      try {
        const result = await sendToApprovedHandler(payload, endpoint);
        if (result?.ok) {
          emitFormSuccess(form);
          showStatus("Your request was sent to the approved intake system. Opening the confirmation page…", "success");
          const successUrl = form.dataset.successUrl;
          if (successUrl) window.setTimeout(() => window.location.assign(successUrl), 120);
          return;
        }
        if (result?.kind === "unconfigured") {
          showStatus("Online appointment requests are not connected in this local build, so nothing was sent. Please call the office to request an appointment.", "error");
          emitFormState(form, "blocked_unconfigured");
        } else if (result?.kind === "server") {
          showStatus("The intake system did not accept this request. Nothing was confirmed. Try again or call the office.", "error");
          if (retry) retry.hidden = false;
          emitFormState(form, "server_error");
        } else {
          showStatus("The request could not be sent. Nothing was confirmed. Check your connection and try again, or call the office.", "error");
          if (retry) retry.hidden = false;
          emitFormState(form, "network_error");
        }
      } catch (error) {
        const timedOut = error?.name === "AbortError";
        showStatus(timedOut
          ? "The request timed out before it could be confirmed. Nothing was confirmed. Try again or call the office."
          : "The request could not be sent. Nothing was confirmed. Check your connection and try again, or call the office.", "error");
        if (retry) retry.hidden = false;
        emitFormState(form, timedOut ? "timeout" : "network_error");
      } finally {
        setSubmitting(false);
      }
    });
  });

  /* ----- Privacy-safe conversion hooks ----- */
  const inferEventNames = (element) => {
    const explicit = element.dataset.hodEvents || element.dataset.hodEvent;
    if (explicit) return explicit.split(",").map((value) => value.trim()).filter(Boolean);
    const source = (element.dataset.conversionSource || "").toLowerCase();
    const href = (element.getAttribute("href") || "").toLowerCase();
    if (source.includes("emergency") || source.includes("urgent") || element.closest(".urgent-callout, .emergency-primary")) return ["emergency_call"];
    if (source.includes("direction") || source.includes("map")) return ["directions_click"];
    if (source.includes("financing") || source.includes("insurance") || source.includes("payment")) return ["financing_click"];
    if (href.startsWith("tel:")) return ["click_to_call"];
    if (href.includes("contact.html#book") || href.includes("contact/#book") || href === "#book" || source.includes("appointment") || source.includes("request")) return ["appointment_click"];
    return [];
  };
  document.querySelectorAll("a[href]").forEach((element) => {
    element.addEventListener("click", () => {
      rememberJourney(element);
      inferEventNames(element).forEach((eventName) => {
        if (successEventNames.has(eventName) || eventName === "form_start") return;
        emitMeasurementEvent(eventName, element, {
          ctaLocation: element.dataset.hodCtaLocation || element.dataset.conversionSource || "content",
          conversionType: element.dataset.hodConversionType || (eventName === "click_to_call" || eventName === "emergency_call" ? "call" : eventName === "directions_click" ? "directions" : eventName === "financing_click" ? "financing" : "appointment_request"),
          state: "activated"
        });
      });
    });
  });

  /* ----- Image failure fallback marker ----- */
  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => image.setAttribute("data-failed", "true"));
    if (image.complete && image.naturalWidth === 0) image.setAttribute("data-failed", "true");
  });

  /* ----- Mark active top-level nav link ----- */
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".menu > li > a, .menu-item-row > a").forEach((link) => {
    const href = (link.getAttribute("href") || "").split("#")[0];
    if (href === here) link.classList.add("active");
  });
})();
