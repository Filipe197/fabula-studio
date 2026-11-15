// Saucer Siege v0.2 — Fabula Studio
// Tower defense com o Kenney Tower Defense Kit e Kenney Audio (CC0)
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SAVE_KEY='saucer_siege_v01';
const GW=16,GH=9;
const METEOR_CD=35,FREEZE_CD=50,FREEZE_T=4;

// ---------- fases ----------
const LEVELS=[
 {name:'Campina Verde',world:1,biome:'grass',coins:170,hp:1,
  paths:[[[0,1],[4,1],[4,6],[9,6],[9,2],[14,2]]],
  deco:{tree:.13,rock:.04,crystal:0,hill:.03},
  waves:['a8:1.1','a10:.9,b4:.7','b10:.55','a10:.8,c3:2','c5:1.6,b8:.5','a12:.6,c5:1.4,b10:.4']},
 {name:'Vale dos Cristais',world:1,biome:'grass',coins:230,hp:1.35,
  paths:[[[0,7],[3,7],[3,2],[7,2],[7,6],[11,6],[11,1],[14,1]]],
  deco:{tree:.08,rock:.03,crystal:.07,hill:.02},
  waves:['a10:.9','b8:.6,a8:.8','d4:1.6','c4:1.8,b10:.45','d6:1.2,a10:.6','c6:1.3,d4:1.3','b16:.35,c4:1.4','a14:.5,d6:1,c6:1.2']},
 {name:'Colinas do Castelo',world:1,biome:'grass',coins:290,hp:1.7,
  paths:[[[0,4],[2,4],[2,1],[6,1],[6,7],[10,7],[10,3],[13,3],[13,6],[14,6]]],
  deco:{tree:.1,rock:.07,crystal:.02,hill:.06},
  waves:['a12:.8,b6:.6','d6:1.2','c6:1.4,b10:.4','b14:.35,d6:1','c8:1.1,a12:.5','d8:1,b12:.35','c10:1,d6:1','a20:.4,b14:.3','c12:.9,d10:.8','X1:1,c6:1.5,b16:.35']},
 {name:'Picos Nevados',world:2,biome:'snow',coins:400,hp:1.5,
  paths:[[[0,1],[6,1],[6,4],[11,4],[11,2],[14,2]],[[0,7],[6,7],[6,4],[11,4],[11,2],[14,2]]],
  deco:{tree:.12,rock:.04,crystal:.03,hill:.03},
  waves:['a12:.7,b8:.5','s3:2,a8:.7','c6:1.3,b12:.4','s6:1.4,d4:1.4','b20:.3','c8:1.1,s6:1.2','d8:.9,b14:.35','s10:1,c8:1,b14:.3']},
 {name:'Lago Congelado',world:2,biome:'snow',coins:440,hp:1.75,
  paths:[[[0,2],[3,2],[3,6],[8,6],[12,6],[12,3],[14,3]],[[8,0],[8,6],[12,6],[12,3],[14,3]]],
  deco:{tree:.1,rock:.05,crystal:.05,hill:.02},
  waves:['a14:.6,b8:.45','s6:1.3','c8:1,d4:1.2','b24:.28','s8:1,c6:1.1','d10:.8','c10:.9,s8:1','a20:.35,b20:.3','s12:.8,d8:.9','c14:.8,s10:.9,b20:.3']},
 {name:'Fortaleza do Gelo',world:2,biome:'snow',coins:480,hp:2.0,
  paths:[[[0,6],[3,6],[3,1],[8,1],[8,4],[13,4],[13,7],[14,7]],[[11,0],[11,4],[13,4],[13,7],[14,7]]],
  deco:{tree:.11,rock:.06,crystal:.04,hill:.04},
  waves:['a16:.55,b10:.4','s8:1.1,c4:1.4','d10:.8,b14:.35','c12:.85','s12:.9,b16:.3','X1:1,a16:.5','d12:.7,s8:.9','c14:.7,b20:.25','s16:.7','a30:.25,d10:.7','c16:.7,s12:.8','X1:1,s12:.9,c12:.8,b24:.25']},
];
const ENDLESS={name:'Arena Infinita',world:0,biome:'grass',coins:300,hp:1,endless:true,
  paths:[[[0,1],[13,1],[13,4],[2,4],[2,7],[14,7]]],
  deco:{tree:.12,rock:.05,crystal:.03,hill:.03},waves:[]};

const ENEMIES={
 a:{hp:36,spd:1.25,armor:0,gold:5,model:'enemy-ufo-a',sc:.58,y:.5},
 b:{hp:22,spd:2.3,armor:0,gold:4,model:'enemy-ufo-b',sc:.48,y:.55},
 c:{hp:120,spd:.85,armor:4,gold:10,model:'enemy-ufo-c',sc:.7,y:.45},
 d:{hp:66,spd:1.1,armor:0,gold:6,model:'enemy-ufo-d',sc:.64,y:.5,split:'m'},
 m:{hp:18,spd:1.6,armor:0,gold:2,model:'enemy-ufo-d',sc:.36,y:.5},
 s:{hp:60,spd:1.05,armor:0,gold:9,model:'enemy-ufo-b-weapon',sc:.62,y:.52,shield:30},
 X:{hp:1900,spd:.5,armor:6,gold:150,model:'enemy-ufo-a-weapon',sc:1.25,y:.6,lives:10,boss:1},
};
const TOWERS={
 ballista:{name:'Balista',cost:50,up:[60,100],desc:'Rápida e de longo alcance',weapon:'weapon-ballista',proj:'arrow',kind:'rd',
   lv:[{dmg:8,rng:3.2,rate:.55},{dmg:13,rng:3.5,rate:.47},{dmg:21,rng:3.9,rate:.4}]},
 cannon:{name:'Canhão',cost:60,up:[70,110],desc:'Dano em área',weapon:'weapon-cannon',proj:'ball',kind:'sq',
   lv:[{dmg:16,rng:2.4,rate:1.2,spl:1.0},{dmg:27,rng:2.6,rate:1.1,spl:1.15},{dmg:44,rng:2.85,rate:1.0,spl:1.3}]},
 crystal:{name:'Cristal',cost:70,up:[70,110],desc:'Deixa lento e quebra escudos',proj:'orb',kind:'cr',
   lv:[{dmg:4,rng:2.4,rate:.9,slow:.45,st:1.6},{dmg:7,rng:2.65,rate:.8,slow:.55,st:2},{dmg:11,rng:2.9,rate:.7,slow:.6,st:2.4,spl:.9}]},
 catapult:{name:'Catapulta',cost:110,up:[100,150],desc:'Alcance enorme, área grande',weapon:'weapon-catapult',proj:'rock',kind:'cp',unlock:1,
   lv:[{dmg:34,rng:4.4,rate:2.6,spl:1.3},{dmg:56,rng:4.8,rate:2.4,spl:1.45},{dmg:88,rng:5.2,rate:2.2,spl:1.6}]},
 tesla:{name:'Raio',cost:120,up:[110,160],desc:'Raio que pula entre óvnis',proj:'zap',kind:'ts',unlock:3,
   lv:[{dmg:14,rng:2.5,rate:1.1,chain:3,jump:1.5},{dmg:22,rng:2.7,rate:1.0,chain:4,jump:1.6},{dmg:34,rng:2.95,rate:.9,chain:6,jump:1.8}]},
};
const TORDER=['ballista','cannon','crystal','catapult','tesla'];

// ---------- save ----------
let save={v:2,stars:[0,0,0,0,0,0],best:0,bestWave:0,seen:0};
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(s&&s.stars){save=Object.assign(save,s);}}catch(e){}
while(save.stars.length<LEVELS.length)save.stars.push(0);
function persist(){save.seen=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){}try{if(window.SSCloud)window.SSCloud.saved(save);}catch(e){}}
function mergeSave(o){
  if(!o||!o.stars)return false;let ch=false;
  o.stars.forEach((v,i)=>{if(i<save.stars.length&&(v|0)>save.stars[i]){save.stars[i]=v|0;ch=true;}});
  if((o.best|0)>save.best){save.best=o.best|0;ch=true;}
  if((o.bestWave|0)>save.bestWave){save.bestWave=o.bestWave|0;ch=true;}
  if(ch){persist();if(screenState==='menu')renderMenu();}
  return ch;
}

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
const MAT_Y=new THREE.MeshLambertMaterial({map:tex,color:0xffef6a,emissive:0x4a3a00});

