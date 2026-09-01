(() => {
  const body = document.body;
  const button = document.querySelector(".burger");
  const menu = document.querySelector(".menu");
  const mobileNavigation = window.matchMedia("(max-width: 1024px)");
  const hybridNavigation = () => window.matchMedia("(min-width: 1025px) and (max-width: 1365px)").matches;
  const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

  const isAvailable = (element) => {
    if (!element) return false;
    for (let current = element; current && current !== document.body; current = current.parentElement) {
      if (current.hidden || current.disabled || current.inert || current.getAttribute("aria-hidden") === "true") return false;
      const styles = window.getComputedStyle?.(current);
      if (styles && (styles.display === "none" || styles.visibility === "hidden")) return false;
    }
    return true;
  };
  const focusWithoutScroll = (element) => {
    if (!isAvailable(element) || typeof element.focus !== "function") return false;
    try { element.focus({ preventScroll: true }); }
    catch { element.focus(); }
    return true;
  };

  let returnFocus;
  let previousBodyOverflow = null;
  let inerted = [];
  const setBackgroundInert = (inert) => {
    if (inert) {
      if (inerted.length) return;
      inerted = [...document.querySelectorAll("body > :not(.menu):not(.site)")]
        .map((element) => ({ element, inert: element.inert }));
      inerted.forEach(({ element }) => { element.inert = true; });
      return;
    }
    inerted.forEach(({ element, inert }) => { element.inert = inert; });
    inerted = [];
  };

  const focusable = () => menu ? [...menu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.disabled && isAvailable(element)) : [];
  const syncMenuAttributes = () => {
    if (!button || !menu) return;
    const mobile = mobileNavigation.matches;
    const open = mobile && menu.classList.contains("open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    button.setAttribute("aria-hidden", String(!mobile));
    button.tabIndex = mobile ? 0 : -1;
    menu.setAttribute("aria-hidden", String(mobile && !open));
    menu.inert = mobile && !open;
  };
  const clearMenuFocus = () => {
    const active = document.activeElement;
    if (active && (active === button || menu?.contains(active))) active.blur?.();
  };
  const setMenuOpen = (open, { restoreFocus = false, clearFocus = false } = {}) => {
    if (!button || !menu) return;
    if (open && !mobileNavigation.matches) return;

    const wasOpen = menu.classList.contains("open");
    if (open) {
      if (!wasOpen) {
        returnFocus = document.activeElement;
        previousBodyOverflow = body.style.overflow;
      }
      button.classList.add("open");
      menu.classList.add("open");
      body.classList.add("menu-open");
      body.style.overflow = "hidden";
      menu.inert = false;
      syncMenuAttributes();
      setBackgroundInert(true);
      if (!wasOpen) focusWithoutScroll(focusable()[0]);
      return;
    }

    const focusTarget = restoreFocus ? returnFocus : null;
    if (clearFocus) clearMenuFocus();
    button.classList.remove("open");
    menu.classList.remove("open");
    body.classList.remove("menu-open");
    setBackgroundInert(false);
    syncMenuAttributes();
    if (wasOpen || previousBodyOverflow !== null || body.style.overflow === "hidden") {
      if (previousBodyOverflow === null) body.style.removeProperty("overflow");
      else body.style.overflow = previousBodyOverflow;
    }
    previousBodyOverflow = null;
    returnFocus = null;
    if (focusTarget) focusWithoutScroll(focusTarget);
  };

  if (button && menu) {
    setMenuOpen(false);
    button.addEventListener("click", () => setMenuOpen(!menu.classList.contains("open"), { restoreFocus: true }));
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false, { restoreFocus: true })));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        event.preventDefault();
        setMenuOpen(false, { restoreFocus: true });
        return;
      }
      if (event.key !== "Tab" || !menu.classList.contains("open")) return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!menu.contains(document.activeElement)) {
        event.preventDefault();
        focusWithoutScroll(event.shiftKey ? last : first);
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        focusWithoutScroll(last);
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        focusWithoutScroll(first);
      }
    });
  }

  const more = document.querySelector("[data-nav-more]");
  const moreToggle = more?.querySelector("[data-nav-more-toggle]");
  const moreDrop = more?.querySelector(".nav-more-panel");
  const moreLinks = more ? [...more.querySelectorAll(".nav-more-panel a")] : [];
  const setMoreOpen = (open) => {
    if (!more || !moreToggle) return;
    more.classList.toggle("is-open", open);
    moreToggle.setAttribute("aria-expanded", String(open));
    moreDrop?.setAttribute("aria-hidden", String(hybridNavigation() && !open));
  };
  if (more && moreToggle) {
    let hoverSuppressed = false;
    let hoverOpened = false;
    setMoreOpen(false);
    more.addEventListener("mouseenter", () => {
      if (!hoverSuppressed && !more.classList.contains("is-open")) {
        hoverOpened = true;
        setMoreOpen(true);
      }
    });
    more.addEventListener("mouseleave", () => {
      hoverSuppressed = false;
      hoverOpened = false;
      if (!more.contains(document.activeElement)) setMoreOpen(false);
    });
    more.addEventListener("focusin", (event) => {
      if (event.target !== moreToggle) {
        hoverSuppressed = false;
        hoverOpened = false;
        setMoreOpen(true);
      }
    });
    more.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!more.contains(document.activeElement) && !more.matches(":hover")) setMoreOpen(false);
      });
    });
    moreToggle.addEventListener("click", () => {
      if (hoverOpened && more.classList.contains("is-open")) {
        hoverOpened = false;
        setMoreOpen(true);
        return;
      }
      const open = !more.classList.contains("is-open");
      hoverOpened = false;
      hoverSuppressed = !open;
      setMoreOpen(open);
    });
    moreLinks.forEach((link) => link.addEventListener("click", () => setMoreOpen(false)));
    document.addEventListener("click", (event) => {
      if (!more.contains(event.target)) setMoreOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && more.classList.contains("is-open")) {
        setMoreOpen(false);
        focusWithoutScroll(moreToggle);
      }
    });
  }

  const normalizePath = (path) => {
    const pathname = path.split("#")[0].replace(/\/+$/, "");
    return pathname ? (pathname.startsWith("/") ? pathname : `/${pathname}`) : "/";
  };
  const current = normalizePath(location.pathname);
  document.querySelectorAll("[data-primary-link]").forEach((link) => {
    const paths = [link.getAttribute("href"), ...(link.dataset.activePaths?.split(/\s+/) || [])]
      .filter(Boolean)
      .map(normalizePath);
    const prefix = link.dataset.activePrefix ? normalizePath(link.dataset.activePrefix) : "";
    const active = paths.includes(current) || Boolean(prefix && (current === prefix || current.startsWith(`${prefix}/`)));
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const clearStaleNavigationFocus = () => {
    const active = document.activeElement;
    if (!active || active === document.body) return;
    if ((button && active === button && !isAvailable(button))
      || (menu && menu.contains(active) && (!menu.classList.contains("open") || !isAvailable(active)))
      || (moreDrop && moreDrop.contains(active) && !isAvailable(active))) active.blur?.();
  };
  let previousMobileMode = mobileNavigation.matches;
  const syncResponsiveNavigation = () => {
    const mobile = mobileNavigation.matches;
    const modeChanged = mobile !== previousMobileMode;
    const staleMenuState = menu && (menu.classList.contains("open") || body.classList.contains("menu-open"));
    if (modeChanged || (!mobile && staleMenuState)) setMenuOpen(false, { clearFocus: true });
    else syncMenuAttributes();
    if (modeChanged) setMoreOpen(false);
    const hybrid = hybridNavigation();
    moreToggle?.setAttribute("aria-hidden", String(!hybrid));
    moreDrop?.setAttribute("aria-hidden", String(hybrid && !more?.classList.contains("is-open")));
    more?.classList.toggle("has-active", moreLinks.some((link) => link.classList.contains("active")));
    if (!hybrid) setMoreOpen(false);
    clearStaleNavigationFocus();
    previousMobileMode = mobile;
  };
  syncResponsiveNavigation();
  addEventListener("resize", syncResponsiveNavigation, { passive: true });
  mobileNavigation.addEventListener?.("change", syncResponsiveNavigation);

  const getHashTarget = (hash = location.hash) => {
    if (!hash || hash === "#") return null;
    let id = hash.slice(1);
    try { id = decodeURIComponent(id); }
    catch { /* Keep the raw fragment when it is not valid URI encoding. */ }
    return id ? document.getElementById(id) : null;
  };
  const alignHashTarget = (target, behavior = "auto") => {
    if (!target) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (target.isConnected === false || getHashTarget() !== target) return;
      if (behavior === "smooth" && !reducedMotion()) target.scrollIntoView({ block: "start", behavior: "smooth" });
      else target.scrollIntoView({ block: "start" });
    }));
  };

  const careSections = [...document.querySelectorAll(".care-block[id]")];
  const mobileCareGuide = window.matchMedia("(max-width: 800px)");
  const scrollToCareSection = () => {
    if (!mobileCareGuide.matches || !location.hash || !careSections.length) return false;
    const target = careSections.find((section) => `#${section.id}` === location.hash);
    if (!target) return false;
    alignHashTarget(target);
    return true;
  };
  // The appointment request fragment opens the fixed drawer (45-inquiry.js)
  // instead of scrolling the page.
  const isInquiryHash = (hash = location.hash) => hash === "#request" || hash === "#book";
  const alignPageHash = () => {
    syncResponsiveNavigation();
    if (isInquiryHash() || scrollToCareSection()) return;
    alignHashTarget(getHashTarget());
  };

  document.querySelectorAll("a[href]").forEach((link) => link.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (link.hasAttribute("download") || (link.target && link.target.toLowerCase() !== "_self")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || normalizePath(url.pathname) !== current || url.search !== location.search || !url.hash || url.hash === "#" || isInquiryHash(url.hash)) return;
    const target = getHashTarget(url.hash);
    if (!target || !isAvailable(target)) return;
    event.preventDefault();
    if (url.pathname !== location.pathname || url.search !== location.search || url.hash !== location.hash) {
      history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    alignHashTarget(target, "smooth");
  }));

  alignPageHash();
  addEventListener("hashchange", alignPageHash);
  addEventListener("popstate", alignPageHash);
  addEventListener("pageshow", alignPageHash);
  addEventListener("load", alignPageHash);
})();
