/* ==========================================================================
   admin-logout — POST /api/admin/logout
   ========================================================================== */

import { buildClearSessionCookie, isSecureRequest } from "./_lib/auth.mjs";
import { assertSameOrigin, handleError, json, requireMethod } from "./_lib/http.mjs";

export const config = { path: "/api/admin/logout" };

export default async function handler(req) {
  try {
    requireMethod(req, "POST");
    assertSameOrigin(req);
    return json(
      { ok: true },
      200,
      { "set-cookie": buildClearSessionCookie({ secure: isSecureRequest(req) }) }
    );
  } catch (error) {
    return handleError(error, "admin-logout");
  }
}
