(() => {
  document.querySelectorAll("img").forEach((image, index) => {
    image.decoding = "async";
    if (index > 0 && !image.classList.contains("logo-img")) image.loading ||= "lazy";
    const failed = () => image.setAttribute("data-failed", "true");
    image.addEventListener("error", failed, { once: true });
    if (image.complete && image.naturalWidth === 0) failed();
  });
})();
