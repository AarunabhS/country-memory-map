import { geometryTo3dPieces, getRenderableCountryFeatures } from "./country-geometry.js";

const GOOGLE_SCRIPT_ID = "country-memory-map-google-maps";
const GOOGLE_CALLBACK_NAME = "__countryMemoryMapGoogleReady";
const GOOGLE_RENDERER_TIMEOUT_MS = 25000;
const LOCAL_TEXTURE_WIDTH = 1440;
const LOCAL_TEXTURE_HEIGHT = 720;
const LOCAL_RENDER_LIMIT = 440;
const LOCAL_CONSTRAINED_RENDER_LIMIT = 300;
const LOCAL_FRAME_INTERVAL_MS = 50;
const LOCAL_CONSTRAINED_FRAME_INTERVAL_MS = 66;
let googleMapsPromise;

export function getLocalRenderProfile({ coarsePointer = false, saveData = false, deviceMemory, hardwareConcurrency } = {}) {
  const constrained = coarsePointer || saveData || (Number.isFinite(deviceMemory) && deviceMemory <= 4)
    || (Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4);
  return Object.freeze({
    renderLimit: constrained ? LOCAL_CONSTRAINED_RENDER_LIMIT : LOCAL_RENDER_LIMIT,
    frameInterval: constrained ? LOCAL_CONSTRAINED_FRAME_INTERVAL_MS : LOCAL_FRAME_INTERVAL_MS,
  });
}

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
    this.reason = options.reason || "legacy bridge";
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

function texturePoint(point, previousX = null) {
  let x = ((Number(point.lng) + 180) / 360) * LOCAL_TEXTURE_WIDTH;
  if (previousX !== null) {
    while (x - previousX > LOCAL_TEXTURE_WIDTH / 2) x -= LOCAL_TEXTURE_WIDTH;
    while (previousX - x > LOCAL_TEXTURE_WIDTH / 2) x += LOCAL_TEXTURE_WIDTH;
  }
  return {
    x,
    y: ((90 - Number(point.lat)) / 180) * LOCAL_TEXTURE_HEIGHT,
  };
}

function traceTextureRing(context, ring, offsetX = 0) {
  let previousX = null;
  ring.forEach((point, index) => {
    const projected = texturePoint(point, previousX);
    previousX = projected.x;
    if (index === 0) context.moveTo(projected.x + offsetX, projected.y);
    else context.lineTo(projected.x + offsetX, projected.y);
  });
  context.closePath();
}

function drawTexturePieces(context, pieces, { fill, stroke = null, lineWidth = 1 } = {}) {
  for (const offsetX of [-LOCAL_TEXTURE_WIDTH, 0, LOCAL_TEXTURE_WIDTH]) {
    context.beginPath();
    pieces.forEach((piece) => {
      traceTextureRing(context, piece.outer, offsetX);
      piece.holes.forEach((hole) => traceTextureRing(context, hole, offsetX));
    });
    context.fillStyle = fill;
    context.fill("evenodd");
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.stroke();
    }
  }
}

function colorCode(index) {
  const value = index + 1;
  return value;
}

function localStateStyle(state = "normal") {
  if (state === "selected") return { fill: "#75b7cc", stroke: "#dffaff", lineWidth: 2.4 };
  if (state === "correct") return { fill: "#43b985", stroke: "#dcffed", lineWidth: 2.6 };
  if (state === "incorrect") return { fill: "#cf6270", stroke: "#ffe4e7", lineWidth: 2.6 };
  return { fill: "#496678", stroke: "#91aebb", lineWidth: 1.15 };
}

export class LocalGlobeAdapter extends MapAdapter {
  constructor({ onStatus, onCountryClick } = {}) {
    super({ onStatus });
    this.kind = "local-globe";
    this.onCountryClick = onCountryClick || (() => {});
    this.context = null;
    this.textureCanvas = null;
    this.textureContext = null;
    this.idCanvas = null;
    this.idContext = null;
    this.texturePixels = null;
    this.idPixels = null;
    this.output = null;
    this.lookupLongitude = null;
    this.lookupY = null;
    this.lookupShade = null;
    this.lookupRim = null;
    this.visibleIndexes = null;
    this.countries = new Map();
    this.countryByColor = new Map();
    this.rotation = 0.54;
    this.zoom = 1;
    this.latitude = 0.14;
    this.interactionEnabled = true;
    this.bordersVisible = true;
    this.animationFrame = null;
    this.interactionFrame = null;
    this.lastFrameAt = 0;
    this.drag = null;
    this.resizeObserver = null;
    this.abortController = null;
    this.reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
    this.motionChangeHandler = null;
    this.renderProfile = getLocalRenderProfile({
      coarsePointer: Boolean(globalThis.matchMedia?.("(pointer: coarse)")?.matches),
      saveData: Boolean(globalThis.navigator?.connection?.saveData),
      deviceMemory: Number(globalThis.navigator?.deviceMemory),
      hardwareConcurrency: Number(globalThis.navigator?.hardwareConcurrency),
    });
  }

