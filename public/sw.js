/*
 * Site Auditor + service worker: lets the app open and work with no signal.
 *
 * - App code (/_next/static, content-hashed): cache-first; it never changes.
 * - Pages: network-first. If the network is slow (over 4 s) or there's no
 *   signal, the copy saved last time this page was opened is used.
 * - Photos and drawings from Supabase Storage: cache-first (they never change
 *   at a given address), so plans and photos show offline once seen.
 * - Data (projects, snags) is not handled here: the app keeps its own copy,
 *   and new snags are saved in its outbox until they upload.
 */
const VERSION = "v4";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const IMAGES = `images-${VERSION}`;
const KEEP = [STATIC, PAGES, IMAGES];
const MAX_IMAGES = 400;
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (!KEEP.includes(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

/*
 * In-app navigation doesn't load pages the normal way, so the app tells us
 * which pages to keep a copy of ({ type: "save-pages", urls: [...] }).
 */
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (!Array.isArray(data.urls)) return;
  if (data.type === "save-pages") event.waitUntil(Promise.all(data.urls.map(savePage)));
  // Drawings: keep them on the phone so plans open with no signal.
  if (data.type === "save-images") event.waitUntil(Promise.all(data.urls.map((u) => imageCacheFirst(u).catch(() => null))));
});

async function savePage(href) {
  try {
    const url = new URL(href, self.location.origin);
    if (url.origin !== self.location.origin || url.pathname.startsWith("/auth/")) return;
    const res = await fetch(url.pathname, { credentials: "same-origin", headers: { accept: "text/html" } });
    if (res.ok && !res.redirected && (res.headers.get("content-type") || "").includes("text/html")) {
      await (await caches.open(PAGES)).put(new Request(url.pathname), res);
    }
  } catch {
    // no signal: nothing to save right now
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC));
  } else if (url.pathname.includes("/storage/v1/object/public/")) {
    event.respondWith(imageCacheFirst(req.url));
  } else if (req.mode === "navigate" && url.origin === self.location.origin && !url.pathname.startsWith("/auth/")) {
    event.respondWith(page(req));
  }
  // Everything else (data, sign-in, uploads) goes straight to the network.
});

async function cacheFirst(req, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) {
    await cache.put(req, res.clone());
    if (limit) trim(cache, limit);
  }
  return res;
}

/*
 * Photos and drawings. Always fetched as CORS (Supabase Storage allows it) and
 * stored by address, so the same copy serves both an <img> on screen and the
 * report generator's fetch(). (An <img>'s own "opaque" copy can't be read by
 * fetch(), which would leave photos out of PDF reports.)
 */
async function imageCacheFirst(href) {
  const cache = await caches.open(IMAGES);
  const key = new Request(href);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await fetch(href, { mode: "cors", credentials: "omit" });
  if (res.ok) {
    await cache.put(key, res.clone());
    trim(cache, MAX_IMAGES);
  }
  return res;
}

async function trim(cache, limit) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i]);
}

/** Network first; the saved copy if the network is slow or unavailable. */
async function page(req) {
  const cache = await caches.open(PAGES);
  const key = new Request(new URL(req.url).pathname); // one copy per page, whatever the ?view=…
  const network = fetch(req).then(async (res) => {
    // Don't save sign-in redirects or errors as "the page".
    if (res.ok && !res.redirected) await cache.put(key, res.clone());
    return res;
  });

  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS, null));
  try {
    const res = await Promise.race([network, timeout]);
    if (res) return res;
  } catch {
    // no signal: fall through to the saved copy
  }
  const saved = await cache.match(key);
  if (saved) return saved;
  try {
    return await network; // slow, but nothing saved: keep waiting
  } catch {
    return offlinePage();
  }
}

function offlinePage() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>No signal · Site Auditor +</title><meta name="theme-color" content="#000000">
<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;font:16px/1.5 system-ui,sans-serif;padding:24px;box-sizing:border-box}
main{max-width:340px;text-align:center}h1{font-size:22px;margin:16px 0 8px}p{color:#bbb;margin:0 0 20px}
.logo{width:56px;height:56px;border-radius:16px;background:#facc15;display:inline-flex;align-items:center;justify-content:center;font-size:28px}
a{display:inline-block;background:#facc15;color:#000;font-weight:600;padding:12px 20px;border-radius:12px;text-decoration:none}</style></head>
<body><main><div class="logo">📋</div><h1>No signal</h1>
<p>This page hasn’t been opened on this phone before, so it can’t load offline. Issues you’ve saved are safe on this phone and will upload when the signal is back.</p>
<a href="/">Go to your projects</a></main></body></html>`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}
