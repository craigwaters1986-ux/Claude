// Live smoke test against the real Claude API (costs a few cents).
//   ANTHROPIC_API_KEY=... npm run smoke:ai
// Sends real requests through the full server path (auth → schema → Claude →
// safeguards) using the prototype's sample training history.
import Anthropic from '@anthropic-ai/sdk';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { trainingContext } from '../../prototype/js/core/ai.js';
import { seedSampleData } from '../../prototype/js/core/seed.js';
import { computeRecovery } from '../../prototype/js/core/recovery.js';
import { EXERCISE_BY_ID } from '../../prototype/js/core/exercises.js';

// Always talk to the public API here (ignore any ANTHROPIC_BASE_URL set by the host shell).
const client = new Anthropic({ baseURL: process.env.FORMA_ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com' });
const srv = createApp(client, { appTokens: ['smoke'], allowUnauthenticated: false, allowedOrigins: [], rateLimitPerMinute: 10, maxBodyBytes: 64 * 1024 });
await new Promise<void>((r) => srv.listen(0, r));
const url = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
const post = async (path: string, body: unknown) => {
  const t0 = Date.now();
  const r = await fetch(url + path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer smoke' }, body: JSON.stringify(body) });
  return { status: r.status, ms: Date.now() - t0, json: await r.json() as any };
};

const workouts = seedSampleData();
const profile = { goal: 'hypertrophy', experience: 'intermediate', location: 'gym', equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bench', 'rack', 'pullupBar'] };
const context = trainingContext({ workouts, recovery: computeRecovery(workouts), profile });
let ok = true;
try {
  console.log('1) Generate: 45-min back & biceps, knee restriction');
  const g = await post('/v1/workouts/generate', { input: { goal: 'hypertrophy', experience: 'intermediate', durationMin: 45, location: 'gym', equipment: profile.equipment, target: ['back', 'arms'], avoid: [], injuries: ['knee'], likes: [], dislikes: [] }, context });
  console.log(`   HTTP ${g.status} in ${(g.ms / 1000).toFixed(1)} s`);
  assert.equal(g.status, 200, JSON.stringify(g.json));
  const p = g.json.plan;
  console.log(`   “${p.name}” — ${p.exercises.length} exercises, ~${p.estimatedMinutes} min`);
  for (const e of p.exercises) console.log(`   • ${e.name}: ${e.sets} × ${e.reps.join('–')} @ ${e.suggestedWeightKg ?? 'self-selected'} kg — ${e.why[0] ?? ''}`);
  if (g.json.issues.length) console.log('   safeguards adjusted:', g.json.issues.join(' | '));
  assert.ok(p.exercises.length >= 2, 'non-trivial plan');
  for (const e of p.exercises) assert.ok(!EXERCISE_BY_ID[e.exerciseId].stress.includes('knee'), `${e.exerciseId} loads the knee`);
  assert.ok(p.estimatedMinutes <= 55, 'roughly fits 45 minutes');

  console.log('\n2) Coach: plateau question (grounded in history)');
  const c = await post('/v1/coach', { question: 'Why has my bench press stopped improving?', transcript: [], context, healthConnected: false });
  console.log(`   HTTP ${c.status} in ${(c.ms / 1000).toFixed(1)} s\n   ${String(c.json.text).replace(/\n+/g, '\n   ')}`);
  assert.equal(c.status, 200);
  assert.ok(/80|bench/i.test(c.json.text), 'answer references the logged bench data');

  console.log('\n3) Coach: asks for data it does not have');
  const h = await post('/v1/coach', { question: 'What was my HRV last night?', transcript: [], context, healthConnected: false });
  console.log(`   ${String(h.json.text).replace(/\n+/g, ' ')}`);
  assert.equal(h.status, 200);
  assert.ok(!/\b\d{2,3}\s?ms\b/.test(h.json.text), 'must not invent an HRV value');
  console.log('\nLive smoke test passed.');
} catch (e) {
  ok = false; console.error('\nFAILED:', (e as Error).message);
} finally { srv.close(); }
process.exit(ok ? 0 : 1);
