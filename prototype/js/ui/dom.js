// Tiny UI toolkit: escaped HTML templates, icons, sheets, toasts, haptics.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);

/** Tagged template: interpolations are escaped unless wrapped in raw() or are arrays of raw. */
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) {
      const v = vals[i];
      if (v == null || v === false) return;
      if (Array.isArray(v)) out += v.map((x) => (x instanceof Raw ? x.s : esc(x))).join('');
      else out += v instanceof Raw ? v.s : esc(v);
    }
  });
  return raw(out);
}

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  train: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M5 8.5c2.2.8 4.5 1.2 7 1.2s4.8-.4 7-1.2M12 9.7V15m0 0-2.5 6M12 15l2.5 6M8 9.3 7 15M16 9.3 17 15"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>', chevL: '<path d="m15 6-6 6 6 6"/>', chevD: '<path d="m6 9 6 6 6-6"/>',
  play: '<path d="M7 5v14l11-7z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2h5"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  watch: '<rect x="6" y="6" width="12" height="12" rx="3.5"/><path d="M9 6l.6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3M12 9.5V12l1.5 1"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.6 3.4 4.4 6.7C19.5 15.4 12 20 12 20z"/>',
  flame: '<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.1 2-5.1 3.6-6.8.4 1.5 1.3 2.7 2.4 3.3C11 7.4 12.6 4.5 15.4 3c-.3 2.7.6 4.4 2 6 1.2 1.4 1.6 3 1.6 4.8C19 18 15.9 21 12 21z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
  send: '<path d="M4 12 20 4l-6 16-2.5-6.5z"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', note: '<path d="M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5"/>', dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
};
export const icon = (name, cls = '') => raw(`<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`);

// ── Haptics ──────────────────────────────────────────────────────────────
// iOS Safari exposes no web haptics API; on iPhone the native app uses
// UIImpactFeedbackGenerator / UINotificationFeedbackGenerator (see ios/).
// Here we use navigator.vibrate where available plus a visual pulse.
let hapticsOn = true;
export function setHaptics(on) { hapticsOn = on; }
export function haptic(kind = 'light') {
  if (!hapticsOn) return;
  const pattern = { light: 8, medium: 16, heavy: 28, success: [12, 40, 18], warning: [20, 60, 20] }[kind] || 8;
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
}

// ── Toast ────────────────────────────────────────────────────────────────
export function toast(msg, { kind = '', ms = 2200 } = {}) {
  const host = document.querySelector('.device');
  const el = document.createElement('div');
  el.className = `toast ${kind}`; el.setAttribute('role', 'status'); el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .25s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 260); }, ms);
}

// ── Bottom sheet ─────────────────────────────────────────────────────────
export function openSheet(content, { onMount, onClose, label = 'Details' } = {}) {
  const host = document.querySelector('.device');
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sheet = document.createElement('div'); sheet.className = 'sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', label);
  sheet.innerHTML = String(content);
  host.append(scrim, sheet);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    onClose?.();
    sheet.classList.add('closing'); scrim.classList.add('closing');
    setTimeout(() => { sheet.remove(); scrim.remove(); }, 170);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  scrim.addEventListener('click', close);
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  onMount?.(sheet, close);
  const focusable = sheet.querySelector('button, input, select, textarea');
  focusable?.focus({ preventScroll: true });
  return { el: sheet, close };
}

export function confirmSheet(title, body, okLabel = 'Confirm', { danger = false } = {}) {
  return new Promise((resolve) => {
    let ok = false;
    openSheet(html`<h3 class="title-l">${title}</h3><p class="muted">${body}</p>
      <div class="col" style="margin-top:16px"><button class="btn block lg ${danger ? 'danger' : 'primary'}" data-ok>${okLabel}</button><button class="btn block" data-close>Cancel</button></div>`, {
      label: title,
      onMount: (el, close) => el.querySelector('[data-ok]').addEventListener('click', () => { ok = true; close(); }),
      onClose: () => resolve(ok),
    });
  });
}

/** Delegated click handler: elements with data-act="name" call handlers[name](el, event). */
export function delegate(root, handlers, type = 'click') {
  const fn = (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    const h = handlers[el.dataset.act];
    if (h) h(el, e);
  };
  root.addEventListener(type, fn);
  return () => root.removeEventListener(type, fn);
}

export function download(filename, text, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
