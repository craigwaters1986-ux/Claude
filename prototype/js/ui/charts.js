// SVG chart components. Single-series by design (one axis, one hue); every
// chart has a hover/touch tooltip, a recessive grid and a text summary for
// screen readers (aria-label).

import { esc } from './dom.js';

let gid = 0;

export function ring(pct, { size = 210, stroke = 16, color = 'url(#ringGrad)', glow, label = '', sub = '' } = {}) {
  const id = `rg${++gid}`;
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `<div class="ring" style="width:${size}px;height:${size}px;${glow ? `--ring-glow:${glow}` : ''}" role="img" aria-label="${esc(label)} ${pct} percent">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5ce1ff"/><stop offset=".55" stop-color="#2f8cff"/><stop offset="1" stop-color="#6d5cff"/></linearGradient></defs>
      <circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="bar" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color === 'url(#ringGrad)' ? `url(#${id})` : color}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c}" data-target="${off}"/>
    </svg>
    <div class="center"><div>${label ? `<div class="eyebrow">${esc(label)}</div>` : ''}<div class="val num">${pct}<small>%</small></div>${sub ? `<div class="tiny dim" style="margin-top:4px">${sub}</div>` : ''}</div></div>
  </div>`;
}

/** Animate rings after insertion (stroke-dashoffset transition). */
export function animateRings(root) {
  requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll('.ring .bar[data-target]').forEach((el) => { el.style.strokeDashoffset = el.dataset.target; })));
}

function niceMax(v) { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }

/**
 * Line/area chart. points: [{x: label, v: number, t?: ts}], opts.fmt for values.
 */
export function lineChart(points, { height = 170, fmt = (v) => v, color = '#5ce1ff', area = true, title = 'Trend', yMin } = {}) {
  const id = `lc${++gid}`;
  if (!points.length) return `<div class="empty tiny">No data in this range yet.</div>`;
  const W = 340, H = height, pl = 34, pr = 10, pt = 14, pb = 22;
  const vals = points.map((p) => p.v);
  let lo = yMin ?? Math.min(...vals), hi = Math.max(...vals);
  if (yMin == null) { const pad = Math.max((hi - lo) * 0.15, Math.abs(hi) * 0.06) || 1; lo = Math.max(0, lo - pad); hi += pad; }
  else hi = niceMax(hi);
  const x = (i) => pl + (points.length === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (points.length - 1));
  const y = (v) => pt + (1 - (v - lo) / (hi - lo || 1)) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const ticks = [lo, (lo + hi) / 2, hi];
  const labelIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const last = points[points.length - 1];
  const summary = `${title}: ${points.length} points from ${fmt(points[0].v)} to ${fmt(last.v)}`;
  return `<div class="chart" data-chart="${id}" role="img" aria-label="${esc(summary)}">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <g class="grid">${ticks.map((t) => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>
      <g class="axis">${ticks.map((t) => `<text x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${esc(compact(t))}</text>`).join('')}
        ${[...new Set(labelIdx)].map((i) => `<text x="${x(i)}" y="${H - 4}" text-anchor="${i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}">${esc(points[i].x)}</text>`).join('')}</g>
      ${area ? `<path d="${d}L${x(points.length - 1)},${y(lo)}L${x(0)},${y(lo)}Z" fill="url(#${id}g)"/>` : ''}
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 6px ${color}88)"/>
      <circle cx="${x(points.length - 1)}" cy="${y(last.v)}" r="4.5" fill="${color}" stroke="var(--bg-0)" stroke-width="2"/>
      <line class="xh" x1="0" x2="0" y1="${pt}" y2="${H - pb}" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 3" visibility="hidden"/>
      <circle class="xd" r="5" fill="${color}" stroke="var(--bg-0)" stroke-width="2" visibility="hidden"/>
    </svg><div class="tip" hidden></div>
  </div>`;
}

/** Bar chart. bars: [{x, v}] */
export function barChart(bars, { height = 160, fmt = (v) => v, color = '#2f8cff', title = 'Bars' } = {}) {
  const id = `bc${++gid}`;
  if (!bars.length || bars.every((b) => !b.v)) return `<div class="empty tiny">No workouts logged in this range yet.</div>`;
  const W = 340, H = height, pl = 34, pr = 6, pt = 10, pb = 22;
  const hi = niceMax(Math.max(...bars.map((b) => b.v)));
  const bw = (W - pl - pr) / bars.length;
  const gap = Math.max(2, bw * 0.28);
  const y = (v) => pt + (1 - v / hi) * (H - pt - pb);
  const step = Math.ceil(bars.length / 6);
  const summary = `${title}: ${bars.length} bars, max ${fmt(Math.max(...bars.map((b) => b.v)))}`;
  return `<div class="chart" data-chart="${id}" data-kind="bar" role="img" aria-label="${esc(summary)}">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ce1ff"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>
      <g class="grid">${[0, hi / 2, hi].map((t) => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>
      <g class="axis">${[0, hi / 2, hi].map((t) => `<text x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${esc(compact(t))}</text>`).join('')}
        ${bars.map((b, i) => (i % step === 0 ? `<text x="${pl + i * bw + bw / 2}" y="${H - 4}" text-anchor="middle">${esc(b.x)}</text>` : '')).join('')}</g>
      ${bars.map((b, i) => { const h = Math.max(b.v ? 3 : 0, H - pb - y(b.v)); const bx = pl + i * bw + gap / 2; const w = bw - gap; const r = Math.min(4, w / 2, h);
        return `<path class="bar-m" data-i="${i}" d="M${bx},${H - pb}V${H - pb - h + r}Q${bx},${H - pb - h} ${bx + r},${H - pb - h}H${bx + w - r}Q${bx + w},${H - pb - h} ${bx + w},${H - pb - h + r}V${H - pb}Z" fill="url(#${id}g)" opacity=".9"/>`; }).join('')}
    </svg><div class="tip" hidden></div>
  </div>`;
}

/** Wire tooltips for charts inside root. data: map chartId → {points, fmt, kind} */
export function bindCharts(root, registry) {
  root.querySelectorAll('.chart[data-chart]').forEach((el) => {
    const meta = registry[el.dataset.chart]; if (!meta) return;
    const svg = el.querySelector('svg'); const tip = el.querySelector('.tip');
    const xh = el.querySelector('.xh'), xd = el.querySelector('.xd');
    const move = (e) => {
      const rect = svg.getBoundingClientRect();
      const px = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) / rect.width * 340;
      const n = meta.points.length;
      let i;
      if (meta.kind === 'bar') i = Math.floor((px - 34) / ((340 - 40) / n));
      else i = Math.round(((px - 34) / (340 - 44)) * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      const p = meta.points[i];
      tip.hidden = false; tip.textContent = `${p.label || p.x} · ${meta.fmt(p.v)}`;
      const leftPx = meta.kind === 'bar' ? (34 + (i + 0.5) * ((340 - 40) / n)) : (34 + (n === 1 ? (340 - 44) / 2 : i * (340 - 44) / (n - 1)));
      tip.style.left = `${Math.max(14, Math.min(86, (leftPx / 340) * 100))}%`;
      if (meta.kind === 'bar') el.querySelectorAll('.bar-m').forEach((b) => b.setAttribute('opacity', +b.dataset.i === i ? '1' : '.45'));
      else if (xh) {
        const vals = meta.points.map((q) => q.v);
        let lo = meta.yMin ?? Math.min(...vals), hi = Math.max(...vals);
        if (meta.yMin == null) { const pad = Math.max((hi - lo) * 0.15, Math.abs(hi) * 0.06) || 1; lo = Math.max(0, lo - pad); hi += pad; } else hi = niceMax(hi);
        const yy = 14 + (1 - (p.v - lo) / (hi - lo || 1)) * (meta.height - 36);
        xh.setAttribute('x1', leftPx); xh.setAttribute('x2', leftPx); xh.setAttribute('visibility', 'visible');
        xd.setAttribute('cx', leftPx); xd.setAttribute('cy', yy); xd.setAttribute('visibility', 'visible');
      }
    };
    const leave = () => { tip.hidden = true; xh?.setAttribute('visibility', 'hidden'); xd?.setAttribute('visibility', 'hidden'); el.querySelectorAll('.bar-m').forEach((b) => b.setAttribute('opacity', '.9')); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerdown', move);
    el.addEventListener('touchmove', move, { passive: true }); el.addEventListener('pointerleave', leave);
  });
}

/** Creates a chart + registers its tooltip metadata. */
export function makeChart(registry, kind, points, opts = {}) {
  const htmlStr = kind === 'bar' ? barChart(points, opts) : lineChart(points, opts);
  const m = htmlStr.match(/data-chart="([^"]+)"/);
  if (m) registry[m[1]] = { points, fmt: opts.fmt || ((v) => v), kind, yMin: opts.yMin, height: opts.height || (kind === 'bar' ? 160 : 170) };
  return htmlStr;
}

export function sparkline(vals, { w = 80, h = 28, color = '#5ce1ff' } = {}) {
  if (vals.length < 2) return '';
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${(i * w / (vals.length - 1)).toFixed(1)},${(h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6)).toFixed(1)}`).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function compact(v) {
  if (Math.abs(v) >= 1e6) return `${+(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${+(v / 1e3).toFixed(1)}k`;
  return `${+v.toFixed(v < 10 ? 1 : 0)}`;
}
