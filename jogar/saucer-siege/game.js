// Saucer Siege v0.1 — Fabula Studio
// Tower defense com o Kenney Tower Defense Kit (CC0)
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SAVE_KEY='saucer_siege_v01';
const GW=16,GH=9;

// ---------- dados ----------
const LEVELS=[
 {name:'Campina Verde',coins:170,
  path:[[0,1],[4,1],[4,6],[9,6],[9,2],[14,2]],
  deco:{tree:.13,rock:.04,crystal:.0,hill:.03},
  waves:['a8:1.1','a10:.9,b4:.7','b10:.55','a10:.8,c3:2','c5:1.6,b8:.5','a12:.6,c5:1.4,b10:.4']},
 {name:'Vale dos Cristais',coins:230,
  path:[[0,7],[3,7],[3,2],[7,2],[7,6],[11,6],[11,1],[14,1]],
  deco:{tree:.08,rock:.03,crystal:.07,hill:.02},
  waves:['a10:.9','b8:.6,a8:.8','d4:1.6','c4:1.8,b10:.45','d6:1.2,a10:.6','c6:1.3,d4:1.3','b16:.35,c4:1.4','a14:.5,d6:1,c6:1.2']},
 {name:'Colinas do Castelo',coins:290,
  path:[[0,4],[2,4],[2,1],[6,1],[6,7],[10,7],[10,3],[13,3],[13,6],[14,6]],
  deco:{tree:.1,rock:.07,crystal:.02,hill:.06},
  waves:['a12:.8,b6:.6','d6:1.2','c6:1.4,b10:.4','b14:.35,d6:1','c8:1.1,a12:.5','d8:1,b12:.35','c10:1,d6:1','a20:.4,b14:.3','c12:.9,d10:.8','X1:1,c6:1.5,b16:.35']},
];
const ENEMIES={
 a:{hp:36,spd:1.25,armor:0,gold:5,model:'enemy-ufo-a',sc:.58,y:.5},
 b:{hp:22,spd:2.3,armor:0,gold:4,model:'enemy-ufo-b',sc:.48,y:.55},
 c:{hp:120,spd:.85,armor:4,gold:10,model:'enemy-ufo-c',sc:.7,y:.45},
 d:{hp:66,spd:1.1,armor:0,gold:6,model:'enemy-ufo-d',sc:.64,y:.5,split:'m'},
 m:{hp:18,spd:1.6,armor:0,gold:2,model:'enemy-ufo-d',sc:.36,y:.5},
 X:{hp:1900,spd:.5,armor:6,gold:150,model:'enemy-ufo-a-weapon',sc:1.25,y:.6,lives:10,boss:1},
};
const TOWERS={
 cannon:{name:'Canhão',cost:60,up:[70,110],desc:'Dano em área',weapon:'weapon-cannon',proj:'ball',kind:'sq',
   lv:[{dmg:16,rng:2.4,rate:1.2,spl:1.0},{dmg:27,rng:2.6,rate:1.1,spl:1.15},{dmg:44,rng:2.85,rate:1.0,spl:1.3}]},
 ballista:{name:'Balista',cost:50,up:[60,100],desc:'Rápida e de longo alcance',weapon:'weapon-ballista',proj:'arrow',kind:'rd',
   lv:[{dmg:8,rng:3.2,rate:.55},{dmg:13,rng:3.5,rate:.47},{dmg:21,rng:3.9,rate:.4}]},
 crystal:{name:'Cristal',cost:70,up:[70,110],desc:'Deixa os óvnis lentos',proj:'orb',kind:'cr',
   lv:[{dmg:4,rng:2.4,rate:.9,slow:.45,st:1.6},{dmg:7,rng:2.65,rate:.8,slow:.55,st:2},{dmg:11,rng:2.9,rate:.7,slow:.6,st:2.4,spl:.9}]},
 catapult:{name:'Catapulta',cost:110,up:[100,150],desc:'Alcance enorme, área grande',weapon:'weapon-catapult',proj:'rock',kind:'cp',unlock:1,
   lv:[{dmg:34,rng:4.4,rate:2.6,spl:1.3},{dmg:56,rng:4.8,rate:2.4,spl:1.45},{dmg:88,rng:5.2,rate:2.2,spl:1.6}]},
};
const TORDER=['ballista','cannon','crystal','catapult'];

// ---------- save ----------
let save={stars:[0,0,0]};
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(s&&s.stars)save=s;}catch(e){}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){}}

// ---------- three ----------
const R=new THREE.WebGLRenderer({antialias:true});
R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
R.outputEncoding=THREE.sRGBEncoding;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(R.domElement);
const S=new THREE.Scene();
S.background=new THREE.Color(0x8fd3ff);
S.fog=new THREE.Fog(0x8fd3ff,26,48);
const C=new THREE.PerspectiveCamera(38,1,.1,200);
const hemi=new THREE.HemisphereLight(0xeaf6ff,0x5d7a55,.75);S.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1dc,.95);sun.position.set(-6,12,7);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-11,right:11,top:8,bottom:-8,near:1,far:40});sun.shadow.bias=-.0008;
S.add(sun);S.add(sun.target);

let texReady;const texP=new Promise(r=>texReady=r);
const tex=new THREE.TextureLoader().load(COLORMAP,()=>texReady());
tex.encoding=THREE.sRGBEncoding;tex.flipY=false;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestMipmapLinearFilter;
const MAT=new THREE.MeshLambertMaterial({map:tex});

const TPL={};
function loadModels(){
  const L=new THREE.GLTFLoader();const keys=Object.keys(MODELS);let n=0;
  return new Promise(res=>{keys.forEach(k=>{
    const b=Uint8Array.from(atob(MODELS[k]),c=>c.charCodeAt(0)).buffer;
    L.parse(b,'',g=>{g.scene.traverse(o=>{if(o.isMesh){o.material=MAT;o.castShadow=true;o.receiveShadow=true}});TPL[k]=g.scene;if(++n===keys.length)res();},e=>{console.error(k,e);if(++n===keys.length)res();});
  });});
}
function M(k){const t=TPL[k];if(!t){console.warn('modelo?',k);return new THREE.Group();}return t.clone(true);}

