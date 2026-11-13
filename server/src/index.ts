import Anthropic from '@anthropic-ai/sdk';
import { createApp } from './app.js';
import { appleJwks } from './auth.js';
import { MemoryStore, PostgresStore, type SyncStore } from './store.js';

// The Anthropic credential lives ONLY here, on the server (ANTHROPIC_API_KEY or
// another SDK-supported credential source). The mobile app never sees it.
const client = new Anthropic();
const port = Number(process.env.PORT ?? 8787);
const devMode = process.env.FORMA_DEV === '1';

let store: SyncStore | undefined;
if (process.env.DATABASE_URL) store = await PostgresStore.connect(process.env.DATABASE_URL);
else if (devMode) store = new MemoryStore();   // dev only: data is lost on restart

const sessionSecret = process.env.FORMA_SESSION_SECRET ?? (devMode ? 'dev-only-insecure-secret-change-me' : undefined);

const app = createApp(client, {
  appTokens: (process.env.FORMA_APP_TOKENS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  allowUnauthenticated: devMode,
  allowedOrigins: (process.env.FORMA_ALLOWED_ORIGINS ?? (devMode ? 'http://localhost:5173' : '')).split(',').filter(Boolean),
  rateLimitPerMinute: Number(process.env.FORMA_RATE_LIMIT ?? 60),
  maxBodyBytes: 64 * 1024,
  sessionSecret, store,
  appleAudience: process.env.FORMA_APPLE_AUDIENCE ?? 'app.forma.Forma',
  appleJwks,
  allowDevLogin: devMode,
});

app.listen(port, () => console.log(`Forma server on :${port}${devMode ? ' (DEV mode: dev sign-in, unauthenticated AI from localhost:5173)' : ''}${store ? ` · sync: ${store instanceof PostgresStore ? 'postgres' : 'memory'}` : ' · sync disabled'}`));
