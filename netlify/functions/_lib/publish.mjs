/* ==========================================================================
   publish.mjs — Onaylanan haberlerin portalda yayınlanması
   --------------------------------------------------------------------------
   Robot hiçbir haberi kendi başına yayınlamaz. Yayın yalnızca:
     - panelden "Onayla ve yayınla" işlemiyle, veya
     - panelde otomatik yayın açıksa (system_settings.auto_publish) ve haber
       `ready_for_ai` eşiğini geçmişse
   gerçekleşir.

   Yayınlanan kayıt `published_articles` tablosuna yazılır. Görsel, kaynağın
   kendi adresinden (image_url) linklenir; hiçbir dosya indirilmez veya
   yüklenmez.
   ========================================================================== */

import { HttpError } from "./http.mjs";

const TURKISH_MAP = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
  â: "a",
  Â: "a",
  î: "i",
  Î: "i",
  û: "u",
  Û: "u",
  "&": " ve "
};

const MAX_TITLE = 300;
const MAX_SUMMARY = 900;
const MAX_IMAGE_URL = 2000;

function clean(value, max = 2000) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

export function slugify(value) {
  const ascii = String(value || "")
    .split("")
    .map((char) => (TURKISH_MAP[char] !== undefined ? TURKISH_MAP[char] : char))
    .join("")
    .toLowerCase();

  return (
    ascii
      .replace(/['’"`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "haber"
  );
}

function schemaMissing(error) {
  return error && (error.code === "42P01" || error.code === "42703" || error.code === "23514");
}

function schemaError() {
  return new HttpError(
    503,
    "schema_missing",
    "Yayın tabloları bulunamadı. supabase/migrations/20261120120000_phase3_publish.sql dosyasını Supabase SQL Editor'de çalıştırın."
  );
}

/**
 * Ham haberi portaldaki yayın kaydına dönüştürür.
 * `overrides` panelde düzenlenen başlık/özet/kategori/görsel alanlarını taşır.
 */
export function buildPublishedRow(article, overrides = {}) {
  const sourceName = clean(article.sources?.name || article.source_name || "Kaynak", 160);
  const title = clean(overrides.title, MAX_TITLE) || clean(article.title, MAX_TITLE);
  const summary =
    clean(overrides.summary, MAX_SUMMARY) || clean(article.description, MAX_SUMMARY);

  if (!title) {
    throw new HttpError(400, "title_required", "Yayınlamak için başlık gerekli.");
  }

  const category = clean(overrides.category, 32) || clean(article.category, 32);
  if (!["world", "turkey", "technology"].includes(category)) {
    throw new HttpError(400, "invalid_category", "Kategori world, turkey veya technology olmalıdır.");
  }

  const requestedImage = clean(overrides.image_url, MAX_IMAGE_URL) || clean(article.image_url, MAX_IMAGE_URL);
  const imageUrl = isHttpUrl(requestedImage) ? requestedImage : null;

  const content = [];
  if (summary) {
    content.push({ type: "p", text: summary });
  }
  content.push({ type: "h2", text: "Kaynak" });
  content.push({
    type: "p",
    text: `Bu haber ${sourceName} tarafından yayımlanan içerikten derlenmiştir. Ayrıntılar için kaynak bağlantısını kullanın.`
  });

  return {
    raw_article_id: article.id,
    slug: "",
    title,
    summary: summary || null,
    content,
    category,
    image_url: imageUrl,
    source_name: sourceName,
    source_url: clean(article.article_url, MAX_IMAGE_URL) || null,
    is_breaking: Boolean(overrides.is_breaking),
    tags: [],
    published_at: new Date().toISOString()
  };
}

async function uniqueSlug(supabase, base, rawArticleId) {
  const { data, error } = await supabase
    .from("published_articles")
    .select("id, slug, raw_article_id")
    .like("slug", `${base}%`);

  if (error) {
    if (schemaMissing(error)) {
      throw schemaError();
    }
    throw new Error(`Yayın adresi okunamadı: ${error.message}`);
  }

  const taken = new Set(
    (data || [])
      .filter((row) => row.raw_article_id !== rawArticleId)
      .map((row) => row.slug)
  );

  if (!taken.has(base)) {
    return base;
  }
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

/**
 * Haberi yayınlar. Kayıt daha önce yayınlanmışsa günceller (düzenleme).
 * @returns {Promise<object>} published_articles satırı
 */
export async function publishArticle(supabase, article, overrides = {}) {
  if (!article || !article.id) {
    throw new HttpError(400, "article_required", "Yayınlanacak haber belirtilmedi.");
  }

  const row = buildPublishedRow(article, overrides);

  const { data: existing, error: existingError } = await supabase
    .from("published_articles")
    .select("id, slug")
    .eq("raw_article_id", article.id)
    .maybeSingle();

  if (existingError) {
    if (schemaMissing(existingError)) {
      throw schemaError();
    }
    throw new Error(`Yayın kaydı okunamadı: ${existingError.message}`);
  }

  let published;
  if (existing) {
    const { data, error } = await supabase
      .from("published_articles")
      .update({ ...row, slug: existing.slug })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) {
      throw new Error(`Yayın kaydı güncellenemedi: ${error.message}`);
    }
    published = data;
  } else {
    row.slug = await uniqueSlug(supabase, slugify(row.title), article.id);
    const { data, error } = await supabase
      .from("published_articles")
      .insert(row)
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        row.slug = `${row.slug}-${String(article.id).slice(0, 6)}`;
        const retry = await supabase.from("published_articles").insert(row).select("*").single();
        if (retry.error) {
          throw new Error(`Haber yayınlanamadı: ${retry.error.message}`);
        }
        published = retry.data;
      } else {
        if (schemaMissing(error)) {
          throw schemaError();
        }
        throw new Error(`Haber yayınlanamadı: ${error.message}`);
      }
    } else {
      published = data;
    }
  }

  const { error: updateError } = await supabase
    .from("raw_articles")
    .update({
      status: "published",
      review_reason: null,
      portal_published_at: published.published_at,
      portal_slug: published.slug
    })
    .eq("id", article.id);

  if (updateError) {
    if (schemaMissing(updateError)) {
      throw schemaError();
    }
    throw new Error(`Haber durumu güncellenemedi: ${updateError.message}`);
  }

  return published;
}