// junta geometria estática numa malha só (menos draw calls no celular)
function mergeStatic(root){
  root.updateMatrixWorld(true);
  const P=[],N=[],U=[];let cnt=0;
  root.traverse(m=>{if(!m.isMesh)return;let g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);
    P.push(g.attributes.position.array);N.push(g.attributes.normal.array);U.push(g.attributes.uv?g.attributes.uv.array:new Float32Array(g.attributes.position.count*2));cnt+=g.attributes.position.count;});
  const cat=(arrs,sz)=>{const o=new Float32Array(cnt*sz);let off=0;arrs.forEach(a=>{o.set(a,off);off+=a.length});return o;};
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(cat(P,3),3));
  geo.setAttribute('normal',new THREE.BufferAttribute(cat(N,3),3));
  geo.setAttribute('uv',new THREE.BufferAttribute(cat(U,2),2));
  const mesh=new THREE.Mesh(geo,MAT);mesh.receiveShadow=true;mesh.castShadow=true;return mesh;
}

// ---------- utilidades ----------
const wx=cx=>cx-GW/2+.5, wz=cz=>cz-GH/2+.5;
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function rotV(v,k){let [x,z]=v;for(let i=0;i<k;i++){[x,z]=[z,-x];}return [x,z];}
function findRot(base,target){
  const key=a=>a.map(v=>v.join(',')).sort().join('|');const t=key(target);
  for(let k=0;k<4;k++){if(key(base.map(v=>rotV(v,k)))===t)return k;}return 0;
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ---------- áudio sintetizado ----------
let AC=null,muted=false;
try{muted=localStorage.getItem(SAVE_KEY+'_mute')==='1'}catch(e){}
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function tone(f,d,type,vol,slide){if(muted)return;const a=ac();if(!a)return;const t=a.currentTime;const o=a.createOscillator(),g=a.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
  g.gain.setValueAtTime(vol||.12,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02);}
function noise(d,vol,freq){if(muted)return;const a=ac();if(!a)return;const t=a.currentTime;const len=Math.floor(a.sampleRate*d);const b=a.createBuffer(1,len,a.sampleRate);const ch=b.getChannelData(0);
  for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*(1-i/len);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=freq||900;
  const g=a.createGain();g.gain.value=vol||.2;s.connect(f);f.connect(g);g.connect(a.destination);s.start(t);}
let lastSfx={};
function sfx(n){const now=performance.now();if(lastSfx[n]&&now-lastSfx[n]<60)return;lastSfx[n]=now;
  switch(n){
  case 'arrow':tone(900,.08,'triangle',.05,.5);break;
  case 'cannon':noise(.18,.18,500);tone(120,.15,'sine',.12,.5);break;
  case 'orb':tone(1200,.18,'sine',.05,1.6);break;
  case 'rock':tone(200,.25,'triangle',.08,.5);break;
  case 'boom':noise(.35,.22,380);break;
  case 'hit':tone(500,.05,'square',.025,.7);break;
  case 'pop':tone(660,.07,'square',.05,1.8);tone(990,.1,'triangle',.04,1.5);break;
  case 'coin':tone(1320,.06,'square',.03);setTimeout(()=>tone(1760,.08,'square',.03),50);break;
  case 'build':tone(330,.08,'triangle',.1);setTimeout(()=>tone(440,.08,'triangle',.1),70);setTimeout(()=>tone(660,.12,'triangle',.1),140);break;
  case 'sell':tone(660,.1,'triangle',.08,.6);break;
  case 'leak':tone(300,.4,'sawtooth',.07,.4);break;
  case 'wave':tone(392,.15,'triangle',.08);setTimeout(()=>tone(523,.2,'triangle',.08),130);break;
  case 'win':[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.25,'triangle',.1),i*140));break;
  case 'lose':[392,330,262,196].forEach((f,i)=>setTimeout(()=>tone(f,.3,'sawtooth',.06),i*180));break;
  case 'no':tone(160,.12,'square',.05);break;
  }}

// ---------- estado ----------
let G=null;          // estado da fase
let world=null;      // grupo da fase
let speed=1,paused=false,screenState='menu';
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.2),tmpV=new THREE.Vector3();
let selMarker,rangeRing,hoverCell=null;

// ---------- construção do mapa ----------
function buildPath(wp){
  const cells=[];
  for(let i=0;i<wp.length-1;i++){const [x0,z0]=wp[i],[x1,z1]=wp[i+1];const dx=Math.sign(x1-x0),dz=Math.sign(z1-z0);
    let x=x0,z=z0;while(x!==x1||z!==z1){cells.push([x,z]);x+=dx;z+=dz;}}
  cells.push(wp[wp.length-1]);return cells;
}
function pathPoints(cells){
  // pontos densos, com curvas suaves nos cantos
  const pts=[];const P=(x,z)=>new THREE.Vector3(wx(x),0,wz(z));
  const first=cells[0],d0=[cells[1][0]-first[0],cells[1][1]-first[1]];
  pts.push(P(first[0]-d0[0]*.45,first[1]-d0[1]*.45));
  for(let i=1;i<cells.length-1;i++){
    const a=cells[i-1],b=cells[i],c=cells[i+1];
    const din=[b[0]-a[0],b[1]-a[1]],dout=[c[0]-b[0],c[1]-b[1]];
    if(din[0]===dout[0]&&din[1]===dout[1]){pts.push(P(b[0],b[1]));continue;}
    const p0=P(b[0]-din[0]*.5,b[1]-din[1]*.5),p1=P(b[0],b[1]),p2=P(b[0]+dout[0]*.5,b[1]+dout[1]*.5);
    for(let t=0;t<=1.0001;t+=.125){const u=1-t;pts.push(new THREE.Vector3(u*u*p0.x+2*u*t*p1.x+t*t*p2.x,0,u*u*p0.z+2*u*t*p1.z+t*t*p2.z));}
  }
  const l=cells[cells.length-1];pts.push(P(l[0],l[1]));
  const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+pts[i].distanceTo(pts[i-1]));
  return {pts,cum,len:cum[cum.length-1]};
}
function samplePath(d,out){
  const p=G.route,{pts,cum}=p;d=clamp(d,0,p.len);
  let lo=0,hi=cum.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=d)lo=m;else hi=m;}
  const t=(d-cum[lo])/((cum[hi]-cum[lo])||1);out.lerpVectors(pts[lo],pts[hi],t);
  return Math.atan2(pts[hi].x-pts[lo].x,pts[hi].z-pts[lo].z);
}

