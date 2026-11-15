/* =====================================================================
   FAZENDA FELIZ - 3D (Three.js r128)
   Modelos: Cozy Farm + Kenney Cube Pets + Kenney Nature Kit + Kenney Mini Characters (todos CC0)
   Sistemas: plantar/regar/colher, animais, celeiro, caminhão de pedidos, expansão,
             fábricas (moinho/laticínio/forno), árvores frutíferas, pesca, missões diárias,
             dia e noite, partículas, fazendeiro andando, tutorial guiado, save + offline
   Teste rápido: abra com ?dev no endereço (tudo fica 20x mais rápido)
   ===================================================================== */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const V3=THREE.Vector3;
const DEV=/[?&]dev/.test(location.search)?20:1;
const T=s=>s*1000/DEV;                       // segundos de jogo -> ms reais
const dflt=(v,d)=>v===undefined?d:v;

/* ---------------- DADOS DO JOGO (ajuste aqui; tempos em segundos) ---------------- */
const CROPS={
  wheat:   {name:'Trigo',    e:'🌾',cost:4, time:60,  sell:9,  xp:2, lvl:1,model:'wheat',   h:1.25},
  carrot:  {name:'Cenoura',  e:'🥕',cost:5, time:120, sell:12, xp:3, lvl:1,model:'carrot_', h:.95},
  tomato:  {name:'Tomate',   e:'🍅',cost:12,time:300, sell:30, xp:6, lvl:2,model:'tomato',  h:.75},
  corn:    {name:'Milho',    e:'🌽',cost:20,time:600, sell:55, xp:10,lvl:3,model:'corn',    h:1.5},
  eggplant:{name:'Berinjela',e:'🍆',cost:35,time:1200,sell:100,xp:18,lvl:5,model:'eggplant',h:1.0},
  pumpkin: {name:'Abóbora',  e:'🎃',cost:45,time:1500,sell:150,xp:22,lvl:7,model:'pumpkin', h:.55}
};
const PRODUCTS={
  egg:    {name:'Ovo',      e:'🥚',sell:25, xp:6},
  milk:   {name:'Leite',    e:'🥛',sell:70, xp:14},
  truffle:{name:'Trufa',    e:'🍄',sell:160,xp:30},
  flour:  {name:'Farinha',  e:'🥣',sell:45, xp:5},
  feed:   {name:'Ração',    e:'🥫',sell:12, xp:2},
  yogurt: {name:'Iogurte',  e:'🍨',sell:110,xp:10},
  cheese: {name:'Queijo',   e:'🧀',sell:190,xp:18},
  bread:  {name:'Pão',      e:'🍞',sell:120,xp:12},
  cake:   {name:'Bolo',     e:'🎂',sell:280,xp:26},
  pie:    {name:'Torta de maçã',e:'🥧',sell:200,xp:20},
  pizza:  {name:'Pizza',    e:'🍕',sell:480,xp:40},
  apple:  {name:'Maçã',     e:'🍎',sell:18, xp:3},
  cherry: {name:'Cereja',   e:'🍒',sell:30, xp:5},
  mango:  {name:'Manga',    e:'🥭',sell:45, xp:7},
  fish:   {name:'Peixe',    e:'🐟',sell:20, xp:3},
  wool:   {name:'Lã',       e:'🧶',sell:90, xp:12},
  cloth:  {name:'Tecido',   e:'🧵',sell:220,xp:20},
  scarf:  {name:'Cachecol', e:'🧣',sell:360,xp:32},
  sweater:{name:'Suéter',   e:'🧥',sell:520,xp:45},
  greenapple:{name:'Maçã verde',e:'🍏',sell:25,xp:4},
  grape:  {name:'Uva',      e:'🍇',sell:35, xp:6},
  banana: {name:'Banana',   e:'🍌',sell:55, xp:8},
  juice:  {name:'Suco de uva',e:'🧃',sell:160,xp:16},
  smoothie:{name:'Vitamina de banana',e:'🥤',sell:210,xp:20},
  jam:    {name:'Geleia',   e:'🍯',sell:190,xp:18},
  carp:   {name:'Carpa',    e:'🐡',sell:35, xp:5},
  shark:  {name:'Tubarão',  e:'🦈',sell:400,xp:60},
  wood:   {name:'Madeira',  e:'🪵',sell:15, xp:1},
  stone:  {name:'Pedra',    e:'🪨',sell:15, xp:1},
  ppie:   {name:'Torta de abóbora',e:'🥧🎃',sell:330,xp:30},
  planks: {name:'Tábuas',   e:'🟫',sell:70, xp:6},
  chair:  {name:'Cadeira',  e:'🪑',sell:230,xp:20},
  birdhouse:{name:'Casinha de passarinho',e:'🐦',sell:170,xp:15},
  gbench: {name:'Banco de jardim',e:'🛋️',sell:380,xp:32},
  yogcherry:{name:'Iogurte de cereja',e:'🍨🍒',sell:170,xp:16},
  yoggrape:{name:'Iogurte de uva',e:'🍨🍇',sell:160,xp:15},
  redgrape:{name:'Uva vermelha (rara)',e:'🍇✨',sell:95,xp:12},
  greenbanana:{name:'Banana verde (rara)',e:'🍌✨',sell:140,xp:16},
  rarefish:{name:'Peixe raro',e:'🐠',sell:60,xp:10}
};
const ANIMALS={
  chick:{name:'Galinha',e:'🐔',cost:60, feed:1,food:'wheat', time:300, prod:'egg',    barn:1,lvl:1,h:1.0,model:'pet_chick'},
  cow:  {name:'Vaca',   e:'🐄',cost:250,feed:2,food:'wheat', time:600, prod:'milk',   barn:2,lvl:1,h:1.7,model:'pet_cow'},
  bunny:{name:'Coelho angorá',e:'🐰',cost:400,feed:2,food:'carrot',time:900,prod:'wool',barn:2,lvl:6,h:1.1,model:'pet_bunny'},
  pig:  {name:'Porco',  e:'🐖',cost:500,feed:3,food:'wheat', time:1200,prod:'truffle',barn:3,lvl:1,h:1.3,model:'pet_pig'},
  alpaca:{name:'Alpaca', e:'🦙',cost:700,feed:3,food:'wheat', time:1200,prod:'wool',n:2,barn:3,lvl:8,h:1.9,model:'q_alpaca'}
};
const BARN=[null,
  {cap:40, animals:3, up:300},
  {cap:100,animals:6, up:1200},
  {cap:250,animals:10,up:3500},
  {cap:450,animals:14,up:8000},
  {cap:700,animals:18,up:0}
];
// silo: guarda só os grãos/plantações (o celeiro guarda o resto)
const SILO=[null,{cap:60,up:500,w:5,st:0},{cap:150,up:1800,w:10,st:10},{cap:350,up:5000,w:20,st:20},{cap:700,up:0}];
// caminhão: níveis mudam o modelo, nº de pedidos e o valor
const TRUCKS=[null,{model:'truck',orders:3,mult:1},{model:'truck2',orders:4,mult:1.1,cost:1500,lvl:5,w:10,st:5},{model:'truck3',orders:4,mult:1.25,cost:5000,lvl:9,w:20,st:15}];
// ferramentas compráveis
// regador: nível 1 vem de graça; cada melhoria troca o modelo na mão do fazendeiro
const CANS=[null,{name:'Regador simples',model:'wateringcan_001',desc:'Rega 1 canteiro'},
  {name:'Regador verde',model:'wateringcan_003',cost:400,lvl:3,desc:'Rega a fileira inteira'},
  {name:'Regador de metal',model:'wateringcan_005',cost:1500,lvl:6,desc:'Rega o campo inteiro'},
  {name:'Regador com flor',model:'t_can',cost:4000,lvl:9,desc:'Rega todos os campos e as plantas crescem 10% mais rápido'}];
const canLv=()=>S.canLv||1;
const TOOLS={
  axe:   {name:'Machado',          e:'🪓',model:'t_axe',     cost:200, lvl:2,desc:'Corta arbustos e mato: dá 🪵 madeira'},
  pick:  {name:'Picareta',         e:'⛏️',model:'t_pick',    cost:200, lvl:2,desc:'Quebra pedras: dá 🪨 pedra'},
  rod2:  {name:'Vara de pesca pro',e:'🎣',model:'fishingrod2',cost:1200,lvl:5,desc:'Mais tempo para puxar e mais peixes raros'},
  shovel:{name:'Pá de colheita',   e:'🧺',model:'t_shovel',  cost:900, lvl:6,desc:'Colhe a fileira inteira de uma vez'},
  tractor:{name:'Trator',          e:'🚜',model:'tractor',   cost:2500,lvl:7,desc:'Passa nos canteiros quando você rega ou colhe uma fileira'},
  loader:{name:'Pá carregadeira',  e:'🏗️',model:'loader',    cost:2000,lvl:8,desc:'Remove mato e pedras com 1 toque só'},
  boat:  {name:'Barco de pesca',   e:'🚤',model:'boat',      cost:3000,lvl:8,desc:'Lago grande: +2 iscas e mais peixes raros'}
};
// álbum de peixes
const ALBUM=[{id:'fish',e:'🐟',name:'Peixe'},{id:'carp',e:'🐡',name:'Carpa'},{id:'rarefish',e:'🐠',name:'Peixe raro'},{id:'shark',e:'🦈',name:'Tubarão'},{id:'bone',e:'🦴',name:'Peixe-osso'}];
const ALBUM_REWARD=1000;
// melhorias de fábrica (nível 1 → 3): +1 vaga e mais rápida a cada nível
const FAC_SPEED=[1,1,.8,.65];
const facUpCost=(id,L)=>{const F=FACTORIES[id];return{c:Math.round(F.cost*(L===1?1:2.5)),w:5+5*L,st:5+5*L,lvl:F.lvl+2*L};};
// bônus por entrar todo dia (ciclo de 7 dias)
const LOGIN=[
  {t:'💰50',f:()=>coinsGain(50)},{t:'💰80',f:()=>coinsGain(80)},{t:'🪱+3',f:()=>{S.fe+=3;}},
  {t:'🪵5 🪨5',f:()=>{addItem('wood',5);addItem('stone',5);}},{t:'⭐50',f:()=>gainXp(50)},
  {t:'💰300',f:()=>coinsGain(300)},{t:'🎁 💰600 🪵10',f:()=>{coinsGain(600);addItem('wood',10);}}
];
// fábricas: cada uma tem uma fila de produção
const FACTORIES={
  mill: {name:'Moinho',   e:'🌀',model:'mill1',size:4.6,mode:'h', x:13,  z:-10.6,lvl:3,cost:400, slots:3,recipes:['flour','feed'],lvModels:['mill1','mill','mill3']},
  dairy:{name:'Laticínio',e:'🧈',model:'dairy',size:3.4,mode:'xz',x:18.4,z:-8.2, lvl:5,cost:900, slots:3,recipes:['yogurt','cheese','yogcherry','yoggrape']},
  carp: {name:'Carpintaria',e:'🔨',model:'carp',size:3.1,mode:'xz',x:6.4,z:-12.7,lvl:4,cost:800, slots:3,recipes:['planks','chair','birdhouse','gbench']},
  oven: {name:'Forno',    e:'🔥',model:'oven', size:2.8,mode:'xz',x:13.6,z:-4.4, lvl:6,cost:1500,slots:3,recipes:['bread','cake','pie','pizza','ppie'],lvModels:['oven','oven2','oven3']},
  loom: {name:'Ateliê',   e:'🧵',model:'loom', size:3.3,mode:'xz',x:18.6,z:-3.6, lvl:7,cost:2000,slots:3,recipes:['cloth','scarf','sweater']},
  press:{name:'Prensa',   e:'🧃',model:'press',size:3.2,mode:'xz',x:19,  z:-12.9,lvl:8,cost:2500,slots:3,recipes:['juice','smoothie','jam']}
};
const RECIPES={
  flour: {in:{wheat:3},                 time:120,n:1},
  feed:  {in:{wheat:1,corn:1},          time:60, n:3},
  yogurt:{in:{milk:1},                  time:240,n:1},
  cheese:{in:{milk:2},                  time:360,n:1},
  bread: {in:{flour:2},                 time:240,n:1},
  ppie:  {in:{pumpkin:1,flour:1,egg:1},  time:600,n:1},
  cake:  {in:{flour:1,egg:2,milk:1},    time:600,n:1},
  pie:   {in:{flour:1,apple:3},         time:720,n:1},
  pizza: {in:{flour:1,tomato:2,cheese:1},time:900,n:1},
  cloth: {in:{wool:2},                  time:300,n:1},
  scarf: {in:{cloth:1,wool:1},          time:480,n:1},
  sweater:{in:{cloth:2},                time:720,n:1},
  juice: {in:{grape:3},                 time:300,n:1},
  smoothie:{in:{banana:2,milk:1},       time:360,n:1},
  jam:   {in:{greenapple:2,cherry:2},   time:420,n:1},
  yogcherry:{in:{milk:1,cherry:2},      time:300,n:1},
  yoggrape:{in:{milk:1,grape:2},        time:300,n:1},
  planks:{in:{wood:3},                  time:120,n:1},
  chair: {in:{planks:2},                time:300,n:1},
  birdhouse:{in:{planks:1,wood:2},      time:240,n:1},
  gbench:{in:{planks:3,stone:1},        time:420,n:1}
};
const TREES={
  apple: {name:'Macieira', fruit:'apple', cost:150,lvl:4,time:900, n:3,leaf:0x6cc04a},
  greenapple:{name:'Macieira verde',fruit:'greenapple',cost:250,lvl:5,time:1200,n:3,leaf:0x9bd65a},
  cherry:{name:'Cerejeira',fruit:'cherry',cost:350,lvl:7,time:1500,n:3,leaf:0xf2a6c8},
  grape: {name:'Parreira', fruit:'grape', cost:450,lvl:8,time:1800,n:3,leaf:0x5aa640,rare:'redgrape'},
  mango: {name:'Mangueira',fruit:'mango', cost:600,lvl:9,time:2400,n:3,leaf:0x3f9e4a},
  banana:{name:'Bananeira',fruit:'banana',cost:800,lvl:11,time:3000,n:3,leaf:0x4caf50,rare:'greenbanana'}
};
const TREE_SLOTS=[[-7.4,9.4],[-2.5,9.7],[2.5,9.7],[7.4,9.4],[-8.8,-13.8],[-4.8,-14.4],[-.8,-14.4],[3.2,-13.8]];   // os 4 últimos ficam no terreno 'Pomar dos Fundos'
// dois lagos: o grande (perto da fazenda) e o pequeno (no Campo Oeste), cada um com suas iscas
const PONDS={big:{name:'Lago grande',spot:new V3(12.3,0,3.4),bob:new V3(15,.9,5.3),max:5,regen:180},
             small:{name:'Lago pequeno',spot:new V3(-16.9,0,-5.2),bob:new V3(-19.8,.5,-5.9),max:3,regen:240,c:new V3(-20,0,-5.8)}};
let curPond='big';
const pondMax=id=>PONDS[id].max+(id==='big'&&S&&S.tools&&S.tools.boat?2:0);
const FISH={lvl:2,get max(){return pondMax(curPond);},get regen(){return PONDS[curPond].regen;},get spot(){return PONDS[curPond].spot;},get bob(){return PONDS[curPond].bob;}};
const PE=()=>curPond==='small'?S.fish2:S;
const UNLOCKS={2:'🎣 Pesca liberada! Toque no lago',3:'🌀 Moinho disponível · 🙋 visitantes · 🐕 cachorro na loja',4:'🌳 Macieira liberada · 🏪 Mercado da cidade aberto',
  5:'🧈 Laticínio disponível',6:'🔥 Forno, 🐰 coelho, 🗺️ Campo Oeste e 🚂 trem de carga liberados',7:'🌸 Cerejeira, 🧵 Ateliê, 🎃 abóbora e 🚜 trator liberados',8:'🦙 Alpaca, 🐎 cavalo e 🚤 barco de pesca liberados',9:'🥭 Mangueira liberada',10:'🗺️ Pomar dos Fundos liberado'};
// terrenos para expandir a fazenda
const ZONES={
  west: {name:'Campo Oeste',     e:'🌱',lvl:6, cost:2500,desc:'+9 canteiros e um lago pequeno',sign:[-15.4,7.2], clutter:[['bushesgreen',2.2,-21,1],['bushesyellow',2,-18.2,4.4],['rocks_004',1.4,-19.6,-.4],['bushesgreen',2.4,-16.8,1.6],['rocks_006',1.2,-22,5],['bushesyellow',1.8,-20.4,3]]},
  north:{name:'Pomar dos Fundos',e:'🌳',lvl:10,cost:6000,desc:'+4 árvores frutíferas',  sign:[6.6,-12.2], clutter:[['bushesgreen',2,-8.8,-13.8],['bushesyellow',2.2,-4.8,-14.4],['bushesgreen',2.3,-.8,-14.4],['rocks_005',1.4,3.2,-13.8]]}
};
// decorações compráveis (r = raio ocupado no chão)
const DECOR={
  fence:   {name:'Cerca',          e:'🪵',model:'d_fence',     size:1.7,mode:'xz',cost:30, lvl:1,r:.8},
  flowers: {name:'Canteiro de flores',e:'🌸',model:'flowerstack',size:.9,mode:'h',cost:40, lvl:1,r:.6},
  bush:    {name:'Arbusto',        e:'🌿',model:'bushesgreen', size:1.8,mode:'xz',cost:50, lvl:1,r:.9},
  sign:    {name:'Placa',          e:'🪧',model:'d_sign',      size:1.6,mode:'h', cost:60, lvl:2,r:.5},
  hay:     {name:'Fardo de feno',  e:'🌾',model:'haystackround',size:1.4,mode:'xz',cost:70, lvl:2,r:.8},
  banner:  {name:'Bandeira verde', e:'🏳️',model:'d_banner',    size:2.2,mode:'h', cost:80, lvl:3,r:.5},
  banner2: {name:'Bandeira vermelha',e:'🚩',model:'d_banner2', size:2.2,mode:'h', cost:80, lvl:3,r:.5},
  bench:   {name:'Banco',          e:'🪑',model:'benchlittle', size:1.6,mode:'xz',cost:100,lvl:3,r:.9},
  lantern: {name:'Poste de luz',   e:'🏮',model:'d_lantern',   size:2.4,mode:'h', cost:120,lvl:4,r:.4},
  stool:   {name:'Banquinho de feira',e:'🛖',model:'d_stallbench',size:1.4,mode:'xz',cost:150,lvl:4,r:.7},
  cart:    {name:'Carroça',        e:'🛒',model:'d_cart',      size:2.2,mode:'xz',cost:250,lvl:5,r:1.1},
  fountain:{name:'Fonte',          e:'⛲',model:'d_fountain',  size:2.4,mode:'xz',cost:500,lvl:6,r:1.3},
  xtree:   {name:'Árvore de Natal',e:'🎄',model:'x_tree',      size:2.6,mode:'h', cost:300,lvl:1,r:.9,ev:'natal'},
  snowman: {name:'Boneco de neve', e:'⛄',model:'x_snowman',   size:1.5,mode:'h', cost:150,lvl:1,r:.7,ev:'natal'},
  present: {name:'Pilha de presentes',e:'🎁',model:'x_present',size:.9,mode:'h', cost:80, lvl:1,r:.6,ev:'natal'},
  reindeer:{name:'Rena',           e:'🦌',model:'x_reindeer',  size:1.6,mode:'h', cost:250,lvl:1,r:.9,ev:'natal'},
  haycube: {name:'Fardo quadrado', e:'🟨',model:'d_haycube',   size:1.2,mode:'h', cost:60, lvl:2,r:.6},
  topiary: {name:'Arbusto podado',  e:'🟩',model:'bushescubegreen',size:1.8,mode:'xz',cost:90,lvl:3,r:.9},
  topiary2:{name:'Arbusto podado amarelo',e:'🟨',model:'bushescubeyellow',size:1.8,mode:'xz',cost:90,lvl:3,r:.9},
  arch2:   {name:'Arco amarelo',     e:'🌼',model:'bushesportalyellow',size:2.6,mode:'h',cost:180,lvl:4,r:.9},
  haytall: {name:'Feno alto',        e:'🌾',model:'haystackthick',size:1.6,mode:'h',cost:70,lvl:2,r:.6},
  crate:   {name:'Caixote',          e:'📦',model:'woodenboxvar',size:1.1,mode:'xz',cost:50,lvl:1,r:.6},
  bucket:  {name:'Balde',            e:'🪣',model:'bucket',size:.7,mode:'h',cost:40,lvl:1,r:.4},
  wflower: {name:'Flor branca',      e:'🌼',model:'flowerno',size:.8,mode:'h',cost:35,lvl:1,r:.4},
  scarecrow:{name:'Espantalho (+4% colheita extra, até 3)',e:'🧑‍🌾',model:'scarecrow',size:2.1,mode:'h',cost:300,lvl:5,r:.6},
  dpumpkin:{name:'Abóbora decorativa',e:'🎃',model:'pumpkin',size:.8,mode:'xz',cost:60,lvl:2,r:.5},
  haybale: {name:'Fardo de feno deitado',e:'🌾',model:'haybale',size:1.6,mode:'xz',cost:70,lvl:2,r:.8},
  pitchfork:{name:'Forcado',         e:'🔱',model:'pitchfork',size:1.5,mode:'h',cost:45,lvl:2,r:.4},
  basket:  {name:'Cesta de frutas',  e:'🧺',model:'basket',size:.8,mode:'xz',cost:60,lvl:3,r:.5},
  applecrate:{name:'Caixote de maçãs',e:'🍎',model:'applecrate',size:1.1,mode:'xz',cost:80,lvl:3,r:.6},
  fishbarrel:{name:'Barril de peixes',e:'🐟',model:'fishbarrel',size:.9,mode:'xz',cost:80,lvl:3,r:.5},
  floursack:{name:'Saco de farinha', e:'🌾',model:'floursack',size:.8,mode:'xz',cost:50,lvl:3,r:.5},
  jack:    {name:'Abóbora de Halloween',e:'🎃',model:'jack',size:.9,mode:'xz',cost:120,lvl:1,r:.5,ev:'halloween'},
  arch:    {name:'Arco de arbusto',e:'🌿',model:'d_arch',      size:2.6,mode:'h', cost:180,lvl:4,r:.9},
  bonfire: {name:'Fogueira',       e:'🔥',model:'j_fire',      size:1.6,mode:'xz',cost:200,lvl:1,r:1,ev:'junina'}
};
const WHEEL=[ // roda da sorte diária (w = peso)
  {t:'💰100',w:22,c:'#ffd35a',f:()=>coinsGain(100)},
  {t:'⭐40', w:16,c:'#8fd16a',f:()=>gainXp(40)},
  {t:'🪱+3', w:14,c:'#9ad8f5',f:()=>{S.fe+=3;}},
  {t:'💰250',w:12,c:'#ffb300',f:()=>coinsGain(250)},
  {t:'🥚×4', w:12,c:'#fff3cf',f:()=>giveItem('egg',4)},
  {t:'🍀Turbo',w:10,c:'#b6f0a0',f:()=>{let n=0;S.plots.forEach(p=>{if(p.c&&p.w){p.t=0;n++;}});if(!n)coinsGain(150);}},
  {t:'🧶×2', w:9, c:'#f2a6c8',f:()=>giveItem('wool',2)},
  {t:'💰800',w:5, c:'#ff8a65',f:()=>coinsGain(800)}
];
// conquistas: cada uma tem 4 níveis
const ACH=[
  {id:'plant',   e:'🌱',name:'Mão na terra',     txt:n=>'Plante '+n+' sementes',              tiers:[25,100,500,2000]},
  {id:'harvest', e:'🧺',name:'Colheita farta',   txt:n=>'Colha '+n+' canteiros',              tiers:[20,100,400,1500]},
  {id:'h_carrot',e:'🥕',name:'Rei da cenoura',   txt:n=>'Colha '+n+' canteiros de cenoura',   tiers:[10,50,200,800]},
  {id:'h_corn',  e:'🌽',name:'Milharal',         txt:n=>'Colha '+n+' canteiros de milho',     tiers:[10,50,200,800]},
  {id:'collect', e:'🥚',name:'Amigo dos bichos', txt:n=>'Colete '+n+' produtos de animais',   tiers:[10,50,200,800]},
  {id:'deliver', e:'🚚',name:'Caminhoneiro',     txt:n=>'Entregue '+n+' pedidos',             tiers:[5,25,100,400]},
  {id:'fish',    e:'🎣',name:'Pescador',         txt:n=>'Pesque '+n+' peixes',                tiers:[5,25,100,400]},
  {id:'rarefish',e:'🐠',name:'Peixe raro',       txt:n=>'Pesque '+n+' peixes raros',          tiers:[1,10,25,100]},
  {id:'produce', e:'🏭',name:'Industrial',       txt:n=>'Fabrique '+n+' produtos',            tiers:[5,30,150,600]},
  {id:'fruit',   e:'🍎',name:'Pomar',            txt:n=>'Colha '+n+' frutas',                 tiers:[10,60,250,1000]},
  {id:'visitor', e:'🙋',name:'Bom vizinho',      txt:n=>'Atenda '+n+' visitantes',            tiers:[3,15,50,200]},
  {id:'decor',   e:'🎨',name:'Decorador',        txt:n=>'Coloque '+n+' decorações',           tiers:[1,5,15,40]},
  {id:'wood',    e:'🪵',name:'Lenhador',         txt:n=>'Junte '+n+' madeiras',               tiers:[10,50,200,800]},
  {id:'stone',   e:'🪨',name:'Mineiro',          txt:n=>'Junte '+n+' pedras',                 tiers:[10,50,200,800]},
  {id:'shark',   e:'🦈',name:'Lenda do lago',    txt:n=>'Pesque '+n+' tubarões',              tiers:[1,3,10,25]},
  {id:'earned',  e:'💰',name:'Milionário',       txt:n=>'Ganhe 💰'+n+' no total',             tiers:[1000,10000,50000,250000]}
];
const ACH_REW=[{c:50,x:10},{c:150,x:30},{c:400,x:80},{c:1000,x:200}];
const VISITOR={lvl:3,spots:[[-9.1,3.6],[-9.1,1.2]],models:['visitor1','visitor2','visitor3','visitor4'],
  names:['Dona Rosa','Seu Zé','Lia','Tonho','Cida','Beto','Nina','Juca']};
const WEATHER_SLOT=150;   // segundos reais por "faixa" de clima
// eventos por data (ou force com ?evento=natal / ?evento=junina)
const EVENT=(()=>{const m=location.search.match(/evento=(\w+)/);if(m)return m[1]==='nenhum'?null:m[1];
  const d=new Date(),mo=d.getMonth()+1,day=d.getDate();
  if(mo===12||(mo===1&&day<=6))return'natal';if(mo===10)return'halloween';if(mo===6||mo===7)return'junina';return null;})();
// qualidade gráfica (lida antes de criar o renderizador)
const LOWQ=(()=>{try{return JSON.parse(localStorage.getItem('fazenda_feliz_v1')||'{}').q==='low';}catch(e){return false;}})();
const DAY_LEN=600;   // duração de um dia completo, em segundos reais
const ITEM=id=>CROPS[id]||PRODUCTS[id];
const COLS=6,ROWS=3,NMAIN=COLS*ROWS,NWEST=9,NPLOT=NMAIN+NWEST,PSTEP=2.35,START_PLOTS=6;
const plotCost=n=>Math.round(40*Math.pow(1.42,n-START_PLOTS)/5)*5;
const lvlNeed=l=>25*(l-1)*(l-1);           // xp total para chegar no nível l
const PEN={x0:2,x1:10.5,z0:-10,z1:-4.6};
const SAVE_KEY='fazenda_feliz_v1';

