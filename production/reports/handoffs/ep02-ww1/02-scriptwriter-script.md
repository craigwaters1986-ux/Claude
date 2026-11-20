# Handoff — ep02-ww1 — script

- **From:** scriptwriter
- **To:** director (cc: quality-control, storyboard, audio-engineer, environment-designer, animator)
- **Date:** 2026-11-16
- **Status:** AWAITING REVIEW (v2 — QC fixes applied; needs one-line re-check, then Approval 1)

## Deliverables
- `production/scripts/ep02-ww1/script.md` — human-readable script v1: 11 timed sections, narration, on-screen text suggestions, tone notes, fit table, accuracy notes for QC.
- `production/scripts/ep02-ww1/script.json` — machine-readable script for the narration builder (same schema as ep01: `id, chapter, start, end, lead, mustEndBy?` + `sentences[{text, say?, pauseAfter?}]`).

## Summary
"World War I: From Start to Finish", 720 s, **1,535 words**, British English, following the brief's 11-section plan and timings exactly. Hook is the research's recommended "Two shots, one wrong turn" (present tense, 28 June 1914), title card from 27.8 s. Written only from HIGH/MEDIUM research rows using their safe wording; all casualty numbers hedged in narration and marked "(est.)" on screen; war guilt, the Somme and Versailles → WW2 presented as debates. The Armenian Genocide has its own sombre ~22 s beat in s06 with the research's wording. Ends with a light bridge to Episode 1 ("Just 20 years later, Europe was at war again. And that is another story.") and a "Watch next" card. Word total is just under the brief's 1,550–1,650 band because this script is syllable-dense (place names, dates); by the fit model every window is already full, so adding words would only push speeds up.

### Per-section fit (estimated — Kokoro model not installed)
| Section | Window | Words | Est. speech at 1.0× | Budget | Est. speed |
|---|---|---|---|---|---|
| s01 Two Shots, One Wrong Turn | 00:00–00:35 (mustEndBy 27.8) | 61 | 27.4 s | 26.2 s | 1.05× |
| s02 Europe Before 1914 | 00:35–01:50 | 157 | 68.1 s | 72.4 s | 1.00× |
| s03 Sarajevo and the July Crisis | 01:50–03:10 | 170 | 83.0 s | 77.8 s | 1.07× |
| s04 1914: The War of Movement Stops | 03:10–04:20 | 163 | 69.2 s | 67.8 s | 1.02× |
| s05 Life in the Trenches | 04:20–05:20 | 136 | 60.0 s | 57.8 s | 1.04× |
| s06 A World War (incl. Armenian Genocide) | 05:20–06:30 | 145 | 72.9 s | 67.8 s | 1.08× |
| s07 1916: Verdun and the Somme | 06:30–07:30 | 135 | 61.6 s | 57.8 s | 1.07× |
| s08 The Home Front | 07:30–08:20 | 104 | 49.3 s | 47.8 s | 1.03× |
| s09 1917: The Turning Year | 08:20–09:20 | 120 | 61.9 s | 57.8 s | 1.07× |
| s10 1918: The Last Battles | 09:20–10:20 | 128 | 61.8 s | 57.8 s | 1.07× |
| s11 The Cost and the Legacy | 10:20–12:00 (mustEndBy 714.0) | 216 | 97.7 s | 93.2 s | 1.05× |

Fit method: `/opt/tts` and the `kokoro` module are absent, so no measured run. Estimates use a syllable model calibrated on ep01 v3's measured bm_george runs (~4.0 syllables/s at 1.0× plus each `pauseAfter`, default 0.32 s). All sections ≤ 1.08× (cap 1.17×). Body sections lead 0.8 s (s01 1.6 s, s02 1.2 s); s11 ends at 714 s, leaving a 6 s end-card hold.

