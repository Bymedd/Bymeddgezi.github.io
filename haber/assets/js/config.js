/* ==========================================================================
   config.js — Merkezi site ayarları
   --------------------------------------------------------------------------
   Site adı, açıklaması, iletişim bilgileri ve sayfalama gibi tüm genel
   ayarlar burada tutulur. Site adını değiştirmek için yalnızca "siteName"
   alanını güncellemeniz yeterlidir; tüm sayfalar bu değeri kullanır.
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  // Sayfalar "pages/" klasöründe mi, kök dizinde mi çalışıyor?
  // Site kökte (/) veya bir alt dizinde (/haber/) yayınlanabilir; tüm
  // bağlantılar görece olduğu için yalnızca "pages/" derinliği önemlidir.
  // Eski kök seviye haber adresi (/haber/:slug) yalnızca tek segmentlidir;
  // /haber/pages/... ve /haber/haber/... bu kurala girmez.
  var pathname = window.location.pathname.replace(/\/index\.html$/, "/");
  var isInPages = /\/pages\//.test(pathname);
  var isRewrittenArticle = /^\/haber\/[^/]+\/?$/.test(pathname);
  var basePath = isRewrittenArticle ? "/" : isInPages ? "../" : "";

  window.NP.config = {
    /* --- Kimlik ---------------------------------------------------------- */
    siteName: "HABER PORTALI",
    siteTagline: "Güncel · Bağımsız · Güvenilir",
    siteDescription:
      "HABER PORTALI; dünya, Türkiye ve teknoloji gündemini sade, hızlı ve okunabilir bir arayüzle sunan dijital haber platformudur.",
    siteUrl: "https://gezilecek.net/haber",
    defaultImage: "assets/images/world-summit.jpg",

    /* --- İletişim -------------------------------------------------------- */
    email: "iletisim@gezilecek.net",
    phone: "+90 000 000 00 00",
    address: "Yayın Merkezi, Örnek Mahallesi, Haber Caddesi No: 1, Ankara",

    /* --- Yayın kuralları ------------------------------------------------- */
    demoMode: true,
    demoNotice: "Demo yayın · Tüm içerikler örnek amaçlıdır",
    pageSize: 4,           // Kategori ve arama sayfalarında sayfa başına haber
    relatedCount: 3,       // Haber detayında gösterilecek ilgili haber sayısı
    mostReadCount: 5,      // "En çok okunanlar" listesi uzunluğu

    /* --- Yollar ---------------------------------------------------------- */
    basePath: basePath,

    /* --- Sosyal medya (alan hazır, hesaplar lansmanda eklenecek) ---------- */
    social: [
      { name: "X", url: "#", icon: "x" },
      { name: "Facebook", url: "#", icon: "facebook" },
      { name: "Instagram", url: "#", icon: "instagram" },
      { name: "YouTube", url: "#", icon: "youtube" },
      { name: "LinkedIn", url: "#", icon: "linkedin" }
    ],

    /* --- Navigasyon ------------------------------------------------------ */
    nav: [
      { label: "Ana Sayfa", href: "index.html", key: "home" },
      { label: "Dünya", href: "pages/world.html", key: "world", category: "world" },
      { label: "Türkiye", href: "pages/turkey.html", key: "turkey", category: "turkey" },
      { label: "Teknoloji", href: "pages/technology.html", key: "technology", category: "technology" },
      { label: "Hakkımızda", href: "pages/about.html", key: "about" },
      { label: "İletişim", href: "pages/contact.html", key: "contact" }
    ]
  };
})();
