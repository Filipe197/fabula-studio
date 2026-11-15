// Ilhas Hex · Fabula Studio · v0.1
// Puzzle relaxante: encaixe peças hexagonais e monte seu reino.
// Assets: KayKit Medieval Hexagon (CC0) · sons e músicas: Kenney (CC0)
'use strict';
const $=id=>document.getElementById(id);
const SAVE_KEY='ilhas_hex_v01';
const SQ3=Math.sqrt(3);
const START_STACK=25;

// ---------- terrenos ----------
const TYPES={
  campo:   {nome:'Campo',   w:24},
  floresta:{nome:'Floresta',w:24},
  vila:    {nome:'Vila',    w:19},
  agua:    {nome:'Água',    w:16},
  montanha:{nome:'Montanha',w:17},
};
const TKEYS=Object.keys(TYPES);
const FRIENDS={campo:['vila'],vila:['campo','agua'],agua:['vila'],floresta:['montanha'],montanha:['floresta']};
const combina=(a,b)=>a===b||FRIENDS[a].includes(b);
const SEASONS=[['base','Primavera'],['Summer','Verão'],['Fall','Outono'],['Winter','Inverno']];
const SEASON_PTS=150;

// ---------- save ----------
let save={best:0,games:0,last:null};
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(s)save=Object.assign(save,s);}catch(e){}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}try{if(window.HXCloud)HXCloud.saved(save);}catch(e){}}

// ---------- three ----------
const R=new THREE.WebGLRenderer({antialias:true});
R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
R.outputEncoding=THREE.sRGBEncoding;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(R.domElement);
const S=new THREE.Scene();
const SKY=0x9fdcf2;
S.background=new THREE.Color(SKY);S.fog=new THREE.Fog(new THREE.Color(SKY).convertSRGBToLinear().getHex(),40,90);
const C=new THREE.PerspectiveCamera(40,1,.1,300);
const hemi=new THREE.HemisphereLight(0xf2fbff,0x4f7a6a,.72);S.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,.85);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;
S.add(sun);S.add(sun.target);

const TEX={};let texN=0,texReady;const texP=new Promise(r=>texReady=r);
SEASONS.forEach(([k])=>{const t=new THREE.TextureLoader().load(window.TEX[k],()=>{if(++texN===SEASONS.length)texReady();});
  t.encoding=THREE.sRGBEncoding;t.flipY=false;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestMipmapLinearFilter;TEX[k]=t;});
const MAT=new THREE.MeshLambertMaterial({map:TEX.base});
const GHOST=new THREE.MeshLambertMaterial({map:TEX.base,transparent:true,opacity:.72,depthWrite:false});
const CLOUD=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.92});

const TPL={};
function loadModels(){
  const L=new THREE.GLTFLoader();const keys=Object.keys(MODELS);let n=0;
  return new Promise(res=>{keys.forEach(k=>{
    const b=Uint8Array.from(atob(MODELS[k]),c=>c.charCodeAt(0)).buffer;
    L.parse(b,'',g=>{g.scene.traverse(o=>{if(o.isMesh){o.material=k.startsWith('cloud')?CLOUD:MAT;o.castShadow=!k.startsWith('hex_');o.receiveShadow=true;}});TPL[k]=g.scene;if(++n===keys.length)res();},e=>{console.error(k,e);if(++n===keys.length)res();});
  });});
}
function M(k){const t=TPL[k];if(!t){console.warn('modelo?',k);return new THREE.Group();}return t.clone(true);}

// ---------- grade hexagonal (pontas para frente) ----------
const DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const key=(q,r)=>q+','+r;
const hx=(q,r)=>2*q+r, hz=r=>SQ3*r;
function pick2cell(x,z){
  const r=z/SQ3,q=(x-r)/2,s=-q-r;
  let rq=Math.round(q),rr=Math.round(r),rs=Math.round(s);
  const dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs-s);
  if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;
  return [rq,rr];
}
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const choice=a=>a[Math.floor(Math.random()*a.length)];
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
  const keys=Object.keys(SOUNDS).sort((a,b)=>(/^[A-Z]/.test(b)?1:0)-(/^[A-Z]/.test(a)?1:0));
  keys.forEach(k=>{
    const bin=Uint8Array.from(atob(SOUNDS[k]),c=>c.charCodeAt(0)).buffer;
    const done=b=>{BUF[k]=b;if(wantMus&&MUSIC[wantMus]===k)playMusic(wantMus,true);};
    try{const p=AC.decodeAudioData(bin,done,()=>{});if(p&&p.catch)p.catch(()=>{});}catch(e){}
  });
}
function play(name,vol,rate){
  if(muted||!AC)return false;const b=BUF[name];if(!b)return false;
  const s=AC.createBufferSource();s.buffer=b;s.playbackRate.value=(rate||1)*(.95+Math.random()*.1);
  const g=AC.createGain();g.gain.value=vol==null?.5:vol;s.connect(g);g.connect(sfxGain);s.start();return true;
}
const MUSIC={menu:'Night_at_the_Beach',game:'Flowing_Rocks'};
function playMusic(k,force){
  wantMus=k;if(!AC)return;if(curMus&&curMus.key===k&&!force)return;
  const b=BUF[MUSIC[k]];
  if(curMus){const o=curMus;try{o.g.gain.setTargetAtTime(0,AC.currentTime,.3);o.s.stop(AC.currentTime+1.5);}catch(e){}curMus=null;}
  if(!b)return;
  const s=AC.createBufferSource();s.buffer=b;s.loop=true;const g=AC.createGain();g.gain.value=0;g.gain.setTargetAtTime(.3,AC.currentTime,.5);
  s.connect(g);g.connect(musGain);s.start();curMus={key:k,s,g};
}
function jingle(n,v){if(!AC||musicOff)return;const b=BUF[n];if(!b)return;const s=AC.createBufferSource();s.buffer=b;const g=AC.createGain();g.gain.value=v||.5;s.connect(g);g.connect(musGain);s.start();}
function tone(f,d,vol){if(muted||!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol||.1,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(sfxGain);o.start(t);o.stop(t+d+.02);}
const SFX={
  place:['impactWood_medium_000',.55,1],placeW:['impactSoft_medium_001',.6,1.1],pick:['tick_002',.4,1],sel:['pluck_001',.45,1.1],
  combo:['pluck_002',.45,1],quest:['jingles-steel_00',.55,1],perfect:['jingles-pizzicato_04',.6,1],fail:['error_004',.4,.9],
  click:['select_002',.4,1],undo:['switch_003',.45,1],season:['maximize_004',.5,1],end:['jingles-steel_05',.6,1],record:['jingles-pizzicato_10',.6,1],no:['error_004',.35,1.2],newq:['glass_002',.35,1]
};
const lastSfx={};
function sfx(n,rate){const now=performance.now();if(lastSfx[n]&&now-lastSfx[n]<50)return;lastSfx[n]=now;const d=SFX[n];if(d&&play(d[0],d[1],(rate||1)*d[2]))return;tone(n==='no'?180:520,.12,.08);}

// ---------- cenário ----------
const ocean=new THREE.Mesh(new THREE.CircleGeometry(220,48),new THREE.MeshLambertMaterial({color:0x1d7fc0}));
ocean.material.color.convertSRGBToLinear();ocean.rotation.x=-Math.PI/2;ocean.position.y=-.55;ocean.receiveShadow=true;S.add(ocean);
const shallow=new THREE.Mesh(new THREE.CircleGeometry(1,6),new THREE.MeshBasicMaterial({color:0x6fd3f0,transparent:true,opacity:.3,depthWrite:false}));
shallow.rotation.x=-Math.PI/2;shallow.position.y=-.54;S.add(shallow);

shallow.material.color.convertSRGBToLinear();
const board=new THREE.Group();S.add(board);
const clouds=[];

// marcadores das casas livres
const candGeo=new THREE.CircleGeometry(1.02,6);candGeo.rotateX(-Math.PI/2);candGeo.rotateY(Math.PI/6);
const candMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.22,depthWrite:false});
const candSel=new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:.55,depthWrite:false});
const ringGeo=new THREE.RingGeometry(.9,1.08,6,1);ringGeo.rotateX(-Math.PI/2);ringGeo.rotateY(Math.PI/6);
const ringMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.65,depthWrite:false});
const candGroup=new THREE.Group();S.add(candGroup);

