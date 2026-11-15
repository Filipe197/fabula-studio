/* Fabula Studio · Tutorial + Guia (componente compartilhado entre os jogos)
   FSG.slides({title, slides:[{img|e, t, x}], done, accent})   → "Como jogar" em cartões
   FSG.coach({steps:[{x, el, at, done, btn}], done, skip})       → tutorial guiado com seta e destaque
   FSG.guide({title, tabs:[{name, items:[{img|e, n, sub, d, st:[[rótulo,valor]], lock}]}], tab}) → enciclopédia
   Tudo cabe na tela do celular, em pé ou deitado. */
(function(){
'use strict';
const css=`
.fsg-ov{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(6,14,26,.62);backdrop-filter:blur(3px);padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));font-family:inherit;color:#fff;-webkit-user-select:none;user-select:none}
.fsg-box{position:relative;background:#16324a;border:2px solid rgba(255,255,255,.16);border-radius:22px;box-shadow:0 18px 50px rgba(0,0,0,.45);display:flex;flex-direction:column;overflow:hidden;width:min(860px,100%);max-height:100%}
.fsg-hd{display:flex;align-items:center;gap:10px;padding:10px 12px 8px 16px;flex-shrink:0}
.fsg-hd h2{margin:0;font-size:20px;flex:1;line-height:1.15}
.fsg-x{border:0;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:18px;font-weight:900;cursor:pointer;flex-shrink:0}
.fsg-btn{border:0;border-radius:14px;padding:11px 18px;font:inherit;font-weight:900;font-size:16px;color:#fff;background:var(--fsg-ac,#35b56a);box-shadow:0 4px 0 rgba(0,0,0,.25);cursor:pointer;min-height:44px}
.fsg-btn.gh{background:rgba(255,255,255,.14)}
.fsg-btn:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(0,0,0,.25)}
/* cartões do como jogar */
.fsg-sl{display:flex;align-items:center;gap:18px;padding:6px 22px 4px;min-height:0;flex:1}
.fsg-sl .fsg-im{width:150px;height:150px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:84px;background:rgba(255,255,255,.07);border-radius:24px}
.fsg-sl .fsg-im img{max-width:100%;max-height:100%}
.fsg-sl h3{margin:0 0 6px;font-size:22px;line-height:1.15}
.fsg-sl p{margin:0;font-size:16px;line-height:1.45;opacity:.92}
.fsg-ft{display:flex;align-items:center;gap:10px;padding:10px 14px 14px;flex-shrink:0}
.fsg-dots{flex:1;display:flex;gap:6px;justify-content:center}
.fsg-dots i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.25)}
.fsg-dots i.fsg-on{background:var(--fsg-ac,#35b56a);width:22px;border-radius:9px}
/* guia */
.fsg-tabs{display:flex;gap:6px;padding:0 12px 8px;overflow-x:auto;flex-shrink:0;scrollbar-width:none}
.fsg-tabs::-webkit-scrollbar{display:none}
.fsg-tabs button{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:800;font-size:14px;color:#fff;background:rgba(255,255,255,.1);cursor:pointer;white-space:nowrap;min-height:38px;flex-shrink:0}
.fsg-tabs button.fsg-on{background:var(--fsg-ac,#35b56a)}
.fsg-main{display:flex;min-height:0;flex:1;border-top:1px solid rgba(255,255,255,.1)}
.fsg-list{flex:1 1 52%;overflow-y:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;align-content:start;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.fsg-it{border:2px solid transparent;border-radius:16px;background:rgba(255,255,255,.07);padding:8px 4px 7px;color:#fff;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;min-height:96px}
.fsg-it.fsg-on{border-color:var(--fsg-ac,#35b56a);background:rgba(255,255,255,.14)}
.fsg-it .fsg-ic{width:54px;height:54px;display:flex;align-items:center;justify-content:center;font-size:36px}
.fsg-it .fsg-ic img{max-width:100%;max-height:100%}
.fsg-it b{font-size:12.5px;line-height:1.15;text-align:center}
.fsg-it.fsg-lk{opacity:.5}
.fsg-det{flex:1 1 48%;overflow-y:auto;padding:14px 16px;border-left:1px solid rgba(255,255,255,.1);-webkit-overflow-scrolling:touch;touch-action:pan-y}
.fsg-det .fsg-top{display:flex;gap:12px;align-items:center;margin-bottom:8px}
.fsg-det .fsg-top .fsg-ic{width:72px;height:72px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:50px;background:rgba(255,255,255,.07);border-radius:18px}
.fsg-det .fsg-top .fsg-ic img{max-width:100%;max-height:100%}
.fsg-det h3{margin:0;font-size:20px;line-height:1.15}
.fsg-det .fsg-sub{font-size:13px;font-weight:800;opacity:.75;margin-top:2px}
.fsg-det p{margin:6px 0 10px;font-size:15px;line-height:1.45}
.fsg-st{width:100%;border-collapse:collapse;font-size:14px}
.fsg-st td{padding:6px 4px;border-top:1px solid rgba(255,255,255,.1)}
.fsg-st td:last-child{text-align:right;font-weight:800;white-space:nowrap}
.fsg-back{display:none;margin-bottom:8px}
.fsg-empty{opacity:.7;font-size:14px;padding:20px 6px;text-align:center}
@media (max-width:620px){
 .fsg-main{position:relative}
 .fsg-det{position:absolute;inset:0;background:#16324a;border-left:0;display:none}
 .fsg-main.fsg-det2 .fsg-det{display:block}
 .fsg-back{display:inline-block}
 .fsg-list{grid-template-columns:repeat(auto-fill,minmax(86px,1fr))}
}
@media (max-height:460px){
 .fsg-hd{padding:6px 10px 4px 14px}.fsg-hd h2{font-size:17px}.fsg-x{width:38px;height:38px}
 .fsg-sl .fsg-im{width:110px;height:110px;font-size:62px}.fsg-sl h3{font-size:19px}.fsg-sl p{font-size:14.5px}
 .fsg-ft{padding:6px 12px 10px}.fsg-btn{padding:8px 14px;font-size:15px;min-height:40px}
 .fsg-tabs{padding-bottom:6px}.fsg-tabs button{padding:6px 12px;min-height:34px;font-size:13px}
 .fsg-it{min-height:84px}.fsg-it .fsg-ic{width:44px;height:44px;font-size:30px}
}
@media (max-width:520px){.fsg-sl{flex-direction:column;text-align:center;gap:10px;padding:4px 16px}.fsg-sl .fsg-im{width:120px;height:120px;font-size:66px}}
/* tutorial guiado */
.fsg-coach{position:fixed;inset:0;z-index:999;pointer-events:none}
.fsg-ring{position:fixed;border-radius:18px;box-shadow:0 0 0 4px #ffd65c,0 0 0 9999px rgba(6,14,26,.35);transition:all .25s;pointer-events:none;animation:fsgp 1.1s ease-in-out infinite alternate}
.fsg-ring.fsg-pt{border-radius:50%}
@keyframes fsgp{to{box-shadow:0 0 0 7px #ffd65c,0 0 0 9999px rgba(6,14,26,.35)}}
.fsg-hand{position:fixed;font-size:40px;pointer-events:none;transform:translate(-30%,0);animation:fsgh .8s ease-in-out infinite alternate;filter:drop-shadow(0 3px 3px rgba(0,0,0,.45))}
@keyframes fsgh{to{margin-top:-12px}}
.fsg-tip{position:fixed;pointer-events:auto;background:#fff;color:#1f3140;border-radius:16px;padding:10px 12px 10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.35);font-weight:800;font-size:15px;line-height:1.35;width:min(330px,calc(100vw - 20px));display:flex;flex-direction:column;gap:8px}
.fsg-tip .fsg-n{font-size:11px;font-weight:900;color:#7a8b96;letter-spacing:.04em}
.fsg-tip .fsg-r{display:flex;gap:8px;justify-content:flex-end;align-items:center}
.fsg-tip .fsg-sk{border:0;background:none;color:#7a8b96;font:inherit;font-weight:800;font-size:13px;cursor:pointer;padding:6px;min-height:36px}
.fsg-tip .fsg-btn{padding:7px 14px;font-size:14px;min-height:38px}
`;
let styled=false;
function style(){if(styled)return;styled=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);}
const icon=o=>o.img?'<img src="'+o.img+'" alt="">':(o.e||'');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function overlay(accent){style();const ov=document.createElement('div');ov.className='fsg-ov';if(accent)ov.style.setProperty('--fsg-ac',accent);
  ['pointerdown','touchstart','wheel','keydown'].forEach(ev=>ov.addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
  document.body.appendChild(ov);return ov;}
const sound=()=>{try{FSG.onClick&&FSG.onClick();}catch(e){}};

const FSG={onClick:null,open:0};

// ----- como jogar (cartões) -----
FSG.slides=function(o){
  const ov=overlay(o.accent);FSG.open++;let i=0;const N=o.slides.length;
  const close=(fin)=>{ov.remove();FSG.open--;if(o.done)o.done(fin);};
  function draw(){const s=o.slides[i];
    ov.innerHTML='<div class="fsg-box" style="width:min(640px,100%)"><div class="fsg-hd"><h2>'+esc(o.title||'Como jogar')+'</h2><button class="fsg-x" data-a="x" aria-label="Fechar">✕</button></div>'+
      '<div class="fsg-sl"><div class="fsg-im">'+icon(s)+'</div><div><h3>'+esc(s.t)+'</h3><p>'+(s.x||'')+'</p></div></div>'+
      '<div class="fsg-ft"><button class="fsg-btn gh" data-a="p"'+(i?'':' style="visibility:hidden"')+'>‹ Voltar</button><div class="fsg-dots">'+o.slides.map((_,k)=>'<i class="'+(k===i?'fsg-on':'')+'"></i>').join('')+'</div>'+
      '<button class="fsg-btn" data-a="n">'+(i<N-1?'Próximo ›':(o.last||'Jogar!'))+'</button></div></div>';}
  ov.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;sound();const k=a.dataset.a;
    if(k==='x')close(false);else if(k==='p'){i=Math.max(0,i-1);draw();}else if(k==='n'){if(i<N-1){i++;draw();}else close(true);}});
  draw();return {close};
};

