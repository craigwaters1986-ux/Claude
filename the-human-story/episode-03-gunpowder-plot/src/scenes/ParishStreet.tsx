import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {StickFigure} from '../characters/StickFigure';
import {parishWalk} from '../characters/parishWalk';
import {prog} from '../animations/core';
import {CaptionBand} from '../components/CaptionBand';
import {ChannelLogo} from '../components/ChannelLogo';

const ink='#322e30';
function House({x,shade}:{x:number;shade:string}) {
  return <g transform={`translate(${x},315)`} stroke={ink} strokeWidth={7} strokeLinejoin="round">
    <path d="M0 395V92L136 -35L282 92V395" fill={shade}/>
    <path d="M-18 102L135 -54L300 96L282 106L136 -28L0 118Z" fill="#786260"/>
    <path d="M8 130H275M3 245H280M133 12V395M12 138L124 239M149 239L271 138" fill="none"/>
    <path d="M36 395V280Q67 252 92 280V395" fill="#756658"/>
    <rect x="176" y="277" width="62" height="70" fill="#acb8ae"/><path d="M207 278V347M176 312H238"/>
  </g>;
}

export const ParishStreet: React.FC=()=>{
  const f=useCurrentFrame();
  // A sustained stride followed by a deceleration; the child's shorter steps catch up later.
  const travel=(end:number,speed:number)=>speed*(Math.min(f,end)+24*(1-Math.exp(-Math.max(0,f-end)/24)));
  const womanDistance=travel(87,2.4), childDistance=travel(105,2.25);
  const listen=prog(f,88,120), childLook=prog(f,111,141), gesture=prog(f,127,158)*(1-prog(f,185,226));
  const woman=parishWalk(womanDistance,false,0.07,prog(f,99,144)), child=parishWalk(childDistance,true,0.36,prog(f,117,162));
  woman.headTilt-=12*listen; woman.lean-=3*listen; woman.shR+=46*gesture; woman.elR+=35*gesture;
  child.headTilt-=14*childLook;
  const bellAngle=17*Math.sin((f-82)/9)*prog(f,75,91)*Math.exp(-Math.max(0,f-125)/55);
  return <AbsoluteFill style={{background:'#f1ead9'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#aabcc1"/><stop offset="1" stopColor="#e8d9ba"/></linearGradient></defs>
      <rect width="1920" height="900" fill="url(#sky)"/>
      <g transform={`translate(${-f*0.07},0)`} fill="#a4aca4"><path d="M0 628V525L80 455L155 525V488L250 407L360 497V510L453 433L540 492V448L658 360L755 448V490L850 410L930 492V628Z"/></g>
      <g transform={`translate(${-f*.19},0)`}>
        <House x={-56} shade="#c5af91"/><House x={240} shade="#dfc69f"/><House x={560} shade="#c5b698"/>
        <path d="M1000 723V500L1170 339L1375 506V723Z" fill="#b3a791" stroke={ink} strokeWidth="7"/>
        <path d="M1260 721V323H1500V721Z" fill="#bfb29c" stroke={ink} strokeWidth="7"/>
        <path d="M1247 330L1380 119L1514 330Z" fill="#67746f" stroke={ink} strokeWidth="7"/>
        <path d="M1322 475V408Q1378 318 1435 408V475Z" fill="#56554d"/>
        <g transform={`rotate(${bellAngle} 1379 388)`} fill="#ba9664" stroke={ink} strokeWidth="5"><circle cx="1379" cy="452" r="8"/><path d="M1350 446Q1361 437 1361 409Q1379 383 1397 409Q1398 437 1408 446Z"/></g>
        <path d="M1324 721V590Q1378 508 1436 590V721Z" fill="#74685b" stroke={ink} strokeWidth="7"/>
        <House x={1560} shade="#d2bb9a"/><House x={1844} shade="#c8ae98"/>
      </g>
      <rect y="715" width="1920" height="205" fill="#baa68a"/>
      {Array.from({length:64},(_,i)=><path key={i} d={`M${(i*163)%1940} ${743+(i*47)%143}q15 -5 29 0`} stroke="#97876f" strokeWidth="3" fill="none"/>)}
      <StickFigure x={610+1.47*womanDistance} y={846} scale={1.47} f={f} seed={12} pose={woman} look={[listen,-listen]} head={{hair:'bun',hairColor:'#694436',expression:'curious'}} outfit={{kind:'gown',color:'#496f69',accent:'#ded0ad'}} shadow/>
      <StickFigure x={415+1.25*childDistance} y={860} scale={1.25} child f={f} seed={37} pose={child} look={[childLook,-childLook]} head={{hair:'curly',hairColor:'#614938',expression:'curious'}} outfit={{kind:'tunic',color:'#a5644b',accent:'#e1ceb0'}} shadow/>
      <CaptionBand lines={f<117?['English law required attendance at services','of the established Church.']:['Catholics who stayed away could face fines.']}/>
    </svg><ChannelLogo/>
  </AbsoluteFill>;
};
