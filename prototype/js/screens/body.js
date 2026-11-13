import { html, raw, icon, delegate, haptic, toast } from '../ui/dom.js';
import { ring, animateRings, makeChart, bindCharts } from '../ui/charts.js';
import { recoveryRow, SIM } from '../ui/widgets.js';
import { createMannequin, webglAvailable } from '../ui/mannequin.js';
import { derived } from '../app.js';
import { getState, setState } from '../core/store.js';
import { STATUS_META, adaptFromFeedback, recoveryTrend, FEEL_PCT } from '../core/recovery.js';
import { MUSCLES, MUSCLE_BY_ID, MUSCLE_GROUPS, GROUP_LABELS } from '../core/muscles.js';
import { EXERCISES, EXERCISE_BY_ID } from '../core/exercises.js';
import { relDay } from '../core/units.js';

export const selfManaged = true;

let ui = { tab: 'anatomy', mode: 'recovery', exercise: 'bench', selected: null, side: 'front', model: 'builtin', customUrl: null, report: null, modelError: null };
const ANATOMICAL_URL = 'models/bodyparts3d-muscles.gltf.json';

// Sequential single-hue ramp (dark → bright cyan) for weekly-volume mode.
const VOL_RAMP = ['#1a2335', '#183a63', '#1d5b95', '#2f8cff', '#5cb8ff', '#8fe6ff'];
const volColor = (sets) => VOL_RAMP[Math.min(VOL_RAMP.length - 1, Math.ceil(sets / 4))];

function colorsFor(mode, recovery, exerciseId) {
  const out = {};
  for (const m of recovery.muscles) {
    if (mode === 'recovery') out[m.id] = STATUS_META[m.status].hex;
    else if (mode === 'volume') out[m.id] = volColor(m.weeklySets);
    else {
      const ex = EXERCISE_BY_ID[exerciseId];
      out[m.id] = ex?.primary.includes(m.id) ? '#5ce1ff' : ex?.secondary.includes(m.id) ? '#8b7bff' : '#1f2738';
    }
  }
  return out;
}

function callout(m, recovery) {
  if (!m) return html`<div class="card" style="text-align:center"><div class="tiny muted">${icon('info', 'sm')} Tap a muscle on the model for its recovery details.</div></div>`;
  const r = recovery.byId[m];
  const meta = STATUS_META[r.status];
  const lastH = r.lastTrained ? Math.round((Date.now() - r.lastTrained) / 3600000) : null;
  return html`<section class="card glow muscle-callout" aria-live="polite">
    <div class="row between top"><div><div class="eyebrow">${MUSCLE_BY_ID[m].name}</div>
      <div class="row" style="gap:10px;margin-top:6px;align-items:baseline"><span class="pct num" style="color:${meta.hex};text-shadow:0 0 24px ${meta.hex}66">${r.pct}%</span><span class="muted">recovered</span></div>
      <span class="badge" style="margin-top:6px;color:${meta.hex}">${meta.label}</span></div>
      <button class="icon-btn sm" data-act="deselect" aria-label="Close details">${icon('x', 'sm')}</button></div>
    <div class="kv" style="margin-top:14px">
      <div><span>Est. ready (≥90%)</span><b class="num">${r.hoursToReady ? `${r.hoursToReady} h` : 'Now'}</b></div>
      <div><span>Est. full (≥95%)</span><b class="num">${r.hoursToFull ? `${r.hoursToFull} h` : 'Now'}</b></div>
      <div><span>Last trained</span><b>${r.lastTrained ? relDay(r.lastTrained) : 'Not logged'}</b>${lastH != null && lastH < 72 ? html`<span style="text-transform:none">${lastH} h ago</span>` : ''}</div>
      <div><span>Weekly sets</span><b class="num">${r.weeklySets}</b></div>
    </div>
    <div class="suggest" style="margin-top:12px">${icon('spark', 'sm')}<span><b style="color:var(--text-0)">Recommended:</b> ${r.recommendation}</span></div>
    <div class="eyebrow" style="margin-top:14px">How does it feel? <span style="text-transform:none;letter-spacing:0;font-weight:500">— tunes your personal model</span></div>
    <div class="grid4" style="margin-top:8px">${Object.keys(FEEL_PCT).map((f) => html`<button class="chip" style="justify-content:center;padding:0 6px" data-act="feel" data-f="${f}">${{ fresh: 'Fresh', ok: 'OK', sore: 'Sore', verySore: 'Very sore' }[f]}</button>`)}</div>
    <div class="disclaimer" style="margin-top:12px">${icon('info', 'sm')}<span>Estimate, not a physiological measurement. Model confidence: <b>${r.confidence}</b> · recovery time constant ≈ ${r.tauHours} h.</span></div>
  </section>`;
}

