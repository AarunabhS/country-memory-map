export const GAME_ROUTES = Object.freeze({
  explore: Object.freeze({ slug: "explore", kind: "free-map", checker: "countries", label: "Explore" }),
  countries: Object.freeze({ slug: "countries", kind: "free-map", checker: "countries", label: "Countries" }),
  capitals: Object.freeze({ slug: "capitals", kind: "free-map", checker: "capitals", label: "Capitals" }),
  "world-conquest": Object.freeze({ slug: "world-conquest", kind: "solo", family: "conquest", variant: "relaxed", label: "World Conquest" }),
  "find-country": Object.freeze({ slug: "find-country", kind: "solo", family: "find", variant: "standard", label: "Find the Country" }),
  "capital-clash": Object.freeze({ slug: "capital-clash", kind: "solo", family: "capital", variant: "classic", label: "Capital Clash" }),
  "flag-recall": Object.freeze({ slug: "flag-recall", kind: "solo", family: "flag", variant: "recall", label: "Flag Recall" }),
  "flag-match": Object.freeze({ slug: "flag-match", kind: "solo", family: "flag", variant: "match", label: "Flag Match" }),
  "geo-quiz": Object.freeze({ slug: "geo-quiz", kind: "solo", family: "quiz", variant: "trivia", label: "Geo Quiz" }),
  multiplayer: Object.freeze({ slug: "multiplayer", kind: "multiplayer", label: "Play with Friends" }),
});

const ROOM_PATTERN = /^[A-Z0-9]{6,12}$/;

export function normalizeRoom(value) {
  const room = String(value || "").trim().toUpperCase();
  return ROOM_PATTERN.test(room) ? room : null;
}

export function parseGameRoute(search = "") {
  const params = new URLSearchParams(search);
  const slug = params.get("game");
  const room = normalizeRoom(params.get("room"));
  const hasRoom = params.has("room");
  const hasUnexpectedParam = [...params.keys()].some(key => key !== "game" && key !== "room");
  const hasDuplicateRouteParam = params.getAll("game").length > 1 || params.getAll("room").length > 1;

  if (!slug && room) return { route: { ...GAME_ROUTES.multiplayer, room }, canonical: false, reason: "room-ingress" };
  if (!slug) return { route: null, canonical: !hasRoom && !hasUnexpectedParam, reason: hasRoom ? "invalid-room" : hasUnexpectedParam ? "noncanonical-query" : "home" };
  const definition = GAME_ROUTES[slug];
  if (!definition) return { route: null, canonical: false, reason: "unknown-game" };
  if (definition.kind !== "multiplayer" && hasRoom) return { route: null, canonical: false, reason: "room-without-multiplayer" };
  if (definition.kind === "multiplayer" && hasRoom && !room) return { route: { ...definition }, canonical: false, reason: "invalid-room" };
  return {
    route: { ...definition, ...(room ? { room } : {}) },
    canonical: !hasUnexpectedParam && !hasDuplicateRouteParam,
    reason: hasUnexpectedParam || hasDuplicateRouteParam ? "noncanonical-query" : "game",
  };
}

export function buildGameUrl(route, { pathname = "/", origin = "" } = {}) {
  const params = new URLSearchParams();
  if (route?.slug) params.set("game", route.slug);
  const room = route?.slug === "multiplayer" ? normalizeRoom(route.room) : null;
  if (room) params.set("room", room);
  const path = pathname || "/";
  const query = params.toString();
  return `${origin}${path}${query ? `?${query}` : ""}`;
}

export function sameGameRoute(left, right) {
  return Boolean(left && right && left.slug === right.slug && normalizeRoom(left.room) === normalizeRoom(right.room));
}
