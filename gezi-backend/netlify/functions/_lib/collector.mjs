/* ==========================================================================
   collector.mjs — Haber toplama orkestrasyonu
   --------------------------------------------------------------------------
   - Kaynakları sırayla tarar (hız sınırlarına saygı için paralel istek yok).
   - Bir kaynak hata verirse diğerlerine devam eder.
   - Zaman bütçesi dolduğunda kalan kaynakları sonraki çalışmaya bırakır.
   - Her haber için tekrar kontrolü, puanlama ve durum ataması yapar.
   - Hiçbir haberi portalda yayınlamaz.
   ========================================================================== */

import { randomUUID } from "node:crypto";
import { getRuntimeConfig } from "./env.mjs";
import { fetchFeed, mapFeedItems } from "./feed.mjs";
import { buildArticleRecord, buildSourceLink, decideStatus } from "./pipeline.mjs";
import { findDuplicate, distinctSourceCount } from "./dedupe.mjs";
import { scoreArticle, supportPoints } from "./score.mjs";
import { catalogRow, SOURCE_CATALOG } from "./sources-catalog.mjs";
import {
  acquireCollectionLock,
  getSettings,
  recordRun,
  releaseCollectionLock
} from "./settings.mjs";

const CANDIDATE_WINDOW_DAYS = 7;
const CANDIDATE_LIMIT = 500;
const MAX_BUDGET_MS = 25_000;

function nowIso(now) {
  return new Date(now).toISOString();
}

/** Yalnızca veritabanı sütunlarını içeren satır üretir. */
function articleRow(record, { id, groupId, score, status, reviewReason, supportSources }) {
  return {
    id,
    source_id: record.source_id,
    title: record.title,
    description: record.description,
    article_url: record.article_url,
    image_url: record.image_url,
    published_at: record.published_at,
    category: record.category,
    category_confidence: record.category_confidence,
    content_hash: record.content_hash,
    normalized_title: record.normalized_title,
    title_hash: record.title_hash,
    duplicate_group_id: groupId,
    importance_score: score.total,
    score_breakdown: {
      ...score.breakdown,
      support_sources: supportSources,
      category_scores: record.category_scores,
      matched_keywords: record.matched_keywords,
      published_estimated: Boolean(record.published_estimated)
    },
    status,
    review_reason: reviewReason || null
  };
}