function modelNote() {
  if (ui.modelError) return html`<span style="color:var(--danger)">${ui.modelError}</span>`;
  if (ui.model === 'anatomical') return html`Muscle meshes from <b>BodyParts3D</b> © DBCLS (CC BY / CC BY-SA, see attribution). Abs and lats are approximate — the dataset has no meshes for them.`;
  if (ui.model === 'custom' && ui.report) return html`Your model: ${ui.report.found.length} of 18 muscle groups found${ui.report.missing.length ? html` · missing ${ui.report.missing.join(', ')}` : ''}. Mesh names are matched to anatomical terms.`;
  if (ui.model === 'custom') return html`Choose a .glb whose meshes use anatomical names (e.g. “Pectoralis_Major.L”) or Forma ids.`;
  return html`Stylised muscle-group model for training guidance — not anatomically exact.`;
}

export function render({ navigate }) {
  const { recovery, health, workouts, profile } = derived();
  const gl = webglAvailable();
  let mq = null; let root = null;
  const registry = {};

  const anatomy = () => html`
    <div class="seg" role="tablist" aria-label="Colour mode" style="margin-top:4px">
      ${[['recovery', 'Recovery'], ['volume', 'Volume'], ['exercise', 'Exercise']].map(([k, l]) => html`<button role="tab" aria-selected="${ui.mode === k}" data-act="mode" data-m="${k}">${l}</button>`)}</div>
    ${ui.mode === 'exercise' ? html`<select class="input" style="margin-top:10px" data-ex-select aria-label="Exercise to highlight">${EXERCISES.map((e) => html`<option value="${e.id}" ${e.id === ui.exercise ? 'selected' : ''}>${e.name}</option>`)}</select>` : ''}
    <div class="body-stage" data-stage>
      ${gl ? '' : html`<div class="empty" style="padding-top:120px">${icon('body')}<div class="title-m">3D view unavailable</div><p class="tiny">WebGL isn't available on this device. Use the muscle list below.</p></div>`}
      <div class="floor"></div>
      <div class="overlay" style="top:12px"><div class="seg" style="width:150px"><button aria-pressed="${ui.side === 'front'}" data-act="side" data-s="front">Front</button><button aria-pressed="${ui.side === 'back'}" data-act="side" data-s="back">Rear</button></div>
        <div class="row" style="gap:6px"><button class="icon-btn sm" data-act="zoom" data-z="0.8" aria-label="Zoom in">${icon('plus', 'sm')}</button><button class="icon-btn sm" data-act="zoom" data-z="1.25" aria-label="Zoom out">${icon('minus', 'sm')}</button><button class="icon-btn sm" data-act="reset" aria-label="Reset view">${icon('rotate', 'sm')}</button></div></div>
      <div class="overlay" style="bottom:10px;justify-content:center"><span class="tiny dim">Drag to rotate 360° · pinch to zoom · tap a muscle</span></div>
    </div>
    <div class="legend" style="margin:-4px 0 12px">${ui.mode === 'recovery' ? Object.entries({ ready: '90–100%', light: '70–89%', caution: '40–69%', fatigued: '0–39%' }).map(([k, r]) => html`<span><i class="dot" style="background:${STATUS_META[k].hex}"></i>${r}</span>`)
      : ui.mode === 'volume' ? html`<span>Sets / 7 days:</span>${VOL_RAMP.map((c, i) => html`<span><i class="dot" style="background:${c}"></i>${i === 0 ? '0' : i === VOL_RAMP.length - 1 ? `${i * 4 - 3}+` : `${i * 4 - 3}–${i * 4}`}</span>`)}`
      : html`<span><i class="dot" style="background:#5ce1ff"></i>Primary</span><span><i class="dot" style="background:#8b7bff"></i>Secondary</span>`}</div>
    <div class="seg" role="tablist" aria-label="3D model" style="margin:0 0 6px">
      <button role="tab" aria-selected="${ui.model === 'builtin'}" data-act="model" data-v="builtin">Stylised</button>
      <button role="tab" aria-selected="${ui.model === 'anatomical'}" data-act="model" data-v="anatomical">Anatomical</button>
      <button role="tab" aria-selected="${ui.model === 'custom'}" data-act="model" data-v="custom">Your model…</button></div>
    <input type="file" accept=".glb,model/gltf-binary" data-model-file hidden aria-label="Load a .glb anatomy model">
    <p class="tiny dim" style="text-align:center;margin:4px 0 10px;line-height:1.5" data-model-note>${modelNote()}</p>
    <div data-callout>${callout(ui.selected, recovery)}</div>
    <div class="section-h"><h2>All muscles</h2><span class="tiny dim">sorted by readiness</span></div>
    <div class="card" style="padding:2px 14px">${[...recovery.muscles].sort((a, b) => a.pct - b.pct).map((m) => recoveryRow(m))}</div>`;

  const dashboard = () => {
    const trend = recoveryTrend(workouts, 14, Date.now(), { health, personal: getState().personal });
    const trendChart = makeChart(registry, 'line', trend.map((p) => ({ x: new Date(p.t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), v: p.overall })), { fmt: (v) => `${v}%`, height: 140, yMin: 0, title: 'Overall estimated recovery, 14 days' });
    const DAY = 86400000;
    const freq = Object.entries(MUSCLE_GROUPS).map(([g, ms]) => {
      const days = new Set(workouts.filter((w) => w.startedAt > Date.now() - 28 * DAY && w.exercises.some((e) => EXERCISE_BY_ID[e.exerciseId]?.primary.some((m) => ms.includes(m)))).map((w) => new Date(w.startedAt).toDateString()));
      return { g, perWeek: days.size / 4 };
    });
    const ready = recovery.muscles.filter((m) => m.status === 'ready').length;
    const load = [...recovery.muscles].sort((a, b) => b.weeklySets - a.weeklySets).slice(0, 5);
    return html`
    <section class="card glow"><div class="row" style="gap:18px">${raw(ring(recovery.overall, { size: 132, stroke: 12 }))}
      <div class="col" style="flex:1"><div class="eyebrow">Overall estimated recovery</div><div class="title-m">${ready} of ${MUSCLES.length} muscle groups ready</div>
      <div class="tiny muted" style="line-height:1.45">${recovery.overall >= 80 ? 'Good readiness — train your freshest groups hard.' : recovery.overall >= 60 ? 'Moderate readiness — pick ready muscles and keep a rep or two in reserve.' : 'Low readiness — favour rest, mobility or light work.'}</div></div></div></section>

    <section class="card"><div class="row between"><b>Recovery signals</b>${health ? (health.source === 'simulated' ? SIM('Simulated Health data') : html`<span class="badge live">Apple Health</span>`) : html`<span class="badge">Not connected</span>`}</div>
      ${health ? html`<div class="grid3" style="margin-top:12px">
        <div class="stat"><div class="v num">${health.sleepHours.toFixed(1)}<span class="tiny dim">h</span></div><div class="l">Sleep</div></div>
        <div class="stat"><div class="v num">${health.hrv}<span class="tiny dim">ms</span></div><div class="l">HRV</div></div>
        <div class="stat"><div class="v num">${health.restingHr}<span class="tiny dim">bpm</span></div><div class="l">Resting HR</div></div></div>
        <div class="tiny muted" style="margin-top:10px">${recovery.health.reasons.length ? `Adjusting recovery ×${recovery.health.factor.toFixed(2)}: ${recovery.health.reasons.join('; ')}.` : 'No adjustment today — signals are within your normal range.'}</div>`
      : html`<p class="tiny muted">Connect Apple Health (optional) to let sleep, resting heart rate and HRV nudge your estimates. <a class="link" href="#/profile">Connect →</a></p>`}
      <div class="disclaimer" style="margin-top:10px">${icon('info', 'sm')}<span>Sleep, HRV and resting HR vary day to day for many reasons. They only adjust recovery speed by up to 30%, and are not used to diagnose anything.</span></div></section>

    <div class="section-h"><h2>Recovery trend</h2><span class="tiny dim">14 days</span></div>
    <div class="card">${raw(trendChart)}</div>

    <div class="section-h"><h2>Recent training load</h2><span class="tiny dim">hard sets · 7 days</span></div>
    <div class="card">${load.map((m) => html`<div class="row" style="margin:6px 0"><span class="tiny" style="width:92px">${m.name}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${Math.min(100, m.weeklySets / 20 * 100)}%;background:#2f8cff;color:#2f8cff"></div></div><b class="tiny num" style="width:34px;text-align:right">${m.weeklySets}</b></div>`)}
      <div class="tiny dim" style="margin-top:6px">Secondary muscles count as half a set.</div></div>

    <div class="section-h"><h2>Weekly frequency</h2><span class="tiny dim">avg · last 4 weeks</span></div>
    <div class="grid3">${freq.map((f) => html`<div class="stat"><div class="v num">${f.perWeek.toFixed(1)}<span class="tiny dim">×</span></div><div class="l">${GROUP_LABELS[f.g]}</div></div>`)}</div>

    <div class="section-h"><h2>Time until ready</h2></div>
    <div class="card" style="padding:2px 14px">${(() => { const rows = recovery.muscles.filter((m) => m.hoursToReady > 0).sort((a, b) => b.hoursToReady - a.hoursToReady); return rows.length ? rows.map((m) => recoveryRow(m)) : html`<div class="empty tiny">Every muscle group is estimated ready.</div>`; })()}</div>

    <div class="card" style="margin-top:16px"><b>How the estimate works</b><p class="tiny muted" style="line-height:1.55">Each hard set adds fatigue to the muscles it trains (secondary muscles count ~45%), scaled by effort (RPE / reps in reserve). Fatigue fades exponentially — faster for small muscles like calves and biceps, slower for hamstrings and lower back. Optional sleep/HRV data and your “how does it feel?” feedback adjust the speed. Think of it as a fuel gauge, not a lab test.</p></div>`;
  };

  const body = () => html`
    <header class="topbar"><div><div class="eyebrow">Body</div><h1 class="title-xl">Muscle map</h1></div>
      <span class="badge">${icon('info', 'sm')} Estimates</span></header>
    <div class="seg" role="tablist" aria-label="Body view">
      <button role="tab" aria-selected="${ui.tab === 'anatomy'}" data-act="tab" data-t="anatomy">Anatomy</button>
      <button role="tab" aria-selected="${ui.tab === 'dashboard'}" data-act="tab" data-t="dashboard">Recovery dashboard</button></div>
    <div style="margin-top:12px">${ui.tab === 'anatomy' ? anatomy() : dashboard()}</div>`;

  const mountGl = () => {
    mq?.dispose(); mq = null;
    const stage = root.querySelector('[data-stage]');
    if (!stage || !gl) return;
    try {
      mq = createMannequin(stage, { onSelect: (id) => { ui.selected = id; if (id) haptic('light'); root.querySelector('[data-callout]').innerHTML = String(callout(id, recovery)); } });
      mq.setColors(colorsFor(ui.mode, recovery, ui.exercise));
      mq.select(ui.selected);
      if (ui.side === 'back') mq.view('back');
      const url = ui.model === 'anatomical' ? ANATOMICAL_URL : ui.model === 'custom' ? ui.customUrl : null;
      if (url) {
        stage.dataset.loading = '1';
        mq.loadModel(url).then((r) => { ui.report = r; ui.modelError = null; })
          .catch(() => { ui.modelError = 'Could not load that model — showing the stylised one.'; mq?.useBuiltIn(); })
          .finally(() => { delete stage.dataset.loading; const n = root.querySelector('[data-model-note]'); if (n) n.innerHTML = String(modelNote()); });
      }
    } catch (e) { stage.insertAdjacentHTML('afterbegin', `<div class="banner err">3D view failed to start: ${String(e.message).replace(/</g, '&lt;')}</div>`); }
  };

  const rerender = () => { const y = root.scrollTop; root.innerHTML = String(body()); root.scrollTop = y; if (ui.tab === 'anatomy') mountGl(); else { animateRings(root); bindCharts(root, registry); } };

  return {
    html: body(),
    mount(el) {
      root = el;
      if (ui.tab === 'anatomy') mountGl(); else { animateRings(el); bindCharts(el, registry); }
      el.addEventListener('change', (e) => {
        if (!e.target.matches('[data-model-file]') || !e.target.files?.[0]) return;
        if (ui.customUrl) URL.revokeObjectURL(ui.customUrl);
        ui.customUrl = URL.createObjectURL(e.target.files[0]); ui.model = 'custom'; ui.report = null; ui.modelError = null; rerender();
      });
      el.addEventListener('change', (e) => { if (e.target.matches('[data-ex-select]')) { ui.exercise = e.target.value; mq?.setColors(colorsFor(ui.mode, recovery, ui.exercise)); } });
      const off = delegate(el, {
        tab: (b) => { ui.tab = b.dataset.t; haptic('light'); rerender(); },
        mode: (b) => { ui.mode = b.dataset.m; haptic('light'); rerender(); },
        model: (b) => {
          if (b.dataset.v === 'custom' && !ui.customUrl) { el.querySelector('[data-model-file]').click(); return; }
          ui.model = b.dataset.v; ui.modelError = null; ui.report = null; haptic('light'); rerender();
        },
        side: (b) => { ui.side = b.dataset.s; mq?.view(ui.side); el.querySelectorAll('[data-act="side"]').forEach((x) => x.setAttribute('aria-selected', x.dataset.s === ui.side)); haptic('light'); },
        zoom: (b) => mq?.zoom(+b.dataset.z),
        reset: () => { mq?.reset(); ui.side = 'front'; el.querySelectorAll('[data-act="side"]').forEach((x) => x.setAttribute('aria-selected', x.dataset.s === 'front')); },
        deselect: () => { ui.selected = null; mq?.select(null); el.querySelector('[data-callout]').innerHTML = String(callout(null, recovery)); },
        muscle: (b) => {
          ui.selected = b.dataset.id;
          if (ui.tab !== 'anatomy') { ui.tab = 'anatomy'; rerender(); }
          else { mq?.select(ui.selected); el.querySelector('[data-callout]').innerHTML = String(callout(ui.selected, recovery)); }
          const v = MUSCLE_BY_ID[ui.selected].view; if (v !== 'both' && v !== ui.side) { ui.side = v; mq?.view(v); }
          el.querySelector('[data-callout]').scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        feel: (b) => {
          const m = ui.selected; const r = recovery.byId[m];
          setState((s) => { s.personal = adaptFromFeedback(s.personal, m, r.pct, b.dataset.f); }, { op: 'recovery.feedback' });
          toast(`Thanks — ${MUSCLE_BY_ID[m].name} model updated`); haptic('success');
          setTimeout(() => navigate('/body'), 400);
        },
      });
      return () => { off(); mq?.dispose(); };
    },
  };
}
