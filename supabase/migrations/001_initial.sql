-- =============================================================================
-- Portal Atlas Terra — Migração inicial
-- Execute no Supabase SQL Editor ou via Supabase CLI
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- =============================================================================
-- TABELAS
-- =============================================================================

-- ─── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key default uuid_generate_v4(),
  auth_user_id  uuid not null unique references auth.users(id) on delete cascade,
  name          text not null,
  username      text not null unique,
  role          text not null check (role in ('admin', 'client')) default 'client',
  status        text not null check (status in ('active', 'inactive')) default 'active',
  created_at    timestamptz not null default now()
);

-- ─── clients ──────────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null unique references public.profiles(id) on delete cascade,
  name        text not null,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ─── farms ────────────────────────────────────────────────────────────────────
create table if not exists public.farms (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  name              text not null,
  city              text not null,
  state             char(2) not null,
  total_area_ha     numeric(12,2) not null default 0,
  total_area_alq    numeric(12,2) not null default 0,
  cover_image_path  text,
  description       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── farm_models ──────────────────────────────────────────────────────────────
create table if not exists public.farm_models (
  id          uuid primary key default uuid_generate_v4(),
  farm_id     uuid not null references public.farms(id) on delete cascade,
  type        text not null check (type in ('3d', '2d')),
  title       text,
  cesium_url  text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (farm_id, type)
);

-- ─── area_table_rows ──────────────────────────────────────────────────────────
create table if not exists public.area_table_rows (
  id          uuid primary key default uuid_generate_v4(),
  farm_id     uuid not null references public.farms(id) on delete cascade,
  class_name  text not null,
  area_ha     numeric(12,2) not null default 0,
  area_alq    numeric(12,2) not null default 0,
  percentage  numeric(5,2) not null default 0,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── property_document_numbers ────────────────────────────────────────────────
create table if not exists public.property_document_numbers (
  id              uuid primary key default uuid_generate_v4(),
  farm_id         uuid not null references public.farms(id) on delete cascade,
  document_type   text not null check (document_type in ('matricula','ccir','cib','sigef','car')),
  document_number text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (farm_id, document_type)
);

-- ─── property_document_files ──────────────────────────────────────────────────
create table if not exists public.property_document_files (
  id              uuid primary key default uuid_generate_v4(),
  farm_id         uuid not null references public.farms(id) on delete cascade,
  title           text not null,
  document_type   text not null,
  file_path       text not null,
  created_at      timestamptz not null default now()
);

-- ─── farm_images ──────────────────────────────────────────────────────────────
create table if not exists public.farm_images (
  id          uuid primary key default uuid_generate_v4(),
  farm_id     uuid not null references public.farms(id) on delete cascade,
  file_path   text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── farm_videos ──────────────────────────────────────────────────────────────
create table if not exists public.farm_videos (
  id              uuid primary key default uuid_generate_v4(),
  farm_id         uuid not null references public.farms(id) on delete cascade,
  title           text not null,
  video_url       text not null,
  video_provider  text not null check (video_provider in ('youtube','vimeo','other')) default 'youtube',
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

-- ─── technical_pdfs ───────────────────────────────────────────────────────────
create table if not exists public.technical_pdfs (
  id          uuid primary key default uuid_generate_v4(),
  farm_id     uuid not null references public.farms(id) on delete cascade,
  title       text not null,
  category    text not null check (category in ('mapa','relatorio')),
  file_path   text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- TRIGGERS: updated_at automático
-- =============================================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_farms_updated
  before update on public.farms
  for each row execute procedure public.handle_updated_at();

create trigger on_farm_models_updated
  before update on public.farm_models
  for each row execute procedure public.handle_updated_at();

create trigger on_property_document_numbers_updated
  before update on public.property_document_numbers
  for each row execute procedure public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS em todas as tabelas
alter table public.profiles                  enable row level security;
alter table public.clients                   enable row level security;
alter table public.farms                     enable row level security;
alter table public.farm_models               enable row level security;
alter table public.area_table_rows           enable row level security;
alter table public.property_document_numbers enable row level security;
alter table public.property_document_files   enable row level security;
alter table public.farm_images               enable row level security;
alter table public.farm_videos               enable row level security;
alter table public.technical_pdfs            enable row level security;

-- ─── Função helper: verificar role do usuário ─────────────────────────────────
create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where auth_user_id = auth.uid();
$$;

-- ─── Função helper: obter client_id do usuário atual ──────────────────────────
create or replace function public.get_my_client_id()
returns uuid language sql security definer stable as $$
  select c.id from public.clients c
  join public.profiles p on p.id = c.profile_id
  where p.auth_user_id = auth.uid();
$$;

-- =============================================================================
-- POLÍTICAS: profiles
-- =============================================================================

-- Admin: acesso total
create policy "admin_all_profiles"
  on public.profiles for all
  using (public.get_my_role() = 'admin');

-- Cliente: ver apenas seu próprio perfil
create policy "client_own_profile"
  on public.profiles for select
  using (auth_user_id = auth.uid());

-- =============================================================================
-- POLÍTICAS: clients
-- =============================================================================

create policy "admin_all_clients"
  on public.clients for all
  using (public.get_my_role() = 'admin');

create policy "client_own_client"
  on public.clients for select
  using (profile_id = (select id from public.profiles where auth_user_id = auth.uid()));

-- =============================================================================
-- POLÍTICAS: farms
-- =============================================================================

create policy "admin_all_farms"
  on public.farms for all
  using (public.get_my_role() = 'admin');

create policy "client_own_farms"
  on public.farms for select
  using (client_id = public.get_my_client_id());

-- =============================================================================
-- POLÍTICAS GENÉRICAS: tabelas dependentes de farm_id
-- Para cada tabela: admin acesso total, cliente só vê seus dados
-- =============================================================================

-- farm_models
create policy "admin_all_farm_models" on public.farm_models for all
  using (public.get_my_role() = 'admin');
create policy "client_own_farm_models" on public.farm_models for select
  using (farm_id in (select id from public.farms where client_id = public.get_my_client_id()));

-- area_table_rows
create policy "admin_all_area_rows" on public.area_table_rows for all
  using (public.get_my_role() = 'admin');
create policy "client_own_area_rows" on public.area_table_rows for select
  using (farm_id in (select id from public.farms where client_id = public.get_my_client_id()));

-- property_document_numbers
create policy "admin_all_doc_numbers" on public.property_document_numbers for all
  using (public.get_my_role() = 'admin');
create policy "client_own_doc_numbers" on public.property_document_numbers for select
  using (farm_id in (select id from public.farms where client_id = public.get_my_client_id()));

-- property_document_files
create policy "admin_all_doc_files" on public.property_document_files for all
  using (public.get_my_role() = 'admin');
create policy "client_own_doc_files" on public.property_document_files for select
  using (farm_id in (select id from public.farms where client_id = public.get_my_client_id()));

-- farm_images
create policy "admin_all_farm_images" on public.farm_images for all
  using (public.get_my_role() = 'admin');
create policy "client_own_farm_images" on public.farm_images for select
  using (farm_id in (select id from public.farms where client_id = public.get_my_client_id()));

-- farm_videos
create policy "admin_all_farm_videos" on public.farm_videos for all
  using (public.get_my_role() = 'admin');
create policy "client_own_farm_videos" on public.farm_videos for select
  using (farm_id in (select id from public.farms where client_id = public.get_my_client_id()));

-- technical_pdfs
create policy "admin_all_technical_pdfs" on public.technical_pdfs for all
  using (public.get_my_role() = 'admin');
create policy "client_own_technical_pdfs" on public.technical_pdfs for select
  using (farm_id in (select id from public.farms where client_id = public.get_my_client_id()));

-- =============================================================================
-- STORAGE: Criar buckets privados
-- Execute no SQL Editor do Supabase
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('farm-images',    'farm-images',    false),
  ('farm-documents', 'farm-documents', false)
on conflict (id) do nothing;

-- Políticas de storage: admin pode fazer tudo
create policy "admin_storage_farm_images" on storage.objects
  for all using (
    bucket_id = 'farm-images'
    and public.get_my_role() = 'admin'
  );

create policy "client_read_farm_images" on storage.objects
  for select using (
    bucket_id = 'farm-images'
    and auth.role() = 'authenticated'
  );

create policy "admin_storage_farm_documents" on storage.objects
  for all using (
    bucket_id = 'farm-documents'
    and public.get_my_role() = 'admin'
  );

create policy "client_read_farm_documents" on storage.objects
  for select using (
    bucket_id = 'farm-documents'
    and auth.role() = 'authenticated'
  );

-- =============================================================================
-- PRIMEIRO ADMINISTRADOR
-- =============================================================================
-- Após criar o primeiro usuário no Auth (via painel Supabase ou API),
-- execute o comando abaixo substituindo os valores:
--
-- insert into public.profiles (auth_user_id, name, username, role, status)
-- values (
--   'SEU_AUTH_USER_ID_AQUI',
--   'Administrador Atlas Terra',
--   'admin',
--   'admin',
--   'active'
-- );
--
-- O email interno será: admin@atlasterra.portal
-- =============================================================================

