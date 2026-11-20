# Netlify Functions — 2. Aşama

Haber toplama motorunun sunucu tarafı bu klasörde çalışır. Tüm dosyalar
Netlify Functions v2 (ESM) biçimindedir ve `export const config = { path }`
ile kendi API yollarını tanımlar.

## Fonksiyonlar

| Dosya / yol | Görev | Yetki |
| --- | --- | --- |
| `collect-news.mjs` — `/api/admin/collect` | Aktif kaynakları tarar, haberleri toplar. | Yönetici |
| `process-feed.mjs` — `/api/admin/process-feed` | Bir RSS adresini doğrular ve normalize edilmiş önizleme döner. DB'ye yazmaz. | Yönetici |
| `categorize-news.mjs` — `/api/admin/categorize-news` | Tek bir başlık/açıklama için kategori tahmini. | Yönetici |
| `deduplicate-news.mjs` — `/api/admin/deduplicate-news` | Bir aday kaydı havuzla karşılaştırır (kayıt yazmaz). | Yönetici |
| `score-news.mjs` — `/api/admin/score-news` | Tek bir haber için puan hesabı. | Yönetici |
| `get-system-status.mjs` — `/api/admin/status` | Panelin sistem durumu verisi. | Yönetici |
| `admin-login.mjs` / `admin-logout.mjs` | Oturum açma/kapatma. | Herkese açık (parola + hız sınırı) |
| `robot-control.mjs` — `/api/admin/robot` | Duraklat, devam ettir, aralık, kilit temizleme. | Yönetici |
| `admin-sources.mjs` — `/api/admin/sources` | Kaynak ekleme, güncelleme, doğrulama, silme. | Yönetici |
| `admin-news.mjs` — `/api/admin/news` | Haber havuzu listesi ve filtreleri. | Yönetici |
| `admin-logs.mjs` — `/api/admin/logs` | Toplama günlükleri. | Yönetici |
| `scheduled-collector.mjs` | Netlify Scheduled Function; `*/15` cron ile tetiklenir. | Netlify |

## Kütüphaneler (`_lib/`)

- `env.mjs` — ortam değişkenleri, varsayılanlar ve eksik yapılandırma listesi.
- `supabase.mjs` — yalnızca sunucuda kullanılan service_role istemcisi.
- `http.mjs` — JSON yanıtı, hata eşleme, Origin kontrolü, hız sınırı.
- `auth.mjs` — HMAC imzalı HttpOnly oturum çerezi.
- `feed.mjs` — RSS/Atom indirme, SSRF koruması, boyut ve zaman aşımı.
- `text.mjs` — HTML temizleme, Türkçe normalizasyon, URL kanonikleştirme.
- `categorize.mjs` — world / turkey / technology sınıflandırması.
- `dedupe.mjs` — URL, hash, başlık benzerliği ve tarih yakınlığı.
- `score.mjs` — 100 üzerinden öncelik puanı.
- `pipeline.mjs` — ham öğe → doğrulanmış haber kaydı ve durum kararı.
- `collector.mjs` — tarama döngüsü, kilit, kayıt ve günlük yazımı.
- `settings.mjs` — `system_settings` okuma/yazma ve sonraki çalışma zamanı.
- `sources-catalog.mjs` — başlangıç kaynak kataloğu.

## Güvenlik kuralları

- `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` ve `ADMIN_SESSION_SECRET`
  yalnızca Netlify ortam değişkenlerinde tutulur; hiçbir zaman istemciye
  gönderilmez.
- Tüm yönetim uçları `requireAdmin()` ile korunur; POST istekleri ayrıca
  `assertSameOrigin()` ile CSRF'e karşı denetlenir.
- Supabase tablolarında RLS açıktır ve `anon`/`authenticated` rollerinin
  yetkisi kaldırılmıştır. Erişim yalnızca service_role üzerindendir.
- RSS adresleri SSRF korumasından geçer; yerel/özel ağ adresleri reddedilir.
- Hiçbir haber bu aşamada otomatik yayınlanmaz; en yüksek durum
  `ready_for_ai`dir.
