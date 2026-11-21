// Episode 4 (ep04-lincoln) full timeline: 600 s = 18,000 frames at 30 fps.
// Layers: section pictures · caption band · channel logo (top-left, every frame). Audio is muxed after render.
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {CHAPTERS, FPS, TOTAL} from './timeline';
import {CaptionLayer} from './kit/Cards';
import {ChannelLogo} from './components/ChannelLogo';
import {loadFonts} from './components/Fonts';
import {S01} from './scenes/S01';
import {S02} from './scenes/S02';
import {S03} from './scenes/S03';
import {S04} from './scenes/S04';
import {S05} from './scenes/S05';
import {S06} from './scenes/S06';
import {S07} from './scenes/S07';
import {S08} from './scenes/S08';
import {S09} from './scenes/S09';
import {S10} from './scenes/S10';

loadFonts();
const COMPS: Record<string, React.FC> = {s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07, s08: S08, s09: S09, s10: S10};

export const Episode: React.FC = () => (
  <AbsoluteFill style={{background: '#0B0B0D'}}>
    {CHAPTERS.map((c, i) => {
      const a = Math.round(c.start * FPS);
      const b = i + 1 < CHAPTERS.length ? Math.round(CHAPTERS[i + 1].start * FPS) : TOTAL;
      const Comp = COMPS[c.section];
      return (
        <Sequence key={c.section} from={a} durationInFrames={b - a} name={c.section}>
          <Comp />
        </Sequence>
      );
    })}
    <CaptionLayer />
    <ChannelLogo />
  </AbsoluteFill>
);
