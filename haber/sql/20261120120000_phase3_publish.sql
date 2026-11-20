-- ==========================================================================
-- HABER PORTALI — 3. Aşama: yayın onayı
-- --------------------------------------------------------------------------
-- Panelden onaylanan haberler `published_articles` tablosuna yazılır ve
-- /api/news ucu üzerinden portala servis edilir. Görseller kaynağın kendi
-- adresinden linklenir; dosya yüklenmez.
--
-- Uygulama: Supabase → SQL Editor → New query → bu dosyanın TAMAMINI yapıştır
-- → Run. "Success. No rows returned" görmelisin.
--
-- Dosya tekrar çalıştırılabilir: her adım "if not exists" / "or replace"
-- kullanır, yarım kalmış bir kurulumu da tamamlar.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1) updated_at fonksiyonu (2. aşama çalıştırılmamış olsa da hazır olsun)
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

-- --------------------------------------------------------------------------
-- 2) raw_articles — yayın alanları ve 'published' durumu
-- --------------------------------------------------------------------------
alter table public.raw_articles add column if not exists portal_published_at timestamptz;
alter table public.raw_articles add column if not exists portal_slug text;

comment on column public.raw_articles.portal_published_at is 'Panelden onaylanıp portalda yayınlandığı zaman.';
comment on column public.raw_articles.portal_slug is 'Portaldaki haber adresi (/haber/pages/article.html?slug=...).';

-- NOT VALID: mevcut satırlar taranmaz, bu yüzden eski bir kayıt yüzünden
-- komut hata vermez. Yeni/yeni güncellenen satırlar yine denetlenir.
alter table public.raw_articles drop constraint if exists raw_articles_status_check;
alter table public.raw_articles add constraint raw_articles_status_check
  check (status in ('collected', 'categorized', 'duplicate', 'pending_review', 'ready_for_ai', 'rejected', 'published'))
  not valid;

-- --------------------------------------------------------------------------
-- 3) published_articles — portaldaki yayınlar
-- --------------------------------------------------------------------------
create table if not exists public.published_articles (
  id              uuid primary key default gen_random_uuid(),
  raw_article_id  uuid not null unique references public.raw_articles (id) on delete cascade,
  slug            text not null unique,
  title           text not null,
  summary         text,
  content         jsonb not null default '[]'::jsonb,
  category        text not null check (category in ('world', 'turkey', 'technology')),
  image_url       text,
  source_name     text,
  source_url      text,
  is_breaking     boolean not null default false,
  tags            text[] not null default '{}',
  views           integer not null default 0,
  published_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Tablo daha eski/eksik bir sürümle oluşturulduysa eksik sütunları tamamla.
alter table public.published_articles add column if not exists raw_article_id uuid;
alter table public.published_articles add column if not exists slug text;
alter table public.published_articles add column if not exists title text;
alter table public.published_articles add column if not exists summary text;
alter table public.published_articles add column if not exists content jsonb default '[]'::jsonb;
alter table public.published_articles add column if not exists category text;
alter table public.published_articles add column if not exists image_url text;
alter table public.published_articles add column if not exists source_name text;
alter table public.published_articles add column if not exists source_url text;
alter table public.published_articles add column if not exists is_breaking boolean default false;
alter table public.published_articles add column if not exists tags text[] default '{}';
alter table public.published_articles add column if not exists views integer default 0;
alter table public.published_articles add column if not exists published_at timestamptz default now();
alter table public.published_articles add column if not exists created_at timestamptz default now();
alter table public.published_articles add column if not exists updated_at timestamptz default now();

comment on table public.published_articles is 'Panelden onaylanarak yayınlanan haberler. Görsel adresleri kaynaktan linklenir.';
comment on column public.published_articles.image_url is 'Kaynağın görsel adresi; dosya indirilmez veya yüklenmez.';

create index if not exists published_articles_published_idx on public.published_articles (published_at desc);
create index if not exists published_articles_category_idx on public.published_articles (category);

drop trigger if exists published_articles_set_updated_at on public.published_articles;
create trigger published_articles_set_updated_at
  before update on public.published_articles
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- 4) system_settings — otomatik yayın anahtarı
-- --------------------------------------------------------------------------
alter table public.system_settings add column if not exists auto_publish boolean not null default false;

comment on column public.system_settings.auto_publish is 'Açıksa puan eşiğini geçen haberler panel onayı beklenmeden yayınlanır.';

-- --------------------------------------------------------------------------
-- 5) RLS — yayınlar yalnızca sunucudan (service_role) okunur
-- --------------------------------------------------------------------------
alter table public.published_articles enable row level security;

revoke all on public.published_articles from anon, authenticated;
grant all on public.published_articles to service_role;

-- PostgREST şema önbelleğini hemen yenile.
notify pgrst, 'reload schema';