// ---------- estado ----------
let G=null,state='menu',sel=null,hover=null,ghost=null,ghostType=null;
const anims=[];
const tween=(dur,fn,done)=>anims.push({t:0,dur,fn,done});

function newGame(mode){
  clearBoard();
  G={mode,score:0,stack:mode==='free'?Infinity:START_STACK,queue:[],tiles:new Map(),quests:[],undo:mode==='free'?Infinity:3,hist:[],
     stats:{placed:0,quests:0,perfects:0},season:0,freeType:'campo',qid:1,over:false};
  // ilha inicial
  addTile(0,0,'vila',null,false);addTile(1,0,'campo',null,false);addTile(-1,1,'floresta',null,false);
  for(let i=0;i<3;i++)G.queue.push(drawType());
  G.stack=mode==='free'?Infinity:START_STACK;
  startPlay();fitView(true);storeGame();
  if(mode==='classic'&&!save.tut)setTimeout(startTutorial,700);
}
function drawType(){
  // evita 3 iguais seguidas
  let t,tries=0;
  do{let s=0;const tot=TKEYS.reduce((a,k)=>a+TYPES[k].w,0);let x=Math.random()*tot;t=TKEYS.find(k=>(x-=TYPES[k].w)<0)||'campo';tries++;}
  while(tries<5&&G.queue.length>=2&&G.queue[G.queue.length-1]===t&&G.queue[G.queue.length-2]===t);
  return t;
}
const curType=()=>G.mode==='free'?G.freeType:G.queue[0];

function neighbors(q,r){return DIRS.map(([dq,dr])=>G.tiles.get(key(q+dq,r+dr))).filter(Boolean);}
function groupOf(q,r){
  const st=G.tiles.get(key(q,r));if(!st)return [];const t=st.t;const seen=new Set([key(q,r)]),out=[st],stack=[st];
  while(stack.length){const c=stack.pop();for(const [dq,dr] of DIRS){const k=key(c.q+dq,c.r+dr);if(seen.has(k))continue;const n=G.tiles.get(k);if(n&&n.t===t){seen.add(k);out.push(n);stack.push(n);}}}
  return out;
}
function groupOpen(grp){for(const c of grp)for(const [dq,dr] of DIRS)if(!G.tiles.has(key(c.q+dq,c.r+dr)))return true;return false;}
function candidates(){
  const out=new Map();
  G.tiles.forEach(t=>{for(const [dq,dr] of DIRS){const k=key(t.q+dq,t.r+dr);if(!G.tiles.has(k)&&!out.has(k))out.set(k,[t.q+dq,t.r+dr]);}});
  return out;
}
function scoreFor(t,q,r){
  let s=0,same=0,fr=0;
  for(const n of neighbors(q,r)){if(n.t===t){s+=2;same++;}else if(FRIENDS[t].includes(n.t)){s+=1;fr++;}}
  return {s,same,fr};
}

// ---------- montagem visual das peças ----------
function decoFor(t,q,r){
  // escolhe os modelos da peça olhando os vizinhos e o tamanho do grupo
  const nb=neighbors(q,r);const nearVila=nb.some(n=>n.t==='vila');
  const grp=[];{const seen=new Set([key(q,r)]);const st=[[q,r]];while(st.length){const [a,b]=st.pop();for(const [dq,dr] of DIRS){const k=key(a+dq,b+dr);if(seen.has(k))continue;const n=G.tiles.get(k);if(n&&n.t===t){seen.add(k);grp.push(n);st.push([n.q,n.r]);}}}}
  const size=grp.length+1;const has=m=>grp.some(g=>g.deco.some(d=>d[0]===m));
  const rot=()=>ri(0,5);const D=[];
  if(t==='vila'){
    let m;
    if(size>=10&&!has('building_castle'))m='building_castle';
    else if(size>=6)m=choice(['building_market','building_church','building_townhall','building_tavern','building_home_B','building_tower_A','building_stables']);
    else if(size>=3)m=Math.random()<.18&&!has('building_well')?'building_well':choice(['building_home_A','building_home_B','building_tavern','building_home_A']);
    else m=choice(['building_home_A','building_home_B']);
    D.push([m,0,0,rot(),1]);
    if(m==='building_home_A'||m==='building_well')D.push([choice(['barrel','crate_A_small','sack']),rnd(-.1,.1)+.55,rnd(-.3,.3),rot(),1]);
  }else if(t==='campo'){
    if(size>=4&&!has('building_windmill')&&Math.random()<.45){D.push(['building_windmill',0,0,rot(),1]);D.push(['haybale',.62,.1,rot(),1]);}
    else{D.push(['building_grain',0,0,choice([0,3]),1]);}
  }else if(t==='floresta'){
    if(nearVila&&Math.random()<.18&&!has('building_lumbermill')){D.push(['building_lumbermill',0,0,rot(),1]);D.push(['tree_single_A',.62,-.25,rot(),1]);}
    else D.push([choice(['trees_A_large','trees_B_large','trees_A_medium','trees_B_medium','trees_A_large']),0,0,rot(),1]);
  }else if(t==='montanha'){
    if(nearVila&&Math.random()<.22&&!has('building_mine'))D.push(['building_mine',0,0,rot(),1]);
    else D.push([choice(['mountain_A_grass_trees','mountain_B_grass','mountain_C_grass','hills_A_trees','mountain_A_grass_trees']),0,0,rot(),1]);
  }else if(t==='agua'){
    const x=Math.random();const ang=rnd(0,6.28),rr=rnd(.15,.5);
    if(x<.25)D.push(['waterlily_A',Math.cos(ang)*rr,Math.sin(ang)*rr,rot(),1]);
    else if(x<.45)D.push(['waterlily_B',Math.cos(ang)*rr,Math.sin(ang)*rr,rot(),1]);
    else if(x<.6)D.push(['waterplant_A',Math.cos(ang)*rr,Math.sin(ang)*rr,rot(),1]);
    else if(x<.7&&nearVila)D.push(['boat',Math.cos(ang)*.3,Math.sin(ang)*.3,rot(),1]);
  }
  return D;
}
function buildTileMesh(t,deco,mat){
  const g=new THREE.Group();
  const base=M(t==='agua'?'hex_water':'hex_grass');g.add(base);
  const y=t==='agua'?-.2:0;
  for(const [m,x,z,r,s] of deco){const o=M(m);o.position.set(x,y,z);o.rotation.y=r*Math.PI/3;o.scale.setScalar(s||1);g.add(o);}
  if(mat)g.traverse(o=>{if(o.isMesh){o.material=mat;o.castShadow=false;}});
  return g;
}
function addTile(q,r,t,deco,anim){
  deco=deco||decoFor(t,q,r);
  const tile={q,r,t,deco,perf:false,g:buildTileMesh(t,deco)};
  tile.g.position.set(hx(q,r),0,hz(r));board.add(tile.g);G.tiles.set(key(q,r),tile);
  if(anim){
    tile.g.position.y=2.2;tile.g.scale.setScalar(.9);
    tween(.38,k=>{const e=1+2.2*Math.pow(k-1,3)+1.2*Math.pow(k-1,2);tile.g.position.y=2.2*(1-Math.min(1,k*1.15));tile.g.scale.setScalar(.9+.1*e);},()=>{tile.g.position.y=0;tile.g.scale.setScalar(1);});
  }
  return tile;
}
function clearBoard(){while(board.children.length)board.remove(board.children[0]);clearGhost();candGroup.clear();$('labels').innerHTML='';}

