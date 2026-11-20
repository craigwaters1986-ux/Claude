import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {StickFigure} from '../characters/StickFigure';
import {CAST} from '../characters/cast';
import {stand, walk, run, point, cheer, talkGesture, cower, slump} from '../characters/poses';
import {C} from '../styles/theme';

export const TestLineup: React.FC = () => {
  const f = useCurrentFrame();
  const names = ['guide', 'leo', 'anna', 'tom', 'hitler', 'churchill', 'stalin', 'roosevelt', 'germanSoldier', 'usSoldier', 'sovietWinter', 'montgomery'];
  const poses = [point(f, 110), stand(f), walk(f / 30), run(f / 20), talkGesture(f), stand(f, 3), stand(f, 4), talkGesture(f, 2), walk(f / 30), stand(f, 6), cower(f), cheer(f)];
  const exprs: any[] = ['angry', 'sleepy', 'happy', 'determined', 'shout', 'determined', 'smug', 'neutral', 'neutral', 'scared', 'cold', 'joy'];
  return (
    <AbsoluteFill style={{background: C.wallYellow}}>
      <svg width={1920} height={1080}>
        <rect x={0} y={760} width={1920} height={320} fill={C.floor} />
        {names.map((n, i) => {
          const c = CAST[n];
          return (
            <StickFigure key={n} x={110 + (i % 6) * 320} y={i < 6 ? 470 : 980} f={f} seed={i + 1} pose={poses[i]} head={{...c.head, expression: exprs[i]}} outfit={c.outfit} child={c.child} label={c.label} talking={i === 4} angerMark={i === 0} scale={1.05} dir={i % 2 ? -1 : 1} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
