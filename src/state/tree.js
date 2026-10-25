import { PALETTE } from '../lib/constants.js';

let uid = 1;
export const nextId = () => ++uid;

/** Flattens the component tree (items and groups at every depth). */
export const flat = (list) => list.flatMap((n) => (n.kids ? [n, ...flat(n.kids)] : [n]));

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

/** Returns a new list where the node with this id has been patched (at any depth). */
export function patchNode(list, id, patch) {
  return list.map((n) => {
    if (n.id === id) return { ...n, ...patch };
    return n.kids ? { ...n, kids: patchNode(n.kids, id, patch) } : n;
  });
}

export function removeNode(list, id) {
  return list.filter((n) => n.id !== id).map((n) => (n.kids ? { ...n, kids: removeNode(n.kids, id) } : n));
}

/** Inserts a node into the root list ('root') or into a group (at any depth) at the given index. */
export function insertNode(list, container, index, node) {
  if (container === 'root') {
    const next = [...list];
    next.splice(Math.min(index, next.length), 0, node);
    return next;
  }
  return list.map((n) => {
    if (n.id === container) {
      const kids = [...n.kids];
      kids.splice(Math.min(index, kids.length), 0, node);
      return { ...n, kids };
    }
    return n.kids ? { ...n, kids: insertNode(n.kids, container, index, node) } : n;
  });
}

/** Where a node currently lives: {container, index}. */
export function locate(list, id, container = 'root') {
  const i = list.findIndex((n) => n.id === id);
  if (i >= 0) return { container, index: i };
  for (const n of list) {
    const r = n.kids ? locate(n.kids, id, n.id) : null;
    if (r) return r;
  }
  return null;
}
