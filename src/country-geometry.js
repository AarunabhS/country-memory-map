const GEOMETRY_SCRIPT_ID = "country-memory-map-authoritative-geometry";

let geometryPromise;

const countryOnlyAdminNames = new Set([
  "Australia",
  "China",
  "Cuba",
  "Denmark",
  "Finland",
  "France",
  "Israel",
  "Kazakhstan",
  "Netherlands",
  "New Zealand",
  "Palestine",
  "United Kingdom",
  "United States of America",
]);

const nonCountryAdminNames = new Set(["Northern Cyprus", "Somaliland", "Taiwan"]);

function adminName(feature) {
  return feature?.properties?.ADMIN || feature?.properties?.NAME || "";
}

function displayName(feature) {
  const name = adminName(feature);
  return name === "Vatican" ? "Vatican City" : name || "Unnamed";
}

export function isCountryFeature(feature) {
  if (!feature?.geometry || !feature?.properties) return false;
  const name = adminName(feature);
  if (displayName(feature) === "Antarctica" || nonCountryAdminNames.has(name)) return false;
  return feature.properties.TYPE === "Sovereign country" || countryOnlyAdminNames.has(name);
}

export function getRenderableCountryFeatures(data = globalThis.COUNTRIES_GEOJSON) {
  if (!Array.isArray(data?.features)) return [];
  return data.features
    .map((feature, index) => {
      if (!isCountryFeature(feature)) return null;
      const properties = feature.properties || {};
      const id = `${properties.ADM0_A3 || properties.ISO_A3 || "region"}-${properties.NE_ID || index}`;
      return {
        id,
        name: displayName(feature),
        geometry: feature.geometry,
        feature,
      };
    })
    .filter(Boolean);
}

function samePoint(a, b) {
  return a?.lat === b?.lat && a?.lng === b?.lng;
}

function cleanRing(ring) {
  if (!Array.isArray(ring)) return [];
  const points = ring
    .filter((point) => Array.isArray(point) && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1])))
    .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }));
  if (points.length < 3) return [];
  const open = samePoint(points[0], points.at(-1)) ? points.slice(0, -1) : points;
  if (open.length < 3) return [];
  return [...open, { ...open[0] }];
}

function sampleRing(ring, maxPoints) {
  const cleaned = cleanRing(ring);
  if (cleaned.length < 4) return [];
  const open = cleaned.slice(0, -1);
  const stride = Math.max(1, Math.ceil(open.length / maxPoints));
  const sampled = open.filter((_, index) => index === 0 || index === open.length - 1 || index % stride === 0);
  if (sampled.length < 3) return [];
  return [...sampled, { ...sampled[0] }];
}

function ringArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    area += ring[index].lng * ring[index + 1].lat - ring[index + 1].lng * ring[index].lat;
  }
  return Math.abs(area / 2);
}

export function geometryTo3dPieces(geometry, { maxPoints = 180, maxPieces = 8 } = {}) {
  if (!geometry) return [];
  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon"
      ? geometry.coordinates
      : [];

  return polygons
    .map((polygon) => {
      const [outer, ...holes] = polygon || [];
      return {
        outer: sampleRing(outer, maxPoints),
        holes: holes.map((ring) => sampleRing(ring, Math.max(48, Math.floor(maxPoints / 2)))).filter(Boolean),
      };
    })
    .filter((piece) => piece.outer.length >= 4)
    .sort((a, b) => ringArea(b.outer) - ringArea(a.outer))
    .slice(0, maxPieces);
}

export function loadCountryGeometry() {
  if (Array.isArray(globalThis.COUNTRIES_GEOJSON?.features)) {
    return Promise.resolve(globalThis.COUNTRIES_GEOJSON);
  }
  if (geometryPromise) return geometryPromise;

  geometryPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GEOMETRY_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(globalThis.COUNTRIES_GEOJSON), { once: true });
      existing.addEventListener("error", () => reject(new Error("The authoritative country geometry could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GEOMETRY_SCRIPT_ID;
    script.async = true;
    script.src = new URL("../countries-data.js?v=20260910-mobile-perf2", import.meta.url).href;
    script.addEventListener("load", () => {
      if (Array.isArray(globalThis.COUNTRIES_GEOJSON?.features)) resolve(globalThis.COUNTRIES_GEOJSON);
      else reject(new Error("The country geometry bundle loaded without a FeatureCollection."));
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("The authoritative country geometry could not be loaded.")), { once: true });
    document.head.appendChild(script);
  });

  return geometryPromise;
}
