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
})();

(() => {
  const button = document.querySelector(".burger");
  const menu = document.querySelector(".menu");
  if (button && menu) {
    const close = () => {
      button.classList.remove("open");
      menu.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open menu");
      document.body.style.overflow = "";
    };
    button.addEventListener("click", () => {
      const open = !menu.classList.contains("open");
      button.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    menu.querySelectorAll(":scope > li").forEach((item) => {
      const submenu = item.querySelector(".drop");
      const link = item.querySelector(":scope > a");
      if (!submenu || !link) return;
      link.addEventListener("click", (event) => {
        if (innerWidth > 1024 || item.classList.contains("open-sub")) return;
        event.preventDefault();
        menu.querySelectorAll(".open-sub").forEach((openItem) => openItem.classList.remove("open-sub"));
        item.classList.add("open-sub");
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        close();
        button.focus();
      }
    });
  }
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".menu > li > a").forEach((link) => {
    if (link.getAttribute("href")?.split("#")[0] === current) link.classList.add("active");
  });
})();

(() => {
  const quotes = [...document.querySelectorAll("[data-quote]")];
  const dots = [...document.querySelectorAll(".quote-dot")];
  if (!quotes.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer;
  const show = (next) => {
    index = next;
    quotes.forEach((quote, position) => {
      quote.hidden = position !== next;
      quote.classList.toggle("in", position === next);
    });
    dots.forEach((dot, position) => {
      dot.classList.toggle("on", position === next);
      dot.setAttribute("aria-pressed", String(position === next));
    });
  };
  const start = () => {
    if (!reduced) timer = setInterval(() => show((index + 1) % quotes.length), 7000);
  };
  dots.forEach((dot, position) => dot.addEventListener("click", () => {
    clearInterval(timer);
    show(position);
    start();
  }));
  show(0);
  start();
})();

(() => {
  document.querySelectorAll(".ba").forEach((comparison, index) => {
    const after = comparison.querySelector(".after-wrap");
    const handle = comparison.querySelector(".handle");
    if (!after || !handle) return;
    let value = 50;
    const render = () => {
      after.style.clipPath = `inset(0 0 0 ${value}%)`;
      handle.style.left = `${value}%`;
      handle.setAttribute("aria-valuenow", String(Math.round(value)));
    };
    const setFromPointer = (clientX) => {
      const rect = comparison.getBoundingClientRect();
      value = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
      render();
    };
    handle.tabIndex = 0;
    handle.setAttribute("role", "slider");
    handle.setAttribute("aria-label", `Before and after comparison ${index + 1}`);
    handle.setAttribute("aria-valuemin", "4");
    handle.setAttribute("aria-valuemax", "96");
    comparison.addEventListener("pointerdown", (event) => {
      comparison.setPointerCapture(event.pointerId);
      setFromPointer(event.clientX);
    });
    comparison.addEventListener("pointermove", (event) => {
      if (comparison.hasPointerCapture(event.pointerId)) setFromPointer(event.clientX);
    });
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
})();

(() => {
  const definitions = [
    { dialog: "svcmodal", trigger: ".svc-card", key: "svc", data: "data/services.json", prefix: "svcm" },
    { dialog: "techmodal", trigger: ".tech-card", key: "tech", data: "data/technology.json", prefix: "techm" }
  ];
  const appendText = (parent, tag, text) => {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
  };
  const decode = (text) => {
    return new DOMParser().parseFromString(`<!doctype html><body>${text}`, "text/html").body.textContent;
  };
  definitions.forEach(async (definition) => {
    const dialog = document.getElementById(definition.dialog);
    if (!dialog) return;
    const response = await fetch(definition.data);
    if (!response.ok) return;
    const data = await response.json();
    const image = document.getElementById(`${definition.prefix}-img`);
    const category = document.getElementById(`${definition.prefix}-cat`);
    const title = document.getElementById(`${definition.prefix}-title`);
    const body = document.getElementById(`${definition.prefix}-body`);
    const soon = document.getElementById(`${definition.prefix}-soon`);
    let returnFocus;
    const close = () => {
      dialog.classList.remove("open");
      document.body.classList.remove("modal-open");
      returnFocus?.focus();
    };
    const open = (id, trigger) => {
      const item = data[id];
      if (!item) return;
      returnFocus = trigger || document.activeElement;
      image.src = item.img;
      image.alt = item.title;
      category.textContent = decode(item.cat);
      title.textContent = decode(item.title);
      body.replaceChildren();
      item.paras.forEach((paragraph) => appendText(body, "p", decode(paragraph)));
      if (item.items?.length) {
        const list = document.createElement("ul");
        item.items.forEach((text) => appendText(list, "li", decode(text)));
        body.appendChild(list);
      }
      if (soon) soon.hidden = !item.soon;
      dialog.classList.add("open");
      document.body.classList.add("modal-open");
      dialog.querySelector("[data-close]")?.focus();
    };
    document.querySelectorAll(definition.trigger).forEach((trigger) => trigger.addEventListener("click", () => open(trigger.dataset[definition.key], trigger)));
    dialog.querySelectorAll("[data-close]").forEach((element) => element.addEventListener("click", close));
    document.addEventListener("keydown", (event) => event.key === "Escape" && dialog.classList.contains("open") && close());
    const openHash = () => {
      const id = location.hash.slice(1).split("/").pop();
      if (data[id]) open(id, document.getElementById(id));
    };
    openHash();
    addEventListener("hashchange", openHash);
  });
})();

(() => {
  const range = document.getElementById("chr-range");
  if (!range) return;
  const amount = document.getElementById("chr-amt");
  const biweekly = document.getElementById("chr-bi");
  const months24 = document.getElementById("chr-24");
  const months60 = document.getElementById("chr-60");
  const money = (value) => `$${Math.round(value).toLocaleString()}`;
  const setPlan = (element, value, suffix) => {
    element.replaceChildren(document.createTextNode(value));
    const detail = document.createElement("i");
    detail.textContent = suffix;
    element.appendChild(detail);
  };
  const update = () => {
    const value = Number.parseInt(range.value, 10);
    amount.textContent = money(value);
    if (value <= 3000) setPlan(biweekly, money(value / 4), "×4");
    else setPlan(biweekly, "Over $3,000", "");
    setPlan(months24, money(value / 24), "/mo");
    setPlan(months60, money(value / 60), "/mo");
  };
  range.addEventListener("input", update);
  update();
})();

(() => {
  const form = document.getElementById("appointment-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.getElementById("form-status");
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = "Please complete the required fields. Nothing was sent.";
      return;
    }
    status.replaceChildren(document.createTextNode("Nothing was sent. Please call "));
    const phone = document.createElement("a");
    phone.href = "tel:+14076781400";
    phone.textContent = "(407) 678-1400";
    status.append(phone, document.createTextNode(" to schedule while online requests are being connected."));
  });
})();

(() => {
  document.querySelectorAll("img").forEach((image, index) => {
    image.decoding = "async";
    if (index > 0 && !image.classList.contains("logo-img")) image.loading ||= "lazy";
    const failed = () => image.setAttribute("data-failed", "true");
    image.addEventListener("error", failed, { once: true });
    if (image.complete && image.naturalWidth === 0) failed();
  });
})();