/* ---------------- ESTADO + SAVE ---------------- */
let S=null,memSave=null;
function fresh(){
  return{coins:50,xp:0,barn:1,np:START_PLOTS,plots:Array.from({length:NPLOT},()=>({c:null,w:0,t:0})),
    animals:[],inv:{},orders:[{items:{carrot:2},reward:40,xp:5},null,null,null],oready:[0,0,0,0],seen:Date.now(),tut:0,tg:0,
    fac:{},trees:Array(TREE_SLOTS.length).fill(null),fe:5,ft:Date.now(),fish2:{fe:3,ft:Date.now()},canLv:1,daily:null,
    zones:{},zclear:{},decor:[],ach:{},wheel:'',truck:1,silo:1,tools:{},helpers:{},vm:1,vs:1,market:null,train:null,album:{},albumDone:0,wild:[],wnext:0,login:{last:'',streak:0},visitors:[null,null],vnext:Date.now()+T(120),gifts:null,q:'high',
    stats:{plant:0,harvest:0,collect:0,deliver:0,sell:0,fish:0,produce:0,fruit:0,visitor:0,decor:0,earned:0,rarefish:0}};
}
function load(){
  let raw=null;
  try{raw=localStorage.getItem(SAVE_KEY);}catch(e){raw=memSave;}
  if(raw){try{const d=JSON.parse(raw);if(d&&d.plots&&d.plots.length>=NMAIN){
    const s=Object.assign(fresh(),d);
    while(s.plots.length<NPLOT)s.plots.push({c:null,w:0,t:0});      // saves antigos: completa os canteiros novos
    while(s.trees.length<TREE_SLOTS.length)s.trees.push(null);
    if(!s.visitors||s.visitors.length<2)s.visitors=[null,null];
    if(!s.fish2)s.fish2={fe:3,ft:Date.now()};if(!s.helpers)s.helpers={};if(!d.canLv)s.canLv=s.tools&&s.tools.can?2:1;
    while(s.orders.length<4)s.orders.push(null);while(s.oready.length<4)s.oready.push(0);
    if(d.tg===undefined)s.tg=(d.xp>0||d.tut>0)?99:0;          // saves antigos pulam o tutorial
    if(d.orders===undefined)s.orders=[null,null,null];
    s.stats=Object.assign(fresh().stats,d.stats||{});
    return s;}}catch(e){}}
  return fresh();
}
let saveT=0;
function save(){
  S.seen=Date.now();
  const raw=JSON.stringify(S);memSave=raw;
  try{localStorage.setItem(SAVE_KEY,raw);}catch(e){}
}
const level=()=>{let l=1;while(S.xp>=lvlNeed(l+1))l++;return l;};
const isCrop=id=>!!CROPS[id];
const stored=()=>{let n=0;for(const k in S.inv)if(!isCrop(k))n+=S.inv[k];return n;};   // celeiro
const siloUsed=()=>{let n=0;for(const k in S.inv)if(isCrop(k))n+=S.inv[k];return n;};
const cap=()=>BARN[S.barn].cap+(S.helpers&&S.helpers.donkey?60:0);
const siloCap=()=>SILO[S.silo].cap+(S.helpers&&S.helpers.donkey?40:0);
const full=(id,n)=>isCrop(id)?siloUsed()+n>siloCap():stored()+n>cap();
const fullMsg=id=>{toast(isCrop(id)?'Silo cheio! 🌾 Venda grãos ou melhore o silo':'Celeiro cheio! Venda itens ou faça upgrade 📦');SND.no();};
const have=id=>S.inv[id]||0;
function addItem(id,n){S.inv[id]=have(id)+n;if(S.inv[id]<=0)delete S.inv[id];}
const hasAll=req=>Object.keys(req).every(id=>have(id)>=req[id]);
function stat(k,n){S.stats[k]=(S.stats[k]||0)+(n||1);}
function coinsGain(c){S.coins+=c;stat('earned',c);}
function giveItem(id,n){addItem(id,n);}
function track(k,n){
  stat(k,n);
  const D=S.daily;if(!D)return;
  D.m.forEach(m=>{if(m.k===k&&m.p<m.n){m.p=Math.min(m.n,m.p+(n||1));if(m.p>=m.n){toast('📅 Missão concluída: '+missionText(m));SND.up();}}});
  hud();
}

/* ---------------- SOM ---------------- */
let AC=null;
function beep(f0,f1,d,type,vol,delay){
  if(!AC||(S&&S.sfx===0))return;
  try{
    if(AC.state==='suspended')AC.resume();
    const t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+d);
    g.gain.setValueAtTime(Math.max(.0002,(vol||.2)*vsfx()),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02);
  }catch(e){}
}
const BUF={};let musicSrc=null,musicGain=null;
function sfx(name,vol,rate){
  if(!AC||!BUF[name]||(S&&S.sfx===0))return false;
  try{
    if(AC.state==='suspended')AC.resume();
    const n=AC.createBufferSource(),g=AC.createGain();n.buffer=BUF[name];n.playbackRate.value=rate||1;g.gain.value=(vol||.6)*vsfx();
    n.connect(g);g.connect(AC.destination);n.start();return true;
  }catch(e){return false;}
}
// loops: música de dia, música de noite e chuva, misturados pelo horário e pelo clima
const LOOPS={};
function loopOn(k){
  if(!AC||!BUF[k]||LOOPS[k])return;
  try{const g=AC.createGain();g.gain.value=0;g.connect(AC.destination);
    const src=AC.createBufferSource();src.buffer=BUF[k];src.loop=true;src.connect(g);src.start();LOOPS[k]={src,g};}catch(e){}
}
function loopOff(k){const L=LOOPS[k];if(!L)return;try{L.src.stop();}catch(e){}delete LOOPS[k];}
function startMusic(){if(S&&S.mus===0)return;loopOn('music');loopOn('music_night');musicSrc=LOOPS.music||null;}
function stopMusic(){loopOff('music');loopOff('music_night');musicSrc=null;}
function mixAudio(){
  if(!AC||!S)return;
  const t=AC.currentTime,set=(k,v)=>{const L=LOOPS[k];if(L)L.g.gain.setTargetAtTime(v,t,.8);};
  const nn=typeof night==='number'?Math.min(1,Math.max(0,(night-.3)/.5)):0;
  set('music',.28*(1-nn)*vmus());set('music_night',.26*nn*vmus());
  if(S.sfx!==0&&BUF.rain){if(wx.amt>.05)loopOn('rain');set('rain',.32*wx.amt*vsfx());if(wx.amt<.02)loopOff('rain');}else loopOff('rain');
}
function loadAudio(){
  const A=window.AUDIO||{};
  Object.keys(A).forEach(k=>{
    try{AC.decodeAudioData(b64buf(A[k]),buf=>{BUF[k]=buf;if(k==='music'||k==='music_night')startMusic();},()=>{});}catch(e){}
  });
}
const SND={
  plant:()=>sfx('plant',.8)||beep(300,180,.12,'triangle',.25),
  water:()=>{beep(900,400,.18,'sine',.15);beep(700,300,.18,'sine',.12,.07);beep(1100,500,.15,'sine',.08,.13);},
  pick:()=>sfx('pick',.9,.9+Math.random()*.3)||beep(520,780,.1,'triangle',.25),
  coin:()=>sfx('coin',.7)||beep(988,1319,.16,'square',.12),
  no:()=>sfx('no',.6)||beep(200,140,.18,'sawtooth',.15),
  up:()=>sfx('up',.6)||[523,659,784,1047].forEach((f,i)=>beep(f,f,.18,'triangle',.22,i*.1)),
  animal:()=>{beep(520,760,.09,'square',.08);beep(760,560,.1,'square',.08,.1);},
  click:()=>sfx('click',.7)||beep(700,700,.03,'square',.08),
  open:()=>sfx('open',.6),close:()=>sfx('close',.6),
  deliver:()=>{sfx('deliver',.7);sfx('coin',.7);},
  splash:()=>{beep(400,120,.25,'sine',.18);beep(1200,300,.2,'triangle',.06,.05);},
  bite:()=>{beep(880,880,.08,'square',.12);beep(1175,1175,.1,'square',.12,.1);},
  chop:()=>sfx('chop',.8,.9+Math.random()*.25)||beep(220,120,.08,'square',.15),
  build:()=>{beep(180,120,.12,'square',.15);beep(220,140,.12,'square',.15,.15);beep(260,160,.12,'square',.15,.3);sfx('up',.5);}
};

/* ---------------- THREE: CENA ---------------- */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!LOWQ});
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=!LOWQ;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9fd8f5);
scene.fog=new THREE.Fog(0x9fd8f5,45,90);
const camera=new THREE.PerspectiveCamera(38,1,.5,200);
const cam={tx:-1.5,tz:.3,dist:23};
function placeCam(){
  camera.position.set(cam.tx,cam.dist*.78,cam.tz+cam.dist*.62);
  camera.lookAt(cam.tx,0,cam.tz);
}
let W=0,H=0;
function resize(){
  W=innerWidth;H=innerHeight;
  renderer.setPixelRatio(LOWQ?1:Math.min(devicePixelRatio||1,2));renderer.setSize(W,H,false);
  camera.aspect=W/H;camera.fov=W<H?52:38;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();if(W<H){cam.dist=36;cam.tx=0;cam.tz=-1;}placeCam();

const hemi=new THREE.HemisphereLight(0xffffff,0x88aa55,.62);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2d6,.85);
sun.position.set(-14,24,12);sun.castShadow=true;
sun.shadow.mapSize.set(1536,1536);
Object.assign(sun.shadow.camera,{left:-26,right:26,top:24,bottom:-24,near:1,far:80});
sun.shadow.bias=-.0015;
scene.add(sun);
// lampiões (sempre existem para não recompilar shaders; só mudam de intensidade)
const LAMPS=[[-8.6,-3.6],[-9.6,5.6],[11.4,-1.5]].map(([x,z])=>{
  const pl=new THREE.PointLight(0xffc56b,0,11,1.6);pl.position.set(x,2.4,z);if(!LOWQ)scene.add(pl);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,2.2,6),new THREE.MeshLambertMaterial({color:0x5b3b1c}));
  post.position.set(x,1.1,z);post.castShadow=true;scene.add(post);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshBasicMaterial({color:0x8a7650}));
  bulb.position.set(x,2.3,z);scene.add(bulb);
  return{pl,bulb};
});

function plane(w,h,color,x,z,y){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({color:new THREE.Color(color).convertSRGBToLinear()}));
  m.rotation.x=-Math.PI/2;m.position.set(x,y||0,z);m.receiveShadow=true;scene.add(m);return m;
}
plane(220,220,0x7fcf5a,0,0,0);

/* ---------------- MODELOS ---------------- */
const LIB={};
const manager=new THREE.LoadingManager();
manager.setURLModifier(u=>/colormap\.png$/.test(u)?MODELS_COLORMAP:u);
const loader=new THREE.GLTFLoader(manager);
function b64buf(b){const s=atob(b),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a.buffer;}
function parse(name){return new Promise((res)=>{if(!MODELS[name])return res(null);loader.parse(b64buf(MODELS[name]),'',g=>res(g),e=>{console.warn('modelo',name,e);res(null);});});}
function shadowize(o){o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});}
// instancia um modelo normalizado: base no chão, centrado, com a dimensão pedida
function fit(obj,target,mode){
  const box=new THREE.Box3().setFromObject(obj),size=box.getSize(new V3()),c=box.getCenter(new V3());
  const ref=mode==='h'?size.y:mode==='x'?size.x:mode==='z'?size.z:mode==='xz'?Math.max(size.x,size.z):Math.max(size.x,size.y,size.z);
  const s=target/(ref||1);
  obj.position.set(-c.x,-box.min.y,-c.z);
  const inner=new THREE.Group();inner.add(obj);inner.scale.setScalar(s);
  const g=new THREE.Group();g.add(inner);
  g.userData.size=size.clone().multiplyScalar(s);g.userData.raw=size;
  return g;
}
function make(name,target,mode){
  const src=LIB[name];
  if(!src){const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xcc8844}));m.position.y=.5;const g=new THREE.Group();g.add(m);g.scale.setScalar(target);g.userData.size=new V3(target,target,target);return g;}
  const o=src.scene.clone(true);shadowize(o);
  return fit(o,target,mode);
}
const STATIC=[];let recStatic=false;
function put(name,target,mode,x,z,ry){const g=make(name,target,mode);g.position.set(x,0,z);g.rotation.y=ry||0;scene.add(g);
  if(recStatic&&!/^grassblade/.test(name)){const sz=g.userData.size;STATIC.push([x,z,Math.max(.35,Math.max(sz.x,sz.z)*.45)]);}
  return g;}
function ghostify(g,on){
  g.traverse(m=>{if(m.isMesh){
    if(!m.userData.mat0){m.userData.mat0=m.material;m.userData.ghost=m.material.clone();m.userData.ghost.transparent=true;m.userData.ghost.opacity=.38;m.userData.ghost.depthWrite=false;}
    m.material=on?m.userData.ghost:m.userData.mat0;m.castShadow=!on;}});
}

/* ---------------- RÓTULOS FLUTUANTES (DOM) ---------------- */
const labelsEl=$('labels'),labels=[];
function mkLabel(pos){const el=document.createElement('div');el.className='lb';labelsEl.appendChild(el);const l={el,pos,html:''};labels.push(l);return l;}
function setLabel(l,html){if(l.html!==html){l.html=html;l.el.innerHTML=html;}}
const tmp=new V3();
function project(pos,out){
  tmp.copy(pos).project(camera);
  out.x=(tmp.x*.5+.5)*W;out.y=(-tmp.y*.5+.5)*H;out.vis=tmp.z<1;
}
const P2={x:0,y:0,vis:true};
const floats=[];
function floatText(pos,text,color){
  const el=document.createElement('div');el.className='float';el.textContent=text;if(color)el.style.color=color;
  labelsEl.appendChild(el);floats.push({el,pos:pos.clone(),t:0});
}
function toast(msg){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;$('toasts').appendChild(t);
  while($('toasts').children.length>3)$('toasts').firstChild.remove();
  setTimeout(()=>t.remove(),2800);
}
const bar=p=>'<div class="bar"><i style="width:'+Math.round(Math.min(1,Math.max(0,p))*100)+'%"></i></div>';

/* ---------------- PARTÍCULAS ---------------- */
const TEX={};
function tex(ch){
  if(TEX[ch])return TEX[ch];
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  if(ch==='dot'){const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.7)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}
  else if(ch==='drop'){const g=x.createLinearGradient(0,6,0,58);g.addColorStop(0,'#bdf0ff');g.addColorStop(1,'#2fa3e6');x.fillStyle=g;
    x.beginPath();x.moveTo(32,4);x.bezierCurveTo(50,28,52,56,32,58);x.bezierCurveTo(12,56,14,28,32,4);x.fill();
    x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.ellipse(26,40,4,8,-.3,0,Math.PI*2);x.fill();}
  else if(ch==='star'){x.fillStyle='#fff';x.beginPath();for(let i=0;i<10;i++){const r=i%2?11:30,a=i*Math.PI/5-Math.PI/2;x.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r);}x.fill();}
  else{x.font='46px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ch,32,36);}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return TEX[ch]=t;
}
const parts=[];
// o: {tex,n,color,size,spd,up,grav,life,spread,add,grow,h}
function emit(pos,o){
  const n=o.n||8;
  for(let k=0;k<n;k++){
    if(parts.length>(LOWQ?70:240))break;
    const m=new THREE.SpriteMaterial({map:tex(o.tex||'dot'),color:dflt(o.color,0xffffff),transparent:true,depthWrite:false,
      blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending});
    const s=new THREE.Sprite(m),sz=(o.size||.3)*(.7+Math.random()*.6);s.scale.set(sz,sz,1);
    const sp=dflt(o.spread,.5);
    s.position.set(pos.x+(Math.random()-.5)*sp,pos.y+(Math.random()-.5)*sp*.4,pos.z+(Math.random()-.5)*sp);
    const a=Math.random()*Math.PI*2,v=dflt(o.spd,2)*(.4+Math.random()*.6);
    scene.add(s);
    parts.push({s,vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:dflt(o.up,3)*(.6+Math.random()*.6),g:dflt(o.grav,9),life:(o.life||.9)*(.7+Math.random()*.5),t:0,sz,grow:o.grow||0});
  }
}
function updParts(dt){
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];p.t+=dt;
    p.s.position.x+=p.vx*dt;p.s.position.y+=p.vy*dt;p.s.position.z+=p.vz*dt;p.vy-=p.g*dt;
    if(p.s.position.y<.05){p.s.position.y=.05;p.vy*=-.3;p.vx*=.6;p.vz*=.6;}
    const k=p.t/p.life;p.s.material.opacity=k<.7?1:Math.max(0,1-(k-.7)/.3);
    if(p.grow){const s=p.sz*(1+p.grow*k);p.s.scale.set(s,s,1);}
    if(p.t>=p.life){scene.remove(p.s);p.s.material.dispose();parts.splice(i,1);}
  }
}
// folhas 3D caindo das árvores
const leaves=[];
function dropLeaf(x,y,z,color){
  if(leaves.length>(LOWQ?8:30)||!LIB.leaf)return;
  const m=make('leaf',.38,'max');
  m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.color.set(color).convertSRGBToLinear();o.castShadow=false;}});
  m.position.set(x,y,z);scene.add(m);
  leaves.push({m,t:0,vx:(Math.random()-.5)*.5,vz:.25+Math.random()*.35,ph:Math.random()*6,life:4+Math.random()*2});
}
function updLeaves(dt){
  for(let i=leaves.length-1;i>=0;i--){const l=leaves[i],m=l.m;l.t+=dt;
    if(m.position.y>.06){m.position.y-=dt*.75;m.position.x+=(Math.sin(l.t*2.2+l.ph)*.9+l.vx)*dt;m.position.z+=l.vz*dt;
      m.rotation.set(Math.sin(l.t*3+l.ph)*1.1,l.t*1.4+l.ph,Math.cos(l.t*2.3)*.7);}
    else{m.position.y=.06;m.rotation.x=-Math.PI/2*.1;}
    const f=Math.max(0,Math.min(1,(l.life-l.t)/1));m.traverse(o=>{if(o.isMesh)o.material.opacity=f;});
    if(l.t>=l.life){scene.remove(m);m.traverse(o=>{if(o.isMesh)o.material.dispose();});leaves.splice(i,1);}
  }
}
// respingos 3D de água no chão (regador e chuva)
const splashes=[],SPLASH=['waterdrop','waterdrop_001','waterdrop_002'];
function splashAt(x,z,sz){
  if(splashes.length>(LOWQ?5:16)||!LIB.waterdrop)return;
  const m=make(SPLASH[Math.floor(Math.random()*3)],sz||.9,'xz');
  m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.castShadow=false;}});
  m.position.set(x,.03,z);m.rotation.y=Math.random()*6;m.scale.setScalar(.2);scene.add(m);splashes.push({m,t:0});
}
function updSplashes(dt){
  for(let i=splashes.length-1;i>=0;i--){const s2=splashes[i];s2.t+=dt;
    const k=Math.min(1,s2.t/.25);s2.m.scale.setScalar(.2+.8*k);
    const f=Math.max(0,1-Math.max(0,s2.t-.5)/.6);s2.m.traverse(o=>{if(o.isMesh)o.material.opacity=f;});
    if(s2.t>1.1){scene.remove(s2.m);s2.m.traverse(o=>{if(o.isMesh)o.material.dispose();});splashes.splice(i,1);}
  }
}
let windT=0,rainSplT=0;
function updNature(dt){
  updLeaves(dt);updSplashes(dt);
  windT-=dt;
  if(windT<=0){windT=.3;
    for(let i=0;i<TREE_SLOTS.length;i++){const t=S.trees[i];if(!t||treeState(i)==='hidden')continue;
      if(Math.random()<(wx.raining?.1:.035)){const[x,z]=TREE_SLOTS[i];dropLeaf(x+(Math.random()-.5)*1.8,2.6+Math.random()*.8,z+(Math.random()-.5)*1.8,TREES[t.k].leaf);}}}
  if(wx.amt>.4&&!rain.snow){rainSplT-=dt;if(rainSplT<=0){rainSplT=LOWQ?.35:.12;splashAt(cam.tx+(Math.random()-.5)*24,cam.tz+(Math.random()-.5)*14,.7);}}
}
const FX={
  harvest:(pos,e)=>{emit(pos,{tex:'dot',n:10,color:0xa6e36b,size:.25,spd:2.5,up:4,life:.7});emit(pos,{tex:e,n:4,size:.55,spd:1.6,up:5,life:.9});},
  water:pos=>{emit(pos.clone().setY(2),{tex:'drop',n:12,size:.3,spd:.5,up:-1,grav:7,life:.55,spread:1.4});for(let k=0;k<3;k++)setTimeout(()=>splashAt(pos.x+(Math.random()-.5)*1.4,pos.z+(Math.random()-.5)*1.4,.8),250+k*90);},
  coins:pos=>emit(pos,{tex:'🪙',n:7,size:.5,spd:2,up:5,life:1}),
  sparkle:pos=>emit(pos,{tex:'star',n:12,color:0xffe066,size:.3,spd:2.5,up:3.5,grav:3,life:.9,add:true}),
  confetti:pos=>['#ff5d5d','#ffd23f','#4cd964','#5ac8fa','#c38bff'].forEach(c=>emit(pos,{tex:'dot',n:6,color:new THREE.Color(c),size:.28,spd:4,up:7,grav:8,life:1.4,spread:2})),
  smoke:pos=>emit(pos,{tex:'dot',n:1,color:0xdddddd,size:.6,spd:.25,up:.9,grav:-.15,life:2.2,spread:.3,grow:1.6}),
  splash:pos=>emit(pos,{tex:'dot',n:16,color:0x9be7ff,size:.25,spd:1.8,up:4,grav:10,life:.7,spread:.4}),
  dust:pos=>emit(pos,{tex:'dot',n:10,color:0xc9a26b,size:.5,spd:2.5,up:1.5,grav:2,life:.9,spread:2,grow:1})
};

/* ---------------- MUNDO ---------------- */
const pickables=[];
function hitBox(w,h,d,x,y,z,data){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({visible:false}));
  m.position.set(x,y,z);m.userData=data;scene.add(m);pickables.push(m);return m;
}
const plotPos=i=>{
  if(i>=NMAIN){const j=i-NMAIN;return new V3(-21.6+(j%3)*PSTEP,0,Math.floor(j/3)*PSTEP+.6);}
  const c=i%COLS,r=Math.floor(i/COLS);return new V3((c-(COLS-1)/2)*PSTEP,0,r*PSTEP+.6);};
// ordem em que os canteiros são liberados (do centro para fora)
const ORDER=Array.from({length:NMAIN},(_,i)=>i).sort((a,b)=>{
  const k=i=>Math.abs(i%COLS-(COLS-1)/2)+Math.floor(i/COLS)*1.6;return k(a)-k(b)||a-b;});
const RANK=[];ORDER.forEach((p,n)=>RANK[p]=n);
const plots=[];   // visuais
let barnGroup=null,truck=null,truckAnim=null,carpProps=[],dairyPots=[];
const animalsV=[]; // visuais dos animais
const facV={},treeV=[];
let rod=null,bobber=null,fishLine=null,pondLabel=null,pondS=null,pondSLabel=null;

