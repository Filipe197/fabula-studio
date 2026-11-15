/* =========================================================
   FABULA STUDIO — contador de jogadas
   Coloque nas páginas dos jogos (jogar/<jogo>/index.html):
   <script src="../../js/jogada.js" data-jogo="nome-do-jogo"></script>
   Conta no máximo 1 vez por dia em cada navegador.
   ========================================================= */
(function () {
  var el = document.currentScript, slug = el && el.dataset.jogo;
  var C = window.FABULA_CONFIG || {};
  if (!slug || !C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) return;
  if (/\bwv\b|; wv\)/.test(navigator.userAgent)) return;          // dentro do APK não conta
  var k = 'fabula_jogada_' + slug, hoje = new Date().toISOString().slice(0, 10);
  try { if (localStorage.getItem(k) === hoje) return; localStorage.setItem(k, hoje); } catch (e) {}
  fetch(C.SUPABASE_URL + '/rest/v1/rpc/registrar_jogada', {
    method: 'POST', keepalive: true,
    headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_slug: slug, p_tipo: 'jogada' })
  }).catch(function () {});
})();
