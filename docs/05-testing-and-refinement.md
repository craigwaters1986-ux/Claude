# 5 · Testing & refinement

## Test suites

| Suite | Command | Count | Runs on |
|---|---|---|---|
| Core logic (JS): recovery, metrics/PRs, overload, generator + safety, rep counter (+ Swift parity), units, coach grounding, sync, anatomy mapping | `npm test` | 36 | Node 22 |
| Browser end-to-end: onboarding → log → PR → discard race → units → edit → body/3D → generator → coach → watch sync → export/delete | `npm run test:e2e` | 12 flows | Headless Chromium (WebGL via SwiftShader) |
| Server: AI (mocked model), Apple/session auth, sync store contract on **memory and Postgres 16**, HTTP account + sync flows, iPhone↔server contract fixtures | `npm run test:server` | 14 |
| Accessibility: axe-core WCAG 2.1 A/AA on every screen, onboarding and sheets | `npm run test:a11y` | 13 views, 0 violations | Node 22 + tsx |
| Two-device sync through the real server (+ Postgres) | `npm run test:sync` | 5 steps | Chromium × 2 |
| Live Claude smoke test (generate + coach + "data I don't have") | `npm run smoke:ai` | 3 | needs `ANTHROPIC_API_KEY` |
| GymCore (Swift): recovery, strength/PRs/progression, rep counter, protocol/de-dup, plan validator, offline generator + weekly programmes, offline coach, logger session, sync engine, rep evaluation, anatomy mapping, iPhone↔server contract | `npm run test:swift` | 36 | Swift 6.0 on Linux (also in CI) |
| CI (GitHub Actions) | every push | web+server+sync, GymCore on Linux; Xcode job gated | ubuntu (macOS when available) |
| Type check (server) | `npx tsc -p tsconfig.json` | — | strict TS |
| Syntax check (iOS/watchOS app sources) | `swiftc -parse` per file | 15 files | Linux. **Not a compile; needs Xcode** |

## Bugs found and fixed during this build

| # | Bug | How it was found | Fix |
|---|---|---|---|
| 1 | App crashed on start when storage is unavailable (private browsing): temporal-dead-zone access in `store.js` | Running core modules under Node | Declare state before `load()` |
| 2 | Exercise picker showed raw HTML on open | E2E + screenshot | Return trusted markup from `listHtml` |
| 3 | Same escaping bug in "Time until ready" list and exercise-detail chart | Audit after #2 | Wrapped with `raw()` |
| 4 | **Discarded/finished workout could reappear**: a pending debounced autosave re-wrote `active` | Code review, then E2E regression test | `endSession()` cancels pending autosaves |
| 5 | Coach sent each message twice | Code review | Single delegated submit handler |
| 6 | Custom exercise created from the picker was lost | Code review | Resolve order fixed |
| 7 | Thumb bar started from an empty next set | E2E | Carry the completed set's values into the next empty set; steppers start from the previous set |
| 8 | Rest banner overlapped exercise cards when scrolled | Screenshot | Rest timer moved inside the solid sticky header |
| 9 | Generator blamed "equipment" when the real reason was the weekly volume cap | E2E with sample data | Specific weekly-cap warning (+ unit test) |
| 10 | **Swift exclusivity violation** in `toggleDone` (would crash on device on the first completed set) | New `WorkoutSessionTests` on Linux | Mutate a local copy, then commit once |
| 11 | Rep counter: phantom reps from sensor noise and end-of-set settling; missed slow presses | Synthetic accuracy sweep | Noise floor, swing-consistency gate, retuned integrator (0.99 leak, 0.1 Hz drift filter) |
| 12 | Strength chart made a 1 % dip look like a cliff | Screenshot | Minimum visible y-span (±6 %) |
| 13 | Visual polish: underlined tab labels, wrapped watch button, gaps at mannequin joints | Screenshots | CSS + joint spheres |
| 14 | Rep counter dropped a rep in long, slow sets (window shorter than one rep) | `rep-eval` on a wider synthetic dataset | Adaptive window (Swift + JS) + regression tests |
| 15 | Anatomy mapping matched vessels and regions ("abdominal aorta", "deltoid branch of … artery", "extensor digitorum longus" (a leg muscle) as forearm) | Running the mapping on real BodyParts3D names | Non-muscle exclusions + tighter forearm rule, shared Swift/JS cases |
| 16 | Simplifier couldn't reduce BodyParts3D meshes (vertices unwelded) | Size sweep | Weld before simplify (5.6 MB → 1.6 MB) |
| 17 | Device frame could be scrolled sideways by focus | Screenshot after loading the anatomical model | `overflow: clip` |
| 18 | Apple nonce compared un-hashed (weak replay protection) | Review while building iOS sign-in | Compare SHA-256(raw nonce) |
| 19 | Pinch-zoom disabled (`maximum-scale=1`) | axe-core | Removed |
| 20 | Switches and chips announced no state when off: the template helper dropped `false`, leaving `aria-checked=""` (35 attributes) | axe-core | Booleans render as `true`/`false` |
| 21 | Segmented buttons used `aria-selected` outside tabs | axe-core | `aria-pressed` |
| 22 | **iPhone AI client couldn't decode the server's response** (expected `items`/`exerciseID`, server sends `exercises`/`exerciseId`) | Writing the native cloud path | Typed `GymCore.CloudAPI` + two-way contract fixtures |
| 23 | Avoiding one muscle (calves) avoided the whole group (legs) on the server | Contract fixture review | Group avoided only when all its muscles are; per-muscle rule enforced on device |

