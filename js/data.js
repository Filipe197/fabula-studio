/* =========================================================
   FABULA STUDIO — camada de dados
   Usa o Supabase quando config.js estiver preenchido.
   Sem config, usa o localStorage (modo demonstração).
   ========================================================= */
(function () {
  var C = window.FABULA_CONFIG || {};
  var useSB = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  var sb = useSB ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  var KEY = 'fabula_demo_v1';

  /* ---------- dados iniciais (demonstração e semente) ---------- */
  var SEED = {
    jogos: [
      {
        id: 'j1', titulo: 'Harvest Hollow', genero: 'Fazenda 3D · Casual', modelo: 'gratis', preco: '',
        status: 'lancado', status_texto: 'Disponível', cor: '#7EE0B5',
        resumo: 'Plante, crie animais e transforme sua fazenda numa vila cheia de vida.',
        descricao: 'Plante, crie animais, produza nas fábricas e veja sua fazenda virar uma vila com mercado, trem de carga e eventos especiais ao longo do ano. Leve: o APK tem menos de 7 MB e também roda direto no navegador.',
        destaques: ['Mais de 150 modelos 3D', 'Dia, noite, chuva e arco-íris', 'Joga no navegador, sem instalar'],
        plataformas: ['Navegador', 'Android'],
        capa: 'img/hh_cercado.jpg', icone: 'img/hh_icone.png',
        galeria: [
          { url: 'img/hh_vila.jpg', legenda: 'Vila e mercado' },
          { url: 'img/hh_chuva.jpg', legenda: 'Chuva no fim de tarde' },
          { url: 'img/hh_trem.jpg', legenda: 'Trem de carga' },
          { url: 'img/hh_barco.jpg', legenda: 'Pescaria' },
          { url: 'img/hh_trator.jpg', legenda: 'Trator e veículos' },
          { url: 'img/hh_halloween.jpg', legenda: 'Evento de Halloween' }
        ],
        link_jogar: '', link_download: '', link_steam: '', link_itch: '',
        em_destaque: true, visivel: true, ordem: 1
      },
      {
        id: 'j2', titulo: 'The Last Lume', genero: 'Aventura · Floresta', modelo: 'pago', preco: '',
        status: 'producao', status_texto: 'Em breve', cor: '#FFC566',
        resumo: 'Guie o último vaga-lume por uma floresta escura e misteriosa.',
        descricao: 'Guie o último vaga-lume por uma floresta escura e misteriosa e devolva a luz à Clareira dos Vaga-Lumes.',
        destaques: ['Aventura 2D vista de cima', 'Floresta cheia de segredos'],
        plataformas: ['Steam', 'itch.io', 'Site'],
        capa: '', icone: '', galeria: [],
        link_jogar: '', link_download: '', link_steam: '', link_itch: '',
        em_destaque: false, visivel: true, ordem: 2
      },
      {
        id: 'j3', titulo: 'Ecos de Eldoria', genero: 'RPG · Pixel art', modelo: 'doacao', preco: '',
        status: 'producao', status_texto: 'Em desenvolvimento', cor: '#C9A4FF',
        resumo: 'RPG em pixel art com vilas, masmorras e segredos para descobrir.',
        descricao: 'Um RPG de aventura em pixel art visto de cima, com vilas, masmorras e segredos esperando para serem descobertos.',
        destaques: ['Visual pixel art', 'Vilas e masmorras para explorar'],
        plataformas: ['Site', 'itch.io'],
        capa: '', icone: '', galeria: [],
        link_jogar: '', link_download: '', link_steam: '', link_itch: '',
        em_destaque: false, visivel: true, ordem: 3
      }
    ],
    posts: [
      { id: 'p1', titulo: 'Harvest Hollow 2.6: chegou a vila', tag: 'Atualização', data: '2026-11-14',
        resumo: 'Mercado na cidade, trem de carga, trator, barco e novos ajudantes.', imagem: 'img/hh_vila.jpg', link: '', visivel: true },
      { id: 'p2', titulo: 'Halloween na fazenda', tag: 'Evento', data: '2026-10-25',
        resumo: 'Abóboras iluminadas, noite roxa e espantalhos que ajudam na colheita.', imagem: 'img/hh_halloween.jpg', link: '', visivel: true }
    ],
    ajustes: {
      email: '', instagram: '', youtube: '', itch: '', steam: '', link_doacao: '',
      aviso_topo: 'Harvest Hollow 2.6: vila, trem e Halloween'
    },
    inscritos: []
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function local() {
    try {
      var s = localStorage.getItem(KEY);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return clone(SEED);
  }
  function saveLocal(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); }
    catch (e) { throw new Error('Sem espaço no navegador. No modo demonstração use imagens menores.'); }
  }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function sortGames(a) { return a.sort(function (x, y) { return (x.ordem || 0) - (y.ordem || 0); }); }
  function sortPosts(a) { return a.sort(function (x, y) { return String(y.data).localeCompare(String(x.data)); }); }
  function chk(r) { if (r.error) throw new Error(r.error.message); return r.data; }

  var FB = {
    mode: useSB ? 'supabase' : 'demo',
    seed: SEED,

    /* lista jogos ou posts. all=true traz também os ocultos (admin) */
    list: async function (table, all) {
      var rows;
      if (sb) {
        var q = sb.from(table).select('*');
        if (!all) q = q.eq('visivel', true);
        rows = chk(await q);
      } else {
        rows = local()[table] || [];
        if (!all) rows = rows.filter(function (r) { return r.visivel !== false; });
      }
      return table === 'jogos' ? sortGames(rows) : sortPosts(rows);
    },

    save: async function (table, obj) {
      obj = clone(obj);
      if (sb) {
        if (!obj.id) delete obj.id;
        var r = obj.id
          ? await sb.from(table).update(obj).eq('id', obj.id).select().single()
          : await sb.from(table).insert(obj).select().single();
        return chk(r);
      }
      var d = local(), arr = d[table] || (d[table] = []);
      if (obj.id) {
        var i = arr.findIndex(function (x) { return x.id === obj.id; });
        if (i >= 0) arr[i] = obj; else arr.push(obj);
      } else { obj.id = uid(); arr.push(obj); }
      saveLocal(d);
      return obj;
    },

    remove: async function (table, id) {
      if (sb) { chk(await sb.from(table).delete().eq('id', id)); return; }
      var d = local();
      d[table] = (d[table] || []).filter(function (x) { return x.id !== id; });
      saveLocal(d);
    },

    getSettings: async function () {
      if (sb) {
        var r = await sb.from('ajustes').select('dados').eq('id', 1).maybeSingle();
        var dd = chk(r);
        return Object.assign({}, SEED.ajustes, dd ? dd.dados : {});
      }
      return Object.assign({}, SEED.ajustes, local().ajustes);
    },

    saveSettings: async function (dados) {
      if (sb) { chk(await sb.from('ajustes').upsert({ id: 1, dados: dados })); return; }
      var d = local(); d.ajustes = dados; saveLocal(d);
    },

    subscribe: async function (email) {
      if (sb) {
        var r = await sb.from('inscritos').insert({ email: email });
        if (r.error && r.error.code !== '23505') throw new Error(r.error.message);
        return;
      }
      var d = local();
      if (!d.inscritos.some(function (x) { return x.email === email; }))
        d.inscritos.push({ id: uid(), email: email, criado_em: new Date().toISOString() });
      saveLocal(d);
    },

    listSubscribers: async function () {
      if (sb) return chk(await sb.from('inscritos').select('*').order('criado_em', { ascending: false }));
      return (local().inscritos || []).slice().reverse();
    },

    /* envia imagem e devolve o endereço dela */
    upload: async function (file) {
      if (sb) {
        var ext = (file.name.split('.').pop() || 'png').toLowerCase();
        var path = Date.now() + '-' + uid() + '.' + ext;
        chk(await sb.storage.from(C.BUCKET || 'midia').upload(path, file, { upsert: false, contentType: file.type }));
        return sb.storage.from(C.BUCKET || 'midia').getPublicUrl(path).data.publicUrl;
      }
      return await new Promise(function (ok, fail) {
        var img = new Image(), rd = new FileReader();
        rd.onload = function () {
          img.onload = function () {
            /* reduz a imagem para caber no navegador */
            var max = 1200, w = img.width, h = img.height;
            if (w > max) { h = Math.round(h * max / w); w = max; }
            var c = document.createElement('canvas'); c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            ok(c.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = fail; img.src = rd.result;
        };
        rd.onerror = fail; rd.readAsDataURL(file);
      });
    },

    resetDemo: function () { localStorage.removeItem(KEY); },

    /* ---------- login ---------- */
    login: async function (email, senha) {
      if (!sb) return { email: email || 'demo' };
      var r = await sb.auth.signInWithPassword({ email: email, password: senha });
      if (r.error) throw new Error(r.error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : r.error.message);
      return r.data.user;
    },
    logout: async function () { if (sb) await sb.auth.signOut(); sessionStorage.removeItem('fabula_demo_login'); },
    user: async function () {
      if (!sb) return sessionStorage.getItem('fabula_demo_login') ? { email: 'demo' } : null;
      var r = await sb.auth.getSession();
      return r.data.session ? r.data.session.user : null;
    }
  };
  window.FB = FB;
})();
