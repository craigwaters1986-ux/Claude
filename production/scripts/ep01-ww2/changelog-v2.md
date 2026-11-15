# Changelog — ep01-ww2 script v1 → v2 (fact-check pass)

_Scriptwriter, 2026-11-15. Scope: the researchers' fact-check corrections only. The YouTube specialist's hook suggestions (`production/exports/ep01-ww2/youtube/hook-review.md`) are deliberately NOT applied in this pass._

Sources: `production/research/ep01-ww2/fact-check-script-part1.md` (P1, s01–s06) and `fact-check-script-part2.md` (P2, s07–s11). "#n" refers to the claim row in each report.

## Narration changes (9)

| # | Section | Old text | New text | Verdict / reason | Source |
|---|---|---|---|---|---|
| 1 | s08 | "In the largest seaborne invasion in history, around 156,000 American, British, Canadian and other Allied troops landed on five beaches in Normandy." | "In the largest seaborne invasion in history, around 156,000 American, British, Canadian and other Allied troops landed in Normandy, from the sea on five beaches and from the air." | CORRECTION NEEDED (minor, required). The ~156,000 includes about 23,000 parachute and glider troops, who did not land on the beaches. | P2 #13; P2 Recommended change 1 (IWM; National WWII Museum) |
| 2 | s11 | "The war killed an estimated 70 to 85 million people, most of them civilians." | "The war killed an estimated 60 million people or more, most of them civilians." | DISPUTED. 70–85 million is the top of the range (only compilations including famine and disease deaths); IWM, the UN and the National WWII Museum give ~60 million. The report's safer option was used. | P2 #37; P2 Recommended change 2 |
| 3 | s05 | "So Germany bombed British cities instead. More than 40,000 civilians were killed in the Blitz." | "From September, Germany turned to bombing British cities. More than 40,000 civilians were killed in the Blitz." | NUANCE (sequencing/causation). The Blitz began on 7 September 1940, during the Battle of Britain, not after it. | P1 #54; P1 Recommended change 1 |
| 4 | s03 | "In 1936, German troops marched into the Rhineland." | "In 1936, German troops reoccupied the demilitarised Rhineland." | NUANCE (clarity). The Rhineland was German territory demilitarised under Versailles/Locarno; "marched into" sounded like invading another country. | P1 #28; P1 Recommended change 2 |
| 5 | s04 | "A secret protocol divided Eastern Europe between them." | "A secret protocol divided much of Eastern Europe into German and Soviet spheres of influence." | NUANCE (precision). The protocol split Poland and assigned Finland, the Baltic states and Bessarabia to spheres; it did not cover all of Eastern Europe. | P1 #35; P1 Recommended change 3 |
| 6 | s01 | "Across Europe, life goes on as normal." | "Across much of Europe, life seems to go on as normal." | NUANCE (overstatement). Summer 1939 was a time of crisis (Czech lands occupied, Danzig crisis, persecution of Jews). Wording also matches the hook review's point 4, so it stays compatible with a later hook rewrite. | P1 #2; P1 Recommended change 4 |
| 7 | s06 | "Meanwhile, Japan was expanding across Asia and the Pacific." | "Meanwhile, Japan was expanding across East and South-East Asia." | NUANCE (optional, recommended). Before 7 Dec 1941 the expansion was in China and French Indochina; the Pacific conquests came after Pearl Harbor. `say`: "South East" (hyphen removed for TTS). | P1 #62; P1 Recommended change 5 |
| 8 | s07 | "…four Japanese aircraft carriers, a blow Japan's navy never recovered from." | "…four Japanese aircraft carriers, a blow from which Japan's navy never fully recovered." | NUANCE (optional). Japan never replaced the carriers, aircraft and crews, but it did keep fighting major fleet actions. | P2 #3; P2 Recommended change 4 |
| 9 | s10 | "On 8 August, the Soviet Union declared war on Japan and invaded Manchuria." | "On 8 August, the Soviet Union declared war on Japan, and within hours its armies poured into Manchuria." | NUANCE (optional). The invasion began just after midnight on 9 August local time, hours before Nagasaki; the next sentence still reads correctly. | P2 #33; P2 Recommended change 3 |

