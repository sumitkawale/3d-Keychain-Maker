import { buildKeychain } from './buildKeychain.js';
import { DEFAULT_SETTINGS } from './constants.js';
import { getProject, putProject } from './db.js';
import { getFontInputs, restoreFonts } from './fonts.js';
import { renderThumbnail } from './thumbnail.js';

/** The part of the app state that makes up a project (what gets saved, shared and restored). */
export const snapshotProject = ({ comps, bic, settings }) => ({ comps, bic, settings, fonts: getFontInputs() });

/** A short unique id for a keychain, e.g. KC-7F3A9C2B. */
export function newProjectId() {
  const bytes = new Uint8Array(4);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
  return `KC-${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** Id as shown to people (older entries that used long ids get a short, stable form). */
export const displayId = (id) => (/^KC-/.test(id) ? id : `KC-${String(id).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}`);

/**
 * Saves a project under its id: a new id creates an entry, an existing id updates that entry
 * (new name, data and preview) instead of adding a duplicate.
 */
export async function saveProject({ id, name, data }) {
  await restoreFonts(data.fonts);
  const { group } = await buildKeychain({ comps: data.comps, bic: data.bic || [], settings: { ...DEFAULT_SETTINGS, ...data.settings } });
  const thumb = renderThumbnail(group);
  group.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
  const finalId = id || newProjectId();
  const existing = await getProject(finalId);
  const project = {
    id: finalId,
    name: name || 'Untitled keychain',
    createdAt: existing ? existing.createdAt || existing.savedAt : Date.now(),
    savedAt: Date.now(),
    data,
    thumb,
  };
  await putProject(project);
  return { project, updated: !!existing };
}

export const fileSlug = (name) => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'keychain';
