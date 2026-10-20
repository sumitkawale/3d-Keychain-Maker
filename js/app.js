const $=id=>document.getElementById(id),PI=Math.PI,R=8,esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const S1=[['pad','Padding / contour offset (mm)',.5,30,4,.5],['baseT','Base thickness (mm)',.4,10,2.4,.2],['rel','Border height (mm)',.2,8,1.2,.2],['bord','Border width (mm)',0,10,2,.2],['gap','Space between components (mm)',0,50,3,.5]];
const S2=[['hole','Inner hole size (mm)',0,30,4.5,.5],['osz','Outer shape size (mm)',2,60,10.5,.5]],S3=['rpt','rpb','rpl','rpr','rhl','rhr','rth','rmt','rmb','rml','rmr'];
const sl=(a,ids)=>a.filter(x=>ids.includes(x[0])).map(([id,t,mn,mx,v,st])=>`<label>${t}</label><input type="number" id="${id}" min="${mn}" step="${st}" value="${v}">`).join('');
$('nl').innerHTML=sl(S1,['gap']);$('nb').innerHTML=sl(S1,['pad','baseT']);$('nd').innerHTML=sl(S1,['bord','rel']);$('nh').innerHTML=sl(S2,['hole','osz']);
const val=id=>{const e=$(id),v=parseFloat(e.value);return isNaN(v)?+e.defaultValue:Math.max(+e.min||0,v)};
const fonts=[{n:'Roboto Slab',css:'800 140px "Roboto Slab",serif'},{n:'Bungee',css:'400 140px Bungee,sans-serif'},{n:'Pacifico',css:'400 140px Pacifico,cursive'},{n:'Permanent Marker',css:'400 140px "Permanent Marker",cursive'},{n:'Arial Bold',css:'bold 140px Arial,sans-serif'},{n:'Courier Bold',css:'bold 140px "Courier New",monospace'}];
const GFURL='https://fonts.googleapis.com/css2?family=Bitcount+Ink:wght@100..900&family=Sacramento&family=Saira+Extra+Condensed:wght@100;200;300;400;500;600;700;800;900&family=Saira+Semi+Condensed:wght@100;200;300;400;500;600;700;800;900&family=Saira+Stencil:ital,wght@0,100..900;1,100..900&family=Saira:ital,wght@0,100..900;1,100..900&family=Salsa&family=Sarina&family=Sarpanch:wght@400;500;600;700;800;900&family=Science+Gothic:wght@100..900&family=Sekuya&family=Share+Tech&family=Share:ital,wght@0,400;0,700;1,400;1,700&family=Shojumaru&family=Sigmar&family=Sigmar+One&family=Skranji:wght@400;700&family=Slackey&family=Spirax&family=Staatliches&family=Style+Script&family=Sue+Ellen+Francisco&family=Sunflower:wght@300&family=Sunshiney&family=Supermercado+One&display=swap';
const famList=fam=>fam.map(f=>{const i=f.indexOf(':'),n=(i<0?f:f.slice(0,i)).trim(),sp=i<0?'':f.slice(i+1),ws=[];sp.replace(/^[^@]*@/,'').split(';').forEach(it=>{const p=it.split(',').pop().trim(),r=p.match(/^(\d{3})\.\.(\d{3})$/);if(r)ws.push([+r[1],+r[2]]);else if(/^\d{3}$/.test(p))ws.push([+p,+p])});return{n,wt:ws.length&&!ws.some(r=>r[0]<=400&&r[1]>=400)?ws[0][0]:400}}).filter(f=>f.n);
famList(new URL(GFURL).searchParams.getAll('family')).forEach(f=>{if(!fonts.some(x=>x.n==f.n))fonts.push({n:f.n,css:`${f.wt} 140px "${f.n}",sans-serif`})});
const fcss=n=>(fonts.find(f=>f.n==n)||fonts[0]).css,fst=f=>esc(f.css.replace('140px','17px'));
const pal=['#ffffff','#ffd23f','#ff6b6b','#2ec4b6','#111111'];let uid=1,lastFont='Roboto Slab',replT=null;
let comps=[{id:1,type:'text',text:'Your Name',font:'Roboto Slab',size:12,height:1.2,color:'#ffffff'}],bic=[];
const POS=[['tl','Top left'],['tc','Top center'],['tr','Top right'],['lc','Left center'],['rc','Right center'],['bl','Bottom left'],['bc','Bottom center'],['br','Bottom right']];

const cv=$('c'),renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,3000);camera.up.set(0,0,1);
scene.add(new THREE.AmbientLight(0xffffff,.6));
const l1=new THREE.DirectionalLight(0xffffff,.8);l1.position.set(40,-60,100);scene.add(l1);
const l2=new THREE.DirectionalLight(0xffffff,.35);l2.position.set(-60,40,30);scene.add(l2);
const grid0=new THREE.GridHelper(300,30,0x888888,0x888888);grid0.rotation.x=PI/2;grid0.position.z=-.05;grid0.material.transparent=true;grid0.material.opacity=.25;scene.add(grid0);
const grp=new THREE.Group();scene.add(grp);
let th=-PI/2,ph=.7,rad=90;const clamp=r=>Math.min(600,Math.max(15,r));
function draw(){camera.position.set(rad*Math.sin(ph)*Math.cos(th),rad*Math.sin(ph)*Math.sin(th),rad*Math.cos(ph));camera.lookAt(0,0,0);renderer.render(scene,camera)}
function resize(){const r=cv.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();draw()}
new ResizeObserver(resize).observe(cv.parentElement);
const pts=new Map();let pd=0;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY])});
cv.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;
 if(pts.size==1){th-=(e.clientX-p[0])*.008;ph=Math.min(3,Math.max(.05,ph-(e.clientY-p[1])*.008))}
 pts.set(e.pointerId,[e.clientX,e.clientY]);
 if(pts.size==2){const[a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd)rad=clamp(rad*pd/d);pd=d}
 draw()});
