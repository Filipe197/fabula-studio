/* =========================================================
   HARVEST HOLLOW — progresso na nuvem (login com Google)
   O jogo continua salvando no aparelho como sempre.
   Com login, este arquivo copia o save para o Supabase e
   traz de volta em outro aparelho.
   ========================================================= */
(function () {
  var KEY = 'fazenda_feliz_v1', JOGO = 'harvest-hollow';
  var C = window.FABULA_CONFIG || {};
  var inApp = /\bwv\b|; wv\)/.test(navigator.userAgent);           // WebView do APK
  var sb = (C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase) ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  var user = null, state = sb ? 'carregando' : 'off', lastUp = 0, lastT = 0, conflict = null, busy = false;

  /* bloqueia o jogo de sobrescrever o save enquanto trocamos pelo da nuvem */
  var _set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (window.__hhLock && k === KEY) return; return _set.apply(this, arguments); };

  function syncKey() { return 'hh_cloud_sync_' + (user ? user.id : ''); }
  function local() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function lvl(xp) { var l = 1; while ((xp || 0) >= 25 * l * l) l++; return l; }
  function resumo(d) { return d ? 'nível ' + lvl(d.xp) + ' · 💰' + (d.coins || 0).toLocaleString('pt-BR') : '—'; }
  function quando(ms) { if (!ms) return ''; var d = new Date(ms); return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function msg(t) { try { if (window.__ui) window.__ui.toast(t); } catch (e) {} }
  function refresh() { try { if (window.__ui && window.__ui.panel() === 'menu') window.__ui.renderPanel(); } catch (e) {} }
  function vazio(d) { return !d || (!(d.xp > 0) && !(d.tut > 2)); }

  async function upload(keep) {
    var L = local(); if (!user || !L || busy) return;
    if (L.seen === lastUp) return;
    var row = { user_id: user.id, jogo: JOGO, dados: L, seen: L.seen || Date.now(), atualizado_em: new Date().toISOString() };
    try {
      if (keep) {
        /* ao fechar a página: envio direto, que continua mesmo com a aba fechando */
        var s = await sb.auth.getSession(); var tk = s.data.session && s.data.session.access_token; if (!tk) return;
        fetch(C.SUPABASE_URL + '/rest/v1/saves?on_conflict=user_id,jogo', {
          method: 'POST', keepalive: true,
          headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(row)
        }).then(function (resp) { if (resp.ok) { lastUp = L.seen; localStorage.setItem(syncKey(), String(L.seen)); } }).catch(function () {});
        return;
      } else {
        var r = await sb.from('saves').upsert(row);
        if (r.error) throw r.error;
      }
      lastUp = L.seen; lastT = Date.now(); localStorage.setItem(syncKey(), String(L.seen));
      if (state !== 'ok') { state = 'ok'; refresh(); }
    } catch (e) { state = 'erro'; refresh(); }
  }

  function usar(dados) {
    window.__hhLock = true;
    _set.call(localStorage, KEY, JSON.stringify(dados));
    localStorage.setItem(syncKey(), String(dados.seen || 0));
    location.reload();
  }

  async function sync() {
    if (!user) return;
    var r = await sb.from('saves').select('dados,seen').eq('user_id', user.id).eq('jogo', JOGO).maybeSingle();
    if (r.error) { state = 'erro'; refresh(); return; }
    var Cd = r.data ? r.data.dados : null, L = local(), synced = +localStorage.getItem(syncKey()) || 0;
    if (!Cd) { state = 'ok'; await upload(); msg('☁️ Progresso salvo na nuvem'); return; }
    if (vazio(L)) { msg('☁️ Trazendo seu progresso da nuvem...'); return usar(Cd); }
    if (Cd.seen === L.seen) { lastUp = L.seen; state = 'ok'; refresh(); return; }
    var nuvemMudou = Cd.seen !== synced, localMudou = !synced || (L.seen - synced) > 120000;
    if (synced && !nuvemMudou) { state = 'ok'; await upload(); return; }
    if (synced && nuvemMudou && !localMudou) { msg('☁️ Atualizando com o progresso da nuvem...'); return usar(Cd); }
    /* os dois mudaram: o jogador escolhe */
    conflict = { nuvem: Cd, local: L }; state = 'conflito'; showConflict();
  }

  function showConflict() {
    var old = document.getElementById('hhc'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'hhc';
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif';
    d.innerHTML = '<div style="background:#fff8e7;color:#3b2a14;border-radius:18px;max-width:440px;width:100%;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
      '<b style="font-size:19px">☁️ Qual fazenda você quer manter?</b>' +
      '<p style="margin:8px 0 14px;font-size:14px;line-height:1.4">Este aparelho e a nuvem têm progressos diferentes. O que você não escolher será substituído.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button id="hhN" style="flex:1 1 180px;padding:14px;border-radius:14px;border:2px solid #7cc36b;background:#eaf8e4;cursor:pointer;text-align:left;font-size:14px"><b>☁️ Da nuvem</b><br>' + resumo(conflict.nuvem) + '<br><small>' + quando(conflict.nuvem.seen) + '</small></button>' +
      '<button id="hhL" style="flex:1 1 180px;padding:14px;border-radius:14px;border:2px solid #e9b44c;background:#fff1d0;cursor:pointer;text-align:left;font-size:14px"><b>📱 Deste aparelho</b><br>' + resumo(conflict.local) + '<br><small>' + quando(conflict.local.seen) + '</small></button>' +
      '</div></div>';
    document.body.appendChild(d);
    d.querySelector('#hhN').onclick = function () { usar(conflict.nuvem); };
    d.querySelector('#hhL').onclick = async function () { d.remove(); conflict = null; lastUp = 0; await upload(); msg('☁️ Progresso deste aparelho salvo na nuvem'); };
  }

  /* linha que aparece no ☰ Menu do jogo */
  window.HHCloud = {
    row: function () {
      var h = '<div class="row"><div class="ic">☁️</div><div class="tx">';
      if (inApp) return h + '<b>Salvar na nuvem</b><br>Disponível na versão do navegador do Harvest Hollow.</div></div>';
      if (!sb) return h + '<b>Salvar na nuvem</b><br>Indisponível no momento.</div></div>';
      if (!user) return h + '<b>Salvar na nuvem</b><br>Entre com Google e continue de onde parou em qualquer aparelho.</div><button class="bt" data-cloud="in">Entrar com Google</button></div>';
      var st = state === 'ok' ? 'Progresso salvo ' + (lastT ? 'às ' + new Date(lastT).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'na nuvem') + ' ✅' :
        state === 'erro' ? 'Sem conexão, tentando de novo...' : state === 'conflito' ? 'Escolha qual progresso manter' : 'Sincronizando...';
      var nome = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email;
      return h + '<b>' + esc(nome) + '</b><br>' + st + '</div><button class="bt alt" data-cloud="out">Sair</button></div>' +
        '<div class="row"><div class="ic">🏡</div><div class="tx"><b>Fabula Studio</b><br>Conheça nossos outros jogos</div><button class="bt alt" data-cloud="site">Abrir site</button></div>';
    }
  };
  document.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-cloud]'); if (!b) return;
    var a = b.dataset.cloud;
    if (a === 'in') {
      try { var r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } }); if (r.error) throw r.error; }
      catch (err) { msg('Não foi possível entrar: ' + err.message); }
    } else if (a === 'out') {
      await upload(); await sb.auth.signOut(); user = null; state = 'off'; refresh(); msg('Você saiu. O progresso continua salvo neste aparelho.');
    } else if (a === 'site') { location.href = '../../'; }
  });

  if (!sb || inApp) return;
  sb.auth.onAuthStateChange(function (ev, s) {
    var u = s ? s.user : null;
    if (u && (!user || user.id !== u.id)) { user = u; state = 'carregando'; setTimeout(sync, 0); refresh(); }
    if (ev === 'INITIAL_SESSION' && !u)
      setTimeout(function () { if (!user && !localStorage.getItem('hh_cloud_hint')) { localStorage.setItem('hh_cloud_hint', '1'); msg('☁️ Dica: entre com Google no ☰ Menu para salvar na nuvem'); } }, 20000);
  });
  setInterval(function () { if (user && state !== 'conflito') upload(); }, 15000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && user && state !== 'conflito') upload(true); });
  window.addEventListener('pagehide', function () { if (user && state !== 'conflito') upload(true); });
})();
