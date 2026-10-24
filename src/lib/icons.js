import { pngGrid } from './geometry.js';

/** Reads an uploaded SVG / PNG / STL / OBJ file into the data a component needs. */
export async function readIcon(f) {
  const n = f.name;
  const ext = (n.split('.').pop() || '').toLowerCase();
  if (ext === 'stl') return { type: 'stl', name: n, data: await f.arrayBuffer() };
  if (ext === 'png') return { type: 'png', name: n, data: await pngGrid(f) };
  if (ext === 'svg' || ext === 'obj') return { type: ext, name: n, data: await f.text() };
  return null;
}
