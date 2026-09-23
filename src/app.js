import { GAME_ROUTES, parseGameRoute, buildGameUrl } from './game-routes.js';
import { LocalGlobeAdapter } from './map-adapter.js';

const app = document.querySelector('.app');
const home = document.getElementById('welcome');
const exit = document.getElementById('exitRoom');
const controller = window.CountryMemoryApp;
let route = null;
let globe;
let navigation = 0;
let selectionVersion = 0;
const factsPanel = document.createElement('aside');
factsPanel.id = 'countryFacts';
factsPanel.hidden = true;
factsPanel.setAttribute('aria-label', 'Selected country facts');
document.querySelector('.map-shell').append(factsPanel);
function clearFacts() { selectionVersion++; factsPanel.hidden = true; factsPanel.replaceChildren(); }
document.addEventListener('country-memory-selection', async ({ detail }) => {
  clearFacts();
  if (!detail || route?.kind !== 'free-map') return;
  const version = selectionVersion;
  try {
    const { buildCountryFacts } = await import('./country-facts.js');
    if (version !== selectionVersion || route?.kind !== 'free-map') return;
    const facts = buildCountryFacts(detail);
    const heading = document.createElement('h2');
    heading.textContent = `${facts.flag} ${facts.name}`;
    const close = document.createElement('button');
    close.type = 'button'; close.textContent = 'Close';
    close.setAttribute('aria-label', 'Close country facts');
    close.onclick = () => { clearFacts(); controller.focusPrimary(); };
    const capital = document.createElement('p'); capital.textContent = `Capital: ${facts.capitalLabel}`;
    const region = document.createElement('p'); region.textContent = facts.regionLabel;
    const population = document.createElement('p');
    population.textContent = `Population: ${facts.populationLabel}${facts.populationYear ? ` (${facts.populationYear}, ${facts.populationSource})` : ''}`;
    factsPanel.replaceChildren(close, heading, capital, region, population);
    factsPanel.hidden = false;
  } catch (error) {
    // Facts are optional; failed loading must never interfere with a valid answer.
    console.warn('Country facts unavailable:', error.message);
  }
});

function url(next, absolute = false) {
  return buildGameUrl(next, { pathname: location.pathname, origin: absolute ? location.origin : '' });
}
function write(next, replace = false) {
  history[replace ? 'replaceState' : 'pushState'](null, '', url(next));
}
async function show(next, { replace = false, historyChange = true } = {}) {
  clearFacts();
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
  if (payload.type === 'solo-selection') {
    const selected = Object.values(GAME_ROUTES).find(item => item.kind === 'solo' && item.family === payload.family && (item.family !== 'flag' || item.variant === payload.variant));
    if (selected && route?.slug !== selected.slug) { route = selected; write(selected); }
    return;
  }
  if (payload.type === 'solo-menu') {
    void show(GAME_ROUTES['world-conquest']);
    controller.showGameCatalog();
    return;
  }
  if (payload.type === 'explore') { void show(GAME_ROUTES.explore); return; }
  if (payload.type === 'invite-url') return url({ ...GAME_ROUTES.multiplayer, room: payload.room }, true);
  if (payload.type === 'multiplayer-room') {
    exit.hidden = false;
    route = { ...GAME_ROUTES.multiplayer, room: payload.room };
    write(route, true);
    return;
  }
  void show(payload.type === 'multiplayer' ? GAME_ROUTES.multiplayer : null);
});
// Home cards use the existing navigation lifecycle, including room suspension.
home.querySelectorAll('[data-game-link]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void show(GAME_ROUTES[link.dataset.gameLink]);
  });
});
document.getElementById('welcomeFriends').onclick = () => show(GAME_ROUTES.multiplayer);
document.getElementById('welcomeSolo').onclick = () => {
  void show(GAME_ROUTES['world-conquest']);
  // All solo games share the same setup screen and controller.
  controller.showGameCatalog();
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
