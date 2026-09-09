import { config } from "./config.js";
import { loadCountryGeometry } from "./country-geometry.js";
import { createMapAdapter } from "./map-adapter.js";
import { createRendererRecovery, getRendererPresentation, RENDERER_RECOVERY_STATES } from "./renderer-recovery.js";
import { GAME_ROUTES, buildGameUrl, parseGameRoute, sameGameRoute } from "./game-routes.js";
import { createGameLifecycle, GAME_LIFECYCLE_STATES } from "./game-lifecycle.js";
import {
  createCountryClickHandler,
  createTypedAnswerHandler,
  submitRetainedFreeMapGuess,
} from "./root-interactions.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const dom = {
  shell: $("#app-shell"),
  globeMount: $("#globe-mount"),
  earthWrap: $("#earth-preview-wrap"),
  liveGlobe: $("#live-globe"),
  legacyFrame: $("#legacy-map-frame"),
  globeLoading: $("#globe-loading"),
  attributionSafeZone: $("#attribution-safe-zone"),
  rendererChip: $("#renderer-chip"),
  rendererChipLabel: $("#renderer-chip-label"),
  topbarActions: $(".topbar-actions"),
  hudTitle: $("#hud-title"),
  hudSubtitle: $("#hud-subtitle"),
  answerForm: $("#answer-form"),
  answerLabel: $("label[for='country-input']"),
  answerButton: $("#answer-form .answer-button"),
  countryInput: $("#country-input"),
  appStatus: $("#app-status"),
  toast: $("#toast"),
  compassControls: $(".compass-controls"),
  sessionSelect: $("#session-select"),
  sessionMenu: $("#session-menu"),
  mobileSheet: $("#mobile-sheet"),
  sheetContent: $("#sheet-content"),
  mobileMenuToggle: $("#mobile-menu-toggle"),
  sessionCount: $("#session-count"),
  progressCount: $("#progress-count"),
  streakCount: $("#streak-count"),
  accuracyCount: $("#accuracy-count"),
  sessionStreak: $("#session-streak"),
  sessionLast: $("#session-last"),
};

const state = {
  mode: "Explore",
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  drag: null,
  sessionCount: 0,
  lastActivity: "Not started",
  toastTimer: null,
  sheetTab: "play",
  legacyReady: false,
  legacyLoadPromise: null,
  currentRoute: null,
  activeRoute: null,
  lastLauncher: null,
};

let mapAdapter;
let rendererRecovery;
const gameLifecycle = createGameLifecycle();

function announce(message) {
  dom.appStatus.textContent = message;
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    dom.toast.hidden = true;
  }, 3800);
  announce(message);
}

function updateEarthTransform() {
  dom.earthWrap.style.transform = `translate(-50%, -50%) translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom}) rotate(${state.rotation}deg)`;
}

function updateStats() {
  const count = String(state.sessionCount);
  dom.sessionCount.textContent = count;
  dom.progressCount.textContent = count;
  dom.streakCount.textContent = "0";
  dom.accuracyCount.textContent = "0%";
  dom.sessionStreak.textContent = "0";
  dom.sessionLast.textContent = state.lastActivity;
}

function legacyDocument() {
  return dom.legacyFrame?.contentDocument || null;
}

function installLegacyFrameStyles(frameDocument) {
  if (!frameDocument || frameDocument.getElementById("country-memory-map-legacy-bridge")) return;
  const style = frameDocument.createElement("style");
  style.id = "country-memory-map-legacy-bridge";
  style.textContent = `
    html, body, .app { width: 100% !important; height: 100% !important; min-height: 100% !important; overflow: hidden !important; background: transparent !important; }
    .topbar, .continentbar, .control, .legend-panel, .loading, .platform-header, .setup-panel, .game-hud, .profile-chip, dialog, #profileDialog, #resultsDialog, #friendsPanel, #liveBoard, #friendCountdown, #friendConnection { display: none !important; }
    .map-shell { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; }
    #map { display: block !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; }
  `;
  frameDocument.head.appendChild(style);
  const closeLegacyDialogs = () => {
    frameDocument.querySelectorAll("#profileDialog[open], #resultsDialog[open]").forEach((dialog) => dialog.close?.());
  };
  closeLegacyDialogs();
  const frameWindow = frameDocument.defaultView;
  if (frameWindow && !frameWindow.__COUNTRY_MEMORY_MAP_DIALOG_GUARD__) {
    const observer = new frameWindow.MutationObserver(closeLegacyDialogs);
    observer.observe(frameDocument.documentElement, { attributes: true, childList: true, subtree: true, attributeFilter: ["open"] });
    frameWindow.__COUNTRY_MEMORY_MAP_DIALOG_GUARD__ = observer;
  }
}

