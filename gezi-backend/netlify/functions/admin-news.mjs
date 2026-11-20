/* ==========================================================================
   admin-news — GET /api/admin/news
   --------------------------------------------------------------------------
   Toplanan haberleri filtreli ve sayfalı listeler. Salt okunurdur.
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { requireAdmin } from "./_lib/auth.mjs";
import { handleError, HttpError, json, requireMethod } from "./_lib/http.mjs";
import { ALLOWED_CATEGORIES } from "./_lib/sources-catalog.mjs";

export const config = { path: "/api/admin/news" };

const STATUSES = [
  "collected",
  "categorized",
  "duplicate",
  "pending_review",
  "ready_for_ai",
  "rejected"
];

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
    requireAdmin(req);

    const params = new URL(req.url).searchParams;
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

    const supabase = getSupabase();
    let request = supabase
      .from("raw_articles")
      .select(
        "id, title, description, article_url, image_url, published_at, collected_at, category, category_confidence, duplicate_group_id, importance_score, score_breakdown, status, review_reason, sources(name, reliability_score)",
        { count: "exact" }
      )
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
      if (error.code === "42P01") {
        throw new HttpError(503, "schema_missing", "raw_articles tablosu bulunamadı. SQL migration uygulanmalı.");
      }
      throw new Error(`Haber havuzu okunamadı: ${error.message}`);
    }

    return json({
      ok: true,
      total: count ?? 0,
      limit,
      offset,
      items: (data || []).map((row) => ({
        ...row,
        source_name: row.sources?.name || null,
        sources: undefined
      }))
    });
  } catch (error) {
    return handleError(error, "admin-news");
  }
}
