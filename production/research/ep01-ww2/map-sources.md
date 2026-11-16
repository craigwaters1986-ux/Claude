# Map sources — ep01-ww2 (request R-01)

- **From:** researcher · **Date:** 2026-11-15 · **For:** environment-designer (maps M-01, M-02, M-03, M-06, M-08, M-12), storyboard, quality-control
- **Shots:** S02-04 (Versailles), S03-07 (Rhineland), S03-08/S03-10 (Czechoslovakia), S04-03 (Nazi–Soviet line), S06-05 (Japan 1941), S08-04 (D-Day)
- **Coordinate convention:** every coordinate below is **[longitude, latitude]** in decimal degrees (east and north positive), which is the same order as `geo.ts`. Rings are open. `poly()` closes them and fixes the winding. All rings are meant to be **clipped to the coastline at render time**, as `geo.ts` already does, so a vertex placed out at sea is deliberate.
- **Accuracy:** these are **hand-plotted simplifications** for animated maps on a phone screen, typically good to ±10–25 km. Unless stated otherwise they are not survey-grade. Every shaded historical area must carry, or sit under, a small "APPROXIMATE" label where this file says so.
- **Checks done:** I ran point-in-polygon tests (in a scratch script, not in the repo) on every corrected ring below against 5–20 reference towns of known allegiance, and checked areas against published figures where they exist.
- **Confidence:** HIGH = two or more reputable sources agree, or the fact is standard and uncontroversial. MEDIUM = one reputable source plus established knowledge, or the boundary detail is approximate. LOW = plausible but not verified in this pass; do not show it as fact.

---

## 0. Verdicts at a glance

| Item | Verdict |
|---|---|
| 1. Japan, early Dec 1941 (S06-05) | **USABLE WITH CAVEATS.** The territory list is verified. For Korea, Taiwan and Indochina, use the modern Natural Earth country shapes. Manchukuo and occupied China use the simplified rings in §1. Occupied China **must** be labelled approximate and should be hatched, because Japan held cities and railways rather than solid territory. Indochina should be a lighter tone ("Japanese troops stationed", not annexed). |
| 2. D-Day beaches and drop zones (S08-04) | **VERIFIED.** Order west → east is UTAH, OMAHA (US), GOLD (British), JUNO (Canadian), SWORD (British). Beach centres and drop zones are given in §2 and fit the `normandy` projection. |
| 3. Versailles losses in Europe (S02-04) | **VERIFIED list; rings provided.** Two framing corrections: Memel was detached from Germany in 1920 but **taken by Lithuania only in 1923**, and the Saar was **not lost** (it was under League of Nations administration for 15 years, then returned in 1935). The existing `LOST_TO_POLAND` is wrong in two places (Danzig and the Marienwerder area). See §5. |
| 4. Sudetenland 1938 (S03-08, S03-10) | **"A band along the Czech border" is a FAIR simplification** of the northern, western and southern border regions of Bohemia, Moravia and Czech Silesia, provided the band is **uneven**: wide in the north-west and north, narrow in the south. A rump-Czech-lands ring is in §4. Do not put an area or population figure on screen (not verified in this pass). |
| geo.ts review | **Errors found. One is major for S04-03:** `MR_LINE` gives Białystok and Łomża to the German side, and the August 1939 pact line ran along the Vistula through Warsaw, not along the Bug. There are moderate errors in `LOST_TO_POLAND`, `POLAND_1939`, `EAST_PRUSSIA`, `RHINELAND` and `ALSACE_LORRAINE`, and minor ones in `GERMANY_1937`. See §5. |

---

## 1. Area under Japanese control, early December 1941 (before Pearl Harbor), shot S06-05

### 1.1 Facts

| Territory | Status on 6 Dec 1941 | Since | Sources | Confidence |
|---|---|---|---|---|
| Japan (home islands, Ryukyu, Kuril, Bonin and Volcano islands) | Japanese sovereign territory | — | S-J1, S-J2 | HIGH |
| **Korea** | Japanese colony (annexed) | 1910 | S-J1, S-J2 | HIGH |
| **Taiwan** (Formosa, incl. the Penghu islands) | Japanese colony | 1895 | S-J1, S-J2 | HIGH |
| **South Sakhalin** (Karafuto), south of 50° N | Japanese territory | 1905 (Treaty of Portsmouth) | S-J1, S-J2 | HIGH |
| Kwantung Leased Territory (Port Arthur/Dalian) | Japanese leased territory, inside the Manchukuo shading | 1905 | S-J2 | HIGH |
| **Manchukuo** (Manchuria, incl. Rehe/Jehol from 1933) | Japanese puppet state | invaded 1931; state proclaimed 1932 | S-J1, S-J2, S-J3, existing ep01 research (P1) | HIGH |
| **Mengjiang** (Inner Mongolia: Kalgan/Zhangjiakou, Hohhot, Baotou) | Japanese puppet/protectorate | 1937–39 | S-J2 | MEDIUM |
| **Occupied China** (north China plain, the lower and middle Yangtze up to Wuhan and Yichang, and coastal enclaves) | Japanese military occupation; puppet regimes, including the Wang Jingwei "Reorganized National Government" in Nanjing (1940) | 1937 onwards | S-J2, S-J3, S-J4, S-J5 | MEDIUM on boundaries; HIGH on the main cities |
| **Hainan** | Occupied | February 1939 | S-J2, S-J5 | MEDIUM-HIGH |
| **Northern French Indochina** (Tonkin) | Japanese troops stationed under an agreement with Vichy France; the French administration stayed in place | September 1940 | S-J3, S-J6, S-J7 | HIGH |
| **Southern French Indochina** (Saigon, Cam Ranh Bay; all of Cochinchina, Cambodia and Laos) | Japanese troops stationed; the French administration stayed in place | late July 1941 (demands 15 July; agreement and landings 28–29 July) | S-J3, S-J6, S-J7 | HIGH on "July 1941"; exact day varies between sources, so **say "July 1941"** |
| **South Seas Mandate** (Mariana Islands except Guam; Caroline Islands incl. Palau; Marshall Islands) | Japanese League of Nations mandate (Japan left the League in 1933 but kept the islands) | 1919/1920 | S-J1, S-J2 | HIGH |
| Paracel and Spratly Islands | Japanese occupied/claimed | 1938–39 | S-J2 | MEDIUM. Optional; do not label them |

**Not Japanese-controlled on 6 Dec 1941. Do not shade these:** Thailand (invaded on 8 Dec), Hong Kong (British until 25 Dec 1941), Macau (Portuguese, neutral), Guam and Wake (US, taken in Dec 1941), the Philippines, Malaya, Singapore, Burma, the Dutch East Indies, Borneo, the Gilberts, Nauru and Mongolia (Soviet-aligned). Also leave unshaded Fuzhou, which Japan occupied in April 1941 but withdrew from in **September 1941** (LOW: not verified in this pass, so leaving it unshaded is the safe choice), and Nanning, which Japan occupied in Nov 1939 but withdrew from in late 1940 (MEDIUM). Do not shade Changsha either: Japan attacked it but did not hold it until 1944.

### 1.2 Geometry

