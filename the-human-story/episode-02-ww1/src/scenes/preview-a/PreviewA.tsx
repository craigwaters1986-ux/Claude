// Editor A's still-preview root (S01–S05 only, so B's in-progress S06–S11 cannot break it). Delete after assembly.
import React from 'react';
import {AbsoluteFill, Composition, Sequence, useCurrentFrame} from 'remotion';
import {W, H, FPS} from '../../styles/theme';
import {Captions, ChapterBanner} from '../../components/Text';
import {ChannelLogo} from '../../components/ChannelLogo';
import {loadFonts} from '../../components/Fonts';
import {S01Picture, S01Overlay} from '../S01';
import {S02Picture, S02Overlay} from '../S02';
import {S03Picture, S03Overlay} from '../S03';
import {S04Picture, S04Overlay} from '../S04';
import {S05Picture, S05Overlay} from '../S05';

loadFonts();
const SECS = [
  {s: 0, e: 35, P: S01Picture, O: S01Overlay, ch: null as null | [number, string]},
  {s: 35, e: 110, P: S02Picture, O: S02Overlay, ch: [1, 'Europe Before 1914'] as [number, string]},
  {s: 110, e: 190, P: S03Picture, O: S03Overlay, ch: [2, 'Sarajevo and the July Crisis'] as [number, string]},
  {s: 190, e: 260, P: S04Picture, O: S04Overlay, ch: [3, '1914: The War of Movement Stops'] as [number, string]},
  {s: 260, e: 320, P: S05Picture, O: S05Overlay, ch: [4, 'Life in the Trenches'] as [number, string]},
];
const Pic: React.FC<{P: React.FC<{f: number}>}> = ({P}) => {
  const f = useCurrentFrame();
  return <P f={f} />;
};
const Cap: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <Captions t={f / FPS} />
    </svg>
  );
};
const A: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {SECS.map((x, i) => (
      <Sequence key={i} from={x.s * FPS} durationInFrames={(x.e - x.s) * FPS}>
        <Pic P={x.P} />
        <AbsoluteFill>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'hidden'}}>
            <x.O />
            {x.ch && <ChapterBanner num={x.ch[0]} title={x.ch[1]} at={0} dur={75} />}
          </svg>
        </AbsoluteFill>
      </Sequence>
    ))}
    <Cap />
    <ChannelLogo />
  </AbsoluteFill>
);
export const RootA: React.FC = () => <Composition id="EdA" component={A} durationInFrames={9600} fps={30} width={1920} height={1080} />;