function buildWorld(){
  recStatic=true;
  // estrada + caminhão
  plane(3.4,120,0xcaa26a,-12.5,0,.02);
  truck=put(TRUCKS[S.truck].model,3.5,'xz',-12.5,2.5,0);
  buildSilo();hitBox(2.4,4,2.4,-9.6,2,-9.6,{type:'silo'});
  hitBox(3.4,3,4.6,-12.5,1.5,2.5,{type:'truck'});
  // área de terra dos canteiros (+ campo oeste, que aparece ao comprar o terreno)
  plane(COLS*PSTEP+1.2,ROWS*PSTEP+1.2,0xb98a52,0,(ROWS-1)*PSTEP/2+.6,.015);
  westDirt=plane(3*PSTEP+1.2,3*PSTEP+1.2,0xb98a52,-21.6+PSTEP,PSTEP+.6,.015);
  for(let i=0;i<NPLOT;i++){
    const p=plotPos(i);
    const soil=make('soil',2.05,'xz');soil.position.copy(p);soil.position.y=.04;scene.add(soil);
    soil.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.castShadow=false;}});
    const crop=new THREE.Group();crop.position.set(p.x,.05,p.z);scene.add(crop);
    const label=mkLabel(new V3(p.x,1.5,p.z));
    hitBox(2.2,1.2,2.2,p.x,.6,p.z,{type:'plot',i});
    plots.push({soil,crop,label,kind:null,shown:''});
  }
  // celeiro
  barnGroup=new THREE.Group();barnGroup.position.set(-5.2,0,-7.2);scene.add(barnGroup);
  hitBox(6,5,5,-5.2,2.5,-7.2,{type:'barn'});
  rebuildBarn();
  // cercado dos animais
  plane(PEN.x1-PEN.x0+.4,PEN.z1-PEN.z0+.4,0xa6d96a,(PEN.x0+PEN.x1)/2,(PEN.z0+PEN.z1)/2,.02);
  fenceLine(PEN.x0,PEN.z0,PEN.x1,PEN.z0);fenceLine(PEN.x0,PEN.z1,PEN.x1,PEN.z1);
  fenceLine(PEN.x0,PEN.z0,PEN.x0,PEN.z1);fenceLine(PEN.x1,PEN.z0,PEN.x1,PEN.z1);
  put('haystackround',1.5,'xz',PEN.x1-1.2,PEN.z0+1.1,.4);
  put('bucketwooden',.6,'h',PEN.x0+.9,PEN.z0+.9,0);
  // fábricas (aparecem transparentes até serem construídas)
  plane(11,12.8,0xc9b48a,15.7,-8.6,.018);
  plane(5.2,4.2,0xc9b48a,6.6,-12.7,.018);
  carpProps=[put('woodenboxvar',.9,'xz',8.4,-11.6,.4),put('t_saw',.8,'max',8.4,-11.6,.6),put('t_hammer',.7,'max',4.6,-11.4,1.2)];
  carpProps[1].position.y=.62;carpProps[2].rotation.z=1.4;carpProps[2].position.y=.08;
  dairyPots=[put('pot1',.45,'h',16.5,-6.4,0),put('pot2',.45,'h',16.0,-6.2,.5)];
  for(const id in FACTORIES){
    const F=FACTORIES[id],g=put(F.model,F.size,F.mode,F.x,F.z,id==='dairy'?-.5:id==='oven'?-.3:.2);
    const sz=g.userData.size;
    hitBox(Math.max(2.6,sz.x),Math.max(2.4,sz.y),Math.max(2.6,sz.z),F.x,sz.y/2,F.z,{type:'fac',id});
    facV[id]={g,label:mkLabel(new V3(F.x,sz.y+.6,F.z)),h:sz.y,smokeT:0,built:null};
  }
  // árvores frutíferas
  TREE_SLOTS.forEach(([x,z],i)=>{
    const mound=make('soil',1.5,'xz');mound.position.set(x,.03,z);scene.add(mound);
    const grp=new THREE.Group();grp.position.set(x,0,z);scene.add(grp);
    hitBox(2.4,3.4,2.4,x,1.7,z,{type:'tree',i});
    treeV[i]={mound,grp,label:mkLabel(new V3(x,1.2,z)),kind:null,fruits:[],tree:null};
  });
  // lago + pesca
  put('pondscene',9,'xz',15.5,5,-.3);
  hitBox(8,1.4,7,15.5,.7,5,{type:'pond'});
  pondLabel=mkLabel(new V3(15.5,1.6,5));
  pondS=put('pond_s',4.6,'xz',PONDS.small.c.x,PONDS.small.c.z,Math.PI/2);
  hitBox(4.6,1.4,4.6,PONDS.small.c.x,.7,PONDS.small.c.z,{type:'pond',id:'small'});
  pondSLabel=mkLabel(new V3(PONDS.small.c.x,1.5,PONDS.small.c.z));
  rod=makeRod(S.tools.rod2?'fishingrod2':'fishingrod');
  bobber=new THREE.Group();
  const b1=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0xe53935}));
  const b2=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8,0,Math.PI*2,Math.PI/2,Math.PI/2),new THREE.MeshLambertMaterial({color:0xffffff}));
  bobber.add(b1,b2);bobber.position.copy(FISH.bob);bobber.visible=false;scene.add(bobber);
  fishLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(),new V3()]),new THREE.LineBasicMaterial({color:0xffffff}));
  fishLine.visible=false;fishLine.frustumCulled=false;scene.add(fishLine);
  // decoração
  put('mailbox',1.3,'h',-9.8,6.2,Math.PI/2);
  put('cart',2.2,'xz',-9.5,-3.5,.6);
  put('haystackthin',1.6,'xz',-1,-6.2,.3);
  put('woodenbox',.9,'xz',-1.6,-4.8,.5);put('barrel',1,'h',-8.6,-5.2,0);
  put('benchlittle',1.6,'xz',-9.6,9.3,Math.PI/2);
  put('wateringcan_001',.8,'h',-8,.3,.8);
  put('woodenbox',.8,'xz',11.2,-11.8,.2);
  const deco=[['bushesgreen',2.2,-16.5,-6],['bushesyellow',2,-17.4,8.6],
    ['bushesgreen',2.3,11.5,12.5],['bushesyellow',2,-11.5,12.6],['rocks',1.6,-15.5,12],['rocks_003',1.3,9.6,-14.4],['rocks',1.2,18,12],['bushesgreen',2.6,21,1],
    ['flowerstack',.9,-8.7,7.4],['flowerstack',.9,8.8,7.8],['flower',.7,-5,11.6],['flower',.7,0,11.8],['flower',.7,5,11.6],['flowerstack',.8,-2.2,-10.5]];
  deco.forEach((d,i)=>put(d[0],d[1],d[0].startsWith('flower')?'h':'xz',d[2],d[3],i*1.3));
  buildZones();buildEvent();rain.init();rainbow.init();buildTown();buildRails();buildVehicles();buildDisplay();
  [[-8.6,-3.6,.4],[-9.6,5.6,.4],[11.4,-1.5,.4]].forEach(l=>STATIC.push(l));recStatic=false;
  S.decor.forEach((d,i)=>spawnDecor(i));
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<46;i++){
    const x=rnd()*52-26,z=rnd()*40-18;
    if(Math.abs(x)<8.5&&z>-1.5&&z<8)continue;if(x>PEN.x0-1&&x<PEN.x1+1&&z>PEN.z0-1&&z<PEN.z1+1)continue;
    if(Math.abs(x+12.5)<2.4)continue;if(x<-1&&x>-9.5&&z<-4&&z>-10.5)continue;if(x>8.5&&z>0&&z<9.5)continue;
    if(x>10&&z<-1.5&&z>-15.5)continue;if(x<-8&&x>-11.2&&z<-8&&z>-11.4)continue;if(x<-15.8&&z<-2.6&&z>-9)continue;if(z>14.2||z<-16.8)continue;if(x>4&&x<9.2&&z<-10.4)continue;if(Math.abs(x)<9.5&&z>8.5&&z<12)continue;if(x<-14.6&&z>-1.8&&z<7.6)continue;if(x>-11&&x<5&&z<-12)continue;
    put(rnd()<.5?'grassblade_001':'grassblade_002',.45+rnd()*.3,'h',x,z,rnd()*6);
  }
}
function fenceLine(x0,z0,x1,z1){
  const len=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(len/1.7)),seg=len/n,alongX=Math.abs(x1-x0)>Math.abs(z1-z0);
  for(let i=0;i<n;i++){
    const f=make('fencemiddle',seg,'xz');
    const rawLongX=f.userData.raw.x>=f.userData.raw.z;
    f.rotation.y=(alongX===rawLongX)?0:Math.PI/2;
    const t=(i+.5)/n;f.position.set(x0+(x1-x0)*t,0,z0+(z1-z0)*t);scene.add(f);
  }
}
function rebuildBarn(){
  while(barnGroup.children.length)barnGroup.remove(barnGroup.children[0]);
  const b=make('barnlvl'+Math.min(3,S.barn),4.6+Math.min(S.barn,4)*.5,'xz');barnGroup.add(b);
  barnGroup.userData.h=b.userData.size.y;
}

/* ---------------- FAZENDEIRO ---------------- */
const farmer={obj:null,mixer:null,acts:{},cur:null,tx:-3,tz:6.4,act:null,face:null,busy:0,idleT:3};
async function spawnFarmer(){
  const g=await parse('farmer');if(!g)return;
  shadowize(g.scene);farmer.obj=fit(g.scene,1.55,'h');farmer.obj.position.set(-3,0,6.4);scene.add(farmer.obj);
  rod.position.set(-.32,.55,.25);rod.rotation.set(1.05,0,0);farmer.obj.add(rod);
  farmer.hand=new THREE.Group();farmer.hand.position.set(-.34,.62,.22);farmer.hand.rotation.set(.9,0,0);farmer.obj.add(farmer.hand);
  farmer.mixer=new THREE.AnimationMixer(g.scene);
  g.animations.forEach(c=>farmer.acts[c.name]=farmer.mixer.clipAction(c));
  ['pick-up','attack-melee-right'].forEach(n=>{const a=farmer.acts[n];if(a){a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true;}});
  fplay('idle');
}
function fplay(name){
  if(farmer.cur===name||!farmer.acts[name])return;
  const n=farmer.acts[name];n.reset().fadeIn(.15).play();
  if(farmer.cur&&farmer.acts[farmer.cur])farmer.acts[farmer.cur].fadeOut(.15);
  farmer.cur=name;
}
// manda o fazendeiro ir até um ponto; act = animação ao chegar; face = ponto para olhar
function goFarmer(x,z,act,face){farmer.tx=x;farmer.tz=z;farmer.act=act||'pick-up';farmer.face=face||null;farmer.idleT=8+Math.random()*6;}
function updFarmer(dt){
  if(!farmer.obj)return;
  farmer.mixer.update(dt);
  const o=farmer.obj,dx=farmer.tx-o.position.x,dz=farmer.tz-o.position.z,d=Math.hypot(dx,dz);
  if(d>.12){
    const sp=(d>6?5.2:3.4)*(S.helpers.horse?1.5:1);
    o.position.x+=dx/d*Math.min(d,sp*dt);o.position.z+=dz/d*Math.min(d,sp*dt);
    turn(o,Math.atan2(dx,dz),dt);fplay(d>6?'sprint':'walk');farmer.busy=0;
  }else{
    if(farmer.face)turn(o,Math.atan2(farmer.face.x-o.position.x,farmer.face.z-o.position.z),dt);
    if(farmer.act){if(farmer.cur===farmer.act&&farmer.acts[farmer.act])farmer.acts[farmer.act].reset().play();fplay(farmer.act);farmer.busy=(farmer.act==='pick-up'||farmer.act==='attack-melee-right')?1.1:0;farmer.act=null;}
    else if(farmer.busy>0){farmer.busy-=dt;if(farmer.busy<=0)fplay('idle');}
    else if(fishing.st==='off'){
      farmer.idleT-=dt;if(farmer.cur!=='idle')fplay('idle');
      if(farmer.idleT<=0){ // passeia pela fazenda
        const spots=[[-3,6.4],[3,6.4],[-7.5,2],[-7.6,-3],[1,-3],[6,-3.6],[-1,8.2]];const s=spots[Math.floor(Math.random()*spots.length)];
        goFarmer(s[0],s[1],'idle');farmer.idleT=8+Math.random()*8;
      }
    }
  }
}
function turn(o,want,dt){let diff=want-o.rotation.y;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;o.rotation.y+=diff*Math.min(1,dt*8);}

/* ---------------- CANTEIROS ---------------- */
function plotState(i){
  const p=S.plots[i],r=RANK[i];
  if(i>=NMAIN){if(!S.zones.west)return'hidden';}
  else if(r>S.np)return'hidden';
  else if(r===S.np)return'next';
  if(!p.c)return'empty';
  if(!p.w)return'dry';
  return(Date.now()-p.t>=T(CROPS[p.c].time))?'ready':'grow';
}
function plotProg(i){const p=S.plots[i];return Math.min(1,(Date.now()-p.t)/T(CROPS[p.c].time));}
function refreshPlot(i){
  const v=plots[i],p=S.plots[i],st=plotState(i);
  v.soil.visible=st!=='hidden';
  v.soil.traverse(m=>{if(m.isMesh){m.material.transparent=st==='next';m.material.opacity=st==='next'?.45:1;
    const k=(p.w&&p.c)?.62:1;m.material.color.setRGB(k,k,k);}});
  if(v.kind!==p.c){
    while(v.crop.children.length)v.crop.remove(v.crop.children[0]);
    v.kind=p.c;
    if(p.c){
      const C=CROPS[p.c];
      [[-.48,-.48],[.48,-.48],[-.48,.48],[.48,.48]].forEach((o,k)=>{
        const m=make(C.model,C.h,'h');m.position.set(o[0],0,o[1]);m.rotation.y=k*1.7+i;v.crop.add(m);});
    }
  }
}
let rowMode=false;
const rowOf=i=>i<NMAIN?'m'+Math.floor(i/COLS):'w'+Math.floor((i-NMAIN)/3);
const fieldOf=i=>i<NMAIN?'m':'w';
function waterRow(i){
  rowMode=true;let n=0;const L=canLv(),r=rowOf(i),f=fieldOf(i);
  for(let k=0;k<NPLOT;k++){const same=L>=4||(L>=3?fieldOf(k)===f:rowOf(k)===r);if(same&&plotState(k)==='dry'){tapPlot(k);n++;}}
  rowMode=false;if(n)runTractor(i);showTool(CANS[L].model,1.2);if(n>1)floatText(plotPos(i).setY(1.6),'💧 ×'+n);
}
function upgradeCan(){
  const L=canLv(),N=CANS[L+1];if(!N)return;
  if(level()<N.lvl){toast('🔒 Libera no nível '+N.lvl);SND.no();return;}
  if(S.coins<N.cost){toast('Faltam 💰'+(N.cost-S.coins));SND.no();return;}
  S.coins-=N.cost;S.canLv=L+1;SND.build();showTool(N.model,1.6);toast('💧 '+N.name+'! '+N.desc);hud();save();
}
function harvestRow(i){
  rowMode=true;let n=0;const r=rowOf(i);
  for(let k=0;k<NPLOT;k++)if(rowOf(k)===r&&plotState(k)==='ready'){const c=S.plots[k].c;if(full(c,4)){fullMsg(c);break;}tapPlot(k);n++;}
  rowMode=false;if(n)runTractor(i);showTool('t_shovel',1);
}
function tapPlot(i){
  const st=plotState(i),p=S.plots[i],pos=plotPos(i);pos.y=1.2;
  if(st==='hidden')return;
  if(st!=='next'&&!rowMode)goFarmer(pos.x,pos.z+1.45,'pick-up',pos);
  if(st==='next'){
    const c=plotCost(S.np);
    if(S.coins<c){toast('Faltam 💰'+(c-S.coins)+' para liberar este canteiro');SND.no();return;}
    S.coins-=c;S.np++;floatText(pos,'-'+c+' 💰','#ffd9d9');SND.up();FX.dust(pos.clone().setY(.3));toast('Novo canteiro liberado! 🌱');
    refreshAll();save();return;
  }
  if(st==='empty'){
    if(!seedOpen){openSeeds();if(!selSeed)return;}
    if(!selSeed){toast('Escolha uma semente abaixo 👇');return;}
    const C=CROPS[selSeed];
    if(S.coins<C.cost){toast('Moedas insuficientes para '+C.name);SND.no();return;}
    S.coins-=C.cost;p.c=selSeed;p.w=0;p.t=0;floatText(pos,'-'+C.cost+' 💰','#ffd9d9');SND.plant();
    emit(pos.clone().setY(.3),{tex:'dot',n:6,color:0x8b5a2b,size:.25,spd:1.5,up:2.5,life:.5});
    refreshPlot(i);track('plant');save();
    return;
  }
  if(st==='dry'){
    if(canLv()>=2&&!rowMode){waterRow(i);return;}
    p.w=1;p.t=Date.now();if(canLv()>=4)p.t-=T(CROPS[p.c].time)*.1;
    if(!rowMode)showTool(CANS[canLv()].model,1);
    if(S.tg===1)p.t=Date.now()-(T(CROPS[p.c].time)-4000);   // tutorial: a primeira cresce rápido
    SND.water();FX.water(pos);refreshPlot(i);save();
    return;
  }
  if(st==='grow'){const s=Math.ceil((T(CROPS[p.c].time)-(Date.now()-p.t))/1000);toast(CROPS[p.c].e+' pronto em '+fmt(s));return;}
  if(st==='ready'){
    if(full(p.c,4)){fullMsg(p.c);return;}
    if(S.tools.shovel&&!rowMode){harvestRow(i);return;}
    const C=CROPS[p.c],n=2+(rainbowOn()?1:0)+(EVENT==='junina'&&p.c==='corn'?2:0)+(EVENT==='halloween'&&p.c==='pumpkin'?2:0)+(Math.random()<scareChance()?1:0);
    addItem(p.c,n);gainXp(C.xp);floatText(pos,'+'+n+' '+C.e+(n>2?' ✨':''));SND.pick();FX.harvest(pos.clone().setY(.8),C.e);
    stat('h_'+p.c);p.c=null;p.w=0;p.t=0;refreshPlot(i);track('harvest');save();
  }
}
const fmt=s=>{s=Math.max(0,Math.round(s));return s>=3600?Math.floor(s/3600)+'h'+String(Math.floor(s%3600/60)).padStart(2,'0')+'m':s>=60?Math.floor(s/60)+'m'+String(s%60).padStart(2,'0')+'s':s+'s';};
const fmtT=sec=>fmt(sec/DEV);   // tempo de jogo mostrado em tempo real

/* ---------------- ANIMAIS ---------------- */
const aTime=a=>T(ANIMALS[a.k].time)*(a.k==='cow'&&S.helpers.bull?.75:1);
function animalState(a){
  if(!a.f)return'hungry';
  return(Date.now()-a.f>=aTime(a))?'ready':'busy';
}
async function spawnAnimal(idx){
  const a=S.animals[idx],A=ANIMALS[a.k];
  const g=await parse(A.model);
  let obj,mixer=null,acts={};
  if(g){
    shadowize(g.scene);obj=fit(g.scene,A.h,'h');
    mixer=new THREE.AnimationMixer(g.scene);
    g.animations.forEach(c=>acts[c.name]=mixer.clipAction(c));aliasActs(acts);
  }else obj=make('__none',A.h,'h');
  obj.position.set(PEN.x0+1+Math.random()*(PEN.x1-PEN.x0-2),0,PEN.z0+1+Math.random()*(PEN.z1-PEN.z0-2));
  scene.add(obj);
  const hit=hitBox(1.7,2,1.7,obj.position.x,1,obj.position.z,{type:'animal',idx});
  const v={obj,mixer,acts,cur:null,hit,label:mkLabel(new V3()),tx:obj.position.x,tz:obj.position.z,wait:Math.random()*2,eat:0,idx};
  animalsV[idx]=v;play(v,'idle');
}
function play(v,name){
  if(v.cur===name||!v.acts[name])return;
  const n=v.acts[name];n.reset().fadeIn(.2).play();
  if(v.cur&&v.acts[v.cur])v.acts[v.cur].fadeOut(.2);
  v.cur=name;
}
function updAnimal(v,dt){
  if(!v)return;
  const a=S.animals[v.idx],A=ANIMALS[a.k],o=v.obj;
  if(v.mixer)v.mixer.update(dt);
  if(v.eat>0){v.eat-=dt;play(v,'eat');}
  else{
    const dx=v.tx-o.position.x,dz=v.tz-o.position.z,d=Math.hypot(dx,dz);
    if(d>.08){
      const sp=a.k==='chick'?1.1:.7;
      o.position.x+=dx/d*sp*dt;o.position.z+=dz/d*sp*dt;
      turn(o,Math.atan2(dx,dz),dt*.75);play(v,'walk');
    }else{
      play(v,'idle');v.wait-=dt*(night>.6?.25:1);    // à noite andam menos
      if(v.wait<=0){v.wait=1.5+Math.random()*4;v.tx=PEN.x0+.9+Math.random()*(PEN.x1-PEN.x0-1.8);v.tz=PEN.z0+.9+Math.random()*(PEN.z1-PEN.z0-1.8);}
    }
  }
  v.hit.position.set(o.position.x,1,o.position.z);
  v.label.pos.set(o.position.x,A.h+.75,o.position.z);
  const st=animalState(a);
  if(st==='hungry')setLabel(v.label,'<span class="bub">'+(have('feed')?'🥫×1':CROPS[A.food].e+'×'+A.feed)+'</span>');
  else if(st==='ready')setLabel(v.label,'<span class="bub go">'+PRODUCTS[A.prod].e+'</span>');
  else setLabel(v.label,bar((Date.now()-a.f)/aTime(a)));
}
function tapAnimal(idx){
  const a=S.animals[idx],A=ANIMALS[a.k],v=animalsV[idx];if(!v)return;
  const pos=v.obj.position.clone();pos.y=A.h+.6;
  goFarmer(Math.min(PEN.x1-.5,Math.max(PEN.x0+.5,pos.x)),PEN.z1+.9,'pick-up',pos);
  const st=animalState(a);
  if(st==='hungry'){
    if(have('feed')>=1){addItem('feed',-1);floatText(pos,'-1 🥫');}
    else if(have(A.food)>=A.feed){addItem(A.food,-A.feed);floatText(pos,'-'+A.feed+' '+CROPS[A.food].e);}
    else{const F=CROPS[A.food];toast(A.name+' precisa de '+A.feed+' '+F.e+' '+F.name.toLowerCase()+' (ou 1 🥫 ração)');SND.no();return;}
    a.f=Date.now();v.eat=2.2;SND.animal();emit(pos,{tex:'💕',n:3,size:.45,spd:.6,up:2,grav:0,life:1});hud();save();return;
  }
  if(st==='busy'){toast(A.e+' '+PRODUCTS[A.prod].name+' em '+fmt(Math.ceil((aTime(a)-(Date.now()-a.f))/1000)));return;}
  const an=A.n||1;if(full(A.prod,an)){fullMsg(A.prod);return;}
  const P=PRODUCTS[A.prod];addItem(A.prod,an);gainXp(P.xp*an);a.f=0;floatText(pos,'+'+an+' '+P.e);SND.pick();FX.harvest(pos,P.e);track('collect');save();
}

/* ---------------- FÁBRICAS ---------------- */
const facOf=id=>S.fac[id];
const facLv=id=>(S.fac[id]&&S.fac[id].lv)||1;
const facSlots=id=>FACTORIES[id].slots+facLv(id)-1;
function facDone(id){const f=facOf(id);return f?f.q.filter(j=>Date.now()>=j.end).length:0;}
function facState(id){
  const F=FACTORIES[id],f=facOf(id);
  if(!f)return level()<F.lvl?'locked':'buy';
  if(facDone(id))return'ready';
  return f.q.length?'work':'idle';
}
function refreshFac(id){
  const v=facV[id],built=!!facOf(id),F=FACTORIES[id],lv=facLv(id);
  if(id==='carp')carpProps.forEach(o=>o.visible=built);if(id==='dairy')dairyPots.forEach(o=>o.visible=built);
  if(built&&v.lv!==lv){
    v.lv=lv;
    if(F.lvModels&&F.lvModels[lv-1]!==(v.mname||F.model)){
      v.mname=F.lvModels[lv-1];scene.remove(v.g);v.g=put(F.lvModels[lv-1],F.size*(lv>1?1.08:1),F.mode,F.x,F.z,v.g.rotation.y);v.built=null;v.h=v.g.userData.size.y;v.label.pos.y=v.h+.6;
    }
    v.mlv=lv;v.sc=F.lvModels?1:1+(lv-1)*.1;
  }
  if(v.built!==built){v.built=built;ghostify(v.g,!built);}
}
function upgradeFac(id){
  const f=facOf(id),L=facLv(id);if(!f||L>=3)return;
  const u=facUpCost(id,L);
  if(level()<u.lvl){toast('🔒 Melhoria libera no nível '+u.lvl);SND.no();return;}
  if(!canPay(u.c,u.w,u.st)){toast('Faltam recursos: '+wsHtml(u.c,u.w,u.st));SND.no();return;}
  pay(u.c,u.w,u.st);f.lv=L+1;refreshFac(id);SND.build();
  const F=FACTORIES[id];FX.confetti(new V3(F.x,facV[id].h,F.z));FX.dust(new V3(F.x,.4,F.z));
  toast('⬆️ '+F.name+' nível '+f.lv+'! +1 vaga e mais rápido');hud();save();
}
function tapFac(id){
  const F=FACTORIES[id],st=facState(id),v=facV[id];
  goFarmer(F.x-1.2,F.z+2.4,st==='ready'?'pick-up':'idle',new V3(F.x,0,F.z));
  if(st==='locked'){toast(F.e+' '+F.name+' libera no nível '+F.lvl);SND.no();return;}
  if(st==='ready'){collectFac(id);return;}
  openPanel('fac',id);
}
function buildFac(id){
  const F=FACTORIES[id];if(facOf(id)||level()<F.lvl)return;
  if(S.coins<F.cost){toast('Faltam 💰'+(F.cost-S.coins));SND.no();return;}
  S.coins-=F.cost;S.fac[id]={q:[]};refreshFac(id);SND.build();
  const p=new V3(F.x,1,F.z);FX.dust(p.clone().setY(.4));FX.confetti(p.clone().setY(facV[id].h));
  toast(F.e+' '+F.name+' construído!');hud();save();
}
function startRecipe(id,r){
  const F=FACTORIES[id],f=facOf(id),R=RECIPES[r];if(!f)return;
  if(f.q.length>=facSlots(id)){toast('Fila cheia (máx. '+facSlots(id)+')');SND.no();return;}
  if(!hasAll(R.in)){toast('Faltam ingredientes');SND.no();return;}
  for(const k in R.in)addItem(k,-R.in[k]);
  const start=f.q.length?Math.max(Date.now(),f.q[f.q.length-1].end):Date.now();
  const dur=T(R.time*FAC_SPEED[facLv(id)]);
  f.q.push({r,end:start+dur,dur});SND.click();
  floatText(new V3(F.x,facV[id].h,F.z),PRODUCTS[r].e+' ⏳');hud();save();
}
function collectFac(id){
  const f=facOf(id),F=FACTORIES[id];if(!f)return;
  const pos=new V3(F.x,facV[id].h*.8,F.z);let got=0,isFull=false;
  while(f.q.length&&Date.now()>=f.q[0].end){
    const j=f.q[0],R=RECIPES[j.r];
    if(full(j.r,R.n)){isFull=true;break;}
    f.q.shift();addItem(j.r,R.n);gainXp(PRODUCTS[j.r].xp);floatText(pos,'+'+R.n+' '+PRODUCTS[j.r].e);FX.harvest(pos,PRODUCTS[j.r].e);got++;
  }
  if(got){SND.pick();track('produce',got);}
  // a fila continua a partir de agora se o celeiro estava cheio
  if(isFull)fullMsg('egg');
  hud();save();
}
function updFacs(dt){
  for(const id in FACTORIES){
    const v=facV[id],st=facState(id),F=FACTORIES[id];
    if(st==='work'){v.smokeT-=dt;if(v.smokeT<=0){v.smokeT=.35;FX.smoke(new V3(F.x+(id==='oven'?.3:0),v.h*.85,F.z));}
      const s=1+Math.sin(time*9)*.012,k=v.sc||1;v.g.scale.set(k/s,k*s,k/s);}
    else{const k=v.sc||1;v.g.scale.set(k,k,k);}
  }
}
function facLabel(id){
  const F=FACTORIES[id],st=facState(id),f=facOf(id);
  if(st==='locked')return'<span class="bub lock">🔒 '+F.name+' · Nv '+F.lvl+'</span>';
  if(st==='buy')return'<span class="bub lock">'+F.e+' Construir 💰'+F.cost+'</span>';
  if(st==='ready')return'<span class="bub go">'+PRODUCTS[f.q[0].r].e+' ×'+facDone(id)+'</span>';
  if(st==='work'){const j=f.q[0],R=RECIPES[j.r];return'<span class="bub sm">'+PRODUCTS[j.r].e+(facLv(id)>1?' '+'⭐'.repeat(facLv(id)-1):'')+'</span>'+bar(1-(j.end-Date.now())/(j.dur||T(R.time)));}
  return'<span class="bub sm">'+F.e+' 💤</span>';
}

