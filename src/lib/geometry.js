import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { PI } from './constants.js';
import { trace, split, toShapes } from './raster.js';
import { fcss } from './fonts.js';

/* Geometry helpers: text/SVG/PNG/STL/OBJ to extruded geometry, base shapes, keyring shapes. */
export function textOutlines(txt,font,mm){
 const lines=txt.split('\n').filter(l=>l.trim()).slice(0,4);if(!lines.length)return null;
 const fs=280,pad=40,c=document.createElement('canvas'),x=c.getContext('2d');font=font.replace('140px','280px');
 x.font=font;let mw=0;lines.forEach(l=>mw=Math.max(mw,x.measureText(l).width));
 const lh=fs*1.15,W=Math.ceil(mw)+pad*2,H=Math.ceil(lh*lines.length)+pad*2;c.width=W;c.height=H;
 x.font=font;x.textAlign='center';x.textBaseline='middle';x.fillStyle='#000';
 lines.forEach((l,i)=>x.fillText(l,W/2,pad+lh*(i+.5)));
 const d=x.getImageData(0,0,W,H).data,g=new Uint8Array(W*H);
 for(let i=0;i<W*H;i++)g[i]=d[i*4+3];
 const L=trace(g,W,H);if(!L.length)return null;
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;split(L).outs.forEach(l=>l.p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}));
 const s=mm/fs;return{shapes:toShapes(L,s,-(x0+x1)/2*s,(y0+y1)/2*s,true).shapes,w:(x1-x0)*s,h:(y1-y0)*s};
}
export const X=d=>({depth:d,bevelEnabled:false,curveSegments:48}),V=(x,y)=>new THREE.Vector2(x,y);
export function svgGeo(c){
 const sh=[];new SVGLoader().parse(c.data).paths.forEach(p=>{const f=p.userData.style.fill;if(f==='none')return;let col=null;
  if(typeof f=='string'&&!/^url/.test(f)){try{col=new THREE.Color(f).getHexString()}catch(e){}}
  SVGLoader.createShapes(p).forEach(s=>sh.push({...s.extractPoints(16),col}))});
 if(!sh.length)return null;
 const cs=new Set(sh.map(s=>s.col));if(cs.size==1&&(cs.has(null)||cs.has('000000')))sh.forEach(s=>s.col=null);
 let a=1e9,b=-1e9,e=1e9,f=-1e9;sh.forEach(s=>s.shape.forEach(q=>{a=Math.min(a,q.x);b=Math.max(b,q.x);e=Math.min(e,q.y);f=Math.max(f,q.y)}));
 if(f-e<1e-6)return null;
 const k=c.size/(f-e),cx=(a+b)/2,cy=(e+f)/2,m=q=>V((q.x-cx)*k,-(q.y-cy)*k),by=new Map(),all=[];
 sh.forEach(s=>{const o=new THREE.Shape(s.shape.map(m));s.holes.forEach(h=>o.holes.push(new THREE.Path(h.map(m))));const key=String(s.col);if(!by.has(key))by.set(key,{col:s.col,l:[]});by.get(key).l.push(o);all.push(o)});
 return{geos:[...by.values()].map(v=>({geo:new THREE.ExtrudeGeometry(v.l,X(c.height)),col:v.col?'#'+v.col:null})),w:(b-a)*k,h:c.size,sh:all};
}
/** Binary STL can carry a per-triangle colour in the attribute bytes (5 bits each of R, G, B, bit 15 = colour set). */
const rgb5=(a)=>{const h=(v)=>Math.round(v*255/31).toString(16).padStart(2,'0');return '#'+h(a&31)+h((a>>5)&31)+h((a>>10)&31)};
export function stlHasColor(buf){
 if(buf.byteLength<=84)return false;
 const dv=new DataView(buf),n=dv.getUint32(80,true);
 if(buf.byteLength!==84+n*50)return false;
 for(let i=0;i<n;i++)if(dv.getUint16(84+i*50+48,true)&0x8000)return true;
 return false;
}
export function stlGeo(c){
 const buf=c.data,dv=new DataView(buf),n=buf.byteLength>84?dv.getUint32(80,true):0,pos=[],tc=[];
 if(buf.byteLength===84+n*50){for(let i=0;i<n;i++){for(let j=0;j<3;j++){const o=84+i*50+12+j*12;pos.push(dv.getFloat32(o,true),dv.getFloat32(o+4,true),dv.getFloat32(o+8,true))}const at=dv.getUint16(84+i*50+48,true);tc.push(at&0x8000?rgb5(at):null)}}
 else for(const m of new TextDecoder().decode(buf).matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g))pos.push(+m[1],+m[2],+m[3]);
 if(pos.length<9)return null;
 const all=new THREE.BufferGeometry();all.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));all.computeBoundingBox();
 const bb=all.boundingBox,k=c.size/((bb.max.y-bb.min.y)||1),w=(bb.max.x-bb.min.x)*k,cx=(bb.min.x+bb.max.x)/2,cy=(bb.min.y+bb.max.y)/2;
 const make=(arr)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.translate(-cx,-cy,-bb.min.z);g.scale(k,k,k);g.computeVertexNormals();return g};
 let geos;
 if(tc.some((x)=>x)){
  /* One geometry per embedded colour, so the colours show up (and export as separate parts) until you pick a colour yourself. */
  const by=new Map();
  tc.forEach((col,i)=>{const key=col||'';if(!by.has(key))by.set(key,[]);const arr=by.get(key);for(let j=0;j<9;j++)arr.push(pos[i*9+j])});
  geos=[...by].map(([key,arr])=>({geo:make(arr),col:key||null}));
 }else geos=[{geo:make(pos),col:null}];
 return{geos,w,h:c.size,sh:[new THREE.Shape([V(-w/2,-c.size/2),V(w/2,-c.size/2),V(w/2,c.size/2),V(-w/2,c.size/2)])]};
}
export function objGeo(c){const v=[],pos=[];for(const l of c.data.split(/\r?\n/)){const p=l.trim().split(/\s+/);if(p[0]=='v')v.push([+p[1],+p[2],+p[3]]);else if(p[0]=='f'){const ix=p.slice(1).map(s=>{const i=parseInt(s);return i<0?v.length+i:i-1});for(let k=1;k<ix.length-1;k++)[ix[0],ix[k],ix[k+1]].forEach(i=>pos.push(...v[i]))}}
 if(pos.length<9)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeBoundingBox();
 const bb=g.boundingBox,k=c.size/((bb.max.y-bb.min.y)||1),w=(bb.max.x-bb.min.x)*k;
 g.translate(-(bb.min.x+bb.max.x)/2,-(bb.min.y+bb.max.y)/2,-bb.min.z);g.scale(k,k,k);g.computeVertexNormals();
 return{geos:[{geo:g,col:null}],w,h:c.size,sh:[new THREE.Shape([V(-w/2,-c.size/2),V(w/2,-c.size/2),V(w/2,c.size/2),V(-w/2,c.size/2)])]};}