function buildWorld(li){
  if(world){S.remove(world);world.traverse(o=>{if(o.geometry&&o.isMesh&&o.userData.merged)o.geometry.dispose();});}
  world=new THREE.Group();S.add(world);
  const L=LEVELS[li];const r=rng(1234+li*777);
  const grid=[];for(let z=0;z<GH;z++){grid.push(new Array(GW).fill(0));}
  const cells=buildPath(L.path);cells.forEach(([x,z])=>grid[z][x]=1);
  const stat=new THREE.Group();
  const put=(name,x,z,rot,y)=>{const m=M(name);m.position.set(wx(x),y||0,wz(z));m.rotation.y=(rot||0)*Math.PI/2;stat.add(m);return m;};
  // caminho
  cells.forEach((c,i)=>{
    const prev=cells[i-1],next=cells[i+1];
    if(!prev){const d=[next[0]-c[0],next[1]-c[1]];put('tile-spawn',c[0],c[1],findRot([[0,1],[0,-1]],[d,[-d[0],-d[1]]]));return;}
    const dp=[prev[0]-c[0],prev[1]-c[1]];
    if(!next){put('tile-end',c[0],c[1],findRot([[0,1]],[dp]));return;}
    const dn=[next[0]-c[0],next[1]-c[1]];
    if(dp[0]===-dn[0]&&dp[1]===-dn[1])put('tile-straight',c[0],c[1],findRot([[0,1],[0,-1]],[dp,dn]));
    else put('tile-corner-round',c[0],c[1],findRot([[1,0],[0,1]],[dp,dn]));
  });
  // terreno + decoração (bloqueia construção)
  const D=L.deco;
  for(let z=0;z<GH;z++)for(let x=0;x<GW;x++){
    if(grid[z][x])continue;
    // não decora perto do caminho em excesso: deixa espaço para torres
    let nearPath=false;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const zz=z+dz,xx=x+dx;if(zz>=0&&zz<GH&&xx>=0&&xx<GW&&grid[zz][xx]===1)nearPath=true;}
    const q=r();let k=null;const f=nearPath?.45:1;
    if(x===GW-1&&r()<.6)k='tile-tree';
    else if(q<D.tree*f)k=r()<.5?'tile-tree':'tile-tree-double';
    else if(q<(D.tree+D.rock)*f)k='tile-rock';
    else if(q<(D.tree+D.rock+D.crystal)*f)k='tile-crystal';
    else if(q<(D.tree+D.rock+D.crystal+D.hill)*f)k='tile-hill';
    if(k){put(k,x,z,Math.floor(r()*4));grid[z][x]=2;}
    else{put('tile',x,z,Math.floor(r()*4));
      if(r()<.1){const dd=['detail-tree','detail-rocks','detail-dirt','detail-crystal'][Math.floor(r()*(li===1?4:3))];
        const m=M(dd);m.position.set(wx(x)+(r()-.5)*.6,.2,wz(z)+(r()-.5)*.6);m.scale.setScalar(.6);m.rotation.y=r()*6;stat.add(m);grid[z][x]=2;}}
  }
  // moldura de árvores e morros ao redor
  for(let z=-2;z<=GH+1;z++)for(let x=-2;x<=GW+1;x++){
    if(x>=0&&x<GW&&z>=0&&z<GH)continue;
    // continua o caminho para fora do mapa na entrada
    const s=cells[0],d=[cells[1][0]-s[0],cells[1][1]-s[1]];
    if((x===s[0]-d[0]&&z===s[1]-d[1])||(x===s[0]-2*d[0]&&z===s[1]-2*d[1])){put('tile-straight',x,z,findRot([[0,1],[0,-1]],[d,[-d[0],-d[1]]]));continue;}
    const q=r();put(q<.45?'tile-tree-double':q<.75?'tile-tree':q<.88?'tile-hill':'tile-rock',x,z,Math.floor(r()*4));
  }
  const merged=mergeStatic(stat);merged.userData.merged=1;world.add(merged);
  // chão distante
  const g=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshLambertMaterial({color:0x5fbf86}));
  g.rotation.x=-Math.PI/2;g.position.y=.02;g.receiveShadow=true;world.add(g);
  // castelo no fim
  const end=cells[cells.length-1];
  const castle=new THREE.Group();
  [['tower-round-bottom-a',0],['tower-round-middle-a',.6],['tower-round-middle-c',1.2],['tower-round-roof-a',1.8]].forEach(([n,y])=>{const m=M(n);m.position.y=y;castle.add(m);});
  castle.scale.setScalar(.8);castle.position.set(wx(end[0]),.2,wz(end[1]));world.add(castle);
  // portal de saída dos óvnis
  const portal=M('spawn-round');portal.position.set(wx(cells[0][0]),.21,wz(cells[0][1]));world.add(portal);
  return {grid,cells,castle,portal};
}

