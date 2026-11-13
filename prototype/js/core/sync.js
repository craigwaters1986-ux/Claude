// Client sync (offline-first). Pure functions + one network call.
//
// Change detection is diff-based: we remember a hash of every entity as of the
// last successful sync (`meta`). Anything whose hash differs is pushed;
// anything that disappeared becomes a tombstone. The server resolves
// conflicts last-writer-wins and returns everything after our cursor.
// Analogy: like comparing your notebook against a photocopy taken last time —
// only the pages that changed get posted.

export const KINDS = ['workout', 'template', 'customExercise', 'profile'];

export function hash(obj) {
  const s = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

const SYNCED_PROFILE_KEYS = ['name', 'goal', 'experience', 'days', 'equipment', 'location', 'units', 'durationMin', 'restDefaultSec', 'injuries'];

/** Current local entities keyed "kind:id". Active workouts and sample data are never synced. */
export function entities(state) {
  const out = {};
  for (const w of state.workouts) if (w.endedAt && !w.sample) out[`workout:${w.id}`] = w;
  for (const t of state.templates) if (!['tpl_push', 'tpl_pull', 'tpl_legs'].includes(t.id)) out[`template:${t.id}`] = t;
  for (const e of state.customExercises) out[`customExercise:${e.id}`] = e;
  out['profile:me'] = Object.fromEntries(SYNCED_PROFILE_KEYS.map((k) => [k, state.profile[k]]));
  return out;
}

export function collectChanges(state, now = Date.now()) {
  const meta = state.sync?.meta || {};
  const ents = entities(state);
  const changes = [];
  for (const [key, val] of Object.entries(ents)) {
    const h = hash(val);
    if (meta[key]?.hash !== h) { const [kind, id] = split(key); changes.push({ kind, id, updatedAt: Math.max(now, (meta[key]?.updatedAt ?? 0) + 1), deleted: false, payload: val }); }
  }
  for (const key of Object.keys(meta)) {
    if (!(key in ents) && !meta[key].deleted) { const [kind, id] = split(key); changes.push({ kind, id, updatedAt: Math.max(now, meta[key].updatedAt + 1), deleted: true, payload: null }); }
  }
  return changes;
}

/** Apply server changes to a cloned state; returns the new state. */
export function applyRemote(state, remote, pushed = []) {
  const s = structuredClone(state);
  s.sync ||= {}; s.sync.meta ||= {};
  const pushedAt = Object.fromEntries(pushed.map((c) => [`${c.kind}:${c.id}`, c.updatedAt]));
  for (const c of remote) {
    const key = `${c.kind}:${c.id}`;
    // A local edit newer than this remote version (made since collect) wins; it will be pushed next time.
    if ((pushedAt[key] ?? 0) > c.updatedAt) continue;
    if (c.kind === 'workout') upsert(s.workouts, c);
    else if (c.kind === 'template') upsert(s.templates, c);
    else if (c.kind === 'customExercise') upsert(s.customExercises, c);
    else if (c.kind === 'profile' && !c.deleted && c.payload) s.profile = { ...s.profile, ...c.payload };
    s.sync.meta[key] = { hash: c.deleted ? null : hash(c.kind === 'profile' ? entities(s)['profile:me'] : c.payload), updatedAt: c.updatedAt, deleted: c.deleted };
  }
  // Everything we pushed is now in sync too.
  const ents = entities(s);
  for (const c of pushed) {
    const key = `${c.kind}:${c.id}`;
    s.sync.meta[key] = c.deleted ? { hash: null, updatedAt: c.updatedAt, deleted: true } : { hash: hash(ents[key] ?? c.payload), updatedAt: c.updatedAt, deleted: false };
  }
  return s;
}

function upsert(list, c) {
  const i = list.findIndex((x) => x.id === c.id);
  if (c.deleted) { if (i >= 0) list.splice(i, 1); return; }
  if (i >= 0) list[i] = c.payload; else list.push(c.payload);
}
function split(key) { const i = key.indexOf(':'); return [key.slice(0, i), key.slice(i + 1)]; }

// ── Network ──────────────────────────────────────────────────────────────

async function call(endpoint, method, path, body, token) {
  const r = await fetch(endpoint.replace(/\/$/, '') + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || `HTTP ${r.status}`); e.status = r.status; throw e; }
  return j;
}

/** Development sign-in (the native app uses Sign in with Apple → /v1/auth/apple). */
export async function signInDev(endpoint, deviceId) { return call(endpoint, 'POST', '/v1/auth/dev', { deviceId }); }

/**
 * One sync round (repeats while the server says there is more).
 * getState/commit are the store's accessors so this stays testable.
 */
export async function syncOnce({ endpoint, getState, commit, now = Date.now() }) {
  const token = getState().sync?.token;
  if (!token) throw new Error('not_signed_in');
  const changes = collectChanges(getState(), now);
  const pullAll = async (cursor, pushed) => {
    let received = 0; let res;
    do {
      res = await call(endpoint, 'POST', '/v1/sync', { cursor, changes: pushed }, token);
      const s = applyRemote(getState(), res.changes, pushed);
      s.sync.cursor = cursor = res.cursor; s.sync.lastSyncAt = Date.now();
      commit(s);
      received += res.changes.length; pushed = [];
    } while (res.more);
    return { res, received };
  };
  const first = await pullAll(getState().sync.cursor || 0, changes);
  // Our write lost to a newer one elsewhere: refetch from the start so the server's version wins locally.
  if (first.res.stale.length) await pullAll(0, []);
  return { pushed: changes.length, applied: first.res.applied, received: first.received, stale: first.res.stale.length };
}

export async function deleteCloudAccount(endpoint, token) { return call(endpoint, 'DELETE', '/v1/account', null, token); }
