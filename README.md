# Forma — premium AI gym tracker (iPhone + Apple Watch)

Effortless logging, an interactive 3D muscle map with **estimated** recovery, explainable AI programming, and Apple Watch rep counting, built in stages with tests.

| Part | Path | What it is |
|---|---|---|
| **Interactive prototype** | [`prototype/`](prototype) | Full working web app (iPhone-sized, offline-capable): every main screen, real persistence, real algorithms |
| **Native app** | [`ios/`](ios) | SwiftUI iPhone app + watchOS companion + the `GymCore` Swift package (tested) |
| **AI server** | [`server/`](server) | Secure Claude-backed generator/coach with server-side safeguards |
| **Docs** | [`docs/`](docs) | [Product & design system](docs/01-product-design.md) · [Architecture](docs/02-architecture.md) · [Recovery model](docs/03-recovery-model.md) · [Watch & rep counting](docs/04-apple-watch-rep-counting.md) · [Testing](docs/05-testing-and-refinement.md) |

## Run it

```bash
npm install
npm start                 # prototype → http://localhost:5173 (open on your phone on the same network, or use desktop)
npm test                  # 36 core logic tests (JS)
npm run test:e2e          # 12 browser end-to-end flows (Playwright/Chromium)
npm run test:sync         # two-device sync through the real server (set DATABASE_URL for Postgres)
npm run test:server       # 13 server tests: AI (mocked model), auth, sync store on memory + Postgres
npm run test:swift        # 31 GymCore Swift tests (needs a Swift toolchain)
npm run smoke:ai          # live Claude calls through the server (needs ANTHROPIC_API_KEY)
npm run rep-eval -- <dir> # rep-count accuracy on labelled motion recordings (also: swift run rep-eval)
```

First launch shows onboarding. Choose **Explore with sample data** to see ~10 weeks of realistic (clearly labelled) training history.

## What works today

| Feature | Status |
|---|---|
| Workout logger: search/custom exercises, sets/reps/weight, warm-up/drop/failure sets, supersets, auto rest timer (adjustable), previous performance, copy previous, RPE/RIR, notes, templates, edit past workouts, kg/lb | ✅ Working (prototype) · ✅ logic tested in Swift · ⚠️ native UI not yet compiled |
| Automatic PR detection, progressive-overload suggestions with safety caps | ✅ Working + tested (JS & Swift) |
| Offline-first storage, crash-safe autosave, export & delete all data | ✅ Prototype (localStorage + service worker) · native implemented (SwiftData + atomic file) |
| Recovery model (configurable, labelled as estimate), dashboard, trends, frequency, personal feedback | ✅ Working + tested |
| 3D mannequin: front/rear, 360° rotate, zoom, tap muscles, recovery/volume/exercise colouring | ✅ Stylised model (default) + ✅ **anatomical model from BodyParts3D** (16 real muscle groups; abs & lats approximate) + load-your-own `.glb`. Licence needs confirmation before shipping — see [attribution](prototype/models/ATTRIBUTION.md) |
| AI workout generator (all inputs, explanations, alternatives, per-exercise regenerate, weekly programmes, recovery-aware, safety caps) | ✅ On-device engine working · Cloud (Claude) path implemented + tested with a mocked model, **not yet run against the live API** |
| Smart coach (grounded, never invents data) | ✅ On-device engine · cloud path implemented |
| Progress analytics: 7D/30D/90D/1Y, volume, e1RM, PRs, streaks, calendar, distribution, comparisons | ✅ Working (interactive SVG charts) |
| Apple Health (sleep, RHR, HRV) | 🟡 **Simulated** in the prototype · HealthKit code implemented natively, untested on device |
| Apple Watch app (workout session, HR, calories, rest, haptics, sync) | 🟡 **Simulated preview** in the browser · watchOS code implemented, **not built or tested on hardware** |
| Wrist rep counting | 🟡 Algorithm exact on synthetic traces (JS + Swift, cross-checked). Opt-in labelled recording on the watch + `rep-eval` accuracy gate are ready; **real-world accuracy unmeasured until data is collected** — see [doc 04](docs/04-apple-watch-rep-counting.md) |
| Accounts & cloud sync | ✅ Server (Sign in with Apple, sessions, Postgres, export/delete) tested against Postgres 16 · ✅ prototype sync verified across two browsers · native `SyncService` written (unbuilt) |
| Xcode build of iPhone + Watch apps | ⚠️ CI job ready but **this GitHub account has no hosted macOS runner available**; enable `ENABLE_MACOS_CI` once it does, or build locally (`cd ios && xcodegen`) |

Nothing here claims Apple Watch integration works until it has been built and tested on real hardware.
