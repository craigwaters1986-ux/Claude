// Episode 3 cast in early Stuart dress. Historical figures carry name tags at first appearance; the parish
// family, neighbours, children and crowds are illustrative people and are never named.
import React from 'react';
import {StickFigure, FigureProps, Outfit} from '../characters/StickFigure';
import type {HeadSpec} from '../characters/Head';

type Spec = {head: HeadSpec; outfit: Outfit; scale?: number; child?: boolean; label?: string; sub?: string};
const DARK = '#2E2420';
export const CAST: Record<string, Spec> = {
  catesby: {head: {hair: 'short', hairColor: DARK, facial: 'shortBeard', facialColor: DARK, hat: 'capotain', hatColor: '#2A2522', hatAccent: '#7E2620', ruff: 'falling'}, outfit: {kind: 'tunic', color: '#3A3F52', accent: '#2A2522', trousers: '#2E2E3A'}, scale: 1.04, label: 'ROBERT CATESBY', sub: 'Warwickshire gentleman'},
  winter: {head: {hair: 'short', hairColor: '#5A4030', facial: 'goatee', facialColor: '#5A4030', hat: 'capotain', hatColor: '#4A3A2A', ruff: true}, outfit: {kind: 'tunic', color: '#5A4632', accent: '#3A2A1E', trousers: '#3E3428'}, label: 'THOMAS WINTER'},
  percy: {head: {hair: 'swept', hairColor: '#BDB8AE', facial: 'shortBeard', facialColor: '#C9C4BA', hat: 'capotain', hatColor: '#30302E', ruff: true}, outfit: {kind: 'tunic', color: '#4C5A48', accent: '#2E3A2C', trousers: '#2F3A2D'}, scale: 1.07, label: 'THOMAS PERCY'},
  wright: {head: {hair: 'curly', hairColor: '#6A4A30', facial: 'shortBeard', facialColor: '#6A4A30', ruff: 'falling'}, outfit: {kind: 'tunic', color: '#6B3A30', accent: '#3A1E18', trousers: '#40302A'}, label: 'JOHN WRIGHT'},
  fawkes: {head: {hair: 'short', hairColor: '#7A4A2A', facial: 'shortBeard', facialColor: '#8A4E2A', hat: 'capotain', hatColor: '#4A3A2A', hatAccent: '#2A2018', ruff: 'falling'}, outfit: {kind: 'longcoat', color: '#5E5446', accent: '#3A3228', trousers: '#3A342C'}, scale: 1.03, label: 'GUY FAWKES', sub: 'called himself John Johnson'},
  monteagle: {head: {hair: 'short', hairColor: '#4B3624', facial: 'goatee', facialColor: '#4B3624', ruff: true}, outfit: {kind: 'tunic', color: '#7E2620', accent: '#E2B23C', trousers: '#4A1A16'}, label: 'LORD MONTEAGLE', sub: 'Catholic peer'},
  monteagleOut: {head: {hair: 'short', hairColor: '#4B3624', facial: 'goatee', facialColor: '#4B3624', ruff: true, hat: 'capotain', hatColor: '#1E1A1A', hatAccent: '#E2B23C'}, outfit: {kind: 'longcoat', color: '#7E2620', accent: '#E2B23C', trousers: '#4A1A16'}},
  cecil: {head: {hair: 'side', hairColor: '#3A302A', facial: 'goatee', facialColor: '#3A302A', ruff: true}, outfit: {kind: 'robe', color: '#26242A', accent: '#8A7A5A'}, scale: 0.9, label: 'ROBERT CECIL', sub: 'Earl of Salisbury, chief minister'},
  james: {head: {hair: 'short', hairColor: '#8A6A48', facial: 'shortBeard', facialColor: '#8A6A48', hat: 'crown', hatColor: '#E2B23C', ruff: true}, outfit: {kind: 'robe', color: '#8E2A22', accent: '#F2EEE4'}, label: 'JAMES VI AND I'},
  tresham: {head: {hair: 'short', hairColor: '#5A4030', facial: 'goatee', facialColor: '#5A4030', hat: 'capotain', hatColor: '#3A3530', ruff: 'falling'}, outfit: {kind: 'tunic', color: '#3E5A66', accent: '#24363E', trousers: '#2E3E44'}, label: 'FRANCIS TRESHAM', sub: 'conspirator, Monteagle’s brother-in-law'},
  knyvett: {head: {hair: 'baldFringe', hairColor: '#A8A49C', facial: 'shortBeard', facialColor: '#B8B4AC', hat: 'capotain', hatColor: '#24242A', ruff: true}, outfit: {kind: 'longcoat', color: '#3C4450', accent: '#22262E', trousers: '#2A2E36'}, label: 'SIR THOMAS KNYVETT'},
  footman: {head: {hair: 'mop', hairColor: '#6A4A30', expression: 'neutral'}, outfit: {kind: 'tunic', color: '#3F6EA6', accent: '#E3C77A', trousers: '#2E4A70'}, scale: 0.97},
  ewens: {head: {hair: 'short', hairColor: '#4A3A2A', ruff: 'falling'}, outfit: {kind: 'robe', color: '#2A282C', accent: '#5A5048'}, label: 'RALPH EWENS', sub: 'Clerk of the House of Commons'},
  examiner: {head: {hair: 'side', hairColor: '#5A5048', facial: 'goatee', facialColor: '#5A5048', ruff: true}, outfit: {kind: 'robe', color: '#2E2C30', accent: '#6A6058'}},
  officer: {head: {hair: 'crew', hairColor: '#4A3A2A', facial: 'stubble', facialColor: '#4A3A2A', hat: 'capotain', hatColor: '#3A3A3A'}, outfit: {kind: 'longcoat', color: '#5A5E52', accent: '#3A3E34', trousers: '#3A3E34'}},
  lord: {head: {hair: 'short', hairColor: '#4A3A2A', facial: 'goatee', ruff: true}, outfit: {kind: 'robe', color: '#9E2E26', accent: '#F2EEE4'}},
  member: {head: {hair: 'side', hairColor: '#3A302A', facial: 'shortBeard', ruff: 'falling', hat: 'capotain', hatColor: '#2E2A28'}, outfit: {kind: 'longcoat', color: '#2E2C34', accent: '#1E1C22', trousers: '#2A2830'}},
  judge: {head: {hair: 'side', hairColor: '#C9C4BA', facial: 'shortBeard', facialColor: '#C9C4BA', ruff: true}, outfit: {kind: 'robe', color: '#9E2E26', accent: '#F2EEE4'}},
  preacher: {head: {hair: 'short', hairColor: '#8A8478', ruff: 'falling'}, outfit: {kind: 'robe', color: '#1F1E22', accent: '#F2EEE4'}},
  crier: {head: {hair: 'short', hairColor: '#5A4030', facial: 'thin', hat: 'capotain', hatColor: '#3A2E26'}, outfit: {kind: 'tunic', color: '#8E2A22', accent: '#E3C77A', trousers: '#4A2A22'}},
  elizabethI: {head: {hair: 'curly', hairColor: '#B5542A', hat: 'crown', hatColor: '#E2B23C', ruff: true}, outfit: {kind: 'gown', color: '#E8E0CC', accent: '#B23A2E'}, label: 'ELIZABETH I'},
  mary: {head: {hair: 'bob', hairColor: '#7A4A2A', hat: 'coif', hatColor: '#F2EEE4', ruff: true}, outfit: {kind: 'gown', color: '#2A2830', accent: '#F2EEE4'}, label: 'MARY, QUEEN OF SCOTS'},
  princess: {head: {hair: 'long', hairColor: '#A0603A', ruff: 'falling', expression: 'neutral'}, outfit: {kind: 'gown', color: '#C9B0C8', accent: '#E2B23C'}, child: true, label: 'PRINCESS ELIZABETH', sub: 'daughter of James'},
  envoyEN: {head: {hair: 'short', hairColor: '#4A3A2A', facial: 'goatee', ruff: true}, outfit: {kind: 'tunic', color: '#2E3A5A', accent: '#E2B23C', trousers: '#232C44'}},
  envoyES: {head: {hair: 'slick', hairColor: '#1E1A18', facial: 'handlebar', facialColor: '#1E1A18', ruff: true}, outfit: {kind: 'tunic', color: '#1E1C20', accent: '#B23A2E', trousers: '#18161A'}},
  // the parish family (illustrative)
  mother: {head: {hair: 'bun', hairColor: '#694436', expression: 'neutral'}, outfit: {kind: 'gown', color: '#496F69', accent: '#DED0AD'}, scale: 0.98},
  father: {head: {hair: 'short', hairColor: '#5A4030', facial: 'stubble', facialColor: '#5A4030', hat: 'flatCap', hatColor: '#5A4A36'}, outfit: {kind: 'tunic', color: '#7A6A4A', accent: '#4A3E2A', trousers: '#4E4434'}},
  child: {head: {hair: 'curly', hairColor: '#614938', expression: 'curious'}, outfit: {kind: 'tunic', color: '#A5644B', accent: '#E1CEB0'}, child: true},
  neighbour: {head: {hair: 'long', hairColor: '#3A2A20', hat: 'coif', hatColor: '#F2EEE4'}, outfit: {kind: 'gown', color: '#8A5A4A', accent: '#E6D8B8'}},
  neighbourMan: {head: {hair: 'side', hairColor: '#2E2620', facial: 'shortBeard', facialColor: '#2E2620', hat: 'flatCap', hatColor: '#3A3A3A'}, outfit: {kind: 'tunic', color: '#58604E', accent: '#3A3E34', trousers: '#3E4436'}},
  // later generations (illustrative)
  girl1800: {head: {hair: 'bob', hairColor: '#7A5A3A', hat: 'bonnet', hatColor: '#C9B79A', hatAccent: '#7E2620'}, outfit: {kind: 'dress', color: '#5E6B8A', accent: '#E6D8B8'}, child: true},
  boy1800: {head: {hair: 'mop', hairColor: '#4A3A2A', hat: 'flatCap', hatColor: '#4E4A44'}, outfit: {kind: 'coat', color: '#6B5A44', accent: '#3E3428', trousers: '#4A4238'}, child: true},
  boy1800b: {head: {hair: 'spiky', hairColor: '#8A6A40'}, outfit: {kind: 'shirt', color: '#B8A88A', trousers: '#5A4E40'}, child: true},
};

export type PersonProps = Omit<FigureProps, 'head' | 'outfit'> & {id: string; expression?: HeadSpec['expression']; head?: Partial<HeadSpec>; tag?: boolean; outfit?: Partial<Outfit>};
/** A cast member. `tag` shows the name tag (first appearance only). */
export const Person: React.FC<PersonProps> = ({id, expression, head, tag, outfit, scale, ...rest}) => {
  const c = CAST[id];
  if (!c) throw new Error('unknown cast id ' + id);
  return (
    <StickFigure
      {...rest}
      scale={(scale ?? 1) * (c.scale ?? 1)}
      child={c.child}
      head={{...c.head, ...(expression ? {expression} : {}), ...head}}
      outfit={{...c.outfit, ...outfit}}
      label={tag ? c.label : rest.label}
      sublabel={tag ? c.sub : rest.sublabel}
    />
  );
};