### On-screen text cards (full wording in `script.md`)
- s01: "28 JUNE 1914 · SARAJEVO"; "≈ 9–10 million soldiers dead (est.)"; title "WORLD WAR I: FROM START TO FINISH" (27.8 s).
- s02: Europe 1914 map — "TRIPLE ENTENTE — France · Russia · Britain", "TRIPLE ALLIANCE — Germany · Austria-Hungary · Italy (neutral in 1914)"; "ARMS RACE", "NAVAL RACE: Britain v Germany", "THE BALKANS"; "German war plan: France first, through Belgium — then Russia"; "Pressures, not inevitability".
- s03: name tags Archduke Franz Ferdinand, Sophie, Gavrilo Princip (19); domino calendar 23 Jul → 25 Jul → 28 Jul → 30–31 Jul → 1 Aug → 3 Aug → 4 Aug; "11 p.m. London (midnight in Berlin)"; "TRIGGER ≠ CAUSE"; debate card "WHO WAS MOST TO BLAME?" (Fischer 1961 / Clark 2012).
- s04: "MONS · 23 AUGUST 1914", "THE MARNE · SEPTEMBER 1914", "THE RACE TO THE SEA", "Western Front ≈ 700 km", "CHRISTMAS 1914", diary card (Rifleman William Eve, 25 December 1914), "Unofficial · patchy · not everywhere".
- s05: "FRONT LINE · SUPPORT · RESERVE", "TRENCH FOOT", "YPRES · 22 APRIL 1915 — first large-scale gas attack", "SHELL SHOCK — ≈ 80,000 recorded cases, British Army (est.)", "306 executed · pardoned 2006".
- s06: "TANNENBERG · AUGUST 1914", "GALLIPOLI · 25 APRIL 1915", "ANZAC = Australian and New Zealand Army Corps" (optional "Allied dead: 44,000+ (est.)"), "ITALY JOINS THE ALLIES · MAY 1915", "Indian Army ≈ 1.5 million men", "THE ARMENIAN GENOCIDE · 1915–", "An estimated 600,000 – 1.5 million Armenians died (est.)", "24 April — Armenian Genocide Remembrance Day".
- s07: "VERDUN · 21 FEB – 18 DEC 1916 · ≈ 300 days · ≈ 700,000 casualties (est.)", "THE SOMME · 1 JULY 1916", "57,470 British casualties · 19,240 killed", "'Pals' battalions", "1 million+ casualties, all sides (est.)", debate card "WAS IT WORTH IT?".
- s08: "CONSCRIPTION · 1916", "≈ 1 million British women in munitions by 1918", "'CANARIES'", "German air raids on Britain, 1915–18: ≈ 1,400 killed (est.)", "POPLAR, LONDON · 13 JUNE 1917", "RATIONING · 1918", "BRITISH NAVAL BLOCKADE"; any poster labelled "Propaganda poster (recreated)".
- s09: "1917", "Zimmermann telegram — January 1917" + tag Arthur Zimmermann, "USA DECLARES WAR · 6 APRIL 1917", "Tsar Nicholas II abdicates · March 1917", "Bolsheviks seize power · 7 November 1917 (25 October in Russia's old calendar)", "Treaty of Brest-Litovsk · 3 March 1918", "PASSCHENDAELE (Third Ypres) · 31 JULY – 10 NOVEMBER 1917", "≈ 250,000 casualties on each side (est.)".
- s10: "SPRING OFFENSIVE · 21 MARCH 1918" ("up to 40 miles / 64 km"), tag "Marshal Foch — Allied commander", "AMIENS · 8 AUGUST 1918", quote card Ludendorff, "THE HUNDRED DAYS", "Bulgaria 29 Sep · Ottoman Empire 30 Oct · Austria-Hungary 3 Nov", "COMPIÈGNE · 11 NOVEMBER 1918 · c. 5 a.m.", "11:00", "Last day: an estimated 2,700–3,000 killed (est.)".
- s11: "≈ 9–10 million military dead (est.)", "≈ 21 million wounded (est.)", "Civilian dead: est. 6–13 million", "1918–19 flu: at least 50 million dead worldwide (est.)", new-states map ("approximate" borders), "TREATY OF VERSAILLES · 28 JUNE 1919", graves card John Parr † 21 Aug 1914 / George Ellison † 11 Nov 1918 (St Symphorien, near Mons), "11 a.m. · 11 November", Binyon poem card, "1939", "WATCH NEXT: WW2 — From Start to Finish".