export function flipGeo(g,sx,sy){g.scale(sx,sy,1);if(sx*sy<0){const p=g.attributes.position,a=p.array;for(let i=0;i<a.length;i+=9)for(let k=0;k<3;k++){const t=a[i+3+k];a[i+3+k]=a[i+6+k];a[i+6+k]=t}p.needsUpdate=true;g.computeVertexNormals()}}
export function pngGeo(c){const{g,W,H}=c.data,L=trace(g,W,H);if(!L.length)return null;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
 split(L).outs.forEach(l=>l.p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}));
 const s=c.size/((y1-y0)||1),sh=toShapes(L,s,-(x0+x1)/2*s,(y0+y1)/2*s,true).shapes;
 return{geos:[{geo:new THREE.ExtrudeGeometry(sh,X(c.height)),col:null}],w:(x1-x0)*s,h:c.size,sh}}
export async function pngGrid(f){const bm=await createImageBitmap(f),sc=Math.min(1,700/Math.max(bm.width,bm.height)),W=Math.round(bm.width*sc)+4,H=Math.round(bm.height*sc)+4,cv2=document.createElement('canvas');cv2.width=W;cv2.height=H;
 const x=cv2.getContext('2d',{willReadFrequently:true});x.drawImage(bm,2,2,W-4,H-4);const d=x.getImageData(0,0,W,H).data;let tp=false;
 for(let y=2;y<H-2&&!tp;y++)for(let xx=2;xx<W-2;xx++)if(d[(y*W+xx)*4+3]<250){tp=true;break}
 const g=new Uint8Array(W*H);for(let i=0;i<W*H;i++){const a=d[i*4+3];g[i]=tp?a:(a<128?0:255-(.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2]))}return{g,W,H}}
