/* ==========================================================================
   collect-news — POST /api/admin/collect
   --------------------------------------------------------------------------
   Yönetim panelindeki "Şimdi tara" butonunu gerçek taramaya bağlar.
   Tarama bütçesi Netlify fonksiyon zaman aşımına göre sınırlandırılır.
   ========================================================================== */

import { getSupabase } from "./_lib/supabase.mjs";
import { requireAdmin } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, json, readJson, requireMethod, HttpError } from "./_lib/http.mjs";
import { runCollection } from "./_lib/collector.mjs";

export const config = { path: "/api/admin/collect" };

export default async function handler(req) {
  try {
    requireMethod(req, "POST");
    assertSameOrigin(req);
    requireAdmin(req);

    const body = await readJson(req, 10_000);
    if (body.source_id && !/^[0-9a-f-]{36}$/i.test(body.source_id)) {
      throw new HttpError(400, "invalid_source_id", "Kaynak kimliği geçersiz.");
    }

    const supabase = getSupabase();
    const summary = await runCollection({
      supabase,
      mode: "manual",
      sourceIds: body.source_id ? [body.source_id] : []
    });

    return json({ ok: true, summary });
  } catch (error) {
    return handleError(error, "collect-news");
  }
}
