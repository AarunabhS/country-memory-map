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
    {
      id: 'easy-square-flags',
      tier: TIERS.EASY,
      category: 'Flag Secrets',
      prompt: 'Name one of the only two countries whose national flag is a perfect square',
      format: 'single',
      targetCount: 1,
      accepted: ['CHE', 'VAT'],
      hint: 'One is a neutral Alpine nation in Central Europe; the other is the world’s smallest independent state surrounded by Rome.',
      funFact: 'Switzerland and Vatican City are the only two sovereign states in the world with square national flags (1:1 aspect ratio)!'
    },
    {
      id: 'easy-starts-z',
      tier: TIERS.EASY,
      category: 'Alphabet Oddities',
      prompt: "Name the only two sovereign countries whose standard English names begin with the letter 'Z'",
      format: 'multi',
      targetCount: 2,
      accepted: ['ZMB', 'ZWE'],
      hint: 'Both neighboring landlocked nations are located in southern Africa and share the famous Victoria Falls.',
      funFact: 'Zambia and Zimbabwe are the only two sovereign nations in the world whose names start with the letter Z!'
    },
    {
      id: 'easy-guinea-names',
      tier: TIERS.EASY,
      category: 'Name Lore',
      prompt: "Name sovereign countries whose standard English name contains the word 'Guinea'",
      format: 'multi',
      targetCount: 4,
      accepted: ['GIN', 'GNB', 'GNQ', 'PNG'],
      hint: 'Three are located in West and Central Africa, while the fourth is a massive island nation in Oceania north of Australia.',
      funFact: 'Four countries bear "Guinea" in their names: Guinea, Guinea-Bissau, Equatorial Guinea, and Papua New Guinea!'
    },
    {
      id: 'easy-united-names',
      tier: TIERS.EASY,
      category: 'Name Lore',
      prompt: "Name countries whose standard short English name contains the word 'United'",
      format: 'multi',
      targetCount: 3,
      accepted: ['ARE', 'GBR', 'USA'],
      hint: 'Think of a Middle Eastern federation of emirates, an island nation in northwest Europe, and a fifty-state nation in North America.',
      funFact: 'Only three sovereign nations use "United" in their common short names: the United Arab Emirates, the United Kingdom, and the United States!'
    },
    {
      id: 'easy-union-jack-flags',
      tier: TIERS.EASY,
      category: 'Flag Secrets',
      prompt: 'Apart from the United Kingdom itself, name independent countries that still feature the Union Jack on their national flag',
      format: 'multi',
      targetCount: 4,
      accepted: ['AUS', 'FJI', 'NZL', 'TUV'],
      hint: 'All four are sovereign Pacific nations: two large Commonwealth realms and two island archipelagos.',
      funFact: 'Only four independent nations outside the UK still feature the British Union Jack on their flag: Australia, New Zealand, Fiji, and Tuvalu!'
    },
    {
      id: 'easy-landlocked-south-america',
      tier: TIERS.EASY,
      category: 'Extremes & Geography',
      prompt: 'Name the only two landlocked countries in South America',
      format: 'multi',
      targetCount: 2,
      accepted: ['BOL', 'PRY'],
      hint: 'Both countries sit in the heart of South America and fought against each other in the Chaco War during the 1930s.',
      funFact: 'Bolivia and Paraguay are the only two landlocked nations in the entire continent of South America!'
    },
    {
      id: 'easy-saint-countries',
      tier: TIERS.EASY,
      category: 'Name Lore',
      prompt: "Name sovereign countries whose standard English name begins with the word 'Saint'",
      format: 'multi',
      targetCount: 3,
      accepted: ['KNA', 'LCA', 'VCT'],
      hint: 'All three are Caribbean island nations in the Lesser Antilles.',
      funFact: 'Saint Kitts and Nevis, Saint Lucia, and Saint Vincent and the Grenadines are the only three sovereign countries in the world whose standard English names start with "Saint"!'
    },
    {
      id: 'easy-equator-south-america',
      tier: TIERS.EASY,
      category: 'Extremes & Geography',
      prompt: 'Name the South American countries through which the Equator passes',
      format: 'multi',
      targetCount: 3,
      accepted: ['ECU', 'COL', 'BRA'],
      hint: 'One country is literally named after the equator, while the other two are northern and eastern neighbors covering much of the Amazon.',
      funFact: 'The Equator passes through only three South American nations: Ecuador, Colombia, and Brazil!'
    },
    {
      id: 'easy-ends-land',
      tier: TIERS.EASY,
      category: 'Alphabet Oddities',
      prompt: "Name sovereign countries whose standard English name ends exactly with the letters 'land'",
      format: 'multi',
      targetCount: 4,
      accepted: ['FIN', 'ISL', 'IRL', 'NZL', 'POL', 'CHE', 'THA'],
      hint: 'Look across Europe for six nations, plus one famous Pacific island country and one Southeast Asian kingdom.',
      funFact: 'Seven sovereign countries end exactly with "land": Finland, Iceland, Ireland, New Zealand, Poland, Switzerland, and Thailand (the Netherlands and Marshall Islands end in "lands")!'
    },
    {
      id: 'easy-city-states',
      tier: TIERS.EASY,
      category: 'Political Geography',
      prompt: 'Name the three modern sovereign states commonly recognized as city-states',
      format: 'multi',
      targetCount: 3,
      accepted: ['SGP', 'MCO', 'VAT'],
      hint: 'One is a bustling island nation in Southeast Asia, one is a glamorous principality on the French Riviera, and one is enclosed within Rome.',
      funFact: 'Singapore, Monaco, and Vatican City are universally recognized as the three true sovereign microstate city-states of the modern world!'
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
    {
      id: 'med-double-landlocked',
      tier: TIERS.MEDIUM,
      category: 'Enclaves & Borders',
      prompt: 'Name the only two doubly landlocked countries in the world — countries surrounded entirely by other landlocked countries',
      format: 'multi',
      targetCount: 2,
      accepted: ['LIE', 'UZB'],
      hint: 'One is an Alpine principality between Switzerland and Austria; the other is a Central Asian nation famous for Samarkand.',
      funFact: 'Liechtenstein and Uzbekistan are the only two doubly landlocked countries on Earth: to reach a coastline from either, you must cross at least two international borders!'
    },
    {
      id: 'med-prime-meridian',
      tier: TIERS.MEDIUM,
      category: 'Lines & Coordinates',
      prompt: 'Name countries through which the Prime Meridian passes',
      format: 'multi',
      targetCount: 5,
      accepted: ['GBR', 'FRA', 'ESP', 'DZA', 'MLI', 'BFA', 'TGO', 'GHA'],
      hint: 'Follow the 0° longitude line from Greenwich in the UK south through Europe and down through West Africa to the Gulf of Guinea.',
      funFact: 'The Prime Meridian (0° longitude) traverses eight sovereign nations: the UK, France, Spain, Algeria, Mali, Burkina Faso, Togo, and Ghana!'
    },
    {
      id: 'med-danube-capitals',
      tier: TIERS.MEDIUM,
      category: 'Capital Curiosities',
      prompt: 'Name countries whose national capital lies on the Danube River',
      format: 'multi',
      targetCount: 4,
      accepted: ['AUT', 'SVK', 'HUN', 'SRB'],
      hint: 'The four capitals on the Danube are Vienna, Bratislava, Budapest, and Belgrade.',
      funFact: 'The Danube River passes directly through more national capitals than any other river on Earth: Vienna (Austria), Bratislava (Slovakia), Budapest (Hungary), and Belgrade (Serbia)!'
    },
    {
      id: 'med-tropic-capricorn',
      tier: TIERS.MEDIUM,
      category: 'Extremes & Geography',
      prompt: 'Name countries crossed by the Tropic of Capricorn',
      format: 'multi',
      targetCount: 5,
      accepted: ['CHL', 'ARG', 'PRY', 'BRA', 'NAM', 'BWA', 'ZAF', 'MOZ', 'MDG', 'AUS'],
      hint: 'Trace the line at 23.5° South across South America (4 countries), southern Africa (5 countries), and Australia.',
      funFact: 'Ten sovereign nations are intersected by the Tropic of Capricorn across South America, Africa, and Oceania!'
    },
    {
      id: 'med-black-sea-countries',
      tier: TIERS.MEDIUM,
      category: 'Seas & Coasts',
      prompt: 'Name countries with a coastline on the Black Sea',
      format: 'multi',
      targetCount: 4,
      accepted: ['BGR', 'GEO', 'ROU', 'RUS', 'TUR', 'UKR'],
      hint: 'Six nations surround this inland sea bordering Southeastern Europe, Eastern Europe, and Western Asia.',
      funFact: 'The Black Sea is bordered by exactly six countries: Bulgaria, Georgia, Romania, Russia, Turkey, and Ukraine!'
    },
    {
      id: 'med-caspian-countries',
      tier: TIERS.MEDIUM,
      category: 'Seas & Coasts',
      prompt: 'Name countries that border the Caspian Sea',
      format: 'multi',
      targetCount: 3,
      accepted: ['AZE', 'IRN', 'KAZ', 'RUS', 'TKM'],
      hint: 'Five nations border the world’s largest inland body of water: one in the Caucasus, one in the Middle East, and three in Eurasia/Central Asia.',
      funFact: 'Known as the "Caspian Five", Azerbaijan, Iran, Kazakhstan, Russia, and Turkmenistan are the only sovereign states bordering the Caspian Sea!'
    },
    {
      id: 'med-atlantic-mediterranean',
      tier: TIERS.MEDIUM,
      category: 'Seas & Coasts',
      prompt: 'Name the three countries that have coastlines on both the Atlantic Ocean and the Mediterranean Sea',
      format: 'multi',
      targetCount: 3,
      accepted: ['FRA', 'ESP', 'MAR'],
      hint: 'Two are European neighbors on the Iberian and French mainland, and the third is in North Africa across the Strait of Gibraltar.',
      funFact: 'Only France, Spain, and Morocco touch both the Atlantic Ocean and the Mediterranean Sea!'
    },
    {
      id: 'med-nordic-cross',
      tier: TIERS.MEDIUM,
      category: 'Flag Secrets',
      prompt: 'Name sovereign countries whose national flag uses the traditional Nordic Cross design',
      format: 'multi',
      targetCount: 5,
      accepted: ['DNK', 'FIN', 'ISL', 'NOR', 'SWE'],
      hint: 'All five are Nordic nations in Northern Europe featuring off-center crosses.',
      funFact: 'Denmark, Finland, Iceland, Norway, and Sweden all fly flags bearing the Nordic Cross, with Denmark’s Dannebrog dating back to the 13th century as the oldest continuously used national flag!'
    },
    {
      id: 'med-borneo-three',
      tier: TIERS.MEDIUM,
      category: 'Islands & Geography',
      prompt: 'Name the three sovereign countries that share the island of Borneo',
      format: 'multi',
      targetCount: 3,
      accepted: ['BRN', 'IDN', 'MYS'],
      hint: 'The world’s third-largest island is divided between a tiny sultanate and two large Southeast Asian nations.',
      funFact: 'Borneo is one of the only islands on Earth divided among three sovereign nations: Indonesia (Kalimantan), Malaysia (Sabah and Sarawak), and Brunei!'
    },
    {
      id: 'med-mekong-countries',
      tier: TIERS.MEDIUM,
      category: 'Rivers & Geography',
      prompt: 'Name countries through which the Mekong River flows or along whose border it runs',
      format: 'multi',
      targetCount: 4,
      accepted: ['CHN', 'MMR', 'LAO', 'THA', 'KHM', 'VNM'],
      hint: 'The river begins on the Tibetan Plateau and flows through five Southeast Asian nations before reaching its vast delta.',
      funFact: 'The Mekong River flows through or borders six nations: China, Myanmar, Laos, Thailand, Cambodia, and Vietnam, sustaining over 60 million people!'
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
