# Map and environment notes: ep02-ww1 (environment designer, Phase C)

Engine: `the-human-story/episode-02-ww1/src/`. All new assets are pure functions of `f` (frame) plus
**progress props** (0..1 unless stated), so the video editor keys them from beats, for example
`entente={prog(f, at(2), at(2) + 30)}`. Nothing in this package reads `useCurrentFrame` by itself.

Contact sheets (lean mode, `--scale=0.5` stills of a 3840×2160 grid, so each panel is 640×360):
`maps-sheet-A.png` (M-01), `maps-sheet-B.png` (M-02), `maps-sheet-C.png` (M-03, M-04, M-05, wall map),
`sheet-Env.png` (E-01 a–g, E-08), `sheet-Vehicles.png` (V-01, V-02, V-03, E-S1). The magenta dashed box
on every panel marks the logo keep-clear zone (x < 170, y < 150).
Preview entry: `npx remotion still src/maps/__preview__/index.ts WW1MapsA|WW1MapsB|WW1MapsC|WW1Env|WW1Vehicles out.png --scale=0.5`.

---

## 1. How the historical maps are built (read this before changing a border)

- **Base geography:** Natural Earth 1:50m land and countries (`world-atlas`, public domain); 1:10m land
  clipped to the Dardanelles for M-04 (`src/maps/data/gallipoli-land-10m.json`, Sutherland–Hodgman clip, 533 points).
- **States are ordered mask operations** (`src/maps/ww1.ts`, `STATES_1914`, `STATES_1919`): add or subtract
  a modern 1:50m country, or a hand-plotted polygon. Example, Austria-Hungary 1914 = Galicia+Bukovina polygon
  + Austria + Hungary + Czechia + Slovakia + Slovenia + Croatia + Bosnia + Romania − Old-Kingdom Romania − Moldova
  + Vojvodina + Trentino + Litorale − Switzerland. Modern borders that already match the 1914 line are reused
  exactly; only the changed lines are hand-plotted.
- **Rendering** (`src/maps/StateMap.tsx`, `StateLayer`): each state is drawn through SVG **clip paths**
  (even-odd "box minus subtractions"), not masks. Masks were tried first and failed in headless Chrome
  once a frame held about a dozen large masks: parts of the frame lost their mask (straight-edged bands).
  Clip paths are vector and exact at any zoom. Each state is an independent opaque shape, so it can fade,
  hatch, pulse or get an inner edge band (`edge`, via `feMorphology`) without seams.
- **Borders:** faint lines = modern 1:50m borders between countries that belonged to different 1914 (or 1923)
  states, minus listed pairs that were not borders then (`MESH_EXCLUDE_1914/1919`), plus the hand-plotted
  lines (`LINES_1914`, outlines of `LINES_1919`).
- **Ids:** clip/pattern/filter ids carry the map's `idSuffix` and the camera. When two maps of the **same kind
  and the same camera** are on screen at once (rare), give them different `idSuffix` values. The Western
  Front's occupied-area hatch depends on the front line, so two Western Front maps crossfading with the same
  camera but different fronts also need different `idSuffix` values.
