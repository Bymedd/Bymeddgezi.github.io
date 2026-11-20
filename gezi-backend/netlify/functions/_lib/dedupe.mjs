/* ==========================================================================
   dedupe.mjs — Tekrar haber tespiti
   --------------------------------------------------------------------------
   Yöntemler birlikte kullanılır:
   1. Kanonik URL eşitliği
   2. İçerik/başlık hash eşitliği
   3. Normalize başlık benzerliği + yayın tarihi yakınlığı
   4. Ortak anahtar kelime + başlık benzerliği + tarih yakınlığı
   Aynı olayın gelişmeleri tamamen silinmez; yeni kayıt ayrı tutulup aynı
   gruba bağlanır.
   ========================================================================== */

import { jaccardSimilarity, sharedTokenCount, titleTokens } from "./text.mjs";

export const DEDUPE_DEFAULTS = {
  strongTitleSimilarity: 0.7,
  strongWindowHours: 48,
  weakTitleSimilarity: 0.5,
  weakWindowHours: 36,
  weakSharedTokens: 4
};

function hoursBetween(a, b) {
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }
  const timeA = new Date(a).getTime();
  const timeB = new Date(b).getTime();
  if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.abs(timeA - timeB) / (1000 * 60 * 60);
}

/**
 * Aday kaydı mevcut kayıtlarla karşılaştırır.
 * @returns {{duplicate: boolean, match?: object, reason?: string, titleSimilarity: number,
 *            sharedTokens: number, hours: number, similarity: number}}
 */
export function compareRecords(candidate, existing, options = {}) {
  const thresholds = { ...DEDUPE_DEFAULTS, ...options };
  const candidateTokens = titleTokens(candidate.title || candidate.normalized_title || "");
  const existingTokens = titleTokens(existing.title || existing.normalized_title || "");
  const titleSimilarity = jaccardSimilarity(candidateTokens, existingTokens);
  const shared = sharedTokenCount(candidateTokens, existingTokens);
  const hours = hoursBetween(candidate.published_at || candidate.publishedAt, existing.published_at);

  const result = {
    duplicate: false,
    titleSimilarity: Math.round(titleSimilarity * 1000) / 1000,
    sharedTokens: shared,
    hours: Number.isFinite(hours) ? Math.round(hours * 10) / 10 : null,
    similarity: Math.round(titleSimilarity * 1000) / 1000
  };

  if (!candidate.title || !existing.title) {
    return result;
  }

  if (candidate.article_url && existing.article_url && candidate.article_url === existing.article_url) {
    return { ...result, duplicate: true, match: existing, reason: "url", similarity: 1 };
  }

  if (candidate.content_hash && existing.content_hash && candidate.content_hash === existing.content_hash) {
    return { ...result, duplicate: true, match: existing, reason: "content_hash", similarity: 1 };
  }

  if (candidate.title_hash && existing.title_hash && candidate.title_hash === existing.title_hash) {
    return { ...result, duplicate: true, match: existing, reason: "title_hash", similarity: 1 };
  }

  if (titleSimilarity >= thresholds.strongTitleSimilarity && hours <= thresholds.strongWindowHours) {
    return {
      ...result,
      duplicate: true,
      match: existing,
      reason: "title_similarity",
      similarity: titleSimilarity
    };
  }

  if (
    titleSimilarity >= thresholds.weakTitleSimilarity &&
    shared >= thresholds.weakSharedTokens &&
    hours <= thresholds.weakWindowHours
  ) {
    return {
      ...result,
      duplicate: true,
      match: existing,
      reason: "keyword_overlap",
      similarity: titleSimilarity
    };
  }

  return result;
}

/**
 * Aday için en iyi (en benzer) tekrar eşleşmesini döndürür.
 */
export function findDuplicate(candidate, candidates, options = {}) {
  let best = null;
  for (const existing of candidates) {
    const comparison = compareRecords(candidate, existing, options);
    if (!comparison.duplicate) {
      continue;
    }
    if (!best || comparison.similarity > best.comparison.similarity) {
      best = { match: existing, comparison };
    }
  }
  return best;
}

/** Bir grubun kaç farklı kaynaktan beslendiğini hesaplar. */
export function distinctSourceCount(records) {
  return new Set(records.map((record) => record.source_id).filter(Boolean)).size;
}
