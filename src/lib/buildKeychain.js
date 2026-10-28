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
 /* Base thickness 0: no base and no main border; the keyring is attached straight to the model's own outline. */
 const noBase=o.baseT<=0.001;
 const mkI=c=>({c,r:gen(c)}),ok=[];let nI=0;
 const lay=(a,v,g)=>{const s=a.reduce((t,i)=>t+(v?i.h:i.w),0)+g*Math.max(0,a.length-1),cr=a.reduce((m,i)=>Math.max(m,v?i.w:i.h),0);let p=0;return{w:v?cr:s,h:v?s:cr,pos:a.map(i=>{const L=v?i.h:i.w,m=v?s/2-p-L/2:-s/2+p+L/2;p+=L+g;return v?[0,m]:[m,0]})}};
 /* Each node becomes a block {w,h,place(x,y)}; groups lay out their children (groups can nest), and the move offsets nudge the result. */
 /* Rotating a group turns everything in it as one rigid body about the group's centre, then rests it on the base. */
 const corners=i=>{const pts=[];i.r.geos.forEach(g=>{g.geo.computeBoundingBox();const b=g.geo.boundingBox;[b.min.x,b.max.x].forEach(x=>[b.min.y,b.max.y].forEach(y=>[b.min.z,b.max.z].forEach(z=>pts.push(new THREE.Vector3(x,y,z).applyMatrix4(i.M)))))});return pts};
 const rotateGroup=(items,px,py,n)=>{
  items.forEach(i=>{if(!i.M)i.M=new THREE.Matrix4().makeTranslation(i.x,i.y,0)});
  let zl=1e9,zh=-1e9;items.forEach(i=>corners(i).forEach(v=>{zl=Math.min(zl,v.z);zh=Math.max(zh,v.z)}));
  const pz=(zl+zh)/2,E=d=>(+d||0)*PI/180,R3=new THREE.Matrix4().makeRotationZ(E(n.rz)).multiply(new THREE.Matrix4().makeRotationY(E(n.ry))).multiply(new THREE.Matrix4().makeRotationX(E(n.rx))),
   G=new THREE.Matrix4().makeTranslation(px,py,pz).multiply(R3).multiply(new THREE.Matrix4().makeTranslation(-px,-py,-pz));
  items.forEach(i=>i.M.premultiply(G));
  let z2=1e9;items.forEach(i=>corners(i).forEach(v=>{z2=Math.min(z2,v.z)}));
  items.forEach(i=>i.M.premultiply(new THREE.Matrix4().makeTranslation(0,0,-z2)));
 };
 const mkBlock=n=>{
  if(n.off)return null;
  const dx=(+n.ml||0)-(+n.mr||0),dy=(+n.mb||0)-(+n.mt||0);
  if(n.type=='group'){
   const kids=n.kids.map(mkBlock).filter(Boolean);if(!kids.length)return null;
   const l=lay(kids,n.dir=='v',+n.gap||0),items=kids.flatMap(k=>k.items),turn=!!(+n.rx||+n.ry||+n.rz);
   return{w:l.w,h:l.h,items,place:(x,y)=>{kids.forEach((k,j)=>k.place(x+dx+l.pos[j][0],y+dy+l.pos[j][1]));if(turn)rotateGroup(items,x+dx,y+dy,n)}};
  }
  const i=mkI(n);nI++;if(!i.r)return null;ok.push(i);
  return{w:i.r.w,h:i.r.h,items:[i],place:(x,y)=>{i.x=x+dx;i.y=y+dy;i.M=null}};
 };
 const blocks=st.comps.map(mkBlock).filter(Boolean);
 const bits=st.bic.filter(c=>!c.off).map(mkI),bk=bits.filter(i=>i.r),bad=nI-ok.length+bits.length-bk.length;
 const M=lay(blocks,vert,o.gap);
 blocks.forEach((b,j)=>b.place(M.pos[j][0],M.pos[j][1]));
 /* Items inside rotated groups: bake the world matrix into their footprint so the base, contour and border follow them. */
 ok.filter(i=>i.M).forEach(i=>{
  let top=0;i.r.geos.forEach(g=>{g.geo.computeBoundingBox();top=Math.max(top,g.geo.boundingBox.max.z)});
  const mp=(p,z)=>{const v=new THREE.Vector3(p.x,p.y,z).applyMatrix4(i.M);return V(v.x,v.y)};
  const bot=i.r.sh.map(q=>q.getPoints().map(p=>mp(p,0))),all=bot.flat().concat(i.r.sh.flatMap(q=>q.getPoints().map(p=>mp(p,top))));
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;all.forEach(p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)});
  const cx=(x0+x1)/2,cy=(y0+y1)/2;
  i.x=cx;i.y=cy;i.r={...i.r,w:x1-x0,h:y1-y0,sh:bot.map(pts=>new THREE.Shape(pts.map(p=>V(p.x-cx,p.y-cy)))),hull:hull(all.map(p=>V(p.x-cx,p.y-cy)))};
 });
 let tag={};
 const add=(geo,z,col,x=0,y=0,po)=>{const mt=new THREE.MeshStandardMaterial({color:col,roughness:.55});if(po){mt.polygonOffset=true;mt.polygonOffsetFactor=-1;mt.polygonOffsetUnits=-1}const m=new THREE.Mesh(geo,mt);m.position.set(x,y,z);m.userData={...tag};group.add(m)};
 const addM=(geo,z,col,Mx)=>{const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col,roughness:.55}));m.matrixAutoUpdate=false;m.matrix.copy(new THREE.Matrix4().makeTranslation(0,0,z).multiply(Mx));m.userData={...tag};group.add(m)};
 const addR=(i,z)=>i.r.geos.forEach(g=>{tag={kind:'item',id:i.c.id};const col=(!i.c.recolor&&g.col)||i.c.color;if(i.M)addM(g.geo,z,col,i.M);else add(g.geo,z,col,i.x,i.y)}),ex=(sh,d)=>new THREE.ExtrudeGeometry(sh,X(d));
 /* base: primitive shape, or a contour that wraps the content (dilated union of all components) */
 let B,Bsh;
 if((type=='cont'||noBase)&&ok.length){
  const cs=noBase?'hard':s.cs,off=noBase?1:cs=='light'?o.pad*1.5:cs=='hard'?Math.max(1,o.pad*.55):o.pad,e=off+2,box={x0:Math.min(...ok.map(i=>i.x-i.r.w/2))-e,x1:Math.max(...ok.map(i=>i.x+i.r.w/2))+e,y0:Math.min(...ok.map(i=>i.y-i.r.h/2))-e,y1:Math.max(...ok.map(i=>i.y+i.r.h/2))+e};
  const m=mask(box,(x,tf)=>{x.lineJoin='round';x.lineWidth=2*off*R;ok.forEach(i=>i.r.sh.forEach(s=>{pp(x,tf,s.getPoints(),i.x,i.y);x.fill();x.stroke()}));
   if(cs=='hard')ok.forEach(i=>{x.lineWidth=Math.max(1.5,Math.min(i.r.w,i.r.h)*.22)*R;x.lineCap='butt';const a=tf(i.x-i.r.w/2,i.y),b=tf(i.x+i.r.w/2,i.y),c=tf(i.x,i.y-i.r.h/2),d=tf(i.x,i.y+i.r.h/2);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.moveTo(c[0],c[1]);x.lineTo(d[0],d[1]);x.stroke();x.lineCap='round'});
   if(ok.length>1){x.lineWidth=(cs=='hard'?Math.min(...ok.map(i=>i.r.h))*.1+1:Math.min(...ok.map(i=>i.r.h))*.5+o.pad)*R;x.beginPath();ok.forEach((i,j)=>{const[a,b]=tf(i.x,i.y);j?x.lineTo(a,b):x.moveTo(a,b)});x.stroke()}});
  let L=tr(m);
  if(L.length&&cs=='light'){const P1=toShapes(L,1/R,box.x0,box.y1,false).big,m2=mask(box,(x,tf)=>{pp(x,tf,P1);x.fill();x.globalCompositeOperation='destination-out';pp(x,tf,P1);x.lineWidth=o.pad*R;x.stroke()}),L2=tr(m2);if(L2.length)L=L2}
  if(L.length){const t=toShapes(L,1/R,box.x0,box.y1,false);Bsh=t.shapes;B=t.big}
 }
 if(!B){const k={rect:1,pill:1.05,ellipse:1.42,hex:1.38}[type]||1,cw=ok.length?Math.max(M.w,Math.max(...ok.map(i=>Math.abs(i.x)+i.r.w/2))*2):M.w,ch=ok.length?Math.max(M.h,Math.max(...ok.map(i=>Math.abs(i.y)+i.r.h/2))*2):M.h,bw=Math.max(10,cw*k+2*o.pad),bh=Math.max(10,ch*k+2*o.pad);Bsh=mk(type,bw,bh);B=Bsh.getPoints(64)}
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
 tag={kind:'base'};
 if(!noBase)add(ex(Bf,o.baseT),0,s.cb);
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
 tag={kind:'border'};
 if(!noBase)makeBorder(B,bs,o.bord,cd,mainCuts);
 ow.forEach(i=>{tag={kind:'item',id:i.c.id};makeBorder(i.fp,i.c.ob,+i.c.obw||1.2,i.c.obc||'#ffffff',[])});
 bk.forEach(i=>addR(i,o.baseT));
 if(o.hole>0){const ri=o.hole/2,ro=Math.max(o.osz,o.hole+1)/2,d=vert?[0,1]:[-1,0],c0=edge(B,d[0],d[1],cx,cy)+ro-(noBase?4:2.6),hl=s.rslope?o.rhl:o.rth,hr=s.rslope?o.rhr:o.rth,dep=Math.max(hl,hr),
   g=ex(ringShape(s.rso,ri,s.rsi,{l:o.rpl,r:o.rpr,t:o.rpt,b:o.rpb},(+s.rro||0),(+s.rri||0),ro),dep),pa=g.attributes.position;let x0=1e9,x1=-1e9;
  for(let i=0;i<pa.count;i++){x0=Math.min(x0,pa.getX(i));x1=Math.max(x1,pa.getX(i))}
  if(hl!=hr){for(let i=0;i<pa.count;i++)if(pa.getZ(i)>dep/2)pa.setZ(i,hl+(hr-hl)*((pa.getX(i)-x0)/((x1-x0)||1)));pa.needsUpdate=true;g.computeVertexNormals()}
  tag={kind:'ring'};
  const kx=cx+d[0]*c0+(o.rml-o.rmr),ky=cy+d[1]*c0+(o.rmb-o.rmt),ax=+s.rkx||0,ay=+s.rky||0,az=+s.rkz||0,dz=(o.rzb||0)-(o.rzt||0);
  if(!(ax||ay||az||dz))add(g,0,s.cr,kx,ky,true);
  else{
   /* Whole keyring rotated about its centre in X, Y, Z order; if it is tilted it rests on the bed first, then Z top / bottom move it. */
   const E=a=>a*PI/180,hh=dep/2,Rm=new THREE.Matrix4().makeRotationZ(E(az)).multiply(new THREE.Matrix4().makeRotationY(E(ay))).multiply(new THREE.Matrix4().makeRotationX(E(ax))),
    Mx=new THREE.Matrix4().makeTranslation(0,0,hh).multiply(Rm).multiply(new THREE.Matrix4().makeTranslation(0,0,-hh));
   g.computeBoundingBox();const bx=g.boundingBox;let zmin=1e9;
   [bx.min.x,bx.max.x].forEach(x=>[bx.min.y,bx.max.y].forEach(y=>[bx.min.z,bx.max.z].forEach(z=>{zmin=Math.min(zmin,new THREE.Vector3(x,y,z).applyMatrix4(Mx).z)})));
   const mt=new THREE.MeshStandardMaterial({color:s.cr,roughness:.55});mt.polygonOffset=true;mt.polygonOffsetFactor=-1;mt.polygonOffsetUnits=-1;
   const m=new THREE.Mesh(g,mt);m.matrixAutoUpdate=false;m.matrix.copy(new THREE.Matrix4().makeTranslation(kx,ky,dz-(ax||ay?zmin:0)).multiply(Mx));m.userData={...tag};group.add(m)}}

  group.updateMatrixWorld(true);
  const sz = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  return { group, size: { x: sz.x, y: sz.y, z: sz.z }, bad, fit: Math.max(hx, hy) * 4.4 + 20 };
}
