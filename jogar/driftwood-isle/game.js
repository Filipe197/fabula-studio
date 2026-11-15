/* =====================================================================
   DRIFTWOOD ISLE v0.1 — Fabula Studio
   Sobrevivência fofinha numa ilha (Three.js r128, PC + Android)
   Modelos CC0: Quaternius (Survival Pack, Stylized Nature, Animals),
   Kenney (Survival Kit), KayKit (Adventurers + animações)
   ===================================================================== */
(function(){
'use strict';
const V3=THREE.Vector3, $=id=>document.getElementById(id);
const DEV=/[?&]dev/.test(location.search)?10:1;
const SAVE_KEY='driftwood_v01';
const R_ISLAND=58, LAKE={x:-14,z:-6,r:8};
const DAY_LEN=420/DEV;                       // segundos por dia completo
const TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
document.body.classList.add(TOUCH?'touch':'pc');
if(TOUCH)$('keys').textContent='Arraste no lado esquerdo para andar · botão laranja para agir';

/* ---------------- itens e receitas ---------------- */
const ITEMS={
  galho:{n:'Galho',e:'🪵'}, pedra:{n:'Pedra',e:'🪨'}, madeira:{n:'Madeira',e:'🌲'}, fibra:{n:'Fibra',e:'🌾'},
  corda:{n:'Corda',e:'🧵'}, tabua:{n:'Tábua',e:'🟫'}, remo:{n:'Remo',e:'🛶'},
  baga:{n:'Bagas',e:'🫐',food:{f:10,s:4}}, cogumelo:{n:'Cogumelo',e:'🍄',food:{f:14}},
  carne:{n:'Carne crua',e:'🥩',food:{f:8,v:-6}}, assada:{n:'Carne assada',e:'🍖',food:{f:35,v:8}},
  bandagem:{n:'Bandagem',e:'🩹',food:{v:20}}, kit:{n:'Kit de socorro',e:'🧰',food:{v:50}},
  tocha:{n:'Tocha',e:'🔥'}
};
const TOOLS={axe:{n:'Machado',e:'🪓',dmg:2,chop:1},axe2:{n:'Machado de ferro',e:'🪓',dmg:3,chop:2},pick:{n:'Picareta',e:'⛏️',mine:1},cantil:{n:'Cantil',e:'🧴'},fosforo:{n:'Fósforos',e:'📦'},bussola:{n:'Bússola',e:'🧭'}};
const RECIPES=[
  {id:'axe',tab:'ferr',n:'Machado',e:'🪓',d:'Corta árvores e ajuda a se defender',cost:{galho:3,pedra:2},tool:'axe'},
  {id:'pick',tab:'ferr',n:'Picareta',e:'⛏️',d:'Quebra as rochas grandes',cost:{galho:3,pedra:3},tool:'pick'},
  {id:'corda',tab:'ferr',n:'Corda',e:'🧵',d:'Feita com fibras de capim',cost:{fibra:3},give:'corda'},
  {id:'tocha',tab:'ferr',n:'Tocha',e:'🔥',d:'Ilumina a noite por um tempo (use na mochila)',cost:{galho:1,fibra:2},give:'tocha'},
  {id:'bandagem',tab:'ferr',n:'Bandagem',e:'🩹',d:'Recupera 20 de vida',cost:{fibra:2,corda:1},give:'bandagem'},
  {id:'fire',tab:'const',n:'Fogueira',e:'🔥',d:'Luz, calor e cozinha. Os lobos têm medo do fogo',cost:{madeira:4,pedra:3},build:'fire',needTool:'fosforo'},
  {id:'bench',tab:'const',n:'Bancada',e:'🛠️',d:'Libera tábuas, ferramentas melhores e a barraca',cost:{madeira:6,pedra:4},build:'bench'},
  {id:'tabua',tab:'banc',n:'Tábua',e:'🟫',d:'Perto da bancada',cost:{madeira:2},give:'tabua',near:'bench'},
  {id:'axe2',tab:'banc',n:'Machado de ferro',e:'🪓',d:'Corta 2x mais rápido e bate mais forte',cost:{madeira:2,pedra:5,corda:2},tool:'axe2',near:'bench'},
  {id:'remo',tab:'banc',n:'Remo',e:'🛶',d:'Para o bote',cost:{tabua:2,corda:1},give:'remo',near:'bench'},
  {id:'tent',tab:'banc',n:'Barraca',e:'⛺',d:'Dormir pula a noite e vira seu ponto de volta',cost:{madeira:6,corda:4,fibra:4},build:'tent',near:'bench'}
];
const RAFT_COST={tabua:6,corda:5,remo:1};
const GOALS=[
  {t:'Abra a mochila do naufrágio',ok:S=>S.flags.bag},
  {t:'Junte 3 galhos e 2 pedras',s:'Pegue do chão perto da praia',ok:S=>S.tools.axe||(have('galho')>=3&&have('pedra')>=2)},
  {t:'Crie um machado',s:'Botão 🛠️ (ou tecla C)',ok:S=>S.tools.axe},
  {t:'Corte uma árvore',ok:S=>S.stats.chop>0},
  {t:'Construa uma fogueira',s:'Antes da noite! Os lobos têm medo do fogo',ok:S=>S.builds.some(b=>b.t==='fire')},
  {t:'Construa uma bancada',ok:S=>S.builds.some(b=>b.t==='bench')},
  {t:'Encontre o bote salva-vidas',s:'Dizem que ele foi parar na praia do norte',ok:S=>S.flags.raftSeen},
  {t:'Conserte o bote e fuja!',s:'6 tábuas · 5 cordas · 1 remo',ok:S=>S.won}
];

/* ---------------- estado ---------------- */
function fresh(){return{v:1,p:null,vida:100,fome:100,sede:100,inv:{},tools:{},builds:[],time:0.04,day:1,nodes:{},flags:{},stats:{chop:0,mine:0,kills:0},won:false,cantil:0,torch:0};}
let S=load();
function load(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(d&&d.v===1)return Object.assign(fresh(),d);}catch(e){}return fresh();}
let saveT=0;function save(){try{S.p={x:player.position.x,z:player.position.z};localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
const have=id=>S.inv[id]||0;
function add(id,n){S.inv[id]=have(id)+n;if(S.inv[id]<=0)delete S.inv[id];bagDirty=true;}
const hasAll=c=>Object.keys(c).every(k=>have(k)>=c[k]);
function pay(c){for(const k in c)add(k,-c[k]);}

/* ---------------- render ---------------- */
const renderer=new THREE.WebGLRenderer({antialias:!TOUCH,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,TOUCH?1.5:2));renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x9fd6ff,40,120);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.3,400);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
const hemi=new THREE.HemisphereLight(0xfff1d6,0x4a7a3a,0.65);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d0,1.4);sun.castShadow=true;sun.shadow.mapSize.set(TOUCH?1024:2048,TOUCH?1024:2048);
Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:90});sun.shadow.bias=-0.0006;scene.add(sun,sun.target);

/* ---------------- terreno ---------------- */
const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function hsh(a,b){const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);}
function vn(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  return lerp(lerp(hsh(xi,zi),hsh(xi+1,zi),u),lerp(hsh(xi,zi+1),hsh(xi+1,zi+1),u),v);}
const fbm=(x,z)=>vn(x*.035,z*.035)*.6+vn(x*.09+7,z*.09+3)*.3+vn(x*.22,z*.22)*.1;
function H(x,z){
  const r=Math.hypot(x,z)/R_ISLAND+(fbm(x+100,z-40)-.5)*.32;
  const land=1-smooth(.74,1.0,r);
  let h=land*(.7+fbm(x,z)*2.6+smooth(.2,-.6,z/R_ISLAND)*1.2)+(1-land)*-2.4;
  const dl=Math.hypot(x-LAKE.x,z-LAKE.z)/LAKE.r;
  if(dl<1.5)h=lerp(-1.1,h,smooth(.6,1.45,dl));
  return h;
}
const isLake=(x,z)=>Math.hypot(x-LAKE.x,z-LAKE.z)<LAKE.r*1.25;
function buildTerrain(){
  const N=TOUCH?150:200,SZ=R_ISLAND*2.7,g=new THREE.PlaneGeometry(SZ,SZ,N,N);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,col=[],c=new THREE.Color();
  const sand=new THREE.Color('#E3C88A'),wet=new THREE.Color('#BFA06A'),g1=new THREE.Color('#5BAA3A'),g2=new THREE.Color('#47963A'),g3=new THREE.Color('#3B7F33'),dirt=new THREE.Color('#8A6A42');
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=H(x,z);p.setY(i,h);
    if(h<.15)c.copy(wet);else if(h<.65)c.copy(sand).lerp(g1,smooth(.45,.65,h));
    else{c.copy(g1).lerp(g2,clamp(fbm(x*2,z*2)*1.6-.3,0,1));if(h>2.6)c.lerp(g3,smooth(2.6,3.6,h));if(vn(x*.3,z*.3)>.82)c.lerp(dirt,.35);}
    c.convertSRGBToLinear();col.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:false}));m.receiveShadow=true;scene.add(m);
  // água com ondinhas
  const wg=new THREE.PlaneGeometry(500,500,1,1);wg.rotateX(-Math.PI/2);
  const wm=new THREE.MeshStandardMaterial({color:0x1678b0,roughness:.35,metalness:0,transparent:true,opacity:.92});
  const water=new THREE.Mesh(wg,wm);water.position.y=-.05;scene.add(water);
  return{water,wm};
}
const TER=buildTerrain();

