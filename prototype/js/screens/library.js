import { html, raw, icon, delegate, openSheet, toast, haptic } from '../ui/dom.js';
import { exerciseRow, muscleChips, emptyState } from '../ui/widgets.js';
import { lineChart } from '../ui/charts.js';
import { derived } from '../app.js';
import { getState, setState, registerCustomExercise, uid } from '../core/store.js';
import { EXERCISES, EXERCISE_BY_ID, EQUIPMENT, searchExercises, alternativesFor } from '../core/exercises.js';
import { MUSCLES, MUSCLE_GROUPS, GROUP_LABELS } from '../core/muscles.js';
import { exerciseHistory } from '../core/metrics.js';
import { fmtWeight } from '../core/units.js';

const filterList = (q, group) => {
  let list = searchExercises(q, EXERCISES);
  if (group) list = list.filter((e) => e.primary.some((m) => MUSCLE_GROUPS[group].includes(m)));
  return list;
};

const listHtml = (list) => raw(list.length ? list.map((e) => exerciseRow(e)).join('') : String(emptyState('search', 'No matches', 'Try another name, or create a custom exercise.', html`<button class="btn sm" data-act="custom">${icon('plus', 'sm')} Create custom</button>`)));

const filters = (group) => html`<div class="chips" style="flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;margin-top:10px">
  <button class="chip" data-act="group" data-g="" aria-pressed="${!group}">All</button>
  ${Object.entries(GROUP_LABELS).map(([g, l]) => html`<button class="chip" data-act="group" data-g="${g}" aria-pressed="${group === g}">${l}</button>`)}</div>`;

export function render({ navigate }) {
  let q = ''; let group = '';
  const out = html`
    <header class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('chevL')}</button><h1 class="title-m">Exercise library</h1>
      <button class="icon-btn" data-act="custom" aria-label="Create custom exercise">${icon('plus')}</button></header>
    <div class="search">${icon('search')}<input class="input" type="search" placeholder="Search ${EXERCISES.length} exercises" aria-label="Search exercises" data-search></div>
    <div data-filters>${filters(group)}</div>
    <div class="card" style="padding:2px 14px;margin-top:12px" data-list>${listHtml(filterList(q, group))}</div>
    <p class="tiny dim" style="text-align:center;margin-top:12px">${icon('watch', 'sm')} = initial Apple Watch rep-counting target</p>`;
  return {
    html: out,
    mount(el) {
      const refresh = () => { el.querySelector('[data-list]').innerHTML = String(listHtml(filterList(q, group))); el.querySelector('[data-filters]').innerHTML = String(filters(group)); };
      el.querySelector('[data-search]').addEventListener('input', (e) => { q = e.target.value; refresh(); });
      return delegate(el, {
        back: () => history.length > 1 ? history.back() : navigate('/train'),
        group: (b) => { group = b.dataset.g; haptic('light'); refresh(); },
        exercise: (b) => exerciseDetail(b.dataset.id),
        custom: () => createCustom(),
      });
    },
  };
}

/** Bottom-sheet exercise picker. Resolves to an exercise id or null. */
export function pickExercise() {
  return new Promise((resolve) => {
    let q = ''; let group = ''; let picked = null;
    const recentIds = [...new Set([...derived().workouts].reverse().flatMap((w) => w.exercises.map((e) => e.exerciseId)))].slice(0, 5);
    openSheet(html`<div class="row between"><h3 class="title-l">Add exercise</h3><button class="btn sm" data-p="custom">${icon('plus', 'sm')} Custom</button></div>
      <div class="search" style="margin-top:12px">${icon('search')}<input class="input" type="search" placeholder="Search exercises" aria-label="Search exercises" data-search></div>
      <div data-filters>${filters(group)}</div>
      ${recentIds.length ? html`<div class="eyebrow" style="margin-top:12px">Recent</div><div class="chips" style="margin-top:6px">${recentIds.map((id) => html`<button class="chip" data-act="exercise" data-id="${id}">${EXERCISE_BY_ID[id]?.name}</button>`)}</div>` : ''}
      <div class="list" style="margin-top:8px" data-list>${listHtml(filterList(q, group))}</div>`, {
      label: 'Add exercise',
      onMount: (el, close) => {
        const refresh = () => { el.querySelector('[data-list]').innerHTML = String(listHtml(filterList(q, group))); el.querySelector('[data-filters]').innerHTML = String(filters(group)); };
        el.querySelector('[data-search]').addEventListener('input', (e) => { q = e.target.value; refresh(); });
        delegate(el, {
          group: (b) => { group = b.dataset.g; refresh(); },
          exercise: (b) => { picked = b.dataset.id; haptic('light'); close(); },
          custom: () => { picked = '__custom'; close(); createCustom().then(resolve); },
        });
        el.querySelector('[data-p="custom"]').addEventListener('click', () => { picked = '__custom'; close(); createCustom().then(resolve); });
      },
      onClose: () => { if (picked !== '__custom') resolve(picked); },
    });
  });
}