const TPL={};
function loadModels(){
  const L=new THREE.GLTFLoader();const keys=Object.keys(MODELS);let n=0;
  return new Promise(res=>{keys.forEach(k=>{
    const b=Uint8Array.from(atob(MODELS[k]),c=>c.charCodeAt(0)).buffer;
    L.parse(b,'',g=>{g.scene.traverse(o=>{if(o.isMesh){o.material=MAT;o.castShadow=true;o.receiveShadow=true}});TPL[k]=g.scene;if(++n===keys.length)res();},e=>{console.error(k,e);if(++n===keys.length)res();});
  });});
}
function M(k){const t=TPL[k];if(!t){console.warn('modelo?',k);return new THREE.Group();}return t.clone(true);}

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
const fmt=n=>Math.floor(n).toLocaleString('pt-BR');

// ---------- áudio (Kenney, CC0) ----------
let AC=null,muted=false,musicOff=false,BUF={},decoding=false,musGain=null,sfxGain=null,curMus=null,wantMus=null;
try{muted=localStorage.getItem(SAVE_KEY+'_mute')==='1';musicOff=localStorage.getItem(SAVE_KEY+'_music')==='0';}catch(e){}
function ac(){
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();musGain=AC.createGain();musGain.gain.value=musicOff?0:1;musGain.connect(AC.destination);sfxGain=AC.createGain();sfxGain.gain.value=muted?0:1;sfxGain.connect(AC.destination);decodeAll();}catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();return AC;
}
function decodeAll(){
  if(decoding||!window.SOUNDS)return;decoding=true;
  // música primeiro, para tocar logo
  const keys=Object.keys(SOUNDS).sort((a,b)=>(/^[A-Z]/.test(b)?1:0)-(/^[A-Z]/.test(a)?1:0));
  keys.forEach(k=>{
    const bin=Uint8Array.from(atob(SOUNDS[k]),c=>c.charCodeAt(0)).buffer;
    const done=b=>{BUF[k]=b;if(wantMus&&MUSIC[wantMus]===k)playMusic(wantMus,true);};
    try{const p=AC.decodeAudioData(bin,done,()=>{});if(p&&p.catch)p.catch(()=>{});}catch(e){}
  });
}
function play(name,vol,rate){
  if(muted||!AC)return false;const b=BUF[name];if(!b)return false;
  const s=AC.createBufferSource();s.buffer=b;s.playbackRate.value=(rate||1)*(.94+Math.random()*.12);
  const g=AC.createGain();g.gain.value=vol==null?.5:vol;s.connect(g);g.connect(sfxGain);s.start();return true;
}
const MUSIC={menu:'Wacky_Waiting',w1:'Space_Cadet',w2:'Mission_Plausible',boss:'Infinite_Descent',inf:'Infinite_Descent'};
function playMusic(key,force){
  wantMus=key;if(!AC)return;
  if(curMus&&curMus.key===key&&!force)return;
  const b=BUF[MUSIC[key]];
  if(curMus){const old=curMus;try{old.g.gain.setTargetAtTime(0,AC.currentTime,.25);old.s.stop(AC.currentTime+1.2);}catch(e){}curMus=null;}
  if(!b)return;
  const s=AC.createBufferSource();s.buffer=b;s.loop=true;const g=AC.createGain();g.gain.value=0;g.gain.setTargetAtTime(.32,AC.currentTime,.4);
  s.connect(g);g.connect(musGain);s.start();curMus={key,s,g};
}
function stopMusic(){wantMus=null;if(curMus){try{curMus.g.gain.setTargetAtTime(0,AC.currentTime,.15);curMus.s.stop(AC.currentTime+.8);}catch(e){}curMus=null;}}
function jingle(name,vol){if(!AC||musicOff)return;const b=BUF[name];if(!b)return;const s=AC.createBufferSource();s.buffer=b;const g=AC.createGain();g.gain.value=vol||.5;s.connect(g);g.connect(musGain);s.start();}
// reserva sintetizada (se o áudio ainda não carregou)
function tone(f,d,type,vol,slide){if(muted||!AC)return;const a=AC;const t=a.currentTime;const o=a.createOscillator(),g=a.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
  g.gain.setValueAtTime(vol||.12,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(sfxGain);o.start(t);o.stop(t+d+.02);}
const SFX={
 arrow:['laserRetro_002',.18,1.7],cannon:['explosionCrunch_000',.3,1.35],orb:['laserSmall_001',.22,1.1],rock:['impactMetal_002',.3,.6],
 boom:['explosionCrunch_002',.35,1.05],hit:['impactMetal_light_002',.12,1.3],pop:['laserSmall_003',.28,.75],coin:['click_002',.35,1],
 build:['drop_002',.55,1],upgrade:['confirmation_002',.45,1],sell:['select_003',.4,.8],no:['error_004',.45,1],leak:['impactMetal_002',.55,.55],
 wave:['jingles-pizzicato_02',.5,1],zap:['laserLarge_002',.24,1.35],shield:['forceField_001',.16,1.5],shieldbreak:['jingles-hit_00',.35,1.6],
 meteor:['lowFrequency_explosion_000',.75,1],freeze:['forceField_001',.55,.55],click:['click_002',.3,1.2],record:['jingles-pizzicato_08',.6,1],
};
let lastSfx={};
function sfx(n){const now=performance.now();if(lastSfx[n]&&now-lastSfx[n]<55)return;lastSfx[n]=now;
  const d=SFX[n];if(d&&play(d[0],d[1],d[2]))return;
  switch(n){case 'pop':tone(660,.07,'square',.05,1.8);break;case 'boom':tone(90,.3,'sawtooth',.08,.5);break;case 'build':tone(440,.1,'triangle',.1,1.5);break;case 'no':tone(160,.12,'square',.05);break;}
}

// ---------- estado ----------
let G=null,world=null,speed=1,paused=false,screenState='menu';
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.2),tmpV=new THREE.Vector3();
let selMarker,rangeRing,aimRing;

// ---------- mapa ----------
const BIOME={
 grass:{sky:0x8fd3ff,ground:0x5fbf86,hemiG:0x5d7a55,pre:'',hi:.75,su:.95},
 snow:{sky:0x9fcff2,ground:0xdfeaf5,hemiG:0x6f86a0,pre:'snow-',hi:.5,su:.78},
};
function cellsOf(wp){
  const cells=[];
  for(let i=0;i<wp.length-1;i++){const [x0,z0]=wp[i],[x1,z1]=wp[i+1];const dx=Math.sign(x1-x0),dz=Math.sign(z1-z0);
    let x=x0,z=z0;while(x!==x1||z!==z1){cells.push([x,z]);x+=dx;z+=dz;}}
  cells.push(wp[wp.length-1]);return cells;
}
function pathPoints(cells){
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
function samplePath(route,d,out){
  const {pts,cum,len}=route;d=clamp(d,0,len);
  let lo=0,hi=cum.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=d)lo=m;else hi=m;}
  const t=(d-cum[lo])/((cum[hi]-cum[lo])||1);out.lerpVectors(pts[lo],pts[hi],t);
}

