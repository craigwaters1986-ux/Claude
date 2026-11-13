// Maps mesh/node names from a 3D anatomy asset to Forma's 18 muscle groups.
//
// This is what lets a licensed or commissioned anatomy model replace the
// built-in stylised mannequin with no code changes: name the meshes with
// standard anatomical terms (English or Latin) or with Forma's own ids, and
// they light up, colour and respond to taps like the built-in model.
// Mirrored in ios/GymCore/Sources/GymCore/AnatomyMapping.swift.

import { MUSCLE_BY_ID } from './muscles.js';

// Order matters: more specific patterns first (e.g. "biceps femoris" before "biceps").
export const ANATOMY_RULES = [
  [/biceps femoris|semitendinosus|semimembranosus|hamstring/, 'hamstrings'],
  [/rectus femoris|vastus|quadriceps|\bquads?\b/, 'quads'],
  [/adductor|gracilis|pectineus/, 'adductors'],
  [/gluteus|glute/, 'glutes'],
  [/gastrocnemius|soleus|\bcal(f|ves)\b/, 'calves'],
  [/pectoralis|\bpecs?\b|\bchest\b/, 'chest'],
  [/(anterior|front|clavicular).*deltoid|deltoid.*(anterior|front|clavicular)|front ?delts?/, 'frontDelts'],
  [/(posterior|rear|spinal).*deltoid|deltoid.*(posterior|rear|spinal)|rear ?delts?|infraspinatus|teres minor/, 'rearDelts'],
  [/(lateral|middle|side|acromial).*deltoid|deltoid.*(lateral|middle|side|acromial)|side ?delts?|\bdeltoid\b/, 'sideDelts'],
  [/biceps|brachialis(?!radialis)|coracobrachialis/, 'biceps'],
  [/triceps|anconeus/, 'triceps'],
  [/brachioradialis|flexor (carpi|digitorum)|extensor (carpi|digitorum)|pronator|supinator|palmaris|forearm muscle/, 'forearms'],
  [/rectus abdominis|\babs\b/, 'abs'],
  [/oblique|serratus anterior/, 'obliques'],
  [/trapezius|\btraps?\b/, 'traps'],
  [/latissimus|\blats?\b/, 'lats'],
  [/rhomboid|teres major|upper back/, 'upperBack'],
  [/erector spinae|iliocostalis|longissimus|spinalis|multifidus|quadratus lumborum|lower back/, 'lowerBack'],
];

/** Normalise "Pectoralis_Major.L.001" → "pectoralis major". */
export function normaliseName(name) {
  return String(name)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[._\-:/]+/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\b(l|r|left|right|sin|dex|sinister|dexter|muscle|muscles|mesh|geo|obj)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Structures that share muscle words but are not muscle tissue (found on real
// BodyParts3D data: "abdominal aorta", "deltoid branch of thoraco-acromial artery").
export const NON_MUSCLE = /\b(arter(y|ies)|vein|venous|nerve|branch|aorta|fascia|tendon|ligament|bursa|wall|region|skin|bone|cartilage|lymph|retinaculum|aponeurosis|sheath|compartment)\b/;

/** Muscle id for a mesh name, or null for skin / bones / unmapped parts. */
export function muscleForMeshName(name) {
  const raw = String(name).split(/[._\-\s]/)[0];
  if (MUSCLE_BY_ID[raw]) return raw;                 // Forma's own ids: "chest_L", "lats.001"
  const n = normaliseName(name);
  if (NON_MUSCLE.test(n)) return null;
  for (const [re, id] of ANATOMY_RULES) if (re.test(n)) return id;
  return null;
}

/** Coverage report for a model: which groups are present, which names were unmapped. */
export function mappingReport(names) {
  const found = new Set(); const unmapped = [];
  for (const n of names) { const m = muscleForMeshName(n); if (m) found.add(m); else unmapped.push(n); }
  return { found: [...found].sort(), missing: Object.keys(MUSCLE_BY_ID).filter((m) => !found.has(m)).sort(), unmapped };
}
