/* ==========================================================================
   categorize.mjs — Haber sınıflandırma
   --------------------------------------------------------------------------
   Kaynak kategorisi + başlık/açıklama anahtar kelimeleri + coğrafi sinyaller
   birlikte değerlendirilir. Yalnızca kaynak kategorisine dayanan tahminler
   "düşük güven" sayılır ve incelemeye gönderilir.
   ========================================================================== */

import { foldTurkish, normalizeTitle } from "./text.mjs";

export const CATEGORIES = ["world", "turkey", "technology"];

/* Anahtar kelimeler ASCII'ye indirgenmiş biçimde tutulur. */
const KEYWORDS = {
  turkey: {
    strong: [
      "turkiye", "tbmm", "cumhurbaskani", "ankara", "istanbul", "izmir", "bursa",
      "antalya", "konya", "adana", "gaziantep", "kayseri", "trabzon", "diyarbakir",
      "marmara", "bogaz", "anadolu", "turk lirasi", "lira", "enflasyon", "deprem",
      "afad", "meb", "yok", "mit", "emniyet", "valilik", "kaymakam", "belediye",
      "bakanlik", "meclis", "secim", "muhalefet", "iktidar", "chp", "ak parti",
      "teror", "pkk", "sinir kenti", "karadeniz", "ege denizi", "akdeniz"
    ],
    weak: [
      "turkiye", "turk", "turkce", "yerli", "ulusal", "kamu", "bakan", "millet",
      "sehir", "universite", "ogrenci", "hastane", "tarim", "sanayi", "ihracat",
      "ithalat", "ekonomi", "borsa", "faiz", "bankacilik", "turizm", "ulasim",
      "metro", "otoyol", "kopru", "hava yolu", "tren", "egitim", "ogretmen"
    ]
  },
  world: {
    strong: [
      "birlesmis milletler", "nato", "avrupa birligi", "abd", "washington",
      "beyaz saray", "moskova", "kremlin", "pekin", "londra", "paris", "berlin",
      "brüksel", "bruksel", "ukrayna", "rusya", "cin", "israil", "filistin",
      "gazze", "iran", "suriye", "irak", "misir", "hindistan", "japonya",
      "almanya", "fransa", "ingiltere", "italya", "ispanya", "kanada",
      "avustralya", "brezilya", "meksika", "guney afrika", "afrika", "latin amerika",
      "kuresel", "uluslararasi", "zirve", "iklim zirvesi", "g20", "g7", "bm guvenlik"
    ],
    weak: [
      "dunya", "kuresel", "ulkeler", "devlet baskani", "disisleri", "buyukelci",
      "goc", "multeci", "savas", "ateskes", "baris gorusmeleri", "yaptirim",
      "secim", "darbe", "ekonomi", "ticaret", "petrol", "dogal gaz", "iklim",
      "afet", "yardim", "kriz", "anlasma", "antlasma", "politika"
    ]
  },
  technology: {
    strong: [
      "yapay zeka", "yapay zekâ", "artificial intelligence", "machine learning",
      "yazilim", "siber guvenlik", "veri merkezi", "cip", "mikrocip", "algoritma",
      "blockchain", "kripto para", "bitcoin", "metaverse", "sanal gerceklik",
      "robotik", "otomasyon", "uydu", "uzay ajansi", "nasa", "spacex", "openai",
      "chatgpt", "gemini", "iphone", "android", "samsung", "apple", "google",
      "microsoft", "meta", "amazon", "tesla", "nvidia", "intel", "amd",
      "akilli telefon", "bulut bilişim", "bulut bilisim", "kuantum bilgisayar"
    ],
    weak: [
      "teknoloji", "dijital", "internet", "uygulama", "platform", "sosyal medya",
      "yazilim", "donanim", "bilgisayar", "telefon", "gadget", "inovasyon",
      "startup", "girisim", "veri", "kod", "yapay", "zeka", "online", "cevrimici",
      "akilli", "elektrikli arac", "batarya", "enerji verimliligi", "arastirma"
    ]
  }
};

function keywordHits(normalizedText, list) {
  let hits = 0;
  const matched = [];
  const padded = ` ${normalizedText} `;
  for (const keyword of list) {
    const folded = foldTurkish(keyword);
    if (!folded) {
      continue;
    }
    if (padded.includes(` ${folded} `)) {
      hits += 1;
      matched.push(keyword);
    }
  }
  return { hits, matched };
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Bir haberi sınıflandırır.
 * @param {{title: string, description?: string, sourceCategory?: string|null, sourceLanguage?: string}} input
 */
export function categorizeArticle(input) {
  const title = normalizeTitle(input.title || "");
  const description = normalizeTitle(input.description || "");
  const sourceCategory = CATEGORIES.includes(input.sourceCategory) ? input.sourceCategory : null;

  const detail = {};
  for (const category of CATEGORIES) {
    const titleHits = keywordHits(title, KEYWORDS[category].strong);
    const strongTitle = titleHits.hits;
    const weakTitle = keywordHits(title, KEYWORDS[category].weak).hits;
    const strongBody = keywordHits(description, KEYWORDS[category].strong).hits;
    const weakBody = keywordHits(description, KEYWORDS[category].weak).hits;

    const contentScore =
      strongTitle * 3 + weakTitle * 1.5 + strongBody * 1.25 + weakBody * 1;
    const sourceBoost = sourceCategory === category ? 2 : 0;

    detail[category] = {
      contentScore: round(contentScore),
      sourceBoost,
      total: round(contentScore + sourceBoost),
      matchedKeywords: [
        ...new Set([...titleHits.matched, ...keywordHits(description, KEYWORDS[category].strong).matched])
      ].slice(0, 8)
    };
  }

  const ranked = CATEGORIES.map((category) => ({
    category,
    total: detail[category].total,
    contentScore: detail[category].contentScore
  })).sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));

  const best = ranked[0];
  const second = ranked[1];
  const margin = Math.max(0, best.total - second.total);
  const confidence = round(
    0.55 * Math.min(1, margin / 5) + 0.45 * Math.min(1, best.contentScore / 6)
  );

  const category = best.total > 0 ? best.category : sourceCategory;
  const reviewRequired =
    !category || confidence < 0.5 || best.contentScore === 0 || margin < 0.75;

  let reviewReason = null;
  if (!category) {
    reviewReason = "Kategori sinyali bulunamadı";
  } else if (best.contentScore === 0) {
    reviewReason = "Yalnızca kaynak kategorisine dayanan tahmin";
  } else if (confidence < 0.5) {
    reviewReason = "Düşük kategori güveni";
  } else if (margin < 0.75) {
    reviewReason = "Kategoriler arasında belirgin fark yok";
  }

  return {
    category,
    confidence,
    reviewRequired,
    reviewReason,
    margin: round(margin),
    scores: Object.fromEntries(
      CATEGORIES.map((categoryKey) => [
        categoryKey,
        {
          total: detail[categoryKey].total,
          content: detail[categoryKey].contentScore,
          sourceBoost: detail[categoryKey].sourceBoost
        }
      ])
    ),
    matchedKeywords: detail[best.category]?.matchedKeywords || []
  };
}

/** Panelde ve testlerde kullanılan kısa yardımcı. */
export function dominantCategory(input) {
  return categorizeArticle(input).category;
}
