import { config } from "./config.js";
import { buildCountryFacts } from "./country-facts.js?v=20260911-explore1";
import { loadCountryGeometry } from "./country-geometry.js?v=20260910-mobile-perf2";
import { createMapAdapter } from "./map-adapter.js?v=20260911-explore1";
import { createRendererRecovery, getRendererPresentation, RENDERER_RECOVERY_STATES } from "./renderer-recovery.js";
import { GAME_ROUTES, buildGameUrl, parseGameRoute, sameGameRoute } from "./game-routes.js";
import { createGameLifecycle, GAME_LIFECYCLE_STATES, shouldConfirmSessionExit } from "./game-lifecycle.js?v=20260910-mobile-perf2";
import {
  createCountryClickHandler,
  createTypedAnswerHandler,
  submitRetainedFreeMapGuess,
} from "./root-interactions.js?v=20260910-mobile-perf2";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const dom = {
  shell: $("#app-shell"),
  homeButton: $("#home-button"),
  localGlobe: $("#local-globe"),
  liveGlobe: $("#live-globe"),
  legacyFrame: $("#legacy-map-frame"),
  attributionSafeZone: $("#attribution-safe-zone"),
  rendererChip: $("#renderer-chip"),
  rendererChipLabel: $("#renderer-chip-label"),
  hudTitle: $("#hud-title"),
  hudSubtitle: $("#hud-subtitle"),
  answerForm: $("#answer-form"),
  answerLabel: $("label[for='country-input']"),
  answerButton: $("#answer-form .answer-button"),
  voiceButton: $("#voice-button"),
  countryInput: $("#country-input"),
  factCard: $("#country-fact-card"),
  factClose: $("#country-fact-close"),
  factFlag: $("#country-fact-flag"),
  factName: $("#country-fact-name"),
  factRegion: $("#country-fact-region"),
  factPopulation: $("#country-fact-population"),
  factCapital: $("#country-fact-capital"),
  factContinent: $("#country-fact-continent"),
  factCode: $("#country-fact-code"),
  factSource: $("#country-fact-source"),
  appStatus: $("#app-status"),
  toast: $("#toast"),
  launcherTitle: $("#launcher-title"),
  sessionExitDialog: $("#session-exit-dialog"),
};

const state = {
  mode: "Countries",
  currentRoute: null,
  activeRoute: null,
  lastLauncher: null,
  legacyReady: false,
  legacyLoadPromise: null,
  localReady: false,
  localGeometryReady: false,
  toastTimer: null,
  answerPending: false,
  voiceSupported: false,
  voiceListening: false,
  exploreCountry: null,
  pendingHistoryRoute: null,
};

let mapAdapter;
let localGlobeAdapter;
let googleGlobeAdapter;
let rendererRecovery;
let speechRecognition;
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
  }, 3600);
  announce(message);
}

function legacyDocument() {
  return dom.legacyFrame?.contentDocument || null;
}

function retainedHost(frameDocument = legacyDocument()) {
  return frameDocument?.defaultView?.CountryMemoryRetained || null;
}

function installLegacyFrameStyles(frameDocument) {
  if (!frameDocument || frameDocument.getElementById("country-memory-map-legacy-bridge")) return;
  const style = frameDocument.createElement("style");
  style.id = "country-memory-map-legacy-bridge";
  style.textContent = `
    html, body, .app { width: 100% !important; height: 100% !important; min-height: 100% !important; overflow: hidden !important; background: transparent !important; }
    .topbar, .continentbar, .control, .legend-panel, .loading, .platform-header, .setup-panel, .game-hud, .profile-chip, dialog, #profileDialog, #resultsDialog, #friendsPanel, #liveBoard, #friendCountdown, #friendConnection { display: none !important; }
    .map-shell { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; border: 0 !important; background: transparent !important; box-shadow: none !important; }
    #map { display: block !important; width: 100% !important; height: 100% !important; border: 0 !important; background: transparent !important; box-shadow: none !important; }
  `;
  (frameDocument.head || frameDocument.body || frameDocument.documentElement)?.appendChild(style);
  const closeDialogs = () => {
    frameDocument.querySelectorAll("#profileDialog[open], #resultsDialog[open]").forEach((dialog) => dialog.close?.());
  };
  closeDialogs();
  // The retained engine is deactivated before leaving a scored route, so a
  // one-time close is sufficient here. Avoid installing a cross-realm
  // MutationObserver while the iframe is still navigating; some browsers
  // expose its document root as a non-Node during that transition.
}

