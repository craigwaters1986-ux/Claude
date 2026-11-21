// Episode 4 cast (United States, 1809–1922). Historical figures carry name tags at first appearance;
// families, soldiers, crowds and passers-by without a tag are illustrative people and are never named.
// Series rule: every head is the same white head (no skin colour); identity comes from hair, facial hair,
// clothes, props and the name tag. Lincoln is tall (TALL build, scale 1.15) and ages visibly across the
// chapters: boy · young man · lawyer · 1858 candidate · President (beard from 1860, sourced: Grace Bedell
// letter, October 1860) · 1865.
import React from 'react';
import {StickFigure, FigureProps, Outfit} from '../characters/StickFigure';
import type {HeadSpec} from '../characters/Head';
import {TALL, Dims} from '../characters/skeleton';

type Spec = {head: HeadSpec; outfit: Outfit; scale?: number; child?: boolean; build?: Dims; label?: string; sub?: string};
const HAIR = '#1E1A18';
const GREYING = '#4A4440';
const BLACK = '#1C1C20';
export const CAST: Record<string, Spec> = {
  // Abraham Lincoln across his life
  abeBoy: {head: {hair: 'mop', hairColor: HAIR, expression: 'curious'}, outfit: {kind: 'shirt', color: '#B8A27A', trousers: '#6A5232'}, child: true, label: 'ABRAHAM LINCOLN', sub: 'aged 7'},
  abeYoung: {head: {hair: 'mop', hairColor: HAIR}, outfit: {kind: 'shirt', color: '#C9B48A', trousers: '#5A4A34'}, build: TALL, scale: 1.12, label: 'ABRAHAM LINCOLN', sub: 'aged 23'},
  abeLawyer: {head: {hair: 'mop', hairColor: HAIR, age: 0.15}, outfit: {kind: 'suit', color: BLACK, accent: BLACK, bowtie: true, trousers: '#26262A'}, build: TALL, scale: 1.15, label: 'ABRAHAM LINCOLN'},
  abe1858: {head: {hair: 'mop', hairColor: HAIR, hat: 'stovepipe', hatColor: BLACK, age: 0.3}, outfit: {kind: 'longcoat', color: BLACK, accent: '#2A2A2E', trousers: '#26262A'}, build: TALL, scale: 1.15, label: 'ABRAHAM LINCOLN'},
  abePres: {head: {hair: 'mop', hairColor: HAIR, facial: 'chinCurtain', facialColor: HAIR, hat: 'stovepipe', hatColor: BLACK, age: 0.55}, outfit: {kind: 'longcoat', color: BLACK, accent: '#2A2A2E', trousers: '#26262A'}, build: TALL, scale: 1.15, label: 'ABRAHAM LINCOLN', sub: 'President'},
  abe1865: {head: {hair: 'mop', hairColor: GREYING, facial: 'chinCurtain', facialColor: GREYING, hat: 'stovepipe', hatColor: BLACK, age: 0.85, expression: 'tired'}, outfit: {kind: 'longcoat', color: BLACK, accent: '#2A2A2E', trousers: '#26262A'}, build: TALL, scale: 1.15, label: 'ABRAHAM LINCOLN'},
  // family
  thomas: {head: {hair: 'short', hairColor: '#3A2A20', facial: 'stubble', facialColor: '#3A2A20', hat: 'flatCap', hatColor: '#5A4A36'}, outfit: {kind: 'shirt', color: '#8A7450', trousers: '#4E4434'}, label: 'THOMAS LINCOLN', sub: 'father, carpenter and farmer'},
  nancy: {head: {hair: 'bun', hairColor: '#2E2420', hat: 'bonnet', hatColor: '#C9B79A', hatAccent: '#6A4A30'}, outfit: {kind: 'dress', color: '#6A5A78', accent: '#E6D8B8', apron: '#E6DCC4'}, label: 'NANCY HANKS LINCOLN', sub: 'mother'},
  sarahSister: {head: {hair: 'bob', hairColor: '#2E2420'}, outfit: {kind: 'dress', color: '#8A5A4A', accent: '#E6D8B8'}, child: true, label: 'SARAH LINCOLN', sub: 'sister'},
  sarahBush: {head: {hair: 'bun', hairColor: '#5A4030', hat: 'bonnet', hatColor: '#DCCFB0', hatAccent: '#7E2620'}, outfit: {kind: 'dress', color: '#4E6A62', accent: '#E6D8B8', apron: '#E6DCC4'}, label: 'SARAH BUSH JOHNSTON', sub: 'stepmother'},
  mary: {head: {hair: 'bun', hairColor: '#3A2A20'}, outfit: {kind: 'gown', color: '#5A3A6A', accent: '#E3C77A'}, scale: 0.92, label: 'MARY TODD LINCOLN'},
  maryMourning: {head: {hair: 'bun', hairColor: '#3A2A20', expression: 'grief'}, outfit: {kind: 'gown', color: '#1E1C22', accent: '#3A3640'}, scale: 0.92},
  robert: {head: {hair: 'side', hairColor: '#2E2420'}, outfit: {kind: 'suit', color: '#2A2A30', accent: '#2A2A30', bowtie: true, trousers: '#26262A'}, label: 'ROBERT LINCOLN', sub: 'son'},
  willie: {head: {hair: 'side', hairColor: '#3A2A20'}, outfit: {kind: 'suit', color: '#3A4458', accent: '#E6D8B8', trousers: '#2E3446'}, child: true, label: 'WILLIE LINCOLN'},
  // politics and war
  stuart: {head: {hair: 'side', hairColor: '#4A3A2A'}, outfit: {kind: 'suit', color: '#3A3430', accent: '#2A2420', bowtie: true, trousers: '#2E2A26'}, label: 'JOHN T. STUART', sub: 'lawyer, later his partner'},
  douglas: {head: {hair: 'swept', hairColor: '#2A2420', expression: 'determined', wide: 1.08}, outfit: {kind: 'suit', color: '#2E3240', accent: '#2A2420', bowtie: true, trousers: '#26282E'}, scale: 0.86, label: 'STEPHEN A. DOUGLAS', sub: 'Democrat, Illinois senator'},
  douglass: {head: {hair: 'curly', hairColor: '#C9C4BA', facial: 'shortBeard', facialColor: '#C9C4BA'}, outfit: {kind: 'suit', color: '#2A2A30', accent: '#E6DCC4', bowtie: true, trousers: '#26262A'}, scale: 1.02, label: 'FREDERICK DOUGLASS', sub: 'abolitionist'},
  douglass1863: {head: {hair: 'curly', hairColor: '#5A5450', facial: 'shortBeard', facialColor: '#5A5450'}, outfit: {kind: 'suit', color: '#2A2A30', accent: '#E6DCC4', bowtie: true, trousers: '#26262A'}, scale: 1.02, label: 'FREDERICK DOUGLASS', sub: 'abolitionist'},
  grace: {head: {hair: 'long', hairColor: '#6A4A30', hat: 'bonnet', hatColor: '#DCCFB0', hatAccent: '#3F6EA6'}, outfit: {kind: 'dress', color: '#7A8AA6', accent: '#E6D8B8'}, child: true, label: 'GRACE BEDELL', sub: 'aged 11'},
  davis: {head: {hair: 'swept', hairColor: '#8A8478', facial: 'goatee', facialColor: '#9A948A'}, outfit: {kind: 'suit', color: '#4A4A4E', accent: '#2A2A2E', bowtie: true, trousers: '#3A3A3E'}, label: 'JEFFERSON DAVIS', sub: 'Confederate President'},
  grant: {head: {hair: 'short', hairColor: '#5A4030', facial: 'shortBeard', facialColor: '#5A4030', hat: 'kepiUS', hatColor: '#2A3550'}, outfit: {kind: 'longcoat', color: '#2A3550', accent: '#1E2438', trousers: '#2A3550'}, label: 'ULYSSES S. GRANT', sub: 'Union'},
  lee: {head: {hair: 'swept', hairColor: '#E6E2DA', facial: 'shortBeard', facialColor: '#EEEAE2'}, outfit: {kind: 'longcoat', color: '#7A7E84', accent: '#E3C77A', trousers: '#6A6E74'}, label: 'ROBERT E. LEE', sub: 'Confederate'},
  booth: {head: {hair: 'slick', hairColor: '#0E0E10', facial: 'thin', facialColor: '#0E0E10', expression: 'grim'}, outfit: {kind: 'suit', color: '#151518', accent: '#151518', trousers: '#151518'}, label: 'JOHN WILKES BOOTH', sub: 'actor, Confederate sympathiser'},
  // illustrative people (never named)
  unionSoldier: {head: {hair: 'short', hairColor: '#4A3A2A', hat: 'kepiUS', hatColor: '#2A3550'}, outfit: {kind: 'tunic', color: '#2A3550', accent: '#1E2438', trousers: '#6E86A8'}},
  usct: {head: {hair: 'crew', hairColor: '#1E1A18', hat: 'kepiUS', hatColor: '#2A3550'}, outfit: {kind: 'tunic', color: '#2A3550', accent: '#1E2438', trousers: '#6E86A8'}},
  confedSoldier: {head: {hair: 'short', hairColor: '#4A3A2A', hat: 'kepiUS', hatColor: '#7A7E84'}, outfit: {kind: 'tunic', color: '#7A7E84', accent: '#5A5E64', trousers: '#6A6E74'}},
  farmer: {head: {hair: 'short', hairColor: '#4A3A2A', facial: 'stubble', hat: 'wideBrim', hatColor: '#8A7450'}, outfit: {kind: 'shirt', color: '#9A8A6A', trousers: '#4E4434'}},
  townsman: {head: {hair: 'side', hairColor: '#3A302A', facial: 'walrus', facialColor: '#3A302A', hat: 'tophat', hatColor: '#2E2A28'}, outfit: {kind: 'suit', color: '#4A4238', accent: '#2A2420', bowtie: true, trousers: '#3A342E'}},
  townswoman: {head: {hair: 'bun', hairColor: '#5A4030', hat: 'bonnet', hatColor: '#C9B79A', hatAccent: '#3F6EA6'}, outfit: {kind: 'gown', color: '#6A7A5A', accent: '#E6D8B8'}},
  visitor: {head: {hair: 'side', hairColor: '#5A4A3A', facial: 'walrus', facialColor: '#5A4A3A'}, outfit: {kind: 'suit', color: '#4A4A52', accent: '#7E2620', trousers: '#3A3A40'}},
  newsboy: {head: {hair: 'mop', hairColor: '#6A4A30', hat: 'flatCap', hatColor: '#5A5048'}, outfit: {kind: 'coat', color: '#6B5A44', accent: '#3E3428', trousers: '#4A4238', satchel: '#8A7450'}, child: true},
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
      build={c.build}
      head={{...c.head, ...(expression ? {expression} : {}), ...head}}
      outfit={{...c.outfit, ...outfit}}
      label={tag ? c.label : rest.label}
      sublabel={tag ? c.sub : rest.sublabel}
    />
  );
};
/** Placement scale and build for a cast member (for IK and seat solving). */
export const castScale = (id: string, s = 1) => s * (CAST[id].scale ?? 1);
export const castBuild = (id: string) => CAST[id].build ?? (CAST[id].child ? true : undefined);
