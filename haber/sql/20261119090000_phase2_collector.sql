-- ==========================================================================
-- HABER PORTALI — 2. Aşama veritabanı şeması
-- RSS haber toplama motoru: kaynaklar, ham haberler, kaynak ilişkileri,
-- toplama günlükleri ve robot ayarları.
--
-- Uygulama: Supabase SQL Editor'de tek seferde çalıştırın veya
--            `supabase db push` / `supabase migration up` kullanın.
-- ==========================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- 1) sources — Haber kaynakları
-- --------------------------------------------------------------------------
create table if not exists public.sources (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  feed_url          text not null unique,
  category          text not null check (category in ('world', 'turkey', 'technology')),
  country           text,
  language          text not null default 'en',
  reliability_score integer not null default 70 check (reliability_score between 0 and 100),
  is_active         boolean not null default true,
  is_verified       boolean not null default false,
  verification_note text,
  last_error        text,
  last_checked_at   timestamptz,
  last_success_at   timestamptz,
  error_count       integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.sources is 'RSS/API haber kaynakları. Panelden eklenip güncellenebilir.';
comment on column public.sources.reliability_score is '0-100 arası başlangıç güvenilirlik puanı; puanlamada ağırlık olarak kullanılır.';
comment on column public.sources.is_verified is 'Kaynağın RSS adresi gerçek bir istekle doğrulandı mı?';

create index if not exists sources_active_idx on public.sources (is_active);
create index if not exists sources_category_idx on public.sources (category);

-- --------------------------------------------------------------------------
-- 2) raw_articles — Toplanan ham haberler (haber havuzu)
-- --------------------------------------------------------------------------
create table if not exists public.raw_articles (
  id                  uuid primary key default gen_random_uuid(),
  source_id           uuid references public.sources (id) on delete set null,
  title               text not null,
  description         text,
  article_url         text not null unique,
  image_url           text,
  published_at        timestamptz,
  collected_at        timestamptz not null default now(),
  category            text check (category in ('world', 'turkey', 'technology')),
  content_hash        text not null,
  normalized_title    text not null,
  title_hash          text not null,
  duplicate_group_id  uuid,
  importance_score    numeric(5, 2) not null default 0 check (importance_score between 0 and 100),
  score_breakdown     jsonb not null default '{}'::jsonb,
  category_confidence numeric(4, 3),
  review_reason       text,
  status              text not null default 'collected'
                      check (status in ('collected', 'categorized', 'duplicate', 'pending_review', 'ready_for_ai', 'rejected')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.raw_articles is 'Robotun topladığı ham haberler. Bu aşamada hiçbir kayıt portalda yayınlanmaz.';
comment on column public.raw_articles.duplicate_group_id is 'Aynı olayı aktaran kayıtların ortak grup kimliği. Kanonik kayıtta kendi id değeridir.';
comment on column public.raw_articles.importance_score is 'Sıralama amaçlı 0-100 öncelik puanı; doğruluk kanıtı değildir.';
comment on column public.raw_articles.status is 'collected | categorized | duplicate | pending_review | ready_for_ai | rejected';

create index if not exists raw_articles_published_idx on public.raw_articles (published_at desc);
create index if not exists raw_articles_collected_idx on public.raw_articles (collected_at desc);
create index if not exists raw_articles_status_idx on public.raw_articles (status);
create index if not exists raw_articles_category_idx on public.raw_articles (category);
create index if not exists raw_articles_group_idx on public.raw_articles (duplicate_group_id);
create index if not exists raw_articles_content_hash_idx on public.raw_articles (content_hash);
create index if not exists raw_articles_title_hash_idx on public.raw_articles (title_hash);
create index if not exists raw_articles_source_idx on public.raw_articles (source_id);

-- --------------------------------------------------------------------------
-- 3) article_sources — Haberin ilişkili olduğu kaynaklar
-- --------------------------------------------------------------------------
create table if not exists public.article_sources (
  id            uuid primary key default gen_random_uuid(),
  article_id    uuid not null references public.raw_articles (id) on delete cascade,
  source_id     uuid references public.sources (id) on delete set null,
  source_url    text not null,
  discovered_at timestamptz not null default now(),
  unique (article_id, source_url)
);

comment on table public.article_sources is 'Bir haber kaydının kaynak bağlantıları. Aynı olay için tüm kaynaklar korunur.';

create index if not exists article_sources_article_idx on public.article_sources (article_id);
create index if not exists article_sources_source_idx on public.article_sources (source_id);

-- --------------------------------------------------------------------------
-- 4) collection_logs — Toplama günlükleri
-- --------------------------------------------------------------------------
create table if not exists public.collection_logs (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid references public.sources (id) on delete set null,
  status          text not null check (status in ('success', 'partial', 'error', 'skipped')),
  articles_found  integer not null default 0,
  articles_saved  integer not null default 0,
  duplicates_found integer not null default 0,
  articles_rejected integer not null default 0,
  error_message   text,
  execution_time  integer, -- milisaniye
  created_at      timestamptz not null default now()
);

