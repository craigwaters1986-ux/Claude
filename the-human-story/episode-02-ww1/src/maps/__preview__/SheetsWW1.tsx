// ep02 (WW1) environment-designer contact sheets (lean mode: a few stills only).
// Render: npx remotion still src/maps/__preview__/index.ts <Id> out.png --scale=0.5
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {W, H, FONT, C} from '../../styles/theme';
import type {Panel} from './Sheet';
import * as M from '../MapsWW1';

/** 3840×2160 grid of full-size 1920×1080 panels (3 × 3), so a --scale=0.5 still is legible. */
export const BigSheet: React.FC<{panels: Panel[]; cols?: number}> = ({panels, cols = 3}) => {
  const f = useCurrentFrame();
  const SW = W * 2;
  const SH = H * 2;
  const rows = Math.ceil(panels.length / cols);
  const pw = SW / cols;
  const ph = SH / rows;
  const s = Math.min(pw / W, ph / H);
  return (
    <AbsoluteFill style={{background: '#222'}}>
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`}>
        {panels.map((p, i) => {
          const x = (i % cols) * pw + (pw - W * s) / 2;
          const y = Math.floor(i / cols) * ph + (ph - H * s) / 2;
          return (
            <g key={i}>
              <svg x={x + 4} y={y + 4} width={W * s - 8} height={H * s - 8} viewBox={`0 0 ${W} ${H}`} overflow="hidden">
                <rect width={W} height={H} fill="#000" />
                {p.el(f + (p.at ?? 0))}
                {/* logo keep-clear zone guide */}
                <rect x={0} y={0} width={170} height={150} fill="none" stroke="#FF00FF" strokeWidth={4} strokeDasharray="12 8" />
              </svg>
              <rect x={x + 4} y={y + 4} width={Math.max(200, p.title.length * 19 + 24)} height={44} fill="rgba(0,0,0,0.75)" />
              <text x={x + 16} y={y + 36} fontFamily={FONT.sans} fontWeight={800} fontSize={28} fill={C.dustyYellow}>{p.title}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const WW1_MAPS_A: Panel[] = [
  {title: 'M-01 S01-02 powers flash (3.5/5)', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p1" flash={3.5} cam={{lon: 14, lat: 50, zoom: 1.1}} />},
  {title: 'M-01 S02-02 Entente + capitals', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p2" powers={1} entente={1} britain={1} capitals={1} labels={1} labelSet={['FRA', 'RUS', 'GBR']} />},
  {title: 'M-01 S02-03 Triple Alliance, Italy -> neutral', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p3" base="alliances" central={1} italy={1} italyNeutral={0.8} labels={1} labelSet={['GER', 'AH', 'ITA']} cam={M.CAM_1914.central} />},
  {title: 'M-01 S02-05 Balkans', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p4" base="alliances" cam={M.CAM_1914.balkans} balkans={{serbiaPulse: 1, peoples: 1, tension: 1, ahBorder: 1, labels: 1}} />},
  {title: 'M-01 S02-06 war plan', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p5" base="alliances" cam={M.CAM_1914.wide} warPlan={{west: 1, east: 0.7, trains: 0.5, stopwatch: 1}} labels={1} labelSet={['BEL', 'FRA', 'GER', 'RUS']} capitals={1} capitalSet={['Paris']} />},
  {title: 'M-01 S03-04 ultimatum reply', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p6" base="alliances" cam={M.CAM_1914.viennaBelgrade} july={{ultimatum: 1, reply: 0.7, ticks: 5, clock: 1}} balkans={{labels: 1}} />},
  {title: 'M-01 S03-05 declarations + calendar', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p7" base="alliances" july={{declare: 4.9, marchers: 0.6, calendar: 4.2}} />},
  {title: 'M-01 S10-01/04 1918 trains + collapse', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p8" base="war1918" y1918={{trains: 0.35, usShip: 0.6}} collapse={{bulgaria: 1, ottoman: 1, austria: 0.8, kiel: 1, redDots: 0.6, kaiser: 0.5}} />},
  {title: 'M-01 S03-08 debate minis', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p9" base="alliances" debate={{clark: 1}} capitals={1} capitalSet={['London', 'Paris', 'Berlin', 'Vienna', 'St Petersburg', 'Belgrade']} />},
];
export const WW1_MAPS_B: Panel[] = [
  {title: 'M-02 S04-02 advance + Mons', el: (f) => <M.MapWesternFront f={f} idSuffix="-p10" cam={M.CAM_WF.belgium} advance={0.8} mons={1.3} cities={['Paris', 'Mons', 'Brussels' as never].filter((c) => c !== 'Brussels')} />},
  {title: 'M-02 S04-04 Marne + QUICK VICTORY', el: (f) => <M.MapWesternFront f={f} idSuffix="-p11" cam={M.CAM_WF.marne} advance={1} marne={0.8} quickVictory={0.5} cities={['Paris']} />},
  {title: 'M-02 race to the sea + front 0.6', el: (f) => <M.MapWesternFront f={f} idSuffix="-p12" cam={M.CAM_WF.north} race={0.8} front={0.6} cities={['Ypres', 'Arras', 'Nieuport']} />},
  {title: 'M-02 full front + occupied', el: (f) => <M.MapWesternFront f={f} idSuffix="-p13" front={1} occupied={1} />},
  {title: 'M-02 trenchZoom 0.8 (match to E-01)', el: (f) => <M.MapWesternFront f={f} idSuffix="-p14" cam={M.CAM_WF.somme} front={1} trenchZoom={0.8} />},
  {title: 'M-02 S07-01/03 Verdun + Somme link', el: (f) => <M.MapWesternFront f={f} idSuffix="-p15" front={1} occupied={1} verdun={1} somme={1} sommeLink={1} bumps={0.3} cities={['Paris', 'Albert']} />},
  {title: 'M-02 S07-06 Somme creep + dots', el: (f) => <M.MapWesternFront f={f} idSuffix="-p16" cam={M.CAM_WF.sommeClose} front={1} occupied={1} sommeCreep={1} sommeDots={1} cities={['Albert']} />},
  {title: 'M-02 S10-01 Spring Offensive', el: (f) => <M.MapWesternFront f={f} idSuffix="-p17" cam={M.CAM_WF.amiens} era="1918" front={1} occupied={1} spring={1} cities={['Arras', 'Compiègne']} />},
  {title: 'M-02 S10-04 Hundred Days', el: (f) => <M.MapWesternFront f={f} idSuffix="-p18" front={1} occupied={1} hundred={1} cities={['Mons', 'Paris', 'Verdun']} />},
];
export const WW1_MAPS_C: Panel[] = [
  {title: 'M-03 S06-01 Tannenberg', el: (f) => <M.MapEasternFront f={f} idSuffix="-p19" tannenberg={1} pincers={1} breakup={0.4} />},
  {title: 'M-03 S09-06 Brest-Litovsk', el: (f) => <M.MapEasternFront f={f} idSuffix="-p20" cam={M.CAM_EF.brest} front1917={1} frontVanish={0.5} brest={1} brestLabels={1} />},
  {title: 'M-04 S06-02 Gallipoli', el: (f) => <M.MapGallipoli f={f} idSuffix="-p21" ships={0.8} landings={1} ottoman={1} inset={1} suvla />},
  {title: 'M-05 S11-03 start (M-01 look)', el: (f) => <M.MapEurope1919 f={f} idSuffix="-p22" />},
  {title: 'M-05 cracking (empires 1.4, states 3)', el: (f) => <M.MapEurope1919 f={f} idSuffix="-p23" empires={1.4} states={3} />},
  {title: 'M-05 end (4 / 9 / disputed / note)', el: (f) => <M.MapEurope1919 f={f} idSuffix="-p24" cam={M.CAM_1919.central} empires={4} states={9} disputed={1} note={1} details={1} />},
  {title: 'M-02 WallMap inset (S10-02)', el: (f) => <g><rect width={W} height={H} fill="#C9B48A" /><M.WesternFrontWallMap x={360} y={160} w={1200} f={f} reverse={0.8} /></g>},
  {title: 'M-04 Gallipoli peninsula zoom 1.6', el: (f) => <M.MapGallipoli f={f} idSuffix="-p25" cam={M.CAM_GP.peninsula} landings={0.6} ottoman={1} />},
  {title: 'M-01 S02-02 neutral grey start', el: (f) => <M.MapEurope1914 f={f} idSuffix="-p26" powers={1} capitals={1} />},
];
