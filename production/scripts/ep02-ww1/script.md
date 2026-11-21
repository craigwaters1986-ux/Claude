# Episode 2 — World War I: From Start to Finish

_Draft **v2** (scriptwriter, 2026-11-16) — QC fixes applied (`production/reports/qc/ep02-ww1/qc-script-20261116.md`). Lean mode: written only from `production/research/ep02-ww1/research-notes.md` (HIGH/MEDIUM rows, safe wording, approved quotations). Next: one-line re-check of s03/s06/s09/s10/s11, then user approval (checkpoint 1, batched with style). Machine-readable version: `script.json`._

Total: **1519 words** (whitespace-separated words, same count as summing `script.json` texts) for **720 s (12:00)**. Speech budget per section = start + lead → `mustEndBy` (or end − 1.4 s).

| Section | Window | Words | Est. speech at 1.0× (incl. pauses) | Speech budget | Est. fitted speed (bm_george) |
|---|---|---|---|---|---|
| s01 Two Shots, One Wrong Turn | 00:00–00:35 | 61 | 27.4 s | 26.2 s | 1.052× |
| s02 Europe Before 1914 | 00:35–01:50 | 157 | 68.1 s | 72.4 s | 1.000× |
| s03 Sarajevo and the July Crisis | 01:50–03:10 | 160 | 79.1 s | 77.8 s | 1.018× |
| s04 1914: The War of Movement Stops | 03:10–04:20 | 163 | 69.2 s | 67.8 s | 1.022× |
| s05 Life in the Trenches | 04:20–05:20 | 136 | 60.0 s | 57.8 s | 1.039× |
| s06 A World War | 05:20–06:30 | 140 | 70.9 s | 67.8 s | 1.049× |
| s07 1916: Verdun and the Somme | 06:30–07:30 | 135 | 61.6 s | 57.8 s | 1.068× |
| s08 The Home Front | 07:30–08:20 | 104 | 49.3 s | 47.8 s | 1.033× |
| s09 1917: The Turning Year | 08:20–09:20 | 120 | 61.6 s | 57.8 s | 1.069× |
| s10 1918: The Last Battles | 09:20–10:20 | 128 | 62.0 s | 57.8 s | 1.077× |
| s11 The Cost and the Legacy | 10:20–12:00 | 215 | 97.4 s | 93.2 s | 1.048× |

**Fit method:** the Kokoro model is not installed in this container (`/opt/tts` missing, `kokoro` module absent), so no measured TTS run was possible. Speeds are estimates from a syllable model calibrated on Episode 1 v3's measured bm_george runs (≈ 4.0 syllables/s at 1.0×, plus each sentence's `pauseAfter`, default 0.32 s). Every section is estimated at ≤ 1.08× (cap 1.17×); s06 is now 1.05× so the Armenian beat keeps its pauses. The audio engineer's first `tts.py` run is the real fit; if any section exceeds ~1.12×, trim one clause there.

Pronunciation helpers are in each sentence's `say` field (dates and numbers spelled out; Princip → "Prin-tsip", Gavrilo → "Gav-reelo", Ypres → "Eep-ruh", Passchendaele → "Passhen-dale", Foch → "Fosh", Compiègne → "Kom-pyen", Versailles → "Vair-sigh"). Years are spoken by the engine's `speakable()`.

## 00:00–00:35 · Two Shots, One Wrong Turn (61 words)

28 June 1914. In Sarajevo, a car carrying the heir to an empire takes a wrong turn, and stops near a 19-year-old with a pistol. Two shots. Within six weeks, Europe's great powers are at war. Four years later, around 9 to 10 million soldiers are dead, and four empires are falling. How did it happen? And how did it end?

_On screen (suggestion for storyboard):_ Date card "28 JUNE 1914 · SARAJEVO" over the open touring car; car turns the wrong way and stops (no shooting shown — two sharp offscreen reports, then silence). On "9 to 10 million soldiers": counter "≈ 9–10 million soldiers dead (est.)". Title card "WORLD WAR I: FROM START TO FINISH" after "And how did it end?" (title from 27.8 s).

_Tone:_ Calm, present tense, unhurried. Held beat (0.6 s) after "Two shots." Low and sombre on the casualty line; plain, curious delivery of the two closing questions.

## 00:35–01:50 · Europe Before 1914 (157 words)