// ----- guia / enciclopédia -----
FSG.guide=function(o){
  const ov=overlay(o.accent);FSG.open++;let t=o.tab||0,sel=0;
  const close=()=>{ov.remove();FSG.open--;if(o.done)o.done();};
  function det(it){if(!it)return '<div class="fsg-empty">Toque num item para ver os detalhes.</div>';
    return '<button class="fsg-btn gh fsg-back" data-a="b">‹ Lista</button><div class="fsg-top"><div class="fsg-ic">'+icon(it)+'</div><div><h3>'+esc(it.n)+'</h3>'+(it.sub?'<div class="fsg-sub">'+esc(it.sub)+'</div>':'')+'</div></div>'+
      (it.d?'<p>'+it.d+'</p>':'')+(it.st&&it.st.length?'<table class="fsg-st">'+it.st.map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+r[1]+'</td></tr>').join('')+'</table>':'');}
  function draw(keepScroll){const T=o.tabs[t];const L=ov.querySelector('.fsg-list');const sc=keepScroll&&L?L.scrollTop:0;
    ov.innerHTML='<div class="fsg-box" style="height:min(600px,100%)"><div class="fsg-hd"><h2>'+esc(o.title||'Guia')+'</h2><button class="fsg-x" data-a="x" aria-label="Fechar">✕</button></div>'+
      '<div class="fsg-tabs">'+o.tabs.map((x,k)=>'<button data-t="'+k+'" class="'+(k===t?'fsg-on':'')+'">'+esc(x.name)+'</button>').join('')+'</div>'+
      '<div class="fsg-main"><div class="fsg-list">'+T.items.map((it,k)=>'<button class="fsg-it'+(k===sel?' fsg-on':'')+(it.lock?' fsg-lk':'')+'" data-i="'+k+'"><span class="fsg-ic">'+icon(it)+'</span><b>'+esc(it.n)+'</b></button>').join('')+'</div>'+
      '<div class="fsg-det">'+det(T.items[sel])+'</div></div></div>';
    if(sc)ov.querySelector('.fsg-list').scrollTop=sc;}
  ov.addEventListener('click',e=>{
    if(e.target===ov){close();return;}
    const a=e.target.closest('[data-a],[data-t],[data-i]');if(!a)return;sound();
    if(a.dataset.a==='x')close();
    else if(a.dataset.a==='b')ov.querySelector('.fsg-main').classList.remove('fsg-det2');
    else if(a.dataset.t!=null){t=+a.dataset.t;sel=0;draw();}
    else if(a.dataset.i!=null){sel=+a.dataset.i;draw(true);ov.querySelector('.fsg-main').classList.add('fsg-det2');}
  });
  draw();return {close};
};

