// Apple Watch companion PREVIEW (simulated in the browser).
//
// Runs the real rep-counting algorithm (core/repcounter.js — mirrored in
// ios/GymCore) live against either synthetic motion or this phone's motion
// sensors (DeviceMotion). Heart rate and calories are simulated. Set results
// are "sent" to the iPhone workout through a mock WatchConnectivity channel,
// shown in the message log.

import { html, icon, delegate, haptic, toast } from '../ui/dom.js';
import { SIM } from '../ui/widgets.js';
import { getState, setState } from '../core/store.js';
import { EXERCISE_BY_ID } from '../core/exercises.js';
import { RepCounter, profileForExercise, synthesize } from '../core/repcounter.js';
import { fmtWeight, fmtDuration } from '../core/units.js';

export const selfManaged = true;

export function render({ navigate }) {
  const units = getState().profile.units;
  let source = 'synthetic';
  let phase = 'idle'; // idle | set | rest
  let rc = null; let reps = 0; let setStart = 0; let restEnd = 0;
  let hr = 92; let kcal = 0; const t0 = Date.now();
  const trace = []; const log = [];
  let feeder = 0; let ui = 0; let motionHandler = null; let root;

  const target = () => {
    const a = getState().active;
    if (a) for (const [i, it] of a.exercises.entries()) { const j = it.sets.findIndex((s) => !s.done); if (j >= 0) return { i, j, ex: EXERCISE_BY_ID[it.exerciseId], set: it.sets[j], total: it.sets.length, linked: true }; }
    return { ex: EXERCISE_BY_ID.dbCurl, set: { weightKg: 14, reps: 10 }, j: 0, total: 3, linked: false };
  };

  const send = (msg) => { log.unshift(`${new Date().toLocaleTimeString()}  ⌚→📱 ${JSON.stringify(msg)}`); if (log.length > 30) log.pop(); };

  const watchFace = () => {
    const t = target(); const prof = profileForExercise(t.ex);
    if (phase === 'rest') {
      const left = Math.max(0, (restEnd - Date.now()) / 1000); const frac = left / 90;
      return html`<div class="eyebrow" style="color:var(--accent-2)">Rest</div>
        <div style="flex:1;display:grid;place-items:center"><svg width="120" height="120" viewBox="0 0 120 120" style="transform:rotate(-90deg)"><circle cx="60" cy="60" r="52" stroke="#1d2230" stroke-width="10" fill="none"/><circle cx="60" cy="60" r="52" stroke="#5ce1ff" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 52}" stroke-dashoffset="${2 * Math.PI * 52 * (1 - frac)}"/></svg>
        <div style="position:absolute;font-size:28px;font-weight:750" class="num" data-w-rest>${fmtDuration(left)}</div></div>
        <div class="w-ex" style="text-align:center;color:#8792a8">Next: ${t.ex.name}</div>
        <div class="row" style="gap:6px;margin-top:6px"><button class="w-btn" data-act="skip-rest">Skip</button></div>`;
    }
    return html`<div class="row between"><span class="w-ex">${t.ex.name}</span><span class="xtiny" style="color:#ff5c7a">♥ <span class="num" data-w-hr>${Math.round(hr)}</span></span></div>
      <div class="xtiny" style="color:#8792a8;margin-top:2px">Set ${t.j + 1}/${t.total} · ${t.set.weightKg != null ? fmtWeight(t.set.weightKg, units) : '—'} × ${t.set.reps ?? '—'}</div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center">
        <div class="w-reps" data-w-reps>${reps}</div>
        <div class="xtiny" style="color:#8792a8">${phase === 'set' ? (prof ? 'auto-counting · crown to correct' : 'manual — tap ＋') : (prof ? 'auto rep count ready' : 'auto count N/A for this lift')}</div></div>
      <div class="row" style="gap:6px"><button class="w-btn" data-act="minus" aria-label="Correct reps down">−</button>
        ${phase === 'set' ? html`<button class="w-btn stop" data-act="end">End set</button>` : html`<button class="w-btn go" data-act="start-set">Start set</button>`}
        <button class="w-btn" data-act="plus" aria-label="Correct reps up">＋</button></div>
      <div class="row between xtiny" style="color:#8792a8;margin-top:8px"><span class="num" data-w-el>${fmtDuration((Date.now() - t0) / 1000)}</span><span class="num"><span data-w-kcal>${Math.round(kcal)}</span> kcal*</span></div>`;
  };

  const body = () => {
    const t = target(); const prof = profileForExercise(t.ex);
    return html`
    <header class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('chevL')}</button><div style="text-align:center"><h1 class="title-m">Apple Watch</h1><div class="xtiny dim">Companion preview</div></div>${SIM()}</header>
    <div class="banner">${icon('info', 'sm')}<span>Browser simulation — no watch is connected. The rep counter here is the <b>same algorithm</b> as the watchOS code; heart rate and calories are simulated.</span></div>
    <div class="watch-wrap" style="margin-top:14px"><div class="watch"><div class="watch-screen" data-face>${watchFace()}</div></div></div>
    <div class="card" style="margin-top:16px">
      <div class="row between"><b>Motion source</b>${t.linked ? html`<span class="badge live">Synced to active workout</span>` : html`<span class="badge">Demo exercise</span>`}</div>
      <div class="seg" style="margin-top:10px"><button aria-selected="${source === 'synthetic'}" data-act="source" data-v="synthetic">Synthetic motion</button><button aria-selected="${source === 'phone'}" data-act="source" data-v="phone">This phone's sensors</button></div>
      <p class="tiny dim" style="margin-top:8px;line-height:1.5">${source === 'phone' ? 'Hold the phone like a dumbbell (screen facing in) and do slow curls or presses. Experimental: a phone in the hand is not a watch on the wrist.' : `Streams a realistic noisy ${prof?.id === 'verticalPush' ? 'press' : prof?.id === 'lateralRaise' ? 'raise' : 'curl'} signal at 50 Hz with tempo variation and fatigue slow-down.`}</p>
      <div class="eyebrow" style="margin-top:12px">Live signal · ${prof ? `${prof.signal} profile` : 'unsupported'}</div>
      <canvas class="wave" data-wave width="680" height="180" aria-label="Live motion signal with rep detection thresholds"></canvas>
      <div class="row tiny dim" style="gap:14px;margin-top:4px"><span><i class="dot" style="display:inline-block;background:#5ce1ff"></i> signal</span><span><i class="dot" style="display:inline-block;background:#8b7bff"></i> hysteresis band</span><span><i class="dot" style="display:inline-block;background:#30e8a0"></i> counted rep</span></div>
    </div>
    <div class="card"><b>WatchConnectivity log</b> <span class="tiny dim">(mock)</span><div class="log" data-log style="margin-top:8px">${log.length ? log.join('\n') : 'No messages yet.'}</div></div>
    <div class="card"><b>Limits of wrist rep counting</b><ul class="tiny muted" style="line-height:1.6;padding-left:18px;margin:8px 0 0">
      <li>Works best when the wrist moves through a large, repeatable arc (curls, raises, presses, rows).</li>
      <li>Leg exercises (leg press, extensions, curls), static holds and planks barely move the wrist — use manual entry.</li>
      <li>Squats and lunges move the wrist with the bar but very slowly — counts are unreliable until validated.</li>
      <li>Partial reps, pauses and re-racking can add or miss reps; the Digital Crown correction is always available.</li>
      <li>Corrections are stored as labels to calibrate and train future per-exercise models.</li></ul>
      <p class="xtiny dim" style="margin-top:8px">* Calories in the native app come from HealthKit's workout session (Apple Watch's own estimate).</p></div>`;
  };

  const drawWave = () => {
    const c = root.querySelector('[data-wave]'); if (!c) return;
    const g = c.getContext('2d'); const W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    const pts = trace.slice(-300); if (pts.length < 2) return;
    const vals = pts.flatMap((p) => [p.s, p.u ?? p.s, p.l ?? p.s]);
    const lo = Math.min(...vals), hi = Math.max(...vals); const y = (v) => H - 10 - ((v - lo) / (hi - lo || 1)) * (H - 20); const x = (i) => (i / 299) * W;
    g.lineWidth = 2; g.setLineDash([6, 6]); g.strokeStyle = 'rgba(139,123,255,.6)';
    for (const k of ['u', 'l']) { g.beginPath(); pts.forEach((p, i) => (p[k] == null ? null : i ? g.lineTo(x(i), y(p[k])) : g.moveTo(x(i), y(p[k])))); g.stroke(); }
    g.setLineDash([]); g.strokeStyle = '#5ce1ff'; g.lineWidth = 3; g.shadowColor = '#5ce1ff'; g.shadowBlur = 8;
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(x(i), y(p.s)) : g.moveTo(x(i), y(p.s)))); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#30e8a0'; pts.forEach((p, i) => { if (p.rep) { g.beginPath(); g.arc(x(i), y(p.s), 7, 0, Math.PI * 2); g.fill(); } });
  };

  const feed = (sample) => {
    if (!rc) return;
    const counted = rc.push(sample);
    trace.push({ s: rc.lastSignal, u: rc.lastBand?.upper, l: rc.lastBand?.lower, rep: counted });
    if (trace.length > 600) trace.splice(0, trace.length - 600);
    if (counted) { reps = rc.count; haptic('light'); const r = root.querySelector('[data-w-reps]'); if (r) { r.textContent = reps; r.classList.remove('bump'); void r.offsetWidth; r.classList.add('bump'); } }
  };

  const startSet = async () => {
    const t = target(); const prof = profileForExercise(t.ex);
    reps = 0; phase = 'set'; setStart = Date.now(); trace.length = 0;
    rc = prof ? new RepCounter(prof, { sampleHz: source === 'phone' ? 60 : 50 }) : null;
    send({ type: 'setStarted', exerciseId: t.ex.id, set: t.j + 1 });
    if (rc && source === 'synthetic') {
      const n = (t.set.reps || 10) + (Math.random() < 0.3 ? -1 : 0);
      const samples = synthesize({ kind: prof.id === 'verticalPush' || prof.id === 'horizontalPull' ? 'press' : prof.id, reps: n, seed: Date.now() % 1000, repSec: 2, noise: 0.035, restBefore: 1, restAfter: 1.2 });
      let k = 0;
      feeder = setInterval(() => { for (let m = 0; m < 1 && k < samples.length; m++) feed(samples[k++]); if (k >= samples.length) clearInterval(feeder); }, 20);
    }
    if (rc && source === 'phone') {
      if (typeof DeviceMotionEvent === 'undefined') { toast('Motion sensors not available on this device'); }
      else {
        try { if (typeof DeviceMotionEvent.requestPermission === 'function' && (await DeviceMotionEvent.requestPermission()) !== 'granted') { toast('Motion permission denied'); } } catch { /* ignore */ }
        motionHandler = (e) => {
          const a = e.acceleration, ag = e.accelerationIncludingGravity; if (!a || !ag || a.x == null) return;
          feed({ t: performance.now() / 1000, gravity: [(ag.x - a.x) / 9.81, (ag.y - a.y) / 9.81, (ag.z - a.z) / 9.81], userAccel: [a.x / 9.81, a.y / 9.81, a.z / 9.81] });
        };
        window.addEventListener('devicemotion', motionHandler);
      }
    }
    haptic('medium'); draw();
  };

  const stopSensors = () => { clearInterval(feeder); if (motionHandler) window.removeEventListener('devicemotion', motionHandler); motionHandler = null; };

  const endSet = () => {
    stopSensors();
    const t = target();
    const msg = { type: 'setCompleted', exerciseId: t.ex.id, setIndex: t.j, reps, weightKg: t.set.weightKg, autoCounted: !!rc, corrections: rc?.corrections || 0, avgHr: Math.round(hr), durationSec: Math.round((Date.now() - setStart) / 1000) };
    send(msg);
    if (t.linked && reps > 0) {
      setState((s) => { const set = s.active?.exercises[t.i]?.sets[t.j]; if (set) { set.reps = reps; set.weightKg ??= t.set.weightKg; set.done = true; set.completedAt = Date.now(); set.source = 'watch'; } }, { op: 'watch.setCompleted' });
      toast(`Logged ${reps} reps to your iPhone workout`);
    }
    haptic('success');
    phase = 'rest'; restEnd = Date.now() + 90000; rc = null; draw();
  };

  const draw = () => { root.innerHTML = String(body()); drawWave(); };

  return {
    html: body(),
    mount(el) {
      root = el;
      ui = setInterval(() => {
        // Simulated heart rate: rises during sets, decays in rest.
        const targetHr = phase === 'set' ? 138 : phase === 'rest' ? 104 : 92;
        hr += (targetHr - hr) * 0.04 + (Math.random() - 0.5) * 0.8;
        kcal += Math.max(0, (hr - 70) * 0.0009);
        const q = (s) => root.querySelector(s);
        if (q('[data-w-hr]')) q('[data-w-hr]').textContent = Math.round(hr);
        if (q('[data-w-el]')) q('[data-w-el]').textContent = fmtDuration((Date.now() - t0) / 1000);
        if (q('[data-w-kcal]')) q('[data-w-kcal]').textContent = Math.round(kcal);
        if (q('[data-log]')) q('[data-log]').textContent = log.length ? log.join('\n') : 'No messages yet.';
        if (phase === 'rest') { const left = (restEnd - Date.now()) / 1000; if (q('[data-w-rest]')) q('[data-w-rest]').textContent = fmtDuration(Math.max(0, left)); if (left <= 0) { phase = 'idle'; haptic('warning'); send({ type: 'restFinished' }); draw(); } }
        if (phase === 'set') drawWave();
      }, 100);
      const off = delegate(el, {
        back: () => (history.length > 1 ? history.back() : navigate('/train')),
        source: (b) => { if (phase === 'set') endSet(); source = b.dataset.v; draw(); },
        'start-set': startSet,
        end: endSet,
        plus: () => { if (rc) rc.correct(+1); reps += 1; haptic('light'); send({ type: 'repCorrection', delta: +1 }); draw(); },
        minus: () => { if (rc) rc.correct(-1); reps = Math.max(0, reps - 1); haptic('light'); send({ type: 'repCorrection', delta: -1 }); draw(); },
        'skip-rest': () => { phase = 'idle'; draw(); },
      });
      return () => { off(); stopSensors(); clearInterval(ui); };
    },
  };
}
