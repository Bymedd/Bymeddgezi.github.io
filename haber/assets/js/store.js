/* ==========================================================================
   store.js — Veri erişim katmanı
   --------------------------------------------------------------------------
   Sayfalar haber verisine doğrudan erişmez; her zaman bu katman üzerinden
   erişir. Bugün veri kaynağı "demo" sağlayıcısıdır (data.js).
   İleride Supabase'e geçmek için yalnızca yeni bir sağlayıcı yazıp
   NP.store.setProvider(...) ile tanıtmak yeterlidir. Sayfa kodlarının
   değişmesi gerekmez.

   Sağlayıcı sözleşmesi (tümü Promise döner):
     list()                  -> tüm yayınlanmış haberler
     bySlug(slug)            -> tek haber veya null

   Örnek gelecek kullanımı:
     NP.store.setProvider({
       list: function () { return supabase.from("news").select("*"); },
       bySlug: function (slug) { ... }
     });
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  var utils = NP.utils;
  var provider = null;
  var cache = null;

  function clone(article) {
    return Object.assign({}, article, {
      tags: (article.tags || []).slice(),
      sources: (article.sources || []).slice(),
      content: (article.content || []).slice()
    });
  }

  function demoProvider() {
    return {
      name: "demo",
      list: function () {
        var items = (NP.news || []).filter(function (article) {
          return article.status === "published";
        });
        return Promise.resolve(items.map(clone));
      },
      bySlug: function (slug) {
        var found = (NP.news || []).filter(function (article) {
          return article.slug === slug && article.status === "published";
        })[0];
        return Promise.resolve(found ? clone(found) : null);
      }
    };
  }

  function ensureProvider() {
    if (!provider) {
      provider = demoProvider();
    }
    return provider;
  }

  function all() {
    if (cache) {
      return Promise.resolve(cache);
    }
    return ensureProvider()
      .list()
      .then(function (items) {
        cache = utils.sortByDateDesc(items || []);
        return cache;
      });
  }

  var store = {
    /* Sağlayıcıyı değiştirir (ileride Supabase). Önbelleği temizler. */
    setProvider: function (nextProvider) {
      provider = nextProvider;
      cache = null;
    },

    /* Veri kaynağını hazırlar; gelecekte ağ bağlantısı burada kurulacak. */
    init: function () {
      ensureProvider();
      return all();
    },

    getAll: function () {
      return all();
    },

    getByCategory: function (categoryKey) {
      return all().then(function (items) {
        return items.filter(function (article) {
          return article.category === categoryKey;
        });
      });
    },

    getBySlug: function (slug) {
      if (!slug) {
        return Promise.resolve(null);
      }
      return ensureProvider()
        .bySlug(slug)
        .then(function (article) {
          if (!article || article.status !== "published") {
            return null;
          }
          return clone(article);
        });
    },

    getLatest: function (limit) {
      return all().then(function (items) {
        return limit ? items.slice(0, limit) : items.slice();
      });
    },

    getMostRead: function (limit) {
      return all().then(function (items) {
        return items
          .slice()
          .sort(function (a, b) {
            return (b.views || 0) - (a.views || 0);
          })
          .slice(0, limit || NP.config.mostReadCount);
      });
    },

    getBreaking: function () {
      return all().then(function (items) {
        return items.filter(function (article) {
          return article.isBreaking;
        });
      });
    },

    search: function (term) {
      var query = utils.normalize(term);
      if (!query) {
        return Promise.resolve([]);
      }
      return all().then(function (items) {
        return items.filter(function (article) {
          var haystack = [
            article.title,
            article.summary,
            article.category,
            utils.categoryLabel(article.category),
            (article.tags || []).join(" "),
            (article.content || [])
              .map(function (block) {
                return block.text || "";
              })
              .join(" ")
          ].join(" ");
          return utils.normalize(haystack).indexOf(query) !== -1;
        });
      });
    },

    getRelated: function (article, limit) {
      var count = limit || NP.config.relatedCount;
      return all().then(function (items) {
        var tags = article.tags || [];
        return items
          .filter(function (item) {
            return item.id !== article.id;
          })
          .map(function (item) {
            var score = 0;
            if (item.category === article.category) {
              score += 2;
            }
            (item.tags || []).forEach(function (tag) {
              if (tags.indexOf(tag) !== -1) {
                score += 1;
              }
            });
            return { article: item, score: score };
          })
          .sort(function (a, b) {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            return new Date(b.article.publishedAt) - new Date(a.article.publishedAt);
          })
          .slice(0, count)
          .map(function (entry) {
            return entry.article;
          });
      });
    },

    forCategory: function (categoryKey) {
      return NP.categories[categoryKey] || null;
    }
  };

  NP.store = store;
})();
