export const GAME_LIFECYCLE_STATES = Object.freeze({
  HOME_3D: "HOME_3D",
  HOME_2D: "HOME_2D",
  RETAINED_LOADING: "RETAINED_LOADING",
  SOLO_SETUP: "SOLO_SETUP",
  SOLO_PLAYING: "SOLO_PLAYING",
  SOLO_RESULTS: "SOLO_RESULTS",
  MULTIPLAYER: "MULTIPLAYER",
  FATAL_ROUTE_ERROR: "FATAL_ROUTE_ERROR",
});

export function createGameLifecycle({ onChange = () => {} } = {}) {
  let version = 0;
  let state = GAME_LIFECYCLE_STATES.HOME_3D;
  return {
    begin(nextState = GAME_LIFECYCLE_STATES.RETAINED_LOADING) {
      version += 1;
      state = nextState;
      onChange({ state, version });
      return version;
    },
    commit(token, nextState) {
      if (token !== version) return false;
      state = nextState;
      onChange({ state, version });
      return true;
    },
    invalidate() { return this.begin(state); },
    getState() { return state; },
    getVersion() { return version; },
    isCurrent(token) { return token === version; },
  };
}