['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,e=>{pts.delete(e.pointerId);pd=0}));
cv.addEventListener('wheel',e=>{e.preventDefault();rad=clamp(rad*(1+e.deltaY*.001));draw()},{passive:false});

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
 const sh=[];new THREE.SVGLoader().parse(c.data).paths.forEach(p=>{const f=p.userData.style.fill;if(f==='none')return;let col=null;
  if(typeof f=='string'&&!/^url/.test(f)){try{col=new THREE.Color(f).getHexString()}catch(e){}}
  THREE.SVGLoader.createShapes(p).forEach(s=>sh.push({...s.extractPoints(16),col}))});
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
function gen0(c){
 try{if(c.type=='text'){const t=textOutlines(c.text,fcss(c.font),c.size);return t&&{geos:[{geo:new THREE.ExtrudeGeometry(t.shapes,X(c.height)),col:null}],w:t.w,h:t.h,sh:t.shapes}}
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

let first=true,bt=0;
async function build(){
 const my=++bt;
 await Promise.all([...flat(comps),...bic].filter(c=>c.type=='text').map(c=>document.fonts.load(fcss(c.font),'Ag').catch(()=>0)));
 if(my!==bt)return;
 grp.children.slice().forEach(m=>{grp.remove(m);m.geometry.dispose();m.material.dispose()});
 const o=Object.fromEntries([...S1.map(x=>x[0]),...S2.map(x=>x[0]),...S3].map(k=>[k,val(k)])),type=$('shape').value,vert=$('dir').value=='v',bs=$('bs').value,cd=$('cd').value;
 const mkI=c=>({c,r:gen(c)}),blocks=[],ok=[];let nI=0;
 comps.forEach(n=>{if(n.off)return;if(n.type=='group'){const m=n.kids.filter(k=>!k.off).map(mkI);nI+=m.length;const g=m.filter(i=>i.r);if(g.length){blocks.push({m:g,v:n.dir=='v',gap:+n.gap||0});ok.push(...g)}}else{const i=mkI(n);nI++;if(i.r){blocks.push({m:[i],v:false,gap:0});ok.push(i)}}});
 const bits=bic.filter(c=>!c.off).map(mkI),bk=bits.filter(i=>i.r),bad=nI-ok.length+bits.length-bk.length;
 $('info').textContent=bad?`${bad} component(s) produced no geometry (empty text, or an SVG/STL without usable filled shapes).`:'Sizes are in millimetres. Overlapping solids are merged by slicers on import.';
 const lay=(a,v,g)=>{const s=a.reduce((t,i)=>t+(v?i.h:i.w),0)+g*Math.max(0,a.length-1),cr=a.reduce((m,i)=>Math.max(m,v?i.w:i.h),0);let p=0;return{w:v?cr:s,h:v?s:cr,pos:a.map(i=>{const L=v?i.h:i.w,m=v?s/2-p-L/2:-s/2+p+L/2;p+=L+g;return v?[0,m]:[m,0]})}};
 blocks.forEach(b=>{const l=lay(b.m.map(i=>i.r),b.v,b.gap);b.w=l.w;b.h=l.h;b.l=l});
 const M=lay(blocks,vert,o.gap);
 blocks.forEach((b,j)=>b.m.forEach((i,k)=>{i.x=M.pos[j][0]+b.l.pos[k][0];i.y=M.pos[j][1]+b.l.pos[k][1]}));
 const add=(geo,z,col,x=0,y=0,po)=>{const mt=new THREE.MeshStandardMaterial({color:col,roughness:.55});if(po){mt.polygonOffset=true;mt.polygonOffsetFactor=-1;mt.polygonOffsetUnits=-1}const m=new THREE.Mesh(geo,mt);m.position.set(x,y,z);grp.add(m)};
 const addR=(i,z)=>i.r.geos.forEach(g=>add(g.geo,z,(!i.c.recolor&&g.col)||i.c.color,i.x,i.y)),ex=(sh,d)=>new THREE.ExtrudeGeometry(sh,X(d));
 /* base: primitive shape, or a contour that wraps the content (dilated union of all components) */
 let B,Bsh;
 if(type=='cont'&&ok.length){
  const cs=$('cs').value,off=cs=='light'?o.pad*1.5:cs=='hard'?Math.max(1,o.pad*.55):o.pad,e=off+2,box={x0:Math.min(...ok.map(i=>i.x-i.r.w/2))-e,x1:Math.max(...ok.map(i=>i.x+i.r.w/2))+e,y0:Math.min(...ok.map(i=>i.y-i.r.h/2))-e,y1:Math.max(...ok.map(i=>i.y+i.r.h/2))+e};
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
 const csv=$('cs').value,offv=type=='cont'?(csv=='light'?o.pad*1.5:csv=='hard'?Math.max(1,o.pad*.55):o.pad):1.2;
 if(ov.length){const dd=i=>Math.max(offv,(i.c.sp??.3)+bwid),e=Math.max(...ov.map(dd))+4,bf=bxo(ov,e),m=mask(bf,(x,tf)=>{pp(x,tf,B);x.fill();x.lineJoin='round';ov.forEach(i=>{x.lineWidth=2*dd(i)*R;i.r.sh.forEach(q=>{pp(x,tf,q.getPoints(),i.x,i.y);x.fill();x.stroke()})});ov.forEach(i=>{x.lineWidth=Math.max(1,Math.min(i.r.w,i.r.h)*.5)*R;const a=tf(i.x,i.y),b=tf(cx,cy);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()})}),L=tr(m);if(L.length){const t=toShapes(L,1/R,bf.x0,bf.y1,false);B=t.big;Bsh=t.shapes}}
 let Bf=Bsh;
 if($('fillb').checked&&nb.length){const bf=bxo(nb,offv+3),m=mask(bf,(x,tf)=>{pp(x,tf,B);x.fill();x.lineJoin='round';x.lineWidth=2*offv*R;nb.forEach(i=>i.r.sh.forEach(s=>{pp(x,tf,s.getPoints(),i.x,i.y);x.fill();x.stroke()}))}),L=tr(m);if(L.length)Bf=toShapes(L,1/R,bf.x0,bf.y1,false).shapes}
 add(ex(Bf,o.baseT),0,$('cb').value);
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
 $('slopebox').hidden=!$('rslope').checked;
 if(o.hole>0){const ri=o.hole/2,ro=Math.max(o.osz,o.hole+1)/2,d=vert?[0,1]:[-1,0],c0=edge(B,d[0],d[1],cx,cy)+ro-2.6,hl=$('rslope').checked?o.rhl:o.rth,hr=$('rslope').checked?o.rhr:o.rth,dep=Math.max(hl,hr),
   g=ex(ringShape($('rso').value,ri,$('rsi').value,{l:o.rpl,r:o.rpr,t:o.rpt,b:o.rpb},parseFloat($('rro').value)||0,parseFloat($('rri').value)||0,ro),dep),pa=g.attributes.position;let x0=1e9,x1=-1e9;
  for(let i=0;i<pa.count;i++){x0=Math.min(x0,pa.getX(i));x1=Math.max(x1,pa.getX(i))}
  if(hl!=hr){for(let i=0;i<pa.count;i++)if(pa.getZ(i)>dep/2)pa.setZ(i,hl+(hr-hl)*((pa.getX(i)-x0)/((x1-x0)||1)));pa.needsUpdate=true;g.computeVertexNormals()}
  add(g,0,$('cr').value,cx+d[0]*c0+(o.rml-o.rmr),cy+d[1]*c0+(o.rmb-o.rmt),true)}
 if(first){first=false;rad=clamp(Math.max(hx,hy)*4.4+20)}
 grp.updateMatrixWorld(true);{const sz=new THREE.Box3().setFromObject(grp).getSize(new THREE.Vector3()),ds=`Size: ${sz.x.toFixed(1)} × ${sz.y.toFixed(1)} × ${sz.z.toFixed(1)} mm (X × Y × Z)`;$('dims').textContent=ds;$('dims2').textContent=ds}
 clearTimeout(ct);ct=setTimeout(commit,500);
 draw();
}
let tm;const later=()=>{clearTimeout(tm);tm=setTimeout(build,150)};

/* ---- component cards ---- */
const card=(c,b)=>`<div class="card${c.off?' off':''}" data-id="${c.id}"${b?' data-b="1"':''}><div class="hd"${b?' style="cursor:default"':''}>${b?'':'☰ '}${c.type=='text'?'Text':c.type.toUpperCase()+' · '+esc(c.name||'icon')}<i data-eye title="Show / hide">${c.off?'🚫':'👁'}</i><i data-del>✕</i></div>`+
 (c.type=='text'?`<textarea data-k="text">${esc(c.text)}</textarea><label>Font</label><div class="fsel"><button class="sec" type="button" data-fb style="font:${fst(fonts.find(f=>f.n==c.font)||fonts[0])};width:100%;text-align:left">${esc(c.font)} ▾</button><div class="fl" hidden>${fonts.map(f=>`<div class="fo${f.n==c.font?' sel':''}" data-fv="${esc(f.n)}" style="font:${fst(f)}">${esc(f.n)}</div>`).join('')}</div></div>`:'')+
 (b?`<label>Position on border</label><select data-k="pos">${POS.map(p=>`<option value="${p[0]}"${p[0]==c.pos?' selected':''}>${p[1]}</option>`).join('')}</select>`:'')+
 `<div class="row"><div><label>Rotate (°)</label><input type="number" data-k="rot" step="5" value="${c.rot||0}"></div></div>${b?`<label>Padding from edge (mm)</label><div class="row">${[['pt','Top'],['pb','Bottom'],['pl','Left'],['pr','Right']].map(([k,t])=>`<div><label>${t}</label><input type="number" data-k="${k}" step=".5" value="${c[k]||0}"></div>`).join('')}</div><div class="row"><div><label>Gap to border (mm)</label><input type="number" data-k="sp" step=".1" min="0" value="${c.sp??.3}"></div></div><label class="ck"><input type="checkbox" data-k="over"${c.over?' checked':''}> Border goes around this item (instead of being cut)</label>`:''}<div class="row"><div><label>${c.type=='text'?'Text':'Icon'} size (mm)</label><input type="number" data-k="size" min="1" step=".5" value="${c.size}"></div><div><label>Colour</label><input type="color" data-k="color" value="${c.color}"></div></div>`+
 `<label>Height (mm)</label><input type="number" data-k="height" min=".2" step=".2" value="${c.height}">`+
 (c.type=='svg'?`<button class="sec" data-orig style="width:100%">Use original SVG colours</button>`:'')+(c.type=='text'?'':`<div class="row"><label class="ck"><input type="checkbox" data-k="fx"${c.fx?' checked':''}> Flip ↔</label><label class="ck"><input type="checkbox" data-k="fy"${c.fy?' checked':''}> Flip ↕</label></div><button class="sec" data-repl style="width:100%">Replace icon…</button>`)+`</div>`;
const gcard=g=>`<div class="card gc${g.off?' off':''}" data-id="${g.id}"><div class="hd">☰ Group<i data-eye title="Show / hide">${g.off?'🚫':'👁'}</i><i data-del>✕</i></div><div class="row"><div><label>Name</label><input type="text" data-k="name" value="${esc(g.name||'')}"></div><div><label>Layout</label><select data-k="dir"><option value="v"${g.dir=='v'?' selected':''}>Stacked</option><option value="h"${g.dir!='v'?' selected':''}>Side by side</option></select></div><div><label>Gap (mm)</label><input type="number" data-k="gap" step=".5" min="0" value="${g.gap}"></div></div><div class="kids">${g.kids.map(k=>card(k,0)).join('')}</div><div class="row"><button class="sec" data-addt="${g.id}">+ Text</button><button class="sec" data-addi="${g.id}">+ Icon</button></div></div>`;
const flat=a=>a.flatMap(n=>n.kids?[n,...n.kids]:[n]);
const renderList=()=>{$('list').innerHTML=comps.map(n=>n.type=='group'?gcard(n):card(n,0)).join('')},renderBI=()=>{$('bi').innerHTML=bic.map(c=>card(c,1)).join('')};
const push=(c,b,par)=>{const n={id:++uid,size:b?(c.type=='text'?6:8):12,height:1.2,color:c.type=='text'?'#ffffff':pal[uid%pal.length],recolor:false,pos:'tl',rot:0,pt:0,pb:0,pl:0,pr:0,...c};if(par)flat(comps).find(x=>x.id==par).kids.push(n);else(b?bic:comps).push(n);renderList();renderBI();build()};
let ftarget=null;
async function readIcon(f){const n=f.name,ext=(n.split('.').pop()||'').toLowerCase();if(ext=='stl')return{type:'stl',name:n,data:await f.arrayBuffer()};if(ext=='png')return{type:'png',name:n,data:await pngGrid(f)};if(ext=='svg'||ext=='obj')return{type:ext,name:n,data:await f.text()};return null}
async function addFiles(files,b,par){for(const f of files){let r=null;try{r=await readIcon(f)}catch(e){}if(r)push(r,b,par)}}
$('rfile').onchange=async e=>{const f=e.target.files[0],c=replT;e.target.value='';if(!f||!c)return;let r=null;try{r=await readIcon(f)}catch(e2){}if(r){Object.assign(c,r,{recolor:false});renderList();renderBI();build()}};
$('addT').onclick=()=>push({type:'text',text:'Text',font:lastFont,size:12});
$('addI').onclick=()=>{ftarget=null;$('file').click()};$('addG').onclick=()=>{comps.push({id:++uid,type:'group',name:'Group '+(comps.filter(x=>x.type=='group').length+1),dir:'v',gap:1.5,kids:[]});renderList();build()};$('addB').onclick=()=>$('bfile').click();
$('file').onchange=async e=>{const t=ftarget;ftarget=null;await addFiles(e.target.files,0,t);e.target.value=''};
$('bfile').onchange=async e=>{await addFiles(e.target.files,1);e.target.value=''};
$('addBT').onclick=()=>push({type:'text',text:'Text',font:lastFont},1);
$('addBP').onclick=()=>{const t=$('svgb').value.trim();if(/<svg/i.test(t)){push({type:'svg',name:'pasted',data:t},1);$('svgb').value=''}};
$('addP').onclick=()=>{const t=$('svgp').value.trim();if(/<svg/i.test(t)){push({type:'svg',name:'pasted',data:t});$('svgp').value=''}};
const asd=document.querySelector('aside'),ent=t=>{const cd=t.closest('.card');return cd&&flat(cd.dataset.b?bic:comps).find(x=>x.id==cd.dataset.id)};
asd.addEventListener('input',e=>{const t=e.target,k=t.dataset.k;
 if(k){const c=ent(t);if(!c)return;if((k=='size'||k=='height')&&!(+t.value>0))return;c[k]=t.type=='checkbox'?t.checked:(t.type=='range'||t.type=='number')?+t.value:t.value;if(k=='color')c.recolor=true;if(t.type=='range')t.previousElementSibling.querySelector('b').textContent=t.value}
 later()});
asd.addEventListener('click',e=>{const t=e.target;
 if(t.dataset.fb===undefined)document.querySelectorAll('.fl').forEach(x=>x.hidden=true);
 if(t.dataset.fb!==undefined){const l=t.nextElementSibling,h=l.hidden;document.querySelectorAll('.fl').forEach(x=>x.hidden=true);l.hidden=!h;if(!l.hidden){const q=l.querySelector('.sel');if(q)l.scrollTop=q.offsetTop-(l.clientHeight-q.offsetHeight)/2}return}
 if(t.dataset.fv!==undefined){ent(t).font=lastFont=t.dataset.fv;renderList();renderBI();build();return}
 if(t.dataset.repl!==undefined){replT=ent(t);$('rfile').click();return}
 if(t.dataset.eye!==undefined){const c=ent(t);c.off=!c.off;renderList();renderBI();build();return}
 if(t.dataset.orig!==undefined){ent(t).recolor=false;build();return}
 if(t.dataset.addt!==undefined){push({type:'text',text:'Text',font:lastFont,size:12},0,t.dataset.addt);return}
 if(t.dataset.addi!==undefined){ftarget=t.dataset.addi;$('file').click();return}
 if(t.dataset.del===undefined)return;const c=ent(t);comps=comps.filter(x=>x!==c);comps.forEach(g=>{if(g.kids)g.kids=g.kids.filter(x=>x!==c)});bic=bic.filter(x=>x!==c);renderList();renderBI();build()});
asd.addEventListener('keydown',e=>{const t=e.target;if(t.dataset.fb===undefined)return;const l=t.nextElementSibling;
 if(e.key=='Escape'){l.hidden=true;return}if(e.key!='ArrowDown'&&e.key!='ArrowUp')return;e.preventDefault();
 const c=ent(t),i=fonts.findIndex(f=>f.n==c.font),n=Math.min(fonts.length-1,Math.max(0,i+(e.key=='ArrowDown'?1:-1)));if(n==i)return;
 c.font=lastFont=fonts[n].n;t.textContent=c.font+' ▾';t.style.font=fonts[n].css.replace('140px','17px');
 [...l.children].forEach((x,j)=>x.classList.toggle('sel',j==n));const q=l.children[n];if(!l.hidden)l.scrollTop=q.offsetTop-(l.clientHeight-q.offsetHeight)/2;later()});
/* drag to reorder components (pointer events, works on touch) */
const list=$('list');let drag=null;
list.addEventListener('pointerdown',e=>{if(e.target.closest('i,input,select,button,textarea,.fl'))return;const h=e.target.closest('.hd');if(!h)return;drag=h.closest('.card');drag.classList.add('drag');drag.style.pointerEvents='none';list.setPointerCapture(e.pointerId)});
list.addEventListener('pointermove',e=>{if(!drag)return;const el=document.elementFromPoint(e.clientX,e.clientY);let c=el&&el.closest('.kids,#list');if(!c||!list.contains(c)&&c!==list)return;if(drag.classList.contains('gc'))c=list;
 const sib=[...c.children].filter(x=>x!==drag&&x.classList.contains('card')),t=sib.find(x=>{const r=x.getBoundingClientRect();return e.clientY<r.top+r.height/2});c.insertBefore(drag,t||null)});
const endDrag=()=>{if(!drag)return;drag.classList.remove('drag');drag.style.pointerEvents='';drag=null;const idx={};flat(comps).forEach(n=>idx[n.id]=n);
 comps=[...list.children].filter(c=>c.classList.contains('card')).map(c=>{const n=idx[c.dataset.id];if(n.kids)n.kids=[...c.querySelector('.kids').children].filter(k=>k.classList.contains('card')).map(k=>idx[k.dataset.id]);return n});build()};
list.addEventListener('pointerup',endDrag);list.addEventListener('pointercancel',endDrag);

/* ---- Google Fonts: one link may hold many families; existing fonts are kept ---- */
$('gfb').onclick=()=>{
 const v=$('gf').value.trim(),st=$('gfs');if(!v)return;let url,fam;
 if(/^https?:/i.test(v)){let u;try{u=new URL(v)}catch(e){st.textContent='That link is not valid.';return}
  if(u.hostname!='fonts.googleapis.com'){st.textContent='Only fonts.googleapis.com links are supported.';return}
  fam=u.searchParams.getAll('family');url=v}
 else{fam=v.split(',').map(s=>s.trim()).filter(Boolean);url='https://fonts.googleapis.com/css2?'+fam.map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')).join('&')+'&display=swap'}
 const list=fam.map(f=>{const i=f.indexOf(':'),n=(i<0?f:f.slice(0,i)).trim(),sp=i<0?'':f.slice(i+1),ws=[];
  sp.replace(/^[^@]*@/,'').split(';').forEach(it=>{const p=it.split(',').pop().trim(),r=p.match(/^(\d{3})\.\.(\d{3})$/);if(r)ws.push([+r[1],+r[2]]);else if(/^\d{3}$/.test(p))ws.push([+p,+p])});
  return{n,wt:ws.length&&!ws.some(r=>r[0]<=400&&r[1]>=400)?ws[0][0]:400}}).filter(f=>f.n);
 if(!list.length){st.textContent='No font families found.';return}
 st.textContent='Loading…';const l=document.createElement('link');l.rel='stylesheet';l.href=url;
 l.onload=async()=>{let a=0;for(const f of list){if(fonts.some(x=>x.n==f.n))continue;const css=`${f.wt} 140px "${f.n}",sans-serif`;try{await document.fonts.load(css,'Ag')}catch(e){}fonts.push({n:f.n,css});a++}
  renderList();renderBI();st.textContent=`Added ${a} font(s)${a<list.length?` (${list.length-a} already in the list)`:''}. Earlier fonts are kept.`;build()};
 l.onerror=()=>{st.textContent='Could not load that link. Check it and try again.';l.remove()};document.head.append(l)};

/* ---- STL (binary) inside a zip, since the viewer only saves allow-listed types ---- */
function stlBytes(){
 grp.updateMatrixWorld(true);const tris=[],v=new THREE.Vector3();
 grp.children.forEach(m=>{const g=m.geometry,p=g.attributes.position,ix=g.index,n=ix?ix.count:p.count;
  for(let i=0;i<n;i+=3)tris.push([0,1,2].map(j=>v.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).clone().applyMatrix4(m.matrixWorld)))});
 const buf=new ArrayBuffer(84+tris.length*50),dv=new DataView(buf);dv.setUint32(80,tris.length,true);
 tris.forEach((t,i)=>{const nr=new THREE.Vector3().subVectors(t[1],t[0]).cross(new THREE.Vector3().subVectors(t[2],t[0])).normalize(),o=84+i*50;
  [nr,...t].forEach((q,j)=>{dv.setFloat32(o+j*12,q.x||0,true);dv.setFloat32(o+j*12+4,q.y||0,true);dv.setFloat32(o+j*12+8,q.z||0,true)})});
 return new Uint8Array(buf);
}
function zip(name,data){
 const T=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}
 let c=0xFFFFFFFF;for(let i=0;i<data.length;i++)c=T[(c^data[i])&255]^(c>>>8);c=(c^0xFFFFFFFF)>>>0;
 const nm=new TextEncoder().encode(name),L=30+nm.length,sz=data.length,out=new Uint8Array(L+sz+46+nm.length+22),dv=new DataView(out.buffer),w16=(o,v)=>dv.setUint16(o,v,true),w32=(o,v)=>dv.setUint32(o,v,true);
 w32(0,0x04034b50);w16(4,20);w16(12,0x21);w32(14,c);w32(18,sz);w32(22,sz);w16(26,nm.length);out.set(nm,30);out.set(data,L);
 let o=L+sz;w32(o,0x02014b50);w16(o+4,20);w16(o+6,20);w16(o+14,0x21);w32(o+16,c);w32(o+20,sz);w32(o+24,sz);w16(o+28,nm.length);out.set(nm,o+46);
 o+=46+nm.length;w32(o,0x06054b50);w16(o+8,1);w16(o+10,1);w32(o+12,46+nm.length);w32(o+16,L+sz);return out;
}
$('dl').onclick=async()=>{
 const dls=window.claude&&await claude.use('downloads');
 if(!dls){$('info').textContent='Saving files is not available in this view. Open the published page in claude.ai to download.';return}
 const t=comps.find(c=>c.type=='text'),slug=((t&&t.text.trim().split('\n')[0])||'keychain').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'keychain';
 try{await dls.save({filename:slug+'-stl.zip',data:zip(slug+'.stl',stlBytes())})}
 catch(e){if(e.code!='declined')$('info').textContent='Could not save: '+(e.message||e.code)}
};
/* multi-colour export: STL has no colour, so write a 3MF with colours + one STL per colour */
const CT=(()=>{const T=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}return T})();
function zipMulti(fs){
 const enc=new TextEncoder(),es=fs.map(f=>{let c=0xFFFFFFFF;for(let i=0;i<f.data.length;i++)c=CT[(c^f.data[i])&255]^(c>>>8);return{nm:enc.encode(f.name),d:f.data,crc:(c^0xFFFFFFFF)>>>0}});
 let tot=22,off=0;es.forEach(e=>{e.off=off;off+=30+e.nm.length+e.d.length;tot+=30+e.nm.length+e.d.length+46+e.nm.length});
 const out=new Uint8Array(tot),dv=new DataView(out.buffer),w16=(o,v)=>dv.setUint16(o,v,true),w32=(o,v)=>dv.setUint32(o,v,true);let o=0;
 es.forEach(e=>{w32(o,0x04034b50);w16(o+4,20);w16(o+12,0x21);w32(o+14,e.crc);w32(o+18,e.d.length);w32(o+22,e.d.length);w16(o+26,e.nm.length);out.set(e.nm,o+30);out.set(e.d,o+30+e.nm.length);o+=30+e.nm.length+e.d.length});
 const cs=o;es.forEach(e=>{w32(o,0x02014b50);w16(o+4,20);w16(o+6,20);w16(o+14,0x21);w32(o+16,e.crc);w32(o+20,e.d.length);w32(o+24,e.d.length);w16(o+28,e.nm.length);w32(o+42,e.off);out.set(e.nm,o+46);o+=46+e.nm.length});
 w32(o,0x06054b50);w16(o+8,es.length);w16(o+10,es.length);w32(o+12,o-cs);w32(o+16,cs);return out}
function meshTris(ms){const tr=[],v=new THREE.Vector3();ms.forEach(m=>{const g=m.geometry,p=g.attributes.position,ix=g.index,n=ix?ix.count:p.count;for(let i=0;i<n;i+=3)tr.push([0,1,2].map(j=>v.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).clone().applyMatrix4(m.matrixWorld)))});return tr}
function stlOf(tr){const buf=new ArrayBuffer(84+tr.length*50),dv=new DataView(buf);dv.setUint32(80,tr.length,true);
 tr.forEach((t,i)=>{const nr=new THREE.Vector3().subVectors(t[1],t[0]).cross(new THREE.Vector3().subVectors(t[2],t[0])).normalize(),o=84+i*50;[nr,...t].forEach((q,j)=>{dv.setFloat32(o+j*12,q.x||0,true);dv.setFloat32(o+j*12+4,q.y||0,true);dv.setFloat32(o+j*12+8,q.z||0,true)})});return new Uint8Array(buf)}
function mf3(by){
 const enc=new TextEncoder(),mats=[],objs=[],items=[],f4=n=>n.toFixed(4);let i=0;
 for(const[h,ms]of by){const vm=new Map(),vs=[],ts=[],vi=q=>{const k=f4(q.x)+','+f4(q.y)+','+f4(q.z);let n=vm.get(k);if(n===undefined){n=vs.length;vm.set(k,n);vs.push(q)}return n};
  meshTris(ms).forEach(t=>{const a=vi(t[0]),b=vi(t[1]),c=vi(t[2]);if(a!=b&&b!=c&&a!=c)ts.push(`<triangle v1="${a}" v2="${b}" v3="${c}"/>`)});
  mats.push(`<base name="#${h}" displaycolor="#${h}"/>`);
  objs.push(`<object id="${i+2}" type="model" pid="1" pindex="${i}" name="colour-${h}"><mesh><vertices>${vs.map(q=>`<vertex x="${f4(q.x)}" y="${f4(q.y)}" z="${f4(q.z)}"/>`).join('')}</vertices><triangles>${ts.join('')}</triangles></mesh></object>`);items.push(`<item objectid="${i+2}"/>`);i++}
 const H='<?xml version="1.0" encoding="UTF-8"?>';
 return zipMulti([{name:'[Content_Types].xml',data:enc.encode(H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')},
  {name:'_rels/.rels',data:enc.encode(H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')},
  {name:'3D/3dmodel.model',data:enc.encode(H+`<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><basematerials id="1">${mats.join('')}</basematerials>${objs.join('')}</resources><build>${items.join('')}</build></model>`)}])}
$('dl').onclick=async()=>{
 const dls=window.claude&&await claude.use('downloads');
 if(!dls){$('info').textContent='Saving files is not available in this view. Open the published page in claude.ai to download.';return}
 grp.updateMatrixWorld(true);const by=new Map();grp.children.forEach(m=>{const h=m.material.color.getHexString();if(!by.has(h))by.set(h,[]);by.get(h).push(m)});
 const files=[{name:'keychain.3mf',data:mf3(by)},{name:'keychain-all-colours.stl',data:stlOf(meshTris(grp.children))}];
 for(const[h,ms]of by)files.push({name:`parts/colour-${h}.stl`,data:stlOf(meshTris(ms))});
 const t=comps.find(c=>c.type=='text'),slug=((t&&t.text.trim().split('\n')[0])||'keychain').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'keychain';
 try{await dls.save({filename:slug+'-print-files.zip',data:zipMulti(files)})}
 catch(e){if(e.code!='declined')$('info').textContent='Could not save: '+(e.message||e.code)}
};
/* undo / redo */
const cl=a=>a.map(c=>({...c,...(c.kids?{kids:c.kids.map(k=>({...k}))}:{})}));
const hist=[];let hi=-1,ct,rest=false;
const UIS=()=>[...asd.querySelectorAll('input[id],select[id]')].filter(e=>e.type!='file'&&e.id!='gf');
const snap=()=>{const ui={};UIS().forEach(e=>ui[e.id]=e.type=='checkbox'?e.checked:e.value);return{comps:cl(comps),bic:bic.map(c=>({...c})),ui}};
const skey=s=>JSON.stringify(s,(k,v)=>k=='data'?(v&&(v.byteLength||v.length)):v);
const upd=()=>{$('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1};
function commit(){if(rest)return;const s=snap(),k=skey(s);if(hi>=0&&hist[hi].k==k)return;hist.length=hi+1;hist.push({s,k});if(hist.length>100)hist.shift();hi=hist.length-1;upd()}
function go(d){clearTimeout(ct);commit();const n=hi+d;if(n<0||n>=hist.length)return;hi=n;const s=hist[n].s;rest=true;comps=cl(s.comps);bic=s.bic.map(c=>({...c}));
 UIS().forEach(e=>{if(e.id in s.ui){if(e.type=='checkbox')e.checked=s.ui[e.id];else e.value=s.ui[e.id]}});renderList();renderBI();build().then(()=>{rest=false;upd()})}
$('undo').onclick=()=>go(-1);$('redo').onclick=()=>go(1);
const defUI={};UIS().forEach(e=>defUI[e.id]=e.type=='checkbox'?e.checked:e.value);
$('clr').onclick=()=>{clearTimeout(ct);commit();comps=[{id:++uid,type:'text',text:'Your Name',font:'Roboto Slab',size:12,height:1.2,color:'#ffffff'}];bic=[];
 UIS().forEach(e=>{if(e.id in defUI){if(e.type=='checkbox')e.checked=defUI[e.id];else e.value=defUI[e.id]}});renderList();renderBI();commit();build()};
addEventListener('keydown',e=>{const t=e.target;if(t.tagName=='TEXTAREA'||(t.tagName=='INPUT'&&/text|number/.test(t.type)))return;if((e.ctrlKey||e.metaKey)&&!e.altKey){const k=e.key.toLowerCase();if(k=='z'){e.preventDefault();go(e.shiftKey?1:-1)}else if(k=='y'){e.preventDefault();go(1)}}});
/* export: OBJ + MTL (colours) or one STL per colour; only the chosen format goes in the zip */
const enc=s=>new TextEncoder().encode(s);
function objOf(by,name){const vs=[],fl=[],f4=n=>n.toFixed(4);let mt='',base=0;
 by.forEach((ms,h)=>{const col=[0,2,4].map(i=>(parseInt(h.slice(i,i+2),16)/255).toFixed(4)).join(' '),vm=new Map();
  mt+=`newmtl c${h}\nKa ${col}\nKd ${col}\nKs 0.0 0.0 0.0\nd 1.0\nillum 1\n\n`;fl.push(`o colour-${h}`,`usemtl c${h}`,'s off');
  const vi=q=>{const k=f4(q.x)+' '+f4(q.y)+' '+f4(q.z);let n=vm.get(k);if(n===undefined){n=vm.size;vm.set(k,n);vs.push(`v ${k} ${col}`)}return base+n+1};
  meshTris(ms).forEach(t=>{const a=vi(t[0]),b=vi(t[1]),c=vi(t[2]);if(a!=b&&b!=c&&a!=c)fl.push(`f ${a} ${b} ${c}`)});base+=vm.size});
 return{obj:`# colours: see ${name}.mtl (also stored as per-vertex r g b)\nmtllib ${name}.mtl\n${vs.join('\n')}\n${fl.join('\n')}\n`,mtl:mt}}
function mf3b(by,name){
 const H='<?xml version="1.0" encoding="UTF-8"?>',f4=n=>n.toFixed(4),cols=[...by.keys()],vs=[],ts=[],vols=[];
 cols.forEach((h,ci)=>{const vm=new Map(),first=ts.length,vi=q=>{const k=f4(q.x)+' '+f4(q.y)+' '+f4(q.z);let n=vm.get(k);if(n===undefined){n=vs.length;vm.set(k,n);vs.push(`<vertex x="${f4(q.x)}" y="${f4(q.y)}" z="${f4(q.z)}"/>`)}return n};
  meshTris(by.get(h)).forEach(t=>{const a=vi(t[0]),b=vi(t[1]),c=vi(t[2]);if(a!=b&&b!=c&&a!=c)ts.push(`<triangle v1="${a}" v2="${b}" v3="${c}" pid="1" p1="${ci}"/>`)});vols.push({h,first,last:ts.length-1,e:ci+1})});
 const model=H+`<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><basematerials id="1">${cols.map(h=>`<base name="#${h}" displaycolor="#${h.toUpperCase()}"/>`).join('')}</basematerials><object id="2" type="model" name="${name}"><mesh><vertices>${vs.join('')}</vertices><triangles>${ts.join('')}</triangles></mesh></object></resources><build><item objectid="2"/></build></model>`;
 const cfg=H+`<config><object id="2" instances_count="1"><metadata type="object" key="name" value="${name}"/>${vols.map(v=>`<volume firstid="${v.first}" lastid="${v.last}"><metadata type="volume" key="name" value="colour-${v.h}"/><metadata type="volume" key="volume_type" value="ModelPart"/><metadata type="volume" key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/><metadata type="volume" key="extruder" value="${v.e}"/><mesh edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/></volume>`).join('')}</object></config>`;
 return zipMulti([{name:'[Content_Types].xml',data:enc(H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="text/xml"/></Types>')},
  {name:'_rels/.rels',data:enc(H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')},
  {name:'3D/3dmodel.model',data:enc(model)},{name:'Metadata/Slic3r_PE_model.config',data:enc(cfg)}])}
$('dl').onclick=async()=>{
 grp.updateMatrixWorld(true);const by=new Map();grp.children.forEach(m=>{const h=m.material.color.getHexString();if(!by.has(h))by.set(h,[]);by.get(h).push(m)});
 const t=flat(comps).find(c=>c.type=='text'),sl=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),slug=sl($('kname').value)||sl(t&&t.text.split('\n')[0])||'keychain',files=[],f=$('fmt').value;
 if(f=='3mf')files.push({name:slug+'.3mf',data:mf3b(by,slug)});
 else if(f=='obj'){const r=objOf(by,slug);files.push({name:slug+'.obj',data:enc(r.obj)},{name:slug+'.mtl',data:enc(r.mtl)})}
 else{files.push({name:slug+'.stl',data:stlOf(meshTris(grp.children))});if(by.size>1)for(const[h,ms]of by)files.push({name:`${slug}-colour-parts/${slug}-${h}.stl`,data:stlOf(meshTris(ms))})}
 const data=zipMulti(files);let dls=null;try{dls=window.claude&&await claude.use('downloads')}catch(e){}
 try{if(dls)await dls.save({filename:slug+'.zip',data});
  else{const u=URL.createObjectURL(new Blob([data],{type:'application/zip'})),a=document.createElement('a');a.href=u;a.download=slug+'.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}}
 catch(e){if(e.code!='declined')$('info').textContent='Could not save: '+(e.message||e.code)}
};
renderList();renderBI();document.fonts&&document.fonts.ready.then(build);build();commit();