// ---------- jogada ----------
function canPlace(q,r){return G&&!G.over&&!G.tiles.has(key(q,r))&&neighbors(q,r).length>0&&(G.mode==='free'||G.stack>0);}
function snapshot(){return JSON.stringify(serialize());}
function place(q,r){
  if(!canPlace(q,r)){sfx('no');return false;}
  ac();
  G.hist.push(snapshot());if(G.hist.length>5)G.hist.shift();
  const t=curType();const sc=scoreFor(t,q,r);
  const gd=ghost&&ghostType===t&&ghost.userData.k===key(q,r)?ghost.userData.deco:null;
  clearGhost();sel=null;
  const tile=addTile(q,r,t,gd,true);
  G.stats.placed++;
  let pts=sc.s;
  setTimeout(()=>{sfx(t==='agua'?'placeW':'place');if(sc.same+sc.fr>=3)setTimeout(()=>sfx('combo',1+.08*(sc.same+sc.fr)),80);},300);
  // missões
  const done=[];
  G.quests=G.quests.filter(Q=>{
    const [qq,qr]=Q.cell;const grp=groupOf(qq,qr);
    if(grp.length>=Q.target){done.push(Q);return false;}
    if(!groupOpen(grp)){Q.failed=true;setTimeout(()=>{sfx('fail');toast('Missão perdida: o grupo ficou sem espaço');},450);removeLabel(Q);return false;}
    return true;
  });
  let bonus=0;
  done.forEach((Q,i)=>{bonus+=Q.reward;pts+=Q.pts;G.stats.quests++;setTimeout(()=>{sfx('quest');questDone(Q);},420+i*250);});
  // encaixe perfeito
  const check=[tile,...neighbors(q,r)];
  check.forEach(c=>{
    if(c.perf)return;const nb=neighbors(c.q,c.r);
    if(nb.length===6&&nb.every(n=>combina(c.t,n.t))&&nb.filter(n=>n.t===c.t).length>=4){c.perf=true;pts+=10;G.stats.perfects++;
      setTimeout(()=>{sfx('perfect');popAt(hx(c.q,c.r),1.4,hz(c.r),'Perfeito! +10','#9ff0b8');sparkle(c);},500);}
  });
  G.score+=pts;
  if(pts>0)setTimeout(()=>popAt(hx(q,r),1,hz(r),'+'+pts),330);
  // pilha
  if(G.mode!=='free'){G.stack+=bonus-1;G.queue.shift();G.queue.push(drawType());}
  if(bonus>0&&G.mode!=='free')setTimeout(()=>toast('+'+bonus+(bonus>1?' peças':' peça')),700);
  // nova missão
  maybeQuest(tile);
  // estação
  const ns=Math.floor(G.score/SEASON_PTS)%4;
  if(G.mode!=='free'&&ns!==G.season){G.season=ns;setTimeout(()=>{setSeason(ns,true);},900);}
  refreshCands();updateHud();storeGame();autoFrame();
  if(G.mode!=='free'&&G.stack<=0){G.over=true;setTimeout(endGame,1300);}
  return true;
}
function maybeQuest(tile){
  if(G.quests.length>=3||G.stats.placed<2)return;
  const chance=G.quests.length===0?1:.3;if(Math.random()>chance)return;
  const grp=groupOf(tile.q,tile.r);
  // não repete missão no mesmo grupo
  if(G.quests.some(Q=>{const g2=groupOf(Q.cell[0],Q.cell[1]);return g2.includes(tile);}))return;
  if(!groupOpen(grp))return;
  const small=tile.t==='agua'||tile.t==='montanha';
  const add=small?ri(2,4):ri(3,6);
  const Q={id:G.qid++,cell:[tile.q,tile.r],t:tile.t,target:grp.length+add,reward:add+2,pts:add*5};
  G.quests.push(Q);setTimeout(()=>{sfx('newq');makeLabel(Q);},500);
}
function undo(){
  if(!G||G.over||!G.hist.length||G.undo<=0){sfx('no');return;}
  const s=JSON.parse(G.hist.pop());const left=G.undo-1;const hist=G.hist;
  loadGame(s,true);G.hist=hist;G.undo=G.mode==='free'?Infinity:left;sfx('undo');updateHud();refreshCands();storeGame();
}

// ---------- estações ----------
function setSeason(i,announce){
  const k=SEASONS[i][0];MAT.map=TEX[k];GHOST.map=TEX[k];MAT.needsUpdate=true;GHOST.needsUpdate=true;
  $('season').textContent=SEASONS[i][1];
  if(announce){sfx('season');toast('Chegou '+(i===0?'a ':'o ')+SEASONS[i][1]+'!');}
}

