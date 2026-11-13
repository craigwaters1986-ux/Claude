import { html, icon, delegate, haptic, toast, confirmSheet, openSheet, download } from '../ui/dom.js';
import { SIM } from '../ui/widgets.js';
import { derived, loadSampleData, clearSampleData, connectSimulatedHealth } from '../app.js';
import { getState, setState, exportData, deleteAllData, storageAvailable, uid } from '../core/store.js';
import { signInDev, deleteCloudAccount } from '../core/sync.js';
import { runSync } from '../app.js';
import { GOALS, EXPERIENCE, INJURY_TAGS } from '../core/generator.js';
import { EQUIPMENT } from '../core/exercises.js';
import * as onboarding from './onboarding.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const FEATURE_STATUS = [
  ['Workout logging, templates, editing, PRs, overload suggestions', 'Working', 'live'],
  ['Offline storage (this browser) + offline app shell', 'Working', 'live'],
  ['Recovery model, dashboard & 3D muscle map', 'Working (estimates)', 'live'],
  ['AI generator & coach — on-device rules engine', 'Working', 'live'],
  ['AI generator & coach — Claude via Forma server', 'Needs server + key', 'sim'],
  ['Apple Health (sleep, HRV, resting HR)', 'Simulated values', 'sim'],
  ['Apple Watch companion & sync', 'Simulated in browser', 'sim'],
  ['Wrist rep counting algorithm', 'Synthetic + phone sensors', 'sim'],
  ['Accounts & cloud sync (dev sign-in; Apple sign-in native)', 'Working with Forma server', 'live'],
];

const row = (label, right, act = '', sub = '') => html`<div class="list-item ${act ? 'tap' : ''}" ${act ? html`data-act="${act}"` : ''}><div style="flex:1"><div style="font-size:15px">${label}</div>${sub ? html`<div class="tiny dim" style="margin-top:2px">${sub}</div>` : ''}</div>${right}</div>`;
const toggle = (act, on, label) => html`<button class="toggle" role="switch" aria-checked="${!!on}" aria-label="${label}" data-act="${act}"></button>`;