/* ---------------- modelos ---------------- */
const manager=new THREE.LoadingManager();const loader=new THREE.GLTFLoader(manager);
function b64(b){const s=atob(b),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a.buffer;}
const GL={};
function parse(n){return new Promise(r=>{if(!MODELS[n])return r(null);loader.parse(b64(MODELS[n]),'',g=>r(g),e=>{console.warn(n,e);r(null);});});}
function skClone(src){const sl=new Map(),cl=new Map(),c=src.clone(true);
  (function par(a,b){sl.set(b,a);cl.set(a,b);for(let i=0;i<a.children.length;i++)par(a.children[i],b.children[i]);})(src,c);
  c.traverse(n=>{if(!n.isSkinnedMesh)return;const sm=sl.get(n);n.skeleton=sm.skeleton.clone();n.bindMatrix.copy(sm.bindMatrix);n.skeleton.bones=sm.skeleton.bones.map(b=>cl.get(b));n.bind(n.skeleton,n.bindMatrix);});
  return c;}
function fixMat(o,shadow){o.traverse(m=>{if(m.isMesh){if(m.isSkinnedMesh)m.frustumCulled=false;m.castShadow=shadow!==false;m.receiveShadow=true;(Array.isArray(m.material)?m.material:[m.material]).forEach(mt=>{if('metalness' in mt)mt.metalness=0;if(mt.map)mt.map.anisotropy=2;});}});}
/* instancia normalizada: base no chão, centralizada, tamanho pedido */
function make(n,size,mode,shadow){
  const g=GL[n];if(!g)return new THREE.Group();
  let skinned=false;g.scene.traverse(o=>{if(o.isSkinnedMesh)skinned=true;});
  const src=skinned?skClone(g.scene):g.scene.clone(true);
  fixMat(src,shadow);
  const box=new THREE.Box3().setFromObject(src),s=box.getSize(new V3()),c=box.getCenter(new V3());
  const ref=mode==='h'?s.y:mode==='xz'?Math.max(s.x,s.z):Math.max(s.x,s.y,s.z);
  src.position.set(-c.x,-box.min.y,-c.z);
  const inner=new THREE.Group();inner.add(src);inner.scale.setScalar(size/(ref||1));
  const o=new THREE.Group();o.add(inner);o.userData.src=src;return o;
}
function place(o,x,z,ry){o.position.set(x,Math.max(H(x,z),-.2),z);o.rotation.y=ry||0;scene.add(o);return o;}

/* ---------------- som (sintetizado) ---------------- */
let AC=null;
function au(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function tone(f,d,type,v,slide){const a=au();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,a.currentTime);
  if(slide)o.frequency.exponentialRampToValueAtTime(slide,a.currentTime+d);g.gain.setValueAtTime(v||.15,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d);}
function noise(d,v,f){const a=au();if(!a)return;const b=a.createBuffer(1,a.sampleRate*d,a.sampleRate),ch=b.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*(1-i/ch.length);
  const s=a.createBufferSource(),g=a.createGain(),fl=a.createBiquadFilter();fl.type='lowpass';fl.frequency.value=f||1200;s.buffer=b;g.gain.value=v||.25;s.connect(fl);fl.connect(g);g.connect(a.destination);s.start();}
const SND={chop:()=>{noise(.12,.35,900);tone(140,.12,'triangle',.18,90);},rock:()=>{noise(.1,.3,2500);tone(420,.08,'square',.06,300);},
  pick:()=>tone(660,.12,'sine',.12,990),craft:()=>{tone(523,.1,'triangle',.12);setTimeout(()=>tone(784,.15,'triangle',.12),90);},
  eat:()=>{noise(.08,.2,700);setTimeout(()=>noise(.08,.2,700),110);},drink:()=>tone(300,.25,'sine',.12,700),
  hurt:()=>tone(220,.25,'sawtooth',.12,90),hit:()=>{noise(.08,.3,1500);tone(200,.1,'square',.08,120);},
  howl:()=>{tone(380,1.6,'sine',.07,620);setTimeout(()=>tone(600,1.2,'sine',.05,420),900);},no:()=>tone(160,.15,'square',.06),
  win:()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.3,'triangle',.14),i*140))};

/* ---------------- mundo ---------------- */
let seed=20261115;const rnd=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const nodes=[];const colliders=[];
const SPAWN=(()=>{let z=R_ISLAND*.3;while(H(0,z+1)>.5&&z<R_ISLAND*1.2)z+=1;return{x:0,z:z-3};})();
const RAFT_POS=(()=>{let z=-R_ISLAND*.3;while(H(6,z-1)>.3&&z>-R_ISLAND*1.2)z-=1;return{x:6,z:z+.5};})();
function freeSpot(minH,maxH,avoid){for(let k=0;k<60;k++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*R_ISLAND*1.02,x=Math.cos(a)*r,z=Math.sin(a)*r,h=H(x,z);
  if(h<minH||h>maxH)continue;if(isLake(x,z)&&minH>0)continue;if(Math.hypot(x-SPAWN.x,z-SPAWN.z)<(avoid||7))continue;if(Math.hypot(x-RAFT_POS.x,z-RAFT_POS.z)<6)continue;
  if(colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+1.2))continue;return{x,z};}return null;}
function addNode(type,model,size,mode,x,z,extra){
  const o=place(make(model,size,mode,extra&&extra.noShadow?false:true),x,z,rnd()*Math.PI*2);
  const nd=Object.assign({id:type+nodes.length,type,obj:o,x,z,hp:0,maxhp:0},extra||{});
  nodes.push(nd);if(nd.col)colliders.push({x,z,r:nd.col,node:nd});return nd;}
const DEF={
  tree:{label:'Cortar árvore',ic:'🪓',hp:3,needs:'axe',give:{madeira:3},bonus:{galho:1},regrow:300},
  rock:{label:'Quebrar rocha',ic:'⛏️',hp:5,needs:'pick',give:{pedra:4},regrow:360},
  stick:{label:'Pegar galho',ic:'✋',give:{galho:1},regrow:150},
  stone:{label:'Pegar pedra',ic:'✋',give:{pedra:1},regrow:150},
  grass:{label:'Arrancar capim',ic:'✋',give:{fibra:1},regrow:110},
  bush:{label:'Colher bagas',ic:'🫐',give:{baga:3},regrow:200},
  shroom:{label:'Pegar cogumelo',ic:'🍄',give:{cogumelo:1},regrow:240},
  kit:{label:'Pegar kit de socorro',ic:'🧰',give:{kit:1},regrow:0},
  compass:{label:'Pegar bússola',ic:'🧭',tool:'bussola',regrow:0},
  bag:{label:'Abrir a mochila',ic:'🎒',regrow:0},
  raft:{label:'Consertar o bote',ic:'🛶',regrow:0}
};
async function buildWorld(){
  const TREES=['t1','t2','t3','t4','t6','t7'],PINES=['t5','t5','t4'];
  for(let i=0;i<(TOUCH?80:105);i++){const s=freeSpot(.8,9,9);if(!s)continue;const pine=s.z<-8?rnd()<.65:rnd()<.2;
    addNode('tree',pine?PINES[Math.floor(rnd()*3)]:TREES[Math.floor(rnd()*6)],4.2+rnd()*2.2,'h',s.x,s.z,{col:.55,hp:3,maxhp:3});}
  for(let i=0;i<26;i++){const s=freeSpot(.5,9,10);if(!s)continue;const sz=1.5+rnd()*.9;addNode('rock',['r1','r3','r5'][i%3],sz,'',s.x,s.z,{col:sz*.45,hp:5,maxhp:5});}
  for(let i=0;i<46;i++){const s=freeSpot(.3,9,3);if(s)addNode('stick','q_woodlog',.9,'',s.x,s.z,{noShadow:true});}
  for(let i=0;i<40;i++){const s=freeSpot(.25,9,3);if(s)addNode('stone','r2',.42,'',s.x,s.z,{noShadow:true});}
  for(let i=0;i<50;i++){const s=freeSpot(.7,9,4);if(s)addNode('grass','g3',.9,'h',s.x,s.z,{noShadow:true});}
  for(let i=0;i<20;i++){const s=freeSpot(.8,9,8);if(!s)continue;const nd=addNode('bush','b2',1.5,'',s.x,s.z,{col:.5});
    const br=new THREE.Group();for(let k=0;k<6;k++){const b=make('berry',.2,'',false);const a=k*1.05,r=.45+(k%2)*.2;b.position.set(Math.cos(a)*r,.55+(k%3)*.28,Math.sin(a)*r);br.add(b);}
    nd.obj.add(br);nd.berries=br;}
  for(let i=0;i<22;i++){const s=freeSpot(.8,9,6);if(s)addNode('shroom','mush',.55,'',s.x,s.z,{noShadow:true});}
  // decoração sem interação
  const DEC=[['g1',.6,'h',170],['g2',.7,'h',120],['b1',1.2,'',30],['b3',1.3,'',26],['r2',.7,'',18],['tbare',3.2,'h',6]];
  for(const [m,sz,mode,n] of DEC){const list=[];for(let i=0;i<(TOUCH?Math.ceil(n*.7):n);i++){const s=freeSpot(.55,9,2);if(s)list.push([s.x,s.z,rnd()*6.3,sz*(.8+rnd()*.5)]);}instDecor(m,mode,list);}
  // naufrágio na praia sul
  place(make('q_woodlog',1.6),SPAWN.x-2.4,SPAWN.z+1.2,.6);place(make('q_woodlog',1.2),SPAWN.x+2.4,SPAWN.z+1.4,2.1);place(make('rope',.5),SPAWN.x-1.2,SPAWN.z+2.4,.3);place(make('q_can_red',.35),SPAWN.x+1.2,SPAWN.z+2.6,0);
  addNode('bag','q_backpack',.85,'',SPAWN.x+1.0,SPAWN.z-1.4);
  // itens escondidos
  for(const p of [[-30,8],[24,-14],[-6,-34]]){const s=nearLand(p[0],p[1]);addNode('kit','q_firstaidkit',.55,'',s.x,s.z);}
  {const s=nearLand(-22,-24);addNode('compass','q_compass_open',.45,'',s.x,s.z);place(make('q_tent',2.4),s.x+1.8,s.z-1.2,2.2);place(make('q_bonfire',1.1),s.x-1.4,s.z+.6,0);}
  // o bote salva-vidas furado no norte
  const rf=addNode('raft','q_raft',3.2,'xz',RAFT_POS.x,RAFT_POS.z,{col:1.4});rf.obj.rotation.set(0,.4,.12);place(make('q_raft_paddle',1.6),RAFT_POS.x+2,RAFT_POS.z+.6,.9).rotation.z=1.4;
  // estado salvo dos recursos
  const now=Date.now();
  for(const nd of nodes){const t=S.nodes[nd.id];if(t!==undefined&&(t===0||t>now))setGone(nd,true);}
  for(const b of S.builds)spawnBuild(b,true);
}
/* decoração em InstancedMesh: centenas de plantas em poucas chamadas de desenho */
function instDecor(name,mode,list){
  if(!list.length||!GL[name])return;
  const base=make(name,1,mode,false);base.updateMatrixWorld(true);
  const meshes=[];base.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const M=new THREE.Matrix4(),P=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new V3(),pos=new V3();
  for(const me of meshes){
    const im=new THREE.InstancedMesh(me.geometry,me.material,list.length);im.receiveShadow=true;im.castShadow=false;
    list.forEach((it,k)=>{pos.set(it[0],Math.max(H(it[0],it[1]),-.2),it[1]);q.setFromAxisAngle(new V3(0,1,0),it[2]);sc.setScalar(it[3]);
      P.compose(pos,q,sc);M.multiplyMatrices(P,me.matrixWorld);im.setMatrixAt(k,M);});
    im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;scene.add(im);}
}
function nearLand(x,z){for(let r=0;r<20;r+=1)for(let a=0;a<6.3;a+=.7){const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(H(px,pz)>.9&&!isLake(px,pz)&&!colliders.some(c=>Math.hypot(c.x-px,c.z-pz)<c.r+1))return{x:px,z:pz};}return{x,z};}
function setGone(nd,gone){nd.gone=gone;if(nd.type==='bush'){nd.berries.visible=!gone;return;}nd.obj.visible=!gone;
  const c=colliders.find(c=>c.node===nd);if(c)c.off=gone;}

