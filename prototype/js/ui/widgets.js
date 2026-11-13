import { html, raw, icon } from './dom.js';
import { MUSCLE_BY_ID } from '../core/muscles.js';
import { EXERCISE_BY_ID } from '../core/exercises.js';
import { STATUS_META } from '../core/recovery.js';
import { workoutVolume, workoutSetCount } from '../core/metrics.js';
import { fmtVolume, relDay } from '../core/units.js';

export const SIM = (text = 'Simulated') => html`<span class="badge sim" title="This feature is simulated in the web prototype">${text}</span>`;

export function muscleChips(ex) {
  if (!ex) return '';
  return html`<div class="chips" style="gap:4px">${ex.primary.map((m) => html`<span class="muscle-chip">${MUSCLE_BY_ID[m]?.name}</span>`)}${ex.secondary.map((m) => html`<span class="muscle-chip sec">${MUSCLE_BY_ID[m]?.name}</span>`)}</div>`;
}

export function recoveryRow(m, { act = 'muscle' } = {}) {
  const meta = STATUS_META[m.status];
  return html`<div class="list-item tap" data-act="${act}" data-id="${m.id}">
    <span class="dot" style="background:${meta.hex};box-shadow:0 0 10px ${meta.hex}"></span>
    <div style="flex:1;min-width:0">
      <div class="row between"><b style="font-size:15px">${m.name}</b><b class="num" style="font-size:15px">${m.pct}%</b></div>
      <div class="bar-track" style="margin-top:6px"><div class="bar-fill" style="width:${m.pct}%;background:${meta.hex};color:${meta.hex}"></div></div>
      <div class="row between xtiny dim" style="margin-top:5px"><span>${meta.label}${m.hoursToReady ? ` · ready in ~${m.hoursToReady} h` : ''}</span><span>${m.weeklySets} sets / 7d</span></div>
    </div></div>`;
}

export function workoutRow(w, units, { act = 'open-workout' } = {}) {
  const prs = (w.prs || []).length;
  const mins = w.endedAt ? Math.round((w.endedAt - w.startedAt) / 60000) : 0;
  return html`<div class="list-item tap" data-act="${act}" data-id="${w.id}">
    <div class="avatar">${icon('train', 'sm')}</div>
    <div style="flex:1;min-width:0"><div class="row between"><b>${w.name}</b><span class="tiny dim">${relDay(w.startedAt)}</span></div>
    <div class="tiny dim" style="margin-top:3px">${mins} min · ${workoutSetCount(w)} sets · ${fmtVolume(workoutVolume(w), units)}${w.sample ? ' · sample' : ''}</div></div>
    ${prs ? html`<span class="badge pr">${icon('trophy', 'sm')} ${prs}</span>` : ''}
  </div>`;
}

export function exerciseRow(ex, { act = 'exercise', right = '' } = {}) {
  return html`<div class="list-item tap" data-act="${act}" data-id="${ex.id}">
    <div class="avatar">${icon(ex.mechanics === 'compound' ? 'layers' : 'bolt', 'sm')}</div>
    <div style="flex:1;min-width:0"><div class="row between"><b style="font-size:15px">${ex.name}</b>${ex.watch === 'supported' ? html`<span class="badge" title="Apple Watch rep counting target">${icon('watch', 'sm')}</span>` : ''}</div>
    <div style="margin-top:5px">${muscleChips(ex)}</div></div>${raw(String(right))}</div>`;
}

export function emptyState(ic, title, body, action = '') {
  return html`<div class="empty">${icon(ic)}<div class="title-m" style="color:var(--text-1)">${title}</div><p class="tiny" style="margin:6px 0 14px">${body}</p>${raw(String(action))}</div>`;
}

export const exName = (id) => EXERCISE_BY_ID[id]?.name || 'Unknown exercise';
