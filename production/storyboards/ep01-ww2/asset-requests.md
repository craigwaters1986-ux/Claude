# Asset requests — ep01-ww2 (from storyboard v1)

- **From:** storyboard · **Date:** 2026-11-15 · **Storyboard:** `production/storyboards/ep01-ww2/storyboard.md` (99 shots)
- **Production of these assets starts only after the user approves the storyboard (checkpoint 3).** Character work also depends on checkpoint 2.
- **Priority:**
  - **must** — the shot cannot be built without it.
  - **should** — the shot works without it, but it is clearly weaker or relies on a placeholder.
  - **could** — polish, or something that can be composed from existing parts.
- **Reuse first.** Everything not listed here is built from the existing libraries in `the-human-story/episode-01-ww2/src/`: `characters/`, `components/Environment|Effects|Vehicles|Text|Camera`, and `maps/`.
- **Global rules for every asset:**
  - Reference style: white round heads, thick ink outline, thin limbs, flat muted colours.
  - **No swastikas** and no Rising Sun naval ensign. Nazi banners are plain dark red with no emblem.
  - **No ethnic caricature.** Everyone has the same white head; nationality comes only from clothing, headgear, flags and scenery.
  - Text inside artwork is in British English and never sits in the bottom 180 px.
  - Sombre assets (camp, memorial, Hiroshima, Nagasaki, cemetery) use a desaturated palette and carry no cartoon marks.

## Summary
| Owner | must | should | could | Total |
|---|---|---|---|---|
| Animator (characters, poses, crowd, tags) | 8 | 12 | 4 | 24 |
| Environment designer: maps | 9 | 3 | 0 | 12 |
| Environment designer: backgrounds | 22 | 19 | 7 | 48 |
| Environment designer: vehicles and props | 3 | 10 | 4 | 17 |
| Environment designer: effects | 1 | 4 | 0 | 5 |
| **Environment designer total** | **35** | **36** | **11** | **82** |
| Other owners (video-editor, audio-engineer, researcher), listed for the Director to route | 4 | 5 | 0 | 9 |

---

## A. Animator (`src/characters/`, `production/characters/ep01-ww2/`)

### Must
| ID | Asset | Spec | Shots |
|---|---|---|---|
| A-01 | `japaneseSoldier` preset | Imperial Japanese Army: khaki tunic and puttees, field cap with neck flaps (variant: helmet). Plain, with no flag on the figure. An officer variant (peaked cap, sword optional) for the delegation | S04-09 (inset), S10-09 |
| A-02 | `chineseSoldier` preset | National Revolutionary Army: grey-blue or khaki tunic, flat peaked cap or helmet, puttees | S04-09, S11-04, S11-06 |
| A-03 | Japanese civilians: man, woman, child | Simple 1940s clothes (shirt and trousers; plain dress or work clothes for the woman; child). No costume stereotypes | S10-02 (silhouettes), S10-08, S11-06 |
| A-04 | Paratrooper preset + `dangle` pose | US M1 helmet with chin strap, harness straps over the tunic, legs together, arms up on the risers. It must attach to the parachute canopy prop (V-02) at the shoulder points | S08-02 |
| A-05 | Survivor poses (with `survivor` outfit) | Dignified standing (slight stoop, hands together), slow seated pose, and **receive-with-both-hands** (taking a blanket or bread). **No exaggerated emaciation** and no distress marks. Expressions: neutral, sad, tired (closed "u" eyes optional) | S09-03 |
| A-06 | Respect poses | `helmetToChest` (removes helmet or cap and holds it at the chest) and `headBowed` (head tilts down about 15°, eyes closed). Must work standing and kneeling | S06-08, S09-02, S09-03, S10-08, S11-01 |
| A-07 | `signDocument` pose | Seated or standing at a table, writing-arm cycle (small loops), head down, optional pause-and-look-up. Must hold a pen prop | S02-03, S03-08, S04-02, S09-08, S10-09, S11-02 |
| A-08 | Crowd system | Renders 20–120 small figures (scale 0.35–0.7) from a cast pool, with random hats and outfits, staggered `cheer`/`wave`/`stand` cycles, blinking and a cheap level of detail (no boil, fewer joints) to keep renders fast. Options: viewed from behind (rally), facing (VE Day), mixed-period finale | S03-01, S03-09, S06-09, S08-07, S09-09, S09-10, S11-06 |

