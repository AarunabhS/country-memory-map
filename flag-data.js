/* Editorial flag metadata. The gameplay country list remains in game-data.js. */
(function (root) {
  'use strict';

  /*
   * These are intentionally code-based relationships rather than image
   * guesses made at runtime. They give Hard mode a transparent editorial
   * notion of an "evil twin" while leaving room for a future visual-similarity
   * model. Every group is expanded symmetrically below.
   */
  const confusableGroups = [
    ['td', 'ro'],
    ['mc', 'id', 'pl'],
    ['nl', 'lu'],
    ['ru', 'si', 'sk', 'hr', 'rs'],
    ['ie', 'ci', 'it', 'mx'],
    ['ml', 'gn', 'sn', 'cm'],
    ['ne', 'in', 'ci'],
    ['au', 'nz'],
    ['no', 'is', 'dk', 'se', 'fi'],
    ['qa', 'bh'],
    ['jo', 'ps', 'ae', 'kw', 'sa', 'ye', 'sy', 'iq'],
    ['be', 'de', 'at'],
    ['ch', 'to', 'ge'],
    ['ht', 'li'],
    ['hn', 'ni', 'sv'],
    ['do', 'ht'],
    ['ph', 'cz', 'sk'],
    ['my', 'us', 'lr'],
    ['sg', 'tr', 'tn'],
    ['dz', 'pk', 'mr'],
    ['bd', 'jp', 'pw'],
    ['lk', 'fm'],
    ['kh', 'af'],
    ['bt', 'np']
  ];
  const confusables = {};
  for (const group of confusableGroups) {
    for (const code of group) {
      confusables[code] = [...new Set([...(confusables[code] || []), ...group.filter(other => other !== code)])];
    }
  }

  /* Palette hints are only used to make Easy mode more visually distinct.
     An omitted palette is safe: geography and the curated relationships still
     determine the option ordering. */
  const profiles = {
    np: { colors: ['red', 'blue', 'white'] },
    ch: { colors: ['red', 'white'] },
    va: { colors: ['yellow', 'white'] },
    qa: { colors: ['maroon', 'white'] },
    bh: { colors: ['yellow', 'orange'] },
    kh: { colors: ['blue', 'red', 'white'] },
    bz: { colors: ['blue', 'red', 'white'] },
    tm: { colors: ['green', 'red', 'white'] },
    sa: { colors: ['green', 'white'] },
    td: { colors: ['blue', 'yellow', 'red'] },
    ro: { colors: ['blue', 'yellow', 'red'] },
    mc: { colors: ['red', 'white'] },
    id: { colors: ['red', 'white'] },
    pl: { colors: ['red', 'white'] },
    nl: { colors: ['red', 'white', 'blue'] },
    lu: { colors: ['red', 'white', 'blue'] },
    au: { colors: ['blue', 'red', 'white'] },
    nz: { colors: ['blue', 'red', 'white'] }
  };

  root.FLAG_DATA = Object.freeze({
    source: 'hampusborgos/country-flags (SVG renders sourced from Wikimedia Commons)',
    assetDirectory: 'flags',
    confusableGroups: Object.freeze(confusableGroups.map(group => Object.freeze([...group]))),
    confusables: Object.freeze(Object.fromEntries(Object.entries(confusables).map(([code, values]) => [code, Object.freeze(values)]))),
    profiles: Object.freeze(profiles)
  });
})(typeof window === 'undefined' ? globalThis : window);
