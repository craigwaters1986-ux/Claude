// Muscle catalogue used by the recovery model, the mannequin and analytics.
//
// `tauHours` is the time constant of the exponential fatigue-decay curve for
// that muscle (see docs/03-recovery-model.md). These are configurable
// heuristics informed by the general observation that smaller muscle groups
// and lower-damage movements tend to recover faster — they are NOT validated
// physiological constants and are surfaced in the UI as estimates.
//
// `size` weights the muscle's contribution to the overall recovery score.

export const MUSCLES = [
  { id: 'chest',      name: 'Chest',          view: 'front', size: 3, tauHours: 26 },
  { id: 'frontDelts', name: 'Front Delts',    view: 'front', size: 1, tauHours: 22 },
  { id: 'sideDelts',  name: 'Side Delts',     view: 'both',  size: 1, tauHours: 20 },
  { id: 'rearDelts',  name: 'Rear Delts',     view: 'back',  size: 1, tauHours: 20 },
  { id: 'biceps',     name: 'Biceps',         view: 'front', size: 1, tauHours: 20 },
  { id: 'triceps',    name: 'Triceps',        view: 'back',  size: 1.5, tauHours: 22 },
  { id: 'forearms',   name: 'Forearms',       view: 'both',  size: 1, tauHours: 16 },
  { id: 'abs',        name: 'Abs',            view: 'front', size: 1.5, tauHours: 16 },
  { id: 'obliques',   name: 'Obliques',       view: 'front', size: 1, tauHours: 18 },
  { id: 'traps',      name: 'Traps',          view: 'back',  size: 1.5, tauHours: 22 },
  { id: 'lats',       name: 'Lats',           view: 'back',  size: 3, tauHours: 26 },
  { id: 'upperBack',  name: 'Upper Back',     view: 'back',  size: 2, tauHours: 24 },
  { id: 'lowerBack',  name: 'Lower Back',     view: 'back',  size: 1.5, tauHours: 36 },
  { id: 'glutes',     name: 'Glutes',         view: 'back',  size: 3, tauHours: 30 },
  { id: 'quads',      name: 'Quads',          view: 'front', size: 4, tauHours: 32 },
  { id: 'hamstrings', name: 'Hamstrings',     view: 'back',  size: 3, tauHours: 34 },
  { id: 'adductors',  name: 'Adductors',      view: 'front', size: 1.5, tauHours: 26 },
  { id: 'calves',     name: 'Calves',         view: 'back',  size: 1.5, tauHours: 18 },
];

export const MUSCLE_BY_ID = Object.fromEntries(MUSCLES.map((m) => [m.id, m]));

// Higher-level groups used by the generator's "target / avoid" pickers.
export const MUSCLE_GROUPS = {
  chest: ['chest'],
  shoulders: ['frontDelts', 'sideDelts', 'rearDelts'],
  arms: ['biceps', 'triceps', 'forearms'],
  back: ['lats', 'upperBack', 'traps', 'lowerBack'],
  core: ['abs', 'obliques'],
  legs: ['quads', 'hamstrings', 'glutes', 'adductors', 'calves'],
};

export const GROUP_LABELS = {
  chest: 'Chest', shoulders: 'Shoulders', arms: 'Arms', back: 'Back', core: 'Core', legs: 'Legs',
};

export function expandGroups(groups = []) {
  const out = new Set();
  for (const g of groups) (MUSCLE_GROUPS[g] || [g]).forEach((m) => out.add(m));
  return [...out];
}
