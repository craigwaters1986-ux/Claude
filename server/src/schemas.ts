import { z } from 'zod';
// Single source of truth for exercise IDs and safety rules: the same modules the app runs.
import { EXERCISES } from '../../prototype/js/core/exercises.js';

export const EXERCISE_IDS = EXERCISES.map((e: { id: string }) => e.id) as [string, ...string[]];

const MuscleGroup = z.enum(['chest', 'shoulders', 'arms', 'back', 'core', 'legs']);

/** What the app sends to /v1/workouts/generate (minimal, no personal identifiers). */
export const GenerateRequest = z.strictObject({
  input: z.object({
    goal: z.enum(['hypertrophy', 'strength', 'fatLoss', 'endurance', 'general']),
    experience: z.enum(['beginner', 'intermediate', 'advanced']),
    durationMin: z.number().int().min(15).max(120),
    location: z.enum(['gym', 'home', 'bodyweight']),
    equipment: z.array(z.string().max(20)).max(12).default([]),
    target: z.array(MuscleGroup).max(6).default([]),
    avoid: z.array(MuscleGroup).max(6).default([]),
    injuries: z.array(z.enum(['shoulder', 'knee', 'lowerBack', 'wrist', 'elbow'])).max(5).default([]),
    likes: z.array(z.string().max(40)).max(50).default([]),
    dislikes: z.array(z.string().max(40)).max(50).default([]),
  }).passthrough(),
  context: z.object({
    units: z.string().optional(),
    profile: z.record(z.string(), z.unknown()).optional(),
    recovery: z.array(z.object({ muscle: z.string(), estimatedPct: z.number(), weeklySets: z.number(), hoursToReady: z.number() })).max(30).default([]),
    history: z.array(z.object({
      exerciseId: z.string().max(40),
      recent: z.array(z.object({ date: z.string().max(10), sets: z.array(z.tuple([z.number().nullable(), z.number().nullable(), z.number().nullable()])).max(20) })).max(5),
    })).max(60).default([]),
    exerciseCatalog: z.array(z.string()).optional(),
  }),
});
export type GenerateRequest = z.infer<typeof GenerateRequest>;

export const CoachRequest = z.strictObject({
  question: z.string().min(1).max(1000),
  transcript: z.array(z.object({ role: z.enum(['user', 'bot']), text: z.string().max(4000) })).max(12).default([]),
  context: GenerateRequest.shape.context,
  healthConnected: z.boolean().default(false),
});
export type CoachRequest = z.infer<typeof CoachRequest>;

/**
 * Model output contract (structured outputs). Numeric bounds are enforced
 * afterwards by zod + safeguards, not by the JSON schema.
 */
export const PlanOutput = z.strictObject({
  name: z.string(),
  exercises: z.array(z.strictObject({
    exerciseId: z.enum(EXERCISE_IDS),
    sets: z.number().int(),
    repMin: z.number().int(),
    repMax: z.number().int(),
    restSec: z.number().int(),
    suggestedWeightKg: z.number().nullable(),
    why: z.array(z.string()),
    alternatives: z.array(z.enum(EXERCISE_IDS)),
  })),
  notes: z.array(z.string()),
});
export type PlanOutput = z.infer<typeof PlanOutput>;

export const PLAN_JSON_SCHEMA = z.toJSONSchema(PlanOutput, { target: 'draft-7' }) as Record<string, unknown>;