export function render({ navigate }) {
  const s = getState();
  const p = s.profile;
  const { workouts } = derived();
  const set = (fn, op = 'profile.update') => { setState((st) => fn(st.profile, st), { op }); haptic('light'); };

  const out = html`
  <header class="topbar"><div><div class="eyebrow">Profile</div><h1 class="title-xl">${p.name || 'Athlete'}</h1></div>
    <div class="avatar" style="width:54px;height:54px;border-radius:18px;font-size:22px;font-weight:700">${(p.name || 'A')[0].toUpperCase()}</div></header>
  <div class="stagger">
  <div class="card"><div class="row between"><div><div class="eyebrow">Goal</div><b>${GOALS[p.goal]?.label}</b></div><div><div class="eyebrow">Level</div><b>${EXPERIENCE[p.experience]?.label}</b></div><div><div class="eyebrow">Logged</div><b class="num">${workouts.length}</b></div></div></div>

  <div class="section-h"><h2>Training</h2></div>
  <div class="card">
    <label class="field">Name<input class="input" data-name value="${p.name}" placeholder="Your name (optional)" maxlength="30"></label>
    <div class="eyebrow" style="margin-top:14px">Goal</div><div class="chips" style="margin-top:6px">${Object.entries(GOALS).map(([k, g]) => html`<button class="chip" data-act="goal" data-v="${k}" aria-pressed="${p.goal === k}">${g.label}</button>`)}</div>
    <div class="eyebrow" style="margin-top:14px">Experience</div><div class="chips" style="margin-top:6px">${Object.entries(EXPERIENCE).map(([k, e]) => html`<button class="chip" data-act="exp" data-v="${k}" aria-pressed="${p.experience === k}">${e.label}</button>`)}</div>
    <div class="eyebrow" style="margin-top:14px">Training days</div><div class="chips" style="margin-top:6px">${WEEKDAYS.map((d, i) => html`<button class="chip" data-act="day" data-v="${i + 1}" aria-pressed="${p.days.includes(i + 1)}">${d}</button>`)}</div>
    <div class="eyebrow" style="margin-top:14px">Typical duration</div><div class="chips" style="margin-top:6px">${[30, 45, 60, 75, 90].map((d) => html`<button class="chip" data-act="dur" data-v="${d}" aria-pressed="${p.durationMin === d}">${d} min</button>`)}</div>
    <div class="eyebrow" style="margin-top:14px">Equipment</div><div class="chips" style="margin-top:6px">${EQUIPMENT.map((e) => html`<button class="chip" data-act="equip" data-v="${e.id}" aria-pressed="${p.equipment.includes(e.id)}">${e.label}</button>`)}</div>
    <div class="eyebrow" style="margin-top:14px">Injuries / restrictions</div><div class="chips" style="margin-top:6px">${Object.entries(INJURY_TAGS).map(([k, l]) => html`<button class="chip avoid" data-act="injury" data-v="${k}" aria-pressed="${(p.injuries || []).includes(k)}">${l}</button>`)}</div>
  </div>

  <div class="section-h"><h2>Preferences</h2></div>
  <div class="card" style="padding:2px 14px">
    ${row('Units', html`<div class="seg" style="width:120px"><button aria-pressed="${p.units === 'kg'}" data-act="units" data-v="kg">kg</button><button aria-pressed="${p.units === 'lb'}" data-act="units" data-v="lb">lb</button></div>`)}
    ${row('Default rest timer', html`<div class="row" style="gap:6px"><button class="icon-btn sm" data-act="rest" data-d="-15" aria-label="Decrease rest">${icon('minus', 'sm')}</button><b class="num" style="width:48px;text-align:center">${p.restDefaultSec}s</b><button class="icon-btn sm" data-act="rest" data-d="15" aria-label="Increase rest">${icon('plus', 'sm')}</button></div>`, '', 'Isolation exercises use 60% of this')}
    ${row('Haptic feedback', toggle('haptics', p.haptics, 'Haptic feedback'), '', 'Uses vibration where the browser supports it; native app uses Taptic Engine')}
    ${row('Light appearance', toggle('theme', p.theme === 'light', 'Light appearance'), '', 'Dark is the default')}
  </div>

  <div class="section-h"><h2>Devices & health</h2></div>
  <div class="card" style="padding:2px 14px">
    ${row(html`<span class="row" style="gap:8px">${icon('watch', 'sm')} Apple Watch</span>`, html`<span class="row" style="gap:6px">${SIM('Preview')}${icon('chevR', 'sm')}</span>`, 'watch', 'Not connected — browsers cannot reach Apple Watch. Open the companion preview.')}
    ${row(html`<span class="row" style="gap:8px">${icon('heart', 'sm')} Apple Health</span>`, toggle('health', p.healthConnected, 'Apple Health'), '', p.healthConnected ? 'Connected to SIMULATED sample values (no HealthKit in a browser)' : 'Optional. Sleep, resting HR and HRV refine recovery estimates.')}
    ${row('What Health data is used for', icon('chevR', 'sm'), 'health-info')}
  </div>

  <div class="section-h"><h2>AI & privacy</h2></div>
  <div class="card" style="padding:2px 14px">
    ${row('Coach can use my workout history', toggle('coach-history', p.coachUsesHistory !== false, 'Coach can use my workout history'), '', 'Off = answers are generic and use no personal data')}
    ${row('Cloud AI (Forma server)', toggle('cloud', p.aiCloud, 'Cloud AI'), '', 'Off by default. Sends a minimal training summary — never your name or notes — to your configured Forma server, which calls Claude. No API keys live in the app.')}
  </div>

  <div class="section-h"><h2>Account & sync</h2>${s.sync?.token ? html`<span class="badge live">Signed in</span>` : html`<span class="badge">Local only</span>`}</div>
  <div class="card" style="padding:2px 14px">
    <div style="padding:12px 0"><label class="field" for="server-url">Forma server<input id="server-url" class="input" data-endpoint value="${p.aiEndpoint}" placeholder="http://localhost:8787" inputmode="url"></label>
      <div class="tiny dim" style="margin-top:6px">Used for sync and Cloud AI. Run <code>FORMA_DEV=1 npm run server</code> locally (see server/README).</div></div>
    ${s.sync?.token ? html`
      ${row('Sync now', icon('refresh', 'sm'), 'sync-now', s.sync.lastSyncAt ? `Last synced ${new Date(s.sync.lastSyncAt).toLocaleString()}` : 'Not synced yet')}
      ${row('Sign out on this device', icon('chevR', 'sm'), 'sign-out', 'Your data stays on this device')}
      ${row(html`<span style="color:var(--danger)">Delete cloud account</span>`, icon('trash', 'sm'), 'delete-cloud', 'Removes everything stored on the server')}`
    : row('Sign in (development account)', icon('user', 'sm'), 'sign-in', 'Syncs workouts, templates and settings across devices. The iPhone app uses Sign in with Apple.')}
  </div>

  <div class="section-h"><h2>Your data</h2></div>
  <div class="card" style="padding:2px 14px">
    ${row('Storage', html`<span class="badge ${storageAvailable ? 'live' : 'sim'}">${storageAvailable ? 'On this device' : 'Unavailable (private mode?)'}</span>`, '', `${s.syncQueue.length} changes recorded for future sync · nothing leaves this device`)}
    ${row('Export all data (JSON)', icon('download', 'sm'), 'export')}
    ${row(s.sampleData ? 'Remove sample data' : 'Load sample data', icon(s.sampleData ? 'trash' : 'plus', 'sm'), s.sampleData ? 'clear-sample' : 'sample', 'About 10 weeks of push/pull/legs history')}
    ${row('Replay onboarding', icon('refresh', 'sm'), 'onboarding')}
    ${row(html`<span style="color:var(--danger)">Delete all data</span>`, icon('trash', 'sm'), 'delete')}
  </div>

  <div class="section-h"><h2>Prototype status</h2></div>
  <div class="card"><table class="status"><tbody>${FEATURE_STATUS.map(([f, st, k]) => html`<tr><td>${f}</td><td><span class="badge ${k}">${st}</span></td></tr>`)}</tbody></table>
    <p class="tiny dim" style="margin-top:10px">The native SwiftUI / watchOS implementation lives in <code>ios/</code>. Apple Watch features are not claimed to work until tested on hardware.</p></div>
  </div>`;

  return {
    html: out,
    mount(el) {
      el.querySelector('[data-name]').addEventListener('change', (e) => set((pp) => { pp.name = e.target.value.trim(); }));
      el.querySelector('[data-endpoint]')?.addEventListener('change', (e) => set((pp) => { pp.aiEndpoint = e.target.value.trim(); }));
      const tog = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
      return delegate(el, {
        goal: (b) => set((pp) => { pp.goal = b.dataset.v; }),
        exp: (b) => set((pp) => { pp.experience = b.dataset.v; }),
        day: (b) => set((pp) => { pp.days = tog(pp.days, +b.dataset.v).sort(); }),
        dur: (b) => set((pp) => { pp.durationMin = +b.dataset.v; }),
        equip: (b) => set((pp) => { pp.equipment = tog(pp.equipment, b.dataset.v); }),
        injury: (b) => set((pp) => { pp.injuries = tog(pp.injuries || [], b.dataset.v); }),
        units: (b) => set((pp) => { pp.units = b.dataset.v; }),
        rest: (b) => set((pp) => { pp.restDefaultSec = Math.min(600, Math.max(15, pp.restDefaultSec + +b.dataset.d)); }),
        haptics: () => set((pp) => { pp.haptics = !pp.haptics; }),
        theme: () => set((pp) => { pp.theme = pp.theme === 'light' ? 'dark' : 'light'; }),
        'sign-in': async () => {
          if (!getState().profile.aiEndpoint) { toast('Enter the Forma server URL first'); return; }
          try {
            const deviceId = getState().sync?.deviceId || uid('dev_');
            const r = await signInDev(getState().profile.aiEndpoint, deviceId);
            setState((st) => { st.sync = { deviceId, token: r.token, userId: r.userId, cursor: 0, meta: {} }; }, { op: 'account.signIn' });
            await runSync(true);
          } catch (e) { toast(`Sign-in failed: ${e.message}`); }
        },
        'sync-now': () => runSync(true),
        'sign-out': () => setState((st) => { st.sync = { deviceId: st.sync?.deviceId }; }, { op: 'account.signOut' }),
        'delete-cloud': async () => {
          if (!(await confirmSheet('Delete cloud account?', 'Everything stored on the Forma server is permanently deleted. Data on this device is kept.', 'Delete cloud data', { danger: true }))) return;
          try { await deleteCloudAccount(getState().profile.aiEndpoint, getState().sync.token); setState((st) => { st.sync = { deviceId: st.sync?.deviceId }; }, { op: 'account.delete' }); toast('Cloud account deleted'); }
          catch (e) { toast(`Could not delete: ${e.message}`); }
        },
        'coach-history': () => set((pp) => { pp.coachUsesHistory = pp.coachUsesHistory === false; }),
        cloud: () => set((pp) => { pp.aiCloud = !pp.aiCloud; }),
        watch: () => navigate('/watch'),
        health: () => (p.healthConnected ? connectSimulatedHealth(false) : healthPermission()),
        'health-info': () => healthPermission(true),
        export: () => { download(`forma-export-${new Date().toISOString().slice(0, 10)}.json`, exportData()); toast('Export downloaded'); },
        sample: () => { loadSampleData(); toast('Sample data loaded'); },
        'clear-sample': async () => { if (await confirmSheet('Remove sample data?', 'Only the sample workouts and templates are removed. Your own data stays.', 'Remove')) { clearSampleData(); toast('Sample data removed'); } },
        onboarding: () => onboarding.open(true),
        delete: async () => { if (await confirmSheet('Delete all data?', 'Every workout, template, setting and preference on this device will be permanently erased. Export first if you want a copy.', 'Delete everything', { danger: true })) { deleteAllData(); toast('All data deleted'); navigate('/home'); } },
      });
    },
  };
}

