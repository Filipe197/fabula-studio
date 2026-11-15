/* =========================================================
   FABULA STUDIO — página de cada jogo: /jogos/<endereço>
   Montada no servidor da Vercel, então o WhatsApp, o Instagram
   e o Google enxergam título, descrição e imagem do jogo.
   Lê os dados do Supabase usando o mesmo config.js do site.
   ========================================================= */
const MODEL = { gratis: 'Grátis', doacao: 'Doação', pago: 'Pago' };
const MCOL = { gratis: ['#7EE0B5', '#06261A'], doacao: ['#FFC566', '#1A1206'], pago: ['#C9A4FF', '#1E0F3A'] };

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let CFG = null;
async function config(origin) {
  if (CFG) return CFG;
  let url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    const txt = await (await fetch(origin + '/config.js')).text();
    url = (txt.match(/SUPABASE_URL\s*:\s*["']([^"']+)["']/) || [])[1];
    key = (txt.match(/SUPABASE_ANON_KEY\s*:\s*["']([^"']+)["']/) || [])[1];
  }
  CFG = { url, key };
  return CFG;
}
async function rest(cfg, path) {
  const r = await fetch(cfg.url + '/rest/v1/' + path, { headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key } });
  if (!r.ok) throw new Error('Supabase ' + r.status);
  return r.json();
}

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = 'https://' + host;
  const slug = String((req.query && req.query.slug) || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const abs = u => !u ? '' : /^(https?:|data:)/.test(u) ? u : origin + '/' + String(u).replace(/^\/+/, '');
  let g = null, outros = [], cfg = null;
  try {
    cfg = await config(origin);
    const rows = await rest(cfg, 'jogos?select=*&visivel=eq.true&slug=eq.' + encodeURIComponent(slug));
    g = rows[0] || null;
    if (g) outros = (await rest(cfg, 'jogos?select=titulo,slug,genero,resumo,capa,modelo,galeria&visivel=eq.true&order=ordem.asc')).filter(x => x.slug && x.slug !== slug).slice(0, 3);
  } catch (e) { console.error(e); }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!g) {
    res.statusCode = 404;
    res.setHeader('Cache-Control', 's-maxage=30');
    return res.end(page({ title: 'Jogo não encontrado · Fabula Studio', desc: '', img: '', url: origin + '/jogos/' + slug, cfg },
      `<section class="wrap" style="padding:120px 24px;text-align:center"><h1 class="h1">Jogo não encontrado</h1><p class="lead" style="margin:16px auto 28px">Esse endereço não existe ou o jogo está oculto.</p><a class="btn" href="/#universo" style="background:#FFC566;color:#1A1206">Ver todos os jogos</a></section>`));
  }

  const cover = g.capa || (g.galeria && g.galeria[0] && g.galeria[0].url) || '';
  const gal = (g.galeria || []).filter(x => x && x.url);
  const c = MCOL[g.modelo] || MCOL.gratis;
  const url = origin + '/jogos/' + g.slug;
  const desc = g.resumo || (g.descricao || '').slice(0, 160);

  let lbl = g.modelo === 'gratis' ? 'Jogar grátis' : g.modelo === 'doacao' ? 'Baixar · pague quanto quiser' : ('Comprar' + (g.preco ? ' · ' + g.preco : ''));
  const btns = [];
  const ext = u => /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '';
  if (g.link_jogar) btns.push(`<a class="btn" style="background:${c[0]};color:${c[1]}" href="${esc(abs(g.link_jogar))}"${ext(g.link_jogar)}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8Z"/></svg>${g.modelo === 'gratis' ? 'Jogar no navegador' : esc(lbl)}</a>`);
  if (g.link_download) btns.push(`<a class="btn ${g.link_jogar ? 'ghost' : ''}" ${g.link_jogar ? '' : `style="background:${c[0]};color:${c[1]}"`} href="${esc(abs(g.link_download))}" download data-dl="${esc(g.slug)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>${/\.apk(\?|$)/i.test(g.link_download) ? 'Baixar APK (Android)' : 'Baixar'}</a>`);
  if (g.link_itch) btns.push(`<a class="btn ghost" href="${esc(g.link_itch)}" target="_blank" rel="noopener">itch.io</a>`);
  if (g.link_steam) btns.push(`<a class="btn ghost" href="${esc(g.link_steam)}" target="_blank" rel="noopener">Steam</a>`);
  if (!btns.length) btns.push(`<span class="btn ghost" style="cursor:default">${g.status === 'lancado' ? 'Em breve' : esc(g.status_texto || 'Em breve')}</span>`);

  let video = '';
  if (g.video) {
    const yt = String(g.video).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{6,})/);
    video = yt
      ? `<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yt[1])}" title="Vídeo de ${esc(g.titulo)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
      : `<div class="vid"><video src="${esc(abs(g.video))}" poster="${esc(abs(cover))}" controls muted autoplay loop playsinline preload="metadata"></video></div>`;
  }

  const share = encodeURIComponent(`${g.titulo} — ${desc} ${url}`);
  const body = `