comment on table public.collection_logs is 'Her kaynak taraması için sonuç ve hata kaydı.';

create index if not exists collection_logs_created_idx on public.collection_logs (created_at desc);
create index if not exists collection_logs_source_idx on public.collection_logs (source_id);
create index if not exists collection_logs_status_idx on public.collection_logs (status);

-- --------------------------------------------------------------------------
-- 5) system_settings — Robot durumu ve ayarları (tek satır)
-- --------------------------------------------------------------------------
create table if not exists public.system_settings (
  id                    smallint primary key default 1 check (id = 1),
  robot_active          boolean not null default true,
  interval_minutes      integer not null default 15 check (interval_minutes between 5 and 240),
  last_run_at           timestamptz,
  last_run_status       text,
  last_run_summary      jsonb,
  collection_lock_until timestamptz,
  updated_at            timestamptz not null default now()
);

comment on table public.system_settings is 'Tek satırlık robot ayarı. Zamanlanmış fonksiyon çalışma aralığını buradan okur.';

insert into public.system_settings (id) values (1) on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- 6) updated_at tetikleyicisi
-- --------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sources_set_updated_at on public.sources;
create trigger sources_set_updated_at
  before update on public.sources
  for each row execute function public.set_updated_at();

drop trigger if exists raw_articles_set_updated_at on public.raw_articles;
create trigger raw_articles_set_updated_at
  before update on public.raw_articles
  for each row execute function public.set_updated_at();

drop trigger if exists system_settings_set_updated_at on public.system_settings;
create trigger system_settings_set_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- 7) RLS — Yalnızca service_role erişebilir
-- --------------------------------------------------------------------------
-- Tarayıcıya yalnızca anon anahtarı verilse bile bu tablolar okunamaz.
-- Toplama ve panel işlemleri Netlify Functions içinde service_role ile yapılır.
alter table public.sources enable row level security;
alter table public.raw_articles enable row level security;
alter table public.article_sources enable row level security;
alter table public.collection_logs enable row level security;
alter table public.system_settings enable row level security;

revoke all on public.sources from anon, authenticated;
revoke all on public.raw_articles from anon, authenticated;
revoke all on public.article_sources from anon, authenticated;
revoke all on public.collection_logs from anon, authenticated;
revoke all on public.system_settings from anon, authenticated;

-- service_role bu tablolara tam erişebilmeli. RLS'yi atlar ve yalnızca
-- Netlify Functions içinde kullanılır; tarayıcıya asla gönderilmez.
grant all on public.sources, public.raw_articles, public.article_sources,
  public.collection_logs, public.system_settings to service_role;

-- PostgREST şema önbelleğini hemen yenile.
notify pgrst, 'reload schema';

-- Not: service_role anahtarı RLS'yi atlar ve ASLA tarayıcıya gönderilmez.
-- 3. aşamada yayınlanmış haberler için ayrı bir `published_articles`
-- tablosu ve yalnızca okuma izinli RLS politikaları eklenecektir.
