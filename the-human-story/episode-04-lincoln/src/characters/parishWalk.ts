// Solve backwards from the shoe to keep its ground contact fixed during each step.
import {pose} from './poses';
import {dimsOf, Build} from './skeleton';

export function parishWalk(distance: number, child: Build, start: number, settle: number) {
  const {L} = dimsOf(child);
  const stride = L * 0.88;
  const phase = distance / stride + start;
  const wave = Math.sin(phase * Math.PI * 2);
  const hipHeight = L * (0.94 - 0.023 * Math.cos(phase * Math.PI * 4));
  function shoe(offset: number) {
    const t = (phase + offset) % 1;
    const lift = Math.max(0, (t - 0.5) * 2);
    const x = t < 0.5 ? stride * (0.25 - t) : stride * (-0.25 - 0.5 * lift + lift * lift * (3 - 2 * lift));
    const y = hipHeight - L * 0.15 * (1-settle) * Math.sin(lift * Math.PI) ** 2;
    const a = L * 0.52, b = L * 0.5, r = Math.hypot(x,y);
    const angle = (v:number) => Math.acos(Math.max(-1,Math.min(1,v))) * 180 / Math.PI;
    return {hip: Math.atan2(x,y)*180/Math.PI + angle((a*a+r*r-b*b)/(2*a*r)), knee: 180-angle((a*a+b*b-r*r)/(2*a*b))};
  }
  const left = shoe(0), right = shoe(0.5);
  return pose({hipL:left.hip,kneeL:left.knee,hipR:right.hip,kneeR:right.knee,
    shL:-20*Math.cos(phase*2*Math.PI),shR:20*Math.cos(phase*2*Math.PI),elL:14,elR:16,
    lean:3,headTilt:-1+wave*1.4,bob:L-hipHeight});
}
