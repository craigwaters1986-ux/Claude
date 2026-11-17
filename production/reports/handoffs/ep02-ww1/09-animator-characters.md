# Handoff — ep02-ww1 — animator-characters (asset requests A-01 … A-06, A-S1)

- **From:** animator
- **To:** director (cc: video-editor, environment-designer)
- **Date:** 2026-11-17
- **Status:** COMPLETED

## Deliverables
- `the-human-story/episode-02-ww1/src/characters/cast.ts`: presets `sophie`, `tsarNicholas`, `lenin`, `foch`, `indianSoldier`, `usSoldier1918`, and the constant `FOCH_TAG` (Foch's tag wording, kept in one place).
- `the-human-story/episode-02-ww1/src/characters/Head.tsx`: new hats `pagri` (Indian Army turban) and `wideBrim` (1914 summer hat; a bun moves to the nape under it), new facial hair `shortBeard` and `goatee`, new expression `stare`.
- `the-human-story/episode-02-ww1/src/characters/poses.ts`: `seatedWave`, `orate`, `hugKnees`, and the modifier `tremble(base, f, amt?, seed?)`.
- `the-human-story/episode-02-ww1/src/characters/__preview__/SheetEp02.tsx` (+ registered in `PreviewRoot.tsx`): the lineup sheet composition `SheetEp02Cast`.
- `production/characters/ep02-ww1/sheet-ep02-cast.png`: the lineup sheet (scale 0.5, frame 40).

## Usage
All presets: `<StickFigure x y f {...castProps('name')} pose={...} head={{...CAST.name.head, expression: '...'}} />`, or use `castWith(name, headOverrides, outfitOverrides)`.

| Shot | Preset | Pose / props |
|---|---|---|
| S01-01, S03-01 | `sophie` (tag SOPHIE / his wife) | `pose={seatedWave(f)}`, seat height = half a leg (feet on the ground line); the gown folds onto the lap |
| S09-05 | `tsarNicholas` (TSAR NICHOLAS II / Emperor of Russia) | `const s = signDocument(f, {seated: true, deskX, deskY})`; `pose={s.pose}`, `overlayFront={(sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} />}`, `DocumentOnTable` |
| S09-06 | `lenin` (VLADIMIR LENIN / Bolshevik leader) | `pose={orate(f)}` + `talking`; cap variant: `castWith('lenin', {hat: 'flatCap', hatColor: '#2F2F33'})` |
| S10-02 | `foch` (label from `FOCH_TAG`) | `pose={point(f, 105)}` |
| S06-05 | `indianSoldier` (no tag) | `pose={march(f / 30)}`, `back={<RifleSlung />}` |
| S09-03 | `usSoldier1918` (no tag) | `pose={walk(f / 30)}`; the kit roll is built into the outfit (`blanketRoll`) |
| S05-04 | any soldier, e.g. `britSoldier1916` | `pose={tremble(hugKnees(f), f)}`, expression `'stare'`; `amt` 0–1.5 scales the jitter (0 = off, so it can be ramped down) |

## Summary
I built all six MUST presets and the approved SHOULD item, the `tremble` modifier. Everything is reusable library code in `src/characters/` only. All heads stay white. The pagri is a plain khaki wrapped dome with sloping layers, a small fan and a tail, with no jewel or badge, so identity comes from the uniform and hat alone. Real people carry yellow name tags. I checked one lineup sheet and fixed two things on it: the Tsar's beard shape and the busy pagri wrap lines. `npx tsc --noEmit` is clean.

## Changes to inputs / assumptions
- Sophie uses a new simple `wideBrim` hat rather than `bonnet`. The bonnet is Victorian, with a ribbon under the chin.
- Tsar Nicholas uses `slick` hair rather than `side`. The heavy `side` fringe merged with the beard into a mask.
- Foch's kepi band is a muted gold (#B08A3A) on a dark-blue crown. His moustache is mid-grey, so it reads on the white head.
- The US soldier's kitbag is the existing `blanketRoll` outfit option.

## Blockers / issues
- [minor] Foch's tag wording is pending the researcher. To change it, edit `FOCH_TAG` in `cast.ts` (e.g. "MARSHAL FERDINAND FOCH" if the shot is after August 1918).

## Requests for other agents
- video-editor: use the API in the table above. Sophie needs a car seat at about half a leg's height (`seated()` convention).

## Recommended next action
- Assemble S01, S03, S05-04, S06-05, S09-03, S09-05, S09-06 and S10-02 with these presets.
