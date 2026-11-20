/* ==========================================================================
   settings.mjs — Robot durumu ve zamanlama
   --------------------------------------------------------------------------
   Netlify cron ifadesi sabittir (15 dakika). Tarama aralığı veritabanındaki
   `interval_minutes` değeriyle kontrol edilir; böylece panelden 5-240 dakika
   arasında değiştirilebilir.
   ========================================================================== */

import { HttpError } from "./http.mjs";

export const DEFAULT_SETTINGS = {
  id: 1,
  robot_active: true,
  interval_minutes: 15,
  last_run_at: null,
  last_run_status: null,
  last_run_summary: null,
  collection_lock_until: null,
  auto_publish: false
};

export async function getSettings(supabase) {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`Robot ayarları okunamadı: ${error.message}`);
  }
  if (data) {
    return data;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("system_settings")
    .insert({ id: 1 })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(`Robot ayarları oluşturulamadı: ${insertError.message}`);
  }
  return inserted;
}

export async function updateSettings(supabase, patch) {
  const allowed = {};
  if (typeof patch.robot_active === "boolean") {
    allowed.robot_active = patch.robot_active;
  }
  if (typeof patch.auto_publish === "boolean") {
    allowed.auto_publish = patch.auto_publish;
  }
  if (patch.interval_minutes !== undefined) {
    const interval = Number.parseInt(patch.interval_minutes, 10);
    if (!Number.isFinite(interval) || interval < 5 || interval > 240) {
      throw new HttpError(400, "invalid_interval", "Tarama aralığı 5 ile 240 dakika arasında olmalıdır.");
    }
    allowed.interval_minutes = interval;
  }

  if (!Object.keys(allowed).length) {
    throw new HttpError(400, "no_changes", "Güncellenecek bir ayar gönderilmedi.");
  }

  const { data, error } = await supabase
    .from("system_settings")
    .update(allowed)
    .eq("id", 1)
    .select("*")
    .single();

  if (error) {
    if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code)) {
      throw new HttpError(
        503,
        "schema_missing",
        "system_settings.auto_publish sütunu yok. supabase/migrations/20261120120000_phase3_publish.sql dosyasını Supabase SQL Editor'de çalıştırın."
      );
    }
    throw new Error(`Ayarlar güncellenemedi: ${error.message}`);
  }
  return data;
}

/**
 * Aynı anda iki taramanın çalışmasını engeller.
 * PostgREST üzerinde koşullu güncelleme: kilit boş veya süresi geçmişse alınır.
 */
export async function acquireCollectionLock(supabase, lockMs = 120_000) {
  const nowIso = new Date().toISOString();
  const lockUntil = new Date(Date.now() + lockMs).toISOString();

  const { data, error } = await supabase
    .from("system_settings")
    .update({ collection_lock_until: lockUntil })
    .eq("id", 1)
    .or(`collection_lock_until.is.null,collection_lock_until.lt.${nowIso}`)
    .select("id");

  if (error) {
    throw new Error(`Tarama kilidi alınamadı: ${error.message}`);
  }
  return Array.isArray(data) && data.length > 0;
}

export async function releaseCollectionLock(supabase) {
  const { error } = await supabase
    .from("system_settings")
    .update({ collection_lock_until: null })
    .eq("id", 1);
  if (error) {
    console.error("Tarama kilidi bırakılamadı:", error.message);
  }
}

export async function recordRun(supabase, summary) {
  const { error } = await supabase
    .from("system_settings")
    .update({
      last_run_at: new Date().toISOString(),
      last_run_status: summary.ok ? "success" : "error",
      last_run_summary: summary
    })
    .eq("id", 1);
  if (error) {
    console.error("Son çalışma bilgisi yazılamadı:", error.message);
  }
}

export function computeNextRun(lastRunAt, intervalMinutes) {
  if (!lastRunAt) {
    return new Date().toISOString();
  }
  const time = new Date(lastRunAt).getTime();
  if (Number.isNaN(time)) {
    return new Date().toISOString();
  }
  const interval = Math.max(5, Number(intervalMinutes) || 15);
  return new Date(time + interval * 60 * 1000).toISOString();
}

export function isRunDue(settings, now = Date.now()) {
  if (!settings || !settings.robot_active) {
    return false;
  }
  if (!settings.last_run_at) {
    return true;
  }
  const last = new Date(settings.last_run_at).getTime();
  if (Number.isNaN(last)) {
    return true;
  }
  const interval = Math.max(5, Number(settings.interval_minutes) || 15);
  return now - last >= interval * 60 * 1000;
}
