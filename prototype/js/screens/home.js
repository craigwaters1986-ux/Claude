import { html, raw, icon, delegate, haptic } from '../ui/dom.js';
import { ring, animateRings, sparkline } from '../ui/charts.js';
import { workoutRow, SIM } from '../ui/widgets.js';
import { derived, loadSampleData } from '../app.js';
import { getState, setState } from '../core/store.js';
import { STATUS_META } from '../core/recovery.js';
import { generateWorkout } from '../core/generator.js';
import { fromPlan } from '../core/session.js';
import { weekStreak, workoutVolume, workoutSetCount } from '../core/metrics.js';
import { fmtVolume } from '../core/units.js';

const DAY = 86400000;

function greeting() { const h = new Date().getHours(); return h < 5 ? 'Late session?' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

function readiness(overall) {
  if (overall >= 90) return ['Primed', 'Your estimated recovery is high — a great day to push.'];
  if (overall >= 75) return ['Ready', 'Most muscle groups are ready. Train what\'s fresh.'];
  if (overall >= 55) return ['Moderate', 'Several groups are still recovering — keep intensity sensible.'];
  return ['Recover', 'Estimated recovery is low. Consider a light session or rest.'];
}

export function render({ navigate }) {
  const s = getState();
  const { workouts, recovery, health, profile } = derived();
  const units = profile.units;
  const [rTitle, rBody] = readiness(recovery.overall);
  const now = Date.now();
  const week = workouts.filter((w) => w.startedAt > now - 7 * DAY);
  const prev = workouts.filter((w) => w.startedAt > now - 14 * DAY && w.startedAt <= now - 7 * DAY);
  const vol = week.reduce((a, w) => a + workoutVolume(w), 0), pvol = prev.reduce((a, w) => a + workoutVolume(w), 0);
  const delta = pvol ? Math.round(((vol - pvol) / pvol) * 100) : null;
  const plan = generateWorkout({ goal: profile.goal, experience: profile.experience, durationMin: profile.durationMin, location: profile.location, equipment: profile.equipment, likes: s.likes, dislikes: s.dislikes, injuries: profile.injuries || [], seed: Math.floor(now / DAY) }, { workouts, recovery });
  const ready = recovery.muscles.filter((m) => m.status === 'ready' && m.sessions28 > 0).slice(0, 4);
  const tired = recovery.muscles.filter((m) => m.status !== 'ready').sort((a, b) => a.pct - b.pct).slice(0, 4);
  const trendVals = Array.from({ length: 8 }, (_, i) => workouts.filter((w) => w.startedAt > now - (8 - i) * 7 * DAY && w.startedAt <= now - (7 - i) * 7 * DAY).reduce((a, w) => a + workoutVolume(w), 0));

  const out = html`
  <header class="topbar">
    <div><div class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    <h1 class="title-xl">${greeting()}${profile.name ? `, ${profile.name}` : ''}</h1></div>
    <button class="icon-btn" data-act="coach" aria-label="Ask the AI coach">${icon('spark')}</button>
  </header>

  ${s.active ? html`<div class="card glow tap" data-act="resume" style="margin-bottom:12px;background:rgba(47,140,255,.12)"><div class="row"><div class="avatar">${icon('timer')}</div><div style="flex:1"><b>Workout in progress</b><div class="tiny muted">${s.active.name} · tap to resume</div></div>${icon('chevR')}</div></div>` : ''}
  ${s.sampleData ? html`<div class="banner" style="margin-bottom:12px">${icon('info', 'sm')}<span>Showing <b>sample training data</b>. Clear it any time in Profile → Data.</span></div>` : ''}

  <div class="stagger">
  <section class="card glow" style="padding:20px 18px 18px" aria-label="Recovery score">
    <div class="row between"><span class="eyebrow">Estimated recovery</span>${health ? (health.source === 'simulated' ? SIM('Simulated Health') : html`<span class="badge live">Apple Health</span>`) : html`<span class="badge">Training log only</span>`}</div>
    <div class="row" style="gap:18px;margin-top:8px">
      ${raw(ring(recovery.overall, { size: 150, stroke: 13 }))}
      <div class="col" style="flex:1;gap:4px"><div class="title-l grad-text">${rTitle}</div><div class="tiny muted" style="line-height:1.45">${rBody}</div>
        ${health ? html`<div class="row" style="gap:10px;margin-top:8px;flex-wrap:wrap">
          <span class="tiny dim row" style="gap:4px">${icon('moon', 'sm')}${health.sleepHours.toFixed(1)}h</span>
          <span class="tiny dim row" style="gap:4px">${icon('heart', 'sm')}${health.restingHr}</span>
          <span class="tiny dim row" style="gap:4px">HRV ${health.hrv}</span></div>` : html`<button class="link tiny" data-act="health" style="text-align:left;margin-top:6px">Connect Apple Health →</button>`}
      </div>
    </div>
    <div class="disclaimer" style="margin-top:12px">${icon('info', 'sm')}<span>An estimate from your training volume, effort and time since training${health ? ', adjusted slightly for sleep/HRV' : ''}. Not a medical or physiological measurement.</span></div>
  </section>

  <section class="card ai tap" data-act="start-suggested" aria-label="Next suggested workout">
    <div class="row between"><span class="eyebrow" style="color:#b9afff">${icon('spark', 'sm')} Next suggested workout</span><span class="badge ai">On-device AI</span></div>
    ${plan.exercises.length ? html`
    <h2 class="title-l" style="margin:8px 0 2px">${plan.name.split(' — ')[0]}</h2>
    <div class="tiny muted">${plan.exercises.length} exercises · ~${plan.estimatedMinutes} min · ${plan.exercises.reduce((a, e) => a + e.sets, 0)} sets</div>
    <div class="col" style="gap:6px;margin-top:12px">${plan.exercises.slice(0, 4).map((e) => html`<div class="row between tiny"><span>${e.name}</span><span class="dim num">${e.sets} × ${e.reps[0]}–${e.reps[1]}</span></div>`)}
    ${plan.exercises.length > 4 ? html`<div class="tiny dim">+${plan.exercises.length - 4} more</div>` : ''}</div>
    <div class="tiny muted" style="margin-top:10px;line-height:1.4">${plan.notes[0] || ''}</div>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn primary" data-act="start-suggested" style="flex:1">${icon('play', 'sm')} Start</button><button class="btn" data-act="customize">Customise</button></div>`
    : html`<p class="tiny muted">Everything is still recovering — today is a good rest or mobility day.</p>`}
  </section>

  <section>
    <div class="section-h"><h2>Muscle status</h2><a class="link" href="#/body">Body →</a></div>
    <div class="grid2">
      <div class="card tap" data-act="body" style="margin:0"><div class="eyebrow" style="color:var(--rec-green)">Ready</div>
        <div class="col" style="gap:6px;margin-top:8px">${ready.length ? ready.map((m) => html`<div class="row between tiny"><span>${m.name}</span><b class="num">${m.pct}%</b></div>`) : html`<span class="tiny dim">Log a workout to see this.</span>`}</div></div>
      <div class="card tap" data-act="body" style="margin:0"><div class="eyebrow" style="color:var(--rec-yellow)">Recovering</div>
        <div class="col" style="gap:6px;margin-top:8px">${tired.length ? tired.map((m) => html`<div class="row between tiny"><span class="row" style="gap:6px"><span class="dot" style="background:${STATUS_META[m.status].hex}"></span>${m.name}</span><b class="num">${m.pct}%</b></div>`) : html`<span class="tiny dim">All fresh.</span>`}</div></div>
    </div>
  </section>

  <section>
    <div class="section-h"><h2>This week</h2><a class="link" href="#/progress">Progress →</a></div>
    <div class="card"><div class="row between"><div><div class="eyebrow">Volume</div><div class="title-l num">${fmtVolume(vol, units)}</div>
      ${delta != null ? html`<div class="tiny delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs last week</div>` : ''}</div>${raw(sparkline(trendVals, { w: 110, h: 40 }))}</div>
      <div class="grid3" style="margin-top:14px">
        <div class="stat"><div class="v num">${week.length}</div><div class="l">Workouts</div></div>
        <div class="stat"><div class="v num">${week.reduce((a, w) => a + workoutSetCount(w), 0)}</div><div class="l">Sets</div></div>
        <div class="stat"><div class="v num">${weekStreak(workouts)}<span class="tiny dim"> wk</span></div><div class="l">Streak</div></div>
      </div></div>
  </section>

  <section>
    <div class="section-h"><h2>Recent activity</h2><a class="link" href="#/progress/history">All →</a></div>
    <div class="card" style="padding:4px 14px">${workouts.length ? [...workouts].reverse().slice(0, 3).map((w) => workoutRow(w, units)) : html`<div class="empty"><div class="title-m" style="color:var(--text-1)">No workouts yet</div><p class="tiny">Start your first session from Train — or explore with sample data.</p><button class="btn sm" data-act="sample">Load sample data</button></div>`}</div>
  </section>

  <button class="card tap ai row" data-act="coach" style="width:100%;text-align:left;margin-top:16px"><div class="avatar">${icon('spark')}</div><div style="flex:1"><b>Ask your coach</b><div class="tiny muted">“What should I train today?”</div></div>${icon('chevR')}</button>
  </div>`;

  return {
    html: out,
    mount(el) {
      animateRings(el);
      return delegate(el, {
        coach: () => navigate('/coach'),
        resume: () => navigate('/workout'),
        body: () => navigate('/body'),
        health: () => navigate('/profile'),
        sample: () => loadSampleData(),
        customize: (_, e) => { e.stopPropagation(); navigate('/generator'); },
        'open-workout': (b) => navigate(`/progress/workout/${b.dataset.id}`),
        'start-suggested': (_, e) => {
          e.stopPropagation();
          if (!plan.exercises.length) return;
          if (getState().active) { navigate('/workout'); return; }
          haptic('medium');
          setState((st) => { st.active = fromPlan(plan, workouts); }, { op: 'workout.start' });
          navigate('/workout');
        },
      });
    },
  };
}

