# Handoff — ep01-ww2 — characters

- **From:** animator
- **To:** director (cc: video-editor, environment-designer, quality-control)
- **Date:** 2026-11-15
- **Status:** COMPLETED (all 24 requests built; partial notes below)

## Deliverables
Engine (`the-human-story/episode-01-ww2/src/characters/`):
- `skeleton.ts` (NEW): forward kinematics, 2-bone arm IK, world/local helpers.
- `poses.ts`: new poses (listed below). The existing poses are unchanged.
- `Head.tsx`: new hats, expressions `tired` and `solemn`, plus `eyesClosed`, back-of-head view, crowd LOD and `HatShape`.
- `StickFigure.tsx`: outfit options, back view, LOD, hat in the hand, waterline cut, prop overlays and `part` layering. New `GroupTag`.
- `cast.ts`: 27 new presets, `castWith()`, `castProps()` and `CROWD_POOLS`.
- `Crowd.tsx` (NEW), `interactions.tsx` (NEW: `Handshake`, `Hug`), `props.tsx` (NEW: hand props).
- `__preview__/` (verification only): `CharacterSheet.tsx`, `PreviewRoot.tsx`, `index.ts`. This is a separate entry; it is NOT registered in `Root.tsx`.

Previews (`production/characters/ep01-ww2/`):
- `sheet-SheetAsia.png`: A-01, A-02, A-03, A-09, A-17, A-23
- `sheet-SheetEurope.png`: A-04, A-05 outfits, A-10, A-11, A-12, A-19, A-22
- `sheet-SheetPoses-f35.png`, `sheet-SheetPoses-f60.png`: A-05 to A-07, A-13 to A-16, A-18, A-20, A-21, A-24
- `sheet-SheetCrowd.png`: A-08 (rally seen from behind, VE Day facing, 120-figure mixed finale)
- `sheet-SheetExpressions.png`: sombre expressions, `eyesClosed`, the Kaiser holding his pickelhaube, `sitGround`, `seated`

Re-render a sheet with: `npx remotion still src/characters/__preview__/index.ts <SheetId> out.png --frame=60`

