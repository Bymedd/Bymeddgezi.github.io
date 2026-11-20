/* ==========================================================================
   sources-catalog.mjs — Varsayılan haber kaynakları
   --------------------------------------------------------------------------
   Kaynak listesi tek bir yerden yönetilir. Yeni kaynak eklemek için paneli
   kullanabilir veya bu dosyaya kayıt ekleyebilirsiniz.

   KURALLAR:
   - `is_active: true` yalnızca RSS adresi gerçek bir istekle doğrulanmış
     kaynaklar için kullanılır.
   - Doğrulanamayan adresler `is_active: false` olarak tutulur; panelden
     "Doğrula" işlemi başarılı olursa etkinleştirilebilir.
   - Tam haber metni kopyalanmaz; yalnızca başlık, açıklama, tarih, görsel ve
     orijinal bağlantı alınır. Kaynak bağlantısı her kayıtta korunur.
   ========================================================================== */

/**
 * Bu ortamda (yerel ağ) erişilebilirliği test edilmiş kaynaklar.
 * Doğrulama tarihi: 19 Kasım 2026.
 */
export const VERIFIED_SOURCES = [
  {
    name: "UN News",
    feed_url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
    category: "world",
    country: "international",
    language: "en",
    reliability_score: 90,
    is_active: true,
    is_verified: true,
    verification_note: "19.11.2026 tarihinde RSS yanıtı ve 30 öğe doğrulandı."
  },
  {
    name: "The Verge",
    feed_url: "https://www.theverge.com/rss/index.xml",
    category: "technology",
    country: "us",
    language: "en",
    reliability_score: 82,
    is_active: true,
    is_verified: true,
    verification_note: "19.11.2026 tarihinde RSS yanıtı doğrulandı."
  },
  {
    name: "TechCrunch",
    feed_url: "https://techcrunch.com/feed/",
    category: "technology",
    country: "us",
    language: "en",
    reliability_score: 80,
    is_active: true,
    is_verified: true,
    verification_note: "19.11.2026 tarihinde RSS yanıtı doğrulandı."
  },
  {
    name: "Ars Technica",
    feed_url: "https://feeds.arstechnica.com/arstechnica/index",
    category: "technology",
    country: "us",
    language: "en",
    reliability_score: 84,
    is_active: true,
    is_verified: true,
    verification_note: "19.11.2026 tarihinde RSS yanıtı doğrulandı."
  },
  {
    name: "MIT Technology Review",
    feed_url: "https://www.technologyreview.com/feed/",
    category: "technology",
    country: "us",
    language: "en",
    reliability_score: 88,
    is_active: true,
    is_verified: true,
    verification_note: "19.11.2026 tarihinde RSS yanıtı doğrulandı."
  },
  {
    name: "Webtekno",
    feed_url: "https://www.webtekno.com/rss.xml",
    category: "technology",
    country: "tr",
    language: "tr",
    reliability_score: 70,
    is_active: true,
    is_verified: true,
    verification_note: "19.11.2026 tarihinde RSS yanıtı doğrulandı."
  },
  {
    name: "Donanımhaber",
    feed_url: "https://www.donanimhaber.com/rss/tum/",
    category: "technology",
    country: "tr",
    language: "tr",
    reliability_score: 66,
    is_active: true,
    is_verified: true,
    verification_note: "19.11.2026 tarihinde RSS yanıtı doğrulandı."
  },
  {
    name: "ShiftDelete.Net",
    feed_url: "https://shiftdelete.net/feed",
    category: "technology",
    country: "tr",
    language: "tr",
    reliability_score: 68,
    is_active: true,
    is_verified: true,
    verification_note: "19.11.2026 tarihinde RSS yanıtı doğrulandı."
  }
];

/**
 * Kullanıcı talebinde geçen ancak bu geliştirme ortamının ağ filtresi
 * nedeniyle doğrulanamayan adresler. Yayın ortamında panelden "Doğrula"
 * işlemi ile test edilip etkinleştirilmelidir.
 */
export const UNVERIFIED_SOURCES = [
  {
    name: "BBC News — World",
    feed_url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "world",
    country: "uk",
    language: "en",
    reliability_score: 90,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "The Guardian — World",
    feed_url: "https://www.theguardian.com/world/rss",
    category: "world",
    country: "uk",
    language: "en",
    reliability_score: 88,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "Al Jazeera",
    feed_url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "world",
    country: "qa",
    language: "en",
    reliability_score: 82,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "DW — World",
    feed_url: "https://rss.dw.com/rdf/rss-en-world",
    category: "world",
    country: "de",
    language: "en",
    reliability_score: 86,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "Anadolu Ajansı — Güncel",
    feed_url: "https://www.aa.com.tr/tr/rss/default?cat=guncel",
    category: "turkey",
    country: "tr",
    language: "tr",
    reliability_score: 85,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "TRT Haber — Son Dakika",
    feed_url: "https://www.trthaber.com/sondakika_articles.rss",
    category: "turkey",
    country: "tr",
    language: "tr",
    reliability_score: 82,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "BBC Türkçe",
    feed_url: "https://feeds.bbci.co.uk/turkce/rss.xml",
    category: "turkey",
    country: "uk",
    language: "tr",
    reliability_score: 88,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "DW Türkçe",
    feed_url: "https://rss.dw.com/xml/rss-tur-all",
    category: "turkey",
    country: "de",
    language: "tr",
    reliability_score: 86,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "Euronews Türkçe",
    feed_url: "https://tr.euronews.com/rss",
    category: "turkey",
    country: "fr",
    language: "tr",
    reliability_score: 80,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  },
  {
    name: "Wired",
    feed_url: "https://www.wired.com/feed/rss",
    category: "technology",
    country: "us",
    language: "en",
    reliability_score: 84,
    is_active: false,
    is_verified: false,
    verification_note: "Geliştirme ağında 403 web filtresi nedeniyle doğrulanamadı. Panelden test edin."
  }
];

export const SOURCE_CATALOG = [...VERIFIED_SOURCES, ...UNVERIFIED_SOURCES];

export const ALLOWED_CATEGORIES = ["world", "turkey", "technology"];

export function catalogRow(source) {
  return {
    name: source.name,
    feed_url: source.feed_url,
    category: source.category,
    country: source.country || null,
    language: source.language || "en",
    reliability_score: source.reliability_score ?? 70,
    is_active: Boolean(source.is_active),
    is_verified: Boolean(source.is_verified),
    verification_note: source.verification_note || null
  };
}
