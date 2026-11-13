// iPhone ↔ server contract (see ios/GymCore/Tests/GymCoreTests/CloudContractTests.swift).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import type Anthropic from '@anthropic-ai/sdk';
import { GenerateRequest, CoachRequest } from '../src/schemas.js';
import { createApp } from '../src/app.js';

const dir = new URL('../../tests/fixtures/cloud/', import.meta.url);
const read = (f: string) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

test('Swift-encoded requests pass the server schemas', () => {
  const g = GenerateRequest.safeParse(read('generate-request.swift.json'));
  assert.ok(g.success, JSON.stringify(g.error?.issues));
  assert.deepEqual(g.data!.input.target, ['arms', 'chest']);
  assert.equal(g.data!.context.history[0].exerciseId, 'bench');
  const c = CoachRequest.safeParse(read('coach-request.swift.json'));
  assert.ok(c.success, JSON.stringify(c.error?.issues));
});

test('server response fixture is current (decoded by the Swift contract test)', async () => {
  const model = JSON.stringify({ name: 'Chest & Triceps', notes: ['Knee-friendly selection.'], exercises: [
    { exerciseId: 'bench', sets: 3, repMin: 6, repMax: 10, restSec: 120, suggestedWeightKg: 82.5, why: ['Main chest lift; +2.5 kg from 80×8.'], alternatives: ['dbBench'] },
    { exerciseId: 'tricepPushdown', sets: 3, repMin: 10, repMax: 15, restSec: 75, suggestedWeightKg: null, why: ['Direct triceps work.'], alternatives: [] },
  ] });
  const client = { beta: { messages: { create: async () => ({ content: [{ type: 'text', text: model }], stop_reason: 'end_turn' }) } } } as unknown as Anthropic;
  const srv = createApp(client, { appTokens: ['t'], allowUnauthenticated: false, allowedOrigins: [], rateLimitPerMinute: 10, maxBodyBytes: 64 * 1024 });
  await new Promise<void>((r) => srv.listen(0, r));
  const res = await fetch(`http://127.0.0.1:${(srv.address() as AddressInfo).port}/v1/workouts/generate`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer t' }, body: JSON.stringify(read('generate-request.swift.json')) });
  srv.close();
  assert.equal(res.status, 200);
  const body = await res.json();
  const file = new URL('generate-response.server.json', dir);
  if (process.env.FORMA_WRITE_FIXTURES === '1' || !existsSync(file)) writeFileSync(file, JSON.stringify(body, null, 2) + '\n');
  assert.deepEqual(body, JSON.parse(readFileSync(file, 'utf8')), 'server response shape changed — regenerate fixtures and re-run the Swift contract test');
});
