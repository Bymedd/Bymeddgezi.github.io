/* ==========================================================================
   main.js — Ana sayfa
   --------------------------------------------------------------------------
   Manşet, son dakika şeridi, kategori bölümleri ve en çok okunanlar
   NP.store üzerinden beslenir. Veri kaynağı değişse de bu dosya değişmez.
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  var ui, store, config, utils;
  var tickerTimer = null;

  function renderHero(articles) {
    var main = document.getElementById("hero-main");
    var side = document.getElementById("hero-side");
    if (!main || !side || !articles.length) {
      return;
    }
    main.innerHTML = ui.heroLead(articles[0]);
    side.innerHTML = articles
      .slice(1, 4)
      .map(function (article) {
        return ui.miniCard(article);
      })
      .join("");
  }

  function renderBreaking(articles) {
    var list = document.getElementById("breaking-list");
    if (!list) {
      return;
    }

    if (!articles.length) {
      list.innerHTML = '<li class="breaking__empty">Şu anda öne çıkan gelişme bulunmuyor.</li>';
      return;
    }

    list.innerHTML = articles
      .map(function (article) {
        return (
          '<li class="breaking__item"><a href="' +
          utils.articleUrl(article.slug) +
          '"><span class="breaking__cat">' +
          utils.escapeHtml(utils.categoryLabel(article.category)) +
          "</span><span>" +
          utils.escapeHtml(article.title) +
          "</span></a></li>"
        );
      })
      .join("");

    var items = list.querySelectorAll(".breaking__item");
    if (items.length <= 1) {
      return;
    }

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      items.forEach(function (item, index) {
        item.hidden = index !== 0;
      });
      return;
    }

    var current = 0;
    var show = function (index) {
      items.forEach(function (item, i) {
        item.classList.toggle("is-visible", i === index);
      });
    };

    items.forEach(function (item) {
      item.classList.add("breaking__item--stacked");
    });
    show(0);

    window.clearInterval(tickerTimer);
    tickerTimer = window.setInterval(function () {
      current = (current + 1) % items.length;
      show(current);
    }, 6000);

    var strip = document.querySelector(".breaking");
    if (strip) {
      strip.addEventListener("mouseenter", function () {
        window.clearInterval(tickerTimer);
      });
      strip.addEventListener("mouseleave", function () {
        window.clearInterval(tickerTimer);
        tickerTimer = window.setInterval(function () {
          current = (current + 1) % items.length;
          show(current);
        }, 6000);
      });
    }
  }

  function renderMostRead(articles) {
    var list = document.getElementById("most-read-list");
    if (!list) {
      return;
    }
    if (!articles.length) {
      list.innerHTML = '<li class="mostread__empty">Okunma verisi henüz oluşmadı.</li>';
      return;
    }
    list.innerHTML = articles
      .map(function (article, index) {
        return ui.mostReadItem(article, index);
      })
      .join("");
  }

  function boot() {
    ui = NP.ui;
    store = NP.store;
    config = NP.config;
    utils = NP.utils;

    Promise.all([
      store.getLatest(4),
      store.getBreaking(),
      store.getMostRead(config.mostReadCount),
      store.getByCategory("world"),
      store.getByCategory("turkey"),
      store.getByCategory("technology")
    ])
      .then(function (results) {
        renderHero(results[0]);
        renderBreaking(results[1]);
        renderMostRead(results[2]);

        ["world", "turkey", "technology"].forEach(function (key, index) {
          var grid = document.querySelector('[data-category-grid="' + key + '"]');
          var countNode = document.querySelector('[data-category-count="' + key + '"]');
          var articles = results[index + 3];
          if (countNode) {
            countNode.textContent = articles.length + " haber";
          }
          if (grid) {
            grid.innerHTML = articles
              .slice(0, 4)
              .map(function (article) {
                return ui.card(article);
              })
              .join("");
          }
        });

        document.body.classList.add("is-ready");
      })
      .catch(function (error) {
        console.error("Ana sayfa yüklenemedi:", error);
        ["hero-main", "hero-side"].forEach(function (id) {
          var node = document.getElementById(id);
          if (node) {
            node.innerHTML = ui.errorState();
          }
        });
      });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
