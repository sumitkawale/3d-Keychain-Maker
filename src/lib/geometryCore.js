import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { PI, R } from './constants.js';

/* ---- raster helpers: marching squares gives outlines for text, contour and border bands ---- */
const simp=(p,e=.1)=>{const o=[p[0]];for(let i=1;i<p.length-1;i++){const a=o[o.length-1],q=p[i],b=p[i+1],dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dx*(q[1]-a[1])-dy*(q[0]-a[0]))/(Math.hypot(dx,dy)||1)>e)o.push(q)}o.push(p[p.length-1]);return o};
function trace(g,W,H){
 const tb={1:'LB',2:'BR',3:'LR',4:'RT',5:'RTLB',6:'BT',7:'LT',8:'TL',9:'TB',10:'TLBR',11:'TR',12:'RL',13:'RB',14:'BL'},T=127.5,K=(a,b)=>a*100000+b,nx=new Map();
 const EK={T:(x,y)=>K(2*x+1,2*y),R:(x,y)=>K(2*x+2,2*y+1),B:(x,y)=>K(2*x+1,2*y+2),L:(x,y)=>K(2*x,2*y+1)},on=(x,y)=>g[y*W+x]>T?1:0;
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){const s=tb[on(x,y)*8+on(x+1,y)*4+on(x+1,y+1)*2+on(x,y+1)];if(!s)continue;for(let i=0;i<s.length;i+=2)nx.set(EK[s[i]](x,y),EK[s[i+1]](x,y))}
 const pt=k=>{const ex=Math.floor(k/100000),ey=k%100000;let x,y,a,b;if(ex&1){x=(ex-1)/2;y=ey/2;a=g[y*W+x];b=g[y*W+x+1];return[x+(T-a)/((b-a)||1),y]}x=ex/2;y=(ey-1)/2;a=g[y*W+x];b=g[(y+1)*W+x];return[x,y+(T-a)/((b-a)||1)]};
 const seen=new Set(),loops=[];
 for(const k0 of nx.keys()){if(seen.has(k0))continue;let k=k0,p=[];while(k!==undefined&&!seen.has(k)){seen.add(k);p.push(pt(k));k=nx.get(k)}
  p=simp(p);if(p.length<4)continue;let A=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];A+=a[0]*b[1]-b[0]*a[1]}A/=2;if(Math.abs(A)>6)loops.push({p,A})}
 return loops;
}
function traceOld(g,W,H){
 const E={T:(x,y)=>[2*x+1,2*y],R:(x,y)=>[2*x+2,2*y+1],B:(x,y)=>[2*x+1,2*y+2],L:(x,y)=>[2*x,2*y+1]};
 const tb={1:'LB',2:'BR',3:'LR',4:'RT',5:'RTLB',6:'BT',7:'LT',8:'TL',9:'TB',10:'TLBR',11:'TR',12:'RL',13:'RB',14:'BL'};
 const K=p=>p[0]*100000+p[1],nx=new Map();
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){
  const s=tb[g[y*W+x]*8+g[y*W+x+1]*4+g[(y+1)*W+x+1]*2+g[(y+1)*W+x]];if(!s)continue;
  for(let i=0;i<s.length;i+=2)nx.set(K(E[s[i]](x,y)),E[s[i+1]](x,y));}
 const seen=new Set(),loops=[];
 for(const k0 of nx.keys()){if(seen.has(k0))continue;let k=k0,p=[];
  while(k!==undefined&&!seen.has(k)){seen.add(k);p.push([Math.floor(k/100000)/2,(k%100000)/2]);const n=nx.get(k);k=n?K(n):undefined}
  p=p.filter((q,i)=>{const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length];return (q[0]-a[0])*(b[1]-q[1])-(q[1]-a[1])*(b[0]-q[0])!==0});
  if(p.length<4)continue;let A=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];A+=a[0]*b[1]-b[0]*a[1]}
  A/=2;if(Math.abs(A)>6)loops.push({p,A})}
 return loops;
}
const pip=(pt,poly)=>{let r=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>pt[1])!=(b[1]>pt[1])&&pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0])r=!r}return r};
function split(L){const big=L.reduce((a,l)=>Math.abs(l.A)>Math.abs(a.A)?l:a),sg=Math.sign(big.A);return{outs:L.filter(l=>Math.sign(l.A)==sg),hols:L.filter(l=>Math.sign(l.A)!=sg),big}}
function toShapes(L,k,ox,oy,holes){
 const{outs,hols,big}=split(L),T=l=>l.p.map(q=>new THREE.Vector2(q[0]*k+ox,oy-q[1]*k)),sh=outs.map(l=>new THREE.Shape(T(l)));
 if(holes)hols.forEach(h=>{let b=null;outs.forEach((o,i)=>{if(pip(h.p[0],o.p)&&(!b||Math.abs(o.A)<Math.abs(b.A)))b={i,A:o.A}});if(b)sh[b.i].holes.push(new THREE.Path(T(h)))});
 return{shapes:sh,big:T(big)};
}
function mask(box,fn){
 const W=Math.ceil((box.x1-box.x0)*R),H=Math.ceil((box.y1-box.y0)*R),c=document.createElement('canvas');c.width=W;c.height=H;
 const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle=x.strokeStyle='#000';x.lineJoin=x.lineCap='round';
 fn(x,(X,Y)=>[(X-box.x0)*R,(box.y1-Y)*R]);return{x,W,H};
}
const grid=m=>{const d=m.x.getImageData(0,0,m.W,m.H).data,g=new Uint8Array(m.W*m.H);for(let i=0;i<g.length;i++)g[i]=d[i*4+3];return g};
const gridOld=m=>{const d=m.x.getImageData(0,0,m.W,m.H).data,g=new Uint8Array(m.W*m.H);for(let i=0;i<g.length;i++)g[i]=d[i*4+3]>127?1:0;return g};
const pp=(x,tf,P,dx=0,dy=0)=>{x.beginPath();P.forEach((p,i)=>{const[a,b]=tf(p.x+dx,p.y+dy);i?x.lineTo(a,b):x.moveTo(a,b)});x.closePath()};
const tr=m=>trace(grid(m),m.W,m.H);

