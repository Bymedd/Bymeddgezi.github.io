/* ==========================================================================
   pipeline.mjs — Ham öğe → haber kaydı
   --------------------------------------------------------------------------
   Adımlar: doğrulama → normalizasyon → sınıflandırma → kayıt üretimi.
   Tekrar tespiti ve puanlama ayrı modüllerde yapılır; bu katman saf
   fonksiyonlardan oluşur ve veritabanına bağımlı değildir (test edilebilir).
   ========================================================================== */

import { categorizeArticle } from "./categorize.mjs";
import {
  canonicalizeUrl,
  cleanText,
  isHttpUrl,
  normalizeTitle,
  sha256,
  toIsoDate
} from "./text.mjs";

const MIN_TITLE_LENGTH = 12;
const MAX_TITLE_LENGTH = 400;
const MAX_DESCRIPTION_LENGTH = 900;
const FUTURE_TOLERANCE_HOURS = 48;

/**
 * RSS öğesini standart haber kaydına dönüştürür.
 * @param {{title: string, link: string, description?: string, publishedAt?: string,
 *          imageUrl?: string, guid?: string}} rawItem
 * @param {{id: string, name: string, category: string, reliability_score: number, language?: string}} source
 */
export function buildArticleRecord(rawItem, source, options = {}) {
  const now = options.now || Date.now();
  const title = cleanText(rawItem.title, MAX_TITLE_LENGTH);
  const description = cleanText(rawItem.description, MAX_DESCRIPTION_LENGTH);
  const articleUrl = canonicalizeUrl(rawItem.link);
  const normalizedTitle = normalizeTitle(title);

  if (!title) {
    return { ok: false, reason: "Başlık eksik", title: "" };
  }
  if (title.length < MIN_TITLE_LENGTH) {
    return { ok: false, reason: "Başlık çok kısa", title };
  }
  if (!normalizedTitle) {
    return { ok: false, reason: "Başlık normalize edilemedi", title };
  }
  if (!articleUrl || !isHttpUrl(articleUrl)) {
    return { ok: false, reason: "Geçerli haber bağlantısı yok", title };
  }

  let publishedAt = toIsoDate(rawItem.publishedAt);
  let publishedEstimated = false;
  if (!publishedAt) {
    publishedAt = new Date(now).toISOString();
    publishedEstimated = true;
  }
  const publishedTime = new Date(publishedAt).getTime();
  if (Number.isNaN(publishedTime)) {
    publishedAt = new Date(now).toISOString();
    publishedEstimated = true;
  } else if (publishedTime > now + FUTURE_TOLERANCE_HOURS * 60 * 60 * 1000) {
    return { ok: false, reason: "Yayın tarihi gelecekte", title };
  }

  const categoryResult = categorizeArticle({
    title,
    description,
    sourceCategory: source.category,
    sourceLanguage: source.language
  });

  const imageUrl =
    rawItem.imageUrl && isHttpUrl(rawItem.imageUrl) ? canonicalizeUrl(rawItem.imageUrl) : null;

  const dateKey = publishedAt.slice(0, 10);

  const record = {
    source_id: source.id || null,
    title,
    description: description || null,
    article_url: articleUrl,
    image_url: imageUrl,
    published_at: publishedAt,
    category: categoryResult.category,
    category_confidence: categoryResult.confidence,
    category_review_required: categoryResult.reviewRequired,
    category_review_reason: categoryResult.reviewReason,
    category_scores: categoryResult.scores,
    matched_keywords: categoryResult.matchedKeywords,
    normalized_title: normalizedTitle,
    title_hash: sha256(normalizedTitle),
    content_hash: sha256(`${normalizedTitle}|${dateKey}`),
    published_estimated: publishedEstimated
  };

  return { ok: true, record, source };
}

/**
 * Puana ve kategori güvenine göre havuz durumunu belirler.
 * Hiçbir haber bu aşamada yayınlanmaz; en iyi durum `ready_for_ai`dir.
 */
export function decideStatus({ categoryReviewRequired, categoryReviewReason, score, threshold = 55 }) {
  if (categoryReviewRequired) {
    return {
      status: "pending_review",
      reviewReason: categoryReviewReason || "Kategori güveni düşük"
    };
  }
  if (score.total >= threshold) {
    return { status: "ready_for_ai", reviewReason: null };
  }
  return { status: "categorized", reviewReason: null };
}

export function buildSourceLink(articleId, source, url) {
  return {
    article_id: articleId,
    source_id: source.id || null,
    source_url: url
  };
}