function restoreLegacyFrameStyles(frameDocument) {
  frameDocument?.getElementById("country-memory-map-legacy-bridge")?.remove();
}

function setLegacyFallbackVisible(visible) {
  dom.globeMount.classList.toggle("legacy-visible", visible);
  dom.legacyFrame.setAttribute("aria-hidden", String(!visible));
  dom.legacyFrame.tabIndex = visible ? 0 : -1;
}

async function activateRetainedFallback(reason) {
  mapAdapter?.setInteractionEnabled(false);
  setRendererCopy({ warning: true });
  await applyRoute(state.currentRoute || GAME_ROUTES.explore, { reason: `renderer-${reason}` });
}

function syncLegacyStats() {
  const frameDocument = legacyDocument();
  if (!frameDocument) return;
  const scoreText = frameDocument.querySelector("#score")?.textContent || "";
  const match = scoreText.match(/(\d+)\s*\/\s*(\d+)/);
  if (match) state.sessionCount = Number(match[1]);
  const message = frameDocument.querySelector("#message")?.textContent?.trim();
  if (message && !/^Name a country to begin/.test(message)) state.lastActivity = message.replace(/[.!]$/, "");
  updateStats();
}

function loadLegacyEngine() {
  if (state.legacyReady) return Promise.resolve(legacyDocument());
  if (state.legacyLoadPromise) return state.legacyLoadPromise;

  state.legacyLoadPromise = new Promise((resolve, reject) => {
    const onLoad = () => {
      const started = Date.now();
      const waitForHost = () => {
        const frameDocument = legacyDocument();
        if (frameDocument?.defaultView?.CountryMemoryRetained) {
          state.legacyReady = true;
          resolve(frameDocument);
          return;
        }
        if (Date.now() - started >= 5000) {
          reject(new Error("The retained game controller did not become ready."));
          return;
        }
        window.setTimeout(waitForHost, 25);
      };
      window.setTimeout(waitForHost, 0);
    };
    const onError = () => reject(new Error("The standard game fallback could not be loaded."));
    dom.legacyFrame.addEventListener("load", onLoad, { once: true });
    dom.legacyFrame.addEventListener("error", onError, { once: true });
    dom.legacyFrame.src = dom.legacyFrame.dataset.src;
  });
  return state.legacyLoadPromise;
}

async function proxyGuessToLegacy(value) {
  const frameDocument = await prepareRetainedBridge(state.currentRoute?.checker || "countries");
  submitRetainedFreeMapGuess(frameDocument, value);
  await new Promise(resolve => window.setTimeout(resolve, 120));
  syncLegacyStats();
  const message = legacyDocument()?.querySelector("#message")?.textContent?.trim();
  if (message) showToast(message);
}

function retainedHost(frameDocument = legacyDocument()) {
  return frameDocument?.defaultView?.CountryMemoryRetained || null;
}

async function prepareRetainedBridge(checker) {
  const frameDocument = await loadLegacyEngine();
  const host = retainedHost(frameDocument);
  if (!host) throw new Error("The retained game controller is unavailable.");
  if (host.getLifecycleState?.().state !== "free-map") host.openFreeMap({ checker });
  const requiredChecker = checker === "capitals" ? "#capitalModeButton" : "#countryModeButton";
  if (!frameDocument.querySelector(requiredChecker)?.classList.contains("active")) host.openFreeMap({ checker });
  installLegacyFrameStyles(frameDocument);
  syncLegacyStats();
  return frameDocument;
}

