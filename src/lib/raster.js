import * as THREE from 'three';
import { R } from './constants.js';

/* Marching-squares tracing and canvas masks used for text outlines, contours and border bands. */
export const simp=(p,e=.1)=>{const o=[p[0]];for(let i=1;i<p.length-1;i++){const a=o[o.length-1],q=p[i],b=p[i+1],dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dx*(q[1]-a[1])-dy*(q[0]-a[0]))/(Math.hypot(dx,dy)||1)>e)o.push(q)}o.push(p[p.length-1]);return o};
export function trace(g,W,H){
 const tb={1:'LB',2:'BR',3:'LR',4:'RT',5:'RTLB',6:'BT',7:'LT',8:'TL',9:'TB',10:'TLBR',11:'TR',12:'RL',13:'RB',14:'BL'},T=127.5,K=(a,b)=>a*100000+b,nx=new Map();
 const EK={T:(x,y)=>K(2*x+1,2*y),R:(x,y)=>K(2*x+2,2*y+1),B:(x,y)=>K(2*x+1,2*y+2),L:(x,y)=>K(2*x,2*y+1)},on=(x,y)=>g[y*W+x]>T?1:0;
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){const s=tb[on(x,y)*8+on(x+1,y)*4+on(x+1,y+1)*2+on(x,y+1)];if(!s)continue;for(let i=0;i<s.length;i+=2)nx.set(EK[s[i]](x,y),EK[s[i+1]](x,y))}
 const pt=k=>{const ex=Math.floor(k/100000),ey=k%100000;let x,y,a,b;if(ex&1){x=(ex-1)/2;y=ey/2;a=g[y*W+x];b=g[y*W+x+1];return[x+(T-a)/((b-a)||1),y]}x=ex/2;y=(ey-1)/2;a=g[y*W+x];b=g[(y+1)*W+x];return[x,y+(T-a)/((b-a)||1)]};
 const seen=new Set(),loops=[];
 for(const k0 of nx.keys()){if(seen.has(k0))continue;let k=k0,p=[];while(k!==undefined&&!seen.has(k)){seen.add(k);p.push(pt(k));k=nx.get(k)}
  p=simp(p);if(p.length<4)continue;let A=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];A+=a[0]*b[1]-b[0]*a[1]}A/=2;if(Math.abs(A)>6)loops.push({p,A})}
 return loops;
}
export const pip=(pt,poly)=>{let r=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>pt[1])!=(b[1]>pt[1])&&pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0])r=!r}return r};
export function split(L){const big=L.reduce((a,l)=>Math.abs(l.A)>Math.abs(a.A)?l:a),sg=Math.sign(big.A);return{outs:L.filter(l=>Math.sign(l.A)==sg),hols:L.filter(l=>Math.sign(l.A)!=sg),big}}
export function toShapes(L,k,ox,oy,holes){
 const{outs,hols,big}=split(L),T=l=>l.p.map(q=>new THREE.Vector2(q[0]*k+ox,oy-q[1]*k)),sh=outs.map(l=>new THREE.Shape(T(l)));
 if(holes)hols.forEach(h=>{let b=null;outs.forEach((o,i)=>{if(pip(h.p[0],o.p)&&(!b||Math.abs(o.A)<Math.abs(b.A)))b={i,A:o.A}});if(b)sh[b.i].holes.push(new THREE.Path(T(h)))});
 return{shapes:sh,big:T(big)};
}
export function mask(box,fn){
 const W=Math.ceil((box.x1-box.x0)*R),H=Math.ceil((box.y1-box.y0)*R),c=document.createElement('canvas');c.width=W;c.height=H;
 const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle=x.strokeStyle='#000';x.lineJoin=x.lineCap='round';
 fn(x,(X,Y)=>[(X-box.x0)*R,(box.y1-Y)*R]);return{x,W,H};
}
export const grid=m=>{const d=m.x.getImageData(0,0,m.W,m.H).data,g=new Uint8Array(m.W*m.H);for(let i=0;i<g.length;i++)g[i]=d[i*4+3];return g};
export const pp=(x,tf,P,dx=0,dy=0)=>{x.beginPath();P.forEach((p,i)=>{const[a,b]=tf(p.x+dx,p.y+dy);i?x.lineTo(a,b):x.moveTo(a,b)});x.closePath()};
export const tr=m=>trace(grid(m),m.W,m.H);
