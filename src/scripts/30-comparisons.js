(() => {
  document.querySelectorAll(".ba").forEach((comparison, index) => {
    const after = comparison.querySelector(".after-wrap");
    const handle = comparison.querySelector(".handle");
    if (!after || !handle) return;
    let value = 50;
    const render = () => {
      after.style.clipPath = `inset(0 0 0 ${value}%)`;
      handle.style.left = `${value}%`;
      handle.setAttribute("aria-valuenow", String(Math.round(value)));
    };
    const setFromPointer = (clientX) => {
      const rect = comparison.getBoundingClientRect();
      value = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
      render();
    };
    handle.tabIndex = 0;
    handle.setAttribute("role", "slider");
    handle.setAttribute("aria-label", `Before and after comparison ${index + 1}`);
    handle.setAttribute("aria-valuemin", "4");
    handle.setAttribute("aria-valuemax", "96");
    comparison.addEventListener("pointerdown", (event) => {
      comparison.setPointerCapture(event.pointerId);
      setFromPointer(event.clientX);
    });
    comparison.addEventListener("pointermove", (event) => {
      if (comparison.hasPointerCapture(event.pointerId)) setFromPointer(event.clientX);
    });
    handle.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") value = 4;
      else if (event.key === "End") value = 96;
      else value = Math.max(4, Math.min(96, value + (event.key === "ArrowRight" ? 5 : -5)));
      render();
    });
    render();
  });
})();
