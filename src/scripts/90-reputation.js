(() => {
  const config = __SITE_REPUTATION || {};
  const fallback = config.fallback || {};
  const placeId = String(config.place_id || "").trim();
  const endpoint = String(config.endpoint || "").trim();
  const ratingTargets = [...document.querySelectorAll("[data-reputation-rating]")];
  const reviewCountTargets = [...document.querySelectorAll("[data-reputation-review-count]")];

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

  const apply = (value) => {
    const normalized = normalize(value);
    if (!normalized) return;
    const ratingText = normalized.rating.toFixed(1);
    const reviewCountText = normalized.reviewCount.toLocaleString("en-US");
    for (const element of ratingTargets) element.textContent = ratingText;
    for (const element of reviewCountTargets) element.textContent = reviewCountText;
    updateSchema(normalized);
  };

  apply(fallback);
  if (!placeId || !endpoint) return;

  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("place_id", placeId);
  fetch(url, { headers: { Accept: "application/json" } })
    .then((response) => response.ok ? response.json() : null)
    .then((value) => {
      if (value) apply(value);
    })
    .catch(() => {
      // The configured fallback remains visible if the API is unavailable.
    });
})();
