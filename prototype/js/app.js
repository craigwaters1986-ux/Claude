// App context shared by screens: derived data (memoised per state), navigation.

import { getState, setState, completedWorkouts } from './core/store.js';
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
