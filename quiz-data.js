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

  // Review metadata distinguishes editorial checks from independent fact verification.
  const CONTENT_VERSION = 'quiz-52-20260922';
  const SOURCE_REVIEW = {
    'easy-three-capitals': ['https://www.gov.za/south-africa-glance', 'Government description of the three capitals.'],
    'med-one-land-border': ['https://www.canada.ca/en/global-affairs/news/2022/06/boundary-dispute.html', 'Hans Island exception; category explicitly uses the pre-2022 convention.'],
    'med-mekong-countries': ['https://www.mrcmekong.org/mekong-river-basin/', 'Commission lists the six river countries.'],
    'hard-most-islands': ['https://www.scb.se/en/finding-statistics/statistics-by-subject-area/housing-construction-and-building/land-use/land-use-in-proximity-to-shoreline/pong/statistical-news/coast-shores-and-islands-in-sweden-2013/', '2013 national survey count; not a standardized international comparison.'],
    'hard-most-time-zones': ['https://www.timeanddate.com/time/zone/france', 'Standard time zones including overseas territories.'],
    'hard-no-capital': ['https://www.aboutswitzerland.eda.admin.ch/en/political-system', 'Swiss federal-city terminology; Nauru also checked against its national communication.'],
    'hard-zero-rivers': ['https://cdmdna.gov.sa/Resources/119/bur2.pdf', 'Saudi national report describes the absence of perennial rivers; previous broad answer set narrowed.'],
    'genius-vulcan-point': ['https://science.nasa.gov/earth/earth-observatory/sulfur-spews-from-taal-146142/', '2020 eruption context; historical rather than a guaranteed present-day lake configuration.'],
    'genius-southernmost-capital': ['https://wellington.govt.nz/-/media/your-council/plans-policies-and-bylaws/plans-and-policies/annualreport/2022-23/annual-report-2022-23-summary.pdf', 'Wellington city profile.'],
    'genius-all-four-hemispheres': ['https://visitkiribati.travel/wp-content/uploads/2019/05/Kiribati-Travel-Information-2019.pdf', 'Island groups span hemispheres; the prompt no longer claims global uniqueness.'],
    'genius-longest-coastline': ['https://www.canada.ca/en/services/environment/our-environment/nature-based-climate-solutions/coastlines.html', 'Longest coastline; measurement-dependent exact length omitted.']
  };
  function reviewedQuestion(question) {
    const specific = SOURCE_REVIEW[question.id];
    const names = ['Name Lore', 'Alphabet Oddities'].includes(question.category);
    const flags = question.category === 'Flag Secrets' || /flag/.test(question.id);
    return Object.freeze({ ...question, review: Object.freeze({
      editedAt: '2026-09-22', contentVersion: CONTENT_VERSION,
      scope: 'Existing 195-country game; common English names and explicit prompt exceptions.',
      source: specific?.[0] || (names ? 'https://unstats.un.org/unsd/methodology/m49/' : flags ? 'https://github.com/hampusborgos/country-flags' : 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/'),
      localSource: names ? 'game-data.js / countries-data.js' : flags ? 'flags/ / flag-data.js' : 'countries-data.js / capitals-data.js / country-borders.js',
      check: specific ? 'source-cross-check' : 'editorial-consistency-review',
      notes: specific?.[1] || 'Source is the reference dataset, not independent proof of every descriptive fact. See docs/QUIZ_CONTENT_REVIEW.md.',
      verifiedAt: specific ? '2026-09-22' : null,
      bonusRationale: question.bonusAccepted ? 'Central is an intentional extra answer under the broader directional-name convention.' : null
    }) });
  }

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
      prompt: 'Name six countries with North, South, East or West in a common English name; Central African Republic also counts as a bonus',
      format: 'multi',
      targetCount: 6,
      accepted: ['PRK', 'KOR', 'ZAF', 'SSD', 'MKD', 'TLS'],
      bonusAccepted: ['CAF'],
      hint: 'Look for two on the Korean peninsula, two in Sub-Saharan Africa, one in the Balkans, and one in Maritime Southeast Asia.',
      funFact: 'This category uses common English names, including East Timor for Timor-Leste. Central African Republic is an extra accepted answer under this game’s broader directional-name convention.'
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
      prompt: 'Name a country whose capital shares its name, allowing additions such as City or la Vella',
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
      funFact: 'Nepal’s national flag consists of two joined pennants, unlike the rectangular or square flags used by the other countries in this game.'
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
      hint: 'Look across Europe for five nations, plus one famous Pacific island country and one Southeast Asian kingdom.',
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
      funFact: 'Singapore, Monaco, and Vatican City are commonly described as modern sovereign city-states!'
    },

    /* ==========================================================================
       TIER 2: MEDIUM
       ========================================================================== */
    {
      id: 'med-weapons-on-flags',
      tier: TIERS.MEDIUM,
      category: 'Flags & Weapons',
      prompt: 'Name countries that feature weapons and weapon symbols (rifles, swords, spears, daggers, machetes or tridents) on their national flag',
      format: 'multi',
      targetCount: 4,
      accepted: ['MOZ', 'GTM', 'SAU', 'KEN', 'OMN', 'BRB', 'LKA', 'AGO', 'SWZ'],
      hint: 'Consider Mozambique (AK-47), Guatemala (rifles), Saudi Arabia or Sri Lanka (swords), and Kenya or Eswatini (spears and shields).',
      funFact: 'Mozambique’s flag uniquely features a modern AK-47 assault rifle with attached bayonet, Guatemala displays crossed rifles, and Saudi Arabia and Sri Lanka brandish ceremonial swords.'
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
      prompt: 'Name countries commonly described as transcontinental, or Panama, which links Central and South America',
      format: 'multi',
      targetCount: 4,
      accepted: ['RUS', 'TUR', 'EGY', 'KAZ', 'AZE', 'GEO', 'PAN'],
      hint: 'Russia, Turkey, and Kazakhstan cross between Europe and Asia; Egypt spans Africa and Asia; Panama bridges North and South America.',
      funFact: 'Continental boundaries are conventions. This category includes the Caucasus convention for Georgia and Azerbaijan, and accepts Panama as an intercontinental bridge rather than claiming it lies in South America.'
    },
    {
      id: 'med-same-start-end-letter',
      tier: TIERS.MEDIUM,
      category: 'Alphabet Oddities',
      prompt: "Name countries whose common English name begins and ends with the letter A",
      format: 'multi',
      targetCount: 4,
      accepted: ['ALB', 'DZA', 'AND', 'AGO', 'ATG', 'ARG', 'ARM', 'AUS', 'AUT'],
      hint: 'Every single sovereign country fitting this rule begins and ends with the letter "A"!',
      funFact: "Nine country names in this game start and end with A: Albania, Algeria, Andorra, Angola, Antigua and Barbuda, Argentina, Armenia, Australia and Austria."
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
      prompt: 'Using the pre-2022 convention, name countries with one land neighbour, excluding overseas territories and dependencies',
      format: 'multi',
      targetCount: 4,
      accepted: ['CAN', 'PRT', 'IRL', 'GBR', 'MCO', 'SMR', 'VAT', 'LSO', 'BRN', 'KOR', 'GMB', 'DOM', 'HTI', 'QAT', 'DNK', 'PNG'],
      hint: 'Consider Canada (borders only the US), Portugal (only Spain), Ireland (only the UK), or South Korea (only North Korea).',
      funFact: 'This is a historical category: the 2022 Hans Island agreement created a land boundary between Canada and the Kingdom of Denmark. Both remain accepted here under the stated pre-2022 convention.'
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
      funFact: 'France uses 12 standard time zones when overseas territories are included. Counts that include Antarctic claims use a different scope; seasonal daylight saving is not an extra standard time zone.'
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
      prompt: 'Name a country without a formally designated capital city; a federal city or government district may serve that role',
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
      prompt: 'Name the Nordic country whose statistics agency counted 267,570 islands in its 2013 survey',
      format: 'single',
      targetCount: 1,
      accepted: ['SWE'],
      hint: 'This Scandinavian nation is famous for Stockholm, the Baltic archipelago, and IKEA.',
      funFact: 'Statistics Sweden counted 267,570 islands in its 2013 survey. Island totals depend on each survey’s definition and minimum size.'
    },
    {
      id: 'hard-zero-rivers',
      tier: TIERS.HARD,
      category: 'Extremes & Geography',
      prompt: 'Name the Arabian Peninsula kingdom containing Riyadh that has no permanent natural rivers',
      format: 'single',
      targetCount: 1,
      accepted: ['SAU'],
      hint: 'Its capital is Riyadh, and much of its territory lies on the Arabian Peninsula.',
      funFact: 'Saudi Arabia has no perennial rivers. Its water supply includes groundwater and desalination; seasonal wadis are different from permanent rivers.'
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
      prompt: 'Name the archipelago nation whose Taal volcano was famous for the nested island-and-lake feature Vulcan Point before the 2020 eruption',
      format: 'single',
      targetCount: 1,
      accepted: ['PHL'],
      hint: 'This Southeast Asian nation contains Luzon, home to the scenic Taal Volcano.',
      funFact: 'Before the January 2020 eruption, Taal’s nested lakes and islands included Vulcan Point. Eruptions can change crater-lake geography, so this question refers to the historical feature.'
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
      prompt: 'Name the Pacific island country whose Gilbert, Phoenix and Line island groups span the Equator and the 180th meridian',
      format: 'single',
      targetCount: 1,
      accepted: ['KIR'],
      hint: 'This Pacific island nation spans across both the Equator and the 180th Meridian.',
      funFact: "Kiribati's 33 atolls and islands span 3.5 million km² across both the Equator and the 180th Meridian, placing it in all four geographic hemispheres. This refers to longitude, not the International Date Line."
    },
    {
      id: 'genius-isolated-capital',
      tier: TIERS.GENIUS,
      category: 'Capital Curiosities',
      prompt: 'Name either the country of Wellington in the South Pacific or of Reykjavík in the North Atlantic',
      format: 'single',
      targetCount: 1,
      accepted: ['NZL', 'ISL'],
      hint: 'Wellington is 2,326 km away from its closest national neighbor Canberra, Australia.',
      funFact: 'Wellington is the capital of New Zealand and Reykjavík is the capital of Iceland. This question does not rank capital isolation, which depends on the comparison set and distance definition.'
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
      funFact: "Canada has the world’s longest coastline, bordering the Atlantic, Pacific and Arctic oceans. Published lengths differ with measurement scale and the treatment of islands."
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
  ].map(reviewedQuestion));

  return {
    CONTENT_VERSION,
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
