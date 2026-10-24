import { PALETTE } from '../lib/constants.js';

let uid = 1;
export const nextId = () => ++uid;

/** Flattens the component tree (top-level items, groups and their children). */
export const flat = (list) => list.flatMap((n) => (n.kids ? [n, ...n.kids] : [n]));

export const findNode = (list, id) => flat(list).find((n) => n.id === id);

/** Creates an item with the default look for main components or border items. */
export function makeItem(c, border = false) {
  const id = nextId();
  return {
    id,
    size: border ? (c.type === 'text' ? 6 : 8) : 12,
    height: 1.2,
    color: c.type === 'text' ? '#ffffff' : PALETTE[id % PALETTE.length],
    recolor: false,
    pos: 'tl',
    rot: 0,
    pt: 0, pb: 0, pl: 0, pr: 0,
    fshape: 'auto', ob: 'base', obw: 1.2, obc: '#ffffff',
    ...c,
  };
}

export function makeGroup(count) {
  return { id: nextId(), type: 'group', name: `Group ${count + 1}`, dir: 'v', gap: 1.5, kids: [] };
}

export function defaultComps() {
  return [{ id: nextId(), type: 'text', text: 'Your Name', font: 'Roboto Slab', size: 12, height: 1.2, color: '#ffffff' }];
}

/** Returns a new list where the node with this id has been patched (works inside groups too). */
export function patchNode(list, id, patch) {
  return list.map((n) => {
    if (n.id === id) return { ...n, ...patch };
    if (n.kids) return { ...n, kids: n.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)) };
    return n;
  });
}

export function removeNode(list, id) {
  return list
    .filter((n) => n.id !== id)
    .map((n) => (n.kids ? { ...n, kids: n.kids.filter((k) => k.id !== id) } : n));
}

/** Inserts a node into the root list ('root') or into a group at the given index. */
export function insertNode(list, container, index, node) {
  if (container === 'root') {
    const next = [...list];
    next.splice(Math.min(index, next.length), 0, node);
    return next;
  }
  return list.map((n) => {
    if (n.id !== container) return n;
    const kids = [...n.kids];
    kids.splice(Math.min(index, kids.length), 0, node);
    return { ...n, kids };
  });
}

/** Where a node currently lives: {container, index}. */
export function locate(list, id) {
  const i = list.findIndex((n) => n.id === id);
  if (i >= 0) return { container: 'root', index: i };
  for (const n of list) {
    const k = n.kids ? n.kids.findIndex((x) => x.id === id) : -1;
    if (k >= 0) return { container: n.id, index: k };
  }
  return null;
}
