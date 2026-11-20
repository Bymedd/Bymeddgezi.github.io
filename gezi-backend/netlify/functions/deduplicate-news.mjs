/* ==========================================================================
   deduplicate-news — POST /api/admin/deduplicate-news
   --------------------------------------------------------------------------
   Veritabanındaki son 7 günün kayıtlarıyla karşılaştırma yapar.
   Test amaçlıdır; kayıt oluşturmaz.
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { requireAdmin } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, HttpError, json, readJson, requireMethod } from "./_lib/http.mjs";
import { findDuplicate } from "./_lib/dedupe.mjs";
import { loadCandidates } from "./_lib/collector.mjs";
import { buildArticleRecord } from "./_lib/pipeline.mjs";
import { ALLOWED_CATEGORIES } from "./_lib/sources-catalog.mjs";

export const config = { path: "/api/admin/deduplicate-news" };

export default async function handler(req) {
  try {
    requireMethod(req, "POST");
    assertSameOrigin(req);
    requireAdmin(req);

    const body = await readJson(req, 20_000);
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new HttpError(400, "title_required", "Başlık zorunludur.");
    }

    const built = buildArticleRecord(
      {
        title: body.title,
        link: body.url || body.link || "https://example.com/onizleme",
        description: body.description || "",
        publishedAt: body.published_at || new Date().toISOString()
      },
      {
        id: null,
        name: "Önizleme",
        category: ALLOWED_CATEGORIES.includes(body.category) ? body.category : "world",
        reliability_score: 70,
        language: "tr"
      }
    );

    if (!built.ok) {
      throw new HttpError(400, "invalid_candidate", built.reason);
    }

    const supabase = getSupabase();
    const candidates = await loadCandidates(supabase, Date.now());
    const duplicate = findDuplicate(built.record, candidates);

    return json({
      ok: true,
      normalized: {
        title: built.record.title,
        normalized_title: built.record.normalized_title,
        title_hash: built.record.title_hash,
        content_hash: built.record.content_hash,
        article_url: built.record.article_url,
        published_at: built.record.published_at
      },
      duplicate: Boolean(duplicate),
      reason: duplicate?.comparison.reason || null,
      similarity: duplicate?.comparison.similarity ?? null,
      hours_apart: duplicate?.comparison.hours ?? null,
      match: duplicate
        ? {
            id: duplicate.match.id,
            title: duplicate.match.title,
            article_url: duplicate.match.article_url,
            published_at: duplicate.match.published_at,
            duplicate_group_id: duplicate.match.duplicate_group_id,
            status: duplicate.match.status
          }
        : null,
      pool_size: candidates.length
    });
  } catch (error) {
    return handleError(error, "deduplicate-news");
  }
}