function buildWorld(L,seed){
  if(world){S.remove(world);world.traverse(o=>{if(o.isMesh&&o.userData.merged)o.geometry.dispose();});}
  world=new THREE.Group();S.add(world);
  const B=BIOME[L.biome],T=n=>B.pre+n;
  S.background.setHex(B.sky);S.fog.color.setHex(B.sky);hemi.groundColor.setHex(B.hemiG);hemi.intensity=B.hi;sun.intensity=B.su;
  const r=rng(seed);
  const grid=[];for(let z=0;z<GH;z++){grid.push(new Array(GW).fill(0));}
  const routesCells=L.paths.map(cellsOf);
  const conn=new Map(),key=(x,z)=>x+','+z;
  const addC=(c,d)=>{const k=key(c[0],c[1]);if(!conn.has(k))conn.set(k,new Set());if(d)conn.get(k).add(d.join(','));};
  routesCells.forEach(cells=>cells.forEach((c,i)=>{
    grid[c[1]][c[0]]=1;addC(c);
    if(cells[i-1])addC(c,[cells[i-1][0]-c[0],cells[i-1][1]-c[1]]);
    if(cells[i+1])addC(c,[cells[i+1][0]-c[0],cells[i+1][1]-c[1]]);
  }));
  const end=routesCells[0][routesCells[0].length-1];
  const starts=routesCells.map(c=>c[0]);
  const stat=new THREE.Group();
  const put=(name,x,z,rot,y)=>{const m=M(name);m.position.set(wx(x),y||0,wz(z));m.rotation.y=(rot||0)*Math.PI/2;stat.add(m);return m;};
  conn.forEach((set,k)=>{
    const [x,z]=k.split(',').map(Number);const dirs=[...set].map(s=>s.split(',').map(Number));
    const isStart=starts.some(s=>s[0]===x&&s[1]===z),isEnd=end[0]===x&&end[1]===z;
    if(dirs.length===1&&isStart){const d=dirs[0];put(T('tile-spawn'),x,z,findRot([[0,1],[0,-1]],[d,[-d[0],-d[1]]]));}
    else if(dirs.length===1&&isEnd){put(T('tile-end'),x,z,findRot([[0,1]],dirs));}
    else if(dirs.length===2){const [a,b]=dirs;
      if(a[0]===-b[0]&&a[1]===-b[1])put(T('tile-straight'),x,z,findRot([[0,1],[0,-1]],dirs));
      else put(T('tile-corner-round'),x,z,findRot([[1,0],[0,1]],dirs));}
    else if(dirs.length===3)put(T('tile-split'),x,z,findRot([[-1,0],[1,0],[0,1]],dirs));
    else put('tile-crossing',x,z,0);
  });
  const D=L.deco;
  for(let z=0;z<GH;z++)for(let x=0;x<GW;x++){
    if(grid[z][x])continue;
    let nearPath=false;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const zz=z+dz,xx=x+dx;if(zz>=0&&zz<GH&&xx>=0&&xx<GW&&grid[zz][xx]===1)nearPath=true;}
    const q=r();let k=null;const f=nearPath?.45:1;
    if(x===GW-1&&r()<.6)k='tile-tree';
    else if(q<D.tree*f)k=r()<.5?'tile-tree':(L.biome==='snow'&&r()<.4?'tile-tree-quad':'tile-tree-double');
    else if(q<(D.tree+D.rock)*f)k='tile-rock';
    else if(q<(D.tree+D.rock+D.crystal)*f)k='tile-crystal';
    else if(q<(D.tree+D.rock+D.crystal+D.hill)*f)k='tile-hill';
    if(k){put(T(k),x,z,Math.floor(r()*4));grid[z][x]=2;}
    else{put(T('tile'),x,z,Math.floor(r()*4));
      if(r()<.1){const dd=['detail-tree','detail-rocks','detail-dirt','detail-crystal'][Math.floor(r()*(D.crystal>0?4:3))];
        const m=M(T(dd));m.position.set(wx(x)+(r()-.5)*.6,.2,wz(z)+(r()-.5)*.6);m.scale.setScalar(.6);m.rotation.y=r()*6;stat.add(m);grid[z][x]=2;}}
  }
  // moldura e caminho saindo do mapa em cada portal
  const outside=new Set();
  routesCells.forEach(cells=>{const s=cells[0],d=[cells[1][0]-s[0],cells[1][1]-s[1]];
    for(let i=1;i<=2;i++){const x=s[0]-d[0]*i,z=s[1]-d[1]*i;outside.add(key(x,z));put(T('tile-straight'),x,z,findRot([[0,1],[0,-1]],[d,[-d[0],-d[1]]]));}});
  for(let z=-2;z<=GH+1;z++)for(let x=-2;x<=GW+1;x++){
    if(x>=0&&x<GW&&z>=0&&z<GH)continue;if(outside.has(key(x,z)))continue;
    const q=r();put(T(q<.45?'tile-tree-double':q<.75?'tile-tree':q<.88?'tile-hill':'tile-rock'),x,z,Math.floor(r()*4));
  }
  const merged=mergeStatic(stat);merged.userData.merged=1;world.add(merged);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshLambertMaterial({color:B.ground}));
  g.rotation.x=-Math.PI/2;g.position.y=.02;g.receiveShadow=true;world.add(g);
  const castle=new THREE.Group();
  [['tower-round-bottom-a',0],['tower-round-middle-a',.6],['tower-round-middle-c',1.2],['tower-round-roof-a',1.8]].forEach(([n,y])=>{const m=M(n);m.position.y=y;castle.add(m);});
  castle.scale.setScalar(.8);castle.position.set(wx(end[0]),.2,wz(end[1]));world.add(castle);
  const portals=starts.map(s=>{const p=M('spawn-round');p.position.set(wx(s[0]),.21,wz(s[1]));world.add(p);return p;});
  return {grid,routes:routesCells.map(pathPoints),castle,portals};
}

// ---------- torres ----------
const STACK={
 sq:[[['tower-square-bottom-a',.5],['tower-square-top-a',.5]],[['tower-square-bottom-a',.5],['tower-square-middle-a',.5],['tower-square-top-a',.5]],[['tower-square-bottom-b',.5],['tower-square-middle-b',.5],['tower-square-middle-a',.5],['tower-square-top-a',.5]]],
 rd:[[['tower-round-bottom-a',.6],['tower-round-top-a',.5]],[['tower-round-bottom-a',.6],['tower-round-middle-a',.6],['tower-round-top-a',.5]],[['tower-round-bottom-c',.6],['tower-round-middle-c',.6],['tower-round-middle-a',.6],['tower-round-top-c',.5]]],
 cr:[[['tower-round-base',.21],['tower-round-bottom-c',.6]],[['tower-round-base',.21],['tower-round-bottom-c',.6],['tower-round-middle-c',.6]],[['tower-round-base',.21],['tower-round-bottom-c',.6],['tower-round-middle-c',.6],['tower-round-middle-a',.6]]],
 cp:[[['tower-square-bottom-b',.5],['tower-square-top-b',.5]],[['tower-square-bottom-b',.5],['tower-square-middle-b',.5],['tower-square-top-b',.5]],[['tower-square-bottom-a',.5],['tower-square-middle-b',.5],['tower-square-middle-a',.5],['tower-square-top-b',.5]]],
 ts:[[['tower-round-bottom-b',.6],['tower-round-top-b',.35]],[['tower-round-bottom-b',.6],['tower-round-middle-b',.6],['tower-round-top-b',.35]],[['tower-round-bottom-b',.6],['tower-round-middle-b',.6],['tower-round-middle-a',.6],['tower-round-top-b',.35]]],
};
const TOWER_SC=.82;
const WEAPON_SINK={sq:.32,rd:.3,cp:.32};
function towerModel(type,lvl){
  const T=TOWERS[type],g=new THREE.Group();let y=0;
  STACK[T.kind][lvl-1].forEach(([n,h])=>{const m=M(n);m.position.y=y;g.add(m);y+=h;});
  let weapon;
  if(T.kind==='cr'||T.kind==='ts'){weapon=M('tower-round-crystals');weapon.position.y=y+.37;
    if(T.kind==='ts'){weapon.traverse(o=>{if(o.isMesh)o.material=MAT_Y;});weapon.scale.setScalar(.85);}
    g.add(weapon);}
  else{weapon=M(T.weapon);weapon.position.y=y-WEAPON_SINK[T.kind];g.add(weapon);}
  g.scale.setScalar(TOWER_SC);
  return {g,weapon,top:(y+.3)*TOWER_SC};
}
function placeTower(cx,cz,type){
  const T=TOWERS[type];
  const t={type,lvl:1,cx,cz,cd:.3,spent:T.cost};
  const tm=towerModel(type,1);Object.assign(t,{obj:tm.g,weapon:tm.weapon,top:tm.top});
  tm.g.position.set(wx(cx),.2,wz(cz));world.add(tm.g);
  t.pop=0;G.towers.push(t);G.grid[cz][cx]=3;return t;
}
function rebuildTower(t){
  const yaw=t.weapon.rotation.y;world.remove(t.obj);
  const tm=towerModel(t.type,t.lvl);Object.assign(t,{obj:tm.g,weapon:tm.weapon,top:tm.top});
  tm.weapon.rotation.y=yaw;tm.g.position.set(wx(t.cx),.2,wz(t.cz));world.add(tm.g);t.pop=0;
}
const stats=t=>TOWERS[t.type].lv[t.lvl-1];
const unlocked=type=>{const u=TOWERS[type].unlock;return !u||!G||G.L.endless||G.li>=u;};

