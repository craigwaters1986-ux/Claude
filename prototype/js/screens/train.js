import { html, icon, delegate, haptic, confirmSheet, toast } from '../ui/dom.js';
import { workoutRow, emptyState, exName } from '../ui/widgets.js';
import { derived } from '../app.js';
import { getState, setState } from '../core/store.js';
import { newWorkout, fromTemplate } from '../core/session.js';

export function render({ navigate }) {
  const s = getState();
  const { workouts, profile } = derived();

  const start = (w) => {
    if (getState().active) { toast('Finish or discard your current workout first'); navigate('/workout'); return; }
    haptic('medium');
    setState((st) => { st.active = w; }, { op: 'workout.start' });
    navigate('/workout');
  };

  const out = html`
  <header class="topbar"><div><div class="eyebrow">Train</div><h1 class="title-xl">Let's lift</h1></div>
    <button class="icon-btn" data-act="library" aria-label="Exercise library">${icon('search')}</button></header>

  <div class="stagger">
  ${s.active ? html`<button class="btn primary block lg" data-act="resume">${icon('timer')} Resume “${s.active.name}”</button>`
    : html`<button class="btn primary block lg" data-act="empty">${icon('plus')} Start empty workout</button>`}

  <div class="card ai tap" data-act="generator" style="margin-top:14px">
    <div class="row"><div class="avatar" style="background:var(--ai-grad)">${icon('spark')}</div>
    <div style="flex:1"><b>AI workout generator</b><div class="tiny muted">Personalised to your goal, equipment, injuries and estimated recovery.</div></div>${icon('chevR')}</div>
  </div>
  <div class="grid2" style="margin-top:12px">
    <div class="card tap" data-act="library" style="margin:0"><div class="avatar">${icon('layers')}</div><b style="display:block;margin-top:10px">Exercise library</b><span class="tiny dim">Search & create custom</span></div>
    <div class="card tap" data-act="watch" style="margin:0"><div class="avatar">${icon('watch')}</div><b style="display:block;margin-top:10px">Watch preview</b><span class="tiny dim">Rep counting demo</span></div>
  </div>

  <section>
    <div class="section-h"><h2>Templates</h2><span class="tiny dim">${s.templates.length}</span></div>
    ${s.templates.length ? s.templates.map((t) => html`<div class="card" style="padding:14px">
      <div class="row between"><b>${t.name}</b><div class="row" style="gap:6px">
        <button class="icon-btn sm" data-act="del-tpl" data-id="${t.id}" aria-label="Delete template ${t.name}">${icon('trash', 'sm')}</button>
        <button class="btn sm primary" data-act="tpl" data-id="${t.id}">${icon('play', 'sm')} Start</button></div></div>
      <div class="tiny dim" style="margin-top:6px;line-height:1.5">${t.exercises.map((e) => `${exName(e.exerciseId)} ×${e.sets}`).join(' · ')}</div></div>`)
    : html`<div class="card">${emptyState('note', 'No templates yet', 'Finish a workout and tap “Save as template”, or save one from the AI generator.')}</div>`}
  </section>

  <section>
    <div class="section-h"><h2>Recent workouts</h2></div>
    <div class="card" style="padding:4px 14px">${workouts.length ? [...workouts].reverse().slice(0, 5).map((w) => workoutRow(w, profile.units)) : emptyState('train', 'Nothing logged yet', 'Your completed workouts will appear here. Tap one to edit it.')}</div>
  </section>
  </div>`;

  return {
    html: out,
    mount: (el) => delegate(el, {
      empty: () => start(newWorkout(`${new Date().toLocaleDateString(undefined, { weekday: 'long' })} Workout`)),
      resume: () => navigate('/workout'),
      generator: () => navigate('/generator'),
      library: () => navigate('/library'),
      watch: () => navigate('/watch'),
      tpl: (b) => { const t = getState().templates.find((x) => x.id === b.dataset.id); if (t) start(fromTemplate(t, workouts)); },
      'del-tpl': async (b) => { if (await confirmSheet('Delete template?', 'Your logged workouts are not affected.', 'Delete', { danger: true })) setState((st) => { st.templates = st.templates.filter((t) => t.id !== b.dataset.id); }, { op: 'template.delete' }); },
      'open-workout': (b) => navigate(`/progress/workout/${b.dataset.id}`),
    }),
  };
}
