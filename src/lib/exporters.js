import * as THREE from 'three';
import { flat } from '../state/tree.js';

/* Export helpers: zip writer, STL, OBJ+MTL and 3MF (with slicer filament numbers). */
const CT=(()=>{const T=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}return T})();
export function zipMulti(fs){
 const enc=new TextEncoder(),es=fs.map(f=>{let c=0xFFFFFFFF;for(let i=0;i<f.data.length;i++)c=CT[(c^f.data[i])&255]^(c>>>8);return{nm:enc.encode(f.name),d:f.data,crc:(c^0xFFFFFFFF)>>>0}});
 let tot=22,off=0;es.forEach(e=>{e.off=off;off+=30+e.nm.length+e.d.length;tot+=30+e.nm.length+e.d.length+46+e.nm.length});
 const out=new Uint8Array(tot),dv=new DataView(out.buffer),w16=(o,v)=>dv.setUint16(o,v,true),w32=(o,v)=>dv.setUint32(o,v,true);let o=0;
 es.forEach(e=>{w32(o,0x04034b50);w16(o+4,20);w16(o+12,0x21);w32(o+14,e.crc);w32(o+18,e.d.length);w32(o+22,e.d.length);w16(o+26,e.nm.length);out.set(e.nm,o+30);out.set(e.d,o+30+e.nm.length);o+=30+e.nm.length+e.d.length});
 const cs=o;es.forEach(e=>{w32(o,0x02014b50);w16(o+4,20);w16(o+6,20);w16(o+14,0x21);w32(o+16,e.crc);w32(o+20,e.d.length);w32(o+24,e.d.length);w16(o+28,e.nm.length);w32(o+42,e.off);out.set(e.nm,o+46);o+=46+e.nm.length});
 w32(o,0x06054b50);w16(o+8,es.length);w16(o+10,es.length);w32(o+12,o-cs);w32(o+16,cs);return out}
export function meshTris(ms){const tr=[],v=new THREE.Vector3();ms.forEach(m=>{const g=m.geometry,p=g.attributes.position,ix=g.index,n=ix?ix.count:p.count;for(let i=0;i<n;i+=3)tr.push([0,1,2].map(j=>v.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).clone().applyMatrix4(m.matrixWorld)))});return tr}
export function stlOf(tr){const buf=new ArrayBuffer(84+tr.length*50),dv=new DataView(buf);dv.setUint32(80,tr.length,true);
 tr.forEach((t,i)=>{const nr=new THREE.Vector3().subVectors(t[1],t[0]).cross(new THREE.Vector3().subVectors(t[2],t[0])).normalize(),o=84+i*50;[nr,...t].forEach((q,j)=>{dv.setFloat32(o+j*12,q.x||0,true);dv.setFloat32(o+j*12+4,q.y||0,true);dv.setFloat32(o+j*12+8,q.z||0,true)})});return new Uint8Array(buf)}
const enc=s=>new TextEncoder().encode(s);
export function objOf(by,name){const vs=[],fl=[],f4=n=>n.toFixed(4);let mt='',base=0;
 by.forEach((ms,h)=>{const col=[0,2,4].map(i=>(parseInt(h.slice(i,i+2),16)/255).toFixed(4)).join(' '),vm=new Map();
  mt+=`newmtl c${h}\nKa ${col}\nKd ${col}\nKs 0.0 0.0 0.0\nd 1.0\nillum 1\n\n`;fl.push(`o colour-${h}`,`usemtl c${h}`,'s off');
  const vi=q=>{const k=f4(q.x)+' '+f4(q.y)+' '+f4(q.z);let n=vm.get(k);if(n===undefined){n=vm.size;vm.set(k,n);vs.push(`v ${k} ${col}`)}return base+n+1};
  meshTris(ms).forEach(t=>{const a=vi(t[0]),b=vi(t[1]),c=vi(t[2]);if(a!=b&&b!=c&&a!=c)fl.push(`f ${a} ${b} ${c}`)});base+=vm.size});
 return{obj:`# colours: see ${name}.mtl (also stored as per-vertex r g b)\nmtllib ${name}.mtl\n${vs.join('\n')}\n${fl.join('\n')}\n`,mtl:mt}}
export function mf3b(by,name){
 const H='<?xml version="1.0" encoding="UTF-8"?>',f4=n=>n.toFixed(4),cols=[...by.keys()],vs=[],ts=[],vols=[];
 cols.forEach((h,ci)=>{const vm=new Map(),first=ts.length,vi=q=>{const k=f4(q.x)+' '+f4(q.y)+' '+f4(q.z);let n=vm.get(k);if(n===undefined){n=vs.length;vm.set(k,n);vs.push(`<vertex x="${f4(q.x)}" y="${f4(q.y)}" z="${f4(q.z)}"/>`)}return n};
  meshTris(by.get(h)).forEach(t=>{const a=vi(t[0]),b=vi(t[1]),c=vi(t[2]);if(a!=b&&b!=c&&a!=c)ts.push(`<triangle v1="${a}" v2="${b}" v3="${c}" pid="1" p1="${ci}"/>`)});vols.push({h,first,last:ts.length-1,e:ci+1})});
 const model=H+`<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><basematerials id="1">${cols.map(h=>`<base name="#${h}" displaycolor="#${h.toUpperCase()}"/>`).join('')}</basematerials><object id="2" type="model" name="${name}"><mesh><vertices>${vs.join('')}</vertices><triangles>${ts.join('')}</triangles></mesh></object></resources><build><item objectid="2"/></build></model>`;
 const cfg=H+`<config><object id="2" instances_count="1"><metadata type="object" key="name" value="${name}"/>${vols.map(v=>`<volume firstid="${v.first}" lastid="${v.last}"><metadata type="volume" key="name" value="colour-${v.h}"/><metadata type="volume" key="volume_type" value="ModelPart"/><metadata type="volume" key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/><metadata type="volume" key="extruder" value="${v.e}"/><mesh edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/></volume>`).join('')}</object></config>`;
 return zipMulti([{name:'[Content_Types].xml',data:enc(H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="text/xml"/></Types>')},
  {name:'_rels/.rels',data:enc(H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')},
  {name:'3D/3dmodel.model',data:enc(model)},{name:'Metadata/Slic3r_PE_model.config',data:enc(cfg)}])}

/** Builds the files for the chosen format and returns {slug, files}. */
export function buildExportFiles(group, settings, comps) {
  group.updateMatrixWorld(true);
  const by = new Map();
  group.children.forEach((m) => {
    const h = m.material.color.getHexString();
    if (!by.has(h)) by.set(h, []);
    by.get(h).push(m);
  });
  const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const firstText = flat(comps).find((c) => c.type === 'text');
  const slug = clean(settings.kname) || clean(firstText && firstText.text.split('\n')[0]) || 'keychain';
  const files = [];
  if (settings.fmt === '3mf') {
    files.push({ name: slug + '.3mf', data: mf3b(by, slug) });
  } else if (settings.fmt === 'obj') {
    const r = objOf(by, slug);
    files.push({ name: slug + '.obj', data: enc(r.obj) }, { name: slug + '.mtl', data: enc(r.mtl) });
  } else {
    files.push({ name: slug + '.stl', data: stlOf(meshTris(group.children)) });
    if (by.size > 1) {
      for (const [h, ms] of by) files.push({ name: `${slug}-colour-parts/${slug}-${h}.stl`, data: stlOf(meshTris(ms)) });
    }
  }
  return { slug, files };
}

/** Saves bytes as a file through a normal browser download. */
export function downloadZip(data, filename) {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