/** Yayından kaldırır; ham kayıt yeniden onay havuzuna döner. */
export async function unpublishArticle(supabase, rawArticleId) {
  const { error } = await supabase
    .from("published_articles")
    .delete()
    .eq("raw_article_id", rawArticleId);

  if (error) {
    if (schemaMissing(error)) {
      throw schemaError();
    }
    throw new Error(`Yayın kaydı silinemedi: ${error.message}`);
  }

  const { error: updateError } = await supabase
    .from("raw_articles")
    .update({
      status: "ready_for_ai",
      portal_published_at: null,
      portal_slug: null
    })
    .eq("id", rawArticleId);

  if (updateError) {
    throw new Error(`Haber durumu güncellenemedi: ${updateError.message}`);
  }
  return { ok: true };
}

/** Haberi reddeder; reddedilen kayıtlar havuza dönmez. */
export async function rejectArticle(supabase, rawArticleId, reason) {
  const { error } = await supabase
    .from("raw_articles")
    .update({
      status: "rejected",
      review_reason: clean(reason, 400) || "Panelden reddedildi"
    })
    .eq("id", rawArticleId);

  if (error) {
    throw new Error(`Haber reddedilemedi: ${error.message}`);
  }

  await supabase.from("published_articles").delete().eq("raw_article_id", rawArticleId);
  return { ok: true };
}

/**
 * Otomatik yayın: yalnızca puan eşiğini geçmiş (`ready_for_ai`) kayıtları
 * yayınlar. Hatalar tek tek yutulur, tarama sonucu bozulmaz.
 */
export async function autoPublishReady(supabase, { limit = 6 } = {}) {
  const { data, error } = await supabase
    .from("raw_articles")
    .select("id, title, description, article_url, image_url, category, published_at, importance_score, sources(name)")
    .eq("status", "ready_for_ai")
    .order("importance_score", { ascending: false })
    .limit(limit);

  if (error) {
    if (schemaMissing(error)) {
      console.error("Otomatik yayın atlandı: şema eksik.");
      return { published: 0, failed: 0 };
    }
    console.error("Otomatik yayın adayları okunamadı:", error.message);
    return { published: 0, failed: 0 };
  }

  let published = 0;
  let failed = 0;
  for (const article of data || []) {
    try {
      await publishArticle(supabase, article, {});
      published += 1;
    } catch (publishError) {
      failed += 1;
      console.error(`Otomatik yayın başarısız (${article.id}):`, publishError.message);
    }
  }
  return { published, failed };
}
