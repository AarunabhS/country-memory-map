/* One normalized model over the existing map and capital sources; no second country list. */
window.buildGameCountries = function (bridge) {
  const { normalize } = GeographyGame;
  const easyLocation = new Set(['USA','CAN','MEX','BRA','ARG','GBR','FRA','ESP','ITA','DEU','RUS','CHN','IND','JPN','AUS','NZL','ZAF','EGY','SAU','IDN','GRL']);
  const expertLocation = new Set(['VAT','MCO','SMR','LIE','AND','LUX','MLT','SGP','BHR','MDV','NRU','TUV','PLW','MHL','FSM','KIR','TON','WSM','VUT','STP','SYC','COM','MUS','CPV','ATG','DMA','GRD','KNA','LCA','VCT','BRB','GUY','SUR']);
  const hardLocation = new Set(['GEO','ARM','AZE','KGZ','TJK','TKM','UZB','MDA','MKD','MNE','BIH','SVN','SVK','GNB','GNQ','DJI','ERI','TLS','BRN','BTN','SWZ','LSO','BDI','RWA','BLZ','SLV']);
  const easyCapital = new Set(['GBR','FRA','ITA','ESP','DEU','USA','JPN','CHN','IND','RUS','EGY','AUS','CAN','BRA','GRC','PRT','ARG','MEX','THA','KOR']);
  const hardCapital = new Set(['KAZ','KGZ','TJK','TKM','UZB','MNG','MMR','LKA','CIV','BEN','BOL','BTN','BRN','MDG','TZA','BDI','RWA','ZMB','MWI','GMB','GNB','LSO','SWZ','MRT','BFA','TCD','SSD','CAF']);
  const expertCapital = new Set(['KIR','TUV','NRU','PLW','MHL','FSM','VUT','WSM','TON','STP','COM','SYC','CPV','GNQ','BLZ','KNA','DMA','GRD','VCT','LCA','ATG','BHR','MDV','LIE','SMR','GUY','SUR']);
  const extraCapitalAliases = { 'Sri Jayawardenepura Kotte': ['Sri Jayewardenepura Kotte', 'Kotte'], 'Washington, D.C.': ['Washington', 'Washington DC'], 'Washington': ['Washington DC'], 'Kyiv': ['Kiev'], 'Ulaanbaatar': ['Ulan Bator'], 'Thimphu': ['Thimpu'] };
  const countries = bridge.countries.map(record => {
    const p = bridge.feature(record.id).properties;
    const iso = p.ISO_A3_EH !== '-99' ? p.ISO_A3_EH : p.ADM0_A3;
    const iso2 = /^[A-Z]{2}$/.test(p.ISO_A2_EH) ? p.ISO_A2_EH : null;
    const capitals = bridge.capitals.filter(c => c.countryId === record.id).map(c => {
      const original = window.CAPITALS_DATA.find(x => x.name === c.name && bridge.countryId(x.country) === record.id);
      return { name: c.name, aliases: [...new Set([...(original?.aliases || []), ...(extraCapitalAliases[c.name] || [])])],
        role: c.role, latitude: original?.lat, longitude: original?.lon };
    });
    return { country_id: record.id, canonical_name: record.name,
      accepted_names: [...new Set([record.name, ...bridge.aliases(record.id)])], iso_code: iso, continent: record.continent,
      subregion: p.SUBREGION, capital: capitals, latitude: Number(p.LABEL_Y), longitude: Number(p.LABEL_X),
      borders: [], flag: iso2 ? [...iso2].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : null,
      map_geometry_id: record.id, countryLocationDifficulty: easyLocation.has(iso) ? 1 : expertLocation.has(iso) ? 4 : hardLocation.has(iso) || Number(p.LABELRANK) >= 5 ? 3 : 2,
      capitalDifficulty: easyCapital.has(iso) ? 1 : expertCapital.has(iso) ? 4 : hardCapital.has(iso) ? 3 : 2,
      flagDifficulty: null, shapeDifficulty: null, difficultySource: 'editorial-v1',
      difficultyStatistics: { location: null, capital: null, flag: null, shape: null } };
  });
  const byName = new Map(countries.map(c => [normalize(c.canonical_name), c.country_id]));
  countries.forEach(c => { c.borders = (window.COUNTRY_BORDER_NAMES?.[bridge.feature(c.country_id).properties.ADMIN] || []).map(n => byName.get(normalize(n))).filter(Boolean); });
  return countries;
};
