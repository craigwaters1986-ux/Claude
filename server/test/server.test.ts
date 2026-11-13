import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type Anthropic from '@anthropic-ai/sdk';
import { createApp } from '../src/app.js';
import { PLAN_JSON_SCHEMA } from '../src/schemas.js';

type Reply = { stop_reason: string; text: string };
function fakeClient(reply: Reply | (() => Reply), seen: unknown[] = []) {
  return { beta: { messages: { create: async (params: unknown) => {
    seen.push(params);
    const r = typeof reply === 'function' ? reply() : reply;
    return { content: [{ type: 'text', text: r.text }], stop_reason: r.stop_reason };
  } } } } as unknown as Anthropic;
}

async function withServer(client: Anthropic, fn: (url: string) => Promise<void>, over: Partial<Parameters<typeof createApp>[1]> = {}) {
  const srv = createApp(client, { appTokens: ['secret-token'], allowUnauthenticated: false, allowedOrigins: ['http://localhost:5173'], rateLimitPerMinute: 50, maxBodyBytes: 64 * 1024, ...over });
  await new Promise<void>((r) => srv.listen(0, r));
  try { await fn(`http://127.0.0.1:${(srv.address() as AddressInfo).port}`); } finally { srv.close(); }
}

const body = {
  input: { goal: 'hypertrophy', experience: 'intermediate', durationMin: 45, location: 'gym', equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bench', 'rack'], target: ['chest'], avoid: [], injuries: ['knee'], likes: [], dislikes: [] },
  context: { recovery: [], history: [{ exerciseId: 'bench', recent: [{ date: '2026-11-10', sets: [[80, 8, 8], [80, 7, 9]] }] }] },
};
const post = (url: string, path: string, data: unknown, token = 'secret-token') =>
  fetch(url + path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(data) });

const plan = (exercises: object[]) => JSON.stringify({ name: 'Chest day', notes: ['n'], exercises });
const ex = (exerciseId: string, extra: object = {}) => ({ exerciseId, sets: 3, repMin: 6, repMax: 10, restSec: 120, suggestedWeightKg: null, why: ['w'], alternatives: [], ...extra });

test('rejects missing/invalid auth and malformed requests', async () => {
  await withServer(fakeClient({ stop_reason: 'end_turn', text: plan([]) }), async (url) => {
    assert.equal((await post(url, '/v1/workouts/generate', body, 'wrong')).status, 401);
    assert.equal((await post(url, '/v1/workouts/generate', { nope: 1 })).status, 400);
    assert.equal((await fetch(url + '/v1/other', { method: 'POST' })).status, 404);
  });
});

test('generation: request shape, fallbacks enabled, unsafe output stripped', async () => {
  const seen: any[] = [];
  const out = plan([ex('bench', { suggestedWeightKg: 140 }), ex('squat'), ex('cableFly', { sets: 20, suggestedWeightKg: 30, restSec: 900 })]);
  await withServer(fakeClient({ stop_reason: 'end_turn', text: out }, seen), async (url) => {
    const r = await post(url, '/v1/workouts/generate', body);
    assert.equal(r.status, 200);
    const j = await r.json() as any;
    assert.deepEqual(j.plan.exercises.map((e: any) => e.exerciseId), ['bench', 'cableFly'], 'knee-loading squat removed');
    assert.equal(j.plan.exercises[0].suggestedWeightKg, 88, 'capped to +10% of recent best');
    assert.equal(j.plan.exercises[1].suggestedWeightKg, null, 'no history → no weight');
    assert.ok(j.plan.exercises[1].sets <= 6 && j.plan.exercises[1].restSec <= 300);
    assert.ok(j.issues.length >= 3);
  });
  const p = seen[0];
  assert.equal(p.model, 'claude-opus-5-5');
  assert.equal(p.fallbacks, 'default');
  assert.ok(p.betas.includes('server-side-fallback-2026-07-01'));
  assert.equal(p.output_config.format.type, 'json_schema');
  assert.equal(p.system[0].cache_control.type, 'ephemeral');
  assert.ok(!('thinking' in p) && !('temperature' in p));
});

