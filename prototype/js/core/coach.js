// Smart Training Assistant — on-device engine.
//
// Answers are grounded ONLY in the user's logged workouts and the estimated
// recovery model. When data is missing the assistant says so instead of
// inventing it. The cloud assistant (server/) receives the same grounded
// context and follows the same rules; this engine is the offline fallback.

import { EXERCISES, EXERCISE_BY_ID, alternativesFor, LOCATION_EQUIPMENT } from './exercises.js';
import { MUSCLE_BY_ID, MUSCLE_GROUPS } from './muscles.js';
import { exerciseHistory, suggestNext, e1rm } from './metrics.js';
import { generateWorkout } from './generator.js';
import { rirOf } from './recovery.js';
import { fmtWeight, relDay } from './units.js';

const ALIASES = {
  bench: 'bench', 'bench press': 'bench', squat: 'squat', squats: 'squat', 'back squat': 'squat', 'barbell squat': 'squat', 'barbell squats': 'squat',
  deadlift: 'deadlift', deadlifts: 'deadlift', ohp: 'ohp', 'overhead press': 'ohp', 'shoulder press': 'dbShoulderPress', row: 'row', rows: 'row',
  'pull up': 'pullup', 'pull-up': 'pullup', pullups: 'pullup', 'pull-ups': 'pullup', curl: 'dbCurl', curls: 'dbCurl', rdl: 'rdl', 'leg press': 'legPress',
  'lat pulldown': 'latPulldown', pulldown: 'latPulldown', dips: 'dip', dip: 'dip', 'hip thrust': 'hipThrust', lunges: 'lunge', lunge: 'lunge',
};

const MUSCLE_WORDS = {
  chest: ['chest'], pecs: ['chest'], triceps: ['triceps'], tricep: ['triceps'], biceps: ['biceps'], bicep: ['biceps'], arms: MUSCLE_GROUPS.arms,
  shoulders: MUSCLE_GROUPS.shoulders, delts: MUSCLE_GROUPS.shoulders, back: ['lats', 'upperBack'], lats: ['lats'], legs: MUSCLE_GROUPS.legs,
  quads: ['quads'], hamstrings: ['hamstrings'], glutes: ['glutes'], calves: ['calves'], abs: ['abs'], core: MUSCLE_GROUPS.core, traps: ['traps'],
};

export function findExercise(text) {
  const t = text.toLowerCase();
  const byName = [...EXERCISES].sort((a, b) => b.name.length - a.name.length).find((e) => t.includes(e.name.toLowerCase()));
  if (byName) return byName;
  const alias = Object.keys(ALIASES).sort((a, b) => b.length - a.length).find((k) => new RegExp(`\\b${k}\\b`).test(t));
  return alias ? EXERCISE_BY_ID[ALIASES[alias]] : null;
}

export function findMuscles(text) {
  const t = text.toLowerCase(); const out = new Set();
  for (const [w, ms] of Object.entries(MUSCLE_WORDS)) if (new RegExp(`\\b${w}\\b`).test(t)) ms.forEach((m) => out.add(m));
  return [...out];
}

/**
 * @returns {{ text: string, cards?: object[], plan?: object, intent: string, grounded: string[] }}
 * `grounded` lists the data sources the answer used — shown in the UI.
 */
