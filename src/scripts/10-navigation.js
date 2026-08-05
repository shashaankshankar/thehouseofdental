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
    if (link.getAttribute("href")?.split("#")[0] === current) link.classList.add("active");
  });
})();
