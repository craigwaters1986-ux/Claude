import { html, icon, delegate, haptic, toast } from '../ui/dom.js';
import { muscleChips, exName } from '../ui/widgets.js';
import { derived } from '../app.js';
import { getState, setState, uid } from '../core/store.js';
import { GOALS, EXPERIENCE, SPLITS, INJURY_TAGS, generateProgram, regenerateExercise, swapExercise } from '../core/generator.js';
import { generate } from '../core/ai.js';
import { EQUIPMENT, EXERCISE_BY_ID } from '../core/exercises.js';
import { GROUP_LABELS, MUSCLE_BY_ID } from '../core/muscles.js';
import { fromPlan } from '../core/session.js';
import { fmtWeight } from '../core/units.js';

export const selfManaged = true;

let form = null;
let result = null; // { kind: 'single'|'week', plan|program, issues, via }
let open = {};

function initForm(p, s) {
  return { mode: 'single', goal: p.goal, experience: p.experience, durationMin: p.durationMin, location: p.location, equipment: [...p.equipment],
    target: [], avoid: [], daysPerWeek: p.days?.length || 4, split: 'auto', injuries: [...(p.injuries || [])], seed: 7, likes: s.likes, dislikes: s.dislikes };
}

const chip = (act, val, on, label, cls = '') => html`<button class="chip ${cls}" data-act="${act}" data-v="${val}" aria-pressed="${on}">${label}</button>`;

