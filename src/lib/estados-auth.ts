import type { NextRequest } from "next/server";
import { getSessionUser } from "./auth";
import { getEstadosApiToken } from "./db";

/**
 * Acepta Bearer token (para n8n) o session cookie (para UI).
 * Retorna true si la request está autorizada.
 */
export function validateEstadosAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const provided = auth.slice(7).trim();
    const stored = getEstadosApiToken();
    return stored.length > 0 && provided === stored;
  }
  const sessionToken = req.cookies.get("dtar_session")?.value;
  if (sessionToken) {
    return getSessionUser(sessionToken) !== null;
  }
  return false;
}
