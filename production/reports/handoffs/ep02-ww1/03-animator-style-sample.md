# Handoff — ep02-ww1 — style-sample

- **From:** animator
- **To:** director (cc: environment-designer, storyboard)
- **Date:** 2026-11-16
- **Status:** AWAITING REVIEW (checkpoint 2: user approval of the WW1 style)

## Deliverables
- `production/characters/ep02-ww1/style-sample.png` — 1920×1080 style-sample still (WW1 cast in a stand-in trench).
- `the-human-story/episode-02-ww1/` — Episode 2 engine, copied from ep01 (no node_modules/output/audio; ~1.6 MB). `npm install` done (node_modules git-ignored; `output/` added to its `.gitignore`).
- Character library additions (engine `src/characters/`):
  - `Head.tsx` — new hats `serviceCap` (British 1914 / Russian furazhka), `kepi1914` (French red/blue), `feldkappe` (Austro-Hungarian), `kabalak` (Ottoman), `papakha` (Russian winter), `mobCap` (munitionette), `vadVeil` (VAD), `plumedHat` (Franz Ferdinand); `gasMask` head option (facepiece, glass eyepieces, valve, ribbed hose; brows stay visible); pickelhaube spike colour via `hatAccent`.
  - `StickFigure.tsx` — outfit options `trousers` (French 1914 red trousers), `apronCross`, `blanketRoll` (Russian greatcoat roll), `satchel` (respirator haversack).
  - `props.tsx` — `RifleSlung` (for the `back` prop), `RifleInHand`, `Shell` (artillery shell).
  - `cast.ts` — presets `britSoldier1914`, `britSoldier1916`, `britGasMask`, `frenchSoldier1914`, `frenchSoldier1915`, `germanSoldier1914`, `germanSoldier1916`, `russianSoldier`, `russianWinter`, `austroSoldier`, `ottomanSoldier`, `vadNurse`, `munitionette`, plus labelled `princip` and `franzFerdinand`. Existing `kaiser` preset kept.
  - `__preview__/SheetWW1.tsx` (`StyleSampleWW1`, registered in the preview root): `npx remotion still src/characters/__preview__/index.ts StyleSampleWW1 out.png --frame=40`.

## Summary
Built the WW1 wardrobe on the existing rig without changing the core style: same white heads, line weights and poses. Uniforms follow research-notes §9: British khaki with cap and puttees (1914) and Brodie (1916); French dark-blue greatcoat with red trousers and kepi (1914) and horizon blue with Adrian helmet (1915); German field grey with covered Pickelhaube and boots (1914) and Stahlhelm (1916); Russian khaki with greatcoat roll; Austro-Hungarian pike-grey with field cap; Ottoman khaki with kabalak; VAD nurse with red-cross apron and veil; munitionette in overall coat and mob cap holding a shell; and a gas-mask soldier. The sample shows varied poses (march, charge, kneel-aim, cower, talk) and expressions. `npx tsc --noEmit` is clean.

## Changes to inputs / assumptions
- No trench background exists in the library. The sample uses a simple inline stand-in (sandbags, posts, wire, duckboards) inside the preview file only. The real trench set belongs to the environment-designer.
- Munitionette "canary" yellow skin tint NOT applied: the house style keeps every head white. Suggest showing it through narration or labels instead.
- Name tags: "GAVRILO PRINCIP — Bosnian Serb, aged 19"; "ARCHDUKE FRANZ FERDINAND — Heir to Austria-Hungary" (research §3.1–3.2).

## Blockers / issues
- [minor] Simplifications: the kabalak reads as a wrapped dome; Franz Ferdinand's plumed general's hat is simplified (dark hat with green plumes); the Russian gymnastyorka uses the generic tunic with centre buttons. All are fine at this scale. Refine if a close-up needs it.
- [minor] Rifles slung on the back show only the muzzle behind the shoulder (the big head hides the rest). Use `RifleAim`/`RifleBetween` when the rifle matters.

## Requests for other agents
- environment-designer: WW1 trench set (firestep, sandbags, duckboards, wire, periscope) for the library; the style sample's stand-in can serve as a colour reference.

## Recommended next action
- Director: present `style-sample.png` to the user for checkpoint 2 (batched with the script in Lean mode).