function textOutlines(txt,font,mm){
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
const X=d=>({depth:d,bevelEnabled:false,curveSegments:48}),V=(x,y)=>new THREE.Vector2(x,y);
function svgGeo(c){
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
function stlGeo(c){
 const buf=c.data,dv=new DataView(buf),n=buf.byteLength>84?dv.getUint32(80,true):0,pos=[];
 if(buf.byteLength===84+n*50){for(let i=0;i<n;i++)for(let j=0;j<3;j++){const o=84+i*50+12+j*12;pos.push(dv.getFloat32(o,true),dv.getFloat32(o+4,true),dv.getFloat32(o+8,true))}}
 else for(const m of new TextDecoder().decode(buf).matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g))pos.push(+m[1],+m[2],+m[3]);
 if(pos.length<9)return null;
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeBoundingBox();
 const bb=g.boundingBox,k=c.size/((bb.max.y-bb.min.y)||1),w=(bb.max.x-bb.min.x)*k;
 g.translate(-(bb.min.x+bb.max.x)/2,-(bb.min.y+bb.max.y)/2,-bb.min.z);g.scale(k,k,k);g.computeVertexNormals();
 return{geos:[{geo:g,col:null}],w,h:c.size,sh:[new THREE.Shape([V(-w/2,-c.size/2),V(w/2,-c.size/2),V(w/2,c.size/2),V(-w/2,c.size/2)])]};
}
function objGeo(c){const v=[],pos=[];for(const l of c.data.split(/\r?\n/)){const p=l.trim().split(/\s+/);if(p[0]=='v')v.push([+p[1],+p[2],+p[3]]);else if(p[0]=='f'){const ix=p.slice(1).map(s=>{const i=parseInt(s);return i<0?v.length+i:i-1});for(let k=1;k<ix.length-1;k++)[ix[0],ix[k],ix[k+1]].forEach(i=>pos.push(...v[i]))}}
 if(pos.length<9)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeBoundingBox();
 const bb=g.boundingBox,k=c.size/((bb.max.y-bb.min.y)||1),w=(bb.max.x-bb.min.x)*k;
 g.translate(-(bb.min.x+bb.max.x)/2,-(bb.min.y+bb.max.y)/2,-bb.min.z);g.scale(k,k,k);g.computeVertexNormals();
 return{geos:[{geo:g,col:null}],w,h:c.size,sh:[new THREE.Shape([V(-w/2,-c.size/2),V(w/2,-c.size/2),V(w/2,c.size/2),V(-w/2,c.size/2)])]};}
function flipGeo(g,sx,sy){g.scale(sx,sy,1);if(sx*sy<0){const p=g.attributes.position,a=p.array;for(let i=0;i<a.length;i+=9)for(let k=0;k<3;k++){const t=a[i+3+k];a[i+3+k]=a[i+6+k];a[i+6+k]=t}p.needsUpdate=true;g.computeVertexNormals()}}
function pngGeo(c){const{g,W,H}=c.data,L=trace(g,W,H);if(!L.length)return null;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
 split(L).outs.forEach(l=>l.p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}));
 const s=c.size/((y1-y0)||1),sh=toShapes(L,s,-(x0+x1)/2*s,(y0+y1)/2*s,true).shapes;
 return{geos:[{geo:new THREE.ExtrudeGeometry(sh,X(c.height)),col:null}],w:(x1-x0)*s,h:c.size,sh}}