## v2 changes (QC report `production/reports/qc/ep02-ww1/qc-script-20261116.md`, PASS WITH FIXES)
1. **s11 (MAJOR):** remembrance block (Parr/Ellison graves, 11 o'clock silence, Binyon + 1 s hold) moved **before** Versailles; section now ends "The peace left grievances that others would exploit. Just 20 years later, Europe was at war again. And that is another story." ("But" dropped). On-screen order updated.
2. **s06 (MAJOR):** "among them Australians and New Zealanders, the Anzacs," → "including the Anzacs," (Anzac explained on screen); "something darker happened" → "a catastrophe unfolded". Armenian beat wording and pauses unchanged. Est. 1.08× → 1.05×.
3. **s03:** cut "That morning, a bomb attack on their car failed."; "Later, after a wrong turn" → "After a wrong turn". Debate card left panel → "Main responsibility: Germany (and Austria-Hungary) — e.g. Fritz Fischer, 1961". Est. 1.07× → 1.02×.
4. **s09:** "Then British intelligence decoded…" → "Earlier that winter, British intelligence had decoded…"; Passchendaele moved before the Russia sentences (Brest-Litovsk stays as the last clause of s09, so s10's "With Russia out" follows directly). To hold the fit: "In Flanders," dropped (Flanders on the card) and "arrived in large numbers only in 1918" → "arrived in strength only in 1918". Added card gloss "U-boats could sink merchant ships without warning".
5. **s10:** "on what Ludendorff later called…" → "on a day Ludendorff later called…". Optional card "American troops arrive in large numbers" added to the Hundred Days map.
6. **s06 card:** duplicate "(est.)" removed — "An estimated 600,000 – 1.5 million Armenians died". Flu card keeps "(est.)". Binyon comma kept.
7. **Counts:** word count now = whitespace words, identical to summing `script.json` texts: **1,519 words**.

### v2 fit (estimated, syllable model; Kokoro still not installed)
| Section | Words | Est. speed |
|---|---|---|
| s01 | 61 | 1.05× |
| s02 | 157 | 1.00× |
| s03 | 160 | 1.02× |
| s04 | 163 | 1.02× |
| s05 | 136 | 1.04× |
| s06 | 140 | 1.05× |
| s07 | 135 | 1.07× |
| s08 | 104 | 1.03× |
| s09 | 120 | 1.07× |
| s10 | 128 | 1.08× |
| s11 | 215 | 1.05× |
| **Total** | **1,519** | all ≤ 1.08× (cap 1.17×) |

## Changes to inputs / assumptions
- Binyon lines copied from the Wikisource page transcription of *The Times* printing (Page:Binyon._For_the_Fallen.djvu/1): "They shall grow not old, as we that are left grow old, / Age shall not weary them, nor the years condemn." Wikisource has a **comma** after the first line; research §6 shows a colon. Used the comma (source text). QC to confirm.
- Somme first day said aloud as "more than 57,000 casualties, over 19,000 of them dead" (shorter to speak); exact 57,470 / 19,240 on screen only.
- Gallipoli dead not said aloud ("at a heavy cost in lives"); figure is optional on screen with "(est.)".
- Section titles adjusted slightly for chapters (s01 "Two Shots, One Wrong Turn", s04 "1914: The War of Movement Stops", s10 "1918: The Last Battles").

### Facts deliberately left out (time, or confidence)
- UNVERIFIED (all omitted): Ottoman Gallipoli dead, Somme shell count, Newfoundland at Beaumont-Hamel numbers, French 1917 mutinies, US troop numbers, artillery share of deaths as a %, "turnip winter".
- Cut for time: Lusitania, Jutland, Zeppelin/Gotha details (only the air-raid total and Poplar kept), propaganda (on-screen label only), Japan/Pacific, Brusilov, Bulgaria and Romania entering, Chinese Labour Corps, the British West Indies Regiment figure, Princip's fate, the "canaries" deaths, conscientious objectors, women in uniform, the first tanks, the French losses of 22 August, Henry Gunther, Lemkin, the Kaiser's abdication date, Versailles details (10 per cent of territory, 132 billion marks, League of Nations), the poppy's origins. Assyrian and Greek victims not mentioned (no verified numbers).
- Not used: "over by Christmas", "lions led by donkeys", Grey's "lamps" line, "war to end all wars", the "bleed France white" claim, the Schlieffen Plan name (generic "Germany's plan" used instead, D6).

## Blockers / issues
- [minor] No measured TTS fit: Kokoro model not installed here. Audio engineer's first `tts.py` run is the real check; if any section goes over ~1.12×, ask the scriptwriter to trim one clause there (s06, s03 and s09 are the tightest).
- [minor] s09 "Germany resumed unrestricted U-boat warfare against shipping" — QC please check this short gloss against row 9.1.

## Requests for other agents
- quality-control: one combined review (facts against research rows + quality/tone), especially the numbers listed in the research §10 word-budget hints, the Armenian beat wording, and the Binyon punctuation.
- audio-engineer: copy the respellings in `say` (Prin-tsip, Gav-reelo, Eep-ruh, Passhen-dale, Fosh, Kom-pyen, Vair-sigh) into the ep02 engine's RESPELL list if you prefer them there; set `EPISODE_LEN = 720`.
- storyboard: no named fictional characters in the narration; any illustrative soldier, nurse or munition worker must be labelled illustrative. Armenian beat needs its own visual tone (dusk, walking figures, empty doorway, candle; no bodies).

## Recommended next action
- Director: launch the combined QC review (sonnet), then put the script to the user for **Approval 1** (batched with style, Approval 2). The script needs the user's sign-off before storyboard.