// ---------- fantasma, seleção e marcadores ----------
function clearGhost(){if(ghost){S.remove(ghost);ghost=null;}ghostType=null;$('labels').querySelectorAll('.pv').forEach(e=>e.remove());}
function showGhost(q,r){
  const t=curType();
  if(!ghost||ghostType!==t||ghost.userData.k!==key(q,r)){
    if(ghost)S.remove(ghost);
    // fantasma com modelo provável
    const dd=decoFor(t,q,r);ghost=buildTileMesh(t,dd,GHOST);ghost.userData.k=key(q,r);ghost.userData.deco=dd;ghostType=t;S.add(ghost);
  }
  ghost.position.set(hx(q,r),.3,hz(r));
  let pv=$('labels').querySelector('.pv');if(!pv){pv=document.createElement('div');pv.className='pv';$('labels').appendChild(pv);}
  const sc=scoreFor(t,q,r);pv.textContent=sc.s>0?'+'+sc.s:'+0';pv.classList.toggle('z',sc.s===0);pv.dataset.x=hx(q,r);pv.dataset.z=hz(r);
}
function refreshCands(){
  candGroup.clear();if(!G||G.over)return;
  candidates().forEach(([q,r],k)=>{
    const isSel=sel&&sel[0]===q&&sel[1]===r;
    const m=new THREE.Mesh(candGeo,isSel?candSel:candMat);m.position.set(hx(q,r),-.5,hz(r));candGroup.add(m);
    const ring=new THREE.Mesh(ringGeo,ringMat);ring.position.set(hx(q,r),-.49,hz(r));candGroup.add(ring);
  });
  // águas rasas sob a ilha
  const b=bounds();shallow.position.set(b.cx,-.54,b.cz);shallow.scale.setScalar(b.rad+3.5);
  updateShadowCam();
  $('ok').disabled=!sel;
}
function setSel(c){sel=c;if(c)showGhost(c[0],c[1]);else clearGhost();refreshCands();}

// ---------- câmera ----------
const cam={tx:0,tz:0,yaw:0,yawT:0,d:18,dT:18};
const PITCH=.93;
function bounds(){
  let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9;
  if(!G||!G.tiles.size)return {cx:0,cz:0,rad:3};
  G.tiles.forEach(t=>{const x=hx(t.q,t.r),z=hz(t.r);minx=Math.min(minx,x);maxx=Math.max(maxx,x);minz=Math.min(minz,z);maxz=Math.max(maxz,z);});
  const cx=(minx+maxx)/2,cz=(minz+maxz)/2;let rad=0;G.tiles.forEach(t=>{rad=Math.max(rad,Math.hypot(hx(t.q,t.r)-cx,hz(t.r)-cz));});
  return {cx,cz,rad:rad+1.2};
}
function fitView(instant){
  const b=bounds();cam.tx=b.cx;cam.tz=b.cz;
  cam.dT=THREE.MathUtils.clamp(needDist(b.rad),9,60);if(instant)cam.d=cam.dT;
}
function needDist(rad){const asp=innerWidth/innerHeight;const v=Math.tan(THREE.MathUtils.degToRad(C.fov/2));return (rad+(asp<1?1.2:2.4))/v/Math.min(1,asp)*(asp<1?.95:1.05);}
function autoFrame(){
  // só afasta a câmera se a ilha cresceu para fora da tela
  const b=bounds();const need=THREE.MathUtils.clamp(needDist(b.rad),9,60);
  if(cam.dT<need*.92){cam.dT=need*.92;}
  const dx=b.cx-cam.tx,dz=b.cz-cam.tz;if(Math.hypot(dx,dz)>b.rad*.35){cam.tx+=dx*.35;cam.tz+=dz*.35;}
}
function updateCam(dt){
  cam.yaw+=(cam.yawT-cam.yaw)*Math.min(1,dt*8);cam.d+=(cam.dT-cam.d)*Math.min(1,dt*10);
  const cp=Math.cos(PITCH)*cam.d,sp=Math.sin(PITCH)*cam.d;
  C.position.set(cam.tx+Math.sin(cam.yaw)*cp,sp,cam.tz+Math.cos(cam.yaw)*cp);C.lookAt(cam.tx,0,cam.tz);
  S.fog.near=cam.d*1.3+12;S.fog.far=cam.d*3+60;
}
function clampTarget(){const b=bounds();const dx=cam.tx-b.cx,dz=cam.tz-b.cz,dd=Math.hypot(dx,dz),mx=b.rad+4;if(dd>mx){cam.tx=b.cx+dx/dd*mx;cam.tz=b.cz+dz/dd*mx;}}
function updateShadowCam(){
  const b=bounds();const r=b.rad+4;
  sun.position.set(b.cx-10,22,b.cz+12);sun.target.position.set(b.cx,0,b.cz);
  Object.assign(sun.shadow.camera,{left:-r,right:r,top:r,bottom:-r,near:1,far:70});sun.shadow.camera.updateProjectionMatrix();
}

// ---------- toque / mouse ----------
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),.0),tv=new THREE.Vector3(),ndc=new THREE.Vector2();
function groundAt(x,y,yPlane){ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);ray.setFromCamera(ndc,C);plane.constant=-(yPlane||0);return ray.ray.intersectPlane(plane,tv)?tv.clone():null;}
function cellAt(x,y){const p=groundAt(x,y,-.3);if(!p)return null;return pick2cell(p.x,p.z);}
const ptrs=new Map();let drag=null,pinch=null;
const canvas=R.domElement;
canvas.addEventListener('pointerdown',e=>{
  if(state!=='play'&&state!=='view')return;ac();canvas.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),type:e.pointerType});
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),dist:cam.dT,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};drag={moved:true};}
  else drag={moved:false};
});
canvas.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);
  if(!p){if(e.pointerType==='mouse'&&state==='play')hoverAt(e.clientX,e.clientY);return;}
  const px=p.x,py=p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size>=2&&pinch){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);cam.dT=THREE.MathUtils.clamp(pinch.dist*pinch.d/Math.max(20,d),7,60);cam.d=cam.dT;
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;panBy(pinch.mx,pinch.my,mx,my);pinch.mx=mx;pinch.my=my;return;}
  if(!drag)return;
  if(!drag.moved&&Math.hypot(p.x-p.sx,p.y-p.sy)>9)drag.moved=true;
  if(drag.moved)panBy(px,py,p.x,p.y);
  else if(e.pointerType==='mouse'&&state==='play')hoverAt(e.clientX,e.clientY);
});
function panBy(x0,y0,x1,y1){const a=groundAt(x0,y0),b=groundAt(x1,y1);if(!a||!b)return;cam.tx+=a.x-b.x;cam.tz+=a.z-b.z;clampTarget();}
function endPtr(e){
  const p=ptrs.get(e.pointerId);if(!p)return;ptrs.delete(e.pointerId);
  if(ptrs.size===0){const wasDrag=drag&&drag.moved;drag=null;pinch=null;if(!wasDrag&&e.type==='pointerup'&&state==='play')tapAt(e.clientX,e.clientY,p.type);}
  else if(ptrs.size===1){pinch=null;drag={moved:true};}
}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!sel&&state==='play'){hover=null;clearGhost();}});
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.dT=THREE.MathUtils.clamp(cam.dT*(e.deltaY>0?1.12:.89),7,60);},{passive:false});
function hoverAt(x,y){
  if(!G||G.over)return;const c=cellAt(x,y);
  if(c&&canPlace(c[0],c[1])){if(!hover||hover[0]!==c[0]||hover[1]!==c[1]){hover=c;sel=c;showGhost(c[0],c[1]);refreshCands();}}
  else if(hover){hover=null;sel=null;clearGhost();refreshCands();}
}
function tapAt(x,y,type){
  if(!G||G.over||FSG.open)return;const c=cellAt(x,y);
  if(!c||!canPlace(c[0],c[1])){if(sel){setSel(null);}return;}
  if(type==='mouse'||(sel&&sel[0]===c[0]&&sel[1]===c[1])){place(c[0],c[1]);hover=null;}
  else{sfx('sel');setSel(c);}
}

