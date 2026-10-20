/** Single source for numeric field defaults and minimums (mm). */
export const NUMERIC_FIELDS = {
  pad: { default: 4, min: 0.5 },
  baseT: { default: 2.4, min: 0.4 },
  rel: { default: 1.2, min: 0.2 },
  bord: { default: 2, min: 0 },
  gap: { default: 3, min: 0 },
  hole: { default: 4.5, min: 0 },
  osz: { default: 10.5, min: 2 },
  rpt: { default: 0, min: -50 },
  rpb: { default: 0, min: -50 },
  rpl: { default: 0, min: -50 },
  rpr: { default: 0, min: -50 },
  rhl: { default: 2.4, min: 0.2 },
  rhr: { default: 2.4, min: 0.2 },
  rth: { default: 2.4, min: 0.2 },
  rmt: { default: 0, min: -100 },
  rmb: { default: 0, min: -100 },
  rml: { default: 0, min: -100 },
  rmr: { default: 0, min: -100 },
};

export function numericDefault(key) {
  return NUMERIC_FIELDS[key]?.default ?? 0;
}

export function numericMin(key) {
  return NUMERIC_FIELDS[key]?.min ?? 0;
}

/** String form stored in UI state for `<input type="number">` values. */
export function numericUiDefault(key) {
  return String(numericDefault(key));
}

export const NUMERIC_DEFAULTS = Object.fromEntries(
  Object.entries(NUMERIC_FIELDS).map(([k, v]) => [k, v.default]),
);

export const NUMERIC_MINS = Object.fromEntries(
  Object.entries(NUMERIC_FIELDS).map(([k, v]) => [k, v.min]),
);
