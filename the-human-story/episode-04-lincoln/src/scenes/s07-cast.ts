// s07 extra cast (illustrative people: never named, no tags). Registered into the shared CAST table at
// import time so Person, castBuild and castScale all know them. Same white head as everyone else.
import {CAST} from '../kit/Cast';

const extra: typeof CAST = {
  // Cabinet members, July 1862 (illustrative: unnamed)
  cabA: {head: {hair: 'baldFringe', hairColor: '#8A8478', facial: 'shortBeard', facialColor: '#9A948A', age: 0.5}, outfit: {kind: 'suit', color: '#2E2E34', accent: '#E6DCC4', bowtie: true, trousers: '#26262A'}},
  cabB: {head: {hair: 'swept', hairColor: '#4A3E34', facial: 'walrus', facialColor: '#4A3E34', age: 0.35}, outfit: {kind: 'suit', color: '#3A342E', accent: '#2A2420', bowtie: true, trousers: '#2E2A26'}},
  cabC: {head: {hair: 'side', hairColor: '#C9C4BA', age: 0.6}, outfit: {kind: 'suit', color: '#2A2E3A', accent: '#E6DCC4', bowtie: true, trousers: '#26282E'}},
  // a man enlisting (civilian clothes) and recruits in line (illustrative)
  recruit: {head: {hair: 'crew', hairColor: '#1E1A18'}, outfit: {kind: 'shirt', color: '#B8A27A', trousers: '#4E4434'}},
  recruit2: {head: {hair: 'short', hairColor: '#1E1A18', hat: 'flatCap', hatColor: '#5A5048'}, outfit: {kind: 'coat', color: '#6B5A44', accent: '#3E3428', trousers: '#4A4238'}},
};
for (const [k, v] of Object.entries(extra)) if (!CAST[k]) CAST[k] = v;
export const S07_CAST = Object.keys(extra);