**Use Natural Earth (`COUNTRIES50`) shapes where the modern border matches the 1941 one:**
- Korea = `North Korea` + `South Korea`. These match the 1941 colony (the Yalu and Tumen borders). HIGH.
- Taiwan = `Taiwan`. HIGH.
- French Indochina = `Vietnam` + `Laos` + `Cambodia`. MEDIUM-HIGH. *Nuance:* after the Franco-Thai war, the Tokyo Convention of May 1941 transferred western Cambodian provinces and the Lao lands west of the Mekong to Thailand. At this scale you can ignore that, but **do not** draw Indochina any larger than the modern three countries.
- Japan = `Japan`. The Kurils are not in that feature (they are under Russia). Add them only if the camera shows them; it is optional.
- South Seas Mandate: `Palau`, `Micronesia` (Federated States) and `Marshall Is.`, plus `N. Mariana Is.` (**not** `Guam`, which was American). Check the exact feature names in world-atlas, which may abbreviate them. At this scale these features are a few dots, so add a dashed bounding ring and a small label instead.

**Hand rings (all approximate):**

```ts
// South Sakhalin (Karafuto): clip box south of the 50th parallel, clipped to land at render.
// The lower edge (45.8 N) stays above Hokkaido's Cape Soya (45.5 N).
KARAFUTO = [[141.5,50.0],[145.0,50.0],[145.0,45.8],[141.5,45.8]];   // HIGH (border = 50° N)

// Manchukuo incl. Rehe/Jehol and the Kwantung territory. Outer edge follows the Soviet/Mongolian
// borders (Argun, Amur, Ussuri) and the Korean border; inner edge = Great Wall + Rehe/Chahar line.
MANCHUKUO = [
  [117.4,49.6],[119.5,50.3],[120.3,52.6],[121.5,53.3],[123.5,53.5],[125.5,53.0],[127.5,50.3],
  [130.6,48.9],[134.7,48.3],[133.9,46.6],[133.1,45.1],[131.9,45.3],[131.0,44.9],[131.3,43.4],
  [130.6,42.4],[129.5,42.4],[128.1,41.9],[126.6,41.7],[125.3,40.6],[124.3,39.9],   // Yalu mouth
  [121.2,38.7],[122.3,40.5],[121.0,40.9],[119.75,40.0],                            // Liaodong, Bohai, Shanhaiguan
  [118.6,40.2],[117.3,40.6],[116.6,41.3],[117.0,42.3],[118.0,43.6],[119.0,44.7],
  [119.9,46.7],[118.8,47.4],[117.6,47.8],
]; // MEDIUM on the outer edge; LOW-MEDIUM on the south-west (Rehe/Inner Mongolia) edge, so label it APPROXIMATE
   // Tests: Harbin, Changchun, Mukden, Dalian, Chengde, Qiqihar, Hailar, Manzhouli inside; Beijing, Vladivostok, Khabarovsk outside.
   // The Yalu edge is coarse (Sinuiju in Korea falls inside), so draw Korea ABOVE Manchukuo. Both are Japan colour anyway.

// Occupied north and central China, Dec 1941: ONE simplified block (the coast north of Ningbo,
// the north China plain, Shanxi rail corridor, Yangtze corridor to Yichang). Includes Mengjiang south of ~41.5 N.
OCCUPIED_CHINA_MAIN = [
  [119.75,40.0],[118.6,40.2],[117.3,40.6],[115.0,41.2],[112.0,41.2],[110.0,40.9],   // Great Wall/Mengjiang edge
  [110.2,40.3],[111.6,39.4],[112.3,38.4],[111.6,37.0],[111.3,36.0],[110.9,35.0],      // Shanxi (Datong–Taiyuan–Linfen)
  [113.0,35.1],[114.3,34.75],[115.6,34.1],[116.5,33.4],[117.0,32.4],                 // Yellow River / Xuzhou / Bengbu
  [116.6,31.4],[116.4,30.6],[115.0,30.3],[114.0,31.0],[113.6,31.8],                 // Anqing, Wuhan
  [114.4,32.0],[114.3,32.35],[113.7,32.1],[113.0,31.6],[112.1,31.1],[111.15,30.75],[111.2,30.55],[111.6,30.2],[112.3,30.1], // Xinyang, Yichang (June 1940), Shashi
  [113.1,29.3],[114.2,29.1],[115.5,28.4],[116.3,28.6],                              // Yueyang, Nanchang (1939)
  [117.4,30.0],[118.6,30.4],[119.6,30.0],[120.3,29.9],[121.4,29.6],[122.0,29.9],    // south Anhui, Hangzhou, Ningbo (1941)
  [122.2,31.4],[121.0,32.6],[120.3,34.5],[119.6,34.8],[121.0,35.8],[122.8,37.0],[122.6,37.4],
  [120.7,37.8],[118.9,38.0],[117.7,38.9],
]; // MEDIUM, label "APPROXIMATE"; hatch it, do not fill it solid (see guidance)
   // Tests: Beijing, Tianjin, Datong, Zhangjiakou, Taiyuan, Linfen, Jinan, Qingdao, Xuzhou, Kaifeng, Nanjing, Shanghai, Hangzhou,
   // Ningbo, Anqing, Wuhan, Yichang, Yueyang, Nanchang inside; Zhengzhou, Luoyang, Xi'an, Yan'an, Changsha, Chongqing, Fuzhou outside

// Southern enclaves
GUANGZHOU_DELTA = [[112.8,23.6],[113.8,23.6],[114.15,22.75],[113.6,22.3],[113.1,22.3],[112.8,22.8]];
  // Canton (Oct 1938). MEDIUM. Must EXCLUDE Hong Kong (114.17,22.3) and Macau (113.55,22.2): this ring's
  // south-east edge passes north of both. Check after projection.
HAINAN = [[108.6,19.2],[109.6,20.1],[110.7,20.1],[111.1,19.6],[110.5,18.7],[109.6,18.15],[108.6,18.5]];
  // whole island (Feb 1939); clipped to coast. MEDIUM
// Coastal points (dots, not areas): Xiamen/Amoy [118.09,24.48] (May 1938) and Shantou/Swatow [116.68,23.35] (June 1939). MEDIUM
```

**Useful city markers** (some already in `CITY`): Beijing [116.4,39.9], Tianjin [117.2,39.13], Shanghai [121.47,31.23], Nanjing [118.8,32.06], Wuhan [114.3,30.59], Guangzhou [113.26,23.13], Hanoi [105.85,21.03], Saigon [106.7,10.78], Cam Ranh Bay [109.2,11.95], Chongqing [106.55,29.56] (the Chinese wartime capital, **never occupied**, useful as a contrast marker), Seoul (Keijō) [126.98,37.57], Taipei [121.56,25.04], Mukden [123.43,41.8].

**Projection warning:** `PROJ.eastAsia` (Mercator, centre [125,38], scale 1300) shows roughly 15° N–56° N and 83° E–167° E at zoom 1. **Saigon (10.8° N) and the whole mandate (0–20° N, 130–172° E) are below the frame.** The storyboard's "pan south" must reach about 10° N for southern Indochina. The mandate islands are better shown on `PROJ.pacific`, or as an off-frame arrow.

### 1.3 Simplification guidance (S06-05, about 4.6 s)

