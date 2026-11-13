// On-device workout generator ("Offline engine").
//
// A deterministic, explainable rules engine. It runs fully offline and is also
// the safety layer for the cloud AI: server responses are re-validated with
// `validatePlan` before they are shown (see server/src/safeguards.ts).

import { EXERCISES, EXERCISE_BY_ID, LOCATION_EQUIPMENT, hasEquipment, alternativesFor } from './exercises.js';
import { MUSCLE_BY_ID, expandGroups } from './muscles.js';
import { suggestNext, exerciseHistory } from './metrics.js';

export const GOALS = {
  hypertrophy: { label: 'Muscle growth', compound: { reps: [6, 10], sets: 3, rest: 120 }, isolation: { reps: [10, 15], sets: 3, rest: 75 } },
  strength:    { label: 'Strength',      compound: { reps: [3, 6], sets: 4, rest: 180 },  isolation: { reps: [6, 10], sets: 3, rest: 120 } },
  fatLoss:     { label: 'Fat loss',      compound: { reps: [10, 15], sets: 3, rest: 60 }, isolation: { reps: [12, 15], sets: 3, rest: 45 } },
  endurance:   { label: 'Endurance',     compound: { reps: [15, 20], sets: 2, rest: 45 }, isolation: { reps: [15, 25], sets: 2, rest: 30 } },
  general:     { label: 'General fitness', compound: { reps: [8, 12], sets: 3, rest: 90 }, isolation: { reps: [10, 15], sets: 2, rest: 60 } },
};

export const EXPERIENCE = {
  beginner:     { label: 'Beginner',     sessionCap: 6,  weeklyCap: 10, setMod: -1 },
  intermediate: { label: 'Intermediate', sessionCap: 9,  weeklyCap: 16, setMod: 0 },
  advanced:     { label: 'Advanced',     sessionCap: 12, weeklyCap: 20, setMod: 1 },
};