function restoreLegacyFrameStyles(frameDocument) {
  frameDocument?.getElementById("country-memory-map-legacy-bridge")?.remove();
}

function syncIframeViewport(frameDocument = legacyDocument()) {
  const viewport = window.visualViewport;
  const vh = Math.max(1, Math.round(viewport?.height || window.innerHeight));
  const viewportTop = Math.max(0, Math.round(viewport?.offsetTop || 0));
  document.documentElement.style.setProperty("--visual-viewport-height", `${vh}px`);
  document.documentElement.style.setProperty("--visual-viewport-top", `${viewportTop}px`);
  if (!frameDocument?.documentElement) return;
  frameDocument.documentElement.style.setProperty("--app-height", `${vh}px`);
  frameDocument.documentElement.style.setProperty("--keyboard-top", "0px");
  const safeBottom = getComputedStyle(document.documentElement).getPropertyValue("--safe-bottom") || "0px";
  frameDocument.documentElement.style.setProperty("--safe-bottom", safeBottom);
  retainedHost(frameDocument)?.syncViewport?.({ height: vh, offsetTop: 0 });
}

window.visualViewport?.addEventListener("resize", () => syncIframeViewport());
window.visualViewport?.addEventListener("scroll", () => syncIframeViewport());
window.addEventListener("resize", () => syncIframeViewport());
window.addEventListener("orientationchange", () => syncIframeViewport());

function loadLegacyEngine() {
  if (state.legacyReady) return Promise.resolve(legacyDocument());
  if (state.legacyLoadPromise) return state.legacyLoadPromise;

  state.legacyLoadPromise = new Promise((resolve, reject) => {
    const started = Date.now();
    let pollTimer = null;
    let settled = false;
    const cleanup = () => {
      if (pollTimer !== null) window.clearTimeout(pollTimer);
      dom.legacyFrame.removeEventListener("error", onError);
    };
    const fail = (message) => {
      if (settled) return;
      settled = true;
      cleanup();
      state.legacyLoadPromise = null;
      reject(new Error(message));
    };
    const onError = () => fail("The game engine could not be loaded.");
    const waitForHost = () => {
      if (settled) return;
      const frameDocument = legacyDocument();
      if (frameDocument?.defaultView?.CountryMemoryRetained) {
        settled = true;
        cleanup();
        state.legacyReady = true;
        syncIframeViewport(frameDocument);
        resolve(frameDocument);
        return;
      }
      if (Date.now() - started >= 15000) {
        fail("The game engine did not become ready.");
        return;
      }
      pollTimer = window.setTimeout(waitForHost, 25);
    };
    dom.legacyFrame.addEventListener("error", onError, { once: true });
    const desiredSrc = new URL(dom.legacyFrame.dataset.src, document.baseURI).href;
    if (dom.legacyFrame.src !== desiredSrc) dom.legacyFrame.src = desiredSrc;
    // Some browsers restore a cached iframe without dispatching a fresh load
    // event. Polling the host contract makes route activation independent of
    // that delivery detail while retaining the same bounded timeout.
    waitForHost();
  });
  return state.legacyLoadPromise;
}

async function prepareRetainedBridge(checker) {
  const frameDocument = await loadLegacyEngine();
  const host = retainedHost(frameDocument);
  if (!host) throw new Error("The country checker is unavailable.");
  const lifecycle = host.getLifecycleState?.();
  if (lifecycle?.state !== "free-map" || lifecycle.checker !== checker) host.openFreeMap({ checker });
  const ready = host.getLifecycleState?.();
  if (ready?.state !== "free-map" || ready.checker !== checker || !host.submitFreeMapGuess) {
    throw new Error("The country checker did not become ready.");
  }
  installLegacyFrameStyles(frameDocument);
  return frameDocument;
}

