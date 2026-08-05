/* THE HOUSE OF DENTAL — shared interactions */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----- Header height variable (fixed header offset) ----- */
  const hdr = document.querySelector("header.site");
  const setHeadH = () => {
    if (hdr) document.documentElement.style.setProperty("--head-h", hdr.offsetHeight + "px");
  };
  setHeadH();
  window.addEventListener("resize", setHeadH);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeadH);

  /* ----- Scroll reveals ----- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.16 }
  ) : null;
  document.querySelectorAll(".rv, .rv-img, .rv-line").forEach((el) => {
    if (io) io.observe(el); else el.classList.add("in");
  });

  /* ----- Hero parallax ----- */
  const onScroll = () => {
    const bg = document.querySelector(".hero-bg");
    if (bg && !reduced) {
      bg.style.transform = `translateY(${window.scrollY * 0.28}px)`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----- Counters (replayable) ----- */
  window.animateCounter = function (el) {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const dec = (el.dataset.count.split(".")[1] || "").length;
    const suffix = el.dataset.suffix || "";
    if (reduced) { el.textContent = el.dataset.count + suffix; return; }
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
  const cio = "IntersectionObserver" in window ? new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) window.animateCounter(e.target);
      });
    },
    { threshold: 0.6 }
  ) : null;
  counters.forEach((c) => { if (cio) cio.observe(c); else window.animateCounter(c); });

  /* ----- Testimonial rotator ----- */
  const quotes = document.querySelectorAll("[data-quote]");
  const dots = document.querySelectorAll(".quote-dot");
  if (quotes.length) {
    let idx = 0, timer;
    const show = (i) => {
      idx = i;
      quotes.forEach((q, n) => {
        q.style.display = n === i ? "block" : "none";
        if (n === i) {
          q.classList.remove("in");
          q.classList.add("rv");
          requestAnimationFrame(() => requestAnimationFrame(() => q.classList.add("in")));
        }
      });
      dots.forEach((d, n) => d.classList.toggle("on", n === i));
    };
    dots.forEach((d, n) =>
      d.addEventListener("click", () => {
        clearInterval(timer);
        show(n);
        start();
      })
    );
    const start = () => { if (!reduced) timer = setInterval(() => show((idx + 1) % quotes.length), 7000); };
    show(0);
    start();
  }

  /* ----- Before / After sliders ----- */
  document.querySelectorAll(".ba").forEach((ba) => {
    const wrap = ba.querySelector(".after-wrap");
    const handle = ba.querySelector(".handle");
    const set = (clientX) => {
      const r = ba.getBoundingClientRect();
      let p = ((clientX - r.left) / r.width) * 100;
      p = Math.max(4, Math.min(96, p));
      wrap.style.clipPath = `inset(0 0 0 ${p}%)`;
      handle.style.left = p + "%";
    };
    let dragging = false;
    const down = (e) => { dragging = true; set(e.touches ? e.touches[0].clientX : e.clientX); };
    const move = (e) => { if (dragging) set(e.touches ? e.touches[0].clientX : e.clientX); };
    const up = () => (dragging = false);
    ba.addEventListener("mousedown", down);
    ba.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
  });

  /* ----- Mobile nav ----- */
  const burger = document.querySelector(".burger");
  const menu = document.querySelector(".menu");
  if (burger && menu) {
    const closeMenu = () => {
      burger.classList.remove("open");
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
      document.body.style.overflow = "";
    };
    burger.addEventListener("click", () => {
      burger.classList.toggle("open");
      menu.classList.toggle("open");
      const open = menu.classList.contains("open");
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        closeMenu();
      })
    );
    // tap top-level item on mobile to open its submenu
    menu.querySelectorAll(":scope > li").forEach((li) => {
      const sub = li.querySelector(".drop");
      const link = li.querySelector(":scope > a");
      if (sub && link) {
        link.addEventListener("click", (e) => {
          if (window.innerWidth <= 1024 && !li.classList.contains("open-sub")) {
            e.preventDefault();
            menu.querySelectorAll("li.open-sub").forEach((o) => o.classList.remove("open-sub"));
            li.classList.add("open-sub");
          }
        });
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        closeMenu();
        burger.focus();
      }
    });
  }

  /* ----- Image failure fallback ----- */
  document.querySelectorAll("img").forEach((im) => {
    im.addEventListener("error", () => { im.setAttribute("data-failed", "true"); });
    if (im.complete && im.naturalWidth === 0) im.setAttribute("data-failed", "true");
  });

  /* ----- Mark active nav link ----- */
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".menu > li > a").forEach((a) => {
    const href = a.getAttribute("href").split("#")[0];
    if (href === here) a.classList.add("active");
  });

  document.querySelectorAll("img:not(.logo-img)").forEach((img, index) => {
    if (index > 0 && !img.hasAttribute("loading")) img.loading = "lazy";
    img.decoding = "async";
  });

  /* ----- Keyboard-operable before/after comparisons ----- */
  document.querySelectorAll(".ba").forEach((comparison, index) => {
    const handle = comparison.querySelector(".handle");
    const after = comparison.querySelector(".after-wrap");
    if (!handle || !after) return;
    let value = 50;
    const render = () => {
      after.style.clipPath = `inset(0 0 0 ${value}%)`;
      handle.style.left = value + "%";
      handle.setAttribute("aria-valuenow", String(value));
    };
    handle.tabIndex = 0;
    handle.setAttribute("role", "slider");
    handle.setAttribute("aria-label", `Before and after comparison ${index + 1}`);
    handle.setAttribute("aria-valuemin", "4");
    handle.setAttribute("aria-valuemax", "96");
    handle.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") value = 4;
      else if (event.key === "End") value = 96;
      else value = Math.max(4, Math.min(96, value + (event.key === "ArrowRight" ? 5 : -5)));
      render();
    });
    render();
  });

  /* ----- Modal focus management ----- */
  document.querySelectorAll('[role="dialog"]').forEach((dialog) => {
    let returnFocus = null;
    const observer = new MutationObserver(() => {
      const isOpen = dialog.classList.contains("open");
      if (isOpen) {
        returnFocus = document.activeElement;
        const close = dialog.querySelector("[data-close]");
        if (close) close.focus();
      } else if (returnFocus instanceof HTMLElement) {
        returnFocus.focus();
        returnFocus = null;
      }
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["class"] });
  });

  /* ----- Draft-safe appointment form ----- */
  const appointmentForm = document.getElementById("appointment-form");
  if (appointmentForm) {
    appointmentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = document.getElementById("form-status");
      if (!appointmentForm.checkValidity()) {
        appointmentForm.reportValidity();
        if (status) status.textContent = "Please complete the required fields. Nothing was sent.";
        return;
      }
      if (status) {
        status.innerHTML = 'Nothing was sent. Please call <a href="tel:+14076781400">(407) 678-1400</a> to schedule while online requests are being connected.';
        status.focus();
      }
    });
  }

  /* ----- Compact mobile actions ----- */
  if (!document.querySelector(".mobile-actions")) {
    const actions = document.createElement("nav");
    actions.className = "mobile-actions";
    actions.setAttribute("aria-label", "Quick contact");
    actions.innerHTML = '<a href="tel:+14076781400">Call</a><a href="contact.html#book">Request Appointment</a>';
    document.body.appendChild(actions);
  }
})();

