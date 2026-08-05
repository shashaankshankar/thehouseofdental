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