async function proxyGuessToLegacy(value) {
  const checker = state.mode === "Capitals" ? "capitals" : "countries";
  const frameDocument = await prepareRetainedBridge(checker);
  const result = await submitRetainedFreeMapGuess(frameDocument, value, { checker });
  showToast(result.message);
  if (result.accepted && result.country) selectExploreCountry(result.country);
  return result;
}

function applyExploreCountryToAdapter(adapter, { focus = false } = {}) {
  if (!adapter || !state.exploreCountry?.id) return false;
  adapter.clearAllCountryStates?.();
  const selected = adapter.setCountryState?.(state.exploreCountry.id, "selected") === true;
  if (selected && focus) adapter.focusCountry?.(state.exploreCountry.id);
  return selected;
}

function renderCountryFacts(country) {
  const facts = buildCountryFacts(country);
  dom.factFlag.textContent = facts.flag;
  dom.factName.textContent = facts.name;
  dom.factRegion.textContent = facts.regionLabel;
  dom.factPopulation.textContent = facts.populationLabel;
  dom.factPopulation.title = facts.populationExact ? `${facts.populationExact} people` : "Population not available";
  dom.factCapital.textContent = facts.capitalLabel;
  dom.factContinent.textContent = facts.continentLabel;
  dom.factCode.textContent = facts.codeLabel;
  dom.factSource.textContent = facts.populationYear
    ? `Population source: ${facts.populationSource}, ${facts.populationYear} (latest available).`
    : `Population source: ${facts.populationSource}; no value is available for this country.`;
  dom.factCard.dataset.countryId = facts.id || "";
  dom.factCard.hidden = false;
  dom.factCard.setAttribute("aria-hidden", "false");
}

function selectExploreCountry(country) {
  if (!country?.id) return false;
  state.exploreCountry = country;
  const adapters = new Set([localGlobeAdapter, googleGlobeAdapter].filter(Boolean));
  adapters.forEach((adapter) => applyExploreCountryToAdapter(adapter, { focus: adapter === mapAdapter }));
  renderCountryFacts(country);
  announce(`${country.name} highlighted. Country facts are displayed.`);
  return true;
}

function rootRendererInteractive() {
  return dom.shell.dataset.surface === "root" && (state.localReady || rendererRecovery?.is3dActive());
}

const handleGlobeCountryClick = createCountryClickHandler({
  getMode: () => state.mode,
  isActive: rootRendererInteractive,
  prepareChecker: loadLegacyEngine,
  submitCountry: (_checker, name) => proxyGuessToLegacy(name),
  setSelection: (id) => mapAdapter?.setCountryState(id, "selected"),
  clearSelection: (id) => mapAdapter?.clearCountryState(id),
  setInput: (name) => { dom.countryInput.value = name; },
  clearInput: (name) => {
    if (dom.countryInput.value === name) dom.countryInput.value = "";
  },
  notify: ({ type, name, error }) => {
    if (type === "checking") announce(`${name} selected. Checking.`);
    if (type === "busy") announce("A country is already being checked.");
    if (type === "cancelled") announce("That selection was cancelled because the Explore mode changed.");
    if (type === "error") showToast(error?.message || "That country could not be checked. Type its name instead.");
  },
  notifyNonAnswering: ({ mode }) => {
    if (mode === "Capitals") showToast("Globe clicks select countries. Type a capital name in Capitals.");
  },
});

function setRendererCopy({ live = false, warning = false } = {}) {
  const presentation = getRendererPresentation(rendererRecovery?.getState(), { live, warning });
  dom.rendererChip.classList.toggle("is-live", presentation.live);
  dom.rendererChip.classList.toggle("is-local", presentation.local);
  dom.rendererChip.classList.toggle("is-warning", presentation.warning);
  dom.rendererChipLabel.textContent = presentation.label;
  return presentation;
}

