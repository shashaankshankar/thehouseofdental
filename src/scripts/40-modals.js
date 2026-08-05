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
    let returnFocus;

    const getDetail = (id) => document.querySelector(`[data-detail-kind="${definition.kind}"][data-detail-key="${CSS.escape(id)}"]`);
    const getTrigger = (id) => document.querySelector(`${definition.trigger}[data-${definition.key}="${CSS.escape(id)}"]`);
    const close = () => {
      dialog.classList.remove("open");
      document.body.classList.remove("modal-open");
      returnFocus?.focus();
    };
    const open = (id, trigger) => {
      const detail = getDetail(id);
      if (!detail) return;
      returnFocus = trigger || document.activeElement;
      const detailImage = detail.querySelector("img");
      const detailCategory = detail.querySelector(".kicker");
      const detailTitle = detail.querySelector("h2");
      const detailBody = detail.querySelector(".detail-body");
      if (detailImage) {
        image.src = detailImage.currentSrc || detailImage.src;
        image.alt = detailImage.alt;
      }
      category.textContent = detailCategory?.textContent || "";
      title.textContent = detailTitle?.textContent || "";
      body.replaceChildren(...[...(detailBody?.children || [])].map((element) => element.cloneNode(true)));
      dialog.classList.add("open");
      document.body.classList.add("modal-open");
      dialog.querySelector("[data-close]")?.focus();
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
    document.addEventListener("keydown", (event) => event.key === "Escape" && dialog.classList.contains("open") && close());

    const openHash = () => {
      const id = location.hash.slice(1).split("/").pop();
      if (getDetail(id)) open(id, getTrigger(id) || getDetail(id));
    };
    addEventListener("hashchange", openHash);
    addEventListener("popstate", openHash);
    openHash();
  });
})();
