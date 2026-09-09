export const RENDERER_RECOVERY_STATES = Object.freeze({
  STARTING: "3D_STARTING",
  THREE_D_ACTIVE: "3D_ACTIVE",
  TWO_D_ACTIVE: "2D_ACTIVE",
});

export function getRendererPresentation(state, { live = false, warning = false } = {}) {
  const fallbackActive = state === RENDERER_RECOVERY_STATES.TWO_D_ACTIVE;
  const live3d = live && !fallbackActive;
  const warning3d = warning || fallbackActive;
  return {
    live: live3d,
    warning: warning3d,
    label: live3d ? "Live 3D Earth" : warning3d ? "3D unavailable" : "Legacy preview",
  };
}

// This small coordinator intentionally owns just one initialization attempt.
// It keeps late renderer callbacks from replacing an active retained-game session.
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
      timeout = setTimeoutFn(() => transition(RENDERER_RECOVERY_STATES.TWO_D_ACTIVE, "timeout"), timeoutMs);
    },
    activate3d() {
      return transition(RENDERER_RECOVERY_STATES.THREE_D_ACTIVE, "usable-ready");
    },
    activate2d(reason = "renderer-failure") {
      return transition(RENDERER_RECOVERY_STATES.TWO_D_ACTIVE, reason);
    },
    getState() {
      return state;
    },
    is3dActive() {
      return state === RENDERER_RECOVERY_STATES.THREE_D_ACTIVE;
    },
  };
}
