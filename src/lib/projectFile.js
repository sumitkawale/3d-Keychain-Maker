/* Project files: plain JSON (binary icon data is stored as base64) so they can be shared and re-opened. */
const APP_ID = '3d-keychain-maker';

function toBase64(bytes) {
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  return btoa(s);
}

function fromBase64(text) {
  const s = atob(text);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function serializeProject(name, project) {
  return JSON.stringify({ app: APP_ID, version: 1, name, savedAt: Date.now(), project }, (k, v) => {
    if (v instanceof ArrayBuffer) return { __t: 'ab', b: toBase64(new Uint8Array(v)) };
    if (ArrayBuffer.isView(v)) return { __t: 'u8', b: toBase64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
    return v;
  }, 1);
}

/** Parses a project file; throws a readable error if it is not one of ours. */
export function parseProjectFile(text) {
  let o;
  try {
    o = JSON.parse(text, (k, v) => {
      if (v && v.__t === 'ab') return fromBase64(v.b).buffer;
      if (v && v.__t === 'u8') return fromBase64(v.b);
      return v;
    });
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!o || o.app !== APP_ID || !o.project || !Array.isArray(o.project.comps) || !Array.isArray(o.project.bic || [])) {
    throw new Error('This is not a 3D Keychain Maker project file.');
  }
  return { name: o.name || 'Imported keychain', project: { ...o.project, bic: o.project.bic || [] } };
}