/* ---------------- ÁRVORES FRUTÍFERAS ---------------- */
function treeState(i){
  if(i>=4&&!S.zones.north)return'hidden';
  const t=S.trees[i];
  if(!t)return level()<4?'locked':'empty';
  return Date.now()-t.t>=T(TREES[t.k].time)?'ready':'grow';
}
const treeProg=i=>Math.min(1,(Date.now()-S.trees[i].t)/T(TREES[S.trees[i].k].time));
function refreshTree(i){
  const v=treeV[i],t=S.trees[i],k=t?t.k:null;
  v.mound.visible=!k&&treeState(i)!=='hidden';
  const rr=t&&t.rare?1:0;
  if(v.kind===k&&v.rare===rr)return;
  v.kind=k;v.rare=rr;while(v.grp.children.length)v.grp.remove(v.grp.children[0]);v.fruits=[];v.tree=null;
  if(!k)return;
  const TR=TREES[k],tr=make('tree',3.4,'h');
  tr.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.metalness=0;m.material.roughness=1;
    if(/leaf/i.test(m.material.name))m.material.color.set(TR.leaf).convertSRGBToLinear();}});
  v.grp.add(tr);v.tree=tr;
  const h=tr.userData.size.y;
  for(let n=0;n<6;n++){
    const a=n/6*Math.PI*2+.3,r=.85+(n%2)*.25,f=make(rr&&TR.rare?TR.rare:TR.fruit,.42,'max');
    f.position.set(Math.cos(a)*r,h*.5+(n%3)*.32,Math.sin(a)*r+.35);v.grp.add(f);v.fruits.push(f);
  }
}
function tapTree(i){
  const st=treeState(i),[x,z]=TREE_SLOTS[i],pos=new V3(x,3,z);
  if(st==='hidden')return;
  goFarmer(x,z-1.6,st==='ready'?'pick-up':'idle',new V3(x,0,z));
  if(st==='locked'){toast('🌳 Árvores frutíferas liberam no nível 4');SND.no();return;}
  if(st==='empty'){openPanel('trees',i);return;}
  const t=S.trees[i],TR=TREES[t.k];
  if(st==='grow'){toast(PRODUCTS[TR.fruit].e+' frutas em '+fmt(Math.ceil((T(TR.time)-(Date.now()-t.t))/1000)));return;}
  const fid=t.rare&&TR.rare?TR.rare:TR.fruit;
  if(full(fid,TR.n)){fullMsg(fid);return;}
  addItem(fid,TR.n);gainXp(PRODUCTS[fid].xp*TR.n);t.t=Date.now();
  floatText(pos,'+'+TR.n+' '+PRODUCTS[fid].e,t.rare?'#ffe066':null);SND.pick();FX.harvest(pos,PRODUCTS[fid].e);
  if(t.rare){toast('✨ Colheita rara: '+PRODUCTS[fid].name+'!');FX.sparkle(pos);}
  t.rare=TR.rare&&Math.random()<.15?1:0;refreshTree(i);
  for(let k=0;k<7;k++)dropLeaf(x+(Math.random()-.5)*2,2.4+Math.random(),z+(Math.random()-.5)*2,TR.leaf);
  track('fruit',TR.n);save();
}
function plantTree(i,k){
  const TR=TREES[k];if(S.trees[i]||level()<TR.lvl)return;
  if(S.coins<TR.cost){toast('Faltam 💰'+(TR.cost-S.coins));SND.no();return;}
  S.coins-=TR.cost;S.trees[i]={k,t:Date.now()};refreshTree(i);SND.plant();FX.sparkle(new V3(TREE_SLOTS[i][0],1.5,TREE_SLOTS[i][1]));
  toast('🌳 '+TR.name+' plantada!');closePanel();hud();save();
}
function updTrees(dt){
  for(let i=0;i<TREE_SLOTS.length;i++){
    const v=treeV[i],st=treeState(i);
    if(v.tree){
      const p=treeProg(i);
      v.fruits.forEach((f,n)=>{const s=Math.max(.001,Math.min(1,p*1.25-n*.04));f.scale.setScalar(s);f.visible=p>.15;});
      v.tree.rotation.z=Math.sin(time*1.3+i)*.012;
    }
    let html='';
    if(st==='locked'&&i===0)html='<span class="bub lock">🔒 🌳 Nv 4</span>';
    else if(st==='empty')html='<span class="bub lock">🌳 +</span>';
    else if(st==='ready'){const t=S.trees[i],TR=TREES[t.k];html='<span class="bub go">'+PRODUCTS[t.rare&&TR.rare?TR.rare:TR.fruit].e+'</span>';}
    else if(st==='grow')html=bar(treeProg(i));
    v.label.pos.y=st==='empty'||st==='locked'?1.2:3.8;
    setLabel(v.label,html);
  }
}

/* ---------------- PESCA ---------------- */
const fishing={st:'off',t:0,bite:0};
function regenOne(o,P){
  const R=T(P.regen);
  if(o.fe>=P.max){o.ft=Date.now();return;}
  while(o.fe<P.max&&Date.now()-o.ft>=R){o.fe++;o.ft+=R;}
  if(o.fe>=P.max)o.ft=Date.now();
}
function regenFish(){regenOne(S,{regen:PONDS.big.regen,max:pondMax('big')});regenOne(S.fish2,PONDS.small);}
function tapPond(id){
  id=id||'big';
  if(level()<FISH.lvl){toast('🎣 Pesca libera no nível '+FISH.lvl);SND.no();return;}
  if(id!==curPond){if(fishing.st==='wait'||fishing.st==='bite')return pull();stopFishing();curPond=id;bobber.position.copy(FISH.bob);}
  if(fishing.st==='off'||fishing.st==='end'){castLine();return;}
  pull();
}
function castLine(){
  regenFish();
  if(PE().fe<1){toast('Sem iscas 🪱. Próxima em '+fmt(Math.ceil((T(FISH.regen)-(Date.now()-PE().ft))/1000)));SND.no();showFishBar();return;}
  if(full('fish',1)){fullMsg('fish');return;}
  PE().fe--;fishing.st='wait';fishing.t=1.8+Math.random()*3.5;
  goFarmer(FISH.spot.x,FISH.spot.z,'idle',FISH.bob);
  closeSeeds();bobber.visible=true;bobber.position.copy(FISH.bob);
  FX.splash(FISH.bob);SND.splash();showFishBar();save();
}
function pull(){
  if(fishing.st==='wait'){fishing.st='end';toast('Cedo demais! O peixe fugiu 🐟💨');SND.no();endFish();return;}
  if(fishing.st!=='bite')return;
  fishing.st='end';
  const pro=!!S.tools.rod2||(curPond==='big'&&!!S.tools.boat),r=Math.random();
  // lago pequeno: sem tubarão, mais carpas
  const id=curPond==='small'?(r<.05?'bone':r<(pro?.2:.14)?'rarefish':r<.62?'carp':'fish')
    :(r<(pro?.03:.01)?'shark':r<(pro?.07:.09)?'bone':r<(pro?.29:.24)?'rarefish':r<(pro?.5:.44)?'carp':'fish');
  const rare=id==='rarefish'||id==='shark';
  const isNew=!S.album[id];S.album[id]=(S.album[id]||0)+1;
  if(isNew)setTimeout(()=>toast('📖 Novo no álbum de peixes: '+ALBUM.find(a=>a.id===id).e+' '+ALBUM.find(a=>a.id===id).name),900);
  if(id==='bone'){gainXp(1);toast('🦴 Só veio um peixe-osso! 😂');SND.no();FX.splash(bobber.position);}
  else{const P=PRODUCTS[id];
    addItem(id,1);gainXp(P.xp);track('fish');if(id==='rarefish')stat('rarefish');if(id==='shark'){stat('shark');toast('🦈 UM TUBARÃO! Peixe lendário!');FX.confetti(bobber.position.clone().setY(1));}
    SND.pick();FX.splash(bobber.position);
    floatText(bobber.position.clone().setY(1.4),'+1 '+P.e+(rare?' Raro!':''),rare?'#ffe066':null);}
  // peixe pulando para fora d'água
  const f=make({fish:'fish',rarefish:'fish2',carp:'fish3',shark:'shark',bone:'fishbone'}[id],id==='shark'?1.5:.8,'max');f.position.copy(bobber.position);scene.add(f);
  jumps.push({o:f,t:0,from:bobber.position.clone(),to:farmer.obj?farmer.obj.position.clone().setY(1):FISH.spot.clone()});
  if(rare)FX.sparkle(bobber.position.clone().setY(1));
  endFish();save();
}
const jumps=[];
function endFish(){bobber.visible=false;fishLine.visible=false;showFishBar();}
function stopFishing(){fishing.st='off';rod.visible=false;bobber.visible=false;fishLine.visible=false;$('fishbar').style.display='none';}
function showFishBar(){
  regenFish();
  const fb=$('fishbar');fb.style.display='flex';
  let msg,btn;
  if(fishing.st==='wait'){msg='Esperando o peixe morder…';btn='<button class="bt big off" data-f="pull">🎣 Puxar!</button>';}
  else if(fishing.st==='bite'){msg='❗ Mordeu! Puxe agora!';btn='<button class="bt big" data-f="pull">🎣 Puxar!</button>';}
  else{msg=PE().fe?'Lance a linha no lago':'Sem iscas. Próxima em '+fmt(Math.ceil((T(FISH.regen)-(Date.now()-PE().ft))/1000));
    btn='<button class="bt big"'+(PE().fe?'':' disabled')+' data-f="cast">🎣 Lançar</button>';}
  const h='<div class="fx"><b>🪱 '+PE().fe+'/'+FISH.max+'</b> · '+msg+'</div>'+btn+'<button class="bt red" data-f="x">✕</button>';
  if(fb.dataset.h!==h){fb.dataset.h=h;fb.innerHTML=h;}
}
$('fishbar').addEventListener('pointerdown',e=>{
  const b=e.target.closest('[data-f]');if(!b||b.disabled)return;e.preventDefault();
  initAudio();const f=b.dataset.f;
  if(f==='x')stopFishing();else if(f==='cast')castLine();else pull();
});
function updFishing(dt){
  if(fishing.st==='off')return;
  if(fishing.st==='wait'){
    if(rod.visible)fishing.t-=dt;      // só começa a contar quando o fazendeiro chega
    bobber.position.y=FISH.bob.y+Math.sin(time*3)*.03;
    if(Math.random()<dt*1.2)bobber.position.x=FISH.bob.x+(Math.random()-.5)*.05;
    if(fishing.t<=0){fishing.st='bite';fishing.bite=S.tools.rod2?2:1.25;SND.bite();FX.splash(bobber.position);if(navigator.vibrate)try{navigator.vibrate(80);}catch(e){}showFishBar();}
  }else if(fishing.st==='bite'){
    fishing.bite-=dt;bobber.position.y=FISH.bob.y-.12+Math.sin(time*30)*.06;
    if(fishing.bite<=0){fishing.st='end';toast('O peixe escapou! 🐟💨');SND.no();endFish();}
  }
  if(fishLine.visible&&rod.visible){
    const tip=rod.userData.tip.getWorldPosition(new V3());
    const pa=fishLine.geometry.attributes.position;pa.setXYZ(0,tip.x,tip.y,tip.z);pa.setXYZ(1,bobber.position.x,bobber.position.y+.1,bobber.position.z);pa.needsUpdate=true;
  }
  if(farmer.obj)rod.visible=Math.hypot(farmer.obj.position.x-FISH.spot.x,farmer.obj.position.z-FISH.spot.z)<.6;
  fishLine.visible=rod.visible&&bobber.visible;
  if(fishing.st==='bite')setLabel(curPond==='small'?pondSLabel:pondLabel,'<span class="bub go big">❗</span>');
}
function updJumps(dt){
  for(let i=jumps.length-1;i>=0;i--){
    const j=jumps[i];j.t+=dt*1.4;const k=Math.min(1,j.t);
    j.o.position.lerpVectors(j.from,j.to,k);j.o.position.y+=Math.sin(k*Math.PI)*2.4;j.o.rotation.z+=dt*12;
    if(k>=1){scene.remove(j.o);jumps.splice(i,1);}
  }
}

/* ---------------- XP / HUD ---------------- */
function gainXp(n){
  const l0=level();S.xp+=n;const l1=level();
  if(l1>l0){
    SND.up();toast('⭐ Nível '+l1+'!');
    const c=farmer.obj?farmer.obj.position.clone().setY(2):new V3(0,2,3);FX.confetti(c);
    Object.values(CROPS).forEach(c=>{if(c.lvl===l1)toast('Nova semente liberada: '+c.e+' '+c.name);});
    if(UNLOCKS[l1])toast(UNLOCKS[l1]);
    if(seedOpen)renderSeeds();
  }
  hud();
}
function hud(){
  $('coins').textContent=S.coins;
  const l=level(),a=lvlNeed(l),b=lvlNeed(l+1);
  $('lvl').textContent=l;$('xpbar').style.width=Math.round((S.xp-a)/(b-a)*100)+'%';
  $('stor').textContent=stored()+'/'+cap()+' · 🌾'+siloUsed()+'/'+siloCap();
  const n=S.orders.filter(o=>o&&canDeliver(o)).length;
  $('dotOrders').style.display=n?'block':'none';$('dotOrders').textContent=n;
  const m=S.daily?S.daily.m.filter(x=>x.p>=x.n&&!x.c).length+(S.daily.m.every(x=>x.c)&&!S.daily.b?1:0):0;
  $('dotMis').style.display=m?'block':'none';$('dotMis').textContent=m;
  const mn=(S.wheel!==today()?1:0)+achClaimable()+(loginPending()?1:0);
  $('dotMenu').style.display=mn?'block':'none';$('dotMenu').textContent=mn;
  if(panel&&panel!=='orders'&&panel!=='fac'&&panel!=='menu'&&!(panel==='wheel'&&spinning))renderPanel();
  if(seedOpen)renderSeeds();
}
function refreshAll(){for(let i=0;i<NPLOT;i++)refreshPlot(i);for(const id in FACTORIES)refreshFac(id);for(let i=0;i<TREE_SLOTS.length;i++)refreshTree(i);hud();}

/* ---------------- SEMENTES ---------------- */
let seedOpen=false,selSeed='carrot';
function openSeeds(){seedOpen=true;$('seedbar').style.display='flex';renderSeeds();}
function closeSeeds(){seedOpen=false;$('seedbar').style.display='none';}
function renderSeeds(){
  const l=level();
  if(selSeed&&CROPS[selSeed].lvl>l)selSeed=null;
  let h='';
  for(const id in CROPS){const C=CROPS[id],locked=C.lvl>l;
    h+='<button class="seed'+(selSeed===id?' sel':'')+(locked||S.coins<C.cost?' off':'')+'" data-seed="'+id+'"'+(locked?' disabled':'')+'><b>'+C.e+'</b>'+
      (locked?'🔒 Nível '+C.lvl:C.name+'<br>💰'+C.cost+' · '+fmtT(C.time))+'</button>';}
  h+='<button class="seed x" data-seed="">✕</button>';
  if($('seedbar').dataset.h!==h){$('seedbar').dataset.h=h;$('seedbar').innerHTML=h;}
}
$('seedbar').addEventListener('click',e=>{
  const b=e.target.closest('[data-seed]');if(!b)return;
  initAudio();SND.click();
  if(!b.dataset.seed){closeSeeds();return;}
  selSeed=b.dataset.seed;renderSeeds();toast('Toque nos canteiros vazios para plantar '+CROPS[selSeed].e);
});

/* ---------------- PEDIDOS (CAMINHÃO) ---------------- */
function orderPool(){
  const l=level(),pool=[];
  for(const id in CROPS)if(CROPS[id].lvl<=l)pool.push(id);
  const kinds=new Set(S.animals.map(a=>a.k));
  for(const k in ANIMALS)if(kinds.has(k))pool.push(ANIMALS[k].prod);
  const fruitOk=id=>{for(const k in TREES)if(TREES[k].fruit===id)return S.trees.some(t=>t&&t.k===k);return true;};
  for(const id in FACTORIES)if(facOf(id))FACTORIES[id].recipes.forEach(r=>{if(r!=='feed'&&Object.keys(RECIPES[r].in).every(fruitOk))pool.push(r);});
  S.trees.forEach(t=>{if(t&&pool.indexOf(TREES[t.k].fruit)<0)pool.push(TREES[t.k].fruit);});
  if(l>=FISH.lvl)pool.push('fish');
  return pool;
}
function genOrder(){
  const l=level(),pool=orderPool();
  const n=Math.min(pool.length,1+(Math.random()<.6?1:0)+(l>=4&&Math.random()<.4?1:0)),items={};
  let val=0;
  for(let i=0;i<n;i++){
    const id=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    const goods=RECIPES[id]&&id!=='flour';
    const q=goods?1+(Math.random()<.3?1:0):PRODUCTS[id]?1+Math.floor(Math.random()*3):Math.min(10,2+Math.floor(Math.random()*(3+l)));
    items[id]=q;val+=ITEM(id).sell*q;
  }
  return{items,reward:Math.round(val*(EVENT?1.7:1.5)*TRUCKS[S.truck].mult/5)*5+10,xp:Math.max(4,Math.round(val/9))};
}
const canDeliver=o=>hasAll(o.items);
function tickOrders(){
  let ch=false;
  for(let i=0;i<TRUCKS[S.truck].orders;i++)if(!S.orders[i]&&Date.now()>=S.oready[i]){S.orders[i]=genOrder();ch=true;}
  if(ch){hud();save();}
}
function deliver(i){
  const o=S.orders[i];if(!o||!canDeliver(o))return;
  for(const id in o.items)addItem(id,-o.items[id]);
  coinsGain(o.reward);gainXp(o.xp);S.orders[i]=null;S.oready[i]=Date.now()+T(S.helpers.horse?30:60);
  SND.deliver();toast('Pedido entregue! +💰'+o.reward+' +⭐'+o.xp);
  floatText(new V3(-12.5,3,2.5),'+'+o.reward+' 💰','#fff2a8');FX.coins(new V3(-12.5,2.6,2.5));
  goFarmer(-10.3,2.5,'pick-up',new V3(-12.5,0,2.5));
  if(!truckAnim)truckAnim={t:0};
  track('deliver');save();
}

/* ---------------- MISSÕES DIÁRIAS ---------------- */
const MISSIONS={
  plant:  {e:'🌱',n:[6,10,16],  txt:n=>'Plante '+n+' sementes'},
  harvest:{e:'🧺',n:[5,8,14],   txt:n=>'Colha '+n+' canteiros'},
  collect:{e:'🥚',n:[3,5,8],    txt:n=>'Colete '+n+' produtos de animais',ok:()=>S.animals.length>0},
  deliver:{e:'🚚',n:[2,3,5],    txt:n=>'Entregue '+n+' pedidos'},
  sell:   {e:'💰',n:[80,200,450],txt:n=>'Ganhe 💰'+n+' vendendo no celeiro'},
  fish:   {e:'🎣',n:[3,5,8],    txt:n=>'Pesque '+n+' peixes',ok:()=>level()>=FISH.lvl},
  produce:{e:'🏭',n:[2,4,6],    txt:n=>'Fabrique '+n+' produtos',ok:()=>Object.keys(S.fac).length>0},
  fruit:  {e:'🍎',n:[3,6,9],    txt:n=>'Colha '+n+' frutas',ok:()=>S.trees.some(t=>t)},
  visitor:{e:'🙋',n:[1,2,4],    txt:n=>'Atenda '+n+' visitante'+(n>1?'s':''),ok:()=>level()>=VISITOR.lvl}
};
const missionText=m=>MISSIONS[m.k].txt(m.n);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
function checkDaily(){
  const day=today();
  if(S.daily&&S.daily.day===day)return;
  const l=level(),dif=l<4?0:l<8?1:2;
  const keys=Object.keys(MISSIONS).filter(k=>!MISSIONS[k].ok||MISSIONS[k].ok());
  const m=[];
  while(m.length<3&&keys.length){const k=keys.splice(Math.floor(Math.random()*keys.length),1)[0];
    m.push({k,n:MISSIONS[k].n[dif],p:0,c:0,coins:25+l*12+dif*20,xp:8+l*3});}
  S.daily={day,m,b:0};
  if(S.tg>=TUT.length)toast('📅 Novas missões diárias!');
  hud();save();
}
function claimMission(i){
  const m=S.daily.m[i];if(!m||m.c||m.p<m.n)return;
  m.c=1;coinsGain(m.coins);gainXp(m.xp);SND.deliver();FX.coins(farmer.obj?farmer.obj.position.clone().setY(2):new V3(0,2,3));
  toast('Recompensa: +💰'+m.coins+' +⭐'+m.xp);hud();save();
}
function claimChest(){
  const D=S.daily;if(!D||D.b||!D.m.every(x=>x.c))return;
  const l=level(),c=80+l*30,x=20+l*6;
  D.b=1;coinsGain(c);gainXp(x);SND.up();FX.confetti(farmer.obj?farmer.obj.position.clone().setY(2):new V3(0,2,3));
  toast('🎁 Baú diário: +💰'+c+' +⭐'+x);hud();save();
}

