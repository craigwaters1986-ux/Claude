import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import type Anthropic from '@anthropic-ai/sdk';
import { CoachRequest, GenerateRequest } from './schemas.js';
import { AIUnavailable, coachAnswer, generatePlan } from './ai.js';
import { applySafeguards } from './safeguards.js';

export interface ServerConfig {
  /** App session tokens accepted (production: verify Sign in with Apple / your auth JWTs instead). */
  appTokens: string[];
  allowUnauthenticated: boolean;  // local development only
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  maxBodyBytes: number;
}

export function createApp(client: Anthropic, cfg: ServerConfig) {
  const buckets = new Map<string, { n: number; reset: number }>();

  const send = (res: ServerResponse, status: number, body: unknown, origin?: string) => {
    const headers: Record<string, string> = { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
    if (origin && (cfg.allowedOrigins.includes(origin) || cfg.allowedOrigins.includes('*'))) {
      headers['access-control-allow-origin'] = origin; headers['vary'] = 'origin';
      headers['access-control-allow-headers'] = 'content-type, authorization'; headers['access-control-allow-methods'] = 'POST, OPTIONS';
    }
    res.writeHead(status, headers).end(JSON.stringify(body));
  };

  const authed = (req: IncomingMessage): string | null => {
    const h = req.headers.authorization ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (token && cfg.appTokens.some((t) => t.length === token.length && timingSafeEqual(Buffer.from(t), Buffer.from(token)))) return `t:${token.slice(0, 8)}`;
    return cfg.allowUnauthenticated ? `ip:${req.socket.remoteAddress}` : null;
  };

  const limited = (key: string) => {
    const now = Date.now(); const b = buckets.get(key);
    if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + 60_000 }); return false; }
    return ++b.n > cfg.rateLimitPerMinute;
  };

  const readJson = (req: IncomingMessage) => new Promise<unknown>((resolve, reject) => {
    let size = 0; const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => { size += c.length; if (size > cfg.maxBodyBytes) { reject(new Error('too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('bad_json')); } });
    req.on('error', reject);
  });

  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (req.method === 'OPTIONS') return send(res, 204, {}, origin);
    if (req.method === 'GET' && req.url === '/healthz') return send(res, 200, { ok: true }, origin);
    if (req.method !== 'POST' || !['/v1/workouts/generate', '/v1/coach'].includes(req.url ?? '')) return send(res, 404, { error: 'not_found' }, origin);

    const who = authed(req);
    if (!who) return send(res, 401, { error: 'unauthorized' }, origin);
    if (limited(who)) return send(res, 429, { error: 'rate_limited' }, origin);

    let body: unknown;
    try { body = await readJson(req); } catch (e) { return send(res, (e as Error).message === 'too_large' ? 413 : 400, { error: (e as Error).message }, origin); }

    try {
      if (req.url === '/v1/workouts/generate') {
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
      // 503 tells the app to use its on-device engine instead.
      if (e instanceof AIUnavailable) return send(res, 503, { error: e.reason, fallback: 'on_device' }, origin);
      console.error('[forma] unexpected error', (e as Error).name);   // never log request bodies (health/fitness data)
      return send(res, 500, { error: 'internal' }, origin);
    }
  });
}
