# Desktop map expansion

Status: LOCALLY VERIFIED — authorized desktop presentation fix before publication.

## Impact assessment

- Requested change: give desktop players an option to expand the map by minimizing unnecessary headers, with an obvious restore action.
- Workstreams/components: shared GameShell presentation, map toolbar, final app stylesheet and asset cache versions. Map games and Explore share the option.
- Gameplay/persistence: no engine, score, timer, route, profile, storage or multiplayer protocol changes. Layout preference lives only in memory and resets outside active map views.
- Map: keep SVG width and horizontal padding unchanged so the existing resize observer preserves the current view/zoom; existing observers handle labels and hit targets.
- Mobile/accessibility: only offered at the existing desktop breakpoint (1000px wide, 501px high). Reset on smaller viewports. Keep native keyboard button, pressed state, focus, Home/Leave/End round, statistics, continent and answer controls available.
- Performance: one media listener and a narrowly filtered page-attribute observer per mounted shell; no dependencies, requests or animation.
- Migration/rollback: no migration; revert this presentation patch and its asset versions together.
- Required QA: active round with answer and zoom preserved in both directions, desktop/laptop sizing, Explore, navigation/non-map reset, narrow portrait/short landscape, keyboard/focus and automated repository checks.
- Risk class: Level A review of protected shared shell/map integration; bounded additive display change. Publication remains a separate human owner decision under the existing release gate.

## Evidence

The map toolbar now offers Expand map / Restore layout on desktop. The expanded layout compacts navigation and statistics, removes decorative headings/profile controls, and keeps Home, End round, continent selection, zoom and answer controls available. It resets on results, Home, non-map games and smaller viewports. The option also works in Explore after a flag/Quiz game, whose existing shell metadata can retain the previous stage.

AUTOMATED VERIFIED: governance, JavaScript syntax, whitespace checks and all 166 root tests passed. Seven tests execute the actual presentation handlers, including controller callback isolation, rerender retention, navigation/media resets, idempotent mounting and the stale-stage Explore regression. Independent review found that Explore edge case; it was corrected and covered before release preparation.

MANUALLY VERIFIED WITH EVIDENCE: loopback Chrome preview, World Conquest, 1280×720 and 1440×900. Map height increased from 321.5 to 460.5px (+43.2%) and from 501.5 to 640.5px (+27.7%) respectively, with identical map widths and preserved zoom/viewBox. Found countries, score and route persisted; a further answer was accepted while expanded. The elapsed clock advanced normally. Space restored the layout while keeping focus on the same toggle. End round and Home stayed visible; End round opened the expected results and cleared expansion. An initial End round/HUD overlap was corrected by removing the absolute header's inherited grid placement and rechecked at both sizes.

Explore retained its mode/reveal/reset controls and allowed switching to Capitals while expanded. Home and active Flag Recall cleared/hid the option. At 390×844, expansion reset, the option was hidden and the existing score remained. These are local browser checks; production, physical-device and assistive-technology coverage are not claimed.

Screenshots are retained with the chat's release artifacts as `cmm-map-expanded-1280.jpg` and `cmm-map-expanded-1440.jpg`. No production publication or backend change is part of this presentation patch.
