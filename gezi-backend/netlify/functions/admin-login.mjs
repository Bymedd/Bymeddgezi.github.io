/* ==========================================================================
   admin-login — POST /api/admin/login
   ========================================================================== */

import { getRuntimeConfig, missingAdminEnv } from "./_lib/env.mjs";
import { ConfigurationError } from "./_lib/supabase.mjs";
import {
  buildSessionCookie,
  createSessionToken,
  isSecureRequest,
  passwordMatches,
  SESSION_TTL_SECONDS
} from "./_lib/auth.mjs";
import {
  assertSameOrigin,
  clientIp,
  handleError,
  HttpError,
  json,
  rateLimit,
  readJson,
  requireMethod
} from "./_lib/http.mjs";

export const config = { path: "/api/admin/login" };

export default async function handler(req) {
  try {
    requireMethod(req, "POST");
    assertSameOrigin(req);

    const runtime = getRuntimeConfig();
    if (!runtime.adminPassword || !runtime.sessionSecret) {
      throw new ConfigurationError(
        "Yönetim paneli yapılandırılmamış: ADMIN_PASSWORD ve ADMIN_SESSION_SECRET ortam değişkenlerini tanımlayın.",
        missingAdminEnv()
      );
    }

    const limit = rateLimit(`login:${clientIp(req)}`, { limit: 8, windowMs: 10 * 60 * 1000 });
    if (!limit.allowed) {
      throw new HttpError(429, "too_many_attempts", "Çok fazla giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.");
    }

    const body = await readJson(req, 10_000);
    if (typeof body.password !== "string" || !body.password) {
      throw new HttpError(400, "password_required", "Parola alanı zorunludur.");
    }
    if (!passwordMatches(body.password, runtime.adminPassword)) {
      throw new HttpError(401, "invalid_credentials", "Parola hatalı.");
    }

    const token = createSessionToken(runtime.sessionSecret);
    return json(
      { ok: true, expires_in: SESSION_TTL_SECONDS },
      200,
      { "set-cookie": buildSessionCookie(token, { secure: isSecureRequest(req) }) }
    );
  } catch (error) {
    return handleError(error, "admin-login");
  }
}