/** Kaynak tablosu boşsa doğrulanmış katalogla doldurur. */
export async function ensureSeedSources(supabase) {
  const { count, error } = await supabase
    .from("sources")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Kaynaklar okunamadı: ${error.message}`);
  }
  if ((count ?? 0) > 0) {
    return { inserted: 0, existing: count ?? 0 };
  }

  const rows = SOURCE_CATALOG.map(catalogRow);
  const { data, error: insertError } = await supabase
    .from("sources")
    .insert(rows)
    .select("id");

  if (insertError) {
    throw new Error(`Varsayılan kaynaklar eklenemedi: ${insertError.message}`);
  }
  return { inserted: data?.length ?? 0, existing: 0 };
}

export async function loadCandidates(supabase, now) {
  const since = new Date(now - CANDIDATE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("raw_articles")
    .select(
      "id, source_id, title, normalized_title, title_hash, content_hash, article_url, published_at, duplicate_group_id, category, status"
    )
    .gte("collected_at", since)
    .order("collected_at", { ascending: false })
    .limit(CANDIDATE_LIMIT);

  if (error) {
    throw new Error(`Haber havuzu okunamadı: ${error.message}`);
  }
  return data || [];
}

async function writeLog(supabase, entry) {
  const { error } = await supabase.from("collection_logs").insert(entry);
  if (error) {
    console.error("Toplama günlüğü yazılamadı:", error.message);
  }
}

async function markSourceChecked(supabase, source, { success, errorMessage, now }) {
  const patch = {
    last_checked_at: nowIso(now),
    last_error: success ? null : errorMessage || "Bilinmeyen hata"
  };
  if (success) {
    patch.last_success_at = nowIso(now);
    patch.error_count = 0;
    patch.is_verified = true;
  } else {
    patch.error_count = (source.error_count || 0) + 1;
  }
  const { error } = await supabase.from("sources").update(patch).eq("id", source.id);
  if (error) {
    console.error("Kaynak durumu güncellenemedi:", error.message);
  }
}

async function saveSourceLink(supabase, articleId, source, url) {
  const { error } = await supabase
    .from("article_sources")
    .insert(buildSourceLink(articleId, source, url));
  if (error && error.code !== "23505") {
    console.error("Kaynak bağlantısı yazılamadı:", error.message);
  }
}

async function groupSupportCount(supabase, groupId) {
  const { data, error } = await supabase
    .from("raw_articles")
    .select("source_id")
    .eq("duplicate_group_id", groupId);
  if (error) {
    console.error("Grup kaynak sayısı okunamadı:", error.message);
    return 1;
  }
  return Math.max(1, distinctSourceCount(data || []));
}

async function refreshCanonicalScore(supabase, groupId, threshold) {
  const supportCount = await groupSupportCount(supabase, groupId);
  const { data: canonical, error } = await supabase
    .from("raw_articles")
    .select("importance_score, score_breakdown, status")
    .eq("id", groupId)
    .maybeSingle();
  if (error || !canonical) {
    return;
  }

  const breakdown = canonical.score_breakdown || {};
  const previousSupport = Number(breakdown.support) || 0;
  const nextSupport = supportPoints(supportCount);
  const total = Math.min(
    100,
    Math.max(
      0,
      Math.round((Number(canonical.importance_score) - previousSupport + nextSupport) * 100) / 100
    )
  );

  const patch = {
    importance_score: total,
    score_breakdown: { ...breakdown, support: nextSupport, support_sources: supportCount }
  };

  if (canonical.status === "categorized" && total >= threshold) {
    patch.status = "ready_for_ai";
  }

  const { error: updateError } = await supabase
    .from("raw_articles")
    .update(patch)
    .eq("id", groupId);
  if (updateError) {
    console.error("Kanonik haber puanı güncellenemedi:", updateError.message);
  }
}

async function collectSource(supabase, source, context) {
  const started = Date.now();
  const remaining = context.deadline - Date.now();
  const timeoutMs = Math.max(1500, Math.min(context.config.fetchTimeoutMs, remaining - 300));

  const feed = await fetchFeed(source.feed_url, {
    timeoutMs,
    userAgent: context.config.userAgent
  });
  const items = mapFeedItems(feed, { maxItems: context.config.maxItemsPerSource });

  const stats = {
    found: items.length,
    saved: 0,
    duplicates: 0,
    rejected: 0,
    rejectedReasons: []
  };

  for (const rawItem of items) {
    if (Date.now() > context.deadline - 400) {
      stats.rejectedReasons.push("Zaman bütçesi doldu, bazı öğeler işlenmedi");
      break;
    }

    const built = buildArticleRecord(rawItem, source, { now: context.now });
    if (!built.ok) {
      stats.rejected += 1;
      stats.rejectedReasons.push(built.reason);
      continue;
    }

    const record = built.record;
    const duplicate = findDuplicate(record, context.candidates);

    if (duplicate) {
      const groupId = duplicate.match.duplicate_group_id || duplicate.match.id;
      const supportCount = await groupSupportCount(supabase, groupId);
      const score = scoreArticle({
        title: record.title,
        description: record.description || "",
        publishedAt: record.published_at,
        sourceReliability: source.reliability_score,
        supportCount: supportCount + 1,
        duplicateSimilarity: duplicate.comparison.similarity,
        now: context.now
      });

      const articleId = randomUUID();
      const duplicateRow = articleRow(record, {
        id: articleId,
        groupId,
        score,
        status: "duplicate",
        reviewReason: `Tekrar: ${duplicate.comparison.reason}`,
        supportSources: supportCount + 1
      });
      duplicateRow.score_breakdown = {
        ...duplicateRow.score_breakdown,
        duplicate_of: groupId,
        duplicate_reason: duplicate.comparison.reason
      };
      const { error } = await supabase.from("raw_articles").insert(duplicateRow);

      if (error) {
        if (error.code === "23505") {
          stats.duplicates += 1;
          continue;
        }
        throw new Error(`Tekrar kaydı yazılamadı: ${error.message}`);
      }

      await saveSourceLink(supabase, articleId, source, record.article_url);
      await refreshCanonicalScore(supabase, groupId, context.config.readyScoreThreshold);

      context.candidates.push({
        id: articleId,
        source_id: source.id,
        title: record.title,
        normalized_title: record.normalized_title,
        title_hash: record.title_hash,
        content_hash: record.content_hash,
        article_url: record.article_url,
        published_at: record.published_at,
        duplicate_group_id: groupId,
        category: record.category,
        status: "duplicate"
      });

      stats.duplicates += 1;
      continue;
    }

    const score = scoreArticle({
      title: record.title,
      description: record.description || "",
      publishedAt: record.published_at,
      sourceReliability: source.reliability_score,
      supportCount: 1,
      duplicateSimilarity: 0,
      now: context.now
    });
    const decision = decideStatus({
      categoryReviewRequired: record.category_review_required,
      categoryReviewReason: record.category_review_reason,
      score,
      threshold: context.config.readyScoreThreshold
    });

    const articleId = randomUUID();
    const { error } = await supabase.from("raw_articles").insert(
      articleRow(record, {
        id: articleId,
        groupId: articleId,
        score,
        status: decision.status,
        reviewReason: decision.reviewReason,
        supportSources: 1
      })
    );

    if (error) {
      if (error.code === "23505") {
        stats.duplicates += 1;
        continue;
      }
      throw new Error(`Haber kaydedilemedi: ${error.message}`);
    }

    await saveSourceLink(supabase, articleId, source, record.article_url);

    context.candidates.push({
      id: articleId,
      source_id: source.id,
      title: record.title,
      normalized_title: record.normalized_title,
      title_hash: record.title_hash,
      content_hash: record.content_hash,
      article_url: record.article_url,
      published_at: record.published_at,
      duplicate_group_id: articleId,
      category: record.category,
      status: decision.status
    });

    stats.saved += 1;
  }

  const executionTime = Date.now() - started;
  const status = stats.saved === 0 && stats.found > 0 ? "partial" : "success";

  await writeLog(supabase, {
    source_id: source.id,
    status,
    articles_found: stats.found,
    articles_saved: stats.saved,
    duplicates_found: stats.duplicates,
    articles_rejected: stats.rejected,
    error_message: stats.rejectedReasons.length
      ? [...new Set(stats.rejectedReasons)].slice(0, 4).join(" | ")
      : null,
    execution_time: executionTime
  });

  return {
    source: source.name,
    source_id: source.id,
    ...stats,
    execution_time: executionTime,
    feed_title: feed.title
  };
}

/**
 * Toplu tarama çalıştırır.
 * @param {{supabase: object, mode?: "manual"|"scheduled", sourceIds?: string[],
 *          budgetMs?: number, now?: number}} options
 */
export async function runCollection(options) {
  const supabase = options.supabase;
  const mode = options.mode === "scheduled" ? "scheduled" : "manual";
  const config = getRuntimeConfig();
  const startedAt = Date.now();
  const now = options.now || startedAt;
  const budgetMs = Math.min(options.budgetMs || config.collectionBudgetMs, MAX_BUDGET_MS);
  const deadline = startedAt + budgetMs;

  const settings = await getSettings(supabase);

  if (mode === "scheduled" && !settings.robot_active) {
    return {
      ok: true,
      skipped: true,
      reason: "Robot duraklatılmış (robot_active=false)",
      mode
    };
  }

  const lockAcquired = await acquireCollectionLock(supabase, budgetMs + 60_000);
  if (!lockAcquired) {
    return {
      ok: true,
      skipped: true,
      reason: "Başka bir tarama hâlâ çalışıyor (kilit etkin)",
      mode
    };
  }

  const summary = {
    ok: true,
    mode,
    started_at: nowIso(startedAt),
    finished_at: null,
    duration_ms: 0,
    budget_ms: budgetMs,
    sources_checked: 0,
    sources_failed: 0,
    sources_skipped: 0,
    articles_found: 0,
    articles_saved: 0,
    duplicates_found: 0,
    articles_rejected: 0,
    budget_exhausted: false,
    errors: [],
    details: []
  };

  try {
    await ensureSeedSources(supabase);

    const dueLimit = new Date(now - (settings.interval_minutes || 15) * 60 * 1000).toISOString();
    let query = supabase.from("sources").select("*").eq("is_active", true);

    if (mode === "scheduled") {
      query = query.or(`last_checked_at.is.null,last_checked_at.lt.${dueLimit}`);
    }
    if (Array.isArray(options.sourceIds) && options.sourceIds.length) {
      query = query.in("id", options.sourceIds);
    }

    const { data: sources, error } = await query
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(config.maxSourcesPerRun);

    if (error) {
      throw new Error(`Aktif kaynaklar okunamadı: ${error.message}`);
    }
    if (!sources || !sources.length) {
      summary.finished_at = nowIso(Date.now());
      summary.duration_ms = Date.now() - startedAt;
      await recordRun(supabase, summary);
      return summary;
    }

    const context = {
      config,
      now,
      deadline,
      candidates: await loadCandidates(supabase, now)
    };

    for (const source of sources) {
      if (Date.now() >= deadline - 1200) {
        summary.budget_exhausted = true;
        summary.sources_skipped += 1;
        break;
      }
      try {
        const result = await collectSource(supabase, source, context);
        summary.sources_checked += 1;
        summary.articles_found += result.found;
        summary.articles_saved += result.saved;
        summary.duplicates_found += result.duplicates;
        summary.articles_rejected += result.rejected;
        summary.details.push({
          source: result.source,
          saved: result.saved,
          duplicates: result.duplicates,
          rejected: result.rejected,
          execution_time: result.execution_time
        });
        await markSourceChecked(supabase, source, { success: true, now: Date.now() });
      } catch (error) {
        summary.sources_failed += 1;
        summary.errors.push({ source: source.name, message: error.message, code: error.code || null });
        summary.details.push({ source: source.name, error: error.message });
        await markSourceChecked(supabase, source, {
          success: false,
          errorMessage: error.message,
          now: Date.now()
        });
        await writeLog(supabase, {
          source_id: source.id,
          status: "error",
          articles_found: 0,
          articles_saved: 0,
          duplicates_found: 0,
          articles_rejected: 0,
          error_message: error.message,
          execution_time: null
        });
      }
    }

    summary.finished_at = nowIso(Date.now());
    summary.duration_ms = Date.now() - startedAt;
    await recordRun(supabase, summary);
    return summary;
  } catch (error) {
    summary.ok = false;
    summary.finished_at = nowIso(Date.now());
    summary.duration_ms = Date.now() - startedAt;
    summary.errors.push({ source: null, message: error.message });
    await recordRun(supabase, summary).catch(() => {});
    throw error;
  } finally {
    await releaseCollectionLock(supabase);
  }
}

