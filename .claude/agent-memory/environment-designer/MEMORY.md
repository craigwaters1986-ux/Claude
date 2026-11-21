# Environment designer memory — lessons learned

- GeoMap land clipPath must be in projection space (inside the camera-transformed <g>), otherwise two
  same-kind maps on screen (crossfades, preview sheets) clip each other via duplicate ids. Fixed 2026-11-15.
- Overlapping semi-transparent country fills show darker seams: use opaque pre-mixed colours for map fills.
- Feature highlights draw AFTER name highlights; to overpaint neutrals (Sweden/Switzerland) on top of a
  feature fill, pass them as `feature: countryFeature(name)`.
- Normandy at scale 30000 needs 1:10m land: a clipped extract lives in src/maps/data (generated with a
  Sutherland–Hodgman clip of land-10m; ~600 points, 11 KB).
- Preview entry src/maps/__preview__/index.ts; sheets render ~25–60 s each. `remotion still ... --scale=0.75`.
  The user/Director prefer few checks: one final sheet + one benchmark is enough.
- R-01 map sources: production/research/ep01-ww2/map-sources.md (Versailles, Sudetenland, Japan 1941, D-Day,
  geo.ts review). Aug 1939 pact line = Narew–Vistula–San; Sept 1939 = Pisa–Narew–Bug–San.
- Benchmark: map frame with animated fills ≈5.6 s/frame incl. tab warm-up (3-frame run, concurrency 1).
- Animator's Head.tsx may have WIP tsc errors — not ours; filter with grep -v Head.tsx.
