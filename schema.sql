-- =========================================================
-- FABULA STUDIO — banco de dados (Supabase)
-- Cole tudo no Supabase > SQL Editor > New query > Run.
-- Antes de rodar, troque SEU-EMAIL@AQUI pelo seu e-mail
-- de administrador (o mesmo que você vai criar em Authentication).
-- =========================================================

-- ---------- administradores ----------
create table if not exists admins (
  email text primary key
);
insert into admins (email) values ('SEU-EMAIL@AQUI') on conflict do nothing;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = auth.jwt() ->> 'email');
$$;

-- ---------- jogos ----------
create table if not exists jogos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  genero text default '',
  modelo text not null default 'gratis' check (modelo in ('gratis','doacao','pago')),
  preco text default '',
  status text not null default 'producao' check (status in ('lancado','producao','embreve')),
  status_texto text default '',
  cor text default '#FFC566',
  resumo text default '',
  descricao text default '',
  destaques jsonb default '[]'::jsonb,
  plataformas jsonb default '[]'::jsonb,
  capa text default '',
  icone text default '',
  galeria jsonb default '[]'::jsonb,
  link_jogar text default '',
  link_download text default '',
  link_steam text default '',
  link_itch text default '',
  em_destaque boolean default false,
  visivel boolean default true,
  ordem int default 0,
  criado_em timestamptz default now()
);

-- ---------- novidades ----------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tag text default 'Atualização',
  data date default current_date,
  resumo text default '',
  imagem text default '',
  link text default '',
  visivel boolean default true,
  criado_em timestamptz default now()
);

-- ---------- ajustes (uma linha só) ----------
create table if not exists ajustes (
  id int primary key default 1 check (id = 1),
  dados jsonb not null default '{}'::jsonb
);

-- ---------- inscritos na newsletter ----------
create table if not exists inscritos (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  criado_em timestamptz default now()
);

-- ---------- segurança (RLS) ----------
alter table admins    enable row level security;
alter table jogos     enable row level security;
alter table posts     enable row level security;
alter table ajustes   enable row level security;
alter table inscritos enable row level security;

drop policy if exists "jogos publico"  on jogos;
drop policy if exists "jogos admin"    on jogos;
create policy "jogos publico" on jogos for select using (visivel or is_admin());
create policy "jogos admin"   on jogos for all using (is_admin()) with check (is_admin());

drop policy if exists "posts publico" on posts;
drop policy if exists "posts admin"   on posts;
create policy "posts publico" on posts for select using (visivel or is_admin());
create policy "posts admin"   on posts for all using (is_admin()) with check (is_admin());

drop policy if exists "ajustes publico" on ajustes;
drop policy if exists "ajustes admin"   on ajustes;
create policy "ajustes publico" on ajustes for select using (true);
create policy "ajustes admin"   on ajustes for all using (is_admin()) with check (is_admin());

drop policy if exists "inscrever"       on inscritos;
drop policy if exists "inscritos admin" on inscritos;
drop policy if exists "inscritos apagar" on inscritos;
create policy "inscrever"       on inscritos for insert with check (true);
create policy "inscritos admin" on inscritos for select using (is_admin());
create policy "inscritos apagar" on inscritos for delete using (is_admin());

-- ---------- imagens (Storage) ----------
insert into storage.buckets (id, name, public) values ('midia', 'midia', true)
on conflict (id) do nothing;

drop policy if exists "midia publica" on storage.objects;
drop policy if exists "midia admin"   on storage.objects;
create policy "midia publica" on storage.objects for select using (bucket_id = 'midia');
create policy "midia admin"   on storage.objects for all
  using (bucket_id = 'midia' and is_admin()) with check (bucket_id = 'midia' and is_admin());

-- ---------- dados iniciais ----------
insert into ajustes (id, dados) values (1, '{"aviso_topo":"Harvest Hollow 2.6: vila, trem e Halloween"}')
on conflict (id) do nothing;

insert into jogos (titulo, genero, modelo, status, status_texto, cor, resumo, descricao, destaques, plataformas, capa, icone, galeria, em_destaque, ordem)
select * from (values
  ('Harvest Hollow', 'Fazenda 3D · Casual', 'gratis', 'lancado', 'Disponível', '#7EE0B5',
   'Plante, crie animais e transforme sua fazenda numa vila cheia de vida.',
   'Plante, crie animais, produza nas fábricas e veja sua fazenda virar uma vila com mercado, trem de carga e eventos especiais ao longo do ano. Leve: o APK tem menos de 7 MB e também roda direto no navegador.',
   '["Mais de 150 modelos 3D","Dia, noite, chuva e arco-íris","Joga no navegador, sem instalar"]'::jsonb,
   '["Navegador","Android"]'::jsonb, 'img/hh_cercado.jpg', 'img/hh_icone.png',
   '[{"url":"img/hh_vila.jpg","legenda":"Vila e mercado"},{"url":"img/hh_chuva.jpg","legenda":"Chuva no fim de tarde"},{"url":"img/hh_trem.jpg","legenda":"Trem de carga"},{"url":"img/hh_barco.jpg","legenda":"Pescaria"},{"url":"img/hh_trator.jpg","legenda":"Trator e veículos"},{"url":"img/hh_halloween.jpg","legenda":"Evento de Halloween"}]'::jsonb,
   true, 1),
  ('The Last Lume', 'Aventura · Floresta', 'pago', 'producao', 'Em breve', '#FFC566',
   'Guie o último vaga-lume por uma floresta escura e misteriosa.',
   'Guie o último vaga-lume por uma floresta escura e misteriosa e devolva a luz à Clareira dos Vaga-Lumes.',
   '["Aventura 2D vista de cima","Floresta cheia de segredos"]'::jsonb,
   '["Steam","itch.io","Site"]'::jsonb, '', '', '[]'::jsonb, false, 2),
  ('Ecos de Eldoria', 'RPG · Pixel art', 'doacao', 'producao', 'Em desenvolvimento', '#C9A4FF',
   'RPG em pixel art com vilas, masmorras e segredos para descobrir.',
   'Um RPG de aventura em pixel art visto de cima, com vilas, masmorras e segredos esperando para serem descobertos.',
   '["Visual pixel art","Vilas e masmorras para explorar"]'::jsonb,
   '["Site","itch.io"]'::jsonb, '', '', '[]'::jsonb, false, 3)
) as v
where not exists (select 1 from jogos);

insert into posts (titulo, tag, data, resumo, imagem)
select * from (values
  ('Harvest Hollow 2.6: chegou a vila', 'Atualização', date '2026-11-14', 'Mercado na cidade, trem de carga, trator, barco e novos ajudantes.', 'img/hh_vila.jpg'),
  ('Halloween na fazenda', 'Evento', date '2026-10-25', 'Abóboras iluminadas, noite roxa e espantalhos que ajudam na colheita.', 'img/hh_halloween.jpg')
) as v
where not exists (select 1 from posts);
