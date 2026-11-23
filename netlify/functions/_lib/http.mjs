/* ==========================================================================
   http.mjs — HTTP yardımcıları
   ========================================================================== */

import { ConfigurationError } from "./supabase.mjs";
import { envProbe } from "./env.mjs";

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const NO_STORE = "no-store, max-age=0";

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": NO_STORE,
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}

export function fail(status, code, message, details) {
  return json({ ok: false, error: { code, message, details: details || undefined } }, status);
}

export function requireMethod(req, methods) {
  const allowed = Array.isArray(methods) ? methods : [methods];
  const method = req.method.toUpperCase();
  if (method === "OPTIONS") {
    return new HttpError(204, "no_content", "");
  }
  if (!allowed.includes(method)) {
    throw new HttpError(405, "method_not_allowed", `${allowed.join(", ")} destekleniyor.`);
  }
  return null;
}

export async function readJson(req, maxBytes = 100_000) {
  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > maxBytes) {
    throw new HttpError(413, "payload_too_large", "İstek gövdesi çok büyük.");
  }
  const text = await req.text();
  if (text.length > maxBytes) {
    throw new HttpError(413, "payload_too_large", "İstek gövdesi çok büyük.");
  }
  if (!text.trim()) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json", "Gönderilen gövde geçerli JSON değil.");
  }
}

/**
 * Tarayıcı kaynaklı değişiklik isteklerinde Origin başlığının aynı kökene
 * ait olduğunu doğrular. Origin yoksa istek tarayıcı dışıdır; oturum
 * doğrulaması yine zorunludur.
 */
export function assertSameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) {
    return;
  }
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "invalid_origin", "Geçersiz Origin başlığı.");
  }
  const requestHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host;
  if (originHost !== requestHost) {
    throw new HttpError(403, "cross_origin_blocked", "Bu işlem yalnızca aynı kökenden çağrılabilir.");
  }
}

export function clientIp(req) {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}

export function handleError(error, context) {
  if (error instanceof HttpError) {
    if (error.status === 204) {
      return new Response(null, { status: 204 });
    }
    return fail(error.status, error.code, error.message, error.details);
  }
  if (error instanceof ConfigurationError) {
    console.error(`[${context}] yapılandırma eksik:`, error.missing);
    return fail(
      503,
      "configuration_required",
      error.message,
      {
        missing: error.missing,
        found: envProbe(),
        hint: "README → 12. bölümdeki kurulum adımlarını izleyin."
      }
    );
  }
  console.error(`[${context}] beklenmeyen hata:`, error);
  return fail(500, "internal_error", "Beklenmeyen bir sunucu hatası oluştu. Günlükleri kontrol edin.");
}

/** Basit bellek içi hız sınırı (tek fonksiyon örneği için). */
const buckets = new Map();

export function rateLimit(key, { limit = 10, windowMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, remaining: limit - bucket.count };
}
