export const PI = Math.PI;
/** Raster resolution (pixels per mm) used when tracing contours and borders. */
export const R = 8;

export const PALETTE = ['#ffffff', '#ffd23f', '#ff6b6b', '#2ec4b6', '#111111'];

export const POSITIONS = [
  ['tl', 'Top left'], ['tc', 'Top center'], ['tr', 'Top right'], ['lc', 'Left center'],
  ['rc', 'Right center'], ['bl', 'Bottom left'], ['bc', 'Bottom center'], ['br', 'Bottom right'],
];

/** Direction vector for each border position. */
export const PS = {
  tl: [-1, 1], tc: [0, 1], tr: [1, 1], bl: [-1, -1], bc: [0, -1], br: [1, -1], lc: [-1, 0], rc: [1, 0],
};

/** Numeric settings: label, minimum, step and default. */
export const FIELDS = {
  gap: { label: 'Space between components (mm)', min: 0, step: 0.5, def: 3 },
  pad: { label: 'Padding / contour offset (mm)', min: 0.5, step: 0.5, def: 4 },
  baseT: { label: 'Base thickness (mm)', min: 0.4, step: 0.2, def: 2.4 },
  bord: { label: 'Border width (mm)', min: 0, step: 0.2, def: 2 },
  rel: { label: 'Border height (mm)', min: 0.2, step: 0.2, def: 1.2 },
  hole: { label: 'Inner hole size (mm)', min: 0, step: 0.5, def: 4.5 },
  osz: { label: 'Outer shape size (mm)', min: 2, step: 0.5, def: 10.5 },
  rpt: { min: -50, step: 0.5, def: 0 }, rpb: { min: -50, step: 0.5, def: 0 },
  rpl: { min: -50, step: 0.5, def: 0 }, rpr: { min: -50, step: 0.5, def: 0 },
  rmt: { min: -100, step: 0.5, def: 0 }, rmb: { min: -100, step: 0.5, def: 0 },
  rml: { min: -100, step: 0.5, def: 0 }, rmr: { min: -100, step: 0.5, def: 0 },
  rth: { label: 'Ring height (mm)', min: 0.2, step: 0.2, def: 2.4 },
  rhl: { min: 0.2, step: 0.2, def: 2.4 }, rhr: { min: 0.2, step: 0.2, def: 2.4 },
  rro: { step: 5, def: 0 }, rri: { step: 5, def: 0 },
};

export const DEFAULT_SETTINGS = {
  dir: 'h', shape: 'cont', cs: 'reg', bs: 'solid', fillb: true,
  cb: '#000000', cd: '#ffffff', cr: '#000000',
  rso: 'circle', rsi: 'circle', rslope: false,
  kname: '', fmt: '3mf',
  ...Object.fromEntries(Object.entries(FIELDS).map(([k, f]) => [k, f.def])),
};

/** Reads a numeric setting, falling back to its default and clamping to its minimum. */
export function num(settings, key) {
  const f = FIELDS[key];
  const v = parseFloat(settings[key]);
  if (isNaN(v)) return f.def;
  return f.min === undefined ? v : Math.max(f.min, v);
}