// ---------- miniaturas ----------
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
const ringGeo=new THREE.TorusGeometry(.42,.04,6,24);ringGeo.rotateX(Math.PI/2);
const ringMat=new THREE.MeshBasicMaterial({color:0x8fe8ff,transparent:true,opacity:.85});
const frzMat=new THREE.MeshBasicMaterial({color:0xdff8ff,transparent:true,opacity:.55,depthWrite:false});
const bubbleGeo=new THREE.IcosahedronGeometry(.55,1);
const bubbleMat=new THREE.MeshBasicMaterial({color:0x7fe6ff,transparent:true,opacity:.28,depthWrite:false});
const iceGeo=new THREE.IcosahedronGeometry(.5,0);
function spawnEnemy(k,d,ri){
  const E=ENEMIES[k];const mult=G.hpMult;
  if(ri==null){ri=G.spawnN++%G.routes.length;if(E.boss)ri=0;}
  const bw=E.boss?1.8:1;
  const o=new THREE.Group();const m=M(E.model);m.scale.setScalar(E.sc);o.add(m);
  const bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x1b1f33,depthTest:false}));bg.scale.set(.62*bw,.09,1);bg.position.y=E.sc*.9+.25;bg.renderOrder=10;
  const fg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x6ff08f,depthTest:false}));fg.center.set(0,.5);fg.scale.set(.58*bw,.06,1);fg.position.set(-.29*bw,bg.position.y,0);fg.renderOrder=11;
  o.add(bg);o.add(fg);bg.visible=fg.visible=false;
  const ring=new THREE.Mesh(ringGeo,ringMat);ring.scale.setScalar(E.sc*1.3);ring.visible=false;o.add(ring);
  const ice=new THREE.Mesh(iceGeo,frzMat);ice.scale.setScalar(E.sc*1.25);ice.visible=false;o.add(ice);
  let bubble=null;if(E.shield){bubble=new THREE.Mesh(bubbleGeo,bubbleMat);bubble.scale.setScalar(E.sc*1.55);bubble.position.y=.05;o.add(bubble);}
  world.add(o);
  const hp=Math.round(E.hp*mult),sh=E.shield?Math.round(E.shield*mult):0;
  const e={k,E,hp,max:hp,sh,shMax:sh,d:d||0,route:G.routes[ri],ri,slowT:0,slowF:0,frz:0,obj:o,model:m,bg,fg,ring,ice,bubble,bw:fg.scale.x,alive:true,ph:Math.random()*6,pos:new THREE.Vector3()};
  samplePath(e.route,e.d,e.pos);o.position.copy(e.pos);o.position.y=E.y;
  if(sh){bg.visible=fg.visible=true;fg.material.color.setHex(0x7fe6ff);}
  G.enemies.push(e);return e;
}
function setBar(e){
  e.bg.visible=e.fg.visible=true;
  if(e.sh>0){e.fg.scale.x=e.bw*(e.sh/e.shMax);e.fg.material.color.setHex(0x7fe6ff);return;}
  const r=Math.max(0,e.hp/e.max);e.fg.scale.x=e.bw*r;e.fg.material.color.setHex(r>.5?0x6ff08f:r>.25?0xffd34d:0xff5a6a);
}
function damage(e,amt,kind){
  if(!e.alive)return;
  if(e.sh>0){
    if(kind==='meteor')e.sh=0;
    else if(kind==='crystal')e.sh-=amt*5;
    else{sfx('shield');setBar(e);return;}
    if(e.sh<=0){e.sh=0;if(e.bubble){e.obj.remove(e.bubble);e.bubble=null;}burst(e.obj.position,10,0x7fe6ff,.7);sfx('shieldbreak');}
    setBar(e);if(kind!=='meteor')return;
  }
  const real=Math.max(amt*.25,amt-e.E.armor);e.hp-=real;
  setBar(e);
  if(e.hp<=0)kill(e);
}
function kill(e){
  e.alive=false;world.remove(e.obj);
  const gold=Math.round(e.E.gold*G.goldMult);G.coins+=gold;popup('+'+gold,e.obj.position);sfx('pop');
  if(G.L.endless){G.score+=e.E.gold*10*(1+G.wave*.05);}
  burst(e.obj.position,e.E.boss?40:12,e.E.boss?0xffd34d:0xb48cff,e.E.boss?1.6:.8);
  if(e.E.split){for(let i=0;i<2;i++)spawnEnemy(e.E.split,Math.max(0,e.d-.25*i),e.ri);}
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

// ---------- projéteis e efeitos ----------
const pGeo=new THREE.IcosahedronGeometry(.07,0);
const pMats={};const pmat=c=>pMats[c]||(pMats[c]=new THREE.MeshBasicMaterial({color:c,transparent:true}));
function burst(pos,n,color,size){
  for(let i=0;i<n;i++){const m=new THREE.Mesh(pGeo,pmat(color));m.position.copy(pos);
    const v=new THREE.Vector3(Math.random()-.5,Math.random()*.9+.2,Math.random()-.5).multiplyScalar(3*(size||1));
    m.scale.setScalar((Math.random()*.8+.6)*(size||1));world.add(m);G.fx.push({o:m,v,t:0,T:.45+Math.random()*.3,kind:'p'});}
}
function ringFx(pos,r,color){
  const m=new THREE.Mesh(new THREE.RingGeometry(.8,1,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(pos.x,.25,pos.z);world.add(m);G.fx.push({o:m,t:0,T:.35,kind:'ring',r});
}
const zapMat=new THREE.LineBasicMaterial({color:0xfff27a,transparent:true});
const zapMat2=new THREE.LineBasicMaterial({color:0xffffff,transparent:true});
function bolt(a,b){
  [zapMat,zapMat2].forEach((mt,j)=>{
    const pts=[];const n=7;
    for(let i=0;i<=n;i++){const p=a.clone().lerp(b,i/n);if(i>0&&i<n){p.x+=(Math.random()-.5)*.28;p.y+=(Math.random()-.5)*.28;p.z+=(Math.random()-.5)*.28;}pts.push(p);}
    const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mt.clone());world.add(l);G.fx.push({o:l,t:0,T:j?.12:.2,kind:'line'});
  });
}
function fire(t,target){
  const T=TOWERS[t.type],s=stats(t);
  const from=new THREE.Vector3();t.weapon.getWorldPosition(from);from.y+=.25;
  if(T.proj==='zap'){
    const hits=[target];let last=target;
    for(let i=1;i<s.chain;i++){let best=null,bd=s.jump;
      for(const e of G.enemies){if(!e.alive||hits.includes(e))continue;const d=e.obj.position.distanceTo(last.obj.position);if(d<bd){bd=d;best=e;}}
      if(!best)break;hits.push(best);last=best;}
    let prev=from;hits.forEach((e,i)=>{const p=e.obj.position.clone();bolt(prev,p);prev=p;damage(e,s.dmg*Math.pow(.85,i),'zap');});
    burst(from,5,0xfff27a,.4);sfx('zap');return;
  }
  let o,p={t,s,target,kind:T.proj,from:from.clone(),pos:from.clone()};
  if(T.proj==='arrow'){o=M('weapon-ammo-arrow');o.scale.setScalar(.6);p.spd=13;sfx('arrow');}
  else if(T.proj==='ball'){o=M('weapon-ammo-cannonball');o.scale.setScalar(.8);sfx('cannon');}
  else if(T.proj==='rock'){o=M('weapon-ammo-boulder');o.scale.setScalar(1.1);sfx('rock');}
  else {o=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,1),new THREE.MeshBasicMaterial({color:0xc9a7ff}));p.spd=8.5;sfx('orb');}
  if(T.proj==='ball'||T.proj==='rock'){
    const flight=T.proj==='rock'?1.0:.55;const fut=new THREE.Vector3();
    samplePath(target.route,target.d+target.E.spd*(1-target.slowF)*(target.frz>0?0:1)*flight,fut);
    p.to=fut;p.T=flight;p.tt=0;p.h=T.proj==='rock'?2.2:1.0;
  }
  o.position.copy(from);world.add(o);p.o=o;G.proj.push(p);
}
function updateProj(dt){
  for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];let done=false;
    if(p.to){p.tt+=dt;const k=Math.min(1,p.tt/p.T);p.pos.lerpVectors(p.from,p.to,k);p.pos.y=p.from.y*(1-k)+.45*k+4*p.h*k*(1-k);
      p.o.position.copy(p.pos);p.o.rotation.x+=dt*8;
      if(k>=1){done=true;splash(p.to,p.s.spl,p.s.dmg,p.kind);burst(p.to,p.kind==='rock'?14:9,0xffb347,p.kind==='rock'?1:.7);ringFx(p.to,p.s.spl,0xffd08a);sfx('boom');}}
    else{const tg=p.target;const aim=tg.alive?tmpV.copy(tg.obj.position):tmpV.copy(p.last||p.pos);if(tg.alive)p.last=aim.clone();
      const dir=aim.clone().sub(p.pos);const dist=dir.length();const step=p.spd*dt;
      if(dist<=step+.05){done=true;
        if(tg.alive){if(p.kind==='orb')applyOrb(p,tg);else{damage(tg,p.s.dmg,'arrow');sfx('hit');}}}
      else{dir.multiplyScalar(1/dist);p.pos.addScaledVector(dir,step);p.o.position.copy(p.pos);
        if(p.kind==='arrow')p.o.lookAt(aim);else p.o.rotation.y+=dt*6;}}
    if(done){world.remove(p.o);G.proj.splice(i,1);}
  }
}
function applyOrb(p,tg){
  const s=p.s;const hitOne=e=>{damage(e,s.dmg,'crystal');if(e.alive){e.slowT=Math.max(e.slowT,s.st);e.slowF=Math.max(e.slowF,e.E.boss?s.slow*.5:s.slow);}};
  if(s.spl){G.enemies.forEach(e=>{if(e.alive&&e.obj.position.distanceTo(tg.obj.position)<=s.spl)hitOne(e);});ringFx(tg.obj.position,s.spl,0xc9a7ff);}
  else hitOne(tg);
  burst(tg.obj.position,6,0xd9c2ff,.6);
}
function splash(pos,r,dmg,kind){
  G.enemies.slice().forEach(e=>{if(!e.alive)return;const d=Math.hypot(e.obj.position.x-pos.x,e.obj.position.z-pos.z);
    if(d<=r)damage(e,dmg*(d<r*.4?1:.65),kind);});
}
function updateFx(dt){
  for(let i=G.fx.length-1;i>=0;i--){const f=G.fx[i];f.t+=dt;const k=Math.min(1,f.t/f.T);
    if(f.kind==='p'){f.v.y-=9*dt;f.o.position.addScaledVector(f.v,dt);f.o.scale.multiplyScalar(1-dt*2.2);}
    else if(f.kind==='ring'){const s=f.r*(.3+.7*k);f.o.scale.set(s,s,s);f.o.material.opacity=.7*(1-k);}
    else if(f.kind==='beam'){f.o.scale.x=f.o.scale.z=.9*(1-k*.7);}
    else if(f.kind==='line'){f.o.material.opacity=1-k;}
    else if(f.kind==='meteor'){f.o.position.lerpVectors(f.a,f.b,k*k);f.o.rotation.x+=dt*9;f.o.rotation.z+=dt*6;
      if(Math.random()<.8)burst(f.o.position,1,0xff9a3d,.5);}
    if(f.t>=f.T){world.remove(f.o);if(f.o.geometry&&(f.kind==='ring'||f.kind==='line')){f.o.geometry.dispose();f.o.material.dispose();}G.fx.splice(i,1);if(f.done)f.done();}
  }
}