// ----- tutorial guiado (seta + destaque + balão) -----
FSG.coach=function(o){
  style();const root=document.createElement('div');root.className='fsg-coach';
  root.innerHTML='<div class="fsg-ring" style="display:none"></div><div class="fsg-hand" style="display:none">👆</div><div class="fsg-tip"><div class="fsg-n"></div><div class="fsg-tx"></div><div class="fsg-r"><button class="fsg-sk">Pular tutorial</button><button class="fsg-btn fsg-nx" style="display:none">Entendi</button></div></div>';
  if(o.accent)root.style.setProperty('--fsg-ac',o.accent);
  document.body.appendChild(root);
  const ring=root.querySelector('.fsg-ring'),hand=root.querySelector('.fsg-hand'),tip=root.querySelector('.fsg-tip'),nx=root.querySelector('.fsg-nx');
  ['pointerdown','touchstart'].forEach(ev=>tip.addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
  let i=-1,alive=true,shownAt=0;
  const end=(skipped)=>{if(!alive)return;alive=false;root.remove();clearInterval(iv);if(o.done)o.done(!skipped);};
  root.querySelector('.fsg-sk').onclick=()=>{sound();end(true);};
  nx.onclick=()=>{sound();next();};
  function next(){i++;if(i>=o.steps.length){end(false);return;}const s=o.steps[i];if(s.enter)try{s.enter();}catch(e){}
    root.querySelector('.fsg-n').textContent='TUTORIAL · '+(i+1)+'/'+o.steps.length;root.querySelector('.fsg-tx').innerHTML=s.x;
    nx.style.display=s.done?'none':'';nx.textContent=s.btn||(i===o.steps.length-1?'Começar!':'Entendi');shownAt=performance.now();tick();}
  function place(){const s=o.steps[i];if(!s)return;let r=null,pt=null;
    if(FSG.open>0){ring.style.display=hand.style.display='none';tip.style.visibility='hidden';return;}
    tip.style.visibility='';
    try{if(s.el){const el=typeof s.el==='function'?s.el():document.querySelector(s.el);if(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'){const b=el.getBoundingClientRect();if(b.width)r=b;}}
        if(!r&&s.at){const p=s.at();if(p&&p[0]>-50&&p[0]<innerWidth+50&&p[1]>-50&&p[1]<innerHeight+50)pt=p;}}catch(e){}
    const W=innerWidth,H=innerHeight;let cx,cy,hr;
    if(r){const pad=6;ring.className='fsg-ring';Object.assign(ring.style,{display:'',left:(r.left-pad)+'px',top:(r.top-pad)+'px',width:(r.width+pad*2)+'px',height:(r.height+pad*2)+'px'});cx=r.left+r.width/2;cy=r.top+r.height/2;hr=Math.max(r.width,r.height)/2;}
    else if(pt){const R=s.r||34;ring.className='fsg-ring fsg-pt';Object.assign(ring.style,{display:'',left:(pt[0]-R)+'px',top:(pt[1]-R)+'px',width:R*2+'px',height:R*2+'px'});cx=pt[0];cy=pt[1];hr=R;}
    else{ring.style.display='none';hand.style.display='none';}
    if(r||pt){hand.style.display='';const below=cy<H*.5;hand.textContent=below?'👆':'👇';hand.style.left=cx+'px';hand.style.top=(below?cy+hr*.55:cy-hr*.55-46)+'px';}
    // balão no lado oposto ao alvo
    const tw=tip.offsetWidth,th=tip.offsetHeight;let tx=W/2-tw/2,ty;
    if(r||pt){if(cy<H*.5)ty=Math.min(H-th-10,cy+hr+56);else ty=Math.max(10,cy-hr-th-60);
      if(ty<10||ty+th>H-10){ty=H/2-th/2;tx=cx<W/2?Math.min(W-tw-10,cx+hr+40):Math.max(10,cx-hr-tw-40);}}
    else ty=s.top!=null?s.top:Math.max(10,H*.12);
    tip.style.left=Math.max(10,Math.min(W-tw-10,tx))+'px';tip.style.top=Math.max(10,Math.min(H-th-10,ty))+'px';}
  function tick(){if(!alive)return;const s=o.steps[i];if(s&&s.done&&performance.now()-shownAt>350){let ok=false;try{ok=s.done();}catch(e){}if(ok){next();return;}}place();}
  const iv=setInterval(tick,120);
  next();
  return {end:()=>end(true),get step(){return i;}};
};
window.FSG=FSG;
})();