export function answer(question, ctx) {
  const q = question.trim();
  const lower = q.toLowerCase();
  const { workouts = [], recovery, profile = {}, health } = ctx;
  const units = profile.units || 'kg';
  const useHistory = profile.coachUsesHistory !== false;
  const hist = useHistory ? workouts : [];

  if (/\b(sleep|hrv|heart rate|resting hr|heart-rate)\b/.test(lower)) {
    if (!health) return { intent: 'health', grounded: [], text: "I don't have access to any Apple Health data — it isn't connected. You can connect it in Profile → Apple Health. Without it, recovery estimates are based on your training log only." };
    return { intent: 'health', grounded: ['health'], text: `From ${health.source === 'simulated' ? 'SIMULATED sample health data (not real HealthKit readings)' : 'Apple Health'}: sleep ${health.sleepHours?.toFixed(1) ?? '—'} h, resting HR ${health.restingHr ?? '—'} bpm, HRV ${health.hrv ?? '—'} ms. ${recovery?.health?.reasons?.length ? `These are slowing your estimated recovery slightly: ${recovery.health.reasons.join('; ')}.` : 'None of these are currently changing your recovery estimates.'} These signals are noisy day to day, so I only use them as a small adjustment.` };
  }

  if (/\b(build|create|make|generate|give me|plan)\b.*\b(workout|session|routine)\b|\b\d+\s*-?\s*min(ute)?s?\b.*\b(workout|session)\b/.test(lower)) {
    const muscles = findMuscles(lower);
    const dur = +(lower.match(/(\d{2,3})\s*-?\s*min/)?.[1] || profile.durationMin || 45);
    const plan = generateWorkout({ goal: profile.goal, experience: profile.experience, durationMin: dur, location: profile.location, equipment: profile.equipment,
      target: muscles, likes: ctx.likes, dislikes: ctx.dislikes, injuries: profile.injuries || [], seed: q.length }, { workouts: hist, recovery });
    return { intent: 'generate', grounded: ['history', 'recovery'], plan,
      text: `Here's a ${dur}-minute ${muscles.length ? muscles.map((m) => MUSCLE_BY_ID[m].name).filter((v, i, a) => a.indexOf(v) === i).join(' & ') : 'recovery-guided'} workout (est. ${plan.estimatedMinutes} min). ${[...plan.warnings, ...plan.notes].join(' ')}` };
  }

  if (/what (muscles?|should).*(train|work|hit).*today|train today|what.*today/.test(lower)) {
    if (!recovery || !hist.length) return { intent: 'today', grounded: [], text: "I don't have any logged workouts yet, so everything is assumed fresh. A full-body session is a great place to start." };
    const ready = recovery.muscles.filter((m) => m.status === 'ready').sort((a, b) => a.weeklySets - b.weeklySets);
    const tired = recovery.muscles.filter((m) => m.status === 'fatigued' || m.status === 'caution');
    const pick = ready.slice(0, 5).map((m) => m.name);
    return { intent: 'today', grounded: ['recovery', 'history'],
      text: `Best candidates today: ${pick.join(', ')} — estimated ≥90% recovered${ready[0] ? `, and ${ready[0].name.toLowerCase()} has had the fewest sets this week (${ready[0].weeklySets})` : ''}. ${tired.length ? `Give ${tired.map((m) => `${m.name.toLowerCase()} (${m.pct}%)`).join(', ')} more time.` : ''} Overall estimated recovery: ${recovery.overall}%. (Estimates, not measurements.)` };
  }

  if (/alternative|instead of|replace|substitute|swap/.test(lower)) {
    const ex = findExercise(lower);
    if (!ex) return { intent: 'alt', grounded: [], text: "Which exercise would you like an alternative for? e.g. 'alternative to barbell squats'." };
    const eq = profile.equipment?.length ? profile.equipment : LOCATION_EQUIPMENT[profile.location || 'gym'];
    const alts = alternativesFor(ex, { available: eq }).slice(0, 4);
    return { intent: 'alt', grounded: ['library'], cards: alts.map((a) => ({ exerciseId: a.id })),
      text: alts.length ? `Alternatives to ${ex.name} with your equipment: ${alts.map((a) => `${a.name} (${a.primary.map((m) => MUSCLE_BY_ID[m].name).join('/')})`).join('; ')}. ${alts[0].pattern === ex.pattern ? `${alts[0].name} uses the same movement pattern, so it's the closest swap.` : ''}` : `I couldn't find an alternative to ${ex.name} with your current equipment.` };
  }

  if (/how much|what weight|next session|attempt|should i lift/.test(lower)) {
    const ex = findExercise(lower);
    if (!ex) return { intent: 'next', grounded: [], text: 'Which exercise? e.g. "How much should I bench next session?"' };
    const h = exerciseHistory(hist, ex.id);
    if (!h.length) return { intent: 'next', grounded: ['history'], text: `You haven't logged ${ex.name} yet, so I can't base a number on your history. Start with a weight you could lift for 2–3 more reps than your target and I'll calibrate from your first session.` };
    const s = suggestNext(hist, ex.id, { repRange: profile.goal === 'strength' ? [3, 6] : [6, 10] });
    return { intent: 'next', grounded: ['history'], text: `Last ${ex.name} session (${relDay(h[0].date)}): ${h[0].sets.map((x) => `${fmtWeight(x.weightKg, units, { unit: false })}×${x.reps}`).join(', ')} ${units}. Suggestion: ${s.weightKg != null ? `${fmtWeight(s.weightKg, units)} for ${s.reps} reps` : `${s.reps} reps`}. ${s.reason}` };
  }

  if (/why|stall|plateau|stuck|not improving|stopped improving|progress/.test(lower)) {
    const ex = findExercise(lower);
    if (!ex) return { intent: 'plateau', grounded: [], text: 'Which lift has stalled? e.g. "Why has my bench press stopped improving?"' };
    return plateauAnalysis(ex, hist, recovery, units);
  }

  return { intent: 'help', grounded: [], text: 'I can build workouts ("45-minute chest and triceps workout"), tell you what to train today, find exercise alternatives, suggest your next weights, and analyse stalled lifts. I only use your logged workouts and estimated recovery — I never make up records.' };
}

export function plateauAnalysis(ex, workouts, recovery, units = 'kg') {
  const h = exerciseHistory(workouts, ex.id).slice(0, 10).reverse(); // oldest → newest
  if (h.length < 4) return { intent: 'plateau', grounded: ['history'], text: `I only have ${h.length} ${ex.name} session${h.length === 1 ? '' : 's'} logged — not enough to identify a trend yet. Keep logging for a few more weeks.` };
  const e = h.map((x) => x.bestE1rm || 0);
  const recent = e.slice(-4), earlier = e.slice(0, Math.max(1, e.length - 4));
  const change = (Math.max(...recent) - Math.max(...earlier)) / Math.max(...earlier);
  const reasons = [];
  const spanDays = (h[h.length - 1].date - h[0].date) / 86400000;
  const perWeek = (h.length - 1) / Math.max(1, spanDays / 7);
  const lastSets = h.slice(-3).flatMap((x) => x.sets);
  const rirs = lastSets.map(rirOf).filter((x) => x != null);
  const avgRir = rirs.length ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null;
  const sameScheme = h.slice(-4).every((x) => x.sets.length === h[h.length - 1].sets.length && x.topWeight === h[h.length - 1].topWeight);
  if (change > 0.02) return { intent: 'plateau', grounded: ['history'], text: `Good news: your estimated 1RM on ${ex.name} is still rising (+${(change * 100).toFixed(1)}% in your last 4 sessions vs before). Keep doing what you're doing.` };
  reasons.push(`Your best estimated 1RM has been flat at about ${fmtWeight(Math.max(...recent), units)} for your last ${recent.length} sessions (${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%).`);
  if (sameScheme) reasons.push(`You've used the same top weight (${fmtWeight(h[h.length - 1].topWeight, units)}) and set structure for 4 sessions — the stimulus isn't changing. Try adding one rep per session before adding weight, or switch to a 4×6 block for 3 weeks.`);
  if (avgRir != null && avgRir < 1.5) reasons.push(`Recent sets average ~${avgRir.toFixed(1)} reps in reserve — you're training very close to failure, which can build fatigue faster than fitness. Consider leaving 2 reps in the tank on most sets.`);
  if (perWeek < 1.2) reasons.push(`You bench about ${perWeek.toFixed(1)}× per week. A second, lighter session (e.g. paused or dumbbell press) often helps a stalled lift.`);
  const chestW = recovery?.byId?.[ex.primary[0]]?.weeklySets;
  if (chestW != null && chestW >= 18) reasons.push(`${MUSCLE_BY_ID[ex.primary[0]].name} volume is high (${chestW} sets this week) — more isn't always better; a deload week could help.`);
  reasons.push('Sleep, nutrition and overall stress also matter, but I can only see your training log, so I can\'t judge those.');
  return { intent: 'plateau', grounded: ['history', 'recovery'], text: reasons.join('\n\n'),
    chart: h.map((x) => ({ t: x.date, v: x.bestE1rm })) };
}

export { e1rm };