- **Must show:** Japan, Korea, Taiwan and Manchukuo in solid Japan colour. Occupied China **hatched** or at lower opacity with a soft edge. French Indochina in a **lighter tone** (troops stationed). The arrow "towards South-East Asia" can start from southern Indochina.
- **Must be labelled approximate:** occupied China and the south-west edge of Manchukuo. The storyboard's label **APPROXIMATE AREAS, 1941** is correct and must stay.
- **Disputed or simplified (state in the research notes, not on screen):** Japan held China as "points and lines", meaning cities, railways and rivers, while Chinese Nationalist and Communist forces held large areas of countryside behind the lines, especially in north China. A solid block overstates control (S-J4, S-J5). The hatching is the honest visual for this.
- **Optional:** South Sakhalin and the mandate islands (dots plus a dashed ring). They are true, but they are not mentioned in the narration.
- **Do not shade:** Thailand, Hong Kong, the Philippines, Malaya or the Dutch East Indies. These were attacked on 7/8 Dec 1941 and later, so shading them would be anachronistic.

---

## 2. D-Day beaches and airborne landings, 6 June 1944, shot S08-04

### 2.1 Facts

| Claim | Value | Sources | Confidence |
|---|---|---|---|
| Beach code names, west → east | UTAH, OMAHA, GOLD, JUNO, SWORD | S-D1, S-D2, S-D3, S-D4 | HIGH |
| Nationality | Utah and Omaha: **US**. Gold: **British**. Juno: **Canadian**. Sword: **British** (incl. 177 French commandos of No. 4 Commando) | S-D2, S-D3, S-D4 | HIGH |
| Assault divisions | Utah: US 4th Inf. Div. Omaha: US 1st and 29th Inf. Divs. Gold: British 50th Div. Juno: 3rd Canadian Inf. Div. Sword: British 3rd Inf. Div. | S-D2, S-D3, S-D4 | HIGH |
| Western airborne flank | US 82nd and 101st Airborne Divisions, night of 5/6 June, around **Sainte-Mère-Église** and inland of Utah toward **Carentan**; the drops were badly scattered | S-D2, S-D3, S-D5 | HIGH |
| Eastern airborne flank | British 6th Airborne Division (incl. the 1st Canadian Parachute Battalion), **east of the Orne**: Ranville, the Caen Canal and Orne bridges at Bénouville/Ranville (taken by glider troops around 00:30, later named **Pegasus Bridge** and Horsa Bridge), and the Merville battery | S-D2, S-D4, S-D5 | HIGH |
| Troops landed on D-Day | "Around 156,000" (already in the P2 figures table). Other official pages say "more than 150,000" (Calvados prefecture) and "nearly 160,000" (US Army). Keep **AROUND 156,000** | S-D2, S-D5, existing P2 | HIGH (as an estimate) |

### 2.2 Coordinates (beach label anchor = approximate centre of the beach on the shoreline)

| Label | Extent (towns) | Centre [lon, lat] | Colour |
|---|---|---|---|
| UTAH | Pouppeville – La Madeleine (Sainte-Marie-du-Mont), about 5 km | **[-1.19, 49.41]** | US |
| OMAHA | Vierville-sur-Mer – Colleville-sur-Mer – Sainte-Honorine-des-Pertes, about 8 km | **[-0.86, 49.37]** | US |
| GOLD | Longues-sur-Mer/Arromanches – Le Hamel – La Rivière (Ver-sur-Mer) | **[-0.57, 49.34]** | British |
| JUNO | Graye-sur-Mer – Courseulles – Bernières – Saint-Aubin-sur-Mer, about 8 km | **[-0.42, 49.335]** | Canadian |
| SWORD | Lion-sur-Mer – Hermanville – Colleville-Montgomery – Ouistreham, about 8 km | **[-0.29, 49.30]** | British |

Beach extents are verified by S-D3, S-D4 and S-D6. Centres are my plotting of those towns: HIGH for order and position, ±1–2 km for the exact centre. **Do not use the `CITY.Normandy` point [-0.6, 49.3] as a beach:** it is a generic region marker inland of Gold.

**Airborne icons:**

| Icon | Location | [lon, lat] | Confidence |
|---|---|---|---|
| US 82nd Airborne (parachute) | Sainte-Mère-Église and the Merderet | **[-1.32, 49.41]** (town [-1.316, 49.408]) | HIGH |
| US 101st Airborne (parachute) | Sainte-Marie-du-Mont/Hiesville, inland of Utah, toward Carentan | **[-1.25, 49.36]** (Carentan [-1.245, 49.303]) | HIGH (area) / MEDIUM (centre) |
| British 6th Airborne (parachute) | Ranville, east of the Orne | **[-0.25, 49.23]** | HIGH |
| Pegasus Bridge (glider icon or small label) | Bénouville, Caen Canal | **[-0.274, 49.242]** | HIGH |
| Merville battery (optional) | Merville-Franceville | **[-0.197, 49.27]** | HIGH |
| Pointe du Hoc (optional; US Rangers, sea-borne) | Between Utah and Omaha | **[-0.989, 49.396]** | HIGH |

**Projection check:** `PROJ.normandy` (Mercator, centre [-0.7, 49.3], scale 30000) shows about lon -2.5 to +1.1 and lat 48.6 to 50.0 at zoom 1, so every point above is in frame. At this scale Ouistreham and Ranville are only about 30 px apart, so put the 6th Airborne icon inland (south-east) of the SWORD label and offset the labels vertically.

### 2.3 Simplification guidance
- The 50-mile (80 km) front is correct to show as five separate stretches. Do **not** join them into a single line.
- Drop zones should be shown as **areas or clusters** rather than precise points, because the drops were scattered (S-D3, S-D5). Two or three parachute icons per flank are fair.
- Sea arrows should approach from the north/north-west (the Channel). Making them all start from one point is a simplification and is acceptable.
- If space allows, an optional tiny French flag on Sword is accurate. It is not required.

---

## 3. Treaty of Versailles: Germany's European territorial losses, shot S02-04

### 3.1 Facts

| Territory | To | How / when | Sources | Confidence |
|---|---|---|---|---|
| Alsace-Lorraine | France | Returned by the treaty (German since 1871) | S-V1, S-V2, S-V3 | HIGH |
| Eupen-Malmedy (and neutral Moresnet) | Belgium | Treaty, followed by a non-secret "consultation" in 1920 (contested at the time) | S-V1, S-V2 | HIGH |
| North Schleswig | Denmark | Plebiscite: Zone 1 voted for Denmark (Feb 1920); Zone 2 voted to stay German (Mar 1920) | S-V1, S-V2 | HIGH |
| Posen and most of West Prussia, incl. the **Polish Corridor**, plus a strip of Lower Silesia and Soldau (Działdowo) | Poland | Treaty, 1920 | S-V1, S-V2, S-V3 | HIGH |
| **Marienwerder and Allenstein areas** | **stayed German** | Plebiscites of 11 July 1920 (about 92% and over 97% for East Prussia) | S-V4, S-V5 | HIGH |
| Danzig | **Free City** under League of Nations protection | 1920 | S-V1, S-V2 | HIGH |
| Memel Territory | **Detached** from Germany under Allied (French-administered) control, 1920. **Seized by Lithuania in January 1923**, recognised in 1924. Retaken by Germany in March 1939 | S-V1 (USHMM: "ultimately placed under Lithuanian control") | HIGH on "detached"; HIGH that Lithuania gained it later |
| Hultschin (Hlučín) district | Czechoslovakia | Treaty, 1920 | S-V1, S-V2 | HIGH |
| East Upper Silesia (Katowice industrial area) | Poland | Plebiscite on 20 March 1921 (about 60% German / 40% Polish overall); partition by the League and the Allies in Oct 1921; handover 1922. Poland got the smaller area but most of the industry | S-V6, S-V7 | HIGH |
| Saar | **League of Nations administration for 15 years**; mines to France | Returned to Germany in 1935 after a plebiscite | S-V1, S-V2 | HIGH: **not a permanent loss** |
| Rhineland | Not lost: **demilitarised** (Art. 42: the left bank plus 50 km east of the Rhine) and occupied by the Allies until 1930 | — | S-V1, S-V8 | HIGH |
| Total | About **13% of European territory** (more than 27,000 sq mi / about 70,000 km²) and about 10% of the population (6.5–7 million) | S-V1 (USHMM); also the P1 fact-check #12 | HIGH (as an estimate) |

