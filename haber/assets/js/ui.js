/* ==========================================================================
   ui.js — Yeniden kullanılabilir arayüz parçaları
   --------------------------------------------------------------------------
   Tüm kart/liste HTML'leri burada üretilir. Böylece ana sayfa, kategori,
   arama ve detay sayfaları aynı görünümü paylaşır; tasarım değişikliği tek
   yerden yapılır.
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  var u = NP.utils;
  var esc = u.escapeHtml;

  function demoBadge() {
    if (!NP.config.demoMode) {
      return "";
    }
    return '<span class="tag-demo" title="Örnek içerik">DEMO</span>';
  }

  function timeTag(article, format) {
    var iso = esc(article.publishedAt);
    var text = format === "date" ? u.formatDate(article.publishedAt) : u.formatDateTime(article.publishedAt);
    return '<time datetime="' + iso + '">' + esc(text) + "</time>";
  }

  function categoryLink(article, className) {
    return (
      '<a class="' + className + '" href="' + u.categoryPage(article.category) + '">' +
      esc(u.categoryLabel(article.category)) +
      "</a>"
    );
  }

  function card(article, options) {
    var opts = options || {};
    var href = u.articleUrl(article.slug);
    var img = u.imageUrl(article.image);

    return [
      '<article class="card' + (opts.className ? " " + opts.className : "") + '">',
      '  <a class="card__media" href="' + href + '" aria-hidden="true" tabindex="-1">',
      '    <img src="' + esc(img) + '" alt="' + esc(article.imageAlt || article.title) + '"',
      '         loading="lazy" decoding="async" width="800" height="500">',
      "  </a>",
      '  <div class="card__body">',
      '    <div class="card__top">' + categoryLink(article, "card__cat") + demoBadge() + "</div>",
      '    <h3 class="card__title"><a href="' + href + '">' + esc(article.title) + "</a></h3>",
      '    <p class="card__summary">' + esc(u.truncate(article.summary, 130)) + "</p>",
      '    <div class="card__meta">' + timeTag(article) +
        '<span class="meta__dot" aria-hidden="true">•</span><span>' +
        esc(article.author || "Haber Merkezi") + "</span></div>",
      "  </div>",
      "</article>"
    ].join("\n");
  }

  function heroLead(article) {
    var href = u.articleUrl(article.slug);
    return [
      '<article class="hero-lead">',
      '  <a class="hero-lead__link" href="' + href + '">',
      '    <img class="hero-lead__img" src="' + esc(u.imageUrl(article.image)) + '"',
      '         alt="' + esc(article.imageAlt || article.title) + '"',
      '         width="1200" height="750" fetchpriority="high" decoding="async">',
      '    <span class="hero-lead__shade" aria-hidden="true"></span>',
      '    <div class="hero-lead__body">',
      '      <div class="hero-lead__tags">' + categoryLink(article, "chip chip--red") + demoBadge() + "</div>",
      '      <h2 class="hero-lead__title">' + esc(article.title) + "</h2>",
      '      <p class="hero-lead__summary">' + esc(u.truncate(article.summary, 165)) + "</p>",
      '      <div class="hero-lead__meta">' + timeTag(article) + "</div>",
      "    </div>",
      "  </a>",
      "</article>"
    ].join("\n");
  }

  function miniCard(article) {
    var href = u.articleUrl(article.slug);
    return [
      '<article class="mini">',
      '  <a class="mini__thumb" href="' + href + '" aria-hidden="true" tabindex="-1">',
      '    <img src="' + esc(u.imageUrl(article.image)) + '" alt="' + esc(article.imageAlt || article.title) + '"',
      '         loading="lazy" decoding="async" width="240" height="160">',
      "  </a>",
      '  <div class="mini__body">',
      "    <div>" + categoryLink(article, "mini__cat") + demoBadge() + "</div>",
      '    <h3 class="mini__title"><a href="' + href + '">' + esc(article.title) + "</a></h3>",
      '    <div class="mini__meta">' + timeTag(article) + "</div>",
      "  </div>",
      "</article>"
    ].join("\n");
  }

  function mostReadItem(article, index) {
    var href = u.articleUrl(article.slug);
    return [
      '<li class="mostread__item">',
      '  <span class="mostread__num" aria-hidden="true">' + (index + 1) + "</span>",
      '  <div class="mostread__body">',
      "    <div>" + categoryLink(article, "mostread__cat") + "</div>",
      '    <h3 class="mostread__title"><a href="' + href + '">' + esc(article.title) + "</a></h3>",
      "  </div>",
      "</li>"
    ].join("\n");
  }

  function emptyState(title, text, extra) {
    return [
      '<div class="empty-state">',
      '  <h2>' + esc(title) + "</h2>",
      '  <p>' + esc(text) + "</p>",
      extra || "",
      "</div>"
    ].join("\n");
  }

  function errorState(message) {
    return (
      '<div class="empty-state empty-state--error" role="alert">' +
      "<h2>İçerik yüklenemedi</h2>" +
      "<p>" + esc(message || "Haberler görüntülenirken bir sorun oluştu. Lütfen sayfayı yenileyin.") + "</p>" +
      "</div>"
    );
  }

  function pagination(currentPage, totalPages, buildUrl) {
    if (totalPages <= 1) {
      return "";
    }

    var parts = ['<nav class="pagination" aria-label="Sayfalar">'];

    parts.push(
      currentPage > 1
        ? '<a class="pagination__link" rel="prev" href="' + esc(buildUrl(currentPage - 1)) + '">← Önceki</a>'
        : '<span class="pagination__link is-disabled" aria-hidden="true">← Önceki</span>'
    );

    for (var i = 1; i <= totalPages; i += 1) {
      if (i === currentPage) {
        parts.push('<span class="pagination__num is-active" aria-current="page">' + i + "</span>");
      } else {
        parts.push(
          '<a class="pagination__num" href="' + esc(buildUrl(i)) + '" aria-label="Sayfa ' + i + '">' + i + "</a>"
        );
      }
    }

    parts.push(
      currentPage < totalPages
        ? '<a class="pagination__link" rel="next" href="' + esc(buildUrl(currentPage + 1)) + '">Sonraki →</a>'
        : '<span class="pagination__link is-disabled" aria-hidden="true">Sonraki →</span>'
    );

    parts.push("</nav>");
    return parts.join("");
  }

  NP.ui = {
    pagination: pagination,
    card: card,
    heroLead: heroLead,
    miniCard: miniCard,
    mostReadItem: mostReadItem,
    emptyState: emptyState,
    errorState: errorState,
    demoBadge: demoBadge,
    timeTag: timeTag,
    categoryLink: categoryLink
  };
})();