/* ---- House of Dental: offline-safe imagery ------------------------------
   Most photography on this site is fetched from the internet when a page
   opens. With no connection -- or behind an ad blocker or a filtered office
   network -- those slots would render as empty black boxes.

   This paints an on-brand ivory/champagne panel behind every photo slot up
   front, so a slot is never empty. When the real photograph does load it is
   opaque and covers the panel completely, so nothing changes online.

   Team headshots and the logo are left alone; they have their own treatment.
------------------------------------------------------------------------- */
(function () {
  var GOLD = "#a08344", IVORY = "#f7f4ee", DEEP = "#e6dfd0";
  var BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function wrap(label, max) {
    var words = String(label).split(/\s+/), lines = [], cur = "";
    for (var i = 0; i < words.length; i++) {
      var t = cur ? cur + " " + words[i] : words[i];
      if (t.length > max && cur) { lines.push(cur); cur = words[i]; }
      else { cur = t; }
      if (lines.length === 2) break;
    }
    if (cur && lines.length < 3) lines.push(cur);
    return lines.slice(0, 3);
  }

  function panel(label, w, h) {
    w = Math.max(300, Math.round(w) || 1200);
    h = Math.max(200, Math.round(h) || 900);
    var clean = String(label || "The House of Dental")
                  .replace(/\s+at The House of Dental$/i, "")
                  .replace(/^The House of Dental\s*[-\u2014]\s*/i, "");
    var lines = wrap(clean.toUpperCase(), 24);
    var fs = Math.max(10, Math.min(17, Math.round(Math.min(w, h * 1.4) / 34)));
    var ruleY = h / 2 - fs * 1.5;
    var text = "";
    for (var i = 0; i < lines.length; i++) {
      text += '<text x="' + (w / 2) + '" y="' + (h / 2 + fs * 0.6 + i * fs * 1.9) +
              '" text-anchor="middle" font-family="Marcellus, Times New Roman, serif"' +
              ' font-size="' + fs + '" letter-spacing="' + (fs * 0.2).toFixed(1) +
              '" fill="' + GOLD + '">' + esc(lines[i]) + "</text>";
    }
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="' + IVORY + '"/>' +
          '<stop offset="50%" stop-color="' + DEEP + '"/>' +
          '<stop offset="100%" stop-color="' + IVORY + '"/>' +
        "</linearGradient></defs>" +
        '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>' +
        '<rect x="12.5" y="12.5" width="' + (w - 25) + '" height="' + (h - 25) +
          '" fill="none" stroke="' + GOLD + '" stroke-opacity="0.4"/>' +
        '<line x1="' + (w / 2 - 24) + '" y1="' + ruleY + '" x2="' + (w / 2 + 24) +
          '" y2="' + ruleY + '" stroke="' + GOLD + '" stroke-opacity="0.75"/>' +
        text +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function exempt(img) {
    var s = img.getAttribute("src") || "";
    return s.indexOf("assets/team/") !== -1 ||
           s.indexOf("assets/logo") !== -1 ||
           s.indexOf("data:") === 0;
  }

  /* Paint the panel behind the image. Harmless when the photo loads. */
  function dress(img) {
    if (img.dataset.hodDressed || exempt(img)) return;
    img.dataset.hodDressed = "1";
    var r = img.getBoundingClientRect();
    img.style.backgroundImage =
      'url("' + panel(img.getAttribute("alt"), r.width, r.height) + '")';
    img.style.backgroundSize = "cover";
    img.style.backgroundPosition = "center";
    img.style.backgroundRepeat = "no-repeat";
    img.style.color = "transparent";      /* hide alt text if it fails */
  }

  /* Swap a failed image for a transparent pixel so no broken icon shows. */
  function blank(img) {
    if (img.dataset.hodBlanked || exempt(img)) return;
    img.dataset.hodBlanked = "1";
    img.src = BLANK;
  }

  function scan() {
    var imgs = document.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i++) {
      dress(imgs[i]);
      if (imgs[i].complete && imgs[i].naturalWidth === 0) blank(imgs[i]);
    }
  }

  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG") {
      dress(t);
      /* let any inline onerror try its own source first */
      setTimeout(function () {
        if (t.complete && t.naturalWidth === 0) blank(t);
      }, 800);
    }
  }, true);

  if (document.readyState !== "loading") scan();
  document.addEventListener("DOMContentLoaded", scan);
  window.addEventListener("load", scan);
  setInterval(scan, 1200);
})();