/* ---------------- construções ---------------- */
const builds=[];
function spawnBuild(b,silent){
  let o;
  if(b.t==='fire'){o=new THREE.Group();const logs=make('q_bonfire',1.2);const fl=make('q_bonfire_fire',1.25,'',false);o.add(logs,fl);
    fl.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.emissive=new THREE.Color(0xff7a20);m.material.emissiveIntensity=1.2;}});
    const L=new THREE.PointLight(0xffa04a,2.2,14,1.6);L.position.y=1.3;o.add(L);o.userData.light=L;o.userData.flame=fl;
  }
  else if(b.t==='bench'){o=new THREE.Group();const tb=make('table',1.9,'xz');o.add(tb);const top=new THREE.Box3().setFromObject(tb).max.y;
    for(const [m,sz,x,z,ry] of [['saw',.7,-.45,.1,.3],['hammer',.45,.4,-.15,1.2],['handplane',.35,.35,.25,2.4],['rope',.4,-.1,-.3,0]]){const t=make(m,sz,'xz');t.position.set(x,top,z);t.rotation.y=ry;o.add(t);}}
  else if(b.t==='tent')o=make('q_tent',3.0);
  place(o,b.x,b.z,b.ry||0);
  const bd={...b,obj:o};builds.push(bd);colliders.push({x:b.x,z:b.z,r:b.t==='tent'?1.3:.9,build:bd});
  if(!silent){for(let i=0;i<8;i++)puff(b.x,H(b.x,b.z)+.5,b.z);}
  return bd;
}
function nearBuild(t,r){return builds.find(b=>b.t===t&&Math.hypot(b.x-player.position.x,b.z-player.position.z)<(r||5));}

/* ---------------- jogador ---------------- */
let player,pMixer,pActs={},pAct=null,toolMesh={};
const P={vy:0,face:0,busy:0,anim:'idle',speed:0,hurtT:0,dead:false};
async function buildPlayer(){
  player=make('ranger',1.7,'h');
  const src=player.userData.src;pMixer=new THREE.AnimationMixer(src);
  const clips=[...(GL.rig_general.animations||[]),...(GL.rig_move.animations||[]),...(GL.rig_tools.animations||[]),...(GL.rig_melee.animations||[])];
  const pick=n=>clips.find(c=>c.name===n);
  const map={idle:'Idle_A',walk:'Walking_A',run:'Running_A',chop:'Chop',mine:'Pickaxe',take:'PickUp',hit:'Melee_1H_Attack_Chop',hurt:'Hit_A',die:'Death_A',use:'Use_Item'};
  for(const k in map){const c=pick(map[k]);if(c){pActs[k]=pMixer.clipAction(c);if(!['idle','walk','run'].includes(k)){pActs[k].setLoop(THREE.LoopOnce);pActs[k].clampWhenFinished=k==='die';}}}
  // ferramenta na mão
  let hand=null;src.traverse(o=>{if(o.name==='handslot.r')hand=o;});
  if(hand){for(const [k,m] of [['axe','q_axe_small'],['axe2','q_axe'],['pick','pickaxe'],['tocha','q_woodentorch_fire']]){
    const t=make(m,1,'',true);t.visible=false;hand.add(t);toolMesh[k]=t;}}
  const p0=S.p||SPAWN;place(player,p0.x,p0.z,Math.PI);P.face=Math.PI;
  play('idle');
  // luz da tocha
  P.torch=new THREE.PointLight(0xffb25a,0,11,1.4);P.torch.position.set(0,2.2,0);player.add(P.torch);
}
function fitTools(){ // ajusta escala das ferramentas ao tamanho do personagem
  player.updateMatrixWorld(true);
  for(const k in toolMesh){const t=toolMesh[k],ws=new V3();t.parent.getWorldScale(ws);const want=k==='pick'?.75:k==='tocha'?.8:.7;
    t.scale.setScalar(want/ws.x);t.rotation.set(Math.PI/2,0,0);t.position.set(0,-.1/ws.x,0);
    t.children[0].position.set(0,-want*.35/ws.x,0);}
}
function play(k,fade){const a=pActs[k];if(!a||pAct===a)return;a.reset();a.fadeIn(fade||.15);if(pAct)pAct.fadeOut(fade||.15);a.play();pAct=a;P.anim=k;}
function playOnce(k,dur){const a=pActs[k];if(!a)return;if(pAct&&pAct!==a)pAct.fadeOut(.1);a.reset();a.setEffectiveTimeScale(dur?a.getClip().duration/dur:1);a.fadeIn(.08).play();pAct=a;P.anim=k;}
function showTool(k){for(const t in toolMesh)toolMesh[t].visible=t===k;}
function heldTool(){if(S.torch>0)return'tocha';return S.tools.axe2?'axe2':S.tools.axe?'axe':null;}

/* ---------------- animais ---------------- */
const animals=[];
function spawnAnimal(kind,x,z){
  const o=make(kind,kind==='wolf'?1.15:1.7,'h');place(o,x,z,rnd()*6.3);
  const src=o.userData.src,mx=new THREE.AnimationMixer(src),acts={};
  for(const c of GL[kind].animations)acts[c.name]=mx.clipAction(c);
  ['Attack','Death','Idle_HitReact1'].forEach(n=>{if(acts[n]){acts[n].setLoop(THREE.LoopOnce);acts[n].clampWhenFinished=n==='Death';}});
  const a={kind,obj:o,mx,acts,cur:null,hp:kind==='wolf'?6:3,maxhp:kind==='wolf'?6:3,st:'wander',t:0,tx:x,tz:z,atk:0,dead:0};
  aPlay(a,'Idle');animals.push(a);return a;
}
function aPlay(a,n){const ac=a.acts[n];if(!ac||a.cur===ac)return;ac.reset().fadeIn(.2).play();if(a.cur)a.cur.fadeOut(.2);a.cur=ac;}

/* ---------------- câmera e controles ---------------- */
let camYaw=0,camDist=TOUCH?9:10;const keys={};
addEventListener('keydown',e=>{if(window.FSG&&FSG.open)return;if(e.repeat&&e.code!=='KeyE'&&e.code!=='Space')return;keys[e.code]=true;au();
  if(e.code==='KeyC'||e.code==='Tab'){e.preventDefault();panel?closePanel():openCraft();}
  if(e.code==='Escape')closePanel();
  if(/^Digit[1-9]$/.test(e.code)){const it=bagFood()[+e.code.slice(5)-1];if(it)useItem(it);}});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('wheel',e=>{camDist=clamp(camDist+e.deltaY*.01,7,18);},{passive:true});
let dragX=null;
renderer.domElement.addEventListener('mousedown',e=>{dragX=e.clientX;});
addEventListener('mouseup',()=>dragX=null);
addEventListener('mousemove',e=>{if(dragX!==null){camYaw-=(e.clientX-dragX)*.006;dragX=e.clientX;}});
// joystick
const joy={id:null,x:0,y:0,dx:0,dy:0};const jEl=$('joy'),jKnob=jEl.querySelector('b');
renderer.domElement.addEventListener('touchstart',e=>{au();for(const t of e.changedTouches){
  if(t.clientX<innerWidth*.5&&joy.id===null){joy.id=t.identifier;joy.x=t.clientX;joy.y=t.clientY;jEl.style.left=joy.x+'px';jEl.style.top=joy.y+'px';jEl.style.display='block';}
  else if(t.clientX>=innerWidth*.5&&camT.id===null){camT.id=t.identifier;camT.x=t.clientX;}}},{passive:true});