function setExploreMode(mode) {
  if (state.voiceListening) speechRecognition?.stop?.();
  state.mode = mode === "Capitals" ? "Capitals" : "Countries";
  $$(".explore-option").forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const capitalMode = state.mode === "Capitals";
  const answerKind = capitalMode ? "capital" : "country";
  dom.hudTitle.textContent = capitalMode ? "Explore capitals" : "Explore countries";
  dom.hudSubtitle.textContent = capitalMode
    ? "Type a capital to reveal its country."
    : "Drag the globe, select a country, or type its name.";
  dom.answerLabel.textContent = `Type a ${answerKind} name`;
  dom.countryInput.placeholder = `Type a ${answerKind} name…`;
  dom.countryInput.setAttribute("aria-label", `Type a ${answerKind} name`);
  dom.voiceButton.setAttribute("aria-label", `Speak a ${answerKind} name`);
  dom.voiceButton.title = state.voiceSupported
    ? `Speak a ${answerKind} name`
    : "Voice input is not supported in this browser. You can still type an answer.";
  dom.answerButton.innerHTML = `Mark ${capitalMode ? "Capital" : "Country"} <span aria-hidden="true">→</span>`;
  dom.countryInput.value = "";
}

function answerControlsCanRun() {
  const rootRoute = !state.currentRoute || state.currentRoute.kind === "free-map";
  return dom.shell.dataset.surface === "root" && rootRoute && rootRendererInteractive() && !state.answerPending;
}

function syncAnswerControls() {
  const enabled = answerControlsCanRun();
  dom.countryInput.disabled = !enabled;
  dom.answerButton.disabled = !enabled;
  dom.voiceButton.disabled = !enabled || !state.voiceSupported;
}

function setSurface(surface) {
  const retained = surface === "retained";
  dom.shell.dataset.surface = surface;
  dom.legacyFrame.setAttribute("aria-hidden", String(!retained));
  dom.legacyFrame.tabIndex = retained ? 0 : -1;
  dom.answerForm.inert = retained;
  dom.answerForm.setAttribute("aria-hidden", String(retained));
  dom.factCard.inert = retained;
  dom.factCard.setAttribute("aria-hidden", String(retained || dom.factCard.hidden));

  if (retained) {
    if (state.voiceListening) speechRecognition?.abort?.();
    dom.countryInput.disabled = true;
    dom.answerButton.disabled = true;
    dom.voiceButton.disabled = true;
    localGlobeAdapter?.setInteractionEnabled(false);
    googleGlobeAdapter?.setInteractionEnabled(false);
    dom.localGlobe.hidden = true;
    dom.localGlobe.setAttribute("aria-hidden", "true");
    dom.liveGlobe.hidden = true;
    dom.liveGlobe.setAttribute("aria-hidden", "true");
    dom.attributionSafeZone.hidden = true;
    return;
  }

  const googleActive = rendererRecovery?.is3dActive() ?? false;
  dom.localGlobe.hidden = googleActive;
  dom.localGlobe.setAttribute("aria-hidden", String(googleActive));
  dom.liveGlobe.hidden = !googleActive;
  dom.liveGlobe.setAttribute("aria-hidden", String(!googleActive));
  dom.attributionSafeZone.hidden = !googleActive;
  localGlobeAdapter?.setInteractionEnabled(!googleActive);
  googleGlobeAdapter?.setInteractionEnabled(googleActive);
  const enabled = state.localReady || googleActive;
  if (!enabled) {
    dom.countryInput.disabled = true;
    dom.answerButton.disabled = true;
    dom.voiceButton.disabled = true;
  } else {
    syncAnswerControls();
  }
}

function setupVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.voiceSupported = Boolean(SpeechRecognition);
  if (!SpeechRecognition) {
    dom.voiceButton.title = "Voice input is not supported in this browser. You can still type an answer.";
    dom.voiceButton.setAttribute("aria-label", "Voice input unavailable; type an answer instead");
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.lang = "en-US";
  speechRecognition.interimResults = true;
  speechRecognition.maxAlternatives = 5;
  speechRecognition.addEventListener("start", () => {
    state.voiceListening = true;
    dom.voiceButton.classList.add("is-listening");
    dom.voiceButton.setAttribute("aria-pressed", "true");
    dom.voiceButton.title = "Stop listening";
    announce(`Microphone on. Say one ${state.mode === "Capitals" ? "capital" : "country"} name.`);
  });
  speechRecognition.addEventListener("end", () => {
    state.voiceListening = false;
    dom.voiceButton.classList.remove("is-listening");
    dom.voiceButton.setAttribute("aria-pressed", "false");
    dom.voiceButton.title = `Speak a ${state.mode === "Capitals" ? "capital" : "country"} name`;
    syncAnswerControls();
  });
  speechRecognition.addEventListener("error", (event) => {
    const message = event.error === "not-allowed" || event.error === "service-not-allowed"
      ? "Microphone permission was blocked. Type your answer or allow microphone access and try again."
      : `Voice input did not work. Type the ${state.mode === "Capitals" ? "capital" : "country"} or try again.`;
    showToast(message);
  });
  speechRecognition.addEventListener("result", (event) => {
    const result = event.results[event.results.length - 1];
    const transcript = [...result].map((item) => item.transcript.trim()).find(Boolean) || "";
    dom.countryInput.value = transcript;
    if (!result.isFinal || !transcript || !answerControlsCanRun()) {
      if (!result.isFinal && transcript) announce(`Hearing: ${transcript}.`);
      return;
    }
    dom.answerForm.requestSubmit();
  });

  dom.voiceButton.addEventListener("click", () => {
    if (state.voiceListening) {
      speechRecognition.stop();
      return;
    }
    try {
      speechRecognition.start();
    } catch {
      showToast("Voice input is already starting. Try again in a moment.");
    }
  });
}

