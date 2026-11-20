/* ==========================================================================
   env.mjs — Ortam değişkenleri ve çalışma ayarları
   --------------------------------------------------------------------------
   Hiçbir gizli değer koda yazılmaz. Eksik yapılandırma, sahte başarı yerine
   açık bir "configuration_required" hatasına dönüşür.
   ========================================================================== */

const DEFAULTS = {
  intervalMinutes: 15,
  fetchTimeoutMs: 8000,
  maxSourcesPerRun: 6,
  maxItemsPerSource: 25,
  collectionBudgetMs: 8000,
  categoryConfidenceThreshold: 0.5,
  readyScoreThreshold: 55,
  userAgent:
    "HaberPortaliBot/2.0 (+https://haber-portali-demo.netlify.app; iletisim@haber-portali-demo.com)"
};

function clean(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function toInt(value, fallback, min, max) {
  const parsed = Number.parseInt(clean(value), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function toFloat(value, fallback, min, max) {
  const parsed = Number.parseFloat(clean(value));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

export function envValue(name) {
  return clean(process.env[name]);
}

export function getRuntimeConfig() {
  return {
    supabaseUrl: envValue("SUPABASE_URL"),
    supabaseServiceKey: envValue("SUPABASE_SERVICE_ROLE_KEY"),
    adminPassword: envValue("ADMIN_PASSWORD"),
    sessionSecret: envValue("ADMIN_SESSION_SECRET"),
    userAgent: envValue("COLLECTOR_USER_AGENT") || DEFAULTS.userAgent,
    intervalMinutes: toInt(
      process.env.COLLECT_INTERVAL_MINUTES,
      DEFAULTS.intervalMinutes,
      5,
      240
    ),
    fetchTimeoutMs: toInt(process.env.FETCH_TIMEOUT_MS, DEFAULTS.fetchTimeoutMs, 1000, 30000),
    maxSourcesPerRun: toInt(
      process.env.MAX_SOURCES_PER_RUN,
      DEFAULTS.maxSourcesPerRun,
      1,
      20
    ),
    maxItemsPerSource: toInt(
      process.env.MAX_ITEMS_PER_SOURCE,
      DEFAULTS.maxItemsPerSource,
      1,
      100
    ),
    collectionBudgetMs: toInt(
      process.env.COLLECTION_BUDGET_MS,
      DEFAULTS.collectionBudgetMs,
      2000,
      60000
    ),
    categoryConfidenceThreshold: toFloat(
      process.env.CATEGORY_CONFIDENCE_THRESHOLD,
      DEFAULTS.categoryConfidenceThreshold,
      0,
      1
    ),
    readyScoreThreshold: toInt(
      process.env.READY_SCORE_THRESHOLD,
      DEFAULTS.readyScoreThreshold,
      0,
      100
    )
  };
}

export function missingSupabaseEnv() {
  const config = getRuntimeConfig();
  return [
    ["SUPABASE_URL", config.supabaseUrl],
    ["SUPABASE_SERVICE_ROLE_KEY", config.supabaseServiceKey]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

export function missingAdminEnv() {
  const config = getRuntimeConfig();
  return [
    ["ADMIN_PASSWORD", config.adminPassword],
    ["ADMIN_SESSION_SECRET", config.sessionSecret]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

export function isSupabaseConfigured() {
  return missingSupabaseEnv().length === 0;
}

export function isAdminConfigured() {
  return missingAdminEnv().length === 0;
}
