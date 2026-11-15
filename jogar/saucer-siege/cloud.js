/* =========================================================
   SAUCER SIEGE — nuvem e ranking (só na versão do site)
   - Com login do Google, as estrelas e o recorde vão para o Supabase
     e voltam em qualquer aparelho (sempre fica o MAIOR de cada um,
     então nunca se perde progresso).
   - O recorde do Modo Infinito entra no ranking online.
   ========================================================= */
(function () {
  var JOGO = 'saucer-siege';
  var C = window.FABULA_CONFIG || {};
  var inApp = /\bwv\b|; wv\)/.test(navigator.userAgent);
  var sb = (!inApp && C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase) ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  var user = null, status = 'Sincronizando…', timer = 0, lastSent = '';

  function nomeCurto(u) {
    var m = u.user_metadata || {}, n = (m.full_name || m.name || u.email || 'Jogador').trim().split(/\s+/);
    return n.length > 1 ? n[0] + ' ' + n[n.length - 1][0].toUpperCase() + '.' : n[0];
  }
  function hora() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  function refresh() { try { window.SS && window.SS.refresh(); } catch (e) {} }

  async function upload() {
    if (!user || !window.SS) return;
    var d = window.SS.save, txt = JSON.stringify(d);
    if (txt === lastSent) return;
    var r = await sb.from('saves').upsert({ user_id: user.id, jogo: JOGO, dados: d, seen: d.seen || Date.now(), atualizado_em: new Date().toISOString() });
    if (r.error) { status = 'Sem conexão, tentando de novo…'; refresh(); return; }
    lastSent = txt; status = 'Salvo na nuvem às ' + hora() + ' ✅'; refresh();
  }

  async function sync() {
    if (!user || !window.SS) return;
    status = 'Sincronizando…'; refresh();
    var r = await sb.from('saves').select('dados').eq('user_id', user.id).eq('jogo', JOGO).maybeSingle();
    if (r.error) { status = 'Sem conexão no momento'; refresh(); return; }
    if (r.data && r.data.dados) window.SS.merge(r.data.dados);   // junta: fica o maior de cada fase
    await upload();
    // recorde feito antes de entrar também vai para o ranking
    var s = window.SS.save;
    if (s.best > 0) api.submit(s.best, s.bestWave).catch(function () {});
  }

  var api = {
    available: function () { return !!sb; },
    user: function () { return user ? { id: user.id, nome: nomeCurto(user) } : null; },
    status: function () { return status; },
    login: async function () {
      var r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } });
      if (r.error) alert('Não foi possível entrar: ' + r.error.message);
    },
    logout: async function () { await upload(); await sb.auth.signOut(); user = null; refresh(); },
    saved: function () { if (!user) return; clearTimeout(timer); timer = setTimeout(upload, 1500); },
    submit: async function (pontos, onda) {
      if (!user) throw new Error('sem login');
      var r = await sb.rpc('enviar_pontos', { p_jogo: JOGO, p_pontos: Math.floor(pontos), p_onda: onda | 0, p_nome: nomeCurto(user) });
      if (r.error) throw r.error;
    },
    ranking: async function () {
      var r = await sb.rpc('top_ranking', { p_jogo: JOGO, p_limite: 10 });
      if (r.error) throw r.error;
      return r.data || [];
    }
  };
  window.SSCloud = api;
  if (!sb) return;

  sb.auth.onAuthStateChange(function (ev, s) {
    var u = s ? s.user : null;
    if (u && (!user || user.id !== u.id)) { user = u; if (window.SS) sync(); else window.addEventListener('ss-ready', sync, { once: true }); }
    if (!u) user = null;
    refresh();
  });
  window.addEventListener('pagehide', function () { if (user) upload(); });
})();