export const poly=(n,r,rot=PI/2)=>Array.from({length:n},(_,i)=>V(r*Math.cos(rot+i*2*PI/n),r*Math.sin(rot+i*2*PI/n)));
export function ringShape(k,ri,ki,pd,ra,rb,ro){
 const rot=(P,d)=>{const t=(d||0)*PI/180,c=Math.cos(t),s=Math.sin(t);return P.map(p=>V(p.x*c-p.y*s,p.x*s+p.y*c))};
 let pts;
 if(k=='heart')pts=Array.from({length:96},(_,i)=>{const t=i/96*2*PI;return V(16*Math.sin(t)**3,13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))});
 else if(k=='flower')pts=Array.from({length:120},(_,i)=>{const t=i/120*2*PI,r=.55+.45*Math.abs(Math.cos(2.5*t));return V(r*Math.cos(t+PI/2),r*Math.sin(t+PI/2))});
 else if(k=='rect')pts=[V(-1.15,-.9),V(1.15,-.9),V(1.15,.9),V(-1.15,.9)];
 else if(k=='pent')pts=poly(5,1.1);else if(k=='hex')pts=poly(6,1.05,0);
 else pts=Array.from({length:96},(_,i)=>V(Math.cos(i/96*2*PI),Math.sin(i/96*2*PI)));
 let a=1e9,b=-1e9,c=1e9,d=-1e9;pts.forEach(p=>{a=Math.min(a,p.x);b=Math.max(b,p.x);c=Math.min(c,p.y);d=Math.max(d,p.y)});
 const H=ro,X0=-H,X1=H,Y0=-H,Y1=H,dx=pd.l-pd.r,dy=pd.b-pd.t,mv=P=>P.map(p=>V(p.x+dx,p.y+dy)),o=new THREE.Shape(rot(pts.map(p=>V(X0+(p.x-a)/(b-a)*(X1-X0),Y0+(p.y-c)/(d-c)*(Y1-Y0))),ra));
 let h;if(ki=='rect')h=new THREE.Path(mv(rot([V(-ri,-ri*.7),V(-ri,ri*.7),V(ri,ri*.7),V(ri,-ri*.7)],rb)));
 else if(ki=='pent')h=new THREE.Path(mv(rot(poly(5,ri),rb)));else if(ki=='hex')h=new THREE.Path(mv(rot(poly(6,ri,0),rb)));
 else{h=new THREE.Path();h.absarc(dx,dy,ri,0,2*PI,true)}
 o.holes.push(h);return o}