/* ---------------- PAINÉIS ---------------- */
let panel=null,panelArg=null,resetArm=false;
function openPanel(p,arg){SND.open();panel=p;panelArg=arg;resetArm=false;$('modal').style.display='flex';$('body').scrollTop=0;renderPanel();}
function closePanel(){if(panel)SND.close();panel=null;$('modal').style.display='none';}
function needHtml(req,mult){let s='';for(const id in req){const q=req[id]*(mult||1),ok=have(id)>=q;s+='<span class="need '+(ok?'ok':'no')+'">'+ITEM(id).e+' '+have(id)+'/'+q+'</span>';}return s;}
function renderPanel(){
  let h='';
  if(panel==='barn'){
    $('ttl').textContent='📦 Celeiro e 🌾 Silo';
    h+='<div class="sub">📦 Celeiro (nv '+S.barn+'): '+stored()+' / '+cap()+' · 🌾 Silo (nv '+S.silo+'): '+siloUsed()+' / '+siloCap()+'. Toque para vender.</div>';
    const ids=Object.keys(S.inv).sort((a,b)=>(isCrop(b)?1:0)-(isCrop(a)?1:0));
    if(!ids.length)h+='<div class="row"><div class="tx">Vazio. Colha plantações ou colete produtos dos animais.</div></div>';
    ids.forEach(id=>{const I=ITEM(id),n=have(id);
      h+='<div class="row"><div class="ic">'+I.e+'</div><div class="tx"><b>'+I.name+' ×'+n+'</b><br>💰'+I.sell+' cada</div>'+
        '<button class="bt alt" data-act="sell1" data-id="'+id+'">Vender 1</button><button class="bt" data-act="sellall" data-id="'+id+'">Tudo 💰'+(I.sell*n)+'</button></div>';});
    h+=upgradeRow()+siloRow();
  }else if(panel==='shop'){
    $('ttl').textContent='🛒 Loja';
    const B=BARN[S.barn];
    h+='<div class="sub">Animais: '+S.animals.length+' / '+B.animals+'. Comem 🌾 trigo ou 🥕 cenoura (ou 🥫 ração do moinho).</div>';
    for(const k in ANIMALS){const A=ANIMALS[k],P=PRODUCTS[A.prod],lockL=level()<A.lvl,lock=A.barn>S.barn,full=S.animals.length>=B.animals;
      h+='<div class="row"><div class="ic">'+A.e+'</div><div class="tx"><b>'+A.name+'</b><br>Come '+A.feed+CROPS[A.food].e+' → '+P.e+' '+P.name+' (💰'+P.sell+') em '+fmtT(A.time)+'</div>'+
        '<button class="bt" data-act="buy" data-id="'+k+'"'+(lockL||lock||full||S.coins<A.cost?' disabled':'')+'>'+(lockL?'🔒 Nível '+A.lvl:lock?'🔒 Celeiro '+A.barn:full?'Lotado':'💰'+A.cost)+'</button></div>';}
    h+=upgradeRow();
    for(const id in FACTORIES){const F=FACTORIES[id],own=facOf(id),lock=level()<F.lvl;
      h+='<div class="row"><div class="ic">'+F.e+'</div><div class="tx"><b>'+F.name+'</b><br>'+F.recipes.map(r=>PRODUCTS[r].e).join(' ')+'</div>'+
        (own?'<button class="bt alt" data-act="gofac" data-id="'+id+'">Abrir</button>':
        '<button class="bt" data-act="build" data-id="'+id+'"'+(lock||S.coins<F.cost?' disabled':'')+'>'+(lock?'🔒 Nível '+F.lvl:'💰'+F.cost)+'</button>')+'</div>';}
    h+='<div class="row"><div class="ic">🐾</div><div class="tx"><b>Ajudantes</b><br>Cachorro, burro, touro e cavalo</div><button class="bt alt" data-act="open" data-id="helpers">Ver</button></div>';
    h+='<div class="sub" style="margin-top:8px">🧰 Ferramentas</div>';
    {const L=canLv(),N=CANS[L+1];
      h+='<div class="row"><div class="ic">💧</div><div class="tx"><b>'+CANS[L].name+' (nível '+L+')</b><br>'+CANS[L].desc+(N?'<br>Próximo: <b>'+N.name+'</b> · '+N.desc:'')+'</div>'+
        (N?'<button class="bt" data-act="canup"'+(level()<N.lvl||S.coins<N.cost?' disabled':'')+'>'+(level()<N.lvl?'🔒 Nível '+N.lvl:'💰'+N.cost)+'</button>':'<span class="done">✅</span>')+'</div>';}
    for(const k in TOOLS){const TL=TOOLS[k],own=S.tools[k],lock=level()<TL.lvl;
      h+='<div class="row"><div class="ic">'+TL.e+'</div><div class="tx"><b>'+TL.name+'</b><br>'+TL.desc+'</div>'+
        (own?'<span class="done">✅</span>':'<button class="bt" data-act="tool" data-id="'+k+'"'+(lock||S.coins<TL.cost?' disabled':'')+'>'+(lock?'🔒 Nível '+TL.lvl:'💰'+TL.cost)+'</button>')+'</div>';}
    h+='<div class="row"><div class="ic">🌱</div><div class="tx"><b>Novos canteiros</b><br>Toque no canteiro com 🔒 na fazenda. Próximo: '+(S.np<NPLOT?'💰'+plotCost(S.np):'todos liberados')+'</div></div>';
    h+='<div class="row"><div class="ic">🗑️</div><div class="tx"><b>Recomeçar</b><br>Apaga o progresso salvo neste aparelho.</div><button class="bt red" data-act="reset">'+(resetArm?'Confirmar?':'Apagar')+'</button></div>';
  }else if(panel==='orders'){
    $('ttl').textContent='🚚 Pedidos';
    h+='<div class="sub">Entregue pedidos para ganhar mais do que vendendo no celeiro.</div>';
    const TK=TRUCKS[S.truck],NT=TRUCKS[S.truck+1];
    if(NT){const lock=level()<NT.lvl;h+='<div class="row chest"><div class="ic">🚜</div><div class="tx"><b>Trocar o caminhão → nível '+(S.truck+1)+'</b><br>'+NT.orders+' pedidos'+(NT.mult>1?' · pagam +'+Math.round((NT.mult-1)*100)+'%':'')+(lock?' · 🔒 Nv '+NT.lvl:'')+'</div>'+
      '<button class="bt alt" data-act="truckup"'+(!lock&&canPay(NT.cost,NT.w,NT.st)?'':' disabled')+'>'+wsHtml(NT.cost,NT.w,NT.st)+'</button></div>';}
    for(let i=0;i<TK.orders;i++){const o=S.orders[i];
      if(!o){h+='<div class="row"><div class="ic">⏳</div><div class="tx">Novo pedido em '+fmt(Math.max(1,Math.ceil((S.oready[i]-Date.now())/1000)))+'</div></div>';continue;}
      h+='<div class="row"><div class="ic">📋</div><div class="tx">'+needHtml(o.items)+'<br><b>💰'+o.reward+'</b> · ⭐'+o.xp+'</div>'+
        '<button class="bt" data-act="deliver" data-id="'+i+'"'+(canDeliver(o)?'':' disabled')+'>Entregar</button>'+
        (S.tg<TUT.length?'':'<button class="bt red" data-act="skip" data-id="'+i+'">✕</button>')+'</div>';}
  }else if(panel==='fac'){
    const id=panelArg,F=FACTORIES[id],f=facOf(id);
    $('ttl').textContent=F.e+' '+F.name;
    if(!f){
      h+='<div class="sub">Construa para transformar seus produtos em itens mais valiosos.</div>';
      F.recipes.forEach(r=>{const R=RECIPES[r];h+='<div class="row"><div class="ic">'+PRODUCTS[r].e+'</div><div class="tx"><b>'+PRODUCTS[r].name+(R.n>1?' ×'+R.n:'')+'</b><br>'+needHtml(R.in)+'</div></div>';});
      h+='<div class="row"><div class="ic">🏗️</div><div class="tx"><b>Construir '+F.name+'</b></div><button class="bt" data-act="build" data-id="'+id+'"'+(S.coins<F.cost?' disabled':'')+'>💰'+F.cost+'</button></div>';
    }else{
      const L=facLv(id);
      h+='<div class="sub">Nível '+L+' · Fila: '+f.q.length+' / '+facSlots(id)+'. A produção continua mesmo com o jogo fechado.</div>';
      if(L<3){const u=facUpCost(id,L);h+='<div class="row chest"><div class="ic">⬆️</div><div class="tx"><b>Melhorar para nível '+(L+1)+'</b><br>+1 vaga na fila e '+Math.round((1-FAC_SPEED[L+1])*100)+'% mais rápido'+(level()<u.lvl?' · 🔒 Nv '+u.lvl:'')+'</div>'+
        '<button class="bt alt" data-act="facup" data-id="'+id+'"'+(level()>=u.lvl&&canPay(u.c,u.w,u.st)?'':' disabled')+'>'+wsHtml(u.c,u.w,u.st)+'</button></div>';}
      f.q.forEach((j,n)=>{const R=RECIPES[j.r],left=(j.end-Date.now())/1000,dur=j.dur||T(R.time),start=j.end-dur,run=Date.now()>=start;
        h+='<div class="row q"><div class="ic">'+PRODUCTS[j.r].e+'</div><div class="tx"><b>'+PRODUCTS[j.r].name+'</b><br>'+
          (left<=0?'✅ Pronto!':run?bar((Date.now()-start)/dur)+' '+fmt(Math.ceil(left)):'Na fila')+'</div>'+
          (left<=0&&n===0?'<button class="bt alt" data-act="collect" data-id="'+id+'">Coletar</button>':'')+'</div>';});
      F.recipes.forEach(r=>{const R=RECIPES[r],ok=hasAll(R.in);
        h+='<div class="row"><div class="ic">'+PRODUCTS[r].e+'</div><div class="tx"><b>'+PRODUCTS[r].name+(R.n>1?' ×'+R.n:'')+'</b> · 💰'+PRODUCTS[r].sell+' · '+fmtT(R.time*FAC_SPEED[L])+'<br>'+needHtml(R.in)+'</div>'+
          '<button class="bt" data-act="make" data-id="'+id+'" data-r="'+r+'"'+(ok&&f.q.length<facSlots(id)?'':' disabled')+'>Fazer</button></div>';});
    }
  }else if(panel==='trees'){
    $('ttl').textContent='🌳 Plantar árvore';
    h+='<div class="sub">Árvores dão frutas para sempre, sem replantar.</div>';
    for(const k in TREES){const TR=TREES[k],lock=level()<TR.lvl,P=PRODUCTS[TR.fruit];
      h+='<div class="row"><div class="ic">'+P.e+'</div><div class="tx"><b>'+TR.name+'</b><br>'+TR.n+' '+P.e+' (💰'+P.sell+') a cada '+fmtT(TR.time)+'</div>'+
        '<button class="bt" data-act="tree" data-id="'+k+'"'+(lock||S.coins<TR.cost?' disabled':'')+'>'+(lock?'🔒 Nível '+TR.lvl:'💰'+TR.cost)+'</button></div>';}
  }else if(panel==='menu'){
    $('ttl').textContent='☰ Menu';
    if(window.HHCloud)h+=HHCloud.row();
    const wheelOk=S.wheel!==today(),achN=achClaimable();
    h+='<div class="row"><div class="ic">🎡</div><div class="tx"><b>Roda da sorte</b><br>'+(wheelOk?'Giro grátis disponível!':'Volte amanhã para girar de novo')+'</div><button class="bt alt" data-act="open" data-id="wheel">'+(wheelOk?'Girar':'Ver')+'</button></div>';
    h+='<div class="row"><div class="ic">📅</div><div class="tx"><b>Bônus diário</b><br>'+(loginPending()?'Pronto para pegar! Sequência: '+nextStreak()+' dia(s)':'Volte amanhã · sequência de '+S.login.streak+' dia(s)')+'</div><button class="bt alt" data-act="open" data-id="login">Ver</button></div>';
    h+='<div class="row"><div class="ic">📖</div><div class="tx"><b>Álbum de peixes</b><br>'+ALBUM.filter(a=>S.album[a.id]).length+' / '+ALBUM.length+' descobertos</div><button class="bt alt" data-act="open" data-id="album">Abrir</button></div>';
    h+='<div class="row"><div class="ic">🏆</div><div class="tx"><b>Conquistas</b><br>'+(achN?achN+' recompensa'+(achN>1?'s':'')+' para pegar':'Objetivos de longo prazo')+'</div><button class="bt alt" data-act="open" data-id="ach">Abrir</button></div>';
    h+='<div class="row"><div class="ic">🎨</div><div class="tx"><b>Decorar</b><br>Compre enfeites e posicione onde quiser</div><button class="bt alt" data-act="open" data-id="decor">Loja</button><button class="bt" data-act="edit">'+(editMode?'Parar':'✋ Mover')+'</button></div>';
    h+='<div class="row"><div class="ic">🗺️</div><div class="tx"><b>Terrenos</b><br>Expanda a fazenda</div><button class="bt alt" data-act="open" data-id="zones">Ver</button></div>';
    h+='<div class="row"><div class="ic">📖</div><div class="tx"><b>Guia da fazenda</b><br>Plantas, animais, fábricas, receitas e ferramentas</div><button class="bt alt" data-act="guide">Abrir</button></div>';
    h+='<div class="row"><div class="ic">❓</div><div class="tx"><b>Como jogar</b><br>O básico em 6 cartões</div><button class="bt alt" data-act="howto">Ver</button></div>';
    h+='<div class="row"><div class="ic">🎵</div><div class="tx"><b>Volume da música</b><input class="vol" type="range" min="0" max="100" value="'+Math.round(vmus()*100)+'" data-vol="vm"></div><span class="vv">'+Math.round(vmus()*100)+'%</span></div>';
    h+='<div class="row"><div class="ic">🔊</div><div class="tx"><b>Volume dos efeitos</b><input class="vol" type="range" min="0" max="100" value="'+Math.round(vsfx()*100)+'" data-vol="vs"></div><span class="vv">'+Math.round(vsfx()*100)+'%</span></div>';
    h+='<div class="row"><div class="ic">⚙️</div><div class="tx"><b>Qualidade gráfica: '+(LOWQ?'Baixa':'Alta')+'</b><br>Baixa = sem sombras, mais leve e gasta menos bateria. O jogo recarrega.</div><button class="bt" data-act="quality">'+(LOWQ?'Usar alta':'Usar baixa')+'</button></div>';
    if(EVENT){const EI={natal:['🎄','Evento de Natal','Presentes pela fazenda todo dia, decorações de Natal e pedidos valendo mais.'],junina:['🌽','Festa Junina','Milho rende em dobro, fogueira na loja de decoração e pedidos valendo mais.'],halloween:['🎃','Halloween','Abóboras rendem em dobro, abóboras iluminadas e pedidos valendo mais.']}[EVENT];if(EI)h+='<div class="row chest"><div class="ic">'+EI[0]+'</div><div class="tx"><b>'+EI[1]+'</b><br>'+EI[2]+'</div></div>';}
  }else if(panel==='market'){
    const M=marketToday();$('ttl').textContent='🏪 Mercado da cidade';
    h+='<div class="sub">Ofertas de hoje: o mercado paga mais caro que o celeiro, mas compra uma quantidade limitada. Muda todo dia.</div>';
    M.deals.forEach((D,k)=>{const I=ITEM(D.id),pr=Math.round(I.sell*D.mult);
      h+='<div class="row'+(D.left?'':' q')+'"><div class="ic">'+I.e+'</div><div class="tx"><b>'+I.name+'</b> · 💰'+pr+' cada <small>(celeiro: '+I.sell+')</small><br>Compra mais '+D.left+' · você tem '+have(D.id)+'</div>'+
        '<button class="bt alt" data-act="mk1" data-id="'+k+'"'+(D.left&&have(D.id)?'':' disabled')+'>Vender 1</button><button class="bt" data-act="mkall" data-id="'+k+'"'+(D.left&&have(D.id)?'':' disabled')+'>Tudo</button></div>';});
  }else if(panel==='train'){
    const T0=trainToday();$('ttl').textContent='🚂 Trem de carga';
    if(!T0){h+='<div class="sub">O trem passa a partir do nível '+TRAIN.lvl+'.</div>';}
    else{h+='<div class="sub">Encha os 3 vagões até o fim do dia. Cada vagão paga na hora, e completar o trem dá um bônus de 30%.</div>';
      T0.slots.forEach((sl,k)=>{const I=ITEM(sl.id);
        h+='<div class="row'+(sl.done?' q':'')+'"><div class="ic">🚃</div><div class="tx"><b>Vagão '+(k+1)+': '+I.e+' '+I.name+' ×'+sl.q+'</b><br>'+(sl.done?'✅ Carregado':needHtml({[sl.id]:sl.q})+' · 💰'+sl.rew)+'</div>'+
          (sl.done?'':'<button class="bt" data-act="wagon" data-id="'+k+'"'+(have(sl.id)>=sl.q?'':' disabled')+'>Carregar</button>')+'</div>';});
      if(T0.paid)h+='<div class="row chest"><div class="ic">🎉</div><div class="tx"><b>Trem completo!</b><br>Volta amanhã com novos pedidos.</div></div>';}
  }else if(panel==='helpers'){
    $('ttl').textContent='🐾 Ajudantes';
    h+='<div class="sub">Bichos que ajudam na fazenda. Não precisam de comida.</div>';
    for(const k in HELPERS){const H=HELPERS[k],own=S.helpers[k],lock=level()<H.lvl;
      h+='<div class="row"><div class="ic">'+H.e+'</div><div class="tx"><b>'+H.name+'</b><br>'+H.desc+'</div>'+
        (own?'<span class="done">✅</span>':'<button class="bt" data-act="helper" data-id="'+k+'"'+(lock||S.coins<H.cost?' disabled':'')+'>'+(lock?'🔒 Nível '+H.lvl:'💰'+H.cost)+'</button>')+'</div>';}
  }else if(panel==='album'){
    $('ttl').textContent='📖 Álbum de peixes';
    h+='<div class="sub">Pesque todos para ganhar 💰'+ALBUM_REWARD+'. A 🎣 vara pro aumenta a chance dos raros.</div>';
    ALBUM.forEach(a=>{const n=S.album[a.id]||0;
      h+='<div class="row"><div class="ic" style="'+(n?'':'filter:brightness(0);opacity:.35')+'">'+a.e+'</div><div class="tx"><b>'+(n?a.name:'???')+'</b><br>'+(n?'Pescado '+n+'×':'Ainda não pescado')+'</div></div>';});
    const all=ALBUM.every(a=>S.album[a.id]);
    h+='<div class="row chest"><div class="ic">🎁</div><div class="tx"><b>Álbum completo</b><br>'+(S.albumDone?'Recompensa recebida!':all?'Pronto!':'Falta descobrir '+ALBUM.filter(a=>!S.album[a.id]).length)+'</div>'+(S.albumDone?'':'<button class="bt" data-act="album"'+(all?'':' disabled')+'>💰'+ALBUM_REWARD+'</button>')+'</div>';
  }else if(panel==='login'){
    $('ttl').textContent='📅 Bônus diário';
    const pend=loginPending(),st=pend?nextStreak():S.login.streak,cur=(st-1)%7;
    h+='<div class="sub">Entre todo dia para aumentar a sequência. Se pular um dia, volta para o 1º.</div><div class="days">';
    LOGIN.forEach((L,i)=>{const done=i<cur||(i===cur&&!pend),now=i===cur&&pend;
      h+='<div class="day'+(done?' got':'')+(now?' now':'')+'"><small>Dia '+(i+1)+'</small><b>'+L.t+'</b>'+(done?'<i>✅</i>':'')+'</div>';});
    h+='</div><div style="text-align:center;margin:10px"><button class="bt big" data-act="login"'+(pend?'':' disabled')+'>'+(pend?'Pegar '+LOGIN[cur].t:'Volte amanhã')+'</button></div>';
  }else if(panel==='wheel'){
    $('ttl').textContent='🎡 Roda da sorte';
    const ok=S.wheel!==today();
    let g='',lb='';const n=WHEEL.length,a=360/n;
    WHEEL.forEach((w,i)=>{g+=w.c+' '+(i*a)+'deg '+((i+1)*a)+'deg,';
      lb+='<span style="transform:translate(-50%,-50%) rotate('+(i*a+a/2)+'deg) translateY(-74px)">'+w.t+'</span>';});
    h+='<div class="sub">Um giro grátis por dia.</div><div class="wheelbox"><div class="ptr">▼</div><div class="wheel" id="wheel" style="background:conic-gradient('+g.slice(0,-1)+');transform:rotate('+wheelRot+'deg)">'+lb+'</div></div>';
    h+='<div style="text-align:center;margin:10px"><button class="bt big" data-act="spin"'+(ok&&!spinning?'':' disabled')+'>'+(ok?'Girar!':'Volte amanhã')+'</button></div>';
  }else if(panel==='ach'){
    $('ttl').textContent='🏆 Conquistas';
    h+='<div class="sub">Cada conquista tem 4 níveis ⭐</div>';
    ACH.forEach(A=>{const t=S.ach[A.id]||0,done=t>=4,goal=A.tiers[Math.min(3,t)],v=S.stats[A.id]||0,can=!done&&v>=goal;
      h+='<div class="row'+(can?' chest':'')+'"><div class="ic">'+A.e+'</div><div class="tx"><b>'+A.name+' '+'⭐'.repeat(t)+'<span style="opacity:.25">'+'⭐'.repeat(4-t)+'</span></b><br>'+
        (done?'Completa!':A.txt(goal)+' '+bar(v/goal)+' '+Math.min(v,goal)+'/'+goal)+'</div>'+
        (done?'<span class="done">🏆</span>':'<button class="bt alt" data-act="ach" data-id="'+A.id+'"'+(can?'':' disabled')+'>💰'+ACH_REW[t].c+'</button>')+'</div>';});
  }else if(panel==='decor'){
    $('ttl').textContent='🎨 Decorações';
    h+='<div class="sub">Compre e toque no chão para posicionar. Cada enfeite dá ⭐ XP. Para mudar de lugar: Menu → ✋ Mover.</div>';
    for(const k in DECOR){const D=DECOR[k];if(D.ev&&D.ev!==EVENT)continue;const lock=level()<D.lvl;
      h+='<div class="row'+(D.ev?' chest':'')+'"><div class="ic">'+D.e+'</div><div class="tx"><b>'+D.name+'</b>'+(D.ev?'<br>Especial de '+(D.ev==='natal'?'Natal':'Festa Junina'):'')+'</div>'+
        '<button class="bt" data-act="decor" data-id="'+k+'"'+(lock||S.coins<D.cost?' disabled':'')+'>'+(lock?'🔒 Nível '+D.lvl:'💰'+D.cost)+'</button></div>';}
  }else if(panel==='zones'){
    $('ttl').textContent='🗺️ Terrenos';
    h+='<div class="sub">Limpe novas áreas para crescer a fazenda.</div>';
    for(const id in ZONES){const Z=ZONES[id],own=S.zones[id],lock=level()<Z.lvl;
      h+='<div class="row"><div class="ic">'+Z.e+'</div><div class="tx"><b>'+Z.name+'</b><br>'+Z.desc+'</div>'+
        (own?'<span class="done">✅</span><button class="bt alt" data-act="look" data-id="'+id+'">Ver</button>':'<button class="bt alt" data-act="look" data-id="'+id+'">Ver</button><button class="bt" data-act="zone" data-id="'+id+'"'+(lock||S.coins<zoneCost(id)?' disabled':'')+'>'+(lock?'🔒 Nível '+Z.lvl:'💰'+zoneCost(id))+'</button>')+'</div>';}
    h+='<div class="sub">Dica: limpe o mato e as pedras do terreno com 🪓 machado e ⛏️ picareta para deixar a compra até 60% mais barata.</div>';
  }else if(panel==='visitor'){
    const v=S.visitors[panelArg];
    if(!v){closePanel();return;}
    $('ttl').textContent='🙋 '+v.name;
    const id=Object.keys(v.req)[0],q=v.req[id],ok=have(id)>=q;
    h+='<div class="row"><div class="ic">💬</div><div class="tx"><b>"'+v.say+'"</b><br>Quer: '+needHtml(v.req)+'<br>Paga: <b>💰'+v.reward+'</b> · ⭐'+v.xp+'<br><small>Vai embora em '+fmt(Math.ceil((v.until-Date.now())/1000))+'</small></div></div>';
    h+='<div style="display:flex;gap:8px;justify-content:center;margin:6px 0"><button class="bt big" data-act="serve"'+(ok?'':' disabled')+'>Entregar '+ITEM(id).e+'×'+q+'</button><button class="bt red" data-act="dismiss">Dispensar</button></div>';
  }else if(panel==='missions'){
    checkDaily();
    $('ttl').textContent='📅 Missões de hoje';
    h+='<div class="sub">Novas missões todo dia. Complete as 3 para abrir o baú 🎁</div>';
    S.daily.m.forEach((m,i)=>{const M=MISSIONS[m.k];
      h+='<div class="row"><div class="ic">'+M.e+'</div><div class="tx"><b>'+missionText(m)+'</b><br>'+bar(m.p/m.n)+' '+m.p+'/'+m.n+' · 💰'+m.coins+' ⭐'+m.xp+'</div>'+
        (m.c?'<span class="done">✅</span>':'<button class="bt alt" data-act="claim" data-id="'+i+'"'+(m.p>=m.n?'':' disabled')+'>Pegar</button>')+'</div>';});
    const all=S.daily.m.every(x=>x.c);
    h+='<div class="row chest"><div class="ic">🎁</div><div class="tx"><b>Baú diário</b><br>'+(S.daily.b?'Aberto! Volte amanhã.':'Complete as 3 missões')+'</div>'+
      (S.daily.b?'':'<button class="bt" data-act="chest"'+(all?'':' disabled')+'>Abrir</button>')+'</div>';
  }
  $('body').innerHTML=h;
}
const wsHtml=(c,w,st)=>'💰'+c+(w?' 🪵'+w:'')+(st?' 🪨'+st:'');
const canPay=(c,w,st)=>S.coins>=c&&have('wood')>=(w||0)&&have('stone')>=(st||0);
function pay(c,w,st){S.coins-=c;if(w)addItem('wood',-w);if(st)addItem('stone',-st);}
function siloRow(){
  const L=SILO[S.silo];
  if(!L.up)return'<div class="row"><div class="ic">🌾</div><div class="tx"><b>Silo no nível máximo</b></div></div>';
  return'<div class="row"><div class="ic">🌾</div><div class="tx"><b>Melhorar silo → nível '+(S.silo+1)+'</b><br>Guarda '+SILO[S.silo+1].cap+' grãos/plantações</div>'+
    '<button class="bt alt" data-act="siloup"'+(canPay(L.up,L.w,L.st)?'':' disabled')+'>'+wsHtml(L.up,L.w,L.st)+'</button></div>';
}
function upgradeRow(){
  const B=BARN[S.barn];
  if(!B.up)return'<div class="row"><div class="ic">🏠</div><div class="tx"><b>Celeiro no nível máximo</b></div></div>';
  const N=BARN[S.barn+1],extra={1:' · libera 🐄',2:' · libera 🐖'}[S.barn]||'';
  return'<div class="row"><div class="ic">🏠</div><div class="tx"><b>Melhorar celeiro → nível '+(S.barn+1)+'</b><br>Espaço '+N.cap+' · até '+N.animals+' animais'+extra+
    '</div><button class="bt alt" data-act="upgrade"'+(S.coins<B.up?' disabled':'')+'>💰'+B.up+'</button></div>';
}
$('body').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
  const act=b.dataset.act,id=b.dataset.id;
  if(act==='sell1'||act==='sellall'){
    const n=act==='sell1'?1:have(id);if(!n)return;
    const c=ITEM(id).sell*n;addItem(id,-n);coinsGain(c);SND.coin();track('sell',c);save();
  }else if(act==='buy'){
    const A=ANIMALS[id];if(S.coins<A.cost||S.animals.length>=BARN[S.barn].animals||A.barn>S.barn||level()<A.lvl)return;
    S.coins-=A.cost;S.animals.push({k:id,f:0});spawnAnimal(S.animals.length-1);SND.animal();
    toast(A.e+' '+A.name+' chegou! Dê '+CROPS[A.food].e+' '+CROPS[A.food].name.toLowerCase()+' para produzir.');hud();save();
  }else if(act==='upgrade'){
    const B=BARN[S.barn];if(!B.up||S.coins<B.up)return;
    S.coins-=B.up;S.barn++;rebuildBarn();SND.build();FX.confetti(new V3(-5.2,4,-7.2));toast('🏠 Celeiro nível '+S.barn+'!');hud();save();
  }else if(act==='deliver'){deliver(+id);}
  else if(act==='truckup'){upgradeTruck();}
  else if(act==='facup'){upgradeFac(id);renderPanel();}
  else if(act==='siloup'){upgradeSilo();}
  else if(act==='tool'){buyTool(id);}
  else if(act==='canup'){upgradeCan();}
  else if(act==='mk1'||act==='mkall'){marketSell(+id,act==='mkall');}
  else if(act==='wagon'){loadWagon(+id);}
  else if(act==='helper'){buyHelper(id);}
  else if(act==='album'){claimAlbum();}
  else if(act==='login'){claimLogin();}
  else if(act==='skip'){S.orders[+id]=null;S.oready[+id]=Date.now()+T(30);hud();save();renderPanel();}
  else if(act==='build'){buildFac(id);if(panel==='fac')renderPanel();}
  else if(act==='gofac'){openPanel('fac',id);}
  else if(act==='make'){startRecipe(id,b.dataset.r);renderPanel();}
  else if(act==='collect'){collectFac(id);renderPanel();}
  else if(act==='tree'){plantTree(panelArg,id);}
  else if(act==='claim'){claimMission(+id);}
  else if(act==='open'){openPanel(id);}
  else if(act==='edit'){editMode=!editMode;closePanel();toast(editMode?'✋ Toque numa decoração para mudar de lugar ou vender. Menu → Parar para sair.':'Edição encerrada');showPlaceBar();}
  else if(act==='quality'){S.q=LOWQ?'high':'low';save();location.reload();}
  else if(act==='guide'){closePanel();openGuide();}
  else if(act==='howto'){closePanel();howTo();}
  else if(act==='spin'){spinWheel();}
  else if(act==='ach'){claimAch(id);}
  else if(act==='decor'){buyDecor(id);}
  else if(act==='zone'){buyZone(id);}
  else if(act==='look'){const Z=ZONES[id];cam.tx=Z.sign[0]+(id==='west'?-3:-4);cam.tz=Z.sign[1]+(id==='west'?-4:0);cam.dist=24;clampCam();closePanel();}
  else if(act==='serve'){serveVisitor(panelArg);}
  else if(act==='dismiss'){dismissVisitor(panelArg);}
  else if(act==='chest'){claimChest();}
  else if(act==='reset'){
    if(!resetArm){resetArm=true;renderPanel();return;}
    try{localStorage.removeItem(SAVE_KEY);}catch(e){}
    memSave=null;location.reload();
  }
});
$('close').addEventListener('click',closePanel);
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closePanel();});
$('btns').addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b){initAudio();openPanel(b.dataset.open);}});
$('bMenu').addEventListener('click',()=>{initAudio();openPanel('menu');});
// no navegador do celular: tela cheia + trava em paisagem no primeiro toque (no APK isso já vem do AndroidManifest)
let orientTried=false;
function lockLandscape(){
  if(orientTried||!('ontouchstart' in window)||/; wv\)/.test(navigator.userAgent))return;orientTried=true;
  try{const el=document.documentElement,rf=el.requestFullscreen||el.webkitRequestFullscreen;
    const p=rf&&rf.call(el);const lock=()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});}catch(e){}};
    if(p&&p.then)p.then(lock).catch(()=>{});else lock();}catch(e){}
}
document.addEventListener('pointerdown',lockLandscape,true);
function initAudio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();loadAudio();}catch(e){}}else if(AC.state==='suspended'&&!document.hidden){try{AC.resume();}catch(e){}}}

/* ---------------- TUTORIAL GUIADO ---------------- */
const firstCrop=()=>{for(const i of ORDER)if(S.plots[i].c)return i;return ORDER[0];};
const emptyPlot=()=>{for(const i of ORDER)if(RANK[i]<S.np&&!S.plots[i].c)return i;return ORDER[0];};
const above=(i,y)=>plotPos(i).setY(y||1.9);
const TUT=[
  {msg:'Toque no canteiro indicado para plantar uma 🥕 cenoura',at:()=>above(ORDER[0]),done:()=>S.plots.some(p=>p.c)},
  {msg:'Agora toque nele de novo para regar 💧',at:()=>above(firstCrop()),done:()=>S.plots.some(p=>p.c&&p.w)},
  {msg:'A primeira cresce rapidinho… toque para colher! 🧺',at:()=>above(firstCrop()),done:()=>S.stats.harvest>0},
  {msg:'Toque no 🚚 caminhão e entregue o pedido',at:()=>new V3(-12.5,3.6,2.5),done:()=>S.stats.deliver>0},
  {msg:'Abra a 🛒 Loja e compre uma 🐔 galinha',el:'fabShop',done:()=>S.animals.length>0},
  {msg:'Galinhas comem 🌾 trigo. Escolha o trigo e plante num canteiro',at:()=>above(emptyPlot()),done:()=>S.plots.some(p=>p.c==='wheat')||have('wheat')>0}
];
function updTut(){
  const tb=$('tut'),hand=$('hand');
  if(S.tg>=TUT.length){if(tb.style.display!=='none'){tb.style.display='none';hand.style.display='none';document.body.classList.remove('tuton');}return;}
  const step=TUT[S.tg];
  if(step.done()){
    S.tg++;SND.up();
    if(S.tg>=TUT.length){toast('🎉 Tutorial concluído! Veja as 📅 Missões diárias');checkDaily();FX.confetti(farmer.obj?farmer.obj.position.clone().setY(2):new V3(0,2,3));}
    save();return;
  }
  document.body.classList.add('tuton');
  tb.style.display='block';const txt=(S.tg+1)+'/'+TUT.length+' · '+step.msg;if(tb.textContent!==txt)tb.textContent=txt;
  if(panel||(step.at&&seedOpen&&S.tg===5&&selSeed!=='wheat')){
    // com a barra de sementes aberta no passo do trigo, aponta para o botão de trigo
    if(!panel&&seedOpen){const b=document.querySelector('[data-seed="wheat"]');if(b){const r=b.getBoundingClientRect();showHand(r.left+r.width/2,r.top);return;}}
    hand.style.display='none';return;
  }
  if(step.el){const r=$(step.el).getBoundingClientRect();showHand(r.left-26,r.top+r.height/2+20,true);return;}
  project(step.at(),P2);
  if(!P2.vis){hand.style.display='none';return;}
  showHand(P2.x,P2.y);
}
function showHand(x,y,side){const h=$('hand');h.style.display='block';h.className=side?'side':'';h.style.transform='translate('+x.toFixed(0)+'px,'+y.toFixed(0)+'px)';}

