import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { buildKeychain } from '../lib/buildKeychain.js';
import { useFonts } from '../lib/fonts.js';
import { initialState, reducer } from './reducer.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

function disposeGroup(group) {
  group.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
}

/** Holds the editable keychain state (with undo/redo) and the 3D model built from it. */
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [model, setModel] = useState(null);
  const fonts = useFonts();
  const { present } = state;

  const actions = useMemo(() => ({
    setSetting: (key, value, coalesce = false) => dispatch({ type: 'setting', key, value, coalesce }),
    patchNode: (id, patch, coalesce = false) => dispatch({ type: 'patch', id, patch, coalesce }),
    addItem: (item, opts = {}) => dispatch({ type: 'addItem', item, border: !!opts.border, parentId: opts.parentId }),
    addGroup: () => dispatch({ type: 'addGroup' }),
    removeNode: (id) => dispatch({ type: 'remove', id }),
    moveNode: (id, container, index, first) => dispatch({ type: 'move', id, container, index, first }),
    clear: () => dispatch({ type: 'clear' }),
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
  }), []);

  // Rebuild the 3D model shortly after any change (or when a new font becomes available).
  useEffect(() => {
    let dead = false;
    const t = setTimeout(async () => {
      const result = await buildKeychain(present);
      if (dead) disposeGroup(result.group);
      else setModel(result);
    }, 150);
    return () => { dead = true; clearTimeout(t); };
  }, [present, fonts]);

  // Ctrl/Cmd+Z undo, Ctrl+Y or Ctrl+Shift+Z redo (ignored while typing in a text/number field).
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && /text|number/.test(t.type))) return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); actions[e.shiftKey ? 'redo' : 'undo'](); }
      else if (k === 'y') { e.preventDefault(); actions.redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions]);

  const value = useMemo(() => ({
    comps: present.comps,
    bic: present.bic,
    settings: present.settings,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    model,
    actions,
  }), [present, state.past.length, state.future.length, model, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