// ---------- torres ----------
const STACK={ // [peça, altura]
 sq:[[['tower-square-bottom-a',.5],['tower-square-top-a',.5]],[['tower-square-bottom-a',.5],['tower-square-middle-a',.5],['tower-square-top-a',.5]],[['tower-square-bottom-b',.5],['tower-square-middle-b',.5],['tower-square-middle-a',.5],['tower-square-top-a',.5]]],
 rd:[[['tower-round-bottom-a',.6],['tower-round-top-a',.5]],[['tower-round-bottom-a',.6],['tower-round-middle-a',.6],['tower-round-top-a',.5]],[['tower-round-bottom-c',.6],['tower-round-middle-c',.6],['tower-round-middle-a',.6],['tower-round-top-c',.5]]],
 cr:[[['tower-round-base',.21],['tower-round-bottom-c',.6]],[['tower-round-base',.21],['tower-round-bottom-c',.6],['tower-round-middle-c',.6]],[['tower-round-base',.21],['tower-round-bottom-c',.6],['tower-round-middle-c',.6],['tower-round-middle-a',.6]]],
 cp:[[['tower-square-bottom-b',.5],['tower-square-top-b',.5]],[['tower-square-bottom-b',.5],['tower-square-middle-b',.5],['tower-square-top-b',.5]],[['tower-square-bottom-a',.5],['tower-square-middle-b',.5],['tower-square-middle-a',.5],['tower-square-top-b',.5]]],
};
const TOWER_SC=.82;
const WEAPON_SINK={sq:.32,rd:.3,cp:.32};
function towerModel(type,lvl){
  const T=TOWERS[type],g=new THREE.Group();let y=0;
  STACK[T.kind][lvl-1].forEach(([n,h])=>{const m=M(n);m.position.y=y;g.add(m);y+=h;});
  let weapon;
  if(T.kind==='cr'){weapon=M('tower-round-crystals');weapon.position.y=y+.37;g.add(weapon);}
  else{weapon=M(T.weapon);weapon.position.y=y-WEAPON_SINK[T.kind];g.add(weapon);}
  g.scale.setScalar(TOWER_SC);
  return {g,weapon,top:(y+.3)*TOWER_SC};
}
function placeTower(cx,cz,type){
  const T=TOWERS[type];
  const t={type,lvl:1,cx,cz,cd:.3,spent:T.cost,yaw:0};
  const tm=towerModel(type,1);Object.assign(t,{obj:tm.g,weapon:tm.weapon,top:tm.top});
  tm.g.position.set(wx(cx),.2,wz(cz));world.add(tm.g);
  t.pop=.0;G.towers.push(t);G.grid[cz][cx]=3;return t;
}
function rebuildTower(t){
  const yaw=t.weapon.rotation.y;world.remove(t.obj);
  const tm=towerModel(t.type,t.lvl);Object.assign(t,{obj:tm.g,weapon:tm.weapon,top:tm.top});
  tm.weapon.rotation.y=yaw;tm.g.position.set(wx(t.cx),.2,wz(t.cz));world.add(tm.g);t.pop=0;
}
function stats(t){return TOWERS[t.type].lv[t.lvl-1];}

// ---------- miniaturas das torres ----------
const THUMB={};
function makeThumbs(){
  const r2=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r2.setSize(128,128);r2.setPixelRatio(1);r2.outputEncoding=THREE.sRGBEncoding;r2.setClearColor(0x000000,0);
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x667788,1.05));const dl=new THREE.DirectionalLight(0xffffff,.7);dl.position.set(-3,5,4);sc.add(dl);
  const cam=new THREE.PerspectiveCamera(30,1,.1,50);
  TORDER.forEach(type=>{for(let l=1;l<=3;l++){
    const tm=towerModel(type,l);sc.add(tm.g);const h=tm.top;
    cam.position.set(2.6,h*.62+1.7,3.6);cam.lookAt(0,h*.5,0);cam.fov=15+h*7;cam.updateProjectionMatrix();
    r2.clear();r2.render(sc,cam);THUMB[type+l]=r2.domElement.toDataURL();sc.remove(tm.g);
  }});
  r2.dispose();try{r2.forceContextLoss();}catch(e){}
}

// ---------- inimigos ----------
const barGeo=new THREE.PlaneGeometry(1,1);
const ringGeo=new THREE.TorusGeometry(.42,.04,6,24);ringGeo.rotateX(Math.PI/2);
const ringMat=new THREE.MeshBasicMaterial({color:0x8fe8ff,transparent:true,opacity:.85});
function spawnEnemy(k,d){
  const E=ENEMIES[k];const mult=G.hpMult;
  const o=new THREE.Group();const m=M(E.model);m.scale.setScalar(E.sc);o.add(m);
  const bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x1b1f33,depthTest:false}));bg.scale.set(.62*(E.boss?1.8:1),.09,1);bg.position.y=E.sc*.9+.25;bg.renderOrder=10;
  const fg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x6ff08f,depthTest:false}));fg.center.set(0,.5);fg.scale.set(.58*(E.boss?1.8:1),.06,1);fg.position.set(-.29*(E.boss?1.8:1),bg.position.y,0);fg.renderOrder=11;
  o.add(bg);o.add(fg);bg.visible=fg.visible=false;
  const ring=new THREE.Mesh(ringGeo,ringMat);ring.scale.setScalar(E.sc*1.3);ring.visible=false;o.add(ring);
  world.add(o);
  const hp=Math.round(E.hp*mult);
  const e={k,E,hp,max:hp,d:d||0,slowT:0,slowF:0,obj:o,model:m,bg,fg,ring,bw:fg.scale.x,alive:true,ph:Math.random()*6,pos:new THREE.Vector3()};
  samplePath(e.d,e.pos);o.position.copy(e.pos);o.position.y=E.y;
  G.enemies.push(e);return e;
}
function damage(e,amt,src){
  if(!e.alive)return;
  const real=Math.max(amt*.25,amt-e.E.armor);e.hp-=real;
  e.bg.visible=e.fg.visible=true;
  const r=Math.max(0,e.hp/e.max);e.fg.scale.x=e.bw*r;e.fg.material.color.setHex(r>.5?0x6ff08f:r>.25?0xffd34d:0xff5a6a);
  if(e.hp<=0)kill(e);
}
function kill(e){
  e.alive=false;world.remove(e.obj);
  G.coins+=e.E.gold;popup('+'+e.E.gold,e.obj.position);sfx('pop');
  burst(e.obj.position,e.E.boss?40:12,e.E.boss?0xffd34d:0xb48cff,e.E.boss?1.6:.8);
  if(e.E.split){for(let i=0;i<2;i++)spawnEnemy(e.E.split,Math.max(0,e.d-.25*i));}
  if(e.E.boss){shake=.6;sfx('boom');}
  hudDirty=true;
}
function leak(e){
  e.alive=false;world.remove(e.obj);
  G.lives=Math.max(0,G.lives-(e.E.lives||1));sfx('leak');shake=.25;hudDirty=true;
  const b=M('enemy-ufo-beam');b.position.copy(G.castle.position);b.position.y=.2;b.scale.set(.9,2.2,.9);world.add(b);
  G.fx.push({o:b,t:0,T:.6,kind:'beam'});
  if(G.lives<=0)endLevel(false);
}