<section class="hero" style="--c:${esc(g.cor || '#FFC566')}">
  <div class="bg">${cover ? `<img src="${esc(abs(cover))}" alt="">` : ''}</div>
  <div class="wrap hin">
    <div class="tx">
      <div class="meta">${g.icone ? `<img class="ic" src="${esc(abs(g.icone))}" alt="">` : ''}<span class="badge" style="background:${c[0]};color:${c[1]}">${MODEL[g.modelo] || ''}</span><span class="st">${esc(g.status_texto || '')}</span></div>
      <h1 class="h1">${esc(g.titulo)}</h1>
      <p class="gen">${esc(g.genero || '')}</p>
      <p class="lead">${esc(desc)}</p>
      <div class="btns">${btns.join('')}</div>
      <div class="share">
        <a href="https://wa.me/?text=${share}" target="_blank" rel="noopener">WhatsApp</a>
        <button type="button" id="cp">Copiar link</button>
        <button type="button" id="sh" hidden>Compartilhar…</button>
      </div>
    </div>
  </div>
</section>
${video ? `<section class="wrap blk">${video}</section>` : ''}
<section class="wrap blk two">
  <div>
    <h2 class="h2">Sobre o jogo</h2>
    <p class="txt">${esc(g.descricao || g.resumo || '').replace(/\n/g, '<br>')}</p>
  </div>
  <div class="side">
    ${(g.destaques || []).length ? `<ul class="pts">${g.destaques.map(p => `<li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${esc(g.cor || '#7EE0B5')}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>${esc(p)}</li>`).join('')}</ul>` : ''}
    ${(g.plataformas || []).length ? `<div class="plats">${g.plataformas.map(p => `<span>${esc(p)}</span>`).join('')}</div>` : ''}
  </div>
