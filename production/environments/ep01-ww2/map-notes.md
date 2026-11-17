# Map notes — ep01-ww2 (environment designer)

Base geography: Natural Earth via `world-atlas` 2.0.2 (public domain): 1:50m land/countries, 1:110m thin borders,
and a 1:10m land extract for Normandy (`src/maps/data/normandy-land-10m.json`, clipped to lon -3.4..2.0, lat 48.2..50.6,
~600 points). All historical lines are hand-plotted approximations in lon/lat, clipped to the coastline at render time.
Code: `src/maps/geo.ts` (base regions, cities), `src/maps/history.ts` (campaign data), `src/maps/versailles.ts`,
`src/maps/EpisodeMaps.tsx` (ready-made shots), `src/maps/MapKit.tsx` (overlays/icons).

## Applied from the researcher's R-01 (`production/research/ep01-ww2/map-sources.md`, 2026-11-15)
| Item | What changed | R-01 section |
|---|---|---|
| MR line | Two exports: `MR_LINE_AUG1939` (Narew–Vistula–San, through Warsaw) for S04-03; `MR_LINE_SEPT1939` (Pisa–Narew–Bug–San) for the later partition shot, labelled "28 SEPT 1939" (`MapSpheres1939 line="sept"`). `MR_LINE_COORDS` now aliases the corrected Sept line. Białystok/Łomża/Bielsk now Soviet side. Suwałki/Augustów split not drawn (LOW, minor at this scale). | §5 |
| LOST_TO_POLAND | Replaced with `LOST_TO_POLAND_FIX`: excludes Danzig and Marienwerder/Marienburg; includes Soldau. | §3.2, §5 |
| POLAND_1939 / zones | West chain replaced (`POLAND_WEST_CHAIN_FIX`): Danzig, Marienburg area, Gleiwitz/Beuthen excluded; German/Soviet zones rebuilt on the Sept line. | §5 |
| EAST_PRUSSIA | `EAST_PRUSSIA_FIX` (Marienwerder plebiscite area included). | §5 |
| RHINELAND | `RHINELAND_FIX` (Baden strip; Frankfurt, Heidelberg inside). | §5 |
| ALSACE_LORRAINE | `ALSACE_LORRAINE_FIX` (Nancy, Lunéville, Saint-Dié outside). | §3.2 |
| GERMANY_1937 | Upper Silesia (Gleiwitz, Beuthen inside), Corridor edge (Lębork, Bytów inside), Danish border (Tønder outside). | §5 |
| Versailles (S02-04) | Order: Alsace-Lorraine → France; Posen/West Prussia (Corridor) → Poland; Danzig → FREE CITY (own colour); North Schleswig → Denmark; Eupen-Malmedy → Belgium; Memel and Hultschin as dots; Memel fades to neutral, label "TO LITHUANIA, 1923"; East Upper Silesia optional (`upperSilesia` prop, off by default, labelled APPROX.). Saar NOT shown as lost (`SAAR` exported only for a hatched League use). Germany 1914 = GERMANY_1937 + East Prussia + all loss pieces in grey (no separate 1914 outline). | §3.2–3.3 |
| Sudetenland | Czechia in German grey under `CZECH_RUMP_NOV1938` in Czech colour (uneven band: wide NW and north Moravia, thin south). Label "SUDETENLAND (APPROX.)". No area figure. Slovakia labelled only "SLOVAKIA" (never "neutral"). Teschen/Zaolzie and the Hungarian bites of 1938 omitted (acknowledged simplification). `RUTHENIA` replaced with the R-01 ring. | §4 |
| Japan Dec 1941 (S06-05) | Solid: Japan, Korea, Taiwan, Manchukuo (incl. Jehol), South Sakhalin. Hatched: occupied China main block, Guangzhou delta, Hainan; dots for Xiamen and Shantou. Lighter tone: Vietnam+Laos+Cambodia, labelled "(Japanese troops)". Not shaded: Thailand, Hong Kong, Macau, Guam, Wake, Fuzhou, Changsha. Label "APPROXIMATE AREAS, 1941". To show Saigon, pass a camera reaching ~10°N (e.g. `cam={{lon: 115, lat: 25, zoom: 1.0}}`). South Seas Mandate not drawn (optional). | §1 |
| D-Day (S08-04) | Beach centres from §2.2 (UTAH -1.19,49.41 … SWORD -0.29,49.30); US blue / British red / Canadian amber with a legend; five separate stretches; drop clusters 82nd (-1.32,49.41), 101st (-1.25,49.36), 6th (-0.25,49.23, label offset east); "PEGASUS BRIDGE" label. | §2 |
| Cities (M-12) | §6 values (Oświęcim 19.21, Dachau 11.47), plus Pegasus Bridge, Gleiwitz, Tianjin, Hanoi, Saigon, Cam Ranh Bay, Taipei. Camp markers must use sombre styling (no pulsing pins): pass `pulse={false}` and a grey colour. | §6 |

