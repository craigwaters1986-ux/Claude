// Episode 2 (ep02-ww1, "World War I: From Start to Finish") — full timeline (720 s = 21,600 frames at 30 fps).
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

export const EPISODE_FRAMES = 21600;

type Sec = {id: string; start: number; end: number; Picture: React.FC<{f: number}>; Overlay: React.FC; chapter?: [number, string]; pre?: number; into?: 'ink' | 'fade' | 'dip' | 'none'};

// Section windows (s), fixed by the storyboard (§1.1) and equal to narration.json's section windows.
// Chapter titles = script.json / narration.json chapter names (storyboard §1.4). s01 is the cold open (no banner).
// Transitions (storyboard §1.3): INK into every chapter, except s05 → s06 (slow fade out of the executions card,
// s06 pre-rolls 30 frames under s05's last frames) and s10 → s11 (slow dip through black).
export const SECTIONS_EP: Sec[] = [
  {id: 's01', start: 0, end: 35, Picture: S01Picture, Overlay: S01Overlay, into: 'none'},
  {id: 's02', start: 35, end: 110, Picture: S02Picture, Overlay: S02Overlay, chapter: [1, 'Europe Before 1914'], into: 'ink'},
  // the s02 → s03 ink is centred on the glowing Sarajevo dot, which S02-07's last push brings to the frame centre
  {id: 's03', start: 110, end: 190, Picture: S03Picture, Overlay: S03Overlay, chapter: [2, 'Sarajevo and the July Crisis'], into: 'ink'},
  {id: 's04', start: 190, end: 260, Picture: S04Picture, Overlay: S04Overlay, chapter: [3, '1914: The War of Movement Stops'], into: 'ink'},
  {id: 's05', start: 260, end: 320, Picture: S05Picture, Overlay: S05Overlay, chapter: [4, 'Life in the Trenches'], into: 'ink'},
  {id: 's06', start: 320, end: 390, Picture: S06Picture, Overlay: S06Overlay, chapter: [5, 'A World War'], into: 'fade', pre: 30},
  {id: 's07', start: 390, end: 450, Picture: S07Picture, Overlay: S07Overlay, chapter: [6, '1916: Verdun and the Somme'], into: 'ink'},
  {id: 's08', start: 450, end: 500, Picture: S08Picture, Overlay: S08Overlay, chapter: [7, 'The Home Front'], into: 'ink'},
  {id: 's09', start: 500, end: 560, Picture: S09Picture, Overlay: S09Overlay, chapter: [8, '1917: The Turning Year'], into: 'ink'},
  {id: 's10', start: 560, end: 620, Picture: S10Picture, Overlay: S10Overlay, chapter: [9, '1918: The Last Battles'], into: 'ink'},
  {id: 's11', start: 620, end: 720, Picture: S11Picture, Overlay: S11Overlay, chapter: [10, 'The Cost and the Legacy'], into: 'dip'},
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
