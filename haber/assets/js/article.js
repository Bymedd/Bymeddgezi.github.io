/* ==========================================================================
   article.js — Haber detay sayfası
   --------------------------------------------------------------------------
   Haber, ?slug=... parametresine göre NP.store'dan yüklenir. Başlık, spot,
   içerik, kaynaklar, paylaşım bağlantıları ve ilgili haberler burada
   oluşturulur. Kaynak alanı birden fazla kaynağı destekler.
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  var u = NP.utils;
  var esc = u.escapeHtml;

  function getSlug() {
    return new URLSearchParams(window.location.search).get("slug") || "";
  }

  function renderBlocks(blocks) {
    return (blocks || [])
      .map(function (block) {
        if (block.type === "h2") {
          return "<h2>" + esc(block.text) + "</h2>";
        }
        if (block.type === "h3") {
          return "<h3>" + esc(block.text) + "</h3>";
        }
        if (block.type === "quote") {
          return "<blockquote><p>" + esc(block.text) + "</p></blockquote>";
        }
        if (block.type === "list" && block.items) {
          return (
            "<ul>" +
            block.items
              .map(function (item) {
                return "<li>" + esc(item) + "</li>";
              })
              .join("") +
            "</ul>"
          );
        }
        return "<p>" + esc(block.text || "") + "</p>";
      })
      .join("\n");
  }

  function renderSources(article) {
    var sources = article.sources && article.sources.length
      ? article.sources
      : [{ name: article.sourceName, url: article.sourceUrl, note: "Birincil kaynak" }];

    return [
      '<section class="article__sources" aria-labelledby="sources-title">',
      '  <h2 id="sources-title">Kaynak ve doğrulama</h2>',
      '  <p class="article__sources-lead">Bu haberin derlendiği kaynaklar aşağıda listelenmiştir. Haber birden fazla kaynaktan doğrulandığında tüm kaynaklar bu alanda gösterilir.</p>',
      '  <ol class="source-list">',
      sources
        .map(function (source) {
          return [
            '    <li class="source-list__item">',
            '      <div class="source-list__body">',
            '        <span class="source-list__name">' + esc(source.name || "Kaynak") + "</span>",
            source.note ? '        <span class="source-list__note">' + esc(source.note) + "</span>" : "",
            "      </div>",
            source.url
              ? '      <a class="source-list__link" href="' + esc(source.url) + '" target="_blank" rel="noopener nofollow">Kaynağı görüntüle ↗</a>'
              : "",
            "    </li>"
          ].join("\n");
        })
        .join("\n"),
      "  </ol>",
      NP.config.demoMode
        ? '  <p class="demo-note demo-note--inline"><strong>DEMO:</strong> Bu haber örnek amaçlı üretilmiştir; gerçek bir olayı veya gerçek bir haber kaynağını temsil etmez. Kaynak bağlantıları örnek adreslere yönlendirir.</p>'
        : "",
      "</section>"
    ].join("\n");
  }

  function renderShare(article) {
    var url = window.location.href;
    var text = article.title;
    var links = [
      {
        label: "X",
        href: "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url)
      },
      {
        label: "Facebook",
        href: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url)
      },
      {
        label: "WhatsApp",
        href: "https://wa.me/?text=" + encodeURIComponent(text + " " + url)
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url)
      }
    ];

    return [
      '<div class="share">',
      '  <span class="share__label">Paylaş</span>',
      links
        .map(function (link) {
          return (
            '  <a class="share__link" href="' +
            link.href +
            '" target="_blank" rel="noopener">' +
            esc(link.label) +
            "</a>"
          );
        })
        .join("\n"),
      '  <button class="share__link share__copy" type="button" data-copy-link>Bağlantıyı kopyala</button>',
      "</div>"
    ].join("\n");
  }

  function renderArticle(article) {
    var root = document.getElementById("article-root");
    var href = u.articleUrl(article.slug);

    root.innerHTML = [
      '<nav class="breadcrumb" aria-label="Sayfa konumu">',
      '  <ol class="breadcrumb__list">',
      '    <li><a href="' + NP.config.basePath + 'index.html">Ana Sayfa</a></li>',
      '    <li><a href="' + u.categoryPage(article.category) + '">' + esc(u.categoryLabel(article.category)) + "</a></li>",
      '    <li aria-current="page">' + esc(u.truncate(article.title, 60)) + "</li>",
      "  </ol>",
      "</nav>",

      '<header class="article__head">',
      '  <div class="article__kicker">' +
        NP.ui.categoryLink(article, "chip chip--red") +
        NP.ui.demoBadge() +
        "</div>",
      "  <h1 class=\"article__title\">" + esc(article.title) + "</h1>",
      '  <p class="article__spot">' + esc(article.summary) + "</p>",
      '  <div class="article__meta">',
      "    <span>Yayın: " + NP.ui.timeTag(article) + "</span>",
      '    <span class="meta__dot" aria-hidden="true">•</span>',
      "    <span>" + esc(article.author || "Haber Merkezi") + "</span>",
      '    <span class="meta__dot" aria-hidden="true">•</span>',
      "    <span>" + u.readingTime(article.content) + " dk okuma</span>",
      "  </div>",
      "</header>",

      '<figure class="article__figure">',
      '  <img src="' + esc(u.imageUrl(article.image)) + '" alt="' + esc(article.imageAlt || article.title) + '"',
      '       width="1200" height="675" decoding="async">',
      '  <figcaption>' + esc(article.imageAlt || article.title) + "</figcaption>",
      "</figure>",

      '<div class="article__body">' + renderBlocks(article.content) + "</div>",

      (article.tags || []).length
        ? '<div class="article__tags">' +
          '<span class="article__tags-label">Etiketler:</span>' +
          article.tags
            .map(function (tag) {
              return (
                '<a class="chip chip--outline" href="' +
                NP.config.basePath +
                "pages/search.html?q=" +
                encodeURIComponent(tag) +
                '">' +
                esc(tag) +
                "</a>"
              );
            })
            .join("") +
          "</div>"
        : "",

      renderSources(article),
      renderShare(article),
      '  <a class="back-link" href="' + esc(window.location.href) + '">Bu haberin kalıcı bağlantısı: ' + esc(window.location.href) + "</a>"
    ].join("\n");

    // Paylaşım bağlantısı kopyalama
    var copyButton = root.querySelector("[data-copy-link]");
    if (copyButton) {
      copyButton.addEventListener("click", function () {
        var url = window.location.href;
        var done = function () {
          NP.site.toast("Bağlantı panoya kopyalandı.");
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done).catch(function () {
            NP.site.toast("Bağlantı kopyalanamadı. Adres çubuğundan kopyalayabilirsiniz.");
          });
        } else {
          window.prompt("Haber bağlantısı:", url);
        }
      });
    }
  }

  function updateMeta(article) {
    var title = article.title + " | " + NP.config.siteName;
    document.title = title;

    var setMeta = function (selector, value) {
      var node = document.querySelector(selector);
      if (node) {
        node.setAttribute("content", value);
      }
    };

    setMeta('meta[name="description"]', u.truncate(article.summary, 160));
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', u.truncate(article.summary, 160));
    setMeta('meta[property="og:type"]', "article");
    setMeta('meta[property="og:image"]', new URL(u.imageUrl(article.image), window.location.href).href);
    setMeta('meta[property="og:url"]', window.location.href);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', u.truncate(article.summary, 160));

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", window.location.href);
    }

    var structured = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      description: article.summary,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      articleSection: u.categoryLabel(article.category),
      inLanguage: "tr-TR",
      image: [new URL(u.imageUrl(article.image), window.location.href).href],
      author: { "@type": "Organization", name: article.author || NP.config.siteName },
      publisher: {
        "@type": "Organization",
        name: NP.config.siteName,
        logo: { "@type": "ImageObject", url: new URL("assets/images/logo.svg", window.location.href).href }
      },
      mainEntityOfPage: window.location.href,
      isAccessibleForFree: true,
      citation: (article.sources || []).map(function (source) {
        return source.url;
      })
    };

    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structured);
    document.head.appendChild(script);
  }

  function renderNotFound() {
    var root = document.getElementById("article-root");
    if (!root) {
      return;
    }
    document.title = "Haber bulunamadı | " + NP.config.siteName;
    var relatedSection = document.querySelector(".related");
    if (relatedSection) {
      relatedSection.hidden = true;
    }
    root.innerHTML = NP.ui.emptyState(
      "Haber bulunamadı",
      "Aradığınız haber yayından kaldırılmış veya adres yanlış yazılmış olabilir.",
      '<a class="btn btn--primary" href="' + NP.config.basePath + 'index.html">Ana sayfaya dön</a>'
    );
  }

  function renderAside(mostRead) {
    var list = document.getElementById("aside-most-read");
    if (!list) {
      return;
    }
    list.innerHTML = mostRead
      .map(function (article, index) {
        return NP.ui.mostReadItem(article, index);
      })
      .join("");
  }

  function renderRelated(article) {
    var grid = document.getElementById("related-grid");
    if (!grid) {
      return;
    }
    NP.store.getRelated(article, NP.config.relatedCount).then(function (related) {
      if (!related.length) {
        grid.parentElement.hidden = true;
        return;
      }
      grid.innerHTML = related
        .map(function (item) {
          return NP.ui.card(item);
        })
        .join("");
    });
  }

  function boot() {
    var slug = getSlug();

    Promise.all([NP.store.getBySlug(slug), NP.store.getMostRead(NP.config.mostReadCount)])
      .then(function (results) {
        var article = results[0];
        var mostRead = results[1];
        renderAside(mostRead);

        if (!article) {
          renderNotFound();
          return;
        }

        renderArticle(article);
        updateMeta(article);
        renderRelated(article);
        document.body.classList.add("is-ready");
      })
      .catch(function (error) {
        console.error("Haber yüklenemedi:", error);
        var root = document.getElementById("article-root");
        if (root) {
          root.innerHTML = NP.ui.errorState();
        }
      });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