const handleGlobeCountryClick = createCountryClickHandler({
  getMode: () => state.mode,
  isActive: () => rendererRecovery?.is3dActive() ?? false,
  prepareChecker: loadLegacyEngine,
  submitCountry: (_checker, name) => proxyGuessToLegacy(name),
  setSelection: (id) => mapAdapter?.setCountryState(id, "selected"),
  clearSelection: (id) => mapAdapter?.clearCountryState(id),
  setInput: (name) => { dom.countryInput.value = name; },
  clearInput: (name) => {
    if (dom.countryInput.value === name) dom.countryInput.value = "";
  },
  notify: ({ type, name, error }) => {
    if (type === "checking") showToast(`${name} selected. Checking…`);
    if (type === "busy") announce("A country is already being checked.");
    if (type === "cancelled") showToast("Country selection was not submitted because the mode changed.");
    if (type === "error") showToast(error?.message || "The country could not be checked. Try typing it instead.");
  },
  notifyNonAnswering: ({ mode }) => {
    if (mode === "Capitals") showToast("Country clicks do not answer Capitals. Type a capital name.");
    else announce(`${mode || "This mode"} does not accept country-click answers.`);
  },
});

async function hydrateGoogleCountryGeometry(adapter) {
  try {
    const data = await loadCountryGeometry();
    const result = await adapter.setCountryGeometry(data);
    if (result?.count) {
      return true;
    }
  } catch (error) {
    console.warn("Country Memory Map 3D boundary overlay:", error.message);
    const presentation = setRendererCopy({ live: true, warning: true });
    if (presentation.live) showToast("Live Earth is ready, but country boundaries could not be loaded.");
  }
  return false;
}

function setRendererCopy({ live = false, warning = false } = {}) {
  const presentation = getRendererPresentation(rendererRecovery?.getState(), { live, warning });
  dom.rendererChip.classList.toggle("is-live", presentation.live);
  dom.rendererChip.classList.toggle("is-warning", presentation.warning);
  dom.rendererChipLabel.textContent = presentation.label;
  return presentation;
}

function setMode(mode, note) {
  state.mode = mode;
  dom.countryInput.value = "";
  $$(".mode-row").forEach((row) => {
    const active = row.dataset.mode === mode;
    row.classList.toggle("is-active", active);
    row.setAttribute("aria-current", active ? "page" : "false");
  });
  dom.hudTitle.textContent = mode === "Explore" ? "Planet Earth" : mode;
  dom.hudSubtitle.textContent = mode === "Explore" ? "Drag to rotate · Scroll to zoom · Click a country" : mode === "Countries" ? "Type a country name to mark it on the map" : mode === "Capitals" ? "Type a capital name to mark it on the map" : `Opening ${note}`;
  const answerKind = mode === "Capitals" ? "capital" : "country";
  dom.answerLabel.textContent = `Type a ${answerKind} name`;
  dom.countryInput.placeholder = `Type a ${answerKind} name…`;
  dom.countryInput.setAttribute("aria-label", `Type a ${answerKind} name`);
  dom.answerButton.innerHTML = `Mark ${answerKind === "capital" ? "Capital" : "Country"} <span aria-hidden="true">→</span>`;
}

function rendererIsTerminal2d() {
  return rendererRecovery?.getState() === RENDERER_RECOVERY_STATES.TWO_D_ACTIVE;
}

function setSurface(surface) {
  dom.shell.dataset.surface = surface;
  const retained = surface === "retained";
  dom.answerForm.inert = retained;
  dom.answerForm.setAttribute("aria-hidden", String(retained));
  dom.countryInput.disabled = retained || !(rendererRecovery?.is3dActive() ?? false);
  dom.compassControls.inert = retained;
  dom.compassControls.setAttribute("aria-hidden", String(retained));
  setLegacyFallbackVisible(retained);
  if (retained) {
    dom.liveGlobe.hidden = true;
    dom.liveGlobe.setAttribute("aria-hidden", "true");
    dom.earthWrap.hidden = true;
    dom.attributionSafeZone.hidden = true;
  } else if (rendererRecovery?.is3dActive()) {
    dom.liveGlobe.hidden = false;
    dom.liveGlobe.style.visibility = "visible";
    dom.liveGlobe.style.pointerEvents = "auto";
    dom.liveGlobe.removeAttribute("aria-hidden");
    dom.earthWrap.hidden = true;
    dom.attributionSafeZone.hidden = false;
  } else {
    dom.earthWrap.hidden = false;
  }
}