### 3.2 Rings (approximate; check each one after projection)

```ts
ALSACE_LORRAINE_FIX = [   // replaces geo.ts ALSACE_LORRAINE (see §5). Approx. 14,500 km²; this ring ≈16,000 km² (ok)
  [5.95,49.48],[6.37,49.47],[7.0,49.12],[7.95,49.03],[8.23,48.97],     // Luxembourg tripoint → Saar → Lauterbourg
  [7.59,47.59],[7.1,47.5],[6.85,47.82],                               // Rhine to Basel, Swiss border, Ballon d'Alsace (Belfort stays French)
  [7.05,48.15],[7.12,48.5],[6.8,48.62],[6.45,48.8],[6.2,48.9],[6.0,48.98],[5.95,49.1], // Vosges crest, Donon, Avricourt, Pagny, west of Metz
]; // MEDIUM-HIGH. Tests: Metz, Strasbourg, Colmar, Mulhouse, Thionville, Sarrebourg, Château-Salins inside; Nancy, Lunéville, Saint-Dié, Belfort, Pont-à-Mousson outside

NORTH_SCHLESWIG = [[8.6,55.45],[9.15,55.47],[9.65,55.45],[9.75,55.2],[10.05,55.05],[9.75,54.85],[9.42,54.83],[8.66,54.91],[8.5,55.05]];
  // Kongeå (old 1864 border) to the 1920 line (Flensburg Fjord → Rudbøl). Incl. Als island and Rømø; Flensburg stays German.
  // Approx. 3,900 km² of land; the ring includes sea and is clipped. MEDIUM-HIGH

EUPEN_MALMEDY = [[5.97,50.75],[6.12,50.72],[6.27,50.55],[6.4,50.33],[6.15,50.13],[5.97,50.2],[6.02,50.45],[5.9,50.65]];
  // Eupen [6.03,50.63], Malmedy [6.03,50.43], Sankt Vith [6.13,50.28]. Approx. 1,000 km². MEDIUM

MEMEL_TERRITORY = [[21.06,55.87],[21.2,55.85],[21.3,55.7],[21.45,55.55],[21.65,55.38],[22.0,55.2],[22.6,55.07],
                   [22.0,55.07],[21.5,55.22],[21.3,55.25],[20.95,55.27],[21.1,55.72]];
  // North of the Neman/Memel river, incl. the northern Curonian Spit (Nida). Memel/Klaipėda [21.13,55.71].
  // Approx. 2,850 km². Kretinga and Gargždai stay OUTSIDE (Lithuanian). MEDIUM

DANZIG_FREE_CITY = [[18.56,54.47],[18.4,54.4],[18.42,54.25],[18.6,54.15],[18.8,54.13],[19.0,54.03],[19.15,54.15],[19.3,54.27],[19.3,54.4]];
  // Approx. 1,950 km² (this ring ≈1,800). Danzig, Zoppot, Tiegenhof inside; Gdynia, Tczew (Polish), Marienburg, Elbing (German) outside. MEDIUM

LOST_TO_POLAND_FIX = [   // Posen + West Prussia (Corridor) + Soldau; EXCLUDES Danzig and the Marienwerder area
  [15.9,52.3],[16.0,52.9],[16.6,53.05],[17.1,53.05],[17.4,53.3],[17.4,53.9],[17.6,54.2],[17.9,54.5],[18.0,54.83],
  [18.85,54.75],[18.56,54.47],[18.4,54.4],[18.42,54.25],[18.6,54.15],[18.8,54.13],          // Hel/Gdynia, around Danzig
  [18.85,53.9],[18.87,53.6],[19.2,53.55],[19.45,53.55],[19.65,53.55],[19.95,53.45],[20.35,53.33],[20.4,53.15], // Vistula, Lubawa, Soldau
  [19.3,53.05],[18.75,52.9],[18.35,52.6],[17.8,52.3],[17.95,51.75],[17.75,51.4],[17.0,51.55],[16.3,51.7],  // pre-1914 Russian border; Silesian strip
]; // MEDIUM. Tests: Poznań, Bydgoszcz, Toruń, Grudziądz, Gdynia, Chojnice, Wejherowo, Leszno, Działdowo inside;
   // Danzig, Marienburg, Marienwerder, Lębork, Piła, Konin and Kalisz (Russian before 1914) outside

EAST_UPPER_SILESIA = [[18.4,50.05],[18.75,50.22],[19.0,50.36],[18.8,50.48],[18.55,50.75],[18.75,50.85],[19.15,50.55],[19.17,50.24],[19.1,50.0],[18.9,49.92],[18.55,49.9]];
  // Katowice [19.02,50.26], Rybnik, Pszczyna, Tarnowskie Góry inside; Gleiwitz [18.67,50.29], Beuthen [18.92,50.35], Zabrze, Racibórz outside.
  // Approx. 3,200 km² (this ring ≈2,900). MEDIUM. The real line was very irregular, so label it APPROXIMATE

HULTSCHIN = [[17.98,49.98],[18.12,50.05],[18.3,49.97],[18.3,49.88],[18.12,49.86],[17.98,49.9]]; // approx. 316 km²; Hlučín [18.19,49.9]. MEDIUM

SAAR = [[6.37,49.46],[6.6,49.55],[6.95,49.6],[7.25,49.55],[7.4,49.4],[7.35,49.2],[7.05,49.11],[6.7,49.2],[6.55,49.4]];
  // Saarbrücken [7.0,49.23]. Approx. 1,900 km² (this ring ≈2,600: generous). MEDIUM
```

**Germany 1914 (needed for M-01):** start from `GERMANY_1937` (after the fixes in §5) **plus** East Prussia and every ring above except the Saar, which was already German. A ready-made eastern chain for the 1914 border with Russia and Austria, north → south, is below. It is MEDIUM confidence; the pre-1914 frontier is well documented, but this is a coarse trace.