test('refusal, truncation and invalid JSON map to 503 + on-device fallback', async () => {
  for (const reply of [{ stop_reason: 'refusal', text: '' }, { stop_reason: 'max_tokens', text: '{"na' }, { stop_reason: 'end_turn', text: 'not json' }, { stop_reason: 'end_turn', text: plan([ex('hyperMegaPress')]) }]) {
    await withServer(fakeClient(reply), async (url) => {
      const r = await post(url, '/v1/workouts/generate', body);
      assert.equal(r.status, 503);
      assert.equal(((await r.json()) as any).fallback, 'on_device');
    });
  }
});

test('coach: grounded prompt and transcript normalisation', async () => {
  const seen: any[] = [];
  await withServer(fakeClient({ stop_reason: 'end_turn', text: ' Train back today. ' }, seen), async (url) => {
    const r = await post(url, '/v1/coach', { question: 'What should I train?', transcript: [{ role: 'bot', text: 'hi' }, { role: 'user', text: 'a' }, { role: 'bot', text: 'b' }], context: body.context, healthConnected: false });
    assert.equal(r.status, 200);
    assert.equal(((await r.json()) as any).text, 'Train back today.');
  });
  const m = seen[0].messages;
  assert.equal(m[0].role, 'user');
  assert.match(m.at(-1).content, /<health_connected>false<\/health_connected>/);
  assert.match(seen[0].system[0].text, /Never invent/);
});

test('rate limiting and body size limit', async () => {
  await withServer(fakeClient({ stop_reason: 'end_turn', text: 'ok' }), async (url) => {
    const q = { question: 'x', context: body.context };
    assert.equal((await post(url, '/v1/coach', q)).status, 200);
    assert.equal((await post(url, '/v1/coach', q)).status, 200);
    assert.equal((await post(url, '/v1/coach', q)).status, 429);
  }, { rateLimitPerMinute: 2 });
  await withServer(fakeClient({ stop_reason: 'end_turn', text: 'ok' }), async (url) => {
    const r = await post(url, '/v1/coach', { question: 'x'.repeat(200_000), context: body.context }).catch(() => ({ status: 413 }));
    assert.equal(r.status, 413);
  });
});

test('structured-output schema is strict', () => {
  const s = PLAN_JSON_SCHEMA as any;
  assert.equal(s.additionalProperties, false);
  assert.equal(s.properties.exercises.items.additionalProperties, false);
  assert.ok(s.properties.exercises.items.properties.exerciseId.enum.includes('bench'));
});

test('contract: the app client payload is accepted by the server schemas', async () => {
  const { trainingContext } = await import('../../prototype/js/core/ai.js');
  const { seedSampleData } = await import('../../prototype/js/core/seed.js');
  const { computeRecovery } = await import('../../prototype/js/core/recovery.js');
  const { GenerateRequest, CoachRequest } = await import('../src/schemas.js');
  const workouts = seedSampleData();
  const profile = { goal: 'hypertrophy', experience: 'intermediate', location: 'gym', equipment: ['barbell', 'dumbbell'] };
  const context = trainingContext({ workouts, recovery: computeRecovery(workouts), profile });
  const input = { mode: 'single', goal: 'strength', experience: 'advanced', durationMin: 60, location: 'gym', equipment: ['barbell'], target: ['chest'], avoid: [], daysPerWeek: 4, split: undefined, injuries: [], seed: 7, likes: [], dislikes: [] };
  const g = GenerateRequest.safeParse({ input, context });
  assert.ok(g.success, JSON.stringify(g.error?.issues?.slice(0, 3)));
  const transcript = [{ role: 'user', text: 'hi' }, { role: 'bot', text: 'hello', grounded: [], via: 'device' }];
  const c = CoachRequest.safeParse({ question: 'What should I train today?', transcript, context, healthConnected: false });
  assert.ok(c.success, JSON.stringify(c.error?.issues?.slice(0, 3)));
});
