/* Tiny IndexedDB wrapper. IndexedDB stores binary data (STL/PNG icons) directly, which localStorage cannot. */
const DB_NAME = 'keychain-maker';
const DB_VERSION = 2;
let dbPromise = null;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/* Auto-saved working copy, restored after a refresh. Failures (e.g. private mode) are ignored. */
export const loadDraft = () => run('kv', 'readonly', (s) => s.get('draft')).catch(() => null);
export const saveDraft = (draft) => run('kv', 'readwrite', (s) => s.put(draft, 'draft')).catch(() => {});

/* Named projects shown on the History page. */
export const listProjects = () => run('projects', 'readonly', (s) => s.getAll())
  .then((all) => all.sort((a, b) => b.savedAt - a.savedAt))
  .catch(() => []);
export const getProject = (id) => run('projects', 'readonly', (s) => s.get(id)).catch(() => null);
export const putProject = (project) => run('projects', 'readwrite', (s) => s.put(project));
export const deleteProject = (id) => run('projects', 'readwrite', (s) => s.delete(id));

/* Named settings presets (the Settings page) and small settings such as which preset is the default. */
export const listPresets = () => run('presets', 'readonly', (s) => s.getAll())
  .then((all) => all.sort((a, b) => b.updatedAt - a.updatedAt))
  .catch(() => []);
export const putPreset = (preset) => run('presets', 'readwrite', (s) => s.put(preset));
export const deletePreset = (id) => run('presets', 'readwrite', (s) => s.delete(id));
export const getKv = (key) => run('kv', 'readonly', (s) => s.get(key)).catch(() => null);
export const setKv = (key, value) => run('kv', 'readwrite', (s) => s.put(value, key)).catch(() => {});