### Should
| ID | Asset | Spec | Shots |
|---|---|---|---|
| A-09 | `japaneseDelegation` civilians | Morning coat (`suit`, dark) with `tophat`; stands stiffly | S10-09 |
| A-10 | `germanOfficer` preset | Grey tunic, peaked officer cap, no insignia beyond plain shoulder boards | S09-08 |
| A-11 | `rafPilot` preset | Flying helmet (`pilot` hat), yellow life vest over the tunic, run cycle | S05-07 |
| A-12 | `medic` / `nurse` presets | Medic: helmet and a white armband with a red cross (Red Cross emblem acceptable). Nurse: 1940s cap and apron | S08-05, S11-04 |
| A-13 | `handshake` (two-figure) | Synchronised reach-shake-release for two figures facing each other; stiff, formal timing | S03-03, S04-02 |
| A-14 | `wade` pose | High-step walk with the rifle held above the head; the body sinks to a configurable waterline | S05-04, S08-05 |
| A-15 | `liftBricks` / bucket-chain pose | Bend, lift, turn and pass; loopable, with phase offsets for a line of people | S05-10 |
| A-16 | `hug` / `comfort` (two-figure) | Adult–child and adult–adult; the adult's arm around the shoulders; a gentle sway | S04-07, S05-09, S09-09 |
| A-17 | Group label tag | Variant of `NameTag` for unnamed groups: grey or neutral (not the yellow personal tag). Texts: "GERMAN DELEGATION", "JAPANESE DELEGATION", "JAPAN'S LEADERS" | S09-08, S10-03, S10-09 |
| A-18 | `crouchRun` / `takeCover` | Low run with the head down; crouch behind cover; kneel and aim | S07-05, S08-05, S10-02 |
| A-19 | Party uniform preset | Plain brown shirt and cap, **plain red armband with no emblem** | S03-04 |
| A-20 | `holdPaperWave` with a wind-release event | Chamberlain waves the paper overhead; at a cue frame the paper detaches and becomes a free-flying prop (hand-off to a scene-level prop) | S03-09 |

### Could
| ID | Asset | Spec | Shots |
|---|---|---|---|
| A-21 | `kneelSit` (seiza) | Kneeling on the heels, hands on the thighs; listening, head bowed | S10-08 |
| A-22 | Commonwealth variant | Australian slouch hat on a British tunic | S07-04 |
| A-23 | US Marine variant | M1 helmet with a camouflage cover | S10-02 |
| A-24 | Binoculars prop pose | Raise binoculars to the eyes and hold | S07-04 (Montgomery) |

Notes for the animator:
- The "illustrative Jewish family" in S03-06 reuses ordinary civilian presets (`man2`, `woman3`, `kid2`) with no distinguishing features. It is described in the storyboard only.
- The Kaiser in S02-02 needs `pickelhaube` removal (head prop detaches to the hand). Use `holdFront` with a detachable hat if that is possible; otherwise this is should-level.
- Hirohito is **not drawn** (S10-08). Hitler is never posed in a heroic low angle and always wears his name tag.

---

## B. Environment designer (`src/components/{Environment,Effects,Vehicles}.tsx`, `src/maps/`, `production/environments/ep01-ww2/`)

