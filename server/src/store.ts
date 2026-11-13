// Sync storage. Last-writer-wins per record using the client's updatedAt;
// pull uses a monotonically increasing server sequence as the cursor.
// Analogy: each record is a library card; the newest stamp wins, and the
// librarian's ledger number (seq) tells each device what it hasn't seen yet.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export const KINDS = ['workout', 'template', 'customExercise', 'profile'] as const;
export type Kind = (typeof KINDS)[number];

export interface Change { kind: Kind; id: string; updatedAt: number; deleted: boolean; payload: unknown | null }
export interface PullResult { cursor: number; changes: Change[]; more: boolean }
export interface PushResult { applied: number; stale: { kind: Kind; id: string }[] }

export interface SyncStore {
  userForApple(sub: string): Promise<string>;
  userForDevDevice(deviceId: string): Promise<string>;
  push(userId: string, changes: Change[]): Promise<PushResult>;
  pull(userId: string, cursor: number, limit?: number): Promise<PullResult>;
  exportAll(userId: string): Promise<Change[]>;
  deleteUser(userId: string): Promise<void>;
  close?(): Promise<void>;
}

// ── In-memory (tests / local demo) ───────────────────────────────────────
export class MemoryStore implements SyncStore {
  private seq = 0;
  private users = new Map<string, string>();
  private rows = new Map<string, Map<string, Change & { seq: number }>>();
  private id(key: string) { let u = this.users.get(key); if (!u) { u = crypto.randomUUID(); this.users.set(key, u); } return u; }
  async userForApple(sub: string) { return this.id(`apple:${sub}`); }
  async userForDevDevice(d: string) { return this.id(`dev:${d}`); }
  async push(userId: string, changes: Change[]) {
    const t = this.rows.get(userId) ?? new Map(); this.rows.set(userId, t);
    const stale: PushResult['stale'] = []; let applied = 0;
    for (const c of changes) {
      const k = `${c.kind}:${c.id}`; const cur = t.get(k);
      if (cur && cur.updatedAt > c.updatedAt) { stale.push({ kind: c.kind, id: c.id }); continue; }
      t.set(k, { ...c, payload: c.deleted ? null : c.payload, seq: ++this.seq }); applied++;
    }
    return { applied, stale };
  }
  async pull(userId: string, cursor: number, limit = 500) {
    const all = [...(this.rows.get(userId)?.values() ?? [])].filter((r) => r.seq > cursor).sort((a, b) => a.seq - b.seq);
    const page = all.slice(0, limit);
    return { cursor: page.length ? page[page.length - 1].seq : cursor, changes: page.map(({ seq: _s, ...c }) => c), more: all.length > limit };
  }
  async exportAll(userId: string) { return (await this.pull(userId, 0, 1e9)).changes.filter((c) => !c.deleted); }
  async deleteUser(userId: string) {
    this.rows.delete(userId);
    for (const [k, v] of this.users) if (v === userId) this.users.delete(k);
  }
}

// ── Postgres ─────────────────────────────────────────────────────────────
export class PostgresStore implements SyncStore {
  constructor(private pool: pg.Pool) {}

  static async connect(url: string) {
    const pool = new pg.Pool({ connectionString: url, max: 10 });
    const s = new PostgresStore(pool); await s.migrate(); return s;
  }

  async migrate() {
    const sql = await readFile(fileURLToPath(new URL('../db/001_init.sql', import.meta.url)), 'utf8');
    await this.pool.query(sql);
  }

  private async user(col: 'apple_sub' | 'dev_device', v: string) {
    const r = await this.pool.query(`insert into users (${col}) values ($1) on conflict (${col}) do update set ${col} = excluded.${col} returning id`, [v]);
    return r.rows[0].id as string;
  }
  userForApple(sub: string) { return this.user('apple_sub', sub); }
  userForDevDevice(d: string) { return this.user('dev_device', d); }

  async push(userId: string, changes: Change[]): Promise<PushResult> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      let applied = 0; const stale: PushResult['stale'] = [];
      for (const c of changes) {
        // Upsert only if the incoming change is at least as new (LWW).
        const r = await client.query(
          `insert into records (user_id, kind, id, payload, updated_at, deleted) values ($1,$2,$3,$4,$5,$6)
           on conflict (user_id, kind, id) do update
             set payload = excluded.payload, updated_at = excluded.updated_at, deleted = excluded.deleted, seq = nextval('record_seq')
             where records.updated_at <= excluded.updated_at`,
          [userId, c.kind, c.id, c.deleted ? null : JSON.stringify(c.payload), c.updatedAt, c.deleted]);
        if (r.rowCount) applied++; else stale.push({ kind: c.kind, id: c.id });
      }
      await client.query('commit');
      return { applied, stale };
    } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
  }

  async pull(userId: string, cursor: number, limit = 500): Promise<PullResult> {
    const r = await this.pool.query(`select kind, id, payload, updated_at, deleted, seq from records where user_id = $1 and seq > $2 order by seq limit $3`, [userId, cursor, limit + 1]);
    const rows = r.rows.slice(0, limit);
    return {
      cursor: rows.length ? Number(rows[rows.length - 1].seq) : cursor, more: r.rows.length > limit,
      changes: rows.map((x) => ({ kind: x.kind, id: x.id, payload: x.payload, updatedAt: Number(x.updated_at), deleted: x.deleted })),
    };
  }

  async exportAll(userId: string) {
    const r = await this.pool.query(`select kind, id, payload, updated_at, deleted from records where user_id = $1 and not deleted order by kind, id`, [userId]);
    return r.rows.map((x) => ({ kind: x.kind, id: x.id, payload: x.payload, updatedAt: Number(x.updated_at), deleted: false }));
  }

  async deleteUser(userId: string) { await this.pool.query('delete from users where id = $1', [userId]); }   // cascades to records
  async close() { await this.pool.end(); }
}
