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
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        close();
        button.focus();
      }
    });
  }
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-primary-link]").forEach((link) => {
    const paths = [link.getAttribute("href"), ...(link.dataset.activePaths?.split(/\s+/) || [])]
      .filter(Boolean)
      .map((path) => path.split("#")[0]);
    const active = paths.includes(current);
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
})();
