const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function loadFactsModule() {
  const populationSource = fs.readFileSync('src/country-populations.js', 'utf8');
  const populationUrl = `data:text/javascript;base64,${Buffer.from(populationSource).toString('base64')}`;
  const factsSource = fs.readFileSync('src/country-facts.js', 'utf8')
    .replace('"./country-populations.js"', JSON.stringify(populationUrl));
  return import(`data:text/javascript;base64,${Buffer.from(factsSource).toString('base64')}#${Date.now()}-${Math.random()}`);
}

test('country facts combine the resolved country with the local population snapshot', async () => {
  const { buildCountryFacts } = await loadFactsModule();
  const facts = buildCountryFacts({
    id: 'IND-1159320847',
    name: 'India',
    iso2: 'IN',
    iso3: 'IND',
    continent: 'Asia',
    subregion: 'Southern Asia',
    capitals: [{ name: 'New Delhi', role: 'capital' }],
  });

  assert.equal(facts.name, 'India');
  assert.equal(facts.flag, '🇮🇳');
  assert.match(facts.populationLabel, /billion$/);
  assert.ok(facts.populationYear >= 2024);
  assert.equal(facts.capitalLabel, 'New Delhi');
  assert.equal(facts.regionLabel, 'Southern Asia');
  assert.equal(facts.codeLabel, 'IND');
});

test('country facts stay truthful when the source has no population value', async () => {
  const { buildCountryFacts } = await loadFactsModule();
  const facts = buildCountryFacts({
    id: 'VAT-1',
    name: 'Vatican City',
    iso2: 'VA',
    iso3: 'VAT',
    continent: 'Europe',
    subregion: 'Southern Europe',
    capitals: [{ name: 'Vatican City', role: 'capital' }],
  });

  assert.equal(facts.populationLabel, 'Not available');
  assert.equal(facts.populationYear, null);
  assert.equal(facts.capitalLabel, 'Vatican City');
});

test('the population snapshot covers every playable country except the documented unavailable record', async () => {
  const source = fs.readFileSync('src/country-populations.js', 'utf8');
  const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Date.now()}-${Math.random()}`);
  assert.equal(Object.keys(module.COUNTRY_POPULATIONS).length, 194);
  assert.equal(module.COUNTRY_POPULATIONS.VAT, undefined);
  for (const record of Object.values(module.COUNTRY_POPULATIONS)) {
    assert.ok(Number.isInteger(record.value) && record.value > 0);
    assert.ok(Number.isInteger(record.year) && record.year >= 2000);
  }
});
