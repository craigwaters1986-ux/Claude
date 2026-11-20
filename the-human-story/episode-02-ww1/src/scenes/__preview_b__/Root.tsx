// Editor B preview: s06–s11 mounted as in the episode (absolute frames), plus a "StillsB" composition whose
// frame i shows absolute time STILLS[i] (one sample per storyboard shot) for a fast still sequence.
import React from 'react';
import {AbsoluteFill, Composition, Sequence, useCurrentFrame} from 'remotion';
import {W, H, FPS} from '../../styles/theme';
import {Captions, ChapterBanner} from '../../components/Text';
import {ChannelLogo} from '../../components/ChannelLogo';
import {loadFonts} from '../../components/Fonts';
import {S06Picture, S06Overlay} from '../S06';
import {S07Picture, S07Overlay} from '../S07';
import {S08Picture, S08Overlay} from '../S08';
import {S09Picture, S09Overlay} from '../S09';
import {S10Picture, S10Overlay} from '../S10';
import {S11Picture, S11Overlay} from '../S11';

loadFonts();

type Sec = {id: string; start: number; end: number; P: React.FC<{f: number}>; O: React.FC; ch: [number, string]};
const SECS: Sec[] = [
  {id: 's06', start: 320, end: 390, P: S06Picture, O: S06Overlay, ch: [5, 'A World War']},
  {id: 's07', start: 390, end: 450, P: S07Picture, O: S07Overlay, ch: [6, '1916: Verdun and the Somme']},
  {id: 's08', start: 450, end: 500, P: S08Picture, O: S08Overlay, ch: [7, 'The Home Front']},
  {id: 's09', start: 500, end: 560, P: S09Picture, O: S09Overlay, ch: [8, '1917: The Turning Year']},
  {id: 's10', start: 560, end: 620, P: S10Picture, O: S10Overlay, ch: [9, '1918: The Last Battles']},
  {id: 's11', start: 620, end: 720, P: S11Picture, O: S11Overlay, ch: [10, 'The Cost and the Legacy']},
];

const Pic: React.FC<{P: React.FC<{f: number}>}> = ({P}) => {
  const f = useCurrentFrame();
  return <P f={f} />;
};

/** Absolute-frame view of one moment (abs frame `a`). */
const At: React.FC<{a: number}> = ({a}) => {
  const now = useCurrentFrame();
  const s = SECS.find((x) => a >= x.start * FPS && a < x.end * FPS) ?? SECS[0];
  const local = a - s.start * FPS;
  const O = s.O;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={now - local} layout="none">
        <Pic P={s.P} />
        <AbsoluteFill>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'hidden'}}>
            <O />
            <ChapterBanner num={s.ch[0]} title={s.ch[1]} at={0} dur={75} />
          </svg>
        </AbsoluteFill>
      </Sequence>
      <AbsoluteFill>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
          <Captions t={a / FPS} />
        </svg>
      </AbsoluteFill>
      <ChannelLogo />
    </AbsoluteFill>
  );
};


const Stills: React.FC<{times: number[]}> = ({times}) => {
  const i = useCurrentFrame();
  return <At a={Math.round(times[Math.min(i, times.length - 1)] * FPS)} />;
};

const Range: React.FC = () => {
  const f = useCurrentFrame();
  return <At a={320 * FPS + f} />;
};

export const PreviewRootB: React.FC = () => (
  <>
    <Composition id="RangeB" component={Range} durationInFrames={400 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="StillsB" component={Stills} durationInFrames={60} fps={FPS} width={W} height={H} defaultProps={{times: [330]}} />
  </>
);