// ---------- projéteis & efeitos ----------
const pGeo=new THREE.IcosahedronGeometry(.07,0);
const pMats={};function pmat(c){return pMats[c]||(pMats[c]=new THREE.MeshBasicMaterial({color:c,transparent:true}));}
function burst(pos,n,color,size){
  for(let i=0;i<n;i++){const m=new THREE.Mesh(pGeo,pmat(color));m.position.copy(pos);
    const v=new THREE.Vector3(Math.random()-.5,Math.random()*.9+.2,Math.random()-.5).multiplyScalar(3*(size||1));
    m.scale.setScalar((Math.random()*.8+.6)*(size||1));world.add(m);G.fx.push({o:m,v,t:0,T:.45+Math.random()*.3,kind:'p'});}
}
function ringFx(pos,r,color){
  const m=new THREE.Mesh(new THREE.RingGeometry(.8,1,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(pos.x,.25,pos.z);world.add(m);G.fx.push({o:m,t:0,T:.35,kind:'ring',r});
}
function fire(t,target){
  const T=TOWERS[t.type],s=stats(t);
  const from=new THREE.Vector3();t.weapon.getWorldPosition(from);from.y+=.25;
  let o,p={t,s,target,kind:T.proj,from:from.clone(),pos:from.clone()};
  if(T.proj==='arrow'){o=M('weapon-ammo-arrow');o.scale.setScalar(.6);p.spd=13;sfx('arrow');}
  else if(T.proj==='ball'){o=M('weapon-ammo-cannonball');o.scale.setScalar(.8);sfx('cannon');}
  else if(T.proj==='rock'){o=M('weapon-ammo-boulder');o.scale.setScalar(1.1);sfx('rock');}
  else {o=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,1),new THREE.MeshBasicMaterial({color:0xc9a7ff}));p.spd=8.5;sfx('orb');}
  if(T.proj==='ball'||T.proj==='rock'){
    // tiro em arco: mira onde o alvo vai estar
    const flight=T.proj==='rock'?1.0:.55;const fut=new THREE.Vector3();
    samplePath(target.d+target.E.spd*(1-target.slowF)*flight,fut);
    p.to=fut;p.T=flight;p.tt=0;p.h=T.proj==='rock'?2.2:1.0;
  }
  o.position.copy(from);world.add(o);p.o=o;G.proj.push(p);
}
function updateProj(dt){
  for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];let done=false;
    if(p.to){p.tt+=dt;const k=Math.min(1,p.tt/p.T);p.pos.lerpVectors(p.from,p.to,k);p.pos.y=p.from.y*(1-k)+.45*k+4*p.h*k*(1-k);
      p.o.position.copy(p.pos);p.o.rotation.x+=dt*8;
      if(k>=1){done=true;splash(p.to,p.s.spl,p.s.dmg);burst(p.to,p.kind==='rock'?14:9,0xffb347,p.kind==='rock'?1:.7);ringFx(p.to,p.s.spl,0xffd08a);sfx('boom');}}
    else{const tg=p.target;const aim=tg.alive?tmpV.copy(tg.obj.position):tmpV.copy(p.last||p.pos);if(tg.alive)p.last=aim.clone();
      const dir=aim.clone().sub(p.pos);const dist=dir.length();const step=p.spd*dt;
      if(dist<=step+.05){done=true;
        if(tg.alive){if(p.kind==='orb'){applyOrb(p,tg);}else{damage(tg,p.s.dmg);sfx('hit');}}}
      else{dir.multiplyScalar(1/dist);p.pos.addScaledVector(dir,step);p.o.position.copy(p.pos);
        if(p.kind==='arrow')p.o.lookAt(aim);else p.o.rotation.y+=dt*6;}}
    if(done){world.remove(p.o);G.proj.splice(i,1);}
  }
}
function applyOrb(p,tg){
  const s=p.s;const hitOne=e=>{damage(e,s.dmg);if(e.alive){e.slowT=Math.max(e.slowT,s.st);e.slowF=Math.max(e.slowF,e.E.boss?s.slow*.5:s.slow);}};
  if(s.spl){G.enemies.forEach(e=>{if(e.alive&&e.obj.position.distanceTo(tg.obj.position)<=s.spl)hitOne(e);});ringFx(tg.obj.position,s.spl,0xc9a7ff);}
  else hitOne(tg);
  burst(tg.obj.position,6,0xd9c2ff,.6);
}
function splash(pos,r,dmg){
  G.enemies.forEach(e=>{if(!e.alive)return;const dx=e.obj.position.x-pos.x,dz=e.obj.position.z-pos.z;const d=Math.hypot(dx,dz);
    if(d<=r)damage(e,dmg*(d<r*.4?1:.65));});
}
function updateFx(dt){
  for(let i=G.fx.length-1;i>=0;i--){const f=G.fx[i];f.t+=dt;const k=f.t/f.T;
    if(f.kind==='p'){f.v.y-=9*dt;f.o.position.addScaledVector(f.v,dt);f.o.scale.multiplyScalar(1-dt*2.2);}
    else if(f.kind==='ring'){const s=f.r*(.3+.7*k);f.o.scale.set(s,s,s);f.o.material.opacity=.7*(1-k);}
    else if(f.kind==='beam'){f.o.scale.x=f.o.scale.z=.9*(1-k*.7);}
    if(k>=1){world.remove(f.o);if(f.kind==='ring'){f.o.geometry.dispose();f.o.material.dispose();}G.fx.splice(i,1);}
  }
}

