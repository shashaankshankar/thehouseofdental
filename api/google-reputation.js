const json = (response, status, body, cacheControl = "no-store") => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", cacheControl);
  response.setHeader("X-Content-Type-Options", "nosniff");
  return response.status(status).json(body);
};

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return json(response, 405, { error: "Method not allowed." });
  }

  const configuredPlaceId = String(process.env.GOOGLE_PLACE_ID || "").trim();
  const apiKey = String(process.env.GOOGLE_PLACES_API_KEY || "").trim();

  if (!configuredPlaceId) {
    return json(response, 503, { error: "Google place configuration is incomplete." });
  }
  if (!apiKey) return json(response, 503, { error: "Google Places API key is not configured." });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const upstream = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(configuredPlaceId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri"
        },
        signal: controller.signal
      }
    );
    if (!upstream.ok) return json(response, 502, { error: "Google Places API request failed." });

    const place = await upstream.json();
    const rating = Number(place.rating);
    const reviewCount = Number(place.userRatingCount);
    if (!Number.isFinite(rating) || !Number.isInteger(reviewCount)) {
      return json(response, 502, { error: "Google Places API returned incomplete reputation data." });
    }

    return json(
      response,
      200,
      {
        rating,
        review_count: reviewCount,
        googleMapsUri: typeof place.googleMapsUri === "string" ? place.googleMapsUri : null
      },
      "public, max-age=300, s-maxage=300, stale-while-revalidate=600"
    );
  } catch {
    return json(response, 502, { error: "Google Places API is unavailable." });
  } finally {
    clearTimeout(timeout);
  }
};