## Request status
| ID | Status | API |
|---|---|---|
| A-01 | done | `CAST.japaneseSoldier` (field cap with neck flaps, puttees), `japaneseSoldierHelmet`, `japaneseOfficer` (plain peaked cap, shoulder boards). No sword. |
| A-02 | done | `chineseSoldier` (grey-blue), `chineseSoldierKhaki`, `chineseSoldierHelmet` (German-pattern helmet, as worn by some NRA divisions; prefer the cap version next to German troops) |
| A-03 | done | `japaneseMan`, `japaneseMan2`, `japaneseWoman` (work clothes), `japaneseWoman2` (plain dress), `japaneseChild`, `japaneseGirl`. Silhouettes: `opacity` or `limbColor`. |
| A-04 | done | `paratrooper` (M1 with `chinStrap`, `harness`) + `dangle(f)`. Rigging attaches at `shoulderWorld(placement, pose)`; risers can run through `handWorld(..., 'R'/'L')`. |
| A-05 | done | `survivor`, `survivorNoCap`; `survivorStand(f)`, `survivorSit(f)` (on a bench), `sitGround(f)`, `receiveBothHands(f, t)` with `<HeldItem kind="blanket" or "bread">` in `overlayFront`. Expressions: `neutral`, `sad`, `tired`, plus `eyesClosed`. No marks. |
| A-06 | done | `helmetToChest(f, t, kneeling?)` + `hatInHand={hatOff(t) ? {} : undefined}` (works with any hat; use it for the Kaiser's pickelhaube too). `headBowed(pose, amt)` + `eyesClosed`. Both work standing and kneeling. |
| A-07 | done | `signDocument(f, {seated, deskX, deskY, start, lookUps:[[a,b]]})` returns `{pose, lookingUp}`; `<Pen x={sk.armR.hx} y={sk.armR.hy}/>` in `overlayFront`; `<DocumentOnTable signed={0..1}/>`. Table tops: seated -92 (default), standing -118 (local px × scale above the ground line). |
| A-08 | done | `<Crowd f count x0 x1 yBack yFront scaleBack scaleFront pool mix view excitement sombre randomHats seed lod facing/>`. Pools: `germany1930s`, `britain1938`, `london1945`, `paris1944`, `congress1941`, `sailors`, `japan1945`, `china1937`, `finale`. `view`: `front` / `back` / `mixed`. `excitement` 0 makes everyone fall still (S03-09). LOD is automatic below scale 0.55. |
| A-09 | done | `japaneseDelegate`, `japaneseDelegate2` (`morningcoat` + `tophat`); pose with `standStiff(f)`. |
| A-10 | done | `germanOfficer` (grey peaked cap, plain shoulder boards, no insignia) |
| A-11 | done | `rafPilot` (pilot helmet, yellow `lifeVest`) + the existing `run(phase)` |
| A-12 | done | `medic` (US, red-cross helmet badge and armband), `medicBrit`, `nurse` (cap and apron) |
| A-13 | done | `<Handshake f x y start duration? gap? scale? a={...castProps('chamberlain')} b={...}/>`. Hands meet exactly through IK. Stiff timing: reach, 3 pumps, release (54 frames). Single-figure version: `handshake(f, t, reachX)`. |
| A-14 | done | `wade(phase, depth=70)`: set the figure `y` = water surface and `cutBelow={y}`. Rifle: `overlayTop={(sk)=> <RifleBetween a={{x:sk.armL.hx-20,y:sk.armL.hy}} b={{x:sk.armR.hx+30,y:sk.armR.hy}}/>}` |
| A-15 | done | `bucketChain(f/period + i*offset)` returns `{pose, holding}`; draw `<HeldItem kind="brick" or "bucket">` while `holding`. |
| A-16 | done | `<Hug f x y kind="comfort" or "embrace" adult={castProps('anna')} other={castProps('leo')} sway start/>` (layered so the arm passes behind the other figure's head). Tom lifting Leo is **not** built: compose it in the scene. |
| A-17 | done | `<GroupTag x y text="GERMAN DELEGATION" sub? scale?/>` (grey, from `StickFigure.tsx`) |
| A-18 | done | `crouchRun(phase)`, `takeCover(f)`, `kneelAim(f)` + `<RifleAim stock grip/>` (in `overlay`) |
| A-19 | done | `partyMember`: brown kepi with no emblem, brown tunic, plain red armband |
| A-20 | done | `paperWave(f)` + `holdR={<PaperSheet flutter/>}` until the cue frame. Then drop `holdR` and render `<FlyingPaper f start={cue} x0 y0 wind/>` (world space) with `{x0,y0} = handWorld(placement, paperWave(cue), 'R')`. |
| A-21 | done | `kneelSit(f)` (seiza, hands on thighs, head bowed) |
| A-22 | done | `ausSoldier` (slouch hat), `ausSoldierDesert`; also `britSoldierDesert` |
| A-23 | done | `usMarine` (`m1Camo`) |
| A-24 | done | `binocularsPose(f, t)` + `nearArmFront` + `overlayTop={(sk)=> <Binoculars head={sk.head} r={sk.d.R} t={t}/>}` |

**Counts:** must 8/8, should 12/12, could 4/4. Partial items: A-16 (no lift move), A-01 (no sword prop).

## Other API notes for the video-editor
- Spread presets with `{...castProps('key')}`, or override with `castWith('key', {expression:'sad'}, {color:'#...'})`.
- New `StickFigure` props:
  - `eyesClosed`
  - `fromBehind`
  - `lod: 'low'`
  - `hatInHand: {side, rot, dx, dy}`
  - `cutBelow` (world y)
  - `overlay`, `overlayFront` and `overlayTop` (each `(sk: Skeleton) => node`, in local figure space)
  - `nearArmFront`
  - `part: 'body' | 'head'`
- New poses: `standStiff`, `seated` (feet on the ground line; the existing `sit` leaves the feet 54 px up), `sitGround`, `cheerV`, `waveSide`, `keyPoses(t, [[t,pose],...])`.
- Use `cheerV` and `waveSide` rather than `cheer` and `wave` when the arms must read: straight-up arms are hidden behind the big head.
- Skeleton helpers (`skeleton.ts`): `solveSkeleton`, `reach(pose, 'R', target)` for arm IK onto any point, `handWorld`, `shoulderWorld`, `headWorld`, `toLocal`, `toWorld`.
- Grief scenes: use the `solemn`, `sad`, `tired` and `grief` expressions with `eyesClosed`, and `<Crowd sombre>`. Never use `angerMark`, `sweat` or `tear` there.
- Garments now fold onto the thighs automatically in seated and kneeling poses.
- Hirohito is not drawn. Hitler is always shown with his name tag and never from a heroic low angle (scene-level rules).

## Performance
- About 0.3 s/frame for a 15-figure sheet and about 1.5 s/frame for 210 figures (4 cores, including Remotion overhead).
- Crowd low LOD merges the limbs, hands, feet, brows and eyes into single paths. It uses no filters, no boil and no shadows.
- Keep crowd counts to what a shot needs: around 60 is usually enough at 0.35–0.6 scale.

## Blockers / issues
- [minor] Measurement stopped at the user's request: a timing test of an all-low-LOD crowd was running in the background and its result was not collected. No further optimisation was done.
- [minor] The Brodie helmet's strap line shows when the helmet is held at the chest. It is acceptable and reads as a strap.

## Requests for other agents
- video-editor: if you want the sheets in Studio, register the `__preview__` compositions; otherwise use the separate entry. Use the APIs above in the scenes.
- environment-designer (V-02): attach canopy lines at `shoulderWorld()`; the `dangle` hands sit on the front and rear risers.

## Recommended next action
- Video-editor builds the scenes with these presets. QC spot-checks the grief scenes (S09-02 to S09-05, S11-01) for sombre expressions.
