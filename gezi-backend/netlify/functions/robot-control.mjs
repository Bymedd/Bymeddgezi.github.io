/* ==========================================================================
   robot-control — GET/POST /api/admin/robot
   --------------------------------------------------------------------------
   POST actions: pause | resume | set_interval | clear_lock
   Değişiklikler system_settings tablosuna yazılır; zamanlanmış fonksiyon
   bu değerleri okuyarak çalışır.
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { requireAdmin } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, HttpError, json, readJson, requireMethod } from "./_lib/http.mjs";
import { computeNextRun, getSettings, updateSettings } from "./_lib/settings.mjs";

export const config = { path: "/api/admin/robot" };

function stateResponse(settings) {
  return {
    ok: true,
    robot: {
      active: Boolean(settings.robot_active),
      interval_minutes: settings.interval_minutes,
      last_run_at: settings.last_run_at,
      last_run_status: settings.last_run_status,
      next_run_at: settings.robot_active
        ? computeNextRun(settings.last_run_at, settings.interval_minutes)
        : null,
      lock_until: settings.collection_lock_until
    }
  };
}

export default async function handler(req) {
  try {
    const method = req.method.toUpperCase();
    requireAdmin(req);

    if (method === "GET") {
      const supabase = getSupabase();
      return json(stateResponse(await getSettings(supabase)));
    }

    requireMethod(req, "POST");
    assertSameOrigin(req);

    const body = await readJson(req, 10_000);
    const action = String(body.action || "");
    const supabase = getSupabase();

    if (action === "pause" || action === "resume") {
      const settings = await updateSettings(supabase, { robot_active: action === "resume" });
      return json(stateResponse(settings));
    }

    if (action === "set_interval") {
      const settings = await updateSettings(supabase, { interval_minutes: body.interval_minutes });
      return json(stateResponse(settings));
    }

    if (action === "clear_lock") {
      const { error } = await supabase
        .from("system_settings")
        .update({ collection_lock_until: null })
        .eq("id", 1);
      if (error) {
        throw new Error(`Kilit temizlenemedi: ${error.message}`);
      }
      return json(stateResponse(await getSettings(supabase)));
    }

    throw new HttpError(400, "unknown_action", "Geçersiz işlem. pause, resume, set_interval veya clear_lock kullanın.");
  } catch (error) {
    return handleError(error, "robot-control");
  }
}
