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
  if (hero && !reduced) addEventListener("scroll", () => {
    hero.style.transform = `translateY(${scrollY * 0.28}px)`;
  }, { passive: true });

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
    document.querySelectorAll('[data-appointment-form] input, [data-appointment-form] select, [data-appointment-form] textarea').forEach((field) => {
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