```ts
GERMANY_1914_EAST = [
  [21.06,55.87],[21.3,55.7],[21.65,55.38],[22.0,55.2],[22.6,55.07],[22.85,55.05],  // Memel Territory north edge to the Neman
  [22.85,54.38],[22.75,54.05],[22.5,53.7],[22.1,53.5],[21.6,53.45],[21.0,53.3],[20.5,53.25],[20.35,53.15], // East Prussia–Russia
  [19.3,53.05],[18.75,52.9],[18.35,52.6],[17.8,52.3],[17.95,51.75],[18.05,51.3],[18.45,51.05],[18.9,50.8], // Posen/Silesia–Russia
  [19.17,50.24],                                     // Three Emperors' Corner (Mysłowice)
  [19.1,50.0],[18.9,49.92],[18.55,49.9],[18.3,49.95],[18.0,50.0], // Austria (Galicia, Austrian Silesia); Hultschin German
  // ...then continue west along GERMANY_1937's southern border from [17.7,50.2]
];
// West side: replace GERMANY_1937's [5.95,50.75]…[6.1,50.1] with the western edge of EUPEN_MALMEDY,
// and its [6.45,49.5]…[7.6,47.6] with the outer edge of ALSACE_LORRAINE_FIX. North: the Kongeå line [8.6,55.45]→[9.65,55.45].
```

### 3.3 Which to show in the 10-second map (S02-04, 6.6 s on screen)
- **Show (animate one by one):** Alsace-Lorraine → France; the Polish lands (Posen/West Prussia, with the **Corridor** visibly cutting East Prussia off) → Poland; Danzig → a **separate** "FREE CITY" colour; North Schleswig → Denmark; Eupen-Malmedy → Belgium. These five carry most of the 13%.
- **Show small (as dots or labels):** Memel and Hultschin. Both are tiny at Europe scale (Hultschin is about 316 km²).
- **Optional:** East Upper Silesia (1921–22). It is accurate as a Versailles-era loss, but it came through a 1921 plebiscite, so animate it last or omit it.
- **Do not show the Saar as "lost".** If shown at all, give it a hatched League colour. The same applies to the Rhineland (demilitarised, not lost); keep that for S03-07.
- Memel should **fade to neutral**, not slide straight to Lithuania. If a destination is needed, add the label "TO LITHUANIA, 1923".
- The FactPill **AROUND 13% OF ITS EUROPEAN TERRITORY LOST** is VERIFIED (USHMM).

---

## 4. Sudetenland 1938 (S03-08, S03-10)

### 4.1 Facts

| Claim | Value | Sources | Confidence |
|---|---|---|---|
| What it was | Border regions of **northern, western and southern Bohemia, northern Moravia and Czech Silesia, and southern Moravia**, with a German-speaking majority | S-S1 (Britannica: "northern and western Bohemia and northern Moravia"), S-S2 (USHMM), S-S3 | HIGH |
| Agreement | Munich Agreement, signed 29–30 Sept 1938 by Germany, Britain, France and Italy; Czechoslovakia not invited | S-S2, S-S4 (GHDI text), existing P1 #30 | HIGH |
| Occupation | In stages, **1–10 October 1938**. The final border was set by an international commission on 20 Nov 1938 and went beyond the ethnic line in places | S-S2 (USHMM map: "between October 1 and 10, 1938"), S-S3 | HIGH (dates) / MEDIUM (20 Nov detail) |
| Population | "More than 3 million" people, mostly German speakers, plus a substantial Czech minority | S-S1, S-S3 | MEDIUM. Say "about 3 million Germans" or nothing |
| Area | Commonly cited at about 28,000–29,000 km² (roughly one-fifth of the Czech lands) | none confirmed in this pass | **UNVERIFIED. Do not put it on screen** |
| Strategic note | It held Czechoslovakia's frontier fortifications and much of its industry | S-S2 (USHMM), S-S3 | HIGH |
| Also lost in autumn 1938 | Teschen/Zaolzie → **Poland** (2 Oct 1938); southern Slovakia and southern Ruthenia → **Hungary** (First Vienna Award, 2 Nov 1938) | S-S3 | HIGH |
| March 1939 | 15 March: Germany occupies the Czech lands ("Protectorate of Bohemia and Moravia"). 14 March: Slovakia declares independence as a **German client state**. Hungary takes Carpatho-Ukraine (Ruthenia) | S-S2, P1 | HIGH |

### 4.2 Shape and depth
- It is **not one strip**. There are four main blocks, all touching the old border: (1) **west and north-west Bohemia** (Egerland: Cheb [12.37,50.08], Karlovy Vary [12.87,50.23], Aš, Žatec [13.55,50.33], Most); (2) **north Bohemia** (Ústí nad Labem [14.04,50.66], Teplice, Děčín, Liberec [15.06,50.77], Jablonec, Trutnov); (3) **north Moravia and Silesia** (Opava [17.9,49.94], Krnov, Šumperk [16.97,49.97], Svitavy, Nový Jičín, Hlučín); (4) **south Bohemia and south Moravia** (Český Krumlov [14.32,48.81], Vimperk, Znojmo [16.05,48.86], Mikulov, Břeclav). Blocks 1 and 2 are continuous along the north-west. Blocks 2 and 3 are linked through the Orlické hory and Králíky.
- **Depth:** usually about **15–50 km** from the old border, up to about **80–100 km** in the north-west (Aš → Žatec), and only a few kilometres in parts of the south-west near Domažlice. The new border ran close to **Plzeň, Olomouc, Brno (about 30 km from Mikulov), České Budějovice and Ostrava**, all of which **stayed Czech**. So did the German-speaking island around Jihlava, which was not ceded.
- **Verdict on "a band along the Czech border":** **fair**, as long as the band is **uneven** (wide in the north-west, wide again in north Moravia, thin in the south) and does not run along the Slovak side. Draw it as Czech lands minus the rump below.

