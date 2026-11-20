# Asset requests — ep02-ww1 (from storyboard v1)

- **From:** storyboard · **Date:** 2026-11-16 · **Storyboard:** `production/storyboards/ep02-ww1/storyboard.md` (70 shots, snapped to final `narration.json`)
- **Production starts only after the user approves the storyboard (checkpoint 3).**
- **Lean mode v2:** only **MUST** items are built by default.
  - MUST: the shot cannot be built without it.
  - SHOULD: there is a working fallback. Build only if time allows. Kept to a minimum and clearly marked.
- **Reuse first.** Everything not listed here comes from `the-human-story/episode-02-ww1/src/`: `characters/` (WW1 wardrobe and presets from the style sample), `components/`, `maps/`, `scenes/kit.tsx`. See §D for the compositions that need no new component.
- **Global rules:**
  - Reference style: white round heads (all heads white, including the "canaries"), thick ink outlines, thin limbs, flat muted colours.
  - Nothing is drawn in the logo zone (x < 170, y < 150).
  - No graphic injury.
  - Revolutionary flags are plain red with no emblem.

## Summary
| Owner | MUST | SHOULD |
|---|---|---|
| Animator | 6 (A-01 to A-06) | 1 (A-S1) |
| Environment designer: sets and props | 2 (E-01, E-08) | 1 (E-S1) |
| Environment designer: maps | 5 (M-01 to M-05) | 0 |
| Environment designer: vehicles | 3 (V-01 to V-03) | 0 |
| Audio engineer | 2 (AU-01, AU-02) | 1 (AU-S1) |
| Other owners (Director to route) | 3 small tasks (§C) | — |

---

## A. Animator (`src/characters/cast.ts`, `Head.tsx`; `production/characters/ep02-ww1/`)
All are cast presets on the existing rig. Only A-05 needs a new hat shape. Real people carry a yellow `NameTag` (label and sublabel as given).

### MUST
| ID | Asset | Spec | Shots |
|---|---|---|---|
| A-01 | `sophie` preset | Woman, 1914 summer formal dress: long pale cream or white dress and a wide pale hat. Use `bonnet` or a simple wide brim; a new hat is not required. Hair in a `bun`. Seated pose in the car, waving. Tag **SOPHIE** / "his wife" | S01-01, S03-01 |
| A-02 | `tsarNicholas` preset | Short `bushy` beard and moustache, side-parted hair, khaki-green military tunic (gymnastyorka style) with modest medals, no crown. Seated signing pose (existing `seated` + pen). Tag **TSAR NICHOLAS II** / "Emperor of Russia" | S09-05 |
| A-03 | `lenin` preset | `baldFringe` hair, short goatee (`thin` facial hair or a small new chin-beard shape), dark three-piece suit and coat, flat cap (`flatCap`) optional. Speaking pose (`talkGesture`, one raised fist). Tag **VLADIMIR LENIN** / "Bolshevik leader" | S09-06 |
| A-04 | `foch` preset | `walrus` moustache, French general's kepi (`kepi1914` with dark crown and gold band accent), dark-blue or horizon-blue tunic, medals. Pointing pose (`point`). Tag **GENERAL FERDINAND FOCH** / "Allied commander, 1918" (wording subject to researcher confirmation, §C) | S10-02 |
| A-05 | `indianSoldier` preset + **new `pagri` hat** | Indian Army 1914–18: khaki tunic and trousers, puttees, `RifleSlung`. New hat `pagri`: a wrapped turban in khaki, with a neat layered dome and a small fan or tail at the side. Dignified marching. **No caricature; the head stays white**, and identity comes from uniform and hat only | S06-05 |
| A-06 | `usSoldier1918` preset | US 1918: olive-drab tunic, puttees or leggings, **Brodie-pattern helmet** (`brodie`, olive), kitbag over one shoulder (use `blanketRoll` or the `back` prop). Walking down a gangway | S09-03 |

### SHOULD (fallback in brackets)
| ID | Asset | Spec | Shots |
|---|---|---|---|
| A-S1 | `tremble` modifier | Tiny high-frequency jitter on the hands and forearms (amplitude 2–3 px), stare expression (wide eyes, flat brows), knees-up seated pose. (Fallback: existing `sitGround` + stare + slow camera.) | S05-04 |

Also reused, no work needed: the over-the-top in S07-04 is staged so figures rise from behind the parapet and walk away. No ladder-climb pose is required; the ladders are props.

---

