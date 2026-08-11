(() => {
  document.querySelectorAll(".ba").forEach((comparison, index) => {
    const after = comparison.querySelector(".after-wrap");
    const handle = comparison.querySelector(".handle");
    if (!after || !handle) return;
    let value = 50;
    let activePointerId = null;
    const clamp = (nextValue) => Math.max(4, Math.min(96, nextValue));
    const render = () => {
      after.style.clipPath = `inset(0 0 0 ${value}%)`;
      handle.style.left = `${value}%`;
      handle.setAttribute("aria-valuenow", String(Math.round(value)));
      handle.setAttribute("aria-valuetext", `${Math.round(value)}% before, ${Math.round(100 - value)}% after`);
    };
    const setFromPointer = (clientX) => {
      const rect = comparison.getBoundingClientRect();
      if (!rect.width) return;
      value = clamp(((clientX - rect.left) / rect.width) * 100);
      render();
    };
    const finishPointer = (event) => {
      if (event.pointerId !== activePointerId) return;
      if (comparison.hasPointerCapture(event.pointerId)) comparison.releasePointerCapture(event.pointerId);
      activePointerId = null;
      comparison.classList.remove("is-dragging");
    };
    handle.tabIndex = 0;
    handle.setAttribute("role", "slider");
    handle.setAttribute("aria-label", `Before and after comparison ${index + 1}`);
    handle.setAttribute("aria-valuemin", "4");
    handle.setAttribute("aria-valuemax", "96");
    comparison.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary) return;
      activePointerId = event.pointerId;
      comparison.setPointerCapture(event.pointerId);
      comparison.classList.add("is-dragging");
      setFromPointer(event.clientX);
      event.preventDefault();
    });
    comparison.addEventListener("pointermove", (event) => {
      if (event.pointerId === activePointerId && comparison.hasPointerCapture(event.pointerId)) setFromPointer(event.clientX);
    });
    comparison.addEventListener("pointerup", finishPointer);
    comparison.addEventListener("pointercancel", finishPointer);
    comparison.addEventListener("lostpointercapture", (event) => {
      if (event.pointerId === activePointerId) {
        activePointerId = null;
        comparison.classList.remove("is-dragging");
      }
    });
    handle.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") value = 4;
      else if (event.key === "End") value = 96;
      else value = clamp(value + (event.key === "ArrowRight" ? 5 : -5));
      render();
    });
    render();
  });
})();
