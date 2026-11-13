import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign, createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type Anthropic from '@anthropic-ai/sdk';
import { issueSession, verifySession, verifyAppleIdentityToken, AuthError } from '../src/auth.js';
import { MemoryStore, PostgresStore, type SyncStore, type Change } from '../src/store.js';
import { createApp } from '../src/app.js';

const SECRET = 'test-secret-0123456789';
const DB = process.env.FORMA_TEST_DATABASE_URL ?? 'postgres://postgres:forma@localhost:5432/forma_test';

// ── Sign in with Apple test fixtures (our own RSA key standing in for Apple's) ──
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-kid', alg: 'RS256', use: 'sig' };
const jwks = async () => ({ keys: [jwk as any] });
function appleToken(claims: Record<string, unknown>, kid = 'test-kid') {
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const input = `${enc({ alg: 'RS256', kid })}.${enc({ iss: 'https://appleid.apple.com', aud: 'app.forma.Forma', exp: Math.floor(Date.now() / 1000) + 600, sub: '001234.abcd', ...claims })}`;
  return `${input}.${createSign('RSA-SHA256').update(input).sign(privateKey).toString('base64url')}`;
}

describe('auth', () => {
  test('session tokens round-trip and reject tampering/expiry', () => {
    const t = issueSession('user-1', SECRET);
    assert.equal(verifySession(t, SECRET), 'user-1');
    assert.throws(() => verifySession(t, 'other-secret'), AuthError);
    const [h, p, s] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url').toString()), sub: 'admin' })).toString('base64url');
    assert.throws(() => verifySession(`${h}.${forged}.${s}`, SECRET), AuthError);
    assert.throws(() => verifySession(issueSession('u', SECRET, 10, Date.now() - 60_000), SECRET), /expired/);
  });

  test('Apple identity token: valid, wrong audience, expired, unknown key, bad nonce', async () => {
    assert.equal(await verifyAppleIdentityToken(appleToken({}), { audience: 'app.forma.Forma', jwks }), '001234.abcd');
    await assert.rejects(verifyAppleIdentityToken(appleToken({ aud: 'com.evil' }), { audience: 'app.forma.Forma', jwks }), /audience/);
    await assert.rejects(verifyAppleIdentityToken(appleToken({ exp: 1 }), { audience: 'app.forma.Forma', jwks }), /expired/);
    await assert.rejects(verifyAppleIdentityToken(appleToken({}, 'other'), { audience: 'app.forma.Forma', jwks }), /unknown key/);
    const hashed = createHash('sha256').update('raw-nonce').digest('hex');
    assert.equal(await verifyAppleIdentityToken(appleToken({ nonce: hashed }), { audience: 'app.forma.Forma', jwks, nonce: 'raw-nonce' }), '001234.abcd');
    await assert.rejects(verifyAppleIdentityToken(appleToken({ nonce: hashed }), { audience: 'app.forma.Forma', jwks, nonce: 'other' }), /nonce/);
    await assert.rejects(verifyAppleIdentityToken(appleToken({ iss: 'https://evil' }), { audience: 'app.forma.Forma', jwks }), /issuer/);
  });
});

const w = (id: string, updatedAt: number, name = 'Push'): Change => ({ kind: 'workout', id, updatedAt, deleted: false, payload: { id, name } });

async function storeContract(name: string, make: () => Promise<SyncStore>) {
  describe(`store contract: ${name}`, () => {
    let s: SyncStore;
    after(async () => { await s?.close?.(); });

    test('push → pull with cursor, LWW, tombstones, isolation, pagination, delete', async () => {
      s = await make();
      const a = await s.userForDevDevice(`dev-a-${Date.now()}`);
      const b = await s.userForDevDevice(`dev-b-${Date.now()}`);

      assert.deepEqual(await s.push(a, [w('w1', 100), w('w2', 100)]), { applied: 2, stale: [] });
      const p1 = await s.pull(a, 0);
      assert.equal(p1.changes.length, 2); assert.equal(p1.more, false);
      assert.deepEqual((await s.pull(a, p1.cursor)).changes, [], 'nothing new after cursor');

      // Older write loses; newer write wins and re-appears after the cursor.
      assert.deepEqual((await s.push(a, [w('w1', 50, 'old')])).stale, [{ kind: 'workout', id: 'w1' }]);
      await s.push(a, [w('w1', 200, 'renamed')]);
      const p2 = await s.pull(a, p1.cursor);
      assert.deepEqual(p2.changes.map((c) => [c.id, (c.payload as any).name]), [['w1', 'renamed']]);

      // Tombstone
      await s.push(a, [{ kind: 'workout', id: 'w2', updatedAt: 300, deleted: true, payload: null }]);
      const p3 = await s.pull(a, p2.cursor);
      assert.equal(p3.changes[0].deleted, true); assert.equal(p3.changes[0].payload, null);
      assert.deepEqual((await s.exportAll(a)).map((c) => c.id), ['w1']);

      // Isolation between users
      assert.deepEqual((await s.pull(b, 0)).changes, []);

      // Pagination
      await s.push(b, Array.from({ length: 7 }, (_, i) => w(`p${i}`, 1)));
      const pg1 = await s.pull(b, 0, 5);
      assert.equal(pg1.changes.length, 5); assert.equal(pg1.more, true);
      const pg2 = await s.pull(b, pg1.cursor, 5);
      assert.equal(pg2.changes.length, 2); assert.equal(pg2.more, false);

      // Account deletion removes everything
      await s.deleteUser(b);
      const b2 = await s.userForDevDevice('fresh-device-' + Date.now());
      assert.deepEqual((await s.pull(b2, 0)).changes, []);
    });
  });
}

