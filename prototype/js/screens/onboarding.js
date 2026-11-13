import { html, icon, haptic } from '../ui/dom.js';
import { getState, setState } from '../core/store.js';
import { GOALS, EXPERIENCE } from '../core/generator.js';
import { EQUIPMENT, LOCATION_EQUIPMENT } from '../core/exercises.js';
import { loadSampleData, connectSimulatedHealth } from '../app.js';

const GOAL_DESC = { hypertrophy: 'Build muscle size with moderate reps.', strength: 'Lift heavier with lower reps and longer rest.', fatLoss: 'Higher density sessions with supersets.', endurance: 'High reps, short rest, muscular stamina.', general: 'Balanced, sustainable training.' };
const EXP_DESC = { beginner: 'Under a year of consistent lifting.', intermediate: '1–3 years, comfortable with the main lifts.', advanced: '3+ years, structured programming.' };
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function open(force = false) {
  const host = document.querySelector('.device');
  if (host.querySelector('.onb')) return;
  const p = structuredClone(getState().profile);
  let step = 0; let health = p.healthConnected;
  const TOTAL = 8;
  const el = document.createElement('div'); el.className = 'onb'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Welcome to Forma');
  host.appendChild(el);

  const opt = (act, v, on, t, d) => html`<button class="option" data-act="${act}" data-v="${v}" aria-pressed="${on}"><div style="flex:1"><div class="t">${t}</div>${d ? html`<div class="d">${d}</div>` : ''}</div>${on ? icon('check') : ''}</button>`;
  const steps = [
    () => html`<div class="onb-hero"><div class="logo">${icon('bolt')}</div><h1 class="title-xl" style="font-size:40px">Forma</h1>
      <p class="muted" style="font-size:17px;line-height:1.45;margin:0 12px">Effortless logging. Intelligent recovery. Training that adapts to you.</p>
      <div class="chips" style="justify-content:center;margin-top:10px"><span class="chip">${icon('timer', 'sm')} Fast logger</span><span class="chip">${icon('body', 'sm')} 3D muscle map</span><span class="chip">${icon('spark', 'sm')} AI programming</span></div></div>`,
    () => html`<h2 class="title-l">What's your main goal?</h2><p class="tiny muted">Shapes rep ranges, rest and exercise selection.</p><div class="col" style="margin-top:14px">${Object.entries(GOALS).map(([k, g]) => opt('goal', k, p.goal === k, g.label, GOAL_DESC[k]))}</div>`,
    () => html`<h2 class="title-l">Training experience</h2><p class="tiny muted">Sets safe volume limits for the AI.</p><div class="col" style="margin-top:14px">${Object.entries(EXPERIENCE).map(([k, e]) => opt('exp', k, p.experience === k, e.label, EXP_DESC[k]))}</div>`,
    () => html`<h2 class="title-l">Which days do you train?</h2><p class="tiny muted">We'll suggest a split that fits.</p><div class="chips" style="margin-top:16px">${WEEKDAYS.map((d, i) => html`<button class="chip" style="min-width:64px;justify-content:center;min-height:48px" data-act="day" data-v="${i + 1}" aria-pressed="${p.days.includes(i + 1)}">${d}</button>`)}</div><p class="tiny dim" style="margin-top:12px">${p.days.length} days per week</p>`,
    () => html`<h2 class="title-l">Where do you train?</h2><div class="col" style="margin-top:14px">${[['gym', 'Gym', 'Full equipment'], ['home', 'Home', 'Dumbbells, bench, pull-up bar'], ['bodyweight', 'Bodyweight', 'No equipment']].map(([k, t, d]) => opt('loc', k, p.location === k, t, d))}</div>
      ${p.location !== 'bodyweight' ? html`<div class="eyebrow" style="margin-top:18px">Available equipment</div><div class="chips" style="margin-top:8px">${EQUIPMENT.map((e) => html`<button class="chip" data-act="equip" data-v="${e.id}" aria-pressed="${p.equipment.includes(e.id)}">${e.label}</button>`)}</div>` : ''}`,
    () => html`<h2 class="title-l">Units & session length</h2><div class="eyebrow" style="margin-top:16px">Weight units</div>
      <div class="seg" style="margin-top:8px"><button aria-pressed="${p.units === 'kg'}" data-act="units" data-v="kg">Kilograms</button><button aria-pressed="${p.units === 'lb'}" data-act="units" data-v="lb">Pounds</button></div>
      <div class="eyebrow" style="margin-top:18px">Typical workout</div><div class="chips" style="margin-top:8px">${[20, 30, 45, 60, 75, 90].map((d) => html`<button class="chip" data-act="dur" data-v="${d}" aria-pressed="${p.durationMin === d}">${d} min</button>`)}</div>`,
    () => html`<div class="onb-hero" style="justify-content:flex-start;text-align:left"><div class="avatar" style="width:60px;height:60px;border-radius:18px">${icon('heart')}</div><h2 class="title-l">Apple Health <span class="tiny dim">(optional)</span></h2>
      <p class="muted tiny" style="line-height:1.55">Forma can read <b>sleep</b>, <b>resting heart rate</b> and <b>heart-rate variability</b> to slightly adjust recovery estimates, and save workouts to Health. You can change this any time — everything works without it.</p>
      <div class="banner">${icon('info', 'sm')}<span>Browser prototype: connecting loads <b>simulated</b> sample values. The iPhone app uses HealthKit's permission sheet.</span></div>
      <button class="option" data-act="health" aria-pressed="${health}"><div style="flex:1"><div class="t">${health ? 'Connected (simulated)' : 'Connect Apple Health'}</div><div class="d">Read-only for recovery · write workouts</div></div>${health ? icon('check') : ''}</button></div>`,
    () => html`<div class="onb-hero" style="justify-content:flex-start;text-align:left"><div class="avatar" style="width:60px;height:60px;border-radius:18px">${icon('watch')}</div><h2 class="title-l">Apple Watch <span class="tiny dim">(optional)</span></h2>
      <p class="muted tiny" style="line-height:1.55">The Watch app shows your current exercise, heart rate, rest timers and — for supported movements like curls and shoulder presses — an experimental automatic rep count you can correct with the Digital Crown.</p>
      <p class="muted tiny" style="line-height:1.55">You don't need a watch to log workouts. Pair later from Profile.</p>
      <div class="banner">${icon('info', 'sm')}<span>Wrist-based counting can't see leg-machine, static-hold or stationary-wrist exercises — those are logged manually.</span></div></div>`,
    () => html`<div class="onb-hero"><div class="logo">${icon('check')}</div><h2 class="title-xl">You're set</h2><p class="muted">Start with a clean slate, or explore with ~10 weeks of realistic <b>sample</b> training data.</p></div>`,
  ];

  const draw = () => {
    const last = step === TOTAL;
    el.innerHTML = String(html`<div class="row between" style="margin-bottom:18px">${step > 0 ? html`<button class="icon-btn sm" data-act="back" aria-label="Back">${icon('chevL', 'sm')}</button>` : html`<span></span>`}
        <div class="progress" style="flex:1;margin:0 14px"><div style="width:${(step / TOTAL) * 100}%"></div></div>${!last && step > 0 ? html`<button class="link tiny" data-act="skip">Skip</button>` : html`<span style="width:30px"></span>`}</div>
      <div style="flex:1;display:flex;flex-direction:column" class="view-enter">${steps[step]()}</div>
      <div class="col" style="margin-top:20px">${last ? html`<button class="btn primary block lg" data-act="fresh">Start fresh</button><button class="btn block lg" data-act="sample">Explore with sample data</button>`
        : html`<button class="btn primary block lg" data-act="next">${step === 0 ? 'Get started' : step === 6 && !health ? 'Skip for now' : step === 7 ? 'Continue without a watch' : 'Continue'}</button>`}</div>`);
  };

  const finish = (sample) => {
    p.onboarded = true;
    setState((s) => { s.profile = { ...s.profile, ...p, healthConnected: s.profile.healthConnected }; }, { op: 'onboarding.complete' });
    if (sample) loadSampleData();
    el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'scale(1.02)';
    setTimeout(() => el.remove(), 300);
    haptic('success');
  };

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const v = b.dataset.v; const tog = (arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    switch (b.dataset.act) {
      case 'next': step = Math.min(TOTAL, step + 1); break;
      case 'back': step = Math.max(0, step - 1); break;
      case 'skip': step = TOTAL; break;
      case 'goal': p.goal = v; break;
      case 'exp': p.experience = v; break;
      case 'day': { const n = +v; p.days = p.days.includes(n) ? p.days.filter((x) => x !== n) : [...p.days, n].sort(); break; }
      case 'loc': p.location = v; p.equipment = [...LOCATION_EQUIPMENT[v]]; break;
      case 'equip': p.equipment = tog(p.equipment); break;
      case 'units': p.units = v; break;
      case 'dur': p.durationMin = +v; break;
      case 'health': health = !health; connectSimulatedHealth(health); break;
      case 'fresh': finish(false); return;
      case 'sample': finish(true); return;
      default: return;
    }
    haptic('light'); draw();
  });
  void force;
  draw();
}