/** Explains each Health data type before asking — mirrors the native permission sheet. */
export function healthPermission(infoOnly = false) {
  openSheet(html`<div class="row">${icon('heart')}<h3 class="title-l">Apple Health</h3></div>
    <p class="tiny muted" style="line-height:1.5">Connecting is optional — logging and recovery estimates work without it. Here's exactly what Forma would read and why:</p>
    <div class="list">
      ${[['Sleep duration', 'Short sleep slightly slows estimated recovery.'], ['Resting heart rate', 'An elevated reading vs your baseline nudges recovery slower.'], ['Heart-rate variability', 'A low reading vs your baseline nudges recovery slower.'], ['Workouts & active energy (write)', 'Save your Forma sessions to Health with calories estimated by Apple Watch.']]
        .map(([t, d]) => html`<div class="list-item"><div><b style="font-size:15px">${t}</b><div class="tiny dim">${d}</div></div></div>`)}
    </div>
    <div class="banner" style="margin-top:10px">${icon('info', 'sm')}<span>This web prototype cannot access HealthKit. Connecting here loads <b>simulated sample values</b> so you can see how the feature behaves.</span></div>
    <p class="xtiny dim" style="margin-top:10px">Health data stays on your device, is never used for advertising, and is never sent to the AI without the coach permission enabled.</p>
    <div class="col" style="margin-top:14px">${infoOnly ? html`<button class="btn block" data-close>Close</button>` : html`<button class="btn primary block lg" data-ok>Connect (simulated)</button><button class="btn block" data-close>Not now</button>`}</div>`, {
    label: 'Apple Health permissions',
    onMount: (el, close) => el.querySelector('[data-ok]')?.addEventListener('click', () => { connectSimulatedHealth(true); toast('Simulated Health data connected'); close(); }),
  });
}