function activateLocalGlobe(reason = "local") {
  mapAdapter = localGlobeAdapter;
  if (state.currentRoute?.kind !== "solo" && state.currentRoute?.kind !== "multiplayer") {
    setSurface("root");
  } else {
    localGlobeAdapter?.setInteractionEnabled(false);
  }
  setRendererCopy({ warning: !state.localGeometryReady });
  applyExploreCountryToAdapter(localGlobeAdapter, { focus: true });
  if (reason === "geometry-failure") {
    announce("Google 3D is unavailable. The local globe is active; typed Explore remains available.");
  } else if (reason === "renderer-failure" || reason === "timeout") {
    announce("Google 3D is unavailable. The local globe is active.");
  }
}

function focusHome() {
  const target = state.lastLauncher?.isConnected ? state.lastLauncher : dom.launcherTitle;
  if (!target?.hasAttribute?.("tabindex")) target?.setAttribute?.("tabindex", "-1");
  target?.focus?.({ preventScroll: true });
}

function focusRetained(host) {
  window.requestAnimationFrame(() => host?.focusPrimary?.());
}

function routeUrl(route, absolute = false) {
  return buildGameUrl(route, {
    pathname: window.location.pathname,
    origin: absolute ? window.location.origin : "",
  });
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
    announce(parsed.route ? "The game link was normalized." : "That game link was unavailable. Returned to Home.");
  }
  return parsed.route;
}

function onRetainedNavigation(payload = {}) {
  if (payload.type === "invite-url") {
    return routeUrl({ ...GAME_ROUTES.multiplayer, room: payload.room }, true);
  }
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
  if (!host) throw new Error("The game controller is unavailable.");
  host.setHostNavigationHandler(onRetainedNavigation);
  return { frameDocument, host };
}

function homeLifecycleState() {
  return rendererRecovery?.is3dActive()
    ? GAME_LIFECYCLE_STATES.HOME_3D
    : GAME_LIFECYCLE_STATES.HOME_LOCAL_GLOBE;
}

