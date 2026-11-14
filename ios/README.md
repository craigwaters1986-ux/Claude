# Forma — native iOS + watchOS

| Folder | What | Verified |
|---|---|---|
| `GymCore/` | Swift package with all domain logic (recovery, strength/PRs, progression, rep counter, generator, plan safety, watch protocol, logger session) | ✅ `swift test`: 25 tests pass on Linux (Swift 6.0.3) |
| `Forma/` | SwiftUI iPhone app (SwiftData, HealthKit, WatchConnectivity, SceneKit, Swift Charts) | ✅ Compiles with Xcode (GitHub Actions *iOS build*) · not yet run on a device |
| `FormaWatch/` | watchOS app (HKWorkoutSession, Core Motion rep tracking, Digital Crown correction) | ✅ Compiles with Xcode · **not tested on hardware** |

## Build

No Mac? Everything builds on GitHub-hosted Macs: see [../docs/06-building-without-a-mac.md](../docs/06-building-without-a-mac.md).

With a Mac:

```bash
brew install xcodegen
cd ios && xcodegen          # generates Forma.xcodeproj from project.yml
open Forma.xcodeproj        # set your team, enable HealthKit capability, run on device
cd GymCore && swift test    # domain tests (macOS or Linux)
```

Requirements: Xcode 15+, iOS 17, watchOS 10. HealthKit and motion require a physical device. The simulator has no real sensor data.

## Design notes

- The **active workout** is a `GymCore.WorkoutSession` (value-typed `WorkoutRecord`), autosaved atomically to a JSON file on every edit. Completed workouts go to SwiftData, plus an outbox entry for deferred sync.
- The 3D muscle map (`Forma/Features/Body/BodyView.swift`) is a procedural, stylised model. Swap `MuscleMapScene.build()` for a licensed USDZ whose nodes are named by `Muscle.rawValue`.
- `AIClient` only talks to Forma's server. Every received plan goes through `PlanValidator` before display.
