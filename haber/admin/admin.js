/* ==========================================================================
   admin.js — Yönetim paneli
   --------------------------------------------------------------------------
   Tüm butonlar gerçek /api/admin/* fonksiyonlarına bağlıdır. Hata veya eksik
   yapılandırma durumunda başarı mesajı gösterilmez; sunucunun döndürdüğü
   hata mesajı görüntülenir.
   ========================================================================== */

(function () {
  "use strict";

  var state = {
    status: null,
    sources: [],
    activeTab: "dashboard",
    news: { offset: 0, limit: 25, total: 0, loaded: false },
    newsItems: [],
    reviewing: null,
    selectedLogStatus: ""
  };

  var STATUS_LABELS = {
    collected: "Toplandı",
    categorized: "Kategorilendi",
    duplicate: "Tekrar",
    pending_review: "İnceleme bekliyor",
    ready_for_ai: "Yapay zekâya hazır",
    rejected: "Reddedildi",
    published: "Yayında"
  };

  var STATUS_CLASSES = {
    collected: "badge--muted",
    categorized: "badge--info",
    duplicate: "badge--muted",
    pending_review: "badge--warn",
    ready_for_ai: "badge--ok",
    rejected: "badge--bad",
    published: "badge--ok"
  };

  var CATEGORY_LABELS = {
    world: "Dünya",
    turkey: "Türkiye",
    technology: "Teknoloji"
  };

  var LOG_LABELS = {
    success: "Başarılı",
    partial: "Kısmi",
    error: "Hata",
    skipped: "Atlandı"
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(value) {
    var url = String(value || "");
    return /^https?:\/\//i.test(url) ? url : "#";
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function toast(message, isError) {
    var node = $("#toast");
    node.textContent = message;
    node.hidden = false;
    node.classList.toggle("is-error", Boolean(isError));
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () {
      node.hidden = true;
    }, isError ? 8000 : 5000);
  }

  async function api(path, options) {
    var opts = options || {};
    var response = await fetch(path, {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: opts.body ? { "content-type": "application/json" } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });

    var data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        showLogin();
      }
      var message =
        (data && data.error && data.error.message) || "İstek başarısız (HTTP " + response.status + ")";
      var err = new Error(message);
      err.status = response.status;
      err.code = data && data.error ? data.error.code : null;
      err.details = data && data.error ? data.error.details : null;
      throw err;
    }
    return data;
  }

  function hideBoot() {
    var boot = $("#boot-screen");
    if (boot) {
      boot.hidden = true;
    }
  }

  function showLogin(message) {
    hideBoot();
    $("#app-view").hidden = true;
    $("#login-view").hidden = false;
    var errorBox = $("#login-error");
    if (message) {
      errorBox.textContent = message;
      errorBox.hidden = false;
    }
    var password = $("#login-password");
    if (password) {
      password.value = "";
      window.setTimeout(function () {
        password.focus();
      }, 50);
    }
  }

  function showApp() {
    hideBoot();
    $("#login-view").hidden = true;
    $("#app-view").hidden = false;
  }

  function configAlert(message, missing) {
    var box = $("#config-alert");
    var text = $("#config-alert-text");
    if (!message) {
      box.hidden = true;
      return;
    }
    var suffix = Array.isArray(missing) && missing.length ? " Eksik değişkenler: " + missing.join(", ") + "." : "";
    text.textContent = message + suffix + " README → 12. bölüme bakın.";
    box.hidden = false;
  }

  function renderStatus(data) {
    state.status = data;
    var robot = data.robot;
    var articles = data.articles;
    var sources = data.sources;

    var robotValue = $("#stat-robot-status");
    robotValue.textContent = robot.active ? "Aktif" : "Duraklatıldı";
    robotValue.classList.toggle("is-ok", robot.active);
    robotValue.classList.toggle("is-bad", !robot.active);
    $("#stat-robot-detail").textContent =
      "Aralık: " + robot.interval_minutes + " dk" + (robot.lock_until ? " · Kilit: " + formatDate(robot.lock_until) : "");

    $("#stat-last-run").textContent = formatDate(robot.last_run_at);
    $("#stat-last-run-status").textContent = robot.last_run_status ? "Sonuç: " + robot.last_run_status : "Henüz çalışmadı";

    $("#stat-next-run").textContent = robot.next_run_at ? formatDate(robot.next_run_at) : "—";
    $("#stat-interval").textContent = robot.active
      ? "Netlify tetiklemesi: 15 dk"
      : "Robot duraklatıldığı için planlanmıyor";

    $("#stat-active-sources").textContent = String(sources.active);
    $("#stat-total-sources").textContent = String(sources.total) + " kaynak · " + sources.verified + " doğrulanmış";

    $("#stat-today").textContent = String(articles.today);
    $("#stat-total").textContent = String(articles.total);
    $("#stat-ready").textContent =
      articles.ready_for_ai + " yapay zekâya hazır · " +
      articles.categorized + " kategorilendi · " +
      (articles.published || 0) + " yayında";

    $("#stat-duplicates").textContent = String(articles.duplicates);
    $("#stat-pending").textContent = String(articles.pending_review);

    $("#errors-24h").textContent =
      data.errors_last_24h > 0
        ? "Son 24 saatte " + data.errors_last_24h + " hata kaydı var. “Hata Kayıtları” bölümünden inceleyin."
        : "Son 24 saatte hata kaydı yok.";

    var toggle = $("#robot-toggle");
    toggle.textContent = robot.active ? "Robotu duraklat" : "Robotu yeniden başlat";

    var intervalInput = $("#interval-input");
    if (document.activeElement !== intervalInput) {
      intervalInput.value = String(robot.interval_minutes);
    }

    var autoToggle = $("#auto-publish-toggle");
    if (autoToggle) {
      autoToggle.checked = Boolean(robot.auto_publish);
    }

    var badge = $("#env-badge");
    badge.textContent = "Supabase bağlı";
    badge.classList.add("is-ok");
    badge.classList.remove("is-bad");

    renderRecentLogs(data.recent_logs || []);
    configAlert(null);
  }

  function renderRecentLogs(logs) {
    var body = $("#recent-logs-body");
    if (!logs.length) {
      body.innerHTML = '<tr><td colspan="4" class="table-empty">Henüz toplama kaydı yok.</td></tr>';
      return;
    }
    body.innerHTML = logs
      .map(function (log) {
        var cls = log.status === "error" ? "badge--bad" : log.status === "partial" ? "badge--warn" : "badge--ok";
        return (
          "<tr>" +
          '<td class="cell-muted">' + esc(formatDate(log.created_at)) + "</td>" +
          "<td>" + esc(log.source_name || "—") + "</td>" +
          '<td><span class="badge ' + cls + '">' + esc(LOG_LABELS[log.status] || log.status) + "</span></td>" +
          '<td class="cell-muted">' + esc(log.articles_saved) + " yeni · " + esc(log.duplicates_found) + " tekrar</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function loadStatus(options) {
    var silent = options && options.silent;
    try {
      var data = await api("/api/admin/status");
      renderStatus(data);
      return data;
    } catch (error) {
      if (error.status === 401) {
        return null;
      }
      if (error.code === "configuration_required" || error.code === "schema_missing") {
        showApp();
        configAlert(error.message, error.details && error.details.missing);
        var badge = $("#env-badge");
        badge.textContent = error.code === "schema_missing" ? "Şema eksik" : "Yapılandırma eksik";
        badge.classList.add("is-bad");
        badge.classList.remove("is-ok");
        if (!silent) {
          toast(error.message, true);
        }
        return null;
      }
      showApp();
      toast(error.message, true);
      return null;
    }
  }

  async function runScan(button) {
    var original = button.textContent;
    button.disabled = true;
    button.textContent = "Taranıyor…";
    try {
      var data = await api("/api/admin/collect", { method: "POST", body: {} });
      var summary = data.summary || {};
      if (summary.skipped) {
        toast("Tarama atlandı: " + summary.reason);
      } else {
        var message =
          "Tarama tamamlandı · " +
          (summary.sources_checked || 0) +
          " kaynak tarandı · " +
          (summary.articles_saved || 0) +
          " yeni haber · " +
          (summary.duplicates_found || 0) +
          " tekrar · " +
          (summary.errors && summary.errors.length ? summary.errors.length + " hata" : "hata yok");
        toast(message, summary.errors && summary.errors.length > 0);
      }
      await loadStatus({ silent: true });
      state.news.loaded = false;
      if (state.activeTab === "news") {
        loadNews(0);
      }
      if (state.activeTab === "logs") {
        loadLogs();
      }
    } catch (error) {
      toast(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  async function toggleRobot() {
    var active = state.status && state.status.robot ? state.status.robot.active : false;
    try {
      var data = await api("/api/admin/robot", {
        method: "POST",
        body: { action: active ? "pause" : "resume" }
      });
      toast(active ? "Robot duraklatıldı." : "Robot yeniden başlatıldı.");
      if (state.status) {
        state.status.robot.active = data.robot.active;
        state.status.robot.next_run_at = data.robot.next_run_at;
      }
      await loadStatus({ silent: true });
    } catch (error) {
      toast(error.message, true);
    }
  }

  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll(".admin-nav__item").forEach(function (item) {
      item.classList.toggle("is-active", item.getAttribute("data-tab") === tab);
    });
    document.querySelectorAll(".admin-tab").forEach(function (section) {
      section.hidden = section.id !== "tab-" + tab;
    });
    var titles = {
      dashboard: "Sistem Durumu",
      news: "Haber Havuzu",
      sources: "Kaynaklar",
      logs: "Hata Kayıtları"
    };
    $("#page-title").textContent = titles[tab] || "Panel";

    if (tab === "news") {
      loadNews(state.news.offset);
    } else if (tab === "sources") {
      loadSources();
    } else if (tab === "logs") {
      loadLogs();
    } else {
      loadStatus({ silent: true });
    }
  }

  async function loadSources() {
    var body = $("#sources-body");
    body.innerHTML = '<tr><td colspan="7" class="table-empty">Yükleniyor…</td></tr>';
    try {
      var data = await api("/api/admin/sources");
      state.sources = data.sources || [];
      renderSources();
    } catch (error) {
      body.innerHTML = '<tr><td colspan="7" class="table-empty">' + esc(error.message) + "</td></tr>";
      toast(error.message, true);
    }
  }

  function renderSources() {
    var body = $("#sources-body");
    var sources = state.sources;
    $("#sources-meta").textContent =
      sources.length + " kaynak · " + sources.filter(function (s) { return s.is_active; }).length + " etkin";

    if (!sources.length) {
      body.innerHTML = '<tr><td colspan="7" class="table-empty">Kaynak bulunamadı.</td></tr>';
      return;
    }

    body.innerHTML = sources
      .map(function (source) {
        var verified = source.is_verified;
        var verification = verified
          ? '<span class="badge badge--ok">Doğrulandı</span>'
          : '<span class="badge badge--warn">Doğrulanmadı</span>';
        var note = source.last_error || source.verification_note || "";
        var activeLabel = source.is_active ? "Etkin" : "Pasif";
        return (
          "<tr>" +
          "<td>" +
          '<div class="cell-title">' + esc(source.name) + "</div>" +
          '<span class="cell-sub">' + esc(source.feed_url) + "</span>" +
          (note ? '<span class="cell-sub">' + esc(note) + "</span>" : "") +
          "</td>" +
          "<td>" + esc(CATEGORY_LABELS[source.category] || source.category) + "</td>" +
          '<td class="cell-muted">' + esc(source.language || "—") + "</td>" +
          '<td class="cell-muted">' + esc(source.reliability_score) + "</td>" +
          "<td>" + verification + "</td>" +
          '<td><span class="source-active"><span class="dot ' +
          (source.is_active ? "is-on" : "is-off") +
          '"></span>' + activeLabel + "</span></td>" +
          '<td><div class="row-actions">' +
          '<button type="button" class="btn btn--outline" data-action="verify" data-id="' + esc(source.id) + '">Doğrula</button>' +
          '<button type="button" class="btn btn--outline" data-action="toggle" data-id="' + esc(source.id) + '"' +
          (!verified && !source.is_active ? ' title="Önce RSS adresini doğrulayın" disabled' : "") +
          ">" + (source.is_active ? "Duraklat" : "Etkinleştir") + "</button>" +
          '<button type="button" class="btn btn--ghost" data-action="delete" data-id="' + esc(source.id) + '">Sil</button>' +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function handleSourceAction(button) {
    var action = button.getAttribute("data-action");
    var id = button.getAttribute("data-id");
    var source = state.sources.filter(function (item) { return item.id === id; })[0];

    if (action === "verify") {
      button.disabled = true;
      var original = button.textContent;
      button.textContent = "Test ediliyor…";
      try {
        var data = await api("/api/admin/sources", {
          method: "POST",
          body: { action: "verify", id: id }
        });
        toast("RSS doğrulandı · " + data.feed.item_count + " öğe · " + (data.feed.title || "başlık yok"));
        await loadSources();
        await loadStatus({ silent: true });
      } catch (error) {
        toast(error.message, true);
        await loadSources();
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
      return;
    }

    if (action === "toggle" && source) {
      try {
        await api("/api/admin/sources", {
          method: "POST",
          body: { action: "update", id: id, is_active: !source.is_active }
        });
        toast(source.is_active ? "Kaynak duraklatıldı." : "Kaynak etkinleştirildi.");
        await loadSources();
        await loadStatus({ silent: true });
      } catch (error) {
        toast(error.message, true);
      }
      return;
    }

    if (action === "delete" && source) {
      if (!window.confirm("“" + source.name + "” kaynağı silinsin mi? Toplanmış haberler korunur.")) {
        return;
      }
      try {
        await api("/api/admin/sources", {
          method: "POST",
          body: { action: "delete", id: id }
        });
        toast("Kaynak silindi.");
        await loadSources();
        await loadStatus({ silent: true });
      } catch (error) {
        toast(error.message, true);
      }
    }
  }

  async function loadNews(offset) {
    state.news.offset = Math.max(0, offset || 0);
    var body = $("#news-body");
    body.innerHTML = '<tr><td colspan="7" class="table-empty">Yükleniyor…</td></tr>';

    var params = new URLSearchParams();
    params.set("limit", String(state.news.limit));
    params.set("offset", String(state.news.offset));
    var status = $("#news-status").value;
    var category = $("#news-category").value;
    var query = $("#news-q").value.trim();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (query) params.set("q", query);

    try {
      var data = await api("/api/admin/news?" + params.toString());
      state.news.total = data.total;
      state.news.loaded = true;
      renderNews(data.items || []);
      $("#news-meta").textContent = data.total + " kayıt · " + (state.news.offset + 1) + "–" +
        Math.min(state.news.offset + state.news.limit, data.total) + " arası gösteriliyor";
    } catch (error) {
      body.innerHTML = '<tr><td colspan="7" class="table-empty">' + esc(error.message) + "</td></tr>";
      toast(error.message, true);
    }
  }

  function renderNews(items) {
    var body = $("#news-body");
    var total = state.news.total;
    var page = Math.floor(state.news.offset / state.news.limit) + 1;
    var pages = Math.max(1, Math.ceil(total / state.news.limit));
    $("#news-page-info").textContent = "Sayfa " + page + " / " + pages;
    $("#news-prev").disabled = state.news.offset === 0;
    $("#news-next").disabled = state.news.offset + state.news.limit >= total;

    state.newsItems = items;

    if (!items.length) {
      body.innerHTML = '<tr><td colspan="7" class="table-empty">Filtrelere uyan haber yok.</td></tr>';
      return;
    }

    body.innerHTML = items
      .map(function (item) {
        var statusClass = STATUS_CLASSES[item.status] || "badge--muted";
        var published = item.status === "published";
        return (
          "<tr>" +
          '<td class="cell-muted">' + esc(formatDate(item.published_at)) + "</td>" +
          '<td><div class="cell-title"><button type="button" class="cell-link" data-review="' + esc(item.id) + '">' +
          esc(item.title) + "</button></div>" +
          (item.review_reason ? '<span class="cell-sub">Not: ' + esc(item.review_reason) + "</span>" : "") +
          (published ? '<span class="cell-sub">Portalda yayında</span>' : "") +
          "</td>" +
          "<td>" + esc(CATEGORY_LABELS[item.category] || "—") + "</td>" +
          "<td>" + esc(item.source_name || "—") + "</td>" +
          '<td class="cell-muted">' + esc(Math.round(Number(item.importance_score) || 0)) + "</td>" +
          '<td><span class="badge ' + statusClass + '">' + esc(STATUS_LABELS[item.status] || item.status) + "</span></td>" +
          '<td><div class="row-actions">' +
          '<button type="button" class="btn btn--outline" data-review="' + esc(item.id) + '">' +
          (published ? "Düzenle" : "İncele") + "</button>" +
          (published && item.portal_slug
            ? '<a class="btn btn--ghost" href="/haber/pages/article.html?slug=' +
              encodeURIComponent(item.portal_slug) + '" target="_blank" rel="noopener">Aç ↗</a>'
            : "") +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function reviewItem(id) {
    return state.newsItems.filter(function (item) { return item.id === id; })[0] || null;
  }

  function setReviewPreview(url) {
    var wrap = $("#review-preview-wrap");
    var img = $("#review-preview");
    if (/^https?:\/\//i.test(String(url || ""))) {
      img.src = url;
      wrap.hidden = false;
    } else {
      img.removeAttribute("src");
      wrap.hidden = true;
    }
  }

  function openReview(id) {
    var item = reviewItem(id);
    if (!item) {
      toast("Haber bulunamadı, listeyi yenileyin.", true);
      return;
    }
    state.reviewing = item;
    var published = item.status === "published";

    $("#review-title").textContent = published ? "Yayındaki haberi düzenle" : "Haberi incele ve onayla";
    $("#review-meta").textContent =
      (item.source_name || "Kaynak yok") +
      " · " + (CATEGORY_LABELS[item.category] || "Kategori yok") +
      " · Puan " + Math.round(Number(item.importance_score) || 0) +
      " · Durum: " + (STATUS_LABELS[item.status] || item.status);

    $("#review-heading").value = item.title || "";
    $("#review-summary").value = item.description || "";
    $("#review-category").value = item.category || "world";
    $("#review-image").value = item.image_url || "";
    $("#review-breaking").checked = Boolean(item.is_breaking);
    setReviewPreview(item.image_url);

    var source = $("#review-source");
    source.href = safeUrl(item.article_url);
    $("#review-source-note").textContent = item.article_url || "Kaynak adresi yok";

    var publicLink = $("#review-public-link");
    if (published && item.portal_slug) {
      publicLink.href = "/haber/pages/article.html?slug=" + encodeURIComponent(item.portal_slug);
      publicLink.hidden = false;
    } else {
      publicLink.hidden = true;
    }

    $("#review-approve").textContent = published ? "Değişiklikleri yayınla" : "Onayla ve yayınla";
    $("#review-unpublish").hidden = !published;

    var errorBox = $("#review-error");
    errorBox.hidden = true;
    $("#review-modal").hidden = false;
    document.body.classList.add("is-locked");
    window.setTimeout(function () { $("#review-heading").focus(); }, 30);
  }

  function closeReview() {
    $("#review-modal").hidden = true;
    document.body.classList.remove("is-locked");
    state.reviewing = null;
  }

  async function submitReview(action, button) {
    var item = state.reviewing;
    if (!item) {
      return;
    }

    if (action === "reject" && !window.confirm("Bu haber reddedilsin mi? Reddedilen haber havuza geri dönmez.")) {
      return;
    }
    if (action === "unpublish" && !window.confirm("Haber portaldan kaldırılsın mı?")) {
      return;
    }

    var body = { action: action, id: item.id };
    if (action === "approve") {
      body.title = $("#review-heading").value;
      body.summary = $("#review-summary").value;
      body.category = $("#review-category").value;
      body.image_url = $("#review-image").value;
      body.is_breaking = $("#review-breaking").checked;
    }

    var errorBox = $("#review-error");
    errorBox.hidden = true;
    var original = button.textContent;
    button.disabled = true;
    button.textContent = "İşleniyor…";
    try {
      var data = await api("/api/admin/news", { method: "POST", body: body });
      toast(data.message || "İşlem tamamlandı.");
      closeReview();
      state.news.loaded = false;
      await loadNews(state.news.offset);
      await loadStatus({ silent: true });
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  async function loadLogs() {
    var body = $("#logs-body");
    body.innerHTML = '<tr><td colspan="8" class="table-empty">Yükleniyor…</td></tr>';
    var params = new URLSearchParams();
    params.set("limit", "100");
    var status = $("#log-status").value;
    if (status) {
      params.set("status", status);
    }
    try {
      var data = await api("/api/admin/logs?" + params.toString());
      $("#logs-meta").textContent = data.total + " günlük kaydı" + (status ? " (filtreli)" : "");
      if (!data.items.length) {
        body.innerHTML = '<tr><td colspan="8" class="table-empty">Günlük kaydı yok.</td></tr>';
        return;
      }
      body.innerHTML = data.items
        .map(function (log) {
          var cls = log.status === "error" ? "badge--bad" : log.status === "partial" ? "badge--warn" : "badge--ok";
          return (
            "<tr>" +
            '<td class="cell-muted">' + esc(formatDate(log.created_at)) + "</td>" +
            "<td>" + esc(log.source_name || "—") + "</td>" +
            '<td><span class="badge ' + cls + '">' + esc(LOG_LABELS[log.status] || log.status) + "</span></td>" +
            '<td class="cell-muted">' + esc(log.articles_found) + "</td>" +
            '<td class="cell-muted">' + esc(log.articles_saved) + "</td>" +
            '<td class="cell-muted">' + esc(log.duplicates_found) + "</td>" +
            '<td class="cell-muted">' + esc(log.execution_time != null ? log.execution_time + " ms" : "—") + "</td>" +
            "<td>" + (log.error_message ? esc(log.error_message) : '<span class="cell-muted">—</span>') + "</td>" +
            "</tr>"
          );
        })
        .join("");
    } catch (error) {
      body.innerHTML = '<tr><td colspan="8" class="table-empty">' + esc(error.message) + "</td></tr>";
      toast(error.message, true);
    }
  }

  function bindEvents() {
    $("#login-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      var errorBox = $("#login-error");
      var submit = $("#login-submit");
      errorBox.hidden = true;
      submit.disabled = true;
      submit.textContent = "Giriş yapılıyor…";
      try {
        await api("/api/admin/login", {
          method: "POST",
          body: { password: $("#login-password").value }
        });
        showApp();
        await loadStatus({ silent: true });
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
      } finally {
        submit.disabled = false;
        submit.textContent = "Giriş yap";
      }
    });

    $("#logout-button").addEventListener("click", async function () {
      try {
        await api("/api/admin/logout", { method: "POST" });
      } catch (error) {
        // Oturum zaten sonlanmış olabilir.
      }
      showLogin();
    });

    document.querySelectorAll(".admin-nav__item").forEach(function (item) {
      item.addEventListener("click", function () {
        switchTab(item.getAttribute("data-tab"));
      });
    });

    $("#btn-scan").addEventListener("click", function () { runScan(this); });
    $("#btn-scan-secondary").addEventListener("click", function () { runScan(this); });
    $("#robot-toggle").addEventListener("click", toggleRobot);

    $("#btn-clear-lock").addEventListener("click", async function () {
      try {
        await api("/api/admin/robot", { method: "POST", body: { action: "clear_lock" } });
        toast("Kilit temizlendi.");
        await loadStatus({ silent: true });
      } catch (error) {
        toast(error.message, true);
      }
    });

    $("#interval-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        await api("/api/admin/robot", {
          method: "POST",
          body: { action: "set_interval", interval_minutes: Number($("#interval-input").value) }
        });
        toast("Tarama aralığı güncellendi.");
        await loadStatus({ silent: true });
      } catch (error) {
        toast(error.message, true);
      }
    });

    $("#btn-toggle-add").addEventListener("click", function () {
      var form = $("#source-form");
      form.hidden = !form.hidden;
      if (!form.hidden) {
        $("#src-name").focus();
      }
    });

    $("#btn-cancel-add").addEventListener("click", function () {
      $("#source-form").hidden = true;
      $("#source-form-error").hidden = true;
    });

    $("#source-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      var errorBox = $("#source-form-error");
      errorBox.hidden = true;
      try {
        await api("/api/admin/sources", {
          method: "POST",
          body: {
            action: "create",
            name: $("#src-name").value,
            feed_url: $("#src-url").value,
            category: $("#src-category").value,
            language: $("#src-language").value,
            country: $("#src-country").value,
            reliability_score: Number($("#src-reliability").value)
          }
        });
        event.target.reset();
        $("#src-language").value = "tr";
        $("#src-reliability").value = "70";
        event.target.hidden = true;
        toast("Kaynak pasif olarak eklendi. Doğrulayıp etkinleştirin.");
        await loadSources();
        await loadStatus({ silent: true });
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
      }
    });

    $("#sources-body").addEventListener("click", function (event) {
      var button = event.target.closest("[data-action]");
      if (button) {
        handleSourceAction(button);
      }
    });

    $("#news-body").addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-review]");
      if (trigger) {
        openReview(trigger.getAttribute("data-review"));
      }
    });

    document.querySelectorAll("[data-review-close]").forEach(function (element) {
      element.addEventListener("click", closeReview);
    });

    $("#review-approve").addEventListener("click", function () { submitReview("approve", this); });
    $("#review-reject").addEventListener("click", function () { submitReview("reject", this); });
    $("#review-unpublish").addEventListener("click", function () { submitReview("unpublish", this); });
    $("#review-image").addEventListener("input", function () { setReviewPreview(this.value.trim()); });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !$("#review-modal").hidden) {
        closeReview();
      }
    });

    $("#auto-publish-toggle").addEventListener("change", async function () {
      var toggle = this;
      var enabled = toggle.checked;
      toggle.disabled = true;
      try {
        await api("/api/admin/robot", {
          method: "POST",
          body: { action: "set_auto_publish", auto_publish: enabled }
        });
        toast(enabled ? "Otomatik yayın açıldı." : "Otomatik yayın kapatıldı.");
        await loadStatus({ silent: true });
      } catch (error) {
        toggle.checked = !enabled;
        toast(error.message, true);
      } finally {
        toggle.disabled = false;
      }
    });

    $("#news-filter-form").addEventListener("submit", function (event) {
      event.preventDefault();
      loadNews(0);
    });

    $("#news-refresh").addEventListener("click", function () {
      loadNews(state.news.offset);
    });

    $("#news-prev").addEventListener("click", function () {
      loadNews(Math.max(0, state.news.offset - state.news.limit));
    });

    $("#news-next").addEventListener("click", function () {
      loadNews(state.news.offset + state.news.limit);
    });

    $("#logs-refresh").addEventListener("click", loadLogs);

    $("#log-status").addEventListener("change", loadLogs);

    $("#logs-only-errors").addEventListener("click", function (event) {
      event.preventDefault();
      $("#log-status").value = "error";
      loadLogs();
    });
  }

  async function boot() {
    bindEvents();
    try {
      var data = await api("/api/admin/status");
      renderStatus(data);
      showApp();
    } catch (error) {
      if (error.status === 401) {
        showLogin();
        return;
      }
      var missing = (error.details && error.details.missing) || [];
      var supabaseMissing = missing.some(function (name) {
        return String(name).indexOf("SUPABASE_") === 0;
      });
      // Oturum geçerli olabilir; yalnızca Supabase tarafı eksikse paneli açıp
      // yapılandırma uyarısını göster. Giriş ekranına geri dönmeyiz.
      if (error.code === "schema_missing" || (error.code === "configuration_required" && supabaseMissing)) {
        showApp();
        configAlert(error.message, missing);
        var badge = $("#env-badge");
        badge.textContent = error.code === "schema_missing" ? "Şema eksik" : "Yapılandırma eksik";
        badge.classList.add("is-bad");
        badge.classList.remove("is-ok");
        return;
      }
      showLogin();
      var box = $("#login-error");
      var hint = missing.length ? " Eksik değişkenler: " + missing.join(", ") + "." : "";
      box.textContent = error.message + hint;
      box.hidden = false;
    } finally {
      hideBoot();
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
