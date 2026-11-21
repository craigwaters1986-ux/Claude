# Storyboard — ep01-ww2 — "World War II: How It Started, How It Ended"

- **Version:** v1 (storyboard director, 2026-11-15). Built from the **approved script v3** (`production/scripts/ep01-ww2/script.json`).
- **Status:** AWAITING REVIEW. This needs the user's sign-off (**checkpoint 3**) before full production.
- **Length:** 600 s at 30 fps (18,000 frames), 1920×1080. **99 shots** in 11 sections.
- **Companion files:** `asset-requests.md` (new assets by owner). Handoff: `production/reports/handoffs/ep01-ww2/07-storyboard.md`.

---

## 1. Conventions

### 1.1 Beats and timing
- **Beats** are `sNN.bK`: sentence K (0-based, in `script.json` order) of section NN. The **Beats** column is authoritative. The engine cues every animation to a beat with `beats('sNN').at(K)` and `endOf(K)`, so shots and cards will snap to the regenerated `src/timeline/narration.json`.
- **Times** (mm:ss.s in the Time column; plain absolute seconds, e.g. "(104.9–108.0)", for text in- and out-points) are approximate:
  - s01 uses the v3 layout the scriptwriter measured (changelog-v3).
  - All other sections are word-proportional estimates between `start + lead` and the measured narration end for that section (script.md table).
  - Expect drift of up to about 1 s. When real timings arrive, keep each shot's beat anchor and slide its cut point to the nearest beat start or end. Shot boundaries written as "bK end" or "bK start" follow that beat exactly.
- **Section windows are fixed** (s01 0–30 s … s11 570–600 s). The first shot of each section starts exactly on the section's start time.
- **Tails with no narration** (music carries them, so they are never empty or silent): s01 22.8–30.0 (title), s05 ≈261.0–270.0, s07 ≈380.8–390.0, s08 ≈442.5–450.0. Each tail has its own moving shot or a planned continuation.

### 1.2 Screen layout (1920×1080) and text safety
| Zone | Area | Use |
|---|---|---|
| **Caption band** | y ≥ 900 (bottom 180 px) | **Subtitles only.** No cards, labels, stamps or important action. Characters' feet and the ground may extend into it. |
| Chapter banner | top centre, y 32–92 | `ChapterBanner`, first 2.5 s (75 frames) of sections s02–s11 |
| Date card (TL) | x 70, **y 120**, up to 196 px tall | `DateCard`. Set to y = 120 so it never collides with the chapter banner (see the video-editor request in asset-requests). |
| Term card (TR) | top right, x = W − 70, **y 120**, 640 px wide | `TermCard` |
| Fact pill (RM / UC) | right-middle (x ≈ 1150–1850, y 340–620) or upper-centre (y 300–480) | `FactPill`, `Counter`, `Stamp` |
| Name tag | attached under or beside the figure | yellow `NameTag`, historical figures only |
- **Never over faces.** When a TL or TR card is visible, stage heads at **y > 360**, or keep them on the opposite side of the frame from the card. When an upper-centre (UC) pill is visible, keep faces out of the centre band from y 280 to 500.
- **Readability:** fact text ≥ 36 px, Montserrat heavy, on high-contrast panels. Every card stays on screen for **at least 3 s** (or one full beat, whichever is longer), fades in and out over 0.4 s, and holds still while visible.
- **British English** throughout: "per cent", "kilometres", "demilitarised", "Harbor" only as the proper name *Pearl Harbor*.
- All figures on cards are taken from the fact-checks (part 1 and part 2, "Figures for on-screen cards"). Estimates say **"around", "about", "more than" or "(EST.)"**. A full checklist is in §3.

### 1.3 Transitions
| Code | Meaning (engine) |
|---|---|
| CUT | hard cut (`trans: 'cut'`) |
| FADE | 12-frame crossfade (`'fade'`, default) |
| WIPE | diagonal wipe (`'wipe'`) |
| IRIS | circular iris (`'iris'`) |
| DIP | dip through black (`'dip'`). Used for night or sombre changes. |
| INK | **chapter transition:** `InkWipe` (20 frames) centred on the section boundary, then the `ChapterBanner` |
| MATCH | in-shot morph or match-cut (e.g. forest → map), built inside one shot |

Chapter transitions use INK, with three sombre exceptions:
- s01→s02 is INK from the title.
- s09→s10 is a slow FADE (from evening sea to Pacific map).
- s10→s11 is a slow DIP.

### 1.4 Chapter banners
s01 is the cold open and gets **no banner**; the title card closes it. s02–s11 are numbered **CHAPTER 1–10**, using the section titles from `script.json`:
- 1 The World After World War I
- 2 Hitler's Rise to Power
- 3 World War II Begins
- 4 Europe Falls
- 5 The War Becomes Global
- 6 The Turning Points
- 7 D-Day and the Liberation of Europe
- 8 The Fall of Nazi Germany
- 9 How World War II Finally Ended
- 10 The Human Cost and the Legacy

The youtube-specialist's published chapter labels should match this numbering.

### 1.5 Movement rule
Every shot moves. It has at least one of: walking or acting characters, moving vehicles, animated map arrows or fills, particles or weather, and always a slow camera move or drift (`Camera` drift ≥ 1). Composition changes at least every 6–10 s. Shots longer than 10 s list an **internal composition change** (a pan, crane, split or match). Sombre shots (Holocaust, Hiroshima, Nagasaki, Pearl Harbor dead, Blitz dead) slow everything down. Movement there is limited to slow camera drift, candles, ash, smoke and wind.

### 1.6 Tone, ethics and symbol policy (applies to every shot)
- **No swastikas anywhere.** Nazi banners are **plain dark-red vertical banners with no emblem**, and Hitler's armband is plain red (already the case in `cast.ts`). This is a deliberate choice: the symbol adds no information, and we never want to glorify it. We keep the **straight-armed national cross (Balkenkreuz)** on German tanks and aircraft as military identification, as `Vehicles.tsx` already does. QC may veto this, in which case use plain grey (`mark="none"`).
- **No Rising Sun naval ensign.** Japanese aircraft and ships use the plain *hinomaru* roundel only.
- **Propaganda is always labelled.** Posters are abstract shapes with no readable slogans, **no caricatures of any people**, and a red "NAZI PROPAGANDA" stamp.
- **Hitler** is shown at eye level or from above, never from a heroic low angle, never large in frame in triumph, and always with his name tag.
- **Holocaust (s09.b1–b4):**
  - No bodies, no camp interiors of killing, no piles, no graphic emaciation.
  - Survivors are shown with dignity, at a distance, standing or sitting.
  - Soldiers remove helmets and offer blankets and bread.
  - The memorial uses candles and the names of victim groups.
  - Music drops to a single sustained instrument, and there are no SFX except wind and candle flicker.
  - **No counters** (lives are not shown as an animated tally).
  - The camp gate carries **no inscription**.
- **Hiroshima and Nagasaki (s10.b3–b6):**
  - City → bomber high above → white flash → **1.5 s total silence** → grey aftermath silhouettes and drifting ash.
  - **No people are shown** in the aftermath, and there is **no explosion SFX** and no mushroom cloud by default (see the open question in §4).
- **Blitz, Pearl Harbor, Okinawa, D-Day:**
  - Explosions only at a distance or on ships, empty tracks and buildings. Never on a visible person.
  - The wounded are shown being helped, with no blood.
- **No comic marks** (anger veins, sweat drops, cartoon "boing" or slide-whistle SFX) anywhere in this episode. The only light touches are the Guide's shrugs and gestures in the history room, and joy at Paris and VE Day.
- **Fictional characters:** the Guide, **Anna** (London civilian), **Tom** (British soldier) and **Leo** (child) carry **no name tags** and are never presented as real people. Tom's arc:
  - S04-07 leaves by train
  - S05-04 Dunkirk
  - S08-05 D-Day
  - S09-09 home on VE Day
- **Real people** always carry `NameTag`s: Kaiser Wilhelm II, Hitler, Hindenburg, Chamberlain, Daladier, Mussolini, Stalin, Molotov, Ribbentrop, Churchill, Roosevelt, Montgomery, Eisenhower, MacArthur.
- **Unnamed groups** of officials get a **group label**, not a personal tag: "GERMAN DELEGATION", "JAPANESE DELEGATION", "JAPAN'S LEADERS". **Emperor Hirohito is not drawn.** He is represented by the radio broadcast.
- Everyone has the same white head. **No ethnic caricature.** Nationality comes only from uniforms, hats, flags and scenery.

### 1.7 Audio shorthand
**Music** is subtle and original or licensed, under the narration and ducked. **SFX** are restrained and sit well under the voice. "Silence" means music and SFX are fully out; only the room tone and wind named in the row remain.

---

## 2. Shot list