const camT={id:null,x:0};
renderer.domElement.addEventListener('touchmove',e=>{for(const t of e.changedTouches){
  if(t.identifier===joy.id){let dx=t.clientX-joy.x,dy=t.clientY-joy.y;const d=Math.hypot(dx,dy),m=55;if(d>m){dx*=m/d;dy*=m/d;}joy.dx=dx/m;joy.dy=dy/m;jKnob.style.transform=`translate(${dx}px,${dy}px)`;}
  if(t.identifier===camT.id){camYaw-=(t.clientX-camT.x)*.008;camT.x=t.clientX;}}e.preventDefault();},{passive:false});
function jEnd(e){for(const t of e.changedTouches){if(t.identifier===joy.id){joy.id=null;joy.dx=joy.dy=0;jEl.style.display='none';jKnob.style.transform='';}if(t.identifier===camT.id)camT.id=null;}}
renderer.domElement.addEventListener('touchend',jEnd);renderer.domElement.addEventListener('touchcancel',jEnd);
let actHeld=false;
$('bAct').addEventListener('pointerdown',e=>{e.preventDefault();au();actHeld=true;});
['pointerup','pointerleave','pointercancel'].forEach(ev=>$('bAct').addEventListener(ev,()=>actHeld=false));
$('bCraft').addEventListener('click',()=>{au();openCraft();});
$('bMenu').addEventListener('click',()=>{au();openMenu();});
let rotHold=0;$('bRotL').addEventListener('pointerdown',()=>rotHold=1);$('bRotR').addEventListener('pointerdown',()=>rotHold=-1);
addEventListener('pointerup',()=>rotHold=0);

/* ---------------- interação ---------------- */
let target=null;
function findTarget(){
  const px=player.position.x,pz=player.position.z;let best=null,bd=1e9;
  const fx=Math.sin(P.face),fz=Math.cos(P.face);
  const score=(x,z,r)=>{const dx=x-px,dz=z-pz,d=Math.hypot(dx,dz);if(d>r)return 1e9;const dot=(dx*fx+dz*fz)/(d||1);return d-dot*.9;};
  for(const nd of nodes){if(nd.gone)continue;const r=nd.type==='tree'?2.4:nd.type==='rock'?2.6:nd.type==='raft'?3.4:1.9;const s=score(nd.x,nd.z,r);if(s<bd){bd=s;best={kind:'node',nd};}}
  for(const a of animals){if(a.dead)continue;const s=score(a.obj.position.x,a.obj.position.z,2.3)-.6;if(s<bd){bd=s;best={kind:'animal',a};}}
  for(const b of builds){const s=score(b.x,b.z,b.t==='tent'?3:2.4);if(s<bd){bd=s;best={kind:'build',b};}}
  if(!best){ // água por perto?
    for(const r of [1.4,2.2]){const wx=px+fx*r,wz=pz+fz*r;if(H(wx,wz)<-.05){best={kind:'water',lake:isLake(wx,wz),x:wx,z:wz};break;}}}
  return best;
}
function targetInfo(t){
  if(!t)return null;
  if(t.kind==='node'){const D=DEF[t.nd.type];
    if(t.nd.type==='raft')return{label:S.won?'Bote consertado':'Consertar o bote',ic:'🛶'};
    return{label:D.label,ic:D.ic,need:D.needs&&!S.tools[D.needs]&&!(D.needs==='axe'&&S.tools.axe2)?D.needs:null};}
  if(t.kind==='animal')return{label:t.a.kind==='wolf'?'Atacar lobo':'Caçar veado',ic:'⚔️'};
  if(t.kind==='water')return t.lake?{label:'Beber água'+(S.tools.cantil?' e encher cantil':''),ic:'💧'}:{label:'Água salgada…',ic:'🌊',salt:true};
  if(t.kind==='build'){const b=t.b;
    if(b.t==='fire')return{label:have('carne')?'Assar carne':'Esquentar-se',ic:'🔥'};
    if(b.t==='bench')return{label:'Usar bancada',ic:'🛠️'};
    if(b.t==='tent')return{label:isNight()?'Dormir até de manhã':'Descansar e salvar',ic:'⛺'};}
  return null;
}
function doAction(){
  if(P.busy>0||P.dead||panel)return;
  const t=target;
  if(!t){ // sem alvo: golpe no ar
    return;}
  const px=player.position.x,pz=player.position.z;
  const faceTo=(x,z)=>{P.face=Math.atan2(x-px,z-pz);};
  if(t.kind==='node'){const nd=t.nd,D=DEF[nd.type];faceTo(nd.x,nd.z);
    if(nd.type==='bag'){S.flags.bag=true;S.tools.cantil=true;S.tools.fosforo=true;S.cantil=3;add('baga',4);add('galho',1);setGone(nd,true);S.nodes[nd.id]=0;
      SND.craft();playOnce('take',.7);P.busy=.7;toast('🎒 Você achou: cantil, fósforos e bagas!');popAt(nd.x,nd.z,'🧴 📦 🫐');save();return;}
    if(nd.type==='compass'){S.tools.bussola=true;setGone(nd,true);S.nodes[nd.id]=0;SND.craft();playOnce('take',.7);P.busy=.7;toast('🧭 Bússola! A seta mostra o caminho até o bote');save();return;}
    if(nd.type==='raft')return tryRaft();
    if(D.needs){const ok=S.tools[D.needs]||(D.needs==='axe'&&S.tools.axe2);if(!ok){SND.no();toast(D.needs==='axe'?'Você precisa de um 🪓 machado':'Você precisa de uma ⛏️ picareta');return;}
      const isTree=nd.type==='tree';playOnce(isTree?'chop':'mine',.62);P.busy=.62;showTool(isTree?(S.tools.axe2?'axe2':'axe'):'pick');
      setTimeout(()=>{if(nd.gone)return;(isTree?SND.chop:SND.rock)();shake(nd.obj);
        nd.hp-=isTree?(S.tools.axe2?2:1):1;if(isTree)for(let i=0;i<3;i++)leafAt(nd.x,nd.z);else puff(nd.x,H(nd.x,nd.z)+.6,nd.z);
        if(nd.hp<=0){gather(nd);nd.hp=nd.maxhp;S.stats[isTree?'chop':'mine']++;}},330);
      return;}
    playOnce('take',.55);P.busy=.55;setTimeout(()=>{if(!nd.gone){SND.pick();gather(nd);}},250);return;}
  if(t.kind==='animal'){const a=t.a;faceTo(a.obj.position.x,a.obj.position.z);playOnce('hit',.55);P.busy=.55;showTool(S.tools.axe2?'axe2':S.tools.axe?'axe':null);
    setTimeout(()=>{if(a.dead)return;if(a.obj.position.distanceTo(player.position)>2.8)return;SND.hit();const dmg=S.tools.axe2?3:S.tools.axe?2:1;a.hp-=dmg;popAt(a.obj.position.x,a.obj.position.z,'-'+dmg);
      if(a.hp<=0)killAnimal(a);else{const h=a.acts.Idle_HitReact1;if(h){h.reset().play();}a.st='flee';a.t=2.2;if(a.kind==='wolf'&&!nearFire(a.obj.position,7)){a.st='chase';}}},280);return;}
  if(t.kind==='water'){faceTo(t.x,t.z);if(t.lake){playOnce('use',.6);P.busy=.6;SND.drink();S.sede=Math.min(100,S.sede+30);if(S.tools.cantil)S.cantil=3;popAt(px,pz,'💧 +30');}
    else{SND.no();toast('Água do mar é salgada! Procure o lago 🏞️');}return;}
  if(t.kind==='build'){const b=t.b;faceTo(b.x,b.z);
    if(b.t==='fire'){if(have('carne')){playOnce('use',1);P.busy=1;setTimeout(()=>{add('carne',-1);add('assada',1);SND.craft();popAt(b.x,b.z,'🍖 +1');save();},700);}
      else toast('🔥 Quentinho! Os lobos não chegam perto do fogo');return;}
    if(b.t==='bench'){openCraft('banc');return;}
    if(b.t==='tent'){S.flags.tent={x:b.x,z:b.z};
      if(isNight()){if(animals.some(a=>a.kind==='wolf'&&!a.dead&&a.obj.position.distanceTo(player.position)<14)){SND.no();toast('Tem lobo por perto! Não dá para dormir agora');return;}
        sleep();}else{S.vida=Math.min(100,S.vida+10);toast('⛺ Jogo salvo. Este é seu ponto de volta');save();}return;}}
}
function gather(nd){
  const D=DEF[nd.type];let txt=[];
  for(const k in D.give||{}){add(k,D.give[k]);txt.push(ITEMS[k].e+' +'+D.give[k]);}
  if(D.bonus&&rnd()<.5)for(const k in D.bonus){add(k,D.bonus[k]);txt.push(ITEMS[k].e+' +'+D.bonus[k]);}
  popAt(nd.x,nd.z,txt.join('  '));
  if(nd.type==='tree'){fallTree(nd);}else setGone(nd,true);
  S.nodes[nd.id]=D.regrow?Date.now()+D.regrow*1000/DEV:0;
}
function fallTree(nd){const o=nd.obj;nd.gone=true;const c=colliders.find(c=>c.node===nd);if(c)c.off=true;
  const ax=Math.random()*6.3;let t=0;const iv=setInterval(()=>{t+=.05;o.rotation.z=Math.min(1.5,t*t*2.2)*Math.cos(ax);o.rotation.x=Math.min(1.5,t*t*2.2)*Math.sin(ax);
    if(t>1.1){clearInterval(iv);o.visible=false;o.rotation.x=o.rotation.z=0;for(let i=0;i<6;i++)puff(nd.x,H(nd.x,nd.z)+.4,nd.z);}},16);}