export function exerciseDetail(id) {
  const ex = EXERCISE_BY_ID[id]; if (!ex) return;
  const { workouts, profile } = derived();
  const s = getState();
  const hist = exerciseHistory(workouts, id).reverse();
  const alts = alternativesFor(ex, { available: profile.equipment }).slice(0, 4);
  const liked = s.likes.includes(id), disliked = s.dislikes.includes(id);
  const watchText = { supported: 'Initial rep-counting target (prototype algorithm, unvalidated on hardware).', experimental: 'Wrist moves enough to try; accuracy not yet validated.', unsupported: 'Wrist is mostly stationary — log reps manually.' }[ex.watch];
  openSheet(html`<div class="row between top"><div><h3 class="title-l">${ex.name}</h3><div class="tiny dim" style="margin-top:4px">${ex.mechanics === 'compound' ? 'Compound' : 'Isolation'} · ${ex.equipment.length ? ex.equipment.map((e) => EQUIPMENT.find((x) => x.id === e)?.label || e).join(', ') : 'Bodyweight'}</div></div>
      <button class="icon-btn sm" data-close aria-label="Close">${icon('x', 'sm')}</button></div>
    <div style="margin-top:12px">${muscleChips(ex)}</div>
    <div class="eyebrow" style="margin-top:16px">How to</div>
    <ol class="tiny muted" style="padding-left:18px;line-height:1.6;margin:6px 0 0">${ex.instructions.map((t) => html`<li>${t}</li>`)}</ol>
    <div class="eyebrow" style="margin-top:16px">Estimated 1RM history</div>
    <div style="margin-top:8px">${hist.length >= 2 ? raw(lineChart(hist.map((h) => ({ x: new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), v: h.bestE1rm || h.topWeight })), { fmt: (v) => fmtWeight(v, profile.units), height: 130, title: `${ex.name} estimated 1RM` })) : html`<div class="tiny dim">${hist.length ? `1 session logged — best set ${fmtWeight(hist[0].topWeight, profile.units)}.` : 'Not logged yet.'}</div>`}</div>
    <div class="card" style="margin-top:14px;padding:12px"><div class="row">${icon('watch')}<div class="tiny"><b>Apple Watch:</b> <span class="muted">${watchText}</span></div></div></div>
    ${alts.length ? html`<div class="eyebrow" style="margin-top:16px">Alternatives</div><div class="chips" style="margin-top:8px">${alts.map((a) => html`<span class="chip">${a.name}</span>`)}</div>` : ''}
    <div class="row" style="margin-top:18px;gap:8px">
      <button class="btn" style="flex:1" data-pref="like" aria-pressed="${liked}">${liked ? '★ Preferred' : '☆ Prefer'}</button>
      <button class="btn" style="flex:1" data-pref="dislike" aria-pressed="${disliked}">${disliked ? 'Avoided' : 'Avoid in AI plans'}</button></div>`, {
    label: ex.name,
    onMount: (el, close) => el.addEventListener('click', (e) => {
      const p = e.target.closest('[data-pref]')?.dataset.pref; if (!p) return;
      setState((st) => {
        const key = p === 'like' ? 'likes' : 'dislikes'; const other = p === 'like' ? 'dislikes' : 'likes';
        st[key] = st[key].includes(id) ? st[key].filter((x) => x !== id) : [...st[key], id];
        st[other] = st[other].filter((x) => x !== id);
      }, { op: 'prefs.update' });
      toast(p === 'like' ? 'The AI generator will favour this exercise' : 'The AI generator will avoid this exercise');
      close();
    }),
  });
}

export function createCustom() {
  return new Promise((resolve) => {
    let made = null;
    const prim = new Set(), sec = new Set(), eq = new Set();
    openSheet(html`<h3 class="title-l">Custom exercise</h3>
      <label class="field" style="margin-top:12px">Name<input class="input" data-name maxlength="60" placeholder="e.g. Landmine Press"></label>
      <div class="eyebrow" style="margin-top:14px">Primary muscles</div><div class="chips" style="margin-top:6px">${MUSCLES.map((m) => html`<button class="chip" data-c="p" data-id="${m.id}" aria-pressed="false">${m.name}</button>`)}</div>
      <div class="eyebrow" style="margin-top:14px">Secondary muscles</div><div class="chips" style="margin-top:6px">${MUSCLES.map((m) => html`<button class="chip" data-c="s" data-id="${m.id}" aria-pressed="false">${m.name}</button>`)}</div>
      <div class="eyebrow" style="margin-top:14px">Equipment</div><div class="chips" style="margin-top:6px">${EQUIPMENT.map((e) => html`<button class="chip" data-c="e" data-id="${e.id}" aria-pressed="false">${e.label}</button>`)}</div>
      <div class="banner err" data-err hidden style="margin-top:12px"></div>
      <button class="btn primary block lg" data-save style="margin-top:16px">Create exercise</button>`, {
      label: 'Create custom exercise',
      onMount: (el, close) => {
        el.addEventListener('click', (e) => {
          const c = e.target.closest('[data-c]');
          if (c) { const set = { p: prim, s: sec, e: eq }[c.dataset.c]; const on = !set.has(c.dataset.id); on ? set.add(c.dataset.id) : set.delete(c.dataset.id); c.setAttribute('aria-pressed', on); return; }
          if (e.target.closest('[data-save]')) {
            const name = el.querySelector('[data-name]').value.trim();
            const err = el.querySelector('[data-err]');
            if (!name) { err.hidden = false; err.textContent = 'Give the exercise a name.'; return; }
            if (!prim.size) { err.hidden = false; err.textContent = 'Pick at least one primary muscle — it drives recovery tracking.'; return; }
            made = registerCustomExercise({ id: uid('cx_'), name, primary: [...prim], secondary: [...sec].filter((m) => !prim.has(m)), equipment: [...eq], mechanics: prim.size > 1 || sec.size ? 'compound' : 'isolation' });
            toast(`Created “${name}”`); close();
          }
        });
      },
      onClose: () => resolve(made?.id || null),
    });
  });
}