export function gen(c){const r=gen0(c);if(!r)return r;
 if(c.fx||c.fy){const sx=c.fx?-1:1,sy=c.fy?-1:1;r.geos.forEach(g=>flipGeo(g.geo,sx,sy));r.sh=r.sh.map(s=>new THREE.Shape(s.getPoints().map(p=>V(p.x*sx,p.y*sy))))}
const a=(c.rot||0)*PI/180,ax=(c.rx||0)*PI/180,ay=(c.ry||0)*PI/180;
 if(ax||ay){
  /* 3D rotation about the item's centre (mid-thickness) in X, Y, Z order, then the lowest point rests on the base. */
  const m=new THREE.Matrix4().makeRotationZ(a).multiply(new THREE.Matrix4().makeRotationY(ay)).multiply(new THREE.Matrix4().makeRotationX(ax));
  let zmax=0;r.geos.forEach(g=>{g.geo.computeBoundingBox();zmax=Math.max(zmax,g.geo.boundingBox.max.z)});
  const zc=zmax/2;r.geos.forEach(g=>{g.geo.translate(0,0,-zc);g.geo.applyMatrix4(m)});
  let zmin=1e9;r.geos.forEach(g=>{g.geo.computeBoundingBox();zmin=Math.min(zmin,g.geo.boundingBox.min.z)});
  r.geos.forEach(g=>g.geo.translate(0,0,-zmin));
  const mp=(p,z)=>{const v=new THREE.Vector3(p.x,p.y,z-zc).applyMatrix4(m);return V(v.x,v.y)};
  let bot=r.sh.map(s=>s.getPoints().map(p=>mp(p,0))),top=r.sh.flatMap(s=>s.getPoints().map(p=>mp(p,zmax)));
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;bot.flat().concat(top).forEach(p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)});
  const cx=(x0+x1)/2,cy=(y0+y1)/2;
  r.geos.forEach(g=>g.geo.translate(-cx,-cy,0));
  r.sh=bot.map(pts=>new THREE.Shape(pts.map(p=>V(p.x-cx,p.y-cy))));r.extra=top.map(p=>V(p.x-cx,p.y-cy));
  r.w=x1-x0;r.h=y1-y0;
 }else if(a){const cs=Math.cos(a),sn=Math.sin(a),f=p=>V(p.x*cs-p.y*sn,p.x*sn+p.y*cs);r.geos.forEach(g=>g.geo.rotateZ(a));r.sh=r.sh.map(s=>new THREE.Shape(s.getPoints().map(f)));
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;r.sh.forEach(s=>s.getPoints().forEach(p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)}));const cx=(x0+x1)/2,cy=(y0+y1)/2;r.geos.forEach(g=>g.geo.translate(-cx,-cy,0));r.sh=r.sh.map(s=>new THREE.Shape(s.getPoints().map(p=>V(p.x-cx,p.y-cy))));r.w=x1-x0;r.h=y1-y0}
 r.hull=hull(r.sh.flatMap(s=>s.getPoints()).concat(r.extra||[]));return r}
export function gen0(c){
 try{if(c.type=='text'){const t=textOutlines(c.text,fcss(c.font),c.size);return t&&{geos:[{geo:new THREE.ExtrudeGeometry(t.shapes,X(c.height)),col:null}],w:t.w,h:t.h,sh:t.shapes}}
  return c.type=='svg'?svgGeo(c):c.type=='png'?pngGeo(c):c.type=='obj'?objGeo(c):stlGeo(c)}catch(e){return null}
}
export function hull(P){const p=P.map(q=>[q.x,q.y]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p.map(q=>V(q[0],q[1]));const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];for(const q of p){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}lo.pop();up.pop();return lo.concat(up).map(q=>V(q[0],q[1]))}
export const inHull=(h,x,y,m)=>h.every((a,i)=>{const b=h[(i+1)%h.length],ex=b.x-a.x,ey=b.y-a.y;return (ex*(y-a.y)-ey*(x-a.x))/(Math.hypot(ex,ey)||1)>=-m});
export function mk(type,w,h){
 const s=new THREE.Shape(),x=-w/2,y=-h/2;
 if(type=='ellipse'){s.absellipse(0,0,w/2,h/2,0,2*PI,false,0);return s}
 if(type=='hex'){for(let i=0;i<6;i++){const a=i*PI/3,px=w/2*Math.cos(a),py=h/2*Math.sin(a);i?s.lineTo(px,py):s.moveTo(px,py)}s.closePath();return s}
 const r=Math.max(.2,type=='pill'?Math.min(w,h)/2:Math.min(w,h)*.18);
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-PI/2,0);s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,PI/2);
 s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,PI/2,PI);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,PI,1.5*PI);return s;
}
export function edge(poly,dx,dy,ox,oy){let best=1e9;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ax=a.x-ox,ay=a.y-oy,ex=b.x-a.x,ey=b.y-a.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;const t=(ax*ey-ay*ex)/den,u=(ax*dy-ay*dx)/den;if(t>0&&u>=0&&u<=1&&t<best)best=t}return best<1e8?best:0}
export const merge=a=>{const P=[],N=[];a.forEach(g=>{P.push(...g.attributes.position.array);N.push(...g.attributes.normal.array)});const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.Float32BufferAttribute(P,3));m.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return m};

/**
 * Ring with rounded edges. Builds the ring as a loft of offset outlines (outer contour and holes) with a
 * quarter-circle profile on each of the four edges: top/bottom x outer/hole. `hl`/`hr` are the left/right
 * heights (a slope when different). Radii are limited so they always fit the ring height and wall width.
 */
