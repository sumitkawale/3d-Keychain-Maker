import * as THREE from 'three';
import { FIELDS, PI, PS, R, num } from './constants.js';
import { fcss } from './fonts.js';
import { flat } from '../state/tree.js';
import { mask, pp, tr, toShapes } from './raster.js';
import { V, X, edge, gen, hull, inHull, merge, mk, ringShape } from './geometry.js';

/**
 * Builds the whole keychain (base, components, border, border items, keyring) as a THREE.Group.
 * Pure function of the app state: {comps, bic, settings}.
 * Returns the group plus its bounding size, how many components produced no geometry, and a camera fit distance.
 */
export async function buildKeychain(st) {
  const s = st.settings;
  const texts = [...flat(st.comps), ...st.bic].filter((c) => c.type === 'text');
  await Promise.all(texts.map((c) => document.fonts.load(fcss(c.font), 'Ag').catch(() => 0)));
  const group = new THREE.Group();
 const o=Object.fromEntries(Object.keys(FIELDS).map((k)=>[k,num(s,k)])),type=s.shape,vert=s.dir=='v',bs=s.bs,cd=s.cd;
 const mkI=c=>({c,r:gen(c)}),blocks=[],ok=[];let nI=0;
 st.comps.forEach(n=>{if(n.off)return;if(n.type=='group'){const m=n.kids.filter(k=>!k.off).map(mkI);nI+=m.length;const g=m.filter(i=>i.r);if(g.length){blocks.push({m:g,v:n.dir=='v',gap:+n.gap||0});ok.push(...g)}}else{const i=mkI(n);nI++;if(i.r){blocks.push({m:[i],v:false,gap:0});ok.push(i)}}});
 const bits=st.bic.filter(c=>!c.off).map(mkI),bk=bits.filter(i=>i.r),bad=nI-ok.length+bits.length-bk.length;
  const lay=(a,v,g)=>{const s=a.reduce((t,i)=>t+(v?i.h:i.w),0)+g*Math.max(0,a.length-1),cr=a.reduce((m,i)=>Math.max(m,v?i.w:i.h),0);let p=0;return{w:v?cr:s,h:v?s:cr,pos:a.map(i=>{const L=v?i.h:i.w,m=v?s/2-p-L/2:-s/2+p+L/2;p+=L+g;return v?[0,m]:[m,0]})}};
 blocks.forEach(b=>{const l=lay(b.m.map(i=>i.r),b.v,b.gap);b.w=l.w;b.h=l.h;b.l=l});
 const M=lay(blocks,vert,o.gap);
 blocks.forEach((b,j)=>b.m.forEach((i,k)=>{i.x=M.pos[j][0]+b.l.pos[k][0];i.y=M.pos[j][1]+b.l.pos[k][1]}));
 const add=(geo,z,col,x=0,y=0,po)=>{const mt=new THREE.MeshStandardMaterial({color:col,roughness:.55});if(po){mt.polygonOffset=true;mt.polygonOffsetFactor=-1;mt.polygonOffsetUnits=-1}const m=new THREE.Mesh(geo,mt);m.position.set(x,y,z);group.add(m)};
 const addR=(i,z)=>i.r.geos.forEach(g=>add(g.geo,z,(!i.c.recolor&&g.col)||i.c.color,i.x,i.y)),ex=(sh,d)=>new THREE.ExtrudeGeometry(sh,X(d));
 /* base: primitive shape, or a contour that wraps the content (dilated union of all components) */
 let B,Bsh;
 if(type=='cont'&&ok.length){
  const cs=s.cs,off=cs=='light'?o.pad*1.5:cs=='hard'?Math.max(1,o.pad*.55):o.pad,e=off+2,box={x0:Math.min(...ok.map(i=>i.x-i.r.w/2))-e,x1:Math.max(...ok.map(i=>i.x+i.r.w/2))+e,y0:Math.min(...ok.map(i=>i.y-i.r.h/2))-e,y1:Math.max(...ok.map(i=>i.y+i.r.h/2))+e};
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
 const own=i=>i.c.ob&&i.c.ob!=='base',ov=bk.filter(i=>i.c.over&&!own(i)),nb=bk.filter(i=>!(i.c.over&&!own(i))),ow=bk.filter(own),bwid=o.bord>0&&bs!='none'?o.bord:0;
 const bxo=(its,e)=>({x0:Math.min(bb.x0,...its.map(i=>i.x-i.r.w/2))-e,x1:Math.max(bb.x1,...its.map(i=>i.x+i.r.w/2))+e,y0:Math.min(bb.y0,...its.map(i=>i.y-i.r.h/2))-e,y1:Math.max(bb.y1,...its.map(i=>i.y+i.r.h/2))+e});
 const csv=s.cs,coff=csv=='light'?o.pad*1.5:csv=='hard'?Math.max(1,o.pad*.55):o.pad;
 /* Shape under a border item: its own choice, or the base shape ('auto'). */
 const KF={rect:1,pill:1.05,ellipse:1.42,hex:1.38},shp=i=>i.c.fshape&&i.c.fshape!=='auto'?i.c.fshape:type,offI=i=>shp(i)=='cont'?coff:1.2,ext=i=>offI(i)+(own(i)?(+i.c.obw||1.2):0);
 const boxPts=(i,e)=>{const t=shp(i),k=KF[t]||1;return mk(t,i.r.w*k+2*e,i.r.h*k+2*e).getPoints(48).map(p=>V(p.x+i.x,p.y+i.y))};
 const outlineDraw=(x,tf,i,e)=>{x.lineWidth=2*e*R;i.r.sh.forEach(q=>{pp(x,tf,q.getPoints(),i.x,i.y);x.fill();x.stroke()})};
 const foot=(x,tf,i,e)=>{if(shp(i)=='cont')outlineDraw(x,tf,i,e);else{pp(x,tf,boxPts(i,e));x.fill()}};
 const footPts=(i,e)=>{if(shp(i)!='cont')return boxPts(i,e);
  const bx={x0:i.x-i.r.w/2-e-2,x1:i.x+i.r.w/2+e+2,y0:i.y-i.r.h/2-e-2,y1:i.y+i.r.h/2+e+2};
  const m=mask(bx,(x,tf)=>{x.lineJoin='round';outlineDraw(x,tf,i,e);x.lineWidth=Math.max(1.5,Math.min(i.r.w,i.r.h)*.22)*R;x.lineCap='butt';
   const a=tf(i.x-i.r.w/2,i.y),b=tf(i.x+i.r.w/2,i.y),c=tf(i.x,i.y-i.r.h/2),d=tf(i.x,i.y+i.r.h/2);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.moveTo(c[0],c[1]);x.lineTo(d[0],d[1]);x.stroke()}),L=tr(m);
  return L.length?toShapes(L,1/R,bx.x0,bx.y1,false).big:boxPts(i,e)};
 ow.forEach(i=>{i.fp=footPts(i,ext(i))});
 /* "Border goes around" items: the base grows around them and the main border follows. */
 if(ov.length){const dd=i=>Math.max(offI(i),(i.c.sp??.3)+bwid),e=Math.max(...ov.map(dd))+4,bf=bxo(ov,e),m=mask(bf,(x,tf)=>{pp(x,tf,B);x.fill();x.lineJoin='round';ov.forEach(i=>{foot(x,tf,i,dd(i))});ov.forEach(i=>{x.lineWidth=Math.max(1,Math.min(i.r.w,i.r.h)*.5)*R;const a=tf(i.x,i.y),b=tf(cx,cy);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()})}),L=tr(m);if(L.length){const t=toShapes(L,1/R,bf.x0,bf.y1,false);B=t.big;Bsh=t.shapes}}
 let Bf=Bsh;
 const fl=nb.filter(i=>s.fillb||own(i));
 if(fl.length){const bf=bxo(fl,Math.max(...fl.map(ext))+3),m=mask(bf,(x,tf)=>{pp(x,tf,B);x.fill();x.lineJoin='round';fl.forEach(i=>{if(own(i)){pp(x,tf,i.fp);x.fill()}else foot(x,tf,i,ext(i))})}),L=tr(m);if(L.length)Bf=toShapes(L,1/R,bf.x0,bf.y1,false).shapes}
 add(ex(Bf,o.baseT),0,s.cb);
 /* Border builder: used for the main border and for borders that belong to a single border item. */
 const bboxOf=P=>P.reduce((a,p)=>({x0:Math.min(a.x0,p.x),x1:Math.max(a.x1,p.x),y0:Math.min(a.y0,p.y),y1:Math.max(a.y1,p.y)}),{x0:1e9,x1:-1e9,y0:1e9,y1:-1e9});
 const makeBorder=(P,style,w,col,cuts)=>{
  if(!(w>0)||style=='none')return;
  const bq=bboxOf(P),b2={x0:bq.x0-1,x1:bq.x1+1,y0:bq.y0-1,y1:bq.y1+1};
  const near=p=>cuts.some(c=>inHull(c.pts,p.x-c.x,p.y-c.y,c.gap+.5));
  const bandS=(w0,w1)=>{const m=mask(b2,(x,tf)=>{x.save();pp(x,tf,P);x.clip();pp(x,tf,P);x.lineWidth=2*w1*R;x.stroke();
    if(w0>0){x.globalCompositeOperation='destination-out';pp(x,tf,P);x.lineWidth=2*w0*R;x.stroke()}x.restore();
    x.globalCompositeOperation='destination-out';cuts.forEach(c=>{x.lineWidth=Math.max(.02,2*c.gap)*R;pp(x,tf,c.pts,c.x,c.y);x.fill();x.stroke()})}),L=tr(m);
   return L.length?toShapes(L,1/R,b2.x0,b2.y1,true).shapes:null};
  const band=(w0,w1)=>{const sh=bandS(w0,w1);if(sh)add(ex(sh,o.rel),o.baseT,col)};
  if(style=='solid')band(0,w);
  else if(style=='double'){const t=w/3;band(0,t);band(2*t,w)}
  else{
   const dm=mask(b2,(x,tf)=>{pp(x,tf,P);x.fill();x.globalCompositeOperation='destination-out';pp(x,tf,P);x.lineWidth=w*R;x.stroke()}),L=tr(dm);
   if(L.length){const c=new THREE.Shape(toShapes(L,1/R,b2.x0,b2.y1,false).big),len=c.getLength(),gs=[],dot=style!='dashed',per=style=='dotted'?w*2.4:style=='beaded'?w*.9:w*4.5,N=Math.max(3,Math.round(len/per));
    for(let i=0;i<N;i++){let g;const p=c.getPointAt(i/N);
     if(dot){if(near(p))continue;g=new THREE.CylinderGeometry(w/2,w/2,o.rel,20).rotateX(PI/2).translate(p.x,p.y,o.rel/2)}
     else{const q=c.getPointAt(Math.min(.9999,(i+.6)/N));if(near(p)||near(q))continue;g=new THREE.BoxGeometry(Math.hypot(q.x-p.x,q.y-p.y),w,o.rel).translate(0,0,o.rel/2).rotateZ(Math.atan2(q.y-p.y,q.x-p.x)).translate((p.x+q.x)/2,(p.y+q.y)/2,0)}
     gs.push(g.toNonIndexed())}
    if(gs.length)add(merge(gs),o.baseT,col)}}
 };
 const mainCuts=nb.map(i=>own(i)?{pts:hull(i.fp),x:0,y:0,gap:.05}:{pts:i.r.hull,x:i.x,y:i.y,gap:i.c.sp??.3});
 makeBorder(B,bs,o.bord,cd,mainCuts);
 ow.forEach(i=>makeBorder(i.fp,i.c.ob,+i.c.obw||1.2,i.c.obc||'#ffffff',[]));
 bk.forEach(i=>addR(i,o.baseT));
 if(o.hole>0){const ri=o.hole/2,ro=Math.max(o.osz,o.hole+1)/2,d=vert?[0,1]:[-1,0],c0=edge(B,d[0],d[1],cx,cy)+ro-2.6,hl=s.rslope?o.rhl:o.rth,hr=s.rslope?o.rhr:o.rth,dep=Math.max(hl,hr),
   g=ex(ringShape(s.rso,ri,s.rsi,{l:o.rpl,r:o.rpr,t:o.rpt,b:o.rpb},(+s.rro||0),(+s.rri||0),ro),dep),pa=g.attributes.position;let x0=1e9,x1=-1e9;
  for(let i=0;i<pa.count;i++){x0=Math.min(x0,pa.getX(i));x1=Math.max(x1,pa.getX(i))}
  if(hl!=hr){for(let i=0;i<pa.count;i++)if(pa.getZ(i)>dep/2)pa.setZ(i,hl+(hr-hl)*((pa.getX(i)-x0)/((x1-x0)||1)));pa.needsUpdate=true;g.computeVertexNormals()}
  add(g,0,s.cr,cx+d[0]*c0+(o.rml-o.rmr),cy+d[1]*c0+(o.rmb-o.rmt),true)}

  group.updateMatrixWorld(true);
  const sz = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  return { group, size: { x: sz.x, y: sz.y, z: sz.z }, bad, fit: Math.max(hx, hy) * 4.4 + 20 };
}