/* ---------------- DIA E NOITE ---------------- */
let night=0;
const C_RAIN=new THREE.Color(0x8a96a3),C_DAY=new THREE.Color(0x9fd8f5),C_DUSK=new THREE.Color(0xf5a66e),C_NIGHT=new THREE.Color(0x1d2a4f),skyC=new THREE.Color();
const SUN_DAY=new THREE.Color(0xfff2d6),SUN_DUSK=new THREE.Color(0xffb27a),SUN_NIGHT=new THREE.Color(0x9fb4ff);
const fireflies=[];
function initFireflies(){
  for(let i=0;i<(LOWQ?8:26);i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex('dot'),color:EVENT==='halloween'?0xffa040:0xd8ff6a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));
    s.scale.set(.32,.32,1);const x=(Math.random()-.5)*40,z=(Math.random()-.5)*26;
    s.userData={x,z,y:.6+Math.random()*1.6,ph:Math.random()*10};scene.add(s);fireflies.push(s);
  }
}
function updDay(){
  const ph=(((Date.now()+(window.__dayOff||0))/1000)%DAY_LEN)/DAY_LEN;      // 0 = amanhecer, .25 = meio-dia, .5 = pôr do sol, .75 = meia-noite
  const a=ph*Math.PI*2,sh=Math.sin(a);
  const k=Math.min(1,Math.max(0,(sh+.32)/.5));       // 1 = dia claro, 0 = noite
  const dusk=Math.max(0,1-Math.abs(sh+.05)/.32);
  night=1-k;
  skyC.copy(C_NIGHT).lerp(C_DAY,k).lerp(C_DUSK,dusk*.7);
  skyC.lerp(C_RAIN,wx.amt*.6);
  scene.background.copy(skyC);scene.fog.color.copy(skyC);
  sun.color.copy(SUN_NIGHT).lerp(SUN_DAY,k).lerp(SUN_DUSK,dusk);
  sun.intensity=(.12+.73*k)*(1-.5*wx.amt);hemi.intensity=(.2+.42*k)*(1-.2*wx.amt);
  hemi.color.setRGB(.45+.55*k,.52+.48*k,.85+.15*k);hemi.groundColor.setRGB(.2+.33*k,.25+.42*k,.3+.03*k);
  const ang=sh>=0?a:a-Math.PI;                      // à noite a "lua" faz o mesmo caminho
  sun.position.set(-Math.cos(ang)*24,6+20*Math.abs(Math.sin(ang)),12);
  const lamp=Math.max(0,(night-.25)/.75);
  LAMPS.forEach((L,i)=>{L.pl.intensity=lamp*1.5*(1+Math.sin(time*7+i*2)*.04);L.bulb.material.color.setRGB(.54+.46*lamp,.46+.42*lamp,.31+.1*lamp);});
  fireflies.forEach((f,i)=>{const u=f.userData;f.material.opacity=Math.max(0,lamp*(.55+.45*Math.sin(time*3+u.ph)));
    f.position.set(u.x+Math.sin(time*.4+u.ph)*1.5,u.y+Math.sin(time*.9+u.ph)*.4,u.z+Math.cos(time*.35+u.ph)*1.5);});
  const ic=wx.amt>.5?(EVENT==='natal'?'🌨️':'🌧️'):rainbowOn()?'🌈':night>.6?'🌙':dusk>.3?(Math.cos(a)<0?'🌇':'🌅'):'☀️';
  if($('day').textContent!==ic)$('day').textContent=ic;
}

/* ---------------- TERRENOS ---------------- */
let westDirt=null;const zoneV={};
function buildZones(){
  for(const id in ZONES){const Z=ZONES[id];
    const sign=put('d_sign',1.7,'h',Z.sign[0],Z.sign[1],id==='west'?-.6:.4);
    hitBox(1.8,2.6,1.8,Z.sign[0],1.3,Z.sign[1],{type:'zone',id});
    const clutter=Z.clutter.map((c,i)=>{hitBox(c[1]*.9,1.6,c[1]*.9,c[2],.8,c[3],{type:'clutter',id,ci:i});return put(c[0],c[1],'xz',c[2],c[3],i*1.7);});
    zoneV[id]={sign,clutter,label:mkLabel(new V3(Z.sign[0],2.5,Z.sign[1]))};
  }
  refreshZones();
}
const zCleared=(id,ci)=>(S.zclear[id]||[]).indexOf(ci)>=0;
const zoneCost=id=>{const Z=ZONES[id],n=(S.zclear[id]||[]).length;return Math.round(Z.cost*(1-.6*n/Z.clutter.length)/10)*10;};
function refreshZones(){
  if(!zoneV.west)return;
  for(const id in ZONES){const v=zoneV[id],own=!!S.zones[id],Z=ZONES[id];
    v.sign.visible=!own;v.clutter.forEach((c,ci)=>c.visible=!own&&!zCleared(id,ci));
    setLabel(v.label,own?'':'<span class="bub lock">'+Z.e+' '+Z.name+' · '+(level()<Z.lvl?'🔒 Nv '+Z.lvl:'💰'+zoneCost(id))+'</span>');}
  if(westDirt)westDirt.visible=!!S.zones.west;
}
function buyZone(id){
  const Z=ZONES[id];if(S.zones[id])return;
  if(level()<Z.lvl){toast('🔒 Libera no nível '+Z.lvl);SND.no();return;}
  const zc=zoneCost(id);
  if(S.coins<zc){toast('Faltam 💰'+(zc-S.coins));SND.no();return;}
  S.coins-=zc;S.zones[id]=1;SND.build();
  zoneV[id].clutter.forEach(c=>{FX.dust(c.position.clone().setY(.4));});FX.confetti(new V3(Z.sign[0],2,Z.sign[1]));
  refreshZones();refreshAll();closePanel();
  toast(Z.e+' '+Z.name+' liberado! '+Z.desc);
  const c=Z.clutter[0];cam.tx=c[2]+2;cam.tz=c[3]-1;clampCam();save();
}

/* ---------------- DECORAÇÃO ---------------- */
const decorV=[];let editMode=false;
const place={on:false,k:null,x:0,z:0,rot:0,ok:false,has:false,ghost:null,from:-1};
const ring=new THREE.Mesh(new THREE.RingGeometry(.85,1,32),new THREE.MeshBasicMaterial({color:0x4cd964,transparent:true,opacity:.8,depthWrite:false}));
ring.rotation.x=-Math.PI/2;ring.position.y=.06;ring.visible=false;scene.add(ring);
const BLOCK=[[-23.6,-16.2,-8.6,-3],[4.4,8.8,-14.6,-10.8],[-8.2,8.2,-1.2,6.6],[1.4,11.1,-10.6,-4],[-8.8,-1.6,-10.2,-4.2],[10.2,21.2,-15.1,-2],[-10.8,-8.4,-10.8,-8.4],[10.6,20.8,0,10.2],[-14.6,-10.4,-60,60],[-23.4,-15.4,-1.2,6.6]];
const eventSpots=[];
function freeSpot(x,z,r,skip){
  if(x<-25||x>24||z<-17||z>13.5)return false;
  for(const b of BLOCK)if(x+r>b[0]&&x-r<b[1]&&z+r>b[2]&&z-r<b[3])return false;
  for(const t of TREE_SLOTS)if(Math.hypot(x-t[0],z-t[1])<r+1.3)return false;
  for(const id in ZONES){const Z=ZONES[id];if(Math.hypot(x-Z.sign[0],z-Z.sign[1])<r+.9&&!S.zones[id])return false;
    if(!S.zones[id])for(const c of Z.clutter)if(Math.hypot(x-c[2],z-c[3])<r+1.1)return false;}
  for(const sp of VISITOR.spots)if(Math.hypot(x-sp[0],z-sp[1])<r+.9)return false;
  for(const l of STATIC)if(Math.hypot(x-l[0],z-l[1])<r+l[2])return false;
  for(const e of eventSpots)if(Math.hypot(x-e[0],z-e[1])<r+1)return false;
  for(let i=0;i<S.decor.length;i++){const d=S.decor[i];if(!d||i===skip)continue;if(Math.hypot(x-d.x,z-d.z)<r+DECOR[d.k].r)return false;}
  return true;
}
function spawnDecor(i){
  const d=S.decor[i];if(!d||!DECOR[d.k])return;const D=DECOR[d.k];
  const g=put(D.model,D.size,D.mode,d.x,d.z,d.r);
  const hb=hitBox(D.r*2,2.2,D.r*2,d.x,1.1,d.z,{type:'decor',i});
  decorV[i]={g,hb};
}
function removeDecorV(i){const v=decorV[i];if(!v)return;scene.remove(v.g);scene.remove(v.hb);const k=pickables.indexOf(v.hb);if(k>=0)pickables.splice(k,1);decorV[i]=null;}
function buyDecor(k){
  const D=DECOR[k];if(level()<D.lvl||S.coins<D.cost){SND.no();return;}
  closePanel();startPlace(k,-1);toast('Toque no chão para escolher o lugar');
}
function startPlace(k,from){
  if(fishing.st!=='off')stopFishing();closeSeeds();
  if(place.ghost)scene.remove(place.ghost);
  place.on=true;place.k=k;place.from=from;place.has=false;place.ok=false;place.rot=from>=0?S.decor[from].r:0;
  const D=DECOR[k];place.ghost=make(D.model,D.size,D.mode);ghostify(place.ghost,true);place.ghost.visible=false;scene.add(place.ghost);
  ring.scale.setScalar(D.r);
  if(from>=0){const d=S.decor[from];place.x=d.x;place.z=d.z;place.has=true;place.ok=true;place.ghost.visible=true;if(decorV[from])decorV[from].g.visible=false;}
  showPlaceBar();
}
const groundPlane=new THREE.Plane(new V3(0,1,0),0);
function placeAt(x,y){
  ndc.set(x/W*2-1,-(y/H)*2+1);ray.setFromCamera(ndc,camera);
  const p=new V3();if(!ray.ray.intersectPlane(groundPlane,p))return;
  place.x=Math.round(p.x*4)/4;place.z=Math.round(p.z*4)/4;place.has=true;
  place.ok=freeSpot(place.x,place.z,DECOR[place.k].r,place.from);
  place.ghost.visible=true;SND.click();showPlaceBar();
}
function updPlace(){
  ring.visible=place.on&&place.has;
  if(!place.on||!place.ghost)return;
  place.ghost.position.set(place.x,0,place.z);place.ghost.rotation.y=place.rot;
  ring.position.set(place.x,.06,place.z);ring.material.color.set(place.ok?0x4cd964:0xff3b30);
  ring.material.opacity=.55+Math.sin(time*6)*.25;
}
function confirmPlace(){
  if(!place.on||!place.has||!place.ok){toast('Escolha um lugar livre (círculo verde)');SND.no();return;}
  const D=DECOR[place.k];
  if(place.from<0){
    if(S.coins<D.cost){toast('Moedas insuficientes');SND.no();return;}
    S.coins-=D.cost;S.decor.push({k:place.k,x:place.x,z:place.z,r:place.rot});spawnDecor(S.decor.length-1);
    gainXp(Math.max(2,Math.round(D.cost/25)));track('decor');
  }else{const d=S.decor[place.from];d.x=place.x;d.z=place.z;d.r=place.rot;removeDecorV(place.from);spawnDecor(place.from);}
  FX.sparkle(new V3(place.x,1,place.z));SND.build();
  endPlace();hud();save();
}
function endPlace(){place.on=false;if(place.ghost){scene.remove(place.ghost);place.ghost=null;}ring.visible=false;showPlaceBar();}
function pickDecor(i){if(S.decor[i])startPlace(S.decor[i].k,i);}
function sellDecor(){
  if(place.from<0)return;const d=S.decor[place.from],D=DECOR[d.k],c=Math.round(D.cost/2);
  removeDecorV(place.from);S.decor[place.from]=null;S.coins+=c;toast('Vendido por 💰'+c);SND.coin();endPlace();hud();save();
}
function showPlaceBar(){
  const pb=$('placebar');
  if(!place.on&&!editMode){pb.style.display='none';pb.dataset.h='';return;}
  pb.style.display='flex';let h;
  if(!place.on)h='<div class="fx">✋ Modo mover: toque numa decoração</div><button class="bt red" data-p="stopedit">Sair</button>';
  else{const D=DECOR[place.k];
    h='<div class="fx">'+D.e+' <b>'+D.name+'</b> · '+(!place.has?'toque no chão':place.ok?'lugar livre ✅':'lugar ocupado ❌')+'</div>'+
      '<button class="bt alt" data-p="rot">⟳</button><button class="bt" data-p="ok"'+(place.has&&place.ok?'':' disabled')+'>✔ '+(place.from<0?'💰'+D.cost:'Colocar')+'</button>'+
      (place.from>=0?'<button class="bt red" data-p="sell">💰'+Math.round(D.cost/2)+'</button>':'')+'<button class="bt red" data-p="x">✕</button>';}
  if(pb.dataset.h!==h){pb.dataset.h=h;pb.innerHTML=h;}
}
$('placebar').addEventListener('click',e=>{
  const b=e.target.closest('[data-p]');if(!b||b.disabled)return;initAudio();const a=b.dataset.p;
  if(a==='rot'){place.rot+=Math.PI/4;SND.click();}
  else if(a==='ok')confirmPlace();
  else if(a==='sell')sellDecor();
  else if(a==='x'){if(place.from>=0&&decorV[place.from])decorV[place.from].g.visible=true;endPlace();}
  else if(a==='stopedit'){editMode=false;showPlaceBar();}
});

/* ---------------- VISITANTES ---------------- */
const visV=[null,null];
const SAYS=['Preciso disso pra uma receita!','Meu neto adora isso!','Vim de longe só pra comprar…','Pago bem, prometo!','Tem um pouquinho pra mim?','Ouvi falar que sua fazenda é a melhor!'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
function tickVisitors(){
  refreshZones();refreshGifts();
  const an=achClaimable();if(an>lastAchN)toast('🏆 Conquista pronta! Veja em ☰ Menu');lastAchN=an;
  if(level()<VISITOR.lvl||S.tg<TUT.length)return;
  const now=Date.now();
  for(let i=0;i<2;i++){const v=S.visitors[i];if(v&&now>v.until&&visV[i]&&visV[i].st==='wait'){toast('🙋 '+v.name+' cansou de esperar e foi embora');leaveVisitor(i,false);}}
  if(now>=S.vnext){const i=S.visitors.findIndex(v=>!v);if(i>=0&&!visV[i])newVisitor(i);S.vnext=now+T(240+Math.random()*300);}
}
let lastAchN=0;
function newVisitor(i){
  if(i===undefined)i=S.visitors.findIndex(v=>!v);if(i<0||visV[i])return;
  const pool=orderPool();const id=pick(pool);
  const goods=!!RECIPES[id]&&id!=='flour',q=goods?1:PRODUCTS[id]?1+Math.floor(Math.random()*2):3+Math.floor(Math.random()*4);
  const val=ITEM(id).sell*q;
  S.visitors[i]={m:pick(VISITOR.models),name:pick(VISITOR.names),say:pick(SAYS),req:{[id]:q},reward:Math.round(val*1.8/5)*5+5,xp:Math.max(5,Math.round(val/7)),until:Date.now()+T(1200)};
  spawnVisitor(i,false);save();
}
async function spawnVisitor(i,atSpot){
  const v=S.visitors[i];if(!v)return;
  const g=await parse(v.m);if(!g)return;
  shadowize(g.scene);const obj=fit(g.scene,1.45,'h'),sp=VISITOR.spots[i];
  if(atSpot)obj.position.set(sp[0],0,sp[1]);else obj.position.set(-11.2,0,i?-24:24);
  scene.add(obj);
  const mixer=new THREE.AnimationMixer(g.scene),acts={};g.animations.forEach(c=>acts[c.name]=mixer.clipAction(c));
  const hit=hitBox(1.4,2.2,1.4,obj.position.x,1.1,obj.position.z,{type:'visitor',i});
  visV[i]={obj,mixer,acts,cur:null,hit,label:mkLabel(new V3()),st:atSpot?'wait':'in',tx:sp[0],tz:sp[1]};
  play(visV[i],'idle');
  if(!atSpot)toast('🙋 '+v.name+' chegou na fazenda!');
}
function updVisitors(dt){
  for(let i=0;i<2;i++){
    const v=visV[i];if(!v)continue;v.mixer.update(dt);const o=v.obj;
    const dx=v.tx-o.position.x,dz=v.tz-o.position.z,d=Math.hypot(dx,dz);
    if(d>.1){const sp=d>4?4.5:2.6;o.position.x+=dx/d*Math.min(d,sp*dt);o.position.z+=dz/d*Math.min(d,sp*dt);turn(o,Math.atan2(dx,dz),dt);play(v,'walk');}
    else{
      if(v.st==='out'){scene.remove(o);scene.remove(v.hit);pickables.splice(pickables.indexOf(v.hit),1);v.label.el.remove();labels.splice(labels.indexOf(v.label),1);visV[i]=null;continue;}
      if(v.st==='in')v.st='wait';
      turn(o,.7,dt);play(v,"idle");
    }
    v.hit.position.set(o.position.x,1.1,o.position.z);v.label.pos.set(o.position.x,2.15,o.position.z);
    const sv=S.visitors[i];
    if(v.st==='wait'&&sv){const id=Object.keys(sv.req)[0],ok=have(id)>=sv.req[id];setLabel(v.label,'<span class="bub'+(ok?' go':'')+'">💬 '+ITEM(id).e+'×'+sv.req[id]+'</span>');}
    else setLabel(v.label,v.st==='out'&&v.happy?'<span class="bub sm">😊</span>':'');
  }
}
function leaveVisitor(i,happy){const v=visV[i];S.visitors[i]=null;if(v){v.st='out';v.happy=happy;v.tx=-11.2;v.tz=i?-24:24;}save();}
function serveVisitor(i){
  const v=S.visitors[i];if(!v)return;const id=Object.keys(v.req)[0];
  if(have(id)<v.req[id]){SND.no();return;}
  addItem(id,-v.req[id]);coinsGain(v.reward);gainXp(v.xp);track('visitor');SND.deliver();
  const o=visV[i]&&visV[i].obj;
  if(o){FX.coins(o.position.clone().setY(2));emit(o.position.clone().setY(2.2),{tex:'💕',n:3,size:.5,spd:.5,up:2,grav:0,life:1});goFarmer(o.position.x+1.3,o.position.z,'pick-up',o.position);}
  toast(v.name+': Obrigado! +💰'+v.reward);closePanel();leaveVisitor(i,true);sendVan();hud();
}
function dismissVisitor(i){
  const v=S.visitors[i];if(!v)return;toast(v.name+' foi embora');closePanel();leaveVisitor(i,false);
  S.vnext=Math.min(S.vnext,Date.now()+T(150));
}

/* ---------------- CLIMA (chuva/neve + arco-íris) ---------------- */
const wx={amt:0,raining:false,watered:false,force:null,rainbowT:0};
function weatherRain(ms){
  const slot=Math.floor(ms/1000/(WEATHER_SLOT/(DEV>1?5:1)));
  const h=Math.abs(Math.sin(slot*12.9898+78.233)*43758.5453)%1;return h<.27;
}
const rainbowOn=()=>wx.rainbowT>0;
function updWeather(){
  const r=wx.force!==null?wx.force:weatherRain(Date.now());
  if(r&&!wx.raining){wx.raining=true;wx.watered=false;toast(EVENT==='natal'?'🌨️ Começou a nevar! Os canteiros se regam sozinhos':'🌧️ Começou a chover! Os canteiros se regam sozinhos');}
  if(!r&&wx.raining){wx.raining=false;if(night<.5&&S.tg>=TUT.length){wx.rainbowT=60;toast('🌈 Arco-íris! Colheitas rendem +1 por 1 minuto');SND.up();}}
  if(wx.raining&&wx.amt>.5){let n=0;
    S.plots.forEach((p,i)=>{if(plotState(i)==='dry'){p.w=1;p.t=Date.now();refreshPlot(i);n++;}});
    if(n){if(!wx.watered)toast('💧 A chuva regou '+n+' canteiro'+(n>1?'s':'')+'!');wx.watered=true;save();}}
}
const rain={
  init(){
    const snow=EVENT==='natal';this.snow=snow;this.n=LOWQ?150:(snow?380:520);
    this.pos=new Float32Array(this.n*6);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));
    this.mat=new THREE.LineBasicMaterial({color:snow?0xffffff:0xcfe6ff,transparent:true,opacity:0,depthWrite:false});
    this.mesh=new THREE.LineSegments(g,this.mat);this.mesh.frustumCulled=false;this.mesh.visible=false;scene.add(this.mesh);
    for(let i=0;i<this.n;i++)this.reset(i,true);
  },
  reset(i,any){this.set(i,cam.tx+(Math.random()-.5)*46,any?Math.random()*18:18,cam.tz+(Math.random()-.5)*36);},
  set(i,x,y,z){const o=i*6,L=this.snow?.14:.8;this.pos[o]=x;this.pos[o+1]=y;this.pos[o+2]=z;this.pos[o+3]=x+(this.snow?.12:.1);this.pos[o+4]=y+L;this.pos[o+5]=z;},
  upd(dt){
    wx.amt+=((wx.raining?1:0)-wx.amt)*Math.min(1,dt*.6);
    this.mat.opacity=wx.amt*(this.snow?.9:.5);this.mesh.visible=wx.amt>.02;if(!this.mesh.visible)return;
    const sp=this.snow?2.4:17;
    for(let i=0;i<this.n;i++){const o=i*6,y=this.pos[o+1]-sp*dt;
      if(y<0){this.reset(i,false);continue;}
      this.set(i,this.pos[o]+(this.snow?Math.sin(time*1.5+i)*dt*.6:0),y,this.pos[o+2]);}
    this.mesh.geometry.attributes.position.needsUpdate=true;
  }
};
const rainbow={
  init(){},
  upd(dt){if(wx.rainbowT>0)wx.rainbowT=Math.max(0,wx.rainbowT-dt);
    const a=wx.rainbowT>0?Math.min(1,wx.rainbowT/4,(60-wx.rainbowT)/3):0;
    const el=$('rainbow');const v=a.toFixed(2);if(el.dataset.o!==v){el.dataset.o=v;el.style.opacity=v;}}
};

/* ---------------- EVENTOS SAZONAIS ---------------- */
const giftV=[],flags=[];let fireT=0;
const GIFT_SPOTS=[[-3.6,7.6],[5.2,-2.4],[-11,-6.8],[9.6,10.6],[-6,-11.6],[8.6,-11.8]];
function buildEvent(){
  if(EVENT==='halloween'){
    put('scarecrow',2.2,'h',1.1,-2.6,.3);eventSpots.push([1.1,-2.6]);
    [[-3.4,-3.1],[5.6,-2.6],[-9.4,10.6],[9.4,10.2]].forEach(([x,z],i)=>{const g=put('jack',1,'xz',x,z,i);eventSpots.push([x,z]);
      g.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.emissive=new THREE.Color(0xff7a00);m.material.emissiveIntensity=0;jacks.push(m.material);}});});
    C_NIGHT.set(0x2a1840);fireflies.forEach(f=>f.material.color.set(0xffa040));
  }
  if(EVENT==='natal'){
    put('x_tree',3.2,'h',1.1,-2.6,0);put('x_snowman',1.5,'h',5.6,-2.6,-.4);eventSpots.push([1.1,-2.6],[5.6,-2.6]);
    put('x_present2',.8,'h',1.9,-1.8,.3);
    for(let i=0;i<3;i++){const g=make('x_present',.85,'h');scene.add(g);
      const hb=hitBox(1.3,1.4,1.3,0,.7,0,{type:'gift',i});giftV.push({g,hb,label:mkLabel(new V3())});}
    refreshGifts();
  }else if(EVENT==='junina'){
    put('j_fire',1.8,'xz',1.1,-2.6,0);eventSpots.push([1.1,-2.6]);
    const pal=[0xff4d4d,0xffd23f,0x4cd964,0x3fa9f5,0xff7ad9,0xff9f43];
    [[-1.7],[7.3]].forEach(([z])=>{
      [-8.6,8.6].forEach(x=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,3.4,6),new THREE.MeshLambertMaterial({color:0x6b4423}));p.position.set(x,1.7,z);p.castShadow=true;scene.add(p);});
      const pts=[];for(let k=0;k<=24;k++){const t=k/24,x=-8.6+17.2*t,y=3.3-Math.sin(t*Math.PI)*.8;pts.push(new V3(x,y,z));}
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffffff})));
      for(let k=1;k<24;k++){const g=new THREE.BufferGeometry().setFromPoints([new V3(-.22,0,0),new V3(.22,0,0),new V3(0,-.5,0)]);g.computeVertexNormals();
        const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:pal[k%pal.length],side:THREE.DoubleSide}));m.position.copy(pts[k]);scene.add(m);flags.push(m);}
    });
  }
}
const jacks=[];
function updEvent(dt){
  if(jacks.length)jacks.forEach((m,i)=>m.emissiveIntensity=Math.max(.15,night)*(.75+.25*Math.sin(time*8+i*2)));
  if(EVENT==='junina'){
    fireT-=dt;if(fireT<=0){fireT=LOWQ?.3:.1;emit(new V3(1.1,.6,-2.6),{tex:'dot',n:1,color:Math.random()<.5?0xff7a1a:0xffd23f,size:.5,spd:.3,up:2.2,grav:-.5,life:.8,spread:.5,add:true,grow:-.6});}
    flags.forEach((f,i)=>{f.rotation.x=Math.sin(time*2.2+i*.7)*.35;});
  }else if(EVENT==='natal'&&S.gifts){
    giftV.forEach((v,i)=>{v.g.rotation.y=time*.8+i;v.g.position.y=Math.abs(Math.sin(time*2+i))*.15;});
  }
}
function giftsToday(){
  const d=today();
  if(!S.gifts||S.gifts.day!==d){const idx=[0,1,2,3,4,5].sort(()=>Math.random()-.5).slice(0,3);S.gifts={day:d,s:idx,got:[0,0,0]};}
  return S.gifts;
}
function refreshGifts(){
  if(EVENT!=='natal'||!giftV.length)return;const G=giftsToday();
  for(let i=0;i<3;i++){const v=giftV[i],sp=GIFT_SPOTS[G.s[i]];
    v.g.position.x=sp[0];v.g.position.z=sp[1];v.hb.position.set(sp[0],.7,sp[1]);v.g.visible=!G.got[i];
    v.label.pos.set(sp[0],1.5,sp[1]);setLabel(v.label,G.got[i]?'':'<span class="bub go sm">🎁</span>');}
}
function openGift(i){
  const G=giftsToday();if(G.got[i])return;
  const l=level(),r=Math.random();let msg;
  if(full('egg',3)&&r>=.5){fullMsg('egg');return;}
  G.got[i]=1;
  if(r<.35){const c=40+l*15;coinsGain(c);msg='💰'+c;}
  else if(r<.5){const x=15+l*3;gainXp(x);msg='⭐'+x;}
  else{const opts=[['egg',3],['milk',2],['flour',2],['apple',3]].filter(o=>o[0]!=='milk'||S.animals.some(a=>a.k==='cow'));const o=pick(opts);addItem(o[0],o[1]);msg=PRODUCTS[o[0]].e+'×'+o[1];}
  const sp=GIFT_SPOTS[G.s[i]],pos=new V3(sp[0],1.2,sp[1]);
  goFarmer(sp[0],sp[1]+1.2,'pick-up',pos);FX.confetti(pos);SND.up();floatText(pos,'🎁 '+msg);
  toast('🎁 Presente de Natal: '+msg+' ('+G.got.filter(Boolean).length+'/3 hoje)');refreshGifts();hud();save();
}