export function roundedRing(shape,o){
 const N=8,div=48;
 const dedupe=(pts)=>{const a=pts.slice();if(a.length>1&&a[0].distanceTo(a[a.length-1])<1e-6)a.pop();return a};
 const area=(p)=>{let t=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];t+=a.x*b.y-b.x*a.y}return t/2};
 const outer=dedupe(shape.getPoints(div));if(area(outer)<0)outer.reverse();
 const holes=shape.holes.map((h)=>{const p=dedupe(h.getPoints(div));if(area(p)>0)p.reverse();return p});
 let x0=1e9,x1=-1e9;outer.forEach((p)=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x)});
 const H=(x)=>o.hl+(o.hr-o.hl)*((x-x0)/((x1-x0)||1));
 /* Wall width between the outer outline and the holes, to keep the rounding inside the material. */
 let wall=1e9;holes.forEach((h)=>h.forEach((p)=>outer.forEach((q)=>{wall=Math.min(wall,Math.hypot(p.x-q.x,p.y-q.y))})));
 const cap0=Math.max(0,Math.min(Math.min(o.hl,o.hr)/2,wall/2*0.98));
 const rr=(v)=>Math.max(0,Math.min(+v||0,cap0));
 /* Per-vertex direction toward the material (left of the edge), with a limited mitre for corners. */
 const dirs=(p)=>p.map((q,i)=>{
  const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length];
  const e1=new THREE.Vector2(q.x-a.x,q.y-a.y).normalize(),e2=new THREE.Vector2(b.x-q.x,b.y-q.y).normalize();
  const n1=new THREE.Vector2(-e1.y,e1.x),n2=new THREE.Vector2(-e2.y,e2.x),m=n1.clone().add(n2),l=m.length();
  if(l<1e-6)return n1;m.divideScalar(l);return m.multiplyScalar(1/Math.max(0.4,m.dot(n1)));
 });
 const layers=(rb,rt,Hv)=>{
  const L=[];
  if(rb>0){for(let k=0;k<=N;k++){const th=(1-k/N)*Math.PI/2;L.push({z:rb*(1-Math.sin(th)),off:rb*(1-Math.cos(th))})}}else L.push({z:0,off:0});
  if(rt>0){for(let k=0;k<=N;k++){const th=(k/N)*Math.PI/2;L.push({z:Hv-rt+rt*Math.sin(th),off:rt*(1-Math.cos(th))})}}else L.push({z:Hv,off:0});
  return L;
 };
 const P=[],I=[],vtx=(v)=>{P.push(v.x,v.y,v.z);return P.length/3-1};
 const side=(poly,rb,rt)=>{
  const d=dirs(poly),LV=poly.map((p)=>layers(rb,rt,H(p.x))),K=LV[0].length;
  const at=(i,k)=>new THREE.Vector3(poly[i].x+d[i].x*LV[i][k].off,poly[i].y+d[i].y*LV[i][k].off,LV[i][k].z);
  const grid=poly.map((p,i)=>LV[i].map((l,k)=>vtx(at(i,k))));
  for(let k=0;k<K-1;k++)for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length,a=grid[i][k],b=grid[j][k],c=grid[j][k+1],e=grid[i][k+1];I.push(a,b,c,a,c,e)}
  return{top:poly.map((p,i)=>at(i,K-1)),bot:poly.map((p,i)=>at(i,0))};
 };
 const cap=(rings,up)=>{
  const pts2=rings.map((r)=>r.map((v)=>new THREE.Vector2(v.x,v.y)));
  const faces=THREE.ShapeUtils.triangulateShape(pts2[0],pts2.slice(1)),all=rings.flat(),base=P.length/3;
  all.forEach((v)=>vtx(v));
  faces.forEach((f)=>{let[a,b,c]=f;const A=all[a],B=all[b],C=all[c],ar=(B.x-A.x)*(C.y-A.y)-(B.y-A.y)*(C.x-A.x);if((ar>0)!==up){const t=b;b=c;c=t}I.push(base+a,base+b,base+c)});
 };
 const so=side(outer,rr(o.rbo),rr(o.rto)),sh=holes.map((h)=>side(h,rr(o.rbh),rr(o.rth)));
 cap([so.top,...sh.map((h)=>h.top)],true);
 cap([so.bot,...sh.map((h)=>h.bot)],false);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 g.setIndex(I);
 g.computeVertexNormals();
 return g;
}
