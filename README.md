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
npm test                  # 31 core logic tests
npm run test:e2e          # 12 browser end-to-end flows (Playwright/Chromium)
npm run test:server       # 7 AI-server tests (mocked model, no key needed)
npm run test:swift        # 25 GymCore Swift tests (needs a Swift toolchain)
```

First launch shows onboarding. Choose **Explore with sample data** to see ~10 weeks of realistic (clearly labelled) training history.

## What works today

| Feature | Status |
|---|---|
| Workout logger: search/custom exercises, sets/reps/weight, warm-up/drop/failure sets, supersets, auto rest timer (adjustable), previous performance, copy previous, RPE/RIR, notes, templates, edit past workouts, kg/lb | ✅ Working (prototype) · ✅ logic tested in Swift · ⚠️ native UI not yet compiled |
| Automatic PR detection, progressive-overload suggestions with safety caps | ✅ Working + tested (JS & Swift) |
| Offline-first storage, crash-safe autosave, export & delete all data | ✅ Prototype (localStorage + service worker) · native implemented (SwiftData + atomic file) |
| Recovery model (configurable, labelled as estimate), dashboard, trends, frequency, personal feedback | ✅ Working + tested |
| 3D mannequin: front/rear, 360° rotate, zoom, tap muscles, recovery/volume/exercise colouring | ✅ Working (Three.js). **Stylised, not anatomically accurate** — licensed-asset path documented |
| AI workout generator (all inputs, explanations, alternatives, per-exercise regenerate, weekly programmes, recovery-aware, safety caps) | ✅ On-device engine working · Cloud (Claude) path implemented + tested with a mocked model, **not yet run against the live API** |
| Smart coach (grounded, never invents data) | ✅ On-device engine · cloud path implemented |
| Progress analytics: 7D/30D/90D/1Y, volume, e1RM, PRs, streaks, calendar, distribution, comparisons | ✅ Working (interactive SVG charts) |
| Apple Health (sleep, RHR, HRV) | 🟡 **Simulated** in the prototype · HealthKit code implemented natively, untested on device |
| Apple Watch app (workout session, HR, calories, rest, haptics, sync) | 🟡 **Simulated preview** in the browser · watchOS code implemented, **not tested on hardware** |
| Wrist rep counting | 🟡 Algorithm exact on synthetic test traces (JS + Swift). **Real-world accuracy unmeasured** — see limits in [doc 04](docs/04-apple-watch-rep-counting.md) |
| Accounts & cloud sync | ⏳ Designed (schema, outbox, protocol), not built |

Nothing here claims Apple Watch integration works until it has been built and tested on real hardware.
