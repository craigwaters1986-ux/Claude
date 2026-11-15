// Character presets.  Historical figures are recognisable through simplified
// hair, facial hair, clothing and a name tag; recurring fictional characters
// (the Guide, Anna, Tom, Leo) are illustrative and never labelled as real people.
import {C} from '../styles/theme';
import type {HeadSpec} from './Head';
import type {Outfit} from './StickFigure';

export type CastMember = {head: HeadSpec; outfit: Outfit; label?: string; sublabel?: string; child?: boolean};

export const CAST: Record<string, CastMember> = {
  // --- recurring fictional characters ---
  guide: {head: {hair: 'spiky'}, outfit: {kind: 'none'}},
  anna: {head: {hair: 'bob', hairColor: '#3A2A1E'}, outfit: {kind: 'dress', color: '#3F6EA6'}},
  tom: {head: {hair: 'short', hat: 'brodie', hatColor: '#7C7346'}, outfit: {kind: 'tunic', color: '#8C7A4E', accent: '#5B4A2E'}},
  leo: {head: {hair: 'mop'}, outfit: {kind: 'shirt', color: '#C9A15A'}, child: true},
  // --- generic civilians ---
  man1: {head: {hair: 'short', hat: 'flatCap', hatColor: '#6B5B47'}, outfit: {kind: 'coat', color: '#7A6A55'}},
  man2: {head: {hair: 'slick', hat: 'fedora', hatColor: '#4A4C4F'}, outfit: {kind: 'suit', color: '#4A4C4F'}},
  man3: {head: {hair: 'spiky'}, outfit: {kind: 'shirt', color: '#E8E1CF'}},
  woman1: {head: {hair: 'bun', hairColor: '#5A3A22'}, outfit: {kind: 'dress', color: '#B23A2E'}},
  woman2: {head: {hair: 'bob', hat: 'headscarf', hatColor: '#7FA3CC'}, outfit: {kind: 'dress', color: '#6F8546'}},
  woman3: {head: {hair: 'curly', hairColor: '#2A2A2A'}, outfit: {kind: 'coat', color: '#8A5A33'}},
  kid1: {head: {hair: 'mop'}, outfit: {kind: 'shirt', color: '#7FA3CC'}, child: true},
  kid2: {head: {hair: 'bob', hairColor: '#5A3A22'}, outfit: {kind: 'dress', color: '#E3C77A'}, child: true},
  worker: {head: {hair: 'crew', hat: 'flatCap', hatColor: '#4B3624'}, outfit: {kind: 'overalls', color: '#3F6EA6'}},
  workerW: {head: {hair: 'bob', hat: 'headscarf', hatColor: '#B23A2E'}, outfit: {kind: 'overalls', color: '#3F6EA6'}},
  politician: {head: {hair: 'slick'}, outfit: {kind: 'suit', color: '#2B2B2B'}},
  politician2: {head: {hair: 'baldFringe', facial: 'bushy'}, outfit: {kind: 'suit', color: '#45474A', accent: '#7E2620'}},
  // --- soldiers (illustrative) ---
  britSoldier: {head: {hair: 'short', hat: 'brodie', hatColor: '#7C7346'}, outfit: {kind: 'tunic', color: '#8C7A4E', accent: '#5B4A2E'}},
  frenchSoldier: {head: {hair: 'short', hat: 'adrian', hatColor: '#5C6B72'}, outfit: {kind: 'tunic', color: '#7D8A80'}},
  germanSoldier: {head: {hair: 'short', hat: 'stahlhelm', hatColor: '#5F6455'}, outfit: {kind: 'tunic', color: C.feldgrau, accent: '#2E2E2A'}},
  germanSoldierWW1: {head: {hair: 'short', hat: 'stahlhelm', hatColor: '#6E705E'}, outfit: {kind: 'tunic', color: '#7A7A66', accent: '#2E2E2A'}},
  polishSoldier: {head: {hair: 'short', hat: 'adrian', hatColor: '#6E6B4A'}, outfit: {kind: 'tunic', color: '#7D7650'}},
  sovietSoldier: {head: {hair: 'short', hat: 'sovietHelmet', hatColor: '#4E5E3A'}, outfit: {kind: 'tunic', color: '#8A8456', accent: '#4B3624'}},
  sovietWinter: {head: {hair: 'short', hat: 'ushanka', hatColor: '#E9ECEE'}, outfit: {kind: 'longcoat', color: '#E9ECEE', accent: '#9AA0A3'}},
  germanWinter: {head: {hair: 'short', hat: 'stahlhelm', hatColor: '#5F6455'}, outfit: {kind: 'longcoat', color: C.feldgrau, accent: '#2E2E2A'}},
  usSoldier: {head: {hair: 'short', hat: 'm1', hatColor: '#5E6238'}, outfit: {kind: 'tunic', color: '#6F6A44', accent: '#4B3624'}},
  canSoldier: {head: {hair: 'short', hat: 'brodie', hatColor: '#6E6A40'}, outfit: {kind: 'tunic', color: '#7E7448'}},
  sailor: {head: {hair: 'short', hat: 'sailor'}, outfit: {kind: 'sailor', color: '#F2F2F2'}},
  resistance: {head: {hair: 'short', hat: 'beret', hatColor: '#2B2B2B'}, outfit: {kind: 'coat', color: '#5A4A3A'}},
  survivor: {head: {hair: 'none', hat: 'stripedCap'}, outfit: {kind: 'stripes', color: '#C8CCD2'}},
  // --- historical figures (labelled when shown) ---
  hitler: {head: {hair: 'side', facial: 'toothbrush'}, outfit: {kind: 'tunic', color: '#8A7E5A', accent: '#3A2E1E', armband: '#B23A2E'}, label: 'ADOLF HITLER', sublabel: 'Leader of the Nazi Party'},
  churchill: {head: {hair: 'bald', hairColor: '#C9C2B4', wide: 1.08}, outfit: {kind: 'suit', color: '#2B2B2B', bowtie: true, accent: '#22324A'}, label: 'WINSTON CHURCHILL', sublabel: 'British Prime Minister, 1940–45'},
  chamberlain: {head: {hair: 'slick', hairColor: '#8F8F8F', facial: 'bushy', facialColor: '#6F6F6F'}, outfit: {kind: 'suit', color: '#2B2B2B', accent: '#5A5A5A'}, label: 'NEVILLE CHAMBERLAIN', sublabel: 'British Prime Minister, 1937–40'},
  daladier: {head: {hair: 'slick', hairColor: '#2A2A2A'}, outfit: {kind: 'suit', color: '#3A3A3A', accent: '#22324A'}, label: 'ÉDOUARD DALADIER', sublabel: 'French Prime Minister'},
  mussolini: {head: {hair: 'none', wide: 1.05}, outfit: {kind: 'tunic', color: '#3A3A36', accent: '#1A1A1A'}, label: 'BENITO MUSSOLINI', sublabel: 'Italian dictator'},
  stalin: {head: {hair: 'swept', hairColor: '#3A3A3A', facial: 'walrus', facialColor: '#2A2A2A'}, outfit: {kind: 'tunic', color: '#9A946A', accent: '#6E6A4A'}, label: 'JOSEPH STALIN', sublabel: 'Soviet dictator'},
  molotov: {head: {hair: 'short', hairColor: '#4A4A4A', glasses: 'pince', facial: 'thin'}, outfit: {kind: 'suit', color: '#3A3A3A'}, label: 'V. MOLOTOV', sublabel: 'Soviet foreign minister'},
  ribbentrop: {head: {hair: 'slick', hairColor: '#9A9A9A'}, outfit: {kind: 'suit', color: '#4A4C4F', accent: '#2A2A2A'}, label: 'J. VON RIBBENTROP', sublabel: 'German foreign minister'},
  roosevelt: {head: {hair: 'slick', hairColor: '#9A9A9A', glasses: 'pince'}, outfit: {kind: 'suit', color: '#3A3F4A', accent: '#7E2620'}, label: 'FRANKLIN D. ROOSEVELT', sublabel: 'US President, 1933–45'},
  hindenburg: {head: {hair: 'crew', hairColor: '#D8D8D8', facial: 'handlebar', facialColor: '#E5E5E5'}, outfit: {kind: 'tunic', color: '#6A6F5D', medals: true}, label: 'PAUL VON HINDENBURG', sublabel: 'President of Germany'},
  kaiser: {head: {hair: 'short', hat: 'pickelhaube', hatColor: '#2A2A2A', facial: 'kaiser'}, outfit: {kind: 'tunic', color: '#6A6F5D', medals: true}, label: 'KAISER WILHELM II', sublabel: 'German Emperor'},
  montgomery: {head: {hair: 'short', hat: 'beret', hatColor: '#1E1E1E', facial: 'thin'}, outfit: {kind: 'tunic', color: '#B49C68'}, label: 'GEN. BERNARD MONTGOMERY', sublabel: 'British Eighth Army'},
  eisenhower: {head: {hair: 'baldFringe', hairColor: '#B8A890'}, outfit: {kind: 'tunic', color: '#6F6A44', medals: true}, label: 'GEN. DWIGHT D. EISENHOWER', sublabel: 'Supreme Allied Commander'},
  truman: {head: {hair: 'short', hairColor: '#8A8A8A', glasses: 'round'}, outfit: {kind: 'suit', color: '#3A3F4A', bowtie: true, accent: '#22324A'}, label: 'HARRY S. TRUMAN', sublabel: 'US President from April 1945'},
  macarthur: {head: {hair: 'short', hat: 'officerCap', hatColor: '#6F6A44', glasses: 'dark'}, outfit: {kind: 'shirt', color: '#B49C68'}, label: 'GEN. DOUGLAS MACARTHUR', sublabel: 'Allied commander'},
};