## B. Environment designer (`src/components/`, `src/maps/`; `production/environments/ep02-ww1/`)

### B1. Sets and props — MUST
| ID | Asset | Spec | Shots |
|---|---|---|---|
| E-01 | **WW1 trench set** (`Trench` component; the library has none yet. The style-sample stand-in is the colour reference) | **Core:** side-on front-line trench with firestep, sandbag parapet and parados, timber and wicker revetment, duckboards, a flooded sump with rippling water, trench ladders, a box periscope, a dugout entrance with a gas curtain, coils of wire on stakes beyond the parapet. **Props:** small grey rats (run cycle along the duckboards and parapet), lanterns, candle stubs. **Variants (props `weather`, `time`):** (a) day and rain; (b) **winter night**, frost, stars, a distant German parapet with lanterns; (c) dawn mist and smoke; (d) **mud**: a Passchendaele crater field of water-filled shell holes, stumps and duckboard tracks across the water; (e) **over-the-parapet view** of no-man's land (wire, craters, the far parapet, bare trees); (f) **cutaway diagram**: three parallel lines (FRONT LINE · SUPPORT · RESERVE) linked by zig-zag communication trenches, with animated dots of figures filing in and out; (g) **dugout interior**: timber props, bunks, a candle, a hanging greatcoat, dust falling on a cue. Ground and figures must sit at the parapet line so that characters can stand on the firestep and look over | S04-04 (end), S04-05, S04-06, S05-01–S05-04, S07-03, S07-04, S09-04, S10-06 |
| E-08 | Dominoes (history room) | Simple cream blocks with chalk-style labels, a topple animation along a row (progress prop), plus a chalk line-art version for the board (chalk dominoes falling across a chalk outline of Europe to a "SARAJEVO" dot that glows). Trivial | S02-07 |

### B1. SHOULD
| ID | Asset | Spec | Shots |
|---|---|---|---|
| E-S1 | Poppy wreaths + poppy-petal particles | Flat red wreath rings with a black centre dot for each poppy, propped at the foot of the existing `Memorial`. Petal particles: tint `Particles confetti` poppy red, sparse and slow. (Fallback: plain red wreath circles and no petals.) | S11-05 |

### B2. Maps — MUST
All maps follow ep01 map conventions (`GeoMap`, `MapArrow`, `FrontLine`, `MapLabel`, `CityMarker`) and use flat fills.
- Entente/Allied colour: muted blue-green. Central Powers colour: muted grey-brown. Neutrals: pale.
- Labels ≥ 36 px. No labels inside x < 170, y < 150; move or drop them there.
- Mark approximate borders "approx." where research says so.

