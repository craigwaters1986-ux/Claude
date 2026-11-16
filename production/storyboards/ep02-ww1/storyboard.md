# Storyboard — ep02-ww1 — "World War I: From Start to Finish"

- **Version:** v1 (storyboard director, 2026-11-16). Built from the **approved script v2** (`production/scripts/ep02-ww1/script.json`, Approval 1 granted 2026-11-16) and the approved WW1 style (Approval 2).
- **Status:** AWAITING REVIEW. Needs the user's sign-off (**checkpoint 3**) before full production.
- **Length:** 720 s at 30 fps (21,600 frames), 1920×1080. **70 shots** in 11 sections. Shortest shot 6.0 s (S04-01), longest 22.1 s (S04-06) (long shots always list an internal composition change).
- **Companion files:** `asset-requests.md` (new assets only, by owner). Handoff: `production/reports/handoffs/ep02-ww1/07-storyboard.md`.
- **TIMING: SNAPPED TO FINAL NARRATION.** Every shot in- and out-point and every card time is taken from `the-human-story/episode-02-ww1/src/timeline/narration.json` (final narration, 720.000 s, bm_george). The beat anchor (`sNN.bK`) stays authoritative. The engine cues every shot and card from `beats('sNN').at(K)` / `endOf(K)`, so a later narration regeneration moves the cuts automatically. Card times inside the cells are absolute seconds.

---

## 1. Conventions

### 1.1 Beats and timing
- **Beats** are `sNN.bK`: sentence K (0-based, `script.json` order) of section NN. The engine cues with `beats('sNN').at(K)` / `endOf(K)`.
- A boundary written "bK start" or "bK end" follows the beat exactly. "bK +x s" means x seconds into that beat (a mid-sentence cut on a phrase). If narration is regenerated, keep the anchor and slide the cut.
- **Section windows are fixed:** s01 0–35, s02 35–110, s03 110–190, s04 190–260, s05 260–320, s06 320–390, s07 390–450, s08 450–500, s09 500–560, s10 560–620, s11 620–720. The first shot of each section starts exactly on the window start.
- **Narration-free stretches** (music and moving visuals carry them; never silent or empty):
  - s01→s02: 27.72–36.20 (8.5 s). The title (S01-04), then the s02 ink and chapter banner.
  - s02→s03: 100.37–110.80 (10.4 s). The falling dominoes tail of S02-07 (100.4–110.0), then the s03 ink and banner.
  - s03 187.3–190 and s04 255.6–260: carried by the ends of S03-08 and S04-06.
  - Every other section has a tail of 1.4–2.7 s, absorbed by its last shot.
  - s11 narration ends at 713.78, and the end card runs from 713.8 to 720.0.

### 1.2 Screen layout (1920×1080) and text safety
| Zone | Area | Use |
|---|---|---|
| **Channel logo** | top-left, `ChannelLogo` 104 px at x 32, y 28. **Keep-clear zone x < 170, y < 150** | Logo only, on **every shot for the whole video** (top layer). Nothing else is drawn there: no cards, tags, labels, key action or faces. Map labels in that corner are moved or dropped. |
| Chapter banner | top centre, y 32–92 | `ChapterBanner`, first 2.5 s of s02–s11 |
| Date card (TL) | x 70, **y 150** (engine default), up to ~196 px tall | `DateCard` |
| Term card (TR) | x = W − 70, y 120, 640 px wide | `TermCard` |
| Fact pill (RM / UC) | right-middle (x 1150–1850, y 340–620) or upper-centre (y 300–480) | `FactPill`, `ListPill`, `Stamp` |
| Quote / memorial card | centre, y 300–700 | `MemorialCard` (quotes, poem, sombre text) |
| Name tag | under or beside the figure | yellow `NameTag`, **real people only** |
| **Caption band** | y ≥ 900 | **Subtitles only.** Feet and ground may extend into it. |

- **Never over faces.** With a TL or TR card visible, heads sit at y > 360 or on the far side of frame. With an UC pill, keep faces out of y 280–500.
- **Readability:** Montserrat heavy, fact text ≥ 36 px, high-contrast panels. Each card stays ≥ 3 s (or one full beat), fades 0.4 s, and holds still while visible. No more than two text elements at once (chapter banner excepted).
- **British English** throughout: "kilometres", "mobilise", "defence", "per cent", "Compiègne". Dates are "28 June 1914" style. Estimates say "ABOUT", "AROUND", "MORE THAN" or "(EST.)".

### 1.3 Transitions
| Code | Meaning (engine `Shot` / `Camera`) |
|---|---|
| CUT | hard cut |
| FADE | 12-frame crossfade (default) |
| WIPE | diagonal wipe |
| DIP | dip through black (sombre or night changes) |
| INK | chapter transition: `InkWipe` (20 frames) on the section boundary, then `ChapterBanner` |
| MATCH | in-shot match or morph (e.g. sky → map), built inside one shot |