export function render({ navigate }) {
  const s = getState();
  const { workouts, recovery, profile } = derived();
  form ||= initForm(profile, s);
  form.likes = s.likes; form.dislikes = s.dislikes;
  let root; let busy = false;
  const units = profile.units;

  const formView = () => html`
    <div class="seg" role="tablist" aria-label="Plan type"><button role="tab" aria-selected="${form.mode === 'single'}" data-act="mode" data-v="single">Single workout</button><button role="tab" aria-selected="${form.mode === 'week'}" data-act="mode" data-v="week">Weekly programme</button></div>
    <div class="card" style="margin-top:12px">
      <div class="eyebrow">Goal</div><div class="chips" style="margin-top:8px">${Object.entries(GOALS).map(([k, g]) => chip('goal', k, form.goal === k, g.label))}</div>
      <div class="eyebrow" style="margin-top:16px">Experience</div><div class="chips" style="margin-top:8px">${Object.entries(EXPERIENCE).map(([k, e]) => chip('experience', k, form.experience === k, e.label))}</div>
      <div class="eyebrow" style="margin-top:16px">Duration</div><div class="chips" style="margin-top:8px">${[20, 30, 45, 60, 75, 90].map((d) => chip('duration', d, form.durationMin === d, `${d} min`))}</div>
      <div class="eyebrow" style="margin-top:16px">Location</div><div class="chips" style="margin-top:8px">${[['gym', 'Gym'], ['home', 'Home'], ['bodyweight', 'Bodyweight']].map(([k, l]) => chip('location', k, form.location === k, l))}</div>
      ${form.location !== 'bodyweight' ? html`<div class="eyebrow" style="margin-top:16px">Available equipment</div><div class="chips" style="margin-top:8px">${EQUIPMENT.map((e) => chip('equip', e.id, form.equipment.includes(e.id), e.label))}</div>` : ''}
    </div>
    <div class="card">
      <div class="eyebrow">Target muscles <span style="text-transform:none;letter-spacing:0;font-weight:500">— leave empty to let recovery decide</span></div>
      <div class="chips" style="margin-top:8px">${Object.entries(GROUP_LABELS).map(([k, l]) => chip('target', k, form.target.includes(k), l))}</div>
      <div class="eyebrow" style="margin-top:16px">Avoid</div><div class="chips" style="margin-top:8px">${Object.entries(GROUP_LABELS).map(([k, l]) => chip('avoid', k, form.avoid.includes(k), l, 'avoid'))}</div>
      <div class="eyebrow" style="margin-top:16px">Injuries / movement restrictions</div><div class="chips" style="margin-top:8px">${Object.entries(INJURY_TAGS).map(([k, l]) => chip('injury', k, form.injuries.includes(k), l, 'avoid'))}</div>
      <div class="tiny dim" style="margin-top:8px">Restricted joints remove exercises that load them. This is not medical advice.</div>
      ${form.mode === 'week' ? html`<div class="eyebrow" style="margin-top:16px">Days per week</div><div class="chips" style="margin-top:8px">${[2, 3, 4, 5, 6].map((d) => chip('days', d, form.daysPerWeek === d, `${d}`))}</div>
      <div class="eyebrow" style="margin-top:16px">Split</div><div class="chips" style="margin-top:8px">${chip('split', 'auto', form.split === 'auto', 'Auto')}${Object.entries(SPLITS).map(([k, sp]) => chip('split', k, form.split === k, sp.label))}</div>` : ''}
      <div class="eyebrow" style="margin-top:16px">Preferences</div>
      <div class="tiny muted" style="margin-top:6px">${s.likes.length ? `Favouring: ${s.likes.map(exName).join(', ')}` : 'No preferred exercises yet.'}${s.dislikes.length ? ` · Avoiding: ${s.dislikes.map(exName).join(', ')}` : ''} <a class="link" href="#/library">Edit in library</a></div>
    </div>
    <button class="btn ai block lg" data-act="generate" style="margin-top:14px">${icon('spark')} Generate ${form.mode === 'week' ? 'programme' : 'workout'}</button>
    <p class="tiny dim" style="text-align:center;margin-top:10px">${profile.aiCloud && profile.aiEndpoint ? 'Uses Forma Cloud AI (validated on device), with on-device fallback.' : 'Runs on the on-device engine — works offline. Cloud AI can be enabled in Profile.'}</p>`;

  const exCardView = (e, i, plan) => {
    const ex = EXERCISE_BY_ID[e.exerciseId];
    const isOpen = open[i];
    return html`<div class="card" style="padding:14px" data-i="${i}">
      <div class="row between top"><div style="min-width:0;flex:1"><div class="row" style="gap:8px"><span class="badge num">${i + 1}</span>${e.superset ? html`<span class="badge ai">${e.superset}</span>` : ''}<b>${e.name}</b></div>
        <div class="tiny muted num" style="margin-top:6px">${e.sets} sets × ${e.reps[0]}–${e.reps[1]} reps · rest ${e.restSec >= 60 ? `${Math.round(e.restSec / 60 * 10) / 10} min` : `${e.restSec}s`}</div>
        <div class="tiny" style="margin-top:4px;color:${e.suggestedWeightKg != null ? 'var(--accent-2)' : 'var(--text-2)'}">${e.suggestedWeightKg != null ? `Suggested: ${fmtWeight(e.suggestedWeightKg, units)} (from your history)` : 'Weight: pick a load that leaves 2–3 reps in reserve'}</div></div>
        <button class="icon-btn sm" data-act="regen" data-i="${i}" aria-label="Regenerate ${e.name}">${icon('refresh', 'sm')}</button></div>
      <div style="margin-top:8px">${muscleChips(ex)}</div>
      <button class="link tiny" data-act="toggle" data-i="${i}" style="margin-top:8px">${isOpen ? 'Hide details' : 'Why this, how to & alternatives'}</button>
      ${isOpen ? html`<div class="col" style="margin-top:8px;gap:4px">${e.why.map((w) => html`<div class="tiny muted">• ${w}</div>`)}</div>
        <ol class="tiny muted" style="padding-left:18px;line-height:1.6">${e.instructions.map((t) => html`<li>${t}</li>`)}</ol>
        ${e.alternatives.length ? html`<div class="eyebrow">Swap for</div><div class="chips" style="margin-top:6px">${e.alternatives.map((a) => html`<button class="chip" data-act="swap" data-i="${i}" data-v="${a}">${EXERCISE_BY_ID[a]?.name}</button>`)}</div>` : ''}` : ''}
    </div>`;
  };

  const planView = (plan, { compact = false, dayIndex } = {}) => html`
    <div class="card ai"><div class="row between"><span class="badge ai">${plan.source === 'cloud-ai' ? 'Cloud AI · validated' : 'On-device AI'}</span><span class="tiny dim num">~${plan.estimatedMinutes} min · ${plan.exercises.reduce((a, e) => a + e.sets, 0)} sets</span></div>
      <h2 class="title-l" style="margin-top:8px">${plan.name}</h2>
      ${[...plan.warnings || []].map((w) => html`<div class="banner err" style="margin-top:8px">${icon('info', 'sm')}<span>${w}</span></div>`)}
      ${[...plan.notes || []].map((n) => html`<div class="tiny muted" style="margin-top:8px;line-height:1.45">• ${n}</div>`)}
    </div>
    ${compact ? html`<div class="card"><div class="col" style="gap:6px">${plan.exercises.map((e) => html`<div class="row between tiny"><span>${e.name}</span><span class="dim num">${e.sets}×${e.reps[0]}–${e.reps[1]}</span></div>`)}</div>
      <div class="row" style="margin-top:12px;gap:8px"><button class="btn sm primary" data-act="start-day" data-d="${dayIndex}">${icon('play', 'sm')} Start</button><button class="btn sm" data-act="save-day" data-d="${dayIndex}">Save template</button></div></div>`
    : plan.exercises.map((e, i) => exCardView(e, i, plan))}`;

  const resultView = () => {
    if (result.kind === 'single') {
      const p = result.plan;
      return html`${result.issues.length ? html`<div class="banner" style="margin-bottom:10px">${icon('shield', 'sm')}<span>Safety checks adjusted the plan: ${result.issues.join(' ')}</span></div>` : ''}
        ${planView(p)}
        ${p.notice ? html`<div class="tiny dim" style="margin-top:8px">${p.notice}</div>` : ''}
        <div class="col" style="margin-top:14px"><button class="btn primary block lg" data-act="start" ${p.exercises.length ? '' : 'disabled'}>${icon('play')} Start this workout</button>
        <div class="row" style="gap:8px"><button class="btn" style="flex:1" data-act="save">${icon('note', 'sm')} Save template</button><button class="btn" style="flex:1" data-act="again">${icon('refresh', 'sm')} Regenerate all</button></div>
        <button class="btn" data-act="edit">Adjust inputs</button></div>`;
    }
    const pr = result.program;
    return html`<div class="card ai"><span class="badge ai">On-device AI</span><h2 class="title-l" style="margin-top:8px">${pr.splitLabel} · ${pr.daysPerWeek} days</h2>
      ${pr.rationale.map((r) => html`<div class="tiny muted" style="margin-top:6px">• ${r}</div>`)}
      <div class="eyebrow" style="margin-top:12px">Planned weekly hard sets</div>
      <div class="chips" style="margin-top:6px">${Object.entries(pr.weeklySets).sort((a, b) => b[1] - a[1]).map(([m, v]) => html`<span class="muscle-chip">${MUSCLE_BY_ID[m].name} ${v}</span>`)}</div></div>
      ${pr.sessions.map((sess, d) => html`<div class="section-h"><h2>${sess.name.split(' — ')[0]}</h2><span class="tiny dim">~${sess.estimatedMinutes} min</span></div>${planView(sess, { compact: true, dayIndex: d })}`)}
      <div class="col" style="margin-top:14px"><button class="btn primary block" data-act="save-all">${icon('note', 'sm')} Save all ${pr.sessions.length} days as templates</button><button class="btn" data-act="edit">Adjust inputs</button></div>`;
  };

  const body = () => html`
    <header class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('chevL')}</button><div style="text-align:center"><div class="eyebrow" style="color:#b9afff">${icon('spark', 'sm')} AI</div><h1 class="title-m">Workout generator</h1></div><span style="width:44px"></span></header>
    ${busy ? html`<div class="card ai" style="text-align:center;padding:40px 16px"><div class="logo" style="background:var(--ai-grad)">${icon('spark')}</div><p class="muted" style="margin-top:16px">Balancing recovery, volume and your history…</p><div class="skeleton" style="height:14px;margin-top:10px"></div><div class="skeleton" style="height:14px;margin-top:8px;width:70%;margin-inline:auto"></div></div>`
      : result ? resultView() : formView()}`;

  const rerender = () => { const y = root.scrollTop; root.innerHTML = String(body()); root.scrollTop = y; };
  const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const run = async () => {
    busy = true; rerender(); root.scrollTop = 0;
    const started = Date.now();
    const input = { ...form, equipment: form.location === 'bodyweight' ? [] : form.equipment, split: form.split === 'auto' ? undefined : form.split };
    if (form.mode === 'week') result = { kind: 'week', program: generateProgram(input, { workouts }) };
    else { const r = await generate(input, { workouts, recovery }, profile); result = { kind: 'single', ...r }; }
    await new Promise((res) => setTimeout(res, Math.max(0, 650 - (Date.now() - started)))); // let the transition breathe
    busy = false; open = {}; haptic('success'); rerender();
  };

  const startPlan = (plan) => {
    if (getState().active) { toast('Finish your current workout first'); navigate('/workout'); return; }
    setState((st) => { st.active = fromPlan(plan, workouts); }, { op: 'workout.start' }); haptic('medium'); navigate('/workout');
  };
  const saveTpl = (plan) => setState((st) => { st.templates.push({ id: uid('tpl_'), name: plan.name.split(' — ')[0], exercises: plan.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets, restSec: e.restSec, superset: e.superset })) }); }, { op: 'template.create' });

  return {
    html: body(),
    mount(el) {
      root = el;
      return delegate(el, {
        back: () => navigate('/train'),
        mode: (b) => { form.mode = b.dataset.v; rerender(); },
        goal: (b) => { form.goal = b.dataset.v; rerender(); },
        experience: (b) => { form.experience = b.dataset.v; rerender(); },
        duration: (b) => { form.durationMin = +b.dataset.v; rerender(); },
        location: (b) => { form.location = b.dataset.v; if (b.dataset.v === 'home') form.equipment = ['dumbbell', 'bench', 'pullupBar']; if (b.dataset.v === 'gym') form.equipment = EQUIPMENT.map((e) => e.id); rerender(); },
        equip: (b) => { form.equipment = toggleIn(form.equipment, b.dataset.v); rerender(); },
        target: (b) => { form.target = toggleIn(form.target, b.dataset.v); form.avoid = form.avoid.filter((x) => x !== b.dataset.v); rerender(); },
        avoid: (b) => { form.avoid = toggleIn(form.avoid, b.dataset.v); form.target = form.target.filter((x) => x !== b.dataset.v); rerender(); },
        injury: (b) => { form.injuries = toggleIn(form.injuries, b.dataset.v); rerender(); },
        days: (b) => { form.daysPerWeek = +b.dataset.v; rerender(); },
        split: (b) => { form.split = b.dataset.v; rerender(); },
        generate: run,
        again: () => { form.seed += 13; run(); },
        edit: () => { result = null; rerender(); root.scrollTop = 0; },
        toggle: (b) => { open[b.dataset.i] = !open[b.dataset.i]; rerender(); },
        regen: (b) => { result.plan = regenerateExercise(result.plan, +b.dataset.i, { workouts }); haptic('light'); if (result.plan.notice) toast(result.plan.notice); rerender(); },
        swap: (b) => { const n = swapExercise(result.plan, +b.dataset.i, b.dataset.v, { workouts }); if (n.notice) toast(n.notice); else { result.plan = n; haptic('light'); } rerender(); },
        start: () => startPlan(result.plan),
        save: () => { saveTpl(result.plan); toast('Saved to templates'); },
        'start-day': (b) => startPlan(result.program.sessions[+b.dataset.d]),
        'save-day': (b) => { saveTpl(result.program.sessions[+b.dataset.d]); toast('Saved to templates'); },
        'save-all': () => { result.program.sessions.forEach(saveTpl); toast(`Saved ${result.program.sessions.length} templates`); },
      });
    },
  };
}
