# Geo Quiz content review

Status: **VERIFIED CURRENT ARCHITECTURE** for review metadata and scoped corrections; **NEEDS QA** for independent verification of every descriptive fact. Edited 2026-09-22–23; content version `quiz-52-20260922` identifies this repair batch.

All 52 questions now carry a source/reference, scope, local dataset path, review type, edit date, content version and explicit bonus rationale where applicable. `verifiedAt` is populated only for the 11 targeted source cross-checks listed below. An editorial consistency review does **not** certify every claim in a question. Automated tests establish schema, playable codes, feasible targets, no duplicate answers, disclosed exceptions and A-to-A name completeness.

## Corrections

- Directional names explicitly accept East Timor as a common name and Central African Republic as an intentional bonus. The previous prompt hid the bonus convention.
- Shared capital names explicitly allow suffixes such as City and la Vella.
- The A-to-A category now accepts Albania and Antigua and Barbuda; its description correctly lists nine. The prior broad “same starting and ending letter” wording did not describe its A-only answer set.
- The broad no-rivers question had an unreliable answer set. It now explicitly asks for the Arabian Peninsula kingdom containing Riyadh and accepts Saudi Arabia, supported by its national report. These two answer-set corrections are intentional content fixes; core recognition/scoring is unchanged.
- One-land-neighbour uses an explicit pre-2022 convention, excluding overseas territories/dependencies. The Canada/Denmark Hans Island boundary is explained rather than silently treated as absent today.
- Continental conventions are disclosed, including Caucasus countries and Panama as a bridge rather than falsely placing it in South America.
- Nauru/Switzerland wording no longer claims only one eligible country. The [Nauru national communication](https://nauru-data.sprep.org/system/files/nru_nc2.pdf) and Swiss federal-city terminology inform this distinction.
- Sweden's question asks about its documented 2013 survey instead of claiming standardized worldwide island counts. France's fact uses 12 standard time zones with overseas scope. Coastline length avoids false precision.
- Taal/Vulcan Point is explicitly historical before the 2020 eruption. Kiribati refers to physical hemispheres rather than claiming unsupported uniqueness or conflating longitude with the date line.
- The unsupported isolated-capital ranking was replaced with an explicit Wellington/Reykjavík capital question using the same answer set.
- Other bounded edits correct the Europe hint for names ending in “land”, disclose tridents among flag weapons, soften city-state terminology and remove speculative Nepal symbolism.

## Per-question review register

“Source cross-check” covers the specific scope note in code. “Editorial” means internal consistency and reference attribution, with independent verification still open. Generic reference datasets are not presented as proof of all accompanying fun facts.

| Question | Review | Reference |
| --- | --- | --- |
| `easy-ends-in-h` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-cardinal-directions` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-starts-q-or-y` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-country-equals-capital` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `easy-non-rectangular-flag` | Editorial; independent fact check pending | [Reference](https://github.com/hampusborgos/country-flags) |
| `easy-island-continent` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `easy-three-capitals` | Source cross-check | [Reference](https://www.gov.za/south-africa-glance) |
| `easy-four-letter-nations` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-square-flags` | Editorial; independent fact check pending | [Reference](https://github.com/hampusborgos/country-flags) |
| `easy-starts-z` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-guinea-names` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-united-names` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-union-jack-flags` | Editorial; independent fact check pending | [Reference](https://github.com/hampusborgos/country-flags) |
| `easy-landlocked-south-america` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `easy-saint-countries` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-equator-south-america` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `easy-ends-land` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-city-states` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-weapons-on-flags` | Editorial; independent fact check pending | [Reference](https://github.com/hampusborgos/country-flags) |
| `med-single-border-enclaves` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-transcontinental` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-same-start-end-letter` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `med-bicolor-stripes` | Editorial; independent fact check pending | [Reference](https://github.com/hampusborgos/country-flags) |
| `med-spanish-in-africa` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-colors-in-name` | Editorial; independent fact check pending | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `med-one-land-border` | Source cross-check | [Reference](https://www.canada.ca/en/global-affairs/news/2022/06/boundary-dispute.html) |
| `med-double-landlocked` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-prime-meridian` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-danube-capitals` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-tropic-capricorn` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-black-sea-countries` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-caspian-countries` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-atlantic-mediterranean` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-nordic-cross` | Editorial; independent fact check pending | [Reference](https://github.com/hampusborgos/country-flags) |
| `med-borneo-three` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-mekong-countries` | Source cross-check | [Reference](https://www.mrcmekong.org/mekong-river-basin/) |
| `hard-doubly-landlocked` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `hard-most-time-zones` | Source cross-check | [Reference](https://www.timeanddate.com/time/zone/france) |
| `hard-null-island` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `hard-14-neighbors` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `hard-no-capital` | Source cross-check | [Reference](https://www.aboutswitzerland.eda.admin.ch/en/political-system) |
| `hard-highest-capital` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `hard-most-islands` | Source cross-check | [Reference](https://www.scb.se/en/finding-statistics/statistics-by-subject-area/housing-construction-and-building/land-use/land-use-in-proximity-to-shoreline/pong/statistical-news/coast-shores-and-islands-in-sweden-2013/) |
| `hard-zero-rivers` | Source cross-check | [Reference](https://cdmdna.gov.sa/Resources/119/bur2.pdf) |
| `genius-kazungula-quadripoint` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `genius-vulcan-point` | Source cross-check | [Reference](https://science.nasa.gov/earth/earth-observatory/sulfur-spews-from-taal-146142/) |
| `genius-southernmost-capital` | Source cross-check | [Reference](https://wellington.govt.nz/-/media/your-council/plans-policies-and-bylaws/plans-and-policies/annualreport/2022-23/annual-report-2022-23-summary.pdf) |
| `genius-panama-canal-direction` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `genius-all-four-hemispheres` | Source cross-check | [Reference](https://visitkiribati.travel/wp-content/uploads/2019/05/Kiribati-Travel-Information-2019.pdf) |
| `genius-isolated-capital` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `genius-longest-coastline` | Source cross-check | [Reference](https://www.canada.ca/en/services/environment/our-environment/nature-based-climate-solutions/coastlines.html) |
| `genius-baarle-enclaves` | Editorial; independent fact check pending | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |

## Maintenance and remaining work

For future edits, review the complete prompt, accepted set, hint and fun fact together; scope political boundaries, dates and common-name conventions explicitly. Bump `CONTENT_VERSION` when meaning or accepted answers change so new results cannot compete against old content. Preserve intentional bonuses with a rationale. Targeted source cross-checks do not certify the other 41 questions. Their independent editorial sign-off remains open and is reported rather than mislabelled verified. No new question pack was added in this defect pass.
