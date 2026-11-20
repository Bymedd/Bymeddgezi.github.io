/* ==========================================================================
   public-news — GET /api/news
   --------------------------------------------------------------------------
   Portalın ön yüzüne yayınlanmış haberleri servis eder. Yalnızca panelden
   onaylanmış (published_articles) kayıtlar döner; ham havuz asla açılmaz.
   Görsel adresleri kaynakların kendi sunucularına aittir.

   GET /api/news            -> son yayınlar (limit, category)
   GET /api/news?slug=...   -> tek haber
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { handleError, HttpError, json, requireMethod } from "./_lib/http.mjs";
import { ALLOWED_CATEGORIES } from "./_lib/sources-catalog.mjs";

export const config = { path: "/api/news" };

const FIELDS =
  "id, slug, title, summary, content, category, image_url, source_name, source_url, is_breaking, tags, views, published_at";

const CACHE_HEADERS = { "cache-control": "public, max-age=60, s-maxage=300" };

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

export default async function handler(req) {
  try {
    requireMethod(req, "GET");

    const params = new URL(req.url).searchParams;
    const slug = (params.get("slug") || "").trim().slice(0, 200);
    const category = params.get("category") || "";
    const limit = boundedInt(params.get("limit"), 30, 1, 60);

    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      throw new HttpError(400, "invalid_category", "Geçersiz kategori filtresi.");
    }

    const supabase = getSupabase();

    if (slug) {
      const { data, error } = await supabase
        .from("published_articles")
        .select(FIELDS)
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        if (error.code === "42P01") {
          throw new HttpError(503, "schema_missing", "Yayın tablosu bulunamadı.");
        }
        throw new Error(`Haber okunamadı: ${error.message}`);
      }
      if (!data) {
        throw new HttpError(404, "not_found", "Haber bulunamadı.");
      }
      return json({ ok: true, item: data }, 200, CACHE_HEADERS);
    }

    let query = supabase
      .from("published_articles")
      .select(FIELDS, { count: "exact" })
      .order("published_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query;
    if (error) {
      if (error.code === "42P01") {
        throw new HttpError(503, "schema_missing", "Yayın tablosu bulunamadı.");
      }
      throw new Error(`Yayınlar okunamadı: ${error.message}`);
    }

    return json({ ok: true, total: count ?? 0, items: data || [] }, 200, CACHE_HEADERS);
  } catch (error) {
    return handleError(error, "public-news");
  }
}
