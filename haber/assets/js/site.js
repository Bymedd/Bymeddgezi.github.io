/* ==========================================================================
   site.js — Tüm sayfalarda çalışan ortak arayüz davranışları
   --------------------------------------------------------------------------
   Site adı, tarih, mobil menü, sosyal medya yer tutucuları ve bildirimler.
   ========================================================================== */

(function () {
  "use strict";

  window.NP = window.NP || {};

  var config = NP.config;

  function applyBranding() {
    document.querySelectorAll("[data-site-name]").forEach(function (node) {
      node.textContent = config.siteName;
    });
    document.querySelectorAll("[data-site-tagline]").forEach(function (node) {
      node.textContent = config.siteTagline;
    });
    document.querySelectorAll("[data-site-mark]").forEach(function (node) {
      node.textContent = NP.utils.initials(config.siteName);
    });
    document.querySelectorAll("[data-site-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
    document.querySelectorAll("[data-today]").forEach(function (node) {
      node.textContent = NP.utils.todayText();
    });
    document.title = document.title.replace(/\{siteName\}/g, config.siteName);
  }

  function toast(message) {
    var existing = document.querySelector(".toast");
    if (existing) {
      existing.remove();
    }
    var node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.textContent = message;
    document.body.appendChild(node);
    window.setTimeout(function () {
      node.classList.add("toast--out");
      window.setTimeout(function () {
        node.remove();
      }, 250);
    }, 2600);
  }

  function setupSocialPlaceholders() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest("[data-social-placeholder]");
      if (!link) {
        return;
      }
      event.preventDefault();
      toast(link.getAttribute("data-social-placeholder") + " hesabı yayın hayatına geçtiğinde burada yer alacak.");
    });
  }

  function setupMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("main-nav");
    if (!toggle || !nav) {
      return;
    }

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    }

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("nav-open", !isOpen);
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && window.innerWidth < 900) {
        close();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        close();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) {
        close();
      }
    });
  }

  function setupStickyShadow() {
    var header = document.querySelector(".nav-wrap");
    if (!header) {
      return;
    }
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setupYearNote() {
    var note = document.querySelector("[data-demo-note]");
    if (note && !config.demoMode) {
      note.remove();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyBranding();
    setupSocialPlaceholders();
    setupMobileNav();
    setupStickyShadow();
    setupYearNote();
  });

  NP.site = {
    toast: toast,
    applyBranding: applyBranding
  };
})();
