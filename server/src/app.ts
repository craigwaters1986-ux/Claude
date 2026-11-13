import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CoachRequest, GenerateRequest } from './schemas.js';
import { AIUnavailable, coachAnswer, generatePlan } from './ai.js';
import { applySafeguards } from './safeguards.js';
import { AuthError, issueSession, verifyAppleIdentityToken, verifySession, type JwksFetcher } from './auth.js';
import { KINDS, type SyncStore } from './store.js';

export interface ServerConfig {
  /** Legacy static app tokens (AI endpoints only). Prefer session tokens from /v1/auth/*. */
  appTokens: string[];
  allowUnauthenticated: boolean;  // local development only (AI endpoints)
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  maxBodyBytes: number;
  sessionSecret?: string;         // required for accounts + sync
  store?: SyncStore;
  appleAudience?: string;         // iOS bundle id, e.g. app.forma.Forma
  appleJwks?: JwksFetcher;
  allowDevLogin?: boolean;        // /v1/auth/dev for the web prototype; never in production
}

const SyncBody = z.strictObject({
  cursor: z.number().int().min(0).default(0),
  changes: z.array(z.strictObject({
    kind: z.enum(KINDS), id: z.string().min(1).max(64),
    updatedAt: z.number().int().min(0), deleted: z.boolean().default(false),
    payload: z.unknown().nullable().default(null),
  })).max(500).default([]),
});

type Who = { key: string; userId?: string };