function focusHome() {
  const target = state.lastLauncher?.isConnected ? state.lastLauncher : $(".panel-heading h1");
  target?.focus?.({ preventScroll: true });
}

function focusRetained(host) {
  window.requestAnimationFrame(() => host?.focusPrimary?.());
}

function routeUrl(route, absolute = false) {
  return buildGameUrl(route, { pathname: window.location.pathname, origin: absolute ? window.location.origin : "" });
}

function writeRoute(route, method = "push") {
  const url = routeUrl(route);
  if (method === "replace") window.history.replaceState({ game: route?.slug || null }, "", url);
  else window.history.pushState({ game: route?.slug || null }, "", url);
}

function normalizeLocationRoute() {
  const parsed = parseGameRoute(window.location.search);
  if (!parsed.canonical) {
    writeRoute(parsed.route, "replace");
    if (!parsed.route) announce("That game link was unavailable. Returned to Home.");
    else if (parsed.reason !== "room-ingress") announce("The game link was normalized.");
  }
  return parsed.route;
}

function onRetainedNavigation(payload = {}) {
  if (payload.type === "invite-url") return routeUrl({ ...GAME_ROUTES.multiplayer, room: payload.room }, true);
  if (payload.type === "multiplayer-room") {
    const route = { ...GAME_ROUTES.multiplayer, ...(payload.room ? { room: payload.room } : {}) };
    if (!sameGameRoute(route, state.currentRoute)) {
      writeRoute(route, "replace");
      void applyRoute(route, { reason: "multiplayer-room" });
    }
    return null;
  }
  if (payload.type === "multiplayer") navigateToRoute(GAME_ROUTES.multiplayer, { reason: "retained-multiplayer" });
  if (payload.type === "home") navigateToRoute(null, { reason: "retained-home" });
  return null;
}

async function getRetainedHost(token) {
  const frameDocument = await loadLegacyEngine();
  if (!gameLifecycle.isCurrent(token)) return null;
  const host = retainedHost(frameDocument);
  if (!host) throw new Error("The retained game controller is unavailable.");
  host.setHostNavigationHandler(onRetainedNavigation);
  return { frameDocument, host };
}

function homeLifecycleState() {
  return rendererIsTerminal2d() ? GAME_LIFECYCLE_STATES.HOME_2D : GAME_LIFECYCLE_STATES.HOME_3D;
}

