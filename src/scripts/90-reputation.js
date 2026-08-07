(() => {
  const config = __SITE_REPUTATION || {};
  const fallback = config.fallback || {};
  const placeId = String(config.place_id || "").trim();
  const endpoint = String(config.endpoint || "").trim();
  const ratingTargets = [...document.querySelectorAll("[data-reputation-rating]")];
  const reviewCountTargets = [...document.querySelectorAll("[data-reputation-review-count]")];
  const reputationTargets = [...new Set([...ratingTargets, ...reviewCountTargets])];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const normalize = (value) => {
    const rating = Number(value?.rating);
    const reviewCount = Number(value?.review_count ?? value?.userRatingCount);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
    if (!Number.isInteger(reviewCount) || reviewCount < 0) return null;
    return { rating, reviewCount };
  };

  const updateSchema = ({ rating, reviewCount }) => {
    for (const element of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const schema = JSON.parse(element.textContent || "");
        if (!schema.aggregateRating) continue;
        schema.aggregateRating.ratingValue = rating.toFixed(1);
        schema.aggregateRating.reviewCount = String(reviewCount);
        element.textContent = JSON.stringify(schema);
      } catch {
        // Leave malformed or unrelated structured data unchanged.
      }
    }
  };

  const animate = (targets, target, format) => {
    if (reduced) {
      for (const element of targets) element.textContent = format(target);
      return;
    }
    const start = performance.now();
    const tick = (time) => {
      const progress = Math.min((time - start) / 1600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      for (const element of targets) element.textContent = format(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const apply = (value) => {
    const normalized = normalize(value);
    if (!normalized) return false;
    animate(ratingTargets, normalized.rating, (value) => value.toFixed(1));
    animate(reviewCountTargets, normalized.reviewCount, (value) => Math.round(value).toLocaleString("en-US"));
    updateSchema(normalized);
    return true;
  };

  const reveal = (value) => {
    if (!apply(value)) apply(fallback);
    for (const element of reputationTargets) element.classList.remove("reputation-value-pending");
  };

  if (!placeId || !endpoint) {
    reveal(fallback);
    return;
  }

  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("place_id", placeId);
  fetch(url, { headers: { Accept: "application/json" } })
    .then((response) => response.ok ? response.json() : null)
    .then((value) => reveal(value))
    .catch(() => {
      reveal(fallback);
    });
})();
