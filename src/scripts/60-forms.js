(() => {
  const form = document.querySelector("form[data-netlify='true']");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    const button = form.querySelector("button[type='submit']");
    button?.setAttribute("aria-busy", "true");
  });
})();
