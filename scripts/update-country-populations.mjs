import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { getRenderableCountryFeatures } from "../src/country-geometry.js";

const GEOMETRY_PATH = fileURLToPath(new URL("../countries-data.js", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../src/country-populations.js", import.meta.url));
const API_URL = "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrnev=1&per_page=400";
const retrieved = new Date().toISOString().slice(0, 10);

function readGeometry() {
  const source = fs.readFileSync(GEOMETRY_PATH, "utf8");
  return JSON.parse(source.slice(source.indexOf("=") + 1, source.lastIndexOf(";")));
}

function iso3For(country) {
  const properties = country.feature.properties;
  return properties.ISO_A3_EH !== "-99" ? properties.ISO_A3_EH : properties.ADM0_A3;
}

const response = await fetch(API_URL);
if (!response.ok) throw new Error(`World Bank population request failed with ${response.status}.`);
const payload = await response.json();
const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
const byIso3 = new Map(rows
  .filter((row) => row?.countryiso3code && Number.isFinite(Number(row.value)))
  .map((row) => [row.countryiso3code, row]));

const populations = {};
const missing = [];
for (const country of getRenderableCountryFeatures(readGeometry()).sort((left, right) => left.name.localeCompare(right.name))) {
  const iso3 = iso3For(country);
  const row = byIso3.get(iso3);
  if (!row) {
    missing.push(`${country.name} (${iso3})`);
    continue;
  }
  populations[iso3] = { value: Number(row.value), year: Number(row.date) };
}

const generated = `// Generated from World Bank indicator SP.POP.TOTL on ${retrieved}.\n` +
  `// Source: ${API_URL}\n` +
  `// Regenerate with: node scripts/update-country-populations.mjs\n` +
  `export const COUNTRY_POPULATION_SOURCE = Object.freeze({\n` +
  `  label: "World Bank",\n` +
  `  indicator: "SP.POP.TOTL",\n` +
  `  retrieved: ${JSON.stringify(retrieved)},\n` +
  `});\n\n` +
  `export const COUNTRY_POPULATIONS = Object.freeze(${JSON.stringify(populations, null, 2)});\n`;

fs.writeFileSync(OUTPUT_PATH, generated);
console.log(`Wrote ${Object.keys(populations).length} population records to ${OUTPUT_PATH}.`);
if (missing.length) console.log(`No World Bank value: ${missing.join(", ")}.`);
