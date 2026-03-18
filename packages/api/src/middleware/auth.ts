import type { Context, Next } from "hono";
import type { AuthEnv } from "../types";
import { auth } from "../auth";

/**
 * Session middleware — sets user and session on every request.
 */
export async function sessionMiddleware(c: Context<AuthEnv>, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  c.set("user", session.user);
  c.set("session", session.session);
  return next();
}
