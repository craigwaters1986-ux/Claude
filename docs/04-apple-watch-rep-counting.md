# 4 · Apple Watch & automatic rep counting

> **Status:** algorithm implemented in Swift (`GymCore/RepCounter.swift`) and JavaScript (`prototype/js/core/repcounter.js`). Both are **exact on synthetic test traces**: 54 cases each covering curls, lateral raises and presses at 1.4–3.5 s per rep, with noise and fatigue slow-down. Holding still counts zero. **Nothing has been tested on a real Apple Watch yet**, so real-world accuracy is unknown until that's done.

## How it works

The watch provides `CMDeviceMotion` at 50 Hz: `gravity` (which way is down, in the watch's frame) and `userAcceleration` (movement with gravity removed).

Analogy: a turnstile that only clicks when the arm swings fully past the top bar *and* fully back past the bottom bar. Small wobbles in between never click it.

1. **Pick a signal by movement type**
   - *Orientation* (curls, raises, flies): the forearm rotates through 90–120°, so the gravity vector swings a lot in the watch's frame. Low-pass it at 2 Hz, then track the axis with the most variance over the last 3 s.
   - *Vertical* (presses, rows, pulldowns): the wrist translates without much rotation. Project acceleration onto gravity, low-pass at 3 Hz, leaky-integrate to a velocity-like signal (one cycle per rep), and remove drift with a 0.1 Hz high-pass.
2. **Adaptive hysteresis.** Over a 3–4 s window, compute mid and amplitude. A rep is *high-crossing → low-crossing* with thresholds at `mid ± 0.3–0.35 · amplitude`.
3. **Gates.** Minimum amplitude (rejects fidgeting), minimum 0.9 s between reps, maximum 7 s per half-rep, and a **swing-consistency** check: a swing smaller than half the set's typical swing doesn't count, which rejects end-of-set settling.
4. **Correction.** The Digital Crown adjusts the count. Corrections are stored (`SetResult.corrections`, `repCorrection` messages) as **labels for calibration and future model training**.

## Supported exercises (initial)

| Level | Exercises | Why |
|---|---|---|
| **Supported (initial targets)** | Dumbbell/barbell/hammer curl, lateral raise, overhead press, dumbbell shoulder press | Large, repeatable wrist arc |
| **Experimental** | Bench/incline/machine press, rows, pulldowns, pull-ups, face pulls, flies, triceps work, shrugs | Wrist moves, but signal shape varies with grip and setup |
| **Unsupported → manual** | Leg press, leg extension/curl, calf raise, hip thrust, squats & lunges (for now), deadlifts, planks and other holds, crunches | Wrist is stationary, moves very slowly, or the motion is ambiguous |

## Honest limitations of wrist-based counting

- **Leg machines and holds:** the wrist barely moves, so counting is impossible. These are manual by design.
- **Barbell squats/deadlifts:** the wrist moves with the bar but slowly, with long pauses at lockout. They're likely unreliable without a trained model.
- **Partial reps, pauses, re-racking, adjusting grip:** can add or miss reps. The consistency gate helps, but the crown correction is always there.
- **One wrist only:** single-arm work on the non-watch arm is invisible.
- **Very slow tempos (> 7 s per half-rep)** exceed the timing gate.
- **Synthetic tests ≠ real gyms.** Real accuracy needs a recorded, labelled dataset.

## Rollout plan

1. **Instrument:** record raw 50 Hz motion plus the user's final rep count (opt-in) for supported exercises.
2. **Measure:** per-exercise accuracy (exact-match rate, mean absolute error per set) across users, tempos and loads. Ship auto-count only where exact-match is ≥ 90 %.
3. **Calibrate:** per-user amplitude/tempo priors learned from corrections.
4. **Model:** train a small per-exercise classifier/segmenter (Create ML activity classifier or a 1-D CNN converted to Core ML) on labelled data. Evaluate `CMBatchedSensorManager` 200 Hz data on watchOS 10+.
5. **Expand** exercise by exercise, gated on measured accuracy.

## Watch app features (implemented, untested on hardware)

`ios/FormaWatch`: start and finish the workout (`HKWorkoutSession` + `HKLiveWorkoutBuilder`, saved to Health); current exercise, set number and target weight × reps from the phone's plan; live heart rate; elapsed time; active energy (Apple Watch's own HealthKit estimate); start/end set with live rep count; Digital Crown correction; automatic 90 s rest timer with haptics; sets sent to the iPhone over WatchConnectivity with queued fallback.

The browser **Watch preview** (`#/watch`) runs the same algorithm on synthetic motion or a phone's real motion sensors, and pushes results into the active workout through a mock WatchConnectivity log. It is clearly labelled as simulated.