### B1. Maps
| ID | Pri | Asset | Spec | Shots |
|---|---|---|---|---|
| M-01 | must | Germany 1914 and Versailles losses | A 1914 German border polygon, plus separate polygons for Alsace-Lorraine (exists), West Prussia/Posen (`LOST_TO_POLAND` exists), North Schleswig, Eupen-Malmedy, Memel, Hultschin, and Danzig Free City. Each must animate separately (outline red → slide or fade to its new owner) | S02-04 |
| M-02 | must | Czechoslovakia 1938–39 | Polygons for the Sudetenland (1938 cession, approximate), Bohemia-Moravia (Czech lands, March 1939) and Slovakia (left neutral). Also used small, on the Munich wall map | S03-08, S03-10 |
| M-03 | must | Nazi–Soviet spheres | Soviet-sphere shading for Finland, Estonia, Latvia and Bessarabia, plus the existing `MR_LINE` through Poland. **Leave Lithuania neutral** (its sphere changed in Sept 1939). Labels "GERMAN SPHERE" / "SOVIET SPHERE" | S04-03 |
| M-04 | should | 1940 campaign overlays | Arrow coordinate sets for Denmark and Norway, the Low Countries, and the Sedan → Channel "sickle" (towards Abbeville). An Allied pocket polygon around Dunkirk (approximate) | S05-02, S05-03 |
| M-05 | must | Eastern Front overlays | Add a map view east of 14°E (new `PROJ` such as `eastFront`, or a camera pan that keeps Stalingrad 44.5°E in frame). Data: front line Baltic–Black Sea (June 1941, approximate); three Axis arrows (Leningrad, Moscow, Kyiv); a measuring bracket labelled "NEARLY 3,000 KM"; a Moscow counter-attack arrow; Stalingrad pincers (Nov 1942) closing on a pocket; Bagration arrows through Belarus (June 1944) | S06-02, S07-05, S08-08 |
| M-06 | must | East Asia overlays | Manchuria 1931 (approximate) fill; China 1937 arrows (Beijing, Shanghai, Nanjing); Japanese-controlled areas in 1941 (**the researcher must verify the extents first**; if unverified, ship arrows only); Soviet August 1945 three-front arrows into Manchuria | S04-09, S06-05, S10-06 |
| M-07 | must | Pacific overlays | Midway with US and Japanese carrier icon positions; island-hopping route Guadalcanal → Saipan → Iwo Jima → Okinawa (all cities exist in `CITY`) | S07-02, S10-01 |
| M-08 | must | Normandy D-Day | Labels and approximate coordinates for the five beaches (UTAH, OMAHA, GOLD, JUNO, SWORD) and nationality colours; airborne drop zones on both flanks (parachute icons); arrows from the sea | S08-04 |
| M-09 | must | 1944–45 fronts | Italy front line (1944, approximate); western front after D-Day; Eastern Front after Bagration; converging arrows on Berlin (1945); a "Germany shrinking" fill animation | S08-01 (wall map), S08-09, S09-01 |
| M-10 | should | Map icon set | Carrier icons (US blue, Japanese red-dot); a four-carrier tally strip; parachute icon; gauge icons (MEN, FUEL, TIME) with an animatable needle | S07-02, S07-03, S08-04, S08-09 |
| M-11 | should | Globe additions | Glowing hotspot markers (Europe, Africa, Asia, Pacific) and a US + USSR highlight with an animated "crack" line between them | S06-10, S11-02 |
| M-12 | must | New city coordinates | Abbeville, Lublin (Majdanek), Oświęcim (Auschwitz), Buchenwald (near Weimar), Bergen-Belsen, Dachau, Washington, New York, San Francisco, Vladivostok, plus the five beach label points. Researcher to confirm | S05-03, S08-04, S10-06 (others optional) |

