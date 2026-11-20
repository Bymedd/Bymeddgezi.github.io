/* ==========================================================================
   auth.mjs — Yönetici kimlik doğrulaması
   --------------------------------------------------------------------------
   Ek bir kimlik servisi gerektirmeyen, sunucu tarafı HMAC imzalı oturum:
   - ADMIN_PASSWORD ile parola kontrolü (zamanlama saldırısına dayanıklı)
   - ADMIN_SESSION_SECRET ile imzalanmış, HttpOnly + SameSite=Strict çerez
   - Oturum süresi: 8 saat
   Bu çözüm Netlify Functions'ta durumsuz çalışır; gizli anahtar yalnızca
   sunucudadır.
   ========================================================================== */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ConfigurationError } from "./supabase.mjs";
import { getRuntimeConfig, missingAdminEnv } from "./env.mjs";
import { HttpError } from "./http.mjs";

export const SESSION_COOKIE = "np_admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sha256(value) {
  return createHash("sha256").update(String(value), "utf8").digest();
}

export function timingSafeEqualStrings(a, b) {
  return timingSafeEqual(sha256(a), sha256(b));
}

export function passwordMatches(input, expected) {
  if (!expected) {
    return false;
  }
  return timingSafeEqualStrings(String(input || ""), expected);
}

function signPayload(payloadPart, secret) {
  return createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

export function createSessionToken(secret, { ttlSeconds = SESSION_TTL_SECONDS, now = Date.now() } = {}) {
  if (!secret || secret.length < 16) {
    throw new ConfigurationError(
      "ADMIN_SESSION_SECRET eksik veya çok kısa. En az 32 karakterlik rastgele bir değer kullanın.",
      ["ADMIN_SESSION_SECRET"]
    );
  }
  const issuedAt = Math.floor(now / 1000);
  const payload = {
    sub: "admin",
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    jti: randomBytes(8).toString("hex")
  };
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadPart, secret);
  return `v1.${payloadPart}.${signature}`;
}

export function verifySessionToken(token, secret, { now = Date.now() } = {}) {
  if (!token || !secret) {
    return { valid: false, reason: "missing" };
  }
  const parts = String(token).split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return { valid: false, reason: "malformed" };
  }
  const [, payloadPart, signature] = parts;
  const expected = signPayload(payloadPart, secret);
  const givenBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (givenBuffer.length !== expectedBuffer.length || !timingSafeEqual(givenBuffer, expectedBuffer)) {
    return { valid: false, reason: "bad_signature" };
  }
  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart));
  } catch {
    return { valid: false, reason: "bad_payload" };
  }
  if (!payload || payload.sub !== "admin") {
    return { valid: false, reason: "bad_subject" };
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= now) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true, payload };
}

export function parseCookies(headerValue) {
  const cookies = {};
  if (!headerValue) {
    return cookies;
  }
  String(headerValue)
    .split(";")
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index === -1) {
        return;
      }
      const name = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      if (name) {
        try {
          cookies[name] = decodeURIComponent(value);
        } catch {
          cookies[name] = value;
        }
      }
    });
  return cookies;
}

export function sessionTokenFromRequest(req) {
  return parseCookies(req.headers.get("cookie"))[SESSION_COOKIE] || "";
}

/**
 * Yönetici oturumu ister. Eksik yapılandırmada 503, geçersiz oturumda 401.
 */
export function requireAdmin(req) {
  const config = getRuntimeConfig();
  if (!config.sessionSecret) {
    throw new ConfigurationError(
      "Yönetim paneli yapılandırılmamış: ADMIN_PASSWORD ve ADMIN_SESSION_SECRET ortam değişkenlerini tanımlayın.",
      missingAdminEnv()
    );
  }
  const token = sessionTokenFromRequest(req);
  const result = verifySessionToken(token, config.sessionSecret);
  if (!result.valid) {
    throw new HttpError(401, "unauthorized", "Yönetici oturumu gerekli.", {
      reason: result.reason,
      login: "/admin/"
    });
  }
  return result.payload;
}

export function isAdminRequest(req) {
  try {
    requireAdmin(req);
    return true;
  } catch {
    return false;
  }
}

export function buildSessionCookie(token, { secure = false, maxAge = SESSION_TTL_SECONDS } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAge}`
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildClearSessionCookie({ secure = false } = {}) {
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function isSecureRequest(req) {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0].trim() === "https";
  }
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return false;
  }
}
