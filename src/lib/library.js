import { buildKeychain } from './buildKeychain.js';
import { DEFAULT_SETTINGS } from './constants.js';
import { putProject } from './db.js';
import { getFontInputs, restoreFonts } from './fonts.js';
import { renderThumbnail } from './thumbnail.js';

/** The part of the app state that makes up a project (what gets saved, shared and restored). */
export const snapshotProject = ({ comps, bic, settings }) => ({ comps, bic, settings, fonts: getFontInputs() });

const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/** Builds a preview of the project and stores it in the browser's history. */
export async function createProject(name, data) {
  await restoreFonts(data.fonts);
  const { group } = await buildKeychain({ comps: data.comps, bic: data.bic || [], settings: { ...DEFAULT_SETTINGS, ...data.settings } });
  const thumb = renderThumbnail(group);
  group.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
  const project = { id: newId(), name: name || 'Untitled keychain', savedAt: Date.now(), data, thumb };
  await putProject(project);
  return project;
}

export const fileSlug = (name) => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'keychain';
