/* ==========================================================================
   admin-logs — GET /api/admin/logs
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { requireAdmin } from "./_lib/auth.mjs";
import { handleError, HttpError, json, requireMethod } from "./_lib/http.mjs";

export const config = { path: "/api/admin/logs" };

const STATUSES = ["success", "partial", "error", "skipped"];

export default async function handler(req) {
  try {
    requireMethod(req, "GET");
    requireAdmin(req);

    const params = new URL(req.url).searchParams;
    const limitRaw = Number.parseInt(params.get("limit"), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(1, limitRaw)) : 50;
    const status = params.get("status") || "";

    if (status && !STATUSES.includes(status)) {
      throw new HttpError(400, "invalid_status", "Geçersiz durum filtresi.");
    }

    const supabase = getSupabase();
    let request = supabase
      .from("collection_logs")
      .select(
        "id, status, articles_found, articles_saved, duplicates_found, articles_rejected, error_message, execution_time, created_at, sources(name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      request = request.eq("status", status);
    }

    const { data, error, count } = await request;
    if (error) {
      if (error.code === "42P01") {
        throw new HttpError(503, "schema_missing", "collection_logs tablosu bulunamadı. SQL migration uygulanmalı.");
      }
      throw new Error(`Günlükler okunamadı: ${error.message}`);
    }

    return json({
      ok: true,
      total: count ?? 0,
      items: (data || []).map((row) => ({
        ...row,
        source_name: row.sources?.name || null,
        sources: undefined
      }))
    });
  } catch (error) {
    return handleError(error, "admin-logs");
  }
}
