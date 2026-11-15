# Animator — durable lessons
- The big head (R 44) hides any arm raised within ~45° of vertical. For raised-arm poses keep the shoulder angle around 100–125 (forward) or 235–260 (back), or use `nearArmFront`. `cheerV` and `waveSide` exist for this reason.
- Use `reach()` / `armIK` from `skeleton.ts` for hands that must hit a point (handshake, table, partner's shoulder). `elbowDown=true` picks the lower elbow. For "hands together at the waist", explicit angles look better than IK.
- For two-figure overlaps (an arm around someone), render with `part="body"`, then the other figure, then `part="head"`.
- Seated/kneeling garments fold onto the thigh automatically (average hip angle > 55).
- `seated()` puts the feet on the ground line (bob 54); the legacy `sit()` does not.
- Preview without touching Root.tsx: `src/characters/__preview__/index.ts` plus `npx remotion still <entry> <Id> out.png`. JSX must be in a .tsx file, not index.ts.
- Render cost: ~0.3 s/frame for 15 figures and ~1.5 s/frame for 210 (4 cores). Crowds dominate, so keep counts modest.
- The user is token-conscious: one contact sheet and one tsc pass at the end; avoid repeated re-renders.