async function applyRoute(route, { reason = "route" } = {}) {
  const previous = state.activeRoute;
  state.currentRoute = route;
  state.activeRoute = route;
  const token = gameLifecycle.begin(route?.kind === "free-map" && !rendererIsTerminal2d() ? homeLifecycleState() : GAME_LIFECYCLE_STATES.RETAINED_LOADING);

  try {
    if (!route) {
      const retained = state.legacyReady ? { frameDocument: legacyDocument(), host: retainedHost() } : null;
      if (previous?.kind === "multiplayer") retained?.host?.suspendMultiplayer?.();
      retained?.host?.deactivate?.({ reason: "mode_change" });
      if (rendererIsTerminal2d()) {
        const ready = retained || await getRetainedHost(token);
        if (!ready || !gameLifecycle.isCurrent(token)) return;
        ready.host.openFreeMap({ checker: "countries" });
        restoreLegacyFrameStyles(ready.frameDocument);
        setSurface("retained");
        gameLifecycle.commit(token, GAME_LIFECYCLE_STATES.HOME_2D);
        focusRetained(ready.host);
      } else {
        setSurface("root");
        setMode("Explore", "Free exploration mode");
        if (state.legacyReady) await prepareRetainedBridge("countries");
        if (!gameLifecycle.isCurrent(token)) return;
        gameLifecycle.commit(token, GAME_LIFECYCLE_STATES.HOME_3D);
        focusHome();
      }
      return;
    }

    setMode(route.label, route.label);
    if (route.kind === "free-map" && !rendererIsTerminal2d()) {
      setSurface("root");
      const frameDocument = await prepareRetainedBridge(route.checker);
      if (!gameLifecycle.isCurrent(token)) return;
      installLegacyFrameStyles(frameDocument);
      gameLifecycle.commit(token, GAME_LIFECYCLE_STATES.HOME_3D);
      return;
    }

    const ready = await getRetainedHost(token);
    if (!ready || !gameLifecycle.isCurrent(token)) return;
    restoreLegacyFrameStyles(ready.frameDocument);
    if (previous?.kind === "multiplayer" && route.kind !== "multiplayer") ready.host.suspendMultiplayer?.();

    if (route.kind === "free-map") {
      ready.host.openFreeMap({ checker: route.checker });
      setSurface("retained");
      gameLifecycle.commit(token, GAME_LIFECYCLE_STATES.HOME_2D);
    } else if (route.kind === "solo") {
      const lifecycle = ready.host.getLifecycleState?.();
      const sameActiveRound = sameGameRoute(route, previous) && lifecycle?.state === "playing" && lifecycle.family === route.family && lifecycle.variant === route.variant;
      if (!sameActiveRound) ready.host.openGame({ family: route.family, variant: route.variant });
      setSurface("retained");
      gameLifecycle.commit(token, sameActiveRound ? GAME_LIFECYCLE_STATES.SOLO_PLAYING : GAME_LIFECYCLE_STATES.SOLO_SETUP);
    } else if (route.kind === "multiplayer") {
      ready.host.deactivate?.({ reason: "mode_change" });
      setSurface("retained");
      await ready.host.openMultiplayer?.({ room: route.room });
      if (!gameLifecycle.isCurrent(token)) return;
      gameLifecycle.commit(token, GAME_LIFECYCLE_STATES.MULTIPLAYER);
    }
    focusRetained(ready.host);
  } catch (error) {
    if (!gameLifecycle.isCurrent(token)) return;
    console.warn("Country Memory Map route activation:", error.message);
    gameLifecycle.commit(token, GAME_LIFECYCLE_STATES.FATAL_ROUTE_ERROR);
    announce("That game could not be opened. Returned to Home.");
    writeRoute(null, "replace");
    state.currentRoute = null;
    state.activeRoute = null;
    setSurface("root");
  }
}

function navigateToRoute(route, { reason = "launch", history = "push" } = {}) {
  if (history !== "none") writeRoute(route, history);
  void applyRoute(route, { reason });
}

