import { geometryTo3dPieces, getRenderableCountryFeatures } from "./country-geometry.js";

const GOOGLE_SCRIPT_ID = "country-memory-map-google-maps";
const GOOGLE_CALLBACK_NAME = "__countryMemoryMapGoogleReady";
const GOOGLE_RENDERER_TIMEOUT_MS = 25000;
let googleMapsPromise;

function withTimeout(promise, message, timeoutMs = GOOGLE_RENDERER_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

function loadGoogleMaps(apiKey) {
  if (globalThis.google?.maps?.importLibrary) return Promise.resolve(globalThis.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      if (globalThis.google?.maps?.importLibrary) {
        resolve(globalThis.google.maps);
        return;
      }
      existing.addEventListener("load", () => {
        if (globalThis.google?.maps?.importLibrary) resolve(globalThis.google.maps);
        else reject(new Error("Google Maps loaded without importLibrary."));
      }, { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    const cleanup = () => {
      try { delete globalThis[GOOGLE_CALLBACK_NAME]; } catch {}
    };
    globalThis[GOOGLE_CALLBACK_NAME] = () => {
      cleanup();
      if (globalThis.google?.maps?.importLibrary) resolve(globalThis.google.maps);
      else reject(new Error("Google Maps loaded without importLibrary."));
    };
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=maps3d&callback=${GOOGLE_CALLBACK_NAME}`;
    script.addEventListener("error", () => {
      cleanup();
      reject(new Error("Google Maps request was blocked or failed."));
    }, { once: true });
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export class MapAdapter {
  constructor({ onStatus } = {}) {
    this.onStatus = onStatus || (() => {});
    this.map = null;
    this.container = null;
  }

  async initialize() {
    throw new Error("MapAdapter.initialize must be implemented by a renderer.");
  }

  destroy() {
    this.map?.remove?.();
    this.map = null;
    this.container = null;
  }

  focusWorld() {}
  focusCountry() {}
  zoomIn() {}
  zoomOut() {}
  resetCamera() {}
  setInteractionEnabled() {}
  setCountryState() {}
  clearCountryState() {}
  clearAllCountryStates() {}
  setCountryGeometry() {}
  setBordersVisible() {}
  onCountryClick() {}
  getCameraState() { return null; }
}

export class LegacyMapAdapter extends MapAdapter {
  constructor(options = {}) {
    super(options);
    this.kind = "legacy";
    this.reason = options.reason || "legacy preview";
  }

  async initialize({ container } = {}) {
    this.container = container || null;
    this.onStatus({ type: "ready", renderer: "legacy", reason: this.reason });
    return { renderer: "legacy", ready: true };
  }

  resetCamera() {
    this.onStatus({ type: "reset" });
  }
}

const POLYGON_STYLES = Object.freeze({
  normal: Object.freeze({ strokeColor: "rgba(229, 246, 255, .78)", strokeWidth: 1.35, fillColor: "rgba(49, 150, 255, .025)" }),
  selected: Object.freeze({ strokeColor: "rgba(228, 255, 248, .98)", strokeWidth: 3.5, fillColor: "rgba(55, 214, 154, .26)" }),
  correct: Object.freeze({ strokeColor: "rgba(184, 255, 213, 1)", strokeWidth: 4, fillColor: "rgba(34, 199, 121, .48)" }),
  incorrect: Object.freeze({ strokeColor: "rgba(255, 210, 210, 1)", strokeWidth: 3.5, fillColor: "rgba(232, 93, 106, .48)" }),
});

export class Google3DAdapter extends MapAdapter {
  constructor({ apiKey, onStatus, onCountryClick } = {}) {
    super({ onStatus });
    this.kind = "google3d";
    this.apiKey = apiKey;
    this.onCountryClick = onCountryClick || (() => {});
    this.Polygon3DInteractiveElement = null;
    this.countryOverlays = new Map();
    this.geometryReady = false;
    this.viewportRangeFactor = 1;
    this.resizeFrame = null;
    this.resizeObserver = null;
    this.defaultCamera = {
      center: { lat: 18, lng: 38, altitude: 0 },
      range: 10500000,
      heading: 0,
      tilt: 18,
      roll: 0,
      mode: "SATELLITE",
    };
  }

  async initialize({ container, onCountryClick } = {}) {
    if (!this.apiKey) throw new Error("A restricted Google Maps key is required for the 3D renderer.");
    if (!container) throw new Error("The 3D globe mount is unavailable.");
    if (onCountryClick) this.onCountryClick = onCountryClick;

    this.container = container;
    this.onStatus({ type: "loading", renderer: "google3d" });
    const maps = await withTimeout(
      loadGoogleMaps(this.apiKey),
      "Google Maps did not finish loading before the preview fallback timeout.",
    );
    const { Map3DElement, Polygon3DInteractiveElement } = await withTimeout(
      maps.importLibrary("maps3d"),
      "The Google 3D Maps library did not become available before the preview fallback timeout.",
    );
    if (!Map3DElement || !Polygon3DInteractiveElement) throw new Error("The maps3d library is unavailable for this key.");
    this.Polygon3DInteractiveElement = Polygon3DInteractiveElement;

    const map = new Map3DElement({
      ...this.defaultCamera,
      defaultUIHidden: true,
      gestureHandling: "GREEDY",
    });
    map.setAttribute("aria-label", "Interactive 3D Earth");
    map.setAttribute("role", "application");
    container.replaceChildren(map);
    this.map = map;
    this.syncViewportRange();
    if (typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
        this.resizeFrame = requestAnimationFrame(() => {
          this.resizeFrame = null;
          this.syncViewportRange();
        });
      });
      this.resizeObserver.observe(container);
    }
    this.onStatus({ type: "ready", renderer: "google3d" });
    return { renderer: "google3d", ready: true };
  }

  syncViewportRange() {
    if (!this.map || !this.container) return;
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    const nextFactor = Math.max(1, Math.min(2.1, (height / width) * 0.9));
    const currentRange = Number(this.map.range || this.defaultCamera.range);
    const userRange = currentRange / this.viewportRangeFactor;
    this.viewportRangeFactor = nextFactor;
    this.map.range = Math.max(700000, Math.min(20000000, userRange * nextFactor));
  }

  async setCountryGeometry(data) {
    if (!this.map || !this.Polygon3DInteractiveElement || this.geometryReady) {
      return { count: this.countryOverlays.size, ready: this.geometryReady };
    }

    const countries = getRenderableCountryFeatures(data);
    this.onStatus({ type: "geometry-loading", renderer: "google3d", count: countries.length });
    for (let index = 0; index < countries.length; index += 1) {
      this.addCountry(countries[index]);
      if (index % 10 === 9) await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    this.geometryReady = true;
    this.onStatus({ type: "geometry-ready", renderer: "google3d", count: countries.length });
    return { count: countries.length, ready: true };
  }

  addCountry(country) {
    if (!this.map || !this.Polygon3DInteractiveElement || !country?.geometry || this.countryOverlays.has(country.id)) return;
    const polygons = [];
    for (const piece of geometryTo3dPieces(country.geometry)) {
      const polygon = new this.Polygon3DInteractiveElement({
        altitudeMode: "CLAMP_TO_GROUND",
        drawsOccludedSegments: false,
        extruded: false,
        geodesic: false,
        zIndex: 100,
        ...POLYGON_STYLES.normal,
      });
      polygon.path = piece.outer;
      if (piece.holes.length) polygon.innerPaths = piece.holes;
      polygon.setAttribute("aria-label", country.name);
      polygon.addEventListener("gmp-click", (event) => {
        this.onCountryClick({
          id: country.id,
          name: country.name,
          feature: country.feature,
          position: event?.position || null,
        });
      });
      this.map.append(polygon);
      polygons.push(polygon);
    }
    if (polygons.length) this.countryOverlays.set(country.id, { country, polygons, state: "normal" });
  }

  setCountryState(id, state = "normal") {
    const record = this.countryOverlays.get(id);
    if (!record) return false;
    const style = POLYGON_STYLES[state] || POLYGON_STYLES.normal;
    record.state = state;
    record.polygons.forEach((polygon) => Object.assign(polygon, style));
    return true;
  }

  clearCountryState(id) {
    return this.setCountryState(id, "normal");
  }

  clearAllCountryStates() {
    this.countryOverlays.forEach((_, id) => this.clearCountryState(id));
  }

  setBordersVisible(visible) {
    this.countryOverlays.forEach(({ polygons }) => polygons.forEach((polygon) => {
      polygon.style.display = visible ? "" : "none";
    }));
  }

  focusWorld() {
    if (!this.map) return;
    this.map.center = { ...this.defaultCamera.center };
    this.map.range = this.defaultCamera.range * this.viewportRangeFactor;
    this.map.heading = this.defaultCamera.heading;
    this.map.tilt = this.defaultCamera.tilt;
  }

  zoomIn() {
    if (this.map) this.map.range = Math.max(700000, Number(this.map.range || this.defaultCamera.range) * 0.8);
  }

  zoomOut() {
    if (this.map) this.map.range = Math.min(20000000, Number(this.map.range || this.defaultCamera.range) * 1.25);
  }

  resetCamera() {
    this.focusWorld();
    this.onStatus({ type: "reset" });
  }

  setInteractionEnabled(enabled) {
    if (this.map) this.map.gestureHandling = enabled ? "GREEDY" : "NONE";
  }

  getCameraState() {
    if (!this.map) return null;
    return {
      center: this.map.center,
      range: this.map.range,
      heading: this.map.heading,
      tilt: this.map.tilt,
    };
  }

  destroy() {
    this.countryOverlays.clear();
    this.geometryReady = false;
    super.destroy();
  }
}

export function createMapAdapter({ renderer, googleMapsApiKey, onStatus, onCountryClick } = {}) {
  if (renderer === "google3d") {
    return new Google3DAdapter({ apiKey: googleMapsApiKey, onStatus, onCountryClick });
  }
  const reason = renderer === "cesium-google"
    ? "Cesium Google is not enabled in this build; standard map fallback active"
    : "legacy preview active";
  return new LegacyMapAdapter({ onStatus, reason });
}