`say` fields were updated to match wherever the sentence had one (s05, s08, s10, s11; s06 gained one). Respellings Vair-sigh, Luft-vaffa, Soo-dayten-land and El Ala-mayn are unchanged. No `pauseAfter`, `lead`, window or `mustEndBy` values were changed. A top-level `"version": "v2"` key was added to `script.json`; the narration builder ignores it.

## Fact-check items reviewed but not changed

| Item | Verdict | Why not changed |
|---|---|---|
| P1 #5 s02 "Germany's army was beaten" | NUANCE | The report says to keep it ("defensible"). |
| P1 #12 s02 "ordered to pay huge reparations" | NUANCE | The report says to keep it (accurate). |
| P1 #15 s02 "the Wall Street Crash triggered the Great Depression" | NUANCE | The report accepts it as conventional shorthand. "Helped trigger" would add syllables to s02, which already runs at 1.075×. |
| P1 #24 s03 "turned Germany into a dictatorship" | NUANCE | The report says to keep it. |
| P1 #49 s05 "helped by a flotilla of little ships" | NUANCE | Keep ("helped" is accurate). This is an animation note: don't show the little ships carrying most of the army. |
| P1 Rec. 6 (Dunkirk mole, Mussolini at Munich, Oahu airfields) | Storyboard notes | Not a script change. Passed on to the storyboard and animation teams. |
| P2 #10 s08 "open a new front in the west" | NUANCE | No change required. The fighting in Italy since 1943 makes this the second front in north-west Europe; the wording is accurate. |
| P2 #21 s09 camp liberation | NUANCE | Acceptable as written. Storyboard: don't date all liberations to spring 1945 (Majdanek July 1944, Auschwitz Jan 1945). |
| Hook suggestions (hook-review.md) | — | Out of scope for this pass, as the user instructed. The new s01 line uses the "much of Europe / seems to" wording that the hook review itself recommends. |

## Timing check (measured, not estimated)

Each section was laid out with the engine's Kokoro builder logic (`tts.layout` + the same speed-fitting loop) on a scratch copy. The TTS cache was in the scratchpad, and no engine files were written.

| Section | Words v1 → v2 | Fitted speed v1 → v2 | Narration end v2 / budget |
|---|---|---|---|
| s01 | 50 → 54 (+4) | 1.102 → 1.139 | 22.75 / 22.8 |
| s02 | 130 → 130 (0) | 1.075 → 1.075 | 88.53 / 88.6 |
| s03 | 125 → 125 (0) | 1.117 → 1.154 | 148.29 / 148.6 |
| s04 | 116 → 123 (+7) | 1.000 → 1.007 | 208.57 / 208.6 |
| s05 | 109 → 111 (+2) | 1.000 → 1.000 | 261.00 / 268.6 |
| s06 | 120 → 120 (0) | 1.000 → 1.000 | 328.16 / 328.6 |
| s07 | 111 → 113 (+2) | 1.000 → 1.000 | 380.75 / 388.6 |
| s08 | 108 → 115 (+7) | 1.000 → 1.000 | 442.54 / 448.6 |
| s09 | 119 → 119 (0) | 1.000 → 1.000 | 507.45 / 508.6 |
| s10 | 113 → 118 (+5) | 1.000 → 1.000 | 567.44 / 568.6 |
| s11 | 67 → 67 (0) | 1.017 → 1.000 | 597.96 / 598.3 (mustEndBy) |
| Total | 1168 → 1195 (+27) | | |

All sections fit under the 1.17× cap, so no trims were needed. s01 (1.139×) and s03 (1.154×) are now the fastest sections. If the later hook rewrite adds words to s01, it must also cut words.
