/* ==========================================================================
   get-system-status — GET /api/admin/status
   --------------------------------------------------------------------------
   Panelin sistem durumu kartlarını besler. Supabase yapılandırılmamışsa
   sahte veri üretmez; 503 ve eksik değişken listesi döner.
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { requireAdmin } from "./_lib/auth.mjs";
import { handleError, HttpError, json, requireMethod } from "./_lib/http.mjs";
import { getSettings, computeNextRun } from "./_lib/settings.mjs";
import { ensureSeedSources } from "./_lib/collector.mjs";

export const config = { path: "/api/admin/status" };

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/** Yayın tablosu migrasyonu henüz uygulanmadıysa paneli düşürmez. */
async function publishedCount(supabase) {
  const { count, error } = await supabase
    .from("published_articles")
    .select("id", { count: "exact", head: true });
  if (error) {
    return 0;
  }
  return count ?? 0;
}

async function countOf(supabase, table, applyFilters = (query) => query) {
  const { count, error } = await applyFilters(
    supabase.from(table).select("id", { count: "exact", head: true })
  );
  if (error) {
    if (error.code === "42P01") {
      throw new HttpError(
        503,
        "schema_missing",
        "Supabase tabloları bulunamadı. supabase/migrations altındaki SQL dosyasını uygulayın."
      );
    }
    throw new Error(`${table} sayımı başarısız: ${error.message}`);
  }
  return count ?? 0;
}

export default async function handler(req) {
  try {
    requireMethod(req, "GET");
    requireAdmin(req);

    const supabase = getSupabase();
    await ensureSeedSources(supabase);

    const settings = await getSettings(supabase);
    const since = startOfTodayIso();

    const [
      activeSources,
      totalSources,
      verifiedSources,
      totalArticles,
      todayArticles,
      duplicateArticles,
      pendingReview,
      readyForAi,
      categorized,
      rejected,
      publishedArticleTotal,
      last24hErrors,
      recentLogs
    ] = await Promise.all([
      countOf(supabase, "sources", (q) => q.eq("is_active", true)),
      countOf(supabase, "sources"),
      countOf(supabase, "sources", (q) => q.eq("is_verified", true)),
      countOf(supabase, "raw_articles"),
      countOf(supabase, "raw_articles", (q) => q.gte("collected_at", since)),
      countOf(supabase, "raw_articles", (q) => q.eq("status", "duplicate")),
      countOf(supabase, "raw_articles", (q) => q.eq("status", "pending_review")),
      countOf(supabase, "raw_articles", (q) => q.eq("status", "ready_for_ai")),
      countOf(supabase, "raw_articles", (q) => q.eq("status", "categorized")),
      countOf(supabase, "raw_articles", (q) => q.eq("status", "rejected")),
      publishedCount(supabase),
      countOf(supabase, "collection_logs", (q) =>
        q.eq("status", "error").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ),
      supabase
        .from("collection_logs")
        .select("id, status, articles_found, articles_saved, duplicates_found, error_message, execution_time, created_at, sources(name)")
        .order("created_at", { ascending: false })
        .limit(6)
    ]);

    if (recentLogs.error && recentLogs.error.code === "42P01") {
      throw new HttpError(503, "schema_missing", "collection_logs tablosu bulunamadı. SQL migration uygulanmalı.");
    }

    return json({
      ok: true,
      server_time: new Date().toISOString(),
      environment: {
        supabase_configured: true,
        admin_configured: true
      },
      robot: {
        active: Boolean(settings.robot_active),
        interval_minutes: settings.interval_minutes,
        last_run_at: settings.last_run_at,
        last_run_status: settings.last_run_status,
        last_run_summary: settings.last_run_summary,
        next_run_at: settings.robot_active
          ? computeNextRun(settings.last_run_at, settings.interval_minutes)
          : null,
        lock_until: settings.collection_lock_until,
        auto_publish: Boolean(settings.auto_publish)
      },
      sources: {
        active: activeSources,
        total: totalSources,
        verified: verifiedSources
      },
      articles: {
        total: totalArticles,
        today: todayArticles,
        duplicates: duplicateArticles,
        pending_review: pendingReview,
        ready_for_ai: readyForAi,
        categorized,
        rejected,
        published: publishedArticleTotal
      },
      errors_last_24h: last24hErrors,
      recent_logs: (recentLogs.data || []).map((log) => ({
        ...log,
        source_name: log.sources?.name || null,
        sources: undefined
      })),
      thresholds: {
        ready_score: Number(process.env.READY_SCORE_THRESHOLD || 55),
        category_confidence: Number(process.env.CATEGORY_CONFIDENCE_THRESHOLD || 0.5)
      }
    });
  } catch (error) {
    return handleError(error, "get-system-status");
  }
}
