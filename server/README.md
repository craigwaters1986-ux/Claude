# Forma AI server

A small Node/TypeScript service that holds the AI credential and exposes two endpoints to the app. The mobile app **never** has a model API key.

```bash
npm install
export ANTHROPIC_API_KEY=...            # server-side only
FORMA_DEV=1 npm run server              # dev: allows unauthenticated calls from http://localhost:5173
```

Then in the prototype: Profile → *Cloud AI* on → server URL `http://localhost:8787`.

| Env var | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Model credential (or any other credential source the Anthropic SDK supports) |
| `FORMA_APP_TOKENS` | Comma-separated accepted app tokens (replace with Sign in with Apple / JWT verification in production) |
| `FORMA_ALLOWED_ORIGINS` | CORS allow-list |
| `FORMA_RATE_LIMIT` | Requests per token per minute (default 20) |
| `PORT` | Default 8787 |

**Behaviour.** Requests are validated with zod. The model (`claude-opus-5-5`, server-side refusal fallback enabled) returns JSON constrained to the real exercise catalogue. The output then passes through the **same `validatePlan` safety rules the app uses** (`prototype/js/core/generator.js`). On a refusal, truncation, invalid output or upstream error, the server returns `503 {fallback: "on_device"}` and the app uses its offline engine. Request bodies are never logged.

Tests (no network, mocked model): `npm run test:server`.
