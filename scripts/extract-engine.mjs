import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lines = fs.readFileSync(path.join(root, 'src/lib/_legacyApp.js'), 'utf8').split('\n');

const header = `import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { PI, R } from './constants.js';

`;

let geom = lines.slice(37, 170).join('\n');
geom = geom.replace(/new THREE\.SVGLoader\(\)/g, 'new SVGLoader()');
geom = geom.replace(/THREE\.SVGLoader\.createShapes/g, 'SVGLoader.createShapes');

const exportsList = [
  'trace', 'simp', 'split', 'toShapes', 'mask', 'grid', 'tr', 'pp',
  'textOutlines', 'X', 'V', 'svgGeo', 'stlGeo', 'objGeo', 'flipGeo', 'pngGeo', 'pngGrid',
  'poly', 'ringShape', 'gen', 'gen0', 'hull', 'mk', 'edge', 'merge', 'PS', 'inHull',
];
fs.writeFileSync(
  path.join(root, 'src/lib/geometryCore.js'),
  header +
    geom +
    '\n\nexport {\n  ' +
    exportsList.join(',\n  ') +
    '\n};\n',
);

let build = lines.slice(171, 242).join('\n');
build = build.replace('async function build()', 'export async function buildModel(grp, ui, comps, bic, getFcss, ctx)');

const oLine =
  "const o=Object.fromEntries([...S1.map(x=>x[0]),...S2.map(x=>x[0]),...S3].map(k=>[k,val(k)]));type=$('shape').value,vert=$('dir').value=='v',bs=$('bs').value,cd=$('cd').value;";
build = build.replace(
  oLine,
  "const { buildNumericSettings } = await import('./settings.js'); const o = buildNumericSettings(ui); const type=ui.shape,vert=ui.dir==='v',bs=ui.bs,cd=ui.cd;",
);

build = build.replace(/\$\('cs'\)\.value/g, 'ui.cs');
build = build.replace(/\$\('cb'\)\.value/g, 'ui.cb');
build = build.replace(/\$\('fillb'\)\.checked/g, 'ui.fillb');
build = build.replace(/\$\('rso'\)\.value/g, 'ui.rso');
build = build.replace(/\$\('rsi'\)\.value/g, 'ui.rsi');
build = build.replace(/\$\('rslope'\)\.checked/g, 'ui.rslope');
build = build.replace(/\$\('cr'\)\.value/g, 'ui.cr');
build = build.replace(/parseFloat\(\$\('rro'\)\.value\)/g, 'parseFloat(ui.rro)');
build = build.replace(/parseFloat\(\$\('rri'\)\.value\)/g, 'parseFloat(ui.rri)');
build = build.replace(/\$\('info'\)\.textContent=/g, 'ctx.setInfo(');
build = build.replace(/\$\('slopebox'\)\.hidden=!\$\('rslope'\)\.checked;/, 'ctx.setSlopeHidden(!ui.rslope);');
build = build.replace(/\$\('dims'\)\.textContent=ds;\$\('dims2'\)\.textContent=ds/, 'ctx.setDims(ds)');
build = build.replace(/clearTimeout\(ct\);ct=setTimeout\(commit,500\);/, '');
build = build.replace(
  /if\(first\)\{first=false;rad=clamp\(Math\.max\(hx,hy\)\*4\.4\+20\)\}/,
  'if(ctx.firstFit){ctx.firstFit=false;ctx.setRad(ctx.clamp(Math.max(hx,hy)*4.4+20))}',
);
build = build.replace(/document\.fonts\.load\(fcss\(c\.font\)/g, 'document.fonts.load(getFcss(c.font)');
build = build.replace(/ let first=true,bt=0;\n/, ' let bt=0;\n');
build = build.replace(/ draw\(\);\n\}/, ' ctx.draw();\n return { dims: ds };\n}');

const buildHeader = `import { flat } from './constants.js';
import {
  gen, mask, tr, toShapes, mk, ringShape, merge, PS, edge, inHull, X,
} from './geometryCore.js';
import * as THREE from 'three';

const clamp = (r) => Math.min(600, Math.max(15, r));

`;

build = buildHeader + build;
fs.writeFileSync(path.join(root, 'src/lib/buildModel.js'), build);

// export.js from legacy 337-410 + meshTris 346
let exp = lines.slice(336, 410).join('\n');
exp = exp.replace(/\$\('dl'\)\.onclick=async\(\)=>\{[\s\S]*?\};\n?$/, '');
exp = `import * as THREE from 'three';
import { flat } from './constants.js';

${exp}

export async function downloadExport(grp, ui, comps, setInfo) {
  grp.updateMatrixWorld(true);
  const by = new Map();
  grp.children.forEach((m) => {
    const h = m.material.color.getHexString();
    if (!by.has(h)) by.set(h, []);
    by.get(h).push(m);
  });
  const t = flat(comps).find((c) => c.type === 'text');
  const sl = (s) =>
    String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  const slug = sl(ui.kname) || sl(t && t.text.split('\\n')[0]) || 'keychain';
  const files = [];
  const f = ui.fmt;
  if (f === '3mf') files.push({ name: slug + '.3mf', data: mf3b(by, slug) });
  else if (f === 'obj') {
    const r = objOf(by, slug);
    files.push({ name: slug + '.obj', data: enc(r.obj) }, { name: slug + '.mtl', data: enc(r.mtl) });
  } else {
    files.push({ name: slug + '.stl', data: stlOf(meshTris(grp.children)) });
    if (by.size > 1)
      for (const [h, ms] of by)
        files.push({ name: \`\${slug}-colour-parts/\${slug}-\${h}.stl\`, data: stlOf(meshTris(ms)) });
  }
  const data = zipMulti(files);
  let dls = null;
  try {
    dls = window.claude && (await claude.use('downloads'));
  } catch (e) {}
  try {
    if (dls) await dls.save({ filename: slug + '.zip', data });
    else {
      const u = URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = u;
      a.download = slug + '.zip';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 4000);
    }
  } catch (e) {
    if (e.code !== 'declined') setInfo('Could not save: ' + (e.message || e.code));
  }
}
`;

fs.writeFileSync(path.join(root, 'src/lib/export.js'), exp);

// readIcon
const readIcon = `
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
`;
fs.writeFileSync(path.join(root, 'src/lib/readIcon.js'), readIcon);

console.log('Extracted geometryCore, buildModel, export, readIcon');