async function applyRoute(route, { reason = "route" } = {}) {
  const previous = state.activeRoute;
  state.currentRoute = route;
  state.activeRoute = route;
  const rootRoute = !route || route.kind === "free-map";
  const token = gameLifecycle.begin(rootRoute ? homeLifecycleState() : GAME_LIFECYCLE_STATES.RETAINED_LOADING);

  try {
    if (rootRoute) {
      const retained = state.legacyReady ? { frameDocument: legacyDocument(), host: retainedHost() } : null;
      if (previous?.kind === "multiplayer") retained?.host?.suspendMultiplayer?.();
      if (previous?.kind === "solo" || previous?.kind === "multiplayer") {
        retained?.host?.deactivate?.({ reason: "mode_change" });
      }
      setSurface("root");
      const checker = route?.checker === "capitals" ? "capitals" : "countries";
      setExploreMode(checker === "capitals" ? "Capitals" : "Countries");
      const frameDocument = await prepareRetainedBridge(checker);
      if (!gameLifecycle.isCurrent(token)) return;
      installLegacyFrameStyles(frameDocument);
      gameLifecycle.commit(token, homeLifecycleState());
      if (reason !== "initial") focusHome();
      return;
    }

    const ready = await getRetainedHost(token);
    if (!ready || !gameLifecycle.isCurrent(token)) return;
    syncIframeViewport(ready.frameDocument);
    restoreLegacyFrameStyles(ready.frameDocument);
    if (previous?.kind === "multiplayer" && route.kind !== "multiplayer") ready.host.suspendMultiplayer?.();

    if (route.kind === "solo") {
      const lifecycle = ready.host.getLifecycleState?.();
      const sameActiveRound = sameGameRoute(route, previous)
        && lifecycle?.state === "playing"
        && lifecycle.family === route.family
        && lifecycle.variant === route.variant;
      if (!sameActiveRound) ready.host.openGame({ family: route.family, variant: route.variant, label: route.label });
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
    showToast("That game could not be opened. Returned to Home.");
    writeRoute(null, "replace");
    state.currentRoute = null;
    state.activeRoute = null;
    setSurface("root");
    setExploreMode("Countries");
  }
}

function navigateToRoute(route, { reason = "launch", history = "push" } = {}) {
  if (history !== "none") writeRoute(route, history);
  void applyRoute(route, { reason });
}

function activeSoloSessionNeedsConfirmation(nextRoute) {
  return shouldConfirmSessionExit({
    activeRoute: state.activeRoute,
    nextRoute,
    retainedState: retainedHost()?.getLifecycleState?.(),
  });
}

function requestHistorySessionExit(route) {
  state.pendingHistoryRoute = route;
  writeRoute(state.activeRoute, "push");
  state.currentRoute = state.activeRoute;
  if (!dom.sessionExitDialog.open) dom.sessionExitDialog.showModal();
  dom.sessionExitDialog.querySelector(".stay-button")?.focus({ preventScroll: true });
  announce("Game in progress. Choose whether to stay in the game or leave it.");
}

async function initializeRenderers() {
  localGlobeAdapter = createMapAdapter({
    renderer: "local-globe",
    onCountryClick: (payload) => {
      if (!dom.localGlobe.hidden) void handleGlobeCountryClick(payload);
    },
  });
  await localGlobeAdapter.initialize({ container: dom.localGlobe });
  state.localReady = true;
  mapAdapter = localGlobeAdapter;
  if (state.currentRoute?.kind !== "solo" && state.currentRoute?.kind !== "multiplayer") setSurface("root");
  setRendererCopy();

  const geometryPromise = loadCountryGeometry();
  const localGeometryPromise = geometryPromise
    .then((data) => localGlobeAdapter.setCountryGeometry(data))
    .then((result) => {
      state.localGeometryReady = Boolean(result?.count);
      if (state.localGeometryReady) {
        applyExploreCountryToAdapter(localGlobeAdapter, { focus: mapAdapter === localGlobeAdapter });
      }
      if (!rendererRecovery?.is3dActive()) setRendererCopy({ warning: !state.localGeometryReady });
      return result;
    })
    .catch((error) => {
      state.localGeometryReady = false;
      console.warn("Country Memory Map local globe geometry:", error.message);
      showToast("Country outlines could not load. Typed Explore still works.");
      return { count: 0, ready: false };
    });

  if (config.renderer !== "google3d") {
    rendererRecovery.activateFallback("configured-local");
    await localGeometryPromise;
    activateLocalGlobe("configured-local");
    return localGlobeAdapter;
  }

  googleGlobeAdapter = createMapAdapter({
    renderer: "google3d",
    googleMapsApiKey: config.googleMapsApiKey,
    onCountryClick: (payload) => {
      if (rendererRecovery?.is3dActive()) void handleGlobeCountryClick(payload);
    },
  });

  try {
    await googleGlobeAdapter.initialize({ container: dom.liveGlobe });
    const data = await geometryPromise;
    const result = await googleGlobeAdapter.setCountryGeometry(data);
    if (!result?.count) throw new Error("Google 3D country boundaries are unavailable.");
    applyExploreCountryToAdapter(googleGlobeAdapter);
    if (!rendererRecovery.activate3d()) {
      googleGlobeAdapter.destroy();
      await localGeometryPromise;
      activateLocalGlobe("timeout");
      return localGlobeAdapter;
    }
    mapAdapter = googleGlobeAdapter;
    applyExploreCountryToAdapter(googleGlobeAdapter, { focus: true });
    localGlobeAdapter.setInteractionEnabled(false);
    if (state.currentRoute?.kind !== "solo" && state.currentRoute?.kind !== "multiplayer") setSurface("root");
    setRendererCopy({ live: true });
    announce("Google 3D Earth is ready.");
    return googleGlobeAdapter;
  } catch (error) {
    const reason = /boundaries/.test(error.message) ? "geometry-failure" : "renderer-failure";
    rendererRecovery.activateFallback(reason);
    await localGeometryPromise;
    googleGlobeAdapter?.destroy();
    activateLocalGlobe(reason);
    console.warn("Country Memory Map Google renderer:", error.message);
    return localGlobeAdapter;
  }
}

function wireInteractions() {
  $$("[data-game]").forEach((button) => {
    button.addEventListener("click", () => {
      const route = GAME_ROUTES[button.dataset.game];
      if (!route) return;
      state.lastLauncher = button;
      navigateToRoute(route, { reason: "launcher" });
    });
  });

  dom.homeButton.addEventListener("click", () => navigateToRoute(null, { reason: "home" }));

  dom.factClose.addEventListener("click", () => {
    dom.factCard.hidden = true;
    dom.factCard.setAttribute("aria-hidden", "true");
    announce("Country facts closed. The selected country remains highlighted.");
  });

  dom.answerForm.addEventListener("submit", createTypedAnswerHandler({
    getValue: () => dom.countryInput.value,
    isActive: () => rootRendererInteractive() && (!state.currentRoute || state.currentRoute.kind === "free-map"),
    setDisabled: (disabled) => {
      state.answerPending = disabled;
      syncAnswerControls();
    },
    clearValue: () => { dom.countryInput.value = ""; },
    focus: () => dom.countryInput.focus(),
    submit: proxyGuessToLegacy,
    notifyEmpty: () => showToast(`Type a ${state.mode === "Capitals" ? "capital" : "country"} name to continue.`),
    notifyError: (error) => showToast(error.message),
  }));

  dom.sessionExitDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dom.sessionExitDialog.close("stay");
  });
  dom.sessionExitDialog.addEventListener("close", () => {
    const route = state.pendingHistoryRoute;
    state.pendingHistoryRoute = null;
    if (dom.sessionExitDialog.returnValue === "leave") {
      writeRoute(route, "replace");
      void applyRoute(route, { reason: "history-confirmed" });
      return;
    }
    announce("Stayed in the current game.");
    focusRetained(retainedHost());
  });
}