Chapter transitions are INK (the s02→s03 ink is centred on the glowing Sarajevo dot), except two sombre ones: s05→s06 slow FADE (out of the executions card), s10→s11 slow DIP (out of the 11 o'clock silence).

### 1.4 Chapter banners
s01 is the cold open with **no banner**; the title closes it. s02–s11 are **CHAPTER 1–10**, using the `script.json` chapter names:
1 Europe Before 1914 · 2 Sarajevo and the July Crisis · 3 1914: The War of Movement Stops · 4 Life in the Trenches · 5 A World War · 6 1916: Verdun and the Somme · 7 The Home Front · 8 1917: The Turning Year · 9 1918: The Last Battles · 10 The Cost and the Legacy.
YouTube chapters should match (00:00 cold open + 10 chapters).

### 1.5 Movement rule
Every shot moves. It has at least one of: walking or acting characters, moving vehicles, animated map arrows, lines or fills, particles or weather. It always has a camera move or drift (`Camera` drift ≥ 1). Composition changes every 6–10 s. **Every shot over 10 s lists its internal composition change** (pan, crane, match or reveal) in the Camera column. Sombre shots (s05 shell shock and executions, s06 Armenian Genocide, s07 Somme first day, s10 last morning, s11 cost and remembrance) slow everything down. Movement there is slow camera, wind, mist, rain, candle flicker and slow walking only.

### 1.6 Tone, ethics and depiction policy
- **No graphic violence anywhere.** No blood, no wounds, no bodies, no one is shown being hit. Shells burst only in the distance or on empty ground. Men going "over the top" walk into smoke and mist and are lost from view. Gas is a drifting cloud; we cut away before any figure is harmed.
- **Sarajevo:** no gun is shown firing at the couple. Two sharp off-screen reports and pigeons scattering carry the moment. The aftermath is an empty car seat with the archduke's hat (S03-02).
- **Executions (306):** no firing squad. We use rows of empty posts in mist and a text card (S05-05).
- **Armenian Genocide (S06-06, S06-07):**
  - Its own ~30 s, sombre, non-graphic beat.
  - Named as genocide. The perpetrator is "the Ottoman government", never "the Turks".
  - Visuals are an empty doorway, distant silhouettes walking into the desert at dusk, and one candle.
  - No bodies, no perpetrator figures, no flags, no SFX beyond wind.
  - The toll is shown as a range. One factual line on denial.
- **Poplar school (S08-04):** an empty classroom. No children are shown. Sombre.
- **Propaganda:** no recreated posters are planned. If one is added, it carries a "PROPAGANDA POSTER (RECREATED)" stamp. The 1916 conscription notice is an official notice, not propaganda.
- **Revolutionary flags** (Petrograd, Kiel) are **plain red** with no emblem.
- **No comic marks or comic SFX** in this episode: no anger veins, sweat drops or "boing" sounds. Light warmth is allowed only in the 1914 departures and the Christmas Truce, and even there it stays restrained.
- **Same white head for everyone** (house style, user decision): no skin tints, including the munition "canaries", and no ethnic caricature. Nationality comes only from uniforms, hats, flags and scenery. Indian, Caribbean and other Empire troops are shown as soldiers marching and serving, never as background props.
- **Real people carry `NameTag`s:**
  - Archduke Franz Ferdinand, Sophie, Gavrilo Princip
  - Tsar Nicholas II, Lenin, General Foch, Kaiser Wilhelm II
  - The Kaiser appears only as a map label in s10, so no figure and no tag.
- **Real people who are never drawn:**
  - Rifleman William Eve and Ludendorff appear only in attributed quote cards.
  - Laurence Binyon appears only as the poem credit.
  - Fritz Fischer and Christopher Clark appear only as book covers.
  - John Parr and George Ellison appear only as headstones.
  - President Wilson and Zimmermann are not drawn.
- **Unnamed groups** get group labels, not personal tags: "AUSTRO-HUNGARIAN ENVOY", "GERMAN GOVERNMENT", "BRITISH INTELLIGENCE", "ALLIED DELEGATES", "GERMAN DELEGATION".
- **Fictional characters:** the **Guide** (ep01's history-room presenter) has no tag and is never presented as real. All soldiers, nurses and workers are anonymous, illustrative figures.
- **Uniform chronology** (research §5.10, §9):
  - British: cap 1914–15, Brodie from 1916.
  - French: kepi and red trousers 1914, horizon blue and Adrian from 1915.
  - German: covered Pickelhaube 1914–15, Stahlhelm from 1916.
  - US: Brodie-pattern helmet 1918.

### 1.7 Cast presets used (engine `src/characters/cast.ts`)
- **Existing:**
  - Soldiers: `britSoldier1914`, `britSoldier1916`, `britGasMask`, `frenchSoldier1914`, `frenchSoldier1915`, `germanSoldier1914`, `germanSoldier1916`, `russianSoldier`, `austroSoldier`, `ottomanSoldier`, `ausSoldier` (Anzac slouch hat), `canSoldier` (Brodie), `sailor`
  - Women at work: `vadNurse`, `munitionette`, `workerW`
  - Civilians and officials: `man1–3`, `woman1–3`, `kid1–2`, `worker`, `politician`, `politician2`
  - Presenter: `guide`
  - Labelled real people: `princip`, `franzFerdinand`, `kaiser`
- **New (see asset-requests A-01 to A-06):** `sophie`, `tsarNicholas`, `lenin`, `foch`, `indianSoldier`, `usSoldier1918`.

### 1.8 Audio shorthand
**Music:** subtle, original or licensed, always ducked under narration. **SFX:** restrained, well under the voice. "Silence" means music and SFX are fully out, and only the named room tone or wind remains.

---

## 2. Shot list

### s01 — Cold open: Two Shots, One Wrong Turn · 00:00–00:35 · 4 shots (no banner)
Music: warm, sunny strings (summer 1914). They thin to a single held note at b3, return as a low pulse for b4–b5 and stop after b7. The original title sting starts ≥ 27.9 s. Beats (narration.json, final):
- b0 1.60–4.44
- b1 5.04–9.65
- b2 9.80–13.04
- b3 13.44–14.31
- b4 14.91–18.04
- b5 18.34–24.27
- b6 24.87–26.12
- b7 26.37–27.72

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S01-01 | 00:00.0–00:09.8 | s01.b0–b1 | "28 June 1914. In Sarajevo, a car carrying the heir to an empire takes a wrong turn," | Sarajevo riverside street, sunny (existing `Street`, 1914 palette: cream and ochre façades, red roofs, flags on balconies; low quay wall and river strip; hills behind) | Small crowd lining the kerb waves (`Crowd` wave). `franzFerdinand` and `sophie` sit in the back of an open car, waving. A driver in a cap. At ~7 s the car slows and swings right into a side street | **NEW V-01 1914 open touring car** drives L→R, then turns. `Clouds`, `Birds` | Wide high angle; slow track with the car, then a slight pan right as it turns | DateCard TL (1.4–7.5): **28 JUNE 1914** / **SARAJEVO**. NameTags (5.5–9.5): **ARCHDUKE FRANZ FERDINAND** — heir to Austria-Hungary; **SOPHIE** — his wife | Fade up from black (0.5 s) | Crowd murmur, light applause, car engine; warm summer strings |
| S01-02 | 00:09.8–00:18.3 | s01.b2–b4 | "and stops near a 19-year-old with a pistol. Two shots. Within six weeks, Europe's great powers are at war." | Side-street corner with a café awning | The car stalls and stops. In the crowd on the pavement, `princip` (back three-quarters to camera, hands at his sides, **no gun drawn**) turns his head towards the car. On b3 (≈13.4) the camera tilts up off the street: pigeons burst from the rooftops. The sky dims to dusk and **MATCH** dissolves into the 1914 Europe map (≈14.8). On b4 the powers flash in sequence: Austria-Hungary, Russia, Germany, France, Britain | Pigeon flock (`Birds`, scatter mode); **NEW M-01 Europe 1914 map** (fills only, no labels yet) | Push in on the car and Princip (b2); fast tilt up on b3; map zoom 1.4→1.0 on b4 (**internal change at 13.4 and 14.9**) | NameTag (10.0–13.3): **GAVRILO PRINCIP** — Bosnian Serb, aged 19. Map: no text | CUT | Car stalls. **Two sharp, distant pistol reports at 13.5 and 13.9** (restrained, no echo FX), then wing flutter and 0.6 s near-silence. Low pulse begins on the map |
| S01-03 | 00:18.3–00:24.9 | s01.b5 | "Four years later, around 9 to 10 million soldiers are dead, and four empires are falling." | Misty field at dawn, desaturated (`SombreGrade`); a long line of wooden posts receding | No figures. On the posts sit empty helmets of every army, left to right: Brodie, Adrian, Pickelhaube, Stahlhelm, Russian cap, Austro-Hungarian cap, kabalak. Mist drifts through | `Particles dust` (slow), mist layers; helmets as props (cast hat shapes) | Slow lateral track R→L along the posts, slight drift up | FactPill RM (19.0–24.5): **AROUND 9–10 MILLION SOLDIERS DEAD (EST.)**; ListPill UC (21.3–24.7): **4 EMPIRES FALL** · German · Austro-Hungarian · Russian · Ottoman (each line strikes through in turn) | DIP | Wind, distant crow; low strings; no guns |
| S01-04 | 00:24.9–00:35.0 | s01.b6–b7 + title | "How did it happen? And how did it end?" | History room (`HistoryRoom`) → deep-navy title | The Guide faces camera, puzzled, and shrugs (b6). He turns and chalks **1914 → ? → 1918** (b7), then steps aside. At ≈27.8 the camera pushes into the "?" until the board fills the frame and darkens (**MATCH**) into the title | Chalk; dust motes in the light; faint rotating `Globe` (opacity 0.3) behind the title | Push 1.00→1.10 into the board, then slow push 1.00→1.03 on the title (**internal change at 27.8**) | Chalk (board above y 860). `BigTitle` centre (28.1–34.6): **THE HUMAN STORY** / **Episode 2: World War I**; sub (italic): **From Start to Finish** | WIPE | Chalk scratch, room tone. Title sting from ≥ 27.9 s, settling into the s02 bed by 34.5 |

### s02 — Chapter 1: Europe Before 1914 · 00:35–01:50 · 7 shots
Music: measured, slightly ceremonial strings and snare (an age of empires). Tension builds at the arms race and Balkans, and becomes a ticking pulse from b8. Beats (narration.json, final):
- b0 36.20–40.55
- b1 40.87–48.26
- b2 48.58–51.70
- b3 52.02–58.18
- b4 58.50–67.78
- b5 68.10–74.20
- b6 74.52–77.78
- b7 78.10–84.11
- b8 84.43–93.03
- b9 93.53–96.10
- b10 96.40–100.37

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S02-01 | 00:35.0–00:48.6 | s02.b0–b1 | "…look at Europe before the shooting started. It was a continent of great powers and rival empires, competing for land, trade and colonies…" | 1914 city promenade (existing `Street`, `StreetLamp`, `Tree`, bunting) → `Globe` | Strollers in 1910s dress walk both ways (`man1`, `woman1`, `woman2`, `kid1`; flat caps, fedoras, headscarf). A newspaper seller waves a paper. At ≈40.9 the paper flies at camera (**MATCH**) and opens onto a turning globe | `Newspaper` (masthead only, no headline); `Globe` with trade-route `MapArrow`s (dashed) and small ship icons sliding between Europe, Africa, Asia and the Americas | Slow pan L→R along the promenade; newspaper whip; then the globe turns 30° (**internal change at 40.9**) | ChapterBanner (35.0–37.2): **CHAPTER 1 · EUROPE BEFORE 1914**. FactPill UC (42.5–48.1): **GREAT POWERS · RIVAL EMPIRES** | INK | Street murmur, distant brass band; paper whoosh; soft sea wash under the globe |
| S02-02 | 00:48.6–00:58.5 | s02.b2–b3 | "…drifted into two camps. On one side stood France and Russia, with Britain more loosely tied to them: the Triple Entente." | **M-01 Europe 1914 map** (1914 borders) | — | b2: all great powers fade in grey with capital `CityMarker`s. b3: France and Russia fill Entente green-blue; a solid link line joins them; Britain fills a lighter tint, joined by a **dotted** line (looser ties) | Zoom 1.0→1.15 drifting west to east; at 52.0 slide from the Russia–France axis to Britain (**internal change**) | Map labels: FRANCE, RUSSIA, BRITAIN. TermCard TR (53.2–58.1): **TRIPLE ENTENTE** — France and Russia, with Britain more loosely tied | FADE | Soft map "ink" ticks per fill; music steady |
| S02-03 | 00:58.5–01:08.1 | s02.b4 | "On the other, Germany and Austria-Hungary, partners with Italy in the Triple Alliance, although Italy would stay out of the war in 1914." | M-01 map | — | Germany and Austria-Hungary fill Central grey-brown, joined by a solid line. Italy fills with a **hatched** tint joined by a dashed line; at ≈64.0 its fill fades to neutral | Pan east, zoom to centre-south Europe 1.15→1.3 | Labels: GERMANY, AUSTRIA-HUNGARY, ITALY. TermCard TR (59.0–63.9): **TRIPLE ALLIANCE** — Germany, Austria-Hungary, Italy. Map tag on Italy (64.0–67.9): **NEUTRAL IN 1914** | CUT (same map) | Fill ticks; music adds a low snare roll |
| S02-04 | 01:08.1–01:14.5 | s02.b5 | "The powers built ever-larger armies, and Britain and Germany were locked in a naval arms race." | `SplitPanels` ×2: left British shipyard, right German shipyard (existing `Factory kind="shipyard"`, with a Union flag and an Imperial German flag) | Workers (`worker`) hammer and wave as hulls slide down the slipways, alternating left and right. Below, a strip of marching ranks (small `germanSoldier1914`, `frenchSoldier1914`, `russianSoldier`) crosses frame | `Ship kind="warship"` (dreadnought-style) launched each side; `Smoke` from funnels; `Flag` | Panels slide in, then a slow push; ships move out of frame | FactPill UC (68.6–74.1): **ARMS RACE**; sub: **NAVAL RACE: BRITAIN v GERMANY** | WIPE | Hammering, launch splash, boots; snare rhythm |
| S02-05 | 01:14.5–01:24.4 | s02.b6–b7 | "In the Balkans, nationalism was on the rise. Austria-Hungary, an empire of many peoples, saw Serb nationalism as a serious threat." | M-01 map, zoomed on the Balkans | — | Serbia pulses red (b6). Many small coloured dots ripple across Austria-Hungary's area (many peoples), then Austria-Hungary's border darkens. Tension `MapArrow`s point both ways across the Serbia–Bosnia border | Zoom 1.3→2.4 into the Balkans; slow drift (**internal change at b7: pull back slightly to the whole of Austria-Hungary**) | Labels: SERBIA, BOSNIA (ruled by Austria-Hungary), AUSTRIA-HUNGARY, VIENNA, BELGRADE. FactPill RM (78.6–84.0): **AN EMPIRE OF MANY PEOPLES** | FADE | Low drone; ticking clock enters quietly |
| S02-06 | 01:24.4–01:33.5 | s02.b8 | "And the war plans depended on speed. Germany's plan was to knock France out fast, through Belgium, then turn east against Russia." | M-01 map, west and central Europe | — | A thick German arrow grows from the German border through Belgium and curls towards Paris (`growArrow`), while a stopwatch icon spins in the corner (upper right). Then a second arrow swings back east towards Russia. Tiny train icons slide along the arrow | Pan west, then sweep east following the second arrow (**internal change at ≈89.3**) | Labels: BELGIUM, PARIS. FactPill UC (85.3–92.9): **GERMANY'S WAR PLAN: FRANCE FIRST, THROUGH BELGIUM — THEN RUSSIA** | CUT | Clock tick speeds up; arrow swish (soft) |
| S02-07 | 01:33.5–01:50.0 | s02.b9–b10 + tail (100.4–110.0, no narration) | "None of this made war inevitable. But it meant that a local crisis could spread very quickly." [then 9.6 s of music] | History room: desk, then the chalkboard with a chalk outline of Europe | The Guide stands a long row of chalk-labelled dominoes on the desk: ALLIANCES, ARMS RACE, NATIONALISM, EMPIRES, WAR PLANS. He shakes his head (b9) and chalks "PRESSURES, NOT INEVITABILITY". On b10 he steps back, worried, and his elbow nudges the first domino. **Tail (100.4–110.0):** the dominoes topple one after another along the desk (100.4–104.5); the camera follows the chain up onto the chalkboard, where chalk dominoes keep falling across a chalk map of Europe towards the Balkans (104.5–108.0); the last one stops beside a chalk dot labelled **SARAJEVO**, which glows warm yellow (108.0–110.0) | Dominoes (simple blocks, new prop, trivial: see asset requests E-08); chalk; chalk-map line art | Slow track along the row (b9–b10); follow the falling chain and tilt up to the board (**change at 104.5**); push in on the Sarajevo dot (**change at 108.0**), which sets up the INK into s03 | Chalk only (board above y 860): "PRESSURES, NOT INEVITABILITY"; "SARAJEVO" | CUT | Wooden clicks, chalk; the ticking clock stops at 100.4, then soft domino clacks keyed to the music; the music builds gently through the tail and resolves into the s03 bed at 110 |

### s03 — Chapter 2: Sarajevo and the July Crisis · 01:50–03:10 · 8 shots
Music: low strings and a soft timpani pulse. It grows step by step through the declarations, then turns reflective and even for the debate. Beats (narration.json, final):
- b0 110.80–121.52
- b1 121.84–129.82
- b2 130.32–136.55
- b3 136.87–143.33
- b4 143.65–146.95
- b5 147.35–151.16
- b6 151.48–159.66
- b7 159.97–167.24
- b8 167.74–170.93
- b9 171.25–174.72
- b10 175.04–187.30

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S03-01 | 01:50.0–02:01.8 | s03.b0 | "On 28 June 1914, Archduke Franz Ferdinand… and his wife Sophie were visiting Sarajevo, in Bosnia." | Sarajevo riverside street (as S01-01), closer, street level | `franzFerdinand` and `sophie` in the open car, nodding and waving; crowd waving; two officials in a second car behind | V-01 touring car ×2 (second in a dark colour); `Flag`s on balconies; `Clouds` | Low side track with the car L→R; push in towards the couple | ChapterBanner (110.0–112.7): **CHAPTER 2 · SARAJEVO AND THE JULY CRISIS**. DateCard TL (113.2–119.8): **28 JUNE 1914** / **SARAJEVO, BOSNIA**. NameTags (114.3–121.3): **ARCHDUKE FRANZ FERDINAND** — heir to Austria-Hungary's throne; **SOPHIE** — his wife | INK | Crowd, engine, polite applause; uneasy strings |
| S03-02 | 02:01.8–02:10.3 | s03.b1 | "After a wrong turn, the car stopped near Gavrilo Princip, a 19-year-old Bosnian Serb. He shot them both dead." | Side-street corner (as S01-02), then the empty car | The car stops. `princip` (tag) on the pavement turns towards it (no gun shown). On "He shot them" (≈127.2), **CUT inside the shot** to the crowd from behind: they recoil (`cower`), pigeons scatter. Then slow fade to the empty back seat with the archduke's green-plumed hat lying on it | V-01 car; plumed hat prop (from `plumedHat`); `Birds` | Push towards Princip; at 127.2 reverse angle; at ≈128.6 slow push on the empty seat (**internal change**). Desaturate to 70 % | NameTag (122.5–126.7): **GAVRILO PRINCIP** — Bosnian Serb, aged 19. FactPill RM (127.0–130.2): **THE ARCHDUKE AND SOPHIE WERE KILLED** | CUT | Car brakes; **two distant reports** (same as S01-02); wing flutter; then near-silence (0.5 s) and a single low cello note |
| S03-03 | 02:10.3–02:16.9 | s03.b2 | "In early July, Germany promised Austria-Hungary its full backing: the so-called 'blank cheque'." | Berlin ministry office (`Interior`, panelled; window with an Imperial German flag) | A German official (`politician`, group label) slides a large blank cheque across the desk to an Austro-Hungarian envoy (`politician2`), who takes it and bows. Both stay calm and formal | Desk (`Table`), blank cheque prop (`Document` styled as a cheque, empty amount box), pen | Slow push 1.00→1.06 onto the cheque | Group labels: **GERMAN GOVERNMENT** · **AUSTRO-HUNGARIAN ENVOY**. TermCard TR (131.1–136.7): **"BLANK CHEQUE"** — Germany's promise of full backing | FADE | Clock tick, paper slide; strings |
| S03-04 | 02:16.9–02:27.3 | s03.b3–b4 | "On 23 July, Vienna sent Serbia an ultimatum, with 48 hours to reply. Serbia accepted most of the demands, but not all." | M-01 map, Vienna–Belgrade | — | A sealed envelope flies Vienna → Belgrade along a dashed arrow (b3). A 48-hour clock dial sweeps round (upper right). On b4 a reply envelope flies back. Its list pops in: ✓ ✓ ✓ ✓ ✗ (most ticked, one crossed) | Zoom 2.0 on Vienna–Belgrade; slow drift; at b4 the camera follows the reply back (**internal change**) | DateCard TL (137.4–142.7): **23 JULY 1914** / **ULTIMATUM TO SERBIA**. Clock label: **48 HOURS**. FactPill RM (143.9–146.9): **25 JULY: SERBIA ACCEPTS MOST TERMS — NOT ALL** | FADE | Paper whoosh, clock ticking; timpani pulse |
| S03-05 | 02:27.3–02:40.0 | s03.b5–b6 | "On 28 July, Austria-Hungary declared war. Russia began to mobilise. Germany declared war on Russia and France, and on 4 August invaded neutral Belgium." | M-01 map, whole of Europe | Small marching-figure icons (map-scale `DistantFigures`) pour across the German–Belgian border at the end | Domino-style sequence: each country's fill deepens as its arrow fires. A-H → Serbia (b5). A ripple of mobilisation dots across Russia. Germany → Russia, Germany → France. Germany → Belgium as a thick arrow. A calendar flip-card (upper right, under the TR zone) turns: 28 JUL · 30–31 JUL · 1 AUG · 3 AUG · 4 AUG | Pull back 2.0→1.0, then push to Belgium 1.0→1.8 from ≈156.2 (**internal change**) | Calendar card (upper right, 147.4–159.8). DateCard TL (156.2–159.8): **4 AUGUST 1914** / **BELGIUM INVADED** | CUT | One soft drum hit per arrow; distant marching boots on the Belgium push |
| S03-06 | 02:40.0–02:47.7 | s03.b7 | "Britain had guaranteed Belgium's neutrality, and at 11 p.m. London time, Britain was at war." | London street at night (existing `Street` lit, `StreetLamp`s, clock tower silhouette built from `Building` + clock face) | A crowd in hats waits under the lamps, looking up at the clock. At 11 the hands click over; people turn to each other. A newsboy runs in, waving a paper | `Newspaper` headline **BRITAIN AT WAR** · "4 August 1914"; lamp glow; light mist | Tilt down from the clock face to the crowd | FactPill UC (161.0–167.1): **11 P.M. LONDON TIME** · sub "midnight in Berlin" | DIP | Big-clock chime ×11 (soft, starts under narration), crowd murmur; music holds |
| S03-07 | 02:47.7–02:55.0 | s03.b8–b9 | "Sarajevo was the trigger, not the whole cause. Historians still argue about who was most to blame." | History room | The Guide chalks a small match labelled TRIGGER next to a big stack of chalk logs labelled ALLIANCES · ARMS RACE · NATIONALISM · EMPIRES · WAR PLANS. He draws "≠" between them (b8), then turns to camera, palms up (b9), and chalks "WHO WAS MOST TO BLAME?" | Chalk; a small chalk flame flickers on the match (animated line) | Static, then a slow push to the question (**internal change at b9**) | Chalk only | WIPE | Chalk; music reflective |
| S03-08 | 02:55.0–03:10.0 | s03.b10 | "Some put the main responsibility on Germany and Austria-Hungary. Others stress that many governments, in a tangled system, made choices that led to a world war none of them intended." | `SplitPanels` ×2 on a paper background | No figures. **Left** (175.0–180.8): a book cover "Fritz Fischer, 1961" slides in; a thick arrow points to Berlin and Vienna on a mini-map. **Right** (180.8–187.3): "Christopher Clark, 2012"; a tangle of thin arrows linking Vienna, Berlin, St Petersburg, Paris, London and Belgrade. At 186 a balance scale between the panels tilts gently one way, then settles level | Book-cover cards (generic, title only); mini-maps from M-01; balance-scale chalk drawing | Left panel push, slide to right panel, then pull back to both (**internal changes at 180.8 and 184.9**) | TermCard TR (175.3–180.3): **A DEBATE**. Panel heads (UC, ≥ 40 px): **MAIN RESPONSIBILITY: GERMANY & AUSTRIA-HUNGARY** / **SHARED RESPONSIBILITY: A TANGLED SYSTEM** | FADE | Page turns; music even and unresolved, then a rising unease into s04 |

### s04 — Chapter 3: 1914: The War of Movement Stops · 03:10–04:20 · 6 shots
Music: brisk, hopeful march (departures), turning urgent (the invasion), resolute (the Marne), then grinding (the race to the sea). Christmas is soft and hushed, with a hummed carol. Beats (narration.json, final):
- b0 190.80–194.10
- b1 194.50–198.60
- b2 198.92–203.12
- b3 203.44–211.00
- b4 211.32–215.13
- b5 215.53–220.75
- b6 221.07–229.31
- b7 229.81–232.64
- b8 232.96–242.46
- b9 242.78–247.88
- b10 248.38–255.59

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S04-01 | 03:10.0–03:16.0 | s04.b0 (+ b1 +1.5 s) | "Many on all sides believed the war would be short." | Railway station platform, summer (ep01 `Station` composition from `scenes/S04.tsx`, lifted into the kit), bunting | `britSoldier1914` lean out of carriage windows waving. A woman and child wave back from the platform. One soldier hugs his mother (`Hug`). Background panels show the same scene in other countries: `frenchSoldier1914` (red trousers) and `germanSoldier1914` boarding | `Train` departs L→R with steam; `Bunting`; flowers thrown | Pan with the train as it pulls out | ChapterBanner (190.0–192.2): **CHAPTER 3 · 1914: THE WAR OF MOVEMENT STOPS** | INK | Steam whistle, cheering (restrained), wheels; brisk march |
| S04-02 | 03:16.0–03:23.4 | s04.b1–b2 | "In August, German armies swept through Belgium and into France. The British fought their first major battle at Mons, then retreated." | **NEW M-02 Western Front map** (Belgium, northern France) | — | Broad German arrows sweep through Belgium and into France (`growArrow`). At Mons a small British arrow meets them, holds, then bends back south (retreat) | Zoom 1.0→1.4 following the arrows | Map labels: BELGIUM, FRANCE, PARIS, MONS. DateCard TL (199.2–203.3): **23 AUGUST 1914** / **MONS** | FADE | Distant boots, arrow swish; music urgent |
| S04-03 | 03:23.4–03:31.3 | s04.b3 | "Then, in early September, French and British troops stopped the German advance east of Paris, at the Battle of the Marne." | Late-summer fields, haystacks, poplar trees, a river (`Hills`, `Tree`, `Ground`); smoke on the horizon | `frenchSoldier1914` (red trousers, kepi) and `britSoldier1914` advance in open order L→R, kneel and fire (`kneelAim`), then rise and walk on. Far right, small `germanSoldier1914` figures fall back over the ridge (walk away, no one hit) | `Smoke` on the horizon; puffs of distant shell smoke on empty fields; `RifleAim` | Lateral track L→R with the advance; slow crane up at the end | DateCard TL (203.9–210.6): **SEPTEMBER 1914** / **THE MARNE** | WIPE | Distant artillery rumble, rifle crackle far off; resolute strings |
| S04-04 | 03:31.3–03:49.8 | s04.b4–b6 | "Germany's hopes of a quick victory in the west were over. Both sides then raced north… until they reached the sea. By the end of 1914, a line of trenches ran for about 700 kilometres, from the Belgian coast to Switzerland." | M-02 Western Front map | — | b4: German arrows shrink back to the Aisne; a "QUICK VICTORY" label cracks and fades. b5: two chains of arrows (Allied and German) leapfrog north-west side by side to the Channel coast. b6: a `FrontLine` (teeth) draws from the Belgian coast to Switzerland; at 227.8 the line thickens and **MATCH** zooms down into a zig-zag trench seen from above | `FrontLine` with progress; `MapArrow`s; leapfrog pairs; final zoom transition | b4 zoom on the Marne; b5 pan north (**change at 215.4**); b6 pull back to the full front, then push into the line (**change at 220.7 and 227.8**) | Label (215.9–220.6): **THE RACE TO THE SEA**. FactPill RM (222.3–229.2): **WESTERN FRONT: ABOUT 700 KM** · "Belgian coast to Switzerland" | CUT (same map family) | Arrow swishes, digging thuds rise as the line draws; music grinds lower |
| S04-05 | 03:49.8–03:57.9 | s04.b7–b8 (to b8 +5.4 s) | "And at Christmas, something remarkable happened. Along parts of the front, men stopped fighting. They sang carols…" | **NEW E-01 trench set — winter night variant:** frosty British front-line trench, firestep, sandbags, stars, frosty wire in no-man's land; German parapet in the distance with lanterns | `britSoldier1914` (caps, scarves) on the firestep look up, listening. One lifts his head carefully over the parapet; others join, pointing to the lights opposite. A soldier hums along (mouth moving) | Lanterns along the German parapet; breath vapour (`Particles dust`, white, slow); `Particles snow` light | Slow crane up from inside the trench to the parapet line, revealing the lanterns (**reveal at ≈234.3**) | DateCard TL (230.3–236.3): **CHRISTMAS 1914** / **THE WESTERN FRONT** | DIP | Night hush, a distant **hummed carol** (Silent Night melody, public domain, original performance) growing; music falls to near-silence |
| S04-06 | 03:57.9–04:20.0 | s04.b8 (from +5.4 s)–b10 | "…swapped souvenirs and buried their dead, and in some places they kicked a ball about. Rifleman William Eve wrote… 'not a shot fired all day or night.' But the truces were unofficial and patchy… never happened on that scale again." | **E-01 no-man's land view**, frosty daylight; both parapets, wire, craters, bare trees | British and German 1914 soldiers meet in the middle and shake hands (`Handshake`). Two swap a cap and a tin. Far left, a small group with spades stands bareheaded by simple crosses (`headBowed`, distant, respectful). Right, three men kick a ball about. On b10 (≈248.4) an officer's whistle blows: men part and walk slowly back. Snow begins. The ball is left alone on the frost | Ball; spades; small wooden crosses; `Particles snow` increasing from 247.9 | Slow pan L→R, from the handshake to the burial party, then to the ball; at 248.4 pull back high and wide as the men return (**changes at ≈242.6 and 248.4**) | MemorialCard centre-upper (243.0–248.1): **"not a shot fired all day or night."** — Rifleman William Eve, diary, 25 December 1914. FactPill RM (248.9–255.6): **UNOFFICIAL · PATCHY · NOT EVERYWHERE** | CUT | Quiet voices (indistinct), boots on frost, ball thump (soft); whistle at 248.4; music: a warm, fragile carol line that fades with the snow |

### s05 — Chapter 4: Life in the Trenches · 04:20–05:20 · 5 shots
Music: sparse, low and grim. It is very sparse under the gas and shell-shock beats, and sombre and unresolved under the executions. Beats (narration.json, final):
- b0 260.80–263.71
- b1 264.04–270.11
- b2 270.43–275.40
- b3 275.72–280.44
- b4 280.76–283.63
- b5 284.03–290.63
- b6 290.95–298.92
- b7 299.31–308.12
- b8 308.44–318.58

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S05-01 | 04:20.0–04:30.4 | s05.b0–b1 | "For the men at the front, trench life was grim. Units rotated in and out of the front line, usually spending a few days there at a time." | **E-01 trench set**, grey rain, mud and duckboards → **E-01 cutaway diagram** (three parallel trench lines with zig-zag communication trenches, side-on cross-section) | b0: `britSoldier1916` stand hunched on the firestep in the rain; one sentry peers through a periscope. b1: crane up into the diagram, where lines of tiny figures file forward along communication trenches into the front line while others file back to reserve, in a loop | `Particles rain`; periscope; duckboards; diagram with animated figure dots | Low push along the trench (b0), then crane up into the diagram (**internal change at ≈264.1**) | ChapterBanner (260.0–262.1): **CHAPTER 4 · LIFE IN THE TRENCHES**. Diagram labels (265.0–270.0): **FRONT LINE · SUPPORT · RESERVE**. FactPill RM (266.3–270.0): **A FEW DAYS AT A TIME** | INK | Rain, dripping, boots on duckboards; low drone |
| S05-02 | 04:30.4–04:40.8 | s05.b2–b3 | "Lice infested their clothes and spread trench fever. Rats were everywhere. After long hours in cold water, feet could swell and rot: trench foot." | E-01 trench set, a flooded section with a sump; dugout entrance with a gas curtain | b2: a soldier sitting on the firestep runs a candle along the seams of his tunic (shown simply and seriously, not comic); two rats scurry along the duckboards and a third along the parapet. b3: a man stands knee-deep in water, then sits on a crate to ease off a boot; a mate hands him dry socks. Tired, sad expressions | Candle; rats (small grey shapes, new trivial prop in E-01); water surface with ripples | Slow lateral track R→L; at 275.7 push in on the man and his boot (**internal change**) | TermCard TR (276.5–280.5): **TRENCH FOOT** — feet swollen and rotting after long hours in cold water | CUT | Water slosh, rat scurry (quiet), drip; drone |
| S05-03 | 04:40.8–04:59.3 | s05.b4–b6 | "Shellfire, not bullets, was the great killer. In April 1915, near Ypres, poison gas was used on a large scale for the first time. Both sides soon issued masks. Gas caused many casualties but relatively few deaths: it was feared more than it killed." | **E-01 view over the parapet to no-man's land** → high wide view of the front → back to the trench | b4: shells burst far off on empty ground; soldiers in the trench duck (`takeCover`) and dirt patters down. b5 (≈283.9): **high wide shot**, no close figures: a green-yellow cloud rolls slowly from the far trench line across no-man's land in the wind. b6 (≈291.1): later, a British trench: `britGasMask` soldiers pull on masks calmly and drilled, then stand to. We cut away before any harm | `Explosion` (distant only, small); dirt `Particles dust`; gas cloud (`Smoke` tinted #B8B860, low opacity, slow); masks | b4 slight shake 0.4 on bursts; b5 slow crane up to high wide (**change at 283.9**); b6 cut-in push (**change at 291.1**) | DateCard TL (284.9–290.5): **APRIL 1915** / **YPRES** · sub "first large-scale gas attack". FactPill RM (294.1–298.8): **FEARED MORE THAN IT KILLED** | FADE | Distant shell crumps (low, no close blasts), dirt patter; b5 wind only; b6 mask straps, muffled breathing; music almost gone |
| S05-04 | 04:59.3–05:08.4 | s05.b7 | "The strain broke many minds. The British Army alone recorded about 80,000 cases of shell shock, and many more went unrecorded." | **E-01 dugout interior**: timber props, candle, bunks, a hanging greatcoat | A young soldier sits on a bunk, knees drawn up, staring ahead (wide eyes, still brows). His hands tremble slightly (small jitter). An older comrade sits beside him, puts a blanket round his shoulders and stays. Compassionate, never comic | `Candle` flicker; blanket; dust falls from the roof at a distant thud | Very slow push 1.00→1.05; candlelight breathing | FactPill RM (300.2–308.1): **SHELL SHOCK: ABOUT 80,000 RECORDED CASES · BRITISH ARMY** · sub "many more unrecorded" | DIP | Muffled distant thud, candle hiss, breathing; single sustained cello |
| S05-05 | 05:08.4–05:20.0 | s05.b8 (+ tail) | "In all, 306 British and Commonwealth soldiers were executed, mostly for desertion or cowardice. In 2006, they were pardoned." | Dawn mist over an empty field behind the lines, desaturated (`SombreGrade`) | No figures. A row of plain wooden posts recedes into mist. At ≈315.9 a document drifts down on to a table in the foreground and settles: "PARDON · 2006" | Mist layers; plain posts; `Document` | Very slow track along the posts; at 315.9 focus pulls to the document (**internal change**) | MemorialCard centre (309.1–318.8): **306 BRITISH AND COMMONWEALTH SOLDIERS EXECUTED** / "mostly for desertion or cowardice" / (line 2 at 315.9) **PARDONED IN 2006** | CUT | Wind; one soft low note; nothing else |

### s06 — Chapter 5: A World War · 05:20–06:30 · 7 shots
Music: broader orchestral colour (a world opening out). It becomes subdued for Gallipoli, warm and dignified for the Empire troops, and for the Armenian Genocide drops to a single sustained instrument with no percussion. Beats (narration.json, final):
- b0 320.80–322.40
- b1 322.73–328.65
- b2 328.97–338.00
- b3 338.32–341.58
- b4 341.90–346.57
- b5 346.89–356.49
- b6 357.19–361.19
- b7 361.60–367.79
- b8 368.11–377.61
- b9 378.11–380.54
- b10 380.94–387.72

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S06-01 | 05:20.0–05:29.0 | s06.b0–b1 | "This was a world war. In the east, in August 1914, Germany destroyed a Russian army at Tannenberg." | `Globe` → **NEW M-03 Eastern Front map** (East Prussia, Russian Poland, Galicia) | — | b0: the globe turns with soft pulses on every front (Europe, Middle East, Africa, Pacific). b1: **MATCH** zoom into M-03. A Russian arrow pushes into East Prussia; German arrows close round it from two sides; the Russian arrow breaks up and fades | Globe turn, then fast zoom (**change at ≈322.7**) and slow drift east | ChapterBanner (320.0–322.0): **CHAPTER 5 · A WORLD WAR**. Labels: EAST PRUSSIA, RUSSIA. DateCard TL (323.2–328.5): **AUGUST 1914** / **TANNENBERG** | INK | Globe whoosh, low drum; music widens |
| S06-02 | 05:29.0–05:38.0 | s06.b2 | "In April 1915, Allied troops, including the Anzacs, landed at Gallipoli, in the Ottoman Empire, Germany's new ally." | **NEW M-04 Gallipoli map** (Dardanelles, Gallipoli peninsula, inset Constantinople) | — | Ship icons approach. Landing arrows hit **Cape Helles** and **Anzac Cove**. The Ottoman Empire fill fades in Central colour with a link line to Germany (inset) | Zoom 1.0→1.6 on the peninsula | DateCard TL (329.5–335.9): **25 APRIL 1915** / **GALLIPOLI**. TermCard TR (330.9–337.9): **ANZACS** — Australian and New Zealand Army Corps | WIPE | Distant ship horns, surf |
| S06-03 | 05:38.0–05:44.3 | s06.b3 (+ b4 +2.4 s) | "The campaign failed, at a heavy cost in lives." | Steep scrub cliffs above a narrow beach at dusk, then night (`Hills` steep, `Sea`, scrub dots) | `ausSoldier` (slouch hats) and `britSoldier1914` sit in shallow dug-outs on the slope, tired. Then, at night, lines of men file down to the beach and into small boats that row out to dark ships | `SmallBoat` ×3 with passengers, `Ship` (dark) offshore, `Sea`; dusk-to-night sky shift | Slow pan down the cliff to the sea | FactPill RM (338.5–344.1): **EVACUATED BY JANUARY 1916** · sub "more than 44,000 Allied dead (est.)" | FADE | Surf, oars, quiet boots on shingle; subdued strings |
| S06-04 | 05:44.3–05:51.1 | s06.b4 (from +2.4 s)–b5 (to b5 +4.2 s) | "Italy joined the Allies, and fighting spread to Africa and the Middle East. About one and a half million men from South Asia served in the Indian Army…" | `Globe` centred on Europe, Africa and the Indian Ocean | — | Italy flips to Allied colour (344.5). `GlobeHotspot`s pulse: the Alps front, Mesopotamia, Palestine, East Africa (labels). From 346.9 dashed `MapArrow`s of troop ships stream towards Europe from India, Canada, Australia, New Zealand, South Africa and the Caribbean | `Globe`, `GlobeHotspot`, `MapArrow` (dashed, staggered) | Globe turns west to east, then tilts north to show the arrows converging (**change at 346.9**) | Label (344.5–347.6): **ITALY JOINS THE ALLIES · MAY 1915**. FactPill RM (347.3–351.0): **ABOUT 1.5 MILLION MEN FROM SOUTH ASIA SERVED IN THE INDIAN ARMY** | FADE | Soft globe hum; music warm and dignified |
| S06-05 | 05:51.1–05:57.2 | s06.b5 (rest) | "…and troops came from across the empires, from Canada to the Caribbean." | A tree-lined French road behind the lines, autumn (`Tree`, `Ground`, `Hills`) | A column marches L→R in step, each group distinct by uniform, with no caricature: **`indianSoldier`** (pagri, khaki), `canSoldier`, `ausSoldier`, a West Indian group (`britSoldier1916` khaki, group label), South Africans (khaki). Villagers wave from a doorway; a child salutes | Dust from boots; `Truck` (1910s-style cover; or omit) | Lateral track R→L against the column; slight push | Group labels (351.9–356.8), small, above the heads: **INDIAN ARMY** · **CANADA** · **AUSTRALIA** · **BRITISH WEST INDIES REGIMENT** | CUT | Marching boots, distant bugle (soft); warm strings |
| S06-06 | 05:57.2–06:08.1 | s06.b6–b7 | "Inside the Ottoman Empire, a catastrophe unfolded. From 1915, the Ottoman government deported and murdered Armenians across the empire." | Small town street at dusk, desaturated (`SombreGrade`): plain stone houses, an open, empty doorway, a chair outside, washing line still hanging | **No figures.** Wind moves the washing and a door slowly swings on its hinge. A bundle lies abandoned on the step. The light fades | `Particles dust` in the wind; door swing; washing sway | Very slow push 1.00→1.05 to the empty doorway | DateCard TL (358.0–367.2), tone **dark**: **1915** / **OTTOMAN EMPIRE** | DIP (slow, 0.8 s) | Wind only; a creaking door; a single sustained cello. No percussion |
| S06-07 | 06:08.1–06:30.0 | s06.b8–b10 | "An estimated 600,000 to 1.5 million Armenians died, in massacres and on forced marches into the Syrian desert. This was the Armenian Genocide. Turkey's government still rejects the term. Historians and genocide scholars overwhelmingly use it." | Desert at dusk: low dunes, a dark band of hills, a red-grey sky (`Ground` sand, `Hills`, `Sky` dusk) | **Distant silhouettes only** (`DistantFigures`, small, dark): a long line of people walking slowly away towards the horizon. No guards, no bodies, no faces. At 380.2 the line has passed out of sight and the camera cranes down to a single candle on a stone in the foreground | Dust haze; wind ripples on sand; `Candle` | Very slow crane right along the line (b8), then crane down to the candle (**change at 378.1**); hold | FactPill RM (369.0–377.5), tone **dark**: **AN ESTIMATED 600,000 TO 1.5 MILLION ARMENIANS DIED**. MemorialCard centre (378.6–389.3): **THE ARMENIAN GENOCIDE** / "1915–" / (382.8) "Turkey's government rejects the term. Historians and genocide scholars overwhelmingly use it." | CUT (same palette) | Wind; the same cello line; candle flicker. Hold 1.2 s of near-silence before the s07 ink |

### s07 — Chapter 6: 1916: Verdun and the Somme · 06:30–07:30 · 7 shots
Music: heavy, slow brass and low strings (attrition). Near-silence for 1 July. An even, open close for the debate. Beats (narration.json, final):
- b0 390.80–394.42
- b1 394.74–400.36
- b2 400.68–408.48
- b3 408.88–413.73
- b4 414.05–427.51
- b5 428.01–433.62
- b6 434.02–441.26
- b7 441.58–448.27

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S07-01 | 06:30.0–06:40.7 | s07.b0–b1 | "In 1916, both sides tried to break the deadlock. In February, Germany attacked Verdun, a fortress city France would defend at any cost." | M-02 Western Front map, static front line | — | b0: small arrows bump against the line from both sides and bounce back. b1: Verdun marker pulses; thick German arrows converge on it; French arrows reinforce from the west | Pull back to the full front (b0), then push to Verdun 1.0→2.0 (**change at 394.7**) | ChapterBanner (390.0–392.6): **CHAPTER 6 · 1916: VERDUN AND THE SOMME**. DateCard TL (395.2–400.2): **FEBRUARY 1916** / **VERDUN** | INK | Low drum; distant rumble |
| S07-02 | 06:40.7–06:48.9 | s07.b2 | "The battle lasted about 300 days, the longest of the war, and caused around 700,000 casualties." | Shell-churned hills, stumps of trees, grey rain; a ruined fort outline on the ridge (`Hills`, `Crater`, `Rubble`, bare `Tree`) | `frenchSoldier1915` (horizon blue, Adrian) file up a muddy road towards the ridge, heads down. Others file back, slower, helping walking wounded (arm over shoulder, no blood). `germanSoldier1916` silhouettes on the far ridge | `Truck`s with covers on the road; `Particles rain`; distant smoke | Slow tilt up from the road to the ridge | FactPill RM (401.4–408.4): **ABOUT 300 DAYS · AROUND 700,000 CASUALTIES (EST.)** | FADE | Rain, trucks, distant shellfire; heavy brass |
| S07-03 | 06:48.9–06:58.3 | s07.b3–b4 (to b4 +4.4 s) | "Partly to relieve Verdun, British and French forces attacked on the Somme. A week of shelling failed to destroy the German defences." | M-02 map (b3) → night over the Somme front, seen from British lines (E-01 trench set, night variant) | b3: map arrow from the Somme sector with a dashed link to Verdun. b4: at night, **MATCH** to the British trench; men sit on the firestep, helmets on, faces lit by flashes from the horizon | Map arrow; gun flashes on the horizon (`ScreenFlash` low intensity, far); a day-counter tile flips 1 → 7 (upper right) | Map push; then a dissolve and a slow pan along the trench (**change at 414.1**) | DateCard TL (409.4–413.7): **JULY 1916** / **THE SOMME** · sub "partly to relieve Verdun". Tile (414.5–418.2): **DAY 1 … DAY 7** | CUT | Constant distant rumble (no close blasts); music sinks |
| S07-04 | 06:58.3–07:08.0 | s07.b4 (rest) | "On 1 July, the British Army had the worst day in its history: more than 57,000 casualties, over 19,000 of them dead." | E-01 trench at dawn, mist; view over the parapet to no-man's land, smoke | Whistles. `britSoldier1916` climb the ladders and walk forward in long lines, **seen from behind**, rifles at the port. They walk into smoke and mist and are lost from view. The trench is left empty, ladders standing | Ladders; smoke; mist; `SombreGrade` deepening | Slow crane up behind the lines as they walk away; hold on the empty ladders | DateCard TL (418.8–423.6): **1 JULY 1916** / **FIRST DAY OF THE SOMME**. FactPill RM (422.1–427.8), tone **dark**: **MORE THAN 57,000 BRITISH CASUALTIES · OVER 19,000 DEAD** | CUT | Whistles at 418.6; then the music drops out; wind and distant muffled guns only. **No bullet or impact SFX** |
| S07-05 | 07:08.0–07:14.8 | s07.b5 | "Many were 'Pals' battalions of friends and workmates, so whole towns grieved together." | Northern English terraced street, grey morning (`Street` brick palette, chimneys) | Curtains drawn in window after window. Women and old men stand at their doors. A telegram boy wheels his bicycle slowly down the street. A woman holds a letter to her chest (`helmetToChest` variant with paper); a neighbour puts an arm round her | Bicycle (simple prop); curtains closing one by one | Slow track along the terrace | FactPill RM (428.7–434.6): **"PALS" BATTALIONS** · sub "friends and workmates from the same towns" | DIP | Wind, a distant church bell (single strokes), bicycle tick; one soft piano line |
| S07-06 | 07:14.8–07:21.6 | s07.b6 | "By November, the Allies had advanced a few miles, at a cost of more than a million casualties on all sides." | M-02 map, Somme sector close-up | — | The front line creeps east very slowly (a thin sliver of ground fills, highlighted); grey dots accumulate behind both lines (abstract, no counters ticking up) | Zoom 3.0 on the Somme; slow drift | Label: **A FEW MILES**. FactPill RM (435.3–441.4): **JULY–NOVEMBER 1916: MORE THAN 1 MILLION CASUALTIES, ALL SIDES (EST.)** | FADE | Low drone, slow drum |
| S07-07 | 07:21.6–07:30.0 | s07.b7 | "Historians still debate whether it was a futile slaughter, or a battle that wore down the German army." | History room | The Guide chalks a balance scale: left pan "FUTILE SLAUGHTER?", right pan "WORE DOWN THE GERMAN ARMY?". The scale rocks and stays undecided. He looks at it, thoughtful, and steps back | Chalk; animated chalk scale | Static, then a slow push to the scale | TermCard TR (442.2–448.3): **A DEBATE** | WIPE | Chalk; music even and open, then rising briefly into s08 |

### s08 — Chapter 7: The Home Front · 07:30–08:20 · 5 shots
Music: brisk, busy strings (work and change) and a lighter tone for the women at work. Sombre and still for Poplar. Thin and hungry for rationing and the blockade. Beats (narration.json, final):
- b0 450.80–453.92
- b1 454.24–460.39
- b2 460.71–469.57
- b3 469.89–475.59
- b4 475.91–480.29
- b5 480.61–487.86
- b6 488.26–493.21
- b7 493.53–498.19

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S08-01 | 07:30.0–07:40.7 | s08.b0–b1 | "At home, the war reached into almost every life. Britain relied at first on volunteers, but in 1916 it brought in conscription." | British high street (existing `Street`, shops) with a recruiting office | b0: shoppers pass; a woman with a basket, a boy reading a soldier's letter to his gran. b1: a queue of young men in flat caps shuffles into a recruiting office. At ≈456.4 a man pastes an official notice on the wall; the passers-by stop to read it | Official notice (plain text panel); flag over the office door | Pan L→R along the street; at 456.4 push to the notice (**internal change**) | ChapterBanner (450.0–452.2): **CHAPTER 7 · THE HOME FRONT**. Notice text (diegetic, large): **MILITARY SERVICE ACT** · **1916**. DateCard TL (455.3–460.5): **1916** / **CONSCRIPTION** | INK | Street murmur, paste brush; busy strings |
| S08-02 | 07:40.7–07:55.9 | s08.b2–b3 | "Women took on work in offices, on farms and on buses. By 1918, almost a million British women worked in munitions. Those filling shells were nicknamed 'canaries', because the TNT turned their skin yellow." | `SplitPanels` ×3: office (typewriters), farm (field and plough), bus stop (a conductress with a ticket rack on the platform step of a bus side, `workerW`) → full-frame munitions factory (`Interior` + factory benches) | Women type, plough and punch tickets (b2 first half). At ≈464.7 the third panel slides away and the munitions panel expands to full frame: `munitionette`s in mob caps and overalls fill shells along a bench line, and shells roll past on a trolley. At b3 a fine **yellow powder haze** hangs over the filling bench, and their overalls are dusted yellow. **Heads stay white** (house style) | `Shell` props on a rolling trolley; yellow `Particles dust` (#D9C24A, low opacity); typewriter, plough, ticket rack | Panels in; MATCH to the factory with a lateral track along the bench (**change at ≈464.7**); slow push to the haze at 469.9 | FactPill RM (465.1–469.5): **BY 1918: ALMOST A MILLION BRITISH WOMEN IN MUNITIONS**. Label UC (470.4–475.6): **"CANARIES"** · sub "TNT turned their skin yellow" | WIPE | Typewriter clack, plough jingle, bell ding; factory machinery hum (low); music light, then muted at b3 |
| S08-03 | 07:55.9–08:02.1 | s08.b4 (+ b5 +1.6 s) | "Others volunteered as nurses, in hospitals at home and abroad." | Station platform (S04-01 composition, grey day); a hospital train with red crosses on the carriages | `vadNurse`s help walking wounded (`britSoldier1916`, arm in a sling, a bandaged head, no blood) down from the train and along the platform; one nurse carries a tray of mugs; a soldier smiles weakly at her | `Train` (static, steam idling), red-cross carriage boards | Slow lateral track along the platform | Label (476.6–480.7), small: **VOLUNTARY AID DETACHMENT (VAD) NURSES** | FADE | Steam hiss, footsteps, quiet voices; warm, gentle strings |
| S08-04 | 08:02.1–08:08.3 | s08.b5 (rest) | "German air raids killed about 1,400 people in Britain, including 18 children at a school in Poplar." | An empty schoolroom in daylight, desaturated (`Interior`, small desks, a blackboard, tall windows) | **No figures, no children shown.** Dust moves in the sunbeams; a chair is pushed slightly askew; a small bunch of flowers lies on one desk | Sunbeams; `Particles dust`; flowers; small coats on wall pegs | Very slow push 1.00→1.04 towards the window | DateCard TL (482.5–487.7), tone **dark**: **13 JUNE 1917** / **POPLAR, LONDON**. FactPill RM (483.0–487.9): **AIR RAIDS ON BRITAIN, 1915–18: ABOUT 1,400 KILLED (EST.)** | DIP | Silence except a ticking classroom clock and distant birdsong; one soft piano note |
| S08-05 | 08:08.3–08:20.0 | s08.b6–b7 | "As U-boats sank supply ships, Britain brought in rationing in 1918. In Germany, the British naval blockade caused severe food shortages." | British kitchen (`Interior`, table, small window) → (**pan through the wall**) German city street in winter, an empty shop window | b6: a mother (`woman2`) counts coupons from a ration book on to the table; a child eats from a small plate. b7: on the other side of a painted dividing line, in Germany, a long winter queue of women and children shuffles towards a shop with bare shelves; breath in the cold | Ration book, coupons; `Particles snow` on the German side; bare shelves; a sign over the shop | Lateral pan L→R across the dividing line (**change at 493.5**) | DateCard TL (488.9–493.2): **1918** / **RATIONING IN BRITAIN**. FactPill RM (494.4–499.7): **BRITISH NAVAL BLOCKADE: SEVERE FOOD SHORTAGES IN GERMANY** | CUT | Kitchen clock, coupon tear; then wind and shuffling feet; thin strings |

### s09 — Chapter 8: 1917: The Turning Year · 08:20–09:20 · 6 shots
Music: suspense (sea and codebreaking), a rising swell for America, a heavy, grinding slowness for Passchendaele, and a restless, darker pulse for Russia. Beats (narration.json, final):
- b0 500.80–504.20
- b1 504.60–509.74
- b2 510.06–519.71
- b3 520.03–533.98
- b4 534.48–543.32
- b5 543.82–548.92
- b6 549.24–557.35

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S09-01 | 08:20.0–08:30.1 | s09.b0–b1 | "1917 was the year the war turned. In February, Germany resumed unrestricted U-boat warfare against shipping." | Grey Atlantic at dusk (`Sea`, `Sky`, `Clouds`) | No people visible. A freighter steams L→R. A **periscope** cuts the water in the foreground; a torpedo wake runs towards the ship; a column of water rises far off at the hull (no fire on people), and the freighter begins to list | `Ship kind="freighter"`; **NEW V-03 U-boat periscope + torpedo wake**; `Smoke` | Low wave-level drift, pan with the wake | ChapterBanner (500.0–502.6): **CHAPTER 8 · 1917: THE TURNING YEAR**. DateCard TL (505.1–510.0): **FEBRUARY 1917** / **UNRESTRICTED U-BOAT WARFARE** · sub "ships sunk without warning" | INK | Waves, distant engine, a dull far-off boom; suspense strings |
| S09-02 | 08:30.1–08:40.0 | s09.b2 | "Earlier that winter, British intelligence had decoded a secret German telegram proposing an alliance with Mexico if America joined the war." | A London intelligence office (`Interior`, desks, lamp, files) | Three codebreakers in shirtsleeves (`man2`, `man3`, `woman1`) pass paper strips along a desk; one circles groups of numbers. The number groups on the telegram **morph** into words: "ALLIANCE" · "MEXICO" · "IF AMERICA JOINS THE WAR". They look up at each other | `Document` (telegram slip, number groups → words); lamp; pencils | Slow push down onto the telegram | Group label: **BRITISH INTELLIGENCE**. Prop tag (511.4–519.5): **ZIMMERMANN TELEGRAM · JANUARY 1917** | FADE | Pencil scratch, paper, faint Morse ticking; suspense |
| S09-03 | 08:40.0–08:54.5 | s09.b3 | "Together, the U-boats and the telegram pushed America into the fight. On 6 April 1917, the United States declared war on Germany, though its troops arrived in strength only in 1918." | Desk → French port in 1918 (quay, cranes, `Ship kind="liner"` as a troopship) | A newspaper spins in and lands on the desk (518.4). **MATCH** at ≈526: the camera whips past the paper to a French quay in 1918 where **`usSoldier1918`** file down a gangway in Brodie-pattern helmets with kitbags; French children wave; a band plays | `Newspaper` headline **U.S. DECLARES WAR ON GERMANY** · "6 April 1917"; `Ship liner`, cranes; `Flag` (US and French) | Newspaper spin and settle, then whip pan (**change at ≈527.1**) and a lateral track along the gangway | Newspaper (diegetic). FactPill RM (528.0–534.2): **US TROOPS ARRIVED IN STRENGTH ONLY IN 1918** | WIPE | Paper whoosh; then harbour gulls, boots on the gangway, a distant brass band; rising swell |
| S09-04 | 08:54.5–09:03.8 | s09.b4 | "British and Empire troops fought the Battle of Passchendaele, in rain and mud. Each side suffered around a quarter of a million casualties." | **E-01 trench set — mud variant:** a flooded crater field, shattered stumps, duckboard tracks across water, rain | `britSoldier1916`, `canSoldier` and `ausSoldier` (all in Brodies, capes) trudge single file along a duckboard track, bent under loads. One slips; two others haul him up by the arms. No one is shown hit | `Crater`s full of water with ripples; `Particles rain` heavy; duckboards; mist | Very slow lateral track R→L; at ≈538.8 crane up to show the endless mud (**internal change**) | DateCard TL (534.9–539.7): **JULY–NOVEMBER 1917** / **PASSCHENDAELE** · sub "Third Battle of Ypres". FactPill RM (538.8–543.6): **AROUND 250,000 CASUALTIES ON EACH SIDE (EST.)** | DIP | Heavy rain, mud suction, distant guns; slow, grinding low strings |
| S09-05 | 09:03.8–09:10.0 | s09.b5 (+ b6 +0.8 s) | "In Russia, revolution in March forced Tsar Nicholas II to abdicate." | Palace study (`Interior`, tall window); through the window, a Petrograd street with crowds and **plain red** banners | **`tsarNicholas`** (tag) sits at a desk, signs a document, lays down the pen and looks out of the window, sad. Outside, small crowd figures with plain red banners march past (`Crowd` with banners) | `Document`; `PlainBanner` red, no emblem; snow on the window ledge | Slow push from the Tsar to the window (crowd beyond) | NameTag: **TSAR NICHOLAS II** — Emperor of Russia. DateCard TL (544.3–549.3): **MARCH 1917** / **THE TSAR ABDICATES** | CUT | Pen scratch, muffled crowd outside; restless strings |
| S09-06 | 09:10.0–09:20.0 | s09.b6 | "In November, Lenin's Bolsheviks seized power, and in March 1918, Russia made peace with Germany and its allies." | Petrograd square at night (`Building`s, lamp glow, snow) → M-03 Eastern Front map | **`lenin`** (tag) speaks from the back of a truck to workers and soldiers (`worker`, `russianSoldier`), fist raised in a speaking gesture (`talkGesture`); crowd raises plain red banners. At ≈553.7 **MATCH** to the map: Russia's western lands hatch and peel away (approximate) and the front line vanishes | `Truck`; `PlainBanner`; `Particles snow`; map hatch | Push in on Lenin; then a zoom out into the map (**change at ≈553.7**) | NameTag: **VLADIMIR LENIN** — Bolshevik leader. DateCard TL (550.3–553.7): **NOVEMBER 1917** / **BOLSHEVIKS SEIZE POWER** · sub "October in Russia's old calendar". Map label (554.3–559.6): **TREATY OF BREST-LITOVSK · MARCH 1918** · "lands given up (approx.)" | FADE | Crowd voices (indistinct), wind; map ink; a dark pulse into s10 |

### s10 — Chapter 9: 1918: The Last Battles · 09:20–10:20 · 6 shots
Music: urgent and heavy (the offensive), steadying with resolve (Foch), driving (Amiens and the Hundred Days), quiet (Compiègne), then **total silence at 11 o'clock**. A sombre close. Beats (narration.json, final):
- b0 560.80–566.39
- b1 566.72–573.54
- b2 573.94–580.27
- b3 580.59–590.25
- b4 590.65–594.42
- b5 594.74–601.44
- b6 601.76–609.15
- b7 609.48–612.23
- b8 612.83–618.60

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S10-01 | 09:20.0–09:33.9 | s10.b0–b1 | "With Russia out, Germany gambled on winning in the west before American strength arrived. On 21 March 1918, its Spring Offensive struck, advancing up to 40 miles." | **M-01 Europe map → M-02 Western Front map** | — | b0: small train icons run from the east across Germany to the west; a US ship icon crosses the Atlantic edge far left, slowly. b1: **MATCH** zoom to M-02: a German bulge balloons west across the old Somme ground towards Amiens | Pan east → west with the trains, then zoom in (**change at 566.7**) | ChapterBanner (560.0–562.5): **CHAPTER 9 · 1918: THE LAST BATTLES**. DateCard TL (567.3–573.7): **21 MARCH 1918** / **SPRING OFFENSIVE**. FactPill RM (569.0–573.7): **UP TO 40 MILES (64 KM)** | INK | Train rhythm, then a heavy drum roll as the bulge grows |
| S10-02 | 09:33.9–09:40.6 | s10.b2 | "But the Allies held, under a single commander, the French general Foch, and in July they struck back." | Allied HQ in a French château room (`Interior`, tall windows; `WallMap` with M-02 inset) | **`foch`** (tag) points decisively at the wall map; British, French and US officers (generic `politician`-style officers in uniforms, unnamed) nod and step in close. On "struck back" he sweeps his arm right across the map | `WallMap` (M-02, small arrows reversing direction at 578.6) | Slow arc round the group to the map | NameTag: **GENERAL FERDINAND FOCH** — Allied commander, 1918 | CUT | Room tone, pointer tap; resolute strings |
| S10-03 | 09:40.6–09:50.6 | s10.b3 | "On 8 August, at Amiens, they attacked with some 450 tanks, on a day Ludendorff later called 'the black day of the German Army'." | Rolling farmland in thick dawn mist (`Hills`, `Ground`, mist) | **NEW V-02 WW1 rhomboid tanks** (several, staggered by depth) loom out of the mist, tracks turning, and roll L→R. Infantry (`britSoldier1916`, `ausSoldier` and `canSoldier` in Brodies) walk behind them in small groups. At ≈584.8 crane up to show many tanks across the whole field | V-02 tanks with exhaust; mist; distant smoke; no fire on people | Low tracking shot beside a tank, then a crane up and wide (**change at ≈584.8**) | DateCard TL (581.0–585.5): **8 AUGUST 1918** / **AMIENS**. MemorialCard centre-upper (585.8–590.4): **"the black day of the German Army"** — Ludendorff, later, in his memoirs | WIPE | Tank engines and track clank, distant guns; driving brass |
| S10-04 | 09:50.6–10:01.8 | s10.b4–b5 | "In the Hundred Days that followed, the Allies kept advancing. Germany's allies collapsed. Sailors mutinied, revolution spread, and the Kaiser fled to the Netherlands." | M-02 map → pull back to M-01 Europe map | — | b4: Allied arrows push the front east, step by step, back to Mons. b5: pull back to Europe. Bulgaria, the Ottoman Empire and Austria-Hungary fade to grey one by one, each with a small tick label. At Kiel a plain red flag icon pops up. Inside Germany, red dots spread. A crown icon slides from Berlin to the Netherlands | `FrontLine` animation, `MapArrow`s, grey-out fills, icons | Push east with the front, then a pull-back to Europe (**change at 594.7**) | Label (591.0–594.3): **THE HUNDRED DAYS**. Ticker UC (595.0–601.6): **BULGARIA 29 SEP · OTTOMAN EMPIRE 30 OCT · AUSTRIA-HUNGARY 3 NOV**. Map labels: **KIEL: SAILORS MUTINY** · **THE KAISER FLEES TO THE NETHERLANDS** | FADE | Map ink ticks, low drum; music begins to thin |
| S10-05 | 10:01.8–10:09.5 | s10.b6 | "At about 5 a.m. on 11 November, an armistice was signed in a railway carriage near Compiègne." | Forest clearing before dawn, mist, bare autumn trees; a single railway carriage on a siding with lit windows | Silhouettes inside the carriage lean over a table and sign (seen through the windows only, no faces). A sentry outside paces slowly in the mist; breath vapour | `Train` (single carriage, static, lit windows); `Tree` bare ×8; mist; falling leaves | Slow push towards the lit window | DateCard TL (602.3–608.9): **11 NOVEMBER 1918** / **COMPIÈGNE** · sub "about 5 a.m.". Group label on the carriage (604.1–609.1): **ALLIED AND GERMAN DELEGATES** | DIP | Forest hush, an owl, footsteps on leaves; music almost out |
| S10-06 | 10:09.5–10:20.0 | s10.b7–b8 | "At 11 o'clock, the guns fell silent. Even that morning, an estimated 2,700 to 3,000 men were killed." | **E-01 trench, grey November morning**, mist | Close on a pocket watch held in a soldier's hand: the hand reaches 11:00. Pull back: the soldiers (`britSoldier1916`, a `canSoldier`) slowly stand on the firestep, take off their helmets (`helmetToChest`) and look out over the parapet. Nobody cheers. b8: the camera rises over no-man's land, where a line of empty helmets rests on the far side of the wire | Pocket-watch close-up (prop); mist; `SombreGrade` | Close-up, then a slow pull-back (**change at ≈611.1**), then a slow crane over the parapet (**change at 612.8**) | Clock face (diegetic) **11:00**. FactPill RM (613.3–619.0), tone **dark**: **EVEN THAT MORNING: AN ESTIMATED 2,700–3,000 MEN KILLED** | CUT | Distant guns fire and **stop at 11:00 (609.5)**: **1.0 s total silence**, then birdsong returns faintly and a watch ticks. Music re-enters very quietly at b8 (single sustained note) |

### s11 — Chapter 10: The Cost and the Legacy · 10:20–12:00 · 9 shots
Music: a sombre, reflective theme. It becomes very quiet under the graves, the silence and the poem. A quiet resolve for Versailles, then a low, uneasy note for "Just 20 years later", resolving into the end-card theme. Beats (narration.json, final):
- b0 620.80–623.64
- b1 624.04–629.92
- b2 630.24–635.41
- b3 635.73–643.08
- b4 643.58–653.15
- b5 653.47–667.78
- b6 668.28–674.20
- b7 674.70–677.45
- b8 677.85–681.24
- b9 681.54–684.66
- b10 685.66–693.77
- b11 694.09–704.35
- b12 704.85–711.36
- b13 711.86–713.78

| Shot | Time | Beats | Narration (excerpt) | Location / background | Characters & actions | Props / vehicles / FX / map | Camera | On-screen text | Trans in | SFX / music |
|---|---|---|---|---|---|---|---|---|---|---|
| S11-01 | 10:20.0–10:30.2 | s11.b0–b1 | "The cost was almost impossible to grasp. Around 9 to 10 million servicemen had died, and about 21 million had been wounded." | War cemetery, rows of white headstones to the horizon, overcast (existing `Cemetery`, `dusk=0.3`) | A single visitor (an older woman, `woman3`) walks slowly along a row and stops. Wind moves the grass | `Cemetery`; grass sway; `Birds` far off | Slow pull-back high and wide over the rows (b1), revealing more and more | ChapterBanner (620.0–622.5): **CHAPTER 10 · THE COST AND THE LEGACY**. FactPill UC (624.4–629.9): **AROUND 9–10 MILLION SERVICEMEN DIED (EST.)** · **ABOUT 21 MILLION WOUNDED (EST.)** | DIP (slow, 1.0 s) | Wind, a distant bird; sombre theme |
| S11-02 | 10:30.2–10:43.6 | s11.b2–b3 | "Millions of civilians died too, from fighting, hunger, disease and genocide. And in 1918 and 1919, a flu pandemic swept the world, killing at least 50 million people." | A ruined village at the front edge (existing `Rubble`, damaged `Building`s) → `Globe` | b2: a family of refugees (`woman2`, `man1`, `kid1`) pushes a hand cart (`HandCart`) slowly along the rubble-lined road, away from camera. b3: **MATCH** as the camera rises into the grey sky, which becomes a turning globe; soft grey dots spread outward from many places across every continent | `HandCart`, `Rubble`, smoke wisps; `Globe` with spreading dots (no source country implied) | Track behind the family, then a crane up into the globe (**change at 635.7**) | FactPill RM (631.2–635.4): **MILLIONS OF CIVILIANS DIED (EST. 6–13 MILLION)**. FactPill RM (636.4–643.2): **1918–19 FLU: AT LEAST 50 MILLION DEAD WORLDWIDE (EST.)** | FADE | Cart wheels, wind; globe hum; low strings |
| S11-03 | 10:43.6–10:53.5 | s11.b4 | "Four empires, the German, Austro-Hungarian, Russian and Ottoman, collapsed, and new states such as Poland and Czechoslovakia appeared on the map." | **M-01 Europe 1914 → NEW M-05 Europe 1919–23 map** (morph) | — | The four empire fills crack along new border lines and fade one by one (German, Austro-Hungarian, Russian, Ottoman). New states fill in with fresh flat colours and labels pop up in sequence: POLAND, CZECHOSLOVAKIA, AUSTRIA, HUNGARY, KINGDOM OF SERBS, CROATS AND SLOVENES, ESTONIA, LATVIA, LITHUANIA, FINLAND | Morphing borders (`lerpLine`), fills; hatch on disputed eastern borders | Slow zoom 1.0→1.2 to central Europe | Labels as listed. Corner note (lower right, above y 860): **BORDERS APPROXIMATE** | FADE | Soft paper-crack per empire; music steady, reflective |
| S11-04 | 10:53.5–11:08.3 | s11.b5 | "Near Mons lie two British soldiers: John Parr, believed to be the first British soldier killed, in August 1914, and George Ellison, believed to be the last, on the final morning. Their graves face each other." | St Symphorien military cemetery near Mons: trees, a small lawn, two white headstones facing each other across a short path (`Cemetery` variant, close) | No figures. Leaves drift. Start on Parr's headstone (653.5–660.1), pan across the path to Ellison's (657.5–663), then crane up so both stones are in frame, facing each other (665.6–668.3) | Two headstones with engraved names and dates only; falling leaves; dappled light | Slow pan, then a crane up (**changes at 660.1 and 665.6**) | Headstones (diegetic): **J. PARR · 21 AUGUST 1914**; **G. E. ELLISON · 11 NOVEMBER 1918**. FactPill RM (654.2–659.1): **FIRST BRITISH SOLDIER KILLED (BELIEVED)**; FactPill RM (660.6–665.4): **LAST BRITISH SOLDIER KILLED (BELIEVED)**. Location label (664.8–668.2): **ST SYMPHORIEN, NEAR MONS** | DIP | Leaves, wind, a wood pigeon; solo piano |
| S11-05 | 11:08.3–11:25.7 | s11.b6–b9 | "Every year, at 11 o'clock on 11 November, people fall silent to remember. In the words of the poet Laurence Binyon: 'They shall grow not old, as we that are left grow old, Age shall not weary them, nor the years condemn.'" | A present-day town war memorial on a grey November morning (existing `Memorial`, adapted: a stone cross with poppy wreaths at its base) | A modern crowd (`Crowd` action `still`, mixed ages, plain modern clothes) stands in silence, heads bowed. An old man takes off his hat; a child holds her mother's hand. At ≈674.5 the camera cranes slowly up past the crowd to the wreaths, and red poppy petals lift and drift in the wind | Poppy wreaths (**SHOULD E-S1**; fallback: red wreath circles); petal particles (`Particles confetti` tinted poppy red, sparse, slow); `Candle`s | Slow push on the crowd (b6), then a long, slow crane to the wreaths and petals (**change at ≈674.5**) | Clock (diegetic, on the memorial tower or a church): **11:00**. MemorialCard centre (677.8–685.6): **"They shall grow not old, as we that are left grow old,"** / (680.9) **"Age shall not weary them, nor the years condemn."** / small credit **Laurence Binyon, "For the Fallen", 1914** | CUT | b6: near-silence (wind, a distant bell); poem: a single sustained instrument; **SHOULD**: a solo bugle phrase under the tail (684.5–685.5; original recording) |
| S11-06 | 11:25.7–11:34.1 | s11.b10 | "On 28 June 1919, five years to the day after Sarajevo, Germany signed the Treaty of Versailles." | Hall of Mirrors (existing `HallOfMirrors`) | Unnamed Allied delegates sit along a long table. The German delegates (group label) walk in, sit and sign one after another; chandeliers sway slightly | `Document` **TREATY OF VERSAILLES** with an animated signature; `Pen` | Slow push down the hall to the document | DateCard TL (686.2–693.5): **28 JUNE 1919** / **TREATY OF VERSAILLES** · sub "five years to the day after Sarajevo". Group labels: **ALLIED DELEGATES** · **GERMAN DELEGATION** | FADE | Pen scratch, murmur; formal but uneasy strings |
| S11-07 | 11:34.1–11:44.9 | s11.b11 | "It lost land and all its colonies, had to accept a 'war guilt' clause and pay reparations, and its army was strictly limited. Many Germans resented it." | Existing **`MapVersailles`** (ep01: Germany's lost territories) → a Berlin street (existing `Street`, overcast) | Map (694.1–700.2): lost territories outline red and slide to their new owners; Danzig is marked "Free City". At ≈700.4 **MATCH** to a Berlin street where men read a newspaper on a bench and shake their heads; a veteran in a field-grey greatcoat walks past, head down | `MapVersailles` (ep01 memory rules: Danzig Free City; Saar under the League; Rhineland demilitarised, not lost); `Newspaper` (headline: none, or "PEACE TERMS"); `Bench` | Map zoom; then a whip to the street and a slow track (**change at ≈700.4**) | ListPill RM (694.7–704.6): **LAND AND ALL COLONIES LOST** · **"WAR GUILT" CLAUSE** · **REPARATIONS** · **ARMY STRICTLY LIMITED** (lines appear in turn) | CUT | Paper tear (subtle) per territory; street wind, muttering; music darkens |
| S11-08 | 11:44.9–11:53.8 | s11.b12–b13 | "The peace left grievances that others would exploit. Just 20 years later, Europe was at war again. And that is another story." | History room | The Guide chalks **1919**, then a long arrow labelled **20 YEARS**, then **1939**, and underlines it. A long shadow slides across the board (as in ep01's foreshadowing). On b13 he turns to camera, lifts a book titled **WORLD WAR II** from the desk, taps it and gives a small, serious nod | Chalk; shadow overlay; book prop | Static; push in to "1939" (**change at ≈708.0**); hold on the Guide for b13 | Chalk only | WIPE | Chalk; a low uneasy note, then a resolving phrase into the end card |
| S11-09 | 11:53.8–12:00.0 | — (no narration) | — | Deep-navy end card (existing `EndCard`) | Channel logo top-left as always; a still from ep01 in the "watch next" frame | End-screen element spaces | Slow push 1.00→1.02 | **WATCH NEXT: WW2 — FROM START TO FINISH**; **THE HUMAN STORY** · "History is made by people." | FADE | End-card theme, fade out to 0 at 720.0 |

---

## 3. On-screen text checklist (for QC)
All figures and dates trace to `production/research/ep02-ww1/research-notes.md` (fact IDs §n.m) or to `script.json`.

| Text | Shot | Source |
|---|---|---|
| 28 JUNE 1914 · SARAJEVO (BOSNIA) | S01-01, S03-01 | 3.1 |
| ARCHDUKE FRANZ FERDINAND — heir to Austria-Hungary('s throne); SOPHIE — his wife | S01-01, S03-01 | 3.1; animator style-sample tags |
| GAVRILO PRINCIP — Bosnian Serb, aged 19 | S01-02, S03-02 | 3.2 |
| AROUND 9–10 MILLION SOLDIERS DEAD (EST.) | S01-03 | 1.3, 11.1 |
| 4 EMPIRES FALL · German · Austro-Hungarian · Russian · Ottoman | S01-03 | 11.7 |
| GREAT POWERS · RIVAL EMPIRES | S02-01 | 2.2 |
| TRIPLE ENTENTE (Britain more loosely tied); TRIPLE ALLIANCE; ITALY NEUTRAL IN 1914 | S02-02, S02-03 | 2.1 |
| ARMS RACE · NAVAL RACE: BRITAIN v GERMANY | S02-04 | 2.2 |
| BOSNIA (ruled by Austria-Hungary); AN EMPIRE OF MANY PEOPLES | S02-05 | 2.4 (the 1908 annexation date is deliberately omitted) |
| GERMANY'S WAR PLAN: FRANCE FIRST, THROUGH BELGIUM — THEN RUSSIA | S02-06 | 2.2, D6 (generic wording, not "Schlieffen Plan") |
| THE ARCHDUKE AND SOPHIE WERE KILLED | S03-02 | 3.1 |
| "BLANK CHEQUE" — Germany's promise of full backing | S03-03 | 3.5 |
| 23 JULY 1914 ULTIMATUM · 48 HOURS · 25 JULY: SERBIA ACCEPTS MOST TERMS — NOT ALL | S03-04 | 3.6, 3.7 |
| Calendar 28 JUL · 30–31 JUL · 1 AUG · 3 AUG · 4 AUG; 4 AUGUST 1914 BELGIUM INVADED | S03-05 | 3.8–3.12 |
| BRITAIN AT WAR · 4 August 1914; 11 P.M. LONDON TIME · midnight in Berlin | S03-06 | 3.13 |
| A DEBATE · MAIN RESPONSIBILITY / SHARED RESPONSIBILITY · Fischer 1961 · Clark 2012 | S03-08 | D1 |
| 23 AUGUST 1914 · MONS | S04-02 | 4.1 |
| SEPTEMBER 1914 · THE MARNE | S04-03 | 4.4 |
| THE RACE TO THE SEA; WESTERN FRONT: ABOUT 700 KM | S04-04 | 4.6, 4.7 |
| CHRISTMAS 1914; Eve quote (diary, 25 December 1914); UNOFFICIAL · PATCHY · NOT EVERYWHERE | S04-05, S04-06 | 4.8–4.10, §6 |
| FRONT LINE · SUPPORT · RESERVE; A FEW DAYS AT A TIME | S05-01 | 5.1 |
| TRENCH FOOT | S05-02 | 5.3 |
| APRIL 1915 · YPRES · first large-scale gas attack; FEARED MORE THAN IT KILLED | S05-03 | 5.5–5.7 |
| SHELL SHOCK: ABOUT 80,000 RECORDED CASES · BRITISH ARMY · many more unrecorded | S05-04 | 5.8 |
| 306 … EXECUTED · mostly for desertion or cowardice · PARDONED IN 2006 | S05-05 | 5.9 |
| AUGUST 1914 · TANNENBERG | S06-01 | 6.1 |
| 25 APRIL 1915 · GALLIPOLI; ANZACS term card | S06-02 | 6.5, 6.8 |
| EVACUATED BY JANUARY 1916 · more than 44,000 Allied dead (est.) | S06-03 | 6.5, 6.6 (MEDIUM, as an estimate) |
| ITALY JOINS THE ALLIES · MAY 1915 | S06-04 | 6.9 |
| ABOUT 1.5 MILLION MEN FROM SOUTH ASIA SERVED IN THE INDIAN ARMY | S06-04 | 6.11 |
| INDIAN ARMY · CANADA · AUSTRALIA · BRITISH WEST INDIES REGIMENT (group labels) | S06-05 | 6.11, 6.12, 6.14 |
| 1915 · OTTOMAN EMPIRE; AN ESTIMATED 600,000 TO 1.5 MILLION ARMENIANS DIED; THE ARMENIAN GENOCIDE · 1915–; denial line | S06-06, S06-07 | 6.20, 6.22, 6.23 |
| FEBRUARY 1916 · VERDUN; ABOUT 300 DAYS · AROUND 700,000 CASUALTIES (EST.) | S07-01, S07-02 | 7.1, 7.3 |
| JULY 1916 · THE SOMME · partly to relieve Verdun; DAY 1…DAY 7 | S07-03 | 7.4, 7.6 ("a week") |
| 1 JULY 1916; MORE THAN 57,000 BRITISH CASUALTIES · OVER 19,000 DEAD | S07-04 | 7.5 |
| "PALS" BATTALIONS · friends and workmates from the same towns | S07-05 | 7.7 |
| A FEW MILES; JULY–NOVEMBER 1916: MORE THAN 1 MILLION CASUALTIES, ALL SIDES (EST.) | S07-06 | 7.9, 7.10 |
| MILITARY SERVICE ACT 1916; 1916 · CONSCRIPTION | S08-01 | 8.6 |
| BY 1918: ALMOST A MILLION BRITISH WOMEN IN MUNITIONS; "CANARIES" · TNT turned their skin yellow | S08-02 | 8.1, 8.2 |
| VOLUNTARY AID DETACHMENT (VAD) NURSES | S08-03 | 8.4 |
| 13 JUNE 1917 · POPLAR, LONDON; AIR RAIDS ON BRITAIN, 1915–18: ABOUT 1,400 KILLED (EST.) | S08-04 | 8.12, 8.13 |
| 1918 · RATIONING IN BRITAIN; BRITISH NAVAL BLOCKADE: SEVERE FOOD SHORTAGES IN GERMANY | S08-05 | 8.8, 6.19 |
| FEBRUARY 1917 · UNRESTRICTED U-BOAT WARFARE · ships sunk without warning | S09-01 | 9.1 |
| BRITISH INTELLIGENCE; ZIMMERMANN TELEGRAM · JANUARY 1917; telegram words | S09-02 | 9.2 |
| U.S. DECLARES WAR ON GERMANY · 6 April 1917; US TROOPS ARRIVED IN STRENGTH ONLY IN 1918 | S09-03 | 9.3, 9.4 |
| JULY–NOVEMBER 1917 · PASSCHENDAELE · Third Battle of Ypres; AROUND 250,000 CASUALTIES ON EACH SIDE (EST.) | S09-04 | 9.8, 9.9 |
| TSAR NICHOLAS II — Emperor of Russia; MARCH 1917 · THE TSAR ABDICATES | S09-05 | 9.5 |
| VLADIMIR LENIN — Bolshevik leader; NOVEMBER 1917 · BOLSHEVIKS SEIZE POWER · October in Russia's old calendar; TREATY OF BREST-LITOVSK · MARCH 1918 | S09-06 | 9.6, 9.7 |
| 21 MARCH 1918 · SPRING OFFENSIVE; UP TO 40 MILES (64 KM) | S10-01 | 10.1, 10.3 |
| GENERAL FERDINAND FOCH — Allied commander, 1918 | S10-02 | 10.5 (**researcher: confirm rank wording "General" and first name**) |
| 8 AUGUST 1918 · AMIENS; Ludendorff quote | S10-03 | 10.7, §6 |
| THE HUNDRED DAYS; BULGARIA 29 SEP · OTTOMAN EMPIRE 30 OCT · AUSTRIA-HUNGARY 3 NOV; KIEL: SAILORS MUTINY; THE KAISER FLEES TO THE NETHERLANDS | S10-04 | 10.8, 10.10, 10.11 |
| 11 NOVEMBER 1918 · COMPIÈGNE · about 5 a.m.; ALLIED AND GERMAN DELEGATES | S10-05 | 10.12 |
| 11:00; EVEN THAT MORNING: AN ESTIMATED 2,700–3,000 MEN KILLED | S10-06 | 10.12, 10.13 |
| AROUND 9–10 MILLION SERVICEMEN DIED (EST.) · ABOUT 21 MILLION WOUNDED (EST.) | S11-01 | 11.1, 11.4 |
| MILLIONS OF CIVILIANS DIED (EST. 6–13 MILLION); 1918–19 FLU: AT LEAST 50 MILLION DEAD WORLDWIDE (EST.) | S11-02 | 11.2, 11.6 |
| New states and BORDERS APPROXIMATE | S11-03 | 11.7, 11.8 |
| J. PARR · 21 AUGUST 1914; G. E. ELLISON · 11 NOVEMBER 1918; FIRST/LAST BRITISH SOLDIER KILLED (BELIEVED); ST SYMPHORIEN, NEAR MONS | S11-04 | 4.2, 10.14, 10.15 (**researcher: confirm the headstone initials "G. E."**; fallback "G. ELLISON") |
| Binyon lines + credit | S11-05 | §6 (exact text copied from `script.json`) |
| 28 JUNE 1919 · TREATY OF VERSAILLES · five years to the day after Sarajevo; group labels | S11-06 | 11.9 |
| LAND AND ALL COLONIES LOST · "WAR GUILT" CLAUSE · REPARATIONS · ARMY STRICTLY LIMITED | S11-07 | 11.10 |
| WATCH NEXT: WW2 — FROM START TO FINISH | S11-09 | ep01 published title (director brief) |

---

## 4. Decisions for the user (checkpoint 3)
Each question gives the recommended option first.

1. **The Guide.** Should ep01's fictional Guide return in the history room for five short explainer shots: the opening question, the dominoes, trigger versus causes, the Somme debate and the WW2 bridge? **Recommended: yes.** It costs nothing new and links the series. The alternative is chalk-only boards with no presenter.
2. **Sarajevo.** No gun is shown firing: two off-screen reports, pigeons scattering, then an empty car seat with the archduke's hat. **Recommended: yes.** The alternative is a hard cut to black on the shots.
3. **First day of the Somme.** Men walk into smoke, seen from behind, and the trench is left empty. Nobody is shown falling. **Recommended: yes.**
4. **Armenian Genocide.** About 30 s with an empty doorway, distant silhouettes walking into the desert and a candle. No perpetrators, flags or bodies are shown, and the wording follows the research file. **Recommended: yes, as boarded.**
5. **"Canaries".** Heads stay white (your earlier decision). The yellow comes only from a powder haze and yellow-dusted overalls, plus the label. **Recommended: yes.** The alternative is the label only, with no yellow haze.
6. **Revolution flags (Petrograd 1917, Kiel 1918).** **Recommended: plain red flags with no emblem.**
7. **Remembrance extras.** Poppy wreaths and drifting petals at the memorial, and a short solo bugle phrase after the poem, are both optional (SHOULD). **Recommended: yes to poppies, yes to the bugle** if the audio-engineer can record an original performance. Otherwise the memorial plays with wind only.
