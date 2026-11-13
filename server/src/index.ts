import Anthropic from '@anthropic-ai/sdk';
import { createApp } from './app.js';

// The Anthropic credential lives ONLY here, on the server (ANTHROPIC_API_KEY or
// another SDK-supported credential source). The mobile app never sees it.
const client = new Anthropic();
const port = Number(process.env.PORT ?? 8787);
const devMode = process.env.FORMA_DEV === '1';

const app = createApp(client, {
  appTokens: (process.env.FORMA_APP_TOKENS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  allowUnauthenticated: devMode,
  allowedOrigins: (process.env.FORMA_ALLOWED_ORIGINS ?? (devMode ? 'http://localhost:5173' : '')).split(',').filter(Boolean),
  rateLimitPerMinute: Number(process.env.FORMA_RATE_LIMIT ?? 20),
  maxBodyBytes: 64 * 1024,
});

app.listen(port, () => console.log(`Forma AI server on :${port}${devMode ? ' (DEV: unauthenticated requests allowed from localhost:5173)' : ''}`));
