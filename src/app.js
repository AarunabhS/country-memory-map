import { GAME_ROUTES, parseGameRoute, buildGameUrl } from './game-routes.js';
import { LocalGlobeAdapter } from './map-adapter.js';

const app = document.querySelector('.app');
const home = document.getElementById('welcome');
const exit = document.getElementById('exitRoom');
const controller = window.CountryMemoryApp;
let route = null;
let globe;
let navigation = 0;

function url(next, absolute = false) {
  return buildGameUrl(next, { pathname: location.pathname, origin: absolute ? location.origin : '' });
}
function write(next, replace = false) {
  history[replace ? 'replaceState' : 'pushState'](null, '', url(next));
}
async function show(next, { replace = false, historyChange = true } = {}) {
  const token = ++navigation;
  window.GameMap.stopVoice();
  if (historyChange) write(next, replace);
  window.CountryMemoryMultiplayer.suspend({ keepRoom: true });
  controller.deactivate();
  route = next;
  const page = next?.kind === 'multiplayer' ? 'friends' : next ? 'game' : 'home';
  app.dataset.page = page;
  home.hidden = page !== 'home';
  globe?.setInteractionEnabled(page === 'home');
  exit.hidden = page !== 'friends' || !window.CountryMemoryMultiplayer.hasSession;
  if (page === 'friends') {
    await controller.openMultiplayer({ room: next.room });
  } else if (next?.kind === 'solo') {
    controller.openGame(next);
  } else if (next?.kind === 'free-map') {
    controller.openFreeMap({ checker: next.checker });
  }
  if (token !== navigation) return;
  if (page === 'home') document.getElementById('welcomeFriends').focus({ preventScroll: true });
  else controller.focusPrimary();
}
controller.setHostNavigationHandler(payload => {
  if (payload.type === 'invite-url') return url({ ...GAME_ROUTES.multiplayer, room: payload.room }, true);
  if (payload.type === 'multiplayer-room') {
    exit.hidden = false;
    route = { ...GAME_ROUTES.multiplayer, room: payload.room };
    write(route, true);
    return;
  }
  void show(payload.type === 'multiplayer' ? GAME_ROUTES.multiplayer : null);
});
document.getElementById('welcomeFriends').onclick = () => show(GAME_ROUTES.multiplayer);
document.getElementById('welcomeSolo').onclick = () => {
  void show(GAME_ROUTES['world-conquest']);
  // All solo games share the same setup screen and controller.
  app.removeAttribute('data-hosted-game');
};
document.getElementById('welcomeExplore').onclick = () => show(GAME_ROUTES.explore);
document.getElementById('appHome').onclick = () => show(null);
document.querySelector('.app-brand').onclick = event => { event.preventDefault(); void show(null); };
exit.onclick = async () => {
  exit.disabled = true;
  try { await window.CountryMemoryMultiplayer.leave(); }
  finally { exit.disabled = false; }
};
window.addEventListener('pagehide', () => window.GameMap.stopVoice());
window.addEventListener('popstate', () => show(parseGameRoute(location.search).route, { historyChange: false }));
const parsed = parseGameRoute(location.search);
await show(parsed.route, { replace: true });
// The globe is a local, optional home illustration. Gameplay never waits for it.
try {
  globe = new LocalGlobeAdapter();
  await globe.initialize({ container: document.getElementById('welcomeGlobe') });
  await globe.setCountryGeometry(window.COUNTRIES_GEOJSON);
  globe.setInteractionEnabled(!route);
} catch (error) {
  document.getElementById('welcomeGlobe').hidden = true;
  console.warn('Home globe unavailable:', error.message);
}
