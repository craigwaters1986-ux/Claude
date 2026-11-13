import { getState, subscribe } from './core/store.js';
import { icon, setHaptics, haptic } from './ui/dom.js';
import { navigate } from './app.js';

import * as home from './screens/home.js';
import * as train from './screens/train.js';
import * as workout from './screens/workout.js';
import * as library from './screens/library.js';
import * as body from './screens/body.js';
import * as progress from './screens/progress.js';
import * as profile from './screens/profile.js';
import * as generator from './screens/generator.js';
import * as coach from './screens/coach.js';
import * as watch from './screens/watch.js';
import * as onboarding from './screens/onboarding.js';

const ROUTES = {
  home: { mod: home, tab: 'home' }, train: { mod: train, tab: 'train' }, body: { mod: body, tab: 'body' },
  progress: { mod: progress, tab: 'progress' }, profile: { mod: profile, tab: 'profile' },
  workout: { mod: workout, fullscreen: true }, library: { mod: library, tab: 'train' },
  generator: { mod: generator, tab: 'train' }, coach: { mod: coach, fullscreen: true }, watch: { mod: watch, fullscreen: true },
};

const TABS = [['home', 'Home', 'home'], ['train', 'Train', 'train'], ['body', 'Body', 'body'], ['progress', 'Progress', 'chart'], ['profile', 'Profile', 'user']];

const view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');
let cleanup = null;
let current = null;

tabbar.innerHTML = TABS.map(([id, label, ic]) => `<a class="tab" href="#/${id}" data-tab="${id}">${icon(ic)}<span>${label}</span></a>`).join('');
tabbar.addEventListener('click', () => haptic('light'));

function parse() {
  const [, name = 'home', ...rest] = (location.hash || '#/home').slice(1).split('/');
  return { name: ROUTES[name] ? name : 'home', params: rest };
}

function render({ keepScroll = false } = {}) {
  const { name, params } = parse();
  const route = ROUTES[name];
  const scroll = keepScroll && current === name ? view.scrollTop : 0;
  cleanup?.(); cleanup = null;
  const s = getState();
  setHaptics(s.profile.haptics);
  document.documentElement.dataset.theme = s.profile.theme === 'light' ? 'light' : 'dark';

  // An active workout always offers a way back in.
  tabbar.classList.toggle('hidden', !!route.fullscreen);
  tabbar.querySelectorAll('.tab').forEach((t) => (t.dataset.tab === route.tab ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current')));
  view.classList.toggle('no-tabbar', !!route.fullscreen);

  const out = route.mod.render({ params, navigate, rerender: () => render({ keepScroll: true }) });
  view.innerHTML = String(out.html ?? out);
  if (!keepScroll) { view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter'); }
  view.scrollTop = scroll;
  cleanup = out.mount?.(view) || null;
  current = name;

  if (!s.profile.onboarded && !document.querySelector('.onb')) onboarding.open();
}

window.addEventListener('hashchange', () => render());
// Re-render on store changes, unless the screen manages its own updates.
subscribe(() => { const r = ROUTES[parse().name]; if (!r.mod.selfManaged) render({ keepScroll: true }); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
