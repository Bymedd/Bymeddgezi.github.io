/* ==========================================================================
   scheduled-collector — Netlify Scheduled Function
   --------------------------------------------------------------------------
   Cron: her 15 dakikada bir (UTC). Netlify cron ifadesi sabittir; gerçek
   tarama aralığı `system_settings.interval_minutes` değerine göre kontrol
   edilir. Robot duraklatılmışsa veya henüz zamanı gelmediyse hiçbir istek
   yapılmaz.
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { getSettings, computeNextRun, isRunDue } from "./_lib/settings.mjs";
import { runCollection } from "./_lib/collector.mjs";
import { ConfigurationError } from "./_lib/supabase.mjs";
import { json } from "./_lib/http.mjs";

export const config = { schedule: "*/15 * * * *" };

export default async function handler() {
  const startedAt = Date.now();
  try {
    const supabase = getSupabase();
    const settings = await getSettings(supabase);

    if (!settings.robot_active) {
      return json({ ok: true, skipped: true, reason: "robot_paused" });
    }
    if (!isRunDue(settings, startedAt)) {
      return json({
        ok: true,
        skipped: true,
        reason: "not_due",
        next_run_at: computeNextRun(settings.last_run_at, settings.interval_minutes)
      });
    }

    const summary = await runCollection({ supabase, mode: "scheduled" });
    return json({ ok: true, summary });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error("Zamanlanmış toplama yapılandırma eksik:", error.missing);
      return json(
        {
          ok: false,
          error: { code: "configuration_required", message: error.message, missing: error.missing }
        },
        503
      );
    }
    console.error("Zamanlanmış toplama hatası:", error);
    return json(
      { ok: false, error: { code: "scheduled_collection_failed", message: error.message } },
      500
    );
  }
}