## Edge cases covered by tests

No history (no fabricated weights, baseline instead of PR) · first-ever session is not a PR · future-dated workouts ignored · warm-ups excluded from fatigue and PRs · lb↔kg round-trip with kg storage · plan with hallucinated exercise / injury conflict / absurd sets / 900 s rest / +75 % weight jump · weekly and session volume caps · all six durations fit · bodyweight-only plans · superset rest deferral · reps required to complete a set · idempotent watch set application and envelope de-duplication · model refusal, truncation and invalid JSON · oversized bodies · rate limits · reload mid-workout keeps progress.

## Performance

- Recovery and derived data are memoised per state change and per minute.
- The 3D view pauses rendering when off-screen (IntersectionObserver), caps pixel ratio at 2 and disposes GPU resources on navigation.
- The logger re-renders one screen locally and autosaves on a debounce; the native logger uses value types plus one atomic file write per edit.
- Watch motion runs only during sets (50 Hz) and stops between them.

## Known gaps / next steps

1. **Build and run the iOS + watchOS targets in Xcode.** A CI job is ready, but no GitHub-hosted macOS runner picked it up on this account (two attempts, `macos-15` and `macos-latest`). Set repository variable `ENABLE_MACOS_CI=true` once macOS runners are available, or (`cd ios && xcodegen`). Fix any compile issues (the code was only syntax-checked here), then test on a real iPhone + Apple Watch.
2. Record labelled wrist-motion data and measure real rep-count accuracy before enabling auto-count by default (see doc 04).
3. Run a live call against the Claude API with a real key (the server is tested against a mocked client only).
4. Deploy the server: HTTPS, managed Postgres (`DATABASE_URL`), a strong `FORMA_SESSION_SECRET`, and the iOS bundle id as `FORMA_APPLE_AUDIENCE`. Sync and Sign in with Apple are implemented and tested.
5. Confirm the BodyParts3D licence with DBCLS (CC BY 4.0 page vs CC BY-SA 2.1 JP file headers), or license/commission a complete model. BodyParts3D lacks abs and lats (see `prototype/models/ATTRIBUTION.md`).
6. On-device accessibility pass (VoiceOver, Dynamic Type at the largest sizes) once the app is built; the web audit is automated.