await storeContract('memory', async () => new MemoryStore());
let pgAvailable = true;
try { const probe = await PostgresStore.connect(DB); await probe.close(); } catch { pgAvailable = false; }
if (pgAvailable) await storeContract('postgres', () => PostgresStore.connect(DB));
else test('store contract: postgres', { skip: `no database at ${DB}` }, () => {});

describe('HTTP: accounts + sync', () => {
  const fakeAI = {} as Anthropic;
  async function withServer(fn: (url: string) => Promise<void>) {
    const srv = createApp(fakeAI, { appTokens: [], allowUnauthenticated: false, allowedOrigins: [], rateLimitPerMinute: 100, maxBodyBytes: 64 * 1024,
      sessionSecret: SECRET, store: new MemoryStore(), appleAudience: 'app.forma.Forma', appleJwks: jwks, allowDevLogin: true });
    await new Promise<void>((r) => srv.listen(0, r));
    try { await fn(`http://127.0.0.1:${(srv.address() as AddressInfo).port}`); } finally { srv.close(); }
  }
  const call = (url: string, method: string, path: string, body?: unknown, token?: string) =>
    fetch(url + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });

  test('Sign in with Apple → two devices converge → export → delete account', async () => {
    await withServer(async (url) => {
      assert.equal((await call(url, 'POST', '/v1/auth/apple', { identityToken: appleToken({ aud: 'x' }) })).status, 401);
      const { token, userId } = await (await call(url, 'POST', '/v1/auth/apple', { identityToken: appleToken({}) })).json() as any;
      const again = await (await call(url, 'POST', '/v1/auth/apple', { identityToken: appleToken({}) })).json() as any;
      assert.equal(again.userId, userId, 'same Apple user → same account');

      assert.equal((await call(url, 'POST', '/v1/sync', { cursor: 0 })).status, 401);
      // Phone pushes a workout
      const r1 = await (await call(url, 'POST', '/v1/sync', { cursor: 0, changes: [w('w1', 10)] }, token)).json() as any;
      assert.equal(r1.applied, 1); assert.equal(r1.changes.length, 1);
      // Second device (fresh cursor) receives it, edits it
      const r2 = await (await call(url, 'POST', '/v1/sync', { cursor: 0, changes: [w('w1', 20, 'Edited on iPad')] }, again.token)).json() as any;
      assert.equal(r2.changes.at(-1).payload.name, 'Edited on iPad');
      // Phone syncs from its cursor and converges
      const r3 = await (await call(url, 'POST', '/v1/sync', { cursor: r1.cursor }, token)).json() as any;
      assert.deepEqual(r3.changes.map((c: any) => c.payload.name), ['Edited on iPad']);

      const exp = await (await call(url, 'GET', '/v1/account/export', undefined, token)).json() as any;
      assert.equal(exp.records.length, 1);
      assert.equal((await call(url, 'DELETE', '/v1/account', undefined, token)).status, 204);
      const after = await (await call(url, 'POST', '/v1/auth/apple', { identityToken: appleToken({}) })).json() as any;
      assert.notEqual(after.userId, userId, 'deleted account is not resurrected');
      assert.equal(((await (await call(url, 'POST', '/v1/sync', { cursor: 0 }, after.token)).json()) as any).changes.length, 0);
    });
  });

  test('invalid sync payloads are rejected', async () => {
    await withServer(async (url) => {
      const { token } = await (await call(url, 'POST', '/v1/auth/dev', { deviceId: 'device-12345' })).json() as any;
      assert.equal((await call(url, 'POST', '/v1/sync', { cursor: -1 }, token)).status, 400);
      assert.equal((await call(url, 'POST', '/v1/sync', { changes: [{ kind: 'secrets', id: 'x', updatedAt: 1 }] }, token)).status, 400);
      assert.equal((await call(url, 'POST', '/v1/sync', { changes: Array.from({ length: 501 }, (_, i) => w(`x${i}`, 1)) }, token)).status, 400);
    });
  });
});