| ID | Asset | Spec | Shots |
|---|---|---|---|
| M-01 | **Europe 1914 map** (`MapEurope1914`) | **1914 borders** (new geometry, simplified is fine): German Empire (with Alsace-Lorraine, Posen, West Prussia), Austria-Hungary (with Bosnia), Russian Empire (with Poland, Finland, the Baltic), Ottoman Empire (Thrace + Anatolia), Serbia, Montenegro, Romania, Bulgaria, Greece, Albania, Italy, France, Belgium, Luxembourg, Netherlands, Switzerland, Spain, Portugal, Denmark, Norway, Sweden, UK incl. all of Ireland. **Layers and animations (all keyable):** neutral grey start; Entente fills with a solid France–Russia link and a dotted Britain link; Triple Alliance fills with Italy hatched → neutral ("NEUTRAL IN 1914"); Balkans zoom with Serbia pulse, "many peoples" dot ripple and tension arrows; German war-plan arrow through Belgium to Paris, then a second arrow east, with train icons; July Crisis sequence (envelope Vienna→Belgrade and back with a ✓✓✓✓✗ list, 48-hour dial, war-declaration arrows A-H→Serbia, Russian mobilisation ripple, Germany→Russia, →France, →Belgium with marching-figure icons, flip calendar); 1918 east→west train icons; collapse grey-outs (Bulgaria, Ottoman Empire, Austria-Hungary) with tick labels, Kiel red-flag icon, red dots spreading in Germany, crown icon Berlin→Netherlands. Sources: research §2.1, §3, §10.10–10.11 | S01-02, S02-02, S02-03, S02-05, S02-06, S03-04, S03-05, S03-08 (minis), S10-01, S10-04, S11-03 (start) |
| M-02 | **Western Front map** (`MapWesternFront`) | Belgium, northern France, the Channel coast and the Swiss border. **Cities and places:** Paris, Mons, Ypres, Arras, Amiens, the Somme, Verdun, Compiègne, Nieuport. **Animations:** (1) German advance arrows Aug–Sept 1914 through Belgium; a British arrow at Mons that bends back; (2) Marne halt and retreat to the Aisne; (3) leapfrogging "race to the sea" arrow pairs; (4) `FrontLine` Belgian coast → Swiss border (~700 km, research 4.7) with a draw-on progress and a final zoom into a trench zig-zag (match into E-01); (5) Verdun convergence; Somme arrow with a dashed link to Verdun; Somme close-up where the line creeps "a few miles"; (6) 1918 Spring Offensive bulge towards Amiens (up to 64 km); Hundred Days push back to about Mons by 11 Nov. Also a small `WallMap` inset version for Foch's HQ | S04-02, S04-04, S07-01, S07-03, S07-06, S10-01, S10-02 (inset), S10-04 |
| M-03 | **Eastern Front map** (`MapEasternFront`, can use the existing `eastFront` projection) | East Prussia, Russian Poland, Galicia, the Baltic. **Animations:** Tannenberg (a Russian arrow into East Prussia, German pincers, the arrow breaks up); **Brest-Litovsk 1918**: hatch over the lands given up (Baltic, Poland, Ukraine, Finland), labelled "approx.", and the front line vanishing. Research 6.1, 9.7 | S06-01, S09-06 |
| M-04 | **Gallipoli map** (`MapGallipoli`) | Dardanelles straits, Gallipoli peninsula, labels **CAPE HELLES**, **ANZAC COVE** (Suvla optional), inset showing Constantinople and the Ottoman–German link line. Ship icons and landing arrows (25 April 1915). Research 6.5–6.8 | S06-02 |
| M-05 | **Europe 1919–23 map** (`MapEurope1919`) | Morph from M-01 (`lerpLine` per border). Empire fills crack and fade in order: German, Austro-Hungarian, Russian, Ottoman. New states fill and label in sequence: Poland, Czechoslovakia, Austria, Hungary, Kingdom of Serbs, Croats and Slovenes, Estonia, Latvia, Lithuania, Finland. Hatch the disputed eastern borders and add the corner note "BORDERS APPROXIMATE". Apply ep01 memory rules (Danzig Free City; Memel to Lithuania only in 1923; Saar under the League; Rhineland demilitarised, not lost). Research 11.7, 11.8. (Germany's losses in S11-07 reuse the existing ep01 `MapVersailles`) | S11-03 |

### B3. Vehicles — MUST
| ID | Asset | Spec | Shots |
|---|---|---|---|
| V-01 | **1914 open touring car** | Long-bonnet open car, dark green or black, spoked wheels, running boards, folded hood at the back, two small pennant flags on the front wings. Seats for a driver in front and two passengers behind, with the passengers' upper bodies visible. Animations: drive, slow down, a turn (a three-quarter angle frame or a simple turn-in), stop and stall. A second colour variant for the escort car. Also a static close-up of the empty back seat with a hat prop (from `plumedHat`) | S01-01, S01-02, S03-01, S03-02 |
| V-02 | **WW1 rhomboid tank (Mark V style)** | Lozenge-shaped hull with tracks running round the whole body, side sponsons with short gun barrels, a small cab on top, exhaust smoke. Muted khaki-brown, with no national markings needed. Track cycle animation; scale variants for depth staging (near, mid, far silhouettes in mist). Research 10.7 (~450 tanks at Amiens) | S10-03 |
| V-03 | **U-boat periscope + torpedo wake** | A small periscope head with a white feather wake, moving across the existing `Sea`, plus a torpedo wake line (a thin white streak with bubbles) and a distant water column at a ship's hull (no fire on people). A full surfaced U-boat is not needed | S09-01 |

---

## C. Other owners (for the Director to route)

### Audio engineer — MUST
| ID | Item | Spec | Shots |
|---|---|---|---|
| AU-01 | SFX set (restrained, licensed or original; record licences in credits) | Distant pistol reports ×2 (dry, short, no echo FX); pigeon wing burst; car engine, brakes and stall (1914); crowd murmur and applause; clock ticks; big-clock chime ×11; paper and newspaper whooshes; steam train departure and whistle; distant artillery rumble and far shell crumps (**no close explosions, no impact or bullet-hit sounds anywhere**); officer whistles; rain, mud suction, water slosh; rat scurry (quiet); gas-mask straps and muffled breathing; candle hiss; Morse ticking and pencil scratch; harbour gulls and gangway boots; tank engine and track clank; forest dawn ambience (owl, leaves); a pocket watch tick; wind beds for all the sombre shots; wooden domino clacks | all (see the storyboard SFX column) |
| AU-02 | Music and special cues | Original or licensed score following the per-section moods in the storyboard. Special cues: **hummed "Silent Night"** (public-domain melody, original performance, distant and soft) for S04-05–S04-06; the **s02→s03 tail** (100.4–110.0) carried musically under the falling dominoes; title sting ≥ 27.8 s; **1.0 s of total silence at 11:00** (≈609.5 s, S10-06); a single sustained instrument with no percussion for the Armenian Genocide (S06-06–S06-07), the Somme first day (S07-04) and remembrance (S11-05) | S01-04, S02-07, S04-05, S04-06, S06-06, S06-07, S07-04, S10-06, S11-05 |

### Audio engineer — SHOULD
| ID | Item | Spec | Shots |
|---|---|---|---|
| AU-S1 | Short solo bugle phrase | An original recording (no commercial recording) of a few bars in a Last Post style, very quiet, under the poem tail (≈684.7–685.7). Fallback: wind only | S11-05 |

### Video editor (assembly; small)
- Lift the ep01 `Station` composition (`scenes/S04.tsx`, line ~190) into `scenes/kit.tsx` for S04-01 and S08-03.
- Update the `EndCard` text to **WATCH NEXT: WW2 — FROM START TO FINISH**.
- Set `ChapterBanner` titles to the ten chapter names in storyboard §1.4.

### Researcher (one quick check, sonnet)
- Foch's name-tag wording for spring and summer 1918: "GENERAL FERDINAND FOCH — Allied commander, 1918". He was made Marshal in August 1918, which is general knowledge and not yet in the research file.
- George Ellison's headstone initials ("G. E. ELLISON"), or use "G. ELLISON".
- Add sources for these two to `research-notes.md`.

---

## D. Built from existing parts (no new component; listed so nobody builds them twice)
| Need | Existing parts | Shots |
|---|---|---|
| Sarajevo riverside street, 1914 | `Street` + `Building` (cream and ochre palette, red roofs), `Flag`, low quay wall + river strip, `Hills`, `Crowd` | S01-01, S01-02, S03-01, S03-02 |
| Empty helmets of every army on posts | `HatShape` (brodie, adrian, pickelhaube, stahlhelm, serviceCap, feldkappe, kabalak) on plain posts, mist | S01-03, S10-06 |
| Shipyards and dreadnoughts | `Factory kind="shipyard"`, `Ship kind="warship"` | S02-04 |
| Berlin ministry office, intelligence office, palace study, HQ, kitchen, schoolroom, munitions bench | `Interior`, `Table`, `Chair`, `Document`, `WallMap`, `Shell`, `Candle` | S03-03, S09-02, S09-05, S10-02, S08-05, S08-04, S08-02 |
| London night street with a clock tower | `Street` (lit), `StreetLamp`, `Building` + clock-face prop, `Newspaper` | S03-06 |
| Marne fields, French road, Amiens farmland, Verdun hills | `Hills`, `Ground`, `Tree` (incl. bare), `Crater`, `Rubble`, `Smoke`, mist | S04-03, S06-05, S07-02, S10-03 |
| Gallipoli cliffs and evacuation | steep `Hills`, `Sea`, `SmallBoat`, `Ship` | S06-03 |
| Armenian Genocide: empty town street, desert at dusk | `Building` (plain stone), `Ground` sand + `Hills` + dusk `Sky`, `DistantFigures`, `Candle`, `SombreGrade` | S06-06, S06-07 |
| Hospital train, troopship quay, Compiègne carriage | `Train` (red-cross boards; a single lit carriage), `Ship kind="liner"`, `Tree` bare | S08-03, S09-03, S10-05 |
| Globe sequences (trade, fronts, Empire troops, flu) | `Globe`, `GlobeHotspot`, `MapArrow` | S02-01, S06-01, S06-04, S11-02 |
| Cemeteries and memorial | `Cemetery` (wide rows; the close St Symphorien variant with two facing headstones), `Memorial`, `Crowd action="still"` | S11-01, S11-04, S11-05 |
| Versailles | `HallOfMirrors`, `Document`, `Pen`; `MapVersailles` | S11-06, S11-07 |
| Petrograd and Kiel | `Building`, `Truck`, `PlainBanner` (plain red), `Crowd` | S09-05, S09-06 |