### 4.3 Geometry
- **Czech lands 1938 (outer boundary):** use the Natural Earth feature `Czechia` (it may be named "Czech Rep." in older world-atlas builds). Its border matches the 1920–38 border of Bohemia, Moravia and Silesia closely. HIGH.
- **Slovakia:** `Slovakia`, a close match. **Ruthenia/Carpatho-Ukraine** (part of Czechoslovakia until March 1939; now Ukraine's Zakarpattia) needs a hand ring:
  `RUTHENIA = [[22.15,48.4],[22.55,49.08],[22.9,49.05],[23.6,48.95],[24.6,48.0],[23.5,47.95],[22.9,47.95],[22.45,48.1]]` (MEDIUM). Without it, the 1938 Czechoslovakia is visibly too short in the east.
- **Rump Czech lands after Munich (= the future Protectorate):**

```ts
CZECH_RUMP_NOV1938 = [
  [12.85,49.42],[12.95,49.55],[13.05,49.75],[13.25,50.0],[13.6,50.2],[13.72,50.33],[13.9,50.42],[14.2,50.45],[14.6,50.45],[15.0,50.55],
  [15.3,50.62],[15.75,50.45],[16.25,50.45],[16.35,50.15],[16.4,49.95],[16.5,49.65],[16.9,49.65],[17.15,49.7],
  [17.4,49.65],[17.75,49.55],[18.0,49.5],[18.1,49.7],[18.2,49.8],[18.3,49.88],[18.42,49.82],[18.5,49.6],[18.6,49.45], // Hlučín out, Ostrava in, Karviná (Poland) out
  [18.4,49.3],[17.6,49.0],                                   // ≈ Czechia–Slovakia border (or use the Natural Earth edge)
  [17.15,48.85],[16.85,48.85],[16.5,48.95],[16.2,49.0],[15.85,49.0],[15.4,49.05],[15.0,49.0],[14.75,48.85],
  [14.45,48.92],[14.1,49.0],[13.85,49.15],[13.5,49.3],[13.2,49.35],
]; // LOW-MEDIUM (±10–20 km). Tests: Prague, Plzeň, Brno, Olomouc, Ostrava, České Budějovice, Jihlava, Domažlice, Náchod, Louny inside;
   // Cheb, Karlovy Vary, Žatec, Most, Ústí, Liberec, Svitavy, Opava, Nový Jičín, Hlučín, Znojmo outside.
// Sudetenland = Czechia minus CZECH_RUMP_NOV1938 (minus Teschen/Zaolzie in the far east, which went to Poland).
```

- **Guidance for S03-08 (wall map, small) and S03-10:** Sudetenland in German grey, labelled **"SUDETENLAND (approx.)"** or carrying the small "APPROXIMATE" tag. In March 1939, Bohemia-Moravia fills German grey. **Slovakia:** the storyboard's "left neutral" is fine as a *colour*, but do **not** label it "neutral" or "free". If it is labelled at all, use "SLOVAKIA (German client state)". The Polish and Hungarian bites (1938) may be omitted at this scale; this is an acknowledged simplification.

---

## 5. Review of `the-human-story/episode-01-ww2/src/maps/geo.ts` (not edited)

I tested each polygon against towns whose 1919–39 allegiance is certain. **[MAJOR]** = it misleads the viewer in a shot. **[MODERATE]** = visibly wrong at zoom ≥ 1.5. **[MINOR]** = within simplification tolerance; fix only if convenient.

### MR_LINE (used in S04-03 and in POLAND_GERMAN/SOVIET_ZONE)
- **[MAJOR] Wrong line for S04-03.** The **23 August 1939** secret protocol put the sphere boundary on the **Narew, Vistula and San** (S-P1, Avalon/Yale text; S-P2). That line runs **through Warsaw**. The geo.ts line follows roughly the **Bug**, which belongs to the **28 September 1939** Boundary and Friendship Treaty (Pisa–Narew–Bug–San; S-P3 GHDI; USHMM S-P4: "the demarcation line was along the Bug River"). S04-03 depicts the August secret protocol, so it must either draw the **August line** (below) or relabel the line "FINAL PARTITION LINE, 28 SEPT 1939". Recommendation: use the August line in S04-03 and the September line for any later partition shot.
- **[MAJOR] Even as the September line, the north part is wrong.** Białystok [23.16,53.13], Łomża [22.07,53.18], Bielsk Podlaski and Grajewo fall on the **German** side. All of them were annexed by the **USSR**. The line runs straight from the East Prussian tripoint to Brest. It should instead follow the Pisa and Narew rivers west of Łomża, cut across to the Bug at Nur, and then follow the Bug upstream to Brest. Suwałki went to Germany and Augustów to the USSR (S-P5; MEDIUM). It also skips the San bend at Sanok (minor).

```ts
MR_LINE_AUG1939 = [   // Narew – Vistula – San (secret protocol, 23 Aug 1939). MEDIUM on river traces
  [21.85,53.45],[21.88,53.23],[21.57,53.08],[21.3,52.92],[21.08,52.7],[21.05,52.52],[20.7,52.43],   // Pisa/Narew to Modlin
  [21.0,52.25],[21.25,51.95],[21.6,51.65],[21.85,51.45],[21.95,51.0],[21.84,50.68],                // Vistula via Warsaw to San mouth
  [22.12,50.52],[22.42,50.26],[22.68,50.01],[22.77,49.78],[22.4,49.6],[22.2,49.56],[22.33,49.47],[22.6,49.2],[22.65,49.0], // San
];
// Note: the protocol named only the rivers. The Narew does not reach the East Prussian border; joining it to the
// border via the Pisa is the usual cartographic convention (S-P5).

MR_LINE_SEPT1939 = [  // Pisa – Narew – Bug – San (Boundary and Friendship Treaty, 28 Sept 1939). MEDIUM
  [21.85,53.45],[21.88,53.23],[21.65,53.1],[22.1,52.95],[22.32,52.67],[22.6,52.4],[23.2,52.25],[23.65,52.1],
  [23.6,51.55],[23.85,51.2],[24.05,50.85],[24.2,50.5],[23.6,50.3],[23.0,50.1],[22.77,49.78],
  [22.4,49.6],[22.2,49.56],[22.33,49.47],[22.6,49.2],[22.65,49.0],
];
SUWALKI_TO_GERMANY_1939 = [[22.85,54.38],[23.45,54.2],[23.05,53.93],[22.6,53.85],[22.75,54.05]]; // LOW-MEDIUM
// Tests (Sept line): Warsaw, Lublin, Chełm, Siedlce, Ostrołęka, Ostrów Maz., Kraków, Jarosław on the German side;
// Białystok, Łomża, Zambrów, Grodno, Brest, Lwów on the Soviet side.
```
- For S04-03, **leaving Lithuania neutral** (storyboard) is the safe choice. The August protocol actually assigned Lithuania to the **German** sphere; the 28 September treaty moved it to the Soviet one (S-P1, S-P3). Do not shade Lithuania Soviet in an August scene.

### POLAND_1939
- **[MODERATE] It includes the Free City of Danzig** [18.65,54.35], which was not Polish. It also gives the **Marienburg/Stuhm area** (East Prussia after the 1920 plebiscite) to Poland.
- **[MODERATE] It includes Gleiwitz** [18.67,50.29] and Beuthen, which were **German**. This matters because Gleiwitz is the site of the staged "Gleiwitz incident" of 31 Aug 1939, in case it is ever marked. The Upper Silesian border needs the irregular line given for `EAST_UPPER_SILESIA` in §3.2.
- **[MINOR]** The Corridor's west edge is about 0.3–0.4° too far west north of Chojnice: Lębork and Bytów (German) fall inside Poland. The coastal border was at about 18.0° E (Piaśnica), not 17.6°.
- **[MINOR]** Cieszyn (Polish from Oct 1938) falls just outside. The Volhynia east edge is up to about 60 km too far west (Korets, a Polish border town, falls outside).
- Corrected western chain (it starts and ends at the same points as before, so `POLAND_EAST_CHAIN` and `POLAND_SOUTH_CHAIN` can stay):
```ts
POLAND_WEST_CHAIN_FIX = [
  [18.85,49.5],[18.55,49.9],[18.4,50.05],[18.75,50.22],[19.0,50.36],[18.8,50.48],[18.55,50.75],[18.4,50.9],
  [17.75,51.4],[17.0,51.55],[16.3,51.7],[15.9,52.3],[16.0,52.9],[16.6,53.05],[17.1,53.05],[17.4,53.3],[17.4,53.9],
  [17.6,54.2],[17.9,54.5],[18.0,54.83],[18.85,54.75],[18.56,54.47],[18.4,54.4],[18.42,54.25],[18.6,54.15],[18.8,54.13],
  [18.85,53.9],[18.87,53.6],[19.2,53.55],[19.45,53.55],[19.65,53.55],[19.95,53.45],[20.35,53.33],[20.5,53.25],
  [21.0,53.3],[21.6,53.45],[22.1,53.5],[22.5,53.7],[22.75,54.05],[22.85,54.38],
];
```

### EAST_PRUSSIA
- **[MODERATE] It is missing the Marienwerder plebiscite area** (Marienburg east of the Nogat, Marienwerder, Stuhm, Rosenberg), which voted about 92% to stay German in July 1920 (S-V4, S-V5). The west edge should follow the Nogat and the east bank of the Vistula, not 19.2–19.5° E.
- **[MINOR]** Lyck/Ełk (German) falls just outside, and the Neman delta (Rusnė, Memel Territory) falls inside.
```ts
EAST_PRUSSIA_FIX = [[19.3,54.4],[19.3,54.27],[19.15,54.15],[19.0,54.03],[18.85,53.9],[18.87,53.6],[19.2,53.55],[19.45,53.55],
  [19.65,53.55],[19.95,53.45],[20.35,53.33],[20.5,53.25],[21.0,53.3],[21.6,53.45],[22.1,53.5],[22.5,53.7],[22.75,54.05],
  [22.85,54.38],[22.85,54.8],[22.6,55.05],[22.0,55.07],[21.5,55.22],[21.25,55.27],[20.95,55.27],[20.0,55.2]];
// Tests: Königsberg, Elbing, Marienburg, Marienwerder, Iława, Nidzica, Ełk, Gołdap, Tilsit inside; Grudziądz, Lubawa, Działdowo, Suwałki, Rusnė outside
```

### LOST_TO_POLAND
- **[MAJOR for S02-04] It includes Danzig.** Danzig must be its own "Free City" piece (the storyboard animates it separately). It also includes **Marienburg and Marienwerder**, which stayed German after the 1920 plebiscite, and Lębork (German).
- **[MINOR]** Its east edge extends into land that was Russian before 1914 (Konin), and it omits Soldau/Działdowo. Replace it with `LOST_TO_POLAND_FIX` (§3.2) plus `DANZIG_FREE_CITY`.

### RHINELAND (S03-07)
- **[MODERATE] The zone is too small.** Article 42 covered the left bank **and a strip 50 km east of the Rhine** (S-V8). The ring omits the **whole Baden strip** from Karlsruhe to Basel (Freiburg is outside) and cuts the east edge short: **Frankfurt and Heidelberg fall outside**, but both lay inside the zone. The Saar is included, which is correct after 1935.
```ts
RHINELAND_FIX = [[6.0,51.85],[6.9,52.05],[7.3,51.75],[7.5,51.45],[7.65,50.95],[8.05,50.6],[8.35,50.35],[8.95,50.1],
  [9.1,49.5],[9.0,49.0],[8.6,48.5],[8.25,48.0],[8.3,47.62],[7.6,47.6],[8.2,48.97],[7.0,49.1],[6.4,49.5],[6.1,50.1],[5.95,50.8]];
// The 50 km line is drawn at about 0.7° east of the river. Tests: Cologne, Frankfurt, Heidelberg, Karlsruhe, Freiburg, Saarbrücken inside; Kassel, Stuttgart outside. MEDIUM
// Note: the ring re-uses GERMANY_1937's Rhine vertex [7.6,47.6] → [8.2,48.97], so the zone between those vertices is the river itself.
```

### ALSACE_LORRAINE
- **[MODERATE]** The south-west corner bulges into France: **Nancy, Lunéville and Saint-Dié fall inside**. The 1871–1918 border followed the Vosges crest (about 7.0–7.2° E) north to the Donon, then ran west-north-west via Avricourt to Pagny-sur-Moselle, west of Metz. Replace it with `ALSACE_LORRAINE_FIX` (§3.2).

### GERMANY_1937
- **[MODERATE]** **Gleiwitz, Beuthen and Hindenburg/Zabrze (all German) fall outside**; the Upper Silesian edge at [18.6,50.3] is too far west. The Corridor edge puts **Lębork and Bytów** (German) on the Polish side. It shares the chain with `POLAND_1939`, so fix both together.
- **[MINOR]** Tønder (Danish since 1920) falls inside; the west-coast border should reach the sea at about 54.91° N (Rudbøl), not about 55.0°. Schneidemühl/Piła (German) sits just outside, and Passau (German) sits on the edge.
- **[OK]** The western, southern and Czech borders are fine for a Europe-scale map. The polygon correctly excludes Eupen-Malmedy, Alsace-Lorraine and Memel, and includes the Saar.
- Replacement segments: Upper Silesia `[17.7,50.2] → [18.4,50.05],[18.75,50.22],[19.0,50.36],[18.8,50.48],[18.55,50.75],[18.4,50.9]`; Corridor `[17.4,53.9] → [17.6,54.2],[17.9,54.5],[18.0,54.83]`, then out to sea; Danish border `[9.5,54.85] → [9.6,54.83],[8.66,54.91],[8.3,55.06]` (keeps Sylt German).

### Projection note (PROJ.europe)
- S06/M-05 is already flagged in the storyboard. No other issues.

---

## 6. New city coordinates (M-12)

All are HIGH confidence: standard gazetteer positions, rounded to 0.01°.

| Key | [lon, lat] | Note |
|---|---|---|
| Abbeville | [1.83, 50.11] | Somme mouth; German panzers reached the Channel nearby on 20 May 1940 |
| Lublin | [22.57, 51.25] | |
| Majdanek (camp) | [22.60, 51.22] | South-east edge of Lublin; use one marker for both at Europe scale |
| Oświęcim (Auschwitz) | [19.21, 50.03] | Auschwitz I [19.20, 50.03]; Birkenau [19.18, 50.04] |
| Buchenwald (camp) | [11.25, 51.02] | Near Weimar [11.33, 50.98] |
| Bergen-Belsen (camp) | [9.91, 52.76] | |
| Dachau (camp) | [11.47, 48.27] | North-west of Munich |
| Washington | [-77.04, 38.90] | |
| New York | [-74.00, 40.71] | |
| San Francisco | [-122.42, 37.77] | UN Charter signed here (1945) |
| Vladivostok | [131.89, 43.12] | |
| UTAH / OMAHA / GOLD / JUNO / SWORD | see §2.2 | Beach label anchors |
| Sainte-Mère-Église | [-1.32, 49.41] | |
| Carentan | [-1.25, 49.30] | |
| Pegasus Bridge (Bénouville) | [-0.27, 49.24] | |
| Gleiwitz (Gliwice), optional | [18.67, 50.29] | German in 1939 |

Camp markers must follow the sombre rules (FX-01; no cartoon pins).

---

## 7. Sources (accessed 2026-11-15)

**Japan / East Asia**
- S-J1. Omniatlas, "East Asia 1941: Eve of Pearl Harbor" (6 Dec 1941 map and legend). https://omniatlas.com/maps/eastasia/19411206/ — *a hobbyist atlas, used only as a cross-check of the territory list, never on its own.*
- S-J2. Office of the Historian, US Department of State, "Japan, China, the United States and the Road to Pearl Harbor, 1937–41". https://history.state.gov/milestones/1937-1945/pearl-harbor
- S-J3. Encyclopaedia Britannica, "Second Sino-Japanese War" and "Manchukuo" (britannica.com; the pages returned 403 to the fetch tool, so the content here is from standard reference knowledge; re-check if quoting).
- S-J4. Australian Department of Veterans' Affairs, Anzac Portal, "Japanese Thrust" map (maximum extent in 1942, which shows north China and the coastal enclaves). https://anzacportal.dva.gov.au/node/1019
- S-J5. Rana Mitter, *China's War with Japan, 1937–1945: The Struggle for Survival* (Allen Lane, 2013); Hans van de Ven, *China at War* (Profile, 2017). Established academic works covering the "points and lines" occupation, the fall of Wuhan and Guangzhou (1938), Nanchang and Hainan (1939) and Yichang (1940). No page numbers are cited; verify a page before quoting any passage.
- S-J6. EBSCO Research Starters, "Japan Occupies Indochinese Ports". https://www.ebsco.com/research-starters/diplomacy-and-international-relations/japan-occupies-indochinese-ports
- S-J7. Cambridge University Press, *Journal of Southeast Asian Studies*, "The Japanese Period in Indochina and the Coup of 9 March 1945". https://www.cambridge.org/core/journals/journal-of-southeast-asian-studies/article/japanese-period-in-indochina-and-the-coup-of-9-march-1945/275B1ABEED60A9B95F85297F68603286

**D-Day**
- S-D1. Encyclopaedia Britannica, "Landings at Utah Beach" / "Gold, Juno, Sword" study pages. https://www.britannica.com/study/landings-at-utah-beach-during-the-normandy-invasion
- S-D2. Préfecture du Calvados (French state), "Key events of the Normandy Landings". https://www.calvados.gouv.fr/Actions-de-l-Etat/80e-anniversaire-du-Debarquement-et-de-la-liberation-de-la-Normandie/Ressources-historiques-et-sites-memoriels/Autour-du-Debarquement-et-de-la-Bataille-de-Normandie/Key-events-of-the-Normandy-Landings
- S-D3. US Army, "D-Day: Airborne and Beach Assault" (archived army.mil). https://webarchive.library.unt.edu/web/20121017053508/http:/www.army.mil/d-day/beaches.html ; also https://www.army.mil/d-day/
- S-D4. Juno Beach Centre, "D-Day". https://www.junobeach.org/canada-in-wwii/articles/d-day/ — *the fetched summary listed Sword and Gold as left/right as seen from the sea; in compass terms, Sword is EAST of Juno and Gold is WEST.*
- S-D5. The National WWII Museum, "D-Day Timeline". https://www.nationalww2museum.org/node/117894
- S-D6. US European Command, "Operation Overlord, June 6, 1944" (page returned 403; extents corroborated by S-D2, S-D3 and S-D4). https://www.eucom.mil/document/40471/operation-overlord-june-6-1944

**Versailles**
- S-V1. USHMM Holocaust Encyclopedia, "German territorial losses, Treaty of Versailles, 1919" (map caption). https://encyclopedia.ushmm.org/content/en/map/german-territorial-losses-treaty-of-versailles-1919
- S-V2. USHMM Holocaust Encyclopedia, "World War I: Treaties and Reparations". https://encyclopedia.ushmm.org/content/en/article/world-war-i-treaties-and-reparations
- S-V3. Treaty of Versailles, Part III, Political Clauses for Europe (Arts 31–117), text via Avalon Project / Yale Law School. https://avalon.law.yale.edu/Imt/partiii.asp
- S-V4. Office of the Historian, *FRUS, Paris Peace Conference 1919*, vol. XIII, Section IX, East Prussia (Arts 94–98), incl. the Marienwerder results. https://history.state.gov/historicaldocuments/frus1919Parisv13/ch12subch9
- S-V5. "1920 East Prussian plebiscite" (Wikipedia; cross-check only). https://en.wikipedia.org/wiki/1920_East_Prussian_plebiscite
- S-V6. Institute of National Remembrance (IPN, Poland), "Ideas for the Division of Upper Silesia After the Plebiscite" and "The Upper Silesian plebiscite of 20 March 1921: the course of voting". https://eng.ipn.gov.pl/en/digital-resources/articles/8108,Ideas-for-the-Division-of-Upper-Silesia-After-the-Plebiscite.html ; https://eng.ipn.gov.pl/en/digital-resources/articles/9176,The-Upper-Silesian-plebiscite-of-20-March-1921-the-course-of-voting.html
- S-V7. EBSCO Research Starters, "Plebiscite Splits Upper Silesia Between Poland and Germany". https://www.ebsco.com/research-starters/history/plebiscite-splits-upper-silesia-between-poland-and-germany
- S-V8. Treaty of Versailles, Arts 42–44 (Rhineland), via Harvard Law School Nuremberg Trials Project. https://nuremberg.law.harvard.edu/documents/2394-articles-42-44-of-the-versailles?mode=text ; and the Fordham Modern History Sourcebook. https://sourcebooks.web.fordham.edu/mod/1919versailles.asp

**Czechoslovakia**
- S-S1. Encyclopaedia Britannica, "Sudetenland". https://www.britannica.com/place/Sudetenland (summary seen via search; the fetch was blocked)
- S-S2. USHMM Holocaust Encyclopedia, "German annexation of the Sudetenland, 1938" (map) and "Munich Agreement" (timeline). https://encyclopedia.ushmm.org/content/en/map/german-annexation-of-the-sudetenland-1938 ; https://encyclopedia.ushmm.org/content/en/timeline-event/munich-agreement
- S-S3. Library of Congress Country Studies, *Czechoslovakia/Czech Republic*, "Munich". https://countrystudies.us/czech-republic/28.htm
- S-S4. German History in Documents and Images (GHI Washington), "The Munich Agreement (September 29, 1938)". https://germanhistorydocs.org/en/nazi-germany-1933-1945/the-munich-agreement-september-29-1938

**Poland 1939**
- S-P1. Avalon Project / Yale Law School, "Secret Additional Protocol", 23 Aug 1939 (Art. 2: "the line of the rivers Narev, Vistula and San"). https://avalon.law.yale.edu/20th_century/addsepro.asp
- S-P2. Michigan State University, *Seventeen Moments in Soviet History*, "The Secret Protocol". https://soviethistory.msu.edu/1939/soviet-territorial-annexations/soviet-territorial-annexations-texts/secret-protocol/
- S-P3. German History in Documents and Images, "German-Soviet Boundary and Friendship Treaty: the New Borders after the Division of Poland (September 28, 1939)" (map). https://germanhistorydocs.org/en/nazi-germany-1933-1945/german-soviet-boundary-and-friendship-treaty-the-new-borders-after-the-division-of-poland-september-28-1939
- S-P4. USHMM Holocaust Encyclopedia, "Invasion of Poland, Fall 1939". https://encyclopedia.ushmm.org/content/en/article/invasion-of-poland-fall-1939
- S-P5. Search-result summaries of detailed treaty studies (Lithuanian and Polish sources on the Nur–Ostrołęka segment and the Suwałki exchange of letters, 8 Oct 1939). These were **not fully verified**, so the north-east details are MEDIUM/LOW, as marked.

## 8. Open points
- UNVERIFIED: the Sudetenland area figure (do not use it); the Fuzhou withdrawal date (leave Fuzhou unshaded); the exact Suwałki/Augustów split (minor at this scale).
- Anything drawn from these rings and labelled on screen must show "approx." where §1.3, §3.3 and §4.3 say so.