function setSheet(tab, open = true) {
  state.sheetTab = tab;
  const copy = {
    play: ["Play", "Choose a mode or enter a country below to begin the exploration flow."],
    progress: ["World progress", `${state.sessionCount} countries in this preview session. Saved profile stats will appear when the game engine is connected.`],
    challenge: ["Around the World", "Locate 5 countries before the globe completes a rotation. Challenge rules are staged for the live game flow."],
    friends: ["Friends", "No presence service is connected in this workspace yet. Nothing is being shown as online until it is real."],
  }[tab];
  dom.sheetContent.innerHTML = `<h2>${copy[0]}</h2><p>${copy[1]}</p>`;
  dom.mobileSheet.hidden = !open;
  dom.mobileMenuToggle.setAttribute("aria-expanded", String(open));
  $$(".mobile-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.mobileTab === tab));
}

async function initializeRenderer() {
  const adapter = createMapAdapter({
    renderer: config.renderer,
    googleMapsApiKey: config.googleMapsApiKey,
    onCountryClick: (payload) => {
      if (rendererRecovery?.is3dActive()) void handleGlobeCountryClick(payload);
    },
    onStatus: ({ type }) => {
      if (type === "loading") {
        // The fallback Earth is already visible; keep the optional loader non-blocking.
        dom.globeLoading.hidden = true;
        setRendererCopy({ message: "Loading live Earth…" });
      }
      if (type === "geometry-loading") setRendererCopy({ live: true });
    },
  });

  if (config.renderer === "google3d") {
    // Keep the cinematic Earth visible while the optional live renderer starts.
    // A slow or blocked Maps request must never replace the usable preview with a spinner.
    dom.globeLoading.hidden = true;
    dom.liveGlobe.hidden = false;
    dom.liveGlobe.style.visibility = "hidden";
    dom.liveGlobe.style.pointerEvents = "none";
    dom.earthWrap.hidden = false;
    try {
      await adapter.initialize({ container: dom.liveGlobe });
      const usable = await hydrateGoogleCountryGeometry(adapter);
      if (!usable || !rendererRecovery.activate3d()) return adapter;
      if (dom.shell.dataset.surface === "retained") {
        adapter.setInteractionEnabled(false);
        setRendererCopy({ live: true });
        return adapter;
      }
      dom.globeLoading.hidden = true;
      dom.liveGlobe.style.visibility = "visible";
      dom.liveGlobe.style.pointerEvents = "auto";
      dom.liveGlobe.removeAttribute("aria-hidden");
      dom.earthWrap.hidden = true;
      dom.attributionSafeZone.hidden = false;
      setLegacyFallbackVisible(false);
      dom.globeMount.classList.add("is-live");
      setSurface("root");
      setRendererCopy({ live: true });
      announce("Live 3D Earth is ready.");
      return adapter;
    } catch (error) {
      rendererRecovery.activate2d("renderer-failure");
      dom.globeLoading.hidden = true;
      dom.liveGlobe.hidden = true;
      dom.liveGlobe.style.visibility = "";
      dom.liveGlobe.style.pointerEvents = "";
      dom.liveGlobe.setAttribute("aria-hidden", "true");
      dom.earthWrap.hidden = false;
      dom.attributionSafeZone.hidden = true;
      dom.globeMount.classList.remove("is-live");
      setRendererCopy({ warning: true });
      console.warn("Country Memory Map 3D renderer fallback:", error.message);
      return createMapAdapter({ renderer: "legacy", onStatus: () => {} });
    }
  }

  await adapter.initialize({ container: dom.liveGlobe });
  // The configured non-Google preview remains the authoritative cinematic
  // surface; it does not start the Google recovery deadline.
  rendererRecovery.activate3d();
  dom.globeLoading.hidden = true;
  dom.attributionSafeZone.hidden = true;
  if (dom.shell.dataset.surface !== "retained") setLegacyFallbackVisible(false);
  setRendererCopy();
  return adapter;
}

function wireGlobePreview() {
  dom.earthWrap.addEventListener("pointerdown", (event) => {
    state.drag = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, offsetX: state.offsetX, offsetY: state.offsetY, rotation: state.rotation };
    dom.earthWrap.classList.add("is-dragging");
    dom.earthWrap.setPointerCapture(event.pointerId);
    mapAdapter?.setInteractionEnabled(true);
    announce("Earth drag started.");
  });

  dom.earthWrap.addEventListener("pointermove", (event) => {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.drag.clientX;
    const dy = event.clientY - state.drag.clientY;
    state.offsetX = state.drag.offsetX + dx * 0.22;
    state.offsetY = state.drag.offsetY + dy * 0.12;
    state.rotation = Math.max(-4, Math.min(4, state.drag.rotation + dx * 0.018));
    updateEarthTransform();
  });

  const endDrag = (event) => {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    state.drag = null;
    dom.earthWrap.classList.remove("is-dragging");
    announce("Earth drag ended.");
  };
  dom.earthWrap.addEventListener("pointerup", endDrag);
  dom.earthWrap.addEventListener("pointercancel", endDrag);

  dom.earthWrap.addEventListener("wheel", (event) => {
    if (dom.earthWrap.hidden) return;
    event.preventDefault();
    state.zoom = Math.max(0.78, Math.min(1.2, state.zoom + (event.deltaY < 0 ? 0.05 : -0.05)));
    dom.earthWrap.classList.add("is-zoomed");
    updateEarthTransform();
  }, { passive: false });
}

function wireControls() {
  $$("[data-globe-control]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.globeControl;
      if (action === "zoom-in") {
        mapAdapter?.zoomIn();
        if (!dom.earthWrap.hidden) state.zoom = Math.min(1.2, state.zoom + 0.07);
      }
      if (action === "zoom-out") {
        mapAdapter?.zoomOut();
        if (!dom.earthWrap.hidden) state.zoom = Math.max(0.78, state.zoom - 0.07);
      }
      if (action === "reset") {
        mapAdapter?.resetCamera();
        state.zoom = 1;
        state.offsetX = 0;
        state.offsetY = 0;
        state.rotation = 0;
      }
      updateEarthTransform();
    });
  });
}

