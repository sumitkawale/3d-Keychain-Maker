import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/ui/Dialog.jsx';
import { DEFAULT_SETTINGS } from '../lib/constants.js';
import { deletePreset, getKv, listPresets, putPreset, setKv } from '../lib/db.js';
import { downloadBlob } from '../lib/exporters.js';
import { setLastFont } from '../lib/fonts.js';
import { fileSlug } from '../lib/library.js';
import {
  BUILTIN_ITEM_DEFAULTS, getItemDefaults, itemDefaultsOf, newPresetId, parsePresetFile, pickSettings,
  sameSettings, serializePresets, setDefaultPreset, setSessionItemDefaults,
} from '../lib/presets.js';
import { useStore } from './StoreContext.jsx';

const PresetsContext = createContext(null);
export const usePresets = () => useContext(PresetsContext);

const SESSION_KEY = 'keychain.activePreset';
const readSession = () => { try { return window.sessionStorage.getItem(SESSION_KEY); } catch { return null; } };
const writeSession = (id) => {
  try {
    if (id) window.sessionStorage.setItem(SESSION_KEY, id);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch { /* storage unavailable */ }
};

const uniqueName = (name, presets) => {
  const taken = new Set(presets.map((p) => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  let n = 2;
  while (taken.has(`${name} (${n})`.toLowerCase())) n += 1;
  return `${name} (${n})`;
};

/**
 * Saved settings presets. They live in IndexedDB; the preset chosen as default is remembered there too, while
 * the preset being tried ("Use now") is remembered for this browser session only.
 */
export function PresetsProvider({ children }) {
  const { settings, actions: storeActions } = useStore();
  const [presets, setPresets] = useState([]);
  const [defaultId, setDefaultId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [ready, setReady] = useState(false);
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const refresh = useCallback(async () => {
    const list = await listPresets();
    setPresets(list);
    return list;
  }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      const list = await refresh();
      const d = await getKv('defaultPresetId');
      if (dead) return;
      setDefaultId(d && list.some((p) => p.id === d) ? d : null);
      const a = readSession();
      setActiveId(a && list.some((p) => p.id === a) ? a : null);
      setReady(true);
    })();
    return () => { dead = true; };
  }, [refresh]);

  const ask = useCallback((config) => new Promise((resolve) => {
    resolver.current = resolve;
    setDialog(config);
  }), []);
  const choose = (value) => {
    const r = resolver.current;
    resolver.current = null;
    setDialog(null);
    if (r) r(value);
  };

  const preset = useCallback((id) => presets.find((p) => p.id === id) || null, [presets]);
  const activePreset = preset(activeId);
  const defaultPreset = preset(defaultId);

  const select = useCallback((id) => { setActiveId(id); writeSession(id); }, []);

  // When the work matches the default setting and nothing else is selected, treat the default as the selected
  // one, so changing a value afterwards shows "modified" and "Update" targets it.
  useEffect(() => {
    if (ready && !activeId && defaultPreset && sameSettings(settings, defaultPreset.settings)) select(defaultPreset.id);
  }, [ready, activeId, defaultPreset, settings, select]);

  /** Puts a preset on the current work, for this session only. */
  const useNow = useCallback((id) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    storeActions.applySettings(p.settings);
    const items = itemDefaultsOf(p);
    setSessionItemDefaults(items);
    setLastFont(items.textFont);
    select(id);
  }, [presets, storeActions, select]);

  /** Puts the built-in (code) defaults on the current work. */
  const useBuiltin = useCallback(() => {
    storeActions.applySettings(pickSettings(DEFAULT_SETTINGS));
    setSessionItemDefaults({ ...BUILTIN_ITEM_DEFAULTS });
    setLastFont(BUILTIN_ITEM_DEFAULTS.textFont);
    select(null);
  }, [storeActions, select]);

  /** Switches the current work to whatever is the default setting. */
  const useDefault = useCallback(() => {
    if (defaultPreset) useNow(defaultPreset.id);
    else useBuiltin();
  }, [defaultPreset, useNow, useBuiltin]);

  /** Makes a preset the default for new keychains (does not touch the current work). */
  const setDefault = useCallback(async (id) => {
    const p = presets.find((x) => x.id === id) || null;
    await setKv('defaultPresetId', p ? p.id : null);
    setDefaultPreset(p);
    setDefaultId(p ? p.id : null);
  }, [presets]);

  /** Clears the active selection; the current values stay as they are. */
  const clearActive = useCallback(() => {
    setSessionItemDefaults(null);
    select(null);
  }, [select]);

  /**
   * Saves settings. mode "update" overwrites `targetId` (after a confirmation); mode "create" adds a new one,
   * asking what to do when the name is already used.
   */
  const save = useCallback(async ({ name, settings: values, itemDefaults, mode, targetId }) => {
    const nm = String(name || '').trim();
    if (!nm) return { ok: false, message: 'Give the settings a name first.' };
    let id = null;
    let finalName = nm;
    const byName = presets.find((p) => p.name.toLowerCase() === nm.toLowerCase());

    if (mode === 'update') {
      const cur = presets.find((p) => p.id === targetId);
      if (!cur) return { ok: false, message: 'That setting no longer exists.' };
      const renamed = nm !== cur.name ? ` It will also be renamed to “${nm}”.` : '';
      const choice = await ask({
        title: `Update “${cur.name}”?`,
        message: `This replaces its saved values with the current ones.${renamed}`,
        options: [{ value: 'yes', label: 'Update', primary: true }, { value: 'cancel', label: 'Cancel' }],
      });
      if (choice !== 'yes') return { ok: false, message: 'Not updated.' };
      id = cur.id;
      if (byName && byName.id !== cur.id) finalName = uniqueName(nm, presets);
    } else if (byName) {
      const choice = await ask({
        title: `“${byName.name}” already exists`,
        message: 'Overwrite the existing setting with these values, or create a new one with a different name?',
        options: [
          { value: 'overwrite', label: 'Overwrite it', danger: true },
          { value: 'new', label: 'Create new', primary: true },
          { value: 'cancel', label: 'Cancel' },
        ],
      });
      if (choice === 'cancel') return { ok: false, message: 'Not saved.' };
      if (choice === 'overwrite') id = byName.id;
      else finalName = uniqueName(nm, presets);
    }

    const existing = presets.find((p) => p.id === id);
    const saved = {
      id: id || newPresetId(),
      name: finalName,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
      settings: pickSettings(values),
      itemDefaults: { ...BUILTIN_ITEM_DEFAULTS, ...itemDefaults },
    };
    await putPreset(saved);
    await refresh();
    if (saved.id === defaultId) setDefaultPreset(saved);
    if (saved.id === activeId) { setSessionItemDefaults(itemDefaultsOf(saved)); }
    return { ok: true, preset: saved, message: `${id ? 'Updated' : 'Saved'} “${saved.name}”.` };
  }, [presets, defaultId, activeId, ask, refresh]);

  const remove = useCallback(async (id) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return false;
    const choice = await ask({
      title: `Delete “${p.name}”?`,
      message: id === defaultId ? 'This is the default setting. New keychains will go back to the built-in defaults.' : 'This cannot be undone.',
      options: [{ value: 'yes', label: 'Delete', danger: true }, { value: 'cancel', label: 'Cancel', primary: true }],
    });
    if (choice !== 'yes') return false;
    await deletePreset(id);
    if (id === defaultId) { await setKv('defaultPresetId', null); setDefaultPreset(null); setDefaultId(null); }
    if (id === activeId) { setSessionItemDefaults(null); select(null); }
    await refresh();
    return true;
  }, [presets, defaultId, activeId, ask, refresh, select]);

  const exportOne = useCallback((id) => {
    const p = presets.find((x) => x.id === id);
    if (p) downloadBlob(serializePresets([p]), `${fileSlug(p.name)}.keychain-settings.json`, 'application/json');
  }, [presets]);

  const exportAll = useCallback(() => {
    if (presets.length) downloadBlob(serializePresets(presets), 'keychain-settings-all.json', 'application/json');
  }, [presets]);

  /** Imports settings files; a preset whose id already exists can replace it or be kept as a new copy. */
  const importFiles = useCallback(async (files) => {
    let added = 0;
    let list = presets;
    for (const f of files) {
      let parsed;
      try { parsed = parsePresetFile(await f.text()); } catch (e) { return { ok: false, message: `${f.name}: ${e.message}` }; }
      for (const p of parsed) {
        let id = p.id && !list.some((x) => x.id === p.id) ? p.id : null;
        let name = p.name;
        const clash = p.id ? list.find((x) => x.id === p.id) : null;
        if (clash) {
          const choice = await ask({
            title: `“${clash.name}” is already saved`,
            message: `The file has a setting with the same ID (“${p.name}”). Replace the saved one, or import it as a new copy?`,
            options: [
              { value: 'replace', label: 'Replace', danger: true },
              { value: 'new', label: 'Import as new', primary: true },
              { value: 'cancel', label: 'Skip' },
            ],
          });
          if (choice === 'cancel') continue;
          if (choice === 'replace') id = clash.id;
        }
        if (!id || !list.some((x) => x.id === id)) name = uniqueName(name, list.filter((x) => x.id !== id));
        const existing = list.find((x) => x.id === id);
        const saved = {
          id: id || newPresetId(), name: existing ? p.name : name, createdAt: existing ? existing.createdAt : Date.now(), updatedAt: Date.now(),
          settings: p.settings, itemDefaults: p.itemDefaults,
        };
        await putPreset(saved);
        list = [saved, ...list.filter((x) => x.id !== saved.id)];
        if (saved.id === defaultId) setDefaultPreset(saved);
        added += 1;
      }
    }
    await refresh();
    return { ok: true, message: added ? `Imported ${added} setting${added > 1 ? 's' : ''}.` : 'Nothing was imported.' };
  }, [presets, defaultId, ask, refresh]);

  /* What the current work is using: the selected preset, the default, the built-in values, or custom values. */
  const info = useMemo(() => {
    if (activePreset) return { kind: 'preset', preset: activePreset, modified: !sameSettings(settings, activePreset.settings) };
    if (defaultPreset && sameSettings(settings, defaultPreset.settings)) return { kind: 'preset', preset: defaultPreset, modified: false };
    if (sameSettings(settings, DEFAULT_SETTINGS)) return { kind: 'builtin', modified: false };
    return { kind: 'custom', modified: true };
  }, [activePreset, defaultPreset, settings]);

  const value = useMemo(() => ({
    presets, defaultId, activeId, ready, activePreset, defaultPreset, info,
    currentItemDefaults: getItemDefaults,
    actions: { useNow, useBuiltin, useDefault, setDefault, clearActive, save, remove, exportOne, exportAll, importFiles, refresh, select },
  }), [presets, defaultId, activeId, ready, activePreset, defaultPreset, info, useNow, useBuiltin, useDefault, setDefault, clearActive, save, remove, exportOne, exportAll, importFiles, refresh, select]);

  return (
    <PresetsContext.Provider value={value}>
      {children}
      {dialog && <Dialog title={dialog.title} message={dialog.message} options={dialog.options} onChoose={choose} />}
    </PresetsContext.Provider>
  );
}
