import { flat } from './constants.js';
import {
  configureGeometry,
  gen,
  mask,
  tr,
  toShapes,
  mk,
  ringShape,
  merge,
  PS,
  edge,
  inHull,
  X,
  pp,
} from './geometryCore.js';
import * as THREE from 'three';
import { PI, R } from './constants.js';
import { buildNumericSettings } from './settings.js';
import { FIRST_FIT_ZOOM_FACTOR, FIRST_FIT_ZOOM_OFFSET, VIEWER_CLAMP } from './defaults/viewer.js';

let bt = 0;
const clamp = (r) => Math.min(VIEWER_CLAMP.max, Math.max(VIEWER_CLAMP.min, r));

export async function buildModel(grp, ui, comps, bic, getFcss, ctx){
 configureGeometry({ fontCss: getFcss });
 const my=++bt;
 await Promise.all([...flat(comps),...bic].filter(c=>c.type=='text').map(c=>document.fonts.load(getFcss(c.font),'Ag').catch(()=>0)));
 if(my!==bt)return;
 grp.children.slice().forEach(m=>{grp.remove(m);m.geometry.dispose();m.material.dispose()});
 const o=buildNumericSettings(ui),type=ui.shape,vert=ui.dir==='v',bs=ui.bs,cd=ui.cd;
 const mkI=c=>({c,r:gen(c)}),blocks=[],ok=[];let nI=0;
 comps.forEach(n=>{if(n.off)return;if(n.type=='group'){const m=n.kids.filter(k=>!k.off).map(mkI);nI+=m.length;const g=m.filter(i=>i.r);if(g.length){blocks.push({m:g,v:n.dir=='v',gap:+n.gap||0});ok.push(...g)}}else{const i=mkI(n);nI++;if(i.r){blocks.push({m:[i],v:false,gap:0});ok.push(i)}}});
 const bits=bic.filter(c=>!c.off).map(mkI),bk=bits.filter(i=>i.r),bad=nI-ok.length+bits.length-bk.length;
 ctx.setInfo(bad?`${bad} component(s) produced no geometry (empty text, or an SVG/STL without usable filled shapes).`:'Sizes are in millimetres. Overlapping solids are merged by slicers on import.');
 const lay=(a,v,g)=>{const s=a.reduce((t,i)=>t+(v?i.h:i.w),0)+g*Math.max(0,a.length-1),cr=a.reduce((m,i)=>Math.max(m,v?i.w:i.h),0);let p=0;return{w:v?cr:s,h:v?s:cr,pos:a.map(i=>{const L=v?i.h:i.w,m=v?s/2-p-L/2:-s/2+p+L/2;p+=L+g;return v?[0,m]:[m,0]})}};
 blocks.forEach(b=>{const l=lay(b.m.map(i=>i.r),b.v,b.gap);b.w=l.w;b.h=l.h;b.l=l});
 const M=lay(blocks,vert,o.gap);
 blocks.forEach((b,j)=>b.m.forEach((i,k)=>{i.x=M.pos[j][0]+b.l.pos[k][0];i.y=M.pos[j][1]+b.l.pos[k][1]}));
 const add=(geo,z,col,x=0,y=0,po)=>{const mt=new THREE.MeshStandardMaterial({color:col,roughness:.55});if(po){mt.polygonOffset=true;mt.polygonOffsetFactor=-1;mt.polygonOffsetUnits=-1}const m=new THREE.Mesh(geo,mt);m.position.set(x,y,z);grp.add(m)};
 const addR=(i,z)=>i.r.geos.forEach(g=>add(g.geo,z,(!i.c.recolor&&g.col)||i.c.color,i.x,i.y)),ex=(sh,d)=>new THREE.ExtrudeGeometry(sh,X(d));
 /* base: primitive shape, or a contour that wraps the content (dilated union of all components) */
 let B,Bsh;
 if(type=='cont'&&ok.length){
  const cs=ui.cs,off=cs=='light'?o.pad*1.5:cs=='hard'?Math.max(1,o.pad*.55):o.pad,e=off+2,box={x0:Math.min(...ok.map(i=>i.x-i.r.w/2))-e,x1:Math.max(...ok.map(i=>i.x+i.r.w/2))+e,y0:Math.min(...ok.map(i=>i.y-i.r.h/2))-e,y1:Math.max(...ok.map(i=>i.y+i.r.h/2))+e};
  const m=mask(box,(x,tf)=>{x.lineJoin='round';x.lineWidth=2*off*R;ok.forEach(i=>i.r.sh.forEach(s=>{pp(x,tf,s.getPoints(),i.x,i.y);x.fill();x.stroke()}));
   if(cs=='hard')ok.forEach(i=>{x.lineWidth=Math.max(1.5,Math.min(i.r.w,i.r.h)*.22)*R;x.lineCap='butt';const a=tf(i.x-i.r.w/2,i.y),b=tf(i.x+i.r.w/2,i.y),c=tf(i.x,i.y-i.r.h/2),d=tf(i.x,i.y+i.r.h/2);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.moveTo(c[0],c[1]);x.lineTo(d[0],d[1]);x.stroke();x.lineCap='round'});
   if(ok.length>1){x.lineWidth=(cs=='hard'?Math.min(...ok.map(i=>i.r.h))*.1+1:Math.min(...ok.map(i=>i.r.h))*.5+o.pad)*R;x.beginPath();ok.forEach((i,j)=>{const[a,b]=tf(i.x,i.y);j?x.lineTo(a,b):x.moveTo(a,b)});x.stroke()}});
  let L=tr(m);
  if(L.length&&cs=='light'){const P1=toShapes(L,1/R,box.x0,box.y1,false).big,m2=mask(box,(x,tf)=>{pp(x,tf,P1);x.fill();x.globalCompositeOperation='destination-out';pp(x,tf,P1);x.lineWidth=o.pad*R;x.stroke()}),L2=tr(m2);if(L2.length)L=L2}
  if(L.length){const t=toShapes(L,1/R,box.x0,box.y1,false);Bsh=t.shapes;B=t.big}
 }
 if(!B){const k={rect:1,pill:1.05,ellipse:1.42,hex:1.38}[type]||1,bw=Math.max(10,M.w*k+2*o.pad),bh=Math.max(10,M.h*k+2*o.pad);Bsh=mk(type,bw,bh);B=Bsh.getPoints(64)}
 const bb=B.reduce((a,p)=>({x0:Math.min(a.x0,p.x),x1:Math.max(a.x1,p.x),y0:Math.min(a.y0,p.y),y1:Math.max(a.y1,p.y)}),{x0:1e9,x1:-1e9,y0:1e9,y1:-1e9}),cx=(bb.x0+bb.x1)/2,cy=(bb.y0+bb.y1)/2;
 
 ok.forEach(i=>addR(i,o.baseT));
 /* border icons: positioned on the outline */
 const ins=o.bord>0&&bs!='none'?o.bord/2:o.pad/2,hx=(bb.x1-bb.x0)/2,hy=(bb.y1-bb.y0)/2;
 bk.forEach(i=>{const[a,b]=PS[i.c.pos]||PS.tl,dx=a&&b?a*hx:a,dy=a&&b?b*hy:b,n=Math.hypot(dx,dy),d=edge(B,dx,dy,cx,cy)*n-ins;i.x=cx+dx/n*d+(i.c.pl||0)-(i.c.pr||0);i.y=cy+dy/n*d+(i.c.pb||0)-(i.c.pt||0)});
 const ov=bk.filter(i=>i.c.over),nb=bk.filter(i=>!i.c.over),bwid=o.bord>0&&bs!='none'?o.bord:0,bxo=(its,e)=>({x0:Math.min(bb.x0,...its.map(i=>i.x-i.r.w/2))-e,x1:Math.max(bb.x1,...its.map(i=>i.x+i.r.w/2))+e,y0:Math.min(bb.y0,...its.map(i=>i.y-i.r.h/2))-e,y1:Math.max(bb.y1,...its.map(i=>i.y+i.r.h/2))+e});
 const csv=ui.cs,offv=type=='cont'?(csv=='light'?o.pad*1.5:csv=='hard'?Math.max(1,o.pad*.55):o.pad):1.2;
 if(ov.length){const dd=i=>Math.max(offv,(i.c.sp??.3)+bwid),e=Math.max(...ov.map(dd))+4,bf=bxo(ov,e),m=mask(bf,(x,tf)=>{pp(x,tf,B);x.fill();x.lineJoin='round';ov.forEach(i=>{x.lineWidth=2*dd(i)*R;i.r.sh.forEach(q=>{pp(x,tf,q.getPoints(),i.x,i.y);x.fill();x.stroke()})});ov.forEach(i=>{x.lineWidth=Math.max(1,Math.min(i.r.w,i.r.h)*.5)*R;const a=tf(i.x,i.y),b=tf(cx,cy);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()})}),L=tr(m);if(L.length){const t=toShapes(L,1/R,bf.x0,bf.y1,false);B=t.big;Bsh=t.shapes}}
 let Bf=Bsh;
 if(ui.fillb&&nb.length){const bf=bxo(nb,offv+3),m=mask(bf,(x,tf)=>{pp(x,tf,B);x.fill();x.lineJoin='round';x.lineWidth=2*offv*R;nb.forEach(i=>i.r.sh.forEach(s=>{pp(x,tf,s.getPoints(),i.x,i.y);x.fill();x.stroke()}))}),L=tr(m);if(L.length)Bf=toShapes(L,1/R,bf.x0,bf.y1,false).shapes}
 add(ex(Bf,o.baseT),0,ui.cb);
 const near=p=>nb.some(i=>inHull(i.r.hull,p.x-i.x,p.y-i.y,(i.c.sp??.3)+.5));
 /* border styles, cut away wherever a border icon sits */
 if(o.bord>0&&bs!='none'){
  const bq=B.reduce((a,p)=>({x0:Math.min(a.x0,p.x),x1:Math.max(a.x1,p.x),y0:Math.min(a.y0,p.y),y1:Math.max(a.y1,p.y)}),{x0:1e9,x1:-1e9,y0:1e9,y1:-1e9}),b2={x0:bq.x0-1,x1:bq.x1+1,y0:bq.y0-1,y1:bq.y1+1};
  const bandS=(w0,w1,only)=>{const m=mask(b2,(x,tf)=>{x.save();pp(x,tf,B);x.clip();pp(x,tf,B);x.lineWidth=2*w1*R;x.stroke();
    if(w0>0){x.globalCompositeOperation='destination-out';pp(x,tf,B);x.lineWidth=2*w0*R;x.stroke()}x.restore();
    if(only){x.globalCompositeOperation='destination-in';pp(x,tf,only.r.hull,only.x,only.y);x.fill()}else{x.globalCompositeOperation='destination-out';bk.filter(i=>!i.c.over).forEach(i=>{x.lineWidth=Math.max(.02,2*(i.c.sp??.3))*R;pp(x,tf,i.r.hull,i.x,i.y);x.fill();x.stroke()})}});
   const L=tr(m);return L.length?toShapes(L,1/R,b2.x0,b2.y1,true).shapes:null};
  const band=(w0,w1)=>{const s=bandS(w0,w1);if(s)add(ex(s,o.rel),o.baseT,cd);};
  if(bs=='solid')band(0,o.bord);
  else if(bs=='double'){const t=o.bord/3;band(0,t);band(2*t,o.bord)}
  else{
   const dm=mask(b2,(x,tf)=>{pp(x,tf,B);x.fill();x.globalCompositeOperation='destination-out';pp(x,tf,B);x.lineWidth=o.bord*R;x.stroke()}),L=tr(dm);
   if(L.length){const c=new THREE.Shape(toShapes(L,1/R,b2.x0,b2.y1,false).big),len=c.getLength(),gs=[],dot=bs!='dashed',per=bs=='dotted'?o.bord*2.4:bs=='beaded'?o.bord*.9:o.bord*4.5,N=Math.max(3,Math.round(len/per));
    for(let i=0;i<N;i++){let g;const p=c.getPointAt(i/N);
     if(dot){if(near(p))continue;g=new THREE.CylinderGeometry(o.bord/2,o.bord/2,o.rel,20).rotateX(PI/2).translate(p.x,p.y,o.rel/2)}
     else{const q=c.getPointAt(Math.min(.9999,(i+.6)/N));if(near(p)||near(q))continue;g=new THREE.BoxGeometry(Math.hypot(q.x-p.x,q.y-p.y),o.bord,o.rel).translate(0,0,o.rel/2).rotateZ(Math.atan2(q.y-p.y,q.x-p.x)).translate((p.x+q.x)/2,(p.y+q.y)/2,0)}
     gs.push(g.toNonIndexed())}
    if(gs.length)add(merge(gs),o.baseT,cd)}}
 }
 bk.forEach(i=>addR(i,o.baseT));
 ctx.setSlopeHidden(!ui.rslope);
 if(o.hole>0){const ri=o.hole/2,ro=Math.max(o.osz,o.hole+1)/2,d=vert?[0,1]:[-1,0],c0=edge(B,d[0],d[1],cx,cy)+ro-2.6,hl=ui.rslope?o.rhl:o.rth,hr=ui.rslope?o.rhr:o.rth,dep=Math.max(hl,hr),
   g=ex(ringShape(ui.rso,ri,ui.rsi,{l:o.rpl,r:o.rpr,t:o.rpt,b:o.rpb},parseFloat(ui.rro)||0,parseFloat(ui.rri)||0,ro),dep),pa=g.attributes.position;let x0=1e9,x1=-1e9;
  for(let i=0;i<pa.count;i++){x0=Math.min(x0,pa.getX(i));x1=Math.max(x1,pa.getX(i))}
  if(hl!=hr){for(let i=0;i<pa.count;i++)if(pa.getZ(i)>dep/2)pa.setZ(i,hl+(hr-hl)*((pa.getX(i)-x0)/((x1-x0)||1)));pa.needsUpdate=true;g.computeVertexNormals()}
  add(g,0,ui.cr,cx+d[0]*c0+(o.rml-o.rmr),cy+d[1]*c0+(o.rmb-o.rmt),true)}
 if(ctx.firstFit){ctx.firstFit=false;ctx.setRad(ctx.clamp(Math.max(hx,hy)*FIRST_FIT_ZOOM_FACTOR+FIRST_FIT_ZOOM_OFFSET))}
 let ds='';
 grp.updateMatrixWorld(true);
 {const sz=new THREE.Box3().setFromObject(grp).getSize(new THREE.Vector3());ds=`Size: ${sz.x.toFixed(1)} × ${sz.y.toFixed(1)} × ${sz.z.toFixed(1)} mm (X × Y × Z)`;ctx.setDims(ds)}
 ctx.draw();
 return { dims: ds };
}