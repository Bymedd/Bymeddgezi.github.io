/* ==========================================================================
   process-feed — POST /api/admin/process-feed
   --------------------------------------------------------------------------
   Bir RSS adresini gerçek istekle doğrular, öğeleri normalize eder ve
   sınıflandırma önizlemesi döndürür. Veritabanına YAZMAZ.
   Panelde kaynak doğrulama ve test için kullanılır.
   ========================================================================== */

import { requireAdmin } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, HttpError, json, readJson, requireMethod } from "./_lib/http.mjs";
import { fetchFeed, FeedError, mapFeedItems } from "./_lib/feed.mjs";
import { buildArticleRecord } from "./_lib/pipeline.mjs";
import { ALLOWED_CATEGORIES } from "./_lib/sources-catalog.mjs";

export const config = { path: "/api/admin/process-feed" };

export default async function handler(req) {
  try {
    requireMethod(req, "POST");
    assertSameOrigin(req);
    requireAdmin(req);

    const body = await readJson(req, 20_000);
    const feedUrl = body.feed_url || body.feedUrl;
    if (!feedUrl) {
      throw new HttpError(400, "feed_url_required", "feed_url alanı zorunludur.");
    }
    const category = ALLOWED_CATEGORIES.includes(body.category) ? body.category : "world";

    let feed;
    try {
      feed = await fetchFeed(feedUrl, { timeoutMs: 10_000 });
    } catch (error) {
      if (error instanceof FeedError) {
        throw new HttpError(422, error.code, `RSS doğrulanamadı: ${error.message}`);
      }
      throw error;
    }

    const source = {
      id: null,
      name: body.name || feed.title || "RSS önizleme",
      category,
      reliability_score: 70,
      language: body.language || "en"
    };
    const items = mapFeedItems(feed, { maxItems: 8 }).map((item) => {
      const built = buildArticleRecord(item, source);
      if (!built.ok) {
        return {
          valid: false,
          reason: built.reason,
          title: item.title,
          link: item.link,
          published_at: item.publishedAt
        };
      }
      const record = built.record;
      return {
        valid: true,
        title: record.title,
        link: record.article_url,
        image_url: record.image_url,
        published_at: record.published_at,
        category: record.category,
        category_confidence: record.category_confidence,
        review_required: record.category_review_required,
        review_reason: record.category_review_reason,
        matched_keywords: record.matched_keywords
      };
    });

    return json({
      ok: true,
      feed: {
        title: feed.title,
        link: feed.link,
        item_count: feed.items.length,
        previewed: items.length,
        bytes: feed.bytes,
        duration_ms: feed.durationMs
      },
      items
    });
  } catch (error) {
    return handleError(error, "process-feed");
  }
}