</section>
${gal.length ? `<section class="wrap blk"><h2 class="h2">Imagens</h2><div class="gal">${gal.map((x, i) => `<button type="button" data-i="${i}"><img src="${esc(abs(x.url))}" alt="${esc(x.legenda || g.titulo)}" loading="lazy">${x.legenda ? `<span>${esc(x.legenda)}</span>` : ''}</button>`).join('')}</div></section>` : ''}
${outros.length ? `<section class="wrap blk"><h2 class="h2">Outros jogos</h2><div class="more">${outros.map(o => { const im = o.capa || (o.galeria && o.galeria[0] && o.galeria[0].url); return `<a href="/jogos/${esc(o.slug)}">${im ? `<img src="${esc(abs(im))}" alt="" loading="lazy">` : '<div class="ph"></div>'}<b>${esc(o.titulo)}</b><small>${esc(o.genero || '')}</small></a>`; }).join('')}</div></section>` : ''}
<div id="lb" hidden><button type="button" aria-label="Fechar">✕</button><img alt=""><p></p></div>
<script>
(function(){
  var G=${JSON.stringify(gal.map(x => ({ u: abs(x.url), l: x.legenda || '' })))};
  var lb=document.getElementById('lb'),im=lb.querySelector('img'),tx=lb.querySelector('p'),cur=0;
  function show(i){cur=(i+G.length)%G.length;im.src=G[cur].u;tx.textContent=G[cur].l;lb.hidden=false;}
  document.querySelectorAll('.gal [data-i]').forEach(function(b){b.onclick=function(){show(+b.dataset.i)};});
  lb.onclick=function(e){if(e.target===lb||e.target.tagName==='BUTTON')lb.hidden=true;else if(e.target===im)show(cur+1);};
  document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')lb.hidden=true;if(e.key==='ArrowRight')show(cur+1);if(e.key==='ArrowLeft')show(cur-1);});
  var cp=document.getElementById('cp');cp.onclick=function(){navigator.clipboard.writeText(${JSON.stringify(url)}).then(function(){cp.textContent='Link copiado ✓';setTimeout(function(){cp.textContent='Copiar link'},1800)});};
  var sh=document.getElementById('sh');if(navigator.share){sh.hidden=false;sh.onclick=function(){navigator.share({title:${JSON.stringify(g.titulo)},text:${JSON.stringify(desc)},url:${JSON.stringify(url)}}).catch(function(){})};}
  var K=${JSON.stringify(cfg ? { u: cfg.url, k: cfg.key } : null)};
  document.addEventListener('click',function(e){var a=e.target.closest('[data-dl]');if(!a||!K)return;
    fetch(K.u+'/rest/v1/rpc/registrar_jogada',{method:'POST',keepalive:true,headers:{apikey:K.k,Authorization:'Bearer '+K.k,'Content-Type':'application/json'},body:JSON.stringify({p_slug:a.dataset.dl,p_tipo:'download'})}).catch(function(){});});
})();
</script>`;

  res.statusCode = 200;
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
  res.end(page({ title: `${g.titulo} · Fabula Studio`, desc, img: abs(g.capa_vitrine && !g.capa ? g.capa_vitrine : cover), url, color: g.cor, cfg }, body));
};

function page(m, body) {
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.desc)}">
<link rel="canonical" href="${esc(m.url)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Fabula Studio">
<meta property="og:title" content="${esc(m.title)}"><meta property="og:description" content="${esc(m.desc)}">
<meta property="og:url" content="${esc(m.url)}">${m.img ? `<meta property="og:image" content="${esc(m.img)}"><meta name="twitter:image" content="${esc(m.img)}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#090C18">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 42'%3E%3Crect x='1' y='1' width='40' height='40' rx='13' fill='%23141A33' stroke='%23FFC566' stroke-width='2'/%3E%3Cpath d='M12 29V14c3-2 6-2 9 0 3-2 6-2 9 0v15c-3-2-6-2-9 0-3-2-6-2-9 0Z' fill='none' stroke='%23FFC566' stroke-width='2'/%3E%3Ccircle cx='32' cy='10' r='3' fill='%23FFD27A'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#090C18;--card:#121831;--line:rgba(255,255,255,.08);--tx:#E9ECF7;--tx2:#B7BED8;--tx3:#8B93B5;--acc:#FFC566;--disp:'Bricolage Grotesque',sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font-family:Inter,system-ui,sans-serif}
a{color:var(--acc);text-decoration:none}img{display:block;max-width:100%}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
header{position:sticky;top:0;z-index:20;background:rgba(9,12,24,.75);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
header .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{color:#fff;font-family:var(--disp);font-weight:800;font-size:21px;display:flex;gap:10px;align-items:center}
.back{color:var(--tx2);font-weight:600;font-size:15px}
.h1{font-family:var(--disp);font-weight:800;font-size:clamp(42px,7vw,88px);line-height:.95;letter-spacing:-.04em;margin:0;color:#fff}
.h2{font-family:var(--disp);font-weight:800;font-size:clamp(28px,3.4vw,42px);letter-spacing:-.03em;margin:0 0 20px;color:#fff}
.btn{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:16px;padding:15px 24px;border-radius:16px;transition:transform .15s,filter .2s}
.btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
.btn.ghost{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);color:#fff}
.badge{padding:6px 12px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.hero{position:relative;min-height:min(78vh,720px);display:flex;align-items:flex-end;overflow:hidden}
.hero .bg{position:absolute;inset:0}.hero .bg img{width:100%;height:100%;object-fit:cover}
.hero .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,12,24,.15) 0%,rgba(9,12,24,.55) 45%,var(--bg) 100%),linear-gradient(90deg,rgba(9,12,24,.85),rgba(9,12,24,0) 70%)}
.hin{position:relative;width:100%;padding-top:120px;padding-bottom:56px}
.tx{max-width:640px}
.meta{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.ic{width:56px;height:56px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.st{color:var(--tx2);font-weight:600;font-size:14px}
.gen{color:var(--c);font-weight:700;margin:14px 0 0;font-size:16px}
.lead{font-size:19px;line-height:1.55;color:var(--tx2);max-width:560px;margin:14px 0 26px}
.btns{display:flex;flex-wrap:wrap;gap:12px}
.share{display:flex;flex-wrap:wrap;gap:16px;margin-top:22px;font-size:14px;font-weight:600}
.share a,.share button{color:var(--tx3);background:none;border:0;padding:0;cursor:pointer;font:inherit}
.share a:hover,.share button:hover{color:#fff}
.blk{padding:56px 24px 8px}
.vid{border-radius:24px;overflow:hidden;border:1px solid var(--line);background:#000;aspect-ratio:16/9}
.vid iframe,.vid video{width:100%;height:100%;border:0;display:block;object-fit:cover}
.two{display:grid;grid-template-columns:1.4fr 1fr;gap:48px}
@media(max-width:820px){.two{grid-template-columns:1fr;gap:24px}}
.txt{font-size:17px;line-height:1.75;color:var(--tx2);margin:0}
.pts{list-style:none;padding:24px;margin:0 0 16px;display:flex;flex-direction:column;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:20px}
.pts li{display:flex;gap:12px;align-items:flex-start;font-weight:600;line-height:1.4}.pts svg{flex:none;margin-top:2px}
.plats{display:flex;flex-wrap:wrap;gap:8px}.plats span{padding:8px 14px;border-radius:999px;border:1px solid var(--line);font-size:14px;color:var(--tx2)}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.gal button{position:relative;padding:0;border:1px solid var(--line);border-radius:18px;overflow:hidden;cursor:zoom-in;background:var(--card)}
.gal img{width:100%;aspect-ratio:16/10;object-fit:cover;transition:transform .3s}.gal button:hover img{transform:scale(1.04)}
.gal span{position:absolute;left:10px;bottom:10px;background:rgba(9,12,24,.75);color:#fff;padding:5px 10px;border-radius:10px;font-size:13px;font-weight:600}
.more{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.more a{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;color:#fff;display:flex;flex-direction:column;transition:transform .2s}
.more a:hover{transform:translateY(-4px)}.more img,.more .ph{aspect-ratio:16/9;object-fit:cover;width:100%;background:#1a2142}
.more b{padding:14px 16px 2px;font-size:17px}.more small{padding:0 16px 16px;color:var(--tx3)}
#lb{position:fixed;inset:0;z-index:50;background:rgba(5,7,15,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:12px}
#lb[hidden]{display:none}#lb img{max-height:82vh;border-radius:16px;cursor:pointer}#lb p{color:var(--tx2);margin:0}
#lb button{position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:18px;cursor:pointer}
footer{margin-top:72px;border-top:1px solid var(--line);padding:28px 24px;text-align:center;color:var(--tx3);font-size:14px}
footer a{color:var(--tx3);text-decoration:underline}
</style></head><body>
<header><div class="wrap"><a class="logo" href="/">Fabula Studio</a><a class="back" href="/#universo">← Todos os jogos</a></div></header>
${body}
<footer>© ${new Date().getFullYear()} Fabula Studio · Feito no Brasil · <a href="/privacidade.html">Política de Privacidade</a></footer>
</body></html>`;
}