// ---------- habilidades ----------
function useFreeze(){
  if(!G||G.over||G.ab.freeze>0){sfx('no');return;}
  G.ab.freeze=FREEZE_CD;sfx('freeze');
  G.enemies.forEach(e=>{if(e.alive)e.frz=e.E.boss?FREEZE_T*.5:FREEZE_T;});
  const fr=$('frost');fr.classList.add('show');setTimeout(()=>fr.classList.remove('show'),FREEZE_T*1000/Math.max(1,speed));
  toast('❄️ Tudo congelado!');hudDirty=true;
}
function aimMeteor(){
  if(!G||G.over)return;
  if(G.ab.meteor>0){sfx('no');return;}
  G.aiming=!G.aiming;closePanel(true);
  $('abM').classList.toggle('aim',G.aiming);aimRing.visible=false;
  if(G.aiming)toast('☄️ Toque no mapa para lançar o meteoro');
}
function dropMeteor(pt){
  G.aiming=false;$('abM').classList.remove('aim');aimRing.visible=false;
  G.ab.meteor=METEOR_CD;hudDirty=true;
  const o=M('weapon-ammo-boulder');o.scale.setScalar(3.2);world.add(o);
  const b=new THREE.Vector3(pt.x,.4,pt.z),a=new THREE.Vector3(pt.x+3,10,pt.z-3);o.position.copy(a);
  sfx('rock');
  G.fx.push({o,t:0,T:.6,kind:'meteor',a,b,done:()=>{
    splash(b,1.7,70*G.hpMult,'meteor');burst(b,30,0xff8a3d,1.4);burst(b,14,0xffe08a,1);ringFx(b,1.7,0xffb347);shake=.5;sfx('meteor');}});
}

// ---------- popups ----------
function popup(txt,pos,color){
  const v=pos.clone();v.y+=.6;v.project(C);if(v.z>1)return;
  const d=document.createElement('div');d.className='pop';d.textContent=txt;if(color)d.style.color=color;
  d.style.left=((v.x+1)/2*innerWidth)+'px';d.style.top=((1-v.y)/2*innerHeight)+'px';
  $('pops').appendChild(d);setTimeout(()=>d.remove(),900);
}
let toastT=0;function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('show'),2000);}
let bannerT=0;function banner(t,ms){const e=$('banner');e.textContent=t;e.classList.add('show');clearTimeout(bannerT);bannerT=setTimeout(()=>e.classList.remove('show'),ms||1500);}

// ---------- ondas ----------
function parseWave(s){
  const q=[];let t=0;
  s.split(',').forEach(g=>{const m=g.match(/^([a-zX])(\d+):([\d.]+)$/);const k=m[1],n=+m[2],gap=+m[3];
    for(let i=0;i<n;i++){q.push({t,k});t+=gap;}t+=1.2;});
  return q;
}
// modo infinito: ondas geradas, cada vez mais fortes
function genWave(n){
  const pool=[['a',1,1]];if(n>=2)pool.push(['b',.8,1]);if(n>=4)pool.push(['c',2.4,.7]);if(n>=6)pool.push(['d',2,.7]);if(n>=8)pool.push(['s',2.2,.6]);
  let budget=8+n*3.2;const groups=[];const r=rng(n*97+13);
  if(n%10===0)groups.push('X'+Math.max(1,Math.floor(n/10))+':4');
  while(budget>0&&groups.length<4){
    let tot=pool.reduce((a,p)=>a+p[2],0),q=r()*tot,pick=pool[0];for(const p of pool){q-=p[2];if(q<=0){pick=p;break;}}
    const cnt=Math.max(3,Math.min(30,Math.round((budget*(.35+r()*.4))/pick[1])));budget-=cnt*pick[1];
    const gap=Math.max(.22,(pick[0]==='c'||pick[0]==='s'?1.3:pick[0]==='b'?.5:.85)-n*.012);
    groups.push(pick[0]+cnt+':'+gap.toFixed(2));
  }
  return groups.join(',');
}
function waveStr(i){return G.L.endless?genWave(i+1):G.L.waves[i];}
function totalWaves(){return G.L.endless?Infinity:G.L.waves.length;}
function startWave(){
  if(!G||G.over||G.waveActive||G.wave>=totalWaves())return;
  if(G.wave>0&&G.countdown>0){const b=Math.ceil(G.countdown);G.coins+=b;if(G.L.endless)G.score+=b*5;toast('Bônus por chamar cedo: +'+b+' 🪙');}
  const ws=waveStr(G.wave);
  G.queue=parseWave(ws);G.qt=0;G.wave++;G.waveActive=true;G.countdown=0;
  G.hpMult=G.L.endless?(1+.11*(G.wave-1)+.006*(G.wave-1)*(G.wave-1)):G.L.hp*(1+.08*(G.wave-1));
  sfx('wave');banner(G.wave===totalWaves()?'Onda final!':'Onda '+G.wave);
  G.bossWave=ws.indexOf('X')>=0;
  if(G.bossWave){setTimeout(()=>banner('👾 Nave-mãe chegando!',1800),1600);playMusic('boss');}
  hudDirty=true;
}