function killAnimal(a){a.dead=1;aPlay(a,'Death');S.stats.kills++;const n=a.kind==='wolf'?2:3;add('carne',n);popAt(a.obj.position.x,a.obj.position.z,'🥩 +'+n);
  setTimeout(()=>{scene.remove(a.obj);const i=animals.indexOf(a);if(i>=0)animals.splice(i,1);},4000);save();}
function nearFire(p,r){return builds.some(b=>b.t==='fire'&&Math.hypot(b.x-p.x,b.z-p.z)<(r||6));}

/* ---------------- criar / construir ---------------- */
let panel=null,ptab='ferr';
function openCraft(tab){ptab=tab||ptab;panel='craft';renderCraft();$('panel').style.display='flex';}
function closePanel(){panel=null;$('panel').style.display='none';}
$('panel').addEventListener('click',e=>{if(e.target.id==='panel')closePanel();});
function costHtml(c){return Object.keys(c).map(k=>'<span class="c'+(have(k)>=c[k]?'':' no')+'">'+ITEMS[k].e+' '+have(k)+'/'+c[k]+'</span>').join('');}
function renderCraft(){
  const hasBench=builds.some(b=>b.t==='bench');
  let h='<h2>🛠️ Criar <button class="x" data-x>✕</button></h2><div class="tabs">'+[['ferr','Itens'],['const','Construir'],['banc','Bancada'+(hasBench?'':' 🔒')]].map(t=>'<button data-tab="'+t[0]+'" class="'+(ptab===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  if(ptab==='banc'&&!hasBench)h+='<div class="sub">Construa uma bancada (aba Construir) e chegue perto dela para usar estas receitas.</div>';
  for(const r of RECIPES.filter(r=>r.tab===ptab)){
    const owned=r.tool&&S.tools[r.tool];let block='';
    if(r.near&&!nearBuild(r.near,4))block='Perto da bancada';
    if(r.needTool&&!S.tools[r.needTool])block='Precisa de fósforos';
    if(r.build==='tent'&&builds.some(b=>b.t==='tent'))block='Já construída';
    const can=!owned&&!block&&hasAll(r.cost);
    h+='<div class="rec'+(owned?' done':'')+'"><div class="ic">'+r.e+'</div><div class="tx"><b>'+r.n+'</b><br>'+r.d+'<br>'+costHtml(r.cost)+'</div><button data-r="'+r.id+'"'+(can?'':' disabled')+'>'+(owned?'Feito ✓':block||(r.build?'Construir':'Criar'))+'</button></div>';}
  h+='<div class="sub" style="margin-top:12px">Comida e cura: toque no item na barra de baixo (ou teclas 1-9) para usar.</div>';
  $('pbox').innerHTML=h;
}
$('pbox').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.x!==undefined)return closePanel();
  if(b.dataset.tab){ptab=b.dataset.tab;return renderCraft();}
  if(b.dataset.r)craft(RECIPES.find(r=>r.id===b.dataset.r));
  if(b.dataset.m)menuAct(b.dataset.m);
});
function craft(r){
  if(!r||!hasAll(r.cost))return;
  if(r.build){const pos=buildSpot();if(!pos){SND.no();toast('Sem espaço aqui. Vá para um lugar mais aberto');return;}
    pay(r.cost);const b={t:r.build,x:pos.x,z:pos.z,ry:P.face+Math.PI};S.builds.push(b);spawnBuild(b);SND.craft();closePanel();
    toast(r.n+' construída!');playOnce('use',.8);P.busy=.8;save();return;}
  pay(r.cost);if(r.tool){S.tools[r.tool]=true;toast(r.e+' '+r.n+' pronto!');}else{add(r.give,1);popAt(player.position.x,player.position.z,ITEMS[r.give].e+' +1');}
  SND.craft();save();renderCraft();
}
function buildSpot(){const px=player.position.x,pz=player.position.z;
  for(const d of [2.4,3.2,1.8])for(const da of [0,.5,-.5,1,-1]){const a=P.face+da,x=px+Math.sin(a)*d,z=pz+Math.cos(a)*d;
    if(H(x,z)<.35||isLake(x,z))continue;if(colliders.some(c=>!c.off&&Math.hypot(c.x-x,c.z-z)<c.r+1.1))continue;return{x,z};}return null;}
function tryRaft(){
  if(S.won){toast('O bote está pronto. Você já escapou uma vez!');return;}
  if(!hasAll(RAFT_COST)){SND.no();toast('O bote está furado! Precisa de '+costHtmlTxt(RAFT_COST));S.flags.raftSeen=true;return;}
  pay(RAFT_COST);S.won=true;S.flags.raftSeen=true;SND.win();save();
  $('endMsg').textContent='Você sobreviveu '+S.day+' dia'+(S.day>1?'s':'')+', cortou '+S.stats.chop+' árvores e consertou o bote salva-vidas.';
  $('end').style.display='flex';
}
function costHtmlTxt(c){return Object.keys(c).map(k=>ITEMS[k].e+' '+have(k)+'/'+c[k]).join(' · ');}
function useItem(id){const it=ITEMS[id];if(!it||!have(id))return;
  if(id==='tocha'){add('tocha',-1);S.torch=150;toast('🔥 Tocha acesa');SND.craft();return;}
  if(!it.food)return;const f=it.food;add(id,-1);
  if(f.f)S.fome=Math.min(100,S.fome+f.f);if(f.s)S.sede=Math.min(100,S.sede+f.s);if(f.v)S.vida=clamp(S.vida+f.v,0,100);
  (id==='kit'||id==='bandagem'?SND.craft:SND.eat)();playOnce('use',.5);P.busy=.4;
  popAt(player.position.x,player.position.z,it.e+(f.f?' 🍖+'+f.f:'')+(f.v>0?' ❤️+'+f.v:f.v<0?' ❤️'+f.v:''));
  if(id==='carne')toast('Carne crua faz mal… melhor assar na fogueira 🔥');save();}

/* ---------------- menu ---------------- */
function openMenu(){panel='menu';$('panel').style.display='flex';
  $('pbox').innerHTML='<h2>☰ Menu <button class="x" data-x>✕</button></h2>'+
  '<div class="rec"><div class="ic">💾</div><div class="tx"><b>Salvar agora</b><br>O jogo também salva sozinho</div><button data-m="save">Salvar</button></div>'+
  '<div class="rec"><div class="ic">🎮</div><div class="tx"><b>Controles</b><br>'+(TOUCH?'Arraste no lado esquerdo para andar, arraste no lado direito para girar a câmera, botão laranja para agir.':'WASD andar · Shift correr · E/Espaço ação · C criar · Q/R ou arrastar o mouse para girar · roda do mouse para zoom · 1-9 comer')+'</div></div>'+
  '<div class="rec"><div class="ic">📖</div><div class="tx"><b>Guia</b><br>Itens, receitas, natureza e perigos</div><button data-m="guide">Abrir</button></div>'+
  '<div class="rec"><div class="ic">❓</div><div class="tx"><b>Como jogar</b><br>O básico em 6 cartões</div><button data-m="how">Ver</button></div>'+
  '<div class="rec"><div class="ic">🌱</div><div class="tx"><b>Novo jogo</b><br>Apaga o progresso e começa de novo</div><button data-m="reset" style="background:#f3a0a0">Recomeçar</button></div>';}
let resetArm=false;
function menuAct(m){if(m==='save'){save();toast('💾 Jogo salvo');closePanel();}
  if(m==='guide'){closePanel();openGuide();return;}
  if(m==='how'){closePanel();howTo();return;}
  if(m==='reset'){if(!resetArm){resetArm=true;toast('Toque de novo em Recomeçar para confirmar');setTimeout(()=>resetArm=false,3000);return;}localStorage.removeItem(SAVE_KEY);location.reload();}}

/* ---------------- dia e noite ---------------- */
const hourOf=t=>(6+t*24)%24;
function isNight(){const h=hourOf(S.time);return h>=20||h<5;}
const SKY={day:new THREE.Color('#9fd6ff'),dusk:new THREE.Color('#f2a36b'),night:new THREE.Color('#14203f')};
let wasNight=null;
function updateSky(){
  const h=hourOf(S.time);
  let k; // 0 dia, 1 noite
  if(h>=6&&h<18)k=0;else if(h>=18&&h<20.5)k=(h-18)/2.5;else if(h>=20.5||h<4.5)k=1;else k=1-(h-4.5)/1.5;
  const dusk=(h>=17&&h<21)?1-Math.abs(h-19)/2:(h>=4&&h<7)?1-Math.abs(h-5.5)/1.5:0;
  const c=SKY.day.clone().lerp(SKY.night,k).lerp(SKY.dusk,Math.max(0,dusk)*.55);
  renderer.setClearColor(c);scene.fog.color.copy(c);
  sun.intensity=lerp(1.45,.28,k);sun.color.set(k>.6?0x8fa6ff:dusk>.3?0xffb070:0xfff0d0);hemi.intensity=lerp(.68,.32,k);
  hemi.color.set(k>.6?0x6c80c0:0xfff1d6);
  const ang=(h/24)*Math.PI*2;sun.position.set(player.position.x+Math.cos(ang)*30,player.position.y+25,player.position.z+Math.sin(ang)*20+10);sun.target.position.copy(player.position);
  TER.wm.color.set(k>.6?0x0e3558:0x1678b0);
  scene.fog.near=lerp(45,22,k);scene.fog.far=lerp(130,70,k);
  const night=isNight();
  if(wasNight!==null&&night!==wasNight){if(night){SND.howl();toast('🌙 A noite chegou… fique perto do fogo');spawnWolves();}else{toast('☀️ Amanheceu! Dia '+S.day);wolvesLeave();}}
  wasNight=night;fireflies.visible=k>.5;
}
function spawnWolves(){const n=Math.min(1+S.day,5);for(let i=0;i<n;i++){
  for(let k=0;k<30;k++){const a=Math.random()*6.3,r=26+Math.random()*12,x=player.position.x+Math.cos(a)*r,z=player.position.z+Math.sin(a)*r;
    if(H(x,z)>.6&&!isLake(x,z)&&!nearFire({x,z},12)){const w=spawnAnimal('wolf',x,z);w.st='prowl';break;}}}}
