/* ==========================================================================
   feed.mjs — RSS/Atom akışı indirme ve ayrıştırma
   --------------------------------------------------------------------------
   - rss-parser ile RSS 2.0, Atom ve RDF desteklenir.
   - Zaman aşımı, boyut sınırı ve bot kimliği uygulanır.
   - Kullanım koşullarına saygı: yalnızca akışta sunulan başlık, açıklama,
     tarih, görsel ve bağlantı alınır; tam metin kopyalanmaz.
   ========================================================================== */

import Parser from "rss-parser";
import { pickFirstString, toIsoDate } from "./text.mjs";

const MAX_FEED_BYTES = 5 * 1024 * 1024;

export class FeedError extends Error {
  constructor(message, code = "feed_error", status = null) {
    super(message);
    this.name = "FeedError";
    this.code = code;
    this.status = status;
  }
}

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      "content:encoded",
      "dc:date"
    ]
  }
});

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
  /\.local$/i,
  /^metadata\.google\.internal$/i
];

/** SSRF riskini azaltmak için yalnızca genel http(s) adreslerine izin verir. */
export function validateFeedUrl(value) {
  let url;
  try {
    url = new URL(String(value || "").trim());
  } catch {
    throw new FeedError("Geçersiz RSS adresi.", "invalid_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FeedError("RSS adresi http veya https olmalıdır.", "invalid_protocol");
  }
  if (!url.hostname.includes(".") || BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    throw new FeedError("Bu adres güvenlik nedeniyle reddedildi.", "blocked_host");
  }
  return url.toString();
}

function looksLikeHtml(text) {
  return /^\s*<!doctype html|^\s*<html[\s>]/i.test(text.slice(0, 400));
}

/**
 * Akışı indirip ayrıştırır.
 * @param {string} feedUrl
 * @param {{timeoutMs?: number, userAgent?: string, fetchImpl?: typeof fetch}} options
 */
export async function fetchFeed(feedUrl, options = {}) {
  const url = validateFeedUrl(feedUrl);
  const timeoutMs = options.timeoutMs ?? 8000;
  const fetchImpl = options.fetchImpl || fetch;
  const userAgent =
    options.userAgent ||
    "HaberPortaliBot/2.0 (+https://haber-portali-demo.netlify.app; iletisim@haber-portali-demo.com)";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  let response;
  let body;
  try {
    response = await fetchImpl(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": userAgent,
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "accept-language": "tr,en;q=0.8"
      }
    });
    if (!response.ok) {
      throw new FeedError(`Kaynak HTTP ${response.status} döndürdü.`, "http_error", response.status);
    }
    body = await response.text();
  } catch (error) {
    if (error instanceof FeedError) {
      throw error;
    }
    if (error.name === "AbortError") {
      throw new FeedError("RSS isteği zaman aşımına uğradı.", "timeout");
    }
    throw new FeedError(`RSS indirilemedi: ${error.message}`, "network_error");
  } finally {
    clearTimeout(timer);
  }

  if (body.length > MAX_FEED_BYTES) {
    throw new FeedError("RSS yanıtı boyut sınırını aşıyor.", "too_large");
  }
  if (looksLikeHtml(body)) {
    throw new FeedError("Adres RSS/Atom değil HTML sayfası döndürdü.", "not_a_feed");
  }

  let parsed;
  try {
    parsed = await parser.parseString(body);
  } catch (error) {
    throw new FeedError(`RSS ayrıştırılamadı: ${error.message}`, "parse_error");
  }

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  if (!items.length) {
    throw new FeedError("Akışta hiç haber öğesi bulunamadı.", "empty_feed");
  }

  return {
    title: parsed.title || "",
    link: parsed.link || "",
    items,
    bytes: body.length,
    durationMs: Date.now() - started,
    fetchedAt: new Date().toISOString()
  };
}

function imageFromItem(item) {
  const mediaContent = Array.isArray(item.mediaContent) ? item.mediaContent : [];
  const mediaThumbnail = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail : [];

  const candidates = [
    ...mediaContent.map((entry) => entry?.$?.url || entry?.url),
    ...mediaThumbnail.map((entry) => entry?.$?.url || entry?.url),
    item.enclosure?.url,
    item.enclosure?.link,
    pickFirstString(item["media:content"], item["media:thumbnail"])
  ];

  const match = candidates.find((value) => typeof value === "string" && /^https?:\/\//i.test(value));
  return match || null;
}

/**
 * rss-parser öğelerini ham haber kayıtlarına dönüştürür.
 * Bu aşamada doğrulama/normalizasyon pipeline'da yapılır.
 */
export function mapFeedItems(feed, options = {}) {
  const maxItems = options.maxItems ?? 25;
  return feed.items.slice(0, maxItems).map((item) => ({
    title: pickFirstString(item.title),
    link: pickFirstString(item.link, item.guid, item.id),
    description: pickFirstString(
      item.contentSnippet,
      item.summary,
      item.description,
      item.content,
      item["content:encoded"]
    ),
    publishedAt: toIsoDate(
      item.isoDate || item.pubDate || item.date || item["dc:date"] || item.published
    ),
    imageUrl: imageFromItem(item),
    guid: pickFirstString(item.guid, item.id)
  }));
}
