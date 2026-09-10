export const RENDERER_RECOVERY_STATES = Object.freeze({
  STARTING: "3D_STARTING",
  THREE_D_ACTIVE: "3D_ACTIVE",
  LOCAL_GLOBE_ACTIVE: "LOCAL_GLOBE_ACTIVE",
});

export function getRendererPresentation(state, { live = false, warning = false } = {}) {
  const fallbackActive = state === RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE;
  const live3d = live && !fallbackActive;
  const local = !live3d;
  return {
    live: live3d,
    local,
    warning,
    label: live3d ? "Google 3D Earth" : fallbackActive ? "Local 3D globe" : "Local globe · connecting",
  };
}

// This small coordinator intentionally owns just one initialization attempt.
// It keeps late renderer callbacks from replacing an active local-globe session.
export function createRendererRecovery({
  timeoutMs = 45000,
  setTimeoutFn = (callback, milliseconds) => window.setTimeout(callback, milliseconds),
  clearTimeoutFn = (timer) => window.clearTimeout(timer),
  onTransition = () => {},
} = {}) {
  let state = RENDERER_RECOVERY_STATES.STARTING;
  let timeout = null;

  const transition = (nextState, reason) => {
    if (state !== RENDERER_RECOVERY_STATES.STARTING) return false;
    state = nextState;
    if (timeout !== null) {
      clearTimeoutFn(timeout);
      timeout = null;
    }
    onTransition({ state, reason });
    return true;
  };

  return {
    start() {
      if (timeout !== null || state !== RENDERER_RECOVERY_STATES.STARTING) return;
      timeout = setTimeoutFn(() => transition(RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE, "timeout"), timeoutMs);
    },
    activate3d() {
      return transition(RENDERER_RECOVERY_STATES.THREE_D_ACTIVE, "usable-ready");
    },
    activateFallback(reason = "renderer-failure") {
      return transition(RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE, reason);
    },
    getState() {
      return state;
    },
    is3dActive() {
      return state === RENDERER_RECOVERY_STATES.THREE_D_ACTIVE;
    },
    isFallbackActive() {
      return state === RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE;
    },
    isInteractive() {
      return state === RENDERER_RECOVERY_STATES.THREE_D_ACTIVE || state === RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE;
    },
  };
}