### B2. Backgrounds and environments
| ID | Pri | Asset | Spec | Shots |
|---|---|---|---|---|
| B-01 | must | Palace hall of mirrors | Long gallery: arched mirror panels, chandeliers (gentle sway), long green-cloth table | S02-03 |
| B-02 | could | WWI front | Compose from brown `Ground`, craters (new simple ellipses), `BarbedWire`, bare `Tree`s, rain | S02-02 |
| B-03 | must | New York 1929 | Wall Street façade with columns, early skyscraper skyline, a big board with an animatable plunging line | S02-07 |
| B-04 | must | Berlin 1920s–30s street + Reichstag | Reichstag with its **glass dome** (pre-1933), with windows that can light or dim; a grey street; the thin "crack" overlay | S02-06, S02-08, S03-04 |
| B-05 | must | Berlin 1945 ruins | Rubble streets, a Brandenburg Gate silhouette, ruined façades, smoke | S09-06 |
| B-06 | must | Bunker | Exterior: concrete entrance block in a rubble-strewn garden. Interior: concrete corridor, a swinging bulb, a heavy steel door that closes | S09-07 |
| B-07 | should | Meeting hall | Interior with a small stage and **plain dark-red vertical banners (no emblem)**, haze | S03-01 |
| B-08 | must | Propaganda poster wall | A wall where posters slap on one by one: abstract bold shapes (arrows, fists, rays), red, black and cream. **No readable slogans, no faces or caricatures** | S03-02 |
| B-09 | should | Newspaper office and printing press | A rotary press with spinning rollers that can wind down; shutters that slam; a padlocked door | S03-04 |
| B-10 | should | Shuttered shop | A `Street` option: one shop front with roll-down shutters (a plain "CLOSED" sign is fine; no slurs, no Star of David graffiti) | S03-06 |
| B-11 | must | Factory interiors | (a) Aircraft assembly line with a moving conveyor and open hangar doors; (b) tank line; (c) shipyard slipway with a launch animation. Reused for German rearmament (S03-06), with grey vehicles and no insignia | S03-06, S07-08, S07-09 |
| B-12 | should | Munich conference room | Interior, table, wall map (uses M-02 small) | S03-08 |
| B-13 | should | Airfields | (a) 1938 civil airfield with a crowd barrier; (b) RAF grass airfield with hangars and Spitfires parked | S03-09, S05-07 |
| B-14 | must | Kremlin and Moscow | (a) Kremlin office interior with a window showing onion domes; (b) distant Moscow skyline with onion domes for a snowy horizon | S04-02, S06-04 |
| B-15 | must | Polish border crossing | Red-and-white striped barrier pole (it can snap or lift), sentry box, fields at dawn | S04-04 |
| B-16 | could | Polish battlefield | Compose: fields, trench line (new simple trench strip), distant village | S04-05 |
| B-17 | could | Split rooms | Compose: London living room and Paris café from `Interior`, `Table`, `Radio` | S04-06 |
| B-18 | should | London railway platform | Station canopy, platform edge, a `Train` on the track, steam | S04-07 |
| B-19 | should | Western Front winter 1939–40 | Concrete bunker with an embrasure, light snow, empty fields | S05-01 |
| B-20 | could | Ardennes road | Compose: dense pine `Tree`s and a dirt road | S05-03 |
| B-21 | must | Dunkirk | Wide beach, long **East Mole** jetty with destroyers alongside, columns of troops, black oil smoke over the town skyline; the beach with little ships | S05-04 |
| B-22 | must | Paris boulevard | Eiffel Tower silhouette and Haussmann façades with balconies that can hang flags | S05-05, S08-07 |
| B-23 | should | Prime Minister's office | Desk, Union flag, window, microphone (V-07) | S05-06 |
| B-24 | must | London Underground shelter | Tiled tunnel platform, benches, a generic "UNDERGROUND" sign (**not** the TfL roundel trademark), flickering lamp | S05-09 |
| B-25 | could | London morning after | Compose: `Street damaged`, `Rubble`, St Paul's dome (`Skyline dome`) in clearing smoke | S05-10 |
| B-26 | should | Soviet border and village | Flat plain, birches, river at dawn; a village road with distant burning roofs | S06-01, S06-03 |
| B-27 | should | Snowy Moscow approach | Snow road, birch wood edge, roadside sign "MOSCOW" | S06-04 |
| B-28 | must | Pearl Harbor and Oahu airfield | (a) Harbour with Ford Island, moored battleships and green hills; (b) airfield with hangars and rows of parked aircraft | S06-06, S06-07, S06-08 |
| B-29 | should | US Congress chamber | Rostrum, lectern with microphones, US flags, tiered seats (crowd system) | S06-09 |
| B-30 | should | North African desert | Dunes and scrub, a night sky that warms to dawn | S07-04 |
| B-31 | must | Stalingrad | Ruined blocks in snow, a grain elevator silhouette, the Volga behind | S07-05 |
| B-32 | should | Allied HQ briefing room | Room with a big wall map (uses M-09) and a map table | S08-01 |
| B-33 | must | Normandy night fields | Hedgerow fields, a distant church spire, a moonlit sky | S08-02 |
| B-34 | must | D-Day beach | Sand, shingle bank, bluffs; beach obstacles (V-03); the surf line; sky transitions from day to dusk to night (FX-04) | S08-05 |
| B-35 | should | Railway at night | A railway line, telegraph poles with wires that can be cut, fields | S08-06 |
| B-36 | must | Camp perimeter | Barbed-wire fence (exists), **plain wooden gate with no inscription**, wooden watchtower, rows of barracks, grey sky, desaturated. **No interiors, no chimneys, no piles** | S09-02, S09-03 |
| B-37 | must | Memorial | Plain dark memorial wall (no symbols) lit by rows of `Candle`s in perspective | S09-04, S09-05 |
| B-38 | could | Surrender room | Compose: plain `Interior`, long `Table`, chairs | S09-08 |
| B-39 | should | VE Day London | Street with bunting (V-14), flags on buildings, crowd system | S09-09, S09-10 |
| B-40 | should | Okinawa | Muddy ridge in rain, offshore fleet silhouettes, a road | S10-02 |
| B-41 | should | Japanese interiors | (a) Plain cabinet room; (b) home interior with sliding screens and a low table with a radio | S10-03, S10-08 |
| B-42 | must | Hiroshima: before and after | Before: river-delta city of low buildings and bridges, including the domed Industrial Promotion Hall. After: flattened grey silhouette with the **skeleton of the dome**, haze. **No people** | S10-04, S10-05 |
| B-43 | must | Nagasaki: before and after | Harbour city between hills, seen across the water; an after-state in grey haze. **No people** | S10-07 |
| B-44 | must | USS *Missouri* deck | Big gun turret, deck planking, a signing table with green cloth, rails lined with sailors (crowd system), Tokyo Bay | S10-09 |
| B-45 | must | War cemetery at dusk | Rows of plain white headstones over a hill (no specific religious symbols), a single tree, low sun | S11-01 |
| B-46 | should | UN Charter hall | Stage with flags, a signing table, a flagpole for the `un` flag to rise | S11-02 |
| B-47 | could | Sunrise hill | Compose: `Hills`, `Sun`, `Clouds` for the finale crowd | S11-06 |
| B-48 | should | Chalk line-art kit for `HistoryRoom` | Animated chalk strokes (reveal like `Chalk`): line graph, boxes, converging arrows, a strike-through (still legible), a balance scale that tips (with text on its pans), small icons (ship, tank, ruined city), a dark "gap" shape, and a shadow overlay | S02-09, S07-01, S07-07, S10-10, S11-03, S11-05 |