// ---------- HUD ----------
const THUMB={},MTH={};
function makeThumbs(){
  const r2=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r2.setSize(128,128);r2.setPixelRatio(1);r2.outputEncoding=THREE.sRGBEncoding;r2.setClearColor(0,0);
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x667788,1));const dl=new THREE.DirectionalLight(0xffffff,.65);dl.position.set(-3,6,4);sc.add(dl);
  const cm=new THREE.PerspectiveCamera(26,1,.1,50);cm.position.set(0,4.4,4.6);cm.lookAt(0,.15,0);
  const rep={campo:[['building_grain',0,0,0,1]],floresta:[['trees_A_large',0,0,0,1]],vila:[['building_home_A',0,0,0,1],['barrel',.55,.1,0,1]],agua:[['waterlily_A',.25,.2,0,1],['waterplant_A',-.3,-.2,0,1]],montanha:[['mountain_A_grass_trees',0,0,0,1]]};
  TKEYS.forEach(t=>{const g=buildTileMesh(t,rep[t]);sc.add(g);r2.clear();r2.render(sc,cm);THUMB[t]=r2.domElement.toDataURL();sc.remove(g);});
  ['building_home_A','building_tavern','building_well','building_market','building_church','building_castle','building_windmill','building_lumbermill','building_mine','boat'].forEach(k=>{const t=k==='boat'?'agua':'vila';const g=buildTileMesh(t,[[k,0,0,k==='building_castle'?0:0,k==='building_castle'?.8:1]]);g.position.y=k==='building_castle'?-.4:0;sc.add(g);r2.clear();r2.render(sc,cm);MTH[k]=r2.domElement.toDataURL();sc.remove(g);});
  r2.dispose();try{r2.forceContextLoss();}catch(e){}
}
function renderTray(){
  const T=$('tray');let h='<button class="btn round" id="undo" title="Desfazer (Z)">↶<i id="undoN"></i></button>';
  if(G.mode==='free'){
    TKEYS.forEach(t=>{h+='<button class="tc'+(t===G.freeType?' sel':'')+'" data-t="'+t+'" title="'+TYPES[t].nome+'"><img src="'+THUMB[t]+'" alt="'+TYPES[t].nome+'"></button>';});
  }else{
    const q=G.queue;
    h+='<div class="tc cur" title="Peça atual"><img src="'+THUMB[q[0]]+'" alt=""><b>'+TYPES[q[0]].nome+'</b></div>';
    if(G.stack>1)h+='<div class="tc nx" title="Próxima"><img src="'+THUMB[q[1]]+'" alt=""></div>';
    if(G.stack>2)h+='<div class="tc nx" title="Depois"><img src="'+THUMB[q[2]]+'" alt=""></div>';
  }
  h+='<button class="btn round" id="ok" title="Colocar aqui" disabled>✓</button>';
  T.innerHTML=h;
  $('undo').onclick=()=>undo();$('ok').onclick=()=>{if(sel)place(sel[0],sel[1]);};$('ok').disabled=!sel;
  T.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{G.freeType=b.dataset.t;sfx('pick');renderTray();if(sel)showGhost(sel[0],sel[1]);});
  const u=$('undoN');u.textContent=G.undo===Infinity?'':G.undo;u.style.display=G.undo===Infinity?'none':'';$('undo').disabled=!G.hist.length||G.undo<=0;
}
function updateHud(){
  if(!G)return;$('score').textContent=fmt(G.score);
  $('stack').textContent=G.mode==='free'?'∞':Math.max(0,G.stack);
  $('pStack').style.background=G.mode!=='free'&&G.stack<=3?'rgba(200,70,50,.85)':'';
  $('season').textContent=SEASONS[G.season][1];
  renderTray();
}
function toast(m){if(state==='end')return;const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('show'),1900);}
const proj=new THREE.Vector3();
function toScreen(x,y,z){proj.set(x,y,z).project(C);return [(proj.x+1)/2*innerWidth,(1-proj.y)/2*innerHeight,proj.z<1];}
function popAt(x,y,z,txt,color){const [sx,sy]=toScreen(x,y,z);const d=document.createElement('div');d.className='pop';d.textContent=txt;if(color)d.style.color=color;d.style.left=sx+'px';d.style.top=sy+'px';$('labels').appendChild(d);setTimeout(()=>d.remove(),1000);}
function makeLabel(Q){
  const d=document.createElement('div');d.className='ql';d.id='q'+Q.id;d.innerHTML='<img src="'+THUMB[Q.t]+'" alt=""><span></span>';$('labels').appendChild(d);
}
function removeLabel(Q){const d=$('q'+Q.id);if(d)d.remove();}
function questDone(Q){
  const d=$('q'+Q.id);if(d){d.querySelector('span').textContent='✓ +'+Q.reward;d.classList.add('done');setTimeout(()=>d.remove(),900);}
  const c=G.tiles.get(key(Q.cell[0],Q.cell[1]));if(c)groupOf(c.q,c.r).forEach((t,i)=>setTimeout(()=>bounce(t),i*40));
  if(G.mode!=='free')toast('Missão cumprida! +'+Q.reward+' peças');
}
function bounce(t){tween(.35,k=>{t.g.position.y=Math.sin(k*Math.PI)*.25;},()=>t.g.position.y=0);}
const spGeo=new THREE.OctahedronGeometry(.09,0),spMat=new THREE.MeshBasicMaterial({color:0xfff2a0,transparent:true});
function sparkle(t){
  const x=hx(t.q,t.r),z=hz(t.r);
  for(let i=0;i<14;i++){const m=new THREE.Mesh(spGeo,spMat.clone());const a=i/14*6.28;m.position.set(x+Math.cos(a)*.8,.4,z+Math.sin(a)*.8);S.add(m);
    const vy=rnd(1.5,2.6);tween(.9,k=>{m.position.y=.4+vy*k-1.4*k*k;m.rotation.y+=.2;m.material.opacity=1-k;},()=>S.remove(m));}
}
function updateLabels(){
  if(!G)return;
  G.quests.forEach(Q=>{
    const d=$('q'+Q.id);if(!d)return;const grp=groupOf(Q.cell[0],Q.cell[1]);
    d.querySelector('span').textContent=grp.length+'/'+Q.target;
    const [sx,sy,vis]=toScreen(hx(Q.cell[0],Q.cell[1]),1.9,hz(Q.cell[1]));d.style.left=sx+'px';d.style.top=sy+'px';d.style.display=vis?'':'none';
  });
  const pv=$('labels').querySelector('.pv');
  if(pv&&ghost){const [sx,sy]=toScreen(+pv.dataset.x,1.7,+pv.dataset.z);pv.style.left=sx+'px';pv.style.top=sy+'px';}
}