// ---------- popups / toasts ----------
function popup(txt,pos,color){
  const v=pos.clone();v.y+=.6;v.project(C);if(v.z>1)return;
  const d=document.createElement('div');d.className='pop';d.textContent=txt;if(color)d.style.color=color;
  d.style.left=((v.x+1)/2*innerWidth)+'px';d.style.top=((1-v.y)/2*innerHeight)+'px';
  $('pops').appendChild(d);setTimeout(()=>d.remove(),900);
}
let toastT=0;function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('show'),1800);}
let bannerT=0;function banner(t,ms){const e=$('banner');e.textContent=t;e.classList.add('show');clearTimeout(bannerT);bannerT=setTimeout(()=>e.classList.remove('show'),ms||1500);}

// ---------- ondas ----------
function parseWave(s){
  const q=[];let t=0;
  s.split(',').forEach(g=>{const m=g.match(/^([a-zX])(\d+):([\d.]+)$/);const k=m[1],n=+m[2],gap=+m[3];
    for(let i=0;i<n;i++){q.push({t,k});t+=gap;}t+=1.2;});
  return q;
}
function startWave(){
  if(G.waveActive||G.wave>=G.L.waves.length)return;
  // bônus por chamar antes da hora
  if(G.wave>0&&G.countdown>0){const b=Math.ceil(G.countdown);G.coins+=b;toast('Bônus por chamar cedo: +'+b+' 🪙');}
  G.queue=parseWave(G.L.waves[G.wave]);G.qt=0;G.wave++;G.waveActive=true;G.countdown=0;
  G.hpMult=[1,1.35,1.7][G.li]*(1+.08*(G.wave-1));
  sfx('wave');banner(G.wave===G.L.waves.length?'Onda final!':'Onda '+G.wave);
  if(G.L.waves[G.wave-1].indexOf('X')>=0)setTimeout(()=>banner('👾 Nave-mãe chegando!',1800),1600);
  hudDirty=true;
}

// ---------- fases ----------
function startLevel(li){
  closePanel();
  if(G){G.enemies.forEach(e=>world&&world.remove(e.obj));}
  const L=LEVELS[li];const w=buildWorld(li);
  G={li,L,grid:w.grid,cells:w.cells,castle:w.castle,portal:w.portal,route:pathPoints(w.cells),
     coins:L.coins,lives:20,wave:0,waveActive:false,queue:[],qt:0,countdown:0,hpMult:1,
     towers:[],enemies:[],proj:[],fx:[],over:false,time:0};
  selMarker=M('selection-a');selMarker.visible=false;world.add(selMarker);
  rangeRing=new THREE.Mesh(new THREE.RingGeometry(.96,1,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));
  const fill=new THREE.Mesh(new THREE.CircleGeometry(.96,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,depthWrite:false}));rangeRing.add(fill);
  rangeRing.rotation.x=-Math.PI/2;rangeRing.position.y=.23;rangeRing.visible=false;world.add(rangeRing);
  paused=false;speed=1;$('spd').textContent='1×';
  showScreen(null);$('hud').style.display='';hudDirty=true;fitCamera();
  banner(L.name,1600);
}
function endLevel(win){
  if(G.over)return;G.over=true;closePanel();
  setTimeout(()=>{
    let st=0;if(win){st=G.lives>=18?3:G.lives>=10?2:1;if(st>save.stars[G.li]){save.stars[G.li]=st;persist();}sfx('win');}else sfx('lose');
    $('endT').textContent=win?'Vitória!':'O castelo caiu…';
    $('endS').textContent=win?('★'.repeat(st)+'☆'.repeat(3-st)):'💥';
    $('endP').textContent=win?('Vidas restantes: '+G.lives+' / 20'):('Você chegou até a onda '+G.wave+' de '+G.L.waves.length+'.');
    $('next').style.display=win&&G.li<LEVELS.length-1?'':'none';
    showScreen('end');
  },win?600:900);
}