### B3. Vehicles and props
| ID | Pri | Asset | Spec | Shots |
|---|---|---|---|---|
| V-01 | must | Glider | Horsa/Waco-like high-wing glider, olive, with an Allied star or roundel; landing glide and skid | S08-02 |
| V-02 | must | Parachute canopy | Round canopy that blooms (scale-up and wobble) with rigging lines meeting at the paratrooper's (A-04) shoulders; slow sway | S08-02 |
| V-03 | must | Beach obstacles | Steel "hedgehogs" and wooden stakes, in perspective sizes | S08-05 |
| V-04 | should | US Navy dive bomber | Dauntless-like (`PlaneKind 'dauntless'`), navy-blue upper, star insignia, dive pose with dive brakes | S07-03 |
| V-05 | should | Japanese carrier variant | Flight deck with a red hinomaru circle, island on the starboard side; **no Rising Sun ensign** | S07-03 |
| V-06 | should | T-34 tank variant | Sloped hull, rounded turret, Soviet green, red star (`mark 'star'`) | S06-04, S07-09, S09-06 |
| V-07 | should | 1940s microphones | BBC-style ribbon microphone; lectern cluster for Congress | S05-06, S06-09 |
| V-08 | should | 1930s airliner | Twin-engine airliner, silver, **no national markings**, with a door and steps | S03-09 |
| V-09 | should | Reparations cart | Hand cart with sacks; a label board reading "REPARATIONS" | S02-05 |
| V-10 | should | Ticker tape | Streamer particles plus a ticker machine | S02-07 |
| V-11 | should | Refugee hand carts | Hand carts with bundles; wheels turn | S06-03 |
| V-12 | should | Plain vertical banners | Hanging cloth banners in dark red (and other colours), **no emblem**, gently swaying | S03-01 |
| V-13 | should | New flags | `de-weimar` (black-red-gold), `roc` (Republic of China), plus optional `it` (plain tricolour), `cs` (Czechoslovakia) and `no` / `dk` | S02-06, S04-09, (S03-08, S05-02) |
| V-14 | could | Bunting and petals | Triangle-flag bunting strings; petal variant of `Particles confetti` | S08-07, S09-09 |
| V-15 | could | Japanese naval bombers | Generic carrier attack-bomber silhouettes (hinomaru) to accompany `zero` | S06-06 |
| V-16 | could | Parked US fighter | P-40-like parked aircraft, usstar | S06-07 |
| V-17 | could | Empty fuel can | Jerrycan prop for the stalled truck | S08-10 |

