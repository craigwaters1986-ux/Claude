// Server-side safety layer. Reuses the app's own validatePlan so cloud output
// is held to exactly the same rules as the on-device engine (and the app
// re-validates again on receipt — defence in depth).
import { validatePlan } from '../../prototype/js/core/generator.js';
import { EXERCISE_BY_ID } from '../../prototype/js/core/exercises.js';
import type { GenerateRequest, PlanOutput } from './schemas.js';

type Workout = { id: string; startedAt: number; endedAt: number; exercises: { exerciseId: string; sets: object[] }[] };

/** Rebuild minimal workout objects from the compact history the app sends. */
export function historyToWorkouts(history: GenerateRequest['context']['history']): Workout[] {
  const byDate = new Map<string, Workout>();
  for (const h of history) {
    for (const s of h.recent) {
      const t = Date.parse(s.date);
      if (!Number.isFinite(t)) continue;
      const w = byDate.get(s.date) ?? { id: `h_${s.date}`, startedAt: t, endedAt: t + 3_600_000, exercises: [] };
      w.exercises.push({ exerciseId: h.exerciseId, sets: s.sets.map(([weightKg, reps, rpe]) => ({ type: 'working', weightKg, reps, rpe, done: true })) });
      byDate.set(s.date, w);
    }
  }
  return [...byDate.values()];
}

export interface SafePlan {
  name: string;
  exercises: Array<{ exerciseId: string; name: string; sets: number; reps: [number, number]; restSec: number; suggestedWeightKg: number | null; why: string[]; alternatives: string[]; instructions: string[]; targetMuscles: { primary: string[]; secondary: string[] } }>;
  notes: string[];
  warnings: string[];
  estimatedMinutes: number;
  source: 'cloud-ai';
}

export function applySafeguards(out: PlanOutput, req: GenerateRequest): { plan: SafePlan; issues: string[] } {
  const workouts = historyToWorkouts(req.context.history);
  const issues: string[] = [];
  const shaped = out.exercises.map((e) => {
    const repMin = clamp(e.repMin, 1, 30), repMax = clamp(Math.max(e.repMax, repMin), repMin, 30);
    const restSec = clamp(e.restSec, 20, 300);
    if (restSec !== e.restSec) issues.push(`Adjusted rest for ${e.exerciseId} to ${restSec}s.`);
    const ex = EXERCISE_BY_ID[e.exerciseId];
    return {
      exerciseId: e.exerciseId, name: ex?.name ?? e.exerciseId, sets: e.sets, reps: [repMin, repMax] as [number, number], restSec,
      suggestedWeightKg: e.suggestedWeightKg, why: e.why.slice(0, 4).map((w) => w.slice(0, 300)),
      alternatives: e.alternatives.filter((a) => a !== e.exerciseId).slice(0, 3),
      instructions: ex?.instructions ?? [], targetMuscles: { primary: ex?.primary ?? [], secondary: ex?.secondary ?? [] },
    };
  });
  const v = validatePlan({ exercises: shaped }, req.input, { workouts });
  return {
    plan: { name: out.name.slice(0, 80), exercises: v.plan.exercises, notes: out.notes.slice(0, 6).map((n) => n.slice(0, 400)), warnings: [], estimatedMinutes: v.plan.estimatedMinutes, source: 'cloud-ai' },
    issues: [...issues, ...v.issues],
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));
