-- =========================================================
-- FABULA STUDIO — progresso dos jogadores na nuvem
-- Rode UMA vez no Supabase > SQL Editor > New query > Run
-- (depois do schema.sql, que você já rodou).
-- =========================================================

create table if not exists saves (
  user_id uuid not null references auth.users on delete cascade,
  jogo text not null,
  dados jsonb not null,
  seen bigint default 0,
  atualizado_em timestamptz default now(),
  primary key (user_id, jogo)
);

alter table saves enable row level security;

-- cada jogador só enxerga e altera o PRÓPRIO progresso
drop policy if exists "save ler"     on saves;
drop policy if exists "save criar"   on saves;
drop policy if exists "save mudar"   on saves;
drop policy if exists "save apagar"  on saves;
create policy "save ler"    on saves for select using (auth.uid() = user_id);
create policy "save criar"  on saves for insert with check (auth.uid() = user_id);
create policy "save mudar"  on saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "save apagar" on saves for delete using (auth.uid() = user_id);

-- o painel mostra só a QUANTIDADE de jogadores (nada de dados pessoais)
create or replace function total_jogadores() returns bigint
language sql stable security definer set search_path = public as $$
  select case when is_admin() then (select count(distinct user_id) from saves) else null end;
$$;