### B4. Effects
| ID | Pri | Asset | Spec | Shots |
|---|---|---|---|---|
| FX-01 | must | Sombre grade | A scene-level desaturation and cool-tint control (0–1), combined with `Vignette`; slows `boil` when on | S06-08, S09-02 to S09-05, S10-05, S10-07, S11-01 |
| FX-02 | should | Atomic flash variants | (a) Hiroshima: full white `ScreenFlash` with a **slow decay (~3 s) to grey**; (b) Nagasaki: a softer glow that swells behind the hill layer, then greys. No explosion graphics, no mushroom cloud (pending the user's decision) | S10-04, S10-05, S10-07 |
| FX-03 | should | Contrails | Fading white trails behind `Plane` (curling for the dogfight, straight for the high bomber) | S05-07, S10-04 |
| FX-04 | should | Time-lapse sky | Animated `Sky` gradient (day → dusk → night, plus the evening transition), with optional stars and flares | S08-05, S09-10 |
| FX-05 | should | Horizon artillery flashes | Brief flickers along the horizon line, randomised | S06-01, S07-04, S10-02 |

---

## C. Other owners (for the Director to assign; not animator or environment-designer work)
| ID | Owner | Pri | Request | Shots |
|---|---|---|---|---|
| T-01 | video-editor (`Text.tsx`) | must | `DateCard`: (1) default **y = 120** (it currently collides with `ChapterBanner` at y 32–92); (2) automatic **two-line title or auto-fit** for long titles (e.g. "SOVIET UNION INVADES EASTERN POLAND" is about 1,200 px at 52 px); (3) **`sub` text ≥ 32 px** (now 27 px; the style guide asks for ≥ 36 px for fact text). The same y = 120 default for `TermCard` | all date cards |
| T-02 | video-editor | must | **End card** component: "THE HUMAN STORY" / "History is made by people." / "SUBSCRIBE FOR THE NEXT CHAPTER" button, upper centre, held to the last frame | S11-06 |
| T-03 | video-editor (`Preview.tsx` → s01 scene) | must | (1) Remove the "WORLD WAR II 1939–1945" `BigTitle` over the map (it appears before 22.8 s); (2) the title text must read **"Episode 1: World War II"**; (3) the bench newspaper headline should read "DANZIG CRISIS" (optional); (4) s01 beats must come from the regenerated narration.json; (5) DateCard y = 120 | S01-01 to S01-06 |
| T-04 | video-editor | should | A stacked list pill (heading plus 3–4 lines, appearing one by one) for camp liberations and victim groups; a centred memorial-card style (slow 1 s fades, no bounce) | S09-03, S09-04, S09-05 |
| T-05 | video-editor (`Camera.tsx`) | should | A split-screen helper (2 or 3 panels with an ink divider and per-panel camera) | S03-06, S04-06, S07-09 |
| T-06 | video-editor | should | `ChapterBanner` numbering: s02 = CHAPTER 1 … s11 = CHAPTER 10; no banner on s01 | all sections |
| AU-01 | audio-engineer | must | Silence windows: after the Hiroshima flash (≈532.6 s, 1.5 s total silence); after the Nagasaki glow (≈549 s, 1 s); music-only solo instrument for 455.7–486.0 s; music out at Pearl Harbor (S06-08). Scored tails at 261–270, 380.8–390 and 442.5–450 s. Title sting must start ≥ 22.9 s. **No comic SFX anywhere** | see storyboard |
| AU-02 | audio-engineer | should | If the s10 budget allows (only about 0.7 s spare: 567.91 / 568.6 s), raise `pauseAfter` on **s10.b6** (Nagasaki) from 0.4 to about 0.9 s so the Nagasaki card can breathe | S10-07 |
| R-01 | researcher | should | Verify and source: (a) the extents of Japanese-controlled areas in 1941 for the S06-05 map; (b) the five D-Day beach names and nationalities, and the airborne drop-zone flanks; (c) the Versailles territorial list for M-01 and the Sudetenland outline for M-02; (d) new city coordinates (M-12) | S06-05, S08-04, S02-04, S03-10 |
