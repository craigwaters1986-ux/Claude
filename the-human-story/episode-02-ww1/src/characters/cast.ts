// Character presets.  Historical figures are recognisable through simplified
// hair, facial hair, clothing and a name tag; recurring fictional characters
// (the Guide, Anna, Tom, Leo) are illustrative and never labelled as real people.
import {C} from '../styles/theme';
import type {HeadSpec} from './Head';
import type {Outfit} from './StickFigure';

/** A-04: Foch's name tag in one place (wording pending researcher confirmation — he became
 *  Marshal of France in August 1918; change it here and every shot follows). */
export const FOCH_TAG = {label: 'GENERAL FERDINAND FOCH', sublabel: 'Allied commander, 1918'};

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
  // --- ep01 additions: Asia-Pacific (plain, no flags on figures, no costume stereotypes) ---
  japaneseSoldier: {head: {hair: 'short', hat: 'jpFieldCap', hatColor: '#8C7C4C'}, outfit: {kind: 'tunic', color: '#9A8A58', accent: '#5B4A2E', puttees: '#8C7C4C'}}, // A-01
  japaneseSoldierHelmet: {head: {hair: 'short', hat: 'jpHelmet', hatColor: '#6E6A44'}, outfit: {kind: 'tunic', color: '#9A8A58', accent: '#5B4A2E', puttees: '#8C7C4C'}}, // A-01 variant
  japaneseOfficer: {head: {hair: 'crew', hat: 'officerCap', hatColor: '#8C7C4C', hatAccent: '#6E6038'}, outfit: {kind: 'tunic', color: '#9A8A58', accent: '#4B3624', shoulderBoards: '#B8A86A'}}, // A-01 officer
  chineseSoldier: {head: {hair: 'short', hat: 'chineseCap', hatColor: '#5E6C76'}, outfit: {kind: 'tunic', color: '#6E7C86', accent: '#4B3624', puttees: '#5E6C76'}}, // A-02
  chineseSoldierHelmet: {head: {hair: 'short', hat: 'stahlhelm', hatColor: '#5A6268'}, outfit: {kind: 'tunic', color: '#6E7C86', accent: '#4B3624', puttees: '#5E6C76'}}, // A-02 variant (German-pattern helmet, as worn by some NRA divisions)
  chineseSoldierKhaki: {head: {hair: 'short', hat: 'chineseCap', hatColor: '#8A7C55'}, outfit: {kind: 'tunic', color: '#958760', accent: '#4B3624', puttees: '#8A7C55'}}, // A-02 khaki variant
  japaneseMan: {head: {hair: 'short'}, outfit: {kind: 'shirt', color: '#D6CFBC'}}, // A-03
  japaneseMan2: {head: {hair: 'crew', hat: 'fedora', hatColor: '#5A5448'}, outfit: {kind: 'coat', color: '#6A6556'}}, // A-03
  japaneseWoman: {head: {hair: 'bun', hairColor: '#2A2A2A'}, outfit: {kind: 'coat', color: '#5B6577'}}, // A-03 work clothes
  japaneseWoman2: {head: {hair: 'bob', hairColor: '#2A2A2A'}, outfit: {kind: 'dress', color: '#8A6E5A'}}, // A-03 plain dress
  japaneseChild: {head: {hair: 'short'}, outfit: {kind: 'shirt', color: '#B9A47C'}, child: true}, // A-03
  japaneseGirl: {head: {hair: 'bob', hairColor: '#2A2A2A'}, outfit: {kind: 'dress', color: '#7A8A9A'}, child: true}, // A-03
  japaneseDelegate: {head: {hair: 'slick', hat: 'tophat', hatColor: '#1E1E1E'}, outfit: {kind: 'morningcoat', color: '#232323', accent: '#6A6A6A'}}, // A-09
  japaneseDelegate2: {head: {hair: 'baldFringe', hat: 'tophat', hatColor: '#1E1E1E', glasses: 'round'}, outfit: {kind: 'morningcoat', color: '#2B2B2B', accent: '#4A4A4A'}}, // A-09
  usMarine: {head: {hair: 'short', hat: 'm1Camo', hatColor: '#6E7448'}, outfit: {kind: 'tunic', color: '#5E6A44', accent: '#4B3624'}}, // A-23
  // --- ep01 additions: Europe / Africa ---
  germanOfficer: {head: {hair: 'slick', hat: 'officerCap', hatColor: '#6A6F5D', hatAccent: '#2E2E2A'}, outfit: {kind: 'tunic', color: C.feldgrau, accent: '#2E2E2A', shoulderBoards: '#B8B8A8'}}, // A-10
  rafPilot: {head: {hair: 'short', hat: 'pilot', hatColor: '#6B4A2E'}, outfit: {kind: 'tunic', color: '#5A6B85', accent: '#3A4558', lifeVest: '#E3C24A'}}, // A-11
  medic: {head: {hair: 'short', hat: 'm1', hatColor: '#5E6238', hatBadge: 'redcross'}, outfit: {kind: 'tunic', color: '#6F6A44', accent: '#4B3624', armbandCross: true}}, // A-12 (US)
  medicBrit: {head: {hair: 'short', hat: 'brodie', hatColor: '#7C7346', hatBadge: 'redcross'}, outfit: {kind: 'tunic', color: '#8C7A4E', accent: '#5B4A2E', armbandCross: true}}, // A-12 (British)
  nurse: {head: {hair: 'bun', hairColor: '#5A3A22', hat: 'nurseCap'}, outfit: {kind: 'dress', color: '#4E6A8A', apron: '#F4F4F0'}}, // A-12
  partyMember: {head: {hair: 'short', hat: 'kepi', hatColor: '#8A6A42'}, outfit: {kind: 'tunic', color: '#8E6E46', accent: '#3A2E1E', armband: '#B23A2E'}}, // A-19 plain armband, no emblem
  paratrooper: {head: {hair: 'short', hat: 'm1', hatColor: '#5E6238', chinStrap: true}, outfit: {kind: 'tunic', color: '#7A7450', accent: '#4B3624', harness: '#3E3424'}}, // A-04
  ausSoldier: {head: {hair: 'short', hat: 'slouch', hatColor: '#9A8456'}, outfit: {kind: 'tunic', color: '#8C7A4E', accent: '#5B4A2E', puttees: '#8C7A4E'}}, // A-22
  ausSoldierDesert: {head: {hair: 'short', hat: 'slouch', hatColor: '#9A8456'}, outfit: {kind: 'shirt', color: '#B49C68'}}, // A-22 desert shirt
  britSoldierDesert: {head: {hair: 'short', hat: 'brodie', hatColor: '#9A8A5A'}, outfit: {kind: 'shirt', color: '#B49C68'}},
  survivorNoCap: {head: {hair: 'crew', hairColor: '#4A4A4A'}, outfit: {kind: 'stripes', color: '#C8CCD2'}}, // A-05
  // --- ep02 (WW1, 1914–18) — illustrative soldiers and civilians, per research-notes §9 ---
  britSoldier1914: {head: {hair: 'short', hat: 'serviceCap', hatColor: '#8C7A4E', hatAccent: '#7A6A42'}, outfit: {kind: 'tunic', color: '#8C7A4E', accent: '#A49A72', puttees: '#7E6E48'}}, // khaki, soft peaked cap, puttees
  britSoldier1916: {head: {hair: 'short', hat: 'brodie', hatColor: '#6E6A44'}, outfit: {kind: 'tunic', color: '#8C7A4E', accent: '#A49A72', puttees: '#7E6E48'}}, // Brodie helmet (from late 1915/1916)
  britGasMask: {head: {hair: 'short', hat: 'brodie', hatColor: '#6E6A44', gasMask: '#6E7258'}, outfit: {kind: 'tunic', color: '#8C7A4E', accent: '#A49A72', puttees: '#7E6E48', satchel: '#9C8E62'}}, // box respirator + haversack
  frenchSoldier1914: {head: {hair: 'short', hat: 'kepi1914', hatColor: '#B23A2E', hatAccent: '#2D3A5C'}, outfit: {kind: 'longcoat', color: '#2D3A5C', accent: '#3A2A1C', trousers: '#B23A2E'}}, // dark blue greatcoat, red trousers, red kepi
  frenchSoldier1915: {head: {hair: 'short', hat: 'adrian', hatColor: '#7E93A6'}, outfit: {kind: 'longcoat', color: '#8DA2B5', accent: '#3A2A1C', puttees: '#8DA2B5'}}, // horizon blue + Adrian helmet
  germanSoldier1914: {head: {hair: 'short', hat: 'pickelhaube', hatColor: '#9C9A7E'}, outfit: {kind: 'tunic', color: '#7A7D66', accent: '#2E2E2A', puttees: '#2A2420'}}, // field grey, covered Pickelhaube, jackboots
  germanSoldier1916: {head: {hair: 'short', hat: 'stahlhelm', hatColor: '#5F6455'}, outfit: {kind: 'tunic', color: '#7A7D66', accent: '#2E2E2A', puttees: '#2A2420'}}, // Stahlhelm (from early 1916)
  russianSoldier: {head: {hair: 'short', hat: 'serviceCap', hatColor: '#8E8A60', hatAccent: '#8E8A60'}, outfit: {kind: 'tunic', color: '#9A946A', accent: '#5B4A2E', blanketRoll: '#7C7466', puttees: '#2A2420'}}, // gymnastyorka, furazhka, greatcoat roll, boots
  russianWinter: {head: {hair: 'short', hat: 'papakha', hatColor: '#5A4A3A'}, outfit: {kind: 'longcoat', color: '#7C7466', accent: '#5B4A2E'}}, // fur papakha + greatcoat
  austroSoldier: {head: {hair: 'short', hat: 'feldkappe', hatColor: '#8496A4'}, outfit: {kind: 'tunic', color: '#8C9CA8', accent: '#3A2A1C'}}, // pike-grey 1914, soft field cap
  ottomanSoldier: {head: {hair: 'short', hat: 'kabalak', hatColor: '#B09C72'}, outfit: {kind: 'tunic', color: '#A8956A', accent: '#5B4A2E', puttees: '#9A875E'}}, // khaki + kabalak
  vadNurse: {head: {hair: 'bun', hairColor: '#5A3A22', hat: 'vadVeil', hatColor: '#F4F4F0'}, outfit: {kind: 'dress', color: '#7E9CC0', apron: '#F4F4F0', apronCross: true}}, // VAD: white apron with red cross, veil
  munitionette: {head: {hair: 'bob', hairColor: '#3A2A1E', hat: 'mobCap', hatColor: '#F0EBDD', hatAccent: '#B23A2E'}, outfit: {kind: 'longcoat', color: '#B9A27A', accent: '#B9A27A'}}, // long overall coat + mob cap
  // --- ep02 storyboard asset requests (A-05, A-06): illustrative soldiers ---
  indianSoldier: {head: {hair: 'short', hat: 'pagri', hatColor: '#A8956A', hatAccent: '#9A875E'}, outfit: {kind: 'tunic', color: '#9C8A5C', accent: '#5B4A2E', puttees: '#8C7A4E'}}, // A-05 Indian Army 1914–18: khaki pagri + tunic + puttees (white head, no caricature); add back={<RifleSlung />}
  usSoldier1918: {head: {hair: 'short', hat: 'brodie', hatColor: '#646238'}, outfit: {kind: 'tunic', color: '#6B6640', accent: '#4B3E26', puttees: '#6B6640', blanketRoll: '#8A8462'}}, // A-06 AEF 1918: olive drab, Brodie-pattern helmet, puttees, kit roll over the shoulder
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
  princip: {head: {hair: 'side', hairColor: '#1E1E1E'}, outfit: {kind: 'suit', color: '#2B2B2B', accent: '#3A3A3A'}, label: 'GAVRILO PRINCIP', sublabel: 'Bosnian Serb, aged 19'},
  franzFerdinand: {head: {hair: 'short', hat: 'plumedHat', hatColor: '#2A2A2A', facial: 'kaiser', facialColor: '#2A2A2A'}, outfit: {kind: 'tunic', color: '#8FA9C2', accent: '#2A2A2A', medals: true}, label: 'ARCHDUKE FRANZ FERDINAND', sublabel: 'Heir to Austria-Hungary'},
  // ep02 (A-01 … A-04)
  sophie: {head: {hair: 'bun', hairColor: '#4A3424', hat: 'wideBrim', hatColor: '#F4F0E4', hatAccent: '#C9B98A'}, outfit: {kind: 'gown', color: '#F2EDE0', accent: '#C9B98A'}, label: 'SOPHIE', sublabel: 'his wife'}, // A-01 pale summer dress + wide hat
  tsarNicholas: {head: {hair: 'slick', hairColor: '#4A3426', facial: 'shortBeard', facialColor: '#6E4A2E'}, outfit: {kind: 'tunic', color: '#7E7C58', accent: '#5B4A2E', medals: true}, label: 'TSAR NICHOLAS II', sublabel: 'Emperor of Russia'}, // A-02 gymnastyorka, modest medals, no crown
  lenin: {head: {hair: 'baldFringe', hairColor: '#6A4A32', facial: 'goatee', facialColor: '#6A4A32'}, outfit: {kind: 'suit', color: '#2F2F33', accent: '#3A3A3A'}, label: 'VLADIMIR LENIN', sublabel: 'Bolshevik leader'}, // A-03 dark three-piece suit (castWith('lenin', {hat: 'flatCap', hatColor: '#2F2F33'}) for the cap)
  foch: {head: {hair: 'short', hairColor: '#B8B8B0', hat: 'kepi1914', hatColor: '#2D3A5C', hatAccent: '#B08A3A', facial: 'walrus', facialColor: '#8E8E88'}, outfit: {kind: 'tunic', color: '#6F86A0', accent: '#3A2A1C', medals: true}, label: FOCH_TAG.label, sublabel: FOCH_TAG.sublabel}, // A-04 general's kepi (dark crown, gold band), horizon-blue tunic
  macarthur: {head: {hair: 'short', hat: 'officerCap', hatColor: '#6F6A44', glasses: 'dark'}, outfit: {kind: 'shirt', color: '#B49C68'}, label: 'GEN. DOUGLAS MACARTHUR', sublabel: 'Allied commander'},
};