export function createApp(client: Anthropic, cfg: ServerConfig) {
  const buckets = new Map<string, { n: number; reset: number }>();

  const send = (res: ServerResponse, status: number, body: unknown, origin?: string) => {
    const headers: Record<string, string> = { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
    if (origin && (cfg.allowedOrigins.includes(origin) || cfg.allowedOrigins.includes('*'))) {
      headers['access-control-allow-origin'] = origin; headers['vary'] = 'origin';
      headers['access-control-allow-headers'] = 'content-type, authorization'; headers['access-control-allow-methods'] = 'GET, POST, DELETE, OPTIONS';
    }
    res.writeHead(status, headers).end(status === 204 ? undefined : JSON.stringify(body));
  };

  const identify = (req: IncomingMessage): Who | null => {
    const h = req.headers.authorization ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (token && cfg.sessionSecret && token.split('.').length === 3) {
      try { const userId = verifySession(token, cfg.sessionSecret); return { key: `u:${userId}`, userId }; } catch { /* fall through */ }
    }
    if (token && cfg.appTokens.some((t) => t.length === token.length && timingSafeEqual(Buffer.from(t), Buffer.from(token)))) return { key: `t:${token.slice(0, 8)}` };
    return cfg.allowUnauthenticated ? { key: `ip:${req.socket.remoteAddress}` } : null;
  };

  const limited = (key: string) => {
    const now = Date.now(); const b = buckets.get(key);
    if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + 60_000 }); return false; }
    return ++b.n > cfg.rateLimitPerMinute;
  };

  const readJson = (req: IncomingMessage, max: number) => new Promise<unknown>((resolve, reject) => {
    let size = 0; const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => { size += c.length; if (size > max) { reject(new Error('too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(new Error('bad_json')); } });
    req.on('error', reject);
  });

  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    const route = `${req.method} ${(req.url ?? '').split('?')[0]}`;
    if (req.method === 'OPTIONS') return send(res, 204, {}, origin);
    if (route === 'GET /healthz') return send(res, 200, { ok: true }, origin);

    const known = ['POST /v1/workouts/generate', 'POST /v1/coach', 'POST /v1/auth/apple', 'POST /v1/auth/dev', 'POST /v1/sync', 'GET /v1/account/export', 'DELETE /v1/account'];
    if (!known.includes(route)) return send(res, 404, { error: 'not_found' }, origin);
    const accounts = !!(cfg.store && cfg.sessionSecret);
    const ipKey = `ip:${req.socket.remoteAddress}`;

    let body: unknown = {};
    if (req.method === 'POST') {
      try { body = await readJson(req, route === 'POST /v1/sync' ? 2 * 1024 * 1024 : cfg.maxBodyBytes); }
      catch (e) { return send(res, (e as Error).message === 'too_large' ? 413 : 400, { error: (e as Error).message }, origin); }
    }

    try {
      // ── Sign-in (public, rate limited per IP) ──────────────────────────
      if (route === 'POST /v1/auth/apple' || route === 'POST /v1/auth/dev') {
        if (!accounts) return send(res, 501, { error: 'accounts_disabled' }, origin);
        if (limited(ipKey)) return send(res, 429, { error: 'rate_limited' }, origin);
        let userId: string;
        if (route === 'POST /v1/auth/apple') {
          const p = z.object({ identityToken: z.string().max(4096), nonce: z.string().max(128).optional() }).safeParse(body);
          if (!p.success || !cfg.appleAudience || !cfg.appleJwks) return send(res, 400, { error: 'invalid_request' }, origin);
          const sub = await verifyAppleIdentityToken(p.data.identityToken, { audience: cfg.appleAudience, jwks: cfg.appleJwks, nonce: p.data.nonce });
          userId = await cfg.store!.userForApple(sub);
        } else {
          if (!cfg.allowDevLogin) return send(res, 403, { error: 'dev_login_disabled' }, origin);
          const p = z.object({ deviceId: z.string().min(8).max(64) }).safeParse(body);
          if (!p.success) return send(res, 400, { error: 'invalid_request' }, origin);
          userId = await cfg.store!.userForDevDevice(p.data.deviceId);
        }
        return send(res, 200, { token: issueSession(userId, cfg.sessionSecret!), userId }, origin);
      }

      const who = identify(req);
      if (!who) return send(res, 401, { error: 'unauthorized' }, origin);
      if (limited(who.key)) return send(res, 429, { error: 'rate_limited' }, origin);

      // ── Account + sync (session required) ─────────────────────────────
      if (route === 'POST /v1/sync' || route === 'GET /v1/account/export' || route === 'DELETE /v1/account') {
        if (!accounts) return send(res, 501, { error: 'accounts_disabled' }, origin);
        if (!who.userId) return send(res, 401, { error: 'session_required' }, origin);
        if (route === 'DELETE /v1/account') { await cfg.store!.deleteUser(who.userId); return send(res, 204, null, origin); }
        if (route === 'GET /v1/account/export') return send(res, 200, { exportedAt: new Date().toISOString(), records: await cfg.store!.exportAll(who.userId) }, origin);
        const p = SyncBody.safeParse(body);
        if (!p.success) return send(res, 400, { error: 'invalid_request' }, origin);
        const pushed = await cfg.store!.push(who.userId, p.data.changes.map((c) => ({ ...c, payload: c.payload ?? null })));
        const pulled = await cfg.store!.pull(who.userId, p.data.cursor);
        return send(res, 200, { ...pulled, applied: pushed.applied, stale: pushed.stale }, origin);
      }

      // ── AI ─────────────────────────────────────────────────────────────
      if (route === 'POST /v1/workouts/generate') {
        const parsed = GenerateRequest.safeParse(body);
        if (!parsed.success) return send(res, 400, { error: 'invalid_request' }, origin);
        const out = await generatePlan(client, parsed.data);
        const { plan, issues } = applySafeguards(out, parsed.data);
        return send(res, 200, { plan, issues }, origin);
      }
      const parsed = CoachRequest.safeParse(body);
      if (!parsed.success) return send(res, 400, { error: 'invalid_request' }, origin);
      const text = await coachAnswer(client, parsed.data);
      return send(res, 200, { text, grounded: parsed.data.context.history.length ? ['history', 'recovery'] : ['recovery'] }, origin);
    } catch (e) {
      if (e instanceof AuthError) return send(res, 401, { error: 'invalid_identity_token' }, origin);
      // 503 tells the app to use its on-device engine instead.
      if (e instanceof AIUnavailable) return send(res, 503, { error: e.reason, fallback: 'on_device' }, origin);
      console.error('[forma] unexpected error', (e as Error).name);   // never log request bodies (health/fitness data)
      return send(res, 500, { error: 'internal' }, origin);
    }
  });
}