To understand how, we have to look at Europe before the shooting started. It was a continent of great powers and rival empires, competing for land, trade and colonies around the world. Over the years, they had drifted into two camps. On one side stood France and Russia, with Britain more loosely tied to them: the Triple Entente. On the other, Germany and Austria-Hungary, partners with Italy in the Triple Alliance, although Italy would stay out of the war in 1914. The powers built ever-larger armies, and Britain and Germany were locked in a naval arms race. In the Balkans, nationalism was on the rise. Austria-Hungary, an empire of many peoples, saw Serb nationalism as a serious threat. And the war plans depended on speed. Germany's plan was to knock France out fast, through Belgium, then turn east against Russia. None of this made war inevitable. But it meant that a local crisis could spread very quickly.

_On screen (suggestion for storyboard):_ Animated Europe 1914 map: "TRIPLE ENTENTE — France · Russia · Britain" and "TRIPLE ALLIANCE — Germany · Austria-Hungary · Italy (neutral in 1914)"; dotted line for Britain's looser ties. Small labels: "ARMS RACE", "NAVAL RACE: Britain v Germany", "THE BALKANS". Arrow sequence labelled "German war plan: France first, through Belgium — then Russia". Closing card: "Pressures, not inevitability".

_Tone:_ Explanatory and even-handed; no single cause. Slight lift on "None of this made war inevitable."

## 01:50–03:10 · Sarajevo and the July Crisis (160 words)

On 28 June 1914, Archduke Franz Ferdinand, heir to Austria-Hungary's throne, and his wife Sophie were visiting Sarajevo, in Bosnia. After a wrong turn, the car stopped near Gavrilo Princip, a 19-year-old Bosnian Serb. He shot them both dead. In early July, Germany promised Austria-Hungary its full backing: the so-called "blank cheque". On 23 July, Vienna sent Serbia an ultimatum, with 48 hours to reply. Serbia accepted most of the demands, but not all. On 28 July, Austria-Hungary declared war. Russia began to mobilise. Germany declared war on Russia and France, and on 4 August invaded neutral Belgium. Britain had guaranteed Belgium's neutrality, and at 11 p.m. London time, Britain was at war. Sarajevo was the trigger, not the whole cause. Historians still argue about who was most to blame. Some put the main responsibility on Germany and Austria-Hungary. Others stress that many governments, in a tangled system, made choices that led to a world war none of them intended.

_On screen (suggestion for storyboard):_ Name tags: "Archduke Franz Ferdinand — heir to Austria-Hungary's throne", "Sophie, his wife", "Gavrilo Princip, 19". Domino calendar while narration names only a few dates: "23 Jul — ultimatum (48 h)" → "25 Jul — Serbia replies" → "28 Jul — war on Serbia" → "30–31 Jul — Russia mobilises" → "1 Aug — Germany v Russia" → "3 Aug — Germany v France" → "4 Aug — Belgium invaded · Britain at war". Clock card "11 p.m. London (midnight in Berlin)". Card "TRIGGER ≠ CAUSE". Debate split-screen "WHO WAS MOST TO BLAME? — a debate": left "Main responsibility: Germany (and Austria-Hungary) — e.g. Fritz Fischer, 1961", right "Shared responsibility (e.g. Christopher Clark, 2012)".

_Tone:_ Brisk, ticking-clock momentum through the July Crisis; no sensational SFX for the shooting (cut away). Measured and neutral on the blame debate — two views, no verdict.

## 03:10–04:20 · 1914: The War of Movement Stops (163 words)

Many on all sides believed the war would be short. In August, German armies swept through Belgium and into France. The British fought their first major battle at Mons, then retreated. Then, in early September, French and British troops stopped the German advance east of Paris, at the Battle of the Marne. Germany's hopes of a quick victory in the west were over. Both sides then raced north, trying to outflank each other, until they reached the sea. By the end of 1914, a line of trenches ran for about 700 kilometres, from the Belgian coast to Switzerland. And at Christmas, something remarkable happened. Along parts of the front, men stopped fighting. They sang carols, swapped souvenirs and buried their dead, and in some places they kicked a ball about. Rifleman William Eve wrote in his diary: "not a shot fired all day or night." But the truces were unofficial and patchy, senior officers disapproved, and it never happened on that scale again.

_On screen (suggestion for storyboard):_ Map labels "MONS · 23 AUGUST 1914", "THE MARNE · SEPTEMBER 1914", "THE RACE TO THE SEA"; line draws coast-to-Switzerland with "Western Front ≈ 700 km". Card "CHRISTMAS 1914". Diary card: "'not a shot fired all day or night.' — Rifleman William Eve, diary, 25 December 1914". Small caption: "Unofficial · patchy · not everywhere".

