const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

export async function onRequestGet({ request, env }) {
  const configuredPlaceId = String(env.GOOGLE_PLACE_ID || "").trim();
  const requestedPlaceId = new URL(request.url).searchParams.get("place_id")?.trim();
  const apiKey = String(env.GOOGLE_PLACES_API_KEY || "").trim();

  if (!configuredPlaceId || !requestedPlaceId || requestedPlaceId !== configuredPlaceId) {
    return json({ error: "Google place configuration is incomplete." }, 503);
  }
  if (!apiKey) return json({ error: "Google Places API key is not configured." }, 503);

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(configuredPlaceId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri"
        }
      }
    );
    if (!response.ok) return json({ error: "Google Places API request failed." }, 502);

    const place = await response.json();
    const rating = Number(place.rating);
    const reviewCount = Number(place.userRatingCount);
    if (!Number.isFinite(rating) || !Number.isInteger(reviewCount)) {
      return json({ error: "Google Places API returned incomplete reputation data." }, 502);
    }

    return json({
      rating,
      review_count: reviewCount,
      googleMapsUri: typeof place.googleMapsUri === "string" ? place.googleMapsUri : null
    });
  } catch {
    return json({ error: "Google Places API is unavailable." }, 502);
  }
}
