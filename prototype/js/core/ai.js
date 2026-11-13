// Client side of the AI integration.
//
// The app NEVER holds an AI API key. If a backend endpoint is configured
// (Profile → AI), requests go to Forma's own server (server/), which holds the
// key, calls Claude, and validates output. Whatever comes back is validated
// AGAIN on device with the same rules as the offline engine. With no endpoint
// (or offline / error), the on-device engine answers instead.

import { generateWorkout, validatePlan } from './generator.js';
import { answer } from './coach.js';
import { exerciseHistory } from './metrics.js';
import { EXERCISES } from './exercises.js';

const TIMEOUT_MS = 25000;

async function post(endpoint, path, body) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(endpoint.replace(/\/$/, '') + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    if (!r.ok) throw new Error(`Server responded ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

/** Compact, privacy-minimised training summary sent to the server (no names, no notes). */
export function trainingContext({ workouts, recovery, profile }, { includeHistory = true } = {}) {
  const ids = [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)))];
  return {
    units: 'kg',
    profile: { goal: profile.goal, experience: profile.experience, location: profile.location, equipment: profile.equipment },
    recovery: recovery ? recovery.muscles.map((m) => ({ muscle: m.id, estimatedPct: m.pct, weeklySets: m.weeklySets, hoursToReady: m.hoursToReady })) : [],
    history: includeHistory ? ids.slice(0, 40).map((id) => ({ exerciseId: id, recent: exerciseHistory(workouts, id).slice(0, 4).map((h) => ({ date: new Date(h.date).toISOString().slice(0, 10), sets: h.sets.map((s) => [s.weightKg, s.reps, s.rpe ?? null]) })) })) : [],
    exerciseCatalog: EXERCISES.map((e) => e.id),
  };
}

export async function generate(input, ctx, profile) {
  const local = () => ({ ...generateWorkout(input, ctx), source: 'offline-engine' });
  if (!profile.aiCloud || !profile.aiEndpoint) return { plan: local(), issues: [], via: 'device' };
  try {
    const res = await post(profile.aiEndpoint, '/v1/workouts/generate', { input, context: trainingContext({ ...ctx, profile }, { includeHistory: profile.coachUsesHistory !== false }) });
    const v = validatePlan(res.plan, input, ctx);
    return { plan: { ...res.plan, ...v.plan, source: 'cloud-ai', input }, issues: v.issues, via: 'cloud' };
  } catch (e) {
    return { plan: local(), issues: [`Cloud AI unavailable (${e.message}); used the on-device engine.`], via: 'device' };
  }
}

export async function ask(question, ctx, profile, transcript = []) {
  if (!profile.aiCloud || !profile.aiEndpoint) return { ...answer(question, { ...ctx, profile }), via: 'device' };
  try {
    const res = await post(profile.aiEndpoint, '/v1/coach', { question, transcript: transcript.slice(-8), context: trainingContext({ ...ctx, profile }, { includeHistory: profile.coachUsesHistory !== false }), healthConnected: !!ctx.health });
    return { text: res.text, intent: 'cloud', grounded: res.grounded || [], via: 'cloud' };
  } catch (e) {
    const r = answer(question, { ...ctx, profile });
    return { ...r, text: `${r.text}\n\n(Cloud assistant unavailable — answered on device.)`, via: 'device' };
  }
}
