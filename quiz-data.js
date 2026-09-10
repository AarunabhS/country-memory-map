/* Question bank and trivia metadata for Geo Quiz mode.
 * Compatible with Node.js and browser environments.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GeographyQuizData = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  const TIERS = Object.freeze({
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    GENIUS: 'genius'
  });

  const TIER_LABELS = Object.freeze({
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    genius: 'Genius'
  });

  const QUESTIONS = Object.freeze([
    /* ==========================================================================
       TIER 1: EASY
       ========================================================================== */
    {
      id: 'easy-ends-in-h',
      tier: TIERS.EASY,
      category: 'Name Lore',
      prompt: "Name a country whose standard English name ends with the letter 'H'",
      format: 'single',
      targetCount: 1,
      accepted: ['BGD'],
      hint: 'This South Asian nation is known for the Sundarbans mangrove forest and Dhaka.',
      funFact: "Bangladesh ('Country of Bengal') is the only sovereign country in the world whose standard English name ends with the letter 'H'!"
    },
    {
      id: 'easy-cardinal-directions',
      tier: TIERS.EASY,
      category: 'Name Lore',
      prompt: 'Name countries that have a cardinal direction (North, South, East, or West) in their official short name',
      format: 'multi',
      targetCount: 6,
      accepted: ['PRK', 'KOR', 'ZAF', 'SSD', 'MKD', 'TLS'],
      bonusAccepted: ['CAF'],
      hint: 'Look for two on the Korean peninsula, two in Sub-Saharan Africa, one in the Balkans, and one in Maritime Southeast Asia.',
      funFact: 'Only 6 UN-recognized countries feature cardinal directions in their common English names: North Korea, South Korea, South Africa, South Sudan, North Macedonia, and Timor-Leste (East Timor).'
    },
    {
      id: 'easy-starts-q-or-y',
      tier: TIERS.EASY,
      category: 'Alphabet Oddities',
      prompt: "Name the only country in the world starting with 'Q', or the only one starting with 'Y'",
      format: 'single',
      targetCount: 1,
      accepted: ['QAT', 'YEM'],
      hint: 'Both are located on the Arabian Peninsula — one hosted the 2022 World Cup, while the other borders Saudi Arabia and Oman.',
      funFact: "Qatar is the world's only sovereign nation starting with the letter Q, and Yemen is the only one starting with Y!"
    },
    {
      id: 'easy-country-equals-capital',
      tier: TIERS.EASY,
      category: 'Capital Curiosities',
      prompt: 'Name a country whose capital city has the exact same name as the country',
      format: 'single',
      targetCount: 1,
      accepted: ['MEX', 'PAN', 'GTM', 'KWT', 'DJI', 'SGP', 'MCO', 'SMR', 'VAT', 'AND', 'LUX'],
      hint: 'Think of famous city-states or Latin American nations where the capital adds "City" to the country name.',
      funFact: 'Nations like Mexico (Mexico City), Panama (Panama City), Djibouti, Singapore, Monaco, and San Marino share their identity directly with their capital.'
    },
    {
      id: 'easy-non-rectangular-flag',
      tier: TIERS.EASY,
      category: 'Flag Secrets',
      prompt: 'Name the only country in the world with a non-rectangular national flag',
      format: 'single',
      targetCount: 1,
      accepted: ['NPL'],
      hint: 'This Himalayan nation is home to Mount Everest.',
      funFact: 'Nepal is the only country in the world whose national flag is non-quadrilateral; its double-pennant shape symbolizes the Himalayas and the harmony of Hinduism and Buddhism.'
    },
    {
      id: 'easy-island-continent',
      tier: TIERS.EASY,
      category: 'Extremes & Geography',
      prompt: 'Name the only nation on Earth that occupies an entire continent by itself',
      format: 'single',
      targetCount: 1,
      accepted: ['AUS'],
      hint: 'This country "Down Under" is famous for kangaroos, the Outback, and Canberra.',
      funFact: 'Australia is uniquely both the world’s smallest continent and the sixth-largest country by land area.'
    },
    {
      id: 'easy-three-capitals',
      tier: TIERS.EASY,
      category: 'Capital Curiosities',
      prompt: 'Name the only country in the world with three official capital cities',
      format: 'single',
      targetCount: 1,
      accepted: ['ZAF'],
      hint: 'This "Rainbow Nation" at the tip of the African continent hosts Pretoria, Cape Town, and Bloemfontein.',
      funFact: 'South Africa divides its governance among three capitals: executive in Pretoria, legislative in Cape Town, and judicial in Bloemfontein.'
    },
    {
      id: 'easy-four-letter-nations',
      tier: TIERS.EASY,
      category: 'Alphabet Oddities',
      prompt: 'Name sovereign countries whose English names have only 4 letters',
      format: 'multi',
      targetCount: 5,
      accepted: ['TCD', 'CUB', 'FJI', 'IRN', 'IRQ', 'LAO', 'MLI', 'OMN', 'PER', 'TGO'],
      hint: 'Think of island nations like Fiji or Cuba, Middle Eastern neighbors Iran and Iraq, or Peru in South America.',
      funFact: 'There are only 10 sovereign nations with 4-letter English names: Chad, Cuba, Fiji, Iran, Iraq, Laos, Mali, Oman, Peru, and Togo.'
    },

    /* ==========================================================================
       TIER 2: MEDIUM
       ========================================================================== */
    {
      id: 'med-weapons-on-flags',
      tier: TIERS.MEDIUM,
      category: 'Flags & Weapons',
      prompt: 'Name countries that feature weapons (rifles, swords, spears, daggers, or machetes) on their national flag',
      format: 'multi',
      targetCount: 4,
      accepted: ['MOZ', 'GTM', 'SAU', 'KEN', 'OMN', 'BRB', 'LKA', 'AGO', 'SWZ'],
      hint: 'Consider Mozambique (AK-47), Guatemala (rifles), Saudi Arabia or Sri Lanka (swords), and Kenya or Eswatini (spears and shields).',
      funFact: 'Mozambique’s flag uniquely features a modern AK-47 assault rifle with attached bayonet, Guatemala displays crossed Remington rifles, and Saudi Arabia and Sri Lanka brandish ceremonial swords.'
    },
    {
      id: 'med-single-border-enclaves',
      tier: TIERS.MEDIUM,
      category: 'Enclaves & Borders',
      prompt: 'Name the 3 countries in the world that are completely surrounded by only ONE other country (enclaves)',
      format: 'multi',
      targetCount: 3,
      accepted: ['LSO', 'SMR', 'VAT'],
      hint: 'Two are located inside Italy; the third is an independent mountain kingdom completely surrounded by South Africa.',
      funFact: 'Vatican City and San Marino are enclaves entirely inside Italy, while the kingdom of Lesotho is completely enclosed by South Africa.'
    },
    {
      id: 'med-transcontinental',
      tier: TIERS.MEDIUM,
      category: 'Extremes & Geography',
      prompt: 'Name countries whose territory spans across two different continents',
      format: 'multi',
      targetCount: 4,
      accepted: ['RUS', 'TUR', 'EGY', 'KAZ', 'AZE', 'GEO', 'PAN'],
      hint: 'Russia, Turkey, and Kazakhstan cross between Europe and Asia; Egypt spans Africa and Asia; Panama bridges North and South America.',
      funFact: 'Istanbul, Turkey is the only historic metropolis on Earth that sits simultaneously on two continents across the Bosphorus Strait.'
    },
    {
      id: 'med-same-start-end-letter',
      tier: TIERS.MEDIUM,
      category: 'Alphabet Oddities',
      prompt: "Name countries whose English name begins and ends with the exact same letter",
      format: 'multi',
      targetCount: 4,
      accepted: ['DZA', 'AND', 'AGO', 'ARG', 'ARM', 'AUS', 'AUT'],
      hint: 'Every single sovereign country fitting this rule begins and ends with the letter "A"!',
      funFact: "All seven matching countries start and end with 'A': Algeria, Andorra, Angola, Argentina, Armenia, Australia, and Austria!"
    },
    {
      id: 'med-bicolor-stripes',
      tier: TIERS.MEDIUM,
      category: 'Flag Secrets',
      prompt: 'Name countries whose national flag consists of only two simple horizontal stripes of red and white',
      format: 'multi',
      targetCount: 3,
      accepted: ['POL', 'MCO', 'IDN'],
      hint: 'Two have red on top (one in Southeast Asia, one on the French Riviera), while one European nation has white on top.',
      funFact: 'Indonesia and Monaco share nearly identical flags with red above white, while Poland flies the exact vertical inversion with white above red.'
    },
    {
      id: 'med-spanish-in-africa',
      tier: TIERS.MEDIUM,
      category: 'Language & Culture',
      prompt: 'Name the only independent country in Africa where Spanish is an official language',
      format: 'single',
      targetCount: 1,
      accepted: ['GNQ'],
      hint: 'This small Central African nation on the Gulf of Guinea has its capital on the island of Bioko.',
      funFact: 'Equatorial Guinea (formerly Spanish Guinea) declared independence in 1968 and remains Africa’s only sovereign Hispanophone nation.'
    },
    {
      id: 'med-colors-in-name',
      tier: TIERS.MEDIUM,
      category: 'Name Lore',
      prompt: 'Name countries that contain a color word in their English or translated name',
      format: 'single',
      targetCount: 1,
      accepted: ['MNE', 'CPV', 'BLR', 'CIV'],
      hint: 'Think of "Black Mountain" on the Adriatic, "Green Cape" in the Atlantic, or "White Russia" in Eastern Europe.',
      funFact: "'Montenegro' translates to 'Black Mountain' in Venetian Italian, Cabo Verde translates to 'Green Cape', and Belarus historically denotes 'White Rus'."
    },
    {
      id: 'med-one-land-border',
      tier: TIERS.MEDIUM,
      category: 'Enclaves & Borders',
      prompt: 'Name countries that share a land border with ONLY one other nation',
      format: 'multi',
      targetCount: 4,
      accepted: ['CAN', 'PRT', 'IRL', 'GBR', 'MCO', 'SMR', 'VAT', 'LSO', 'BRN', 'KOR', 'GMB', 'DOM', 'HTI', 'QAT', 'DNK', 'PNG'],
      hint: 'Consider Canada (borders only the US), Portugal (only Spain), Ireland (only the UK), or South Korea (only North Korea).',
      funFact: 'Canada and the United States share the longest undefended international land border in the world at 8,891 km (5,525 miles).'
    },

    /* ==========================================================================
       TIER 3: HARD
       ========================================================================== */
    {
      id: 'hard-doubly-landlocked',
      tier: TIERS.HARD,
      category: 'Enclaves & Borders',
      prompt: 'Name the only 2 countries in the world that are "doubly landlocked" (surrounded entirely by other landlocked countries)',
      format: 'multi',
      targetCount: 2,
      accepted: ['LIE', 'UZB'],
      hint: 'One is an Alpine principality between Switzerland and Austria; the other is a Central Asian nation famous for Samarkand.',
      funFact: 'To reach an ocean from Liechtenstein or Uzbekistan, you must cross at least two international borders!'
    },
    {
      id: 'hard-most-time-zones',
      tier: TIERS.HARD,
      category: 'Extremes & Geography',
      prompt: 'Name the country with the most time zones in the world (including overseas territories)',
      format: 'single',
      targetCount: 1,
      accepted: ['FRA'],
      hint: 'This European nation has islands and territories across the Atlantic, Indian, and Pacific oceans.',
      funFact: 'Because of its overseas territories from French Polynesia to Réunion, France spans 12 time zones (13 during daylight savings), beating Russia (11) and the USA (11)!'
    },
    {
      id: 'hard-null-island',
      tier: TIERS.HARD,
      category: 'Extremes & Geography',
      prompt: 'Name the sovereign nation closest to "Null Island" (the intersection of the Equator and Prime Meridian at 0°N, 0°E)',
      format: 'single',
      targetCount: 1,
      accepted: ['GHA'],
      hint: 'This West African nation on the Gulf of Guinea has its capital at Accra.',
      funFact: 'Ghana is the closest sovereign landmass to the 0°N, 0°E point in the Gulf of Guinea where the Prime Meridian meets the Equator.'
    },
    {
      id: 'hard-14-neighbors',
      tier: TIERS.HARD,
      category: 'Enclaves & Borders',
      prompt: 'Name the two giant nations that each share land borders with 14 sovereign countries',
      format: 'multi',
      targetCount: 2,
      accepted: ['CHN', 'RUS'],
      hint: 'One is the world’s largest country by area; the other is the most populous nation in East Asia.',
      funFact: 'China and Russia share the world record for the highest number of bordering neighbors, each touching 14 different sovereign countries.'
    },
    {
      id: 'hard-no-capital',
      tier: TIERS.HARD,
      category: 'Capital Curiosities',
      prompt: 'Name the only country in the world that has no officially designated capital city',
      format: 'single',
      targetCount: 1,
      accepted: ['NRU', 'CHE'],
      hint: 'This tiny Micronesian island nation covers just 21 square kilometers and places its parliament in the Yaren District.',
      funFact: 'Nauru has no official capital city at all; Switzerland also lacks a de jure capital in its constitution, treating Bern as a federal city.'
    },
    {
      id: 'hard-highest-capital',
      tier: TIERS.HARD,
      category: 'Capital Curiosities',
      prompt: 'Name the country whose administrative capital sits at the highest elevation in the world (over 3,600m above sea level)',
      format: 'single',
      targetCount: 1,
      accepted: ['BOL'],
      hint: 'This landlocked South American nation has La Paz nestled high in an Andean canyon.',
      funFact: 'La Paz, Bolivia sits at approximately 3,640 meters (11,942 ft) above sea level, making it the highest national government seat on Earth.'
    },
    {
      id: 'hard-most-islands',
      tier: TIERS.HARD,
      category: 'Extremes & Geography',
      prompt: 'Name the country with the most islands in the world (over 260,000 islands)',
      format: 'single',
      targetCount: 1,
      accepted: ['SWE'],
      hint: 'This Scandinavian nation is famous for Stockholm, the Baltic archipelago, and IKEA.',
      funFact: 'Sweden contains an estimated 267,570 islands — far more than any other nation on Earth, though fewer than 1,000 are inhabited.'
    },
    {
      id: 'hard-zero-rivers',
      tier: TIERS.HARD,
      category: 'Extremes & Geography',
      prompt: 'Name a sovereign nation that has zero permanent natural rivers or lakes',
      format: 'single',
      targetCount: 1,
      accepted: ['SAU', 'KWT', 'BHR', 'QAT', 'ARE', 'OMN', 'YEM', 'MLT', 'VAT', 'MCO'],
      hint: 'Think of vast Arabian desert nations or tiny Mediterranean city-states.',
      funFact: 'Saudi Arabia is the largest country on Earth without a single permanent natural surface river, relying on seawater desalination plants and deep aquifers.'
    },

    /* ==========================================================================
       TIER 4: GENIUS
       ========================================================================== */
    {
      id: 'genius-kazungula-quadripoint',
      tier: TIERS.GENIUS,
      category: 'Enclaves & Borders',
      prompt: 'Name the 4 African countries that nearly meet at a single international quadripoint on the Zambezi River',
      format: 'multi',
      targetCount: 4,
      accepted: ['BWA', 'NAM', 'ZMB', 'ZWE'],
      hint: 'Near the Kazungula Bridge, four southern African nations converge within just a few meters across the water.',
      funFact: 'Botswana, Namibia, Zambia, and Zimbabwe almost touch at a single point in the Zambezi River, forming the nearest thing to a four-nation border point on Earth.'
    },
    {
      id: 'genius-vulcan-point',
      tier: TIERS.GENIUS,
      category: 'Extremes & Geography',
      prompt: 'Name the archipelago nation famous for Vulcan Point — an island within a lake, on an island within a lake, on an island!',
      format: 'single',
      targetCount: 1,
      accepted: ['PHL'],
      hint: 'This Southeast Asian nation contains Luzon, home to the scenic Taal Volcano.',
      funFact: 'On Luzon island in the Philippines, Lake Taal contains Taal Volcano Island, which holds Crater Lake, inside of which sits the tiny rock island Vulcan Point!'
    },
    {
      id: 'genius-southernmost-capital',
      tier: TIERS.GENIUS,
      category: 'Capital Curiosities',
      prompt: 'Name the sovereign nation whose capital city is the southernmost capital in the world',
      format: 'single',
      targetCount: 1,
      accepted: ['NZL'],
      hint: 'This Pacific nation has its capital at Wellington, located at the southern tip of its North Island.',
      funFact: 'Wellington, New Zealand sits at 41.3° South latitude, making it the southernmost capital of any sovereign nation on Earth.'
    },
    {
      id: 'genius-panama-canal-direction',
      tier: TIERS.GENIUS,
      category: 'Extremes & Geography',
      prompt: 'Which country contains the famous canal where ships traveling from the Atlantic to Pacific sail Southeast, not West?',
      format: 'single',
      targetCount: 1,
      accepted: ['PAN'],
      hint: 'This Central American country spans the narrow isthmus connecting North and South America.',
      funFact: 'Because of the S-curve of the Isthmus of Panama, ships entering the canal from the Atlantic Ocean must sail Southeast to reach the Pacific Ocean!'
    },
    {
      id: 'genius-all-four-hemispheres',
      tier: TIERS.GENIUS,
      category: 'Extremes & Geography',
      prompt: 'Name the only country in the world situated in all four hemispheres (Northern, Southern, Eastern, and Western)',
      format: 'single',
      targetCount: 1,
      accepted: ['KIR'],
      hint: 'This Pacific island nation spans across both the Equator and the 180th Meridian.',
      funFact: "Kiribati's 33 atolls and islands span 3.5 million km² across both the Equator and the 180th Meridian, making it the only country lying in all four hemispheres!"
    },
    {
      id: 'genius-isolated-capital',
      tier: TIERS.GENIUS,
      category: 'Capital Curiosities',
      prompt: 'Name the nation with the most isolated capital city in the world, sitting over 2,300 km from its nearest capital neighbor',
      format: 'single',
      targetCount: 1,
      accepted: ['NZL', 'ISL'],
      hint: 'Wellington is 2,326 km away from its closest national neighbor Canberra, Australia.',
      funFact: 'Wellington (New Zealand) is the most geographically isolated national capital on Earth, followed closely by Reykjavik (Iceland).'
    },
    {
      id: 'genius-longest-coastline',
      tier: TIERS.GENIUS,
      category: 'Extremes & Geography',
      prompt: 'Name the country with the longest coastline in the world (over 200,000 km)',
      format: 'single',
      targetCount: 1,
      accepted: ['CAN'],
      hint: 'This northern giant has an Arctic archipelago with tens of thousands of indented islands and bays.',
      funFact: "Canada's coastline measures a staggering 202,080 km (125,567 miles) along the Atlantic, Pacific, and Arctic oceans — enough to circle the equator five times!"
    },
    {
      id: 'genius-baarle-enclaves',
      tier: TIERS.GENIUS,
      category: 'Enclaves & Borders',
      prompt: 'Name the two European nations whose border is famously fragmented into dozens of enclaves within enclaves inside the town of Baarle',
      format: 'multi',
      targetCount: 2,
      accepted: ['BEL', 'NLD'],
      hint: 'In Baarle-Hertog and Baarle-Nassau, the border weaves between cafes, shops, and living rooms.',
      funFact: 'The border between Belgium and the Netherlands in Baarle is one of the most complex in the world, featuring 22 Belgian exclaves surrounded by Dutch territory, with Dutch counter-enclaves inside them!'
    }
  ]);

  return {
    TIERS,
    TIER_LABELS,
    QUESTIONS,
    getQuestionsByTier: function (tier) {
      if (!tier || tier === 'all') return [...QUESTIONS];
      const normalizedTier = tier === 'expert' ? 'genius' : tier;
      return QUESTIONS.filter(q => q.tier === normalizedTier);
    },
    getQuestionById: function (id) {
      return QUESTIONS.find(q => q.id === id) || null;
    }
  };
});