// ---------- fases ----------
function levelMusic(){return G.L.endless?'inf':G.L.world===2?'w2':'w1';}
function startLevel(li,bg){
  closePanel();
  const L=li==='inf'?ENDLESS:LEVELS[li];
  const w=buildWorld(L,li==='inf'?4242:1234+li*777);
  G={li:li==='inf'?99:li,L,grid:w.grid,routes:w.routes,castle:w.castle,portals:w.portals,spawnN:0,
     coins:L.coins,lives:20,goldMult:L.endless?1:1+(L.hp-1)*.5,wave:0,waveActive:false,queue:[],qt:0,countdown:0,hpMult:1,score:0,
     towers:[],enemies:[],proj:[],fx:[],over:false,time:0,ab:{meteor:0,freeze:0},aiming:false,bossWave:false};
  selMarker=M('selection-a');selMarker.visible=false;world.add(selMarker);
  rangeRing=new THREE.Mesh(new THREE.RingGeometry(.96,1,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));
  rangeRing.add(new THREE.Mesh(new THREE.CircleGeometry(.96,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,depthWrite:false})));
  rangeRing.rotation.x=-Math.PI/2;rangeRing.position.y=.23;rangeRing.visible=false;world.add(rangeRing);
  aimRing=new THREE.Mesh(new THREE.RingGeometry(1.6,1.7,48),new THREE.MeshBasicMaterial({color:0xff8a3d,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
  aimRing.rotation.x=-Math.PI/2;aimRing.position.y=.24;aimRing.visible=false;world.add(aimRing);
  paused=false;speed=1;$('spd').textContent='1×';
  $('frost').classList.remove('show');$('abM').classList.remove('aim');
  $('scorePill').style.display=L.endless?'':'none';
  fitCamera();
  if(bg)return;
  showScreen(null);$('hud').style.display='';hudDirty=true;
  banner(L.name,1600);playMusic(levelMusic());
}
function endLevel(win){
  if(G.over)return;G.over=true;closePanel();
  G.aiming=false;
  setTimeout(()=>{
    $('rankMsg').textContent='';
    if(G.L.endless){
      const sc=Math.floor(G.score),rec=sc>save.best;
      if(rec){save.best=sc;}if(G.wave>save.bestWave)save.bestWave=G.wave;persist();
      $('endT').textContent=rec?'Novo recorde!':'Fim de jogo';
      $('endS').textContent='🏆 '+fmt(sc);
      $('endP').textContent='Você chegou à onda '+G.wave+'. Recorde: '+fmt(save.best)+' pontos.';
      $('next').style.display='none';
      stopMusic();if(rec)jingle('jingles-pizzicato_08',.6);else jingle('Game_Over',.45);
      if(window.SSCloud&&SSCloud.available()){
        if(SSCloud.user()){$('rankMsg').textContent='Enviando para o ranking…';
          SSCloud.submit(sc,G.wave).then(()=>{$('rankMsg').textContent='✅ Pontuação enviada ao ranking';}).catch(()=>{$('rankMsg').textContent='Não foi possível enviar ao ranking agora.';});}
        else $('rankMsg').innerHTML='Entre com Google no menu para aparecer no ranking.';
      }
    }else{
      let st=0;if(win){st=G.lives>=18?3:G.lives>=10?2:1;if(st>save.stars[G.li]){save.stars[G.li]=st;}persist();}
      $('endT').textContent=win?'Vitória!':'O castelo caiu…';
      $('endS').textContent=win?('★'.repeat(st)+'☆'.repeat(3-st)):'💥';
      $('endP').textContent=win?('Vidas restantes: '+G.lives+' / 20'):('Você chegou até a onda '+G.wave+' de '+G.L.waves.length+'.');
      $('next').style.display=win&&G.li<LEVELS.length-1?'':'none';
      stopMusic();if(win)jingle('jingles-pizzicato_00',.6);else jingle('Game_Over',.45);
    }
    showScreen('end');
  },win?600:900);
}

// ---------- interface ----------
let hudDirty=true,lastCoins=-1;
function showScreen(id){
  ['menu','pause','end','rank'].forEach(s=>$(s).classList.toggle('show',s===id));
  screenState=id||'play';
  if(id==='menu'){$('hud').style.display='none';renderMenu();playMusic('menu');}
}
function renderMenu(){
  const el=$('levels');let h='';
  [1,2].forEach(wd=>{
    h+='<div class="world"><div class="wt">'+(wd===1?'🌿 Mundo 1 · Campina':'❄️ Mundo 2 · Neve')+'</div><div class="wl">';
    LEVELS.forEach((L,i)=>{if(L.world!==wd)return;const locked=i>0&&!save.stars[i-1];const s=save.stars[i];
      h+='<button class="lvl'+(locked?' locked':'')+'" data-l="'+i+'"><span class="n">FASE '+(i+1)+(L.paths.length>1?' · 2 portais':'')+'</span><b>'+L.name+'</b><span class="st">'+(locked?'🔒':('<span style="color:#ffd34d">'+'★'.repeat(s)+'</span>'+'☆'.repeat(3-s)))+'</span></button>';});
    h+='</div></div>';
  });
  const infLock=!save.stars[2];
  h+='<div class="world side"><button class="lvl inf'+(infLock?' locked':'')+'" data-l="inf"><span class="n">MODO INFINITO</span><b>♾ Arena Infinita</b><span class="nb">'+(infLock?'🔒 Complete a fase 3':'Recorde: '+fmt(save.best)+' · onda '+save.bestWave)+'</span></button>'+
     '<button class="btn orange" id="rankBtn">🏆 Ranking</button><div id="acct"></div></div>';
  el.innerHTML=h;
  el.querySelectorAll('[data-l]').forEach(b=>{b.onclick=()=>{ac();if(b.classList.contains('locked')){sfx('no');toast(b.dataset.l==='inf'?'Complete a fase 3 para liberar':'Complete a fase anterior');return;}sfx('click');startLevel(b.dataset.l==='inf'?'inf':+b.dataset.l);};});
  $('rankBtn').onclick=()=>{ac();sfx('click');openRank();};
  renderAcct();fitMenu();
}
function renderAcct(){
  const a=$('acct');if(!a)return;
  if(!window.SSCloud||!SSCloud.available()){a.innerHTML='';return;}
  const u=SSCloud.user();
  if(!u){a.innerHTML='<div class="acct"><span>☁️ Salve estrelas e recordes na nuvem</span><button class="btn green" id="gIn">Entrar com Google</button></div>';$('gIn').onclick=()=>SSCloud.login();}
  else{a.innerHTML='<div class="acct"><span>☁️ <b>'+esc(u.nome)+'</b><br><small>'+esc(SSCloud.status())+'</small></span><button class="btn" id="gOut">Sair</button></div>';$('gOut').onclick=()=>SSCloud.logout();}
  fitMenu();
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function openRank(){
  showScreen('rank');const L=$('rankList');
  const mine='<div class="mine">Seu recorde neste aparelho: <b>'+fmt(save.best)+'</b> pontos · onda '+save.bestWave+'</div>';
  if(!window.SSCloud||!SSCloud.available()){L.innerHTML=mine+'<p class="muted">O ranking online fica na versão do site:<br><b>fabula-studio-theta.vercel.app</b></p>';return;}
  L.innerHTML=mine+'<p class="muted">Carregando…</p>';
  try{const rows=await SSCloud.ranking();
    L.innerHTML=mine+(rows.length?'<ol class="rk">'+rows.map(r=>'<li class="'+(r.eu?'eu':'')+'"><span class="p">'+(r.posicao<=3?['🥇','🥈','🥉'][r.posicao-1]:r.posicao+'º')+'</span><span class="nm">'+esc(r.nome)+'</span><span class="pt">'+fmt(r.pontos)+'</span><span class="ow">onda '+r.onda+'</span></li>').join('')+'</ol>':'<p class="muted">Ninguém no ranking ainda. Seja o primeiro!</p>')+
      (SSCloud.user()?'':'<p class="muted">Entre com Google no menu para aparecer aqui.</p>');
  }catch(e){L.innerHTML=mine+'<p class="muted">Não foi possível carregar o ranking agora.</p>';}
}
function updateHud(){
  $('coins').textContent=G.coins;$('lives').textContent=G.lives;
  $('wave').textContent=G.L.endless?G.wave:(G.wave+'/'+G.L.waves.length);
  if(G.L.endless)$('score').textContent=fmt(G.score);
  const wb=$('wavebtn');
  if(G.waveActive||G.wave>=totalWaves()||G.over){wb.style.display='none';}
  else{wb.style.display='';wb.innerHTML=G.wave===0?'▶ Começar onda 1':('▶ Onda '+(G.wave+1)+'<small>'+(G.countdown>0?('em '+Math.ceil(G.countdown)+'s · chamar já +'+Math.ceil(G.countdown)+'🪙'):'')+'</small>');}
  abUi('abM',G.ab.meteor,METEOR_CD);abUi('abF',G.ab.freeze,FREEZE_CD);
  if(G.coins!==lastCoins){lastCoins=G.coins;if(panelMode)refreshPanel();}
}
function abUi(id,cd,max){const b=$(id);const p=cd>0?cd/max:0;b.style.setProperty('--p',(p*360)+'deg');b.classList.toggle('cd',cd>0);b.querySelector('i').textContent=cd>0?Math.ceil(cd):'';}
let panelMode=null,panelCell=null,panelTower=null;
function closePanel(keepAim){panelMode=null;panelTower=null;panelCell=null;$('panel').classList.remove('show');if(selMarker)selMarker.visible=false;if(rangeRing)rangeRing.visible=false;
  if(!keepAim&&G&&G.aiming){G.aiming=false;$('abM').classList.remove('aim');if(aimRing)aimRing.visible=false;}}
function openBuild(cx,cz){panelMode='build';panelCell=[cx,cz];panelTower=null;selMarker.position.set(wx(cx),.2,wz(cz));selMarker.visible=true;rangeRing.visible=false;refreshPanel();}
function openTower(t){panelMode='tower';panelTower=t;selMarker.position.set(wx(t.cx),.2,wz(t.cz));selMarker.visible=true;showRange(t.cx,t.cz,stats(t).rng);refreshPanel();}
function showRange(cx,cz,r){rangeRing.position.set(wx(cx),.23,wz(cz));rangeRing.scale.set(r,r,r);rangeRing.visible=true;}
function refreshPanel(){
  const p=$('panel');p.innerHTML='';
  if(panelMode==='build'){
    TORDER.forEach(type=>{const T=TOWERS[type];const locked=!unlocked(type);const can=!locked&&G.coins>=T.cost;
      const c=document.createElement('div');c.className='card'+(can?'':' off')+(locked?' lock':'');
      if(locked)c.dataset.lock='Fase '+(T.unlock+1);
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
    let extra='';if(s.slow)extra=' · Lentidão '+f(Math.round(s.slow*100),nx&&Math.round(nx.slow*100),'%');if(s.chain)extra=' · Saltos '+f(s.chain,nx&&nx.chain);
    let html='<div class="tinfo"><img src="'+THUMB[t.type+t.lvl]+'"><div><h3>'+T.name+' · Nv '+t.lvl+'</h3><p>'+T.desc+'<br>Dano '+f(s.dmg,nx&&nx.dmg)+' · Alcance '+f(s.rng,nx&&nx.rng)+'<br>Recarga '+f(s.rate,nx&&nx.rate,'s')+extra+'</p></div></div>';
    html+='<div class="tbtns">'+(t.lvl<3?'<button class="btn green" id="upb"'+(G.coins<upc?' disabled':'')+'>⬆ Melhorar 🪙'+upc+'</button>':'<button class="btn" disabled>Nível máximo</button>')+'<button class="btn red" id="sellb">Vender +'+refund+'</button></div>';
    p.innerHTML=html;
    const ub=$('upb');if(ub)ub.onclick=()=>{if(G.coins<upc){sfx('no');return;}G.coins-=upc;t.spent+=upc;t.lvl++;rebuildTower(t);sfx('upgrade');burst(t.obj.position.clone().setY(t.top),12,0xffd34d,.7);hudDirty=true;openTower(t);};
    $('sellb').onclick=()=>{G.coins+=refund;world.remove(t.obj);G.towers.splice(G.towers.indexOf(t),1);G.grid[t.cz][t.cx]=0;popup('+'+refund,t.obj.position);sfx('sell');hudDirty=true;closePanel();};
  }
  const x=document.createElement('button');x.className='x';x.textContent='✕';x.onclick=()=>closePanel();p.appendChild(x);
  p.classList.add('show');
}

// ---------- entrada ----------
let down=null;
R.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};ac();});
R.domElement.addEventListener('pointermove',e=>{
  if(!G||!G.aiming)return;const p=groundPoint(e.clientX,e.clientY);if(p){aimRing.position.set(p.x,.24,p.z);aimRing.visible=true;}
});
R.domElement.addEventListener('pointerup',e=>{
  if(!down||screenState!=='play'||!G||G.over)return;
  if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>14){down=null;return;}down=null;
  if(G.aiming){const p=groundPoint(e.clientX,e.clientY);if(p&&Math.abs(p.x)<GW/2+.5&&Math.abs(p.z)<GH/2+.5)dropMeteor(p);return;}
  const cell=pickCell(e.clientX,e.clientY);if(!cell){closePanel();return;}
  const [cx,cz]=cell;const v=G.grid[cz][cx];
  if(v===3){openTower(G.towers.find(t=>t.cx===cx&&t.cz===cz));}
  else if(v===0){if(panelMode==='build'&&panelCell&&panelCell[0]===cx&&panelCell[1]===cz)closePanel();else openBuild(cx,cz);}
  else{closePanel();if(v===2)toast('Não dá para construir aqui');}
});
function groundPoint(px,py){ray.setFromCamera({x:px/innerWidth*2-1,y:-(py/innerHeight)*2+1},C);const h=ray.ray.intersectPlane(plane,new THREE.Vector3());return h;}
function pickCell(px,py){
  ray.setFromCamera({x:px/innerWidth*2-1,y:-(py/innerHeight)*2+1},C);
  for(const t of G.towers){const b=new THREE.Box3().setFromObject(t.obj);if(ray.ray.intersectsBox(b))return [t.cx,t.cz];}
  const hit=ray.ray.intersectPlane(plane,tmpV);if(!hit)return null;
  const cx=Math.floor(hit.x+GW/2),cz=Math.floor(hit.z+GH/2);
  if(cx<0||cz<0||cx>=GW||cz>=GH)return null;return [cx,cz];
}
$('wavebtn').onclick=()=>{ac();startWave();};
$('abM').onclick=()=>{ac();aimMeteor();};
$('abF').onclick=()=>{ac();useFreeze();};
$('spd').onclick=()=>{speed=speed===1?2:speed===2?3:1;$('spd').textContent=speed+'×';sfx('click');};
function syncAudioBtns(){$('snd').textContent=muted?'🔇':'🔊';document.querySelectorAll('.sndR').forEach(b=>{b.textContent=muted?'🔇':'🔊';b.classList.toggle('off',muted)});document.querySelectorAll('.musR').forEach(b=>b.classList.toggle('off',musicOff));$('mus').classList.toggle('off',musicOff);document.querySelectorAll('.musT').forEach(b=>b.textContent=musicOff?'🎵 Música: não':'🎵 Música: sim');document.querySelectorAll('.sndT').forEach(b=>b.textContent=muted?'🔇 Efeitos: não':'🔊 Efeitos: sim');}
function toggleSnd(){muted=!muted;if(sfxGain)sfxGain.gain.value=muted?0:1;try{localStorage.setItem(SAVE_KEY+'_mute',muted?'1':'0')}catch(e){}syncAudioBtns();}
function toggleMus(){musicOff=!musicOff;ac();if(musGain)musGain.gain.value=musicOff?0:1;try{localStorage.setItem(SAVE_KEY+'_music',musicOff?'0':'1')}catch(e){}syncAudioBtns();}
$('snd').onclick=toggleSnd;$('mus').onclick=toggleMus;
document.querySelectorAll('.sndT').forEach(b=>b.onclick=toggleSnd);
document.querySelectorAll('.musT').forEach(b=>b.onclick=toggleMus);
document.querySelectorAll('.sndR').forEach(b=>b.onclick=toggleSnd);
document.querySelectorAll('.musR').forEach(b=>b.onclick=toggleMus);
// encaixa o menu inteiro na tela (sem rolagem), em pé ou deitado
function fitMenu(){const b=$('mbox');if(!b||!$('menu').classList.contains('show'))return;b.style.transform='none';
  const W=window.innerWidth,H=window.innerHeight,top=H>W?62:8;const w=b.offsetWidth,h=b.offsetHeight;
  const k=Math.min(1,(W-12)/w,(H-top-8)/h);b.style.transform=`translateY(${(top-8)/2}px) scale(${k})`;}
window.addEventListener('resize',()=>requestAnimationFrame(fitMenu));
window.addEventListener('orientationchange',()=>setTimeout(fitMenu,250));
syncAudioBtns();
$('pau').onclick=()=>{paused=true;showScreen('pause');};
$('resume').onclick=()=>{paused=false;showScreen(null);};
$('restart').onclick=()=>startLevel(G.L.endless?'inf':G.li);
$('quit').onclick=()=>{paused=false;showScreen('menu');};
$('again').onclick=()=>startLevel(G.L.endless?'inf':G.li);
$('next').onclick=()=>startLevel(G.li+1);
$('tomenu').onclick=()=>showScreen('menu');
$('rankBack').onclick=()=>showScreen('menu');
document.addEventListener('keydown',e=>{
  if(screenState!=='play')return;
  if(e.code==='Space'){startWave();e.preventDefault();}
  if(e.key==='Escape'){if(G.aiming||panelMode)closePanel();else{paused=true;showScreen('pause');}}
  if(e.key==='f')$('spd').click();
  if(e.key==='q')aimMeteor();
  if(e.key==='e')useFreeze();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(screenState==='play'&&G&&!G.over){paused=true;showScreen('pause');}if(AC)AC.suspend();}
  else if(AC)AC.resume();
});

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
addEventListener('resize',fitCamera);
let camOff0=null;
function zoomCam(f,x,z){if(!camOff0){camLook.set(0,0,.35);fitCamera();camOff0=camBase.clone().sub(camLook);}camLook.set(x,0,z);camBase.copy(camLook).addScaledVector(camOff0,f);C.position.copy(camBase);C.lookAt(camLook);}

