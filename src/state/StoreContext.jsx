import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { buildKeychain } from '../lib/buildKeychain.js';
import { loadDraft, saveDraft } from '../lib/db.js';
import { restoreFonts, useFonts } from '../lib/fonts.js';
import { snapshotProject } from '../lib/library.js';
import { initialState, reducer } from './reducer.js';
import { syncIdCounter } from './tree.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

function disposeGroup(group) {
  group.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
}

/** Holds the editable keychain state (with undo/redo) and the 3D model built from it. */
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [model, setModel] = useState(null);
  const [ready, setReady] = useState(false);
  const fonts = useFonts();
  const { present } = state;

  const actions = useMemo(() => ({
    setSetting: (key, value, coalesce = false) => dispatch({ type: 'setting', key, value, coalesce }),
    patchNode: (id, patch, coalesce = false) => dispatch({ type: 'patch', id, patch, coalesce }),
    addItem: (item, opts = {}) => dispatch({ type: 'addItem', item, border: !!opts.border, parentId: opts.parentId }),
    addGroup: (parentId) => dispatch({ type: 'addGroup', parentId }),
    removeNode: (id) => dispatch({ type: 'remove', id }),
    moveNode: (id, container, index, first) => dispatch({ type: 'move', id, container, index, first }),
    clear: () => dispatch({ type: 'clear' }),
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
  }), []);

  /** Replaces the editor content with a saved project (one undo step unless `silent`). */
  const loadProject = useCallback(async (data, silent = false) => {
    await restoreFonts(data.fonts);
    syncIdCounter(data.comps, data.bic);
    dispatch({ type: 'load', silent, present: { comps: data.comps, bic: data.bic || [], settings: data.settings } });
  }, []);

  // Restore the auto-saved working copy once, so edits survive refreshes.
  useEffect(() => {
    let dead = false;
    loadDraft().then(async (draft) => {
      if (draft && Array.isArray(draft.comps) && !dead) await loadProject(draft, true);
    }).finally(() => { if (!dead) setReady(true); });
    return () => { dead = true; };
  }, [loadProject]);

  // Auto-save the working copy shortly after every change (only after the saved copy has been restored).
  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => saveDraft(snapshotProject(present)), 400);
    return () => clearTimeout(t);
  }, [present, ready, fonts]);

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
    ready,
    loadProject,
    actions,
  }), [present, state.past.length, state.future.length, model, ready, loadProject, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
