(() => {
  const button = document.querySelector(".burger");
  const menu = document.querySelector(".menu");
  if (button && menu) {
    const focusable = () => [...menu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')];
    const setBackgroundInert = (inert) => document.querySelectorAll('body > :not(.menu):not(.site)').forEach((element) => { element.inert = inert; });
    let returnFocus;
    const close = () => {
      button.classList.remove("open");
      menu.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open menu");
      document.body.style.overflow = "";
      menu.setAttribute("aria-hidden", "true");
      setBackgroundInert(false);
      returnFocus?.focus();
    };
    button.addEventListener("click", () => {
      const open = !menu.classList.contains("open");
      button.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
      menu.setAttribute("aria-hidden", String(!open));
      setBackgroundInert(open);
      if (open) { returnFocus = document.activeElement; focusable()[0]?.focus(); }
    });
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        close();
        button.focus();
      }
      if (event.key === "Tab" && menu.classList.contains("open")) {
        const items = focusable();
        if (!items.length) return;
        const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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

  // Mobile browsers can restore the previous scroll position after following a
  // cross-page hash link. Reapply the selected care section once the guide has
  // finished laying out so Treatment Care links always reveal their section.
  const careSections = [...document.querySelectorAll(".care-block[id]")];
  const mobileCareGuide = window.matchMedia("(max-width: 800px)");
  const scrollToCareSection = () => {
    if (!mobileCareGuide.matches || !location.hash || !careSections.length) return;
    const target = careSections.find((section) => `#${section.id}` === location.hash);
    if (!target) return;
    requestAnimationFrame(() => requestAnimationFrame(() => target.scrollIntoView({ block: "start" })));
  };
  if (careSections.length) {
    scrollToCareSection();
    window.addEventListener("hashchange", scrollToCareSection);
    window.addEventListener("pageshow", scrollToCareSection);
  }

  const booking = document.querySelector("#book");
  const alignBookingHash = () => {
    if (!booking || location.hash !== "#book") return;
    requestAnimationFrame(() => requestAnimationFrame(() => booking.scrollIntoView({ block: "start" })));
  };
  if (booking) {
    alignBookingHash();
    addEventListener("hashchange", alignBookingHash);
    addEventListener("load", alignBookingHash);
    addEventListener("pageshow", alignBookingHash);
  }
})();