async function bootstrap() {
  wireInteractions();
  setupVoiceInput();
  setExploreMode("Countries");
  state.currentRoute = normalizeLocationRoute();
  window.addEventListener("popstate", () => {
    const route = normalizeLocationRoute();
    if (activeSoloSessionNeedsConfirmation(route)) {
      requestHistorySessionExit(route);
      return;
    }
    void applyRoute(route, { reason: "history" });
  });
  window.addEventListener("beforeunload", (event) => {
    if (!activeSoloSessionNeedsConfirmation(null)) return;
    event.preventDefault();
    event.returnValue = "";
  });

  rendererRecovery = createRendererRecovery({
    onTransition: ({ state: rendererState, reason }) => {
      if (rendererState === RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE) activateLocalGlobe(reason);
    },
  });
  if (config.renderer === "google3d") rendererRecovery.start();
  void applyRoute(state.currentRoute, { reason: "initial" });
  mapAdapter = await initializeRenderers();

  const scheduleIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 700));
  scheduleIdle(() => loadLegacyEngine().catch((error) => console.warn("Country checker:", error.message)));
  window.__COUNTRY_MEMORY_MAP_DEBUG__ = {
    config,
    gameLifecycle,
    get mapAdapter() { return mapAdapter; },
    get localGlobeAdapter() { return localGlobeAdapter; },
    state,
  };
}

bootstrap().catch((error) => {
  console.warn("Country Memory Map initialization:", error.message);
  setRendererCopy({ warning: true });
  showToast("The globe could not start. Reload the page to try again.");
});
