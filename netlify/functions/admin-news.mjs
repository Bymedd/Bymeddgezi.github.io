/* ==========================================================================
   admin-news — GET/POST /api/admin/news
   --------------------------------------------------------------------------
   GET  : Toplanan haberleri filtreli ve sayfalı listeler.
   POST : Onay akışı — approve (yayınla), reject (reddet), unpublish
          (yayından kaldır).

   Robot hiçbir haberi kendi başına yayınlamaz; bu uç onay verilince
   `published_articles` kaydını oluşturur ve portalda görünür hâle getirir.
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { requireAdmin } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, HttpError, json, readJson, requireMethod } from "./_lib/http.mjs";
import { ALLOWED_CATEGORIES } from "./_lib/sources-catalog.mjs";
import { publishArticle, rejectArticle, unpublishArticle } from "./_lib/publish.mjs";

export const config = { path: "/api/admin/news" };

const STATUSES = [
  "collected",
  "categorized",
  "duplicate",
  "pending_review",
  "ready_for_ai",
  "rejected",
  "published"
];

const SELECT_FIELDS =
  "id, title, description, article_url, image_url, published_at, collected_at, category, category_confidence, duplicate_group_id, importance_score, score_breakdown, status, review_reason, sources(name, reliability_score)";

const PUBLISHED_FIELDS = "raw_article_id, slug, is_breaking, published_at, title, category";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function publicPath(slug) {
  return `/haber/pages/article.html?slug=${encodeURIComponent(slug)}`;
}

const SCHEMA_ERROR_CODES = new Set(["42P01", "42703", "23514", "PGRST204", "PGRST205"]);

function isSchemaError(error) {
  return Boolean(error) && SCHEMA_ERROR_CODES.has(error.code);
}

/**
 * Yayın durumu tek doğru kaynaktan, `published_articles` tablosundan türetilir.
 * Böylece raw_articles üzerindeki portal_* sütunları / durum kısıtı henüz
 * eklenmemiş olsa da panel yayındaki haberleri görür.
 */
async function withPublishedState(supabase, items) {
  if (!items.length) {
    return items;
  }
  const ids = items.map((row) => row.id);
  const { data, error } = await supabase
    .from("published_articles")
    .select(PUBLISHED_FIELDS)
    .in("raw_article_id", ids);

  if (error) {
    if (isSchemaError(error)) {
      return items;
    }
    throw new Error(`Yayın bilgisi okunamadı: ${error.message}`);
  }

  const map = new Map((data || []).map((row) => [row.raw_article_id, row]));
  return items.map((item) => {
    const published = map.get(item.id);
    if (!published) {
      return item;
    }
    return {
      ...item,
      status: "published",
      portal_slug: published.slug,
      portal_published_at: published.published_at,
      is_breaking: Boolean(published.is_breaking)
    };
  });
}

/** "Yayında" filtresi: kaynak tablo published_articles. */
async function listPublishedArticles(supabase, params) {
  const limit = boundedInt(params.get("limit"), 25, 1, 100);
  const offset = boundedInt(params.get("offset"), 0, 0, 100000);
  const category = params.get("category") || "";
  const query = (params.get("q") || "").trim().slice(0, 100);

  if (category && !ALLOWED_CATEGORIES.includes(category)) {
    throw new HttpError(400, "invalid_category", "Geçersiz kategori filtresi.");
  }

  let request = supabase
    .from("published_articles")
    .select(PUBLISHED_FIELDS, { count: "exact" })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    request = request.eq("category", category);
  }
  if (query) {
    request = request.ilike("title", `%${query}%`);
  }

  const { data, error, count } = await request;
  if (error) {
    if (isSchemaError(error)) {
      return { ok: true, total: 0, limit, offset, items: [] };
    }
    throw new Error(`Yayınlar okunamadı: ${error.message}`);
  }

  const rows = data || [];
  if (!rows.length) {
    return { ok: true, total: count ?? 0, limit, offset, items: [] };
  }

  const { data: rawRows, error: rawError } = await supabase
    .from("raw_articles")
    .select(SELECT_FIELDS)
    .in("id", rows.map((row) => row.raw_article_id));

  if (rawError) {
    throw new Error(`Yayın kaynakları okunamadı: ${rawError.message}`);
  }

  const byId = new Map((rawRows || []).map((row) => [row.id, row]));
  const items = rows.map((published) => {
    const raw = byId.get(published.raw_article_id);
    return {
      ...(raw || { id: published.raw_article_id }),
      title: (raw && raw.title) || published.title,
      category: (raw && raw.category) || published.category,
      source_name: raw?.sources?.name || null,
      sources: undefined,
      status: "published",
      portal_slug: published.slug,
      portal_published_at: published.published_at,
      is_breaking: Boolean(published.is_breaking)
    };
  });

  return { ok: true, total: count ?? 0, limit, offset, items };
}

