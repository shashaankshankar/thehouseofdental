(() => {
  const syncBodySurfaceState = () => {
    const menuOpen = Boolean(document.querySelector(".menu.open"));
    document.body.classList.toggle("menu-open", menuOpen);
  };
  const menu = document.querySelector(".menu");
  syncBodySurfaceState();
  if (menu && "MutationObserver" in window) {
    new MutationObserver(syncBodySurfaceState).observe(menu, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
  ["hashchange", "popstate", "pageshow"].forEach((eventName) => {
    addEventListener(eventName, syncBodySurfaceState);
  });

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
    const previous = dialog.querySelector("[data-modal-prev]");
    const next = dialog.querySelector("[data-modal-next]");
    const supportsNavigation = Boolean(previous && next);
    let returnFocus;
    let activeTrigger;
    let transitionTimer;
    let swipeHintTimer;
    let touchStart = null;
    let inerted = [];

    const detailData = definition.kind === "service"
      ? { ...(__SITE_DETAIL_DATA?.services || {}), ...(__SITE_DETAIL_DATA?.technology || {}) }
      : __SITE_DETAIL_DATA?.technology || {};
    const decode = (value = "") => {
      return new DOMParser().parseFromString(value, "text/html").body.textContent || "";
    };
    const getDetail = (id) => detailData[id];
    const getTrigger = (id) => document.querySelector(`${definition.trigger}[data-${definition.key}="${CSS.escape(id)}"]`);
    const getTriggers = () => [...document.querySelectorAll(definition.trigger)].filter((trigger) => getDetail(trigger.dataset[definition.key]));
    const isFocusable = (element) => {
      if (element.disabled || element.hidden || element.getAttribute("aria-hidden") === "true") return false;
      const styles = getComputedStyle(element);
      return styles.display !== "none" && styles.visibility !== "hidden";
    };
    const getFocusable = () => [...dialog.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')]
      .filter(isFocusable);
    const inertBackground = () => {
      if (inerted.length) return;
      const modalMain = dialog.closest("main");
      const background = [
        ...document.querySelectorAll("body > header, body > footer, body > .mobile-actions"),
        ...(modalMain ? [...modalMain.children].filter((element) => element !== dialog) : [])
      ];
      inerted = background.map((element) => ({ element, inert: element.inert }));
      background.forEach((element) => { element.inert = true; });
    };
    const close = () => {
      if (transitionTimer) {
        clearTimeout(transitionTimer);
        transitionTimer = null;
      }
      if (swipeHintTimer) {
        clearTimeout(swipeHintTimer);
        swipeHintTimer = null;
      }
      dialog.classList.remove("show-swipe-hint");
      panel?.classList.remove("is-switching", "is-dragging", "is-swipe-out", "is-swipe-in", "is-swipe-settle");
      panel?.style.removeProperty("--modal-shift");
      panel?.style.removeProperty("--drag-x");
      panel?.style.removeProperty("--swipe-in");
      panel?.style.removeProperty("--swipe-out");
      dialog.classList.remove("open");
      document.body.classList.remove("modal-open");
      inerted.forEach(({ element, inert }) => { element.inert = inert; });
      inerted = [];
      if (returnFocus?.isConnected && isFocusable(returnFocus)) returnFocus.focus();
      returnFocus = null;
    };
    const hideSwipeHint = () => {
      if (swipeHintTimer) {
        clearTimeout(swipeHintTimer);
        swipeHintTimer = null;
      }
      dialog.classList.remove("show-swipe-hint");
    };
    const showSwipeHint = () => {
      if (!supportsNavigation) return;
      hideSwipeHint();
      dialog.classList.add("show-swipe-hint");
      swipeHintTimer = window.setTimeout(hideSwipeHint, 1800);
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
      inertBackground();
      if (focusClose) window.setTimeout(() => {
        if (dialog.classList.contains("open")) dialog.querySelector("button.close[data-close]")?.focus();
      }, 0);
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
        if (!dialog.classList.contains("show-swipe-hint") && !transition) showSwipeHint();
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
    const swipeNavigate = (direction) => {
      const triggers = getTriggers();
      if (!triggers.length || !activeTrigger) return;
      const currentIndex = Math.max(0, triggers.indexOf(activeTrigger));
      const target = triggers[(currentIndex + direction + triggers.length) % triggers.length];
      const id = target.dataset[definition.key];
      const detail = getDetail(id);
      if (!detail) return;
      if (transitionTimer) clearTimeout(transitionTimer);
      history.replaceState(null, "", `#${id}`);
      const distance = Math.max(window.innerWidth, panel.offsetWidth) + 48;
      panel.classList.remove("is-dragging");
      panel.style.setProperty("--swipe-out", `${direction > 0 ? -distance : distance}px`);
      panel.classList.add("is-swipe-out");
      transitionTimer = window.setTimeout(() => {
        transitionTimer = null;
        render(detail, target, false);
        panel.style.setProperty("--swipe-in", `${direction > 0 ? distance : -distance}px`);
        panel.classList.remove("is-swipe-out");
        panel.classList.add("is-swipe-in");
        window.requestAnimationFrame(() => {
          panel.classList.remove("is-swipe-in");
          panel.classList.add("is-swipe-settle");
          window.setTimeout(() => {
            panel.classList.remove("is-swipe-settle");
            panel.style.removeProperty("--swipe-in");
            panel.style.removeProperty("--swipe-out");
          }, 240);
        });
      }, 240);
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
    panel.addEventListener("touchstart", (event) => {
      if (!supportsNavigation) return;
      hideSwipeHint();
      const touch = event.changedTouches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
      panel.classList.add("is-dragging");
    }, { passive: true });
    panel.addEventListener("touchmove", (event) => {
      if (!touchStart || !supportsNavigation) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      if (Math.abs(dx) < Math.abs(dy) * 1.05) return;
      event.preventDefault();
      panel.style.setProperty("--drag-x", `${dx * 0.88}px`);
    }, { passive: false });
    panel.addEventListener("touchend", (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      touchStart = null;
      panel.style.removeProperty("--drag-x");
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.05) {
        panel.classList.remove("is-dragging");
        return;
      }
      swipeNavigate(dx < 0 ? 1 : -1);
    }, { passive: true });
    panel.addEventListener("touchcancel", () => {
      touchStart = null;
      panel.style.removeProperty("--drag-x");
      panel.classList.remove("is-dragging");
    }, { passive: true });
    previous?.addEventListener("click", () => { hideSwipeHint(); navigate(-1, previous); });
    next?.addEventListener("click", () => { hideSwipeHint(); navigate(1, next); });
    document.addEventListener("keydown", (event) => {
      if (!dialog.classList.contains("open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Tab") {
        const items = getFocusable();
        if (items.length) {
          const first = items[0]; const last = items[items.length - 1];
          if (!dialog.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
          else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
      if (!supportsNavigation) return;
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
