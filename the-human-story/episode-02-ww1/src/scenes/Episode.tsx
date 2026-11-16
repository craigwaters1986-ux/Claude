// Episode 1 — full timeline (605 s = 18,150 frames at 30 fps).
// Layers (bottom → top): section pictures (shots) · section overlays (cards, banners) ·
// chapter transitions (ink wipe / dip) · captions band · channel logo (top-left, always on).  Audio: the measured master mix only.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {W, H, FPS} from '../styles/theme';
import {InkWipe} from '../components/Camera';
import {Captions, ChapterBanner} from '../components/Text';
import {ChannelLogo} from '../components/ChannelLogo';
import {S01Picture, S01Overlay} from './S01';
import {S02Picture, S02Overlay} from './S02';
import {S03Picture, S03Overlay} from './S03';
import {S04Picture, S04Overlay} from './S04';
import {S05Picture, S05Overlay} from './S05';
import {S06Picture, S06Overlay} from './S06';
import {S07Picture, S07Overlay} from './S07';
import {S08Picture, S08Overlay} from './S08';
import {S09Picture, S09Overlay} from './S09';
import {S10Picture, S10Overlay} from './S10';
import {S11Picture, S11Overlay} from './S11';

export const EPISODE_FRAMES = 18150;

type Sec = {id: string; start: number; end: number; Picture: React.FC<{f: number}>; Overlay: React.FC; chapter?: [number, string]; pre?: number; into?: 'ink' | 'fade' | 'dip' | 'none'};

// Section windows (s). s11 runs to 605 s (end card held ≥ 5 s; Director decision 08).
export const SECTIONS_EP: Sec[] = [
  {id: 's01', start: 0, end: 30, Picture: S01Picture, Overlay: S01Overlay, into: 'none'},
  {id: 's02', start: 30, end: 90, Picture: S02Picture, Overlay: S02Overlay, chapter: [1, 'The World After World War I'], into: 'ink'},
  {id: 's03', start: 90, end: 150, Picture: S03Picture, Overlay: S03Overlay, chapter: [2, "Hitler's Rise to Power"], into: 'ink'},
  {id: 's04', start: 150, end: 210, Picture: S04Picture, Overlay: S04Overlay, chapter: [3, 'World War II Begins'], into: 'ink'},
  {id: 's05', start: 210, end: 270, Picture: S05Picture, Overlay: S05Overlay, chapter: [4, 'Europe Falls'], into: 'ink'},
  {id: 's06', start: 270, end: 330, Picture: S06Picture, Overlay: S06Overlay, chapter: [5, 'The War Becomes Global'], into: 'ink'},
  {id: 's07', start: 330, end: 390, Picture: S07Picture, Overlay: S07Overlay, chapter: [6, 'The Turning Points'], into: 'ink'},
  {id: 's08', start: 390, end: 450, Picture: S08Picture, Overlay: S08Overlay, chapter: [7, 'D-Day and the Liberation of Europe'], into: 'ink'},
  {id: 's09', start: 450, end: 510, Picture: S09Picture, Overlay: S09Overlay, chapter: [8, 'The Fall of Nazi Germany'], into: 'ink'},
  // s09 → s10: slow fade (evening sea → Pacific map): s10's picture pre-rolls 30 frames under s09's last frames.
  {id: 's10', start: 510, end: 570, Picture: S10Picture, Overlay: S10Overlay, chapter: [9, 'How World War II Finally Ended'], into: 'fade', pre: 30},
  // s10 → s11: slow dip through black.
  {id: 's11', start: 570, end: 605, Picture: S11Picture, Overlay: S11Overlay, chapter: [10, 'The Human Cost and the Legacy'], into: 'dip'},
];

const Picture: React.FC<{s: Sec}> = ({s}) => {
  const fr = useCurrentFrame();
  const pre = s.pre ?? 0;
  const f = fr - pre;
  const op = pre > 0 && f < 0 ? (fr + 1) / pre : 1;
  const P = s.Picture;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <P f={f} />
    </AbsoluteFill>
  );
};

const Overlay: React.FC<{s: Sec}> = ({s}) => {
  const O = s.Overlay;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'hidden'}}>
        <O />
        {s.chapter && <ChapterBanner num={s.chapter[0]} title={s.chapter[1]} at={0} dur={75} />}
      </svg>
    </AbsoluteFill>
  );
};

const Transitions: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {SECTIONS_EP.map((s) => {
        const at = Math.round(s.start * FPS);
        if (s.into === 'ink') return <InkWipe key={s.id} at={at - 10} dur={20} />;
        if (s.into === 'dip' && f >= at - 24 && f < at + 20) {
          const o = f < at ? (f - (at - 24)) / 24 : 1 - (f - at) / 20;
          return <AbsoluteFill key={s.id} style={{background: '#000', opacity: Math.max(0, Math.min(1, o))}} />;
        }
        return null;
      })}
    </>
  );
};

const CaptionLayer: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
        <Captions t={f / FPS} />
      </svg>
    </AbsoluteFill>
  );
};

export const Episode: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('audio/mix.wav')} />
    {SECTIONS_EP.map((s) => {
      const from = Math.round(s.start * FPS);
      const dur = Math.round((s.end - s.start) * FPS);
      const pre = s.pre ?? 0;
      return (
        <React.Fragment key={s.id}>
          <Sequence from={from - pre} durationInFrames={dur + pre} name={`${s.id} picture`}>
            <Picture s={s} />
          </Sequence>
          <Sequence from={from} durationInFrames={dur} name={`${s.id} text`}>
            <Overlay s={s} />
          </Sequence>
        </React.Fragment>
      );
    })}
    <Transitions />
    <CaptionLayer />
    <ChannelLogo />
  </AbsoluteFill>
);