_Tone:_ Confident pace for 1914's movement, slowing as the trenches lock in. Warm, quiet wonder for the Christmas Truce — no comic SFX for the kickabout; gentle return to seriousness on the last line.

## 04:20–05:20 · Life in the Trenches (136 words)

For the men at the front, trench life was grim. Units rotated in and out of the front line, usually spending a few days there at a time. Lice infested their clothes and spread trench fever. Rats were everywhere. After long hours in cold water, feet could swell and rot: trench foot. Shellfire, not bullets, was the great killer. In April 1915, near Ypres, poison gas was used on a large scale for the first time. Both sides soon issued masks. Gas caused many casualties but relatively few deaths: it was feared more than it killed. The strain broke many minds. The British Army alone recorded about 80,000 cases of shell shock, and many more went unrecorded. In all, 306 British and Commonwealth soldiers were executed, mostly for desertion or cowardice. In 2006, they were pardoned.

_On screen (suggestion for storyboard):_ Cutaway diagram "FRONT LINE · SUPPORT · RESERVE". Label "TRENCH FOOT". Card "YPRES · 22 APRIL 1915 — first large-scale gas attack" (drifting green-yellow cloud, figures fumbling for masks, cut away). Card "SHELL SHOCK — ≈ 80,000 recorded cases, British Army (est.)". Card "306 British & Commonwealth soldiers executed · pardoned 2006".

_Tone:_ Close, human and sombre; non-graphic throughout (no blood, no close-up bodies). Compassion, never comedy, for shell shock; factual, unsensational for the executions.

## 05:20–06:30 · A World War (140 words)

This was a world war. In the east, in August 1914, Germany destroyed a Russian army at Tannenberg. In April 1915, Allied troops, including the Anzacs, landed at Gallipoli, in the Ottoman Empire, Germany's new ally. The campaign failed, at a heavy cost in lives. Italy joined the Allies, and fighting spread to Africa and the Middle East. About one and a half million men from South Asia served in the Indian Army, and troops came from across the empires, from Canada to the Caribbean. Inside the Ottoman Empire, a catastrophe unfolded. From 1915, the Ottoman government deported and murdered Armenians across the empire. An estimated 600,000 to 1.5 million Armenians died, in massacres and on forced marches into the Syrian desert. This was the Armenian Genocide. Turkey's government still rejects the term. Historians and genocide scholars overwhelmingly use it.

_On screen (suggestion for storyboard):_ Eastern Front map "TANNENBERG · AUGUST 1914". Gallipoli map "GALLIPOLI · 25 APRIL 1915" with name card "ANZAC = Australian and New Zealand Army Corps" (optional: "Allied dead: 44,000+ (est.)"). "ITALY JOINS THE ALLIES · MAY 1915". World map with arrows: "Indian Army ≈ 1.5 million men", Canada, Australia, New Zealand, South Africa, Africa, Caribbean. Armenian beat (own visual tone — dusk, long line of figures walking into the desert, empty doorway, a candle; no bodies): "THE ARMENIAN GENOCIDE · 1915–", "An estimated 600,000 – 1.5 million Armenians died", small caption "24 April — Armenian Genocide Remembrance Day".

_Tone:_ Wide, global sweep for the first half. Then a clear tonal break: slower, low, sombre and still for the Armenian Genocide (0.7 s pause before "a catastrophe unfolded", music thins out). Perpetrator is the Ottoman government of the time, never "the Turks".

## 06:30–07:30 · 1916: Verdun and the Somme (135 words)

In 1916, both sides tried to break the deadlock. In February, Germany attacked Verdun, a fortress city France would defend at any cost. The battle lasted about 300 days, the longest of the war, and caused around 700,000 casualties. Partly to relieve Verdun, British and French forces attacked on the Somme. A week of shelling failed to destroy the German defences. On 1 July, the British Army had the worst day in its history: more than 57,000 casualties, over 19,000 of them dead. Many were "Pals" battalions of friends and workmates, so whole towns grieved together. By November, the Allies had advanced a few miles, at a cost of more than a million casualties on all sides. Historians still debate whether it was a futile slaughter, or a battle that wore down the German army.