### s01 — The Hook · 00:00–00:30 · 6 shots
Music: gentle, warm piano and strings (summer), falling to a low drone at s01.b2, near-silence after b5, then the original title sting at 22.9 s. Measured beats:
- b0 1.60–3.52
- b1 4.22–7.06
- b2 7.38–13.02
- b3 13.52–15.10
- b4 15.35–16.68
- b5 16.93–18.98
- b6 19.68–21.10
- b7 21.40–22.77

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S01-01 | 00:00.0–00:04.2 | s01.b0 | Sunny 1939 European street (existing `StreetShot`: shops with awnings, lamps, tree, sun, birds, drifting clouds) | Anna and Leo walk L→R (Leo skips); man1, woman1 and an off-duty soldier walk both ways; bench reader (man2) reads a newspaper | Bench newspaper, readable only on close-up: headline "DANZIG CRISIS", date "AUGUST 1939" (optional hint of 1939 tension, per researcher); `Clouds`, `Birds` | Slow push-in 1.04→1.08 | DateCard TL (0.8–6.8 s): **SUMMER 1939** / **EUROPE** | Fade up from black (0.5 s) | Birdsong, light street murmur, distant bicycle bell; music warm and calm |
| S01-02 | 00:04.2–00:07.4 | s01.b1 | Same street, closer: bench and café front | Bench man lowers his paper, frowns slightly; Anna nods hello; Leo bounces a ball; walkers slow at the end (as in Preview) | Newspaper (headline now legible upper-frame); ball | Pan right to the bench, then push towards the paper | — | CUT (reframe) | Paper rustle; music continues, a first darker note at 7.0 s |
| S01-03 | 00:07.4–00:13.5 | s01.b2 | Dark wood desk; full-frame newspaper "THE DAILY CHRONICLE · SEPTEMBER 1939 · ONE PENNY" | — | Newspaper flies in from the street shot (spin and settle 0.8 s). Headline **WAR BREAKS OUT IN EUROPE**; sub-line "Germany invades Poland · Britain and France declare war" (all above y 860) | Slow zoom 1.00→1.06, slight rotation drift | Diegetic headline only | MATCH (newspaper whip from S01-02) | Paper whoosh then a low swell (no boom); music drops to a low drone |
| S01-04 | 00:13.5–00:19.7 | s01.b3–b5 | Europe map 1939 (`GeoMap europe`); Germany (1937 + Austria) grey | — | b3: grey arrows spread over Europe (Poland, France, Norway, USSR). b4: small ember glows at Warsaw, Rotterdam, London, Coventry, Leningrad, Stalingrad (restrained, no explosions). b5: map dims to 0.6, `Particles ash` drift | Zoom 1.9→1.0, then slow pull-back on b5 | **None.** (Remove Preview's "WORLD WAR II 1939–1945" title here: no title before 22.8 s.) | FADE | Low pulse; soft wind at b5; **0.7 s near-silence after b5**; no explosions |
| S01-05 | 00:19.7–00:22.8 | s01.b6–b7 | History room (`HistoryRoom`) | Guide faces camera, worried, shrugs on b6; turns to the board and points on b7, determined | Chalk "1939" (19.8 s), "→ ? →" (20.5 s), "1945" (21.4 s) | Push 1.00→1.06 | Chalk only (on the board, above y 860) | WIPE | Chalk scratch, room tone; music suspended (no sting until after 22.77 s) |
| S01-06 | 00:22.8–00:30.0 | — (no narration) | Deep-navy title; faint rotating `Globe` (opacity 0.35) | Channel head icon pops in (existing) | Light particles of dust in the projector light | Push 1.00→1.03 | `BigTitle` centre: **THE HUMAN STORY** / **Episode 1: World War II**; italic line "How It Started, How It Ended" (fix Preview: currently "EPISODE 1 · WORLD WAR II") | DIP (0.4 s) | **Title sting starts ≥ 22.9 s** (QC note); settles into the s02 bed by 29.5 s |

### s02 — Chapter 1: The World After World War I · 00:30–01:30 · 9 shots
Music: reflective minor strings, uneasy for Weimar, tense pizzicato for 1929, darkening to a single low note at the end.

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S02-01 | 00:30.0–00:36.8 | s02.b0 | History room | Guide walks in from the left, wipes "1939" from the board, writes "1914–1918" and "THE FIRST WORLD WAR" while talking | Chalk; dust puff from the cloth | Slow pan L→R following the Guide | ChapterBanner (30.0–32.5): **CHAPTER 1 · THE WORLD AFTER WORLD WAR I** | INK | Footsteps, chalk; music reflective strings |
| S02-02 | 00:36.8–00:42.0 | s02.b1 | Muddy WWI front (brown ground, shell craters, `BarbedWire`, bare trees, rain), then a grey parade square | German WWI soldiers (`germanSoldierWW1` ×5) trudge away from the line, heads down (slump-walk). At ~39.4 s the camera pans to the Kaiser (name tag), who sets his spiked helmet on a bench and walks out of frame, alone | `Particles rain`, mist | Lateral pan R→L | DateCard TL (37.2–41.8): **NOVEMBER 1918** / **GERMANY DEFEATED** / sub "The Kaiser abdicates" | FADE | Rain; distant guns fade to silence; music sombre |
| S02-03 | 00:42.0–00:48.4 | s02.b2 | Palace hall of mirrors (new background) | Unnamed delegates (generic politicians, no likenesses) sit along a long table; a German delegate (grey suit, worried) steps forward and signs | `Document` "TREATY OF VERSAILLES" with animated signature; chandeliers sway | Slow push-in to the document | DateCard TL (42.5–47.8): **1919** / **TREATY OF VERSAILLES** | CUT | Pen scratch, murmur; formal but uneasy strings |
| S02-04 | 00:48.4–00:55.0 | s02.b3 (first half) | Europe map, Germany's 1914 border | — | Each lost territory (Alsace-Lorraine, West Prussia/Posen, North Schleswig, Eupen-Malmedy, Memel, Hultschin) outlines red and slides to its new owner; Danzig marked "Free City". Small inset globe (top-left, under the TL zone) shows colony dots blinking out | Zoom 1.4→1.2 on Germany | FactPill RM (49.0–54.8): **AROUND 13% OF ITS EUROPEAN TERRITORY LOST**; FactPill RM (52.0–54.8): **ALL COLONIES LOST** | FADE | Soft paper-tear per piece (subtle); music continues |
| S02-05 | 00:55.0–01:01.7 | s02.b3 (second half) | Barracks parade ground, grey sky | Big ranks of German soldiers march; as the camera pulls back, whole ranks peel off and walk away until a small block remains. Two workers then push a heavy cart of sacks across frame | Cart of sacks labelled "REPARATIONS" (new prop) | Pull-back, then pan with the cart | FactPill RM (55.4–59.0): **ARMY CAPPED AT 100,000 MEN**; FactPill RM (58.6–61.6): **HUGE REPARATIONS** | CUT | Marching boots thinning; cart creak |
| S02-06 | 01:01.7–01:08.4 | s02.b4–b5 | Berlin street, overcast; Reichstag (pre-1933 glass dome) behind; Weimar black-red-gold flag | b4: a veteran (man1) reads a paper and slumps; passers-by walk with heads down (let it breathe 2 s). b5: tilt up to the Reichstag; silhouettes argue in its windows; a thin ink crack runs across the façade (metaphor, subtle) | Weimar flag (new kind), `Newspaper` | Slow tilt up | TermCard TR (64.2–68.2): **WEIMAR REPUBLIC** — "Germany's new democracy after the First World War" | FADE | Wind, muttering; melancholic strings |
| S02-07 | 01:08.4–01:13.2 | s02.b6 | New York 1929: Wall Street columns, skyscrapers | Brokers (man2, politician) rush out, papers flying; one holds his head (worried, not comic); crowd gathers | Ticker tape streaming; big board with a plunging line | Quick push-in, light shake 0.5 | DateCard TL (68.8–73.0): **1929** / **GREAT DEPRESSION** / sub "Wall Street Crash, October 1929" | WIPE | Ticker clatter, anxious crowd; tense pizzicato |
| S02-08 | 01:13.2–01:18.1 | s02.b7 | Berlin, rain, employment office | A long queue of unemployed men and women (man1, worker, woman3, workerW…) shuffles forward; the queue never seems to end | `Particles rain`, umbrellas (could) | Lateral track R→L along the queue | FactPill RM (73.6–78.0): **1932: AROUND 6 MILLION GERMANS OUT OF WORK** | FADE | Rain, shuffling feet; low strings |
| S02-09 | 01:18.1–01:30.0 | s02.b8–b9 (+ tail 88.5–90) | History room | b8: Guide writes "VERSAILLES", shakes head, adds "≠ THE ONLY CAUSE". b9: four chalk boxes pop in one by one — "ECONOMIC DESPAIR", "FRAGILE POLITICS", "NATIONALISM", "ANTISEMITISM" — and their arrows converge on a dark gap, "AN OPENING". ~87 s: a long human shadow slides across the board; the Guide steps back, worried | Chalk line-art kit; shadow overlay | Static on b8; **push-in to "AN OPENING" from 81.6 s** (internal composition change) | Chalk only (board stays above y 860) | CUT | Chalk; music darkens to a single low note and a slow pulse as the shadow arrives |

### s03 — Chapter 2: Hitler's Rise to Power · 01:30–02:30 · 10 shots
Music: ominous low brass and pulses, building tension, an uneasy waltz for Munich, cut to silence on "It didn't work."

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S03-01 | 01:30.0–01:36.3 | s03.b0 | Smoky meeting hall; **plain dark-red vertical banners, no emblems** | Hitler (name tag) on a small stage: talkGesture → fistShake. Small crowd seen from behind: some cheer, some stand with arms folded | Plain banners; haze `Smoke` (low opacity) | Eye level, slow push (never low angle) | ChapterBanner (90.0–92.5): **CHAPTER 2 · HITLER'S RISE TO POWER**; NameTag **ADOLF HITLER — Leader of the Nazi Party** | INK (from the shadow in S02-09) | Crowd murmur; ominous brass pulse |
| S03-02 | 01:36.3–01:44.7 | s03.b1 | Street wall | Posters slap onto the wall one by one: abstract bold shapes (arrows, fists, rays), **no readable slogans, no caricatures**. Passers-by stop: some nod; Anna frowns and leads Leo away | Poster wall (new), paste brush | Pan L→R along the wall | Stamp (red, upper area, 97.6–104.4): **NAZI PROPAGANDA** | CUT | Paper slaps, crowd; music tightens |
| S03-03 | 01:44.7–01:48.1 | s03.b2 | Panelled office | Hindenburg (name tag) hands a document to Hitler (name tag); stiff handshake | `Document` | Slight push | DateCard TL (104.9–108.0): **1933** / **HITLER BECOMES CHANCELLOR** / sub "30 January 1933" | FADE | Clock tick; low sting |
| S03-04 | 01:48.1–01:55.7 | s03.b3 | One tracking shot: newspaper office → party office → Reichstag | A printing press grinds to a halt and workers leave; shutters slam; men in plain brown party uniform (plain armband, no symbol) padlock a rival party's door; the Reichstag's lights go out | Printing press (new), shutters, padlock | Long lateral track L→R | Stamps pop in sequence (upper area): **RIVAL PARTIES BANNED** (108.8), **FREE PRESS CRUSHED** (111.0), **DICTATORSHIP** (113.4) | CUT | Press winding down, shutter, padlock click; tense |
| S03-05 | 01:55.7–01:59.0 | s03.b4 | Europe map: Germany | — | Dashed grey "ambition" arrows pulse outwards from Germany (intent, not real moves) | Slow zoom out | TermCard TR (115.9–119.0): **ANTISEMITISM** — "Hostility to, prejudice against or hatred of Jewish people" | FADE | Low drone |
| S03-06 | 01:59.0–02:05.3 | s03.b5 | **Split screen** (ink divider). Left: a shopping street; right: a factory | Left, sombre: an illustrative Jewish family (ordinary 1930s clothes, no distinguishing features) close their shop's shutters and walk away with a suitcase. Right: tanks and aircraft roll off an assembly line | Shuttered shop; factory line (new) | Split wipe in from the centre; both halves drift | FactPill left-upper (119.4–124.8): **JEWISH GERMANS STRIPPED OF THEIR RIGHTS**; FactPill right-upper (121.0–124.8): **REARMAMENT** | WIPE | Left: wind only. Right: muted machinery. No sting. 0.4 s pause |
| S03-07 | 02:05.3–02:11.9 | s03.b6–b7 | Europe map → Central Europe | b6: hatched Rhineland zone (`RHINELAND`); small march arrows cross the Rhine into it. b7: camera pans south-east; Austria pulses and fills German grey; arrow Munich→Vienna | `GeoMap`, `MapArrow` | Pan and zoom | DateCard TL (125.5–128.8): **1936** / **RHINELAND REOCCUPIED**; DateCard TL (129.1–131.9): **1938** / **AUSTRIA ANNEXED** / sub "March 1938" | CUT | Low marching drum; music builds |
| S03-08 | 02:11.9–02:16.5 | s03.b8 (first half) | Munich conference room; wall map of Czechoslovakia with the Sudetenland shaded | Chamberlain, Daladier, Hitler and **Mussolini** (all name-tagged; tags appear one by one as the camera passes). Hitler points to the Sudetenland; papers are signed. At the end of the table, an empty chair with a card | `Document` "AGREEMENT"; empty chair | Slow pan across the four leaders | DateCard TL (132.2–136.4): **1938** / **MUNICH AGREEMENT** / sub "Germany, Britain, France and Italy sign"; FactPill RM over the empty chair (133.5–136.4): **CZECHOSLOVAKIA NOT INVITED** | FADE | Pens, murmur; uneasy waltz-like strings |
| S03-09 | 02:16.5–02:22.3 | s03.b8 (second half)–b9 | 1938 airfield with an airliner | Chamberlain steps off the plane and waves a paper; the crowd cheers. On **"It didn't work."** a gust lifts the paper from his hand; it tumbles away; the crowd falls silent; Chamberlain's smile fades (worried) | Airliner (new), paper prop with wind, crowd | Medium, then follow the paper upwards | **None** (no quotation shown; the moment breathes) | CUT | Cheers → wind gust → silence; **music stops on b9** |
| S03-10 | 02:22.3–02:30.0 | s03.b10 | Map: Czechoslovakia | Sudetenland already grey; Bohemia and Moravia fill German grey; Prague marker pulses | `GeoMap`, `CityMarker` Prague | Zoom 1.6→2.2 on Prague | DateCard TL (142.5–145.8): **MARCH 1939** / **GERMANY OCCUPIES THE CZECH LANDS**; TermCard TR (144.6–149.6): **APPEASEMENT** — "Giving in to an aggressor's demands to avoid war", with a red Stamp **FAILED** landing across it at 146.8 | FADE | Stamp thud; ominous resolve |

### s04 — Chapter 3: World War II Begins · 02:30–03:30 · 9 shots
Music: tense low-string ostinato, then urgent; the strings fall away for the declaration; a sad, noble theme at the station; low drums for the partition; a new colour for Asia (strings and woodwind, **no stereotyped "oriental" motifs**).

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S04-01 | 02:30.0–02:36.2 | s04.b0 | Europe map, August 1939: Germany (with Austria and the Czech lands) grey; Poland outlined and pulsing | — | `POLAND_1939` pulse; Danzig marker | Zoom 1.0→1.6 on Poland | ChapterBanner (150.0–152.5): **CHAPTER 3 · WORLD WAR II BEGINS**; MapLabel "POLAND" | INK | Low ostinato, a faint clock tick |
| S04-02 | 02:36.2–02:42.8 | s04.b1 | Kremlin office (panelled, window with onion domes) | Molotov signs, then Ribbentrop signs (both name-tagged); Stalin (name tag) watches from behind; stiff handshake, uneasy smiles | `Document` "NON-AGGRESSION PACT" | Slow push, tiny tilt | DateCard TL (156.6–162.4): **AUGUST 1939** / **NAZI–SOVIET PACT** / sub "A non-aggression pact" | CUT | Pen; low strings |
| S04-03 | 02:42.8–02:50.0 | s04.b2 | Pact document → Eastern Europe map | The page flips to a second sheet stamped "SECRET PROTOCOL", which morphs into the map. A dashed red line crosses Poland (`MR_LINE`); soft red shading on Finland, Estonia, Latvia and Bessarabia (leave Lithuania neutral) | `Document`, `Stamp`, `GeoMap` | Push into the document → MATCH to the map | MapLabels **GERMAN SPHERE** / **SOVIET SPHERE** | MATCH (in-shot) | Page flip; suspense; 0.5 s pause held |
| S04-04 | 02:50.0–02:54.5 | s04.b3 | Polish border at dawn: striped barrier pole, sentry box, fields | German soldiers (`germanSoldier`) raise and snap the barrier; tanks roll through towards frame-left | `Tank` ×3 (cross mark, dust, exhaust) | Side angle, tracking with the tanks | DateCard TL (170.2–174.4): **1 SEPTEMBER 1939** / **GERMANY INVADES POLAND** | CUT | Engines, barrier crack; music hits urgent |
| S04-05 | 02:54.5–03:00.7 | s04.b4 | Polish countryside: trench line, field, distant village | Polish soldiers (`polishSoldier`) fire back from cover, determined; Polish flag on a post; Stukas dive overhead; distant smoke | `Plane stuka` ×3, distant `Explosion` (in fields), `Smoke` | Wide, shake 2 during the dive; cut-in on a determined Polish soldier at ~177.5 | — | CUT | Dive engine whine (restrained), distant explosions, rifle fire; driving music |
| S04-06 | 03:00.7–03:05.3 | s04.b5 | **Split screen:** London living room (left) / Paris café (right), radios on | Left: Anna and Leo listen; Anna's hand to her mouth (worried). Right: a French couple stand by the café radio | `Radio` ×2; small UK and French flags on the walls | Slow push on both halves | DateCard TL (180.9–185.2): **3 SEPTEMBER 1939** / **BRITAIN AND FRANCE DECLARE WAR** (layout: keep both heads at y > 380) | FADE | Radio murmur (no intelligible words), clock; strings drop out |
| S04-07 | 03:05.3–03:09.4 | s04.b6 | London railway station platform, steam | Tom (fictional, no tag) hugs Anna, ruffles Leo's hair, boards a troop train and waves from the window; the train pulls out left | `Train` (moving), steam `Smoke` | Medium, then pan with the train | — | CUT | Whistle, steam, platform chatter; sad, noble theme |
| S04-08 | 03:09.4–03:19.3 | s04.b7–b8 | Map: Poland | b7: red Soviet arrows push in from the east. b8: Poland divides into `POLAND_GERMAN_ZONE` (grey) and `POLAND_SOVIET_ZONE` (red); the label "POLAND" fades; thin smoke over Warsaw | `GeoMap`, `MapArrow`, `Smoke` (small) | Zoom on Poland; slow pull-back on b8 (internal change) | DateCard TL (189.6–195.0): **17 SEPTEMBER 1939** / **SOVIET UNION INVADES EASTERN POLAND** (needs the two-line title; see request T-01) | FADE | Low drums; minor chord at "carved up"; 0.4 s pause |
| S04-09 | 03:19.3–03:30.0 | s04.b9 | `Globe` spins from Europe to Asia → East Asia map | ~199.3: arrow from Korea into Manchuria, which fills in Japan colour. ~204.5: arrows into northern and eastern China (Beijing, Shanghai, Nanjing markers). Inset vignette (right-middle, 205–209): Chinese soldiers (new preset) hold a wall line under a grey sky | `Globe` → `GeoMap eastAsia`; Republic of China flag in the inset (new) | Globe spin, then pan south (internal change at 204.5) | DateCard TL (199.8–203.8): **1931** / **JAPAN INVADES MANCHURIA**; DateCard TL (204.6–209.4): **1937** / **FULL-SCALE WAR AGAINST CHINA** | WIPE (globe spin) | New colour: low strings and woodwind (no stereotyped motifs); distant thunder-like guns |

### s05 — Chapter 4: Europe Falls · 03:30–04:30 · 10 shots (narration ends ≈ 04:21.0; music tail ≈ 9 s)
Music: eerie and sparse for the phoney war, then driving through 1940; urgent but hopeful at Dunkirk; minor for Paris; a resolute low-brass theme from Churchill onwards; heroic for the Battle of Britain; sombre for the Blitz; resolute theme swells through the tail.

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S05-01 | 03:30.0–03:34.3 | s05.b0 | Western Front in winter 1939–40: concrete bunker, light snow, empty fields | French soldiers (`frenchSoldier`) idle: one yawns (sleepy), one stamps his feet (cold), one reads a letter; a crow flaps past | `Particles snow` (light), `Birds` | Slow lateral pan | ChapterBanner (210.0–212.5): **CHAPTER 4 · EUROPE FALLS** | INK | Wind, a distant crow; eerie and sparse |
| S05-02 | 03:34.3–03:42.7 | s05.b1–b2 | Europe map, north-west | b1: arrows to Denmark and Norway (Copenhagen, Oslo). b2: camera glides south; arrows into the Netherlands, Belgium, Luxembourg and France (Rotterdam, Brussels markers) | `GeoMap`, `MapArrow` | Pan north → south (internal change at 218.3) | DateCard TL (214.5–218.2): **APRIL 1940** / **DENMARK AND NORWAY INVADED**; FactPill RM (218.6–222.6): **MAY 1940: NETHERLANDS · BELGIUM · LUXEMBOURG · FRANCE** | FADE | Driving pulse; a low brass hit per arrow |
| S05-03 | 03:42.7–03:49.1 | s05.b3 | Ardennes forest road (dark pines) → map | 222.7–225.8: German tanks nose out between the pines in a long column. 225.8: zoom out MATCH to the map: an arrow sweeps from Sedan to the Channel coast and a blue Allied pocket closes around Dunkirk | `Tank` column, dust; `GeoMap`, `MapArrow` | Follow the tanks, then pull out into the map | MapLabels **ARDENNES**, **DUNKIRK** | CUT | Tank engines, then the music takes over |
| S05-04 | 03:49.1–03:58.3 | s05.b4 | Dunkirk: wide beach with long queues of troops; the long **East Mole** jetty with destroyers alongside; black smoke from burning oil tanks over the town | Most men file along the mole onto destroyers. At ~233.6 the camera pans to the beach: little ships (yachts, fishing boats) ferry men out to the larger ships; Tom wades out and is hauled aboard a small boat | `Ship warship` ×3 at the mole, `SmallBoat` ×6 shuttling, `Smoke`, distant `Plane`s | Wide, slow pan from the mole to the beach (internal change) | FactPill RM (229.6–235.0): **MORE THAN 330,000 TROOPS EVACUATED**; FactPill RM (235.0–238.2): **MOST LEFT FROM THE HARBOUR MOLE ON LARGER SHIPS** | FADE | Surf, gulls, distant aircraft and guns; urgent but hopeful |
| S05-05 | 03:58.3–04:01.3 | s05.b5 | Paris boulevard with the Eiffel Tower | German soldiers march down the boulevard; French civilians watch silently from the pavement; one woman wipes a tear | Eiffel Tower background (new) | Wide, slight push | DateCard TL (238.4–241.3): **MAY–JUNE 1940** / **FALL OF FRANCE** | CUT | Marching boots in a silent street; minor key |
| S05-06 | 04:01.3–04:05.4 | s05.b6 | Prime Minister's office: desk, Union flag, BBC-style microphone | Churchill (name tag) stands, fist on the desk, then leans to the microphone, determined | Microphone (new prop) | Slow push to Churchill | NameTag **WINSTON CHURCHILL — British Prime Minister, 1940–45** | FADE | Room tone; resolute theme begins in low brass |
| S05-07 | 04:05.4–04:11.8 | s05.b7 | RAF grass airfield → sky | Pilots (new RAF preset) sprint to Spitfires (to ~248). Crane up into the sky: Spitfires against Bf 109s and bombers; contrails curl | `Plane spitfire` ×3, `bf109` ×3, `bomber` ×4; contrails (new FX) | Tilt-up crane, then follow the dogfight (internal change) | DateCard TL (245.8–251.4): **1940** / **BATTLE OF BRITAIN** / sub "Summer and autumn 1940" | CUT | Engines start, aircraft roar, short distant gun bursts (restrained); heroic |
| S05-08 | 04:11.8–04:15.5 | s05.b8 (first half) | London at night: skyline with St Paul's dome (`Skyline dome`), searchlights, barrage balloons, glow of fires on the skyline | No figures in the danger zone | `Searchlights`, `BarrageBalloon` ×3, `Plane bomber` overhead, distant `Fire`, `Flak` | Slow pan across the skyline | DateCard TL (252.0–255.4): **1940–1941** / **THE BLITZ** | DIP | Distant air-raid siren, bomber drone, distant crumps; sombre, not heroic |
| S05-09 | 04:15.5–04:19.4 | s05.b8 (second half) | London Underground platform used as a shelter (tiles, generic "UNDERGROUND" sign; not the TfL roundel) | Families lie and sit under blankets: Anna holds Leo, woman2, kid2, an elderly couple. Dust drifts down at each muffled thud; Leo looks up, scared; Anna comforts him | `Particles dust`, a flickering lamp | Slow push-in | FactPill UC (255.8–259.3): **MORE THAN 40,000 CIVILIANS KILLED IN THE BLITZ** (heads kept below y 520) | FADE | Muffled thuds, hushed voices; sustained sombre strings |
| S05-10 | 04:19.4–04:30.0 | s05.b9 + tail | Morning after: bomb-damaged London street (`Building damaged`, `Rubble`); St Paul's dome through clearing smoke | Anna, neighbours and a warden pass bricks along a chain and sweep; Leo carries a cup of tea to a warden. **~264 s:** crane up past the rooftops into the sky as three Spitfires pass in the afternoon light | `Smoke` clearing, `Rubble`, `Plane spitfire` ×3, `Clouds` | Crane up, slow (internal change at ~264) | — | FADE | Birds return, bricks, a broom; the resolute theme swells through the tail and resolves by 269.5 |

### s06 — Chapter 5: The War Becomes Global · 04:30–05:30 · 10 shots
Music: vast and grim for Barbarossa; cold winds and a surge for Moscow; a new tense colour for the Pacific; **a stop** after Pearl Harbor; a rising, resolved theme for the American entry; a big, ominous chord for the global globe.

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S06-01 | 04:30.0–04:37.9 | s06.b0 | Dawn on the Soviet border: flat plain, birch trees, river | A long line of German tanks starts up; infantry advance; aircraft fly east overhead; artillery flashes along the horizon | `Tank` ×6, `Plane bf109` / `stuka` ×4, horizon flashes (new FX) | Wide, slow push forward | ChapterBanner (270.0–272.5): **CHAPTER 5 · THE WAR BECOMES GLOBAL**; DateCard TL (272.6–277.6): **22 JUNE 1941** / **OPERATION BARBAROSSA** / sub "Germany invades the Soviet Union" | INK | Rumbling engines, distant artillery; vast, grim brass |
| S06-02 | 04:37.9–04:44.5 | s06.b1 | Map: Eastern Europe | A front line draws itself from the Baltic to the Black Sea; three big grey arrows head for Leningrad, Moscow and Kyiv; a measuring bracket runs along the front | `GeoMap` (eastern view), `MapArrow` ×3, bracket | Pan east, zoom 1.2 | FactPill RM (278.3–284.3): **MORE THAN 3 MILLION AXIS SOLDIERS**; FactPill by the bracket (280.8–284.3): **A FRONT NEARLY 3,000 KM LONG** | FADE | Music drives |
| S06-03 | 04:44.5–04:50.7 | s06.b2 | Soviet village road; a village burns far in the distance | Civilians with hand carts and bundles walk away down the road (sombre, unhurried); Soviet soldiers (`sovietSoldier`) march the other way towards the front | Distant `Fire`, `Smoke`, hand carts (new prop) | Slow lateral track | TermCard TR (284.8–290.5): **EASTERN FRONT** — "The war between Germany and its allies and the Soviet Union, 1941–45" | CUT | Wind, cart wheels, distant guns; sombre |
| S06-04 | 04:50.7–04:58.6 | s06.b3 | Snowy road outside Moscow; faint Kremlin onion domes on the horizon | German soldiers in summer uniform shiver ("cold" expression); a tank stalls in a drift; a roadside sign reads "MOSCOW". **~295 s:** pan right as Soviet troops in white winter kit (`sovietWinter`) and T-34s charge out of a birch wood | `Particles snow` (heavy), stalled `Tank`, T-34 (new variant) | Pan right (internal change at ~295) | FactPill RM (295.0–298.5): **DECEMBER 1941: THE RED ARMY STRIKES BACK** | FADE | Howling wind, straining engines, then a surge; 0.4 s pause |
| S06-05 | 04:58.6–05:03.2 | s06.b4 | East Asia map, 1941 | Shaded areas under Japanese control (Manchuria, occupied coastal China, French Indochina) with an arrow towards South-East Asia. **Extents to be verified by the researcher**; if unverified, show arrows only | `GeoMap eastAsia` | Pan south | MapLabel **JAPAN**; small label **APPROXIMATE AREAS, 1941** | WIPE | New tense colour (woodwind, low strings) |
| S06-06 | 05:03.2–05:07.2 | s06.b5 (first half) | Pearl Harbor, Sunday morning: battleships moored around Ford Island, green hills | Japanese aircraft dive from the upper right; ships are hit and burn; sailors run along the decks at a distance | `Plane zero` ×4 (plus naval bombers, could), `Ship warship burning`, `Explosion` on ships, `Smoke` | Wide, shake 1.5 | DateCard TL (303.4–307.2): **7 DECEMBER 1941** / **PEARL HARBOR** / sub "Hawaii" | CUT | Engines, muffled explosions, alarm klaxon; tension |
| S06-07 | 05:07.2–05:11.1 | s06.b5 (second half) | Oahu airfield: hangars and rows of parked US aircraft | Parked planes burn in rows; ground crew take cover at a distance (kneel / cower) | Parked US aircraft (`usstar`), `Fire`, `Smoke` | Lateral pan along the burning rows | FactPill RM (307.4–311.0): **OAHU'S AIRFIELDS WERE ATTACKED TOO** | CUT | Fire crackle, distant engines |
| S06-08 | 05:11.1–05:15.2 | s06.b6 | Harbour aftermath: smoke drifting over still water | Sailors (`sailor`) stand still in a launch, caps removed, heads bowed | `Smoke`, calm `Sea`; desaturate 30% | Very slow push-in | FactPill UC (311.4–315.2): **MORE THAN 2,400 AMERICANS KILLED** | FADE | **Music out**; water lapping, then a single sustained note |
| S06-09 | 05:15.2–05:22.2 | s06.b7 | US Congress chamber (lectern, flags, microphones) → desk | Roosevelt (name tag) at the lectern, determined; members rise and applaud. **~318.6 s:** pan to a desk newspaper: "GERMANY DECLARES WAR ON THE UNITED STATES · 11 DECEMBER 1941" | `Flag us`, microphones, `Newspaper` | Slow push, then pan (internal change) | DateCard TL (315.4–320.0): **DECEMBER 1941** / **UNITED STATES ENTERS THE WAR** | FADE | Applause swell, paper rustle; rising, resolved theme |
| S06-10 | 05:22.2–05:30.0 | s06.b8 | Dark navy; slowly rotating `Globe` | Glowing hotspots light up one after another | `Globe` with glow markers | Slow spin and pull-back | MapLabels popping in sequence: **EUROPE**, **AFRICA**, **ASIA**, **THE PACIFIC** | IRIS | Big ominous chord that spreads and then softens |

### s07 — Chapter 6: The Turning Points · 05:30–06:30 · 9 shots (narration ends ≈ 06:20.8; music tail ≈ 9 s)
Music: a hopeful motif enters; tense for Midway; building for El Alamein; tense minor at Stalingrad; subdued for the surrender; rhythmic, optimistic industry music that builds through the tail into D-Day.

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S07-01 | 05:30.0–05:34.0 | s07.b0 | History room | Guide draws a chalk line graph that falls, then curves upwards; taps the up-curve, hopeful (determined) | Chalk graph (line-art kit) | Static with a gentle push | ChapterBanner (330.0–332.5): **CHAPTER 6 · THE TURNING POINTS** | INK | Chalk; hopeful motif |
| S07-02 | 05:34.0–05:39.0 | s07.b1 (first half) | Pacific map: Midway | Blue US carrier icons and red-dot Japanese carrier icons converge on Midway | `GeoMap pacific`, carrier icons (new) | Zoom onto Midway | DateCard TL (334.3–338.8): **1942** / **MIDWAY** / sub "June 1942" | FADE | Tense strings |
| S07-03 | 05:39.0–05:44.0 | s07.b1 (second half) | Open ocean, broken cloud | US Navy dive bombers peel off through the cloud and dive on a Japanese carrier (hinomaru on the deck); the carrier smokes. A tally strip of four carrier silhouettes darkens one by one in the upper right | Dive bomber (new), Japanese carrier variant `Ship carrier burning`, `Smoke` | High angle following the dive | FactPill RM (339.6–343.9): **FOUR JAPANESE CARRIERS SUNK** + tally strip | CUT | Dive whine, engine roar, distant blast |
| S07-04 | 05:44.0–05:51.0 | s07.b2 | North African desert at night → first light | Artillery flashes on the horizon; British and Commonwealth tanks and infantry advance through dust. Montgomery (name tag, beret) watches through binoculars from a tank | `Tank` (desert colours) ×4, dust, horizon flashes | Wide, push forward | DateCard TL (344.3–348.6): **1942** / **EL ALAMEIN** / sub "October–November 1942"; NameTag **GEN. BERNARD MONTGOMERY — British Eighth Army** | WIPE | Artillery rumble, engines, wind; building |
| S07-05 | 05:51.0–05:59.7 | s07.b3 | Stalingrad ruins in snow, the Volga behind, grain elevator silhouette → map | 351–354.8: Soviet soldiers crouch-run through the rubble. 354.8: MATCH to the map: two red pincer arrows close around a grey pocket | `Building damaged`, `Rubble`, `Particles snow`; `GeoMap`, `MapArrow` | Push through the ruins → match-cut to the map (internal change) | MapLabel **STALINGRAD** · **RIVER VOLGA**; FactPill RM (355.4–359.6): **MORE THAN 250,000 AXIS TROOPS TRAPPED (EST.)** | FADE | Wind, distant gunfire; tense minor |
| S07-06 | 05:59.7–06:05.9 | s07.b4 | Grey snowfield | A long line of Axis soldiers in ragged winter coats walk with hands up past Soviet guards. Sombre, not triumphant | `Particles snow` | Slow lateral track | DateCard TL (359.9–363.6): **1943** / **GERMAN DEFEAT AT STALINGRAD** / sub "February 1943"; FactPill RM (362.4–365.8): **AROUND 91,000 AXIS PRISONERS TAKEN** | CUT | Wind, crunching snow; subdued; 0.4 s pause |
| S07-07 | 06:05.9–06:08.7 | s07.b5 | History room | On the board: chalk ship, tank and ruined-city icons labelled MIDWAY · EL ALAMEIN · STALINGRAD, joined by plus signs. The Guide raises one finger, shakes his head, shrugs | Chalk icons | Static | Chalk only | CUT | Chalk; light pause in the music |
| S07-08 | 06:08.7–06:18.0 | s07.b6–b7 (first part) | US aircraft factory: moving assembly line | Workers (`worker`, `workerW` — women in industry) rivet and push; finished bombers roll out through the hangar doors in a line | Factory line (new), `Plane bomber` rows | Long lateral track (camera reaches the open doors at ~373.5: internal change) | FactPill UC (369.8–377.6): **THE ALLIES BUILT MORE THAN TWICE AS MANY AIRCRAFT AS THE AXIS** (exact wording; figures inside the factory kept below y 520) | CUT | Riveting, machinery rhythm; rhythmic, optimistic |
| S07-09 | 06:18.0–06:30.0 | s07.b7 (end) + tail | **Three-panel split:** Soviet tank line (T-34s) / British shipyard (a ship slides down the slipway) / US airfield; panels merge into a dusk sky | Workers cheer the launch; panels merge at ~381 into one sky where Allied bomber formations fly east over the Channel coast (leads into D-Day) | T-34 variant, `Ship` launch, `Plane heavy` formations, small flags (UK, US, USSR) at the panel tops | Panel wipes in L→R, then a pull-up into the sky (internal change at ~381) | — | WIPE | Machinery → engines' drone; music builds through the tail and holds a suspended chord at 389.5 |

### s08 — Chapter 7: D-Day and the Liberation of Europe · 06:30–07:30 · 10 shots (narration ends ≈ 07:22.5; music tail ≈ 7.5 s)
Music: determined pulse; tension at night; a swell for the armada; grave, then hopeful on the beach; tense pizzicato for the resistance; brief joy for Paris; driving for the east; ticking and darkening for the end of the section.

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S08-01 | 06:30.0–06:36.8 | s08.b0 | Allied HQ briefing room with a big wall map of Europe, 1944 (front line in Italy, Eastern Front) | Eisenhower (name tag) points to Normandy on the wall map; officers lean in | Wall map (new) with Italy front line | Push towards the map | ChapterBanner (390.0–392.5): **CHAPTER 7 · D-DAY AND THE LIBERATION OF EUROPE**; NameTag **GEN. DWIGHT D. EISENHOWER — Supreme Allied Commander**; FactPill on the map area (392.8–396.6): **ALLIES FIGHTING IN ITALY SINCE 1943** | INK | Room murmur; determined pulse |
| S08-02 | 06:36.8–06:40.4 | s08.b1 | Night over Normandy hedgerow fields; a church spire in the distance | Dakotas pass over; paratroopers (new preset) jump and their canopies bloom; gliders glide down into the fields | `Plane dakota` ×4, parachutes (new) ×10, gliders (new) ×2, tracer `Flak` | Wide, slight tilt down | DateCard TL (397.0–400.4): **6 JUNE 1944** / **D-DAY**; TermCard TR (397.6–402.8, carries into S08-03): **OPERATION OVERLORD** — "The Allied invasion of north-west Europe" | DIP | Aircraft drone, flak pops, wind; tension |
| S08-03 | 06:40.4–06:46.5 | s08.b2 (first part) | Dawn on the Channel: a vast armada to the horizon | Landing craft plough towards the camera; barrage balloons fly above the ships; bombers overhead | `Ship warship` (many), `LandingCraft` ×6, `BarrageBalloon`, `Plane heavy` | Wide pull-back to reveal the scale | FactPill RM (403.0–406.4): **THE LARGEST SEABORNE INVASION IN HISTORY** | CUT | Sea, engines, distant naval guns; music swells |
| S08-04 | 06:46.5–06:54.1 | s08.b2 (second part) | Normandy map (`GeoMap normandy`) | The five beaches label in sequence, west to east: UTAH, OMAHA (US), GOLD (British), JUNO (Canadian), SWORD (British); parachute icons mark the airborne landings on both flanks; arrows come in from the sea | `GeoMap`, parachute icons (new), `MapArrow` | Slow pan west → east | FactPill RM (408.6–414.0): **AROUND 156,000 ALLIED TROOPS ASHORE ON D-DAY** / second line **BY SEA AND BY AIR** | FADE | Music continues |
| S08-05 | 06:54.1–07:02.5 | s08.b3 | Normandy beach: obstacles (hedgehogs), shingle, bluffs; sky changes from day to night | Ramps drop; US, British and Canadian soldiers (and Tom) wade ashore and take cover behind the shingle; a medic kneels beside a wounded soldier (no blood). **~418.3 s:** time-lapse: the sky darkens to night; troops dig in on the bluff top under flares | `LandingCraft ramp`, hedgehogs (new), `Smoke`, distant `Explosion`s in the water, sky gradient (new FX) | Low beach-level track; slow pull-back at nightfall (internal change) | FactPill RM (414.8–419.6): **ABOUT 10,000 ALLIED CASUALTIES (EST.)** | CUT | Surf, restrained distant gunfire, muffled shouts → night crickets; grave, then hopeful |
| S08-06 | 07:02.5–07:08.1 | s08.b4 | French countryside railway at night, telegraph poles | Three resistance fighters (`resistance`) crouch, plant a charge on an empty track and run; distant flash on the line; one cuts a telegraph wire | Distant `Explosion` on the empty track, `Smoke` | Low angle, then a whip-pan to the flash | — | FADE | Crickets, footsteps, a distant boom; tense pizzicato |
| S08-07 | 07:08.1–07:11.3 | s08.b5 | Paris boulevard with the Eiffel Tower; tricolours unfurling from balconies | Crowds cheer and throw flowers; an Allied jeep and a French tank roll through | `Flag fr` ×4, `Particles confetti` (petals), `Truck jeep`, `Tank` | Crane down to the crowd | DateCard TL (428.3–431.8): **AUGUST 1944** / **PARIS LIBERATED** (sub optional: "25 August 1944") | CUT | Church bells, cheering; brief joy; 0.4 s pause |
| S08-08 | 07:11.3–07:16.4 | s08.b6 | Map: Eastern Front, summer 1944 | Big red Soviet arrows smash through the centre (Belarus) | `GeoMap`, `MapArrow` | Zoom out east | FactPill RM (431.6–436.2): **JUNE 1944: OPERATION BAGRATION** | FADE | Driving music |
| S08-09 | 07:16.4–07:22.6 | s08.b7 | Map: Europe, late 1944 | Germany squeezed by arrows from the west, east and south (Italy); three gauge icons (MEN, FUEL, TIME) at the right, their needles dropping | `GeoMap`, gauge icons (new) | Slow zoom onto Germany | Gauge labels **MEN · FUEL · TIME** (right-middle) | CUT | Clock ticking under the music |
| S08-10 | 07:22.6–07:30.0 | tail (no narration) | Winter dusk on a snowy road | A German supply truck stalls; a soldier (`germanWinter`) shakes an empty fuel can and looks up as Allied bombers pass high above | `Truck`, empty fuel can (new prop), `Plane heavy` ×6, `Particles snow` | Slow push, then tilt up | — | FADE | Wind, a distant drone; sustained, darker transition into s09 |

### s09 — Chapter 8: The Fall of Nazi Germany · 07:30–08:30 · 10 shots
Music: tense and low; **drops to a solo cello or piano** for the camps and the Holocaust (no hits, no SFX except wind and candles); grim percussion for Berlin; a low drone for the bunker; lifts at the surrender stamp; joyful for VE Day; turns uneasy at the end.

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S09-01 | 07:30.0–07:35.7 | s09.b0 | Map: Europe, early 1945 | Blue Allied arrows from the west and red Soviet arrows from the east converge on Berlin; Germany's grey shrinks | `GeoMap`, `MapArrow`, Berlin `CityMarker` | Zoom towards Berlin | ChapterBanner (450.0–452.5): **CHAPTER 8 · THE FALL OF NAZI GERMANY** | INK | Tense, low |
| S09-02 | 07:35.7–07:41.1 | s09.b1 | Grey country road, bare trees, low cloud (desaturated 40%) | A small group of Allied soldiers walk slowly, slow down, and stop. Ahead: a barbed-wire fence, a wooden watchtower and a **plain gate with no inscription** | `BarbedWire`, watchtower (new) | Slow forward track | — | FADE (slow, 1 s) | **Music drops to a solo cello**; wind only |
| S09-03 | 07:41.1–07:48.6 | s09.b2 | Inside the fence line: rows of empty barracks, grey sky | Survivors in striped clothes stand and sit quietly near the wire, seen at mid-distance, **with dignity**. A soldier removes his helmet; another offers a blanket and bread; a survivor receives them with both hands | Barracks (new), `BarbedWire` | Very slow lateral track; held | Stacked FactPill TR (462.0–468.4): **CAMP LIBERATIONS** — **MAJDANEK · JULY 1944** / **AUSCHWITZ · JANUARY 1945** / **BUCHENWALD, BERGEN-BELSEN, DACHAU · APRIL 1945** | FADE | Wind; solo cello; 0.5 s pause |
| S09-04 | 07:48.6–07:57.1 | s09.b3 | Black; one candle lights, then rows of candles appear slowly in perspective | — | `Candle` ×N, warm flicker | Very slow push | Memorial card, upper centre (469.4–477.0): **THE HOLOCAUST** / **APPROXIMATELY SIX MILLION JEWS MURDERED** | DIP | 0.5 s silence, then a single sustained note; candle flicker only. **No counter** |
| S09-05 | 07:57.1–08:06.0 | s09.b4 | Candles continue; the camera reveals a plain memorial wall (no symbols) in candlelight | — | `Candle`s, memorial wall (new) | Slow pull-back | Upper centre: heading **MILLIONS OF OTHERS PERSECUTED AND KILLED** (477.6), then one by one: **ROMA** · **DISABLED PEOPLE** · **POLISH CIVILIANS** · **SOVIET PRISONERS OF WAR** (each ≥ 40 px, hold to 485.6) | (continuous; FADE between the candle layouts) | Sustained note; **0.7 s held silence at the end** |
| S09-06 | 08:06.0–08:10.1 | s09.b5 | Berlin in ruins: rubble streets, Brandenburg Gate silhouette, smoke | Soviet soldiers and T-34s advance through the rubble | T-34 variant, `Rubble`, `Smoke`, distant `Fire` | Track with the tanks | FactPill RM (486.4–490.0): **APRIL 1945: BATTLE OF BERLIN** | CUT (sharp, after the silence) | Distant guns, engines; grim low percussion |
| S09-07 | 08:10.1–08:16.3 | s09.b6 | Bunker entrance (concrete block in a rubble-strewn garden) → concrete corridor | **No figure is shown.** A single bulb swings; a heavy steel door closes slowly; the light fades | Swinging lamp, door | Slow push into the corridor | DateCard TL (490.3–496.0): **30 APRIL 1945** / **HITLER DIES** / sub "In his Berlin bunker" | FADE | Muffled shelling, a door thud; low drone |
| S09-08 | 08:16.3–08:20.0 | s09.b7 (first half) | Plain room with a long table | German officers (group label **GERMAN DELEGATION**) sign; Allied officers watch | `Document` "UNCONDITIONAL SURRENDER", `Stamp` | Push towards the pen | Stamp on the document (497.6): **UNCONDITIONAL SURRENDER**; FactPill RM (496.6–500.0): **7–8 MAY 1945** | CUT | Pen scratch, silence; music lifts at the stamp |
| S09-09 | 08:20.0–08:24.1 | s09.b7 (second half) | London street with bunting, crowds | Crowds cheer and dance; Anna and Leo hug; Tom appears in uniform and lifts Leo up (the end of his fictional arc) | Bunting (new), `Flag uk` / `us` / `su` / `fr`, `Particles confetti` | Crane up over the crowd | DateCard TL (500.2–504.0): **8 MAY 1945** / **VICTORY IN EUROPE** (Anna, Tom and Leo framed right, heads at y > 380) | FADE | Cheering, church bells; joyful; 0.4 s pause |
| S09-10 | 08:24.1–08:30.0 | s09.b8 | The same celebration → evening sky → sea horizon | The crane continues upwards; the crowd's noise fades; the sky turns to evening; pan west to the sun setting over the sea, where warship silhouettes appear on the horizon | `Sea`, `Ship` silhouettes, low `Sun`, sky gradient | Crane and pan to the horizon (internal change) | — | (continuous) | The crowd fades, a single bell; music turns uneasy |

### s10 — Chapter 9: How World War II Finally Ended · 08:30–09:30 · 10 shots
Music: tense and steady; grave for Okinawa; tight for the refusal; **silence after each atomic flash**; low urgent percussion for Manchuria; silence, then soft for the broadcast; solemn (not triumphant) resolution for the signing; thoughtful sparse piano for the debate.

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S10-01 | 08:30.0–08:36.1 | s10.b0 | Pacific map | Island-hopping arrows: Guadalcanal → Saipan → Iwo Jima → Okinawa, towards Japan | `GeoMap pacific`, `MapArrow`, `CityMarker`s | Pan north-west towards Japan | ChapterBanner (510.0–512.5): **CHAPTER 9 · HOW WORLD WAR II FINALLY ENDED** | FADE (slow, from the evening sea) | Tense, steady |
| S10-02 | 08:36.1–08:43.5 | s10.b1 | Okinawa: rain, a muddy ridge, a fleet offshore | US troops (`usSoldier`) crouch and advance; warships fire from offshore; in the middle distance civilian silhouettes walk away down a road in the rain (sombre) | `Particles rain`, `Ship warship`, `Smoke`, distant flashes | Slow, low lateral track | DateCard TL (516.4–520.4): **APRIL–JUNE 1945** / **OKINAWA**; FactPill RM (519.6–523.4): **WELL OVER 100,000 SOLDIERS AND CIVILIANS KILLED** | FADE | Rain, distant guns; grave |
| S10-03 | 08:43.5–08:46.8 | s10.b2 | Tokyo: a plain cabinet room | Japanese leaders (group label **JAPAN'S LEADERS**) sit stiffly; one slides a document away | `Document` "ALLIED SURRENDER TERMS · POTSDAM · 26 JULY 1945" | Static, slight push | Document text only | CUT | Clock; tight music; 0.5 s pause |
| S10-04 | 08:46.8–08:52.9 | s10.b3 | Clear summer morning over Hiroshima: a river-delta city of low buildings and bridges, with the domed Industrial Promotion Hall | **No people in close view.** A single US bomber passes very high, leaving a contrail. At the end (~532.6) the frame turns white | `Plane heavy` (US), contrail, Hiroshima city (new), `ScreenFlash` | Very high and wide, slow push | DateCard TL (527.1–532.3): **6 AUGUST 1945** / **HIROSHIMA** | FADE | Faint cicadas and birds, a distant high engine drone; **everything cuts at the flash. No explosion SFX** |
| S10-05 | 08:52.9–09:00.0 | s10.b4 | White slowly fades to grey: the flattened city in silhouette, the skeleton of the dome, ash drifting | **No people.** | `Particles ash`, haze `Smoke`, slow flash decay (FX) | Locked off, imperceptible pull-back | FactPill UC (534.6–539.6): **HIROSHIMA: ABOUT 90,000–140,000 DEAD BY THE END OF 1945 (EST.)** | (from the flash) | **1.5 s total silence**, then a low sustained tone and faint wind; no melody; 0.5 s pause |
| S10-06 | 09:00.0–09:08.6 | s10.b5 | East Asia map | Red Soviet arrows pour into Manchuria from the west, north and east | `GeoMap eastAsia`, `MapArrow` ×3 | Zoom out | DateCard TL (540.2–546.0): **8 AUGUST 1945** / **SOVIET UNION DECLARES WAR ON JAPAN** | FADE | Low urgent percussion |
| S10-07 | 09:08.6–09:13.0 | s10.b6 | Nagasaki: harbour and hills seen across the water, morning | **No people.** A soft white glow swells behind the hills; the scene turns grey; ash drifts | Harbour city (new), softer flash-behind-hills (FX), `Particles ash` | Locked off | DateCard TL (548.8–551.8): **9 AUGUST 1945** / **NAGASAKI**; FactPill UC (550.6–555.0, overlapping into the opening of S10-08 above the figures): **NAGASAKI: ABOUT 60,000–80,000 DEAD BY THE END OF 1945 (EST.)** | CUT | **1 s silence**, wind; 0.4 s pause |
| S10-08 | 09:13.0–09:17.5 | s10.b7 (first half) | Japanese home interior with sliding screens; radio on a low table | A family and a neighbour kneel around the radio, heads bowed; one woman covers her mouth. **Hirohito is not drawn** | `Radio` | Slow push | DateCard TL (553.3–557.4): **15 AUGUST 1945** / **JAPAN ANNOUNCES SURRENDER** / sub "Emperor Hirohito's radio broadcast" (all heads at y > 420) | FADE | Radio crackle with no intelligible speech; music silent, then soft |
| S10-09 | 09:17.5–09:21.7 | s10.b7 (second half) | USS *Missouri* deck in Tokyo Bay: gun turret, sailors along the rails, a table with documents | MacArthur (name tag) signs at the table; the Japanese delegation (group label **JAPANESE DELEGATION**: civilians in top hats and morning coats, officers in uniform) stands opposite; aircraft fly over | Battleship deck (new), `Plane` formation, `Flag us`, `Document` | Wide, then push to the table | DateCard TL (557.7–561.6): **2 SEPTEMBER 1945** / **FORMAL SURRENDER** / sub "Aboard USS Missouri, Tokyo Bay"; NameTag **GEN. DOUGLAS MACARTHUR — Allied commander** | CUT | Sea wind, pens, aircraft overhead; solemn resolution |
| S10-10 | 09:21.7–09:30.0 | s10.b8 (+ tail) | History room | The Guide draws a chalk balance scale: left pan "ATOMIC BOMBS", right pan "SOVIET INVASION"; it tips one way, then the other; the Guide opens his palms (talkGesture), thoughtful | Chalk balance (line-art kit) | Slow push | TermCard TR (562.0–568.6): **A DEBATE** — "Historians disagree about how much each shaped Japan's decision" | WIPE | Chalk; thoughtful sparse piano |

### s11 — Chapter 10: The Human Cost and the Legacy · 09:30–10:00 · 6 shots
Music: reflective piano and strings; a hopeful turn for the UN, an uneasy one for the Cold War; sombre for the lesson; a warm theme rises for ordinary people and resolves on the end card.

| Shot | Time | Beats | Location / background | Characters & actions | Vehicles / props / FX | Camera | On-screen text | Transition in | SFX / music mood |
|---|---|---|---|---|---|---|---|---|---|
| S11-01 | 09:30.0–09:35.9 | s11.b0 | War cemetery at dusk: rows of plain white headstones over a hill, a single tree | A lone woman (woman2) lays flowers far in the distance | `Birds`, low `Sun`, `Tree` | Slow lateral track | ChapterBanner (570.0–572.5): **CHAPTER 10 · THE HUMAN COST AND THE LEGACY**; FactPill UC (571.4–575.8): **AN ESTIMATED 60 MILLION OR MORE DEAD** / second line **MOST OF THEM CIVILIANS** | DIP (slow) | Wind, distant birds; reflective piano |
| S11-02 | 09:35.9–09:41.9 | s11.b1 | 575.9: a hall where the UN flag rises on a pole and delegates sign the Charter. ~578.8: MATCH to the `Globe`, with the USA and USSR highlighted and a crack opening between them | Delegates (generic) sign | `Flag un`, `Document` "UNITED NATIONS CHARTER", `Globe` highlights | Push → match to the globe (internal change) | FactPill RM (576.1–579.0): **1945: UNITED NATIONS FOUNDED**; TermCard TR (578.9–583.5): **THE COLD WAR** — "Decades of rivalry between the United States and the Soviet Union" | FADE | Hopeful, then an uneasy turn; 0.4 s pause |
| S11-03 | 09:41.9–09:47.0 | s11.b2 | History room, dimmer evening light | The Guide, serious (sad), writes "HATRED + UNCHECKED AGGRESSION → CATASTROPHE" | Chalk | Slow push | Chalk only | WIPE | Sombre strings |
| S11-04 | 09:47.0–09:51.1 | s11.b3 | Warm morning light on an open road | A line of ordinary illustrative people walks towards the camera: Anna (dusty from rubble), a factory worker (`workerW`), a nurse, a Soviet soldier, a resistance fighter, a Chinese soldier, a sailor, Tom. Quietly determined faces | `Sun`, `Clouds` | Slow pull-back as they walk | — | FADE | The warm theme rises; 0.4 s pause |
| S11-05 | 09:51.1–09:54.6 | s11.b4 | History room, now in warm light | The Guide lightly crosses out "BATTLES" and "LEADERS" (still legible) and writes "PEOPLE" large | Chalk | Push | Chalk only | CUT | Chalk; music |
| S11-06 | 09:54.6–10:00.0 | s11.b5 + end card | Sunrise hill | A big crowd of stick figures in the period clothes seen through the episode; Leo waves to the camera. Crowd kept in the lower half (heads below y 640) | `Sun`, `Birds`, crowd system | Slow pull-back and rise | **End card** (595.5–600.0), upper centre: **THE HUMAN STORY** / *History is made by people.* / button **SUBSCRIBE FOR THE NEXT CHAPTER**. Held to the last frame (no black frames at the end) | FADE | The music resolves; final sting lands at ≈598.3 s and rings out to 600.0 |

---

## 3. On-screen text checklist (for QC)

### 3.1 Required cards (from the brief) — all 26 placed
| # | Card (exact wording) | Shot | Source |
|---|---|---|---|
| 1 | 1919 TREATY OF VERSAILLES | S02-03 | P1 C1 |
| 2 | 1929 GREAT DEPRESSION | S02-07 | P1 C2 |
| 3 | 1933 HITLER BECOMES CHANCELLOR (sub 30 January 1933) | S03-03 | P1 C3 |
| 4 | 1938 AUSTRIA ANNEXED | S03-07 | P1 C4 |
| 5 | 1938 MUNICH AGREEMENT | S03-08 | P1 C5, #30 |
| 6 | 1 SEPTEMBER 1939 GERMANY INVADES POLAND | S04-04 | P1 C6 |
| 7 | 3 SEPTEMBER 1939 BRITAIN AND FRANCE DECLARE WAR | S04-06 | P1 C7 |
| 8 | 17 SEPTEMBER 1939 SOVIET UNION INVADES EASTERN POLAND | S04-08 | P1 C8 |
| 9 | MAY–JUNE 1940 FALL OF FRANCE | S05-05 | P1 C9 |
| 10 | 1940 BATTLE OF BRITAIN | S05-07 | P1 C10 |
| 11 | 1940–1941 THE BLITZ | S05-08 | P1 C11 |
| 12 | 22 JUNE 1941 OPERATION BARBAROSSA | S06-01 | P1 C12 |
| 13 | 7 DECEMBER 1941 PEARL HARBOR | S06-06 | P1 C13 |
| 14 | DECEMBER 1941 UNITED STATES ENTERS THE WAR | S06-09 | P1 C14 |
| 15 | 1942 MIDWAY | S07-02 | P2 cards |
| 16 | 1942 EL ALAMEIN | S07-04 | P2 cards |
| 17 | 1943 GERMAN DEFEAT AT STALINGRAD | S07-06 | P2 cards |
| 18 | 6 JUNE 1944 D-DAY | S08-02 | P2 cards |
| 19 | AUGUST 1944 PARIS LIBERATED | S08-07 | P2 cards |
| 20 | 30 APRIL 1945 HITLER DIES | S09-07 | P2 cards |
| 21 | 8 MAY 1945 VICTORY IN EUROPE | S09-09 | P2 cards |
| 22 | THE HOLOCAUST — APPROXIMATELY SIX MILLION JEWS MURDERED | S09-04 | P2 cards; P2 #22 |
| 23 | 6 AUGUST 1945 HIROSHIMA | S10-04 | P2 cards |
| 24 | 9 AUGUST 1945 NAGASAKI | S10-07 | P2 cards |
| 25 | 15 AUGUST 1945 JAPAN ANNOUNCES SURRENDER | S10-08 | P2 cards; P2 #35 |
| 26 | 2 SEPTEMBER 1945 FORMAL SURRENDER | S10-09 | P2 cards; P2 #35 |
| — | Title: THE HUMAN STORY / Episode 1: World War II | S01-06 | brief |
| — | End card: THE HUMAN STORY — History is made by people. — SUBSCRIBE FOR THE NEXT CHAPTER | S11-06 | brief |

### 3.2 Additional cards and pills (each traced to the fact-checks; QC please confirm)
| Text | Shot | Source |
|---|---|---|
| SUMMER 1939 / EUROPE | S01-01 | script s01.b0 |
| Newspaper: DANZIG CRISIS · AUGUST 1939 | S01-01/02 | P1 #2 note (Danzig crisis, summer 1939); researcher spot-check suggestion |
| Newspaper: WAR BREAKS OUT IN EUROPE · SEPTEMBER 1939 | S01-03 | script.md on-screen suggestion; P1 C6/C7 |
| NOVEMBER 1918 / GERMANY DEFEATED / The Kaiser abdicates | S02-02 | script s02.b1 (P1, VERIFIED) |
| AROUND 13% OF ITS EUROPEAN TERRITORY LOST · ALL COLONIES LOST · ARMY CAPPED AT 100,000 MEN · HUGE REPARATIONS | S02-04/05 | script s02.b3 (P1, VERIFIED/NUANCE #12) |
| WEIMAR REPUBLIC term card | S02-06 | script s02.b5 |
| Wall Street Crash, October 1929 | S02-07 | P1 C2 |
| 1932: AROUND 6 MILLION GERMANS OUT OF WORK | S02-08 | P1 #16 (no percentage, per researcher) |
| NAZI PROPAGANDA (label) | S03-02 | CLAUDE.md propaganda rule |
| RIVAL PARTIES BANNED · FREE PRESS CRUSHED · DICTATORSHIP | S03-04 | script s03.b3 |
| ANTISEMITISM term card | S03-05 | definitional |
| JEWISH GERMANS STRIPPED OF THEIR RIGHTS · REARMAMENT | S03-06 | script s03.b5 |
| 1936 RHINELAND REOCCUPIED | S03-07 | P1 #28 |
| Germany, Britain, France and Italy sign · CZECHOSLOVAKIA NOT INVITED | S03-08 | P1 #30 |
| MARCH 1939 GERMANY OCCUPIES THE CZECH LANDS · APPEASEMENT term + FAILED | S03-10 | script s03.b10 |
| AUGUST 1939 NAZI–SOVIET PACT · GERMAN/SOVIET SPHERE | S04-02/03 | P1 #34–35 |
| 1931 JAPAN INVADES MANCHURIA · 1937 FULL-SCALE WAR AGAINST CHINA | S04-09 | script s04.b9 (P1, VERIFIED) |
| APRIL 1940 DENMARK AND NORWAY INVADED · MAY 1940: NETHERLANDS · BELGIUM · LUXEMBOURG · FRANCE | S05-02 | script s05.b1–b2 |
| MORE THAN 330,000 TROOPS EVACUATED · MOST LEFT FROM THE HARBOUR MOLE ON LARGER SHIPS | S05-04 | P1 #48–49 (338,226; 239,465 from the mole) |
| Summer and autumn 1940 (Battle of Britain sub) | S05-07 | P1 C10 (10 July–31 Oct) |
| MORE THAN 40,000 CIVILIANS KILLED IN THE BLITZ | S05-09 | P1 #55 |
| MORE THAN 3 MILLION AXIS SOLDIERS · A FRONT NEARLY 3,000 KM LONG | S06-02 | P1 #58–59 |
| EASTERN FRONT term card (1941–45) | S06-03 | script s06.b2 |
| DECEMBER 1941: THE RED ARMY STRIKES BACK | S06-04 | P1 #61 (5–6 Dec 1941) |
| APPROXIMATE AREAS, 1941 (Japan) | S06-05 | **needs researcher verification of the extents** |
| OAHU'S AIRFIELDS WERE ATTACKED TOO | S06-07 | P1 #63 note |
| MORE THAN 2,400 AMERICANS KILLED | S06-08 | script s06.b6 (P1, VERIFIED) |
| Newspaper: GERMANY DECLARES WAR ON THE UNITED STATES · 11 DECEMBER 1941 | S06-09 | P1 #66, C14 |
| June 1942 · FOUR JAPANESE CARRIERS SUNK | S07-02/03 | P2 #2 |
| October–November 1942 (El Alamein sub) | S07-04 | P2 #4 |
| MORE THAN 250,000 AXIS TROOPS TRAPPED (EST.) · AROUND 91,000 AXIS PRISONERS TAKEN · February 1943 | S07-05/06 | P2 figures table; P2 #6 |
| THE ALLIES BUILT MORE THAN TWICE AS MANY AIRCRAFT AS THE AXIS | S07-08 | P2 figures table (only permitted wording) |
| ALLIES FIGHTING IN ITALY SINCE 1943 | S08-01 | P2 #10 |
| OPERATION OVERLORD term card | S08-02 | P2 #11 |
| THE LARGEST SEABORNE INVASION IN HISTORY | S08-03 | P2 #12 |
| UTAH · OMAHA · GOLD · JUNO · SWORD labels | S08-04 | **standard, but not yet listed in the research file. Researcher to add a source** |
| AROUND 156,000 ALLIED TROOPS ASHORE ON D-DAY / BY SEA AND BY AIR | S08-04 | P2 figures table; P2 #13 |
| ABOUT 10,000 ALLIED CASUALTIES (EST.) | S08-05 | P2 figures table |
| 25 August 1944 (optional sub) | S08-07 | P2 #17 |
| JUNE 1944: OPERATION BAGRATION | S08-08 | P2 #18 |
| MEN · FUEL · TIME | S08-09 | script s08.b7 (P2 #19) |
| CAMP LIBERATIONS: MAJDANEK · JULY 1944 / AUSCHWITZ · JANUARY 1945 / BUCHENWALD, BERGEN-BELSEN, DACHAU · APRIL 1945 | S09-03 | P2 #21 |
| MILLIONS OF OTHERS PERSECUTED AND KILLED · ROMA · DISABLED PEOPLE · POLISH CIVILIANS · SOVIET PRISONERS OF WAR | S09-05 | P2 #23 |
| APRIL 1945: BATTLE OF BERLIN | S09-06 | P2 #24 |
| In his Berlin bunker (sub) | S09-07 | P2 #25 |
| UNCONDITIONAL SURRENDER · 7–8 MAY 1945 | S09-08 | P2 #26 |
| APRIL–JUNE 1945 OKINAWA · WELL OVER 100,000 SOLDIERS AND CIVILIANS KILLED | S10-02 | P2 #29 |
| ALLIED SURRENDER TERMS · POTSDAM · 26 JULY 1945 (document prop) | S10-03 | P2 #30 |
| HIROSHIMA: ABOUT 90,000–140,000 DEAD BY THE END OF 1945 (EST.) | S10-05 | P2 figures table |
| 8 AUGUST 1945 SOVIET UNION DECLARES WAR ON JAPAN | S10-06 | P2 #33 |
| NAGASAKI: ABOUT 60,000–80,000 DEAD BY THE END OF 1945 (EST.) | S10-07 | P2 figures table |
| Emperor Hirohito's radio broadcast · Aboard USS Missouri, Tokyo Bay | S10-08/09 | P2 #35 |
| A DEBATE term card | S10-10 | P2 #36 |
| AN ESTIMATED 60 MILLION OR MORE DEAD / MOST OF THEM CIVILIANS | S11-01 | P2 #37 (revised wording) |
| 1945: UNITED NATIONS FOUNDED · THE COLD WAR term card | S11-02 | P2 #38–39 |

---

## 4. Open questions for the user (checkpoint 3)
1. **Hiroshima and Nagasaki imagery.** The default is no mushroom cloud: city → bomber → white flash → silence → grey aftermath (no people). An optional alternative is a distant, stylised cloud column on the horizon, seen from far away. Which do you prefer?
2. **German national cross on vehicles and aircraft.** The default keeps the Balkenkreuz for identification (it is not a swastika). The alternative is unmarked grey.
3. **End card length.** The end card is visible for about 4.5 s (595.5–600 s), because the narration runs to 597.96 s and the episode is fixed at 600 s. YouTube end-screen elements need at least 5 s. Either accept this, or approve a later change of runtime (this would break the 600 s rule).
4. **Chapter numbering.** The cold open has no banner; Chapters 1–10 run from s02 to s11. Is this OK?
