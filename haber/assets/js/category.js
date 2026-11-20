/* ==========================================================================
   category.js — Dünya / Türkiye / Teknoloji arşiv sayfaları
   --------------------------------------------------------------------------
   Sayfa hangi kategoriye aitse <body data-category="..."> üzerinden okunur.
   Haberler tarihe göre yeniden eskiye sıralanır ve sayfalanır.
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  function getPageParam() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("sayfa") || params.get("page") || "1";
    var page = parseInt(raw, 10);
    return isNaN(page) || page < 1 ? 1 : page;
  }

  function pageUrl(page) {
    return window.location.pathname + (page > 1 ? "?sayfa=" + page : "");
  }

  function boot() {
    var key = document.body.getAttribute("data-category");
    var category = NP.categories[key];
    var grid = document.getElementById("category-grid");
    var paginationBox = document.getElementById("category-pagination");
    var countNode = document.querySelector("[data-result-count]");

    if (!category || !grid) {
      return;
    }

    var pageSize = NP.config.pageSize;
    var currentPage = getPageParam();

    NP.store
      .getByCategory(key)
      .then(function (articles) {
        articles = NP.utils.sortByDateDesc(articles);
        var totalPages = Math.max(1, Math.ceil(articles.length / pageSize));
        var safePage = Math.min(currentPage, totalPages);
        var slice = articles.slice((safePage - 1) * pageSize, safePage * pageSize);

        if (countNode) {
          countNode.textContent =
            articles.length + " haber · " + (articles.length ? "En güncelden eskiye" : "Henüz yayınlanmış haber yok");
        }

        if (!articles.length) {
          grid.innerHTML = NP.ui.emptyState(
            "Bu kategoride henüz haber yok",
            "Yeni haberler yayımlandığında bu sayfada listelenecek.",
            '<a class="btn btn--primary" href="' + NP.config.basePath + 'index.html">Ana sayfaya dön</a>'
          );
          return;
        }

        grid.innerHTML = slice
          .map(function (article) {
            return NP.ui.card(article);
          })
          .join("");

        if (paginationBox) {
          paginationBox.innerHTML = NP.ui.pagination(safePage, totalPages, pageUrl);
        }

        var info = document.querySelector("[data-page-info]");
        if (info) {
          info.textContent = "Sayfa " + safePage + " / " + totalPages;
        }
      })
      .catch(function (error) {
        console.error("Kategori yüklenemedi:", error);
        grid.innerHTML = NP.ui.errorState();
      });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