function wireInteractions() {
  $$(".mode-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.lastLauncher = row;
      navigateToRoute(GAME_ROUTES[row.dataset.game], { reason: "launcher" });
    });
  });

  dom.answerForm.addEventListener("submit", createTypedAnswerHandler({
    getValue: () => dom.countryInput.value,
    isActive: () => (rendererRecovery?.is3dActive() ?? false) && dom.shell.dataset.surface !== "retained" && state.currentRoute?.kind === "free-map",
    setDisabled: (disabled) => { dom.countryInput.disabled = disabled; },
    clearValue: () => { dom.countryInput.value = ""; },
    focus: () => dom.countryInput.focus(),
    submit: proxyGuessToLegacy,
    notifyEmpty: () => showToast(`Type a ${state.mode === "Capitals" ? "capital" : "country"} name to continue.`),
    notifyError: (error) => showToast(error.message),
  }));

  $$("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const message = button.dataset.action === "challenge"
        ? "Daily Challenge is staged for the live game engine connection."
        : "The learning card is ready to connect to the world guide experience.";
      showToast(message);
    });
  });

  $$("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("[data-nav]").forEach((item) => item.classList.toggle("is-active", item === button));
      if (button.dataset.nav === "home") navigateToRoute(null, { reason: "navigation" });
      else if (button.dataset.nav === "friends") navigateToRoute(GAME_ROUTES.multiplayer, { reason: "navigation" });
      else showToast(`${button.textContent.trim()} is available from the root home surface.`);
    });
  });

  $$("[data-footer]").forEach((button) => {
    button.addEventListener("click", () => showToast(`${button.textContent.trim()} will be wired with the production content pass.`));
  });

  dom.sessionSelect.addEventListener("click", () => {
    const open = dom.sessionSelect.getAttribute("aria-expanded") === "true";
    dom.sessionSelect.setAttribute("aria-expanded", String(!open));
    dom.sessionMenu.hidden = open;
  });

  $$("[data-session]").forEach((button) => {
    button.addEventListener("click", () => {
      dom.sessionSelect.querySelector("span:nth-child(2)").textContent = button.dataset.session === "solo" ? "Solo exploration" : "Practice mode";
      dom.sessionSelect.setAttribute("aria-expanded", "false");
      dom.sessionMenu.hidden = true;
      showToast(`${button.textContent.replace(/\s+(Active|Preview)$/, "")} selected.`);
    });
  });

  dom.mobileMenuToggle.addEventListener("click", () => setSheet(state.sheetTab, dom.mobileSheet.hidden));
  $$("[data-mobile-tab]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.mobileTab === "friends") navigateToRoute(GAME_ROUTES.multiplayer, { reason: "mobile-navigation" });
    else setSheet(button.dataset.mobileTab, true);
  }));

  document.addEventListener("click", (event) => {
    if (!dom.topbarActions?.contains(event.target) && !dom.sessionMenu.hidden) {
      dom.sessionMenu.hidden = true;
      dom.sessionSelect.setAttribute("aria-expanded", "false");
    }
  });
}

async function bootstrap() {
  document.addEventListener("visibilitychange", () => {
    document.documentElement.dataset.pageVisibility = document.hidden ? "hidden" : "visible";
  });
  wireGlobePreview();
  wireControls();
  wireInteractions();
  updateStats();
  state.currentRoute = normalizeLocationRoute();
  window.addEventListener("popstate", () => {
    const route = normalizeLocationRoute();
    void applyRoute(route, { reason: "history" });
  });
  rendererRecovery = createRendererRecovery({
    onTransition: ({ state, reason }) => {
      if (state === RENDERER_RECOVERY_STATES.TWO_D_ACTIVE) void activateRetainedFallback(reason);
    },
  });
  if (config.renderer === "google3d") rendererRecovery.start();
  void applyRoute(state.currentRoute, { reason: "initial" });
  mapAdapter = await initializeRenderer();
  const scheduleIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 900));
  scheduleIdle(() => loadLegacyEngine().catch((error) => console.warn("Legacy game bridge:", error.message)));
  window.__COUNTRY_MEMORY_MAP_DEBUG__ = { config, mapAdapter, state };
}

bootstrap().catch((error) => {
  console.warn("Country Memory Map shell initialization:", error.message);
  setRendererCopy({ warning: true });
});
