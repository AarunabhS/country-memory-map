import { config, hasGoogleMapsKey } from "./config.js";
import { loadCountryGeometry } from "./country-geometry.js";
import { createMapAdapter } from "./map-adapter.js";
import {
  createCountryClickHandler,
  createTypedAnswerHandler,
  prepareRetainedFreeMap,
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
};

let mapAdapter;

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

function setLegacyFallbackVisible(visible) {
  dom.globeMount.classList.toggle("legacy-visible", visible);
  dom.legacyFrame.setAttribute("aria-hidden", String(!visible));
  dom.legacyFrame.tabIndex = visible ? 0 : -1;
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
      // The iframe load event can precede the retained controller's final
      // listener wiring. Enter Free Map on the next task after scripts settle.
      window.setTimeout(async () => {
        try {
          const frameDocument = legacyDocument();
          // Choose the retained checker before leaving its game menu. The
          // controller's Free Map action must be the final transition so both
          // submit listeners agree that this is a non-round checker.
          syncLegacyMode(state.mode);
          await prepareRetainedFreeMap(frameDocument);
          state.legacyReady = true;
          installLegacyFrameStyles(frameDocument);
          if (document.activeElement === dom.legacyFrame) dom.legacyFrame.blur();
          syncLegacyStats();
          window.setTimeout(syncLegacyStats, 250);
          resolve(frameDocument);
        } catch (error) {
          reject(error);
        }
      }, 0);
    };
    const onError = () => reject(new Error("The standard game fallback could not be loaded."));
    dom.legacyFrame.addEventListener("load", onLoad, { once: true });
    dom.legacyFrame.addEventListener("error", onError, { once: true });
    dom.legacyFrame.src = dom.legacyFrame.dataset.src;
  });
  return state.legacyLoadPromise;
}

async function proxyGuessToLegacy(value) {
  const frameDocument = await loadLegacyEngine();
  submitRetainedFreeMapGuess(frameDocument, value);
  await new Promise(resolve => window.setTimeout(resolve, 120));
  syncLegacyStats();
  const message = legacyDocument()?.querySelector("#message")?.textContent?.trim();
  if (message) showToast(message);
}

function syncLegacyMode(mode) {
  const frameDocument = legacyDocument();
  if (!frameDocument) return;
  const target = mode === "Capitals" ? "#capitalModeButton" : "#countryModeButton";
  frameDocument.querySelector(target)?.click();
}

const handleGlobeCountryClick = createCountryClickHandler({
  getMode: () => state.mode,
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
      setRendererCopy({ live: true });
      announce("Live 3D Earth is ready.");
    }
  } catch (error) {
    console.warn("Country Memory Map 3D boundary overlay:", error.message);
    setRendererCopy({ live: true, warning: true });
    showToast("Live Earth is ready, but country boundaries could not be loaded.");
  }
}

function setRendererCopy({ live = false, warning = false } = {}) {
  dom.rendererChip.classList.toggle("is-live", live);
  dom.rendererChip.classList.toggle("is-warning", warning);
  dom.rendererChipLabel.textContent = live ? "Live 3D Earth" : warning ? "3D unavailable" : "Legacy preview";
}

function setMode(mode, note) {
  state.mode = mode;
  dom.countryInput.value = "";
  $$(".mode-row").forEach((row) => row.classList.toggle("is-active", row.dataset.mode === mode));
  dom.hudTitle.textContent = mode === "Explore" ? "Planet Earth" : mode;
  dom.hudSubtitle.textContent = mode === "Explore" ? "Drag to rotate · Scroll to zoom · Click a country" : `${note} · game engine connection pending`;
  const answerKind = mode === "Capitals" ? "capital" : "country";
  dom.answerLabel.textContent = `Type a ${answerKind} name`;
  dom.countryInput.placeholder = `Type a ${answerKind} name…`;
  dom.countryInput.setAttribute("aria-label", `Type a ${answerKind} name`);
  dom.answerButton.innerHTML = `Mark ${answerKind === "capital" ? "Capital" : "Country"} <span aria-hidden="true">→</span>`;
  syncLegacyMode(mode);
  if (mode !== "Explore") showToast(`${mode} is staged in the cinematic shell; it will connect to the game engine next.`);
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
    onCountryClick: handleGlobeCountryClick,
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
      dom.globeLoading.hidden = true;
      dom.liveGlobe.style.visibility = "visible";
      dom.liveGlobe.style.pointerEvents = "auto";
      dom.liveGlobe.removeAttribute("aria-hidden");
      dom.earthWrap.hidden = true;
      dom.attributionSafeZone.hidden = false;
      setLegacyFallbackVisible(false);
      dom.globeMount.classList.add("is-live");
      setRendererCopy({ live: true });
      announce("Live 3D Earth is ready.");
      void hydrateGoogleCountryGeometry(adapter);
      return adapter;
    } catch (error) {
      dom.globeLoading.hidden = true;
      dom.liveGlobe.hidden = true;
      dom.liveGlobe.style.visibility = "";
      dom.liveGlobe.style.pointerEvents = "";
      dom.liveGlobe.setAttribute("aria-hidden", "true");
      dom.earthWrap.hidden = false;
      dom.attributionSafeZone.hidden = true;
      dom.globeMount.classList.remove("is-live");
      setLegacyFallbackVisible(false);
      setRendererCopy({ warning: true });
      showToast(hasGoogleMapsKey ? "Using the cinematic Earth while live 3D is unavailable." : "Add the restricted Maps key in .env.local, then switch the renderer flag to google3d.");
      console.warn("Country Memory Map 3D renderer fallback:", error.message);
      loadLegacyEngine().then(() => {
        setLegacyFallbackVisible(false);
        setRendererCopy({ warning: true });
      }).catch(() => {});
      return createMapAdapter({ renderer: "legacy", onStatus: () => {} });
    }
  }

  await adapter.initialize({ container: dom.liveGlobe });
  dom.globeLoading.hidden = true;
  dom.attributionSafeZone.hidden = true;
  setLegacyFallbackVisible(false);
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
    row.addEventListener("click", () => setMode(row.dataset.mode, row.dataset.note));
  });

  dom.answerForm.addEventListener("submit", createTypedAnswerHandler({
    getValue: () => dom.countryInput.value,
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
      if (button.dataset.nav !== "home") showToast(`${button.textContent.trim()} is visible as a shell state while the source game is restored.`);
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
  $$("[data-mobile-tab]").forEach((button) => button.addEventListener("click", () => setSheet(button.dataset.mobileTab, true)));

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
  mapAdapter = await initializeRenderer();
  const scheduleIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 900));
  scheduleIdle(() => loadLegacyEngine().catch((error) => console.warn("Legacy game bridge:", error.message)));
  window.__COUNTRY_MEMORY_MAP_DEBUG__ = { config, mapAdapter, state };
}

bootstrap().catch((error) => {
  console.warn("Country Memory Map shell initialization:", error.message);
  setRendererCopy({ warning: true });
});
