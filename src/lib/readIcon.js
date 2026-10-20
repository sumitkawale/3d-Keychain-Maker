
export async function readIcon(f) {
  const n = f.name;
  const ext = (n.split('.').pop() || '').toLowerCase();
  if (ext === 'stl') return { type: 'stl', name: n, data: await f.arrayBuffer() };
  if (ext === 'png') {
    const { pngGrid } = await import('./geometryCore.js');
    return { type: 'png', name: n, data: await pngGrid(f) };
  }
  if (ext === 'svg' || ext === 'obj') return { type: ext, name: n, data: await f.text() };
  return null;
}