// ---------- salvar / carregar partida ----------
function serialize(){
  return {mode:G.mode,score:G.score,stack:G.mode==='free'?-1:G.stack,queue:G.queue,undo:G.undo===Infinity?-1:G.undo,stats:G.stats,season:G.season,freeType:G.freeType,qid:G.qid,
    quests:G.quests.map(Q=>({id:Q.id,cell:Q.cell,t:Q.t,target:Q.target,reward:Q.reward,pts:Q.pts})),
    tiles:[...G.tiles.values()].map(t=>[t.q,t.r,t.t,t.deco,t.perf?1:0])};
}
function loadGame(s,keepView){
  clearBoard();
  G={mode:s.mode,score:s.score,stack:s.stack<0?Infinity:s.stack,queue:s.queue,tiles:new Map(),quests:[],undo:s.undo<0?Infinity:s.undo,hist:[],stats:s.stats,season:s.season||0,freeType:s.freeType||'campo',qid:s.qid||1,over:false};
  s.tiles.forEach(([q,r,t,deco,perf])=>{const tl=addTile(q,r,t,deco,false);tl.perf=!!perf;});
  s.quests.forEach(Q=>{G.quests.push(Object.assign({},Q));makeLabel(Q);});
  setSeason(G.season,false);
  if(!keepView)fitView(true);
}
function storeGame(){if(!G)return;save.last=G.over?null:serialize();persist();}

// ---------- telas ----------
function showScreen(id){
  ['menu','pause','end'].forEach(s=>$(s).classList.toggle('show',s===id));
  if(id)state=id;
  if(id==='menu'){$('hud').style.display='none';renderMenu();playMusic('menu');}
  requestAnimationFrame(fitBoxes);
}
function startPlay(){
  showScreen(null);state='play';$('hud').style.display='';$('tray').style.display='';$('viewBar').style.display='none';$('side').style.display='';
  $('pStack').style.display='';setSeason(G.season,false);updateHud();refreshCands();playMusic('game');
}
function renderMenu(){
  const has=save.last&&save.last.tiles&&save.last.tiles.length;
  $('bCont').style.display=has?'':'none';
  if(has)$('contInfo').textContent=(save.last.mode==='free'?'Modo livre · ':'')+save.last.tiles.length+' peças na ilha'+(save.last.mode==='free'?'':' · '+fmt(save.last.score)+' pontos');
  $('rec').textContent=save.best?'Recorde: '+fmt(save.best)+' pontos':'Encaixe as peças e monte o seu reino';
  fitBoxes();
}
function endGame(){
  const b=save.best;const novo=G.score>b;
  save.games++;if(novo)save.best=G.score;save.last=null;persist();
  if(window.HXCloud)try{HXCloud.submit(G.score,G.stats.placed);}catch(e){}
  $('endT').textContent='Ilha completa!';
  $('endMsg').textContent=novo?'Novo recorde! 🎉':(b?'Recorde: '+fmt(b)+' pontos':'');
  $('endS').innerHTML='<div><b>'+fmt(G.score)+'</b>pontos</div><div><b>'+G.tiles.size+'</b>peças na ilha</div><div><b>'+G.stats.quests+'</b>missões</div>';
  candGroup.clear();clearGhost();$('labels').innerHTML='';$('toast').classList.remove('show');clearTimeout(toast.h);sfx(novo?'record':'end');
  showScreen('end');state='end';
}
function fitBoxes(){
  ['menuBox','pauseBox','endBox'].forEach(id=>{
    const b=$(id);if(!b||!b.parentElement.classList.contains('show'))return;b.style.transform='none';
    const W=innerWidth,H=innerHeight,top=(id==='menuBox'&&H>W)?60:6;
    const k=Math.min(1,(W-12)/b.offsetWidth,(H-top-8)/b.offsetHeight);b.style.transform='translateY('+((top-6)/2)+'px) scale('+k+')';
  });
}
// ---------- como jogar, guia e tutorial ----------
const BLD={building_home_A:'Casa',building_tavern:'Taverna',building_well:'Poço',building_market:'Mercado',building_church:'Igreja',building_townhall:'Prefeitura',building_castle:'Castelo',building_windmill:'Moinho',building_lumbermill:'Serraria',building_mine:'Mina',boat:'Barco'};
const TDESC={
  campo:'Plantações de trigo. Um campo com 4 ou mais peças pode ganhar um moinho.',
  floresta:'Pinheiros e árvores. Perto de uma vila pode aparecer uma serraria.',
  vila:'Casas do seu povo. Quanto maior a vila, maiores as construções: taverna, mercado, igreja e até um castelo.',
  agua:'Lagos com vitórias-régias. Perto de uma vila aparecem barquinhos.',
  montanha:'Montanhas e colinas. Perto de uma vila pode surgir uma mina.'};