// ---------- interface ----------
let hudDirty=true,lastCoins=-1;
function showScreen(id){['menu','pause','end'].forEach(s=>$(s).classList.toggle('show',s===id));screenState=id||'play';if(id==='menu'){$('hud').style.display='none';renderMenu();}}
function renderMenu(){
  const el=$('levels');el.innerHTML='';
  LEVELS.forEach((L,i)=>{const locked=i>0&&!save.stars[i-1];const d=document.createElement('div');d.className='lvl'+(locked?' locked':'');
    const s=save.stars[i];d.innerHTML='<div class="n">FASE '+(i+1)+'</div><h4>'+L.name+'</h4><div class="n">'+L.waves.length+' ondas</div><div class="st">'+(locked?'🔒':('<span style="color:#ffd34d">'+'★'.repeat(s)+'</span>'+'☆'.repeat(3-s)))+'</div>';
    if(!locked)d.onclick=()=>{ac();startLevel(i);};el.appendChild(d);});
}
function updateHud(){
  $('coins').textContent=G.coins;$('lives').textContent=G.lives;$('wave').textContent=G.wave+'/'+G.L.waves.length;
  const wb=$('wavebtn');
  if(G.waveActive||G.wave>=G.L.waves.length){wb.style.display='none';}
  else{wb.style.display='';wb.innerHTML=G.wave===0?'▶ Começar onda 1':('▶ Onda '+(G.wave+1)+'<small>'+(G.countdown>0?('em '+Math.ceil(G.countdown)+'s · chamar já +'+Math.ceil(G.countdown)+'🪙'):'')+'</small>');}
  if(G.coins!==lastCoins){lastCoins=G.coins;if(panelMode)refreshPanel();}
}
let panelMode=null,panelCell=null,panelTower=null;
function closePanel(){panelMode=null;panelTower=null;panelCell=null;$('panel').classList.remove('show');if(selMarker)selMarker.visible=false;if(rangeRing)rangeRing.visible=false;}
function openBuild(cx,cz){
  panelMode='build';panelCell=[cx,cz];panelTower=null;
  selMarker.position.set(wx(cx),.2,wz(cz));selMarker.visible=true;rangeRing.visible=false;refreshPanel();
}
function openTower(t){
  panelMode='tower';panelTower=t;selMarker.position.set(wx(t.cx),.2,wz(t.cz));selMarker.visible=true;
  showRange(t.cx,t.cz,stats(t).rng);refreshPanel();
}
function showRange(cx,cz,r){rangeRing.position.set(wx(cx),.23,wz(cz));rangeRing.scale.set(r,r,r);rangeRing.visible=true;}
function refreshPanel(){
  const p=$('panel');p.innerHTML='';
  if(panelMode==='build'){
    TORDER.forEach(type=>{const T=TOWERS[type];const locked=T.unlock&&G.li<T.unlock;const can=!locked&&G.coins>=T.cost;
      const c=document.createElement('div');c.className='card'+(can?'':' off')+(locked?' lock':'');
      c.innerHTML='<img src="'+THUMB[type+'1']+'"><b>'+T.name+'</b><span>🪙 '+T.cost+'</span>';
      c.onpointerenter=()=>{if(!locked)showRange(panelCell[0],panelCell[1],T.lv[0].rng);};
      c.onpointerleave=()=>{rangeRing.visible=false;};
      c.onclick=()=>{if(locked){toast('Libera na fase '+(T.unlock+1));sfx('no');return;}
        if(G.coins<T.cost){toast('Moedas insuficientes');sfx('no');return;}
        G.coins-=T.cost;const t=placeTower(panelCell[0],panelCell[1],type);sfx('build');burst(t.obj.position,10,0xffffff,.6);hudDirty=true;closePanel();};
      p.appendChild(c);});
  }else if(panelMode==='tower'){
    const t=panelTower,T=TOWERS[t.type],s=stats(t);const nx=t.lvl<3?T.lv[t.lvl]:null;const upc=t.lvl<3?T.up[t.lvl-1]:0;
    const refund=Math.floor(t.spent*.7);
    const f=(a,b,suf)=>b===undefined||b===a?a+(suf||''):a+(suf||'')+' → <b style="color:#7dffa8">'+b+(suf||'')+'</b>';
    let html='<div class="tinfo"><img src="'+THUMB[t.type+t.lvl]+'"><div><h3>'+T.name+' · Nv '+t.lvl+'</h3><p>'+T.desc+'<br>Dano '+f(s.dmg,nx&&nx.dmg)+' · Alcance '+f(s.rng,nx&&nx.rng)+'<br>Recarga '+f(s.rate,nx&&nx.rate,'s')+(s.slow?' · Lentidão '+f(Math.round(s.slow*100),nx&&Math.round(nx.slow*100),'%'):'')+'</p></div></div>';
    html+='<div class="tbtns">'+(t.lvl<3?'<button class="btn green" id="upb"'+(G.coins<upc?' disabled':'')+'>⬆ Melhorar 🪙'+upc+'</button>':'<button class="btn" disabled>Nível máximo</button>')+'<button class="btn red" id="sellb">Vender +'+refund+'</button></div>';
    p.innerHTML=html;
    const ub=$('upb');if(ub)ub.onclick=()=>{if(G.coins<upc){sfx('no');return;}G.coins-=upc;t.spent+=upc;t.lvl++;rebuildTower(t);sfx('build');burst(t.obj.position.clone().setY(t.top),12,0xffd34d,.7);hudDirty=true;openTower(t);};
    $('sellb').onclick=()=>{G.coins+=refund;world.remove(t.obj);G.towers.splice(G.towers.indexOf(t),1);G.grid[t.cz][t.cx]=0;popup('+'+refund,t.obj.position);sfx('sell');hudDirty=true;closePanel();};
  }
  const x=document.createElement('button');x.className='x';x.textContent='✕';x.onclick=closePanel;p.appendChild(x);
  p.classList.add('show');
}

// ---------- entrada ----------
let down=null;
R.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};ac();});
R.domElement.addEventListener('pointerup',e=>{
  if(!down||screenState!=='play'||!G||G.over)return;
  if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>14){down=null;return;}down=null;
  const cell=pickCell(e.clientX,e.clientY);if(!cell){closePanel();return;}
  const [cx,cz]=cell;const v=G.grid[cz][cx];
  if(v===3){openTower(G.towers.find(t=>t.cx===cx&&t.cz===cz));}
  else if(v===0){if(panelMode==='build'&&panelCell&&panelCell[0]===cx&&panelCell[1]===cz)closePanel();else openBuild(cx,cz);}
  else{closePanel();if(v===2)toast('Não dá para construir aqui');}
});
function pickCell(px,py){
  ray.setFromCamera({x:px/innerWidth*2-1,y:-(py/innerHeight)*2+1},C);
  // tenta primeiro acertar uma torre (são altas)
  for(const t of G.towers){const b=new THREE.Box3().setFromObject(t.obj);if(ray.ray.intersectsBox(b))return [t.cx,t.cz];}
  const hit=ray.ray.intersectPlane(plane,tmpV);if(!hit)return null;
  const cx=Math.floor(hit.x+GW/2),cz=Math.floor(hit.z+GH/2);
  if(cx<0||cz<0||cx>=GW||cz>=GH)return null;return [cx,cz];
}
$('wavebtn').onclick=()=>{ac();startWave();};
$('spd').onclick=()=>{speed=speed===1?2:speed===2?3:1;$('spd').textContent=speed+'×';};
$('snd').onclick=()=>{muted=!muted;$('snd').textContent=muted?'🔇':'🔊';try{localStorage.setItem(SAVE_KEY+'_mute',muted?'1':'0')}catch(e){}};
$('snd').textContent=muted?'🔇':'🔊';
$('pau').onclick=()=>{paused=true;showScreen('pause');};
$('resume').onclick=()=>{paused=false;showScreen(null);};
$('restart').onclick=()=>startLevel(G.li);
$('quit').onclick=()=>{paused=false;showScreen('menu');};
$('again').onclick=()=>startLevel(G.li);
$('next').onclick=()=>startLevel(G.li+1);
$('tomenu').onclick=()=>showScreen('menu');
document.addEventListener('keydown',e=>{
  if(screenState!=='play')return;
  if(e.code==='Space'){startWave();e.preventDefault();}
  if(e.key==='Escape'){if(panelMode)closePanel();else{paused=true;showScreen('pause');}}
  if(e.key==='f'){$('spd').click();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&screenState==='play'&&G&&!G.over){paused=true;showScreen('pause');}});

