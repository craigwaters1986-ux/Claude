// Full-screen active workout logger (also used to edit completed workouts).
// Optimised for one hand: the sticky "thumb bar" always targets the next
// incomplete set with big steppers and a single Complete button.

import { html, raw, icon, delegate, haptic, toast, openSheet, confirmSheet, esc } from '../ui/dom.js';
import { muscleChips, exName } from '../ui/widgets.js';
import { pickExercise } from './library.js';
import { derived } from '../app.js';
import { getState, setState } from '../core/store.js';
import { EXERCISE_BY_ID } from '../core/exercises.js';
import { addExercise, newSet, previousFor, cycleSetType, toggleSuperset, suggestionFor, finishWorkout, templateFromWorkout, restFor } from '../core/session.js';
import { isLivePR, workoutVolume, workoutSetCount } from '../core/metrics.js';
import { toDisplay, fromDisplay, fmtWeight, fmtDuration, fmtVolume } from '../core/units.js';

export const selfManaged = true;

const TYPE_LABEL = { working: null, warmup: 'W', drop: 'D', failure: 'F' };
const RPE_OPTIONS = ['', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'];

export function render({ params, navigate }) {
  const editing = params[0] === 'edit';
  const st = getState();
  const { workouts: history, profile } = derived();
  const units = profile.units;
  let w = editing ? structuredClone(st.workouts.find((x) => x.id === params[1]) || null) : structuredClone(st.active);

  if (!w) {
    return { html: html`<header class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('chevL')}</button><span></span></header>
      <div class="empty" style="margin-top:80px">${icon('timer')}<div class="title-m">No active workout</div><p class="tiny">Start one from the Train tab.</p><button class="btn primary" data-act="train">Go to Train</button></div>`,
      mount: (el) => delegate(el, { back: () => navigate('/train'), train: () => navigate('/train') }) };
  }
  const priorHistory = history.filter((h) => h.id !== w.id);

  let root; let tick = 0; let commitTimer = 0; let ended = false;
  const commit = (op = 'workout.update') => {
    clearTimeout(commitTimer);
    if (editing || ended) return; // edits are saved explicitly
    const snapshot = structuredClone(w);
    commitTimer = setTimeout(() => { if (!ended) setState((s) => { s.active = snapshot; }, { op }); }, 60);
  };
  /** Ends the live session: cancels pending autosaves so they can't resurrect it. */
  const endSession = (mutator, op) => { ended = true; clearTimeout(commitTimer); setState(mutator, { op }); };

  const currentSet = () => {
    for (const [i, it] of w.exercises.entries()) { const j = it.sets.findIndex((s) => !s.done); if (j >= 0) return { i, j }; }
    return null;
  };

  const setRow = (it, i, s, j, prev) => {
    const p = prev[j];
    const pr = s.done && s.type !== 'warmup' ? isLivePR(s, it.exerciseId, priorHistory) : null;
    const workingIdx = it.sets.slice(0, j + 1).filter((x) => x.type !== 'warmup').length;
    return html`<div class="set-grid set-row ${s.done ? 'done' : ''}" data-set="${i}:${j}">
      <button class="set-type ${s.type}" data-act="type" data-i="${i}" data-j="${j}" aria-label="Set ${j + 1} type: ${s.type}. Tap to change">${TYPE_LABEL[s.type] || workingIdx}</button>
      <button class="set-prev ${p ? 'tap' : ''}" data-act="copy-prev" data-i="${i}" data-j="${j}" aria-label="${p ? `Previous: ${fmtWeight(p.weightKg, units)} by ${p.reps}. Tap to copy` : 'No previous set'}">${p ? `${fmtWeight(p.weightKg, units, { unit: false })}×${p.reps}` : '—'}</button>
      <input class="set-in" inputmode="decimal" enterkeyhint="next" aria-label="Weight in ${units}, set ${j + 1}" data-field="weight" data-i="${i}" data-j="${j}" value="${s.weightKg != null ? toDisplay(s.weightKg, units) : ''}" placeholder="${p ? toDisplay(p.weightKg, units) : units}">
      <input class="set-in" inputmode="numeric" enterkeyhint="done" aria-label="Reps, set ${j + 1}" data-field="reps" data-i="${i}" data-j="${j}" value="${s.reps ?? ''}" placeholder="${p ? p.reps : 'reps'}">
      <select class="set-rpe" aria-label="RPE, set ${j + 1}" data-field="rpe" data-i="${i}" data-j="${j}">${RPE_OPTIONS.map((o) => html`<option value="${o}" ${String(s.rpe ?? '') === o ? 'selected' : ''}>${o ? o : 'RPE'}</option>`)}</select>
      <button class="set-check" data-act="done" data-i="${i}" data-j="${j}" aria-pressed="${s.done}" aria-label="Mark set ${j + 1} ${s.done ? 'incomplete' : 'complete'}">${icon('check', 'sm')}</button>
    </div>${pr ? html`<div class="row" style="justify-content:flex-end;margin:-2px 50px 4px 0"><span class="badge pr">${icon('trophy', 'sm')} ${pr === 'weight' ? 'Weight PR' : 'e1RM PR'}</span></div>` : ''}`;
  };

  const exCard = (it, i) => {
    const ex = EXERCISE_BY_ID[it.exerciseId];
    const prev = previousFor(priorHistory, it.exerciseId, editing ? w.startedAt : Infinity);
    const sug = suggestionFor(priorHistory, it.exerciseId, profile.goal);
    const linkedNext = it.superset && w.exercises[i + 1]?.superset === it.superset;
    return html`<section class="card ex-card ${it.superset ? 'superset' : ''}" data-ex="${i}">
      <div class="row between top"><div style="min-width:0"><div class="row" style="gap:8px">${it.superset ? html`<span class="badge ai">Superset</span>` : ''}<h2 class="title-m">${ex?.name || 'Exercise'}</h2></div>
        <div style="margin-top:6px">${muscleChips(ex)}</div></div>
        <button class="icon-btn sm" data-act="ex-menu" data-i="${i}" aria-label="More options for ${ex?.name}">${icon('dots', 'sm')}</button></div>
      ${sug && sug.action !== 'baseline' ? html`<div class="suggest">${icon('spark', 'sm')}<span><b style="color:var(--text-0)">${sug.weightKg != null ? `${fmtWeight(sug.weightKg, units)} × ${sug.reps}` : `${sug.reps} reps`}</b> — ${sug.reason}</span></div>` : ''}
      <div class="set-grid set-head"><span>Set</span><span style="text-align:center">Prev</span><span style="text-align:center">${units}</span><span style="text-align:center">Reps</span><span style="text-align:center">RPE</span><span></span></div>
      ${it.sets.map((s, j) => setRow(it, i, s, j, prev))}
      <div class="row" style="margin-top:8px;gap:8px">
        <button class="btn sm" data-act="add-set" data-i="${i}" style="flex:1">${icon('plus', 'sm')} Add set</button>
        <button class="btn sm" data-act="dup-set" data-i="${i}" style="flex:1" ${it.sets.length ? '' : 'disabled'}>${icon('copy', 'sm')} Copy last</button>
        ${prev.length ? html`<button class="btn sm" data-act="copy-all" data-i="${i}" aria-label="Copy all sets from previous session">${icon('refresh', 'sm')} Prev</button>` : ''}
      </div>
      ${it.notes != null && it.showNotes ? html`<textarea class="input" style="margin-top:10px" placeholder="Notes for ${esc(ex?.name)}" data-field="ex-notes" data-i="${i}">${it.notes}</textarea>` : ''}
      ${linkedNext ? html`<div class="tiny" style="color:#b9afff;margin-top:8px;text-align:center">↓ go straight to the next exercise, then rest</div>` : ''}
    </section>`;
  };

  const thumbBar = () => {
    const c = currentSet(); if (!c || editing) return '';
    const it = w.exercises[c.i]; const s = it.sets[c.j]; const ex = EXERCISE_BY_ID[it.exerciseId];
    const inc = units === 'lb' ? 5 : (ex?.incrementKg || 2.5);
    return html`<div class="thumbbar" aria-label="Current set controls">
      <div class="row between tiny" style="margin-bottom:8px"><b>${ex?.name}</b><span class="dim">Set ${c.j + 1} of ${it.sets.length}</span></div>
      <div class="row" style="gap:6px">
        <div class="stepper"><button class="icon-btn" data-act="step" data-f="w" data-d="${-inc}" aria-label="Decrease weight">${icon('minus')}</button>
          <div><div class="v">${s.weightKg != null ? fmtWeight(s.weightKg, units, { unit: false }) : '—'}</div><span class="u">${units.toUpperCase()}</span></div>
          <button class="icon-btn" data-act="step" data-f="w" data-d="${inc}" aria-label="Increase weight">${icon('plus')}</button></div>
        <div class="stepper"><button class="icon-btn" data-act="step" data-f="r" data-d="-1" aria-label="Decrease reps">${icon('minus')}</button>
          <div><div class="v">${s.reps ?? '—'}</div><span class="u">REPS</span></div>
          <button class="icon-btn" data-act="step" data-f="r" data-d="1" aria-label="Increase reps">${icon('plus')}</button></div>
      </div>
      <button class="btn primary block lg" data-act="done" data-i="${c.i}" data-j="${c.j}" style="margin-top:10px">${icon('check')} Complete set</button>
    </div>`;
  };

  const restBanner = () => {
    const r = w.rest; if (!r || editing) return '';
    return html`<div class="rest-banner" role="timer" aria-label="Rest timer">
      <div class="avatar" style="width:40px;height:40px">${icon('timer', 'sm')}</div>
      <div style="flex:1"><div class="eyebrow">Rest</div><div class="title-l num" data-rest-left>${fmtDuration(Math.max(0, (r.endsAt - Date.now()) / 1000))}</div></div>
      <button class="btn sm" data-act="rest-adj" data-d="-15">−15</button><button class="btn sm" data-act="rest-adj" data-d="15">+15</button>
      <button class="icon-btn sm" data-act="rest-skip" aria-label="Skip rest">${icon('x', 'sm')}</button></div>`;
  };

  const body = () => html`
    <header class="wk-top"><div class="row between">
      <button class="icon-btn" data-act="minimise" aria-label="${editing ? 'Cancel editing' : 'Minimise workout'}">${icon(editing ? 'x' : 'chevD')}</button>
      <div style="text-align:center;min-width:0;flex:1"><input class="input" data-field="name" value="${w.name}" aria-label="Workout name" style="background:none;border:0;text-align:center;font-weight:700;min-height:30px;padding:0">
        ${editing ? html`<div class="tiny dim">Editing · ${new Date(w.startedAt).toLocaleDateString()}</div>` : html`<div class="wk-timer" data-elapsed>${fmtDuration((Date.now() - w.startedAt) / 1000)}</div>`}</div>
      <button class="btn sm primary" data-act="finish">${editing ? 'Save' : 'Finish'}</button></div>
      ${raw(String(restBanner()))}</header>
    ${w.exercises.length ? w.exercises.map(exCard) : html`<div class="empty" style="margin-top:30px">${icon('train')}<div class="title-m">Add your first exercise</div><p class="tiny">Search the library or create a custom exercise.</p></div>`}
    <button class="btn block lg" data-act="add-ex" style="margin-top:14px">${icon('plus')} Add exercise</button>
    <textarea class="input" style="margin-top:12px" data-field="notes" placeholder="Workout notes (how it felt, gym, etc.)">${w.notes || ''}</textarea>
    ${!editing ? html`<button class="btn block danger" data-act="discard" style="margin-top:12px">Discard workout</button>` : ''}
    <div style="height:${editing ? 40 : 190}px"></div>
    ${raw(String(thumbBar()))}`;

  const rerender = () => {
    const y = root.scrollTop;
    const focusKey = document.activeElement?.dataset?.field ? `${document.activeElement.dataset.field}:${document.activeElement.dataset.i}:${document.activeElement.dataset.j}` : null;
    root.innerHTML = String(body());
    root.scrollTop = y;
    if (focusKey) { const [f, i, j] = focusKey.split(':'); root.querySelector(`[data-field="${f}"][data-i="${i}"][data-j="${j}"]`)?.focus({ preventScroll: true }); }
  };

  const startRest = (it) => {
    const dur = restFor(it, profile);
    w.rest = { endsAt: Date.now() + dur * 1000, duration: dur };
  };

  const completeSet = (i, j) => {
    const it = w.exercises[i]; const s = it.sets[j];
    if (!s.done) {
      if (s.weightKg == null) { const p = previousFor(priorHistory, it.exerciseId)[j]; if (p) s.weightKg = p.weightKg; }
      if (!s.reps) { const p = previousFor(priorHistory, it.exerciseId)[j]; s.reps = p?.reps || null; }
      if (!s.reps) { toast('Enter reps first'); root.querySelector(`[data-field="reps"][data-i="${i}"][data-j="${j}"]`)?.focus(); return; }
      s.done = true; s.completedAt = Date.now();
      // Carry forward into the next empty set of this exercise so the thumb bar is one tap away.
      const nx = it.sets[j + 1];
      if (nx && !nx.done && nx.weightKg == null && nx.reps == null) { nx.weightKg = s.weightKg; nx.reps = s.reps; }
      haptic('success');
      const pr = s.type !== 'warmup' && isLivePR(s, it.exerciseId, priorHistory);
      if (pr) { toast(`🏆 New ${pr === 'weight' ? 'weight' : 'estimated 1RM'} PR — ${exName(it.exerciseId)}`, { kind: 'pr', ms: 3000 }); haptic('heavy'); }
      // Supersets: rest only after the last exercise in the group.
      const next = w.exercises[i + 1];
      if (!(it.superset && next?.superset === it.superset) && !editing) startRest(it);
    } else { s.done = false; s.completedAt = null; }
    rerender(); commit('set.complete');
  };

  const onInput = (e) => {
    const el = e.target; const f = el.dataset.field; if (!f) return;
    const i = +el.dataset.i, j = +el.dataset.j;
    if (f === 'name') w.name = el.value;
    else if (f === 'notes') w.notes = el.value;
    else if (f === 'ex-notes') w.exercises[i].notes = el.value;
    else {
      const s = w.exercises[i].sets[j];
      if (f === 'weight') s.weightKg = el.value === '' ? null : fromDisplay(el.value, units);
      if (f === 'reps') s.reps = el.value === '' ? null : Math.max(0, parseInt(el.value, 10) || 0);
      if (f === 'rpe') { s.rpe = el.value === '' ? null : +el.value; s.rir = s.rpe != null ? Math.max(0, 10 - s.rpe) : null; }
    }
    commit();
    if (e.type === 'change' && f !== 'name' && f !== 'notes' && f !== 'ex-notes') rerender(); // refresh thumb bar / PR badges
  };

  const exMenu = (i) => {
    const it = w.exercises[i]; const ex = EXERCISE_BY_ID[it.exerciseId];
    const { close } = openSheet(html`<h3 class="title-l">${ex?.name}</h3>
      <div class="list" style="margin-top:8px">
        ${i < w.exercises.length - 1 ? html`<button class="list-item tap" data-m="superset">${icon('link')}<span>${it.superset && w.exercises[i + 1]?.superset === it.superset ? 'Unlink superset' : 'Superset with next exercise'}</span></button>` : ''}
        <button class="list-item tap" data-m="notes">${icon('note')}<span>Exercise notes</span></button>
        <button class="list-item tap" data-m="rest">${icon('timer')}<span>Rest timer: ${restFor(it, profile)} s</span></button>
        <button class="list-item tap" data-m="replace">${icon('refresh')}<span>Replace exercise</span></button>
        ${i > 0 ? html`<button class="list-item tap" data-m="up">${icon('chevR')}<span>Move up</span></button>` : ''}
        <button class="list-item tap" data-m="remove" style="color:var(--danger)">${icon('trash')}<span>Remove exercise</span></button>
      </div>`, {
      label: 'Exercise options',
      onMount: (el) => el.addEventListener('click', async (e) => {
        const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return;
        close();
        if (m === 'superset') toggleSuperset(w, i);
        if (m === 'notes') { it.showNotes = true; it.notes = it.notes || ''; }
        if (m === 'rest') { const opts = [45, 60, 90, 120, 150, 180, 240]; it.restSec = opts[(opts.indexOf(restFor(it, profile)) + 1) % opts.length]; toast(`Rest set to ${it.restSec} s`); }
        if (m === 'replace') { const id = await pickExercise(); if (id) { it.exerciseId = id; } }
        if (m === 'up') { [w.exercises[i - 1], w.exercises[i]] = [w.exercises[i], w.exercises[i - 1]]; }
        if (m === 'remove') w.exercises.splice(i, 1);
        rerender(); commit('exercise.edit');
      }),
    });
  };

  const finish = async () => {
    if (editing) {
      const done = { ...w, exercises: w.exercises.map((e) => ({ ...e, sets: e.sets.filter((s) => s.reps > 0) })).filter((e) => e.sets.length) };
      setState((s) => { s.workouts = s.workouts.map((x) => (x.id === done.id ? done : x)); }, { op: 'workout.edit' });
      toast('Workout updated'); navigate(`/progress/workout/${w.id}`); return;
    }
    if (!w.exercises.some((e) => e.sets.some((s) => s.done))) {
      if (await confirmSheet('No completed sets', 'Nothing has been marked complete. Discard this workout?', 'Discard', { danger: true })) { endSession((s) => { s.active = null; }, 'workout.discard'); navigate('/train'); }
      return;
    }
    const incomplete = w.exercises.reduce((a, e) => a + e.sets.filter((s) => !s.done).length, 0);
    if (incomplete && !(await confirmSheet('Finish workout?', `${incomplete} set${incomplete > 1 ? 's are' : ' is'} not marked complete and won't be saved.`, 'Finish'))) return;
    const done = finishWorkout(w, priorHistory);
    endSession((s) => { s.workouts.push(done); s.active = null; }, 'workout.finish');
    haptic('success');
    summary(done);
  };

  const summary = (done) => {
    const mins = Math.round((done.endedAt - done.startedAt) / 60000);
    const { close } = openSheet(html`<div style="text-align:center"><div class="logo" style="width:64px;height:64px;border-radius:20px">${icon('check')}</div>
      <h3 class="title-l" style="margin-top:14px">Workout complete</h3><p class="muted tiny">${done.name}</p></div>
      <div class="grid3" style="margin-top:14px"><div class="stat"><div class="v num">${mins}</div><div class="l">Minutes</div></div>
      <div class="stat"><div class="v num">${workoutSetCount(done)}</div><div class="l">Sets</div></div><div class="stat"><div class="v num" style="font-size:18px">${fmtVolume(workoutVolume(done), units)}</div><div class="l">Volume</div></div></div>
      ${done.prs.length ? html`<div class="card" style="margin-top:12px;border-color:rgba(255,207,92,.4)"><div class="eyebrow" style="color:var(--pr)">${icon('trophy', 'sm')} ${done.prs.length} personal record${done.prs.length > 1 ? 's' : ''}</div>
        ${done.prs.map((p) => html`<div class="row between tiny" style="margin-top:8px"><span>${exName(p.exerciseId)} · ${{ weight: 'Heaviest weight', e1rm: 'Est. 1RM', volume: 'Best set volume' }[p.kind]}</span><b>${p.kind === 'volume' ? fmtVolume(p.value, units) : fmtWeight(p.value, units)}</b></div>`)}</div>` : ''}
      <div class="col" style="margin-top:16px"><button class="btn block" data-s="tpl">${icon('note', 'sm')} Save as template</button><button class="btn primary block lg" data-s="done">Done</button></div>`, {
      label: 'Workout summary',
      onMount: (el) => el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-s]')?.dataset.s; if (!a) return;
        if (a === 'tpl') { setState((s) => { s.templates.push(templateFromWorkout(done)); }, { op: 'template.create' }); toast('Template saved'); }
        close();
      }),
      onClose: () => navigate('/home'),
    });
  };

  return {
    html: body(),
    mount(el) {
      root = el;
      el.addEventListener('input', onInput);
      el.addEventListener('change', onInput);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.set-in')) { e.preventDefault(); const ins = [...el.querySelectorAll('.set-in')]; ins[ins.indexOf(e.target) + 1]?.focus(); } });
      const off = delegate(el, {
        minimise: () => navigate(editing ? `/progress/workout/${w.id}` : '/home'),
        back: () => navigate('/train'),
        finish,
        discard: async () => { if (await confirmSheet('Discard workout?', 'All sets logged in this session will be lost.', 'Discard', { danger: true })) { endSession((s) => { s.active = null; }, 'workout.discard'); navigate('/train'); } },
        type: (b) => { const s = w.exercises[+b.dataset.i].sets[+b.dataset.j]; s.type = cycleSetType(s.type); haptic('light'); rerender(); commit(); },
        done: (b) => completeSet(+b.dataset.i, +b.dataset.j),
        'copy-prev': (b) => { const i = +b.dataset.i, j = +b.dataset.j; const p = previousFor(priorHistory, w.exercises[i].exerciseId)[j]; if (!p) return; Object.assign(w.exercises[i].sets[j], { weightKg: p.weightKg, reps: p.reps }); haptic('light'); rerender(); commit(); },
        'copy-all': (b) => { const i = +b.dataset.i; const prev = previousFor(priorHistory, w.exercises[i].exerciseId); w.exercises[i].sets = prev.map((p) => newSet(p)); haptic('light'); rerender(); commit(); },
        'add-set': (b) => { const it = w.exercises[+b.dataset.i]; it.sets.push(newSet({ weightKg: it.sets.at(-1)?.weightKg, reps: it.sets.at(-1)?.reps })); rerender(); commit(); },
        'dup-set': (b) => { const it = w.exercises[+b.dataset.i]; const last = it.sets.at(-1); it.sets.push({ ...newSet(last, last.type) }); haptic('light'); rerender(); commit(); },
        'ex-menu': (b) => exMenu(+b.dataset.i),
        'add-ex': async () => { const id = await pickExercise(); if (!id) return; addExercise(w, id, priorHistory); rerender(); commit('exercise.add'); setTimeout(() => el.querySelector(`[data-ex="${w.exercises.length - 1}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); },
        step: (b) => { const c = currentSet(); if (!c) return; const s = w.exercises[c.i].sets[c.j]; const d = +b.dataset.d; haptic('light');
          const before = w.exercises[c.i].sets[c.j - 1];
          if (b.dataset.f === 'w') s.weightKg = Math.max(0, (s.weightKg ?? before?.weightKg ?? 0) + (units === 'lb' ? fromDisplay(d, 'lb') : d));
          else s.reps = Math.max(0, (s.reps ?? before?.reps ?? 0) + d);
          rerender(); commit(); },
        'rest-adj': (b) => { w.rest.endsAt += +b.dataset.d * 1000; rerender(); commit(); },
        'rest-skip': () => { w.rest = null; rerender(); commit(); },
      });
      tick = setInterval(() => {
        const e = el.querySelector('[data-elapsed]'); if (e) e.textContent = fmtDuration((Date.now() - w.startedAt) / 1000);
        if (w.rest) {
          const left = (w.rest.endsAt - Date.now()) / 1000;
          const r = el.querySelector('[data-rest-left]'); if (r) r.textContent = fmtDuration(Math.max(0, left));
          if (left <= 0) { w.rest = null; haptic('warning'); toast('Rest complete — next set'); rerender(); commit(); }
        }
      }, 250);
      return () => { clearInterval(tick); off(); el.removeEventListener('input', onInput); el.removeEventListener('change', onInput); clearTimeout(commitTimer);
        if (!editing && !ended && getState().active) setState((s) => { s.active = structuredClone(w); }); };
    },
  };
}
