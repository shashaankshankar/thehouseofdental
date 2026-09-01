(() => {
  const config = __SITE_REPUTATION || {};
  const fallback = config.fallback || {};
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

  const reveal = (value) => {
    const normalized = normalize(value) || normalize(fallback);
    if (!normalized) return;

    // Keep the dash visible until a complete, validated pair is ready. The
    // commit updates both surfaces in one synchronous turn, so no intermediate
    // rating or review count can be painted.
    const tick = () => {
      const rating = normalized.rating.toFixed(1);
      const reviewCount = normalized.reviewCount.toLocaleString("en-US");
      for (const element of ratingTargets) element.textContent = rating;
      for (const element of reviewCountTargets) element.textContent = reviewCount;
      updateSchema(normalized);
      for (const element of reputationTargets) element.classList.remove("reputation-value-pending");
    };

    if (reduced) tick();
    else requestAnimationFrame(tick);
  };

  if (!endpoint) {
    reveal(fallback);
    return;
  }

  const url = new URL(endpoint, window.location.origin);
  fetch(url, { headers: { Accept: "application/json" } })
    .then((response) => response.ok ? response.json() : null)
    .then((value) => reveal(value))
    .catch(() => {
      reveal(fallback);
    });
})();
