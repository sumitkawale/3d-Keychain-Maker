import { DEFAULT_SETTINGS } from './constants.js';
import { getKv, listPresets } from './db.js';

/** Defaults for newly added components, which a settings preset can change. */
export const BUILTIN_ITEM_DEFAULTS = {
  textSize: 12,
  iconSize: 12,
  borderTextSize: 6,
  borderIconSize: 8,
  height: 1.2,
  textColor: '#ffffff',
  textFont: 'Roboto Slab',
};

/** Keys of a preset's settings. The keychain name belongs to a project, not to a preset. */
export const PRESET_KEYS = Object.keys(DEFAULT_SETTINGS).filter((k) => k !== 'kname');

export const pickSettings = (settings) => Object.fromEntries(PRESET_KEYS.map((k) => [k, settings[k] ?? DEFAULT_SETTINGS[k]]));

/** True when two settings objects have the same preset values (project name ignored). */
export const sameSettings = (a, b) => PRESET_KEYS.every((k) => String(a[k]) === String(b[k]));

export const newPresetId = () => {
  const bytes = new Uint8Array(4);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
  return `ST-${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

/* The defaults new work starts from: the built-in ones, or the preset chosen as default. */
let defaults = { settings: { ...DEFAULT_SETTINGS }, items: { ...BUILTIN_ITEM_DEFAULTS } };
/* Item defaults for this session only (a preset tried with "Use now"). */
let sessionItems = null;

export const getDefaultSettings = () => ({ ...defaults.settings });
export const getItemDefaults = () => sessionItems || defaults.items;
export const itemDefaultsOf = (preset) => ({ ...BUILTIN_ITEM_DEFAULTS, ...(preset && preset.itemDefaults) });

export function setDefaultPreset(preset) {
  defaults = preset
    ? { settings: { ...DEFAULT_SETTINGS, ...preset.settings, kname: '' }, items: itemDefaultsOf(preset) }
    : { settings: { ...DEFAULT_SETTINGS }, items: { ...BUILTIN_ITEM_DEFAULTS } };
}
export const setSessionItemDefaults = (items) => { sessionItems = items; };

let initPromise = null;
/** Loads the chosen default preset once, before the first project is created. */
export function initPresetDefaults() {
  if (!initPromise) {
    initPromise = (async () => {
      const id = await getKv('defaultPresetId');
      if (id) {
        const preset = (await listPresets()).find((p) => p.id === id);
        if (preset) setDefaultPreset(preset);
      }
    })();
  }
  return initPromise;
}

/* ---- settings files, for moving presets between devices ---- */
const APP_ID = '3d-keychain-maker';

export const serializePresets = (presets) => JSON.stringify({
  app: APP_ID,
  kind: 'settings',
  version: 1,
  presets: presets.map((p) => ({ id: p.id, name: p.name, settings: p.settings, itemDefaults: p.itemDefaults })),
}, null, 1);

/** Parses a settings file; throws a readable error if it is not one of ours. */
export function parsePresetFile(text) {
  let o;
  try { o = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  if (!o || o.app !== APP_ID || o.kind !== 'settings' || !Array.isArray(o.presets) || !o.presets.length) {
    throw new Error('This is not a 3D Keychain Maker settings file.');
  }
  return o.presets.map((p) => ({
    id: p.id || null,
    name: String(p.name || 'Imported settings'),
    settings: pickSettings({ ...DEFAULT_SETTINGS, ...p.settings }),
    itemDefaults: itemDefaultsOf(p),
  }));
}
