import { numericDefault, numericMin } from './defaults/numeric.js';

export const PI = Math.PI;
export const R = 8;

export const SLIDER_FIELDS = [
  ['pad', 'Padding / contour offset (mm)', numericMin('pad'), 30, numericDefault('pad'), 0.5],
  ['baseT', 'Base thickness (mm)', numericMin('baseT'), 10, numericDefault('baseT'), 0.2],
  ['rel', 'Border height (mm)', numericMin('rel'), 8, numericDefault('rel'), 0.2],
  ['bord', 'Border width (mm)', numericMin('bord'), 10, numericDefault('bord'), 0.2],
  ['gap', 'Space between components (mm)', numericMin('gap'), 50, numericDefault('gap'), 0.5],
];

export const RING_FIELDS = [
  ['hole', 'Inner hole size (mm)', numericMin('hole'), 30, numericDefault('hole'), 0.5],
  ['osz', 'Outer shape size (mm)', numericMin('osz'), 60, numericDefault('osz'), 0.5],
];

export const RING_NUMBER_IDS = [
  'rpt', 'rpb', 'rpl', 'rpr', 'rhl', 'rhr', 'rth', 'rmt', 'rmb', 'rml', 'rmr',
];

export const BORDER_POSITIONS = [
  ['tl', 'Top left'],
  ['tc', 'Top center'],
  ['tr', 'Top right'],
  ['lc', 'Left center'],
  ['rc', 'Right center'],
  ['bl', 'Bottom left'],
  ['bc', 'Bottom center'],
  ['br', 'Bottom right'],
];

export const PALETTE = ['#ffffff', '#ffd23f', '#ff6b6b', '#2ec4b6', '#111111'];

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

export function flat(a) {
  return a.flatMap((n) => (n.kids ? [n, ...n.kids] : [n]));
}

export function cloneComponents(a) {
  return a.map((c) => ({
    ...c,
    ...(c.kids ? { kids: c.kids.map((k) => ({ ...k })) } : {}),
  }));
}
