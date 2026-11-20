# Handoff — ep02-ww1 — 12-video-editor-assembly-b (Phase C assembly, sections s06–s11)

- **From:** video-editor (editor B)
- **To:** director (cc: quality-control, video-editor A)
- **Date:** 2026-11-18
- **Status:** AWAITING REVIEW

## Deliverables
- `the-human-story/episode-02-ww1/src/scenes/S06.tsx`, `S07.tsx`, `S08.tsx`: s06–s08. These were finished in the earlier run and are unchanged in this one.
- `the-human-story/episode-02-ww1/src/scenes/S09.tsx`, `S10.tsx`, `S11.tsx`: s09–s11, fully rebuilt with Episode 2 content. No Episode 1 code is left in them. The exports are unchanged: `S0xPicture: React.FC<{f:number}>` and `S0xOverlay: React.FC`.
- `the-human-story/episode-02-ww1/src/scenes/kit-b.tsx`: editor B's helpers. New in this run:
  - `WhipPan`: whip-pan match between two scenes.
  - `QuoteCard`: the Binyon card, with a small credit line.
  - `ListLabel`: a vertical list whose lines appear in turn.
  - `PocketWatch`: the seconds hand now runs at real speed (6° per second).
- `the-human-story/episode-02-ww1/src/scenes/__preview_b__/Root.tsx`: s09–s11 added. Use `RangeB` for 320–720 s, or `StillsB` with `--props {"times":[…]}`.
- `the-human-story/episode-02-ww1/public/endcard/ep01-thumb.jpg`: a copy of our own `production/thumbnails/ep01-ww2/thumbnail-ep01.jpg`. It is the still in the S11-09 "WATCH NEXT" frame.
- Preview stills (scale 0.5) are in `production/video/ep02-ww1/previews/b-*.jpeg`:
  - s09–s11: one or more mid-shot stills per shot.
  - s06–s08: 7 spot checks.

