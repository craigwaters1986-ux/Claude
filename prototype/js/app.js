// App context shared by screens: derived data (memoised per state), navigation.

import { getState, setState, completedWorkouts, replaceState, subscribe } from './core/store.js';
import { syncOnce, collectChanges } from './core/sync.js';
import { toast } from './ui/dom.js';
import { computeRecovery } from './core/recovery.js';
import { seedSampleData, SAMPLE_TEMPLATES, SAMPLE_HEALTH } from './core/seed.js';

let memo = { state: null, minute: 0, value: null };

/** Derived values recomputed only when state changes or a minute passes. */
export function derived() {
  const s = getState();
  const minute = Math.floor(Date.now() / 60000);
  if (memo.state === s && memo.minute === minute) return memo.value;
  const workouts = completedWorkouts().sort((a, b) => a.startedAt - b.startedAt);
  const health = s.profile.healthConnected ? s.health : null;
  const recovery = computeRecovery(workouts, Date.now(), { health, personal: s.personal });
  memo = { state: s, minute, value: { workouts, recovery, health, profile: s.profile } };
  return memo.value;
}

export function navigate(path) {
  if (location.hash !== `#${path}`) location.hash = path; else window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function loadSampleData() {
  setState((s) => {
    s.workouts = [...s.workouts.filter((w) => !w.sample), ...seedSampleData()];
    s.templates = [...s.templates.filter((t) => !t.id.startsWith('tpl_push') && !t.id.startsWith('tpl_pull') && !t.id.startsWith('tpl_legs')), ...SAMPLE_TEMPLATES];
    s.sampleData = true;
  }, { op: 'sample.load' });
}

export function clearSampleData() {
  setState((s) => {
    s.workouts = s.workouts.filter((w) => !w.sample);
    s.templates = s.templates.filter((t) => !SAMPLE_TEMPLATES.some((x) => x.id === t.id));
    s.sampleData = false;
  }, { op: 'sample.clear' });
}

/** Simulated Apple Health connection — the prototype has no HealthKit access. */
export function connectSimulatedHealth(on) {
  setState((s) => { s.profile.healthConnected = on; s.health = on ? { ...SAMPLE_HEALTH } : null; }, { op: 'health.toggle' });
}

/** Sync with the Forma server if signed in. `loud` shows a toast with the result. */
let syncing = null;
export async function runSync(loud = false) {
  const s = getState();
  if (!s.sync?.token || !s.profile.aiEndpoint) return null;
  if (syncing) return syncing;
  syncing = syncOnce({ endpoint: s.profile.aiEndpoint, getState, commit: replaceState })
    .then((r) => { if (loud) toast(`Synced · ${r.pushed} sent, ${r.received} received`); return r; })
    .catch((e) => { if (loud || e.status === 401) toast(e.status === 401 ? 'Session expired — sign in again' : `Sync failed: ${e.message} (changes are kept and retried)`); return null; })
    .finally(() => { syncing = null; });
  return syncing;
}

/** Background sync: shortly after local changes, when coming back online, and every 2 minutes. */
export function startAutoSync() {
  let t = 0;
  const schedule = () => { clearTimeout(t); t = setTimeout(() => { if (navigator.onLine !== false) runSync(); }, 4000); };
  subscribe((st) => { if (st.sync?.token && collectChanges(st).length) schedule(); });
  window.addEventListener('online', () => runSync());
  setInterval(() => { if (document.visibilityState === 'visible') runSync(); }, 120000);
  runSync();
}