// ---------- câmera ----------
let shake=0;const camBase=new THREE.Vector3(),camLook=new THREE.Vector3(0,0,.35);
function fitCamera(){
  const w=innerWidth,h=innerHeight;R.setSize(w,h);C.aspect=w/h;
  const dir=new THREE.Vector3(0,1.25,.95).normalize();
  const pts=[[-GW/2,0,-GH/2],[GW/2,0,-GH/2],[-GW/2,0,GH/2],[GW/2,0,GH/2],[-GW/2,1.6,-GH/2],[GW/2,1.6,-GH/2]].map(a=>new THREE.Vector3(...a));
  let dist=14;
  for(let it=0;it<8;it++){
    C.position.copy(camLook).addScaledVector(dir,dist);C.lookAt(camLook);C.updateProjectionMatrix();C.updateMatrixWorld();
    let m=0;pts.forEach(p=>{const v=p.clone().project(C);m=Math.max(m,Math.abs(v.x),Math.abs(v.y)*1.08);});
    dist*=m/.9;
  }
  C.position.copy(camLook).addScaledVector(dir,dist);C.lookAt(camLook);camBase.copy(C.position);
  S.fog.near=dist+4;S.fog.far=dist+24;
}
addEventListener('resize',()=>{fitCamera();});

// ---------- loop ----------
function update(dt){
  G.time+=dt;
  // fila da onda
  if(G.waveActive){
    G.qt+=dt;while(G.queue.length&&G.queue[0].t<=G.qt){spawnEnemy(G.queue.shift().k,0);}
    if(!G.queue.length&&!G.enemies.some(e=>e.alive)){
      G.waveActive=false;
      if(G.wave>=G.L.waves.length){endLevel(true);}
      else{const bonus=6+G.wave*2;G.coins+=bonus;toast('Onda concluída! +'+bonus+' 🪙');sfx('coin');G.countdown=15;}
      hudDirty=true;
    }
  }else if(G.countdown>0&&!G.over){const before=Math.ceil(G.countdown);G.countdown-=dt;if(Math.ceil(G.countdown)!==before)hudDirty=true;if(G.countdown<=0){G.countdown=0;startWave();}}
  // inimigos
  for(const e of G.enemies){if(!e.alive)continue;
    if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0){e.slowF=0;}}
    e.ring.visible=e.slowT>0;
    e.d+=e.E.spd*(1-e.slowF)*dt;
    if(e.d>=G.route.len){leak(e);continue;}
    const yaw=samplePath(e.d,e.pos);e.ph+=dt*3;
    e.obj.position.set(e.pos.x,e.E.y+Math.sin(e.ph)*.06,e.pos.z);
    e.model.rotation.y+=dt*(e.E.boss?.8:2.2);e.model.rotation.z=Math.sin(e.ph*.7)*.08;
  }
  G.enemies=G.enemies.filter(e=>e.alive);
  // torres
  for(const t of G.towers){const s=stats(t);t.cd-=dt;
    if(t.pop<1){t.pop=Math.min(1,t.pop+dt*5);const k=t.pop;t.obj.scale.setScalar(TOWER_SC*(1+Math.sin(k*Math.PI)*.15));}
    if(t.type==='crystal')t.weapon.rotation.y+=dt*.8;
    let best=null,bd=-1;const tx=wx(t.cx),tz=wz(t.cz);
    for(const e of G.enemies){const d=Math.hypot(e.obj.position.x-tx,e.obj.position.z-tz);if(d<=s.rng&&e.d>bd){bd=e.d;best=e;}}
    if(best&&t.type!=='crystal'){const want=Math.atan2(best.obj.position.x-tx,best.obj.position.z-tz);
      let dy=want-t.weapon.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));t.weapon.rotation.y+=dy*Math.min(1,dt*12);}
    if(best&&t.cd<=0){t.cd=s.rate;fire(t,best);}
  }
  updateProj(dt);updateFx(dt);
}
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(.05,(now-last)/1000);last=now;
  if(G&&screenState==='play'&&!paused&&!G.over){for(let i=0;i<speed;i++)update(dt);}
  else if(G&&G.over){updateFx(dt);}
  if(G&&G.portal){G.portal.rotation.y+=dt*1.5;}
  if(rangeRing&&rangeRing.visible){rangeRing.material.opacity=.45+Math.sin(now*.006)*.12;}
  if(selMarker&&selMarker.visible){selMarker.position.y=.2+Math.sin(now*.008)*.02;}
  if(shake>0){shake=Math.max(0,shake-dt);C.position.copy(camBase).add(new THREE.Vector3((Math.random()-.5)*shake*.5,(Math.random()-.5)*shake*.5,0));}
  else if(G)C.position.copy(camBase);
  if(G&&hudDirty){hudDirty=false;updateHud();}
  R.render(S,C);
}

// ---------- início ----------
Promise.all([loadModels(),texP]).then(()=>{
  makeThumbs();
  // cena de fundo do menu: fase 1 sem HUD
  startLevel(0);showScreen('menu');
  $('load').remove();
  requestAnimationFrame(frame);
});

// ganchos para testes
window.__td={towerModel,MAT,get G(){return G},startLevel,startWave,placeTower,openBuild,openTower,update,TOWERS,LEVELS,setSpeed:v=>speed=v,get screen(){return screenState}};
})();
