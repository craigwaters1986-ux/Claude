import { html, raw, icon, delegate, haptic, confirmSheet, toast } from '../ui/dom.js';
import { makeChart, bindCharts } from '../ui/charts.js';
import { workoutRow, emptyState, exName, muscleChips } from '../ui/widgets.js';
import { derived } from '../app.js';
import { getState, setState } from '../core/store.js';
import { bucketVolume, exerciseHistory, workoutVolume, workoutSetCount, weekStreak, muscleDistribution, recordsFor, e1rm, workingSets } from '../core/metrics.js';
import { EXERCISE_BY_ID } from '../core/exercises.js';
import { MUSCLES } from '../core/muscles.js';
import { fmtVolume, fmtWeight } from '../core/units.js';
import { rirOf } from '../core/recovery.js';

const DAY = 86400000;
const RANGES = { '7D': [7, 7], '30D': [30, 10], '90D': [90, 13], '1Y': [365, 12] };
let ui = { range: '30D', lift: null };

function label(t, range) {
  const d = new Date(t);
  if (range === '1Y') return d.toLocaleDateString(undefined, { month: 'short' });
  if (range === '7D') return d.toLocaleDateString(undefined, { weekday: 'narrow' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function render({ params, navigate }) {
  if (params[0] === 'workout') return workoutDetail(params[1], navigate);
  if (params[0] === 'history') return historyView(navigate);
  const { workouts, profile } = derived();
  const units = profile.units;
  const registry = {};
  const [days, buckets] = RANGES[ui.range];
  const now = Date.now();
  const inRange = workouts.filter((w) => w.startedAt > now - days * DAY);
  const prevRange = workouts.filter((w) => w.startedAt > now - 2 * days * DAY && w.startedAt <= now - days * DAY);
  const vol = inRange.reduce((a, w) => a + workoutVolume(w), 0), pvol = prevRange.reduce((a, w) => a + workoutVolume(w), 0);
  const sets = inRange.reduce((a, w) => a + workoutSetCount(w), 0), psets = prevRange.reduce((a, w) => a + workoutSetCount(w), 0);
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
  const delta = (d) => (d == null ? html`<span class="tiny dim">—</span>` : html`<span class="tiny delta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'}${Math.abs(d)}%</span>`);

  const vb = bucketVolume(workouts, { days, buckets, now });
  const volChart = makeChart(registry, 'bar', vb.map((b) => ({ x: label(b.start + (days / buckets) * DAY, ui.range), label: `${new Date(b.start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${new Date(b.start + (days / buckets) * DAY).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`, v: units === 'lb' ? b.volume / 0.45359237 : b.volume })), { fmt: (v) => `${Math.round(v).toLocaleString()} ${units}`, title: `Training volume, last ${ui.range}` });

  const liftIds = [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)))]
    .map((id) => ({ id, n: exerciseHistory(workouts, id).length })).filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).map((x) => x.id);
  const lift = ui.lift && liftIds.includes(ui.lift) ? ui.lift : liftIds[0];
  const lh = lift ? exerciseHistory(workouts, lift).filter((h) => h.date > now - Math.max(days, 30) * DAY && h.bestE1rm).reverse() : [];
  const liftChart = lh.length >= 2 ? makeChart(registry, 'line', lh.map((h) => ({ x: label(h.date, ui.range === '7D' ? '30D' : ui.range), label: new Date(h.date).toLocaleDateString(), v: units === 'lb' ? h.bestE1rm / 0.45359237 : h.bestE1rm })), { fmt: (v) => `${v.toFixed(1)} ${units}`, title: `${exName(lift)} estimated 1RM` }) : '';
  const liftChange = lh.length >= 2 ? pct(lh.at(-1).bestE1rm, lh[0].bestE1rm) : null;

  // PR board: best e1RM per lift
  const prs = liftIds.slice(0, 6).map((id) => { const r = recordsFor(workouts, id); return { id, ...r }; }).filter((r) => r.bestE1rm);

  // Consistency heatmap: last 12 weeks, Monday-first
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 7 * 11);
  const dayVol = {}; workouts.forEach((w) => { const k = new Date(w.startedAt).toDateString(); dayVol[k] = (dayVol[k] || 0) + workoutSetCount(w); });
  const cells = Array.from({ length: 84 }, (_, i) => { const d = new Date(start.getTime() + i * DAY); const v = dayVol[d.toDateString()] || 0; return { d, v, future: d.getTime() > now }; });

  const dist = muscleDistribution(workouts, { days, now });
  const distRows = MUSCLES.map((m) => ({ m, v: dist[m.id] || 0 })).sort((a, b) => b.v - a.v);
  const distMax = Math.max(1, ...distRows.map((r) => r.v));

  const out = html`
  <header class="topbar"><div><div class="eyebrow">Progress</div><h1 class="title-xl">Performance</h1></div>
    <button class="icon-btn" data-act="history" aria-label="Workout history">${icon('calendar')}</button></header>
  <div class="seg" role="tablist" aria-label="Time range">${Object.keys(RANGES).map((r) => html`<button role="tab" aria-selected="${ui.range === r}" data-act="range" data-r="${r}">${r}</button>`)}</div>

  ${!workouts.length ? html`<div class="card" style="margin-top:14px">${emptyState('chart', 'No data yet', 'Charts appear after your first logged workout.', html`<button class="btn sm primary" data-act="train">Start training</button>`)}</div>` : html`
  <div class="stagger">
  <div class="grid2" style="margin-top:14px">
    <div class="stat"><div class="row between"><span class="l" style="margin:0">Total lifted</span>${delta(pct(vol, pvol))}</div><div class="v num" style="font-size:20px;margin-top:4px">${fmtVolume(vol, units)}</div></div>
    <div class="stat"><div class="row between"><span class="l" style="margin:0">Workouts</span>${delta(pct(inRange.length, prevRange.length))}</div><div class="v num" style="margin-top:4px">${inRange.length}</div></div>
    <div class="stat"><div class="row between"><span class="l" style="margin:0">Hard sets</span>${delta(pct(sets, psets))}</div><div class="v num" style="margin-top:4px">${sets}</div></div>
    <div class="stat"><div class="row between"><span class="l" style="margin:0">Streak</span><span class="tiny dim">weeks</span></div><div class="v num" style="margin-top:4px">${weekStreak(workouts)} ${icon('flame', 'sm')}</div></div>
  </div>
  <p class="tiny dim" style="margin:8px 2px 0">Compared with the previous ${ui.range === '1Y' ? 'year' : `${days} days`}.</p>

  <div class="section-h"><h2>Training volume</h2><span class="tiny dim">tap bars</span></div>
  <div class="card">${raw(volChart)}</div>

  <div class="section-h"><h2>Strength</h2>${liftChange != null ? html`<span class="tiny delta ${liftChange >= 0 ? 'up' : 'down'}">${liftChange >= 0 ? '+' : ''}${liftChange}% e1RM</span>` : ''}</div>
  <div class="card">
    ${liftIds.length ? html`<select class="input" data-lift aria-label="Exercise">${liftIds.map((id) => html`<option value="${id}" ${id === lift ? 'selected' : ''}>${exName(id)}</option>`)}</select>
    <div style="margin-top:12px">${liftChart ? raw(liftChart) : html`<div class="empty tiny">Not enough sessions in this range.</div>`}</div>
    <div class="tiny dim" style="margin-top:6px">Estimated one-rep max (Epley formula, adjusted for reps in reserve). An estimate — not a tested max.</div>`
    : html`<div class="empty tiny">Log an exercise twice to see its progression.</div>`}
  </div>

  <div class="section-h"><h2>Personal records</h2></div>
  <div class="card" style="padding:4px 14px">${prs.map((r) => html`<div class="list-item"><div class="avatar" style="color:var(--pr)">${icon('trophy', 'sm')}</div>
    <div style="flex:1"><b style="font-size:15px">${exName(r.id)}</b><div class="tiny dim">Heaviest ${fmtWeight(r.maxWeight, units)} · best set ${fmtVolume(r.bestSetVolume, units)}</div></div>
    <div style="text-align:right"><b class="num">${fmtWeight(r.bestE1rm, units)}</b><div class="xtiny dim">est. 1RM</div></div></div>`)}</div>

  <div class="section-h"><h2>Consistency</h2><span class="tiny dim">12 weeks</span></div>
  <div class="card"><div class="row tiny dim" style="justify-content:space-between;margin-bottom:6px">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => html`<span style="flex:1;text-align:center">${d}</span>`)}</div>
    <div class="heat" role="img" aria-label="Workout calendar for the last 12 weeks: ${cells.filter((c) => c.v).length} training days">${cells.map((c) => html`<div title="${c.d.toDateString()}${c.v ? ` · ${c.v} sets` : ''}" style="${c.future ? 'opacity:.25' : ''}${c.v ? `;background:${c.v > 18 ? '#5ce1ff' : c.v > 12 ? '#2f8cff' : '#1d5b95'};box-shadow:0 0 8px rgba(47,140,255,.4)` : ''}"></div>`)}</div>
    <div class="legend" style="margin-top:10px"><span><i class="dot" style="background:#1d5b95"></i>≤12 sets</span><span><i class="dot" style="background:#2f8cff"></i>13–18</span><span><i class="dot" style="background:#5ce1ff"></i>19+</span></div></div>

  <div class="section-h"><h2>Muscle distribution</h2><span class="tiny dim">sets · ${ui.range}</span></div>
  <div class="card">${distRows.map((r) => html`<div class="row" style="margin:7px 0"><span class="tiny" style="width:92px">${r.m.name}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${(r.v / distMax) * 100}%;background:#2f8cff;color:#2f8cff"></div></div><b class="tiny num" style="width:34px;text-align:right">${+r.v.toFixed(1)}</b></div>`)}</div>

  <div class="section-h"><h2>History</h2><button class="link" data-act="history">All →</button></div>
  <div class="card" style="padding:4px 14px">${[...inRange].reverse().slice(0, 4).map((w) => workoutRow(w, units))}</div>
  </div>`}`;

  return {
    html: out,
    mount(el) {
      bindCharts(el, registry);
      el.querySelector('[data-lift]')?.addEventListener('change', (e) => { ui.lift = e.target.value; navigate('/progress'); });
      return delegate(el, {
        range: (b) => { ui.range = b.dataset.r; haptic('light'); navigate('/progress'); },
        history: () => navigate('/progress/history'),
        train: () => navigate('/train'),
        'open-workout': (b) => navigate(`/progress/workout/${b.dataset.id}`),
      });
    },
  };
}

