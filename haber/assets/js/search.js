/* ==========================================================================
   search.js — Haber arama
   --------------------------------------------------------------------------
   Arama; haber başlığı, açıklaması, etiketleri ve kategori adı üzerinden
   yapılır. Sonuçlar haber kartları olarak listelenir ve sayfalanır.
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  var debounceTimer = null;
  var allMatches = [];
  var currentPage = 1;

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function writeUrl(term, page) {
    if (!window.history || !window.history.replaceState) {
      return;
    }
    var params = new URLSearchParams();
    if (term) {
      params.set("q", term);
    }
    if (page > 1) {
      params.set("sayfa", page);
    }
    var query = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (query ? "?" + query : ""));
  }

  function pageUrl(term, page) {
    var params = new URLSearchParams();
    if (term) {
      params.set("q", term);
    }
    if (page > 1) {
      params.set("sayfa", String(page));
    }
    var query = params.toString();
    return window.location.pathname + (query ? "?" + query : "");
  }

  function render(term, page) {
    var grid = document.getElementById("search-grid");
    var status = document.getElementById("search-status");
    var pagination = document.getElementById("search-pagination");
    if (!grid) {
      return;
    }

    var pageSize = NP.config.pageSize;
    var totalPages = Math.max(1, Math.ceil(allMatches.length / pageSize));
    var safePage = Math.min(Math.max(1, page), totalPages);
    currentPage = safePage;

    if (!term) {
      if (status) {
        status.textContent = "Aramak istediğiniz kelimeyi yazın.";
      }
      pagination.innerHTML = "";
      grid.innerHTML = NP.ui.emptyState(
        "Haber aramaya hazır",
        "Başlık veya haber metni içinde geçen bir kelime yazarak arama yapabilirsiniz. Örneğin: iklim, ulaşım, yapay zekâ.",
        '<div class="suggestions">' +
          ["iklim", "ulaşım", "yapay zekâ", "siber güvenlik", "eğitim"]
            .map(function (word) {
              return '<a class="chip chip--outline" href="?q=' + encodeURIComponent(word) + '">' + word + "</a>";
            })
            .join("") +
          "</div>"
      );
      return;
    }

    if (!allMatches.length) {
      if (status) {
        status.textContent = '“' + term + '” için sonuç bulunamadı.';
      }
      pagination.innerHTML = "";
      grid.innerHTML = NP.ui.emptyState(
        "Sonuç bulunamadı",
        "Farklı bir kelime deneyebilir veya kategoriler üzerinden haberlere göz atabilirsiniz.",
        '<div class="suggestions">' +
          '<a class="chip chip--outline" href="' + NP.config.basePath + 'pages/world.html">Dünya</a>' +
          '<a class="chip chip--outline" href="' + NP.config.basePath + 'pages/turkey.html">Türkiye</a>' +
          '<a class="chip chip--outline" href="' + NP.config.basePath + 'pages/technology.html">Teknoloji</a>' +
          "</div>"
      );
      return;
    }

    if (status) {
      status.textContent =
        "“" + term + "” için " + allMatches.length + " sonuç bulundu · Sayfa " + safePage + " / " + totalPages;
    }

    grid.innerHTML = allMatches
      .slice((safePage - 1) * pageSize, safePage * pageSize)
      .map(function (article) {
        return NP.ui.card(article);
      })
      .join("");

    pagination.innerHTML = NP.ui.pagination(safePage, totalPages, function (pageNumber) {
      return pageUrl(term, pageNumber);
    });
  }

  function runSearch(term, page) {
    NP.store
      .search(term)
      .then(function (results) {
        allMatches = results;
        render(term, page);
      })
      .catch(function (error) {
        console.error("Arama başarısız:", error);
        var grid = document.getElementById("search-grid");
        if (grid) {
          grid.innerHTML = NP.ui.errorState("Arama sırasında bir sorun oluştu.");
        }
      });
  }

  function boot() {
    var input = document.getElementById("search-input");
    var form = document.getElementById("search-page-form");
    var initialTerm = getParam("q").trim();
    var initialPage = parseInt(getParam("sayfa"), 10) || 1;

    if (input) {
      input.value = initialTerm;
      input.addEventListener("input", function () {
        window.clearTimeout(debounceTimer);
        var value = input.value.trim();
        debounceTimer = window.setTimeout(function () {
          currentPage = 1;
          writeUrl(value, 1);
          runSearch(value, 1);
        }, 280);
      });
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var value = input ? input.value.trim() : "";
        currentPage = 1;
        writeUrl(value, 1);
        runSearch(value, 1);
      });
    }

    runSearch(initialTerm, initialPage);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
