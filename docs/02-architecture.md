# 2 · Production architecture

```
┌──────────────── iPhone (SwiftUI) ────────────────┐        ┌──── Apple Watch (SwiftUI) ────┐
│ Features: Home · Train/Logger · Body · Progress   │        │ WatchWorkoutView · RestView   │
│           Generator · Coach · Profile · Onboarding│        │ WorkoutManager (HKWorkoutSess)│
│ WorkoutSession (GymCore) ─ autosave → JSON file   │◀──WC──▶│ MotionRepTracker (CoreMotion) │
│ WorkoutRepository ─ SwiftData (+ Outbox)          │        │ WatchSessionManager           │
│ HealthKitManager · PhoneSessionManager · AIClient │        └───────────────┬───────────────┘
└───────────────┬───────────────────────────────────┘                        │ HealthKit (HR, kcal, workout)
                │ HTTPS (app token)                                           ▼
        ┌───────▼────────────── Forma server ────────────┐         Apple Health (on device)
        │ /v1/workouts/generate · /v1/coach              │
        │ auth · rate limit · validation · safeguards    │──▶ Claude API (key server-side only)
        │ /v1/sync (planned) → Postgres (RLS per user)   │
        └────────────────────────────────────────────────┘
GymCore (Swift package, Foundation-only): domain types, RecoveryEngine, StrengthAnalytics,
ProgressionAdvisor, RepCounter, OfflineGenerator, PlanValidator, WatchProtocol, WorkoutSession.
```

## Modules

| Module | Responsibility | Tested |
|---|---|---|
| `ios/GymCore` | All domain logic. No UIKit/HealthKit, so it builds on Linux CI and is shared by the iPhone and Watch apps | 31 XCTests (`swift test`, Linux, also in CI) |
| `ios/Forma` | SwiftUI app, SwiftData persistence, services | Syntax-checked only here. **Needs an Xcode build** |
| `ios/FormaWatch` | watchOS app: workout session, motion, sync | Syntax-checked only. **Needs hardware testing** |
| `server/` | AI proxy + safeguards, accounts, sync (Node/TypeScript, Postgres) | 13 tests (mocked model; store on memory + real Postgres) · live smoke script |
| `prototype/` | Interactive web prototype; reference JS implementations | 36 unit + 12 browser E2E flows + two-device sync E2E |

## Data model

**On device (SwiftData)** — `ios/Forma/Persistence/Models.swift`

| Entity | Key fields | Notes |
|---|---|---|
| `WorkoutEntity` | `id`, `startedAt`, `endedAt`, `payload` (JSON `WorkoutRecord`), `volumeKg`, `hardSets`, `exerciseIDs`, `updatedAt`, `isDeleted` | The payload keeps the schema stable. Denormalised columns support queries. The tombstone supports sync |
| `TemplateEntity` | `id`, `name`, `items: [TemplateItem]` | |
| `CustomExerciseEntity` | `id`, `definition: ExerciseDefinition` | Same shape as built-ins |
| `ProfileEntity` | goals, units, equipment, injuries, toggles, `personalRecovery`, likes/dislikes | Singleton |
| `OutboxEntity` | `operation`, `entityID`, `attempts`, `nextAttemptAt` | Deferred-sync queue |

**Active workout:** not stored in SwiftData. It's a `WorkoutRecord` value held by `WorkoutSession` and written atomically to `Application Support/active-workout.json` on *every* edit, so a crash or kill loses nothing. It's restored on launch (`AppState.restore`).

**Server (planned sync), Postgres**

```sql
create table workouts (
  id uuid primary key, user_id uuid not null references auth.users on delete cascade,
  started_at timestamptz not null, ended_at timestamptz, payload jsonb not null,
  updated_at timestamptz not null default now(), deleted boolean not null default false
);
create index on workouts (user_id, updated_at);
alter table workouts enable row level security;
create policy own_rows on workouts using (user_id = auth.uid()) with check (user_id = auth.uid());
-- templates, custom_exercises, profile: same pattern. Account deletion cascades.
```

