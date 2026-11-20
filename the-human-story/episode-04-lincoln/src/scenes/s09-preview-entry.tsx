// TEMPORARY preview entry for the s01/s09 build (lets the chapter be rendered while other chapters are mid-build).
import React from 'react';
import {AbsoluteFill, Composition, Sequence, registerRoot} from 'remotion';
import {CHAPTERS, FPS, TOTAL} from '../timeline';
import {CaptionLayer} from '../kit/Cards';
import {ChannelLogo} from '../components/ChannelLogo';
import {loadFonts} from '../components/Fonts';
import {S01} from './S01';
import {S09} from './S09';
loadFonts();
const COMPS: Record<string, React.FC> = {s01: S01, s09: S09};
const Ep: React.FC = () => (
  <AbsoluteFill style={{background: '#0B0B0D'}}>
    {CHAPTERS.map((c, i) => {
      const a = Math.round(c.start * FPS);
      const b = i + 1 < CHAPTERS.length ? Math.round(CHAPTERS[i + 1].start * FPS) : TOTAL;
      const Comp = COMPS[c.section];
      return Comp ? <Sequence key={c.section} from={a} durationInFrames={b - a}><Comp /></Sequence> : null;
    })}
    <CaptionLayer />
    <ChannelLogo />
  </AbsoluteFill>
);
registerRoot(() => <Composition id="Episode" component={Ep} width={1920} height={1080} fps={30} durationInFrames={TOTAL} />);
