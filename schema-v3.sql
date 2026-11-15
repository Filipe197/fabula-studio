-- =========================================================
-- FABULA STUDIO — atualização 3
-- Contador de jogadas, página própria de cada jogo e ranking online.
-- Rode UMA vez no Supabase > SQL Editor > New query > Run.
-- Pode rodar de novo sem problema (não apaga nada).
-- =========================================================

-- ---------- novos campos dos jogos ----------
alter table jogos add column if not exists slug      text;
alter table jogos add column if not exists video     text   default '';
alter table jogos add column if not exists jogadas   bigint default 0;
alter table jogos add column if not exists downloads bigint default 0;

-- endereço da página: "Saucer Siege" -> saucer-siege
update jogos
   set slug = lower(trim(both '-' from regexp_replace(titulo, '[^a-zA-Z0-9]+', '-', 'g')))
 where slug is null or slug = '';

create unique index if not exists jogos_slug_unico on jogos (slug);

-- ---------- contador (qualquer visitante pode somar 1, nunca ler/alterar o resto) ----------
create or replace function registrar_jogada(p_slug text, p_tipo text default 'jogada')
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_tipo = 'download' then
    update jogos set downloads = coalesce(downloads, 0) + 1 where slug = p_slug;
  else
    update jogos set jogadas = coalesce(jogadas, 0) + 1 where slug = p_slug;
  end if;
end;
$$;
grant execute on function registrar_jogada(text, text) to anon, authenticated;

-- ---------- ranking online ----------
create table if not exists ranking (
  jogo          text   not null,
  user_id       uuid   not null references auth.users on delete cascade,
  nome          text   not null default 'Jogador',
  pontos        bigint not null default 0,
  onda          int    not null default 0,
  atualizado_em timestamptz default now(),
  primary key (jogo, user_id)
);
alter table ranking enable row level security;

-- ninguém mexe direto na tabela: tudo passa pelas duas funções abaixo
drop policy if exists "ranking proprio" on ranking;
create policy "ranking proprio" on ranking for select using (auth.uid() = user_id);

-- envia a pontuação; só fica guardada se for o novo recorde do jogador
create or replace function enviar_pontos(p_jogo text, p_pontos bigint, p_onda int, p_nome text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'precisa entrar com Google'; end if;
  if p_pontos < 0 or p_pontos > 50000000 or p_onda < 0 or p_onda > 1000 then raise exception 'pontuação inválida'; end if;
  insert into ranking (jogo, user_id, nome, pontos, onda, atualizado_em)
  values (p_jogo, auth.uid(), left(coalesce(nullif(trim(p_nome), ''), 'Jogador'), 24), p_pontos, p_onda, now())
  on conflict (jogo, user_id) do update
     set pontos = excluded.pontos, onda = excluded.onda, nome = excluded.nome, atualizado_em = now()
   where ranking.pontos < excluded.pontos;
end;
$$;
grant execute on function enviar_pontos(text, bigint, int, text) to authenticated;

-- top 10 público (só nome curto, pontos e onda; nada de e-mail)
create or replace function top_ranking(p_jogo text, p_limite int default 10)
returns table (posicao bigint, nome text, pontos bigint, onda int, eu boolean)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by pontos desc, atualizado_em asc) as posicao,
         nome, pontos, onda, (user_id = auth.uid()) as eu
    from ranking
   where jogo = p_jogo
   order by pontos desc, atualizado_em asc
   limit least(greatest(p_limite, 1), 50);
$$;
grant execute on function top_ranking(text, int) to anon, authenticated;

-- ---------- Saucer Siege: galeria e vídeo da página ----------
update jogos set
  galeria = case when jsonb_array_length(coalesce(galeria, '[]'::jsonb)) = 0 then '[{"url":"img/ss_campina.jpg","legenda":"Campina Verde"},{"url":"img/ss_neve.jpg","legenda":"Mundo de neve com dois portais"},{"url":"img/ss_raio.jpg","legenda":"Torre de Raio em corrente"},{"url":"img/ss_chefe.jpg","legenda":"A nave-mãe"},{"url":"img/ss_infinito.jpg","legenda":"Modo infinito"}]'::jsonb else galeria end,
  video   = case when coalesce(video, '') = '' then 'img/ss_trailer.mp4' else video end,
  icone   = case when coalesce(icone, '') = '' then 'img/ss_icone.png' else icone end
where slug = 'saucer-siege';
