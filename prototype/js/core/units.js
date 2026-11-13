export const KG_PER_LB = 0.45359237;

export function toDisplay(kg, units = 'kg') {
  if (kg == null || Number.isNaN(kg)) return null;
  if (units === 'lb') return Math.round((kg / KG_PER_LB) * 2) / 2; // nearest 0.5 lb
  return Math.round(kg * 100) / 100;
}

export function fromDisplay(v, units = 'kg') {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
  if (!Number.isFinite(n)) return null;
  return units === 'lb' ? Math.round(n * KG_PER_LB * 1000) / 1000 : n;
}

export function fmtWeight(kg, units = 'kg', { unit = true } = {}) {
  const v = toDisplay(kg, units);
  if (v == null) return '—';
  const s = String(+v.toFixed(2));
  return unit ? `${s} ${units}` : s;
}

export function fmtVolume(kg, units = 'kg') {
  const v = units === 'lb' ? kg / KG_PER_LB : kg;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M ${units}`;
  if (v >= 1e4) return `${(v / 1e3).toFixed(1)}k ${units}`;
  return `${Math.round(v).toLocaleString()} ${units}`;
}

export function relDay(t, now = Date.now()) {
  if (!t) return 'Never';
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const d1 = new Date(t); d1.setHours(0, 0, 0, 0);
  const days = Math.round((d0 - d1) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
