const runtime = globalThis.__COUNTRY_MEMORY_MAP__ || {};

const allowedRenderers = new Set(["local-globe", "legacy", "google3d", "cesium-google"]);
const requestedRenderer = allowedRenderers.has(runtime.renderer) ? runtime.renderer : "legacy";

export const config = Object.freeze({
  googleMapsApiKey: typeof runtime.googleMapsApiKey === "string" ? runtime.googleMapsApiKey : "",
  renderer: requestedRenderer,
  cinematicUI: runtime.cinematicUI !== false,
});

export const hasGoogleMapsKey = Boolean(config.googleMapsApiKey);