/* ---------------- RODA DA SORTE + CONQUISTAS ---------------- */
let spinning=false,wheelRot=0;
function spinWheel(){
  if(spinning||S.wheel===today())return;
  const tot=WHEEL.reduce((a,w)=>a+w.w,0);let r=Math.random()*tot,idx=0;
  for(;idx<WHEEL.length-1;idx++){r-=WHEEL[idx].w;if(r<=0)break;}
  const a=360/WHEEL.length,target=360-(idx*a+a/2);
  wheelRot=wheelRot-(wheelRot%360)+360*6+target;
  spinning=true;S.wheel=today();save();
  const el=$('wheel');if(el){el.style.transition='transform 4s cubic-bezier(.15,.85,.25,1)';el.style.transform='rotate('+wheelRot+'deg)';}
  const b=document.querySelector('[data-act="spin"]');if(b)b.disabled=true;
  let k=0;const tick=()=>{if(k++>22)return;SND.click();setTimeout(tick,60+k*k*1.6);};tick();
  setTimeout(()=>{
    spinning=false;const w=WHEEL[idx];w.f();SND.up();
    toast('🎡 Você ganhou '+w.t+'!');FX.confetti(farmer.obj?farmer.obj.position.clone().setY(2):new V3(0,2,3));
    if(w.t.indexOf('Turbo')>=0)toast('🍀 Todas as plantações regadas ficaram prontas!');
    hud();save();
  },4200);
}
function achClaimable(){if(!S)return 0;let n=0;ACH.forEach(A=>{const t=S.ach[A.id]||0;if(t<4&&(S.stats[A.id]||0)>=A.tiers[t])n++;});return n;}
function claimAch(id){
  const A=ACH.find(a=>a.id===id);if(!A)return;const t=S.ach[id]||0;
  if(t>=4||(S.stats[id]||0)<A.tiers[t])return;
  S.ach[id]=t+1;const R=ACH_REW[t];S.coins+=R.c;gainXp(R.x);SND.up();lastAchN=achClaimable();
  toast('🏆 '+A.name+' '+'⭐'.repeat(t+1)+' · +💰'+R.c+' +⭐'+R.x);
  FX.confetti(farmer.obj?farmer.obj.position.clone().setY(2):new V3(0,2,3));hud();save();
}

/* ---------------- FERRAMENTAS, CAMINHÃO, SILO ---------------- */
function makeRod(name){
  const r=make(name,1.9,'h');r.visible=false;
  r.userData.tip=new THREE.Object3D();r.userData.tip.position.set(0,r.userData.size.y,0);r.add(r.userData.tip);return r;
}
const toolCache={};let toolT=0;
function showTool(name,dur){
  if(!farmer.hand)return;
  if(!toolCache[name]){toolCache[name]=make(name,.75,'max');}
  while(farmer.hand.children.length)farmer.hand.remove(farmer.hand.children[0]);
  farmer.hand.add(toolCache[name]);farmer.hand.visible=true;toolT=dur||1.2;
}
function updTool(dt){if(toolT>0){toolT-=dt;if(toolT<=0&&farmer.hand)farmer.hand.visible=false;}}
function buyTool(k){
  const TL=TOOLS[k];if(S.tools[k]||level()<TL.lvl)return;
  if(S.coins<TL.cost){toast('Faltam 💰'+(TL.cost-S.coins));SND.no();return;}
  S.coins-=TL.cost;S.tools[k]=1;SND.build();toast(TL.e+' '+TL.name+' comprado! '+TL.desc);
  if(k==='rod2'&&rod){const nr=makeRod('fishingrod2'),pa=rod.parent;nr.position.copy(rod.position);nr.rotation.copy(rod.rotation);if(pa){pa.remove(rod);pa.add(nr);}rod=nr;}
  showTool(TL.model,1.5);hud();save();
}
function upgradeTruck(){
  const NT=TRUCKS[S.truck+1];if(!NT)return;
  if(level()<NT.lvl){toast('🔒 Libera no nível '+NT.lvl);SND.no();return;}
  if(!canPay(NT.cost,NT.w,NT.st)){toast('Faltam recursos: '+wsHtml(NT.cost,NT.w,NT.st));SND.no();return;}
  pay(NT.cost,NT.w,NT.st);S.truck++;
  const z=truck.position.z;scene.remove(truck);truck=put(NT.model,3.5,'xz',-12.5,z,0);
  SND.build();FX.confetti(new V3(-12.5,3,2.5));toast('🚜 Caminhão novo! Agora '+NT.orders+' pedidos'+(NT.mult>1?' pagando +'+Math.round((NT.mult-1)*100)+'%':''));
  hud();save();renderPanel();
}
let siloG=null;
function buildSilo(){
  if(siloG)scene.remove(siloG);
  siloG=new THREE.Group();siloG.position.set(-9.6,0,-9.6);
  const h=2.4+S.silo*.55;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.1,h,18),new THREE.MeshLambertMaterial({color:new THREE.Color(0xd9dde3).convertSRGBToLinear()}));
  body.position.y=h/2;body.castShadow=body.receiveShadow=true;siloG.add(body);
  for(let k=1;k<=S.silo+1;k++){const band=new THREE.Mesh(new THREE.CylinderGeometry(1.12,1.12,.12,18),new THREE.MeshLambertMaterial({color:new THREE.Color(0x8d99a6).convertSRGBToLinear()}));band.position.y=h*k/(S.silo+2);siloG.add(band);}
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1.25,1.1,18),new THREE.MeshLambertMaterial({color:new THREE.Color(0xc0392b).convertSRGBToLinear()}));
  roof.position.y=h+.55;roof.castShadow=true;siloG.add(roof);
  scene.add(siloG);if(siloLabel)siloLabel.pos.y=h+1.6;
}
function upgradeSilo(){
  const L=SILO[S.silo];if(!L.up)return;
  if(!canPay(L.up,L.w,L.st)){toast('Faltam recursos: '+wsHtml(L.up,L.w,L.st));SND.no();return;}
  pay(L.up,L.w,L.st);S.silo++;buildSilo();SND.build();FX.confetti(new V3(-9.6,4,-9.6));
  toast('🌾 Silo nível '+S.silo+'! Guarda '+siloCap()+' grãos');hud();save();
}

/* ---------------- MATO E PEDRAS (madeira 🪵 / pedra 🪨) ---------------- */
const wildV=[];
const ROCKS=['rocks','rocks_001','rocks_002','rocks_003','rocks_004','rocks_005','rocks_006','rocks_007'];
function spawnWild(i){
  const w=S.wild[i];if(!w)return;
  const g=put(w.m||(w.t==='rock'?ROCKS[i%ROCKS.length]:(i%2?'bushesgreen':'bushesyellow')),w.t==='rock'?1.3:1.7,'xz',w.x,w.z,i*1.3);
  const hb=hitBox(1.6,1.6,1.6,w.x,.8,w.z,{type:'wild',i});
  wildV[i]={g,hb,label:mkLabel(new V3(w.x,1.6,w.z))};
}
function tickWild(){
  if(S.tg<TUT.length||Date.now()<S.wnext)return;
  S.wnext=Date.now()+T(200+Math.random()*200);
  if(S.wild.filter(Boolean).length>=6)return;
  for(let tries=0;tries<40;tries++){
    const x=-23+Math.random()*45,z=-15.5+Math.random()*28;
    if(!freeSpot(x,z,1.2,-1))continue;
    let i=S.wild.findIndex(w=>!w);if(i<0)i=S.wild.length;
    const tp=Math.random()<.5?'bush':'rock';
    S.wild[i]={t:tp,m:tp==='rock'?pick(ROCKS):pick(['bushesgreen','bushesyellow']),x:Math.round(x*2)/2,z:Math.round(z*2)/2,hp:2};
    spawnWild(i);save();return;
  }
}
function chopAt(kind,pos,done){
  const tool=kind==='rock'?'pick':'axe';
  if(!S.tools[tool]){toast(kind==='rock'?'Compre a ⛏️ picareta na loja para quebrar pedras':'Compre o 🪓 machado na loja para cortar o mato');SND.no();return false;}
  const res=kind==='rock'?'stone':'wood';
  if(full(res,3)){fullMsg(res);return false;}
  goFarmer(pos.x+1.1,pos.z+.6,'attack-melee-right',pos);showTool(TOOLS[tool].model,1.1);SND.chop();
  emit(pos.clone().setY(.8),kind==='rock'?{tex:'dot',n:10,color:0x9e9e9e,size:.3,spd:2.5,up:3,life:.6}:{tex:'dot',n:10,color:0x6cc04a,size:.3,spd:2,up:3,grav:4,life:.8});
  return true;
}
function giveRes(kind,pos){
  const res=kind==='rock'?'stone':'wood',n=2+Math.floor(Math.random()*2);
  addItem(res,n);stat(res,n);gainXp(2);floatText(pos.clone().setY(1.6),'+'+n+' '+PRODUCTS[res].e);FX.dust(pos.clone().setY(.3));SND.pick();
}
function chopWild(i){
  const w=S.wild[i];if(!w)return;const pos=new V3(w.x,0,w.z);
  if(!chopAt(w.t,pos))return;
  w.hp-=S.tools.loader?w.hp:1;loaderFx(pos);const v=wildV[i];
  if(v){v.g.scale.setScalar(.85);setTimeout(()=>{if(wildV[i])wildV[i].g.scale.setScalar(1);},120);}
  if(w.hp<=0){giveRes(w.t,pos);if(v){scene.remove(v.g);scene.remove(v.hb);pickables.splice(pickables.indexOf(v.hb),1);v.label.el.remove();labels.splice(labels.indexOf(v.label),1);}wildV[i]=null;S.wild[i]=null;}
  hud();save();
}
const clutterHp={};
function chopClutter(id,ci){
  const c=ZONES[id].clutter[ci],kind=/rock/.test(c[0])?'rock':'bush',pos=new V3(c[2],0,c[3]);
  if(level()<ZONES[id].lvl-2){toast('🔒 Este terreno só pode ser limpo a partir do nível '+(ZONES[id].lvl-2));SND.no();return;}
  if(!chopAt(kind,pos))return;
  const k=id+ci;clutterHp[k]=S.tools.loader?0:(clutterHp[k]||3)-1;loaderFx(pos);
  const v=zoneV[id].clutter[ci];v.scale.setScalar(.85);setTimeout(()=>v.scale.setScalar(1),120);
  if(clutterHp[k]<=0){
    (S.zclear[id]=S.zclear[id]||[]).push(ci);giveRes(kind,pos);refreshZones();
    toast('🧹 Terreno mais limpo! '+ZONES[id].name+' agora custa 💰'+zoneCost(id));
  }
  hud();save();
}

/* ---------------- BÔNUS DIÁRIO + ÁLBUM ---------------- */
const loginPending=()=>S.login.last!==today();
function yesterday(){const d=new Date(Date.now()-864e5);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
const nextStreak=()=>S.login.last===yesterday()?S.login.streak+1:1;
function claimLogin(){
  if(!loginPending())return;
  const st=nextStreak(),L=LOGIN[(st-1)%7];
  S.login={last:today(),streak:st};L.f();SND.deliver();
  FX.confetti(farmer.obj?farmer.obj.position.clone().setY(2):new V3(0,2,3));
  toast('📅 Dia '+st+' seguido! Ganhou '+L.t);hud();save();renderPanel();
}
function claimAlbum(){
  if(S.albumDone||!ALBUM.every(a=>S.album[a.id]))return;
  S.albumDone=1;coinsGain(ALBUM_REWARD);gainXp(80);SND.up();FX.confetti(new V3(15,2,5));
  toast('📖 Álbum completo! +💰'+ALBUM_REWARD);hud();save();renderPanel();
}

/* ---------------- CIDADE, MERCADO, TREM, VEÍCULOS, AJUDANTES ---------------- */
const TOWN={z:17.4,street:21.6,slots:[-6.6,7.4,12.2,17,-17.4,-22.2,21.8],models:['town_A','town_B','town_C','town_D','town_E','town_F','town_G']};
const MARKET={lvl:4,x:1,z:17.2};
const townB=[],cars=[];let mkHit=null,mkLabelL=null;
const aliasActs=acts=>{if(acts.Idle)acts.idle=acts.Idle;if(acts.Walk)acts.walk=acts.Walk;if(acts.Eating)acts.eat=acts.Eating;if(acts.Gallop)acts.run=acts.Gallop;return acts;};
function buildTown(){
  plane(56,3.4,0x6b6f76,2,TOWN.street,.025);
  for(let x=-24;x<30;x+=2.6)plane(1.3,.16,0xf4f4f4,x,TOWN.street,.03);
  plane(56,1.3,0xcfcfcf,2,TOWN.street-2.3,.027);
  TOWN.slots.forEach((x,i)=>{const g=put(TOWN.models[i],4.2,'xz',x,TOWN.z,0);townB.push(g);});
  put('town_tower',3.4,'h',25.6,TOWN.z,0);
  for(let x=-20;x<=26;x+=7.6)put('town_light',2.6,'h',x+1.9,TOWN.street-2.3,0);
  // mercado da praça
  plane(7.2,4.2,0xe9d7a8,MARKET.x,MARKET.z,.029);
  put('mk_fruit',1.5,'xz',MARKET.x-1.9,MARKET.z-.4,0);put('mk_bread',1.9,'xz',MARKET.x+1.6,MARKET.z-.5,0);
  put('mk_cash',1.1,'xz',MARKET.x,MARKET.z+1,0);put('mk_cart',.9,'xz',MARKET.x+3,MARKET.z+1.2,-.5);
  mkHit=hitBox(7,2.6,4.4,MARKET.x,1.3,MARKET.z,{type:'market'});
  mkLabelL=mkLabel(new V3(MARKET.x,2.6,MARKET.z));
  // carros andando na rua
  ['car1','car2'].forEach((m,i)=>{const g=put(m,2.2,'xz',i?20:-20,TOWN.street+(i?.8:-.8),i?-Math.PI/2:Math.PI/2);cars.push({g,dir:i?-1:1,sp:4.5+i});});
  refreshTown();
}
function refreshTown(){
  const n=Math.min(TOWN.slots.length,2+Math.floor(level()/2));
  townB.forEach((g,i)=>g.visible=i<n);
  if(mkLabelL)setLabel(mkLabelL,'<span class="bub'+(level()>=MARKET.lvl?' go':' lock')+'">🏪 Mercado'+(level()>=MARKET.lvl?'':' · 🔒 Nv '+MARKET.lvl)+'</span>');
}
function updCars(dt){
  cars.forEach(c=>{c.g.position.x+=c.dir*c.sp*dt;if(c.g.position.x>36)c.g.position.x=-36;if(c.g.position.x<-36)c.g.position.x=36;});
  if(vanRun){const v=vanRun;v.t+=dt;const o=v.g;
    if(o.position.z<TOWN.street-.8){o.position.z+=8*dt;o.rotation.y=0;}
    else{o.position.z=TOWN.street-.8;o.rotation.y=Math.PI/2;o.position.x+=9*dt;}
    if(o.position.x>36){scene.remove(o);vanRun=null;}}
}
let vanRun=null;
function sendVan(){if(vanRun)return;const g=put('van',2.4,'xz',-11.4,0,1.6);vanRun={g,t:0};}
// mercado: ofertas do dia
function marketToday(){
  const d=today();
  if(!S.market||S.market.day!==d){
    const pool=orderPool().filter(id=>id!=='feed'),deals=[];
    while(deals.length<4&&pool.length){const id=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      deals.push({id,mult:Math.round((1.4+Math.random()*.8)*100)/100,left:CROPS[id]?20:8});}
    S.market={day:d,deals};
  }
  return S.market;
}
function marketSell(k,all){
  const M=marketToday(),D=M.deals[k];if(!D)return;
  const n=Math.min(D.left,all?have(D.id):1);if(n<=0){SND.no();return;}
  const price=Math.round(ITEM(D.id).sell*D.mult),c=price*n;
  addItem(D.id,-n);D.left-=n;coinsGain(c);track('sell',c);SND.coin();
  floatText(new V3(MARKET.x,2.4,MARKET.z),'+'+c+' 💰','#fff2a8');FX.coins(new V3(MARKET.x,2,MARKET.z));hud();save();renderPanel();
}

// trem de carga (1 por dia, nível 6)
const TRAIN={lvl:6,z:-18.6,stopX:2};
const train={g:null,x:-60,mode:'away',label:null,cargo:[]};
function buildRails(){
  const sl=new THREE.MeshLambertMaterial({color:new THREE.Color(0x7a5230).convertSRGBToLinear()});
  const n=72,inst=new THREE.InstancedMesh(new THREE.BoxGeometry(.32,.1,1.7),sl,n),m4=new THREE.Matrix4();
  for(let i=0;i<n;i++){m4.makeTranslation(-32+i*.9,.05,TRAIN.z);inst.setMatrixAt(i,m4);}inst.receiveShadow=true;scene.add(inst);
  const rm=new THREE.MeshLambertMaterial({color:new THREE.Color(0xa7adb5).convertSRGBToLinear()});
  [-.55,.55].forEach(o=>{const r=new THREE.Mesh(new THREE.BoxGeometry(66,.12,.1),rm);r.position.set(0,.16,TRAIN.z+o);scene.add(r);});
  const pf=new THREE.Mesh(new THREE.BoxGeometry(10,.3,1.8),new THREE.MeshLambertMaterial({color:new THREE.Color(0xbfb8a8).convertSRGBToLinear()}));
  pf.position.set(TRAIN.stopX-4,.15,TRAIN.z+1.9);pf.receiveShadow=true;scene.add(pf);
  put('d_sign',1.6,'h',TRAIN.stopX+1.6,TRAIN.z+2.3,0);
  train.g=new THREE.Group();
  const parts=[['loco',0],['wagon1',-3.9],['wagon2',-7.6],['wagon1',-11.3]];
  parts.forEach(([m,x])=>{const p=make(m,3.4,'xz');p.rotation.y=Math.PI/2;p.position.x=x;train.g.add(p);});
  for(let k=0;k<3;k++){const c=make('woodenbox',.9,'xz');c.position.set(-3.9-3.7*k,.95,0);c.visible=false;train.g.add(c);train.cargo.push(c);}
  train.g.position.set(-60,0,TRAIN.z);scene.add(train.g);
  hitBox(15,3,3,TRAIN.stopX-5.6,1.5,TRAIN.z,{type:'train'});
  train.label=mkLabel(new V3(TRAIN.stopX,3.4,TRAIN.z));
}
function trainToday(){
  if(level()<TRAIN.lvl||S.tg<TUT.length)return null;
  const d=today();
  if(!S.train||S.train.day!==d){
    const pool=orderPool().filter(id=>id!=='feed'),slots=[];
    while(slots.length<3&&pool.length){const id=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      const goods=!!RECIPES[id]&&id!=='flour',q=CROPS[id]?8+Math.floor(Math.random()*7):goods?2+Math.floor(Math.random()*2):3+Math.floor(Math.random()*4);
      slots.push({id,q,done:0,rew:Math.round(ITEM(id).sell*q*1.6/5)*5});}
    S.train={day:d,slots,paid:0};save();
  }
  return S.train;
}
function updTrain(dt){
  if(!train.g)return;const T0=trainToday();
  if(train.mode==='away'&&T0&&!T0.paid){train.mode='arriving';train.x=-60;SND.bite();setTimeout(()=>toast('🚂 O trem de carga chegou na estação!'),400);}
  if(train.mode==='arriving'){train.x+=Math.max(2,(TRAIN.stopX-train.x)*.9)*dt;if(train.x>=TRAIN.stopX-.05){train.x=TRAIN.stopX;train.mode='wait';}}
  else if(train.mode==='leaving'){train.x+=(4+(train.x-TRAIN.stopX)*1.2)*dt;if(train.x>60){train.mode='away';}}
  train.g.position.x=train.x;train.g.visible=train.mode!=='away';
  if((train.mode==='arriving'||train.mode==='leaving')&&Math.random()<dt*6)FX.smoke(new V3(train.x+.6,3.1,TRAIN.z));
  if(T0)T0.slots.forEach((s,k)=>{if(train.cargo[k])train.cargo[k].visible=!!s.done;});
  const done=T0?T0.slots.filter(s=>s.done).length:0;
  setLabel(train.label,train.mode==='wait'?'<span class="bub go">🚂 Trem de carga · '+done+'/3</span>':'');
}
function loadWagon(k){
  const T0=trainToday();if(!T0||T0.paid)return;const s=T0.slots[k];if(!s||s.done)return;
  if(have(s.id)<s.q){toast('Faltam '+(s.q-have(s.id))+' '+ITEM(s.id).e);SND.no();return;}
  addItem(s.id,-s.q);s.done=1;coinsGain(s.rew);gainXp(Math.round(s.rew/12));SND.deliver();
  floatText(new V3(TRAIN.stopX-3.9-3.7*k,3,TRAIN.z),'+'+s.rew+' 💰','#fff2a8');
  if(T0.slots.every(x=>x.done)){
    const bonus=Math.round(T0.slots.reduce((a,x)=>a+x.rew,0)*.3/5)*5;T0.paid=1;coinsGain(bonus);gainXp(50);
    toast('🚂 Trem completo! Bônus +💰'+bonus+' +⭐50');FX.confetti(new V3(TRAIN.stopX,3,TRAIN.z));SND.up();
    setTimeout(()=>{train.mode='leaving';},1200);closePanel();
  }
  track('deliver');hud();save();if(panel==='train')renderPanel();
}

// trator, pá carregadeira e barcos
const TRACTOR_HOME=new V3(9.7,0,-2.9);
let tractorG=null,tractorRun=null,boatG=null,rowboatG=null;
function buildVehicles(){
  tractorG=put('tractor',2.3,'xz',TRACTOR_HOME.x,TRACTOR_HOME.z,-Math.PI/2);
  boatG=put('boat',2.2,'xz',16.7,6.5,-.6);boatG.position.y=.82;
  rowboatG=put('rowboat',1.5,'xz',-21.2,-4.8,.8);rowboatG.position.y=.4;
  refreshVehicles();
}
function refreshVehicles(){
  if(tractorG)tractorG.visible=!!S.tools.tractor;
  if(boatG)boatG.visible=!!S.tools.boat;
  if(rowboatG)rowboatG.visible=!!S.zones.west;
}
function runTractor(i){
  if(!S.tools.tractor||!tractorG)return;
  const w=i>=NMAIN,z=plotPos(i).z;tractorRun={t:0,z,x0:w?-23.8:-8.6,x1:w?-15.2:8.6};
}
function updVehicles(dt){
  if(boatG&&boatG.visible){boatG.position.y=.82+Math.sin(time*1.6)*.04;boatG.rotation.z=Math.sin(time*1.1)*.04;}
  if(rowboatG&&rowboatG.visible){rowboatG.position.y=.4+Math.sin(time*1.9+1)*.03;}
  if(!tractorRun||!tractorG)return;
  const r=tractorRun;r.t+=dt;const o=tractorG;
  if(r.t<1.8){const k=r.t/1.8;o.position.set(r.x0+(r.x1-r.x0)*k,0,r.z+1.15);o.rotation.y=Math.PI/2;if(Math.random()<dt*6)FX.dust(o.position.clone().setY(.3));}
  else if(r.t<3){const k=(r.t-1.8)/1.2,a0=new V3(r.x1,0,r.z+1.15);o.position.lerpVectors(a0,TRACTOR_HOME,k);o.rotation.y=Math.atan2(TRACTOR_HOME.x-a0.x,TRACTOR_HOME.z-a0.z);}
  else{o.position.copy(TRACTOR_HOME);o.rotation.y=-Math.PI/2;tractorRun=null;}
}
function loaderFx(pos){
  if(!S.tools.loader)return;const g=put('loader',2.2,'xz',pos.x+1.6,pos.z+1.2,-2.2);
  FX.dust(pos.clone().setY(.4));setTimeout(()=>scene.remove(g),1300);
}

// ajudantes: cachorro (segue o fazendeiro) e bichos do cercado
const HELPERS={
  dog:   {name:'Cachorro',      e:'🐕',model:'q_dog',   h:.95,cost:800, lvl:3,desc:'Segue você e acha coisas enterradas'},
  donkey:{name:'Burro de carga',e:'🐴',model:'q_donkey',h:1.6,cost:900, lvl:6,desc:'+60 de espaço no celeiro e +40 no silo'},
  bull:  {name:'Touro',         e:'🐂',model:'q_bull',  h:1.7,cost:1200,lvl:7,desc:'Vacas produzem 25% mais rápido'},
  horse: {name:'Cavalo',        e:'🐎',model:'q_horse', h:1.9,cost:1500,lvl:8,desc:'Você anda mais rápido e os pedidos chegam 2x mais rápido'}
};
const pets={};
async function spawnHelper(k){
  if(pets[k])return;const H=HELPERS[k],g=await parse(H.model);if(!g)return;
  shadowize(g.scene);const obj=fit(g.scene,H.h,'h');
  const mixer=new THREE.AnimationMixer(g.scene),acts=aliasActs({});g.animations.forEach(c=>acts[c.name]=mixer.clipAction(c));aliasActs(acts);
  if(k==='dog'){const f=farmer.obj?farmer.obj.position:new V3(0,0,6);obj.position.set(f.x-1.2,0,f.z-.8);}
  else obj.position.set(PEN.x0+1.5+Math.random()*(PEN.x1-PEN.x0-3),0,PEN.z0+1.2+Math.random()*(PEN.z1-PEN.z0-2.4));
  scene.add(obj);
  const v={k,obj,mixer,acts,cur:null,tx:obj.position.x,tz:obj.position.z,wait:Math.random()*3,eat:0};
  if(k==='dog'){v.hit=hitBox(1.2,1.2,1.2,obj.position.x,.6,obj.position.z,{type:'dog'});v.next=Date.now()+T(200);v.label=mkLabel(new V3());}
  pets[k]=v;play(v,'idle');
}
function buyHelper(k){
  const H=HELPERS[k];if(S.helpers[k]||level()<H.lvl)return;
  if(S.coins<H.cost){toast('Faltam 💰'+(H.cost-S.coins));SND.no();return;}
  S.coins-=H.cost;S.helpers[k]=1;spawnHelper(k);SND.animal();toast(H.e+' '+H.name+' chegou! '+H.desc);hud();save();
}
function updPets(dt){
  for(const k in pets){const v=pets[k],o=v.obj;v.mixer.update(dt);
    if(k==='dog'){updDog(v,dt);continue;}
    if(v.eat>0){v.eat-=dt;play(v,'eat');continue;}
    const dx=v.tx-o.position.x,dz=v.tz-o.position.z,d=Math.hypot(dx,dz);
    if(d>.1){o.position.x+=dx/d*.8*dt;o.position.z+=dz/d*.8*dt;turn(o,Math.atan2(dx,dz),dt*.6);play(v,'walk');}
    else{play(v,'idle');v.wait-=dt;if(v.wait<=0){v.wait=3+Math.random()*5;
      if(Math.random()<.35){v.eat=2.5;}else{v.tx=PEN.x0+1+Math.random()*(PEN.x1-PEN.x0-2);v.tz=PEN.z0+1+Math.random()*(PEN.z1-PEN.z0-2);}}}
  }
}
function updDog(v,dt){
  const o=v.obj,f=farmer.obj;if(!f)return;
  if(!v.dig&&Date.now()>=v.next&&fishing.st==='off'){
    for(let k=0;k<12;k++){const x=o.position.x+(Math.random()-.5)*6,z=o.position.z+(Math.random()-.5)*6;if(freeSpot(x,z,.5,-1)){v.dig={x,z,t:0};break;}}
    if(!v.dig)v.next=Date.now()+T(30);
  }
  let tx,tz;
  if(v.dig){tx=v.dig.x;tz=v.dig.z;}
  else{tx=f.position.x-Math.sin(f.rotation.y)*1.2-Math.cos(f.rotation.y)*.7;tz=f.position.z-Math.cos(f.rotation.y)*1.2+Math.sin(f.rotation.y)*.7;}
  const dx=tx-o.position.x,dz=tz-o.position.z,d=Math.hypot(dx,dz);
  if(d>.25){const sp=d>4?6:2.8;o.position.x+=dx/d*Math.min(d,sp*dt);o.position.z+=dz/d*Math.min(d,sp*dt);turn(o,Math.atan2(dx,dz),dt);play(v,d>4?'run':'walk');}
  else if(v.dig){v.dig.t+=dt;play(v,'eat');if(Math.random()<dt*8)emit(o.position.clone().setY(.2),{tex:'dot',n:2,color:0xa0784a,size:.3,spd:1.5,up:2,life:.5});
    if(v.dig.t>2.2){dogFind(o.position);v.dig=null;v.next=Date.now()+T(240+Math.random()*180);}}
  else{play(v,'idle');turn(o,f.rotation.y,dt*.5);}
  v.hit.position.set(o.position.x,.6,o.position.z);v.label.pos.set(o.position.x,1.5,o.position.z);
  setLabel(v.label,v.dig&&v.dig.t>0?'<span class="bub sm">🐾</span>':'');
}
function dogFind(pos){
  const l=level(),r=Math.random();let msg;
  if(r<.4){const c=20+l*8;coinsGain(c);msg='💰'+c;}
  else if(r<.6&&!full('wood',2)){const res=Math.random()<.5?'wood':'stone';addItem(res,2);msg=PRODUCTS[res].e+'×2';}
  else if(r<.8&&!full('egg',2)){addItem('egg',2);msg='🥚×2';}
  else{gainXp(8);msg='🦴 um osso (+⭐8)';}
  floatText(pos.clone().setY(1.4),'🐕 '+msg);toast('🐕 O cachorro cavou e achou: '+msg);SND.pick();hud();save();
}
function tapDog(){const v=pets.dog;if(!v)return;emit(v.obj.position.clone().setY(1.3),{tex:'💕',n:3,size:.5,spd:.5,up:2,grav:0,life:1});SND.animal();toast('🐕 Au au!');}

// veado visitando o Pomar dos Fundos
const deer={v:null,st:'off',next:0,tapped:0,stop:0};
async function tickDeer(){
  if(!S.zones.north||deer.st!=='off'||Date.now()<deer.next)return;
  deer.st='loading';
  if(!deer.v){const g=await parse('q_deer');if(!g){deer.st='off';return;}shadowize(g.scene);const obj=fit(g.scene,1.6,'h');scene.add(obj);
    const mixer=new THREE.AnimationMixer(g.scene),acts={};g.animations.forEach(c=>acts[c.name]=mixer.clipAction(c));aliasActs(acts);
    deer.v={obj,mixer,acts,cur:null,hit:hitBox(1.6,2,1.6,0,1,0,{type:'deer'})};}
  deer.v.obj.position.set(-16,0,-15.6);deer.v.obj.visible=true;deer.st='walk';deer.tapped=0;deer.stop=2+Math.random()*3;
}
function updDeer(dt){
  if(deer.st==='off'||deer.st==='loading'||!deer.v)return;
  const v=deer.v,o=v.obj;v.mixer.update(dt);
  if(deer.stop>0&&o.position.x>-9){deer.stop-=dt;play(v,'eat');}
  else{o.position.x+=1.3*dt;o.position.z=-15.6+Math.sin(o.position.x*.3)*.6;o.rotation.y=Math.PI/2;play(v,'walk');
    if(deer.stop<=0&&o.position.x>-2&&o.position.x<-1.9)deer.stop=3;}
  v.hit.position.set(o.position.x,1,o.position.z);
  if(o.position.x>14){o.visible=false;deer.st='off';deer.next=Date.now()+T(420+Math.random()*300);}
}
function tapDeer(){
  if(deer.st!=='walk'||deer.tapped)return;deer.tapped=1;gainXp(15);
  toast('🦌 Que lindo! Um veado visitou o pomar (+⭐15)');emit(deer.v.obj.position.clone().setY(2),{tex:'star',n:8,color:0xffe066,size:.3,spd:1.5,up:2,grav:1,life:1,add:true});save();
}

// produtos guardados aparecem em volta do celeiro
const DISPLAY=[
  {m:'applecrate',x:-.5,z:-7.9,s:1.1,need:()=>have('apple')+have('greenapple')>=5},
  {m:'fishbarrel',x:-.6,z:-9.4,s:1,need:()=>have('fish')+have('carp')+have('rarefish')>=3},
  {m:'floursack',x:-9.9,z:-7.1,s:.8,need:()=>have('flour')>=2},
  {m:'basket',x:-10.0,z:-5.9,s:.8,need:()=>have('cherry')+have('grape')+have('redgrape')>=3}
];
function buildDisplay(){DISPLAY.forEach(d=>{d.g=put(d.m,d.s,'xz',d.x,d.z,Math.random()*.6);d.g.visible=false;});}
function refreshDisplay(){DISPLAY.forEach(d=>{if(d.g)d.g.visible=!!d.need();});}
const scareChance=()=>Math.min(3,S.decor.filter(d=>d&&d.k==='scarecrow').length)*.04;

// volume
const vmus=()=>S?(S.vm===undefined?1:S.vm):1, vsfx=()=>S?(S.vs===undefined?1:S.vs):1;
$('body').addEventListener('input',e=>{
  const k=e.target.dataset&&e.target.dataset.vol;if(!k)return;
  S[k]=(+e.target.value)/100;const sp=e.target.parentNode.querySelector('.vv');if(sp)sp.textContent=e.target.value+'%';
  initAudio();mixAudio();if(k==='vs'&&(!e.target._t||Date.now()-e.target._t>180)){e.target._t=Date.now();SND.click();}
});
$('body').addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.vol)save();});

