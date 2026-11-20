/* ==========================================================================
   utils.js — Ortak yardımcı fonksiyonlar
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  var DATE_FORMAT = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  var DATE_TIME_FORMAT = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  var SHORT_DATE_FORMAT = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseDate(value) {
    var date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    var date = parseDate(value);
    return date ? DATE_FORMAT.format(date) : "";
  }

  function formatDateTime(value) {
    var date = parseDate(value);
    return date ? DATE_TIME_FORMAT.format(date) : "";
  }

  function formatShortDate(value) {
    var date = parseDate(value);
    return date ? SHORT_DATE_FORMAT.format(date) : "";
  }

  function todayText() {
    return DATE_FORMAT.format(new Date());
  }

  function categoryLabel(key) {
    var category = NP.categories && NP.categories[key];
    return category ? category.label : "Haber";
  }

  function categoryPage(key) {
    var category = NP.categories && NP.categories[key];
    return (NP.config.basePath || "") + (category ? category.page : "pages/world.html");
  }

  function articleUrl(slug) {
    return (NP.config.basePath || "") + "pages/article.html?slug=" + encodeURIComponent(slug || "");
  }

  function imageUrl(path) {
    var value = path || NP.config.defaultImage;
    if (/^(https?:)?\/\//i.test(value) || value.indexOf("data:") === 0) {
      return value;
    }
    return (NP.config.basePath || "") + value.replace(/^\.?\//, "");
  }

  function readingTime(content) {
    var text = (content || [])
      .map(function (block) {
        return (block.text || "") + " " + (block.items ? block.items.join(" ") : "");
      })
      .join(" ");
    var words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  function truncate(value, max) {
    var text = String(value || "");
    if (text.length <= max) {
      return text;
    }
    return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
  }

  function initials(value) {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (word) {
        return word.charAt(0).toUpperCase();
      })
      .join("");
  }

  function normalize(value) {
    return String(value || "")
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/İ/g, "i")
      .trim();
  }

  function sortByDateDesc(list) {
    return list.slice().sort(function (a, b) {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  NP.utils = {
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatShortDate: formatShortDate,
    todayText: todayText,
    categoryLabel: categoryLabel,
    categoryPage: categoryPage,
    articleUrl: articleUrl,
    imageUrl: imageUrl,
    readingTime: readingTime,
    truncate: truncate,
    initials: initials,
    normalize: normalize,
    sortByDateDesc: sortByDateDesc
  };
})();