_On screen (suggestion for storyboard):_ "VERDUN · 21 FEB – 18 DEC 1916" with "≈ 300 days · ≈ 700,000 casualties (est.)". "THE SOMME · 1 JULY 1916"; first-day card "57,470 British casualties · 19,240 killed". Small label "'Pals' battalions — friends and workmates from the same towns". Total card "Somme, July–Nov 1916: 1 million+ casualties, all sides (est.)". Debate card "WAS IT WORTH IT? — a debate": "Futile slaughter" / "Wore down the German army".

_Tone:_ Grave and heavy; let the first-day numbers land (0.5 s pause). Neutral on the debate.

## 07:30–08:20 · The Home Front (104 words)

At home, the war reached into almost every life. Britain relied at first on volunteers, but in 1916 it brought in conscription. Women took on work in offices, on farms and on buses. By 1918, almost a million British women worked in munitions. Those filling shells were nicknamed "canaries", because the TNT turned their skin yellow. Others volunteered as nurses, in hospitals at home and abroad. German air raids killed about 1,400 people in Britain, including 18 children at a school in Poplar. As U-boats sank supply ships, Britain brought in rationing in 1918. In Germany, the British naval blockade caused severe food shortages.

_On screen (suggestion for storyboard):_ "CONSCRIPTION · 1916". "≈ 1 million British women in munitions by 1918". Label "'CANARIES'" (subtle yellow skin tint). Nurses (VAD/QAIMNS). Air-raid card "German air raids on Britain, 1915–18: ≈ 1,400 killed (est.)"; "POPLAR, LONDON · 13 JUNE 1917" (show an empty classroom, no children harmed). "RATIONING · 1918" with ration book. Map label "BRITISH NAVAL BLOCKADE". Any recruitment poster shown must carry "Propaganda poster (recreated)".

_Tone:_ Brighter, busier energy for women at work; drops to quiet for the Poplar school line; matter-of-fact for rationing and blockade.

## 08:20–09:20 · 1917: The Turning Year (120 words)

1917 was the year the war turned. In February, Germany resumed unrestricted U-boat warfare against shipping. Earlier that winter, British intelligence had decoded a secret German telegram proposing an alliance with Mexico if America joined the war. Together, the U-boats and the telegram pushed America into the fight. On 6 April 1917, the United States declared war on Germany, though its troops arrived in strength only in 1918. British and Empire troops fought the Battle of Passchendaele, in rain and mud. Each side suffered around a quarter of a million casualties. In Russia, revolution in March forced Tsar Nicholas II to abdicate. In November, Lenin's Bolsheviks seized power, and in March 1918, Russia made peace with Germany and its allies.

_On screen (suggestion for storyboard):_ "1917" year card. "UNRESTRICTED U-BOAT WARFARE · 1 FEBRUARY 1917" with small gloss "U-boats could sink merchant ships without warning". Telegram prop with tag "Zimmermann telegram — January 1917" and name tag "Arthur Zimmermann, German Foreign Secretary". "USA DECLARES WAR · 6 APRIL 1917" (name tag "President Wilson" if shown). "Tsar Nicholas II abdicates · March 1917". "PASSCHENDAELE (Third Ypres), Flanders · 31 JULY – 10 NOVEMBER 1917"; "≈ 250,000 casualties on each side (est.)". Then Russia: "Bolsheviks seize power · 7 November 1917 (25 October in Russia's old calendar)"; name tag "Lenin"; "Treaty of Brest-Litovsk · 3 March 1918".

_Tone:_ Pivotal, building momentum on the US entry; heavier and slower in the mud of Passchendaele; brisk again for Russia.

## 09:20–10:20 · 1918: The Last Battles (128 words)

With Russia out, Germany gambled on winning in the west before American strength arrived. On 21 March 1918, its Spring Offensive struck, advancing up to 40 miles. But the Allies held, under a single commander, the French general Foch, and in July they struck back. On 8 August, at Amiens, they attacked with some 450 tanks, on a day Ludendorff later called "the black day of the German Army". In the Hundred Days that followed, the Allies kept advancing. Germany's allies collapsed. Sailors mutinied, revolution spread, and the Kaiser fled to the Netherlands. At about 5 a.m. on 11 November, an armistice was signed in a railway carriage near Compiègne. At 11 o'clock, the guns fell silent. Even that morning, an estimated 2,700 to 3,000 men were killed.