export const SPLITS = {
  fullBody:   { label: 'Full body', days: [{ name: 'Full Body', muscles: ['chest', 'lats', 'upperBack', 'quads', 'hamstrings', 'frontDelts', 'sideDelts', 'biceps', 'triceps', 'abs'] }] },
  upperLower: { label: 'Upper / Lower', days: [
    { name: 'Upper', muscles: ['chest', 'lats', 'upperBack', 'frontDelts', 'sideDelts', 'rearDelts', 'biceps', 'triceps'] },
    { name: 'Lower', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs', 'adductors'] }] },
  ppl: { label: 'Push / Pull / Legs', days: [
    { name: 'Push', muscles: ['chest', 'frontDelts', 'sideDelts', 'triceps'] },
    { name: 'Pull', muscles: ['lats', 'upperBack', 'rearDelts', 'biceps', 'traps'] },
    { name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] }] },
};

export const INJURY_TAGS = { shoulder: 'Shoulder', knee: 'Knee', lowerBack: 'Lower back', wrist: 'Wrist', elbow: 'Elbow' };

export function autoSplit(daysPerWeek) {
  if (daysPerWeek <= 3) return 'fullBody';
  if (daysPerWeek === 4) return 'upperLower';
  return 'ppl';
}

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function availableEquipment(input) {
  if (input.equipment && input.equipment.length) return input.location === 'bodyweight' ? [] : input.equipment;
  return LOCATION_EQUIPMENT[input.location || 'gym'];
}

export function isAllowed(ex, input, eq) {
  if (!hasEquipment(ex, eq)) return false;
  if ((input.injuries || []).some((t) => ex.stress.includes(t))) return false;
  if ((input.dislikes || []).includes(ex.id)) return false;
  const avoid = new Set(expandGroups(input.avoid || []));
  if (ex.primary.some((m) => avoid.has(m))) return false;
  return true;
}

const SET_SECONDS = 40;

export function estimateMinutes(items) {
  let s = 0;
  items.forEach((it, i) => {
    s += 60; // setup / transition
    if (i === 0 && EXERCISE_BY_ID[it.exerciseId]?.mechanics === 'compound') s += 180; // warm-up sets
    s += it.sets * SET_SECONDS + Math.max(0, it.sets - 1) * it.restSec + it.restSec * 0.5;
  });
  return Math.round(s / 60);
}

/**
 * Generate one session.
 * input: { goal, experience, durationMin, location, equipment, target, avoid,
 *          injuries, preferred, likes, dislikes, focusName, seed }
 * ctx:   { workouts, recovery (computeRecovery result), weeklyPlanned? }
 */
export function generateWorkout(input, ctx = {}) {
  const goal = GOALS[input.goal] || GOALS.hypertrophy;
  const exp = EXPERIENCE[input.experience] || EXPERIENCE.intermediate;
  const duration = input.durationMin || 45;
  const eq = availableEquipment(input);
  const rand = rng(input.seed ?? 7);
  const workouts = ctx.workouts || [];
  const rec = ctx.recovery?.byId || {};
  const notes = [];
  const warnings = [];

  const avoid = new Set(expandGroups(input.avoid || []));
  let targets = expandGroups(input.target && input.target.length ? input.target : []).filter((m) => !avoid.has(m));
  const autoTargeted = !targets.length;
  if (autoTargeted) {
    // Choose the freshest, least-trained muscles today.
    targets = Object.keys(MUSCLE_BY_ID).filter((m) => !avoid.has(m))
      .sort((a, b) => ((rec[b]?.pct ?? 100) - (rec[a]?.pct ?? 100)) || ((rec[a]?.weeklySets ?? 0) - (rec[b]?.weeklySets ?? 0)))
      .slice(0, 5);
    notes.push(`No target selected, so I picked your most-recovered muscles: ${targets.map((m) => MUSCLE_BY_ID[m].name).join(', ')}.`);
  }

  // Recovery gating.
  const fatigued = targets.filter((m) => (rec[m]?.pct ?? 100) < 40);
  const recovering = targets.filter((m) => { const p = rec[m]?.pct ?? 100; return p >= 40 && p < 70; });
  if (fatigued.length) {
    warnings.push(`Skipped ${fatigued.map((m) => MUSCLE_BY_ID[m].name).join(', ')} — estimated recovery below 40%.`);
    targets = targets.filter((m) => !fatigued.includes(m));
  }
  if (recovering.length) notes.push(`${recovering.map((m) => MUSCLE_BY_ID[m].name).join(', ')} ${recovering.length > 1 ? 'are' : 'is'} still recovering, so volume there is reduced.`);

  const overall = ctx.recovery?.overall ?? 100;
  const lighten = overall < 50;
  if (lighten) warnings.push(`Overall estimated recovery is ${overall}% — this is a lighter session (fewer sets, more reps in reserve).`);

  if ((input.injuries || []).length) {
    notes.push(`Excluded movements that load the ${(input.injuries).map((t) => INJURY_TAGS[t]?.toLowerCase() || t).join(' and ')}. This is not medical advice — stop any exercise that causes pain and consult a professional.`);
  }

  const items = [];
  const used = new Set();
  const cappedWeekly = new Set();
  const sessionSets = {};
  const weekly = (m) => (rec[m]?.weeklySets ?? 0) + (ctx.weeklyPlanned?.[m] ?? 0);

  const score = (ex, slot) => {
    let s = rand() * 0.5;
    if ((input.preferred || []).includes(ex.id) || (input.likes || []).includes(ex.id)) s += 3;
    if (slot === 'compound' && ex.mechanics === 'compound') s += 2;
    if (slot === 'isolation' && ex.mechanics === 'isolation') s += 1.5;
    if (exerciseHistory(workouts, ex.id).length) s += 1;
    for (const m of ex.secondary) if ((rec[m]?.pct ?? 100) < 40) s -= 2;
    if (input.location === 'bodyweight' && !ex.bodyweight) s -= 5;
    return s;
  };

  const sortedTargets = [...targets].sort((a, b) => MUSCLE_BY_ID[b].size - MUSCLE_BY_ID[a].size);
  const pickFor = (muscle, slot) => EXERCISES
    .filter((ex) => !used.has(ex.id) && ex.primary.includes(muscle) && isAllowed(ex, input, eq))
    .map((ex) => ({ ex, s: score(ex, slot) }))
    .sort((a, b) => b.s - a.s)[0]?.ex;

  const build = (ex, slot) => {
    const scheme = ex.mechanics === 'compound' ? goal.compound : goal.isolation;
    let sets = Math.max(2, scheme.sets + exp.setMod);
    if (lighten) sets = Math.max(2, Math.round(sets * 0.7));
    if (ex.primary.some((m) => recovering.includes(m))) sets = Math.max(2, sets - 1);
    for (const m of ex.primary) {
      const remainSession = exp.sessionCap - (sessionSets[m] || 0);
      const remainWeek = exp.weeklyCap - weekly(m) - (sessionSets[m] || 0);
      if (remainWeek < 2 && targets.includes(m)) cappedWeekly.add(m);
      sets = Math.min(sets, remainSession, remainWeek);
    }
    if (sets < 2) return null;
    const sug = suggestNext(workouts, ex.id, { repRange: scheme.reps });
    const why = [];
    why.push(`Targets ${ex.primary.map((m) => MUSCLE_BY_ID[m].name).join(' & ')}${ex.primary.map((m) => rec[m]?.pct).filter((x) => x != null).length ? ` (est. ${ex.primary.map((m) => rec[m]?.pct ?? 100).join('/')}% recovered)` : ''}.`);
    if ((input.likes || []).includes(ex.id) || (input.preferred || []).includes(ex.id)) why.push('You marked this as a preferred exercise.');
    why.push(sug.reason);
    return {
      exerciseId: ex.id, name: ex.name, sets, reps: scheme.reps, restSec: scheme.rest,
      targetMuscles: { primary: ex.primary, secondary: ex.secondary },
      suggestedWeightKg: sug.weightKg ?? null, suggestion: sug,
      instructions: ex.instructions,
      alternatives: alternativesFor(ex, { available: eq }).filter((a) => isAllowed(a, input, eq)).slice(0, 3).map((a) => a.id),
      why,
    };
  };

  // Pass 1: one compound per target (largest first); pass 2: isolations; repeat while time remains.
  for (const pass of ['compound', 'isolation', 'compound', 'isolation']) {
    for (const m of sortedTargets) {
      if ((sessionSets[m] || 0) >= exp.sessionCap) continue;
      if (pass === 'isolation' && MUSCLE_BY_ID[m].size >= 3 && (sessionSets[m] || 0) >= 6) continue;
      const ex = pickFor(m, pass);
      if (!ex) continue;
      const it = build(ex, pass);
      if (!it) continue;
      if (estimateMinutes([...items, it]) > duration + 2) continue;
      items.push(it); used.add(ex.id);
      for (const pm of ex.primary) sessionSets[pm] = (sessionSets[pm] || 0) + it.sets;
    }
  }

  // Order: compounds → bigger muscles → isolations.
  items.sort((a, b) => {
    const ea = EXERCISE_BY_ID[a.exerciseId], eb = EXERCISE_BY_ID[b.exerciseId];
    if (ea.mechanics !== eb.mechanics) return ea.mechanics === 'compound' ? -1 : 1;
    return MUSCLE_BY_ID[eb.primary[0]].size - MUSCLE_BY_ID[ea.primary[0]].size;
  });

  // Fat-loss / endurance: pair consecutive isolations into supersets to save time.
  if (input.goal === 'fatLoss' || input.goal === 'endurance') {
    let g = 1;
    for (let i = 0; i + 1 < items.length; i += 2) { items[i].superset = items[i + 1].superset = `S${g++}`; }
    if (g > 1) notes.push('Exercises are paired into supersets to keep your heart rate up and the session short.');
  }

  if (cappedWeekly.size) {
    warnings.push(`${[...cappedWeekly].map((m) => `${MUSCLE_BY_ID[m].name} (${Math.round(weekly(m))} sets)`).join(', ')} already reached the weekly cap of ${exp.weeklyCap} hard sets for your level, so no more direct work was added — extra volume now would add fatigue faster than results.`);
  }
  if (!items.length && !cappedWeekly.size) warnings.push('No exercises matched your equipment, restrictions and recovery. Try widening the equipment or target selection.');
  if (!items.length && cappedWeekly.size) notes.push('Pick different target muscles, or leave the target empty to let recovery choose.');

  const est = estimateMinutes(items);
  const focus = input.focusName || (autoTargeted ? 'Recovery-guided' : [...new Set(targets.map((m) => MUSCLE_BY_ID[m].name))].slice(0, 3).join(' · '));
  return {
    id: `gen_${Date.now().toString(36)}_${Math.floor(rand() * 1e6)}`,
    name: `${focus} — ${goal.label}`,
    goal: input.goal, durationMin: duration, estimatedMinutes: est,
    exercises: items, notes, warnings, source: 'offline-engine', input,
  };
}

/** Replace one exercise with an alternative that trains the same muscles. */
export function regenerateExercise(plan, index, ctx = {}) {
  const cur = plan.exercises[index]; if (!cur) return plan;
  const input = plan.input || {};
  const eq = availableEquipment(input);
  const usedIds = plan.exercises.map((e) => e.exerciseId);
  const tried = new Set([...(cur.triedIds || []), cur.exerciseId]);
  const ex = EXERCISE_BY_ID[cur.exerciseId];
  const options = alternativesFor(ex, { available: eq, exclude: usedIds }).filter((a) => isAllowed(a, input, eq) && !tried.has(a.id));
  if (!options.length) return { ...plan, notice: `No other alternatives for ${ex.name} with your equipment and restrictions.` };
  const pick = options[0];
  const scheme = (GOALS[input.goal] || GOALS.hypertrophy)[pick.mechanics === 'compound' ? 'compound' : 'isolation'];
  const sug = suggestNext(ctx.workouts || [], pick.id, { repRange: scheme.reps });
  const next = {
    ...cur, exerciseId: pick.id, name: pick.name, reps: scheme.reps, restSec: scheme.rest,
    targetMuscles: { primary: pick.primary, secondary: pick.secondary },
    suggestedWeightKg: sug.weightKg ?? null, suggestion: sug, instructions: pick.instructions,
    alternatives: alternativesFor(pick, { available: eq }).filter((a) => isAllowed(a, input, eq)).slice(0, 3).map((a) => a.id),
    why: [`Swapped in for ${ex.name} — same movement pattern / muscles.`, sug.reason],
    triedIds: [...tried],
  };
  const exercises = plan.exercises.slice(); exercises[index] = next;
  return { ...plan, exercises, estimatedMinutes: estimateMinutes(exercises), notice: null };
}

/** Swap one exercise for a specific alternative (validated against the same rules). */
export function swapExercise(plan, index, newId, ctx = {}) {
  const cur = plan.exercises[index]; const pick = EXERCISE_BY_ID[newId];
  const input = plan.input || {}; const eq = availableEquipment(input);
  if (!cur || !pick || !isAllowed(pick, input, eq)) return { ...plan, notice: 'That swap is not available with your equipment or restrictions.' };
  const scheme = (GOALS[input.goal] || GOALS.hypertrophy)[pick.mechanics === 'compound' ? 'compound' : 'isolation'];
  const sug = suggestNext(ctx.workouts || [], pick.id, { repRange: scheme.reps });
  const exercises = plan.exercises.slice();
  exercises[index] = { ...cur, exerciseId: pick.id, name: pick.name, reps: scheme.reps, restSec: scheme.rest,
    targetMuscles: { primary: pick.primary, secondary: pick.secondary }, suggestedWeightKg: sug.weightKg ?? null, suggestion: sug, instructions: pick.instructions,
    alternatives: [cur.exerciseId, ...alternativesFor(pick, { available: eq }).filter((a) => isAllowed(a, input, eq) && a.id !== cur.exerciseId).slice(0, 2).map((a) => a.id)],
    why: [`You swapped this in for ${cur.name}.`, sug.reason] };
  return { ...plan, exercises, estimatedMinutes: estimateMinutes(exercises), notice: null };
}

/** Full weekly programme. Future days assume recovery between sessions but respect weekly volume caps. */
export function generateProgram(input, ctx = {}) {
  const days = Math.min(6, Math.max(2, input.daysPerWeek || 3));
  const splitId = input.split && SPLITS[input.split] ? input.split : autoSplit(days);
  const split = SPLITS[splitId];
  const weeklyPlanned = {};
  const sessions = [];
  for (let d = 0; d < days; d++) {
    const day = split.days[d % split.days.length];
    const target = input.target?.length ? day.muscles.filter((m) => expandGroups(input.target).includes(m)) : day.muscles;
    const plan = generateWorkout({ ...input, target: target.length ? target : day.muscles, focusName: `Day ${d + 1}: ${day.name}`, seed: (input.seed ?? 7) + d * 31 },
      { workouts: ctx.workouts, recovery: { byId: {}, overall: 100 }, weeklyPlanned });
    for (const it of plan.exercises) for (const m of it.targetMuscles.primary) weeklyPlanned[m] = (weeklyPlanned[m] || 0) + it.sets;
    sessions.push(plan);
  }
  return {
    split: splitId, splitLabel: split.label, daysPerWeek: days, sessions, weeklySets: weeklyPlanned,
    rationale: [
      `${split.label} fits ${days} training days: each muscle is trained ${days >= 4 && splitId !== 'fullBody' ? 'about twice' : `${Math.min(days, 3)}×`} per week.`,
      `Weekly hard sets per muscle are capped at ${(EXPERIENCE[input.experience] || EXPERIENCE.intermediate).weeklyCap} for your experience level to limit overtraining risk.`,
    ],
  };
}

/**
 * Validate any plan (including one produced by the cloud model) against the
 * same safety rules. Returns { ok, issues[], plan } with unsafe items removed
 * and weights clamped.
 */
export function validatePlan(plan, input, ctx = {}) {
  const issues = [];
  const eq = availableEquipment(input);
  const exp = EXPERIENCE[input.experience] || EXPERIENCE.intermediate;
  const per = {};
  const kept = [];
  for (const it of plan.exercises || []) {
    const ex = EXERCISE_BY_ID[it.exerciseId];
    if (!ex) { issues.push(`Removed unknown exercise "${it.name || it.exerciseId}".`); continue; }
    if (!isAllowed(ex, input, eq)) { issues.push(`Removed ${ex.name}: conflicts with equipment, injuries or avoided muscles.`); continue; }
    const sets = Math.min(Math.max(1, it.sets | 0), 6);
    if (sets !== it.sets) issues.push(`Clamped ${ex.name} to ${sets} sets.`);
    let w = it.suggestedWeightKg;
    const hist = exerciseHistory(ctx.workouts || [], ex.id);
    if (w != null) {
      if (!hist.length) { issues.push(`Removed weight suggestion for ${ex.name}: no history to base it on.`); w = null; }
      else {
        const best = Math.max(...hist.slice(0, 5).map((h) => h.topWeight));
        if (w > best * 1.1) { issues.push(`Capped ${ex.name} weight at +10% over your recent best (${best} kg).`); w = Math.round(best * 1.1 * 2) / 2; }
      }
    }
    let capped = sets;
    for (const m of ex.primary) capped = Math.min(capped, exp.sessionCap - (per[m] || 0));
    if (capped < 1) { issues.push(`Removed ${ex.name}: session volume cap reached for ${ex.primary.map((m) => MUSCLE_BY_ID[m].name).join('/')}.`); continue; }
    for (const m of ex.primary) per[m] = (per[m] || 0) + capped;
    kept.push({ ...it, sets: capped, suggestedWeightKg: w });
  }
  return { ok: issues.length === 0, issues, plan: { ...plan, exercises: kept, estimatedMinutes: estimateMinutes(kept) } };
}