  async initialize({ container, onCountryClick } = {}) {
    if (!container?.getContext) throw new Error("The local globe canvas is unavailable.");
    if (onCountryClick) this.onCountryClick = onCountryClick;
    this.container = container;
    this.context = container.getContext("2d", { alpha: true });
    if (!this.context) throw new Error("The local globe canvas could not create a drawing context.");

    this.abortController = new AbortController();
    this.bindInteractions(this.abortController.signal);
    if (typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(container);
    }
    this.resize();
    this.startAnimation();
    this.onStatus({ type: "ready", renderer: this.kind });
    return { renderer: this.kind, ready: true };
  }

  createTextureCanvases() {
    this.textureCanvas = document.createElement("canvas");
    this.textureCanvas.width = LOCAL_TEXTURE_WIDTH;
    this.textureCanvas.height = LOCAL_TEXTURE_HEIGHT;
    this.textureContext = this.textureCanvas.getContext("2d", { alpha: false });
    this.idCanvas = document.createElement("canvas");
    this.idCanvas.width = LOCAL_TEXTURE_WIDTH;
    this.idCanvas.height = LOCAL_TEXTURE_HEIGHT;
    this.idContext = this.idCanvas.getContext("2d", { alpha: false, willReadFrequently: true });
  }

  async setCountryGeometry(data) {
    const countries = getRenderableCountryFeatures(data);
    if (!countries.length) return { count: 0, ready: false };
    if (!this.textureCanvas) this.createTextureCanvases();

    this.countries.clear();
    this.countryByColor.clear();
    countries.forEach((country, index) => {
      const pieces = geometryTo3dPieces(country.geometry, { maxPoints: 150, maxPieces: 10 });
      if (!pieces.length) return;
      const code = colorCode(index);
      const record = { ...country, pieces, colorCode: code, state: "normal" };
      this.countries.set(country.id, record);
      this.countryByColor.set(code, record);
    });
    this.rebuildTextures();
    this.render();
    this.onStatus({ type: "geometry-ready", renderer: this.kind, count: this.countries.size });
    return { count: this.countries.size, ready: true };
  }