_On screen (suggestion for storyboard):_ "SPRING OFFENSIVE · 21 MARCH 1918" with the bulge on the map ("up to 40 miles / 64 km"). Name tag "Marshal Foch — Allied commander". "AMIENS · 8 AUGUST 1918". Quote card: "'the black day of the German Army' — Ludendorff, in his memoirs". "THE HUNDRED DAYS" arrows pushing back towards Mons (label "American troops arrive in large numbers" on the US sector, if room). Collapse ticker: "Bulgaria 29 Sep · Ottoman Empire 30 Oct · Austria-Hungary 3 Nov". "COMPIÈGNE · 11 NOVEMBER 1918 · c. 5 a.m."; clock "11:00". Card "Last day: an estimated 2,700–3,000 killed (est.)".

_Tone:_ Rising pace through the Hundred Days; silence-led for "At 11 o'clock, the guns fell silent" (0.6 s pause, SFX dropout). Quietly devastating last line, no flourish.

## 10:20–12:00 · The Cost and the Legacy (215 words)

The cost was almost impossible to grasp. Around 9 to 10 million servicemen had died, and about 21 million had been wounded. Millions of civilians died too, from fighting, hunger, disease and genocide. And in 1918 and 1919, a flu pandemic swept the world, killing at least 50 million people. Four empires, the German, Austro-Hungarian, Russian and Ottoman, collapsed, and new states such as Poland and Czechoslovakia appeared on the map. Near Mons lie two British soldiers: John Parr, believed to be the first British soldier killed, in August 1914, and George Ellison, believed to be the last, on the final morning. Their graves face each other. Every year, at 11 o'clock on 11 November, people fall silent to remember. In the words of the poet Laurence Binyon: "They shall grow not old, as we that are left grow old, Age shall not weary them, nor the years condemn." On 28 June 1919, five years to the day after Sarajevo, Germany signed the Treaty of Versailles. It lost land and all its colonies, had to accept a "war guilt" clause and pay reparations, and its army was strictly limited. Many Germans resented it. The peace left grievances that others would exploit. Just 20 years later, Europe was at war again. And that is another story.

_On screen (suggestion for storyboard):_ Counters: "≈ 9–10 million military dead (est.)", "≈ 21 million wounded (est.)", "Civilian dead: est. 6–13 million", "1918–19 flu: at least 50 million dead worldwide (est.)". Map: four empires fade; new states labelled (Poland, Czechoslovakia, …; borders "approximate"). Graves card: "John Parr † 21 August 1914 · George Ellison † 11 November 1918 — St Symphorien, near Mons". "11 a.m. · 11 November" with poppies. Poem card (two lines): "They shall grow not old, as we that are left grow old, / Age shall not weary them, nor the years condemn." — Laurence Binyon, 'For the Fallen', The Times, 21 September 1914". Then "TREATY OF VERSAILLES · 28 JUNE 1919 — five years to the day after Sarajevo" (Hall of Mirrors). Final card "1939" then "WATCH NEXT: WW2 — From Start to Finish" over the end-card hold (714–720 s).

_Tone:_ Reflective and sombre; slow on the numbers. The Binyon lines are read simply, not performed, with a 1 s hold after; Versailles follows plainly. The bridge to WW2 ("The peace left grievances…") is light and quiet, ending on a soft, open note.

## Accuracy notes for QC

- Every casualty figure is hedged in narration ("about", "around", "an estimated", "more than", "at least") and carries "(est.)" on screen. Somme first-day figures are said as "more than 57,000 … over 19,000"; the exact official counts (57,470 / 19,240) appear only on screen.
- Debates presented as debates: war guilt (s03), the Somme (s07), and Versailles → WW2 kept light ("grievances that others would exploit", s11). U-boats and the Zimmermann telegram are given together as the push for US entry (D8).
- Myths avoided: no sandwich, no "over by Christmas" quote (s04 says "Many on all sides believed the war would be short"), no organised Christmas match, no "lions led by donkeys", no Angels of Mons; the 1918 flu is not called "Spanish".
- Quotations: only the three approved ones. The Binyon lines are copied from the Wikisource page transcription of *The Times*, 21 September 1914 (Page:Binyon._For_the_Fallen.djvu/1), which has a **comma** after the first line (research §6 shows a colon) — QC please confirm.
- The Armenian Genocide has its own ~22 s beat (s06) with the research's wording: named as genocide, perpetrator the Ottoman government, range "an estimated 600,000 to 1.5 million", one line on denial.
- No fictional characters are named in the narration; any illustrative soldier, nurse or munition worker the storyboard uses must be labelled illustrative and never given a real name. Real people carry name tags.
