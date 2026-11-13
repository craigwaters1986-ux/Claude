# 3 · Estimated recovery model

> **Status: heuristic.** This model has not been scientifically validated. It turns training data into a *plausible, explainable estimate* that helps decide what to train. It is labelled as an estimate everywhere it appears. It must not be marketed as measuring physiology.

## Analogy

Each muscle has a bucket. Every hard set pours water in: a full cup if the muscle was the main target, about half a cup if it helped. The bucket leaks over time. Small muscles like calves leak fast, big ones like hamstrings leak slowly, and poor sleep narrows the leak a little. *Recovery %* is how empty the bucket is.

## Formula

For muscle *m* at time *t*:

```
F_m(t) = Σ_sessions  k · Σ_sets ( role · effort · setType ) · exp( −Δt / τ_m )
recovery_m = 100 · (1 − min(1, F_m))
```

| Symbol | Default | Meaning / rationale |
|---|---|---|
| `k` (`fatiguePerSet`) | 0.085 | ≈12 hard sets in one session ≈ fully fatigued straight afterwards |
| `role` | 1.0 primary, 0.45 secondary | Secondary movers receive less stimulus |
| `effort` by RIR | 0→1.0, 1→1.0, 2→0.9, 3→0.8, 4→0.65, ≥5→0.45; unknown 0.85 | Sets far from failure cause less fatigue. RIR = 10 − RPE when RPE is logged |
| `setType` | warm-up 0, working 1, drop 0.5, failure 1.15 | |
| `τ_m` (hours) | calves/forearms/abs 16–18 · delts/biceps 20 · triceps/traps/front delts 22 · upper back 24 · chest/lats/adductors 26 · glutes 30 · quads 32 · hamstrings 34 · lower back 36 | Larger, more eccentric-loaded muscles assumed slower. **These are tuning parameters, not physiological constants.** |
| Horizon | 240 h | Older sessions ignored |

**Time to a target:** `t = τ · ln(F / (1 − target/100))`. The UI shows *ready* (≥ 90 %) as the headline and *full* (≥ 95 %). The exponential tail makes "100 %" meaningless.

**Bands (from the brief):** green 90–100 · blue 70–89 · yellow 40–69 · red 0–39.

**Overall score:** size-weighted mean (quads 4, chest/lats/glutes/hamstrings 3, …, small muscles 1).

## Optional health signals (Apple Health, with permission)

These multiply τ, so recovery slows when signals are poor. They never speed it up.

| Signal | Rule | Factor |
|---|---|---|
| Sleep last night | < 6 h / < 5 h | ×1.12 / ×1.2 |
| HRV (SDNN) | z-score < −1 vs own 30-day baseline (needs ≥ 7 days) | ×1.1 |
| Resting HR | > 5 bpm above own baseline | ×1.05 |
| **Cap** | product capped | **≤ ×1.3** |

**Limitations:** single-night sleep and HRV are noisy. Apple Watch HRV is SDNN sampled opportunistically. Resting HR rises with illness, heat, caffeine and stress, not just training. That's why the effect is small and capped. HealthKit never tells an app whether *read* access was denied, so "no data" and "no permission" are treated the same.

## Personal adaptation

After a tap on *How does it feel?* (fresh 95 / OK 78 / sore 50 / very sore 25), the muscle's τ multiplier updates:

```
mult ← clamp( mult · exp(−0.005 · (reported − predicted)), 0.7, 1.5 )
```

This is a slow, bounded nudge. Ten "very sore when the model said 90 %" reports take the multiplier to its 1.5 cap.

## Confidence

`n/a` (never trained) · `low` (few sessions or no RPE) · `medium` (≥ 3 sessions in 28 days with RPE on most sets). There is deliberately no `high` until the model has been validated.

## Validation plan (before any accuracy claims)

1. Collect next-day soreness and readiness ratings plus performance (rep drop at the same load) from consenting beta users.
2. Fit τ per muscle and `k` per user cohort. Compare against the defaults with proper held-out evaluation.
3. Publish what the score predicts, for example *"next-session rep performance within ±1 rep"*, with its measured error.
4. Until then, keep the "estimate" labelling and the conservative safety rules.

Code: `prototype/js/core/recovery.js` (reference) · `ios/GymCore/Sources/GymCore/RecoveryEngine.swift` (native). Both are covered by matching tests.
