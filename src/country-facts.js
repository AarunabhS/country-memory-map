import { COUNTRY_POPULATIONS, COUNTRY_POPULATION_SOURCE } from "./country-populations.js";

const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function compactPopulation(value) {
  if (!Number.isFinite(value)) return "Not available";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 1 : 2).replace(/\.0+$/, "")} billion`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 100_000_000 ? 0 : 1).replace(/\.0$/, "")} million`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1).replace(/\.0$/, "")} thousand`;
  return wholeNumber.format(value);
}

function flagEmoji(iso2) {
  if (!/^[A-Z]{2}$/.test(iso2 || "")) return "🌍";
  return [...iso2].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
}

export function buildCountryFacts(country = {}) {
  const population = COUNTRY_POPULATIONS[country.iso3] || null;
  const capitals = Array.isArray(country.capitals)
    ? country.capitals.map((capital) => capital?.name || capital).filter(Boolean)
    : [];
  const region = country.subregion || country.continent || "Not available";
  return Object.freeze({
    id: country.id || null,
    name: country.name || "Selected country",
    flag: flagEmoji(country.iso2),
    populationLabel: compactPopulation(population?.value),
    populationExact: Number.isFinite(population?.value) ? wholeNumber.format(population.value) : null,
    populationYear: Number.isFinite(population?.year) ? population.year : null,
    populationSource: COUNTRY_POPULATION_SOURCE.label,
    capitalLabel: capitals.length ? capitals.join(" · ") : "Not available",
    regionLabel: region,
    continentLabel: country.continent || "Not available",
    codeLabel: country.iso3 || country.iso2 || "—",
  });
}
