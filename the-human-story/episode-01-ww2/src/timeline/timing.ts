// Narration-driven timing.  narration.json is written by scripts/tts.py and
// contains the exact start/end of every spoken sentence, so every scene can
// cue its animation to the words.
import narration from './narration.json';
import {FPS} from '../styles/theme';

export type Caption = {text: string; start: number; end: number};
export type Sentence = {text: string; start: number; end: number; captions: Caption[]};
export type Section = {id: string; chapter: string; start: number; end: number; sentences: Sentence[]};

export const SECTIONS: Section[] = (narration as {sections: Section[]}).sections;

export const sectionById = (id: string) => {
  const s = SECTIONS.find((x) => x.id === id);
  if (!s) throw new Error('Unknown section ' + id);
  return s;
};

/** Beat helper for a section: local frame at which sentence i starts (offset seconds optional). */
export function beats(id: string) {
  const s = sectionById(id);
  const at = (i: number, off = 0) => Math.round((s.sentences[i].start - s.start + off) * FPS);
  const endOf = (i: number, off = 0) => Math.round((s.sentences[i].end - s.start + off) * FPS);
  const dur = Math.round((s.end - s.start) * FPS);
  return {at, endOf, dur, section: s};
}

export const ALL_CAPTIONS: Caption[] = SECTIONS.flatMap((s) => s.sentences.flatMap((x) => x.captions));

/** Narration activity (for music ducking): true if a sentence is being spoken at time t (s). */
export const speakingAt = (t: number, pad = 0.25) =>
  SECTIONS.some((s) => s.sentences.some((x) => t >= x.start - pad && t <= x.end + pad));
