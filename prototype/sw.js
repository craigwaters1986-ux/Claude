// Offline cache: the prototype keeps working (and logging) with no network.
const CACHE = 'forma-v1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'icon.svg', 'css/tokens.css', 'css/app.css',
  'vendor/three.module.min.js', 'vendor/OrbitControls.js',
  'js/main.js', 'js/app.js', 'js/ui/dom.js', 'js/ui/charts.js', 'js/ui/mannequin.js', 'js/ui/widgets.js',
  'js/core/muscles.js', 'js/core/exercises.js', 'js/core/recovery.js', 'js/core/metrics.js', 'js/core/generator.js',
  'js/core/repcounter.js', 'js/core/store.js', 'js/core/seed.js', 'js/core/units.js', 'js/core/coach.js', 'js/core/session.js', 'js/core/ai.js',
  'js/screens/home.js', 'js/screens/train.js', 'js/screens/workout.js', 'js/screens/library.js', 'js/screens/body.js',
  'js/screens/progress.js', 'js/screens/profile.js', 'js/screens/generator.js', 'js/screens/coach.js', 'js/screens/watch.js', 'js/screens/onboarding.js',
];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Network-first so updates show up; cache fallback when offline.
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