## Designer-plotted items (NOT from R-01; approximate; researcher check recommended)
Plotted from general knowledge of standard campaign maps, not traced from one atlas. Treat as approximate.
- **1940 arrows** (`ARROWS_1940`): Denmark (overland), Oslo/Bergen/Trondheim/Narvik (seaborne, dashed), Netherlands, Belgium, sickle Ardennes → Sedan → Abbeville (20 May). Dunkirk pocket = simplified Gravelines–Bergues–Furnes–Nieuport perimeter, c. 28–31 May.
- **Barbarossa start line** (`FRONT_JUNE1941`): German/Axis–Soviet border Memel → Bug → San → Carpathians → Prut → Danube. Optional Finnish extension. Arrows to Leningrad, Moscow, Kyiv; Moscow counter-attack (Dec 1941).
- **Bracket "NEARLY 3,000 KM"**: drawn alongside the plotted line, not as a straight span. Britannica gives a 1,800-mile (2,900 km) front ([Britannica](https://www.britannica.com/topic/Operation-Barbarossa)); my Baltic–Black Sea polyline measures less than that (use `frontKm()`). Some sources count the front from the Arctic. **Open question for the researcher:** does the 2,900 km figure include the Finnish/Arctic sector? If it does, the editor should pass `FRONT_JUNE1941_FINLAND` joined to the main line for the bracket.
- **Stalingrad** (Operation Uranus, 19–23 Nov 1942): pincers from the Serafimovich/Kletskaya bridgeheads and south of the city, meeting at Kalach/Sovetsky; pocket between Don and Volga; simplified Don and Volga traces.
- **Bagration** (June 1944): Belorussian "balcony" front, four Soviet arrows on Minsk and on towards Warsaw; the after-line on the Vistula is the late August 1944 position.
- **1944–45 fronts** (`WEST_DEC1944`, `WEST_MAR1945`, `WEST_APR1945`, `EAST_DEC1944`, `EAST_MAR1945`, `EAST_APR1945`, Italy Gustav Line spring 1944, Anzio, winter line 1944–45, the Po in April 1945). The "shrinking Germany" fill is built from the two interpolated fronts plus a fixed Alpine southern edge, with Switzerland and Sweden painted over. Simplifications: the western Netherlands stays unshaded in April 1945 (it was still occupied until 5 May); Norway and the Courland/East Prussian pockets are not shaded.
- **Manchuria 1931** fill (designer ring), **China 1937 arrows** (Beijing south along the railways; Shanghai → Nanjing), **Soviet August 1945 three-front arrows** (Transbaikal from Mongolia; 1st Far Eastern from Primorye; 2nd Far Eastern across the Amur).
- **Midway**: Japanese carriers drawn near Akagi's scuttling position (≈30.5°N 178.7°W); US carriers north-east of Midway near Yorktown's sinking position (≈30.6°N 176.6°W), shifted slightly for legibility. Schematic.
- **Island hopping**: Guadalcanal → Saipan → Iwo Jima → Okinawa through open-sea waypoints (schematic route, not a fleet track).
- **German colonies** (inset globe dots): approximate centres.

## Performance notes
- GeoMap's land clipPath now lives in base-projection space. Before, two maps of the same kind on screen (for example during a ShotTrack crossfade) clipped each other wrongly. Fixed.
- `featurePath` is now memoised per (kind, feature object). Animated features (front lines, shrinking fill) are rebuilt each frame but are small (<60 points).
- Globe paths use `.digits(1)`.
- Benchmark: `BenchEurope1945` (animated shrinking fill, three fronts, five arrows), `--frames=40-42 --concurrency=1`: "Rendering frames done in 16694ms" for 3 frames, about 5.6 s/frame. **That figure includes the tab's one-off geometry set-up** (projecting the 1:50m world for the kind), so steady-state frames are cheaper. This was the only timing run, at the Director's request.