/** Merge a preset with per-shot overrides (expression, hat swap, colours). */
export function castWith(key: string, head: Partial<CastMember['head']> = {}, outfit: Partial<Outfit> = {}): CastMember {
  const c = CAST[key];
  return {...c, head: {...c.head, ...head}, outfit: {...c.outfit, ...outfit}};
}

/** Spread a preset into <StickFigure {...castProps('chamberlain')} />: head, outfit, child, label, sublabel. */
export const castProps = (key: string) => {
  const c = CAST[key];
  return {head: c.head, outfit: c.outfit, child: c.child, label: c.label, sublabel: c.sublabel};
};

/** Crowd pools (A-08): preset keys mixed by the Crowd component. Unlabelled figures only. */
export const CROWD_POOLS: Record<string, string[]> = {
  germany1930s: ['man1', 'man2', 'man3', 'worker', 'woman1', 'woman3', 'workerW', 'partyMember', 'politician'],
  britain1938: ['man1', 'man2', 'woman1', 'woman2', 'woman3', 'politician', 'politician2', 'man3'],
  london1945: ['man1', 'man2', 'man3', 'woman1', 'woman2', 'woman3', 'workerW', 'britSoldier', 'sailor', 'kid1', 'kid2', 'nurse', 'usSoldier'],
  paris1944: ['man1', 'man2', 'man3', 'woman1', 'woman2', 'woman3', 'resistance', 'kid1', 'kid2', 'frenchSoldier'],
  congress1941: ['politician', 'politician2', 'man2'],
  sailors: ['sailor'],
  japan1945: ['japaneseMan', 'japaneseMan2', 'japaneseWoman', 'japaneseWoman2', 'japaneseChild', 'japaneseGirl'],
  china1937: ['chineseSoldier', 'chineseSoldierKhaki', 'japaneseMan', 'japaneseWoman', 'japaneseChild'],
  finale: ['man1', 'woman1', 'kid1', 'britSoldier', 'sovietSoldier', 'usSoldier', 'frenchSoldier', 'chineseSoldier', 'nurse', 'worker', 'woman2', 'kid2', 'sailor', 'polishSoldier', 'man2', 'workerW', 'japaneseMan', 'japaneseWoman', 'canSoldier', 'woman3', 'rafPilot', 'ausSoldier'],
};
