# Geo Quiz content review

Status: **VERIFIED CURRENT ARCHITECTURE** for review metadata and scoped corrections. Edited 2026-09-22–23; content version `quiz-52-20260923-source1` identifies the latest answer-set and copy review. Physical-device and production Quiz journeys remain **NEEDS QA**.

All 52 questions now carry a source/reference, scope, local dataset path, review type, edit date, content version and explicit bonus rationale where applicable. The 39 questions that previously had only editorial review received independent source cross-checks on 2026-09-23; the earlier 13 retain their source checks. `verifiedAt` records the check date. The source and note attached to each question describe what was checked; one reference alone does not prove every possible interpretation of a broad category. Automated tests establish schema, playable codes, feasible targets, no duplicate answers, disclosed exceptions and A-to-A name completeness.

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

## 2026-09-23 full-bank source pass

The remaining 39 prompts, accepted sets, hints and facts were reviewed against named sources and the actual 195-country game dataset/flag assets. Name categories used the [FCDO short-name index](https://www.gov.uk/government/publications/geographical-names-and-information) or [UN M49](https://unstats.un.org/unsd/methodology/m49/); capital, boundary, flag and physical-geography claims used the more specific references in the register below. For line-intersection and nearest-coast questions, a separate geometry check of the game's [Natural Earth](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) country polygons supported the accepted set. That geometry check uses the same underlying coastline source as the game and is resolution-dependent, so it is not a survey-grade measurement.

- The flag-weapons question now accepts Bolivia, Haiti, Iran and the Dominican Republic, whose displayed flag variants include firearms, a stylized sword, or spears. The wording explicitly covers arms inside coats of arms and only the game's flag variants. [Bolivia's embassy](https://bolivianembassy.ca/bolivia/el-pais/simbolos-patrios/escudo-de-armas/), [Haiti's embassy](https://www.haiti.org/flag-and-coat-of-arms/), and the [Dominican national-symbol law](https://senado.gov.do/masterlex/MLX/docs/1C/2/11/18/1E4E.htm) document the arms; the [Portland Flag Association](https://portlandflag.org/wp-content/uploads/2010/05/vexilloid-tabloid-021-apr09.pdf) describes the sword in Iran's emblem. Other tools and alternate civil/state flag variants are outside this prompt.
- The Atlantic/Mediterranean question now specifies mainland coastlines. [UNEP's Mediterranean membership](https://www.unep.org/unepmap/node/19634) and [European coastal data](https://www.eea.europa.eu/en/analysis/publications/92-9167-001-4/page017.html) informed the scope. Overseas possessions would make the earlier unqualified “only three” wording unreliable.
- The Nordic-cross fact distinguishes Denmark's 1219 [origin legend](https://denmark.dk/people-and-culture/dannebrog-800-years) from documented later flag history. The [Kazungula bridge assessment](https://www.afdb.org/sites/default/files/documents/environmental-and-social-assessments/botswana_and_zambia-kazungula_bridge-esia_summary.pdf) supports four nearby countries, not the former exact-distance or world-superlative wording. The [Panama Canal engineering report](https://pancanal.com/wp-content/uploads/2024/04/1999_Panama-Canal-Reconnaissance-Volume-I-USACE.pdf) supports the northwest-to-southeast description. The Wellington/Reykjavík question no longer gives an unsupported distance.
- Smaller edits remove an unsupported Bangladesh etymology, describe Poland's red/white flag as the opposite *stripe order*, explain “Ivory” in Ivory Coast, remove an unneeded global Borneo rarity claim, and scope the Null Island nearest-country result to the game coastline data.

## Per-question review register

“Source cross-check” covers the specific scope note in code. The linked reference is an entry point; where a claim needs multiple sources, the note in code and the section above identify the additional basis. These checks do not substitute for physical-device or production QA.

| Question | Review | Reference |
| --- | --- | --- |
| `easy-ends-in-h` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `easy-cardinal-directions` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `easy-starts-q-or-y` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `easy-country-equals-capital` | Source cross-check | [Reference](https://unstats.un.org/unsd/ungegn/sessions/2019-new-york-ungegn-1st-session/documents/GEGN.2_2019_CRP.131_Rev.1_World_Capital_City_Names.pdf) |
| `easy-non-rectangular-flag` | Source cross-check | [Reference](https://peacemaker.un.org/sites/default/files/document/files/2022/07/npinterimconstitutionwith8amendments2007_0.pdf) |
| `easy-island-continent` | Source cross-check | [Reference](https://www.dfat.gov.au/about-us/publications/australia-in-brief) |
| `easy-three-capitals` | Source cross-check | [Reference](https://www.gov.za/south-africa-glance) |
| `easy-four-letter-nations` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `easy-square-flags` | Source cross-check | [Reference](https://www.aboutswitzerland.eda.admin.ch/en/swiss-flag) |
| `easy-starts-z` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `easy-guinea-names` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `easy-united-names` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `easy-union-jack-flags` | Source cross-check | [Reference](https://www.anbg.gov.au/oz/flag-similar.html) |
| `easy-landlocked-south-america` | Source cross-check | [Reference](https://www.un.org/ohrlls/sites/www.un.org.ohrlls/files/lldcs_publications/05-33151_geography_sm.pdf) |
| `easy-saint-countries` | Source cross-check | [Reference](https://unstats.un.org/unsd/methodology/m49/) |
| `easy-equator-south-america` | Source cross-check | [Reference](https://www.timeanddate.com/geography/equator.html) |
| `easy-ends-land` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `easy-city-states` | Source cross-check | [Reference](https://www.mfa.gov.sg/about-singapore/) |
| `med-weapons-on-flags` | Source cross-check | [Reference](https://digitallibrary.un.org/record/4022558/files/1384517_EN.pdf) |
| `med-single-border-enclaves` | Source cross-check | [Reference](https://digitallibrary.un.org/record/3975846/files/A_CONF.62_C.2_SR.33-EN.pdf) |
| `med-transcontinental` | Source cross-check | [Reference](https://ggim.un.org/country-reports/documents/Egypt-2016-country-report.pdf) |
| `med-same-start-end-letter` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `med-bicolor-stripes` | Source cross-check | [Reference](https://www.gov.pl/web/diplomacy/polands-day-of-the-flag) |
| `med-spanish-in-africa` | Source cross-check | [Reference](https://ungegn.un.org/dashboard/countries/details?id=226) |
| `med-colors-in-name` | Source cross-check | [Reference](https://www.gov.uk/government/publications/geographical-names-and-information) |
| `med-one-land-border` | Source cross-check | [Reference](https://www.canada.ca/en/global-affairs/news/2022/06/boundary-dispute.html) |
| `med-double-landlocked` | Source cross-check | [Reference](https://www.un.org/ohrlls/sites/www.un.org.ohrlls/files/lldcs_publications/economic-growth-in-developing-countries-is-landlockedness-destiny.pdf) |
| `med-prime-meridian` | Source cross-check | [Reference](https://www.rmg.co.uk/stories/time/what-prime-meridian-why-it-greenwich) |
| `med-danube-capitals` | Source cross-check | [Reference](https://www.icpdr.org/danube-basin/danube-river-basin/danube-river-basin-overview-map) |
| `med-tropic-capricorn` | Source cross-check | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `med-black-sea-countries` | Source cross-check | [Reference](https://www.un.org/depts/los/LEGISLATIONANDTREATIES/black_sea.htm) |
| `med-caspian-countries` | Source cross-check | [Reference](https://azerbaijan.un.org/en/96648-un-secretary-general-welcomes-signing-convention-legal-status-caspian-sea) |
| `med-atlantic-mediterranean` | Source cross-check | [Reference](https://www.unep.org/unepmap/node/19634) |
| `med-nordic-cross` | Source cross-check | [Reference](https://www.norden.org/en/information/nordic-flags) |
| `med-borneo-three` | Source cross-check | [Reference](https://seea.un.org/file/20022/download?token=Oz0oH2d2) |
| `med-mekong-countries` | Source cross-check | [Reference](https://www.mrcmekong.org/mekong-river-basin/) |
| `hard-doubly-landlocked` | Source cross-check | [Reference](https://www.un.org/ohrlls/sites/www.un.org.ohrlls/files/lldcs_publications/economic-growth-in-developing-countries-is-landlockedness-destiny.pdf) |
| `hard-most-time-zones` | Source cross-check | [Reference](https://www.timeanddate.com/time/zone/france) |
| `hard-null-island` | Source cross-check | [Reference](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) |
| `hard-14-neighbors` | Source cross-check | [Reference](https://www.un.org/esa/earthsummit/rusia-cp.htm) |
| `hard-no-capital` | Source cross-check | [Reference](https://www.aboutswitzerland.eda.admin.ch/en/political-system) |
| `hard-highest-capital` | Source cross-check | [Reference](https://data.un.org/en/iso/bo.html) |
| `hard-most-islands` | Source cross-check | [Reference](https://www.scb.se/en/finding-statistics/statistics-by-subject-area/housing-construction-and-building/land-use/land-use-in-proximity-to-shoreline/pong/statistical-news/coast-shores-and-islands-in-sweden-2013/) |
| `hard-zero-rivers` | Source cross-check | [Reference](https://cdmdna.gov.sa/Resources/119/bur2.pdf) |
| `genius-kazungula-quadripoint` | Source cross-check | [Reference](https://www.afdb.org/sites/default/files/documents/environmental-and-social-assessments/botswana_and_zambia-kazungula_bridge-esia_summary.pdf) |
| `genius-vulcan-point` | Source cross-check | [Reference](https://science.nasa.gov/earth/earth-observatory/sulfur-spews-from-taal-146142/) |
| `genius-southernmost-capital` | Source cross-check | [Reference](https://wellington.govt.nz/-/media/your-council/plans-policies-and-bylaws/plans-and-policies/annualreport/2022-23/annual-report-2022-23-summary.pdf) |
| `genius-panama-canal-direction` | Source cross-check | [Reference](https://pancanal.com/wp-content/uploads/2024/04/1999_Panama-Canal-Reconnaissance-Volume-I-USACE.pdf) |
| `genius-all-four-hemispheres` | Source cross-check | [Reference](https://visitkiribati.travel/wp-content/uploads/2019/05/Kiribati-Travel-Information-2019.pdf) |
| `genius-isolated-capital` | Source cross-check | [Reference](https://data.un.org/en/iso/is.html) |
| `genius-longest-coastline` | Source cross-check | [Reference](https://www.canada.ca/en/services/environment/our-environment/nature-based-climate-solutions/coastlines.html) |
| `genius-baarle-enclaves` | Source cross-check | [Reference](https://www.baarle-nassau.nl/fileadmin/Bestanden_BaarleNassau/Projecten/Masterplan_Centrum_Baarle.pdf) |

## Maintenance and remaining work

For future edits, review the complete prompt, accepted set, hint and fun fact together; scope political boundaries, dates and common-name conventions explicitly. Bump `CONTENT_VERSION` when meaning or accepted answers change so new results cannot compete against old content. Preserve intentional bonuses with a rationale. Recheck the linked sources and game assets after future source or asset changes. No new question pack was added in this pass.
