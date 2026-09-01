(() => {
  const carousel = document.querySelector("[data-review-carousel]") || document;
  const quotes = [...carousel.querySelectorAll("[data-quote]")];
  const dots = [...carousel.querySelectorAll(".quote-dot")];
  const previous = carousel.querySelector("[data-review-prev]");
  const nextButton = carousel.querySelector("[data-review-next]");
  if (!quotes.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reviewDuration = 15000;
  let index = 0;
  let timer;
  const show = (next) => {
    index = (next + quotes.length) % quotes.length;
    quotes.forEach((quote, position) => {
      quote.hidden = position !== index;
      quote.classList.toggle("in", position === index);
    });
    dots.forEach((dot, position) => {
      dot.classList.toggle("on", position === index);
      dot.setAttribute("aria-pressed", String(position === index));
    });
  };
  const start = () => {
    if (!reduced) timer = setInterval(() => show((index + 1) % quotes.length), reviewDuration);
  };
  dots.forEach((dot, position) => dot.addEventListener("click", () => {
    clearInterval(timer);
    show(position);
    start();
  }));
  previous?.addEventListener("click", () => { clearInterval(timer); show(index - 1); start(); });
  nextButton?.addEventListener("click", () => { clearInterval(timer); show(index + 1); start(); });
  carousel.addEventListener("mouseenter", () => clearInterval(timer));
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", () => clearInterval(timer));
  carousel.addEventListener("focusout", (event) => { if (!carousel.contains(event.relatedTarget)) start(); });
  show(0);
  start();
})();
