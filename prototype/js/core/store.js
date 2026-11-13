// Offline-first local store. Everything is written to localStorage on every
// change (debounced) so logging never depends on a network. A sync queue
// records mutations for a future backend (see docs/02-architecture.md); in the
// prototype the queue is only displayed — no data leaves the device.

import { EXERCISES, EXERCISE_BY_ID } from './exercises.js';

const KEY = 'forma.state.v1';
export const SCHEMA_VERSION = 1;

export const uid = (p = '') => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export function defaultState() {
  return {
    version: SCHEMA_VERSION,
    profile: {
      name: '', goal: 'hypertrophy', experience: 'intermediate', days: [1, 2, 4, 5],
      equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bench', 'rack', 'pullupBar', 'dipStation'],
      location: 'gym', units: 'kg', durationMin: 60, onboarded: false,
      healthConnected: false, watchPaired: false, haptics: true, restDefaultSec: 120,
      aiCloud: false, aiEndpoint: '', coachUsesHistory: true,
    },
    workouts: [], templates: [], customExercises: [],
    active: null, personal: {}, likes: [], dislikes: [],
    health: null, // { sleepHours, hrvZ, rhrDelta, restingHr, hrv, source: 'simulated' | 'healthkit' }
    syncQueue: [], sampleData: false,
    sync: null, // { deviceId, token, userId, cursor, meta, lastSyncAt }
  };
}

export let storageAvailable = true;
const listeners = new Set();
let saveTimer = null;
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const s = migrate(JSON.parse(raw));
    for (const ex of s.customExercises || []) registerCustomExercise(ex, false);
    return s;
  } catch { storageAvailable = false; return defaultState(); }
}

function migrate(s) {
  const d = defaultState();
  return { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) }, version: SCHEMA_VERSION };
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
  }, 120);
}

export const getState = () => state;

export function setState(mutator, { op } = {}) {
  const next = structuredClone(state);
  mutator(next);
  if (op) next.syncQueue.push({ id: uid('op_'), op, at: Date.now() });
  if (next.syncQueue.length > 200) next.syncQueue = next.syncQueue.slice(-200);
  state = next;
  persist();
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function replaceState(s) { state = migrate(s); persist(); listeners.forEach((fn) => fn(state)); }

export function exportData() {
  return JSON.stringify({ exportedAt: new Date().toISOString(), app: 'Forma', schema: SCHEMA_VERSION, data: state }, null, 2);
}

export function deleteAllData() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  state = defaultState();
  listeners.forEach((fn) => fn(state));
}

export function registerCustomExercise(ex, save = true) {
  const full = { secondary: [], equipment: [], pattern: 'custom', mechanics: 'isolation', incrementKg: 2.5, stress: [], watch: 'unsupported', bodyweight: false, instructions: ['Custom exercise.'], custom: true, ...ex };
  if (!EXERCISE_BY_ID[full.id]) EXERCISES.push(full);
  EXERCISE_BY_ID[full.id] = full;
  if (save) setState((s) => { s.customExercises = [...s.customExercises.filter((e) => e.id !== full.id), full]; }, { op: 'exercise.create' });
  return full;
}

export const completedWorkouts = () => state.workouts.filter((w) => w.endedAt);
