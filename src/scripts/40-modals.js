(() => {
  const definitions = [
    { dialog: "svcmodal", trigger: ".svc-card", key: "svc", kind: "service", prefix: "svcm" },
    { dialog: "techmodal", trigger: ".tech-card", key: "tech", kind: "technology", prefix: "techm" }
  ];

  definitions.forEach((definition) => {
    const dialog = document.getElementById(definition.dialog);
    if (!dialog) return;

    document.body.classList.add("js-enhanced");
    const image = document.getElementById(`${definition.prefix}-img`);
    const category = document.getElementById(`${definition.prefix}-cat`);
    const title = document.getElementById(`${definition.prefix}-title`);
    const body = document.getElementById(`${definition.prefix}-body`);
    const panel = dialog.querySelector(".panel");
    const previous = definition.kind === "service" ? dialog.querySelector("[data-modal-prev]") : null;
    const next = definition.kind === "service" ? dialog.querySelector("[data-modal-next]") : null;
    let returnFocus;
    let activeTrigger;
    let transitionTimer;

    const detailData = definition.kind === "service"
      ? { ...(__SITE_DETAIL_DATA?.services || {}), ...(__SITE_DETAIL_DATA?.technology || {}) }
      : __SITE_DETAIL_DATA?.technology || {};
    const decode = (value = "") => {
      return new DOMParser().parseFromString(value, "text/html").body.textContent || "";
    };
    const getDetail = (id) => detailData[id];
    const getTrigger = (id) => document.querySelector(`${definition.trigger}[data-${definition.key}="${CSS.escape(id)}"]`);
    const getTriggers = () => [...document.querySelectorAll(definition.trigger)].filter((trigger) => getDetail(trigger.dataset[definition.key]));
    const close = () => {
      if (transitionTimer) {
        clearTimeout(transitionTimer);
        transitionTimer = null;
      }
      panel?.classList.remove("is-switching");
      panel?.style.removeProperty("--modal-shift");
      dialog.classList.remove("open");
      document.body.classList.remove("modal-open");
      returnFocus?.focus();
    };
    const render = (detail, resolvedTrigger, focusClose) => {
      returnFocus = resolvedTrigger || document.activeElement;
      activeTrigger = resolvedTrigger;
      image.src = detail.img;
      const cardTitle = resolvedTrigger?.querySelector("h3")?.textContent;
      const displayTitle = cardTitle || detail.title;
      image.alt = decode(displayTitle);
      category.textContent = decode(detail.cat);
      title.textContent = decode(displayTitle);
      const fragment = document.createDocumentFragment();
      (detail.paras || []).forEach((paragraph) => {
        const element = document.createElement("p");
        element.textContent = decode(paragraph);
        fragment.append(element);
      });
      if (detail.items?.length) {
        const list = document.createElement("ul");
        detail.items.forEach((item) => {
          const element = document.createElement("li");
          element.textContent = decode(item);
          list.append(element);
        });
        fragment.append(list);
      }
      if (detail.soon) {
        const note = document.createElement("p");
        note.className = "soon-note";
        note.append(document.createTextNode("This service is coming soon to The House of Dental. Call "));
        const phone = document.createElement("a");
        phone.href = "tel:+14076781400";
        phone.textContent = "(407) 678-1400";
        note.append(phone, document.createTextNode(" to be notified when it launches."));
        fragment.append(note);
      }
      body.replaceChildren(fragment);
      dialog.classList.add("open");
      document.body.classList.add("modal-open");
      if (focusClose) dialog.querySelector("[data-close]")?.focus();
    };
    const open = (id, trigger, { focusClose = true, transition = false, direction = 1 } = {}) => {
      const detail = getDetail(id);
      if (!detail) return;
      if (transitionTimer) {
        clearTimeout(transitionTimer);
        transitionTimer = null;
      }
      const resolvedTrigger = trigger || getTrigger(id);
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const canTransition = transition && panel && dialog.classList.contains("open") && !prefersReducedMotion;
      if (!canTransition) {
        panel?.classList.remove("is-switching");
        panel?.style.removeProperty("--modal-shift");
        render(detail, resolvedTrigger, focusClose);
        return;
      }
      panel.style.setProperty("--modal-shift", direction > 0 ? "1.2rem" : "-1.2rem");
      panel.classList.add("is-switching");
      transitionTimer = window.setTimeout(() => {
        transitionTimer = null;
        render(detail, resolvedTrigger, focusClose);
        window.requestAnimationFrame(() => {
          panel.classList.remove("is-switching");
          panel.style.removeProperty("--modal-shift");
        });
      }, 180);
    };
    const navigate = (direction, control) => {
      const triggers = getTriggers();
      if (!triggers.length) return;
      const currentIndex = Math.max(0, activeTrigger ? triggers.indexOf(activeTrigger) : 0);
      const nextIndex = (currentIndex + direction + triggers.length) % triggers.length;
      const target = triggers[nextIndex];
      const id = target.dataset[definition.key];
      history.replaceState(null, "", `#${id}`);
      open(id, target, { focusClose: false, transition: true, direction });
      control?.focus();
    };

    document.querySelectorAll(definition.trigger).forEach((trigger) => {
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const id = trigger.dataset[definition.key];
        history.pushState(null, "", `#${id}`);
        open(id, trigger);
      });
    });
    dialog.querySelectorAll("[data-close]").forEach((element) => element.addEventListener("click", close));
    previous?.addEventListener("click", () => navigate(-1, previous));
    next?.addEventListener("click", () => navigate(1, next));
    document.addEventListener("keydown", (event) => {
      if (!dialog.classList.contains("open")) return;
      if (event.key === "Escape") close();
      if (definition.kind !== "service") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
    });

    const openHash = () => {
      const id = location.hash.slice(1).split("/").pop();
      if (getDetail(id)) open(id, getTrigger(id));
    };
    addEventListener("hashchange", openHash);
    addEventListener("popstate", openHash);
    openHash();
  });
})();