**Sync (implemented):** `server/src/store.ts` (Postgres + in-memory, one tested contract), schema in `server/db/001_init.sql`: one `records` row per entity (`kind`, `id`, `payload jsonb`, client `updated_at`, server `seq`), `on delete cascade` from `users`. Auth: Sign in with Apple identity tokens (RS256 via Apple's JWKS; issuer, audience and expiry checked; nonce SHA-256 compared) exchanged for 30-day HS256 session tokens. Clients detect changes by diffing against hashes from the last sync (`prototype/js/core/sync.js`, `GymCore.SyncEngine`), push, then pull from their cursor. The server applies last-writer-wins. Endpoints: `POST /v1/auth/apple`, `POST /v1/auth/dev` (dev mode only), `POST /v1/sync`, `GET /v1/account/export`, `DELETE /v1/account`.

**Original sync design notes:** client pushes outbox entries (`upsert`/`delete` with `updatedAt`). The server applies last-writer-wins per workout (workouts are single-author, so conflicts are rare) and returns changes since the client's cursor. iOS drains the outbox on launch, on network regain (`NWPathMonitor`) and from a `BGAppRefreshTask` (`app.forma.sync`), with exponential backoff.

## API

| Endpoint | Request | Response |
|---|---|---|
| `POST /v1/workouts/generate` | `{ input: {goal, experience, durationMin, location, equipment[], target[], avoid[], injuries[], likes[], dislikes[]}, context: {recovery[], history[{exerciseId, recent[{date, sets:[[kg,reps,rpe]]}]}]} }` | `200 { plan, issues[] }` · `503 { fallback: "on_device" }` |
| `POST /v1/coach` | `{ question, transcript[], context, healthConnected }` | `200 { text, grounded[] }` · `503` |
| `GET /healthz` | | `{ ok: true }` |

All requests need `Authorization: Bearer <app session token>`. This is the user's Forma session, **never an AI key**. Production should verify Sign in with Apple / JWTs; the reference server accepts configured tokens.

## AI integration: secure by construction

1. **No model keys on device.** The Anthropic credential exists only in the server's environment.
2. **Data minimisation.** The app sends goal, equipment, estimated recovery and up to 4 recent sessions per exercise (weight/reps/RPE and date). It never sends names, notes or raw Health samples. *Coach can use my workout history* off → history is not sent.
3. **Constrained output.** The model must return JSON matching a strict schema whose `exerciseId` is an enum of the real catalogue, so it can't invent exercises.
4. **Server safeguards** reuse the app's own `validatePlan`: they drop equipment/injury/avoid conflicts, clamp sets/rest, enforce per-muscle session caps, remove weight suggestions without history, and cap any weight at +10 % of the recent best.
5. **On-device re-validation** of everything received (`ai.js` / `PlanValidator`) as a second layer.
6. **Graceful degradation.** Refusals (`stop_reason: "refusal"`, after server-side fallback), truncation, invalid output, upstream errors and timeouts → 503 → the app uses the on-device engine and says so.
7. **Prompt-injection posture.** Training data goes in `<training_data>` and is described to the model as data, not instructions. Free text (notes) is never sent.
8. **Operational:** per-token rate limit, 64 KB body cap, no request-body logging, `cache-control: no-store`.

Model: `claude-opus-5-5`, effort `medium` for generation and `low` for chat, prompt caching on the stable system prompt + catalogue, and server-side refusal fallback (`fallbacks: "default"`).

## Offline-first rules

- Logging, history, recovery, analytics, generation (on-device engine) and the coach (on-device engine) all work with no network.
- Writes go to local storage first. Network effects (sync, cloud AI) are best-effort and queued.
- The web prototype mirrors this with localStorage plus a service worker that caches the app shell.

## Privacy

- Health data stays on device. Only derived, coarse values (e.g. sleep hours) are used in the model, and they're not uploaded by default.
- Export: Profile → *Export all data* (JSON). Delete: Profile → *Delete all data* (local), plus server account deletion cascading through `on delete cascade` once sync exists.
- HealthKit data is never used for advertising, per App Store guideline 5.1.3.

## Apple platform limitations (and how the design handles them)

| Limitation | Handling |
|---|---|
| watchOS suspends apps quickly in the background | An active **`HKWorkoutSession`** keeps the app running with the screen off, so motion + heart rate continue. Without a session, no background rep counting |
| WatchConnectivity is best-effort | Live `sendMessageData` when reachable, *plus* `transferUserInfo` (queued, ordered, survives suspension) for completed sets. `updateApplicationContext` carries the latest plan. Envelopes carry UUIDs and are de-duplicated; applying a set is idempotent |
| iPhone may be away from the watch | The watch keeps counting and queues results; the phone applies them when it reconnects |
| Background execution on iPhone is limited | Sync via `BGAppRefreshTask` + on-launch drain. The rest timer is time-based (`endsAt`), so it's correct after suspension. A local notification can alert at rest end |
| Core Motion rate/battery | 50 Hz device motion during sets only. Updates stop between sets |
| HealthKit read-denial is invisible | Missing data is treated as "unknown", never as "bad" |
