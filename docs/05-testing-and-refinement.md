# 5 · Testing & refinement

## Test suites

| Suite | Command | Count | Runs on |
|---|---|---|---|
| Core logic (JS): recovery, metrics/PRs, overload, generator + safety, rep counter, units, coach grounding | `npm test` | 31 | Node 22 |
| Browser end-to-end: onboarding → log → PR → discard race → units → edit → body/3D → generator → coach → watch sync → export/delete | `npm run test:e2e` | 12 flows | Headless Chromium (WebGL via SwiftShader) |
| AI server: auth, schema, refusal/invalid-output fallback, safeguards, rate/body limits, app↔server contract | `npm run test:server` | 7 | Node 22 + tsx (mocked model) |
| GymCore (Swift): recovery, strength/PRs/progression, rep counter, protocol/de-dup, plan validator, offline generator, logger session | `npm run test:swift` | 25 | Swift 6.0 on Linux (also runs in Xcode) |
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

## Edge cases covered by tests

No history (no fabricated weights, baseline instead of PR) · first-ever session is not a PR · future-dated workouts ignored · warm-ups excluded from fatigue and PRs · lb↔kg round-trip with kg storage · plan with hallucinated exercise / injury conflict / absurd sets / 900 s rest / +75 % weight jump · weekly and session volume caps · all six durations fit · bodyweight-only plans · superset rest deferral · reps required to complete a set · idempotent watch set application and envelope de-duplication · model refusal, truncation and invalid JSON · oversized bodies · rate limits · reload mid-workout keeps progress.

## Performance

- Recovery and derived data are memoised per state change and per minute.
- The 3D view pauses rendering when off-screen (IntersectionObserver), caps pixel ratio at 2 and disposes GPU resources on navigation.
- The logger re-renders one screen locally and autosaves on a debounce; the native logger uses value types plus one atomic file write per edit.
- Watch motion runs only during sets (50 Hz) and stops between them.

## Known gaps / next steps

1. **Build and run the iOS + watchOS targets in Xcode** (`cd ios && xcodegen`). Fix any compile issues (the code was only syntax-checked here), then test on a real iPhone + Apple Watch.
2. Record labelled wrist-motion data and measure real rep-count accuracy before enabling auto-count by default (see doc 04).
3. Run a live call against the Claude API with a real key (the server is tested against a mocked client only).
4. Implement `/v1/sync` + Sign in with Apple; production token verification.
5. License or commission an anatomically accurate muscle asset (see doc 01).
6. Native weekly-programme generator (exists in the JS engine; the native port covers single sessions).
7. Formal accessibility audit (VoiceOver, Dynamic Type at the largest sizes) on device.
