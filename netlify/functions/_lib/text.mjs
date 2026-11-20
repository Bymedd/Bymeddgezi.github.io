/* ==========================================================================
   text.mjs — Metin ve URL normalizasyonu
   --------------------------------------------------------------------------
   Tekrar tespiti ve sınıflandırma aynı normalizasyonu kullanmalıdır.
   ========================================================================== */

import { createHash } from "node:crypto";

const ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”"
};

export function decodeEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isFinite(parsed) && parsed > 0 && parsed < 0x10ffff ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isFinite(parsed) && parsed > 0 && parsed < 0x10ffff ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&([a-z]+);/gi, (match, name) => ENTITY_MAP[name.toLowerCase()] ?? match);
}

export function stripHtml(value) {
  return decodeEntities(
    String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

export function cleanText(value, maxLength = 2000) {
  const text = stripHtml(value).replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

export function truncate(value, maxLength) {
  const text = String(value || "");
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

/** Türkçe karakterleri ASCII'ye indirger; arama/karşılaştırma için. */
export function foldTurkish(value) {
  return String(value || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .replace(/Â|â/g, "a")
    .replace(/Î|î/g, "i")
    .replace(/Û|û/g, "u")
    .toLocaleLowerCase("tr-TR");
}

/** Başlığı karşılaştırma için normalize eder. */
export function normalizeTitle(value) {
  return foldTurkish(cleanText(value, 400))
    .replace(/[’'`´]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set(
  (
    "aciklandi aciklama adet after again against also among and are article as at " +
    "about be been before being between both but by can could did does doing down " +
    "during each even every for from further had has have having here how into is " +
    "its itself just more most new news now of off on once only or other our out " +
    "over own same she should since some such than that the their them then there " +
    "these they this those through to too under until up very was we were what when " +
    "where which while who why will with would you your " +
    "bir bu da de ve ile icin gibi daha cok son yeni olan olarak oldu oldugunu " +
    "dedi diye ama ancak kadar once sonra uzerine tum tumu her hic nasil neden " +
    "ne mi mu mus gore arasinda ayrica ise olarak var yok " +
    "haber haberleri son dakika gelisme gelismesi"
  ).split(/\s+/)
);

export function titleTokens(value) {
  return normalizeTitle(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function keywords(value, limit = 12) {
  const counts = new Map();
  for (const token of titleTokens(value)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

export function jaccardSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) {
    return 0;
  }
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) {
      intersection += 1;
    }
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function sharedTokenCount(tokensA, tokensB) {
  const setB = new Set(tokensB);
  let shared = 0;
  new Set(tokensA).forEach((token) => {
    if (setB.has(token)) {
      shared += 1;
    }
  });
  return shared;
}

export function sha256(value) {
  return createHash("sha256").update(String(value), "utf8").digest("hex");
}

const TRACKING_PARAMS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^dclid$/i,
  /^mc_cid$/i,
  /^mc_eid$/i,
  /^igshid$/i,
  /^ref$/i,
  /^ref_src$/i,
  /^source=rss$/i
];

/** Takip parametrelerini atar; tekrar tespitinde URL'leri eşitler. */
export function canonicalizeUrl(value) {
  let url;
  try {
    url = new URL(String(value || "").trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  url.hash = "";
  const kept = [...url.searchParams.entries()].filter(([key, val]) => {
    const combined = `${key}=${val}`;
    return !TRACKING_PARAMS.some((pattern) => pattern.test(key) || pattern.test(combined));
  });
  url.search = "";
  kept
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, val]) => url.searchParams.append(key, val));
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

export function isHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function domainOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (value && typeof value === "object") {
      if (typeof value.url === "string" && value.url.trim()) {
        return value.url.trim();
      }
    }
  }
  return "";
}

export function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}