- **Colours** (`P14`, `P19` in `ww1.ts`): Entente muted blue-green `#6F9C93` (deep `#557F77`, light
  `#A9C7BE` for Britain's looser ties), Central Powers muted grey-brown `#9C8C75` (deep `#7D6E59`), neutrals
  pale `#EDE5D0`, "neutral grey start" `#BDB8AC`, non-European land `#DCD2BA`. All opaque.
- **Labels:** every map label is ≥ 36 px (state names 40–44 px). `SafeLabel` drops any label whose box would
  touch the logo zone or leave the frame. Wall-map and inset labels are sized so that they are ≥ 36 px **on screen**.

## 2. Sources and simplifications (borders and dates)

| Item | Date shown | Basis / source | Simplification and confidence |
|---|---|---|---|
| German–Russian border 1914 (`GR_BORDER_1914`) | 1914 | Memel–East Prussia segments reuse the R-01-checked ep01 rings (Memel, East Prussia 1920 south edge, Posen/West Prussia rings in `geo.ts`/`versailles.ts`, from `production/research/ep01-ww2/map-sources.md` §3); Kalisz–Częstochowa–Myslowitz plotted from the known border towns (Skalmierzyce/Kalisz, Wieruszów/Kępno, Praszka, Herby, Sosnowiec/Myslowitz) | ±10 km; standard atlas line. MEDIUM-HIGH |
| Austro-Russian border 1914 (`AR_BORDER_1914`) | 1914 | Three Emperors' Corner – Vistula (Kraków Austrian) – San mouth (Zawichost) – north of Rawa Ruska/Sokal – Brody/Radyvyliv – Zbruch (Pidvolochysk/Volochysk, Husiatyn) – Dniester – Bukovina | ±10–15 km. MEDIUM-HIGH |
| Romania (Old Kingdom) – Austria-Hungary 1914 (`ROMANIA_AH_1914`) | 1914 | Carpathian crest from the Iron Gates (Vârciorova) to the Bukovina border (Suceava Austrian, Burdujeni/Herța Romanian) | crest simplified, ±10 km. MEDIUM |
| Southern Dobruja Romanian 1913–40 (`DOBRUJA_LINE_1913`) | 1914, 1923 | Treaty of Bucharest 1913: Tutrakan–Ekrene line | ±10 km. HIGH (event) / MEDIUM (line) |
| Western Thrace Bulgarian 1913–19 (`WESTERN_THRACE`) | 1914 | Mesta–Maritsa coast to Bulgaria (Treaty of Bucharest 1913) | simplified. MEDIUM |
| Vojvodina / Srem (Hungary) – Serbia 1914 | 1914 | Sava and Danube (Belgrade Serbian, Zemun/Pančevo Hungarian) | river line simplified. HIGH |
| Trentino–South Tyrol and Gorizia–Trieste Austrian 1914 | 1914 | Stelvio–Tonale–Garda (Riva Austrian)–Asiago–Cortina (Austrian)–Carnic Alps; Isonzo line (Cormons Austrian, Cividale Italian) | ±10 km. MEDIUM |
| North Schleswig German 1864–1920; Alsace-Lorraine German 1871–1918 | 1914 | R-01-checked ep01 rings (`versailles.ts`, `geo.ts`) | as ep01 |
| Kars/Ardahan Russian 1878–1918 | 1914 | schematic polygon (off-frame in most shots) | LOW-MEDIUM; not labelled |
| Eupen-Malmedy (German 1914) | — | **not shown** (too small at Europe scale) | simplification |
| Ireland | 1914 | part of the UK in 1914 (whole island) | HIGH |
| Ottoman Empire | 1914 | Turkey + Levant + Iraq (modern countries); Arabian claims not filled | simplified (Arabia off-frame) |
| Western Front, winter 1914–15 → 1917 (`WF_1915`) | S04-04, S07 | Nieuport–Dixmude–Ypres salient–Armentières–La Bassée–Vimy/Arras–Hébuterne–Albert–Roye–Noyon (German)–Soissons–Craonne–Reims–Champagne–Argonne–Verdun–St-Mihiel salient–Pont-à-Mousson–Lorraine–Vosges–Thann (French)–Swiss border | plotted line = **660 km** (smoothed); research 4.7 says "about 700 km": label it "about 700 km", never "660". MEDIUM-HIGH |
| Middle sector March 1918 / April 1918 (`WF_MID_MAR1918`, `WF_MID_APR1918`) | S10-01 | Hindenburg-Line front (Croisilles–Flesquières–St-Quentin–La Fère) → bulge to Albert–Villers-Bretonneux–Moreuil–Montdidier–Noyon; research 10.3 "up to c. 64 km, held east of Amiens by 5 April" | ±10 km. MEDIUM |
| 11 November 1918 line (`WF_NOV1918`) | S10-04 | Dutch border near Ghent – Mons (research 10.15) – Maubeuge – Sedan – Meuse – Pont-à-Mousson – Vosges | simplified. MEDIUM |
| Somme 1 July → 18 November 1916 (`SOMME_JUL1916/NOV1916`) | S07-06 | research 7.10: "a few miles" (max ~6–7 miles) | schematic sliver; label says "A FEW MILES" only |
| German advance 1914, Mons, Marne→Aisne, race to the sea, Verdun, Voie Sacrée | S04-02/04, S07-01 | research 4.1, 4.4, 4.6, 7.1–7.2 | schematic arrows (no unit numbers) |
| Tannenberg arrows | S06-01 | research 6.1 (Russian Second Army destroyed in East Prussia, late Aug 1914) | schematic; no numbers |
| Eastern Front winter 1917–18 (`EAST_FRONT_1917`) | S09-06 | Gulf of Riga – Dvinsk – Smorgon – Baranovichi – Pinsk – west of Lutsk – Brody – Czernowitz – Romanian front | MEDIUM (schematic); disappears on cue |
| Brest-Litovsk lands given up (3 March 1918) | S09-06 | research 9.7: Baltic, Poland, Ukraine, Finland; western Belarus west of a Dvinsk–Pruzhany–Brest line | **hatched and labelled "approx."**; Galicia/Bukovina (Austrian) and German lands are cut out; Bessarabia not hatched; Kars/Batum not shown. MEDIUM |
| Gallipoli: Cape Helles, Anzac Cove, Suvla Bay, landing 25 April 1915 | S06-02 | research 6.5–6.8; coordinates of the named places | Imbros and Tenedos left pale (Greek-held since 1912). HIGH (places) |
| Europe 1919–23 (`STATES_1919`) | S11-03 | research 11.7, 11.8 + ep01 memory rules: **Danzig Free City; Memel to Lithuania only in 1923 (labelled "MEMEL (1923)"); Saar not drawn as lost; Rhineland not drawn as lost**; Poland = the R-01-checked 1921–39 ring (incl. Vilnius region 1922 and East Upper Silesia 1922); Czechoslovakia incl. Ruthenia; Romania incl. Bessarabia, Bukovina, Transylvania and Southern Dobruja; Italy incl. Trentino, Trieste, Istria (Rapallo 1920, simplified; Fiume/Zadar not shown); Turkey in its 1923 borders | **hatch on the disputed eastern lands** (between the Bug line and the 1921 Riga border) + corner note **BORDERS APPROXIMATE**. Ireland shown separately (Irish Free State, Dec 1922), no label. MEDIUM |

## 3. Component APIs

### M-01 `MapEurope1914` (`src/maps/MapsWW1.tsx`)
`<MapEurope1914 f cam? idSuffix? dim? base? ... />`. Cameras: `CAM_1914.europe | wide | balkans | austria | west | viewBelgrade (viennaBelgrade) | belgium | central` (animate with `camLerp`).

| Prop | Keyable values | Shots |
|---|---|---|
| `base` | `'neutral' \| 'alliances' \| 'war1914' \| 'war1918'` preset fills | all |
| `flash` | 0..5: A-H, Russia, Germany, France, Britain flash into their bloc colours in turn (no labels) | S01-02 (b4) |
| `powers` | 0..1 great powers pale → neutral grey | S02-02 (b2) |
| `entente` | 0..1 France + Russia fill Entente; solid link draws | S02-02 (b3) |
| `britain` | 0..1 Britain light tint; dotted links London–Paris, London–St Petersburg | S02-02 |
| `central` | 0..1 Germany + Austria-Hungary fill; solid link | S02-03 |
| `italy`, `italyNeutral` | 0..1 hatched tint + dashed links; then fade to neutral + tag **NEUTRAL IN 1914** | S02-03 (≈64.0) |
| `labels`, `labelSet` | 0..1 opacity; state list (default great powers) | S02-02, S02-03, S02-06 |
| `capitals`, `capitalSet` | 0..1 capital markers | S02-02, S03-08 |
| `balkans` | `{serbiaPulse, peoples, tension, ahBorder, labels}` each 0..1 | S02-05 |
| `warPlan` | `{west, east, trains, stopwatch}` 0..1 (trains loop with the value) | S02-06 |
| `july` | `{ultimatum, clock, reply, ticks (0..5 marks ✓✓✓✓✗), declare (0..5 steps: A-H→Serbia, Russian mobilisation ripple, Germany→Russia, →France, →Belgium; fills deepen), marchers, calendar (0..4.99 index into 28 JUL · 30–31 JUL · 1 AUG · 3 AUG · 4 AUG), calendarShow}` | S03-04, S03-05 |
| `y1918` | `{trains, usShip}` 0..1 | S10-01 (b0) |
| `collapse` | `{bulgaria, ottoman, austria (grey-outs + tick tags 29 SEPT / 30 OCT / 3 NOV), kiel (plain red flag pops), redDots, kaiser (crown Berlin → Netherlands)}` | S10-04 (b5) |
| `debate` | `{fischer, clark}` 0..1 | S03-08 minis (use a small `cam` and an `idSuffix` per panel) |
| `styles` | per-state overrides `{fill, opacity, hatch, edge, pulse}` | any |
| `children` | `({toScreen, z}) => …` extra overlays | any |

Fixed screen positions: stopwatch (1700, 300), 48-hour dial (1700, 280), calendar (1700, 430). These sit in
the upper right below the TR term-card zone; do not show a TermCard at the same moment.

### M-02 `MapWesternFront` and `WesternFrontWallMap`
`<MapWesternFront f cam? idSuffix? era? cities? labels? ... />`. Cameras `CAM_WF.full | belgium | mons | marne | north | verdun | somme | sommeClose | amiens | trench`.

| Prop | Values | Shots |
|---|---|---|
| `advance` | 0..1 three German arrows through Belgium (Aug–Sept 1914) | S04-02 |
| `mons` | 0..1 British arrow at Mons grows and holds; 1..2 retreat arrow bends back south | S04-02 |
| `marne` | 0..1 advance arrows fade; retreat arrows to the Aisne + Aisne line | S04-04 (b4) |
| `quickVictory` | 0..1 label shows (0–0.15), cracks (0.3–0.6), falls apart (0.6–1) | S04-04 (b4) |
| `race` | 0..1 four leapfrogging Allied/German arrow pairs to the coast | S04-04 (b5, 215.4) |
| `front` | 0..1 front line draws Belgian coast → Swiss border | S04-04 (b6, 220.7) |
| `trenchZoom` | 0..1 line thickens, camera dives (internal `camLerp` to `CAM_WF.trench`), top-down zig-zag trench fades in from 0.55; at 1 it fills the frame for the MATCH into E-01 | S04-04 (227.8) |
| `occupied` | 0..1 hatched German-occupied France/Belgium/Luxembourg behind the current line | S07, S10 |
| `bumps` | 0..1 small arrows bounce off the static line | S07-01 (b0) |
| `verdun` | 0..1 converging German arrows + Voie Sacrée reinforcement + Verdun marker | S07-01 (b1) |
| `somme`, `sommeLink` | 0..1 Somme arrow; dashed link Somme → Verdun | S07-03 (b3) |
| `sommeCreep`, `sommeDots` | 0..1 line creeps a few miles (sliver + **A FEW MILES**); abstract grey dots accumulate | S07-06 |
| `era` | `'1915'` (default) or `'1918'` static line | S10 |
| `spring` | 0..1 bulge towards Amiens + German arrows + Amiens marker | S10-01 (b1) |
| `hundred` | 0..1 the line is pushed back to about Mons + Allied arrows | S10-04 (b4) |
| `cities` | names from `PLACE` (Paris, Mons, Ypres, Arras, Amiens, Verdun, Compiègne, Nieuport, Albert = "THE SOMME") | all |

`<WesternFrontWallMap x y w f reverse? id? />`: framed wall map (S10-02 Foch's HQ) with the April 1918 bulge;
German arrows give way to Allied arrows as `reverse` passes 0.3–0.9 (cue 578.6). Keep `w` ≥ 1000 so the label stays ≥ 36 px on screen.

### M-03 `MapEasternFront`
`<MapEasternFront f cam? idSuffix? tannenberg? pincers? breakup? front1917? frontVanish? brest? brestLabels? labels? />`,
cameras `CAM_EF.tannenberg | poland | brest`. S06-01: `tannenberg`, `pincers`, `breakup` (arrow fragments scatter
and fade). S09-06: `front1917` (draw), `brest` (hatch), `frontVanish`, `brestLabels` (panel at the top centre:
**TREATY OF BREST-LITOVSK · MARCH 1918** / "lands given up (approx.)", 554.3–559.6).

### M-04 `MapGallipoli`
`<MapGallipoli f cam? idSuffix? ships? landings? ottoman? inset? labels? suvla? />`, cameras `CAM_GP.wide`
(zoom 1.0) → `CAM_GP.peninsula` (1.6). Labels CAPE HELLES, ANZAC COVE, (SUVLA BAY), GALLIPOLI PENINSULA,
DARDANELLES, AEGEAN SEA, OTTOMAN EMPIRE (with `ottoman`). The inset (bottom right, x 1240–1880, y 510–880, above
the caption band) shows Germany, Austria-Hungary and the Ottoman Empire, the Berlin–Constantinople link and a
red box on the peninsula.

### M-05 `MapEurope1919`
`<MapEurope1919 f cam? idSuffix? empires? states? disputed? note? details? />`, cameras `CAM_1919.europe | central`.
- `empires` 0..4: per unit, the 1919–23 borders **crack** across that empire (0–0.5), then its fill fades
  (0.35–1): German, Austro-Hungarian, Russian, Ottoman in that order. During the first unit the 1914
  German–Russian border **morphs** (`lerpLine`) into the 1920 German–Polish border. Empire labels switch
  (GERMAN EMPIRE → GERMANY, RUSSIAN EMPIRE → SOVIET RUSSIA, OTTOMAN EMPIRE → TURKEY).
- `states` 0..9: new states fill and their labels pop in order POLAND, CZECHOSLOVAKIA, AUSTRIA, HUNGARY,
  KINGDOM OF SERBS, CROATS AND SLOVENES (two lines), ESTONIA, LATVIA, LITHUANIA, FINLAND.
- `disputed` 0..1 hatch on the disputed eastern lands; `note` 0..1 corner note **BORDERS APPROXIMATE**;
  `details` 0..1 small labels DANZIG (FREE CITY), MEMEL (1923).
- At `empires = 0, states = 0` it looks like M-01 (`base: 'war1914'`), so S11-03 can start on it directly.

### E-01 `Trench` (`src/components/env/Trench.tsx`)
`<Trench f variant? view? weather? time? … />`. Presets `variant`: **a** day + rain · **b** winter night (frost,
stars, moon, far German parapet with lanterns) · **c** dawn mist + smoke · **d** mud (Passchendaele crater field)
· **e** over-the-parapet no-man's land · **f** cutaway diagram · **g** dugout interior. `view` = `'trench' | 'mud' |
'nomansland' | 'cutaway' | 'dugout'`, `weather` = `'clear' | 'rain' | 'frost' | 'mist' | 'snow'`, `time` = `'day' |
'night' | 'dawn' | 'grey'` (S10-06 grey November morning = `variant="c" time="grey" smoke={0}`).

| Prop | Values |
|---|---|
| `precip`, `mist`, `smoke`, `flashes`, `farLanterns` | 0..1 weather amounts; `flashes` = distant gun flashes on the horizon (S07-03) |
| `rats` | number (auto-run with `f`) or `[{lane: 'floor' \| 'parapet' \| 'firestep', t: 0..1, dir}]` (keyable) |
| `ladders` | x positions (default 420, 1560); `periscope` x or `false`; `dugoutEntrance` bool; `curtain` 0..1 gas-curtain lift |
| `sump` | 0..1 water level in the sump (rippling); `candles` bool (default on at night) |
| `dust` | 0..1 dust falls from the dugout roof after a cue: `dust={prog(f, cue, cue + 50)}` (S05-04) |
| `draw`, `labels`, `flow` | cutaway: lines draw on; FRONT LINE / SUPPORT / RESERVE labels (≥ 40 px, left side); figure-token loop phase (default `f/420`) |
| `nearParapet` | no-man's land: our sandbag parapet along the bottom (default true; set false for the open S04-06 wide) |
| `ripples` | mud view rain-ripple strength |

Layout constants for characters (scale 1; adult figure ≈ 280 px tall):
`TRENCH = {horizonY 300, crestY 545, firestepY 760, floorY 878, ladderX [420,1560], periscopeX 980, sumpX [560,900], dugoutX 1300}`.
Stand a figure at `y = TRENCH.firestepY` and its eyes clear the parapet; at `y = TRENCH.floorY` it is in cover.
`MUD.trackY = 884` (duckboard track, walk R→L), `NML = {horizonY 380, farParapetY 392, nearY 905}`,
`DUGOUT = {bunkSeatY 745, floorY 930, candle [1240, 818], entranceX 240}`, `CUTAWAY = {frontY 360, supportY 590, reserveY 820}`.
`<TrenchForeground f flood? rain? time? />` draws after the characters: knee-deep water (`flood` 0..1, S05-02 b3) and
foreground rain. Extra props: `Rat`, `Lantern`, `TrenchLadder`, `BoxPeriscope`, `WireCoils`, `Sandbags`, `MistBands`,
`HorizonFlashes`, `DustFall`, `WoodenCross` and `Football` (S04-06).

### E-08 `DominoRow`, `ChalkDominoes` (`src/components/env/Dominoes.tsx`)
`<DominoRow x y labels topple? nudge? w? h? gap? f? />`: cream blocks, vertical chalk-style labels (36–40 px);
`topple` 0..1 fells them left → right, each leaning on the next (100.4–104.5); `nudge` 0..1 wobbles the first one.
`<ChalkDominoes f x? y? w? h? draw? topple? glow? label? />`: chalk Europe outline (1:110m land), chalk dominoes falling
along a route to the **SARAJEVO** dot, which glows warm yellow with `glow` (108.0–110.0). Defaults fit `HistoryRoom`'s board.

### V-01 `TouringCar`, `EmptyBackSeat` (`src/components/VehiclesWW1.tsx`)
`<TouringCar x y dist s? dir? f? color? layer? turn? stall? pennants? running? />`. `dist` = distance travelled
(wheel spin). `layer="back"` then seated figures at `CAR_SEATS` (driver, rearLeft, rearRight; car-local, scale with
`s`) then `layer="front"`: the doors hide the passengers' legs. `turn` 0..1 swings the car away for the turn-in;
`stall` 0..1 judder and exhaust puff, then still. Colours `CAR_COLORS.archduke` (dark green), `CAR_COLORS.escort`
(black). Pennants are plain yellow with a black band (no emblem). `<EmptyBackSeat f desat? hat? />`: full-frame
close-up of the tufted back seat with the plumed hat (the animator's `HatShape 'plumedHat'`).

### V-02 `RhomboidTank`
`<RhomboidTank x y dist s? dir? f? color? exhaust? silhouette? mistColor? />`; the track links move with `dist`
(dash offset round the whole hull), road wheels turn, exhaust smokes. Depth presets `TANK_DEPTH.near | mid | far`
(scale + `silhouette` fade into mist). No national markings.

### V-03 `Periscope`, `TorpedoWake`, `WaterColumn`
`<Periscope x y f s? dir? wake? height? />` (waterline at y; feather wake loops with `f`; `height` 0..1 raises it),
`<TorpedoWake x0 y0 x1 y1 progress f fade? />` (thin white streak with bubbles; `progress` = head position),
`<WaterColumn x y progress s? />` (rises and falls over 0..1 at the ship's hull; no fire). Use with the existing
`Sea` and `Ship kind="freighter"`; draw the column before the `Sea` so the waterline covers its base.

### E-S1 `PoppyWreath`, `PoppyPetals`, `TownWarMemorial` (`src/components/env/Remembrance.tsx`)
`<PoppyWreath x y s? tilt? />` (stands on its lower edge at y), `<PoppyPetals f n? lift? wind? opacity? />`
(sparse, slow; `lift` 0..1 raises them off the ground as the camera cranes up, ≈674.5), `<TownWarMemorial x y s? second? />`
(stone cross on a plinth, "1914–1918"). The existing ep01 `Memorial` is a candle wall, so S11-05 should use `TownWarMemorial`.

## 4. Known limits
- The 1919–23 crack lines use one SVG mask per empire while it cracks (only one at a time on screen); fine in tests.
- Kars/Ardahan/Batum (ceded at Brest-Litovsk) are not shown on M-03. Eupen-Malmedy, Fiume and Zadar are not shown.
- Map frames cost roughly 1–3 s each to render (masks were replaced by clip paths; not benchmarked in lean mode).