function historyView(navigate) {
  const { workouts, profile } = derived();
  const byMonth = {};
  [...workouts].reverse().forEach((w) => { const k = new Date(w.startedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); (byMonth[k] ||= []).push(w); });
  return {
    html: html`<header class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('chevL')}</button><h1 class="title-m">Workout history</h1><span style="width:44px"></span></header>
      ${Object.keys(byMonth).length ? Object.entries(byMonth).map(([m, ws]) => html`<div class="section-h"><h2>${m}</h2><span class="tiny dim">${ws.length} workouts</span></div><div class="card" style="padding:4px 14px">${ws.map((w) => workoutRow(w, profile.units))}</div>`)
      : html`<div class="card">${emptyState('calendar', 'No history yet', 'Completed workouts are listed here.')}</div>`}`,
    mount: (el) => delegate(el, { back: () => navigate('/progress'), 'open-workout': (b) => navigate(`/progress/workout/${b.dataset.id}`) }),
  };
}

function workoutDetail(id, navigate) {
  const s = getState();
  const { profile } = derived();
  const w = s.workouts.find((x) => x.id === id);
  if (!w) return { html: html`<div class="empty" style="margin-top:100px">Workout not found. <a class="link" href="#/progress">Back</a></div>` };
  const units = profile.units;
  const mins = w.endedAt ? Math.round((w.endedAt - w.startedAt) / 60000) : 0;
  return {
    html: html`<header class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('chevL')}</button>
      <div style="text-align:center"><h1 class="title-m">${w.name}</h1><div class="tiny dim">${new Date(w.startedAt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>
      <button class="icon-btn" data-act="edit" aria-label="Edit workout">${icon('edit')}</button></header>
      <div class="grid3"><div class="stat"><div class="v num">${mins}</div><div class="l">Minutes</div></div><div class="stat"><div class="v num">${workoutSetCount(w)}</div><div class="l">Sets</div></div><div class="stat"><div class="v num" style="font-size:18px">${fmtVolume(workoutVolume(w), units)}</div><div class="l">Volume</div></div></div>
      ${w.sample ? html`<div class="banner" style="margin-top:12px">${icon('info', 'sm')} Sample data</div>` : ''}
      ${(w.prs || []).length ? html`<div class="card" style="margin-top:12px;border-color:rgba(255,207,92,.4)"><div class="eyebrow" style="color:var(--pr)">${icon('trophy', 'sm')} Personal records</div>${w.prs.map((p) => html`<div class="row between tiny" style="margin-top:8px"><span>${exName(p.exerciseId)} · ${{ weight: 'Heaviest', e1rm: 'Est. 1RM', volume: 'Set volume' }[p.kind]}</span><b>${p.kind === 'volume' ? fmtVolume(p.value, units) : fmtWeight(p.value, units)}</b></div>`)}</div>` : ''}
      ${w.exercises.map((it) => { const ex = EXERCISE_BY_ID[it.exerciseId]; let n = 0; return html`<div class="card" style="margin-top:12px"><b>${ex?.name || 'Exercise'}</b><div style="margin:6px 0 8px">${muscleChips(ex)}</div>
        ${it.sets.map((st) => { const lbl = st.type === 'warmup' ? 'W' : st.type === 'drop' ? 'D' : st.type === 'failure' ? 'F' : String(++n); const est = e1rm(st.weightKg, st.reps, rirOf(st) ?? 0);
          return html`<div class="row between tiny num" style="padding:5px 0;border-bottom:1px solid var(--hairline)"><span class="dim" style="width:24px">${lbl}</span><span style="flex:1">${fmtWeight(st.weightKg, units)} × ${st.reps}</span><span class="dim">${st.rpe ? `RPE ${st.rpe}` : ''}</span><span class="dim" style="width:90px;text-align:right">${est && st.type !== 'warmup' ? `e1RM ${fmtWeight(est, units, { unit: false })}` : ''}</span></div>`; })}
        ${it.notes ? html`<p class="tiny muted">${it.notes}</p>` : ''}<div class="tiny dim" style="margin-top:6px">${workingSets(it).length} working sets</div></div>`; })}
      ${w.notes ? html`<div class="card" style="margin-top:12px"><div class="eyebrow">Notes</div><p class="tiny muted">${w.notes}</p></div>` : ''}
      <button class="btn block danger" data-act="delete" style="margin-top:16px">${icon('trash', 'sm')} Delete workout</button>`,
    mount: (el) => delegate(el, {
      back: () => history.length > 1 ? history.back() : navigate('/progress'),
      edit: () => navigate(`/workout/edit/${w.id}`),
      delete: async () => { if (await confirmSheet('Delete this workout?', 'This permanently removes it and updates your recovery and progress.', 'Delete', { danger: true })) { setState((st) => { st.workouts = st.workouts.filter((x) => x.id !== w.id); }, { op: 'workout.delete' }); toast('Workout deleted'); navigate('/progress'); } },
    }),
  };
}