function howTo(done){
  FSG.slides({title:'Como jogar · Ilhas Hex',accent:'#35b56a',done,slides:[
    {img:THUMB.vila,t:'Monte o seu reino',x:'Cada rodada você recebe uma peça de terreno. Encaixe ao lado da ilha para ela crescer.'},
    {e:'👆',t:'Toque duas vezes',x:'Toque numa casa com contorno branco para ver a peça e os pontos. Toque de novo, ou no ✓, para colocar.'},
    {img:THUMB.floresta,t:'Junte terrenos iguais',x:'Cada vizinho do mesmo terreno vale <b>+2</b>. Vila combina com Campo e Água, e Floresta com Montanha (<b>+1</b>).'},
    {img:THUMB.campo,t:'Missões dão mais peças',x:'Um balão como <b>4/7</b> aparece sobre um grupo. Aumente o grupo até o número pedido e ganhe peças extras.'},
    {img:THUMB.montanha,t:'Perfeito e estações',x:'Peça toda cercada por vizinhos que combinam vale <b>+10</b>. A cada 150 pontos a estação muda.'},
    {img:THUMB.agua,t:'Até a última peça',x:'Quando a pilha de peças acaba, a ilha está completa. Bata o seu recorde! No Modo livre as peças são infinitas.'}]});
}
function openGuide(){
  const pct=t=>Math.round(TYPES[t].w/TKEYS.reduce((a,k)=>a+TYPES[k].w,0)*100)+'%';
  const terr=TKEYS.map(t=>({img:THUMB[t],n:TYPES[t].nome,sub:'Combina com: '+FRIENDS[t].map(f=>TYPES[f].nome).join(' e '),d:TDESC[t],
    st:[['Vizinho igual','+2 pontos'],['Vizinho que combina','+1 ponto'],['Chance de sair',pct(t)]]}));
  const bl=[
    ['building_home_A','Vila com 1 ou 2 peças','A primeira casa do reino.'],['building_tavern','Vila com 3 a 5 peças','Taverna, casas e às vezes um poço.'],
    ['building_well','Vila com 3 a 5 peças','Um poço por vila.'],['building_market','Vila com 6 a 9 peças','Mercado, igreja, prefeitura e estábulos.'],
    ['building_church','Vila com 6 a 9 peças','Aparece nas vilas grandes.'],['building_castle','Vila com 10 peças ou mais','Um castelo por vila: o orgulho do reino!'],
    ['building_windmill','Campo com 4 peças ou mais','Um moinho por campo, com fardos de feno.'],['building_lumbermill','Floresta ao lado de uma vila','Os lenhadores da vila trabalham ali.'],
    ['building_mine','Montanha ao lado de uma vila','Os mineiros abrem uma mina.'],['boat','Água ao lado de uma vila','Barquinhos de pesca.']
  ].map(([k,s,d])=>({img:MTH[k],n:BLD[k],sub:s,d}));
  const pts=[
    {e:'➕',n:'Vizinho igual',sub:'+2 por vizinho',d:'Cada peça vizinha do mesmo terreno vale 2 pontos. O número sobre a peça mostra o total antes de colocar.'},
    {e:'🤝',n:'Combinações',sub:'+1 por vizinho',d:'Vila combina com Campo e com Água. Floresta combina com Montanha.'},
    {img:THUMB.campo,n:'Missões',sub:'Peças extras',d:'Um balão com número aparece sobre uma peça (por exemplo <b>4/7</b>). Aumente aquele grupo até o número pedido: você ganha peças extras e pontos. Se o grupo ficar cercado sem espaço para crescer, a missão é perdida.',st:[['Peças ganhas','5 a 8'],['Pontos','5 por peça pedida'],['Missões ao mesmo tempo','até 3']]},
    {e:'✨',n:'Perfeito',sub:'+10 pontos',d:'Uma peça toda cercada (6 vizinhos), com pelo menos 4 iguais a ela e o resto combinando.'},
    {e:'🍂',n:'Estações',sub:'A cada 150 pontos',d:'Primavera, Verão, Outono e Inverno se repetem e mudam as cores da ilha. No Modo livre, toque no nome da estação para trocar.'},
    {e:'🧺',n:'Pilha de peças',sub:'Começa com 25',d:'Cada peça colocada sai da pilha. Missões devolvem peças. Quando a pilha acaba, a ilha está completa e o recorde é salvo.'}];
  const ctl=[
    {e:'👆',n:'Colocar peça',sub:'Toque duas vezes',d:'No celular: toque numa casa livre para ver a peça e toque de novo (ou no ✓). No PC: basta clicar, e passar o mouse mostra a prévia.'},
    {e:'✋',n:'Mover a câmera',sub:'Arrastar',d:'Arraste com um dedo (ou com o mouse) para andar pela ilha.'},
    {e:'🤏',n:'Zoom',sub:'Pinça ou roda do mouse',d:'Afaste ou aproxime dois dedos.'},
    {e:'⟳',n:'Girar',sub:'Botões ⟲ ⟳ ou Q/E',d:'Gira a visão em 60 graus.'},
    {e:'⌂',n:'Ver a ilha toda',sub:'Botão ⌂',d:'Enquadra a ilha inteira na tela.'},
    {e:'↶',n:'Desfazer',sub:'3 vezes por partida',d:'Volta a última jogada. No Modo livre é ilimitado. Tecla Z no PC.'}];
  FSG.guide({title:'📖 Guia · Ilhas Hex',accent:'#35b56a',tabs:[{name:'Terrenos',items:terr},{name:'Pontos e bônus',items:pts},{name:'Construções',items:bl},{name:'Controles',items:ctl}]});
}
function startTutorial(){
  const firstC=()=>{const c=[...candidates().values()];if(!c.length)return null;const t=curType();c.sort((a,b)=>scoreFor(t,b[0],b[1]).s-scoreFor(t,a[0],a[1]).s);return c[0];};
  const atCell=c=>{if(!c)return null;const [x,y,v]=toScreen(hx(c[0],c[1]),-.2,hz(c[1]));return v?[x,y]:null;};
  let tgt=null;
  FSG.coach({accent:'#35b56a',done:()=>{save.tut=1;persist();},steps:[
    {x:'Bem-vindo! Seu reino começa nesta ilhota. Vamos colocar as primeiras peças juntos.'},
    {el:'.tc.cur',x:'Esta é a <b>peça da vez</b>. As menores ao lado são as próximas.'},
    {enter:()=>{tgt=firstC();},at:()=>atCell(tgt),r:40,x:'Toque numa casa com <b>contorno branco</b> para ver a peça ali.',done:()=>!!sel},
    {at:()=>atCell(sel),r:40,x:'O número mostra os pontos que ela dá. Toque <b>de novo</b> na mesma casa (ou no ✓) para colocar.',done:()=>G.stats.placed>=1},
    {x:'Cada vizinho do <b>mesmo terreno</b> vale +2. Vila combina com Campo e Água, e Floresta com Montanha (+1).'},
    {enter:()=>{tgt=firstC();},at:()=>atCell(sel||tgt),r:40,x:'Agora coloque mais uma peça.',done:()=>G.stats.placed>=2},
    {el:()=>document.querySelector('.ql')||$('pStack'),x:'Apareceu uma <b>missão</b>! Aumente aquele grupo até o número pedido para ganhar peças extras.'},
    {el:'#pStack',x:'Cada peça usada sai da pilha. Quando ela acaba, a ilha está completa.'},
    {el:'#help',x:'Se tiver dúvida, toque no <b>?</b> para abrir o Guia com todos os terrenos e regras. Bom jogo!',btn:'Começar!'}]});
}


