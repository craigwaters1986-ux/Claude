# Map data credits (ep04-lincoln)

| Data | Used for | Licence |
| --- | --- | --- |
| **us-atlas 3.0.1** `states-10m.json` (Mike Bostock; derived from U.S. Census Bureau cartographic boundary files) | US state outlines in `src/kit/USMap.tsx` | ISC licence, Copyright 2013-2019 Michael Bostock (npm package `us-atlas`) |
| **world-atlas 2.0.2** `countries-50m.json` (Natural Earth 1:50m) | Canada, Mexico, Cuba, Bahamas around the US | Natural Earth: public domain; package ISC |
| **Natural Earth 1:50m** `ne_50m_lakes`, `ne_50m_rivers_lake_centerlines` (nvkelso/natural-earth-vector) | Great Lakes; Ohio, Mississippi, Missouri, Tennessee, Wabash, Potomac (extracted to `src/kit/data/ne-water.json`) | Public domain |

Suggested description line: "Maps: U.S. Census Bureau via us-atlas (ISC); Natural Earth (public domain)."

## Simplifications (shown or implied on screen)
- Modern state outlines stand in for period boundaries. West Virginia is merged into Virginia before 20 June 1863; Maine into Massachusetts before 1820; DC is drawn with Maryland.
- Land that was US territory but not a state is one muted tint with no internal borders or labels. Land not yet American (Florida before 1821, Texas before Dec 1845, Oregon Country before 1846, the Mexican Cession before 1848) is drawn in the paler "foreign" tint, at whole-state granularity.
- Kansas and Nebraska Territories (1854): hand-plotted, west edge simplified along the continental divide.
- Emancipation Proclamation (1 Jan 1863): the ten named states shaded; Tennessee, the border states and the West Virginia counties left blank; the excepted Louisiana parishes and Virginia counties are simplified hand polygons. Label on screen: "excepted areas simplified".
- Rivers are modern courses at 1:50m generalisation. Routes (1816 move, 1830 move, 1828 flatboat, funeral train) join the listed places; the in-between paths are approximate.
