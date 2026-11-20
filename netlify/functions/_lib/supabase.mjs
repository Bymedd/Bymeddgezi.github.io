/* ==========================================================================
   supabase.mjs — Sunucu tarafı Supabase istemcisi
   --------------------------------------------------------------------------
   Bu istemci yalnızca Netlify Functions içinde oluşturulur ve service_role
   anahtarıyla çalışır. Anahtar hiçbir zaman tarayıcıya gönderilmez.
   ========================================================================== */

import { createClient } from "@supabase/supabase-js";
import { getRuntimeConfig, missingSupabaseEnv } from "./env.mjs";

let cachedClient = null;
let cachedSignature = "";

export class ConfigurationError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = "ConfigurationError";
    this.code = "configuration_required";
    this.missing = missing;
  }
}

export function getSupabase() {
  const { supabaseUrl, supabaseServiceKey } = getRuntimeConfig();

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new ConfigurationError(
      "Supabase yapılandırması eksik. Netlify ortam değişkenlerine SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ekleyin.",
      missingSupabaseEnv()
    );
  }

  const signature = `${supabaseUrl}::${supabaseServiceKey.slice(-8)}`;
  if (cachedClient && cachedSignature === signature) {
    return cachedClient;
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        "x-application-name": "haber-portali-collector"
      }
    }
  });
  cachedSignature = signature;
  return cachedClient;
}

/** Bağlantıyı ve tabloların varlığını doğrular. Test/teşhis için. */
export async function checkSupabaseHealth() {
  const supabase = getSupabase();
  const checks = {};
  for (const table of ["sources", "raw_articles", "article_sources", "collection_logs", "system_settings", "published_articles"]) {
    const { error, count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    checks[table] = error
      ? { ok: false, error: error.message, hint: error.hint || null }
      : { ok: true, rows: count ?? null };
  }
  return checks;
}