// ---------- botões ----------
function syncAudio(){document.querySelectorAll('.sndR').forEach(b=>{b.textContent=muted?'🔇':'🔊';b.classList.toggle('off',muted);});document.querySelectorAll('.musR').forEach(b=>b.classList.toggle('off',musicOff));}
function toggleSnd(){ac();muted=!muted;if(sfxGain)sfxGain.gain.value=muted?0:1;try{localStorage.setItem(SAVE_KEY+'_mute',muted?'1':'0');}catch(e){}syncAudio();sfx('click');}
function toggleMus(){ac();musicOff=!musicOff;if(musGain)musGain.gain.value=musicOff?0:1;try{localStorage.setItem(SAVE_KEY+'_music',musicOff?'0':'1');}catch(e){}syncAudio();}
document.querySelectorAll('.sndR').forEach(b=>b.onclick=toggleSnd);
document.querySelectorAll('.musR').forEach(b=>b.onclick=toggleMus);
const go=f=>()=>{ac();sfx('click');f();};
$('bNew').onclick=go(()=>newGame('classic'));
$('bFree').onclick=go(()=>newGame('free'));
$('bCont').onclick=go(()=>{loadGame(save.last);startPlay();});
$('bHelp').onclick=go(()=>howTo());
$('bGuide').onclick=go(()=>openGuide());
$('help').onclick=go(()=>openGuide());
$('pGuide').onclick=go(()=>openGuide());
$('pHow').onclick=go(()=>howTo());
FSG.onClick=()=>sfx('click');
$('pau').onclick=go(()=>{if(state==='view'){showScreen('menu');return;}showScreen('pause');});
$('resume').onclick=go(()=>{showScreen(null);state='play';});
$('restart').onclick=go(()=>newGame(G&&G.mode==='free'?'free':'classic'));
$('quit').onclick=go(()=>{storeGame();showScreen('menu');});
$('again').onclick=go(()=>newGame('classic'));
$('tomenu').onclick=go(()=>showScreen('menu'));
$('look').onclick=go(()=>{showScreen(null);state='view';$('tray').style.display='none';$('viewBar').style.display='flex';fitView();});
$('vAgain').onclick=go(()=>newGame('classic'));
$('vMenu').onclick=go(()=>showScreen('menu'));
$('rotL').onclick=go(()=>{cam.yawT-=Math.PI/3;});
$('rotR').onclick=go(()=>{cam.yawT+=Math.PI/3;});
$('fit').onclick=go(()=>fitView());
$('pSeason').onclick=()=>{if(G&&G.mode==='free'){G.season=(G.season+1)%4;setSeason(G.season,true);storeGame();}};
window.addEventListener('keydown',e=>{
  if(state!=='play'||FSG.open)return;const k=e.key.toLowerCase();
  if(k==='q')cam.yawT-=Math.PI/3;else if(k==='e')cam.yawT+=Math.PI/3;else if(k==='z')undo();
  else if((k==='enter'||k===' ')&&sel)place(sel[0],sel[1]);
  else if(k==='escape')showScreen('pause');
  else if(G.mode==='free'&&/^[1-5]$/.test(k)){G.freeType=TKEYS[+k-1];renderTray();if(sel)showGhost(sel[0],sel[1]);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){storeGame();if(state==='play')showScreen('pause');if(AC)AC.suspend();}else if(AC)AC.resume();});

// ---------- laço ----------
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h);C.aspect=w/h;C.fov=w<h?50:40;C.updateProjectionMatrix();fitBoxes();}
window.addEventListener('resize',()=>{resize();});
window.addEventListener('orientationchange',()=>setTimeout(()=>{resize();if(G)fitView();},300));
let last=performance.now(),T0=0;
function frame(now){
  requestAnimationFrame(frame);
  if(window.__manual)return;
  const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);
}
function step(dt){
  T0+=dt;
  for(let i=anims.length-1;i>=0;i--){const a=anims[i];a.t+=dt;const k=Math.min(1,a.t/a.dur);a.fn(k);if(k>=1){anims.splice(i,1);if(a.done)a.done();}}
  if(ghost)ghost.position.y=.3+Math.sin(T0*3)*.08;
  clouds.forEach(c=>{c.position.x+=c.userData.v*dt;if(c.position.x>cam.tx+40)c.position.x=cam.tx-40;});
  if(state==='menu'){cam.yawT+=dt*.08;}
  updateCam(dt);updateLabels();R.render(S,C);
}

// ---------- início ----------
Promise.all([loadModels(),texP]).then(()=>{
  makeThumbs();
  for(let i=0;i<7;i++){const c=M(i%2?'cloud_small':'cloud_big');c.position.set(rnd(-40,40),rnd(6,9),rnd(-25,25));c.scale.setScalar(rnd(.8,1.4));c.userData.v=rnd(.4,.9);c.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;}});S.add(c);clouds.push(c);}
  resize();syncAudio();
  // ilha de fundo do menu
  if(save.last&&save.last.tiles&&save.last.tiles.length)loadGame(save.last);
  else{G={mode:'free',tiles:new Map(),quests:[],queue:['campo'],stats:{placed:0,quests:0,perfects:0},season:0,hist:[],undo:0,score:0,stack:0,freeType:'campo',qid:1,over:true};demoIsland();}
  fitView(true);cam.dT*=.9;cam.d=cam.dT;updateShadowCam();
  $('load').style.display='none';showScreen('menu');
  requestAnimationFrame(frame);
  window.dispatchEvent(new Event('hx-ready'));window.done=1;
});
function demoIsland(){
  const L=[[0,0,'vila'],[1,0,'vila'],[0,1,'vila'],[-1,1,'campo'],[1,-1,'campo'],[2,-1,'campo'],[-1,0,'floresta'],[-2,1,'floresta'],[-1,2,'floresta'],[2,0,'agua'],[1,1,'agua'],[0,2,'agua'],[0,-1,'montanha'],[-1,-1,'montanha'],[-2,2,'floresta'],[2,-2,'campo'],[3,-1,'agua']];
  L.forEach(([q,r,t])=>addTile(q,r,t,null,false));
}

window.HX={get save(){return save},merge:o=>{let ch=false;if(o&&o.best>save.best){save.best=o.best;ch=true;}if(o&&o.games>save.games){save.games=o.games;ch=true;}if(ch){persist();if(state==='menu')renderMenu();}},refresh:()=>{if(state==='menu')renderMenu();}};
window.__hx={get G(){return G},get state(){return state},newGame,place,undo,candidates,scoreFor,step,showScreen,fitView,cam,R,setSeason,get sel(){return sel},setSel,toScreen,cellAt,tapAt,hx,hz};
