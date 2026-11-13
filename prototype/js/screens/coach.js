import { html, raw, icon, delegate, haptic, toast } from '../ui/dom.js';
import { lineChart } from '../ui/charts.js';
import { derived } from '../app.js';
import { getState, setState } from '../core/store.js';
import { ask } from '../core/ai.js';
import { fromPlan } from '../core/session.js';
import { EXERCISE_BY_ID } from '../core/exercises.js';
import { fmtWeight } from '../core/units.js';

export const selfManaged = true;

const SUGGESTIONS = [
  'Build me a 45-minute chest and triceps workout.',
  'What muscles should I train today?',
  'Why has my bench press stopped improving?',
  'Give me an alternative to barbell squats.',
  'How much weight should I attempt next session on bench?',
];

let messages = [];
const plans = {};

const SOURCES = { history: 'your workout log', recovery: 'estimated recovery', health: 'Apple Health', library: 'exercise library' };

export function render({ navigate }) {
  const { workouts, recovery, health, profile } = derived();
  let root; let thinking = false;

  const msgView = (m, idx) => {
    if (m.role === 'user') return html`<div class="msg user">${m.text}</div>`;
    const plan = plans[idx];
    return html`<div class="msg bot">${m.text}
      ${m.chart ? raw(`<div style="margin-top:10px">${lineChart(m.chart.map((p) => ({ x: new Date(p.t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), v: p.v })), { height: 110, area: false, fmt: (v) => fmtWeight(v, profile.units), title: 'Estimated 1RM' })}</div>`) : ''}
      ${plan ? html`<div class="card" style="margin-top:10px;padding:12px">${plan.exercises.map((e) => html`<div class="row between tiny" style="margin:3px 0"><span>${e.name}</span><span class="dim num">${e.sets}×${e.reps[0]}–${e.reps[1]}</span></div>`)}
        <button class="btn sm primary block" style="margin-top:10px" data-act="start" data-i="${idx}">${icon('play', 'sm')} Start this workout</button></div>` : ''}
      ${m.cards?.length ? html`<div class="chips" style="margin-top:10px">${m.cards.map((c) => html`<span class="chip">${EXERCISE_BY_ID[c.exerciseId]?.name}</span>`)}</div>` : ''}
      ${m.grounded ? html`<div class="xtiny dim" style="margin-top:8px">${m.grounded.length ? `Based on: ${m.grounded.map((g) => SOURCES[g] || g).join(', ')}` : 'No personal data used'} · ${m.via === 'cloud' ? 'Cloud AI' : 'On-device'}</div>` : ''}</div>`;
  };

  const body = () => html`
    <header class="topbar" style="position:sticky;top:0;z-index:5;background:linear-gradient(var(--bg-0) 75%,transparent)"><button class="icon-btn" data-act="back" aria-label="Back">${icon('chevL')}</button>
      <div style="text-align:center"><h1 class="title-m">Coach</h1><div class="xtiny dim">${profile.aiCloud && profile.aiEndpoint ? 'Cloud AI · grounded in your data' : 'On-device · grounded in your data'}</div></div>
      <button class="icon-btn" data-act="clear" aria-label="Clear conversation">${icon('trash', 'sm')}</button></header>
    <div class="chat" aria-live="polite">
      ${!messages.length ? html`<div class="card ai" style="text-align:center;padding:24px 16px"><div class="logo" style="width:60px;height:60px;border-radius:18px;background:var(--ai-grad)">${icon('spark')}</div>
        <h2 class="title-m" style="margin-top:12px">Your training assistant</h2><p class="tiny muted" style="line-height:1.5">I use your logged workouts${profile.coachUsesHistory === false ? ' (currently switched off in Profile)' : ''} and estimated recovery to answer. I'll tell you when I don't have the data — I never invent records${health ? '' : ', and Apple Health isn\'t connected'}.</p></div>
        <div class="col" style="gap:8px">${SUGGESTIONS.map((s) => html`<button class="card tap" style="text-align:left;margin:0;padding:12px 14px" data-act="suggest" data-q="${s}"><span class="tiny">${s}</span></button>`)}</div>` : messages.map(msgView)}
      ${thinking ? html`<div class="msg bot typing" aria-label="Coach is typing"><span></span><span></span><span></span></div>` : ''}
    </div>
    <form class="composer" data-form><input class="input" data-q placeholder="Ask about your training…" aria-label="Message" autocomplete="off" enterkeyhint="send"><button class="icon-btn" style="background:var(--accent-grad);border:0" aria-label="Send">${icon('send')}</button></form>`;

  const rerender = () => { root.innerHTML = String(body()); root.scrollTop = root.scrollHeight; };

  const send = async (q) => {
    q = q.trim(); if (!q || thinking) return;
    messages.push({ role: 'user', text: q }); thinking = true; rerender(); haptic('light');
    const t0 = Date.now();
    const r = await ask(q, { workouts, recovery, health, likes: getState().likes, dislikes: getState().dislikes }, profile, messages);
    await new Promise((res) => setTimeout(res, Math.max(0, 500 - (Date.now() - t0))));
    messages.push({ role: 'bot', text: r.text, grounded: r.grounded, via: r.via, cards: r.cards, chart: r.chart });
    if (r.plan) plans[messages.length - 1] = r.plan;
    thinking = false; rerender();
  };

  return {
    html: body(),
    mount(el) {
      root = el; el.scrollTop = el.scrollHeight;
      el.addEventListener('submit', (e) => { if (e.target.matches('[data-form]')) { e.preventDefault(); const inp = e.target.querySelector('[data-q]'); const q = inp.value; inp.value = ''; send(q); } }, true);
      return delegate(el, {
        back: () => (history.length > 1 ? history.back() : navigate('/home')),
        clear: () => { messages = []; rerender(); },
        suggest: (b) => send(b.dataset.q),
        start: (b) => {
          if (getState().active) { toast('Finish your current workout first'); return; }
          setState((s) => { s.active = fromPlan(plans[b.dataset.i], workouts); }, { op: 'workout.start' }); navigate('/workout');
        },
      });
    },
  };
}