function wolvesLeave(){for(const a of animals)if(a.kind==='wolf'&&!a.dead){a.st='leave';a.t=12;}}
function sleep(){
  $('dead').querySelector('h2').textContent='Zzz…';$('deadMsg').textContent='Você dormiu na barraca e acordou descansado.';$('dead').style.display='flex';
  setTimeout(()=>{if(hourOf(S.time)>=20)S.day++;S.time=.02;S.fome=Math.max(10,S.fome-20);S.sede=Math.max(10,S.sede-20);S.vida=Math.min(100,S.vida+30);
    wolvesLeave();for(const a of animals.slice())if(a.kind==='wolf'){scene.remove(a.obj);animals.splice(animals.indexOf(a),1);}
    save();$('dead').style.display='none';},1600);
}

/* ---------------- efeitos ---------------- */
const fx=[];
const puffMat=new THREE.MeshBasicMaterial({color:0xf3ead6,transparent:true,opacity:.8,depthWrite:false});const puffGeo=new THREE.IcosahedronGeometry(.18,0);
function puff(x,y,z){const m=new THREE.Mesh(puffGeo,puffMat.clone());m.position.set(x+(Math.random()-.5)*.8,y,z+(Math.random()-.5)*.8);scene.add(m);fx.push({m,t:0,vy:1.2+Math.random(),life:.7});}
const leafMat=new THREE.MeshBasicMaterial({color:0x6cbf4a,side:THREE.DoubleSide});const leafGeo=new THREE.PlaneGeometry(.18,.12);
function leafAt(x,z){const m=new THREE.Mesh(leafGeo,leafMat);m.position.set(x+(Math.random()-.5)*2,H(x,z)+3+Math.random()*2,z+(Math.random()-.5)*2);scene.add(m);fx.push({m,t:0,vy:-1.2,life:1.6,spin:Math.random()*4});}
function shake(o){let t=0;const x0=o.position.x;const iv=setInterval(()=>{t+=.05;o.position.x=x0+Math.sin(t*60)*.06*(1-t/.3);if(t>.3){clearInterval(iv);o.position.x=x0;}},16);}
const fireflies=(()=>{const g=new THREE.BufferGeometry(),a=[];for(let i=0;i<70;i++)a.push((Math.random()-.5)*36,.6+Math.random()*3,(Math.random()-.5)*36);
  g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,245,170,1)');gr.addColorStop(1,'rgba(255,230,120,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);
  const p=new THREE.Points(g,new THREE.PointsMaterial({size:.35,map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(p);return p;})();
function popAt(x,z,txt){const v=new V3(x,H(x,z)+2.4,z).project(camera);const d=document.createElement('div');d.className='pop';d.textContent=txt;
  d.style.left=((v.x+1)/2*innerWidth)+'px';d.style.top=((1-v.y)/2*innerHeight)+'px';d.style.transform='translate(-50%,0)';document.body.appendChild(d);setTimeout(()=>d.remove(),1100);}
let toastT=0;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2600);}

/* ---------------- HUD ---------------- */
let bagDirty=true;
const bagFood=()=>Object.keys(S.inv).filter(k=>ITEMS[k]&&(ITEMS[k].food||k==='tocha')&&have(k));
function renderBag(){bagDirty=false;let h='';
  for(const k of ['axe2','axe','pick','cantil','bussola'])if(S.tools[k]&&!(k==='axe'&&S.tools.axe2))h+='<div class="slot tool" title="'+TOOLS[k].n+'">'+TOOLS[k].e+(k==='cantil'?'<span>'+S.cantil+'</span>':'')+'</div>';
  const food=bagFood();
  for(const k of Object.keys(S.inv)){if(!have(k))continue;const f=food.indexOf(k);h+='<div class="slot'+(f>=0?' food':'')+'" data-use="'+k+'" title="'+ITEMS[k].n+'">'+ITEMS[k].e+'<span>'+have(k)+'</span></div>';}
  $('bag').innerHTML=h;}
$('bag').addEventListener('click',e=>{const s=e.target.closest('[data-use]');if(s)useItem(s.dataset.use);});
function hud(){
  const set=(id,v)=>{const el=$(id);el.querySelector('b').style.width=v+'%';el.classList.toggle('low',v<20);};
  set('sV',S.vida);set('sF',S.fome);set('sS',S.sede);
  const h=hourOf(S.time),hh=Math.floor(h),mm=Math.floor((h-hh)*6)*10;
  $('clock').textContent=(isNight()?'🌙':'☀️')+' Dia '+S.day+' · '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
  const g=GOALS.find(g=>!g.ok(S));
  $('goal').innerHTML=g?'🎯 '+g.t+(g.s?'<small>'+g.s+'</small>':''):'🏝️ Você completou a versão 0.1!';
  if(S.tools.bussola&&!S.won){const dx=RAFT_POS.x-player.position.x,dz=RAFT_POS.z-player.position.z,d=Math.hypot(dx,dz);
    const a=Math.atan2(dx,dz)-camYaw;$('goal').innerHTML+='<small>🧭 Bote: '+Math.round(d)+' m <span style="display:inline-block;transform:rotate('+(-a+Math.PI)+'rad)">⬆</span></small>';}
  if(bagDirty)renderBag();
}

