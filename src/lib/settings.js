import { SLIDER_FIELDS, RING_FIELDS, RING_NUMBER_IDS } from './constants.js';
import { NUMERIC_DEFAULTS, NUMERIC_MINS } from './defaults/numeric.js';

export function parseNum(value, fallback = 0, min = null) {
  const v = parseFloat(value);
  const n = Number.isNaN(v) ? fallback : v;
  if (min != null) return Math.max(min, n);
  return n;
}

/** Numeric layout / base / border / keyring values used by the 3D build. */
export function buildNumericSettings(ui) {
  const keys = [
    ...SLIDER_FIELDS.map((x) => x[0]),
    ...RING_FIELDS.map((x) => x[0]),
    ...RING_NUMBER_IDS,
  ];
  const o = {};
  for (const k of keys) {
    const raw = ui[k];
    o[k] = parseNum(raw, parseNum(NUMERIC_DEFAULTS[k], 0), NUMERIC_MINS[k] ?? 0);
  }
  return o;
}
