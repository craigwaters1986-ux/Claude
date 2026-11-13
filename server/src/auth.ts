// Authentication: Sign in with Apple identity tokens → Forma session tokens.
//
// • Apple identity tokens are RS256 JWTs signed with keys published at
//   https://appleid.apple.com/auth/keys. We verify signature, issuer, audience
//   (the app's bundle id) and expiry using node:crypto only.
// • Forma session tokens are HS256 JWTs signed with FORMA_SESSION_SECRET.
//   They identify the user to /v1/sync and the AI endpoints. They are NOT AI keys.
import { createHmac, createPublicKey, createVerify, timingSafeEqual } from 'node:crypto';

type Jwk = { kid: string; kty: string; n?: string; e?: string; [k: string]: unknown };

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const fromB64url = (s: string) => Buffer.from(s, 'base64url');

export class AuthError extends Error {}

function decode(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('malformed token');
  try {
    return { header: JSON.parse(fromB64url(parts[0]).toString('utf8')), payload: JSON.parse(fromB64url(parts[1]).toString('utf8')), signingInput: `${parts[0]}.${parts[1]}`, signature: fromB64url(parts[2]) };
  } catch { throw new AuthError('malformed token'); }
}

// ── Forma session tokens ──────────────────────────────────────────────────
export function issueSession(userId: string, secret: string, ttlSeconds = 30 * 86_400, now = Date.now()): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ sub: userId, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + ttlSeconds, iss: 'forma' }));
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
  return `${header}.${payload}.${b64url(sig)}`;
}

export function verifySession(token: string, secret: string, now = Date.now()): string {
  const t = decode(token);
  if (t.header.alg !== 'HS256') throw new AuthError('bad alg');
  const expected = createHmac('sha256', secret).update(t.signingInput).digest();
  if (expected.length !== t.signature.length || !timingSafeEqual(expected, t.signature)) throw new AuthError('bad signature');
  if (t.payload.iss !== 'forma' || typeof t.payload.sub !== 'string') throw new AuthError('bad claims');
  if (t.payload.exp * 1000 < now) throw new AuthError('expired');
  return t.payload.sub;
}

// ── Sign in with Apple ───────────────────────────────────────────────────
export type JwksFetcher = () => Promise<{ keys: Jwk[] }>;

export const appleJwks: JwksFetcher = (() => {
  let cache: { at: number; value: { keys: Jwk[] } } | null = null;
  return async () => {
    if (cache && Date.now() - cache.at < 6 * 3_600_000) return cache.value;
    const r = await fetch('https://appleid.apple.com/auth/keys');
    if (!r.ok) throw new AuthError('could not fetch Apple keys');
    cache = { at: Date.now(), value: await r.json() as { keys: Jwk[] } };
    return cache.value;
  };
})();

/** Returns Apple's stable user id (`sub`) for a valid identity token. */
export async function verifyAppleIdentityToken(token: string, opts: { audience: string; jwks: JwksFetcher; now?: number; nonce?: string }): Promise<string> {
  const t = decode(token);
  if (t.header.alg !== 'RS256' || !t.header.kid) throw new AuthError('bad alg');
  const jwk = (await opts.jwks()).keys.find((k) => k.kid === t.header.kid);
  if (!jwk) throw new AuthError('unknown key');
  const ok = createVerify('RSA-SHA256').update(t.signingInput).verify(createPublicKey({ key: jwk, format: 'jwk' } as Parameters<typeof createPublicKey>[0]), t.signature);
  if (!ok) throw new AuthError('bad signature');
  const p = t.payload;
  const now = (opts.now ?? Date.now()) / 1000;
  if (p.iss !== 'https://appleid.apple.com') throw new AuthError('bad issuer');
  if (p.aud !== opts.audience) throw new AuthError('bad audience');
  if (typeof p.exp !== 'number' || p.exp < now) throw new AuthError('expired');
  if (opts.nonce && p.nonce !== opts.nonce) throw new AuthError('bad nonce');
  if (typeof p.sub !== 'string' || !p.sub) throw new AuthError('missing subject');
  return p.sub;
}
