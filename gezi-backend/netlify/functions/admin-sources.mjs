/* ==========================================================================
   admin-sources — GET/POST /api/admin/sources
   --------------------------------------------------------------------------
   POST actions:
     create   — Yeni kaynak ekler (doğrulanana kadar pasif)
     update   — Alan güncelleme / aktiflik değiştirme
     verify   — RSS adresini gerçek istekle doğrular
     delete   — Kaynağı siler
   Kural: doğrulanmamış bir kaynak etkinleştirilemez.
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { requireAdmin } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, HttpError, json, readJson, requireMethod } from "./_lib/http.mjs";
import { fetchFeed, FeedError, validateFeedUrl } from "./_lib/feed.mjs";
import { ALLOWED_CATEGORIES } from "./_lib/sources-catalog.mjs";
import { ensureSeedSources } from "./_lib/collector.mjs";

export const config = { path: "/api/admin/sources" };

function shortText(value, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseReliability(value, fallback = 70) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(100, Math.max(0, parsed));
}

async function listSources(supabase) {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (error) {
    if (error.code === "42P01") {
      throw new HttpError(503, "schema_missing", "sources tablosu bulunamadı. SQL migration uygulanmalı.");
    }
    throw new Error(`Kaynaklar listelenemedi: ${error.message}`);
  }
  return data || [];
}

export default async function handler(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const method = req.method.toUpperCase();

    if (method === "GET") {
      await ensureSeedSources(supabase);
      const sources = await listSources(supabase);
      return json({ ok: true, sources });
    }

    requireMethod(req, "POST");
    assertSameOrigin(req);

    const body = await readJson(req, 20_000);
    const action = String(body.action || "");

    if (action === "create") {
      const name = shortText(body.name);
      const feedUrlRaw = shortText(body.feed_url, 600);
      if (!name) {
        throw new HttpError(400, "name_required", "Kaynak adı zorunludur.");
      }
      let feedUrl;
      try {
        feedUrl = validateFeedUrl(feedUrlRaw);
      } catch (error) {
        throw new HttpError(400, error.code || "invalid_url", error.message);
      }
      if (!ALLOWED_CATEGORIES.includes(body.category)) {
        throw new HttpError(400, "invalid_category", "Kategori world, turkey veya technology olmalıdır.");
      }

      const row = {
        name,
        feed_url: feedUrl,
        category: body.category,
        country: shortText(body.country, 10) || null,
        language: shortText(body.language, 8) || "tr",
        reliability_score: parseReliability(body.reliability_score),
        is_active: false,
        is_verified: false,
        verification_note: "Panelden eklendi; doğrulanmayı bekliyor."
      };

      const { data, error } = await supabase.from("sources").insert(row).select("*").single();
      if (error) {
        if (error.code === "23505") {
          throw new HttpError(409, "duplicate_feed", "Bu RSS adresi zaten kayıtlı.");
        }
        throw new Error(`Kaynak eklenemedi: ${error.message}`);
      }
      return json({ ok: true, source: data }, 201);
    }

    if (action === "update") {
      if (!body.id) {
        throw new HttpError(400, "id_required", "Kaynak kimliği zorunludur.");
      }
      const { data: existing, error: fetchError } = await supabase
        .from("sources")
        .select("*")
        .eq("id", body.id)
        .maybeSingle();
      if (fetchError) {
        throw new Error(`Kaynak okunamadı: ${fetchError.message}`);
      }
      if (!existing) {
        throw new HttpError(404, "source_not_found", "Kaynak bulunamadı.");
      }

      const patch = {};
      if (body.name !== undefined) {
        patch.name = shortText(body.name);
        if (!patch.name) {
          throw new HttpError(400, "name_required", "Kaynak adı boş olamaz.");
        }
      }
      if (body.category !== undefined) {
        if (!ALLOWED_CATEGORIES.includes(body.category)) {
          throw new HttpError(400, "invalid_category", "Geçersiz kategori.");
        }
        patch.category = body.category;
      }
      if (body.country !== undefined) {
        patch.country = shortText(body.country, 10) || null;
      }
      if (body.language !== undefined) {
        patch.language = shortText(body.language, 8) || "tr";
      }
      if (body.reliability_score !== undefined) {
        patch.reliability_score = parseReliability(body.reliability_score, existing.reliability_score);
      }
      if (body.feed_url !== undefined) {
        let nextFeed;
        try {
          nextFeed = validateFeedUrl(shortText(body.feed_url, 600));
        } catch (error) {
          throw new HttpError(400, error.code || "invalid_url", error.message);
        }
        if (nextFeed !== existing.feed_url) {
          patch.feed_url = nextFeed;
          patch.is_verified = false;
          patch.is_active = false;
          patch.verification_note = "Adres değişti; yeniden doğrulanmalı.";
          patch.last_error = null;
        }
      }
      if (body.is_active !== undefined) {
        const nextActive = Boolean(body.is_active);
        const verified = patch.is_verified !== undefined ? patch.is_verified : existing.is_verified;
        if (nextActive && !verified) {
          throw new HttpError(
            400,
            "verification_required",
            "Kaynak etkinleştirilmeden önce RSS adresi doğrulanmalıdır."
          );
        }
        patch.is_active = nextActive;
      }

      if (!Object.keys(patch).length) {
        throw new HttpError(400, "no_changes", "Güncellenecek alan gönderilmedi.");
      }

      const { data, error } = await supabase
        .from("sources")
        .update(patch)
        .eq("id", body.id)
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          throw new HttpError(409, "duplicate_feed", "Bu RSS adresi başka bir kaynakta kayıtlı.");
        }
        throw new Error(`Kaynak güncellenemedi: ${error.message}`);
      }
      return json({ ok: true, source: data });
    }

    if (action === "verify") {
      const { data: source, error: fetchError } = await supabase
        .from("sources")
        .select("*")
        .eq("id", body.id || "00000000-0000-0000-0000-000000000000")
        .maybeSingle();
      if (fetchError) {
        throw new Error(`Kaynak okunamadı: ${fetchError.message}`);
      }
      if (!source) {
        throw new HttpError(404, "source_not_found", "Kaynak bulunamadı.");
      }

      const checkedAt = new Date().toISOString();
      try {
        const feed = await fetchFeed(source.feed_url, { timeoutMs: 10_000 });
        const note = `Doğrulandı · ${feed.items.length} öğe · ${new Date().toLocaleString("tr-TR")}`;
        const { data, error } = await supabase
          .from("sources")
          .update({
            is_verified: true,
            verification_note: note,
            last_error: null,
            error_count: 0,
            last_checked_at: checkedAt,
            last_success_at: checkedAt
          })
          .eq("id", source.id)
          .select("*")
          .single();
        if (error) {
          throw new Error(`Doğrulama sonucu yazılamadı: ${error.message}`);
        }
        return json({
          ok: true,
          verified: true,
          source: data,
          feed: {
            title: feed.title,
            item_count: feed.items.length,
            duration_ms: feed.durationMs,
            sample: feed.items.slice(0, 3).map((item) => item.title)
          }
        });
      } catch (error) {
        const message = error instanceof FeedError ? error.message : error.message;
        await supabase
          .from("sources")
          .update({
            is_verified: false,
            last_error: message,
            error_count: (source.error_count || 0) + 1,
            last_checked_at: checkedAt
          })
          .eq("id", source.id);
        return json(
          {
            ok: false,
            verified: false,
            error: { code: "verification_failed", message: `RSS doğrulanamadı: ${message}` },
            source_id: source.id
          },
          422
        );
      }
    }

    if (action === "delete") {
      if (!body.id) {
        throw new HttpError(400, "id_required", "Kaynak kimliği zorunludur.");
      }
      const { error } = await supabase.from("sources").delete().eq("id", body.id);
      if (error) {
        throw new Error(`Kaynak silinemedi: ${error.message}`);
      }
      return json({ ok: true, deleted: body.id });
    }

    throw new HttpError(400, "unknown_action", "Geçersiz işlem. create, update, verify veya delete kullanın.");
  } catch (error) {
    return handleError(error, "admin-sources");
  }
}