/* ---------------- TOQUE / CÂMERA ---------------- */
const ptrs=new Map();let moved=0,downT=0,pinch0=0,dist0=0;
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
canvas.addEventListener('pointerdown',e=>{
  initAudio();try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){moved=0;downT=performance.now();}
  if(ptrs.size===2){const a=[...ptrs.values()];pinch0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);dist0=cam.dist;moved=99;}
});
canvas.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===1){
    moved+=Math.abs(dx)+Math.abs(dy);
    if(moved>10){const k=cam.dist*(camera.fov/38)*.0019*(700/Math.max(H,320));cam.tx-=dx*k;cam.tz-=dy*k*1.35;clampCam();}
  }else if(ptrs.size===2){
    const a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    if(pinch0>0){cam.dist=dist0*pinch0/Math.max(20,d);clampCam();}
  }
});
function endPtr(e){
  if(!ptrs.has(e.pointerId))return;
  const tap=ptrs.size===1&&moved<=10&&performance.now()-downT<500&&e.type==='pointerup';
  ptrs.delete(e.pointerId);
  if(tap)doTap(e.clientX,e.clientY);
}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.dist*=e.deltaY>0?1.1:.9;clampCam();},{passive:false});
function clampCam(){cam.dist=Math.max(11,Math.min(40,cam.dist));cam.tx=Math.max(-24,Math.min(23,cam.tx));cam.tz=Math.max(-18,Math.min(21,cam.tz));}
function doTap(x,y){
  // pescando: qualquer toque na tela puxa a linha
  if(fishing.st==='wait'||fishing.st==='bite'){pull();return;}
  ndc.set(x/W*2-1,-(y/H)*2+1);ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(pickables,false);
  // prioridade: animal > canteiro > resto
  if(place.on){placeAt(x,y);return;}
  const live=hits.filter(k=>{const u=k.object.userData;
    if(u.type==='plot')return plotState(u.i)!=='hidden';
    if(u.type==='tree')return treeState(u.i)!=='hidden';
    if(u.type==='decor')return editMode;
    if(u.type==='zone')return !S.zones[u.id];
    if(u.type==='clutter')return !S.zones[u.id]&&!zCleared(u.id,u.ci);
    if(u.type==='wild')return !!S.wild[u.i];
    if(u.type==='train')return train.mode==='wait';
    if(u.type==='deer')return deer.st==='walk'&&!deer.tapped;
    if(u.type==='pond'&&u.id==='small')return !!S.zones.west;
    if(u.type==='visitor')return !!(visV[u.i]&&visV[u.i].st==='wait');
    if(u.type==='gift')return EVENT==='natal'&&S.gifts&&!S.gifts.got[u.i];
    return true;});
  if(editMode){const dh=live.find(k=>k.object.userData.type==='decor');if(dh)pickDecor(dh.object.userData.i);return;}
  const h=live.find(k=>k.object.userData.type==='animal'||k.object.userData.type==='visitor'||k.object.userData.type==='gift')||live[0];
  if(!h)return;
  const d=h.object.userData;
  if(d.type!=='pond'&&fishing.st!=='off')stopFishing();
  if(d.type==='plot')tapPlot(d.i);
  else if(d.type==='animal')tapAnimal(d.idx);
  else if(d.type==='barn'){goFarmer(-5.2,-3.6,'idle',new V3(-5.2,0,-7.2));openPanel('barn');}
  else if(d.type==='truck')openPanel('orders');
  else if(d.type==='fac')tapFac(d.id);
  else if(d.type==='tree')tapTree(d.i);
  else if(d.type==='pond')tapPond(d.id);
  else if(d.type==='zone')openPanel('zones');
  else if(d.type==='clutter')chopClutter(d.id,d.ci);
  else if(d.type==='wild')chopWild(d.i);
  else if(d.type==='market'){if(level()<MARKET.lvl){toast('🏪 O mercado abre no nível '+MARKET.lvl);SND.no();}else openPanel('market');}
  else if(d.type==='train')openPanel('train');
  else if(d.type==='dog')tapDog();
  else if(d.type==='deer')tapDeer();
  else if(d.type==='silo'){goFarmer(-9.6,-7.4,'idle',new V3(-9.6,0,-9.6));openPanel('barn');}
  else if(d.type==='visitor')openPanel('visitor',d.i);
  else if(d.type==='gift')openGift(d.i);
}

/* ---------------- LOOP ---------------- */
let last=performance.now(),slow=0,time=0,panelT=0,fpsN=0,fpsT=0,fpsWarned=false;
const barnLabelPos=new V3(-5.2,5.2,-7.2),truckLabelPos=new V3(-12.5,3.4,2.5);
let barnLabel=null,truckLabel=null,siloLabel=null;
function frame(now){
  if(LOWQ&&now-last<30){requestAnimationFrame(frame);return;}     // qualidade baixa: no máx. ~30 fps
  const dt=Math.min(.1,(now-last)/1000);last=now;time+=dt;
  fpsN++;fpsT+=dt;
  slow-=dt;
  const doSlow=slow<=0;if(doSlow)slow=.25;
  // canteiros
  for(let i=0;i<NPLOT;i++){
    const v=plots[i],st=plotState(i),p=S.plots[i];
    if(p.c){
      const pr=p.w?plotProg(i):0,s=p.w?.3+.7*pr:.22;
      const wob=st==='ready'?1+Math.sin(time*5+i)*.06:1;
      v.crop.scale.set(s,s*wob,s);
    }
    if(doSlow){
      let html='';
      if(st==='next')html='<span class="bub lock">🔒 💰'+plotCost(S.np)+'</span>';
      else if(st==='dry')html='<span class="bub go">💧</span>';
      else if(st==='ready')html='<span class="bub go">'+CROPS[p.c].e+'</span>';
      else if(st==='grow')html=bar(plotProg(i));
      setLabel(v.label,html);
      if(v.shown!==st){v.shown=st;refreshPlot(i);}
    }
  }
  for(let i=0;i<animalsV.length;i++)updAnimal(animalsV[i],dt);
  updFarmer(dt);updTool(dt);updFacs(dt);updNature(dt);updFishing(dt);updJumps(dt);updParts(dt);updVisitors(dt);rain.upd(dt);rainbow.upd(dt);updEvent(dt);updPlace();updCars(dt);updTrain(dt);updVehicles(dt);updPets(dt);updDeer(dt);
  // caminhão indo e voltando
  if(truckAnim){
    truckAnim.t+=dt;const t=truckAnim.t;
    // o caminhão sempre anda de frente (+z): sai pela estrada e volta pelo outro lado
    if(t<2.5)truck.position.z=2.5+t*t*6;
    else if(t<5)truck.position.z=-60;
    else if(t<8){const k=1-(t-5)/3;truck.position.z=2.5-k*k*45;}
    else{truck.position.z=2.5;truckAnim=null;}
  }
  if(doSlow){
    tickOrders();regenFish();updTrees(dt);updWeather();updDay();tickVisitors();mixAudio();tickWild();tickDeer();refreshTown();refreshVehicles();refreshDisplay();
    for(const id in FACTORIES)setLabel(facV[id].label,facLabel(id));
    setLabel(barnLabel,'<span class="bub">📦 '+stored()+'/'+cap()+'</span>');setLabel(siloLabel,'<span class="bub sm">🌾 '+siloUsed()+'/'+siloCap()+'</span>');
    const n=S.orders.filter(o=>o&&canDeliver(o)).length;
    setLabel(truckLabel,truckAnim?'':'<span class="bub'+(n?' go':'')+'">🚚 '+(n?n+' pronto'+(n>1?'s':''):'Pedidos')+'</span>');
    if(level()>=FISH.lvl){
      if(!(fishing.st==='bite'&&curPond==='big'))setLabel(pondLabel,'<span class="bub sm">🎣 '+S.fe+'</span>');
      if(!(fishing.st==='bite'&&curPond==='small'))setLabel(pondSLabel,S.zones.west?'<span class="bub sm">🎣 '+S.fish2.fe+'</span>':'');}
    if(pondS)pondS.visible=!!S.zones.west;
    if(fishing.st!=='off')showFishBar();
    panelT+=.25;if(panelT>=1&&(panel==='orders'||panel==='fac')){panelT=0;renderPanel();}
    if(Math.floor(time)%30===0&&S.tg>=TUT.length)checkDaily();
    saveT+=.25;if(saveT>=10){saveT=0;save();}
  }
  updTut();
  placeCam();
  // projeta rótulos
  for(const l of labels){
    if(!l.html){l.el.style.display='none';continue;}
    project(l.pos,P2);
    if(!P2.vis||P2.x<-60||P2.x>W+60||P2.y<-40||P2.y>H+60){l.el.style.display='none';continue;}
    l.el.style.display='block';l.el.style.transform='translate('+P2.x.toFixed(1)+'px,'+P2.y.toFixed(1)+'px) translate(-50%,-100%)';
  }
  for(let i=floats.length-1;i>=0;i--){
    const f=floats[i];f.t+=dt;f.pos.y+=dt*1.3;project(f.pos,P2);
    f.el.style.transform='translate('+P2.x.toFixed(1)+'px,'+P2.y.toFixed(1)+'px) translate(-50%,-100%)';
    f.el.style.opacity=String(Math.max(0,1-f.t/1.2));
    if(f.t>1.2){f.el.remove();floats.splice(i,1);}
  }
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}

/* ---------------- INÍCIO ---------------- */
/* ---------------- COMO JOGAR E GUIA ---------------- */
FSG.onClick=()=>{try{SND.click();}catch(e){}};
function howTo(){
  FSG.slides({title:'Como jogar · Harvest Hollow',accent:'#4caf50',slides:[
    {e:'🌾',t:'Sua fazenda',x:'Plante, cuide dos animais e produza coisas gostosas. Venda tudo para crescer a fazenda e subir de nível.'},
    {e:'🥕',t:'Plantar, regar e colher',x:'Toque num canteiro vazio e escolha a semente. Toque nele de novo para <b>regar</b> 💧 e, quando estiver pronto, para <b>colher</b> 🧺.'},
    {e:'🐔',t:'Animais',x:'Compre na 🛒 Loja. Eles comem 🌾 trigo, 🥫 ração ou 🥕 cenoura e dão ovos, leite, lã e trufas. Toque no animal para alimentar e coletar.'},
    {e:'🚚',t:'Venda',x:'O caminhão traz pedidos que pagam mais. Visitantes, o mercado da cidade e o trem também compram. O celeiro guarda os produtos e o silo guarda as colheitas.'},
    {e:'🌀',t:'Fábricas',x:'Moinho, laticínio, forno e outras fábricas transformam o que você produz em itens que valem muito mais.'},
    {e:'⭐',t:'Suba de nível',x:'Cada coisa feita dá ⭐ experiência. Novos níveis liberam plantas, animais, árvores, fábricas e terrenos. Veja tudo no ☰ Menu → Guia.'}]});
}
function openGuide(){
  const L=lv=>'Nível '+lv+(level()<lv?' 🔒':'');
  const nm=id=>{const I=ITEM(id);return I?I.e+' '+I.name:id;};
  const inp=o=>Object.keys(o).map(k=>o[k]+' '+ITEM(k).e).join(' + ');
  const crops=Object.keys(CROPS).map(k=>{const C=CROPS[k];return {e:C.e,n:C.name,sub:L(C.lvl),lock:level()<C.lvl,
    d:'Plante num canteiro, regue e colha.'+(k==='wheat'?' Também é a comida da galinha, da vaca, do porco e da alpaca.':k==='carrot'?' É a comida do coelho angorá.':''),
    st:[['Semente','💰 '+C.cost],['Tempo para crescer',fmtT(C.time)],['Venda','💰 '+C.sell],['Experiência','⭐ '+C.xp]]};});
  const anim=Object.keys(ANIMALS).map(k=>{const A=ANIMALS[k];return {e:A.e,n:A.name,sub:L(A.lvl)+' · celeiro '+A.barn,lock:level()<A.lvl,
    d:'Alimente para ele produzir. Quando o produto estiver pronto, toque no animal para coletar.',
    st:[['Preço','💰 '+A.cost],['Come',A.feed+' '+ITEM(A.food).e+' '+ITEM(A.food).name.toLowerCase()],['Produz',(A.n||1)+' '+nm(A.prod)],['Tempo',fmtT(A.time)],['Venda do produto','💰 '+ITEM(A.prod).sell]]};});
  const trees=Object.keys(TREES).map(k=>{const T=TREES[k];return {e:ITEM(T.fruit).e,n:T.name,sub:L(T.lvl),lock:level()<T.lvl,
    d:'Árvores dão frutas para sempre. Plante nos espaços na frente dos canteiros.'+(T.rare?' Às vezes dá a fruta rara '+nm(T.rare)+' (15%).':''),
    st:[['Preço','💰 '+T.cost],['Fruta',T.n+' '+nm(T.fruit)],['Tempo',fmtT(T.time)],['Venda','💰 '+ITEM(T.fruit).sell+' cada']]};});
  const facs=Object.keys(FACTORIES).map(k=>{const F=FACTORIES[k];return {e:F.e,n:F.name,sub:L(F.lvl),lock:level()<F.lvl,
    d:'Coloque até '+F.slots+' receitas na fila. Elas ficam prontas mesmo com o jogo fechado. Melhorar a fábrica dá mais vagas e deixa mais rápida.',
    st:[['Construir','💰 '+F.cost]].concat(F.recipes.map(r=>{const R=RECIPES[r];return [(R.n>1?R.n+' ':'')+nm(r),inp(R.in)+' · '+fmtT(R.time)];}))};});
  const src={};
  for(const k in CROPS)src[k]='Colheita: plante no canteiro';
  for(const k in ANIMALS){const A=ANIMALS[k];src[A.prod]=(src[A.prod]?src[A.prod]+' e ':'Animal: ')+A.name.toLowerCase();}
  for(const k in TREES){src[TREES[k].fruit]='Árvore: '+TREES[k].name.toLowerCase();if(TREES[k].rare)src[TREES[k].rare]='Rara na '+TREES[k].name.toLowerCase()+' (15%)';}
  for(const f in FACTORIES)FACTORIES[f].recipes.forEach(r=>{src[r]=FACTORIES[f].name+': '+inp(RECIPES[r].in);});
  Object.assign(src,{fish:'Pesca no lago',carp:'Pesca no lago',rarefish:'Pesca (raro)',shark:'Pesca: lendário (1%, 3% com a vara pro)',wood:'Machado no mato das bordas',stone:'Picareta nas pedras das bordas'});
  const prods=Object.keys(PRODUCTS).map(k=>{const P=PRODUCTS[k];return {e:P.e,n:P.name,sub:'Vende por 💰 '+P.sell,d:src[k]||'',st:[['Venda','💰 '+P.sell],['Experiência','⭐ '+P.xp]]};});
  const tools=Object.keys(TOOLS).map(k=>{const T=TOOLS[k];return {e:T.e,n:T.name,sub:L(T.lvl),lock:level()<T.lvl,d:T.desc+'.',st:[['Preço','💰 '+T.cost]]};})
    .concat(CANS.slice(1).map((C,i)=>({e:'🚿',n:C.name,sub:C.lvl?L(C.lvl):'Começa com ele',d:C.desc+'.',st:C.cost?[['Preço','💰 '+C.cost]]:[]})))
    .concat(Object.keys(HELPERS).map(k=>{const H=HELPERS[k];return {e:H.e,n:H.name,sub:'Ajudante · '+L(H.lvl),lock:level()<H.lvl,d:H.desc+'.',st:[['Preço','💰 '+H.cost]]};}));
  const fish=[{e:'🎣',n:'Como pescar',sub:L(FISH.lvl),d:'Toque no lago e espere o peixe morder. Quando aparecer o aviso, toque em <b>Puxar</b> rápido! As iscas 🪱 recarregam com o tempo.'}]
    .concat(ALBUM.map(a=>({e:a.e,n:a.name,sub:a.id==='shark'?'Lendário':a.id==='bone'?'Lixo':a.id==='rarefish'?'Raro':'Comum',d:a.id==='bone'?'Não vale nada, mas conta para o álbum.':'Vende por 💰 '+(ITEM(a.id)?ITEM(a.id).sell:0)+'. Complete o álbum de peixes para ganhar 💰'+ALBUM_REWARD+'.'})));
  const tips=[{e:'🚚',n:'Pedidos do caminhão',sub:'Pagam 1,5x',d:'Entregue os itens pedidos para ganhar mais que vendendo no celeiro. Pedidos ruins podem ser trocados no ✕.'},
    {e:'🙋',n:'Visitantes',sub:'Pagam 1,8x',d:'Aparecem a partir do nível 3 pedindo um item.'},
    {e:'📅',n:'Missões diárias',sub:'Baú de prêmio',d:'Todo dia 3 missões novas. Complete as três para abrir o baú 🎁.'},
    {e:'🌧️',n:'Chuva e arco-íris',sub:'Clima',d:'A chuva rega os canteiros sozinha. Depois vem o arco-íris: cada colheita rende +1 por 1 minuto.'},
    {e:'🏆',n:'Conquistas',sub:'Longo prazo',d:'Objetivos com 4 níveis cada, que dão moedas e experiência.'},
    {e:'📦',n:'Celeiro e silo',sub:'Espaço',d:'O silo guarda as colheitas e o celeiro guarda o resto. Melhore os dois na Loja quando encher.'}];
  FSG.guide({title:'📖 Guia · Harvest Hollow',accent:'#4caf50',tabs:[{name:'Plantações',items:crops},{name:'Animais',items:anim},{name:'Árvores',items:trees},{name:'Fábricas',items:facs},{name:'Produtos',items:prods},{name:'Ferramentas',items:tools},{name:'Pesca',items:fish},{name:'Dicas',items:tips}]});
}
async function boot(){
  S=load();
  const names=Object.keys(MODELS).filter(n=>!n.startsWith('pet_')&&n!=='farmer');
  let done=0;
  await Promise.all(names.map(async n=>{LIB[n]=await parse(n);done++;$('lbar').style.width=Math.round(done/names.length*100)+'%';}));
  buildWorld();initFireflies();
  barnLabel=mkLabel(barnLabelPos);truckLabel=mkLabel(truckLabelPos);siloLabel=mkLabel(new V3(-9.6,4.6,-9.6));
  for(let i=0;i<S.animals.length;i++)await spawnAnimal(i);
  await spawnFarmer();
  // o que aconteceu enquanto esteve fora
  regenFish();
  let ready=0;for(let i=0;i<NPLOT;i++)if(plotState(i)==='ready')ready++;
  S.animals.forEach(a=>{if(animalState(a)==='ready')ready++;});
  for(const id in FACTORIES)ready+=facDone(id);
  for(let i=0;i<TREE_SLOTS.length;i++)if(S.trees[i]&&treeState(i)==='ready')ready++;
  refreshAll();updDay();
  $('load').style.display='none';
  if(S.tg===0&&!S.howSeen){S.howSeen=1;save();setTimeout(()=>howTo(),500);}
  if(S.tg>=TUT.length)checkDaily();
  if(ready&&S.tg>=TUT.length)toast('Bem-vindo de volta! '+ready+' coisa'+(ready>1?'s':'')+' pronta'+(ready>1?'s':'')+' para coletar 🌟');
  if(DEV>1)toast('Modo teste: tempos '+DEV+'x mais rápidos');
  if(EVENT&&S.tg>=TUT.length)toast({natal:'🎄 Evento de Natal! Procure presentes pela fazenda',junina:'🌽 Festa Junina! Milho rende em dobro',halloween:'🎃 Halloween! Abóboras rendem em dobro e brilham à noite'}[EVENT]||'');
  for(let i=0;i<2;i++)if(S.visitors[i])spawnVisitor(i,true);
  S.wild.forEach((w,i)=>spawnWild(i));
  for(const k in S.helpers)if(S.helpers[k])spawnHelper(k);if(!S.wnext)S.wnext=Date.now()+T(60);
  if(S.tg>=TUT.length&&loginPending())setTimeout(()=>{if(!panel)openPanel('login');},1600);
  // celular fraco? sugere qualidade baixa
  setTimeout(()=>{if(!LOWQ&&fpsT>0&&fpsN/fpsT<24&&!fpsWarned){fpsWarned=true;toast('Jogo lento? Use ☰ Menu → Qualidade baixa');}},9000);
  // ajuda se ficar sem nada
  setInterval(()=>{
    const planted=S.plots.some(p=>p.c);
    if(S.coins<4&&!planted&&!stored()&&!S.animals.some(a=>a.f)){S.coins+=15;toast('O vizinho te emprestou 💰15 para recomeçar');hud();save();}
  },4000);
  addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();if(AC){try{document.hidden?AC.suspend():AC.resume();}catch(e){}}});
  const tog=()=>{$('bMus').classList.toggle('off',S.mus===0);$('bSfx').classList.toggle('off',S.sfx===0);};
  $('bMus').addEventListener('click',()=>{initAudio();S.mus=S.mus===0?1:0;if(S.mus===0)stopMusic();else startMusic();tog();save();});
  $('bSfx').addEventListener('click',()=>{initAudio();S.sfx=S.sfx===0?1:0;tog();SND.click();save();});
  tog();
  window.__audioDbg=()=>({state:AC&&AC.state,bufs:Object.keys(BUF),music:!!musicSrc,mus:S.mus});
  window.__game={S:()=>S,tapPlot,tapAnimal,tapFac,tapTree,tapPond,pull,fishing,openPanel,closePanel,cam,setSeed:s=>{selSeed=s;openSeeds();},
    vis:visV,pets,train,deer,loadWagon,marketSell,buyHelper,runTractor,upgradeCan,dropLeaf,splashAt,hud,refreshAll,deliver,upgradeFac,upgradeTruck,upgradeSilo,buyTool,spawnWildNow:()=>{S.wnext=0;tickWild();},chopWild,claimLogin,buyZone,buyDecor,placeAt,confirmPlace,spinWheel,serveVisitor,newVisitor,wx,forceRain:v=>{wx.force=v;},buildFac,startRecipe,collectFac,plantTree,claimMission,claimChest,checkDaily,gainXp,farmer,level,save};
  requestAnimationFrame(frame);
}
window.__ui={toast:m=>toast(m),renderPanel:()=>renderPanel(),panel:()=>panel};   // usado pelo cloud.js (site)
boot().catch(e=>{$('lmsg').textContent='Erro ao carregar: '+e.message;console.error(e);});
})();