/* ---------------- loop ---------------- */
const clock=new THREE.Clock();let started=false,hudT=0;
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.05);
  if(started&&!P.dead)update(dt);
  pMixer&&pMixer.update(dt);
  for(const a of animals)a.mx.update(dt);
  for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t+=dt;f.m.position.y+=f.vy*dt;if(f.spin)f.m.rotation.y+=f.spin*dt,f.m.rotation.x+=f.spin*dt;
    if(f.m.material.opacity!==undefined&&!f.spin)f.m.material.opacity=.8*(1-f.t/f.life);if(f.t>f.life){scene.remove(f.m);fx.splice(i,1);}}
  for(const b of builds)if(b.obj.userData.light){const L=b.obj.userData.light;L.intensity=2+Math.sin(performance.now()*.013)*.3+Math.random()*.3;b.obj.userData.flame.scale.y=1+Math.sin(performance.now()*.02)*.08;}
  if(player){const p=player.position;camera.position.set(p.x+Math.sin(camYaw)*camDist,p.y+camDist*.62,p.z+Math.cos(camYaw)*camDist);camera.lookAt(p.x,p.y+1.4,p.z);
    fireflies.position.set(p.x,0,p.z);fireflies.rotation.y+=dt*.05;}
  renderer.render(scene,camera);
  hudT-=dt;if(hudT<=0&&started){hudT=.2;hud();}
}
function update(dt){
  // tempo
  S.time+=dt/DAY_LEN;if(S.time>=1){S.time-=1;S.day++;}
  updateSky();
  // fome/sede/vida
  S.fome=Math.max(0,S.fome-dt*100/(480/DEV));S.sede=Math.max(0,S.sede-dt*100/(380/DEV));
  if(S.fome<=0||S.sede<=0)S.vida-=dt*1.6;else if(S.fome>45&&S.sede>45)S.vida=Math.min(100,S.vida+dt*.6);
  if(S.torch>0){S.torch-=dt;P.torch.intensity=isNight()?2.2:.6;if(S.torch<=0){P.torch.intensity=0;toast('A tocha apagou');}}
  if(S.vida<=0)return die();
  // respawn de recursos
  if(Math.random()<.02){const now=Date.now();for(const nd of nodes)if(nd.gone&&S.nodes[nd.id]&&S.nodes[nd.id]<now){setGone(nd,false);nd.obj.visible=true;const c=colliders.find(c=>c.node===nd);if(c)c.off=false;delete S.nodes[nd.id];}}
  // movimento
  camYaw+=((keys.KeyQ?1:0)-(keys.KeyR?1:0)+rotHold)*dt*1.8;
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.dx,iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.dy;
  const mag=Math.min(1,Math.hypot(ix,iz));P.busy-=dt;
  if(mag>.12&&P.busy<=0){
    const run=keys.ShiftLeft||keys.ShiftRight||Math.hypot(joy.dx,joy.dy)>.92;const sp=(run?6.2:3.4)*Math.max(.45,mag)*(S.fome<=0||S.sede<=0?.7:1);
    const ang=Math.atan2(ix,iz)+camYaw;const vx=Math.sin(ang)*sp,vz=Math.cos(ang)*sp;
    let nx=player.position.x+vx*dt,nz=player.position.z+vz*dt;
    for(const c of colliders){if(c.off)continue;const dx=nx-c.x,dz=nz-c.z,d=Math.hypot(dx,dz),m=c.r+.38;if(d<m&&d>0){nx=c.x+dx/d*m;nz=c.z+dz/d*m;}}
    if(H(nx,nz)>-.55){player.position.x=nx;player.position.z=nz;}
    let da=ang-P.face;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;P.face+=da*Math.min(1,dt*12);
    play(run&&mag>.5?'run':'walk');
    if(Math.random()<dt*2&&H(nx,nz)<.3)puff(nx,H(nx,nz)+.1,nz);
  }else if(P.busy<=0)play('idle');
  player.rotation.y=P.face;
  const gy=Math.max(H(player.position.x,player.position.z),-.45);player.position.y+=(gy-player.position.y)*Math.min(1,dt*15);
  if(P.busy<=0)showTool(heldTool());
  // alvo
  target=findTarget();const info=targetInfo(target);
  const lab=$('label'),bA=$('bAct');
  if(info&&!panel){let wx,wz,wy=2.2;if(target.kind==='node'){wx=target.nd.x;wz=target.nd.z;wy=target.nd.type==='tree'?3.4:1.8;}else if(target.kind==='animal'){wx=target.a.obj.position.x;wz=target.a.obj.position.z;wy=1.8;}else if(target.kind==='build'){wx=target.b.x;wz=target.b.z;}else{wx=target.x;wz=target.z;wy=1;}
    const v=new V3(wx,H(wx,wz)+wy,wz).project(camera);lab.style.display='block';lab.style.left=((v.x+1)/2*innerWidth)+'px';lab.style.top=((1-v.y)/2*innerHeight)+'px';
    lab.innerHTML='<span class="k">E</span>'+info.label+(info.need?' <span style="color:#ff9b8a">('+(info.need==='axe'?'precisa de 🪓':'precisa de ⛏️')+')</span>':'');
    bA.textContent=info.ic;bA.classList.toggle('off',!!info.need||!!info.salt);
    const hp=$('hpw');if(target.kind==='animal'||(target.kind==='node'&&target.nd.maxhp&&target.nd.hp<target.nd.maxhp)){const o=target.kind==='animal'?target.a:target.nd;hp.style.display='block';hp.style.left=lab.style.left;hp.style.top=(parseFloat(lab.style.top)-34)+'px';hp.firstChild.style.width=(o.hp/o.maxhp*100)+'%';}else hp.style.display='none';
  }else{lab.style.display='none';$('hpw').style.display='none';bA.textContent='✋';bA.classList.add('off');}
  if(actHeld||keys.KeyE||keys.Space)doAction();
  if(P.hurtT>0)P.hurtT-=dt;
  // animais
  updateAnimals(dt);
  if(nodes.find(n=>n.type==='raft')&&!S.flags.raftSeen&&Math.hypot(player.position.x-RAFT_POS.x,player.position.z-RAFT_POS.z)<12){S.flags.raftSeen=true;toast('🛶 Você achou o bote salva-vidas! Está furado…');}
  saveT+=dt;if(saveT>10){saveT=0;save();}
}
function updateAnimals(dt){
  const pp=player.position;
  for(const a of animals.slice()){
    if(a.dead)continue;const o=a.obj,d=Math.hypot(o.position.x-pp.x,o.position.z-pp.z);let sp=0,tx=a.tx,tz=a.tz;a.t-=dt;a.atk-=dt;
    if(a.kind==='deer'){
      if(d<7&&a.st!=='flee'){a.st='flee';a.t=3;}
      if(a.st==='flee'){const ang=Math.atan2(o.position.x-pp.x,o.position.z-pp.z);tx=o.position.x+Math.sin(ang)*10;tz=o.position.z+Math.cos(ang)*10;sp=6;if(a.t<=0)a.st='wander';}
      else{if(a.t<=0){a.t=3+Math.random()*5;const r=Math.random();if(r<.4){a.tx=o.position.x;a.tz=o.position.z;}else{a.tx=o.position.x+(Math.random()-.5)*14;a.tz=o.position.z+(Math.random()-.5)*14;}}sp=Math.hypot(a.tx-o.position.x,a.tz-o.position.z)>.5?1.3:0;}
    }else{ // lobo
      const safe=nearFire(pp,6.5);
      if(a.st==='leave'){const ang=Math.atan2(o.position.x-pp.x,o.position.z-pp.z);tx=o.position.x+Math.sin(ang)*10;tz=o.position.z+Math.cos(ang)*10;sp=4;if(a.t<=0||d>45){scene.remove(o);animals.splice(animals.indexOf(a),1);continue;}}
      else if(a.st==='flee'){const ang=Math.atan2(o.position.x-pp.x,o.position.z-pp.z);tx=o.position.x+Math.sin(ang)*10;tz=o.position.z+Math.cos(ang)*10;sp=4.5;if(a.t<=0)a.st='prowl';}
      else if(safe){ // rodeia a fogueira de longe
        const f=builds.find(b=>b.t==='fire'&&Math.hypot(b.x-pp.x,b.z-pp.z)<6.5);const ang=Math.atan2(o.position.x-f.x,o.position.z-f.z)+dt*.4;tx=f.x+Math.sin(ang+.3)*10;tz=f.z+Math.cos(ang+.3)*10;sp=1.6;}
      else if(d<24||a.st==='chase'){a.st='chase';tx=pp.x;tz=pp.z;sp=d>3?4.4:0;
        if(d<1.9&&a.atk<=0&&!P.dead){a.atk=1.4;const at=a.acts.Attack;if(at){at.reset().play();}setTimeout(()=>{if(a.dead||P.dead)return;if(Math.hypot(o.position.x-pp.x,o.position.z-pp.z)<2.3&&!nearFire(pp,6.5)){S.vida-=9;SND.hurt();P.hurtT=.4;playOnce('hurt',.4);P.busy=.35;popAt(pp.x,pp.z,'❤️ -9');}},350);}
        if(d>34)a.st='prowl';}
      else{if(a.t<=0){a.t=4;a.tx=pp.x+(Math.random()-.5)*30;a.tz=pp.z+(Math.random()-.5)*30;}sp=1.8;tx=a.tx;tz=a.tz;}
    }
    const dx=tx-o.position.x,dz=tz-o.position.z,dd=Math.hypot(dx,dz);
    if(sp>0&&dd>.3){let nx=o.position.x+dx/dd*sp*dt,nz=o.position.z+dz/dd*sp*dt;if(H(nx,nz)>.2&&!isLake(nx,nz)){o.position.x=nx;o.position.z=nz;}else{a.t=0;a.tx=o.position.x-dx;a.tz=o.position.z-dz;}
      const want=Math.atan2(dx,dz);let da=want-o.rotation.y;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;o.rotation.y+=da*Math.min(1,dt*8);
      aPlay(a,sp>3?'Gallop':'Walk');}
    else if(!(a.acts.Attack&&a.acts.Attack.isRunning()))aPlay(a,a.kind==='deer'&&Math.random()<.002?'Eating':'Idle');
    o.position.y=Math.max(H(o.position.x,o.position.z),-.3);
  }
  // veados reaparecem
  if(animals.filter(a=>a.kind==='deer'&&!a.dead).length<4&&Math.random()<dt*.05){const s=freeSpot(1,9,20);if(s&&Math.hypot(s.x-pp.x,s.z-pp.z)>25)spawnAnimal('deer',s.x,s.z);}
}
function die(){
  P.dead=true;playOnce('die');SND.hurt();
  setTimeout(()=>{
    $('dead').querySelector('h2').textContent='Você desmaiou…';$('deadMsg').textContent='Acordou de volta, mas perdeu metade dos recursos.';$('dead').style.display='flex';
    setTimeout(()=>{for(const k in S.inv)if(!ITEMS[k].food)S.inv[k]=Math.floor(S.inv[k]/2);for(const k in S.inv)if(!S.inv[k])delete S.inv[k];
      const sp=S.flags.tent||SPAWN;player.position.set(sp.x,H(sp.x,sp.z),sp.z+1.5);S.vida=60;S.fome=Math.max(S.fome,50);S.sede=Math.max(S.sede,50);
      for(const a of animals.slice())if(a.kind==='wolf'){scene.remove(a.obj);animals.splice(animals.indexOf(a),1);}
      if(isNight()){S.time=.02;S.day++;}
      P.dead=false;play('idle');bagDirty=true;save();$('dead').style.display='none';},1800);
  },1400);
}