async function pngGrid(f){const bm=await createImageBitmap(f),sc=Math.min(1,700/Math.max(bm.width,bm.height)),W=Math.round(bm.width*sc)+4,H=Math.round(bm.height*sc)+4,cv2=document.createElement('canvas');cv2.width=W;cv2.height=H;
 const x=cv2.getContext('2d',{willReadFrequently:true});x.drawImage(bm,2,2,W-4,H-4);const d=x.getImageData(0,0,W,H).data;let tp=false;
 for(let y=2;y<H-2&&!tp;y++)for(let xx=2;xx<W-2;xx++)if(d[(y*W+xx)*4+3]<250){tp=true;break}
 const g=new Uint8Array(W*H);for(let i=0;i<W*H;i++){const a=d[i*4+3];g[i]=tp?a:(a<128?0:255-(.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2]))}return{g,W,H}}
const poly=(n,r,rot=PI/2)=>Array.from({length:n},(_,i)=>V(r*Math.cos(rot+i*2*PI/n),r*Math.sin(rot+i*2*PI/n)));
function ringShape(k,ri,ki,pd,ra,rb,ro){
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
function gen(c){const r=gen0(c);if(!r)return r;
 if(c.fx||c.fy){const sx=c.fx?-1:1,sy=c.fy?-1:1;r.geos.forEach(g=>flipGeo(g.geo,sx,sy));r.sh=r.sh.map(s=>new THREE.Shape(s.getPoints().map(p=>V(p.x*sx,p.y*sy))))}
const a=(c.rot||0)*PI/180;
 if(a){const cs=Math.cos(a),sn=Math.sin(a),f=p=>V(p.x*cs-p.y*sn,p.x*sn+p.y*cs);r.geos.forEach(g=>g.geo.rotateZ(a));r.sh=r.sh.map(s=>new THREE.Shape(s.getPoints().map(f)));
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;r.sh.forEach(s=>s.getPoints().forEach(p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)}));r.w=x1-x0;r.h=y1-y0}
 r.hull=hull(r.sh.flatMap(s=>s.getPoints()));return r}
let fontCssFor = (name) => `400 140px "${name}", sans-serif`;

export function configureGeometry({ fontCss } = {}) {
  if (typeof fontCss === 'function') fontCssFor = fontCss;
}

function gen0(c){
 try{if(c.type=='text'){const t=textOutlines(c.text,fontCssFor(c.font),c.size);return t&&{geos:[{geo:new THREE.ExtrudeGeometry(t.shapes,X(c.height)),col:null}],w:t.w,h:t.h,sh:t.shapes}}
  return c.type=='svg'?svgGeo(c):c.type=='png'?pngGeo(c):c.type=='obj'?objGeo(c):stlGeo(c)}catch(e){return null}
}
function hull(P){const p=P.map(q=>[q.x,q.y]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p.map(q=>V(q[0],q[1]));const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];for(const q of p){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}lo.pop();up.pop();return lo.concat(up).map(q=>V(q[0],q[1]))}
const inHull=(h,x,y,m)=>h.every((a,i)=>{const b=h[(i+1)%h.length],ex=b.x-a.x,ey=b.y-a.y;return (ex*(y-a.y)-ey*(x-a.x))/(Math.hypot(ex,ey)||1)>=-m});
function mk(type,w,h){
 const s=new THREE.Shape(),x=-w/2,y=-h/2;
 if(type=='ellipse'){s.absellipse(0,0,w/2,h/2,0,2*PI,false,0);return s}
 if(type=='hex'){for(let i=0;i<6;i++){const a=i*PI/3,px=w/2*Math.cos(a),py=h/2*Math.sin(a);i?s.lineTo(px,py):s.moveTo(px,py)}s.closePath();return s}
 const r=Math.max(.2,type=='pill'?Math.min(w,h)/2:Math.min(w,h)*.18);
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-PI/2,0);s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,PI/2);
 s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,PI/2,PI);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,PI,1.5*PI);return s;
}
function edge(poly,dx,dy,ox,oy){let best=1e9;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ax=a.x-ox,ay=a.y-oy,ex=b.x-a.x,ey=b.y-a.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;const t=(ax*ey-ay*ex)/den,u=(ax*dy-ay*dx)/den;if(t>0&&u>=0&&u<=1&&t<best)best=t}return best<1e8?best:0}
const merge=a=>{const P=[],N=[];a.forEach(g=>{P.push(...g.attributes.position.array);N.push(...g.attributes.normal.array)});const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.Float32BufferAttribute(P,3));m.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return m};
const PS={tl:[-1,1],tc:[0,1],tr:[1,1],bl:[-1,-1],bc:[0,-1],br:[1,-1],lc:[-1,0],rc:[1,0]};


export {
  trace,
  simp,
  split,
  toShapes,
  mask,
  grid,
  tr,
  pp,
  textOutlines,
  X,
  V,
  svgGeo,
  stlGeo,
  objGeo,
  flipGeo,
  pngGeo,
  pngGrid,
  poly,
  ringShape,
  gen,
  gen0,
  hull,
  mk,
  edge,
  merge,
  PS,
  inHull,
};
