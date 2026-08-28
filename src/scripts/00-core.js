(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("header.site");
  const setHeaderHeight = () => header && document.documentElement.style.setProperty("--head-h", `${header.offsetHeight}px`);
  setHeaderHeight();
  addEventListener("resize", setHeaderHeight);
  document.fonts?.ready.then(setHeaderHeight);

  const reveal = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add("in");
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.16 }) : null;
  document.querySelectorAll(".rv, .rv-img, .rv-line").forEach((element) => reveal ? reveal.observe(element) : element.classList.add("in"));

  const hero = document.querySelector(".hero-bg");
  const heroSection = document.querySelector(".hero");
  const heroStrip = document.querySelector(".hero-strip");
  const heroFlowQuery = "(max-width: 900px), (max-height: 620px) and (orientation: landscape)";
  const heroUsesFlowLayout = () => matchMedia(heroFlowQuery).matches;
  const syncHeroStripHeight = () => {
    if (!hero || !heroSection || !heroStrip) return;
    if (heroUsesFlowLayout()) {
      heroSection.style.removeProperty("--hero-strip-h");
      return;
    }
    heroSection.style.setProperty("--hero-strip-h", `${heroStrip.getBoundingClientRect().height}px`);
  };
  syncHeroStripHeight();
  addEventListener("resize", syncHeroStripHeight, { passive: true });
  document.fonts?.ready.then(syncHeroStripHeight);
  if (heroStrip && "ResizeObserver" in window) new ResizeObserver(syncHeroStripHeight).observe(heroStrip);

  if (hero && !reduced) {
    const updateHeroPosition = () => {
      hero.style.transform = heroUsesFlowLayout()
        ? "none"
        : `translateY(${scrollY * 0.28}px)`;
    };
    updateHeroPosition();
    addEventListener("scroll", updateHeroPosition, { passive: true });
    addEventListener("resize", updateHeroPosition, { passive: true });
  }

  const animateCounter = (element) => {
    const target = Number.parseFloat(element.dataset.count);
    if (!Number.isFinite(target)) return;
    const decimals = (element.dataset.count.split(".")[1] || "").length;
    const suffix = element.dataset.suffix || "";
    if (reduced) return void (element.textContent = `${element.dataset.count}${suffix}`);
    const start = performance.now();
    const tick = (time) => {
      const progress = Math.min((time - start) / 1600, 1);
      const value = target * (1 - Math.pow(1 - progress, 3));
      element.textContent = `${value.toFixed(decimals)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  }, { threshold: 0.6 }) : null;
  document.querySelectorAll("[data-count]").forEach((counter) => counterObserver ? counterObserver.observe(counter) : animateCounter(counter));

  const careBack = document.querySelector('.care-back-to-top');
  if (careBack) {
    const updateCareBack = () => {
      const visible = scrollY > innerHeight;
      careBack.classList.toggle('is-visible', visible);
      careBack.setAttribute('aria-hidden', String(!visible));
      careBack.tabIndex = visible ? 0 : -1;
    };
    updateCareBack();
    addEventListener('scroll', updateCareBack, { passive: true });
  }

  const booking = document.querySelector('#book');
  if (booking) {
    document.querySelectorAll('[data-contact-form] input, [data-contact-form] select, [data-contact-form] textarea').forEach((field) => {
      field.addEventListener('focus', () => document.body.classList.add('booking-focus'));
      field.addEventListener('blur', () => document.body.classList.remove('booking-focus'));
    });
  }

  const alignCareHash = () => {
    if (!document.querySelector('.care-block')) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    requestAnimationFrame(() => requestAnimationFrame(() => target.scrollIntoView({ block: 'start' })));
  };
  if (document.querySelector('.care-block')) {
    alignCareHash();
    addEventListener('hashchange', alignCareHash);
  }
})();
