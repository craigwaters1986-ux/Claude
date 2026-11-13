# 1 · Product design

## Concept

**Forma** is a premium strength-training app for iPhone and Apple Watch. The product thesis has three parts:

1. **Logging must be faster than a notebook.** Every set should take one tap in the common case. The previous session is pre-filled, the next set inherits the last one, and a thumb bar at the bottom holds weight/reps steppers and a single *Complete set* button.
2. **Recovery should be visible, but honest.** A 3D muscle map shows *estimated* recovery per muscle group. The model is a transparent heuristic with every constant documented and configurable (see [03-recovery-model.md](03-recovery-model.md)). It is never presented as a measurement.
3. **AI should program, not chat.** The generator produces a concrete session or week and explains each choice. A deterministic safety layer checks every plan, from the on-device engine or the cloud model, before the user sees it.

Think of it like a car's dashboard: the speedometer (logging) has to be instant and reliable, the fuel gauge (recovery) is useful even though it's an estimate, and the satnav (AI) suggests routes but never drives you off a cliff.

## Visual design system

| Token | Value | Use |
|---|---|---|
| `--bg-0` | `#050608` | App background (near-black) |
| `--bg-1` / `--bg-2` | `#0B0D12` / `#12151C` | Raised surfaces |
| `--glass` | `rgba(255,255,255,.045)` + 24 px blur | Cards (glassmorphism) |
| `--text-0/1/2` | `#F4F8FF` / `#B9C3D6` / `#8792A8` | Icy white → tertiary (all ≥ 4.5:1 on bg) |
| `--accent` | `#2F8CFF` | Electric blue (primary actions) |
| `--accent-2` | `#5CE1FF` | Ice cyan (glows, live data) |
| `--accent-3` | `#8B7BFF` | Violet: anything AI |
| Recovery | `#30E8A0` / `#3AA8FF` / `#FFD23F` / `#FF4D6D` | 90–100 / 70–89 / 40–69 / 0–39 % (status colours, always paired with a label + %) |
| PR | `#FFCF5C` | Personal-record gold |

- **Type:** SF Pro (Inter fallback on the web). Large titles 34 pt bold, tight tracking; tabular numerals everywhere numbers change.
- **Shape:** 22 pt card radius, pill buttons, 4 pt spacing grid.
- **Motion:** spring easing (`cubic-bezier(.34,1.56,.64,1)`) for confirmations; 320 ms view transitions; rings animate their stroke on appear. `prefers-reduced-motion` disables all of it.
- **Haptics (native):** light impact on steppers and set-type changes, success notification on set completion, heavy impact for PRs, warning when rest ends. On the watch: `.click` per detected rep, `.success` when a set ends, `.notification` when rest ends.
- **Accessibility:** 44 pt minimum hit targets, labelled controls, chart summaries as `aria-label`/`accessibilityLabel`, the muscle map has a full list alternative, colour is never the only signal, and a light theme is available.

Tokens live in `prototype/css/tokens.css` and are mirrored in `ios/Forma/DesignSystem/Theme.swift`.

## Information architecture

```
Tab bar
├── Home      recovery ring · next suggested workout · muscle status · this week · recent · coach entry
├── Train     start empty / resume · AI generator · templates · exercise library · watch preview · recent
│   └── Active workout (full screen, one-handed)  ← also reachable from Home / Coach / Generator
├── Body      Anatomy (3D map: recovery / volume / exercise modes, front/rear, tap → callout)
│             Recovery dashboard (score, health signals, trend, load, frequency, time-to-ready)
├── Progress  7D/30D/90D/1Y · volume · e1RM by lift · PRs · consistency heatmap · distribution · history → detail → edit
└── Profile   training prefs · units · rest · haptics · Apple Watch · Apple Health · AI & privacy · export/delete · status
Overlays: Onboarding (first run) · Coach (full screen) · sheets (exercise picker, details, confirmations)
```

## Key flows

- **Log a set (≈1 tap):** the thumb bar shows the next set pre-filled from last time. Tap *Complete set*, and the rest timer starts automatically (skipped between superset partners). Adjust with ± steppers first if needed.
- **Generate → train:** Train → AI generator → choose inputs → *Generate*. Each exercise shows why it was picked, how to do it and alternatives, and can be regenerated on its own. Then *Start this workout*.
- **Check a muscle:** Body → tap chest → *Chest — 78% recovered · est. ready 14 h · last trained yesterday · 12 weekly sets · Light training or additional recovery*. Below that, *How does it feel?* tunes your personal model.

## 3D anatomy options (honest assessment)

The prototype and native app ship a **procedural, stylised muscle-group mannequin**: 18 groups placed as sculpted volumes on a glass body. It rotates 360°, zooms, has front/rear presets, and supports tap-to-select. It is **not anatomically accurate**, and the UI says so.

To get anatomical accuracy for a commercial release:

| Option | Pros | Cons |
|---|---|---|
| **License a segmented anatomy asset** (e.g. medical-illustration vendors or 3D-asset marketplaces offering per-muscle meshes under commercial licences) | Accurate, fast to integrate (USDZ via RealityKit/SceneKit) | Licence cost; check redistribution and modification terms; often needs re-topology for mobile |
| **Commission an artist** | Exact art direction (glass/neon look), owned IP | 6–10 weeks, cost |
| **Derive from open anatomical datasets** | Low cost | Licences often restrict commercial use (check carefully); heavy clean-up |

The integration contract is already in place. Each muscle node is named by `Muscle.rawValue` (`chest`, `lats`, …), and colouring, picking and camera code iterate over node names. Swapping the asset means changing one function (`MuscleMapScene.build()` / `createMannequin` geometry).

## Feature status

See the root [README](../README.md#what-works-today) for the authoritative working-vs-simulated table.