// ---------- loop ----------
function update(dt){
  G.time+=dt;
  for(const k in G.ab){if(G.ab[k]>0){const b=Math.ceil(G.ab[k]);G.ab[k]=Math.max(0,G.ab[k]-dt);if(Math.ceil(G.ab[k])!==b)hudDirty=true;}}
  if(G.waveActive){
    G.qt+=dt;while(G.queue.length&&G.queue[0].t<=G.qt){spawnEnemy(G.queue.shift().k,0);}
    if(!G.queue.length&&!G.enemies.some(e=>e.alive)){
      G.waveActive=false;
      if(G.bossWave){G.bossWave=false;playMusic(levelMusic());}
      if(G.wave>=totalWaves()){endLevel(true);}
      else{const bonus=6+G.wave*2;G.coins+=bonus;if(G.L.endless)G.score+=50*G.wave;toast('Onda concluída! +'+bonus+' 🪙');sfx('coin');G.countdown=G.L.endless?10:15;}
      hudDirty=true;
    }
  }else if(G.countdown>0&&!G.over){const before=Math.ceil(G.countdown);G.countdown-=dt;if(Math.ceil(G.countdown)!==before)hudDirty=true;if(G.countdown<=0){G.countdown=0;startWave();}}
  for(const e of G.enemies){if(!e.alive)continue;
    if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0)e.slowF=0;}
    if(e.frz>0)e.frz-=dt;
    e.ring.visible=e.slowT>0&&e.frz<=0;e.ice.visible=e.frz>0;
    const mv=e.frz>0?0:e.E.spd*(1-e.slowF);
    e.d+=mv*dt;
    if(e.d>=e.route.len){leak(e);if(G.over)return;continue;}
    samplePath(e.route,e.d,e.pos);if(e.frz<=0)e.ph+=dt*3;
    e.obj.position.set(e.pos.x,e.E.y+Math.sin(e.ph)*.06,e.pos.z);
    if(e.frz<=0){e.model.rotation.y+=dt*(e.E.boss?.8:2.2);e.model.rotation.z=Math.sin(e.ph*.7)*.08;}
    if(e.bubble)e.bubble.rotation.y+=dt;
  }
  G.enemies=G.enemies.filter(e=>e.alive);
  for(const t of G.towers){const s=stats(t);t.cd-=dt;
    if(t.pop<1){t.pop=Math.min(1,t.pop+dt*5);t.obj.scale.setScalar(TOWER_SC*(1+Math.sin(t.pop*Math.PI)*.15));}
    if(t.type==='crystal'||t.type==='tesla')t.weapon.rotation.y+=dt*(t.type==='tesla'?1.6:.8);
    let best=null,bd=-1;const tx=wx(t.cx),tz=wz(t.cz);
    for(const e of G.enemies){const d=Math.hypot(e.obj.position.x-tx,e.obj.position.z-tz);
      // o cristal prefere óvnis com escudo
      const pr=e.d+(t.type==='crystal'&&e.sh>0?100:0);
      if(d<=s.rng&&pr>bd){bd=pr;best=e;}}
    if(best&&t.type!=='crystal'&&t.type!=='tesla'){const want=Math.atan2(best.obj.position.x-tx,best.obj.position.z-tz);
      let dy=want-t.weapon.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));t.weapon.rotation.y+=dy*Math.min(1,dt*12);}
    if(best&&t.cd<=0){t.cd=s.rate;fire(t,best);}
  }
  updateProj(dt);updateFx(dt);
}
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(.05,(now-last)/1000);last=now;
  if(G&&screenState==='play'&&!paused&&!G.over&&!window.__manual){for(let i=0;i<speed;i++)update(dt);}
  else if(G&&G.over){updateFx(dt);}
  else if(G&&screenState==='menu'){C.position.copy(camBase);}
  if(G&&G.portals)G.portals.forEach(p=>p.rotation.y+=dt*1.5);
  if(rangeRing&&rangeRing.visible)rangeRing.material.opacity=.45+Math.sin(now*.006)*.12;
  if(aimRing&&aimRing.visible)aimRing.rotation.z+=dt*2;
  if(selMarker&&selMarker.visible)selMarker.position.y=.2+Math.sin(now*.008)*.02;
  if(shake>0){shake=Math.max(0,shake-dt);C.position.copy(camBase).add(new THREE.Vector3((Math.random()-.5)*shake*.5,(Math.random()-.5)*shake*.5,0));}
  else if(G)C.position.copy(camBase);
  if(G&&hudDirty&&screenState!=='menu'){hudDirty=false;updateHud();}
  R.render(S,C);
}

// ---------- início ----------
Promise.all([loadModels(),texP]).then(()=>{
  makeThumbs();
  startLevel(0,true);showScreen('menu');
  $('load').remove();
  requestAnimationFrame(frame);
  window.dispatchEvent(new Event('ss-ready'));
});
// primeiro toque libera o áudio (regra dos navegadores)
const unlock=()=>{ac();if(wantMus)playMusic(wantMus,true);removeEventListener('pointerdown',unlock,true);removeEventListener('keydown',unlock,true);};
addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);

// ponte com o salvamento na nuvem (cloud.js, só na versão do site)
window.SS={get save(){return save},merge:mergeSave,refresh:()=>{if(screenState==='menu')renderAcct();}};
// ganchos para testes
window.__td={towerModel,rebuild:rebuildTower,zoomCam,R,sun,get G(){return G},startLevel,startWave,placeTower,openBuild,openTower,update,TOWERS,LEVELS,ENDLESS,genWave,useFreeze,dropMeteor,setSpeed:v=>speed=v,get screen(){return screenState},get save(){return save},showScreen,openRank};
})();
