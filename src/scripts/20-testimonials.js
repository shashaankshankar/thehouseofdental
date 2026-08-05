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