async function listArticles(supabase, params) {
  const limit = boundedInt(params.get("limit"), 25, 1, 100);
  const offset = boundedInt(params.get("offset"), 0, 0, 100000);
  const status = params.get("status") || "";
  const category = params.get("category") || "";
  const query = (params.get("q") || "").trim().slice(0, 100);

  if (status && !STATUSES.includes(status)) {
    throw new HttpError(400, "invalid_status", "Geçersiz durum filtresi.");
  }
  if (category && !ALLOWED_CATEGORIES.includes(category)) {
    throw new HttpError(400, "invalid_category", "Geçersiz kategori filtresi.");
  }

  if (status === "published") {
    return listPublishedArticles(supabase, params);
  }

  let request = supabase
    .from("raw_articles")
    .select(SELECT_FIELDS, { count: "exact" })
    .order("collected_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    request = request.eq("status", status);
  }
  if (category) {
    request = request.eq("category", category);
  }
  if (query) {
    request = request.ilike("title", `%${query}%`);
  }

  const { data, error, count } = await request;
  if (error) {
    if (isSchemaError(error)) {
      throw new HttpError(
        503,
        "schema_missing",
        "Haber havuzu şeması eksik. supabase/migrations/20261120120000_phase3_publish.sql dosyasını Supabase SQL Editor'de çalıştırın."
      );
    }
    throw new Error(`Haber havuzu okunamadı: ${error.message}`);
  }

  const baseItems = (data || []).map((row) => ({
    ...row,
    source_name: row.sources?.name || null,
    is_breaking: false,
    sources: undefined
  }));

  const items = await withPublishedState(supabase, baseItems);

  return {
    ok: true,
    total: count ?? 0,
    limit,
    offset,
    items
  };
}

async function handleReviewAction(supabase, body) {
  const action = String(body.action || "");
  const id = String(body.id || "");

  if (!UUID_RE.test(id)) {
    throw new HttpError(400, "invalid_id", "Geçerli bir haber kimliği gönderilmedi.");
  }

  const { data: article, error } = await supabase
    .from("raw_articles")
    .select("id, title, description, article_url, image_url, category, published_at, status, sources(name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      throw new HttpError(503, "schema_missing", "raw_articles tablosu bulunamadı. SQL migration uygulanmalı.");
    }
    throw new Error(`Haber okunamadı: ${error.message}`);
  }
  if (!article) {
    throw new HttpError(404, "not_found", "Haber bulunamadı.");
  }

  if (action === "approve") {
    const published = await publishArticle(supabase, article, {
      title: body.title,
      summary: body.summary,
      category: body.category,
      image_url: body.image_url,
      is_breaking: body.is_breaking
    });
    return {
      ok: true,
      message: "Haber yayınlandı.",
      published: {
        id: published.id,
        slug: published.slug,
        title: published.title,
        published_at: published.published_at
      },
      public_path: publicPath(published.slug)
    };
  }

  if (action === "reject") {
    await rejectArticle(supabase, id, body.reason);
    return { ok: true, message: "Haber reddedildi." };
  }

  if (action === "unpublish") {
    await unpublishArticle(supabase, id);
    return { ok: true, message: "Haber yayından kaldırıldı." };
  }

  throw new HttpError(400, "unknown_action", "Geçersiz işlem. approve, reject veya unpublish kullanın.");
}

export default async function handler(req) {
  try {
    const method = req.method.toUpperCase();
    requireAdmin(req);
    const supabase = getSupabase();

    if (method === "GET") {
      return json(await listArticles(supabase, new URL(req.url).searchParams));
    }

    requireMethod(req, "POST");
    assertSameOrigin(req);

    const body = await readJson(req, 20_000);
    return json(await handleReviewAction(supabase, body));
  } catch (error) {
    return handleError(error, "admin-news");
  }
}