## Summary
I built all 21 storyboard shots for s09–s11 from the library assets: maps M-01, M-02, M-03 and M-05, `MapVersailles`, the E-01 trench (mud, grey and no-man's-land variants), the V-02 tanks, the V-03 periscope, torpedo wake and water column, the E-S1 poppies and memorial, `Cemetery`, `HallOfMirrors` and `HistoryRoom`, and the presets `tsarNicholas`, `lenin`, `foch` and `usSoldier1918`.
- **Timing.** Every cut and card is keyed to the beats in `narration.json`, using `cut(k)`, `b.at()` and `abs()`.
- **Movement.** Every shot moves (no stills).
- **Text.** All on-screen text follows §3 exactly. Real people carry name tags; unnamed groups carry group tags.
- **Name checks.** Foch's tag reads **GENERAL FERDINAND FOCH / Allied commander, 1918**, from `FOCH_TAG`. The headstone reads **G. E. ELLISON**.
- **Sombre shots** use slow cameras, mist, wind, leaves, petals and a candle only: S10-05, S10-06 and S11-01 to S11-05. Nobody is hit and nobody cheers.
- **Checks.**
  - `npx tsc --noEmit -p .` passes for the whole engine, including A's files at the time of the run.
  - I viewed 23 + 12 stills for s09–s11 and 7 for s06–s08, and fixed what I found (listed below).
  - The logo zone is clear in every still, and no WW2 leftovers remain.

### Per-shot summary
**s06–s08** (earlier run, unchanged):
- **s06:**
  - Tannenberg: globe → M-03.
  - Gallipoli: M-04.
  - The cliffs → the night evacuation.
  - The world at war: globe with Empire routes.
  - Empire troops on a French road, with group labels.
  - Armenian Genocide: an empty doorway, then distant silhouettes, a candle and the memorial card.
- **s07:**
  - Verdun: M-02.
  - The road to Verdun.
  - The Somme map → the week of shelling.
  - 1 July: men walk into the mist and nobody falls.
  - The Pals street.
  - The Somme creep.
  - The debate scale.
- **s08:**
  - The high street and the 1916 notice.
  - Split panels → munitions: the "canaries" haze; heads stay white.
  - VAD nurses at a hospital train.
  - The empty Poplar schoolroom.
  - Rationing → the blockade.

**s09 (500–560 s):**
- **S09-01:** The grey Atlantic. The periscope cuts the water and the torpedo wake runs to the freighter. A water column rises at the hull, the ship lists, and no people are visible. Date card FEBRUARY 1917.
- **S09-02:** The codebreakers (`man2`, `woman1`, `man3`). Paper strips pass along the desk and a pencil circles the groups. The telegram's number groups morph into ALLIANCE, MEXICO and IF AMERICA JOINS THE WAR. The three look up at each other, and the camera pushes down onto the telegram. Labels: group tag BRITISH INTELLIGENCE, then the prop label ZIMMERMANN TELEGRAM · JANUARY 1917.
- **S09-03:** The newspaper spins in: U.S. DECLARES WAR ON GERMANY · 6 April 1917. A whip pan (527 s) goes to a French quay. `usSoldier1918` file down the gangway of a liner used as a troopship. There are US and French flags, a small French band, and children and a woman waving. FactPill.
- **S09-04:** Passchendaele, on the E-01 mud set. British, Canadian and Australian soldiers, all in Brodies, trudge R→L along the duckboards in heavy rain. One slips and two others haul him up. The camera cranes up and wide at 538.8 s. Date card + FactPill.
- **S09-05:** The Tsar, with his tag, signs at his desk, lays down the pen and looks out. Through the window, a Petrograd crowd marches with **plain red** banners in the snow. The camera pushes from the Tsar to the window. Date card.
- **S09-06:** Lenin, with his tag and a cap, speaks from the back of a truck at night in the snow. Workers and soldiers stand with plain red banners. A zoom out matches to M-03 (553.4 s): the Brest-Litovsk hatch appears, the front vanishes, and the map's own label shows TREATY OF BREST-LITOVSK · MARCH 1918 / lands given up (approx.).

**s10 (560–620 s):**
- **S10-01:** M-01 `war1918`. Train icons run west and the US ship crosses. A continuous zoom matches to M-02, where the spring bulge grows towards Amiens. Date card + FactPill UP TO 40 MILES (64 KM).
- **S10-02:** A château room. Foch, with his tag, points at the `WesternFrontWallMap`, and its arrows reverse at about 578 s. On "struck back" he sweeps his arm across the map. Three unnamed officers (British, French, US; seen from behind; no tags) step in. Slow camera arc.
- **S10-03:** Amiens in dawn mist. Rhomboid tanks run in three depth layers, with infantry behind them. The low track beside the near tank cranes up and wide at 584.8 s. Date card, then the Ludendorff MemorialCard.
- **S10-04:**
  - On M-02, the Hundred Days push the front back to Mons, with the label THE HUNDRED DAYS.
  - The camera pulls back to M-01 (593.3 s).
  - Bulgaria, the Ottoman Empire and Austria-Hungary grey out in turn, in step with the ticker.
  - The Kiel red flag appears with the label KIEL: SAILORS MUTINY.
  - Red dots spread across Germany.
  - The crown slides from Berlin to the Netherlands, with the label THE KAISER FLEES TO THE NETHERLANDS.
- **S10-05:** Compiègne before dawn: bare trees, mist and falling leaves. The single carriage has lit windows, with leaning silhouettes inside (no faces). A sentry paces slowly and his breath shows as vapour. Slow push. Date card + group tag ALLIED AND GERMAN DELEGATES.
- **S10-06:**
  - A close-up of the pocket watch in a soldier's hand. The minute hand clicks to **11:00 exactly at 609.48 s (b7)**, and the seconds hand runs in real time.
  - The camera pulls back at 611.1 s. On the firestep, the men take off their helmets one by one (`helmetToChest`) and look out over the parapet. Nobody cheers.
  - The camera rises at b8 to no-man's land, where a line of empty helmets lies beyond the wire.
  - Dark label EVEN THAT MORNING: AN ESTIMATED 2,700–3,000 MEN KILLED.

**s11 (620–720 s; the s10 → s11 dip is in Episode.tsx):**
- **S11-01:** The cemetery, overcast. A lone visitor (`woman3`) walks along a row, stops and bows her head while the grass moves in the wind. Slow pull-back high and wide. Two-line label with the (EST.) figures.
- **S11-02:** A refugee family pushes a hand cart along a ruined road. The camera cranes up into a grey sky that becomes a turning globe. Grey flu dots appear at scattered times across every continent, so no source is implied. Two FactPills.
- **S11-03:** M-05. The four empires crack and fade in order. The new states fill and are labelled in order. Disputed-lands hatch, BORDERS APPROXIMATE, and a slow zoom from 1.0 to 1.2.
- **S11-04:** St Symphorien. Two headstones stand across a path, each turned slightly towards the other: **J. PARR · 21 AUGUST 1914** and **G. E. ELLISON · 11 NOVEMBER 1918**. Leaves fall and light is dappled. The camera starts on Parr, pans to Ellison (660.1 s) and cranes up to show both (665.6 s). FactPills FIRST / LAST BRITISH SOLDIER KILLED (BELIEVED), and the location label.
- **S11-05:**
  - A town war memorial (`TownWarMemorial`) with three poppy wreaths and candles. A church clock reads 11:00.
  - A modern crowd stands still and silent. An old man takes off his hat, and a girl stands beside her mother.
  - The camera cranes to the wreaths at 674.5 s, and the poppy petals lift.
  - The Binyon QuoteCard: line 1 at 677.8 s, line 2 at 681.5 s, then the credit.
- **S11-06:** The Hall of Mirrors. The Allied delegates are seated. Two German delegates walk in and sign one after the other, and the treaty's signature animates. Slow push down the hall. Date card, then group tags ALLIED DELEGATES and GERMAN DELEGATION, one at a time.
- **S11-07:** `MapVersailles`: the lost territories change hands, Danzig is a Free City, and the colonies inset shows. A whip pan (700.4 s) goes to a Berlin street. Two men on a bench read a newspaper headlined PEACE TERMS and shake their heads. A veteran in a field-grey coat walks past, head down. List with four lines, appearing in turn.
- **S11-08:**
  - The history room. The Guide chalks **1919**, then the arrow labelled **20 YEARS**, then **1939**, which he underlines.
  - A long shadow slides across the board.
  - The camera pushes in to 1939 at 708 s.
  - On b13 the camera returns to the Guide. He lifts a **WORLD WAR II** book, taps it and gives a small nod.
- **S11-09:** The end card, from 714.2 s, just after the last word. A deep-navy field with a slow push. `EndCardWW1` shows THE HUMAN STORY, the tagline and WATCH NEXT: WW2 — FROM START TO FINISH. The ep01 thumbnail sits in the frame.

## Changes to inputs / assumptions (deviations from the storyboard)
- **Boundaries.** Shot boundaries follow `cut(k)` (the gap between narration sentences) rather than the storyboard's rounded mm:ss, because narration v3 moved some beats by up to 0.7 s.
  - The end card starts at 714.2 s, not 713.8 s: the last word now ends at 713.995 s.
  - Card end times are clipped to their shot.
- **S09-02.** The prop label ZIMMERMANN TELEGRAM · JANUARY 1917 runs 514.4–519.5 s (storyboard 511.4 s). It sits under the telegram, after the push-in, so it never covers the codebreakers' faces. BRITISH INTELLIGENCE runs 510.3–514.0 s. `man3` (spiky hair) has short hair here, so no extra resembles the Guide.
- **S09-04 and S10-03.** `ausSoldier` wears a Brodie (head override), as the storyboard asks ("all in Brodies"). No capes are drawn because the library has no cape outfit.
- **S10-04.**
  - Grey-outs use `styles` overrides rather than `collapse.bulgaria/ottoman/austria`. The map's own tick tags ("29 SEPT", "30 OCT", "3 NOV") overlapped the state labels and duplicated the storyboard ticker text with different spelling.
  - The ticker sits top centre (y 112), not upper centre, so it does not cover Germany, where the action is.
  - The KIEL and KAISER labels are mine (`Label` at the map's screen positions). They are timed so that no more than two text elements show at once.
- **S10-06.** The 11 o'clock FactPill is a dark `OLabel` on two lines. `FactPill` has no dark tone.
- **S11-01.** The two figures are a single two-line label (`OLabel`) rather than a FactPill with a smaller sub-line, so both lines stay at 40 px.
- **S11-05.** The old man and the crowd use presets without spiky hair (`man3` is not used). The crowd faces the camera rather than the memorial, so the bowed heads and closed eyes read.
- **S11-07.** The four points are a `ListLabel` with no heading (`ListPill` requires one, and §3 lists none). It sits at the lower right, y 590–850, clear of the East Prussia and Danzig changes.
- **S11-08.** The book is drawn in the Guide's hand (dark red, gold border, WORLD WAR II). The desk is a simple prop beside him.
- **S11-09.** I added the end-card thumbnail `public/endcard/ep01-thumb.jpg`, a copy of our own ep01 thumbnail. Nothing else in `public/` changed.
- **No shared library files were changed.** I did not touch src/characters, src/components, src/maps, S01–S05, kit.tsx, kit-ep02.tsx, preview-a, Episode.tsx or render.sh.

## Blockers / issues
- [minor] **S11-07, `MapVersailles` (ep01 library map).** Its loss labels are 22–26 px, below the 36 px rule. Fixing this needs a library change (environment designer), or we accept it because the labels are brief and back up the ListLabel.
- [minor] **S06-02 (earlier run).** The ANZACS TermCard partly covers the map label "GALLIPOLI PENINSULA" for about 5 s, so the label shows only as "GA… PENINSULA". Possible fixes: move the TermCard, or have the environment designer let `MapGallipoli` hide that label while the card shows.
- [minor] **S11-03.** The library's corner note BORDERS APPROXIMATE sits next to the TURKEY label.
- [minor] **S10-01 (wide view).** The France label on M-02 reaches into the caption band.
- [info] **Lean mode.** I checked stills only. Motion, transitions and timing in motion still need QC's review on the full render: the whip pans, the crossfades between maps, and the 11:00 hand click against the audio silence at 609.5 s.
- [info] **Map frames.** Shots with the M-05 crack masks and the globes are likely the slowest to render.

## Requests for other agents
- **quality-control:** in the full render, check:
  - the 11:00 click against the silence in the mix
  - the Binyon text against script.json
  - the headstone G. E. ELLISON (the researcher rates the initials MEDIUM-HIGH; the fallback is "G. ELLISON")
  - the two minor label overlaps above
- **environment-designer (optional):** a size option for the `MapVersailles` labels, and a way to hide the `MapGallipoli` peninsula label.

## Recommended next action
- Director: commit S09–S11, kit-b, `__preview_b__` and `public/endcard/`. Once editor A has finished S03–S05, run the full chunked render and QC.
