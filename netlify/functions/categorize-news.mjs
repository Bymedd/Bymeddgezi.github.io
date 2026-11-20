/* ==========================================================================
   categorize-news — POST /api/admin/categorize-news
   ========================================================================== */

import { requireAdmin } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, HttpError, json, readJson, requireMethod } from "./_lib/http.mjs";
import { categorizeArticle, CATEGORIES } from "./_lib/categorize.mjs";

export const config = { path: "/api/admin/categorize-news" };

export default async function handler(req) {
  try {
    requireMethod(req, "POST");
    assertSameOrigin(req);
    requireAdmin(req);

    const body = await readJson(req, 20_000);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title.length < 5) {
      throw new HttpError(400, "title_required", "En az 5 karakterlik bir başlık girin.");
    }
    if (title.length > 500) {
      throw new HttpError(400, "title_too_long", "Başlık çok uzun.");
    }
    const description = typeof body.description === "string" ? body.description.slice(0, 5000) : "";
    const sourceCategory = CATEGORIES.includes(body.source_category) ? body.source_category : null;

    return json({
      ok: true,
      result: categorizeArticle({ title, description, sourceCategory })
    });
  } catch (error) {
    return handleError(error, "categorize-news");
  }
}