/* ---------------- como jogar, guia e tutorial ---------------- */
FSG.onClick=()=>tone(700,.05,'triangle',.05);
function howTo(){
  FSG.slides({title:'Como jogar · Driftwood Isle',accent:'#e8952c',slides:[
    {e:'🏝️',t:'Sobreviva na ilha',x:'Seu barco afundou. Junte recursos, crie ferramentas e conserte o bote salva-vidas para escapar.'},
    {e:TOUCH?'🕹️':'⌨️',t:'Andar e olhar',x:TOUCH?'Arraste no lado <b>esquerdo</b> da tela para andar e no lado <b>direito</b> para girar a câmera. O botão laranja faz a ação.':'<b>WASD</b> para andar, <b>Shift</b> para correr, <b>E</b> ou <b>Espaço</b> para a ação e arraste o mouse para girar a câmera.'},
    {e:'❤️',t:'Vida, fome e sede',x:'A fome e a sede caem com o tempo. Coma bagas, cogumelos e carne assada, e beba água no <b>lago</b> (a água do mar é salgada!).'},
    {e:'🛠️',t:'Crie coisas',x:'No botão 🛠️ você transforma galhos, pedras e fibras em machado, picareta, corda, tocha, fogueira e bancada.'},
    {e:'🐺',t:'Cuidado à noite',x:'De noite aparecem lobos. Eles têm medo do fogo: fique perto de uma fogueira ou use uma tocha. A barraca deixa você dormir até de manhã.'},
    {e:'🎯',t:'Siga o objetivo',x:'O quadro amarelo no alto mostra o próximo passo. A bússola aponta o caminho até o bote.'}]});
}
function openGuide(){
  const cost=c=>Object.keys(c).map(k=>ITEMS[k].e+' '+c[k]+' '+ITEMS[k].n.toLowerCase()).join(', ');
  const ff=f=>{const a=[];if(f.f)a.push(['Fome','+'+f.f]);if(f.s)a.push(['Sede','+'+f.s]);if(f.v)a.push(['Vida',(f.v>0?'+':'')+f.v]);return a;};
  const SRC={galho:'Pegue do chão (ou ao cortar árvores)',pedra:'Pegue do chão ou quebre rochas com a picareta',madeira:'Corte árvores com o machado',fibra:'Arranque capim',
    corda:'Crie com 3 fibras',tabua:'Crie na bancada com 2 madeiras',remo:'Crie na bancada',baga:'Colha nos arbustos com frutinhas',cogumelo:'Pegue no chão da floresta',
    carne:'Cace veados e lobos',assada:'Asse carne crua na fogueira',bandagem:'Crie com fibra e corda',kit:'Escondido pela ilha (há 3)',tocha:'Crie com galho e fibra'};
  const its=Object.keys(ITEMS).map(k=>{const I=ITEMS[k];return {e:I.e,n:I.n,sub:I.food?'Comida ou cura':'Material',d:(SRC[k]||'')+'.'+(k==='carne'?' Comer crua faz mal: melhor assar.':'')+(k==='tocha'?' Toque nela na mochila para acender: ilumina e afasta lobos.':''),st:I.food?ff(I.food):[]};});
  const where={ferr:'Em qualquer lugar',const:'Constrói onde você está',banc:'Perto da bancada'};
  const rec=RECIPES.map(r=>({e:r.e,n:r.n,sub:where[r.tab],d:r.d+'.',st:[['Precisa',cost(r.cost)]].concat(r.needTool?[['Também precisa','📦 fósforos (da mochila)']]:[])}));
  rec.push({e:'🛶',n:'Bote salva-vidas',sub:'Na praia do norte',d:'Conserte o bote para escapar da ilha e terminar a versão 0.1.',st:[['Precisa',cost(RAFT_COST)]]});
  const nat=[['tree','🌳','Árvore','Precisa de machado. Dá madeira e às vezes um galho. Volta a crescer.'],['rock','🪨','Rocha grande','Precisa de picareta. Dá 4 pedras.'],
    ['stick','🪵','Galho no chão','Pegue com a mão.'],['stone','🪨','Pedra pequena','Pegue com a mão.'],['grass','🌾','Capim','Arranque para conseguir fibra.'],
    ['bush','🫐','Arbusto de bagas','Dá 3 bagas. As frutinhas voltam depois de um tempo.'],['shroom','🍄','Cogumelo','Comida rápida.'],['kit','🧰','Kit de socorro','Há 3 escondidos. Recupera 50 de vida.']]
    .map(([k,e,n,d])=>{const D=DEF[k];return {e,n,sub:D.regrow?'Volta em '+Math.round(D.regrow/60)+' min':'Não volta',d,st:Object.keys(D.give||{}).map(g=>['Dá',ITEMS[g].e+' '+D.give[g]+' '+ITEMS[g].n.toLowerCase()])};});
  nat.push({e:'🏞️',n:'Lago',sub:'Água doce',d:'Beba aqui (+30 de sede). Se tiver o cantil, ele enche com 3 goles.'});
  nat.push({e:'🦌',n:'Veado',sub:'Animal calmo',d:'Foge quando você chega perto. Caçar dá 3 carnes cruas.'});
  const dang=[{e:'🍖',n:'Fome',sub:'Cai com o tempo',d:'Zera em cerca de 8 minutos. Sem comida você anda mais devagar e perde vida.'},
    {e:'💧',n:'Sede',sub:'Cai mais rápido',d:'Zera em cerca de 6 minutos. Beba no lago ou use o cantil.'},
    {e:'❤️',n:'Vida',sub:'Recupera sozinha',d:'Com fome e sede acima da metade, a vida volta devagar. Bandagens e kits curam na hora. Se a vida zerar, você desmaia e perde parte dos recursos.'},
    {e:'🐺',n:'Lobos',sub:'Aparecem à noite',d:'A cada noite vêm mais lobos (até 5). Eles atacam, mas não chegam perto do fogo. Com o machado você luta melhor. Derrubar um lobo dá 2 carnes.'},
    {e:'🌙',n:'Noite',sub:'Das 20h às 5h',d:'Fica escuro e perigoso. Acenda uma fogueira ou tocha. Dormir na barraca pula a noite (se não houver lobo por perto).'},
    {e:'🌊',n:'Mar',sub:'Água salgada',d:'Não dá para beber água do mar. Procure o lago no meio da ilha.'}];
  const ctl=TOUCH?[{e:'🕹️',n:'Andar',sub:'Lado esquerdo',d:'Arraste o dedo no lado esquerdo da tela. Arrastar até a borda faz correr.'},{e:'🔄',n:'Câmera',sub:'Lado direito',d:'Arraste no lado direito ou use os botões ⟲ ⟳.'},{e:'✋',n:'Ação',sub:'Botão laranja',d:'Pega, corta, quebra, bebe, ataca e usa construções. Segure para repetir.'},{e:'🛠️',n:'Criar',sub:'Botão 🛠️',d:'Abre as receitas.'},{e:'🎒',n:'Comer',sub:'Toque na mochila',d:'Toque numa comida da barra de baixo para comer.'}]
   :[{e:'⌨️',n:'Andar',sub:'WASD',d:'Shift para correr.'},{e:'🖱️',n:'Câmera',sub:'Arrastar o mouse',d:'Ou Q/R. A roda do mouse dá zoom.'},{e:'✋',n:'Ação',sub:'E ou Espaço',d:'Pega, corta, quebra, bebe, ataca e usa construções. Segure para repetir.'},{e:'🛠️',n:'Criar',sub:'C ou Tab',d:'Abre as receitas.'},{e:'🎒',n:'Comer',sub:'Teclas 1 a 9',d:'Ou clique na comida na barra de baixo.'}];
  FSG.guide({title:'📖 Guia · Driftwood Isle',accent:'#e8952c',tabs:[{name:'Receitas',items:rec},{name:'Itens',items:its},{name:'Natureza',items:nat},{name:'Perigos',items:dang},{name:'Controles',items:ctl}]});
}
function startTutorial(){
  let p0=null;
  const moved=()=>p0&&Math.hypot(player.position.x-p0.x,player.position.z-p0.z)>2.5;
  const fin=()=>{S.flags.tut=true;save();if(!S.flags.bag)toast('🎒 Sua mochila está ali na areia. Chegue perto e aperte '+(TOUCH?'o botão laranja':'E'));};
  const bagNode=nodes.find(n=>n.type==='bag');
  const scr=(x,y,z)=>{const v=new V3(x,y,z).project(camera);return v.z<1?[(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight]:null;};
  FSG.coach({accent:'#e8952c',done:fin,steps:[
    {x:'Seu barco afundou e você foi parar nesta ilha. Vamos aprender o básico para sobreviver!'},
    {enter:()=>{p0={x:player.position.x,z:player.position.z};},at:TOUCH?()=>[innerWidth*.22,innerHeight*.62]:null,r:50,
      x:TOUCH?'Arraste o dedo no lado <b>esquerdo</b> da tela para andar.':'Use <b>W A S D</b> para andar (Shift corre).',done:moved},
    TOUCH?{at:()=>[innerWidth*.72,innerHeight*.5],r:50,x:'Arraste no lado <b>direito</b> para girar a câmera.'}:{x:'Arraste o mouse para girar a câmera. A roda do mouse dá zoom.'},
    {el:'#stats',x:'Fique de olho na ❤️ <b>vida</b>, 🍖 <b>fome</b> e 💧 <b>sede</b>. Coma bagas e beba água no lago.'},
    {el:'#goal',x:'Aqui fica o seu <b>objetivo</b>. É só seguir passo a passo.'},
    {at:()=>bagNode&&!bagNode.gone?scr(bagNode.x,H(bagNode.x,bagNode.z)+.6,bagNode.z):null,r:36,x:'Chegue perto da <b>mochila</b> do naufrágio e toque no botão de ação '+(TOUCH?'laranja':'(E)')+' para abrir.',done:()=>S.flags.bag},
    {el:'#bCraft',x:'No 🛠️ você cria ferramentas e construções com o que coletar. O primeiro é o machado!'},
    {el:'#bMenu',x:'No ☰ Menu tem o <b>Guia</b> com todos os itens, receitas e perigos. Cuidado com os lobos à noite!',btn:'Começar!'}]});
}
/* ---------------- início ---------------- */
async function boot(){
  const names=Object.keys(MODELS);let n=0;
  for(const k of names){GL[k]=await parse(k);n++;$('lbar').style.width=(n/names.length*100)+'%';}
  $('lmsg').textContent='Montando a ilha…';await new Promise(r=>setTimeout(r,30));
  await buildWorld();await buildPlayer();fitTools();
  for(let i=0;i<4;i++){const s=freeSpot(1,9,20);if(s)spawnAnimal('deer',s.x,s.z);}
  wasNight=isNight();if(wasNight)spawnWolves();
  updateSky();frame();
  $('lmsg').textContent=S.p?'Bem-vindo de volta!':'Pronto!';$('bGo').style.display='inline-block';$('bHow').style.display='inline-block';
  $('bHow').onclick=()=>{au();howTo();};
  $('bGo').onclick=()=>{au();$('start').style.display='none';started=true;clock.getDelta();if(TOUCH&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});
    if(!S.flags.tut)setTimeout(startTutorial,600);
    else if(!S.flags.bag)toast('🎒 Sua mochila está ali na areia. Chegue perto e aperte '+(TOUCH?'o botão laranja':'E'));};
  $('bAgain').onclick=()=>{$('end').style.display='none';};
  window.__wg={P,dbg:()=>({busy:P.busy,dead:P.dead,panel,started}),S:()=>S,player:()=>player,nodes,animals,builds,give:(k,n)=>add(k,n),tool:k=>S.tools[k]=true,setTime:t=>S.time=t,tp:(x,z)=>{player.position.set(x,H(x,z),z);},
    act:doAction,target:()=>target,craft:id=>craft(RECIPES.find(r=>r.id===id)),RAFT_POS,SPAWN,H,camYaw:v=>camYaw=v,start:()=>$('bGo').onclick()};
}
boot().catch(e=>{$('lmsg').textContent='Erro: '+e.message;console.error(e);});
})();
