/* ==========================================================================
   score-news — POST /api/admin/score-news
   ========================================================================== */

import { requireAdmin } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, HttpError, json, readJson, requireMethod } from "./_lib/http.mjs";
import { scoreArticle } from "./_lib/score.mjs";

export const config = { path: "/api/admin/score-news" };

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function handler(req) {
  try {
    requireMethod(req, "POST");
    assertSameOrigin(req);
    requireAdmin(req);

    const body = await readJson(req, 10_000);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      throw new HttpError(400, "title_required", "Başlık zorunludur.");
    }

    const score = scoreArticle({
      title,
      description: typeof body.description === "string" ? body.description : "",
      publishedAt: body.published_at || undefined,
      sourceReliability: numberOr(body.source_reliability, 70),
      supportCount: numberOr(body.support_count, 1),
      duplicateSimilarity: numberOr(body.duplicate_similarity, 0)
    });

    return json({ ok: true, score });
  } catch (error) {
    return handleError(error, "score-news");
  }
}