  drawGraticule() {
    const context = this.textureContext;
    context.save();
    context.strokeStyle = "rgba(135, 181, 203, .18)";
    context.lineWidth = 1;
    for (let longitude = -150; longitude <= 180; longitude += 30) {
      const x = ((longitude + 180) / 360) * LOCAL_TEXTURE_WIDTH;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, LOCAL_TEXTURE_HEIGHT);
      context.stroke();
    }
    for (let latitude = -60; latitude <= 60; latitude += 30) {
      const y = ((90 - latitude) / 180) * LOCAL_TEXTURE_HEIGHT;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(LOCAL_TEXTURE_WIDTH, y);
      context.stroke();
    }
    context.restore();
  }

  rebuildTextures() {
    if (!this.textureContext || !this.idContext) return;
    const ocean = this.textureContext.createLinearGradient(0, 0, LOCAL_TEXTURE_WIDTH, LOCAL_TEXTURE_HEIGHT);
    ocean.addColorStop(0, "#15374a");
    ocean.addColorStop(0.54, "#0b293b");
    ocean.addColorStop(1, "#061a2b");
    this.textureContext.fillStyle = ocean;
    this.textureContext.fillRect(0, 0, LOCAL_TEXTURE_WIDTH, LOCAL_TEXTURE_HEIGHT);
    this.drawGraticule();

    this.idContext.fillStyle = "#000000";
    this.idContext.fillRect(0, 0, LOCAL_TEXTURE_WIDTH, LOCAL_TEXTURE_HEIGHT);
    this.countries.forEach((record) => {
      const style = localStateStyle(record.state);
      drawTexturePieces(this.textureContext, record.pieces, {
        ...style,
        stroke: this.bordersVisible ? style.stroke : null,
      });
      const red = (record.colorCode >> 16) & 255;
      const green = (record.colorCode >> 8) & 255;
      const blue = record.colorCode & 255;
      drawTexturePieces(this.idContext, record.pieces, { fill: `rgb(${red}, ${green}, ${blue})` });
    });
    this.texturePixels = this.textureContext.getImageData(0, 0, LOCAL_TEXTURE_WIDTH, LOCAL_TEXTURE_HEIGHT).data;
    this.idPixels = this.idContext.getImageData(0, 0, LOCAL_TEXTURE_WIDTH, LOCAL_TEXTURE_HEIGHT).data;
  }

  resize() {
    if (!this.container || !this.context) return;
    const bounds = this.container.getBoundingClientRect();
    const available = Math.min(bounds.width || 420, bounds.height || bounds.width || 420);
    const size = Math.max(220, Math.min(this.renderProfile.renderLimit, Math.round(available)));
    if (this.container.width === size && this.container.height === size) return;
    this.container.width = size;
    this.container.height = size;
    this.output = this.context.createImageData(size, size);
    this.buildLookup(size);
    this.render();
  }

  buildLookup(size) {
    const count = size * size;
    this.lookupLongitude = new Float32Array(count);
    this.lookupLongitude.fill(Number.NaN);
    this.lookupY = new Uint16Array(count);
    this.lookupShade = new Uint8Array(count);
    this.lookupRim = new Uint8Array(count);
    const visibleIndexes = [];
    this.output?.data?.fill(0);

    const center = (size - 1) / 2;
    const radius = center * 0.96 * this.zoom;
    const cosine = Math.cos(this.latitude);
    const sine = Math.sin(this.latitude);
    for (let y = 0; y < size; y += 1) {
      const normalizedY = (center - y) / radius;
      for (let x = 0; x < size; x += 1) {
        const normalizedX = (x - center) / radius;
        const distance = normalizedX * normalizedX + normalizedY * normalizedY;
        if (distance > 1) continue;
        const z = Math.sqrt(Math.max(0, 1 - distance));
        const worldY = cosine * normalizedY + sine * z;
        const worldZ = -sine * normalizedY + cosine * z;
        const longitude = Math.atan2(normalizedX, worldZ);
        const latitude = Math.asin(Math.max(-1, Math.min(1, worldY)));
        const index = y * size + x;
        visibleIndexes.push(index);
        this.lookupLongitude[index] = longitude / (Math.PI * 2) + 0.5;
        this.lookupY[index] = Math.max(0, Math.min(LOCAL_TEXTURE_HEIGHT - 1, Math.floor(((Math.PI / 2 - latitude) / Math.PI) * LOCAL_TEXTURE_HEIGHT)));
        const light = Math.max(0, normalizedX * -0.28 + normalizedY * 0.32 + z * 0.9);
        this.lookupShade[index] = Math.round(255 * (0.54 + light * 0.46));
        this.lookupRim[index] = Math.round(54 * Math.pow(1 - z, 1.7));
      }
    }
    this.visibleIndexes = Uint32Array.from(visibleIndexes);
  }

  drawLoadingGlobe() {
    if (!this.context || !this.container) return;
    const size = this.container.width;
    const center = size / 2;
    const radius = size * 0.46 * this.zoom;
    this.context.clearRect(0, 0, size, size);
    const gradient = this.context.createRadialGradient(center - radius * 0.34, center - radius * 0.4, radius * 0.08, center, center, radius);
    gradient.addColorStop(0, "#315e72");
    gradient.addColorStop(0.56, "#12374b");
    gradient.addColorStop(1, "#061827");
    this.context.fillStyle = gradient;
    this.context.beginPath();
    this.context.arc(center, center, radius, 0, Math.PI * 2);
    this.context.fill();
    this.context.strokeStyle = "rgba(177, 224, 240, .52)";
    this.context.lineWidth = 1.4;
    this.context.stroke();
  }

  render() {
    if (!this.context || !this.output || !this.container) return;
    if (!this.texturePixels) {
      this.drawLoadingGlobe();
      return;
    }
    const destination = this.output.data;
    const longitudeOffset = this.rotation / (Math.PI * 2);
    for (let position = 0; position < this.visibleIndexes.length; position += 1) {
      const index = this.visibleIndexes[position];
      const baseLongitude = this.lookupLongitude[index];
      const outputOffset = index * 4;
      let u = baseLongitude + longitudeOffset;
      u -= Math.floor(u);
      const textureX = Math.min(LOCAL_TEXTURE_WIDTH - 1, Math.floor(u * LOCAL_TEXTURE_WIDTH));
      const textureOffset = (this.lookupY[index] * LOCAL_TEXTURE_WIDTH + textureX) * 4;
      const shade = this.lookupShade[index] / 255;
      const rim = this.lookupRim[index];
      destination[outputOffset] = Math.min(255, this.texturePixels[textureOffset] * shade + rim * 0.2);
      destination[outputOffset + 1] = Math.min(255, this.texturePixels[textureOffset + 1] * shade + rim * 0.75);
      destination[outputOffset + 2] = Math.min(255, this.texturePixels[textureOffset + 2] * shade + rim);
      destination[outputOffset + 3] = 255;
    }
    this.context.putImageData(this.output, 0, 0);
  }

  startAnimation() {
    if (this.animationFrame !== null || !this.interactionEnabled || this.reducedMotion?.matches) return;
    const animate = (timestamp) => {
      if (!this.interactionEnabled || this.reducedMotion?.matches) {
        this.animationFrame = null;
        return;
      }
      if (!document.hidden && timestamp - this.lastFrameAt >= this.renderProfile.frameInterval) {
        const elapsed = this.lastFrameAt ? Math.min(100, timestamp - this.lastFrameAt) : this.renderProfile.frameInterval;
        if (!this.drag) this.rotation += elapsed * 0.000045;
        this.render();
        this.lastFrameAt = timestamp;
      }
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  requestInteractionRender() {
    if (this.interactionFrame !== null) return;
    this.interactionFrame = requestAnimationFrame(() => {
      this.interactionFrame = null;
      this.render();
    });
  }

  bindInteractions(signal) {
    const canvas = this.container;
    canvas.addEventListener("pointerdown", (event) => {
      if (!this.interactionEnabled) return;
      this.drag = { pointerId: event.pointerId, x: event.clientX, rotation: this.rotation, moved: false };
      canvas.classList.add("is-dragging");
      canvas.setPointerCapture?.(event.pointerId);
    }, { signal });
    canvas.addEventListener("pointermove", (event) => {
      if (!this.drag || this.drag.pointerId !== event.pointerId) return;
      const difference = event.clientX - this.drag.x;
      this.drag.moved = this.drag.moved || Math.abs(difference) > 5;
      this.rotation = this.drag.rotation + difference * 0.006;
      this.requestInteractionRender();
    }, { signal });
    const endDrag = (event) => {
      if (!this.drag || this.drag.pointerId !== event.pointerId) return;
      const click = !this.drag.moved;
      this.drag = null;
      canvas.classList.remove("is-dragging");
      if (click) this.selectAt(event.clientX, event.clientY);
    };
    canvas.addEventListener("pointerup", endDrag, { signal });
    canvas.addEventListener("pointercancel", endDrag, { signal });
    canvas.addEventListener("wheel", (event) => {
      if (!this.interactionEnabled) return;
      event.preventDefault();
      this.setZoom(this.zoom + (event.deltaY < 0 ? 0.05 : -0.05));
    }, { passive: false, signal });
    canvas.addEventListener("keydown", (event) => {
      if (!this.interactionEnabled) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        this.rotation += event.key === "ArrowLeft" ? -0.16 : 0.16;
        this.render();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        this.zoomIn();
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        this.zoomOut();
      } else if (event.key === "Home") {
        event.preventDefault();
        this.resetCamera();
      }
    }, { signal });
    this.motionChangeHandler = () => {
      if (this.reducedMotion.matches && this.animationFrame !== null) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
        this.render();
      } else {
        this.startAnimation();
      }
    };
    if (this.reducedMotion?.addEventListener) {
      this.reducedMotion.addEventListener("change", this.motionChangeHandler);
    } else {
      this.reducedMotion?.addListener?.(this.motionChangeHandler);
    }
  }

  selectAt(clientX, clientY) {
    if (!this.idPixels || !this.container) return false;
    const bounds = this.container.getBoundingClientRect();
    const x = Math.floor(((clientX - bounds.left) / bounds.width) * this.container.width);
    const y = Math.floor(((clientY - bounds.top) / bounds.height) * this.container.height);
    if (x < 0 || y < 0 || x >= this.container.width || y >= this.container.height) return false;
    const lookupIndex = y * this.container.width + x;
    const baseLongitude = this.lookupLongitude[lookupIndex];
    if (Number.isNaN(baseLongitude)) return false;
    let u = baseLongitude + this.rotation / (Math.PI * 2);
    u -= Math.floor(u);
    const textureX = Math.min(LOCAL_TEXTURE_WIDTH - 1, Math.floor(u * LOCAL_TEXTURE_WIDTH));
    const textureOffset = (this.lookupY[lookupIndex] * LOCAL_TEXTURE_WIDTH + textureX) * 4;
    const code = (this.idPixels[textureOffset] << 16) | (this.idPixels[textureOffset + 1] << 8) | this.idPixels[textureOffset + 2];
    const country = this.countryByColor.get(code);
    if (!country) return false;
    this.onCountryClick({ id: country.id, name: country.name, feature: country.feature, position: null });
    return true;
  }

  setZoom(value) {
    const next = Math.max(0.82, Math.min(1.04, value));
    if (next === this.zoom) return;
    this.zoom = next;
    this.buildLookup(this.container.width);
    this.render();
  }

  zoomIn() {
    this.setZoom(this.zoom + 0.06);
  }

  zoomOut() {
    this.setZoom(this.zoom - 0.06);
  }

  resetCamera() {
    this.rotation = 0.54;
    this.setZoom(1);
    this.render();
    this.onStatus({ type: "reset", renderer: this.kind });
  }

  setInteractionEnabled(enabled) {
    this.interactionEnabled = Boolean(enabled);
    if (this.container) {
      this.container.toggleAttribute("aria-disabled", !this.interactionEnabled);
      this.container.tabIndex = this.interactionEnabled ? 0 : -1;
    }
    if (this.interactionEnabled) this.startAnimation();
    else if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  setCountryState(id, state = "normal") {
    const record = this.countries.get(id);
    if (!record) return false;
    record.state = state;
    const style = localStateStyle(record.state);
    drawTexturePieces(this.textureContext, record.pieces, {
      ...style,
      stroke: this.bordersVisible ? style.stroke : null,
    });
    this.texturePixels = this.textureContext.getImageData(0, 0, LOCAL_TEXTURE_WIDTH, LOCAL_TEXTURE_HEIGHT).data;
    this.render();
    return true;
  }

  clearCountryState(id) {
    const record = this.countries.get(id);
    if (!record) return false;
    record.state = "normal";
    this.rebuildTextures();
    this.render();
    return true;
  }

  clearAllCountryStates() {
    this.countries.forEach((record) => { record.state = "normal"; });
    this.rebuildTextures();
    this.render();
  }

  setBordersVisible(visible) {
    this.bordersVisible = Boolean(visible);
    this.rebuildTextures();
    this.render();
  }

  getCameraState() {
    return { rotation: this.rotation, latitude: this.latitude, zoom: this.zoom };
  }

  destroy() {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    if (this.interactionFrame !== null) cancelAnimationFrame(this.interactionFrame);
    this.abortController?.abort();
    this.resizeObserver?.disconnect();
    if (this.motionChangeHandler && this.reducedMotion?.removeEventListener) {
      this.reducedMotion.removeEventListener("change", this.motionChangeHandler);
    } else if (this.motionChangeHandler) {
      this.reducedMotion?.removeListener?.(this.motionChangeHandler);
    }
    this.context?.clearRect?.(0, 0, this.container?.width || 0, this.container?.height || 0);
    this.animationFrame = null;
    this.interactionFrame = null;
    this.abortController = null;
    this.resizeObserver = null;
    this.motionChangeHandler = null;
    this.texturePixels = null;
    this.idPixels = null;
    this.visibleIndexes = null;
    this.countries.clear();
    this.countryByColor.clear();
    super.destroy();
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
    if (!this.map) return;
    const interactive = Boolean(enabled);
    if (this.map.style) this.map.style.pointerEvents = interactive ? "auto" : "none";
    this.map.setAttribute?.("aria-disabled", String(!interactive));
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
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
    this.resizeObserver?.disconnect();
    this.countryOverlays.clear();
    this.geometryReady = false;
    this.resizeFrame = null;
    this.resizeObserver = null;
    super.destroy();
  }
}

export function createMapAdapter({ renderer, googleMapsApiKey, onStatus, onCountryClick } = {}) {
  if (renderer === "google3d") {
    return new Google3DAdapter({ apiKey: googleMapsApiKey, onStatus, onCountryClick });
  }
  if (renderer === "local-globe") {
    return new LocalGlobeAdapter({ onStatus, onCountryClick });
  }
  const reason = renderer === "cesium-google"
    ? "Cesium Google is not enabled in this build; local globe available"
    : "legacy bridge active";
  return new LegacyMapAdapter({ onStatus, reason });
}
