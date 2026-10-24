import { DEFAULT_SETTINGS } from '../lib/constants.js';
import { defaultComps, findNode, insertNode, locate, makeGroup, makeItem, patchNode, removeNode } from './tree.js';

const HISTORY_LIMIT = 100;
const COALESCE_MS = 800;

export function initialState() {
  return {
    present: { comps: defaultComps(), bic: [], settings: { ...DEFAULT_SETTINGS } },
    past: [],
    future: [],
    last: { key: null, t: 0 },
  };
}

/** Pushes the current state onto the undo stack, merging rapid edits to the same field. */
function commit(state, present, key = null) {
  const now = Date.now();
  const merge = key && state.last.key === key && now - state.last.t < COALESCE_MS;
  return {
    present,
    past: merge ? state.past : [...state.past, state.present].slice(-HISTORY_LIMIT),
    future: [],
    last: { key, t: now },
  };
}

export function reducer(state, a) {
  const p = state.present;
  switch (a.type) {
    case 'setting':
      return commit(state, { ...p, settings: { ...p.settings, [a.key]: a.value } }, a.coalesce ? `s:${a.key}` : null);

    case 'patch': {
      const border = p.bic.some((n) => n.id === a.id);
      const next = border ? { ...p, bic: patchNode(p.bic, a.id, a.patch) } : { ...p, comps: patchNode(p.comps, a.id, a.patch) };
      return commit(state, next, a.coalesce ? `n:${a.id}:${Object.keys(a.patch).join(',')}` : null);
    }

    case 'addItem': {
      const item = makeItem(a.item, a.border);
      if (a.border) return commit(state, { ...p, bic: [...p.bic, item] });
      if (a.parentId != null) return commit(state, { ...p, comps: insertNode(p.comps, a.parentId, 1e9, item) });
      return commit(state, { ...p, comps: [...p.comps, item] });
    }

    case 'addGroup':
      return commit(state, { ...p, comps: [...p.comps, makeGroup(p.comps.filter((n) => n.type === 'group').length)] });

    case 'remove':
      return commit(state, { ...p, comps: removeNode(p.comps, a.id), bic: p.bic.filter((n) => n.id !== a.id) });

    case 'move': {
      const node = findNode(p.comps, a.id);
      const from = locate(p.comps, a.id);
      if (!node || !from) return state;
      if (node.type === 'group' && a.container !== 'root') return state;
      if (from.container === a.container && from.index === a.index) return state;
      const comps = insertNode(removeNode(p.comps, a.id), a.container, a.index, node);
      const present = { ...p, comps };
      // One undo step per drag: only the first move of a drag records history.
      return a.first ? commit(state, present) : { ...state, present };
    }

    case 'clear':
      return commit(state, { comps: defaultComps(), bic: [], settings: { ...DEFAULT_SETTINGS } });

    case 'undo': {
      if (!state.past.length) return state;
      const past = state.past.slice(0, -1);
      return { present: state.past[state.past.length - 1], past, future: [state.present, ...state.future], last: { key: null, t: 0 } };
    }

    case 'redo': {
      if (!state.future.length) return state;
      return { present: state.future[0], past: [...state.past, state.present], future: state.future.slice(1), last: { key: null, t: 0 } };
    }

    default:
      return state;
  }
}
